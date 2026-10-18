import { describe, it, expect, vi } from 'vitest'
import { getSpeakingSessions, getUsage } from './lib/storage'
import { FixtureMediaRecorder } from './voiceLifecycleFixtures'
import {
  boundary,
  fixture,
  container,
  renderSpeaking,
  openSpeaking,
  sendServerRecording,
  click,
  button,
  drain,
  advance,
} from './speakingReviewHarness'
describe('IDENTITY_REVIEW additive scope and late-finalizer controls', () => {
  it('IDENTITY_REVIEW StrictMode setup-cleanup permits a fresh active capture', async () => {
    await renderSpeaking(true)
    await click('Bắt đầu luyện nói')
    await advance(5000)
    await drain()
    fixture.agentRequests.length = 0
    boundary.speakBilingual.mockClear()
    await sendServerRecording('A')
    fixture.respond('fresh strict-mode transcript')
    await drain()
    expect(container.textContent).toContain('fresh strict-mode transcript')
    await advance(2000)
    expect(fixture.agentRequests).toHaveLength(1)
    expect(boundary.speakBilingual).toHaveBeenCalledTimes(1)
    expect(getUsage('voice-user-1').sttCount).toBe(1)
  })
  it('IDENTITY_REVIEW A-to-B scope rejects old permission and new B capture has vi language', async () => {
    await openSpeaking('A')
    await click('Bắt đầu ghi âm')
    localStorage.setItem('et_direction', 'B')
    await renderSpeaking()
    const oldStream = fixture.grant()
    await drain()
    expect(oldStream.track.active).toBe(false)
    expect(FixtureMediaRecorder.instances).toHaveLength(0)
    await click('Start speaking practice')
    await advance(5000)
    await drain()
    await click('Start recording')
    fixture.grant(1)
    await drain()
    await click('Stop recording')
    expect(fixture.sttRequests).toHaveLength(1)
    const body = fixture.sttRequests[0]?.init?.body
    if (typeof body !== 'string') throw new Error('missing real STT JSON body')
    expect(JSON.parse(body).lang).toBe('vi')
    fixture.respond('new B transcript')
    await drain()
  })
  it('IDENTITY_REVIEW old sent-STT finally cannot clear a new-room active capture', async () => {
    await openSpeaking('A')
    await sendServerRecording('A')
    await click('Phòng mới')
    await click('Bắt đầu luyện nói')
    await advance(5000)
    await drain()
    await click('Bắt đầu ghi âm')
    fixture.grant(1)
    await drain()
    fixture.respond('old turn must not confirm', 0)
    await drain()
    expect(getUsage('voice-user-1').sttCount).toBe(1)
    expect(container.textContent).not.toContain('old turn must not confirm')
    expect(button('Dừng ghi âm').disabled).toBe(false)
    expect(fixture.streams[1]?.track.active).toBe(true)
    await click('Dừng ghi âm')
    expect(fixture.sttRequests).toHaveLength(2)
    fixture.respond('new room transcript', 1)
    await drain()
    expect(container.textContent).toContain('new room transcript')
    expect(getUsage('voice-user-1').sttCount).toBe(2)
  })
  it('IDENTITY_REVIEW New room after sent AI keeps local receipt and does not replay old TTS/UI', async () => {
    await openSpeaking('A')
    const savedFetch = globalThis.fetch
    let done!: (r: Response) => void
    const held = new Promise<Response>((resolve) => {
      done = resolve
    })
    let sent = 0
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
      if (input === '/api/agent') {
        sent++
        return held
      }
      return savedFetch(input, init)
    })
    await click('AI phản hồi (gợi ý tiếp)')
    expect(sent).toBe(1)
    await click('Phòng mới')
    done(
      Response.json({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ speech: 'late AI saved only', feedback: '', corrected: '' }),
          },
        ],
      }),
    )
    await drain()
    expect(getUsage('voice-user-1').speakingCount).toBe(2)
    expect(getSpeakingSessions('voice-user-1')[0]?.messages.at(-1)?.speechEn).toBe(
      'late AI saved only',
    )
    expect(boundary.speakBilingual).toHaveBeenCalledTimes(0)
    expect(container.textContent).not.toContain('late AI saved only')
    expect(button('Bắt đầu luyện nói').disabled).toBe(false)
  })
  it('IDENTITY_REVIEW pending confirm Re-record cannot send after old interval deadline', async () => {
    await openSpeaking('A')
    await sendServerRecording('A')
    fixture.respond('cancelled confirm')
    await drain()
    await click('Ghi lại')
    await advance(2000)
    expect(fixture.agentRequests).toHaveLength(0)
    expect(container.textContent).not.toContain('cancelled confirm')
    expect(button('Bắt đầu ghi âm').disabled).toBe(false)
  })
  it('IDENTITY_REVIEW old manual TTS completion does not mark newer playback idle', async () => {
    await openSpeaking('A')
    let oldDone!: () => void
    let newDone!: () => void
    boundary.speakBilingual.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          oldDone = done
        }),
    )
    boundary.speakBilingual.mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          newDone = done
        }),
    )
    await click('Nghe lại')
    await click('Nghe lại')
    oldDone()
    await drain()
    expect(container.textContent).toContain('AI đang đọc')
    newDone()
    await drain()
    expect(container.textContent).not.toContain('AI đang đọc')
  })
})
