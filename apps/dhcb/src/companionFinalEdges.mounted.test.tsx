// Actual Companion + actual companionApi; fake HTTP/auth getter/device/TTS and visual leaf only.
import { act, type ComponentProps, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompanionResponse } from './lib/companionApi'
import Companion from './pages/companion/Companion'
import { getStoredToken, setStoredToken } from '@core/authHeader'
import { installMediaFixture } from './voiceLifecycleFixtures'
type StudioProps = ComponentProps<
  typeof import('./components/CompanionStudios/StudioDialogue').default
>
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
const boundary = vi.hoisted(() => ({
  user: { id: 'edge-user-1', name: 'First synthetic learner', plan: 'free' },
  auth: vi.fn<() => Record<string, string>>(() => ({})),
  speak: vi.fn(async () => 1),
  stopSpeaking: vi.fn(),
  toastError: vi.fn(),
}))
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
function response(reply: string): CompanionResponse {
  return {
    reply,
    intent: 'general_conversation',
    targetDomain: 'learning',
    contextPackage: {
      schemaVersion: 1,
      id: 'e1206615-845c-4711-9a1b-df731e325ed1',
      personId: '1a18a132-dd36-4c25-a2eb-14a342fa6340',
      requestId: 'synthetic-edge-request',
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
async function finish(index: number, reply: string) {
  const post = posts[index]
  if (!post || post.closed || post.canceled) throw new Error('MISSING_ACTIVE_HTTP_POST')
  act(() => {
    post.controller.enqueue(
      new TextEncoder().encode('event: done\ndata: ' + JSON.stringify(response(reply)) + '\n\n'),
    )
    post.controller.close()
    post.closed = true
  })
  await drain()
}
beforeEach(() => {
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
describe('Final actual Companion API ownership edges', () => {
  it('voice cancel before fetch rejects pending auth microtask continuation without HTTP', async () => {
    await render()
    const calls = boundary.auth.mock.calls.length
    act(() => {
      button('DIRECT-VOICE').click()
      expect(boundary.auth).toHaveBeenCalledTimes(calls + 1)
      expect(posts).toHaveLength(0)
      button('STOP-SESSION').click()
    })
    await drain()
    expect(boundary.speak).not.toHaveBeenCalled()
    expect(posts, 'CANCELED_VOICE_PREFETCH_STILL_SENT_COMPANION_HTTP').toHaveLength(0)
    expect(output('loading')).toBe('false')
  })
  it('CONTROL voice cancel after fetch keeps sent reply/loading receipt and suppresses TTS', async () => {
    await render()
    act(() => button('DIRECT-VOICE').click())
    await drain()
    expect(posts).toHaveLength(1)
    expect(output('loading')).toBe('true')
    act(() => button('STOP-SESSION').click())
    await drain()
    expect(posts[0]?.signal?.aborted).toBe(false)
    expect(output('loading')).toBe('true')
    await finish(0, 'SENT_CONTROL_REPLY')
    expect(posts).toHaveLength(1)
    expect(output('messages')).toContain('SENT_CONTROL_REPLY')
    expect(output('loading')).toBe('false')
    expect(boundary.speak).not.toHaveBeenCalled()
  })
  it('committed new account has no cached private messages and fresh voice remains usable', async () => {
    await render()
    act(() => button('DIRECT-VOICE').click())
    await drain()
    await finish(0, 'FIRST_OWNER_PRIVATE_CANARY')
    expect(output('messages')).toContain('FIRST_OWNER_PRIVATE_CANARY')
    setStoredToken()
    boundary.user = { id: 'edge-user-2', name: 'Second synthetic learner', plan: 'free' }
    await render()
    boundary.speak.mockClear()
    act(() => button('DIRECT-VOICE').click())
    await drain()
    expect(posts).toHaveLength(2)
    expect(posts[1]?.marker).toBe(getStoredToken())
    await finish(1, 'SECOND_OWNER_CURRENT_REPLY')
    expect(output('loading')).toBe('false')
    expect(output('messages')).toContain('SECOND_OWNER_CURRENT_REPLY')
    expect(boundary.speak).toHaveBeenCalledExactlyOnceWith('SECOND_OWNER_CURRENT_REPLY', 'vi-VN')
    expect(output('messages'), 'AUTH_COMMIT_RETAINED_PREVIOUS_PRIVATE_MESSAGES').not.toContain(
      'FIRST_OWNER_PRIVATE_CANARY',
    )
  })
})
