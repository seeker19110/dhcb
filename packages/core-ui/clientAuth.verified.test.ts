import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCurrentUserVerified, SessionVerificationError } from './clientAuth'

const profile = { id: 'u1', email: 'u@example.com', name: 'An', plan: 'free', onboarded: true }
describe('getCurrentUserVerified', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('gsa_session_present_v1', 'session:fixture')
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })
  it('đọc cookie authenticated và validate hồ sơ server', async () => {
    const fetchMock = vi.fn(async () => Response.json(profile))
    vi.stubGlobal('fetch', fetchMock)
    expect(await getCurrentUserVerified()).toMatchObject(profile)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth?action=me',
      expect.objectContaining({ credentials: 'include', signal: expect.any(AbortSignal) }),
    )
  })
  it.each([401, 403, 429, 500])('HTTP %i không tự thay token', async (status) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status })),
    )
    await expect(getCurrentUserVerified()).rejects.toBeInstanceOf(SessionVerificationError)
    expect(localStorage.getItem('gsa_session_present_v1')).toBe('session:fixture')
  })
  it.each([
    {},
    { ...profile, onboarded: 'true' },
    { ...profile, plan: 'admin' },
    { ...profile, id: '' },
  ])('từ chối hồ sơ không hợp lệ %j', async (body) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(body)),
    )
    await expect(getCurrentUserVerified()).rejects.toBeInstanceOf(SessionVerificationError)
  })
  it('timeout 15 giây không treo pending', async () => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal!.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            )
          }),
      ),
    )
    const result = expect(getCurrentUserVerified()).rejects.toThrow()
    await vi.advanceTimersByTimeAsync(15_000)
    await result
  })
})
