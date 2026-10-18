// Actual Companion + actual companionApi; fake HTTP/auth getter/device/TTS and visual leaf only.
import { act, type ComponentProps, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import Companion from './pages/companion/Companion'
import { getStoredToken, setStoredToken } from '@core/authHeader'
import { installMediaFixture } from './voiceLifecycleFixtures'
import type { Observer } from './lib/voiceMetrics'
import type { VoiceEvent, TurnOptions } from '@dhcb/core-contracts/voiceMetrics'
type StudioProps = ComponentProps<
  typeof import('./components/CompanionStudios/StudioDialogue').default
>
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
const boundary = vi.hoisted(() => ({
  observer: null as Observer | null,
  events: [] as VoiceEvent[],
  user: { id: 'edge-user-1', name: 'First synthetic learner', plan: 'free' },
  auth: vi.fn<() => Record<string, string>>(() => ({})),
  speak: vi.fn(async () => 1),
  stopSpeaking: vi.fn(),
  toastError: vi.fn(),
}))
vi.mock('./lib/voiceMetricsLocal', async () => {
  const { createVoiceObserver } = await import('./lib/voiceMetrics')
  return {
    voiceMetrics: {
      startTurn(options: TurnOptions) {
        if (!boundary.observer)
          boundary.observer = createVoiceObserver({
            enabled: true,
            sink: (event) => {
              boundary.events.push(event)
            },
          })
        return boundary.observer.startTurn(options)
      },
    },
  }
})
vi.mock('./components/Layout', () => ({ default: () => null }))
vi.mock('./components/MeshTelemetry/RealtimeTelemetryBar', () => ({ default: () => null }))
vi.mock('./components/CompanionStudios/StudioLoadingSkeleton', () => ({ default: () => null }))
vi.mock('./components/CompanionStudios/StudioDialogue', () => ({
  default: ({ voice, loading, messages, handleSend }: StudioProps) => (
    <div>
      <output data-testid="voice">{voice.state}</output>
      <output data-testid="loading">{String(loading)}</output>
      <output data-testid="messages">{messages.map((message) => message.text).join('|')}</output>
      <button onClick={() => handleSend('synthetic direct voice input', true)}>DIRECT-VOICE</button>
      <button onClick={() => handleSend('synthetic typed input')}>DIRECT-TYPED</button>
      <button onClick={voice.start}>CAPTURE-START</button>
      <button onClick={voice.stop}>CAPTURE-STOP</button>
      <button onClick={voice.stopSession}>STOP-SESSION</button>
    </div>
  ),
}))
vi.mock('@core/PageShell', () => ({
  MAIN_CONTENT_ID: 'main-content',
  PageShell: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))
vi.mock('./context/useAuth', () => ({ useAuth: () => ({ user: boundary.user }) }))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ error: boundary.toastError, success: vi.fn(), info: vi.fn() }),
}))
vi.mock('@core/authHeader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@core/authHeader')>()
  return { ...actual, getAuthHeader: boundary.auth }
})
vi.mock('./lib/tts', () => ({ speak: boundary.speak, stopSpeaking: boundary.stopSpeaking }))
vi.mock('./lib/companionMemoryApi', () => ({
  fetchCompanionMemorySettings: async () => ({
    rememberMemories: false,
    useHistory: false,
    suggestMemories: false,
  }),
  updateCompanionMemorySettings: vi.fn(),
}))
vi.mock('./lib/onboarding', () => ({ useOnboarding: () => null }))
// Không vi.mock companionApi: request + SSE parser/callback sequence đều chạy source thật.
interface Post {
  readonly marker: string | null
  readonly signal?: AbortSignal | null
  readonly controller: ReadableStreamDefaultController<Uint8Array>
  closed: boolean
  canceled: boolean
}
const posts: Post[] = []
let fixture: ReturnType<typeof installMediaFixture>
let container: HTMLDivElement
let root: Root
let mounted = false
async function drain() {
  await act(async () => {
    for (let n = 0; n < 24; n++) await Promise.resolve()
  })
}
async function render() {
  act(() =>
    root.render(
      <MemoryRouter>
        <Companion />
      </MemoryRouter>,
    ),
  )
  await drain()
}
function button(label: string) {
  const node = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent?.trim() === label,
  )
  if (!node) throw new Error('MISSING_PUBLIC_EDGE_CONTROL')
  return node
}
function output(id: string) {
  return container.querySelector(`[data-testid="${id}"]`)?.textContent ?? ''
}
beforeEach(() => {
  boundary.observer = null
  boundary.events = []
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
  localStorage.clear()
  sessionStorage.clear()
  setStoredToken()
  boundary.user = { id: 'edge-user-1', name: 'First synthetic learner', plan: 'free' }
  boundary.auth.mockClear()
  boundary.speak.mockClear()
  boundary.stopSpeaking.mockClear()
  boundary.toastError.mockClear()
  posts.length = 0
  fixture = installMediaFixture()
  const deviceFetch = globalThis.fetch
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    if (input === '/api/companion' && (!init?.method || init.method === 'GET'))
      return Promise.resolve(Response.json({ messages: [] }))
    if (input === '/api/companion' && init?.method === 'POST') {
      let entry: Post | undefined
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          entry = {
            marker: getStoredToken(),
            signal: init.signal,
            controller,
            closed: false,
            canceled: false,
          }
          posts.push(entry)
        },
        cancel() {
          if (entry) entry.canceled = true
        },
      })
      return Promise.resolve(
        new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }),
      )
    }
    return deviceFetch(input, init)
  })
  vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {})
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  mounted = true
})
afterEach(async () => {
  if (mounted) {
    act(() => root.unmount())
    mounted = false
  }
  for (const post of posts)
    if (!post.closed && !post.canceled) {
      post.controller.close()
      post.closed = true
    }
  await drain()
  expect(fixture.activeTracks()).toBe(0)
  expect(fixture.boundaryFailures).toEqual([])
  fixture.dispose()
  container.remove()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
function latestEnd(input: 'typed' | 'microphone') {
  const start = boundary.events.find((e) => e.event === 'turn_started' && e.input === input)
  if (!start) throw Error('NO_MATCHING_TURN')
  const ends = boundary.events.filter((e) => e.event === 'turn_ended' && e.turnId === start.turnId)
  expect(ends).toHaveLength(1)
  return ends[0]
}
it('INDEPENDENT Companion marker changes after committed loading before auth continuation, no gesture', async () => {
  await render()
  act(() => button('DIRECT-TYPED').click())
  expect(output('loading')).toBe('true')
  expect(posts).toHaveLength(0)
  // act flushed existing loading render; marker rotation itself does not trigger React.
  setStoredToken()
  await drain()
  expect(posts).toHaveLength(0)
  expect(boundary.speak).not.toHaveBeenCalled()
  expect(latestEnd('typed')).toMatchObject({ status: 'cancelled', reason: 'unknown' })
})
it('INDEPENDENT Companion busy typed response rejects completed mic transcript with unknown, no cancel', async () => {
  await render()
  act(() => button('DIRECT-TYPED').click())
  await drain()
  expect(posts).toHaveLength(1)
  expect(output('loading')).toBe('true')
  act(() => button('CAPTURE-START').click())
  await drain()
  expect(fixture.permissions).toHaveLength(1)
  const stream = fixture.grant()
  await drain()
  expect(output('voice')).toBe('recording')
  act(() => button('CAPTURE-STOP').click())
  await drain()
  expect(fixture.sttRequests).toHaveLength(1)
  fixture.respond('synthetic completed microphone transcript')
  await drain()
  expect(posts).toHaveLength(1)
  expect(posts[0]?.signal?.aborted).toBe(false)
  expect(stream.track.active).toBe(false)
  expect(boundary.speak).not.toHaveBeenCalled()
  expect(latestEnd('microphone')).toMatchObject({ status: 'cancelled', reason: 'unknown' })
})
