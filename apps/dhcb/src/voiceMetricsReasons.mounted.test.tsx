// Khi tích hợp: apps/dhcb/src/voiceMetricsReasons.mounted.test.tsx; dùng fixture S06b sibling.
// Observer core thật luôn bật; mock đúng adapter activation để đọc metadata, không thay pipeline.
// Mount trang thật + adapters STT thật; chỉ giả thiết bị, auth/HTTP, TTS và lá hiển thị.
import { act, type ReactNode, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompanionResponse, CompanionStreamCallbacks } from './lib/companionApi'
type StudioDialogueProps = ComponentProps<
  typeof import('./components/CompanionStudios/StudioDialogue').default
>
import type { Observer } from './lib/voiceMetrics'
import type { VoiceEvent, TurnOptions } from '@dhcb/core-contracts/voiceMetrics'
import Companion from './pages/companion/Companion'
import Speaking from './pages/subjects/english/Speaking'
import { getUsage, incrementUsage } from './lib/storage'
import { getDailyLimit, totalAiUsage } from './lib/appSettings'
import { setStoredToken } from '@core/authHeader'
import { FixtureMediaRecorder, installMediaFixture } from './voiceLifecycleFixtures'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
const boundary = vi.hoisted(() => ({
  observer: null as Observer | null,
  events: [] as VoiceEvent[],
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
vi.mock('./lib/voiceMetricsLocal', async () => {
  const { createVoiceObserver } = await import('./lib/voiceMetrics')
  return {
    voiceMetrics: {
      startTurn(options: TurnOptions) {
        if (!boundary.observer) {
          const events = boundary.events
          boundary.observer = createVoiceObserver({
            enabled: true,
            sink: (event) => {
              events.push(event)
            },
          })
        }
        return boundary.observer.startTurn(options)
      },
    },
  }
})
vi.mock('./components/Layout', () => ({ default: () => null }))
vi.mock('./components/MeshTelemetry/RealtimeTelemetryBar', () => ({ default: () => null }))
vi.mock('./components/EvaluationResultView', () => ({ default: () => null }))
vi.mock('./components/CompanionStudios/StudioLoadingSkeleton', () => ({ default: () => null }))
vi.mock('./components/CompanionStudios/StudioDialogue', () => ({
  default: ({
    voice,
    setSelectedDomain,
  }: Pick<StudioDialogueProps, 'voice' | 'setSelectedDomain'>) => (
    <div>
      <output data-testid="companion-voice-state">{voice?.state}</output>
      <button onClick={voice?.start}>COMPANION-START</button>
      <button onClick={voice?.stop}>COMPANION-STOP</button>
      <button onClick={voice?.cancel}>COMPANION-CANCEL</button>
      <button onClick={voice?.stopSession}>COMPANION-STOP-SESSION</button>
      <button onClick={() => setSelectedDomain('learning')}>COMPANION-DOMAIN</button>
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
function RouteProbe() {
  const location = useLocation()
  return (
    <output data-testid="reason-route">
      {location.pathname + location.search + location.hash}
    </output>
  )
}
function route() {
  return container.querySelector('[data-testid="reason-route"]')?.textContent
}
async function renderPage(page: 'companion' | 'speaking') {
  act(() =>
    root.render(
      <MemoryRouter initialEntries={[page === 'companion' ? '/ban-dong-hanh' : '/luyen-noi']}>
        <RouteProbe />
        {page === 'companion' ? <Companion /> : <Speaking />}
      </MemoryRouter>,
    ),
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
  boundary.observer = null
  boundary.events = []
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

function microphoneEnd() {
  const started = boundary.events.find(
    (event) => event.event === 'turn_started' && event.input === 'microphone',
  )
  if (!started) throw new Error('MICROPHONE_TURN_ABSENT')
  const ended = boundary.events.filter(
    (event) => event.event === 'turn_ended' && event.turnId === started.turnId,
  )
  expect(ended).toHaveLength(1)
  const first = ended[0]
  if (!first || first.event !== 'turn_ended') throw new Error('TURN_END_ABSENT')
  return first
}
async function openPage(page: 'companion' | 'speaking') {
  if (page === 'companion') await renderPage('companion')
  else await openSpeaking('A')
}
async function startCapture(page: 'companion' | 'speaking') {
  await click(page === 'companion' ? 'COMPANION-START' : startLabel('A'))
}
for (const page of ['companion', 'speaking'] as const) {
  describe('REASON metadata ' + page, () => {
    it('scope đổi cùng URL giữ reason unknown và chặn permission muộn', async () => {
      await openPage(page)
      const initialRoute = route()
      expect(initialRoute).toBe(page === 'companion' ? '/ban-dong-hanh' : '/luyen-noi')
      await startCapture(page)
      expect(fixture.permissions).toHaveLength(1)
      if (page === 'companion') await click('COMPANION-DOMAIN')
      else {
        localStorage.setItem('et_direction', 'B')
        await renderPage('speaking')
      }
      expect(route()).toBe(initialRoute)
      const stream = fixture.grant()
      await drain()
      expect(FixtureMediaRecorder.instances).toHaveLength(0)
      expect(stream.track.active).toBe(false)
      expect(fixture.sttRequests).toHaveLength(0)
      expect(fixture.agentRequests).toHaveLength(0)
      expect(microphoneEnd().status).toBe('cancelled')
      expect(microphoneEnd().reason).toBe('unknown')
    })
    it('constructor lỗi sau permission granted không gắn reason permission', async () => {
      await openPage(page)
      let granted = false,
        constructorCalls = 0,
        constructorBeforeGrant = false
      class ConstructorFailure {
        static isTypeSupported = FixtureMediaRecorder.isTypeSupported
        constructor() {
          constructorCalls++
          constructorBeforeGrant = !granted
          throw new Error('SYNTHETIC_CONSTRUCTOR_FAILURE')
        }
      }
      vi.stubGlobal('MediaRecorder', ConstructorFailure)
      await startCapture(page)
      const stream = fixture.grant()
      granted = true
      await drain()
      expect(constructorCalls).toBe(1)
      expect(constructorBeforeGrant).toBe(false)
      expect(stream.track.active).toBe(false)
      expect(stream.track.stopCalls).toBe(1)
      expect(fixture.sttRequests).toHaveLength(0)
      expect(fixture.agentRequests).toHaveLength(0)
      expect(microphoneEnd().status).toBe('error')
      expect(microphoneEnd().reason).toBe('unknown')
    })
    it('CONTROL thao tác hủy rõ ràng vẫn reason user và nhả mic không HTTP', async () => {
      await openPage(page)
      await startCapture(page)
      const stream = fixture.grant()
      await drain()
      await click(page === 'companion' ? 'COMPANION-CANCEL' : 'Phòng mới')
      expect(stream.track.active).toBe(false)
      expect(fixture.sttRequests).toHaveLength(0)
      expect(fixture.agentRequests).toHaveLength(0)
      expect(microphoneEnd()).toMatchObject({ status: 'cancelled', reason: 'user' })
    })
    it('CONTROL busy/receipt vẫn một capture và một AI/TTS, reason none', async () => {
      await openPage(page)
      if (page === 'companion') {
        await startCapture(page)
        await startCapture(page)
        expect(fixture.permissions).toHaveLength(1)
        fixture.grant()
        await drain()
        await click('COMPANION-STOP')
      } else {
        await sendServerRecording('A')
      }
      expect(fixture.sttRequests).toHaveLength(1)
      fixture.respond('fixture learner sentence')
      await drain()
      if (page === 'speaking') await tickConfirm()
      expect(
        page === 'companion' ? boundary.send.mock.calls.length : fixture.agentRequests.length,
      ).toBe(1)
      expect(
        page === 'companion'
          ? boundary.speak.mock.calls.length
          : boundary.speakBilingual.mock.calls.length,
      ).toBe(1)
      expect(microphoneEnd()).toMatchObject({ status: 'ok', reason: 'none' })
    })
  })
}

for (const action of ['scope', 'manual'] as const) {
  it('REASON replay pending ' + action + ' giữ reason theo điều quan sát thật', async () => {
    await openSpeaking('A')
    let releaseReplay!: () => void
    boundary.speakBilingual.mockImplementationOnce(
      () =>
        new Promise<number>((resolve) => {
          releaseReplay = () => resolve(1)
        }),
    )
    await click('Nghe lại')
    const started = boundary.events.find(
      (event) => event.event === 'turn_started' && event.input === 'replay',
    )
    if (!started) throw new Error('REPLAY_TURN_ABSENT')
    const initialRoute = route()
    try {
      expect(
        boundary.events.filter(
          (event) => event.event === 'turn_ended' && event.turnId === started.turnId,
        ),
      ).toHaveLength(0)
      if (action === 'scope') {
        localStorage.setItem('et_direction', 'B')
        await renderPage('speaking')
      } else await click('Tắt âm thanh')
      expect(route()).toBe(initialRoute)
      const ended = boundary.events.filter(
        (event) => event.event === 'turn_ended' && event.turnId === started.turnId,
      )
      expect(ended).toHaveLength(1)
      const first = ended[0]
      if (!first || first.event !== 'turn_ended') throw new Error('REPLAY_END_ABSENT')
      expect(first.status).toBe('cancelled')
      expect(first.reason).toBe(action === 'scope' ? 'unknown' : 'user')
      expect(fixture.sttRequests).toHaveLength(0)
      expect(fixture.agentRequests).toHaveLength(0)
    } finally {
      releaseReplay()
      await drain()
    }
  })
}

it('INDEPENDENT Speaking marker changes before permission continuation is unknown, no cancel gesture', async () => {
  await openSpeaking('A')
  await startCapture('speaking')
  expect(fixture.permissions).toHaveLength(1)
  setStoredToken()
  const stream = fixture.grant()
  await drain()
  expect(stream.track.active).toBe(false)
  expect(fixture.sttRequests).toHaveLength(0)
  expect(fixture.agentRequests).toHaveLength(0)
  expect(microphoneEnd()).toMatchObject({ status: 'cancelled', reason: 'unknown' })
})
it('INDEPENDENT Speaking last STT allowance reaches local VIP quota, policy reject is unknown', async () => {
  boundary.user.plan = 'vip'
  await openSpeaking('A')
  const cap = getDailyLimit('vip')
  expect(Number.isFinite(cap)).toBe(true)
  expect(cap).toBeLessThanOrEqual(10000)
  while (totalAiUsage(getUsage('voice-user-1')) < cap - 1)
    incrementUsage('voice-user-1', 'chatCount')
  expect(totalAiUsage(getUsage('voice-user-1'))).toBe(cap - 1)
  await sendServerRecording('A')
  fixture.respond('synthetic last-STT allowance sentence')
  await drain()
  expect(totalAiUsage(getUsage('voice-user-1'))).toBe(cap)
  await tickConfirm()
  expect(fixture.agentRequests).toHaveLength(0)
  expect(boundary.speakBilingual).not.toHaveBeenCalled()
  expect(microphoneEnd()).toMatchObject({ status: 'cancelled', reason: 'unknown' })
})
it('INDEPENDENT CONTROL Speaking explicit New room retains user', async () => {
  await openSpeaking('A')
  await startCapture('speaking')
  const stream = fixture.grant()
  await drain()
  await click('Phòng mới')
  expect(stream.track.active).toBe(false)
  expect(fixture.sttRequests).toHaveLength(0)
  expect(microphoneEnd()).toMatchObject({ status: 'cancelled', reason: 'user' })
})
it('INDEPENDENT CONTROL Speaking AI follow-up supersedes current capture', async () => {
  await openSpeaking('A')
  await startCapture('speaking')
  const stream = fixture.grant()
  await drain()
  await click('AI phản hồi (gợi ý tiếp)')
  expect(stream.track.active).toBe(false)
  expect(fixture.sttRequests).toHaveLength(0)
  expect(fixture.agentRequests).toHaveLength(1)
  expect(microphoneEnd()).toMatchObject({ status: 'cancelled', reason: 'superseded' })
})

it('INDEPENDENT Companion marker stale before permission must not infer replacement intent', async () => {
  await openPage('companion')
  await startCapture('companion')
  expect(fixture.permissions).toHaveLength(1)
  setStoredToken()
  const stream = fixture.grant()
  await drain()
  expect(stream.track.active).toBe(false)
  expect(fixture.sttRequests).toHaveLength(0)
  expect(boundary.send).not.toHaveBeenCalled()
  expect(microphoneEnd()).toMatchObject({ status: 'cancelled', reason: 'unknown' })
})
