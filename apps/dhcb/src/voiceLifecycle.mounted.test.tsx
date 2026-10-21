// Khi tích hợp: apps/dhcb/src/voiceLifecycle.mounted.test.tsx + helper sibling.
// Mount trang thật + adapters STT thật; chỉ giả thiết bị, auth/HTTP, TTS và lá hiển thị.
import { act, type ReactNode, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompanionResponse, CompanionStreamCallbacks } from './lib/companionApi'
type StudioDialogueProps = ComponentProps<
  typeof import('./components/CompanionStudios/StudioDialogue').default
>
import Companion from './pages/companion/Companion'
import Speaking from './pages/subjects/english/Speaking'
import { getUsage } from './lib/storage'
import {
  FixtureMediaRecorder,
  FixtureRecognition,
  installMediaFixture,
} from './voiceLifecycleFixtures'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
const boundary = vi.hoisted(() => ({
  user: { id: 'voice-user-1', name: 'Fixture learner', plan: 'free' },
  speak: vi.fn(async () => 1),
  speakBilingual: vi.fn(async () => 1),
  stopSpeaking: vi.fn(),
  send: vi.fn<
    (
      _params: object,
      callbacks: CompanionStreamCallbacks,
      options?: { signal?: AbortSignal },
    ) => Promise<CompanionResponse>
  >(),
}))
vi.mock('./components/Layout', () => ({ default: () => null }))
vi.mock('./components/MeshTelemetry/RealtimeTelemetryBar', () => ({ default: () => null }))
vi.mock('./components/EvaluationResultView', () => ({ default: () => null }))
vi.mock('./components/CompanionStudios/StudioLoadingSkeleton', () => ({ default: () => null }))
vi.mock('./components/CompanionStudios/StudioDialogue', () => ({
  default: ({ voice }: Pick<StudioDialogueProps, 'voice'>) => (
    <div>
      <output data-testid="companion-voice-state">{voice?.state}</output>
      <button onClick={voice?.start}>COMPANION-START</button>
      <button onClick={voice?.stop}>COMPANION-STOP</button>
      <button onClick={voice?.cancel}>COMPANION-CANCEL</button>
      <button onClick={voice?.stopSession}>COMPANION-STOP-SESSION</button>
    </div>
  ),
}))
vi.mock('@core/PageShell', () => ({
  MAIN_CONTENT_ID: 'main-content',
  PageShell: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))
vi.mock('./context/useAuth', () => ({ useAuth: () => ({ user: boundary.user }) }))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }),
}))
vi.mock('@core/authHeader', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@core/authHeader')>()),
  getAuthHeader: () => ({}),
}))
vi.mock('./lib/tts', () => ({
  speak: boundary.speak,
  speakBilingual: boundary.speakBilingual,
  stopSpeaking: boundary.stopSpeaking,
  isTTSSupported: () => true,
  getRatePref: () => 1,
}))
vi.mock('./lib/companionApi', () => ({
  sendCompanionMessageStream: boundary.send,
  fetchCompanionHistory: async () => [],
  confirmProposedAction: vi.fn(),
  rejectProposedAction: vi.fn(),
}))
vi.mock('./lib/companionMemoryApi', () => ({
  fetchCompanionMemorySettings: async () => ({
    rememberMemories: false,
    useHistory: false,
    autoReflect: false,
  }),
  updateCompanionMemorySettings: vi.fn(),
}))
vi.mock('./lib/useCloudSync', () => ({ useCloudSync: () => {} }))
vi.mock('./lib/onboarding', () => ({ useOnboarding: () => null }))
vi.mock('./lib/useIsDesktopViewport', () => ({ useIsDesktopViewport: () => false }))
vi.mock('./lib/useVisualViewportHeight', () => ({
  useVisualViewportHeight: () => ({ height: 844, keyboardOpen: false }),
}))
vi.mock('./lib/achievements', () => ({
  checkNewAchievements: () => [],
  achievementMessage: () => '',
}))
vi.mock('./lib/cloud', () => ({
  pushChatSession: vi.fn(),
  pushWritingSub: vi.fn(),
  pushSpeakingSession: vi.fn(),
  pushLearnDay: vi.fn(),
}))
vi.mock('./lib/mistakes', () => ({ addMistake: vi.fn(), scheduleMistakeSync: vi.fn() }))
vi.mock('./lib/tutorFeedback', () => ({ reportTutorFeedback: vi.fn() }))
vi.mock('./lib/haptics', () => ({ haptics: { start: vi.fn(), stop: vi.fn() } }))

function response(): CompanionResponse {
  return {
    reply: 'fixture companion reply',
    intent: 'general_conversation',
    targetDomain: 'learning',
    contextPackage: {
      schemaVersion: 1,
      id: 'e1206615-845c-4711-9a1b-df731e325ed1',
      personId: '1a18a132-dd36-4c25-a2eb-14a342fa6340',
      requestId: 'fixture-request',
      tokenBudget: 4000,
      tokenUsed: 0,
      items: [],
      createdAt: '2026-10-17T00:00:00.000Z',
    },
    proposedActions: [],
    executionSummary: {
      plannedSteps: 0,
      executedSteps: 0,
      pendingConfirmationSteps: 0,
      rejectedSteps: 0,
    },
  }
}

let fixture: ReturnType<typeof installMediaFixture>
let root: Root
let container: HTMLDivElement
let mounted: boolean
async function drain() {
  await act(async () => {
    for (let i = 0; i < 16; i++) await Promise.resolve()
  })
}
function unmount() {
  if (mounted) {
    act(() => root.unmount())
    mounted = false
  }
}
async function renderPage(page: 'companion' | 'speaking') {
  act(() =>
    root.render(<MemoryRouter>{page === 'companion' ? <Companion /> : <Speaking />}</MemoryRouter>),
  )
  await drain()
}
function button(label: string): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll('button')).find(
    (item) => item.getAttribute('aria-label') === label || item.textContent === label,
  )
  if (!found) throw new Error(`Missing UI button: ${label}`)
  return found
}
async function click(label: string) {
  const found = button(label)
  expect(found.disabled, `UI button enabled: ${label}`).toBe(false)
  act(() => found.click())
  await drain()
}
async function tickConfirm() {
  await act(async () => {
    vi.advanceTimersByTime(2000)
    for (let i = 0; i < 16; i++) await Promise.resolve()
  })
  await drain()
}
function startLabel(dir: 'A' | 'B') {
  return dir === 'A' ? 'Bắt đầu ghi âm' : 'Start recording'
}
function stopLabel(dir: 'A' | 'B') {
  return dir === 'A' ? 'Dừng ghi âm' : 'Stop recording'
}
async function openSpeaking(dir: 'A' | 'B', mode: 'server' | 'native' = 'server') {
  fixture.dispose()
  fixture = installMediaFixture(mode)
  localStorage.setItem('et_direction', dir)
  await renderPage('speaking')
  await click(dir === 'A' ? 'Bắt đầu luyện nói' : 'Start speaking practice')
  expect(fixture.agentRequests).toHaveLength(1)
  expect(boundary.speakBilingual).toHaveBeenCalledTimes(1)
  expect(getUsage('voice-user-1').speakingCount).toBe(1)
  // Hook throttle thật: hết 5 giây sau lời chào trước khi thử micro.
  await act(async () => {
    vi.advanceTimersByTime(5000)
  })
  await drain()
  fixture.agentRequests.length = 0
  boundary.speakBilingual.mockClear()
}
async function sendServerRecording(dir: 'A' | 'B') {
  await click(startLabel(dir))
  fixture.grant()
  await drain()
  expect(FixtureMediaRecorder.instances[0]?.startCalls).toBe(1)
  await click(stopLabel(dir))
  expect(fixture.sttRequests).toHaveLength(1)
  expect(fixture.streams[0]?.track.stopCalls).toBeGreaterThanOrEqual(1)
  const body = fixture.sttRequests[0]?.init?.body
  expect(typeof body).toBe('string')
  if (typeof body !== 'string') throw new Error('Expected actual adapter JSON body')
  expect(JSON.parse(body)).toEqual({
    audio_b64: 'AQID',
    mime: 'audio/webm;codecs=opus',
    lang: dir === 'A' ? 'en' : 'vi',
  })
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  localStorage.clear()
  sessionStorage.clear()
  boundary.user = { id: 'voice-user-1', name: 'Fixture learner', plan: 'free' }
  boundary.speak.mockClear()
  boundary.speakBilingual.mockClear()
  boundary.stopSpeaking.mockClear()
  boundary.send.mockReset().mockImplementation(async (_params, callbacks) => {
    const result = response()
    callbacks.onDone?.(result)
    return result
  })
  vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {})
  fixture = installMediaFixture()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  mounted = true
})
afterEach(async () => {
  unmount()
  await drain()
  fixture.dispose()
  container.remove()
  expect(fixture.activeTracks()).toBe(0)
  vi.clearAllTimers()
  expect(vi.getTimerCount()).toBe(0)
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  expect(fixture.boundaryFailures).toEqual([])
})

describe('Companion mount + actual server STT', () => {
  it('CONTROL: active recording -> transcript -> one AI and one TTS', async () => {
    await renderPage('companion')
    await click('COMPANION-START')
    fixture.grant()
    await drain()
    await click('COMPANION-STOP')
    expect(fixture.sttRequests).toHaveLength(1)
    fixture.respond('fixture learner request')
    await drain()
    expect(boundary.send).toHaveBeenCalledTimes(1)
    expect(boundary.speak).toHaveBeenCalledTimes(1)
  })
  it('CONTROL: cancel active recording releases tracks without STT/AI', async () => {
    await renderPage('companion')
    await click('COMPANION-START')
    const stream = fixture.grant()
    await drain()
    await click('COMPANION-CANCEL')
    expect(stream.track.stopCalls).toBeGreaterThanOrEqual(1)
    expect(fixture.sttRequests).toHaveLength(0)
    expect(boundary.send).not.toHaveBeenCalled()
  })
  it('REGRESSION: permission resolves after unmount -> release before recorder.start', async () => {
    await renderPage('companion')
    await click('COMPANION-START')
    unmount()
    const stream = fixture.grant()
    await drain()
    expect({
      starts: FixtureMediaRecorder.instances.reduce((n, r) => n + r.startCalls, 0),
      released: stream.track.stopCalls > 0,
    }).toEqual({ starts: 0, released: true })
    expect(fixture.sttRequests).toHaveLength(0)
  })
  it('REGRESSION: repeated Start during permission opens one microphone request', async () => {
    await renderPage('companion')
    await click('COMPANION-START')
    act(() => button('COMPANION-START').click())
    await drain()
    const count = fixture.getUserMedia.mock.calls.length
    fixture.permissions.forEach((_permission, index) => fixture.grant(index))
    await drain()
    expect(count).toBe(1)
  })
  for (const exit of ['unmount', 'stop-session'] as const) {
    it(`REGRESSION: sent STT success after ${exit} -> no new AI/TTS`, async () => {
      await renderPage('companion')
      await click('COMPANION-START')
      fixture.grant()
      await drain()
      await click('COMPANION-STOP')
      expect(fixture.sttRequests).toHaveLength(1)
      if (exit === 'unmount') unmount()
      else await click('COMPANION-STOP-SESSION')
      fixture.respond('fixture late transcript')
      await drain()
      expect({
        ai: boundary.send.mock.calls.length,
        tts: boundary.speak.mock.calls.length,
      }).toEqual({ ai: 0, tts: 0 })
    })
  }
})

for (const dir of ['A', 'B'] as const) {
  describe(`Speaking ${dir} mount + actual STT adapters`, () => {
    it('CONTROL: active successful STT counts once and sends one AI/TTS after confirmation', async () => {
      await openSpeaking(dir)
      await sendServerRecording(dir)
      fixture.respond('fixture spoken sentence')
      await drain()
      expect(getUsage('voice-user-1').sttCount).toBe(1)
      expect(fixture.agentRequests).toHaveLength(0)
      expect(container.textContent).toContain(dir === 'A' ? 'Tự gửi sau 2s' : 'Sending in 2s')
      await tickConfirm()
      expect(fixture.agentRequests).toHaveLength(1)
      expect(boundary.speakBilingual).toHaveBeenCalledTimes(1)
      expect(getUsage('voice-user-1').sttCount).toBe(1)
    })
    it('CONTROL: EMPTY_RECORDING never uploads or increments STT usage', async () => {
      await openSpeaking(dir)
      await click(startLabel(dir))
      fixture.grant()
      await drain()
      const recorder = FixtureMediaRecorder.instances[0]
      if (!recorder) throw new Error('Missing actual adapter recorder')
      recorder.emitChunk = false
      await click(stopLabel(dir))
      await tickConfirm()
      expect(fixture.sttRequests).toHaveLength(0)
      expect(getUsage('voice-user-1').sttCount).toBe(0)
      expect(fixture.agentRequests).toHaveLength(0)
      expect(boundary.speakBilingual).not.toHaveBeenCalled()
      expect(container.textContent).toContain(dir === 'A' ? 'Không nghe rõ' : "Didn't catch that")
    })
    it('REGRESSION: permission resolves after unmount -> release before recorder.start', async () => {
      await openSpeaking(dir)
      await click(startLabel(dir))
      unmount()
      const stream = fixture.grant()
      await drain()
      expect({
        starts: FixtureMediaRecorder.instances.reduce((n, r) => n + r.startCalls, 0),
        released: stream.track.stopCalls > 0,
      }).toEqual({ starts: 0, released: true })
      expect(fixture.sttRequests).toHaveLength(0)
    })
    it('REGRESSION: repeated Start during permission opens one microphone request', async () => {
      await openSpeaking(dir)
      const startButton = button(startLabel(dir))
      await click(startLabel(dir))
      act(() => startButton.click())
      await drain()
      const count = fixture.getUserMedia.mock.calls.length
      fixture.permissions.forEach((_permission, index) => fixture.grant(index))
      await drain()
      expect(count).toBe(1)
    })
    for (const exit of ['unmount', 'new-room'] as const) {
      it(`REGRESSION: sent STT success after ${exit} keeps captured usage but creates no new AI/TTS`, async () => {
        await openSpeaking(dir)
        await sendServerRecording(dir)
        if (exit === 'unmount') unmount()
        else await click(dir === 'A' ? 'Phòng mới' : 'New room')
        fixture.respond('fixture late transcript')
        await drain()
        expect(getUsage('voice-user-1').sttCount).toBe(1)
        await tickConfirm()
        expect({
          ai: fixture.agentRequests.length,
          tts: boundary.speakBilingual.mock.calls.length,
        }).toEqual({ ai: 0, tts: 0 })
        if (exit === 'new-room')
          expect(
            button(dir === 'A' ? 'Bắt đầu luyện nói' : 'Start speaking practice'),
          ).toBeDefined()
      })
    }
    it('CONTROL: sent blank STT after unmount still counts captured user once, no continuation', async () => {
      await openSpeaking(dir)
      await sendServerRecording(dir)
      unmount()
      boundary.user = { id: 'voice-user-2', name: 'Next learner', plan: 'free' }
      fixture.respond('   ')
      await drain()
      await tickConfirm()
      expect(getUsage('voice-user-1').sttCount).toBe(1)
      expect(getUsage('voice-user-2').sttCount).toBe(0)
      expect(fixture.agentRequests).toHaveLength(0)
      expect(boundary.speakBilingual).not.toHaveBeenCalled()
    })
    it('REGRESSION: user changes while sent STT is pending -> old user usage only, no new AI/TTS', async () => {
      await openSpeaking(dir)
      await sendServerRecording(dir)
      boundary.user = { id: 'voice-user-2', name: 'Next learner', plan: 'free' }
      await renderPage('speaking')
      fixture.respond('fixture late transcript')
      await drain()
      expect(getUsage('voice-user-1').sttCount).toBe(1)
      expect(getUsage('voice-user-2').sttCount).toBe(0)
      await tickConfirm()
      expect({
        ai: fixture.agentRequests.length,
        tts: boundary.speakBilingual.mock.calls.length,
      }).toEqual({ ai: 0, tts: 0 })
    })
    it('CONTROL: native natural end confirms final transcript and sends once without paid STT usage', async () => {
      await openSpeaking(dir, 'native')
      await click(startLabel(dir))
      const recognition = FixtureRecognition.instances[0]
      if (!recognition) throw new Error('Missing actual adapter recognition instance')
      expect(recognition.lang).toBe(dir === 'A' ? 'en-US' : 'vi-VN')
      act(() => recognition.finish())
      await drain()
      await tickConfirm()
      expect(fixture.agentRequests).toHaveLength(1)
      expect(getUsage('voice-user-1').sttCount).toBe(0)
      expect(boundary.speakBilingual).toHaveBeenCalledTimes(1)
    })
    it('REGRESSION: manual native Stop gracefully completes final transcript', async () => {
      await openSpeaking(dir, 'native')
      await click(startLabel(dir))
      const recognition = FixtureRecognition.instances[0]
      if (!recognition) throw new Error('Missing actual adapter recognition instance')
      act(() => recognition.interim('fixture interim'))
      await drain()
      await click(stopLabel(dir))
      expect(recognition.stopCalls).toBe(1)
      expect(container.textContent).toContain(dir === 'A' ? 'Tự gửi sau 2s' : 'Sending in 2s')
      await tickConfirm()
      expect(fixture.agentRequests).toHaveLength(1)
      expect(getUsage('voice-user-1').sttCount).toBe(0)
    })
    it('CONTROL: native manual Stop pending final -> cleanup cancels late final without continuation', async () => {
      await openSpeaking(dir, 'native')
      await click(startLabel(dir))
      const recognition = FixtureRecognition.instances[0]
      if (!recognition) throw new Error('Missing actual adapter recognition instance')
      recognition.holdStop = true
      await click(stopLabel(dir))
      expect(recognition.stopCalls).toBe(1)
      unmount()
      act(() => recognition.finish())
      await drain()
      await tickConfirm()
      expect(fixture.agentRequests).toHaveLength(0)
      expect(boundary.speakBilingual).not.toHaveBeenCalled()
      expect(getUsage('voice-user-1').sttCount).toBe(0)
    })
    it('CONTROL: native cleanup cancels; late terminal result creates no request', async () => {
      await openSpeaking(dir, 'native')
      await click(startLabel(dir))
      const recognition = FixtureRecognition.instances[0]
      if (!recognition) throw new Error('Missing actual adapter recognition instance')
      recognition.holdStop = true
      unmount()
      act(() => recognition.finish())
      await drain()
      await tickConfirm()
      expect(recognition.stopCalls).toBe(1)
      expect(fixture.agentRequests).toHaveLength(0)
      expect(boundary.speakBilingual).not.toHaveBeenCalled()
    })
  })
}

describe('REVIEW independent follow-up ownership switch', () => {
  it('CONTROL REVIEW idle follow-up returns mic to usable state', async () => {
    await openSpeaking('A')
    await click('AI phản hồi (gợi ý tiếp)')
    expect(fixture.agentRequests).toHaveLength(1)
    expect(boundary.speakBilingual).toHaveBeenCalledTimes(1)
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    await drain()
    expect(button('Bắt đầu ghi âm').disabled).toBe(false)
    expect(container.textContent).not.toContain('Đang nhận diện giọng nói')
  })
  it('REVIEW follow-up during active capture clears obsolete recording UI', async () => {
    await openSpeaking('A')
    await click(startLabel('A'))
    fixture.grant()
    await drain()
    expect(FixtureMediaRecorder.instances[0]?.startCalls).toBe(1)
    expect(container.textContent).toContain('Đang ghi')
    await click('AI phản hồi (gợi ý tiếp)')
    expect(fixture.activeTracks()).toBe(0)
    expect(fixture.sttRequests).toHaveLength(0)
    expect(fixture.agentRequests).toHaveLength(1)
    expect(container.textContent).not.toContain('Đang ghi')
    expect(button('Bắt đầu ghi âm — 5s').disabled).toBe(true)
  })
  it('REVIEW follow-up during sent STT clears obsolete processing UI after captured receipt', async () => {
    await openSpeaking('A')
    await sendServerRecording('A')
    expect(container.textContent).toContain('Đang nhận diện giọng nói')
    await click('AI phản hồi (gợi ý tiếp)')
    expect(fixture.agentRequests).toHaveLength(1)
    fixture.respond('late old transcript')
    await drain()
    expect(getUsage('voice-user-1').sttCount).toBe(1)
    expect(fixture.agentRequests).toHaveLength(1)
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    await drain()
    expect(container.textContent).not.toContain('Đang nhận diện giọng nói')
    expect(button('Bắt đầu ghi âm').disabled).toBe(false)
  })
})
