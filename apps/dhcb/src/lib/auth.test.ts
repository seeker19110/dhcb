// Test src/lib/auth.ts — client đăng nhập/đăng ký, gọi /api/auth qua fetch.
// Mock fetch toàn cục + mock localStorage (qua @core/authHeader) để kiểm luồng lưu/xoá cờ phiên không bí mật.

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

describe('src/lib/auth.ts', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('login', () => {
    it('đăng nhập thành công → chỉ lưu cờ phiên vào localStorage, trả user', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: {
            id: 'u1',
            email: 'a@b.com',
            name: 'A',
            plan: 'free',
            onboarded: false,
            createdAt: 1,
          },
        }),
      })
      const { login } = await import('./auth')

      const user = await login('a@b.com', '123456')

      expect(user?.email).toBe('a@b.com')
      expect(localStorage.getItem('gsa_session_present_v1')).toMatch(/^session:/)
      expect(localStorage.getItem('gsa_session_token_v1')).toBeNull()
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', email: 'a@b.com', password: '123456' }),
        }),
      )
    })

    it('sai mật khẩu (resp không ok) → trả null, KHÔNG lưu cờ phiên', async () => {
      fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'sai' }) })
      const { login } = await import('./auth')

      const user = await login('a@b.com', 'wrong')

      expect(user).toBeNull()
      expect(localStorage.getItem('gsa_session_present_v1')).toBeNull()
    })

    it('lỗi mạng (fetch reject) → ném lỗi ra ngoài, không lưu cờ phiên', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))
      const { login } = await import('./auth')

      await expect(login('a@b.com', '123456')).rejects.toThrow('network down')
      expect(localStorage.getItem('gsa_session_present_v1')).toBeNull()
    })
  })

  describe('register', () => {
    it('đăng ký thành công → lưu cờ phiên, trả user', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: {
            id: 'u2',
            email: 'new@b.com',
            name: 'New',
            plan: 'free',
            onboarded: false,
            createdAt: 1,
          },
        }),
      })
      const { register } = await import('./auth')

      const user = await register('new@b.com', 'New', 'a-strong-password')

      expect(user?.id).toBe('u2')
      expect(localStorage.getItem('gsa_session_present_v1')).toMatch(/^session:/)
      expect(localStorage.getItem('gsa_session_token_v1')).toBeNull()
    })

    it('email đã tồn tại (resp không ok) → trả null', async () => {
      fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'trùng' }) })
      const { register } = await import('./auth')

      expect(await register('a@b.com', 'A', 'a-strong-password')).toBeNull()
    })
  })

  describe('logout', () => {
    it('xoá cờ phiên khỏi localStorage kể cả khi API logout lỗi', async () => {
      localStorage.setItem('gsa_session_present_v1', 'session:tok-cu')
      fetchMock.mockRejectedValue(new Error('mạng lỗi'))
      const { logout } = await import('./auth')

      await logout()

      expect(localStorage.getItem('gsa_session_present_v1')).toBeNull()
    })

    it('gọi API logout thành công → vẫn xoá cờ phiên', async () => {
      localStorage.setItem('gsa_session_present_v1', 'session:tok-cu')
      fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
      const { logout } = await import('./auth')

      await logout()

      expect(localStorage.getItem('gsa_session_present_v1')).toBeNull()
    })
  })

  describe('getCurrentUser', () => {
    // [2026-08-28] Ca này TRƯỚC ĐÂY khẳng định "không có token → KHÔNG gọi fetch". Khẳng định
    // đó đã sai kể từ khi cookie phiên dùng chung giữa các subdomain: `localStorage` cô lập
    // theo origin, nên kho cục bộ rỗng KHÔNG còn đồng nghĩa với "chưa đăng nhập" — người dùng
    // mở `hoc-tap.`/`hub.` vẫn có cookie hợp lệ. Nay đúng một lượt gọi để hỏi cookie; chỉ khi
    // cookie cũng không có mới kết luận chưa đăng nhập.
    it('không token và cookie cũng không hợp lệ → null, đúng MỘT lượt hỏi cookie', async () => {
      const { getCurrentUser } = await import('./auth')
      fetchMock.mockResolvedValue({ ok: false, status: 401 })

      const user = await getCurrentUser()

      expect(user).toBeNull()
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0]![0]).toBe('/api/auth')
      // Không được gọi tiếp ?action=me khi đã biết chắc là chưa đăng nhập.
      expect(fetchMock.mock.calls.some((c) => String(c[0]).includes('action=me'))).toBe(false)
    })

    it('có cờ phiên, server trả 200 → trả profile kèm createdAt', async () => {
      localStorage.setItem('gsa_session_present_v1', 'session:tok-abc')
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'u1',
          email: 'a@b.com',
          name: 'A',
          plan: 'free',
          onboarded: true,
        }),
      })
      const { getCurrentUser } = await import('./auth')

      const user = await getCurrentUser()

      expect(user?.email).toBe('a@b.com')
      expect(typeof user?.createdAt).toBe('number')
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth?action=me',
        expect.objectContaining({ headers: {}, credentials: 'include' }),
      )
    })

    it('cookie hết hạn (server trả 401) → xoá cờ phiên, trả null', async () => {
      localStorage.setItem('gsa_session_present_v1', 'session:tok-het-han')
      fetchMock.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      })
      const { getCurrentUser } = await import('./auth')

      const user = await getCurrentUser()

      expect(user).toBeNull()
      expect(localStorage.getItem('gsa_session_present_v1')).toBeNull()
    })

    it('lỗi khác 401 (vd 500) → trả null nhưng KHÔNG xoá cờ phiên', async () => {
      localStorage.setItem('gsa_session_present_v1', 'session:tok-con-hieu-luc')
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'server error' }),
      })
      const { getCurrentUser } = await import('./auth')

      const user = await getCurrentUser()

      expect(user).toBeNull()
      expect(localStorage.getItem('gsa_session_present_v1')).toBe('session:tok-con-hieu-luc')
      expect(localStorage.getItem('gsa_session_token_v1')).toBeNull()
    })
  })

  describe('loginWithGoogle', () => {
    it('thiếu VITE_GOOGLE_CLIENT_ID → ném lỗi', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
      const { loginWithGoogle } = await import('./auth')

      await expect(loginWithGoogle()).rejects.toThrow('Thiếu VITE_GOOGLE_CLIENT_ID')
    })

    it('người dùng đóng popup (error_callback) → trả null', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id-test')
      const requestAccessToken = vi.fn()
      window.google = {
        accounts: {
          oauth2: {
            initTokenClient: (config) => {
              // Giả lập người dùng đóng popup — gọi error_callback ngay
              queueMicrotask(() => config.error_callback?.({ type: 'popup_closed' }))
              return { requestAccessToken }
            },
          },
        },
      }
      const { loginWithGoogle } = await import('./auth')

      const user = await loginWithGoogle()

      expect(user).toBeNull()
      expect(requestAccessToken).toHaveBeenCalled()
      delete window.google
    })

    it('lấy được access_token → gọi API, lưu cờ phiên, trả user', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id-test')
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: {
            id: 'u3',
            email: 'g@b.com',
            name: 'G',
            plan: 'free',
            onboarded: false,
            createdAt: 1,
          },
        }),
      })
      window.google = {
        accounts: {
          oauth2: {
            initTokenClient: (config) => {
              queueMicrotask(() => config.callback({ access_token: 'gtok' }))
              return { requestAccessToken: vi.fn() }
            },
          },
        },
      }
      const { loginWithGoogle } = await import('./auth')

      const user = await loginWithGoogle()

      expect(user?.email).toBe('g@b.com')
      expect(localStorage.getItem('gsa_session_present_v1')).toMatch(/^session:/)
      expect(localStorage.getItem('gsa_session_token_v1')).toBeNull()
      delete window.google
    })

    it('popup bị chặn (popup_blocked_by_browser) → ném GoogleAuthError popup_blocked', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id-test')
      window.google = {
        accounts: {
          oauth2: {
            initTokenClient: (config) => {
              queueMicrotask(() => config.error_callback?.({ type: 'popup_blocked_by_browser' }))
              return { requestAccessToken: vi.fn() }
            },
          },
        },
      }
      const { loginWithGoogle, GoogleAuthError } = await import('./auth')

      await expect(loginWithGoogle()).rejects.toThrow(GoogleAuthError)
      delete window.google
    })

    it('sai origin (origin_mismatch) → ném GoogleAuthError origin_mismatch', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id-test')
      window.google = {
        accounts: {
          oauth2: {
            initTokenClient: (config) => {
              queueMicrotask(() => config.error_callback?.({ type: 'origin_mismatch' }))
              return { requestAccessToken: vi.fn() }
            },
          },
        },
      }
      const { loginWithGoogle, GoogleAuthError } = await import('./auth')

      await expect(loginWithGoogle()).rejects.toThrow(GoogleAuthError)
      delete window.google
    })

    it('từ chối quyền (access_denied) → ném GoogleAuthError access_denied', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id-test')
      window.google = {
        accounts: {
          oauth2: {
            initTokenClient: (config) => {
              queueMicrotask(() => config.error_callback?.({ type: 'access_denied' }))
              return { requestAccessToken: vi.fn() }
            },
          },
        },
      }
      const { loginWithGoogle, GoogleAuthError } = await import('./auth')

      await expect(loginWithGoogle()).rejects.toThrow(GoogleAuthError)
      delete window.google
    })
  })

  describe('loginWithGoogleRedirect', () => {
    it('thiếu VITE_GOOGLE_CLIENT_ID → ném lỗi', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
      const { loginWithGoogleRedirect } = await import('./auth')

      expect(() => loginWithGoogleRedirect()).toThrow('Thiếu VITE_GOOGLE_CLIENT_ID')
    })

    it('có VITE_GOOGLE_CLIENT_ID → chuyển hướng window.location.href với đúng params', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'client-id-test')
      const { loginWithGoogleRedirect } = await import('./auth')

      loginWithGoogleRedirect('/login')
      expect(window.location.href).toContain('accounts.google.com/o/oauth2/v2/auth')
      expect(window.location.href).toContain('client_id=client-id-test')
      expect(window.location.href).toContain('response_type=token')
    })
  })

  describe('handleOAuthRedirectCallback', () => {
    it('không có token trong URL → trả null', async () => {
      window.location.hash = ''
      window.location.search = ''
      const { handleOAuthRedirectCallback } = await import('./auth')

      const user = await handleOAuthRedirectCallback()
      expect(user).toBeNull()
    })

    it('có token trong URL hash → gọi API, lưu cờ phiên và trả user', async () => {
      sessionStorage.setItem('oauth_state_google', 'state-test')
      window.location.hash = '#access_token=redirect-token-123&token_type=Bearer&state=state-test'
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({
          authenticated: true,
          user: {
            id: 'u-redirect',
            email: 'redirect@test.com',
            name: 'Redirect User',
            plan: 'free',
            onboarded: false,
            createdAt: 1,
          },
        }),
      })
      const { handleOAuthRedirectCallback } = await import('./auth')

      const user = await handleOAuthRedirectCallback()
      expect(user?.email).toBe('redirect@test.com')
      expect(sessionStorage.getItem('oauth_state_google')).toBeNull()
      expect(window.location.hash).toBe('')
      expect(localStorage.getItem('gsa_session_present_v1')).toMatch(/^session:/)
      expect(localStorage.getItem('gsa_session_token_v1')).toBeNull()
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/auth',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'google-token', accessToken: 'redirect-token-123' }),
        }),
      )
    })
  })

  describe('preloadOAuthProviders', () => {
    it('không có client id nào cấu hình → không ném lỗi', async () => {
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '')
      vi.stubEnv('VITE_FACEBOOK_APP_ID', '')
      vi.stubEnv('VITE_APPLE_CLIENT_ID', '')
      vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', '')
      const { preloadOAuthProviders } = await import('./auth')

      expect(() => preloadOAuthProviders()).not.toThrow()
    })
  })

  describe('clearProfileCache', () => {
    it('là no-op, gọi không lỗi', async () => {
      const { clearProfileCache } = await import('./auth')
      expect(() => clearProfileCache()).not.toThrow()
    })
  })
})
