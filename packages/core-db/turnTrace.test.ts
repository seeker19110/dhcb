// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type CompanionTraceSpan, unknownTraceUsage } from '@dhcb/core-contracts/companionTrace'
import {
  activeTraceSpan,
  traceCompanionGenerator,
  traceCompanionTurn,
  withTraceStage,
} from './turnTrace'

afterEach(() => vi.unstubAllEnvs())
function capture() {
  const events: CompanionTraceSpan[] = []
  let now = 0
  return {
    events,
    options: {
      enabled: true,
      clock: () => now++,
      sink: (dto: CompanionTraceSpan) => {
        events.push(dto)
      },
    },
  }
}
async function rootEvent(events: CompanionTraceSpan[]) {
  await vi.waitFor(() => expect(events.some((e) => e.stage === 'turn')).toBe(true), { interval: 5 })
  return events.find((e) => e.stage === 'turn')!
}

describe('Trace server fail-open', () => {
  it('mặc định tắt, không clock/UUID/sink hoặc đổi giá trị trả về', async () => {
    vi.stubEnv('COMPANION_TRACE_ENABLED', '')
    const sink = vi.fn()
    const clock = vi.fn(() => 0)
    const value = { text: 'CANARY_CONTENT' }
    expect(await traceCompanionTurn(async () => value, { sink, clock })).toBe(value)
    expect(sink).not.toHaveBeenCalled()
    expect(clock).not.toHaveBeenCalled()
  })
  it('giữ ID cha/con, đơn vị monotonic và chỉ attempt sở hữu chi phí', async () => {
    const c = capture()
    await traceCompanionTurn(
      () =>
        withTraceStage('prepare', async () => {
          const model = activeTraceSpan()!.child('model_call', {
            provider: 'anthropic',
            model: 'claude-sonnet-5-5',
          })
          const attempt = model.child('http_attempt', {
            provider: 'anthropic',
            model: 'claude-sonnet-5-5',
            attempt: 1,
          })
          attempt.end({
            usage: {
              state: 'complete',
              promptTokens: 600,
              completionTokens: 40,
              cacheReadTokens: 200,
              cacheWriteTokens: 300,
            },
            costUsd: 0.00139,
            httpStatus: 200,
          })
          model.end()
        }),
      c.options,
    )
    const root = await rootEvent(c.events)
    expect(root.startOffsetMs).toBe(0)
    expect(root.summary).toMatchObject({
      callCount: 1,
      openCallCount: 0,
      openModelCallCount: 0,
      unknownCallCount: 0,
      observedCostUsd: 0.00139,
      totalCostUsd: 0.00139,
    })
    expect(new Set(c.events.map((e) => e.traceId)).size).toBe(1)
    for (const e of c.events) {
      expect(e.durationMs).toBeGreaterThanOrEqual(0)
      if (e.parentSpanId) expect(c.events.some((p) => p.spanId === e.parentSpanId)).toBe(true)
      if (e.stage !== 'http_attempt') expect(e.costUsd).toBeNull()
    }
  })
  it('usage thiếu và SDK call chưa đi tới HTTP không được báo total 0 đã đo', async () => {
    const c = capture()
    await traceCompanionTurn(async () => {
      const span = activeTraceSpan()!
      span.child('model_call', { provider: 'anthropic', model: 'claude-sonnet-5-5' })
      const call = span.child('http_attempt', {
        provider: 'anthropic',
        model: 'claude-sonnet-5-5',
        attempt: 1,
      })
      call.end({ status: 'error', usage: unknownTraceUsage() })
    }, c.options)
    expect((await rootEvent(c.events)).summary).toMatchObject({
      callCount: 1,
      unknownCallCount: 1,
      openModelCallCount: 1,
      totalCostUsd: null,
    })
  })
  it('sink throw/reject/hang không sửa response hoặc gây retry action', async () => {
    for (const sink of [
      () => {
        throw new Error('CANARY_SINK')
      },
      () => Promise.reject(new Error('CANARY_REJECT')),
      () => new Promise<never>(() => {}),
    ]) {
      let executions = 0
      const result = await traceCompanionTurn(
        async () => {
          executions++
          return { pending: true }
        },
        { enabled: true, sink },
      )
      expect(result).toEqual({ pending: true })
      expect(executions).toBe(1)
    }
    // Negative control: gọi sink trực tiếp không có lớp cô lập sẽ phá kết quả.
    const unsafe = () => {
      throw new Error('SINK_UNISOLATED')
    }
    expect(unsafe).toThrow('SINK_UNISOLATED')
    await new Promise<void>((resolve) => setImmediate(resolve))
  })
  it('giữ error identity, không đưa exception/nội dung action vào sink', async () => {
    const c = capture()
    const error = new Error('CANARY_EXCEPTION')
    await expect(
      traceCompanionTurn(async () => {
        throw error
      }, c.options),
    ).rejects.toBe(error)
    expect((await rootEvent(c.events)).status).toBe('error')
    expect(JSON.stringify(c.events)).not.toContain('CANARY')
    expect(activeTraceSpan()).toBeUndefined()
  })
  it('clock/ID lỗi và span budget không làm action lỗi, không tạo cost giả', async () => {
    const action = vi.fn(async () => 7)
    expect(await traceCompanionTurn(action, { enabled: true, clock: () => NaN })).toBe(7)
    expect(
      await traceCompanionTurn(action, {
        enabled: true,
        newId: () => {
          throw new Error('CANARY_ID')
        },
      }),
    ).toBe(7)
    const c = capture()
    await traceCompanionTurn(() => withTraceStage('context', async () => 7), {
      ...c.options,
      maxSpans: 1,
    })
    expect((await rootEvent(c.events)).summary).toMatchObject({
      droppedSpans: 1,
      totalCostUsd: null,
    })
    expect(action).toHaveBeenCalledTimes(2)
  })
})

describe('ALS của async generator', () => {
  it('throw/asyncDispose giữ context và lỗi gốc, đóng root đúng một lần', async () => {
    const c = capture()
    const observed: Array<string | null | undefined> = []
    const error = new Error('CANARY_THROW')
    const iterator = traceCompanionGenerator(async function* () {
      try {
        yield 'ready'
      } finally {
        observed.push(activeTraceSpan()?.id)
      }
    }, c.options)
    await iterator.next()
    await expect(iterator.throw(error)).rejects.toBe(error)
    const terminal = await rootEvent(c.events)
    expect(terminal.status).toBe('error')
    expect(observed).toEqual([terminal.spanId])
    await iterator[Symbol.asyncDispose]()
    expect(c.events.filter((e) => e.stage === 'turn')).toHaveLength(1)
    expect(JSON.stringify(c.events)).not.toContain('CANARY')
  })

  it('sink mất child làm root báo dropped, clock lùi không tạo duration âm', async () => {
    const events: CompanionTraceSpan[] = []
    let first = true
    await traceCompanionTurn(() => withTraceStage('context', async () => 7), {
      enabled: true,
      sink: (event) => {
        if (first) {
          first = false
          throw new Error('CANARY_DROP')
        }
        events.push(event)
      },
    })
    expect((await rootEvent(events)).summary).toMatchObject({ droppedSpans: 1, totalCostUsd: null })
    const c = capture()
    let now = 10
    await traceCompanionTurn(
      async () => {
        const child = activeTraceSpan()!.child('context')
        now = 5
        child.end()
        now = 20
      },
      { ...c.options, clock: () => now },
    )
    expect((await rootEvent(c.events)).summary?.droppedSpans).toBe(1)
    expect(c.events.every((e) => e.durationMs >= 0)).toBe(true)
  })

  it('sink hang chỉ có một in-flight và hàng đợi 256, không chặn action', async () => {
    let release: (() => void) | undefined
    const sink = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          release = resolve
        }),
    )
    await traceCompanionTurn(
      async () => {
        const span = activeTraceSpan()!
        for (let i = 0; i < 300; i++) span.child('context').end()
      },
      { enabled: true, maxSpans: 512, sink },
    )
    await vi.waitFor(() => expect(sink).toHaveBeenCalledTimes(1), { interval: 5 })
    // Sink đầu hang: không mở 300 thao tác đồng thời. Sau khi nhả, các entry đã tràn không quay lại.
    sink.mockImplementation(() => Promise.resolve())
    release?.()
    await vi.waitFor(() => expect(sink).toHaveBeenCalledTimes(256), { interval: 5 })
    await new Promise<void>((resolve) => setImmediate(resolve))
    expect(sink).toHaveBeenCalledTimes(256)
  })

  it('hai iterator xen kẽ giữ đúng root qua next/return/finally và producer muộn', async () => {
    const a = capture(),
      b = capture()
    const seen: Array<{ name: string; id: string | null | undefined }> = []
    let late: (() => void) | undefined
    const factory = (name: string) =>
      async function* () {
        try {
          seen.push({ name, id: activeTraceSpan()?.id })
          if (name === 'a') {
            const model = activeTraceSpan()!.child('model_call')
            late = () => model.end()
          }
          yield name
          await Promise.resolve()
          seen.push({ name, id: activeTraceSpan()?.id })
          yield name
          return name
        } finally {
          seen.push({ name, id: activeTraceSpan()?.id })
        }
      }
    const ia = traceCompanionGenerator(factory('a'), a.options)
    const ib = traceCompanionGenerator(factory('b'), b.options)
    await ia.next()
    await ib.next()
    await ib.next()
    await ia.return('stop')
    const cancelled = await rootEvent(a.events)
    expect(cancelled.status).toBe('consumer_cancelled')
    expect(cancelled.summary).toMatchObject({ openModelCallCount: 1, totalCostUsd: null })
    late?.()
    await ib.next()
    const completed = await rootEvent(b.events)
    expect(completed.status).toBe('success')
    for (const { name, id } of seen)
      expect(id).toBe(name === 'a' ? cancelled.spanId : completed.spanId)
    expect(a.events.filter((e) => e.stage === 'turn')).toHaveLength(1)
    expect(cancelled.summary?.totalCostUsd).toBeNull()
    expect(activeTraceSpan()).toBeUndefined()
  })
})
