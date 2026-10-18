import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { saveSpeakingSession, getSpeakingSessions, getUsage } from './lib/storage'
import { addMistake, getMistakes, syncMistakes, scheduleMistakeSync } from './lib/mistakes'
import { getStoredToken, setStoredToken, clearStoredToken } from '@core/authHeader'
import type { SpeakingSession } from './types'

const OWNER = 'voice-original-user'
let posts: { url: string; marker: string | null; body: unknown }[]
let failures: string[]
let responder: () => Promise<Response>
const REMOTE = {
  id: 'remote',
  wrong: 'remote wrong',
  corrected: 'remote corrected',
  explanation: 'remote feedback',
  source: 'speaking',
  dir: 'A',
  createdAt: 1,
  count: 1,
  lastReviewedAt: null,
  reviewCount: 0,
}
function marker() {
  const value = getStoredToken()
  if (!value) throw new Error('missing fixture marker')
  return value
}
function seedMistake() {
  addMistake(OWNER, {
    wrong: 'I was go',
    corrected: 'I went',
    explanation: 'synthetic correction',
    source: 'speaking',
    dir: 'A',
  })
}
function session(): SpeakingSession {
  return {
    id: '9eca1959-2978-43b6-97c6-4cd8bd9b1d7f',
    userId: OWNER,
    situation: 'small_talk',
    level: 'intermediate',
    messages: [
      {
        id: 'd21200ba-64b2-4ab4-b3f7-640f41a26fa2',
        role: 'assistant',
        content: 'synthetic private reply',
        speechEn: 'synthetic private reply',
        timestamp: 1,
      },
    ],
    createdAt: 1,
  }
}
async function flush() {
  for (let i = 0; i < 16; i++) await Promise.resolve()
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  localStorage.clear()
  sessionStorage.clear()
  posts = []
  failures = []
  setStoredToken()
  seedMistake()
  responder = () => Promise.resolve(Response.json({ mistakes: [REMOTE] }))
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
    if ((input !== '/api/history' && input !== '/api/mistakes') || init?.method !== 'POST') {
      failures.push('unmatched_http')
      throw new Error('UNMATCHED_HTTP')
    }
    posts.push({
      url: input,
      marker: getStoredToken(),
      body: typeof init.body === 'string' ? JSON.parse(init.body) : null,
    })
    return input === '/api/history' ? Promise.resolve(Response.json({ ok: true })) : responder()
  })
})
afterEach(async () => {
  await flush()
  expect(failures).toEqual([])
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})
describe('SESSION_SYNC_CONTRACT', () => {
  it('CONTROL default save keeps existing cloud push plus local receipt', async () => {
    saveSpeakingSession(session())
    await flush()
    expect(getSpeakingSessions(OWNER)).toHaveLength(1)
    expect(posts).toHaveLength(1)
    expect(posts[0]?.url).toBe('/api/history')
  })
  it('local-only save preserves original-user session while skipping cloud credentials', async () => {
    saveSpeakingSession(session(), { syncToCloud: false })
    await flush()
    expect(getSpeakingSessions(OWNER)).toHaveLength(1)
    expect(getSpeakingSessions(OWNER)[0]?.messages[0]?.content).toBe('synthetic private reply')
    expect(posts).toHaveLength(0)
    expect(getUsage(OWNER).speakingCount).toBe(0)
  })
  it('CONTROL same-marker guarded sync keeps existing merge', async () => {
    await syncMistakes(OWNER, { sessionMarker: marker() })
    expect(posts).toHaveLength(1)
    expect(getMistakes(OWNER).map((m) => m.id)).toContain('remote')
  })
  it('guarded sync rejects marker mismatch before reading credentials/fetch', async () => {
    const expected = marker()
    setStoredToken()
    await syncMistakes(OWNER, { sessionMarker: expected })
    expect(posts).toHaveLength(0)
    expect(getMistakes(OWNER).map((m) => m.id)).not.toContain('remote')
  })
  it('guarded sync rejects marker rotation during existing await getAuthHeader', async () => {
    const expected = marker()
    const pending = syncMistakes(OWNER, { sessionMarker: expected })
    setStoredToken()
    await pending
    expect(posts).toHaveLength(0)
    expect(getMistakes(OWNER).map((m) => m.id)).not.toContain('remote')
  })
  it('guarded sync never merges response into local after marker rotation while HTTP pending', async () => {
    const expected = marker()
    let release!: (r: Response) => void
    responder = () =>
      new Promise<Response>((done) => {
        release = done
      })
    const pending = syncMistakes(OWNER, { sessionMarker: expected })
    await flush()
    expect(posts).toHaveLength(1)
    expect(posts[0]?.marker).toBe(expected)
    setStoredToken()
    release(Response.json({ mistakes: [REMOTE] }))
    await pending
    expect(getMistakes(OWNER).map((m) => m.id)).not.toContain('remote')
  })
  it('guarded debounce checks captured marker at execution rather than only scheduling', async () => {
    scheduleMistakeSync(OWNER, 5, { sessionMarker: marker() })
    setStoredToken()
    vi.advanceTimersByTime(5)
    await flush()
    expect(posts).toHaveLength(0)
  })
  it('guarded debounce clones marker option before caller mutation', async () => {
    const options = { sessionMarker: marker() }
    scheduleMistakeSync(OWNER, 5, options)
    setStoredToken()
    Reflect.set(options, 'sessionMarker', marker())
    vi.advanceTimersByTime(5)
    await flush()
    expect(posts).toHaveLength(0)
  })
  it('CONTROL same-marker debounce still syncs once', async () => {
    scheduleMistakeSync(OWNER, 5, { sessionMarker: marker() })
    vi.advanceTimersByTime(5)
    await flush()
    expect(posts).toHaveLength(1)
    expect(getMistakes(OWNER).map((m) => m.id)).toContain('remote')
  })
  it('CONTROL unguarded legacy caller keeps default sync behavior', async () => {
    const pending = syncMistakes(OWNER)
    setStoredToken()
    await pending
    expect(posts).toHaveLength(1)
    expect(getMistakes(OWNER).map((m) => m.id)).toContain('remote')
  })
  it('guarded debounce rejects logout (null current marker)', async () => {
    scheduleMistakeSync(OWNER, 5, { sessionMarker: marker() })
    clearStoredToken()
    vi.advanceTimersByTime(5)
    await flush()
    expect(posts).toHaveLength(0)
  })
  it('guarded sync không gửi dữ liệu khi session marker chưa quan sát được', async () => {
    clearStoredToken()
    await syncMistakes(OWNER, { sessionMarker: null })
    expect(posts).toHaveLength(0)
    expect(getMistakes(OWNER).map((m) => m.id)).not.toContain('remote')
  })

  it('stale completion không thay lịch đồng bộ hợp lệ của tài khoản mới', async () => {
    const stale = marker()
    setStoredToken()
    addMistake('next-user', {
      wrong: 'new account wrong',
      corrected: 'new account corrected',
      explanation: 'new account feedback',
      source: 'speaking',
      dir: 'A',
    })
    scheduleMistakeSync('next-user', 5, { sessionMarker: marker() })
    scheduleMistakeSync(OWNER, 5, { sessionMarker: stale })
    vi.advanceTimersByTime(5)
    await flush()
    expect(posts).toHaveLength(1)
    expect(posts[0]?.body).toMatchObject({
      mistakes: [expect.objectContaining({ wrong: 'new account wrong' })],
    })
  })
})
