// Quan sát provider, không đọc kép body và không thay đổi retry/usage persistence.
import type { Middleware } from '@anthropic-ai/sdk'
import { z } from 'zod'
import {
  CompanionTraceModelSchema,
  unknownTraceUsage,
  type CompanionTraceModel,
  type CompanionTraceProvider,
  type CompanionTraceUsage,
} from '@dhcb/core-contracts/companionTrace'
import { activeTraceSpan, type TraceSpanHandle } from '@dhcb/core-db/turnTrace'
import { calculateCostUsd, MODEL_PRICING_REGISTRY } from './capabilityCostTracker.js'

const Count = z.number().int().nonnegative().safe()
const RecordSchema = z.record(z.string(), z.unknown())
const BodySchema = z.object({
  model: z.unknown().optional(),
  usage: z.unknown().optional(),
  usageMetadata: z.unknown().optional(),
})
const StreamUsageSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('message_start'),
    message: z.object({ model: z.unknown().optional(), usage: z.unknown().optional() }),
  }),
  z.object({ type: z.literal('message_delta'), usage: z.unknown().optional() }),
])
function modelLabel(raw: unknown): CompanionTraceModel {
  const parsed = CompanionTraceModelSchema.safeParse(raw)
  return parsed.success ? parsed.data : 'unknown'
}
function count(raw: unknown): number | null {
  const parsed = Count.safeParse(raw)
  return parsed.success ? parsed.data : null
}
interface Attempt {
  span: TraceSpanHandle
  metadata: { provider: CompanionTraceProvider; model: CompanionTraceModel; attempt: number }
  counters: {
    input: number | null
    output: number | null
    read: number | null
    write: number | null
  }
  status: number | null
  closed: boolean
}

export class ModelTrace {
  private ordinal = 0
  private current?: Attempt
  private readonly attempts: Attempt[] = []

  constructor(
    private readonly logical: TraceSpanHandle,
    private readonly provider: CompanionTraceProvider,
    private readonly configuredModel: string,
  ) {}

  // Middleware từng request, trong retry loop của SDK. next chỉ xuất hiện MỘT lần.
  readonly middleware: Middleware = async (request, next) => {
    const attempt = this.begin()
    let response: Response
    try {
      response = await next(request)
    } catch (error) {
      this.fail(attempt)
      throw error
    }
    this.headers(response, attempt)
    return response
  }

  run<T>(action: () => T): T {
    return this.logical.run(action)
  }

  begin(): Attempt | undefined {
    try {
      const metadata = {
        provider: this.provider,
        model: modelLabel(this.configuredModel),
        attempt: ++this.ordinal,
      }
      const attempt: Attempt = {
        span: this.logical.child('http_attempt', metadata),
        metadata,
        counters: { input: null, output: null, read: null, write: null },
        status: null,
        closed: false,
      }
      this.attempts.push(attempt)
      this.current = attempt
      return attempt
    } catch {
      return undefined
    }
  }

  headers(response: Response, attempt = this.current): void {
    try {
      if (!attempt) return
      attempt.status = response.status
      if (!response.ok) this.finish(attempt, false, false)
    } catch {
      /* Lỗi đo không được biến thành lỗi provider. */
    }
  }

  private update(raw: unknown, attempt: Attempt): void {
    const parsed = RecordSchema.safeParse(raw)
    if (!parsed.success) return
    const data = parsed.data
    const update = (key: string, target: keyof Attempt['counters']) => {
      if (Object.hasOwn(data, key)) attempt.counters[target] = count(data[key])
    }
    if (this.provider === 'anthropic') {
      update('input_tokens', 'input')
      update('output_tokens', 'output')
      update('cache_read_input_tokens', 'read')
      update('cache_creation_input_tokens', 'write')
    } else {
      update(this.provider === 'groq' ? 'prompt_tokens' : 'promptTokenCount', 'input')
      update(this.provider === 'groq' ? 'completion_tokens' : 'candidatesTokenCount', 'output')
      // Theo hợp đồng AiTokenUsage hiện hữu: cache read/write chỉ Anthropic có. Không
      // tạo usage giả từ object rỗng. Nếu Gemini báo cache, giữ count nhưng không quy giá
      // bằng multiplier Anthropic bên dưới.
      if (attempt.counters.input !== null || attempt.counters.output !== null) {
        attempt.counters.read = 0
        attempt.counters.write = 0
        if (this.provider === 'gemini' && Object.hasOwn(data, 'cachedContentTokenCount')) {
          attempt.counters.read = count(data.cachedContentTokenCount)
        }
        if (this.provider === 'groq') {
          const details = z
            .object({ cached_tokens: z.unknown().optional() })
            .safeParse(data.prompt_tokens_details)
          if (details.success && Object.hasOwn(details.data, 'cached_tokens'))
            attempt.counters.read = count(details.data.cached_tokens)
        }
      }
    }
  }

  observeStream(event: unknown): void {
    try {
      const attempt = this.current
      if (!attempt || attempt.closed) return
      const parsed = StreamUsageSchema.safeParse(event)
      if (!parsed.success) return
      if (parsed.data.type === 'message_start') {
        attempt.metadata.model = modelLabel(parsed.data.message.model)
        this.update(parsed.data.message.usage, attempt)
      } else this.update(parsed.data.usage, attempt)
    } catch {
      /* Không đưa event/raw exception vào trace. */
    }
  }

  response(body: unknown): void {
    try {
      const attempt = this.current
      if (!attempt || attempt.closed) return
      const parsed = BodySchema.safeParse(body)
      if (parsed.success) {
        if (this.provider === 'anthropic') attempt.metadata.model = modelLabel(parsed.data.model)
        this.update(
          this.provider === 'gemini' ? parsed.data.usageMetadata : parsed.data.usage,
          attempt,
        )
      }
      this.finish(attempt, true, true)
    } catch {
      this.fail()
    }
  }

  private usage(attempt: Attempt, final: boolean): CompanionTraceUsage {
    const c = attempt.counters
    const total =
      this.provider === 'anthropic'
        ? c.input !== null && c.read !== null && c.write !== null
          ? c.input + c.read + c.write
          : null
        : c.input
    const promptTokens = total !== null && Number.isSafeInteger(total) ? total : null
    const values = [promptTokens, c.output, c.read, c.write]
    if (values.every((v) => v === null)) return unknownTraceUsage()
    return {
      state: final && values.every((v) => v !== null) ? 'complete' : 'partial',
      promptTokens,
      completionTokens: c.output,
      cacheReadTokens: c.read,
      cacheWriteTokens: c.write,
    }
  }

  private finish(attempt: Attempt, success: boolean, final: boolean): void {
    if (attempt.closed) return
    attempt.closed = true
    try {
      const usage = this.usage(attempt, final)
      const model = attempt.metadata.model
      let costUsd: number | null = null
      if (
        usage.state === 'complete' &&
        Object.hasOwn(MODEL_PRICING_REGISTRY, model) &&
        (this.provider === 'anthropic' || usage.cacheReadTokens === 0)
      ) {
        costUsd = calculateCostUsd(
          model,
          usage.promptTokens!,
          usage.completionTokens!,
          usage.cacheReadTokens!,
          usage.cacheWriteTokens!,
        )
      }
      attempt.span.end({
        status: success ? 'success' : 'error',
        usage,
        costUsd,
        httpStatus: attempt.status,
      })
    } catch {
      attempt.span.end({
        status: 'error',
        usage: unknownTraceUsage(),
        costUsd: null,
        httpStatus: attempt.status,
      })
    }
  }

  fail(attempt = this.current): void {
    try {
      if (attempt) this.finish(attempt, false, false)
    } catch {
      /* fail-open */
    }
  }
  end(success: boolean): void {
    try {
      for (const attempt of this.attempts) if (!attempt.closed) this.finish(attempt, false, false)
      this.logical.end({ status: success ? 'success' : 'error' })
    } catch {
      /* Không ảnh hưởng giá trị/error gốc. */
    }
  }
}

export async function traceModelCall<T>(
  provider: CompanionTraceProvider,
  model: string,
  action: (observer: ModelTrace | undefined) => Promise<T>,
  success: (result: T) => boolean = () => true,
): Promise<T> {
  let observer: ModelTrace | undefined
  try {
    const parent = activeTraceSpan()
    if (parent)
      observer = new ModelTrace(
        parent.child('model_call', { provider, model: modelLabel(model) }),
        provider,
        model,
      )
  } catch {
    /* Khởi tạo đo lỗi thì chạy nguyên action. */
  }
  try {
    const result = await (observer ? observer.run(() => action(observer)) : action(undefined))
    if (observer) {
      let ok = true
      try {
        ok = success(result)
      } catch {
        ok = false
      }
      observer.end(ok)
    }
    return result
  } catch (error) {
    observer?.end(false)
    throw error
  }
}
