import { describe, it, expect } from 'vitest'
import { createVoiceObserver, type ObserverOptions } from './voiceMetrics'
import { voiceEventSchema, type VoiceEvent } from '@dhcb/core-contracts/voiceMetrics'
import { aggregateVoiceWindow } from './voiceMetricsReport'

const options = { mode: 'speaking', direction: 'vi_to_en', input: 'microphone' } as const
async function flush() {
  for (let i = 0; i < 100; i++) await Promise.resolve()
}
function fixture(extra: ObserverOptions = {}) {
  let time = 100
  const events: VoiceEvent[] = []
  const observer = createVoiceObserver({
    enabled: true,
    now: () => time,
    sink: (event) => {
      events.push(event)
    },
    ...extra,
  })
  return {
    observer,
    events,
    at: (value: number) => {
      time = value
    },
    report: () => aggregateVoiceWindow(events, observer.diagnostics(), 'synthetic'),
  }
}
async function sample(delay: number) {
  const f = fixture()
  const t = f.observer.startTurn(options)
  t.capture('stopped')
  f.at(150)
  t.textReady('stt')
  f.at(200)
  t.textReady('assistant')
  const p = t.playback({ kind: 'html_audio', segment: 'speech' })
  p.cache('local_hit')
  f.at(100 + delay)
  p.started()
  p.end('ok')
  t.end('ok')
  await flush()
  return f
}

describe('observer metadata default-off và fail-open', () => {
  it('mặc định không gọi clock/id/sink', () => {
    const broken = () => {
      throw new Error('RAW_CANARY')
    }
    const o = createVoiceObserver({ now: broken, randomId: broken, sink: broken })
    const t = o.startTurn(options)
    t.capture('stopped')
    t.request('stt').headers()
    t.playback({ kind: 'html_audio', segment: 'speech' }).started()
    t.end('ok')
    expect(o.diagnostics().emitted).toBe(0)
  })
  it('enabled không sink vẫn không collector', () => {
    expect(
      createVoiceObserver({
        enabled: true,
        now: () => {
          throw new Error()
        },
      })
        .startTurn(options)
        .isOpen(),
    ).toBe(false)
  })
  it('clock/id factory ném không thoát vào luồng voice', () => {
    expect(() =>
      fixture({
        now: () => {
          throw new Error('SECRET')
        },
      }),
    ).not.toThrow()
    expect(() =>
      fixture({
        randomId: () => {
          throw new Error('SECRET')
        },
      }),
    ).not.toThrow()
  })
  it('sink sync throw không đổi trả lời hoặc số fallback', async () => {
    const f = fixture({
      sink: () => {
        throw new Error('RAW_CANARY')
      },
    })
    let requests = 0
    let fallback = 0
    async function flow() {
      const t = f.observer.startTurn(options)
      requests++
      t.request('tts').end('ok')
      try {
        return 'same-response'
      } catch {
        fallback++
        return ''
      }
    }
    expect(await flow()).toBe('same-response')
    await flush()
    expect({ requests, fallback }).toEqual({ requests: 1, fallback: 0 })
    expect(f.observer.diagnostics().sinkErrors).toBeGreaterThan(0)
    expect(JSON.stringify(f.report())).not.toContain('RAW_CANARY')
    expect(f.report().status).toBe('INVALID')
  })
  it('sink rejected Promise không đổi luồng và không unhandled rejection', async () => {
    const f = fixture({ sink: () => Promise.reject(new Error('RAW_CANARY')) })
    f.observer.startTurn(options).end('ok')
    await flush()
    expect(f.observer.diagnostics().sinkErrors).toBe(2)
  })
  it('sink không bao giờ settle chỉ giữ 1 in-flight + 64 queued', async () => {
    const f = fixture({ sink: () => new Promise<void>(() => {}) })
    f.observer.startTurn(options)
    await Promise.resolve()
    for (let i = 0; i < 80; i++) f.observer.startTurn(options)
    expect(f.observer.diagnostics().queued).toBeLessThanOrEqual(64)
    expect(f.observer.diagnostics().activeSink).toBe(true)
    expect(f.report().status).toBe('INVALID')
    f.observer.dispose()
    expect(f.observer.diagnostics().queued).toBe(0)
  })
  it('canary ở options extra bị strict Zod loại', () => {
    const f = fixture()
    const poisoned = { ...options, content: 'PRIVATE_CANARY', userId: 'PRIVATE_CANARY' }
    expect(f.observer.startTurn(poisoned).isOpen()).toBe(false)
    expect(f.events).toEqual([])
  })
  it.each(['transcript', 'audio', 'url', 'cacheHash', 'deviceId', 'userId', 'error', 'language'])(
    'DTO cấm field %s',
    async (key) => {
      const f = await sample(200)
      expect(voiceEventSchema.safeParse({ ...f.events[0], [key]: 'PRIVATE_CANARY' }).success).toBe(
        false,
      )
    },
  )
  it('IDs là UUID mới, session/clock tách biệt, không nhận identity caller', async () => {
    const f = await sample(200)
    const first = f.events[0]
    expect(first).toBeDefined()
    expect(new Set(f.events.map((e) => e.clockId)).size).toBe(1)
    expect(first?.sessionId).not.toBe(first?.clockId)
    expect(first?.turnId).not.toBe(first?.sessionId)
    expect(f.events.every((event) => voiceEventSchema.safeParse(event).success)).toBe(true)
  })
})

describe('lifecycle/clock bounded', () => {
  it('cancel không sinh playing từ callback cũ nhưng giữ terminal bookkeeping', async () => {
    const f = fixture()
    const t = f.observer.startTurn(options)
    const old = t.playback({ kind: 'html_audio', segment: 'speech' })
    old.end('cancelled', 'superseded')
    const next = t.playback({ kind: 'html_audio', segment: 'speech' })
    old.started()
    next.started()
    next.started()
    t.end('cancelled', 'route_leave')
    next.end('ok')
    t.textReady('assistant')
    await flush()
    expect(f.events.filter((e) => e.event === 'playback_started_proxy')).toHaveLength(1)
    expect(f.report().cohorts[0]?.cancelled).toBe(1)
    expect(f.report().cohorts[0]?.playbackIncomplete).toBe(0)
  })
  it('resume duplicate playing chỉ có một proxy', async () => {
    const f = fixture()
    const p = f.observer.startTurn(options).playback({ kind: 'html_audio', segment: 'speech' })
    p.started()
    p.started()
    p.started()
    await flush()
    expect(f.events.filter((e) => e.event === 'playback_started_proxy')).toHaveLength(1)
  })
  it('WebSpeech onstart proxy tách khỏi HTMLAudio, fallback không đếm turn đôi', async () => {
    const f = fixture()
    const t = f.observer.startTurn(options)
    t.capture('stopped')
    const html = t.playback({ kind: 'html_audio', segment: 'speech' })
    html.end('error', 'autoplay')
    t.fallback('server_tts_to_web_speech', 'autoplay')
    const web = t.playback({ kind: 'web_speech', segment: 'speech' })
    f.at(500)
    web.started()
    web.end('ok')
    t.end('ok')
    await flush()
    const c = f.report().cohorts[0]
    expect(c?.turns).toBe(1)
    expect(c?.fallbackTurns).toBe(1)
    expect(c?.metrics.capture_stopped_to_web_speech_onstart?.n).toBe(1)
    expect(c?.metrics.capture_stopped_to_html_audio_playing?.n).toBe(0)
  })
  it('429 retry là hai request IDs/attempts, chỉ ok headers vào latency', async () => {
    const f = fixture()
    const t = f.observer.startTurn(options)
    const a = t.request('tts', 1)
    a.headers()
    a.end('error', 'http')
    f.at(1300)
    const b = t.request('tts', 2)
    f.at(1400)
    b.headers()
    b.end('ok')
    t.end('ok')
    await flush()
    const started = f.events.filter((e) => e.event === 'request_started')
    expect(started).toHaveLength(2)
    expect(started[0]?.requestId).not.toBe(started[1]?.requestId)
    expect(f.report().cohorts[0]?.requests).toBe(2)
    expect(f.report().cohorts[0]?.requestErrors).toBe(1)
    expect(f.report().cohorts[0]?.metrics.tts_sent_to_headers?.p50Ms).toBe(100)
  })
  it('headers khác first body chunk; không giả first-byte cho fetch resolve', async () => {
    const f = fixture()
    const r = f.observer.startTurn(options).request('companion')
    r.headers()
    await flush()
    expect(f.events.filter((e) => e.event === 'first_body_chunk')).toHaveLength(0)
    r.firstBodyChunk()
    r.firstBodyChunk()
    await flush()
    expect(f.events.filter((e) => e.event === 'first_body_chunk')).toHaveLength(1)
  })
  it('timeout/error/incomplete vẫn trong denominator; unknown không thành 0', async () => {
    const f = fixture()
    const a = f.observer.startTurn(options)
    a.request('stt').end('error', 'timeout')
    a.end('error', 'timeout')
    const b = f.observer.startTurn(options)
    b.request('tts')
    b.end('cancelled', 'route_leave')
    f.observer.startTurn(options)
    await flush()
    const c = f.report().cohorts[0]
    expect([c?.turns, c?.errors, c?.cancelled, c?.incomplete, c?.requestIncomplete]).toEqual([
      3, 1, 1, 1, 1,
    ])
    expect(c?.metrics.capture_stopped_to_html_audio_playing).toEqual({
      status: 'NOT_MEASURED',
      n: 0,
      p50Ms: null,
      p95Ms: null,
    })
  })
  it('clock đảo chiều làm window INVALID', async () => {
    const f = fixture()
    const t = f.observer.startTurn(options)
    f.at(99)
    t.end('ok')
    await flush()
    expect(f.observer.diagnostics().invalidClock).toBe(1)
    expect(f.report().status).toBe('INVALID')
  })
  it.each([NaN, Infinity, -1, 86_400_101])('clock không hợp lệ %s fail-open', async (value) => {
    const f = fixture()
    const t = f.observer.startTurn(options)
    f.at(value)
    expect(() => t.end('ok')).not.toThrow()
    await flush()
    expect(f.report().status).toBe('INVALID')
  })
  it('capacity overflow không báo đủ sample', async () => {
    const f = fixture()
    for (let i = 0; i < 70; i++) {
      f.observer.startTurn(options).end('ok')
      await flush()
    }
    expect(f.observer.diagnostics().overflow).toBe(true)
    expect(f.report().status).toBe('INVALID')
    expect(f.report().cohorts).toEqual([])
  })
  it('sink microtask pending chưa thành report đủ mẫu', () => {
    const f = fixture()
    f.observer.startTurn(options).end('ok')
    expect(f.report().reason).toBe('loss_or_pending')
  })
})

describe('aggregator oracles', () => {
  it('120 ms chính xác; seconds mutation thất bại equality (không tự phát hiện unit bằng finite number)', async () => {
    const f = await sample(220)
    expect(f.report().cohorts[0]?.metrics.assistant_text_to_html_audio_playing?.p50Ms).toBe(120)
    const mutated = f.events.map((e) => ({ ...e, elapsedMs: e.elapsedMs / 1000 }))
    const wrong = aggregateVoiceWindow(mutated, f.observer.diagnostics(), 'synthetic')
    expect(wrong.cohorts[0]?.metrics.assistant_text_to_html_audio_playing?.p50Ms).not.toBe(120)
  })
  it('trộn clockId bị loại dù duration dương', async () => {
    const f = await sample(200)
    const changed = f.events.map((e, i) => (i === 1 ? { ...e, clockId: crypto.randomUUID() } : e))
    expect(aggregateVoiceWindow(changed, f.observer.diagnostics(), 'synthetic').reason).toBe(
      'clock_or_lifecycle',
    )
  })
  it('trộn session hoặc requestId của turn khác bị loại', async () => {
    const f = fixture()
    const a = f.observer.startTurn(options)
    a.request('stt').headers()
    const b = f.observer.startTurn(options)
    b.end('ok')
    await flush()
    const other = f.events.find(
      (e) => e.event === 'turn_started' && e.turnId !== f.events[0]?.turnId,
    )
    const mutated = f.events.map((e) =>
      e.event === 'response_headers' ? { ...e, turnId: other?.turnId } : e,
    )
    expect(aggregateVoiceWindow(mutated, f.observer.diagnostics(), 'synthetic').status).toBe(
      'INVALID',
    )
  })
  it('event missing/gap bị loại, không tính phần còn lại', async () => {
    const f = await sample(200)
    const changed = f.events.filter((_, i) => i !== 1)
    expect(aggregateVoiceWindow(changed, f.observer.diagnostics(), 'synthetic').status).toBe(
      'INVALID',
    )
  })
  it('fake clock luôn SYNTHETIC_ONLY và physical NOT_MEASURED', async () => {
    const f = await sample(200)
    expect(f.report().status).toBe('SYNTHETIC_ONLY')
    expect(f.report().physical).toEqual({
      audibleFirstSound: 'NOT_MEASURED',
      speechOnsetToPlaybackStop: 'NOT_MEASURED',
      clientReconnect: 'NOT_MEASURED',
      deviceNetworkPerformance: 'WAITING',
    })
  })
  it('không events là NOT_MEASURED; raw oversized INVALID', () => {
    const f = fixture()
    expect(f.report().status).toBe('NOT_MEASURED')
    expect(
      aggregateVoiceWindow(
        Array.from({ length: 2049 }, () => ({})),
        f.observer.diagnostics(),
        'synthetic',
      ).reason,
    ).toBe('capacity')
  })
  it('nearest-rank p50/p95 nguyên mẫu, hai direction riêng và không ghép feedback thành turn hai', async () => {
    const f = fixture()
    for (let i = 1; i <= 20; i++) {
      f.at(100 + i * 1000)
      const t = f.observer.startTurn(options)
      t.capture('stopped')
      const speech = t.playback({ kind: 'html_audio', segment: 'speech' })
      f.at(100 + i * 1000 + i)
      speech.started()
      speech.end('ok')
      const feedback = t.playback({ kind: 'web_speech', segment: 'feedback' })
      feedback.started()
      feedback.end('ok')
      t.end('ok')
      await flush()
    }
    const reverse = f.observer.startTurn({ ...options, direction: 'en_to_vi', input: 'typed' })
    reverse.end('error', 'network')
    await flush()
    const report = f.report()
    const c = report.cohorts[0]
    expect(c?.metrics.capture_stopped_to_html_audio_playing).toEqual({
      status: 'SYNTHETIC_ONLY',
      n: 20,
      p50Ms: 10,
      p95Ms: 19,
    })
    expect(c?.metrics.capture_stopped_to_web_speech_onstart?.n).toBe(0)
    expect(report.cohorts[1]?.errors).toBe(1)
    expect(report.observedTurns).toBe(21)
  })
})
