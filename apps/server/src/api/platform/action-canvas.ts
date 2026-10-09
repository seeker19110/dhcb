// api/action-canvas.ts — REST handler cho Không gian làm việc Tương tác Action Canvas V4.2.
// State đã chuyển sang bảng platform.feature_state (migration 0058, packages/core-db/featureState.ts)
// — thay cho Map in-memory cấp module, tránh mất dữ liệu/vỡ trong PM2 cluster.
import { z } from 'zod'
import { jsonResponse, internalErrorResponse, getClientIp } from '@dhcb/core-http/http'
import {
  validateAuth,
  getCorsHeaders,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import {
  ActionCanvasState,
  ActionCanvasStateSchema,
  ACTION_CANVAS_VERSION,
} from '@dhcb/core-contracts/actionCanvas'
import { UuidSchema } from '@dhcb/core-contracts/shared'
import { ActionCanvasService } from '@dhcb/core-personal/actionCanvasService'
import {
  buildProposalCanvas,
  GOAL_MAX,
  GOAL_MIN,
  parseGoalDecomposition,
  sanitizeGoal,
} from '@dhcb/core-personal/goalDecomposition'
import {
  buildGoalDecompositionPrompt,
  GOAL_DECOMPOSITION_COST_MODE,
} from '@dhcb/core-personal/actionCanvasPrompt'
import {
  getFeatureState,
  setFeatureState,
  tryAcquireFeatureLock,
  releaseFeatureLock,
} from '@dhcb/core-db/featureState'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'
import { generateChatText } from '@dhcb/core-ai/chatFallback'

const FEATURE = 'action_canvas'
const DEFAULT_CANVAS_ID = '11111111-1111-4111-8111-111111111111'

// Đọc canvas đã lưu và chuẩn hoá qua hợp đồng: canvas lưu trước 2026-10-02 có thể còn nút gán miền
// đã xoá (career/startup/life) — hợp đồng đổi chúng về `general` (changelog 0485). Bản lưu không
// khớp hợp đồng vì lý do khác thì trả nguyên văn như trước, không làm mất dữ liệu của người dùng.
async function readCanvas(personId: string): Promise<ActionCanvasState | null> {
  const stored = await getFeatureState<ActionCanvasState>(personId, FEATURE)
  if (!stored) return null
  const parsed = ActionCanvasStateSchema.safeParse(stored)
  return parsed.success ? parsed.data : stored
}

// ── action=synthesize: AI ĐỀ XUẤT phân rã mục tiêu (changelog 0549, đặc tả
// docs/specs/2026-10-09-action-canvas-phan-ra-muc-tieu-ai.md) ─────────────────────────────────
// Rào chắn (skill autonomous-agent-orchestrator §4):
//  - Đề xuất KHÔNG được lưu ở đây — trả về để người dùng xem/sửa, chỉ khi bấm "Lưu" ở giao diện
//    mới đi qua nhánh lưu thường (POST canvas đầy đủ, qua hợp đồng Zod). Không thực thi hành động nào.
//  - Ngân sách: đúng 1 lời gọi model/lần tạo, trần token đầu ra, không tự thử lại.
//  - Lượt: trừ NGUYÊN TỬ qua checkAndConsumeUsage (chung hạn mức AI/ngày), HOÀN khi model không
//    trả được hoặc trả đầu ra hỏng — người dùng không nhận gì thì không mất lượt.
//  - Đua hai request: khoá theo user ở Postgres (feature_state) — request thứ hai nhận 409, không
//    gọi AI, không trừ lượt.
//  - Đầu ra hỏng ⇒ báo lỗi thật, KHÔNG rơi về khung mẫu giả vờ là AI.
const AI_LOCK = 'action_canvas_ai_lock'
// Mỗi provider timeout 30 giây (CHAT_PROVIDER_TIMEOUT_MS) nên chuỗi Groq → Anthropic → Gemini
// thường xong trong 120 giây; tiến trình chết thì khoá tự nhả sau chừng này giây. Trường hợp hiếm
// chuỗi chạy lâu hơn (Groq nhiều key cùng timeout), request thứ hai có thể lọt — hệ quả tối đa là
// trừ thêm một lượt, vẫn được hoàn nếu lời gọi đó hỏng. Request chạy quá hạn KHÔNG xoá được khoá
// của request sau (khoá có token chủ).
const AI_LOCK_TTL_SECONDS = 120
// Mỗi lượt là một lời gọi model TRẢ TIỀN — rate limit chặt như /api/programming/feedback.
const SYNTH_RATE_LIMIT_PER_MIN = 10
const SYNTH_RATE_LIMIT_PER_USER_PER_MIN = 5

const SynthesizeBodySchema = z
  .object({
    goalPrompt: z
      .string({ error: 'Hãy nhập mục tiêu của bạn.' })
      .transform(sanitizeGoal)
      .pipe(
        z
          .string()
          .min(GOAL_MIN, { error: `Mục tiêu cần ít nhất ${GOAL_MIN} ký tự.` })
          .max(GOAL_MAX),
      ),
    // canvasId lạ (gọi API trực tiếp) mà vẫn lưu thì canvas không qua được hợp đồng ở lần đọc sau
    // — chỉ nhận UUID, còn lại dùng id mặc định.
    canvasId: z.unknown().optional(),
  })
  .strip()

const MSG_BUSY = 'Đang tạo một đề xuất khác cho bạn — đợi nó xong rồi thử lại nhé.'
const MSG_AI_DOWN =
  'AI đang bận, chưa tạo được đề xuất. Thử lại sau ít phút — lượt của bạn giữ nguyên.'
const MSG_AI_INVALID =
  'AI trả về kế hoạch không hợp lệ nên không dùng được. Thử lại, hoặc diễn đạt mục tiêu cụ thể hơn — lượt của bạn giữ nguyên.'

async function handleSynthesize(
  req: Request,
  personId: string,
  body: Record<string, unknown>,
): Promise<Response> {
  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, SYNTH_RATE_LIMIT_PER_MIN, 'action-canvas-ai'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/action-canvas?synthesize' })
    return jsonResponse(
      { error: 'rate_limited', message: 'Quá nhiều yêu cầu — thử lại sau 1 phút.' },
      429,
    )
  }
  // [Vòng sửa sau rà bảo mật 0549] Thêm bucket theo NGƯỜI DÙNG: chỉ chặn theo IP thì một tài khoản
  // đổi IP (4G/VPN) vẫn dồn được lời gọi AI; chặn theo user thì người dùng chung IP (trường học,
  // văn phòng) cũng không ăn hạn mức của nhau.
  if (
    !(await checkRateLimit(personId, SYNTH_RATE_LIMIT_PER_USER_PER_MIN, 'action-canvas-ai:user'))
  ) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, {
      path: '/api/action-canvas?synthesize',
      scope: 'user',
    })
    return jsonResponse(
      { error: 'rate_limited', message: 'Quá nhiều yêu cầu — thử lại sau 1 phút.' },
      429,
    )
  }

  const parsed = SynthesizeBodySchema.safeParse(body)
  if (!parsed.success) {
    return jsonResponse(
      {
        error: 'invalid_goal',
        message: parsed.error.issues[0]?.message ?? 'Mục tiêu không hợp lệ.',
      },
      400,
    )
  }
  const goal = parsed.data.goalPrompt
  const requestedId = UuidSchema.safeParse(parsed.data.canvasId)
  const canvasId = requestedId.success ? requestedId.data : DEFAULT_CANVAS_ID

  // Token chủ khoá — chỉ nhả được khoá của CHÍNH request này (xem tryAcquireFeatureLock).
  const lockToken = await tryAcquireFeatureLock(personId, AI_LOCK, AI_LOCK_TTL_SECONDS)
  if (!lockToken) {
    return jsonResponse({ error: 'synthesis_in_progress', message: MSG_BUSY }, 409)
  }

  let chargedDay: string | null = null
  try {
    const gate = await checkAndConsumeUsage(personId, 'chat')
    if (!gate.ok) return jsonResponse({ error: 'usage_limit', message: gate.message }, 429)
    chargedDay = gate.day

    const prompt = buildGoalDecompositionPrompt(goal)
    const raw = await generateChatText({
      system: prompt.system,
      userMessage: prompt.userMessage,
      maxTokens: prompt.maxTokens,
      mode: GOAL_DECOMPOSITION_COST_MODE,
    })
    if (raw === null) {
      await refundUsage(personId, 'chat', chargedDay)
      chargedDay = null
      return jsonResponse({ error: 'ai_unavailable', message: MSG_AI_DOWN }, 503)
    }

    const result = parseGoalDecomposition(raw)
    if (!result.ok) {
      await refundUsage(personId, 'chat', chargedDay)
      chargedDay = null
      // Lý do máy đọc được (cycle/schema/…) để theo dõi chất lượng prompt; KHÔNG trả nguyên văn
      // đầu ra model về client.
      console.warn(`[action-canvas] đầu ra AI bị từ chối: ${result.reason}`)
      return jsonResponse(
        { error: 'ai_invalid_output', reason: result.reason, message: MSG_AI_INVALID },
        502,
      )
    }

    const proposal = buildProposalCanvas({ canvasId, personId, goal, steps: result.steps })
    chargedDay = null // đã giao kết quả — lượt này tính.
    return jsonResponse({ success: true, source: 'ai', proposal }, 200)
  } catch (err) {
    // Lỗi bất ngờ SAU khi đã trừ lượt (vd dựng canvas hỏng) — người dùng không nhận gì nên hoàn.
    if (chargedDay) await refundUsage(personId, 'chat', chargedDay)
    throw err
  } finally {
    // Nhả khoá lỗi thì thôi — khoá tự hết hạn sau AI_LOCK_TTL_SECONDS.
    await releaseFeatureLock(personId, AI_LOCK, lockToken).catch((e: unknown) =>
      console.warn('[action-canvas] nhả khoá lỗi → chờ tự hết hạn:', e),
    )
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse(
      { error: 'Unauthorized', message: 'Yêu cầu đăng nhập để truy cập Action Canvas.' },
      401,
    )
  }

  const personId = auth.userId
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (req.method === 'GET') {
    // [audit M11, đợt U5] Chưa lưu canvas nào → canvas RỖNG (giao diện hiện hướng dẫn), không
    // còn tự dựng 4 thẻ mẫu trông như kế hoạch của chính người dùng.
    const existing =
      (await readCanvas(personId)) ||
      ActionCanvasService.createEmptyCanvas({ canvasId: DEFAULT_CANVAS_ID, personId })

    return jsonResponse(
      {
        success: true,
        canvas: existing,
      },
      200,
    )
  }

  if (req.method === 'POST') {
    // [đợt U5] Chỉ body JSON hỏng mới là lỗi phía client (400). Trước đây MỌI lỗi — kể cả CSDL
    // hỏng khi ghi feature_state — bị gom thành 400 "Invalid payload" kèm chuỗi lỗi nội bộ.
    let body: Record<string, unknown>
    try {
      const parsed: unknown = await req.json()
      body = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {}
    } catch {
      return jsonResponse({ error: 'invalid_json' }, 400)
    }
    try {
      if (action === 'synthesize') {
        return await handleSynthesize(req, personId, body)
      }

      if (action === 'auto_layout') {
        const existing = await readCanvas(personId)
        if (!existing) {
          return jsonResponse({ error: 'canvas_not_found' }, 404)
        }
        const updatedNodes = ActionCanvasService.autoLayoutCanvasNodes(
          existing.nodes,
          existing.edges,
        )
        const updatedCanvas: ActionCanvasState = {
          ...existing,
          nodes: updatedNodes,
          updatedAt: new Date().toISOString(),
        }
        await setFeatureState(personId, FEATURE, updatedCanvas)
        return jsonResponse({ success: true, canvas: updatedCanvas }, 200)
      }

      if (action === 'export') {
        const existing = await readCanvas(personId)
        if (!existing) {
          return jsonResponse({ error: 'canvas_not_found' }, 404)
        }
        const markdown = ActionCanvasService.exportCanvasToMarkdown(existing)
        return jsonResponse(
          {
            success: true,
            format: 'markdown',
            markdown,
            title: existing.title,
          },
          200,
        )
      }

      const parseResult = ActionCanvasStateSchema.safeParse({
        ...body,
        personId,
        schemaVersion: ACTION_CANVAS_VERSION,
      })

      if (!parseResult.success) {
        return jsonResponse({ error: 'invalid_request', details: parseResult.error.format() }, 400)
      }

      await setFeatureState(personId, FEATURE, parseResult.data)
      return jsonResponse({ success: true, canvas: parseResult.data }, 200)
    } catch (err) {
      return internalErrorResponse(err, {}, 'action-canvas')
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}
