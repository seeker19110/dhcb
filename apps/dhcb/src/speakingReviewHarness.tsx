// Portable helper sibling of apps/dhcb/src tests; actual page/adapters/storage/cloud/authHeader.
import { act, StrictMode, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, vi } from 'vitest'
import Speaking from './pages/subjects/english/Speaking'
import { getUsage } from './lib/storage'
import { setStoredToken, getStoredToken } from '@core/authHeader'
import { FixtureMediaRecorder, installMediaFixture } from './voiceLifecycleFixtures'
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
const mocked = vi.hoisted(() => ({
  user: { id: 'voice-user-1', name: 'Fixture learner', plan: 'free' },
  speakBilingual: vi.fn<typeof import('./lib/tts').speakBilingual>(),
  stopSpeaking: vi.fn(),
}))
export const boundary = mocked
vi.mock('./components/Layout', () => ({ default: () => null }))
vi.mock('./components/EvaluationResultView', () => ({ default: () => null }))
vi.mock('@core/PageShell', () => ({
  MAIN_CONTENT_ID: 'main-content',
  PageShell: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))
vi.mock('./context/useAuth', () => ({ useAuth: () => ({ user: mocked.user }) }))
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ error: vi.fn(), success: vi.fn(), info: vi.fn() }),
}))
vi.mock('./lib/tts', () => ({
  speakBilingual: mocked.speakBilingual,
  stopSpeaking: mocked.stopSpeaking,
  isTTSSupported: () => true,
  getRatePref: () => 1,
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
vi.mock('./lib/tutorFeedback', () => ({ reportTutorFeedback: vi.fn() }))
vi.mock('./lib/haptics', () => ({ haptics: { start: vi.fn(), stop: vi.fn() } }))
export let fixture: ReturnType<typeof installMediaFixture>
export let container: HTMLDivElement
export let historyPosts: { marker: string | null; body: unknown }[]
let root: Root
let mounted = false
export async function drain() {
  await act(async () => {
    for (let i = 0; i < 16; i++) await Promise.resolve()
  })
}
function install(mode: 'server' | 'native' = 'server') {
  fixture?.dispose()
  fixture = installMediaFixture(mode)
  const savedFetch = globalThis.fetch
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    if (input === '/api/history' && init?.method === 'POST') {
      historyPosts.push({
        marker: getStoredToken(),
        body: typeof init.body === 'string' ? JSON.parse(init.body) : null,
      })
      return Promise.resolve(Response.json({ ok: true }))
    }
    return savedFetch(input, init)
  })
}
export function unmount() {
  if (mounted) {
    act(() => root.unmount())
    mounted = false
  }
}
export async function renderSpeaking(strict = false) {
  act(() =>
    root.render(
      strict ? (
        <StrictMode>
          <MemoryRouter>
            <Speaking />
          </MemoryRouter>
        </StrictMode>
      ) : (
        <MemoryRouter>
          <Speaking />
        </MemoryRouter>
      ),
    ),
  )
  await drain()
}
export function button(label: string): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll('button')).find(
    (item) => item.getAttribute('aria-label') === label || item.textContent === label,
  )
  if (!found) throw new Error('Missing UI button: ' + label)
  return found
}
export async function click(label: string) {
  const found = button(label)
  expect(found.disabled, 'UI button enabled: ' + label).toBe(false)
  act(() => found.click())
  await drain()
}
export async function advance(ms: number) {
  await act(async () => {
    vi.advanceTimersByTime(ms)
    for (let i = 0; i < 16; i++) await Promise.resolve()
  })
  await drain()
}
export async function openSpeaking(
  dir: 'A' | 'B',
  mode: 'server' | 'native' = 'server',
  strict = false,
) {
  install(mode)
  localStorage.setItem('et_direction', dir)
  await renderSpeaking(strict)
  await click(dir === 'A' ? 'Bắt đầu luyện nói' : 'Start speaking practice')
  expect(fixture.agentRequests).toHaveLength(1)
  expect(mocked.speakBilingual).toHaveBeenCalledTimes(1)
  expect(getUsage('voice-user-1').speakingCount).toBe(1)
  await advance(5000)
  fixture.agentRequests.length = 0
  mocked.speakBilingual.mockClear()
  historyPosts.length = 0
}
export async function sendServerRecording(dir: 'A' | 'B') {
  await click(dir === 'A' ? 'Bắt đầu ghi âm' : 'Start recording')
  fixture.grant()
  await drain()
  expect(FixtureMediaRecorder.instances[0]?.startCalls).toBe(1)
  await click(dir === 'A' ? 'Dừng ghi âm' : 'Stop recording')
  expect(fixture.sttRequests).toHaveLength(1)
  const body = fixture.sttRequests[0]?.init?.body
  if (typeof body !== 'string') throw new Error('Expected real adapter JSON body')
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
  setStoredToken()
  mocked.user = { id: 'voice-user-1', name: 'Fixture learner', plan: 'free' }
  mocked.speakBilingual.mockReset().mockResolvedValue(undefined)
  mocked.stopSpeaking.mockClear()
  historyPosts = []
  vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {})
  install()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  mounted = true
})
afterEach(async () => {
  unmount()
  await drain()
  expect(fixture.activeTracks()).toBe(0)
  fixture.dispose()
  container.remove()
  expect(fixture.boundaryFailures).toEqual([])
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
