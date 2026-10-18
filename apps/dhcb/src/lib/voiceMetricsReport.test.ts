import { describe, expect, it } from 'vitest'
import { createVoiceObserver } from './voiceMetrics'
import { aggregateVoiceWindow } from './voiceMetricsReport'
import type { VoiceEvent } from '@dhcb/core-contracts/voiceMetrics'
async function settle() {
  for (let i = 0; i < 100; i++) await Promise.resolve()
}
async function mixedWindow() {
  const events: VoiceEvent[] = []
  let time = 0
  const observer = createVoiceObserver({
    enabled: true,
    now: () => time++,
    sink: (event) => {
      events.push(event)
    },
  })
  for (const input of ['microphone', 'typed'] as const) {
    const turn = observer.startTurn({ mode: 'speaking', direction: 'vi_to_en', input })
    turn.textReady('assistant')
    const playback = turn.playback({ kind: 'html_audio', segment: 'speech' })
    playback.cache(input === 'microphone' ? 'local_hit' : 'local_miss')
    playback.started()
    playback.end('ok')
    turn.end('ok')
    await settle()
  }
  return { events, observer }
}
describe('report không biến diagnostic gộp hoặc loss thành nghiệm thu', () => {
  it('mixed input/cache có machine-readable aggregation scope và mẫu số input riêng', async () => {
    const f = await mixedWindow()
    const report = aggregateVoiceWindow(f.events, f.observer.diagnostics(), 'synthetic')
    expect(report).toMatchObject({
      aggregationScope: 'mode_direction_mixed_input_cache_proxy_diagnostic',
      status: 'SYNTHETIC_ONLY',
      observedTurns: 2,
    })
    expect(report.cohorts[0]).toMatchObject({
      turns: 2,
      microphoneTurns: 1,
      typedTurns: 1,
      playbackAttempts: 2,
      metrics: { assistant_text_to_html_audio_playing: { n: 2, status: 'SYNTHETIC_ONLY' } },
    })
    expect(report.physical.audibleFirstSound).toBe('NOT_MEASURED')
  })
  it('dropped window giữ denominator unknown/null, không giả observedTurns=0 hoặc canonical quantiles', async () => {
    const f = await mixedWindow()
    const report = aggregateVoiceWindow(
      f.events,
      { ...f.observer.diagnostics(), dropped: 1 },
      'synthetic',
    )
    expect(report).toMatchObject({
      aggregationScope: 'mode_direction_mixed_input_cache_proxy_diagnostic',
      status: 'INVALID',
      observedTurns: null,
      reason: 'loss_or_pending',
      cohorts: [],
    })
    expect(report.observedTurns).not.toBe(0)
    expect(JSON.stringify(report)).not.toMatch(/p50Ms|p95Ms/)
  })
})

for (const path of ['normal', 'invalid'] as const) {
  it('physical DTO mutation không contaminate fresh ' + path + ' report', async () => {
    const f = await mixedWindow()
    const first = aggregateVoiceWindow(f.events, f.observer.diagnostics(), 'synthetic')
    Reflect.set(first.physical, 'audibleFirstSound', 'PRIVATE_FORGED_MEASURED')
    try {
      const diagnostics =
        path === 'invalid' ? { ...f.observer.diagnostics(), dropped: 1 } : f.observer.diagnostics()
      const next = aggregateVoiceWindow(f.events, diagnostics, 'synthetic')
      expect(next.physical).toEqual({
        audibleFirstSound: 'NOT_MEASURED',
        speechOnsetToPlaybackStop: 'NOT_MEASURED',
        clientReconnect: 'NOT_MEASURED',
        deviceNetworkPerformance: 'WAITING',
      })
      expect(JSON.stringify(next)).not.toContain('PRIVATE_FORGED_MEASURED')
    } finally {
      Reflect.set(first.physical, 'audibleFirstSound', 'NOT_MEASURED')
    }
  })
}
