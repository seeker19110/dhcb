import { act, StrictMode, useContext } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { AuthContext, type AuthContextValue } from './authContext'
import { SessionVerificationError } from '../lib/auth'
import type { User } from '../types'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const calls = vi.hoisted(() => ({ read: vi.fn(), verified: vi.fn() }))
vi.mock('../lib/auth', async (original) => ({
  ...(await original<typeof import('../lib/auth')>()),
  getCurrentUser: calls.read,
  getCurrentUserVerified: calls.verified,
}))
vi.mock('../lib/preloadBrowse', () => ({ preloadBrowseChunks: vi.fn() }))
vi.mock('../lib/audioCache', () => ({ clearAudioCache: vi.fn(async () => {}) }))
vi.mock('../lib/guestProgressKeys', () => ({ hasGuestProgress: () => false }))
vi.mock('../lib/guestProgress', () => ({ mergeGuestProgressInto: vi.fn() }))
const USER: User = {
  id: 'u1',
  email: 'user@example.com',
  name: 'An',
  plan: 'free',
  onboarded: false,
  createdAt: 1,
}
function deferred() {
  let resolve!: (user: User) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<User>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

describe('AuthProvider refreshVerified', () => {
  let root: Root, container: HTMLDivElement, context: AuthContextValue
  let unmounted = false
  function Consumer() {
    context = useContext(AuthContext)
    return <p>{context.user?.id}</p>
  }
  beforeEach(async () => {
    localStorage.clear()
    localStorage.setItem('gsa_session_present_v1', 'session:u1')
    calls.read.mockReset().mockResolvedValue(USER)
    calls.verified.mockReset()
    unmounted = false
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    await act(async () =>
      root.render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>,
      ),
    )
  })
  afterEach(() => {
    if (!unmounted) act(() => root.unmount())
    container.remove()
  })

  it('khởi động chỉ có cookie: adoption đặt token mới vẫn áp dụng user', async () => {
    act(() => root.unmount())
    localStorage.removeItem('gsa_session_present_v1')
    calls.read.mockImplementationOnce(async () => {
      localStorage.setItem('gsa_session_present_v1', 'session:adopted')
      return USER
    })
    root = createRoot(container)
    await act(async () =>
      root.render(
        <AuthProvider>
          <Consumer />
        </AuthProvider>,
      ),
    )
    expect(context.user?.id).toBe('u1')
    expect(context.loading).toBe(false)
    expect(localStorage.getItem('gsa_session_present_v1')).toBe('session:adopted')
  })

  it.each(['success', 'reject'] as const)(
    'StrictMode: request cũ %s không kết thúc loading trước phiên hiện hành',
    async (outcome) => {
      act(() => root.unmount())
      const old = deferred()
      const current = deferred()
      calls.read.mockReset().mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise)
      root = createRoot(container)
      await act(async () =>
        root.render(
          <StrictMode>
            <AuthProvider>
              <Consumer />
            </AuthProvider>
          </StrictMode>,
        ),
      )
      expect(calls.read).toHaveBeenCalledTimes(2)
      await act(async () => {
        if (outcome === 'success') old.resolve(USER)
        else old.reject(new Error('stale offline'))
      })
      expect(context.loading).toBe(true)
      expect(context.user).toBeNull()
      await act(async () => current.resolve({ ...USER, id: 'u2' }))
      expect(context.loading).toBe(false)
      expect(context.user?.id).toBe('u2')
    },
  )

  it.each(['success', 'reject'] as const)(
    'StrictMode: request cũ %s sau phiên hiện hành không ghi đè user/loading',
    async (outcome) => {
      act(() => root.unmount())
      const old = deferred()
      const current = deferred()
      calls.read.mockReset().mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise)
      root = createRoot(container)
      await act(async () =>
        root.render(
          <StrictMode>
            <AuthProvider>
              <Consumer />
            </AuthProvider>
          </StrictMode>,
        ),
      )
      await act(async () => current.resolve({ ...USER, id: 'u2' }))
      expect(context.loading).toBe(false)
      expect(context.user?.id).toBe('u2')
      await act(async () => {
        if (outcome === 'success') old.resolve(USER)
        else old.reject(new Error('stale offline'))
      })
      expect(context.loading).toBe(false)
      expect(context.user?.id).toBe('u2')
    },
  )

  it('verified success cập nhật cùng user và trả hồ sơ server', async () => {
    calls.verified.mockResolvedValue({ ...USER, onboarded: true })
    await act(async () =>
      expect(await context.refreshVerified('u1')).toMatchObject({ id: 'u1', onboarded: true }),
    )
    expect(context.user?.onboarded).toBe(true)
  })
  it.each(['offline', 'http', 'invalid-response'])('lỗi %s giữ phiên và token', async (reason) => {
    calls.verified.mockRejectedValue(new Error(reason))
    await expect(context.refreshVerified('u1')).rejects.toThrow(reason)
    expect(context.user).toEqual(USER)
    expect(localStorage.getItem('gsa_session_present_v1')).toBe('session:u1')
  })
  it('401 hợp lệ chuyển guest và xóa token, không trả success', async () => {
    calls.verified.mockRejectedValue(new SessionVerificationError('unauthorized'))
    await act(async () => {
      await expect(context.refreshVerified('u1')).rejects.toThrow()
    })
    expect(context.isGuest).toBe(true)
    expect(localStorage.getItem('gsa_session_present_v1')).toBeNull()
  })
  it('response user khác bị từ chối trước khi áp dụng context', async () => {
    calls.verified.mockResolvedValue({ ...USER, id: 'u2' })
    await expect(context.refreshVerified('u1')).rejects.toThrow()
    expect(context.user?.id).toBe('u1')
  })
  it.each(['success', '401'] as const)(
    'response %s cũ sau đổi tài khoản không khôi phục/xóa phiên mới',
    async (outcome) => {
      const old = deferred()
      calls.verified.mockReturnValue(old.promise)
      const checking = context.refreshVerified('u1').catch(() => undefined)
      localStorage.setItem('gsa_session_present_v1', 'session:u2')
      calls.read.mockResolvedValue({ ...USER, id: 'u2' })
      await act(async () => context.refresh())
      await act(async () => {
        if (outcome === 'success') old.resolve({ ...USER, onboarded: true })
        else old.reject(new SessionVerificationError('unauthorized'))
        await checking
      })
      expect(context.user?.id).toBe('u2')
      expect(localStorage.getItem('gsa_session_present_v1')).toBe('session:u2')
    },
  )
  it('response cũ sau logout không khôi phục user', async () => {
    const old = deferred()
    calls.verified.mockReturnValue(old.promise)
    const checking = context.refreshVerified('u1').catch(() => undefined)
    localStorage.removeItem('gsa_session_present_v1')
    calls.read.mockResolvedValue(null)
    await act(async () => context.refresh())
    await act(async () => {
      old.resolve(USER)
      await checking
    })
    expect(context.isGuest).toBe(true)
  })
  it('response sau unmount bị từ chối', async () => {
    const old = deferred()
    calls.verified.mockReturnValue(old.promise)
    const checking = context.refreshVerified('u1')
    act(() => root.unmount())
    unmounted = true
    old.resolve(USER)
    await expect(checking).rejects.toThrow()
  })
})
