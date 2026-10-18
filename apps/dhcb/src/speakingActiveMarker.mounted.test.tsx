// Mounted resource probe nhỏ, reuse shared actual-page harness read-only; không fake component ownership.
import { describe, it, expect, vi } from 'vitest'
import { setStoredToken } from '@core/authHeader'
import {
  boundary,
  container,
  button,
  sendServerRecording,
  fixture,
  renderSpeaking,
  openSpeaking,
  click,
  drain,
  advance,
} from './speakingReviewHarness'

describe('Independent active capture marker-only resource ownership', () => {
  it('CONTROL same marker manual stop releases microphone and uploads once', async () => {
    await openSpeaking('A')
    await click('Bắt đầu ghi âm')
    fixture.grant()
    await drain()
    expect(fixture.activeTracks()).toBe(1)
    await click('Dừng ghi âm')
    expect(fixture.activeTracks()).toBe(0)
    expect(fixture.sttRequests).toHaveLength(1)
    fixture.respond('')
    await drain()
  })
  it('marker rotation without React rerender: manual stop must release own mic without uploading', async () => {
    await openSpeaking('A')
    await click('Bắt đầu ghi âm')
    fixture.grant()
    await drain()
    expect(fixture.activeTracks()).toBe(1)
    setStoredToken()
    await click('Dừng ghi âm')
    expect(fixture.sttRequests).toHaveLength(0)
    expect(fixture.agentRequests).toHaveLength(0)
    expect(boundary.speakBilingual).not.toHaveBeenCalled()
    expect(fixture.activeTracks(), 'STALE_MARKER_MANUAL_STOP_RETAINS_LIVE_MIC').toBe(0)
  })
  it('marker rotation without React rerender: max-recording timeout must release own mic', async () => {
    await openSpeaking('A')
    await click('Bắt đầu ghi âm')
    fixture.grant()
    await drain()
    expect(fixture.activeTracks()).toBe(1)
    setStoredToken()
    await advance(60000)
    expect(fixture.sttRequests).toHaveLength(0)
    expect(fixture.agentRequests).toHaveLength(0)
    expect(boundary.speakBilingual).not.toHaveBeenCalled()
    expect(fixture.activeTracks(), 'STALE_MARKER_MAX_TIMEOUT_RETAINS_LIVE_MIC').toBe(0)
  })

  it('CONTROL retained old timeout cannot cancel a replacement recording owner', async () => {
    const timers = vi.spyOn(globalThis, 'setTimeout')
    await openSpeaking('A')
    await click('Bắt đầu ghi âm')
    fixture.grant()
    await drain()
    const staleTimeout = timers.mock.calls.find((call) => call[1] === 60000)?.[0]
    if (typeof staleTimeout !== 'function') throw new Error('MISSING_ACTUAL_RECORDER_TIMEOUT')
    setStoredToken()
    await renderSpeaking()
    await click('Bắt đầu luyện nói')
    await advance(5000)
    fixture.agentRequests.length = 0
    boundary.speakBilingual.mockClear()
    await click('Bắt đầu ghi âm')
    fixture.grant(1)
    await drain()
    expect(fixture.activeTracks()).toBe(1)
    staleTimeout()
    await drain()
    expect(fixture.activeTracks()).toBe(1)
    expect(fixture.streams[1]?.track.active).toBe(true)
    expect(fixture.sttRequests).toHaveLength(0)
    expect(fixture.agentRequests).toHaveLength(0)
    expect(boundary.speakBilingual).not.toHaveBeenCalled()
  })
})

describe('STALE_CONFIRM_REVIEW', () => {
  it('marker rotation observed at confirmation tick retires its own pending UI instead of leaving mic locked', async () => {
    await openSpeaking('A')
    await sendServerRecording('A')
    fixture.respond('old account confirmation')
    await drain()
    expect(container.textContent).toContain('old account confirmation')
    setStoredToken()
    await advance(1000)
    expect(fixture.agentRequests).toHaveLength(0)
    expect(container.textContent).not.toContain('old account confirmation')
    expect(button('Bắt đầu luyện nói').disabled).toBe(false)
  })
})
