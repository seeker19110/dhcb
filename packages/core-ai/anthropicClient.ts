// packages/core-ai/anthropicClient.ts — Gọi Claude (Anthropic) qua SDK CHÍNH THỨC, trả về text
// đã làm sạch + một trong 4 dạng kết quả rõ ràng để caller quyết fallback/hoàn lượt.
//
// VÌ SAO KHÔNG FORWARD NGUYÊN BODY NHƯ TRƯỚC (callAnthropicChat cũ): model Claude đời mới
// (Haiku 5.5, Sonnet 5.5) LUÔN tự suy nghĩ trước khi trả lời, nên `content[0]` thường là khối
// `thinking` (text rỗng) chứ không phải câu trả lời. Frontend đọc `content[0].text` → sẽ báo
// "phản hồi lỗi định dạng" ở MỌI lượt. Ở đây ta lọc đúng các khối `type: 'text'` rồi ghép lại.
//
// Bốn bẫy 400 của model mới mà file này tự gỡ (xem toAnthropicMessages):
//   1. messages rỗng (vd Chat.tsx mở phiên bằng callClaude([], sys)) → API đòi ≥ 1 tin.
//   2. tin đầu là của AI (PathStageQuiz gửi [assistant, user]) → API đòi tin đầu là user.
//   3. tin cuối là của AI (chấm điểm cuối phiên gửi nguyên lịch sử) → model mới coi là
//      "prefill" và từ chối 400.
//   4. tin có nội dung rỗng → API từ chối khối text rỗng.
//
// Không gửi temperature/top_p/top_k: model mới từ chối giá trị khác mặc định (400).

import Anthropic from '@anthropic-ai/sdk'
import type { AnthropicRoute } from './aiConfig.js'
import type { JsonSchema } from './jsonSchema.js'
import { parseAnthropicUsage, type AiTokenUsage } from './aiTokenUsage.js'

type BetaMessageParam = Anthropic.Beta.Messages.BetaMessageParam
type BetaMessageCreateParams = Anthropic.Beta.Messages.MessageCreateParamsNonStreaming

/** Lý do một response 200 vẫn KHÔNG dùng được (đã tốn token — caller vẫn ghi chi phí). */
export type AnthropicUnusableReason = 'refusal' | 'max_tokens' | 'context_exceeded' | 'empty'

export type AnthropicTextResult =
  | {
      kind: 'success'
      text: string
      /** Model THỰC SỰ trả lời (có thể khác model yêu cầu nếu server-side fallback chạy). */
      model: string
      usage: AiTokenUsage | null
      latencyMs: number
    }
  | {
      kind: 'unusable'
      reason: AnthropicUnusableReason
      detail: string
      model: string
      usage: AiTokenUsage | null
      latencyMs: number
    }
  | { kind: 'api_error'; status: number; message: string; latencyMs: number }
  | { kind: 'network_error'; message: string; latencyMs: number }

// Câu chèn khi lịch sử thiếu lượt user ở đầu/cuối (bẫy 1–3 ở trên). Viết trung tính để không
// đổi ý prompt: system prompt của từng chế độ vẫn là nơi quyết định AI làm gì.
export const OPENING_USER_TURN = '(Bắt đầu theo hướng dẫn ở trên.)'
export const CLOSING_USER_TURN =
  '(Hãy thực hiện yêu cầu trong hướng dẫn ở trên, dựa trên cuộc hội thoại này.)'

/**
 * Chuẩn hoá lịch sử hội thoại (dữ liệu client, kiểu `unknown`) thành dạng Anthropic chấp nhận:
 * chỉ giữ tin `user`/`assistant` có nội dung chuỗi khác rỗng; bảo đảm tin ĐẦU và tin CUỐI là
 * `user`. Hai tin cùng vai liền nhau được API tự gộp nên không cần xử lý.
 */
export function toAnthropicMessages(messages: unknown[]): BetaMessageParam[] {
  const out: BetaMessageParam[] = []
  for (const msg of messages) {
    if (typeof msg !== 'object' || msg === null) continue
    const { role, content } = msg as { role?: unknown; content?: unknown }
    if (role !== 'user' && role !== 'assistant') continue
    if (typeof content !== 'string') continue
    const text = content.trim()
    if (!text) continue
    out.push({ role, content: text })
  }
  if (out.length === 0 || out[0]!.role !== 'user') {
    out.unshift({ role: 'user', content: OPENING_USER_TURN })
  }
  if (out[out.length - 1]!.role !== 'user') {
    out.push({ role: 'user', content: CLOSING_USER_TURN })
  }
  return out
}

// Model hỗ trợ server-side fallback dạng `fallbacks: 'default'` trên Claude API: khi bộ lọc an
// toàn từ chối nhầm (vd bài luận nói về bệnh tật/an ninh mạng), Anthropic tự chạy lại bằng model
// dự phòng trong CÙNG lượt gọi. Haiku 5.5 KHÔNG có tính năng này (gửi kèm là vô ích hoặc 400).
const DEFAULT_FALLBACK_MODELS = new Set([
  'claude-sonnet-5-5',
  'claude-opus-5-5',
  'claude-opus-5',
  'claude-fable-5-1',
])
const SERVER_FALLBACK_BETA = 'server-side-fallback-2026-07-01'

// Một client cho mỗi API key (SDK giữ kết nối keep-alive — tạo lại mỗi lượt là phí).
const clientCache = new Map<string, Anthropic>()

function getClient(apiKey: string, fetchImpl?: typeof fetch): Anthropic {
  // Test truyền fetch giả → client riêng, không dính cache của lượt khác.
  if (fetchImpl) return new Anthropic({ apiKey, fetch: fetchImpl, maxRetries: 1 })
  let client = clientCache.get(apiKey)
  if (!client) {
    // maxRetries 1: thử lại MỘT lần khi 429/529 quá tải/5xx/rớt mạng (thường hết ngay sau
    // vài trăm ms) — rẻ hơn nhiều so với rơi xuống provider dự phòng chất lượng thấp hơn.
    client = new Anthropic({ apiKey, maxRetries: 1 })
    clientCache.set(apiKey, client)
  }
  return client
}

/**
 * Dựng body request — tách riêng để test kiểm đúng tham số gửi đi mà không cần mạng.
 * `outputSchema` (tuỳ chọn): ép câu trả lời theo JSON Schema (structured outputs) — dùng cho
 * lượt chấm điểm, xem gradingSchemas.ts.
 */
export function buildAnthropicRequest(
  route: AnthropicRoute,
  system: string,
  messages: unknown[],
  outputSchema?: JsonSchema,
): BetaMessageCreateParams {
  const params: BetaMessageCreateParams = {
    model: route.model,
    max_tokens: route.maxTokens,
    messages: toAnthropicMessages(messages),
    // Thinking để mặc định (adaptive) — model mới không cho tắt hẳn; điều chỉnh bằng effort.
    // `format`: API giải mã có ràng buộc → text trả về LUÔN là JSON đúng schema (trừ khi
    // refusal/max_tokens — hai ca đó đã bị coi là lỗi ở callAnthropicText).
    output_config: outputSchema
      ? { effort: route.effort, format: { type: 'json_schema', schema: outputSchema } }
      : { effort: route.effort },
    // Cache tự động phần đầu lặp lại (system prompt + lịch sử cũ) giữa các lượt của cùng phiên:
    // đọc từ cache chỉ tốn 10% giá token vào.
    cache_control: { type: 'ephemeral' },
  }
  if (system) params.system = system
  if (DEFAULT_FALLBACK_MODELS.has(route.model)) {
    params.betas = [SERVER_FALLBACK_BETA]
    params.fallbacks = 'default'
  }
  return params
}

// Ghép mọi khối text (bỏ thinking/fallback/…). Response có server-side fallback có thể chia
// câu trả lời thành nhiều khối text quanh khối `fallback`.
function extractText(content: Anthropic.Beta.Messages.BetaContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
}

/**
 * Gọi Claude cho một nhiệm vụ. KHÔNG BAO GIỜ ném lỗi — mọi thất bại trả về dạng kết quả để
 * caller tự quyết chuyển provider dự phòng và hoàn lượt (đúng khuôn ChatCallResult của Groq).
 */
export async function callAnthropicText(params: {
  apiKey: string
  route: AnthropicRoute
  system: string
  messages: unknown[]
  /** Ép câu trả lời theo JSON Schema (structured outputs) — chỉ lượt chấm điểm dùng. */
  outputSchema?: JsonSchema
  /** Chỉ dùng trong test: fetch giả thay cho mạng thật. */
  fetchImpl?: typeof fetch
}): Promise<AnthropicTextResult> {
  const { apiKey, route, system, messages, outputSchema, fetchImpl } = params
  const startedAt = Date.now()
  const latency = () => Date.now() - startedAt

  let response: Anthropic.Beta.Messages.BetaMessage
  try {
    response = await getClient(apiKey, fetchImpl).beta.messages.create(
      buildAnthropicRequest(route, system, messages, outputSchema),
      // `signal` là HẠN CHÓT TỔNG cho cả lần thử lại; `timeout` chỉ áp từng lần thử. Không có
      // signal, timeout + 1 lần thử lại có thể kéo gấp đôi và vượt mốc 60s của Nginx.
      { timeout: route.timeoutMs, signal: AbortSignal.timeout(route.timeoutMs) },
    )
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError) {
      return { kind: 'network_error', message: 'Hết thời gian chờ Anthropic', latencyMs: latency() }
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return { kind: 'network_error', message: err.message, latencyMs: latency() }
    }
    if (err instanceof Anthropic.APIError && typeof err.status === 'number') {
      return { kind: 'api_error', status: err.status, message: err.message, latencyMs: latency() }
    }
    const message = err instanceof Error ? err.message : String(err)
    return { kind: 'network_error', message, latencyMs: latency() }
  }

  const usage = parseAnthropicUsage(response)
  const model = response.model || route.model
  const unusable = (reason: AnthropicUnusableReason, detail: string): AnthropicTextResult => ({
    kind: 'unusable',
    reason,
    detail,
    model,
    usage,
    latencyMs: latency(),
  })

  // Đọc stop_reason TRƯỚC content: refusal vẫn là HTTP 200 nhưng không có câu trả lời thật.
  if (response.stop_reason === 'refusal') {
    return unusable('refusal', response.stop_details?.category ?? 'không rõ')
  }
  // Bị cắt vì chạm trần token: câu trả lời dở dang (JSON chấm điểm sẽ hỏng) → coi là lỗi.
  if (response.stop_reason === 'max_tokens') {
    return unusable('max_tokens', `chạm trần ${route.maxTokens} token`)
  }
  if (response.stop_reason === 'model_context_window_exceeded') {
    return unusable('context_exceeded', 'hội thoại vượt cửa sổ ngữ cảnh')
  }
  const text = extractText(response.content)
  if (!text) return unusable('empty', `stop_reason=${response.stop_reason ?? 'null'}`)
  return { kind: 'success', text, model, usage, latencyMs: latency() }
}
