// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ auth: vi.fn() }))
vi.mock('@core/authHeader', () => ({ getAuthHeader: state.auth }))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
async function flush() {
  for (let i = 0; i < 40; i++) await Promise.resolve()
}
function observe<T>(promise: Promise<T>) {
  const outcome: { state: 'pending' | 'resolved' | 'rejected'; value?: T; error?: unknown } = {
    state: 'pending',
  }
  promise.then(
    (value) => {
      outcome.state = 'resolved'
      outcome.value = value
    },
    (error) => {
      outcome.state = 'rejected'
      outcome.error = error
    },
  )
  return outcome
}
function expectAbort(outcome: ReturnType<typeof observe>) {
  expect(outcome.state).toBe('rejected')
  expect(outcome.error).toMatchObject({ name: 'AbortError' })
}

class Track {
  stop = vi.fn()
}
const tracks = [new Track(), new Track()]
const stream = { getTracks: () => tracks }
const ledger: string[] = []
const requests: { input: unknown; init: RequestInit | undefined }[] = []
let permission = deferred<typeof stream>()
let response = deferred<Response>()
let auth = deferred<Record<string, string>>()
let getUserMedia = vi.fn()
let constructorError: Error | null = null
let startError: Error | null = null
let stopError: Error | null = null
let stopMode: 'auto' | 'held' = 'auto'
let chunks: Blob[] = []
let readerMode: 'auto' | 'held' = 'auto'
let savedStop: (() => void) | null = null
const readers: Reader[] = []
const recorders: RecorderFake[] = []
class Reader {
  result: string | ArrayBuffer | null = null
  onloadend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor() {
    readers.push(this)
  }
  readAsDataURL() {
    if (readerMode === 'auto') queueMicrotask(() => this.finish())
  }
  finish() {
    this.result = 'data:audio/webm;base64,c3ludGhldGlj'
    this.onloadend?.()
  }
}
class RecorderFake {
  static isTypeSupported(mime: string) {
    return mime === 'audio/webm;codecs=opus'
  }
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  start = vi.fn(() => {
    if (startError) throw startError
  })
  stop = vi.fn(() => {
    if (stopError) throw stopError
    savedStop = this.onstop
    if (stopMode === 'auto') queueMicrotask(() => this.finish())
  })
  constructor() {
    if (constructorError) throw constructorError
    recorders.push(this)
  }
  finish() {
    chunks.forEach((data) => this.ondataavailable?.({ data }))
    this.onstop?.()
  }
}
const ok = (text: unknown) => new Response(JSON.stringify({ text }), { status: 200 })
async function ready(signal?: AbortSignal) {
  const api = await import('./sttServer')
  const pending = api.startRecording('vi', { signal })
  permission.resolve(stream)
  const recorder = await pending
  return { api, recorder, rec: recorders[0]! }
}
beforeEach(() => {
  vi.resetModules()
  vi.useFakeTimers()
  ledger.length = 0
  requests.length = 0
  recorders.length = 0
  readers.length = 0
  tracks.forEach((track) => track.stop.mockClear())
  permission = deferred()
  response = deferred()
  auth = deferred()
  getUserMedia = vi.fn(() => permission.promise)
  state.auth.mockReset().mockReturnValue(auth.promise)
  constructorError = null
  startError = null
  stopError = null
  stopMode = 'auto'
  readerMode = 'auto'
  savedStop = null
  chunks = [new Blob(['synthetic-audio'])]
  vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })
  vi.stubGlobal('MediaRecorder', RecorderFake)
  vi.stubGlobal('FileReader', Reader)
  vi.stubGlobal(
    'fetch',
    vi.fn((input: unknown, init?: RequestInit) => {
      requests.push({ input, init })
      if (input !== '/api/stt' || init?.method !== 'POST') {
        ledger.push('unexpected_request')
        throw new Error('UNEXPECTED_NETWORK')
      }
      return response.promise
    }),
  )
})
afterEach(async () => {
  // Giải phóng mọi barrier giả ngay cả khi một oracle đỏ; không I/O thật hoặc promise reject mồ côi.
  permission.resolve(stream)
  auth.resolve({ 'x-synthetic-auth': 'synthetic-only' })
  response.resolve(ok('synthetic'))
  readers.forEach((reader) => reader.finish())
  recorders.forEach((rec) => rec.finish())
  await flush()
  expect(ledger).toEqual([])
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('server STT lifecycle qua public adapter thật', () => {
  it('preabort không xin permission hoặc dựng recorder', async () => {
    const api = await import('./sttServer')
    const controller = new AbortController()
    controller.abort()
    const result = observe(api.startRecording('en', { signal: controller.signal }))
    permission.resolve(stream)
    await flush()
    expectAbort(result)
    expect(getUserMedia).not.toHaveBeenCalled()
    expect(recorders).toHaveLength(0)
    expect(requests).toHaveLength(0)
  })
  it('abort lúc permission pending: nhả mọi track trước constructor/start', async () => {
    const api = await import('./sttServer')
    const controller = new AbortController()
    const result = observe(api.startRecording('vi', { signal: controller.signal }))
    controller.abort()
    permission.resolve(stream)
    await flush()
    expectAbort(result)
    expect(recorders).toHaveLength(0)
    tracks.forEach((track) => expect(track.stop).toHaveBeenCalledTimes(1))
    expect(requests).toHaveLength(0)
  })
  it('permission reject sau abort vẫn AbortError, không biến thành lỗi để caller fallback', async () => {
    const api = await import('./sttServer')
    const controller = new AbortController()
    const result = observe(api.startRecording('en', { signal: controller.signal }))
    controller.abort()
    permission.reject(new Error('synthetic_permission_failure'))
    await flush()
    expectAbort(result)
    expect(recorders).toHaveLength(0)
  })
  it.each(['constructor', 'start'] as const)(
    '%s throw nhả tracks và giữ đúng error',
    async (phase) => {
      const failure = new Error('synthetic_recorder_failure')
      if (phase === 'constructor') constructorError = failure
      else startError = failure
      const api = await import('./sttServer')
      const result = observe(api.startRecording('en'))
      permission.resolve(stream)
      await flush()
      expect(result.error).toBe(failure)
      tracks.forEach((track) => expect(track.stop).toHaveBeenCalledTimes(1))
      expect(requests).toHaveLength(0)
    },
  )
  it.each(['cancel', 'abort'] as const)(
    'active %s lặp nhả tracks một lần và stop sau đó reject',
    async (mode) => {
      const controller = new AbortController()
      const { recorder, rec } = await ready(controller.signal)
      if (mode === 'cancel') {
        recorder.cancel()
        recorder.cancel()
      } else {
        controller.abort()
        recorder.cancel()
      }
      const pending = recorder.stop()
      const same = recorder.stop()
      const result = observe(pending)
      await flush()
      expect(same).toBe(pending)
      expectAbort(result)
      expect(rec.stop).toHaveBeenCalledTimes(1)
      tracks.forEach((track) => expect(track.stop).toHaveBeenCalledTimes(1))
      expect(requests).toHaveLength(0)
    },
  )
  it('stop dùng chung promise/request, giữ exact request và language', async () => {
    const { recorder, rec } = await ready()
    auth.resolve({ 'x-synthetic-auth': 'synthetic-only' })
    const pending = recorder.stop()
    expect(recorder.stop()).toBe(pending)
    const result = observe(pending)
    await flush()
    expect(requests).toHaveLength(1)
    expect(requests[0]?.init?.headers).toEqual({
      'content-type': 'application/json',
      'x-synthetic-auth': 'synthetic-only',
    })
    expect(JSON.parse(String(requests[0]?.init?.body))).toEqual({
      audio_b64: 'c3ludGhldGlj',
      mime: 'audio/webm;codecs=opus',
      lang: 'vi',
    })
    response.resolve(ok(' synthetic final '))
    await flush()
    expect(result).toMatchObject({ state: 'resolved', value: 'synthetic final' })
    expect(rec.stop).toHaveBeenCalledTimes(1)
    tracks.forEach((track) => expect(track.stop).toHaveBeenCalledTimes(1))
    expect(vi.getTimerCount()).toBe(0)
  })
  it('onstop được giữ và gọi lại không tạo pipeline/upload thứ hai', async () => {
    readerMode = 'held'
    const { recorder } = await ready()
    auth.resolve({})
    const result = observe(recorder.stop())
    await flush()
    const oldStop = savedStop
    oldStop?.()
    oldStop?.()
    await flush()
    expect(readers).toHaveLength(1)
    readers[0]?.finish()
    await flush()
    expect(requests).toHaveLength(1)
    response.resolve(ok('synthetic once'))
    await flush()
    oldStop?.()
    await flush()
    expect(result).toMatchObject({ state: 'resolved', value: 'synthetic once' })
    expect(requests).toHaveLength(1)
  })
  it('rec.stop throw nhả tracks, settle shared promise và không upload', async () => {
    const { recorder } = await ready()
    const failure = new Error('synthetic_stop_failure')
    stopError = failure
    const pending = recorder.stop()
    const result = observe(pending)
    await flush()
    expect(recorder.stop()).toBe(pending)
    expect(result.error).toBe(failure)
    recorder.cancel()
    tracks.forEach((track) => expect(track.stop).toHaveBeenCalledTimes(1))
    expect(requests).toHaveLength(0)
  })
  it.each(['onstop', 'reader', 'auth'] as const)(
    'cancel tại %s: settle AbortError ngay, continuation muộn không upload',
    async (phase) => {
      if (phase === 'onstop') stopMode = 'held'
      if (phase === 'reader') readerMode = 'held'
      const { recorder, rec } = await ready()
      const result = observe(recorder.stop())
      await flush()
      if (phase === 'reader') expect(readers).toHaveLength(1)
      if (phase === 'auth') expect(state.auth).toHaveBeenCalledTimes(1)
      recorder.cancel()
      await flush()
      expectAbort(result)
      rec.finish()
      savedStop?.()
      readers.forEach((reader) => reader.finish())
      auth.resolve({})
      await flush()
      expect(requests).toHaveLength(0)
      tracks.forEach((track) => expect(track.stop).toHaveBeenCalledTimes(1))
    },
  )
  it.each(['reader', 'auth'] as const)(
    'signal abort tại %s cũng settle ngay và chặn continuation',
    async (phase) => {
      if (phase === 'reader') readerMode = 'held'
      const controller = new AbortController()
      const { recorder } = await ready(controller.signal)
      const result = observe(recorder.stop())
      await flush()
      controller.abort()
      await flush()
      expectAbort(result)
      readers.forEach((reader) => reader.finish())
      auth.resolve({})
      await flush()
      expect(requests).toHaveLength(0)
    },
  )
  it.each(['synthetic final', '   '])(
    'cancel sau fetch giữ successful receipt %j và timeout transport riêng',
    async (text) => {
      const controller = new AbortController()
      const { recorder } = await ready(controller.signal)
      auth.resolve({})
      const result = observe(recorder.stop())
      await flush()
      expect(requests).toHaveLength(1)
      const transportSignal = requests[0]?.init?.signal
      expect(transportSignal).not.toBe(controller.signal)
      controller.abort()
      recorder.cancel()
      await flush()
      expect(result.state).toBe('pending')
      expect(transportSignal?.aborted).toBe(false)
      response.resolve(ok(text))
      await flush()
      expect(result).toMatchObject({ state: 'resolved', value: text.trim() })
      expect(requests).toHaveLength(1)
      expect(vi.getTimerCount()).toBe(0)
    },
  )
  it('EMPTY_RECORDING khác blank success, không auth/fetch', async () => {
    chunks = []
    const { recorder } = await ready()
    const result = observe(recorder.stop())
    await flush()
    expect(result.error).toMatchObject({ message: 'EMPTY_RECORDING' })
    expect(state.auth).not.toHaveBeenCalled()
    expect(requests).toHaveLength(0)
  })
  it.each(['network', 'http', 'invalid', 'nonstring'] as const)(
    'giữ lỗi %s không retry',
    async (kind) => {
      const { recorder } = await ready()
      auth.resolve({})
      const result = observe(recorder.stop())
      await flush()
      const failure = new Error('synthetic_network')
      if (kind === 'network') response.reject(failure)
      else if (kind === 'http')
        response.resolve(new Response(JSON.stringify({ error: 'synthetic_http' }), { status: 503 }))
      else if (kind === 'invalid') response.resolve(new Response('{}'))
      else response.resolve(ok(42))
      await flush()
      expect(result.state).toBe('rejected')
      if (kind === 'network') expect(result.error).toBe(failure)
      if (kind === 'http') expect(result.error).toMatchObject({ message: 'synthetic_http' })
      if (kind === 'invalid')
        expect(result.error).toMatchObject({ message: 'STT API returned invalid response' })
      if (kind === 'nonstring')
        expect(result.error).toMatchObject({ message: 'STT API returned non-string text' })
      expect(requests).toHaveLength(1)
      tracks.forEach((track) => expect(track.stop).toHaveBeenCalledTimes(1))
      expect(vi.getTimerCount()).toBe(0)
    },
  )
  it('60s timeout giữ AbortController riêng và thông báo cũ', async () => {
    const { recorder } = await ready()
    auth.resolve({})
    const result = observe(recorder.stop())
    await flush()
    const transportSignal = requests[0]?.init?.signal
    expect(transportSignal?.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(59_999)
    expect(transportSignal?.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(transportSignal?.aborted).toBe(true)
    response.reject(new DOMException('synthetic timeout', 'AbortError'))
    await flush()
    expect(result.error).toMatchObject({
      message: 'Máy chủ phản hồi quá lâu — kiểm tra mạng rồi thử lại.',
    })
    expect(requests).toHaveLength(1)
  })
  it('scope không còn hợp lệ trước permission không mở micro', async () => {
    const api = await import('./sttServer')
    const result = observe(api.startRecording('vi', { isCurrent: () => false }))
    await flush()
    expectAbort(result)
    expect(getUserMedia).not.toHaveBeenCalled()
    expect(recorders).toHaveLength(0)
  })
  it('scope đổi khi permission pending nhả tracks trước constructor/start', async () => {
    const api = await import('./sttServer')
    let current = true
    const result = observe(api.startRecording('vi', { isCurrent: () => current }))
    current = false
    permission.resolve(stream)
    await flush()
    expectAbort(result)
    expect(recorders).toHaveLength(0)
    tracks.forEach((track) => expect(track.stop).toHaveBeenCalledTimes(1))
  })
  it('scope đổi trong auth await chặn upload dù signal chưa abort', async () => {
    const api = await import('./sttServer')
    let current = true
    const pending = api.startRecording('vi', { isCurrent: () => current })
    permission.resolve(stream)
    const recorder = await pending
    const result = observe(recorder.stop())
    await flush()
    expect(state.auth).toHaveBeenCalledTimes(1)
    current = false
    auth.resolve({})
    await flush()
    expectAbort(result)
    expect(requests).toHaveLength(0)
    tracks.forEach((track) => expect(track.stop).toHaveBeenCalledTimes(1))
  })
  it('scope đổi sau upload vẫn giữ receipt thành công đã gửi', async () => {
    const api = await import('./sttServer')
    let current = true
    const pending = api.startRecording('vi', { isCurrent: () => current })
    permission.resolve(stream)
    const recorder = await pending
    auth.resolve({})
    const result = observe(recorder.stop())
    await flush()
    expect(requests).toHaveLength(1)
    current = false
    response.resolve(ok('synthetic receipt'))
    await flush()
    expect(result.state).toBe('resolved')
    expect(result.value).toBe('synthetic receipt')
    expect(requests).toHaveLength(1)
  })
})
