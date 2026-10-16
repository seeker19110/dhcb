// Trace Companion riêng tại server; không có thẩm quyền DB/usage/billing.
import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import {
  CompanionTraceSpanSchema,
  unknownTraceUsage,
  type CompanionTraceSpan,
  type CompanionTraceStage,
  type CompanionTraceStatus,
  type CompanionTraceUsage,
} from '@dhcb/core-contracts/companionTrace'
import { createRequestId } from './requestId.js'
import { createRequestLogger } from './logger.js'

export type TraceSink = (span: CompanionTraceSpan) => void | Promise<unknown>
export interface TurnTraceOptions {
  enabled?: boolean
  clock?: () => number
  newId?: () => string
  sink?: TraceSink
  maxSpans?: number
}
type Metadata = Pick<CompanionTraceSpan, 'provider' | 'model' | 'attempt' | 'toolKind'>
type Finish = {
  status?: CompanionTraceStatus
  usage?: CompanionTraceUsage
  costUsd?: number | null
  httpStatus?: number | null
}
interface CallCost {
  open: boolean
  cost: number | null
}
interface Store {
  context: TurnContext
  span: TraceSpanHandle
}
const storage = new AsyncLocalStorage<Store>()

// Mỗi entry chỉ có metadata. Sink hang giữ tối đa một in-flight + hàng đợi hữu hạn.
function bufferedSink(sink: TraceSink, capacity = 256) {
  const queue: Array<{ build: () => CompanionTraceSpan; drop: () => void }> = []
  let busy = false
  function schedule() {
    setImmediate(drain)
  }
  function drain() {
    const entry = queue.shift()
    if (!entry) {
      busy = false
      return
    }
    let result: void | Promise<unknown>
    try {
      result = sink(CompanionTraceSpanSchema.parse(entry.build()))
    } catch {
      entry.drop()
      schedule()
      return
    }
    // Không await trên đường trả lời, cũng không tạo thêm in-flight khi sink chưa xong.
    Promise.resolve(result).then(schedule, () => {
      entry.drop()
      schedule()
    })
  }
  return (build: () => CompanionTraceSpan, drop: () => void) => {
    if (queue.length >= capacity) {
      drop()
      return
    }
    queue.push({ build, drop })
    if (!busy) {
      busy = true
      schedule()
    }
  }
}
const logSink: TraceSink = (dto) =>
  createRequestLogger('companion-trace', dto.requestId).info(JSON.stringify(dto))
const defaultSink = bufferedSink(logSink)

export interface TraceSpanHandle {
  readonly id: string | null
  child(stage: CompanionTraceStage, metadata?: Partial<Metadata>): TraceSpanHandle
  run<T>(callback: () => T): T
  end(finish?: Finish): void
}
const noop: TraceSpanHandle = {
  id: null,
  child: () => noop,
  run: (callback) => callback(),
  end: () => {},
}

class TurnContext {
  readonly traceId: string
  readonly requestId = createRequestId()
  readonly start: number
  readonly clock: () => number
  readonly makeId: () => string
  readonly maxSpans: number
  readonly calls = new Map<string, CallCost>()
  readonly models = new Set<string>()
  readonly ids = new Set<string>()
  readonly emit: ReturnType<typeof bufferedSink>
  dropped = 0

  constructor(options: TurnTraceOptions) {
    this.clock = options.clock ?? (() => performance.now())
    this.makeId = options.newId ?? randomUUID
    this.maxSpans = options.maxSpans ?? 128
    if (!Number.isSafeInteger(this.maxSpans) || this.maxSpans < 1 || this.maxSpans > 1024)
      throw new Error('TRACE_INVALID_LIMIT')
    this.traceId = this.makeId()
    this.start = this.clock()
    if (!Number.isFinite(this.start) || this.start < 0) throw new Error('TRACE_INVALID_CLOCK')
    this.emit = options.sink ? bufferedSink(options.sink) : defaultSink
  }

  summary(): NonNullable<CompanionTraceSpan['summary']> {
    const calls = [...this.calls.values()]
    const knownMicros = calls.reduce(
      (n, c) => n + (c.open || c.cost === null ? 0 : Math.round(c.cost * 1e6)),
      0,
    )
    const observedCostUsd = knownMicros / 1e6
    const unknownCallCount = calls.filter((c) => c.open || c.cost === null).length
    return {
      callCount: calls.length,
      openCallCount: calls.filter((c) => c.open).length,
      openModelCallCount: this.models.size,
      unknownCallCount,
      droppedSpans: this.dropped,
      observedCostUsd,
      totalCostUsd: unknownCallCount || this.models.size || this.dropped ? null : observedCostUsd,
    }
  }

  span(
    stage: CompanionTraceStage,
    parentSpanId: string | null,
    metadata: Partial<Metadata> = {},
  ): TraceSpanHandle {
    try {
      if (this.ids.size >= this.maxSpans) {
        this.dropped++
        return noop
      }
      const id = this.makeId()
      if (this.ids.has(id)) {
        this.dropped++
        return noop
      }
      const started = stage === 'turn' ? this.start : this.clock()
      if (!Number.isFinite(started) || started < this.start) {
        this.dropped++
        return noop
      }
      this.ids.add(id)
      if (stage === 'http_attempt') this.calls.set(id, { open: true, cost: null })
      if (stage === 'model_call') this.models.add(id)
      let closed = false
      const handle: TraceSpanHandle = {
        id,
        child: (childStage, childMetadata) => this.span(childStage, id, childMetadata),
        run: (callback) => storage.run({ context: this, span: handle }, callback),
        end: (finish = {}) => {
          if (closed) return
          closed = true
          this.models.delete(id)
          const call = this.calls.get(id)
          // Nếu export/clock/schema lỗi, call vẫn đóng nhưng cost unknown, không kẹt open.
          if (call) {
            call.open = false
            call.cost = null
          }
          try {
            const ended = this.clock()
            if (!Number.isFinite(ended) || ended < started) throw new Error('TRACE_INVALID_CLOCK')
            const dto = CompanionTraceSpanSchema.parse({
              schemaVersion: 1,
              traceId: this.traceId,
              requestId: this.requestId,
              spanId: id,
              parentSpanId,
              stage,
              status: finish.status ?? 'success',
              startOffsetMs: started - this.start,
              durationMs: ended - started,
              provider: metadata.provider ?? null,
              model: metadata.model ?? null,
              attempt: metadata.attempt ?? null,
              toolKind: metadata.toolKind ?? null,
              httpStatus: finish.httpStatus ?? null,
              usage: stage === 'http_attempt' ? (finish.usage ?? unknownTraceUsage()) : null,
              costUsd: finish.costUsd ?? null,
              summary: stage === 'turn' ? this.summary() : null,
            })
            if (call) call.cost = dto.costUsd
            // Root giữ snapshot lúc đóng. Chỉ cập nhật số span export bị mất trước nó;
            // child đóng muộn không được nâng root cũ từ unknown thành complete.
            this.emit(
              () =>
                dto.summary
                  ? {
                      ...dto,
                      summary: {
                        ...dto.summary,
                        droppedSpans: this.dropped,
                        totalCostUsd: this.dropped ? null : dto.summary.totalCostUsd,
                      },
                    }
                  : dto,
              () => {
                this.dropped++
              },
            )
          } catch {
            this.dropped++
          }
        },
      }
      return handle
    } catch {
      this.dropped++
      return noop
    }
  }
}

function makeRoot(options?: TurnTraceOptions): TraceSpanHandle | undefined {
  try {
    if (!(options?.enabled ?? process.env.COMPANION_TRACE_ENABLED === 'true')) return undefined
    const context = new TurnContext(options ?? {})
    const root = context.span('turn', null)
    return root.id === null ? undefined : root
  } catch {
    return undefined
  }
}

export function activeTraceSpan(): TraceSpanHandle | undefined {
  return storage.getStore()?.span
}

export async function withTraceStage<T>(
  stage: CompanionTraceStage,
  action: () => Promise<T>,
): Promise<T> {
  const parent = activeTraceSpan()
  if (!parent) return action()
  const span = parent.child(stage)
  try {
    const result = await span.run(action)
    span.end()
    return result
  } catch (error) {
    span.end({ status: 'error' })
    throw error
  }
}

export async function traceCompanionTurn<T>(
  action: () => Promise<T>,
  options?: TurnTraceOptions,
): Promise<T> {
  const root = makeRoot(options)
  if (!root) return action()
  try {
    const result = await root.run(action)
    root.end()
    return result
  } catch (error) {
    root.end({ status: 'error' })
    throw error
  }
}

// Generator body chạy tại next(), không phải lúc tạo. Bind cả return/throw vì chúng cũng
// đi qua finally/await của body; không sửa currentSpan trên store chung giữa hai lượt.
export function traceCompanionGenerator<T, R, N>(
  factory: () => AsyncGenerator<T, R, N>,
  options?: TurnTraceOptions,
): AsyncGenerator<T, R, N> {
  if (!(options?.enabled ?? process.env.COMPANION_TRACE_ENABLED === 'true')) return factory()
  const iterator = factory()
  let started = false
  let root: TraceSpanHandle | undefined
  function invoke(action: () => Promise<IteratorResult<T, R>>, returning = false) {
    const task = root ? root.run(action) : action()
    return task.then(
      (result) => {
        if (result.done) root?.end({ status: returning ? 'consumer_cancelled' : 'success' })
        return result
      },
      (error: unknown) => {
        root?.end({ status: 'error' })
        throw error
      },
    )
  }
  const wrapped: AsyncGenerator<T, R, N> = {
    [Symbol.asyncIterator]() {
      return this
    },
    next(...args: [] | [N]) {
      if (!started) {
        started = true
        root = makeRoot(options)
      }
      return invoke(() => iterator.next(...args))
    },
    return(value: R | PromiseLike<R>) {
      return invoke(() => iterator.return(value), true)
    },
    throw(error: unknown) {
      return invoke(() => iterator.throw(error))
    },
    [Symbol.asyncDispose]: async () => {
      await wrapped.return(undefined as R)
    },
  }
  return wrapped
}
