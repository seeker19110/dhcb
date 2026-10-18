import {
  voiceEventSchema,
  turnOptionsSchema,
  playbackOptionsSchema,
  reasonSchema,
  statusSchema,
  stageSchema,
  cacheSchema,
  type VoiceEvent,
  type TurnOptions,
  type PlaybackOptions,
  type Reason,
  type Status,
  type Stage,
  type Cache,
  type FallbackPath,
} from '@dhcb/core-contracts/voiceMetrics'

export interface RequestHandle {
  headers(): void
  firstBodyChunk(): void
  end(status: Status, reason?: Reason): void
}
export interface PlaybackHandle {
  cache(value: Cache): void
  started(): void
  end(status: Status, reason?: Reason): void
}
export interface TurnHandle {
  isOpen(): boolean
  capture(value: 'stop_requested' | 'stopped'): void
  textReady(stage: 'stt' | 'assistant'): void
  request(stage: Stage, attempt?: 1 | 2): RequestHandle
  playback(options: PlaybackOptions): PlaybackHandle
  fallback(path: FallbackPath, reason: Reason): void
  end(status: Status, reason?: Reason): void
}
export type { Diagnostics } from '@dhcb/core-contracts/voiceMetrics'
import type { Diagnostics } from '@dhcb/core-contracts/voiceMetrics'
export interface Observer {
  startTurn(options: TurnOptions): TurnHandle
  diagnostics(): Diagnostics
  dispose(): void
}
const nothing = () => {}
const noRequest: RequestHandle = Object.freeze({
  headers: nothing,
  firstBodyChunk: nothing,
  end: nothing,
})
const noPlayback: PlaybackHandle = Object.freeze({ cache: nothing, started: nothing, end: nothing })
const noTurn: TurnHandle = Object.freeze({
  isOpen: () => false,
  capture: nothing,
  textReady: nothing,
  request: () => noRequest,
  playback: () => noPlayback,
  fallback: nothing,
  end: nothing,
})
const emptyDiagnostics = (): Diagnostics => ({
  emitted: 0,
  delivered: 0,
  dropped: 0,
  sinkErrors: 0,
  invalidInput: 0,
  invalidClock: 0,
  rejectedTurns: 0,
  overflow: false,
  activeSink: false,
  queued: 0,
})
const noDiagnostics = Object.freeze(emptyDiagnostics())
const noObserver: Observer = Object.freeze({
  startTurn: () => noTurn,
  diagnostics: () => noDiagnostics,
  dispose: nothing,
})
export interface ObserverOptions {
  enabled?: boolean
  sink?: (event: Readonly<VoiceEvent>) => void | Promise<void>
  now?: () => number
  randomId?: () => string
}

// DEBT: cửa sổ quan sát hữu hạn, không collector/persistence | trần: 64 turns/256 requests/128 playbacks/2048 events/64 queued + 1 in-flight | xem lại khi: có thiết kế collector và ngân sách thiết bị được duyệt
export function createVoiceObserver(options: ObserverOptions = {}): Observer {
  if (options.enabled !== true || !options.sink) return noObserver
  const diagnostics = emptyDiagnostics()
  const sink = options.sink
  const now = options.now ?? (() => performance.now())
  const randomId = options.randomId ?? (() => crypto.randomUUID())
  let sessionId: string
  let clockId: string
  let origin: number
  try {
    sessionId = randomId()
    clockId = randomId()
    origin = now()
    if (!Number.isFinite(origin) || origin < 0) throw new Error()
  } catch {
    diagnostics.invalidClock++
    return { startTurn: () => noTurn, diagnostics: () => ({ ...diagnostics }), dispose: nothing }
  }
  let disposed = false
  let last = origin
  let turns = 0
  let requests = 0
  let playbacks = 0
  let scheduled = false
  const queue: VoiceEvent[] = []
  const reject = () => {
    diagnostics.invalidInput = Math.min(Number.MAX_SAFE_INTEGER, diagnostics.invalidInput + 1)
  }
  const overflow = () => {
    diagnostics.overflow = true
    diagnostics.dropped = Math.min(Number.MAX_SAFE_INTEGER, diagnostics.dropped + 1)
  }
  const flush = async () => {
    scheduled = false
    if (diagnostics.activeSink || disposed) return
    diagnostics.activeSink = true
    try {
      while (!disposed && queue.length) {
        const item = queue.shift()
        if (!item) break
        try {
          await sink(Object.freeze(item))
          diagnostics.delivered++
        } catch {
          diagnostics.sinkErrors++
        }
      }
    } finally {
      diagnostics.activeSink = false
    }
  }
  const emit = (turnId: string, turn: TurnOptions, fields: Record<string, unknown>) => {
    if (disposed || diagnostics.invalidClock) return
    if (diagnostics.emitted >= 2048 || queue.length >= 64) {
      overflow()
      return
    }
    let elapsedMs: number
    try {
      const current = now()
      if (!Number.isFinite(current) || current < last || current - origin > 86_400_000) {
        diagnostics.invalidClock++
        return
      }
      last = current
      elapsedMs = current - origin
    } catch {
      diagnostics.invalidClock++
      return
    }
    const result = voiceEventSchema.safeParse({
      version: 1,
      clock: 'client_monotonic',
      sessionId,
      clockId,
      turnId,
      mode: turn.mode,
      direction: turn.direction,
      elapsedMs,
      sequence: diagnostics.emitted + 1,
      ...fields,
    })
    if (!result.success) {
      reject()
      return
    }
    diagnostics.emitted++
    queue.push(result.data)
    if (!scheduled && !diagnostics.activeSink) {
      scheduled = true
      queueMicrotask(() => {
        void flush()
      })
    }
  }
  const id = (): string | null => {
    try {
      return randomId()
    } catch {
      reject()
      return null
    }
  }
  return {
    startTurn(input) {
      if (disposed || diagnostics.invalidClock) return noTurn
      if (turns >= 64) {
        diagnostics.rejectedTurns = Math.min(Number.MAX_SAFE_INTEGER, diagnostics.rejectedTurns + 1)
        overflow()
        return noTurn
      }
      const parsed = turnOptionsSchema.safeParse(input)
      if (!parsed.success) {
        reject()
        return noTurn
      }
      const turnId = id()
      if (!turnId) return noTurn
      const turn = parsed.data
      turns++
      let open = true
      const once = new Set<string>()
      const push = (fields: Record<string, unknown>) => {
        if (open && !disposed) emit(turnId, turn, fields)
      }
      const unique = (key: string, fields: Record<string, unknown>) => {
        if (!once.has(key)) {
          once.add(key)
          push(fields)
        }
      }
      push({ event: 'turn_started', input: turn.input })
      return {
        isOpen: () => open && !disposed && !diagnostics.invalidClock,
        capture(value) {
          if (value !== 'stop_requested' && value !== 'stopped') {
            reject()
            return
          }
          unique(value, {
            event: value === 'stopped' ? 'capture_stopped' : 'capture_stop_requested',
          })
        },
        textReady(stage) {
          if (stage !== 'stt' && stage !== 'assistant') {
            reject()
            return
          }
          unique(stage, { event: 'text_ready', stage })
        },
        request(stage, attempt = 1) {
          if (!open || disposed) {
            if (!open && !disposed)
              diagnostics.dropped = Math.min(Number.MAX_SAFE_INTEGER, diagnostics.dropped + 1)
            return noRequest
          }
          if (!stageSchema.safeParse(stage).success || (attempt !== 1 && attempt !== 2)) {
            reject()
            return noRequest
          }
          if (requests >= 256) {
            overflow()
            return noRequest
          }
          const requestId = id()
          if (!requestId) return noRequest
          requests++
          let active = true
          let headers = false
          let firstBody = false
          push({ event: 'request_started', requestId, stage, attempt })
          return {
            headers() {
              if (active && !headers) {
                headers = true
                emit(turnId, turn, { event: 'response_headers', requestId })
              }
            },
            firstBodyChunk() {
              if (open && active && headers && !firstBody) {
                firstBody = true
                push({ event: 'first_body_chunk', requestId })
              }
            },
            end(status, reason = status === 'ok' ? 'none' : 'unknown') {
              if (!active) return
              if (
                !statusSchema.safeParse(status).success ||
                !reasonSchema.safeParse(reason).success
              ) {
                reject()
                return
              }
              active = false
              emit(turnId, turn, { event: 'request_ended', requestId, status, reason })
            },
          }
        },
        playback(input) {
          if (!open || disposed) {
            if (!open && !disposed)
              diagnostics.dropped = Math.min(Number.MAX_SAFE_INTEGER, diagnostics.dropped + 1)
            return noPlayback
          }
          const parsed = playbackOptionsSchema.safeParse(input)
          if (!parsed.success) {
            reject()
            return noPlayback
          }
          if (playbacks >= 128) {
            overflow()
            return noPlayback
          }
          const playbackId = id()
          if (!playbackId) return noPlayback
          playbacks++
          let active = true
          let started = false
          let cached = false
          push({ event: 'playback_requested', playbackId, ...parsed.data })
          return {
            cache(cache) {
              if (!active || cached) return
              if (!cacheSchema.safeParse(cache).success) {
                reject()
                return
              }
              cached = true
              push({ event: 'cache_observed', playbackId, cache })
            },
            started() {
              if (!active || started) return
              started = true
              push({
                event: 'playback_started_proxy',
                playbackId,
                proxy:
                  parsed.data.kind === 'html_audio' ? 'html_audio_playing' : 'web_speech_onstart',
              })
            },
            end(status, reason = status === 'ok' ? 'none' : 'unknown') {
              if (!active) return
              if (
                !statusSchema.safeParse(status).success ||
                !reasonSchema.safeParse(reason).success
              ) {
                reject()
                return
              }
              active = false
              emit(turnId, turn, { event: 'playback_ended', playbackId, status, reason })
            },
          }
        },
        fallback(path, reason) {
          if (
            (path !== 'server_stt_to_browser' && path !== 'server_tts_to_web_speech') ||
            !reasonSchema.safeParse(reason).success
          ) {
            reject()
            return
          }
          push({ event: 'fallback', path, reason })
        },
        end(status, reason = status === 'ok' ? 'none' : 'unknown') {
          if (!open) return
          if (!statusSchema.safeParse(status).success || !reasonSchema.safeParse(reason).success) {
            reject()
            return
          }
          push({ event: 'turn_ended', status, reason })
          open = false
        },
      }
    },
    diagnostics: () => ({ ...diagnostics, queued: queue.length }),
    dispose() {
      disposed = true
      diagnostics.dropped = Math.min(Number.MAX_SAFE_INTEGER, diagnostics.dropped + queue.length)
      queue.length = 0
    },
  }
}

// Singleton local được bật rõ ràng trong voiceMetricsLocal; core không tự thu thập.
