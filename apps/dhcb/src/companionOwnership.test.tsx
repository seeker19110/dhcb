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
vi.mock('@core/authHeader', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@core/authHeader')>()),
  getAuthHeader: boundary.auth,
}))
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
const speeches: ReturnType<typeof deferred<number>>[] = []
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
function holdSpeech() {
  boundary.speak.mockImplementation(() => {
    const speech = deferred<number>()
    speeches.push(speech)
    return speech.promise
  })
}
beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
  })
  localStorage.clear()
  sessionStorage.clear()
  sends.length = 0
  speeches.length = 0
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
  speeches.forEach((speech) => speech.resolve(1))
  sends.forEach((send) => send.done.resolve(response()))
  await drain()
  fixture.dispose()
  expect(fixture.activeTracks()).toBe(0)
  expect(fixture.boundaryFailures).toEqual([])
  container.remove()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
describe('Companion public owner regressions', () => {
  it('CONTROL direct handleSend(text,true) remains legitimate without STT owner argument', async () => {
    await render()
    await click('DIRECT-VOICE')
    expect(sends).toHaveLength(1)
    await finishSend(0)
    expect(boundary.speak).toHaveBeenCalledExactlyOnceWith(
      'fixture reply',
      'vi-VN',
      undefined,
      undefined,
      undefined,
      {
        segment: 'speech',
        turn: expect.objectContaining({
          request: expect.any(Function),
          playback: expect.any(Function),
          end: expect.any(Function),
        }),
      },
    )
    expect(output('voice')).toBe('idle')
    expect(output('loading')).toBe('false')
  })
  it('CONTROL StrictMode cleanup/setup allows a fresh active capture and reply', async () => {
    await render(true)
    await sentStt()
    fixture.respond('fixture strict request')
    await drain()
    expect(sends).toHaveLength(1)
    expect(sends[0]?.options?.signal?.aborted).toBe(false)
    await finishSend(0)
    expect(boundary.speak).toHaveBeenCalledTimes(1)
    expect(output('voice')).toBe('idle')
  })
  it('CONTROL active blank STT stays friendly without AI', async () => {
    await render()
    await sentStt()
    fixture.respond('  ')
    await drain()
    expect(sends).toHaveLength(0)
    expect(output('voice')).toBe('idle')
    expect(output('error')).toContain('Không nghe rõ')
  })
  it('CONTROL active EMPTY_RECORDING stays friendly without upload/AI', async () => {
    await render()
    await recording()
    const recorder = FixtureMediaRecorder.instances[0]
    if (!recorder) throw new Error('Missing recorder')
    recorder.emitChunk = false
    await click('STOP')
    expect(fixture.sttRequests).toHaveLength(0)
    expect(sends).toHaveLength(0)
    expect(output('error')).toContain('Không nghe rõ')
  })
  it('cancel pending permission releases before recorder.start and permits a new capture', async () => {
    await render()
    await click('START')
    await click('CANCEL')
    const oldStream = fixture.grant()
    await drain()
    expect(FixtureMediaRecorder.instances).toHaveLength(0)
    expect(oldStream.track.active).toBe(false)
    await recording(1)
    expect(fixture.streams[1]?.track.active).toBe(true)
  })
  it('two Stop clicks share one STT continuation and preserve active thinking/speaking', async () => {
    await render()
    await recording()
    const stop = button('STOP')
    act(() => {
      stop.click()
      stop.click()
    })
    await drain()
    expect(fixture.sttRequests).toHaveLength(1)
    fixture.respond('fixture text')
    await drain()
    expect(sends).toHaveLength(1)
    expect(output('voice')).toBe('thinking')
    expect(output('error')).toBe('')
    await finishSend(0)
    expect(boundary.speak).toHaveBeenCalledTimes(1)
  })
  for (const change of ['user', 'domain', 'ephemeral', 'view', 'studio'] as const) {
    it(`scope ${change} invalidates pending permission before late recorder can start`, async () => {
      await render()
      await click('START')
      if (change === 'user') {
        boundary.user = { ...boundary.user, id: 'voice-user-2' }
        await render()
      } else
        await click(
          change === 'domain'
            ? 'DOMAIN'
            : change === 'ephemeral'
              ? 'EPHEMERAL'
              : change === 'view'
                ? 'VIEW'
                : 'Ghi nhớ',
        )
      const oldStream = fixture.grant()
      await drain()
      expect(FixtureMediaRecorder.instances).toHaveLength(0)
      expect(oldStream.track.active).toBe(false)
      expect(fixture.sttRequests).toHaveLength(0)
      expect(sends).toHaveLength(0)
      if (change === 'studio') await click('Trò chuyện')
      expect(output('voice')).toBe('idle')
      await recording(1)
      expect(fixture.streams[1]?.track.active).toBe(true)
    })
  }
  it('late sent STT success does not replace or clear a newer recording', async () => {
    await render()
    await sentStt()
    await click('STOP-SESSION')
    await recording(1)
    fixture.respond('fixture obsolete')
    await drain()
    expect(sends).toHaveLength(0)
    expect(output('voice')).toBe('recording')
    expect(output('error')).toBe('')
    expect(fixture.streams[1]?.track.active).toBe(true)
    await click('STOP')
    expect(fixture.sttRequests).toHaveLength(2)
    fixture.respond('fixture current', 1)
    await drain()
    expect(sends).toHaveLength(1)
    await finishSend(0)
    expect(boundary.speak).toHaveBeenCalledTimes(1)
  })
  it('late sent STT error does not set an error/idle on a newer recording', async () => {
    await render()
    await sentStt()
    await click('STOP-SESSION')
    await recording(1)
    fixture.sttRequests[0]?.response.resolve(
      Response.json({ error: 'synthetic obsolete failure' }, { status: 503 }),
    )
    await drain()
    expect(output('voice')).toBe('recording')
    expect(output('error')).toBe('')
    expect(sends).toHaveLength(0)
    expect(fixture.streams[1]?.track.active).toBe(true)
  })
  it('cancel while auth pending before upload prevents fetch after auth resolves', async () => {
    const pendingAuth = deferred<Record<string, string>>()
    boundary.auth.mockReturnValue(pendingAuth.promise)
    await render()
    await recording()
    await click('STOP')
    expect(boundary.auth).toHaveBeenCalledTimes(1)
    await click('STOP-SESSION')
    pendingAuth.resolve({})
    await drain()
    expect(fixture.sttRequests).toHaveLength(0)
    expect(sends).toHaveLength(0)
    expect(output('error')).toBe('')
  })
  it('CONTROL active permission failure stays friendly and retry can claim a fresh owner', async () => {
    fixture.getUserMedia.mockRejectedValueOnce(new Error('synthetic denied'))
    await render()
    await click('START')
    expect(output('voice')).toBe('idle')
    expect(output('error')).toContain('Không truy cập được micro')
    await recording()
    expect(output('error')).toBe('')
    expect(fixture.sttRequests).toHaveLength(0)
  })
  it('cancel while FileReader pending prevents late encode continuation and preserves replacement', async () => {
    const held: { current: HeldReader | null } = { current: null }
    class HeldReader {
      result: string | null = null
      onloadend: (() => void) | null = null
      onerror: (() => void) | null = null
      constructor() {
        held.current = this
      }
      readAsDataURL() {}
      finish() {
        this.result = 'data:audio/webm;base64,AQID'
        this.onloadend?.()
      }
    }
    vi.stubGlobal('FileReader', HeldReader)
    await render()
    await recording()
    await click('STOP')
    expect(held.current).not.toBeNull()
    expect(boundary.auth).not.toHaveBeenCalled()
    await click('STOP-SESSION')
    await recording(1)
    held.current?.finish()
    await drain()
    expect(fixture.sttRequests).toHaveLength(0)
    expect(boundary.auth).not.toHaveBeenCalled()
    expect(output('voice')).toBe('recording')
    expect(output('error')).toBe('')
  })
  it('CONTROL voice stop keeps the already sent Companion reply/loading policy but suppresses TTS', async () => {
    await render()
    await click('DIRECT-VOICE')
    expect(output('loading')).toBe('true')
    await click('STOP-SESSION')
    expect(sends[0]?.options?.signal?.aborted).toBe(false)
    expect(output('loading')).toBe('true')
    expect(output('voice')).toBe('idle')
    await finishSend(0, 'reply kept after voice stop')
    expect(output('messages')).toContain('reply kept after voice stop')
    expect(output('loading')).toBe('false')
    expect(output('voice')).toBe('idle')
    expect(boundary.speak).not.toHaveBeenCalled()
  })
  it('old TTS finalizer cannot idle a new owner that is speaking', async () => {
    holdSpeech()
    await render()
    await click('DIRECT-VOICE')
    await finishSend(0, 'old reply')
    expect(output('voice')).toBe('speaking')
    await click('STOP-SESSION')
    await click('DIRECT-VOICE')
    await finishSend(1, 'new reply')
    expect(output('voice')).toBe('speaking')
    speeches[0]?.resolve(1)
    await drain()
    expect(output('voice')).toBe('speaking')
    speeches[1]?.resolve(1)
    await drain()
    expect(output('voice')).toBe('idle')
  })
  it('old send callbacks/finally after scope replacement cannot touch the new loading owner', async () => {
    await render()
    await click('DIRECT-VOICE')
    const old = sends[0]
    if (!old) throw new Error('Missing old request')
    await click('VIEW')
    expect(old.options?.signal?.aborted).toBe(true)
    await click('DIRECT-VOICE')
    expect(sends).toHaveLength(2)
    act(() => sends[1]?.callbacks.onTool?.('CURRENT_TOOL'))
    await drain()
    const reply = response()
    act(() => {
      old.callbacks.onMeta?.({
        intent: reply.intent,
        targetDomain: reply.targetDomain,
        contextPackage: reply.contextPackage,
      })
      old.callbacks.onTool?.('OLD_TOOL')
      old.callbacks.onChunk?.('OBSOLETE_CHUNK')
      old.callbacks.onActions?.({
        proposedActions: [],
        executionSummary: reply.executionSummary,
      })
      old.callbacks.onQuestions?.([])
      old.callbacks.onDone?.({ ...reply, reply: 'OBSOLETE_DONE' })
      old.done.resolve(reply)
    })
    await drain()
    expect(output('loading')).toBe('true')
    expect(output('tool')).toBe('CURRENT_TOOL')
    expect(output('messages')).not.toContain('OBSOLETE')
    expect(boundary.speak).not.toHaveBeenCalled()
    await click('DIRECT-VOICE')
    expect(sends).toHaveLength(2)
    await finishSend(1, 'new owner reply')
    expect(output('loading')).toBe('false')
    expect(boundary.speak).toHaveBeenCalledExactlyOnceWith(
      'new owner reply',
      'vi-VN',
      undefined,
      undefined,
      undefined,
      {
        segment: 'speech',
        turn: expect.objectContaining({
          request: expect.any(Function),
          playback: expect.any(Function),
          end: expect.any(Function),
        }),
      },
    )
  })
})
