import { vi } from 'vitest'

export function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

export class FixtureTrack {
  stopCalls = 0
  active = true
  stop() {
    this.stopCalls += 1
    this.active = false
  }
}
export class FixtureStream {
  readonly track = new FixtureTrack()
  getTracks() {
    return [this.track]
  }
}
interface ResultEvent {
  results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }>
}
export class FixtureRecognition {
  static instances: FixtureRecognition[] = []
  lang = ''
  continuous = false
  interimResults = false
  onresult: ((event: ResultEvent) => void) | null = null
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  startCalls = 0
  stopCalls = 0
  finalText = 'fixture spoken sentence'
  holdStop = false
  constructor() {
    FixtureRecognition.instances.push(this)
  }
  start() {
    this.startCalls += 1
  }
  stop() {
    this.stopCalls += 1
    if (!this.holdStop) queueMicrotask(() => this.finish())
  }
  interim(text: string) {
    this.onresult?.({ results: [{ 0: { transcript: text }, isFinal: false }] })
  }
  finish() {
    this.onresult?.({ results: [{ 0: { transcript: this.finalText }, isFinal: true }] })
    this.onend?.()
  }
  dispose() {
    this.onresult = null
    this.onend = null
    this.onerror = null
  }
}
export class FixtureMediaRecorder {
  static instances: FixtureMediaRecorder[] = []
  static isTypeSupported() {
    return true
  }
  state = 'inactive'
  startCalls = 0
  stopCalls = 0
  emitChunk = true
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  constructor(readonly stream: FixtureStream) {
    FixtureMediaRecorder.instances.push(this)
  }
  start() {
    this.startCalls += 1
    this.state = 'recording'
  }
  stop() {
    if (this.state === 'inactive') throw new Error('InvalidStateError')
    this.stopCalls += 1
    this.state = 'inactive'
    queueMicrotask(() => {
      if (this.emitChunk)
        this.ondataavailable?.({ data: new Blob(['fixture audio'], { type: 'audio/webm' }) })
      this.onstop?.()
    })
  }
  dispose() {
    this.state = 'inactive'
    this.ondataavailable = null
    this.onstop = null
  }
}
class FixtureFileReader {
  result: string | null = null
  onloadend: (() => void) | null = null
  onerror: (() => void) | null = null
  readAsDataURL() {
    queueMicrotask(() => {
      this.result = 'data:audio/webm;base64,AQID'
      this.onloadend?.()
    })
  }
}
export function installMediaFixture(mode: 'server' | 'native' = 'server') {
  const originalMedia = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices')
  const originalRecognition = Object.getOwnPropertyDescriptor(window, 'SpeechRecognition')
  const originalWebkit = Object.getOwnPropertyDescriptor(window, 'webkitSpeechRecognition')
  FixtureRecognition.instances = []
  FixtureMediaRecorder.instances = []
  const permissions: ReturnType<typeof deferred<FixtureStream>>[] = []
  const streams: FixtureStream[] = []
  const sttRequests: {
    init: RequestInit | undefined
    response: ReturnType<typeof deferred<Response>>
  }[] = []
  const agentRequests: { init: RequestInit | undefined }[] = []
  const boundaryFailures: string[] = []
  const getUserMedia = vi.fn(() => {
    const request = deferred<FixtureStream>()
    permissions.push(request)
    return request.promise
  })
  vi.stubGlobal('MediaRecorder', mode === 'server' ? FixtureMediaRecorder : undefined)
  vi.stubGlobal('FileReader', FixtureFileReader)
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: mode === 'server' ? { getUserMedia } : undefined,
  })
  Reflect.set(window, 'SpeechRecognition', FixtureRecognition)
  Reflect.set(window, 'webkitSpeechRecognition', undefined)
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      if (input === '/api/stt') {
        const response = deferred<Response>()
        sttRequests.push({ init, response })
        return response.promise
      }
      if (input === '/api/agent') {
        agentRequests.push({ init })
        return Promise.resolve(
          Response.json({
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  speech: 'fixture AI reply',
                  feedback: '',
                  corrected: '',
                }),
              },
            ],
          }),
        )
      }
      boundaryFailures.push('unexpected_http')
      throw new Error('UNEXPECTED_NETWORK_BOUNDARY')
    }),
  )
  return {
    permissions,
    streams,
    getUserMedia,
    sttRequests,
    agentRequests,
    boundaryFailures,
    grant(index = 0) {
      const permission = permissions[index]
      if (!permission) throw new Error('Missing permission barrier')
      const stream = new FixtureStream()
      streams.push(stream)
      permission.resolve(stream)
      return stream
    },
    respond(text: string, index = 0) {
      const request = sttRequests[index]
      if (!request) throw new Error('Missing STT response barrier')
      request.response.resolve(Response.json({ text }))
    },
    activeTracks() {
      return streams.filter((stream) => stream.track.active).length
    },
    dispose() {
      for (const stream of streams) if (stream.track.active) stream.track.stop()
      for (const recorder of FixtureMediaRecorder.instances) recorder.dispose()
      for (const recognition of FixtureRecognition.instances) recognition.dispose()
      if (originalRecognition)
        Object.defineProperty(window, 'SpeechRecognition', originalRecognition)
      else Reflect.deleteProperty(window, 'SpeechRecognition')
      if (originalWebkit) Object.defineProperty(window, 'webkitSpeechRecognition', originalWebkit)
      else Reflect.deleteProperty(window, 'webkitSpeechRecognition')
      if (originalMedia) Object.defineProperty(navigator, 'mediaDevices', originalMedia)
      else Reflect.deleteProperty(navigator, 'mediaDevices')
    },
  }
}
