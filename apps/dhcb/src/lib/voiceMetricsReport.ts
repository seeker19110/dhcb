import {
  voiceEventSchema,
  diagnosticsSchema,
  type VoiceEvent,
} from '@dhcb/core-contracts/voiceMetrics'
import type { Diagnostics } from './voiceMetrics.js'

type Turn = {
  start: Extract<VoiceEvent, { event: 'turn_started' }>
  ended?: Extract<VoiceEvent, { event: 'turn_ended' }>
  capture?: number
  sttText?: number
  assistantText?: number
  firstProxy?: { time: number; proxy: 'html_audio_playing' | 'web_speech_onstart' }
  fallback: boolean
}
type Request = {
  turnId: string
  stage: string
  sent: number
  headers?: number
  firstBody?: boolean
  ended?: string
}
type Playback = { turnId: string; kind: string; started: boolean; cached?: boolean; ended?: string }
export type Evidence = 'synthetic' | 'device_run'
export type MetricStatus = 'INVALID' | 'NOT_MEASURED' | 'SYNTHETIC_ONLY' | 'MEASURED_PROXY'
export interface Quantile {
  status: MetricStatus
  n: number
  p50Ms: number | null
  p95Ms: number | null
}
function quantiles(values: number[], evidence: Evidence): Quantile {
  if (!values.length) return { status: 'NOT_MEASURED', n: 0, p50Ms: null, p95Ms: null }
  const sorted = [...values].sort((a, b) => a - b)
  return {
    status: evidence === 'synthetic' ? 'SYNTHETIC_ONLY' : 'MEASURED_PROXY',
    n: sorted.length,
    p50Ms: sorted[Math.ceil(sorted.length * 0.5) - 1] ?? null,
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1] ?? null,
  }
}
export interface Report {
  status: MetricStatus
  aggregationScope: 'mode_direction_mixed_input_cache_proxy_diagnostic'
  observedTurns: number | null
  invalidEvents: number
  reason: 'none' | 'invalid_metadata' | 'clock_or_lifecycle' | 'loss_or_pending' | 'capacity'
  cohorts: Array<{
    mode: VoiceEvent['mode']
    direction: VoiceEvent['direction']
    turns: number
    ok: number
    errors: number
    cancelled: number
    incomplete: number
    fallbackTurns: number
    microphoneTurns: number
    typedTurns: number
    replayTurns: number
    systemTurns: number
    requests: number
    requestErrors: number
    requestCancelled: number
    requestIncomplete: number
    playbackAttempts: number
    playbackErrors: number
    playbackCancelled: number
    playbackIncomplete: number
    metrics: Record<string, Quantile>
  }>
  physical: {
    audibleFirstSound: 'NOT_MEASURED'
    speechOnsetToPlaybackStop: 'NOT_MEASURED'
    clientReconnect: 'NOT_MEASURED'
    deviceNetworkPerformance: 'WAITING'
  }
}
const physical = {
  audibleFirstSound: 'NOT_MEASURED',
  speechOnsetToPlaybackStop: 'NOT_MEASURED',
  clientReconnect: 'NOT_MEASURED',
  deviceNetworkPerformance: 'WAITING',
} as const
export function aggregateVoiceWindow(
  raw: readonly unknown[],
  diagnostics: Diagnostics,
  evidence: Evidence,
): Report {
  const invalid = (reason: Report['reason'], invalidEvents = 0): Report => ({
    status: 'INVALID',
    reason,
    invalidEvents,
    aggregationScope: 'mode_direction_mixed_input_cache_proxy_diagnostic',
    observedTurns: null,
    cohorts: [],
    physical: { ...physical },
  })
  if (raw.length > 2048) return invalid('capacity')
  if (evidence !== 'synthetic' && evidence !== 'device_run') return invalid('invalid_metadata')
  if (!diagnosticsSchema.safeParse(diagnostics).success) return invalid('invalid_metadata')
  if (
    diagnostics.overflow ||
    diagnostics.dropped ||
    diagnostics.sinkErrors ||
    diagnostics.rejectedTurns ||
    diagnostics.activeSink ||
    diagnostics.queued ||
    diagnostics.emitted !== raw.length ||
    diagnostics.delivered !== raw.length
  )
    return invalid('loss_or_pending')
  if (diagnostics.invalidInput || diagnostics.invalidClock) return invalid('invalid_metadata')
  const parsed = raw.map((event) => voiceEventSchema.safeParse(event))
  const invalidEvents = parsed.filter((event) => !event.success).length
  if (invalidEvents) return invalid('invalid_metadata', invalidEvents)
  const events = parsed.flatMap((result) => (result.success ? [result.data] : []))
  const turns = new Map<string, Turn>()
  const requests = new Map<string, Request>()
  const playbacks = new Map<string, Playback>()
  const first = events[0]
  let lastTime = -1
  let sequence = 0
  for (const event of events) {
    if (
      !first ||
      event.clockId !== first.clockId ||
      event.sessionId !== first.sessionId ||
      event.sequence !== ++sequence ||
      event.elapsedMs < lastTime
    )
      return invalid('clock_or_lifecycle')
    lastTime = event.elapsedMs
    if (event.event === 'turn_started') {
      if (turns.has(event.turnId) || turns.size >= 64) return invalid('clock_or_lifecycle')
      turns.set(event.turnId, { start: event, fallback: false })
      continue
    }
    const turn = turns.get(event.turnId)
    if (!turn || turn.start.mode !== event.mode || turn.start.direction !== event.direction)
      return invalid('clock_or_lifecycle')
    // Chỉ bookkeeping của child đã tồn tại được đóng sau root; không work/proxy mới.
    if (
      turn.ended &&
      event.event !== 'response_headers' &&
      event.event !== 'request_ended' &&
      event.event !== 'playback_ended'
    )
      return invalid('clock_or_lifecycle')
    switch (event.event) {
      case 'capture_stop_requested':
        break
      case 'capture_stopped':
        if (turn.capture !== undefined) return invalid('clock_or_lifecycle')
        turn.capture = event.elapsedMs
        break
      case 'text_ready':
        if (event.stage === 'stt') {
          if (turn.sttText !== undefined) return invalid('clock_or_lifecycle')
          turn.sttText = event.elapsedMs
        } else {
          if (turn.assistantText !== undefined) return invalid('clock_or_lifecycle')
          turn.assistantText = event.elapsedMs
        }
        break
      case 'request_started':
        if (requests.has(event.requestId) || requests.size >= 256)
          return invalid('clock_or_lifecycle')
        requests.set(event.requestId, {
          turnId: event.turnId,
          stage: event.stage,
          sent: event.elapsedMs,
        })
        break
      case 'response_headers': {
        const request = requests.get(event.requestId)
        if (
          !request ||
          request.turnId !== event.turnId ||
          request.ended ||
          request.headers !== undefined
        )
          return invalid('clock_or_lifecycle')
        request.headers = event.elapsedMs
        break
      }
      case 'first_body_chunk': {
        const request = requests.get(event.requestId)
        if (
          !request ||
          request.turnId !== event.turnId ||
          request.ended ||
          request.headers === undefined ||
          request.firstBody
        )
          return invalid('clock_or_lifecycle')
        request.firstBody = true
        break
      }
      case 'request_ended': {
        const request = requests.get(event.requestId)
        if (!request || request.turnId !== event.turnId || request.ended)
          return invalid('clock_or_lifecycle')
        request.ended = event.status
        break
      }
      case 'playback_requested':
        if (playbacks.has(event.playbackId) || playbacks.size >= 128)
          return invalid('clock_or_lifecycle')
        playbacks.set(event.playbackId, { turnId: event.turnId, kind: event.kind, started: false })
        break
      case 'cache_observed': {
        const playback = playbacks.get(event.playbackId)
        if (!playback || playback.turnId !== event.turnId || playback.ended || playback.cached)
          return invalid('clock_or_lifecycle')
        playback.cached = true
        break
      }
      case 'playback_started_proxy': {
        const playback = playbacks.get(event.playbackId)
        const kind = event.proxy === 'html_audio_playing' ? 'html_audio' : 'web_speech'
        if (
          !playback ||
          playback.turnId !== event.turnId ||
          playback.ended ||
          playback.started ||
          playback.kind !== kind
        )
          return invalid('clock_or_lifecycle')
        playback.started = true
        turn.firstProxy ??= { time: event.elapsedMs, proxy: event.proxy }
        break
      }
      case 'playback_ended': {
        const playback = playbacks.get(event.playbackId)
        if (!playback || playback.turnId !== event.turnId || playback.ended)
          return invalid('clock_or_lifecycle')
        playback.ended = event.status
        break
      }
      case 'fallback':
        turn.fallback = true
        break
      case 'turn_ended':
        turn.ended = event
        break
    }
  }
  const cohorts: Report['cohorts'] = []
  for (const mode of ['companion', 'speaking'] as const)
    for (const direction of ['vi_only', 'vi_to_en', 'en_to_vi'] as const) {
      const members = [...turns.values()].filter(
        (turn) => turn.start.mode === mode && turn.start.direction === direction,
      )
      if (!members.length) continue
      const ids = new Set(members.map((turn) => turn.start.turnId))
      const cohortRequests = [...requests.values()].filter((request) => ids.has(request.turnId))
      const cohortPlaybacks = [...playbacks.values()].filter((playback) => ids.has(playback.turnId))
      const samples = new Map<string, number[]>()
      const add = (key: string, from: number | undefined, to: number | undefined) => {
        if (from === undefined || to === undefined || to < from) return
        const values = samples.get(key) ?? []
        values.push(to - from)
        samples.set(key, values)
      }
      for (const turn of members) {
        add('capture_stopped_to_stt_text', turn.capture, turn.sttText)
        if (turn.firstProxy) {
          add(`capture_stopped_to_${turn.firstProxy.proxy}`, turn.capture, turn.firstProxy.time)
          add(
            `assistant_text_to_${turn.firstProxy.proxy}`,
            turn.assistantText,
            turn.firstProxy.time,
          )
        }
      }
      for (const request of cohortRequests) {
        if (request.ended === 'ok')
          add(`${request.stage}_sent_to_headers`, request.sent, request.headers)
      }
      const metrics: Record<string, Quantile> = {}
      for (const key of [
        'capture_stopped_to_stt_text',
        'capture_stopped_to_html_audio_playing',
        'capture_stopped_to_web_speech_onstart',
        'assistant_text_to_html_audio_playing',
        'assistant_text_to_web_speech_onstart',
        'stt_sent_to_headers',
        'companion_sent_to_headers',
        'agent_sent_to_headers',
        'tts_sent_to_headers',
        'audio_download_sent_to_headers',
      ]) {
        metrics[key] = quantiles(samples.get(key) ?? [], evidence)
      }
      cohorts.push({
        mode,
        direction,
        turns: members.length,
        ok: members.filter((turn) => turn.ended?.status === 'ok').length,
        errors: members.filter((turn) => turn.ended?.status === 'error').length,
        cancelled: members.filter((turn) => turn.ended?.status === 'cancelled').length,
        incomplete: members.filter((turn) => !turn.ended).length,
        fallbackTurns: members.filter((turn) => turn.fallback).length,
        microphoneTurns: members.filter((turn) => turn.start.input === 'microphone').length,
        typedTurns: members.filter((turn) => turn.start.input === 'typed').length,
        replayTurns: members.filter((turn) => turn.start.input === 'replay').length,
        systemTurns: members.filter((turn) => turn.start.input === 'system').length,
        requests: cohortRequests.length,
        requestErrors: cohortRequests.filter((request) => request.ended === 'error').length,
        requestCancelled: cohortRequests.filter((request) => request.ended === 'cancelled').length,
        requestIncomplete: cohortRequests.filter((request) => !request.ended).length,
        playbackAttempts: cohortPlaybacks.length,
        playbackErrors: cohortPlaybacks.filter((playback) => playback.ended === 'error').length,
        playbackCancelled: cohortPlaybacks.filter((playback) => playback.ended === 'cancelled')
          .length,
        playbackIncomplete: cohortPlaybacks.filter((playback) => !playback.ended).length,
        metrics,
      })
    }
  return {
    status: cohorts.some((cohort) => Object.values(cohort.metrics).some((metric) => metric.n > 0))
      ? evidence === 'synthetic'
        ? 'SYNTHETIC_ONLY'
        : 'MEASURED_PROXY'
      : 'NOT_MEASURED',
    aggregationScope: 'mode_direction_mixed_input_cache_proxy_diagnostic',
    observedTurns: turns.size,
    invalidEvents: 0,
    reason: 'none',
    cohorts,
    physical: { ...physical },
  }
}
