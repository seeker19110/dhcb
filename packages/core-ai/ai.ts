// api/ai.ts — chạy qua server.ts (Express) khi deploy VPS — proxy gọi AI (Anthropic chính,
// Groq/Gemini dự phòng).
// Giữ API key ở phía server (biến môi trường ANTHROPIC_API_KEY, KHÔNG có tiền tố VITE_
// nên sẽ không bị đóng gói vào file JS gửi cho browser).
//
// Frontend (src/lib/ai.ts) chỉ gọi POST /api/agent với { system, messages, max_tokens }
// — không hề biết và không cần gửi API key.
//
// BẢO MẬT: Server tự quyết định model và giới hạn max_tokens,
// không tin giá trị client gửi lên (tránh bị gọi model đắt / token lớn). Client chỉ được xin
// NHIỆM VỤ (`task`: 'converse' | 'grade') trong danh sách cho phép — model của từng nhiệm vụ
// tra ở aiConfig.ts#getAnthropicRoute.

import { z } from 'zod'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateContentType,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { type UsageMode } from '@dhcb/core-billing/usage'
import { resolveActor } from '@dhcb/core-auth/guest'
import { checkAndConsumeActorUsage, refundActorUsage } from '@dhcb/core-auth/actorUsage'
import { callGemini } from './geminiApi.js'
import { recordAiTokenUsage, type AiTokenUsage } from './aiTokenUsage.js'
import { callGroqChatWithKeyPool } from './chatProviders.js'
import { callAnthropicText, type AnthropicTextResult } from './anthropicClient.js'
import { hasGroqKey } from './groqKeyPool.js'
import { withConcurrencyLimit } from '@dhcb/core-db/concurrencyLimiter'
import { createRequestLogger } from '@dhcb/core-db/logger'
import { createRequestId } from '@dhcb/core-db/requestId'
import { incrementCounter, recordLatency } from '@dhcb/core-db/metrics'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
import { validateBody } from '@dhcb/core-http/validation'
// Model + guardrail tách sang aiConfig.ts để script eval offline (scripts/eval-tutor.ts)
// dùng chung đúng một nguồn — đổi model ở đây tự động phản ánh vào bài đánh giá (⑤ T1).
import {
  GEMINI_CHAT_MODEL,
  GROQ_CHAT_MODEL,
  SYSTEM_GUARDRAIL,
  getAnthropicRoute,
  isClientAiTask,
} from './aiConfig.js'

// Thời gian chờ tối đa cho 1 lần gọi AI (ms) — tránh treo vô hạn khi nhà cung cấp chậm.
const AI_TIMEOUT_MS = 30_000

// Trần max_tokens cho Groq/Gemini (dự phòng). Nhánh Anthropic dùng trần RIÊNG theo nhiệm vụ
// (aiConfig.ts) vì phần "suy nghĩ" của Claude đời mới cũng tính vào max_tokens.
const MAX_TOKENS_LIMIT = 2048 // tối đa cho phép (writing cần 2048, chat 1024)
const MAX_BODY_BYTES = 64 * 1024 // 64KB — đủ cho 1 cuộc hội thoại dài
const MAX_MSG_CONTENT = 2000 // mỗi tin nhắn không quá 2000 ký tự
const MAX_TOTAL_CONTENT = 40000 // tổng nội dung messages không quá 40000 ký tự

// Xử lý 1 tin nhắn — object có field `content` thì cắt bớt content (nếu là string) + giữ
// nguyên role; còn lại (không phải object / không có content) thì giữ nguyên KHÔNG đổi. Handler
// này CỐ TÌNH lenient (không từ chối input lạ, chỉ coi như rỗng/cắt bớt) — Zod ở đây định hình
// lại logic cũ, KHÔNG siết chặt thêm.
function sanitizeMessage(msg: unknown): unknown {
  if (typeof msg === 'object' && msg !== null && 'content' in msg) {
    const m = msg as { role?: unknown; content?: unknown }
    return {
      role: m.role,
      content:
        typeof m.content === 'string' ? m.content.trim().slice(0, MAX_MSG_CONTENT) : m.content,
    }
  }
  return msg
}

function sumStringContent(messages: unknown[]): number {
  return messages.reduce((sum: number, msg: unknown) => {
    const m = msg as { content?: unknown }
    return sum + (typeof m?.content === 'string' ? m.content.length : 0)
  }, 0)
}

// Mode HỢP LỆ cho /api/agent — CHỈ 3 giá trị này (khớp CallMode ở src/lib/ai.ts). Cố ý
// KHÔNG dùng isUsageMode() chung của usage.ts (nay còn có 'stt'/'pronounce' — các mode đó đếm
// vào /api/stt và /api/pronounce-assess riêng): dùng chung sẽ cho phép client gửi
// mode:'stt'/'pronounce' để /api/agent ÂM THẦM trừ nhầm sang cột đếm khác, né giới hạn chat.
const CHAT_ENDPOINT_MODES = new Set<UsageMode>(['chat', 'writing', 'speaking'])
function isChatEndpointMode(v: unknown): v is 'chat' | 'writing' | 'speaking' {
  return typeof v === 'string' && CHAT_ENDPOINT_MODES.has(v as UsageMode)
}

// Schema validate body /api/agent — xem api/ai.ts đầu file: server tự quyết định model/giới
// hạn, KHÔNG tin giá trị client gửi lên. `.catch()` tái tạo đúng hành vi lenient cũ (input sai
// kiểu → coi như rỗng/mặc định, KHÔNG từ chối) — duy nhất `.refine()` cuối vẫn từ chối (413) khi
// tổng nội dung quá lớn, giống hệt logic cũ.
const AiBodySchema = z
  .object({
    // Client gửi nhưng server KHÔNG dùng — model do server quyết định theo nhiệm vụ
    // (aiConfig.ts#getAnthropicRoute).
    model: z.string().optional(),
    messages: z
      .array(z.unknown())
      .catch([])
      .transform((arr) => arr.slice(-30).map(sanitizeMessage)),
    max_tokens: z
      .number()
      .catch(1024)
      .transform((v) => Math.min(v, MAX_TOKENS_LIMIT)),
    system: z
      .string()
      .catch('')
      .transform((v) => v.slice(0, 8000)),
    // `.optional()` BẮT BUỘC với Zod 4: thiếu hẳn khoá thì z.unknown() không optional nữa khi đã
    // .transform() → 400 "expected nonoptional" (body thiếu `mode`/`task` bị từ chối oan).
    mode: z
      .unknown()
      .optional()
      .transform((v) => (isChatEndpointMode(v) ? v : 'chat')),
    // Nhiệm vụ để server chọn model Claude. Giá trị lạ/thiếu → null, suy ra từ mode bên dưới.
    task: z
      .unknown()
      .optional()
      .transform((v) => (isClientAiTask(v) ? v : null)),
  })
  .refine((d) => sumStringContent(d.messages) <= MAX_TOTAL_CONTENT, {
    error: 'Nội dung hội thoại quá dài',
    params: { status: 413 },
  })

// Client cũ (chưa gửi `task`): chế độ Luyện viết toàn là chấm bài → 'grade'; còn lại trò chuyện.
function resolveTask(task: 'converse' | 'grade' | null, mode: UsageMode): 'converse' | 'grade' {
  if (task) return task
  return mode === 'writing' ? 'grade' : 'converse'
}

// Thông điệp trả client khi Claude hỏng và KHÔNG còn provider dự phòng — song ngữ, có hành động
// rõ ràng (frontend hiện nguyên văn message server trả).
const MSG_AI_REFUSED =
  'AI không thể trả lời nội dung này. Hãy diễn đạt lại rồi thử lại. / The AI could not answer this — please rephrase and try again.'
const MSG_AI_BUSY =
  'AI đang bận hoặc gặp lỗi tạm thời, vui lòng thử lại sau ít phút. / The AI is busy — please try again in a few minutes.'

function anthropicFailureStatus(r: Exclude<AnthropicTextResult, { kind: 'success' }>): number {
  if (r.kind === 'network_error') return 504
  if (r.kind === 'unusable' && r.reason === 'refusal') return 422
  return 502
}

function describeAnthropicFailure(r: Exclude<AnthropicTextResult, { kind: 'success' }>): string {
  if (r.kind === 'network_error') return `lỗi mạng/timeout: ${r.message}`
  if (r.kind === 'api_error') return `HTTP ${r.status}: ${r.message.slice(0, 200)}`
  return `không dùng được (${r.reason}: ${r.detail})`
}

export default async function handler(req: Request): Promise<Response> {
  // requestId riêng cho MỖI lượt gọi — ghép vào mọi dòng log của lượt này (Phase 01 mục 6,
  // docs/phases/01-foundation-os.md) để lọc đúng 1 request giữa hàng nghìn dòng log khác chạy
  // song song trên VPS. Chỉ ảnh hưởng NỘI DUNG LOG, không đổi response trả cho client.
  const requestId = createRequestId()
  const log = createRequestLogger('agent', requestId)

  const corsHeaders = getCorsHeaders(req)
  const allHeaders = { ...corsHeaders, ...SECURITY_HEADERS }

  // Xử lý preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: allHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: { message: 'Method not allowed' } }, 405, allHeaders)
  }

  // Lấy IP để rate limit
  const clientIp = getClientIp(req)

  // Kiểm tra Content-Type phải là application/json
  if (!validateContentType(req)) {
    logSecurityEvent('INVALID_CONTENT_TYPE', clientIp, { path: '/api/agent' })
    return jsonResponse(
      { error: { message: 'Content-Type phải là application/json' } },
      415,
      allHeaders,
    )
  }

  // Rate limit: tối đa 5 request/phút mỗi IP
  if (!(await checkRateLimit(clientIp, 5))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/agent' })
    return jsonResponse(
      { error: { message: 'Quá nhiều yêu cầu — thử lại sau 1 phút' } },
      429,
      allHeaders,
    )
  }

  // Ai đang gọi: tài khoản thật (cookie phiên) hoặc KHÁCH VÃNG LAI (header X-Guest-Id, dùng
  // thử giới hạn — xem docs/specs/2026-09-15-mo-xem-web-khong-can-dang-nhap.md). Không xác định
  // được cả hai → 401 y như trước.
  const actor = await resolveActor(req)
  if (!actor) {
    logSecurityEvent('AUTH_FAILED', clientIp, { path: '/api/agent' })
    return jsonResponse(
      { error: { message: 'Chưa đăng nhập hoặc phiên hết hạn' } },
      401,
      allHeaders,
    )
  }

  // Chọn nhà cung cấp AI: Anthropic → Groq → Gemini (2026-10-09, chủ dự án chốt: Claude là AI
  // chính, chọn model theo nhiệm vụ; Groq miễn phí + Gemini làm dự phòng khi Claude lỗi).
  // Cần ít nhất một trong ba key.
  const geminiKey = process.env.GEMINI_API_KEY
  const groqKey = hasGroqKey()
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (!geminiKey && !groqKey && !anthropicKey) {
    return jsonResponse(
      {
        error: {
          message: 'Server chưa cấu hình GEMINI_API_KEY, GROQ_API_KEY hoặc ANTHROPIC_API_KEY',
        },
      },
      500,
      allHeaders,
    )
  }

  // Giới hạn kích thước request — tránh gửi nội dung khổng lồ
  const rawText = await req.text()
  if (rawText.length > MAX_BODY_BYTES) {
    return jsonResponse({ error: { message: 'Request quá lớn' } }, 413, allHeaders)
  }

  // Parse và kiểm tra body
  let rawBody: unknown
  try {
    rawBody = JSON.parse(rawText)
  } catch {
    return jsonResponse({ error: { message: 'Body không hợp lệ (cần JSON)' } }, 400, allHeaders)
  }

  // Validate + sanitize (Zod) — schema tái tạo đúng logic lenient cũ (cắt bớt tin nhắn/nội
  // dung, mặc định max_tokens/system, coi messages sai kiểu là rỗng), chỉ từ chối (413) khi
  // tổng nội dung quá lớn. Không dùng readJsonBody (api/_lib/validation.ts) vì body Request đã
  // đọc qua req.text() ở trên để kiểm tra MAX_BODY_BYTES — stream chỉ đọc được 1 lần.
  const parsedBody = validateBody(AiBodySchema, rawBody)
  if (!parsedBody.ok) {
    return jsonResponse(
      { error: { message: parsedBody.error.message } },
      parsedBody.error.status,
      allHeaders,
    )
  }
  const sanitizedMessages = parsedBody.data.messages
  const maxTokens = parsedBody.data.max_tokens
  // Prompt nền của client (đã cắt độ dài trong schema) + guardrail cố định phía server prepend vào đầu.
  const system = SYSTEM_GUARDRAIL + parsedBody.data.system

  // ── Giới hạn lượt dùng ở SERVER (theo gói Free/Pro) ──────────────────────────
  // mode do client gửi: 'chat' | 'writing' | 'speaking' (mặc định 'chat').
  // Server đếm authoritative trong daily_usage → client không tự vượt giới hạn được.
  const mode = parsedBody.data.mode
  const task = resolveTask(parsedBody.data.task, mode)
  const gate = await checkAndConsumeActorUsage(actor, mode, clientIp)
  if (!gate.ok) {
    logSecurityEvent('USAGE_LIMIT', clientIp, { path: '/api/agent', mode })
    // `guestTrialExhausted` để giao diện hiện lời mời ĐĂNG KÝ (khách) thay vì lời nhắn
    // "mai quay lại" / mời nâng cấp gói (người đã đăng nhập) — hai tình huống khác hẳn nhau.
    return jsonResponse(
      { error: { message: gate.message }, guestTrialExhausted: gate.guestTrialExhausted },
      429,
      allHeaders,
    )
  }

  // ── Nhánh Anthropic (AI chính — model theo nhiệm vụ, xem aiConfig.ts) ─────────
  if (anthropicKey) {
    // Còn Groq/Gemini dự phòng → lỗi thì thử tiếp. Không còn → hoàn lượt + báo lỗi rõ ràng.
    const canFallback = Boolean(groqKey || geminiKey)
    const route = getAnthropicRoute(task)

    log.debug(`gọi Anthropic bắt đầu, mode=${mode}, task=${task}, model=${route.model}`)
    const anthropicResult = await withConcurrencyLimit('anthropic', () =>
      callAnthropicText({
        apiKey: anthropicKey,
        route,
        system,
        messages: sanitizedMessages,
      }),
    )
    recordLatency('ai_anthropic_ms', anthropicResult.latencyMs)
    incrementCounter(
      anthropicResult.kind === 'api_error'
        ? `ai_anthropic_status_${anthropicResult.status}`
        : anthropicResult.kind === 'unusable'
          ? `ai_anthropic_unusable_${anthropicResult.reason}`
          : `ai_anthropic_${anthropicResult.kind}`,
    )
    // Ghi chi phí khi Anthropic ĐÃ trả lời (kể cả bị cắt/từ chối — token vẫn bị tính tiền).
    // Không await: đo đạc không được làm chậm câu trả lời.
    if (anthropicResult.kind === 'success' || anthropicResult.kind === 'unusable') {
      void recordAiTokenUsage({
        provider: 'anthropic',
        model: anthropicResult.model,
        mode,
        usage: anthropicResult.usage,
      })
    }

    if (anthropicResult.kind === 'success') {
      log.debug(`Anthropic xong sau ${anthropicResult.latencyMs}ms`)
      // Đúng format frontend (apps/dhcb/src/lib/ai.ts) đang đọc: data.content[0].text
      return jsonResponse(
        { content: [{ type: 'text', text: anthropicResult.text }] },
        200,
        allHeaders,
      )
    }

    log.warn(`Anthropic ${describeAnthropicFailure(anthropicResult)}`)
    if (!canFallback) {
      await refundActorUsage(actor, mode, gate.day, clientIp)
      const refused = anthropicResult.kind === 'unusable' && anthropicResult.reason === 'refusal'
      return jsonResponse(
        { error: { message: refused ? MSG_AI_REFUSED : MSG_AI_BUSY } },
        anthropicFailureStatus(anthropicResult),
        allHeaders,
      )
    }
    log.warn('Anthropic lỗi — chuyển sang provider dự phòng (Groq/Gemini)')
  }

  // ── Nhánh Groq (dự phòng thứ nhất — FREE, API tương thích chuẩn OpenAI) ─────
  if (groqKey) {
    // Còn Gemini dự phòng → lỗi thì thử tiếp thay vì báo lỗi ngay. Khi KHÔNG còn provider nào
    // khác, giữ NGUYÊN status/hành vi gốc.
    const canFallback = Boolean(geminiKey)

    log.debug(`gọi Groq bắt đầu, mode=${mode}`)
    const groqResult = await withConcurrencyLimit('groq', () =>
      callGroqChatWithKeyPool(GROQ_CHAT_MODEL, system, sanitizedMessages, maxTokens, AI_TIMEOUT_MS),
    )
    recordLatency('ai_groq_ms', groqResult.latencyMs)
    incrementCounter(`ai_groq_${groqResult.kind}`)
    log.debug(`Groq xong sau ${groqResult.latencyMs}ms, kind=${groqResult.kind}`)

    if (groqResult.kind === 'network_error') {
      log.warn(`Groq lỗi mạng: ${groqResult.message}`)
      if (!canFallback) {
        await refundActorUsage(actor, mode, gate.day, clientIp)
        return jsonResponse(
          { error: { message: `Groq lỗi: ${groqResult.message.slice(0, 200)}` } },
          504,
          allHeaders,
        )
      }
      log.warn('Groq lỗi — chuyển sang provider dự phòng (Gemini)')
    } else if (groqResult.kind === 'http_error') {
      if (!canFallback) {
        await refundActorUsage(actor, mode, gate.day, clientIp)
        return jsonResponse(
          {
            error: {
              message: `Groq lỗi (${groqResult.status}): ${groqResult.bodyText.slice(0, 200)}`,
            },
          },
          groqResult.status,
          allHeaders,
        )
      }
      log.warn('Groq lỗi — chuyển sang provider dự phòng (Gemini)')
    } else if (groqResult.kind === 'malformed_body') {
      // Groq trả 200 nhưng body hỏng (không phải JSON / thiếu field): người dùng KHÔNG nhận
      // được câu trả lời → phải hoàn lượt giống các nhánh lỗi khác.
      if (!canFallback) {
        await refundActorUsage(actor, mode, gate.day, clientIp)
        return jsonResponse({ error: { message: groqResult.message } }, 500, allHeaders)
      }
      log.warn(
        `Groq trả body hỏng (${groqResult.message}) — chuyển sang provider dự phòng (Gemini)`,
      )
    } else {
      // Ghi CHI PHÍ THẬT theo token (mục N4). Cố ý KHÔNG await — đo đạc không được làm chậm
      // câu trả lời, và recordAiTokenUsage() tự nuốt mọi lỗi bên trong.
      void recordAiTokenUsage({
        provider: 'groq',
        model: groqResult.model,
        mode,
        usage: groqResult.usage,
      })
      // Chuẩn hoá về đúng format Anthropic mà frontend (apps/dhcb/src/lib/ai.ts) đang đọc:
      // data.content[0].text
      return jsonResponse({ content: [{ type: 'text', text: groqResult.text }] }, 200, allHeaders)
    }
  }

  // ── Nhánh Gemini (cuối cùng — chỉ dùng khi Anthropic/Groq không có key hoặc đều lỗi)
  const geminiStartedAt = Date.now()
  log.debug(`gọi Gemini bắt đầu, mode=${mode}`)
  // callGemini() trả về text; token thật lấy qua callback onUsage (xem geminiApi.ts).
  let geminiUsage: AiTokenUsage | null = null
  try {
    const geminiText = await withConcurrencyLimit('gemini', () =>
      callGemini(
        geminiKey as string,
        GEMINI_CHAT_MODEL,
        system,
        sanitizedMessages as Array<{ role: 'user' | 'assistant'; content: string }>,
        maxTokens,
        undefined,
        (usage) => {
          geminiUsage = usage
        },
      ),
    )
    void recordAiTokenUsage({
      provider: 'gemini',
      model: GEMINI_CHAT_MODEL,
      mode,
      usage: geminiUsage,
    })
    recordLatency('ai_gemini_ms', Date.now() - geminiStartedAt)
    incrementCounter('ai_gemini_success')
    log.debug(`Gemini xong sau ${Date.now() - geminiStartedAt}ms`)
    return jsonResponse({ content: [{ type: 'text', text: geminiText }] }, 200, allHeaders)
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    // Gemini vẫn TÍNH TIỀN token khi đã trả body (vd body hợp lệ nhưng text rỗng → callGemini
    // ném lỗi). Ghi chi phí ở cả nhánh lỗi để số liệu không thiếu hụt; usage = null (lỗi mạng,
    // chưa có body) thì recordAiTokenUsage() tự bỏ qua.
    void recordAiTokenUsage({
      provider: 'gemini',
      model: GEMINI_CHAT_MODEL,
      mode,
      usage: geminiUsage,
    })
    recordLatency('ai_gemini_ms', Date.now() - geminiStartedAt)
    incrementCounter('ai_gemini_error')
    log.warn(`Gemini lỗi sau ${Date.now() - geminiStartedAt}ms: ${errMsg}`)
    await refundActorUsage(actor, mode, gate.day, clientIp)
    // Lỗi timeout (AbortController) → 504, còn lại 502 (lỗi từ nhà cung cấp), không phải 500 của ta.
    const isTimeout = /Hết thời gian chờ/.test(errMsg)
    return jsonResponse(
      { error: { message: `Gemini lỗi: ${errMsg.slice(0, 200)}` } },
      isTimeout ? 504 : 502,
      allHeaders,
    )
  }
}

// Dùng Edge Runtime — nhẹ, khởi động nhanh, đủ cho việc proxy 1 request
export const config = {
  runtime: 'edge',
}
