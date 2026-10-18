// Khi tích hợp: apps/dhcb/src/companionOwnership.test.tsx + frozen helper sibling.
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
import { QUICK_PROMPTS } from './components/CompanionStudios/studioTypes'
import { installMediaFixture, deferred } from './voiceLifecycleFixtures'

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
vi.mock('./components/CompanionStudios/StudioDialogue', async (importOriginal) => {
  const original =
    await importOriginal<typeof import('./components/CompanionStudios/StudioDialogue')>()
  const ActualStudio = original.default
  return {
    default: (props: StudioDialogueProps) => (
      <>
        <output data-testid="loading">{String(props.loading)}</output>
        <output data-testid="messages">
          {props.messages.map((message) => message.text).join('|')}
        </output>
        <output data-testid="domain">{props.selectedDomain}</output>
        <ActualStudio {...props} />
      </>
    ),
  }
})
vi.mock('./components/CompanionVoice/CompanionLiveOrb', () => ({
  default: () => null,
}))
vi.mock('./components/CompanionVoice/VoiceWaveformVisualizer', () => ({
  default: () => null,
}))
vi.mock('./components/Companion3D/CyberTutorAvatar3D', () => ({
  default: () => null,
}))
vi.mock('./components/EdgeAi/EdgeAiIndicator', () => ({ default: () => null }))
vi.mock('./components/CompanionStudios/ChatProse', () => ({
  default: () => null,
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
  params: object
  callbacks: CompanionStreamCallbacks
  options?: { signal?: AbortSignal }
  done: ReturnType<typeof deferred<CompanionResponse>>
}[] = []
const heldSchedulers: { release(): void }[] = []
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
async function render() {
  await import('./components/CompanionStudios/StudioDialogue')
  act(() =>
    root.render(
      <MemoryRouter>
        <Companion />
      </MemoryRouter>,
    ),
  )
  await act(async () => {
    await vi.dynamicImportSettled()
  })
  await drain()
}
function output(id: string) {
  return container.querySelector(`[data-testid="${id}"]`)?.textContent ?? ''
}
function quick(domain: 'learning' | 'work') {
  const prompt = QUICK_PROMPTS.find((item) => item.domain === domain)
  if (!prompt) throw new Error('Missing actual quick prompt fixture')
  const button = Array.from(container.querySelectorAll('button')).find(
    (item) => item.textContent?.trim() === prompt.label,
  )
  if (!button) throw new Error('Missing actual Studio quick prompt button')
  return { button, prompt }
}
function holdMicrotasks() {
  const actualQueue = globalThis.queueMicrotask
  const held: VoidFunction[] = []
  vi.stubGlobal('queueMicrotask', (callback: VoidFunction) => {
    held.push(callback)
  })
  let released = false
  const scheduler = {
    release() {
      if (released) return
      released = true
      vi.stubGlobal('queueMicrotask', actualQueue)
      for (const callback of held.splice(0)) callback()
    },
  }
  heldSchedulers.push(scheduler)
  return scheduler
}
async function finish(index = 0, text = 'QUICK_REPLY') {
  const send = sends[index]
  if (!send) throw new Error('Missing actual caller API boundary')
  const result = { ...response(), reply: text }
  act(() => {
    send.callbacks.onDone?.(result)
    send.done.resolve(result)
  })
  await drain()
}
beforeEach(() => {
  vi.useFakeTimers({
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'],
  })
  localStorage.clear()
  sessionStorage.clear()
  sends.length = 0
  heldSchedulers.length = 0
  boundary.user = { id: 'voice-user-1', name: 'Fixture learner', plan: 'free' }
  boundary.auth.mockReset().mockReturnValue({})
  boundary.toastError.mockClear()
  boundary.speak.mockReset().mockResolvedValue(1)
  boundary.stopSpeaking.mockClear()
  boundary.send.mockReset().mockImplementation((params, callbacks, options) => {
    const done = deferred<CompanionResponse>()
    sends.push({ params, callbacks, options, done })
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
  heldSchedulers.forEach((scheduler) => scheduler.release())
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
describe('Companion actual Studio quick prompt atomic', () => {
  it.each(['learning', 'work'] as const)(
    'quick prompt all -> %s keeps signal/loading/reply',
    async (domain) => {
      await render()
      act(() => quick(domain).button.click())
      await drain()
      const before = {
        requests: sends.length,
        signalAborted: sends[0]?.options?.signal?.aborted,
        loading: output('loading'),
      }
      await finish()
      expect({
        ...before,
        replyVisible: output('messages').includes('QUICK_REPLY'),
        loadingAfterReply: output('loading'),
      }).toEqual({
        requests: 1,
        signalAborted: false,
        loading: 'true',
        replyVisible: true,
        loadingAfterReply: 'false',
      })
      expect(boundary.speak).not.toHaveBeenCalled()
    },
  )
  it('same-domain quick prompt dispatches once under the committed scope', async () => {
    await render()
    const domain = Array.from(container.querySelectorAll('button')).find(
      (item) => item.textContent?.trim() === 'Học tập',
    )
    if (!domain) throw new Error('Missing actual domain selector')
    act(() => domain.click())
    await drain()
    expect(output('domain')).toBe('learning')
    act(() => quick('learning').button.click())
    await drain()
    expect(sends).toHaveLength(1)
    expect(sends[0]?.params).toMatchObject({ domain: 'learning' })
    expect(sends[0]?.options?.signal?.aborted).toBe(false)
    await finish()
    expect(output('messages')).toContain('QUICK_REPLY')
  })
  it('CONTROL scheduler barrier holds only pending dispatch; release sends the active target once', async () => {
    await render()
    const scheduler = holdMicrotasks()
    act(() => quick('work').button.click())
    expect(sends).toHaveLength(0)
    act(() => scheduler.release())
    await drain()
    expect(sends).toHaveLength(1)
    expect(sends[0]?.params).toMatchObject({ domain: 'work' })
    expect(sends[0]?.options?.signal?.aborted).toBe(false)
    await finish()
    expect(output('messages')).toContain('QUICK_REPLY')
  })
  it('rapid pending learning/work clicks dispatch only the latest immutable target', async () => {
    await render()
    const scheduler = holdMicrotasks()
    const learning = quick('learning'),
      work = quick('work')
    act(() => {
      learning.button.click()
      work.button.click()
    })
    expect(sends).toHaveLength(0)
    expect(output('domain')).toBe('work')
    act(() => scheduler.release())
    await drain()
    expect(sends).toHaveLength(1)
    expect(sends[0]?.params).toMatchObject({
      domain: 'work',
      message: work.prompt.text,
    })
    await finish()
    expect(output('messages')).toContain('QUICK_REPLY')
  })
  for (const exit of ['unmount', 'user', 'ephemeral'] as const) {
    it(`${exit} before dispatch cancels the pending intent without new AI/TTS`, async () => {
      await render()
      const scheduler = holdMicrotasks()
      act(() => quick('learning').button.click())
      expect(sends).toHaveLength(0)
      if (exit === 'unmount') unmount()
      else if (exit === 'user') {
        boundary.user = { ...boundary.user, id: 'voice-user-2' }
        act(() =>
          root.render(
            <MemoryRouter>
              <Companion />
            </MemoryRouter>,
          ),
        )
      } else {
        const toggle = container.querySelector('button[role="switch"]')
        if (!(toggle instanceof HTMLButtonElement))
          throw new Error('Missing actual ephemeral switch')
        act(() => toggle.click())
      }
      act(() => scheduler.release())
      await drain()
      expect(sends).toHaveLength(0)
      expect(boundary.speak).not.toHaveBeenCalled()
      if (exit !== 'unmount') {
        act(() => quick('work').button.click())
        await drain()
        expect(sends).toHaveLength(1)
        expect(sends[0]?.params).toMatchObject({
          domain: 'work',
          ...(exit === 'ephemeral' ? { ephemeral: true } : {}),
        })
        await finish()
        expect(output('messages')).toContain('QUICK_REPLY')
      }
    })
  }
})
