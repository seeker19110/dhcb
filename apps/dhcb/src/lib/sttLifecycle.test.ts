// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface ResultEvent {
  results: { 0: { transcript: string }; isFinal: boolean }[]
}
class Recognition {
  static instances: Recognition[] = []
  lang = ''
  continuous = false
  interimResults = false
  onresult: ((event: ResultEvent) => void) | null = null
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  start = vi.fn(() => {
    if (startError) throw startError
  })
  stop = vi.fn()
  constructor() {
    Recognition.instances.push(this)
  }
  result(text: string, isFinal = false) {
    this.onresult?.({ results: [{ 0: { transcript: text }, isFinal }] })
  }
}
let startError: Error | null = null
const ledger: string[] = []
beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  Recognition.instances = []
  startError = null
  ledger.length = 0
  vi.stubGlobal('window', { SpeechRecognition: Recognition })
  vi.stubGlobal('fetch', () => {
    ledger.push('unexpected_network')
    throw new Error('UNEXPECTED_NETWORK')
  })
})
afterEach(() => {
  expect(ledger).toEqual([])
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
async function setup(signal?: AbortSignal) {
  const api = await import('./stt')
  const onResult = vi.fn(),
    onEnd = vi.fn(),
    onError = vi.fn()
  const stop = api.startListening('vi', onResult, onEnd, onError, { signal })
  return { stop, rec: Recognition.instances[0]!, onResult, onEnd, onError }
}
function saved(rec: Recognition) {
  return { result: rec.onresult, end: rec.onend, error: rec.onerror }
}
function late(callbacks: ReturnType<typeof saved>) {
  callbacks.result?.({ results: [{ 0: { transcript: 'synthetic stale' }, isFinal: true }] })
  callbacks.end?.()
  callbacks.error?.({ error: 'synthetic_error' })
}

describe('native STT lifecycle qua public adapter thật', () => {
  it('preabort không dựng/start recognition hoặc gọi callback', async () => {
    const controller = new AbortController()
    controller.abort()
    const x = await setup(controller.signal)
    expect(Recognition.instances).toHaveLength(0)
    expect(x.onResult).not.toHaveBeenCalled()
    expect(x.onEnd).not.toHaveBeenCalled()
    expect(x.onError).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it.each(['default', 'cancel', 'abort'] as const)(
    '%s đóng trước stop; retained callbacks terminal-safe',
    async (mode) => {
      const controller = new AbortController()
      const x = await setup(controller.signal)
      const callbacks = saved(x.rec)
      if (mode === 'abort') controller.abort()
      else if (mode === 'default') x.stop()
      else x.stop('cancel')
      x.stop()
      late(callbacks)
      expect(x.rec.stop).toHaveBeenCalledTimes(1)
      expect(x.onResult).not.toHaveBeenCalled()
      expect(x.onEnd).not.toHaveBeenCalled()
      expect(x.onError).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
    },
  )
  it('explicit complete giữ late final result và onEnd một lần', async () => {
    const x = await setup()
    expect(x.rec.lang).toBe('vi-VN')
    expect(x.rec.interimResults).toBe(true)
    x.rec.result('synthetic interim')
    x.stop('complete')
    x.stop('complete')
    expect(x.rec.stop).toHaveBeenCalledTimes(1)
    expect(x.onEnd).not.toHaveBeenCalled()
    x.rec.result('synthetic final', true)
    const callbacks = saved(x.rec)
    callbacks.end?.()
    late(callbacks)
    expect(x.onResult.mock.calls).toEqual([
      [{ transcript: 'synthetic interim', isFinal: false }],
      [{ transcript: 'synthetic final', isFinal: true }],
    ])
    expect(x.onEnd).toHaveBeenCalledExactlyOnceWith('synthetic final')
    expect(x.onError).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('complete stop throw đóng terminal với aborted một lần và không confirm', async () => {
    const controller = new AbortController()
    const x = await setup(controller.signal)
    const callbacks = saved(x.rec)
    x.rec.stop.mockImplementation(() => {
      throw new Error('synthetic_stop_failure')
    })
    expect(() => x.stop('complete')).not.toThrow()
    expect(x.onError).toHaveBeenCalledExactlyOnceWith('aborted')
    expect(x.onEnd).not.toHaveBeenCalled()
    late(callbacks)
    expect(() => {
      x.stop('complete')
      x.stop()
      x.stop('cancel')
      controller.abort()
    }).not.toThrow()
    expect(x.rec.stop).toHaveBeenCalledTimes(1)
    expect(x.onError).toHaveBeenCalledExactlyOnceWith('aborted')
    expect(x.onResult).not.toHaveBeenCalled()
    expect(x.onEnd).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it.each(['cancel', 'abort'] as const)(
    'complete pending rồi %s: không final result/onEnd/error muộn',
    async (mode) => {
      const controller = new AbortController()
      const x = await setup(controller.signal)
      x.rec.result('synthetic interim')
      const callbacks = saved(x.rec)
      x.stop('complete')
      if (mode === 'cancel') x.stop()
      else controller.abort()
      late(callbacks)
      expect(x.onResult).toHaveBeenCalledTimes(1)
      expect(x.onEnd).not.toHaveBeenCalled()
      expect(x.onError).not.toHaveBeenCalled()
      expect(vi.getTimerCount()).toBe(0)
    },
  )
  it('natural end một terminal, late result/error không hồi sinh', async () => {
    const x = await setup()
    x.rec.result('synthetic natural', true)
    const callbacks = saved(x.rec)
    callbacks.end?.()
    late(callbacks)
    expect(x.onResult).toHaveBeenCalledTimes(1)
    expect(x.onEnd).toHaveBeenCalledExactlyOnceWith('synthetic natural')
    expect(x.onError).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('error rồi end không confirm đôi hoặc nhận result muộn', async () => {
    const x = await setup()
    const callbacks = saved(x.rec)
    callbacks.error?.({ error: 'not-allowed' })
    late(callbacks)
    expect(x.onError).toHaveBeenCalledExactlyOnceWith('not-allowed')
    expect(x.onEnd).not.toHaveBeenCalled()
    expect(x.onResult).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('no-speech đúng 8s: một error, stop, không onEnd muộn', async () => {
    const x = await setup()
    const callbacks = saved(x.rec)
    await vi.advanceTimersByTimeAsync(7999)
    expect(x.rec.stop).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    callbacks.end?.()
    expect(x.rec.stop).toHaveBeenCalledTimes(1)
    expect(x.onError).toHaveBeenCalledExactlyOnceWith('no-speech')
    expect(x.onEnd).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('có speech hủy 8s nhưng giữ max 20s, final/end vẫn được nhận', async () => {
    const x = await setup()
    x.rec.result('synthetic interim')
    await vi.advanceTimersByTimeAsync(19_999)
    expect(x.rec.stop).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(x.rec.stop).toHaveBeenCalledTimes(1)
    x.rec.result('synthetic final', true)
    x.rec.onend?.()
    expect(x.onEnd).toHaveBeenCalledExactlyOnceWith('synthetic final')
    expect(x.onError).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('start throw giữ error và không để timer/listener chạy muộn', async () => {
    startError = new Error('synthetic_start_failure')
    await expect(setup()).rejects.toBe(startError)
    expect(vi.getTimerCount()).toBe(0)
  })
  it('đối chứng chữ ký cũ bốn tham số + default cancel vẫn dùng được', async () => {
    const { startListening } = await import('./stt')
    const onResult = vi.fn(),
      onEnd = vi.fn(),
      onError = vi.fn()
    const stop: () => void = startListening('en', onResult, onEnd, onError)
    expect(Recognition.instances[0]?.lang).toBe('en-US')
    stop()
    expect(onEnd).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
})
