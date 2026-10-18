// Read-only actual repo Companion; real marker helper, fake auth/HTTP/device/TTS boundaries.
// Khi tích hợp: apps/dhcb/src/companionOwnership.test.tsx + frozen helper sibling.
// Mount trang thật + adapters STT thật; chỉ giả thiết bị, auth/HTTP, TTS và lá hiển thị.
import { act, StrictMode, type ReactNode, type ComponentProps } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompanionResponse, CompanionStreamCallbacks } from './lib/companionApi'
type StudioDialogueProps = ComponentProps<
  typeof import('./components/CompanionStudios/StudioDialogue').default
>
import Companion from './pages/companion/Companion'
import { FixtureMediaRecorder, installMediaFixture, deferred } from './voiceLifecycleFixtures'
import { setStoredToken } from '@core/authHeader'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
const boundary = vi.hoisted(() => ({
  user: { id: 'voice-user-1', name: 'Fixture learner', plan: 'free' },
  speak: vi.fn(async () => 1),
  stopSpeaking: vi.fn(),
  toastError: vi.fn(),
  auth: vi.fn<() => Record<string, string> | Promise<Record<string, string>>>(() => ({})),
  send: vi.fn<
    (
      _params: object,
      callbacks: CompanionStreamCallbacks,
      options?: { signal?: AbortSignal },
    ) => Promise<CompanionResponse>
  >(),
}))
vi.mock('./components/Layout', () => ({ default: () => null }))
vi.mock('./components/MeshTelemetry/RealtimeTelemetryBar', () => ({
  default: () => null,
}))
vi.mock('./components/CompanionStudios/StudioLoadingSkeleton', () => ({
  default: () => null,
}))
vi.mock('./components/CompanionStudios/StudioDialogue', () => ({
  default: ({
    voice,
    loading,
    toolStatus,
    messages,
    handleSend,
    setSelectedDomain,
    setViewMode,
    memory,
  }: StudioDialogueProps) => (
    <div>
      <output data-testid="voice">{voice.state}</output>
      <output data-testid="error">{voice.error}</output>
      <output data-testid="loading">{String(loading)}</output>
      <output data-testid="tool">{toolStatus}</output>
      <output data-testid="messages">{messages.map((message) => message.text).join('|')}</output>
      <button onClick={voice.start}>START</button>
      <button onClick={voice.stop}>STOP</button>
      <button onClick={voice.cancel}>CANCEL</button>
      <button onClick={voice.stopSession}>STOP-SESSION</button>
      <button onClick={() => handleSend('fixture direct voice', true)}>DIRECT-VOICE</button>
      <button onClick={() => setSelectedDomain('learning')}>DOMAIN</button>
      <button onClick={() => setViewMode('voice')}>VIEW</button>
      <button onClick={() => memory?.onEphemeralChange(true)}>EPHEMERAL</button>
    </div>
  ),
}))
vi.mock('./components/CompanionStudios/StudioCognitive', () => ({
  default: () => null,
}))
vi.mock('@core/PageShell', () => ({
  MAIN_CONTENT_ID: 'main-content',
  PageShell: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))
vi.mock('./context/useAuth', () => ({
  useAuth: () => ({ user: boundary.user }),
}))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({
    error: boundary.toastError,
    success: vi.fn(),
    info: vi.fn(),
  }),
}))
vi.mock('@core/authHeader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@core/authHeader')>()
  return { ...actual, getAuthHeader: boundary.auth }
})
vi.mock('./lib/tts', () => ({
  speak: boundary.speak,
  stopSpeaking: boundary.stopSpeaking,
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
    suggestMemories: false,
  }),
  updateCompanionMemorySettings: vi.fn(),
}))
vi.mock('./lib/onboarding', () => ({ useOnboarding: () => null }))

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
const sends: {
  callbacks: CompanionStreamCallbacks
  options?: { signal?: AbortSignal }
  done: ReturnType<typeof deferred<CompanionResponse>>
}[] = []
async function drain() {
  await act(async () => {
    for (let i = 0; i < 24; i++) await Promise.resolve()
  })
}
function unmount() {
  if (mounted) {
    act(() => root.unmount())
    mounted = false
  }
}
async function render(strict = false) {
  const tree = (
    <MemoryRouter>
      <Companion />
    </MemoryRouter>
  )
  act(() => root.render(strict ? <StrictMode>{tree}</StrictMode> : tree))
  await drain()
}
function button(label: string) {
  const result = Array.from(container.querySelectorAll('button')).find(
    (item) => item.textContent?.trim() === label,
  )
  if (!result) throw new Error(`Missing public control ${label}`)
  return result
}
async function click(label: string) {
  act(() => button(label).click())
  await drain()
}
function output(id: string) {
  return container.querySelector(`[data-testid="${id}"]`)?.textContent ?? ''
}
async function recording(index = 0) {
  await click('START')
  fixture.grant(index)
  await drain()
  expect(output('voice')).toBe('recording')
}
async function sentStt() {
  await recording()
  await click('STOP')
  expect(fixture.sttRequests).toHaveLength(1)
}
async function finishSend(index: number, text = 'fixture reply') {
  const request = sends[index]
  if (!request) throw new Error('Missing AI boundary barrier')
  const reply = { ...response(), reply: text }
  act(() => {
    request.callbacks.onDone?.(reply)
    request.done.resolve(reply)
  })
  await drain()
}
beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
  })
  localStorage.clear()
  sessionStorage.clear()
  setStoredToken()
  sends.length = 0
  boundary.user = { id: 'voice-user-1', name: 'Fixture learner', plan: 'free' }
  boundary.auth.mockReset().mockReturnValue({})
  boundary.toastError.mockClear()
  boundary.speak.mockReset().mockResolvedValue(1)
  boundary.stopSpeaking.mockClear()
  boundary.send.mockReset().mockImplementation((_params, callbacks, options) => {
    const done = deferred<CompanionResponse>()
    sends.push({ callbacks, options, done })
    return done.promise
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
  sends.forEach((send) => send.done.resolve(response()))
  await drain()
  expect(fixture.activeTracks()).toBe(0)
  fixture.dispose()
  expect(fixture.boundaryFailures).toEqual([])
  container.remove()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('Independent Companion marker-only privacy boundaries', () => {
  it('CONTROL same marker permits fresh recording and one AI/TTS response', async () => {
    await render()
    await sentStt()
    fixture.respond('current transcript')
    await drain()
    expect(sends).toHaveLength(1)
    await finishSend(0, 'CURRENT_MARKER_REPLY')
    expect(boundary.speak).toHaveBeenCalledExactlyOnceWith('CURRENT_MARKER_REPLY', 'vi-VN')
  })
  it('marker-only reauth while permission pending rejects late recorder before constructor/start', async () => {
    await render()
    await click('START')
    setStoredToken()
    const stream = fixture.grant()
    await drain()
    expect(fixture.sttRequests).toHaveLength(0)
    expect(sends).toHaveLength(0)
    expect(boundary.speak).not.toHaveBeenCalled()
    expect(
      FixtureMediaRecorder.instances,
      'MARKER_PENDING_PERMISSION_STARTED_STALE_RECORDER',
    ).toHaveLength(0)
    expect(stream.track.active).toBe(false)
  })
  it('marker-only reauth during auth await blocks STT upload before fetch', async () => {
    const auth = deferred<Record<string, string>>()
    boundary.auth.mockReturnValue(auth.promise)
    await render()
    await recording()
    await click('STOP')
    expect(boundary.auth).toHaveBeenCalledTimes(1)
    setStoredToken()
    auth.resolve({})
    await drain()
    expect(sends).toHaveLength(0)
    expect(boundary.speak).not.toHaveBeenCalled()
    expect(fixture.sttRequests, 'MARKER_AUTH_AWAIT_UPLOADED_STALE_AUDIO').toHaveLength(0)
  })
  it('marker-only reauth after sent AI blocks old final UI/TTS without new AI', async () => {
    await render()
    await click('DIRECT-VOICE')
    expect(sends).toHaveLength(1)
    setStoredToken()
    await finishSend(0, 'OLD_MARKER_PRIVATE_REPLY')
    expect(sends).toHaveLength(1)
    expect(boundary.speak, 'MARKER_OLD_AI_REPLY_STARTED_TTS').not.toHaveBeenCalled()
    expect(output('messages')).not.toContain('OLD_MARKER_PRIVATE_REPLY')
  })
  it('marker-only reauth during active recording: Stop must cancel owned mic without upload', async () => {
    await render()
    await recording()
    expect(fixture.activeTracks()).toBe(1)
    setStoredToken()
    await click('STOP')
    expect(fixture.sttRequests).toHaveLength(0)
    expect(sends).toHaveLength(0)
    expect(boundary.speak).not.toHaveBeenCalled()
    expect(fixture.activeTracks(), 'COMPANION_STALE_MARKER_STOP_RETAINS_LIVE_MIC').toBe(0)
  })
})
