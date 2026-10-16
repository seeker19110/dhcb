// packages/core-ai/anthropicToolLoop.ts — Vòng lặp công cụ (tool use) của Claude, viết TAY.
//
// Nâng cấp Bạn Đồng Hành GĐ3 (`docs/specs/2026-10-12-ban-dong-hanh-gd3-tac-tu-cong-cu.md`): model
// tự gọi công cụ chỉ-đọc (tiến độ học, thẻ ôn, ghi chú, từ điển) và công cụ TẠO ĐỀ XUẤT, rồi mới
// trả lời. Vì sao viết tay thay vì Tool Runner (beta) của SDK: cần ba điều Runner không cho gọn —
//   1. trần CỨNG số bước có gọi công cụ (Anthropic "Building effective agents": agent phải có điều
//      kiện dừng) và lần gọi cuối ép `tool_choice: none` để model buộc trả lời bằng chữ;
//   2. hạn chót TỔNG cho cả vòng (Nginx cắt request ở 60 giây; còn phải chừa chỗ cho Groq/Gemini);
//   3. kết quả cùng khuôn "không bao giờ ném" như `callAnthropicText`, để caller chuyển nhà cung
//      cấp dự phòng như mọi lượt khác.
//
// Luật API tuân theo (đã đối chiếu tài liệu Claude API 2026-10):
//   - công cụ khai `strict: true` + `additionalProperties: false` → `input` luôn đúng schema (caller
//     VẪN kiểm lại bằng Zod: hai lớp, vì dữ liệu từ model là dữ liệu ngoài);
//   - KHÔNG bật `eager_input_streaming`: tham số ở đây tí hon, và bật nó thì API thôi kiểm schema —
//     mất đúng bảo đảm của `strict`;
//   - KHÔNG dùng `tool_choice` `any`/`tool` (Sonnet 5.5 trả 400) — chỉ `auto` và `none`;
//   - trả NGUYÊN `response.content` (kể cả khối `thinking`) làm tin `assistant` kế tiếp: lịch sử chỉ
//     nối thêm, không sửa (preserved thinking); mọi `tool_result` của một bước nằm trong MỘT tin.
import type Anthropic from '@anthropic-ai/sdk'
import { activeTraceSpan } from '@dhcb/core-db/turnTrace'
import { traceModelCall } from './modelTrace.js'
import type { AnthropicRoute } from './aiConfig.js'
import {
  buildAnthropicRequest,
  describeAnthropicError,
  extractText,
  getAnthropicClient,
  type AnthropicUnusableReason,
} from './anthropicClient.js'
import { parseAnthropicUsage, type AiTokenUsage } from './aiTokenUsage.js'
import type { JsonSchema } from './jsonSchema.js'

type BetaMessageParam = Anthropic.Beta.Messages.BetaMessageParam
type BetaContentBlockParam = Anthropic.Beta.Messages.BetaContentBlockParam
type BetaToolResultBlockParam = Anthropic.Beta.Messages.BetaToolResultBlockParam
type BetaToolUseBlock = Anthropic.Beta.Messages.BetaToolUseBlock
type BetaMessage = Anthropic.Beta.Messages.BetaMessage

/** Số bước TỐI ĐA có gọi công cụ; lần gọi kế tiếp bị ép trả lời bằng chữ. */
export const TOOL_LOOP_MAX_TOOL_STEPS = 4
/** Số lần THI HÀNH công cụ tối đa trong một lượt (gọi song song trong một bước cũng tính). */
export const TOOL_LOOP_MAX_EXECUTIONS = 6
/** Hạn chót tổng của cả vòng — dưới mốc 60 giây của Nginx, chừa chỗ cho nhà cung cấp dự phòng. */
export const TOOL_LOOP_DEADLINE_MS = 45_000

export const TOOL_LIMIT_MESSAGE =
  'Đã chạm trần số lần tra cứu trong lượt này — hãy trả lời bằng những gì đã có.'
export const TOOL_CRASH_MESSAGE = 'Công cụ gặp lỗi nội bộ, không có kết quả.'

/** Một công cụ khai cho model. `inputSchema` phải là object đóng (dựng bằng `obj()`). */
export interface ToolLoopToolDefinition {
  name: string
  description: string
  inputSchema: Extract<JsonSchema, { type: 'object' }>
}

export interface ToolExecutionOutcome {
  /** Nội dung gửi lại model (chuỗi gọn, thường là JSON). */
  content: string
  isError?: boolean
}

export type ToolExecutor = (name: string, input: unknown) => Promise<ToolExecutionOutcome>

export interface ToolCallRecord {
  name: string
  ok: boolean
}

/** Chi phí MỖI lần gọi model trong vòng — caller ghi vào bảng chi phí. */
export interface ToolLoopUsage {
  model: string
  usage: AiTokenUsage | null
}

interface LoopTrace {
  /** Chi phí từng lần gọi (đặt tên `calls` để không trùng `usage` của `AnthropicTextResult`). */
  calls: ToolLoopUsage[]
  toolCalls: ToolCallRecord[]
  latencyMs: number
}

export type ToolLoopResult =
  | ({ kind: 'success'; text: string; model: string; steps: number } & LoopTrace)
  | ({
      kind: 'unusable'
      reason: AnthropicUnusableReason
      detail: string
      model: string
    } & LoopTrace)
  | ({ kind: 'api_error'; status: number; message: string } & LoopTrace)
  | ({ kind: 'network_error'; message: string } & LoopTrace)

export interface RunToolLoopParams {
  apiKey: string
  route: AnthropicRoute
  system: string
  /** Lịch sử hội thoại dạng `{ role, content: string }` — chuẩn hoá như `callAnthropicText`. */
  messages: unknown[]
  tools: ToolLoopToolDefinition[]
  executeTool: ToolExecutor
  /** Báo TRƯỚC khi thi hành một công cụ (để giao diện hiện "Đang xem…"). */
  onToolStart?: (name: string) => void
  /** Có callback ⇒ đi đường stream, phát chữ ngay khi model sinh ra. */
  onTextDelta?: (delta: string) => void
  maxToolSteps?: number
  maxExecutions?: number
  deadlineMs?: number
  /** Chỉ dùng trong test. */
  fetchImpl?: typeof fetch
}

/** Định nghĩa gửi API: luôn `strict: true` (xem đầu file). */
export function toAnthropicTools(
  tools: ToolLoopToolDefinition[],
): Anthropic.Beta.Messages.BetaTool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as unknown as Anthropic.Beta.Messages.BetaTool.InputSchema,
    strict: true,
  }))
}

/**
 * Chạy vòng công cụ tới khi model trả lời bằng chữ. KHÔNG BAO GIỜ ném lỗi — mọi thất bại trả về
 * dạng kết quả (kèm chi phí các lần gọi đã xảy ra) để caller chuyển nhà cung cấp dự phòng.
 */
export async function runAnthropicToolLoop(params: RunToolLoopParams): Promise<ToolLoopResult> {
  const {
    apiKey,
    route,
    system,
    messages,
    tools,
    executeTool,
    onToolStart,
    onTextDelta,
    fetchImpl,
  } = params
  const maxToolSteps = params.maxToolSteps ?? TOOL_LOOP_MAX_TOOL_STEPS
  const maxExecutions = params.maxExecutions ?? TOOL_LOOP_MAX_EXECUTIONS
  const startedAt = Date.now()
  const deadline = startedAt + (params.deadlineMs ?? TOOL_LOOP_DEADLINE_MS)

  const calls: ToolLoopUsage[] = []
  const toolCalls: ToolCallRecord[] = []
  const trace = (): LoopTrace => ({ calls, toolCalls, latencyMs: Date.now() - startedAt })

  const base = buildAnthropicRequest(route, system, messages)
  const conversation: BetaMessageParam[] = [...base.messages]
  const apiTools = toAnthropicTools(tools)
  const client = getAnthropicClient(apiKey, fetchImpl)

  const texts: string[] = []
  let toolSteps = 0
  let executions = 0
  let emittedText = false

  for (;;) {
    const remaining = deadline - Date.now()
    if (remaining <= 0) {
      return { kind: 'network_error', message: 'Hết hạn chót của vòng công cụ', ...trace() }
    }
    const request = {
      ...base,
      messages: conversation,
      tools: apiTools,
      // Hết trần bước ⇒ vẫn gửi `tools` (lịch sử có khối tool_use cần định nghĩa đi kèm) nhưng
      // cấm gọi thêm: model buộc trả lời bằng những gì đã tra được.
      tool_choice: { type: toolSteps < maxToolSteps ? 'auto' : 'none' } as const,
    }
    const options = {
      timeout: Math.min(route.timeoutMs, remaining),
      signal: AbortSignal.timeout(remaining),
    }

    let response: BetaMessage
    try {
      response = await traceModelCall(
        'anthropic',
        route.model,
        async (observer) => {
          const observedOptions = {
            ...options,
            ...(observer ? { middleware: [observer.middleware] } : {}),
          }
          try {
            let result: BetaMessage
            if (onTextDelta) {
              let stepEmitted = false
              const stream = client.beta.messages.stream(request, observedOptions)
              if (observer) stream.on('streamEvent', (event) => observer.observeStream(event))
              stream.on('text', (delta) => {
                // Giữ cách nối delta của loop cũ; observer không chạm nội dung.
                if (!stepEmitted && emittedText) onTextDelta('\n\n')
                stepEmitted = true
                emittedText = true
                onTextDelta(delta)
              })
              result = await stream.finalMessage()
            } else result = await client.beta.messages.create(request, observedOptions)
            observer?.response(result)
            return result
          } catch (error) {
            observer?.fail()
            throw error
          }
        },
        (result) =>
          !['refusal', 'max_tokens', 'model_context_window_exceeded'].includes(
            result.stop_reason ?? '',
          ) &&
          (result.content.some((b) => b.type === 'tool_use') ||
            Boolean(extractText(result.content))),
      )
    } catch (err) {
      const failure = describeAnthropicError(err, Date.now() - startedAt)
      return { ...failure, ...trace() }
    }

    const model = response.model || route.model
    calls.push({ model, usage: parseAnthropicUsage(response) })
    const unusable = (reason: AnthropicUnusableReason, detail: string): ToolLoopResult => ({
      kind: 'unusable',
      reason,
      detail,
      model,
      ...trace(),
    })

    // Bước bị cắt/từ chối: KHÔNG chạy công cụ của bước đó (input có thể dở dang).
    if (response.stop_reason === 'refusal') {
      return unusable('refusal', response.stop_details?.category ?? 'không rõ')
    }
    if (response.stop_reason === 'max_tokens') {
      return unusable('max_tokens', `chạm trần ${route.maxTokens} token`)
    }
    if (response.stop_reason === 'model_context_window_exceeded') {
      return unusable('context_exceeded', 'hội thoại vượt cửa sổ ngữ cảnh')
    }

    const stepText = extractText(response.content)
    if (stepText) texts.push(stepText)

    const toolUses = response.content.filter((b): b is BetaToolUseBlock => b.type === 'tool_use')
    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
      const text = texts.join('\n\n').trim()
      if (!text) return unusable('empty', `stop_reason=${response.stop_reason ?? 'null'}`)
      return { kind: 'success', text, model, steps: toolSteps + 1, ...trace() }
    }

    toolSteps += 1
    conversation.push({
      role: 'assistant',
      content: response.content as unknown as BetaContentBlockParam[],
    })

    // Thi hành TUẦN TỰ (không song song): công cụ đọc đều là truy vấn nhanh, và công cụ tạo đề
    // xuất có trần đếm — chạy tuần tự thì trần đếm không bị đua.
    const results: BetaToolResultBlockParam[] = []
    for (const toolUse of toolUses) {
      if (executions >= maxExecutions) {
        toolCalls.push({ name: toolUse.name, ok: false })
        results.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: TOOL_LIMIT_MESSAGE,
          is_error: true,
        })
        continue
      }
      executions += 1
      onToolStart?.(toolUse.name)
      let outcome: ToolExecutionOutcome
      const toolKind = tools.some((tool) => tool.name === toolUse.name)
        ? toolUse.name.startsWith('propose_')
          ? 'proposal'
          : 'read'
        : 'unknown'
      const toolSpan = activeTraceSpan()?.child('tool', { toolKind })
      try {
        const execute = () => executeTool(toolUse.name, toolUse.input)
        outcome = await (toolSpan ? toolSpan.run(execute) : execute())
        toolSpan?.end({ status: outcome.isError ? 'error' : 'success' })
      } catch {
        toolSpan?.end({ status: 'error' })
        outcome = { content: TOOL_CRASH_MESSAGE, isError: true }
      }
      toolCalls.push({ name: toolUse.name, ok: !outcome.isError })
      results.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: outcome.content,
        ...(outcome.isError ? { is_error: true } : {}),
      })
    }
    conversation.push({ role: 'user', content: results })
  }
}
