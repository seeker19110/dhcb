import { describe, expect, it } from 'vitest'
import { createVoiceObserver, type Diagnostics } from './voiceMetrics'
import { aggregateVoiceWindow } from './voiceMetricsReport'
import type { VoiceEvent } from '@dhcb/core-contracts/voiceMetrics'

const options = { mode: 'speaking', direction: 'vi_to_en', input: 'microphone' } as const
async function settle() {
  for (let i = 0; i < 100; i++) await Promise.resolve()
}
function fixture() {
  const events: VoiceEvent[] = []
  let time = 10
  const observer = createVoiceObserver({
    enabled: true,
    now: () => time++,
    sink: (event) => {
      events.push(event)
    },
  })
  return { events, observer }
}
function completeDiagnostics(n: number): Diagnostics {
  return {
    emitted: n,
    delivered: n,
    dropped: 0,
    sinkErrors: 0,
    invalidInput: 0,
    invalidClock: 0,
    rejectedTurns: 0,
    overflow: false,
    activeSink: false,
    queued: 0,
  }
}

describe('root terminal không xóa bookkeeping child thật', () => {
  it('request sent trước cancel nhận late headers/terminal đúng ID, không thành cancelled/zero', async () => {
    const f = fixture()
    const turn = f.observer.startTurn(options)
    const request = turn.request('stt')
    turn.end('cancelled', 'route_leave')
    request.headers()
    request.end('ok')
    request.end('error', 'network')
    await settle()
    expect(f.events.map((e) => e.event)).toEqual([
      'turn_started',
      'request_started',
      'turn_ended',
      'response_headers',
      'request_ended',
    ])
    const report = aggregateVoiceWindow(f.events, f.observer.diagnostics(), 'synthetic')
    expect(report.status).toBe('SYNTHETIC_ONLY')
    expect(report.cohorts[0]).toMatchObject({
      turns: 1,
      cancelled: 1,
      requests: 1,
      requestCancelled: 0,
      requestIncomplete: 0,
    })
  })
  it('existing playback được end muộn do cleanup ordering, không callback playing muộn', async () => {
    const f = fixture()
    const turn = f.observer.startTurn(options)
    const playback = turn.playback({ kind: 'html_audio', segment: 'speech' })
    turn.end('cancelled', 'superseded')
    playback.started()
    playback.cache('local_hit')
    playback.end('cancelled', 'superseded')
    playback.end('ok')
    await settle()
    expect(f.events.map((e) => e.event)).toEqual([
      'turn_started',
      'playback_requested',
      'turn_ended',
      'playback_ended',
    ])
    expect(
      aggregateVoiceWindow(f.events, f.observer.diagnostics(), 'synthetic').cohorts[0],
    ).toMatchObject({ playbackCancelled: 1, playbackIncomplete: 0 })
  })
  it('root closed không tạo work/text/proxy/first-body nhưng child chưa có terminal vẫn unknown', async () => {
    const f = fixture()
    const turn = f.observer.startTurn(options)
    const request = turn.request('agent')
    request.headers()
    turn.end('cancelled', 'user')
    request.firstBodyChunk()
    turn.request('tts').end('ok')
    turn.playback({ kind: 'web_speech', segment: 'speech' }).started()
    turn.textReady('assistant')
    turn.capture('stopped')
    turn.fallback('server_tts_to_web_speech', 'media')
    await settle()
    expect(f.events.map((e) => e.event)).toEqual([
      'turn_started',
      'request_started',
      'response_headers',
      'turn_ended',
    ])
    expect(f.observer.diagnostics().dropped).toBe(2)
    expect(aggregateVoiceWindow(f.events, f.observer.diagnostics(), 'synthetic').status).toBe(
      'INVALID',
    )
  })
  it('aggregator nhận manual frames late child đúng IDs từ baseline thật', async () => {
    const f = fixture()
    const turn = f.observer.startTurn(options)
    turn.request('agent')
    turn.end('cancelled', 'route_leave')
    await settle()
    const started = f.events.find((e) => e.event === 'request_started')
    const last = f.events.at(-1)
    if (!started || started.event !== 'request_started' || !last)
      throw new Error('fixture missing request')
    const events = [
      ...f.events,
      {
        ...last,
        event: 'response_headers',
        requestId: started.requestId,
        elapsedMs: 20,
        sequence: 4,
      },
      {
        ...last,
        event: 'request_ended',
        requestId: started.requestId,
        status: 'ok',
        reason: 'none',
        elapsedMs: 25,
        sequence: 5,
      },
    ]
    // Build strict frames, not turn-ended extras, to avoid a schema false red.
    const clean = events.map(({ ...e }) => {
      if (e.event === 'response_headers') {
        const { status, reason, ...rest } = e as typeof e & { status?: string; reason?: string }
        expect(status).toBe('cancelled')
        expect(reason).toBe('route_leave')
        return rest
      }
      return e
    })
    const report = aggregateVoiceWindow(clean, completeDiagnostics(clean.length), 'synthetic')
    expect(report.status).toBe('SYNTHETIC_ONLY')
    expect(report.cohorts[0]?.metrics.agent_sent_to_headers?.n).toBe(1)
    const poisoned = clean.map((e) =>
      e.event === 'response_headers' ? { ...e, turnId: crypto.randomUUID() } : e,
    )
    expect(
      aggregateVoiceWindow(poisoned, completeDiagnostics(poisoned.length), 'synthetic').status,
    ).toBe('INVALID')
  })
  it('aggregator không chấp nhận late request-start hoặc proxy dù metadata hợp lệ', async () => {
    const f = fixture()
    const turn = f.observer.startTurn(options)
    const p = turn.playback({ kind: 'html_audio', segment: 'speech' })
    p.started()
    p.end('ok')
    turn.end('ok')
    await settle()
    const proxy = f.events.find((e) => e.event === 'playback_started_proxy')
    const last = f.events.at(-1)
    if (!proxy || !last) throw new Error('fixture missing proxy')
    const late = [
      ...f.events,
      { ...proxy, sequence: f.events.length + 1, elapsedMs: last.elapsedMs + 1 },
    ]
    expect(aggregateVoiceWindow(late, completeDiagnostics(late.length), 'synthetic').status).toBe(
      'INVALID',
    )
  })
})
