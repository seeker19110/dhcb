import { describe, it, expect, vi } from 'vitest'
import { setStoredToken, getStoredToken } from '@core/authHeader'
import { getSpeakingSessions, getUsage } from './lib/storage'
import { FixtureMediaRecorder } from './voiceLifecycleFixtures'
import {
  boundary,
  fixture,
  container,
  historyPosts,
  renderSpeaking,
  openSpeaking,
  sendServerRecording,
  click,
  button,
  drain,
  advance,
  unmount,
} from './speakingReviewHarness'

function holdAgent() {
  const savedFetch = globalThis.fetch
  let done!: (response: Response) => void
  const pending = new Promise<Response>((resolve) => {
    done = resolve
  })
  let sent = 0
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    if (input === '/api/agent') {
      sent++
      return pending
    }
    return savedFetch(input, init)
  })
  return {
    sent: () => sent,
    release: (speech: string) =>
      done(
        Response.json({
          content: [
            { type: 'text', text: JSON.stringify({ speech, feedback: '', corrected: '' }) },
          ],
        }),
      ),
  }
}
describe('Portable marker lifecycle controls with actual cloud/storage/auth', () => {
  it('same-account unmount after greeting sent preserves one cloud/local receipt without TTS', async () => {
    const marker = getStoredToken()
    const agent = holdAgent()
    await renderSpeaking()
    await click('Bắt đầu luyện nói')
    expect(agent.sent()).toBe(1)
    unmount()
    agent.release('old route saved reply')
    await drain()
    expect(historyPosts).toHaveLength(1)
    expect(historyPosts[0]?.marker).toBe(marker)
    expect(getSpeakingSessions('voice-user-1')).toHaveLength(1)
    expect(getUsage('voice-user-1').speakingCount).toBe(1)
    expect(boundary.speakBilingual).toHaveBeenCalledTimes(0)
  })
  it('reauth without Auth rerender blocks old greeting cloud/UI/TTS but retains local receipt', async () => {
    const marker = getStoredToken()
    const agent = holdAgent()
    await renderSpeaking()
    await click('Bắt đầu luyện nói')
    setStoredToken()
    expect(getStoredToken()).not.toBe(marker)
    agent.release('old account private reply')
    await drain()
    expect(historyPosts).toHaveLength(0)
    expect(getSpeakingSessions('voice-user-1')).toHaveLength(1)
    expect(getUsage('voice-user-1').speakingCount).toBe(1)
    expect(boundary.speakBilingual).toHaveBeenCalledTimes(0)
    expect(agent.sent()).toBe(1)
    expect(container.textContent).not.toContain('old account private reply')
  })
  it('reauth without Auth rerender while permission pending releases before recorder constructor/start', async () => {
    await openSpeaking('A')
    await click('Bắt đầu ghi âm')
    setStoredToken()
    const stream = fixture.grant()
    await drain()
    expect(FixtureMediaRecorder.instances).toHaveLength(0)
    expect(stream.track.active).toBe(false)
    expect(fixture.sttRequests).toHaveLength(0)
    expect(fixture.agentRequests).toHaveLength(0)
    expect(boundary.speakBilingual).toHaveBeenCalledTimes(0)
  })
  it('reauth without Auth rerender after sent STT keeps captured usage but cannot confirm/send/TTS', async () => {
    await openSpeaking('A')
    await sendServerRecording('A')
    setStoredToken()
    fixture.respond('old marker transcript')
    await drain()
    await advance(2000)
    expect(getUsage('voice-user-1').sttCount).toBe(1)
    expect(fixture.agentRequests).toHaveLength(0)
    expect(boundary.speakBilingual).toHaveBeenCalledTimes(0)
    expect(container.textContent).not.toContain('old marker transcript')
    expect(historyPosts).toHaveLength(0)
  })
  it('fresh marker scope rerender releases stale owner and a new room can complete', async () => {
    await openSpeaking('A')
    await sendServerRecording('A')
    setStoredToken()
    await renderSpeaking()
    fixture.respond('old scope transcript')
    await drain()
    expect(button('Bắt đầu luyện nói').disabled).toBe(false)
    await click('Bắt đầu luyện nói')
    expect(fixture.agentRequests).toHaveLength(1)
    expect(boundary.speakBilingual).toHaveBeenCalledTimes(1)
    expect(getUsage('voice-user-1').sttCount).toBe(1)
    expect(getUsage('voice-user-1').speakingCount).toBe(2)
    expect(container.textContent).not.toContain('old scope transcript')
    expect(button('Bắt đầu ghi âm')).toBeTruthy()
  })
})
