// packages/core-ui/clientAuth.test.ts — Kiểm thử module xác thực clientAuth và Safe Redirect.

import { describe, it, expect, vi, afterEach } from 'vitest'
import { getSafeRedirectUrl } from './clientAuth.js'

describe('packages/core-ui/clientAuth.ts', () => {
  describe('getSafeRedirectUrl', () => {
    it('không có tham số hoặc chuỗi rỗng → trả về fallbackUrl mặc định', () => {
      expect(getSafeRedirectUrl(null)).toBe('https://www.donghanhcungban.org/')
      expect(getSafeRedirectUrl('')).toBe('https://www.donghanhcungban.org/')
      expect(getSafeRedirectUrl('   ', '/dashboard')).toBe('/dashboard')
    })

    it('đường dẫn tương đối hợp lệ (bắt đầu bằng /) → cho phép', () => {
      expect(getSafeRedirectUrl('/')).toBe('/')
      expect(getSafeRedirectUrl('/login')).toBe('/login')
      expect(getSafeRedirectUrl('/practice?level=A1')).toBe('/practice?level=A1')
    })

    it('đường dẫn bắt đầu bằng // (protocol-relative URL lạ) → từ chối, trả fallbackUrl', () => {
      expect(getSafeRedirectUrl('//evil.com/phishing')).toBe('https://www.donghanhcungban.org/')
    })

    it('URL tuyệt đối thuộc domain donghanhcungban.org / donghanhcungban.com → cho phép', () => {
      expect(getSafeRedirectUrl('https://donghanhcungban.org/')).toBe(
        'https://donghanhcungban.org/',
      )
      expect(getSafeRedirectUrl('https://www.donghanhcungban.org/profile')).toBe(
        'https://www.donghanhcungban.org/profile',
      )
      expect(getSafeRedirectUrl('https://en-vi.donghanhcungban.org/learning-path')).toBe(
        'https://en-vi.donghanhcungban.org/learning-path',
      )
      expect(getSafeRedirectUrl('https://math.donghanhcungban.org/')).toBe(
        'https://www.donghanhcungban.org/',
      )
      expect(getSafeRedirectUrl('https://en-vi.donghanhcungban.com/test')).toBe(
        'https://www.donghanhcungban.org/',
      )
    })

    it('URL localhost / 127.0.0.1 khi dev → cho phép', () => {
      expect(getSafeRedirectUrl('http://localhost:3000/')).toBe('http://localhost:3000/')
      expect(getSafeRedirectUrl('http://localhost:5173/practice')).toBe(
        'http://localhost:5173/practice',
      )
      expect(getSafeRedirectUrl('http://127.0.0.1:3000/test')).toBe('http://127.0.0.1:3000/test')
    })

    it('URL độc hại / domain bên ngoài (Open Redirect Attack) → từ chối, trả fallbackUrl', () => {
      expect(getSafeRedirectUrl('https://evil.com/hack')).toBe('https://www.donghanhcungban.org/')
      expect(getSafeRedirectUrl('https://attacker-donghanhcungban.org/')).toBe(
        'https://www.donghanhcungban.org/',
      )
      expect(getSafeRedirectUrl('javascript:alert(1)')).toBe('https://www.donghanhcungban.org/')
    })
  })

  describe('callAuthApi, register, login, logout, getCurrentUser', () => {
    it('callAuthApi trả về null khi resp không ok', async () => {
      const { callAuthApi } = await import('./clientAuth.js')
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 400,
      } as unknown as Response)

      const res = await callAuthApi({ action: 'test' })
      expect(res).toBeNull()
    })

    it('register lưu token và trả user', async () => {
      const { register } = await import('./clientAuth.js')
      const mockUser = {
        id: 'u1',
        email: 'test@example.com',
        name: 'User 1',
        plan: 'free' as const,
        onboarded: true,
        createdAt: Date.now(),
      }
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, user: mockUser }),
      } as unknown as Response)

      const user = await register('test@example.com', 'User 1', 'password123')
      expect(user).toEqual(mockUser)
      expect(localStorage.getItem('gsa_session_present_v1')).toMatch(/^session:/)
    })

    it('login trả về null khi thất bại', async () => {
      const { login } = await import('./clientAuth.js')
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as unknown as Response)

      const user = await login('bad@example.com', 'wrong')
      expect(user).toBeNull()
    })

    it('logout gọi API và xóa stored token', async () => {
      const { logout } = await import('./clientAuth.js')
      localStorage.setItem('gsa_session_present_v1', 'session:fixture')
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as unknown as Response)

      await logout()
      expect(localStorage.getItem('gsa_session_present_v1')).toBeNull()
    })

    it('getCurrentUser trả về null khi không có token', async () => {
      const { getCurrentUser } = await import('./clientAuth.js')
      localStorage.removeItem('gsa_session_present_v1')
      const user = await getCurrentUser()
      expect(user).toBeNull()
    })

    it('getCurrentUser xóa token khi nhận 401', async () => {
      const { getCurrentUser } = await import('./clientAuth.js')
      localStorage.setItem('gsa_session_present_v1', 'session:fixture')
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as unknown as Response)

      const user = await getCurrentUser()
      expect(user).toBeNull()
      expect(localStorage.getItem('gsa_session_present_v1')).toBeNull()
    })

    it('getCurrentUser trả user hợp lệ khi token đúng', async () => {
      const { getCurrentUser } = await import('./clientAuth.js')
      localStorage.setItem('gsa_session_present_v1', 'session:fixture')
      const mockProfile = {
        id: 'u-valid',
        email: 'valid@example.com',
        name: 'Valid User',
        plan: 'vip',
        onboarded: true,
        emailVerified: true,
        isAdmin: false,
      }
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfile,
      } as unknown as Response)

      const user = await getCurrentUser()
      expect(user?.id).toBe('u-valid')
      expect(user?.plan).toBe('vip')
    })
  })

  describe('GoogleAuthError & OAuth utilities', () => {
    it('GoogleAuthError khởi tạo đúng name và code', async () => {
      const { GoogleAuthError } = await import('./clientAuth.js')
      const err = new GoogleAuthError('popup_blocked', 'Popup bị chặn')
      expect(err.name).toBe('GoogleAuthError')
      expect(err.code).toBe('popup_blocked')
      expect(err.message).toBe('Popup bị chặn')
    })

    it('handleOAuthRedirectCallback trả về null khi không có access_token trong url', async () => {
      const { handleOAuthRedirectCallback } = await import('./clientAuth.js')
      window.location.hash = ''
      window.location.search = ''
      const user = await handleOAuthRedirectCallback()
      expect(user).toBeNull()
    })

    it('handleOAuthRedirectCallback xử lý access_token từ hash thành công', async () => {
      const { handleOAuthRedirectCallback } = await import('./clientAuth.js')
      sessionStorage.setItem('oauth_state_google', 'state-test')
      window.location.hash = '#access_token=google-oauth-token-123&state=state-test'
      const mockUser = {
        id: 'u-google',
        email: 'google@gmail.com',
        name: 'Google User',
        plan: 'free' as const,
        onboarded: true,
        createdAt: Date.now(),
      }
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ authenticated: true, user: mockUser }),
      } as unknown as Response)

      const user = await handleOAuthRedirectCallback()
      expect(user?.email).toBe('google@gmail.com')
      expect(localStorage.getItem('gsa_session_present_v1')).toMatch(/^session:/)
    })

    // TEST CANH GÁC (audit 2026-08-28, F7): `state` của OAuth là token chống CSRF nên phải sinh
    // từ `crypto.getRandomValues`, không phải `Math.random`. Cách canh giống F6: ghim
    // `Math.random` về hằng số — nếu code quay lại dùng nó thì hai lần gọi cho ra cùng một
    // `state`, và Math.random sẽ bị gọi thật.
    it('state của OAuth KHÔNG phụ thuộc Math.random (nguồn mật mã)', async () => {
      const { loginWithGoogleRedirect } = await import('./clientAuth.js')
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5)
      vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client-id.apps.googleusercontent.com')
      const states: string[] = []
      try {
        for (let i = 0; i < 2; i++) {
          sessionStorage.removeItem('oauth_state_google')
          loginWithGoogleRedirect()
          states.push(sessionStorage.getItem('oauth_state_google') ?? '')
        }
        expect(states[0]).toMatch(/^[0-9a-f]{32}$/)
        expect(states[0]).not.toBe(states[1])
        expect(spy).not.toHaveBeenCalled()
      } finally {
        spy.mockRestore()
        vi.unstubAllEnvs()
      }
    })

    // ── Nạp lại cờ đã-đăng-nhập trên origin mới (2026-08-28) ──────────────────────────────
    // Server xác thực bằng COOKIE (Bearer bị bỏ qua từ Bước 6), và cookie đi theo mọi
    // subdomain — nên API vốn đã gọi được. Thứ hỏng là giao diện: nó đọc localStorage (cô lập
    // theo origin) để biết đã đăng nhập chưa, nên người dùng bị hiện thành khách dù phiên còn.
    it('localStorage rỗng nhưng cookie còn hiệu lực → nhận phiên và LƯU cờ cho origin này', async () => {
      const { getCurrentUser } = await import('./clientAuth.js')
      localStorage.removeItem('gsa_session_present_v1')
      const mockUser = {
        id: 'u-1',
        email: 'a@b.c',
        name: 'A',
        plan: 'free' as const,
        onboarded: true,
        createdAt: Date.now(),
      }
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        // 1) POST session-from-cookie → trả token + user
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ authenticated: true, user: mockUser }),
        } as unknown as Response)
        // 2) GET ?action=me bằng token vừa nhận
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUser,
        } as unknown as Response)

      const user = await getCurrentUser()

      expect(user?.email).toBe('a@b.c')
      // PHẢI lưu lại: cloud.ts/challengeCloud.ts/tutorFeedback.ts kiểm getStoredToken()
      // để quyết định có đồng bộ hay không.
      expect(localStorage.getItem('gsa_session_present_v1')).toMatch(/^session:/)

      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
      expect(url).toBe('/api/auth')
      // POST, không phải GET: SameSite=Lax không gửi cookie kèm POST từ site khác.
      expect(init.method).toBe('POST')
      expect(init.credentials).toBe('include')
      expect(JSON.parse(init.body as string)).toEqual({ action: 'session-from-cookie' })
    })

    it('localStorage rỗng và KHÔNG có cookie hợp lệ → null, không gọi thêm ?action=me', async () => {
      const { getCurrentUser } = await import('./clientAuth.js')
      localStorage.removeItem('gsa_session_present_v1')
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: false, status: 401 } as unknown as Response)

      expect(await getCurrentUser()).toBeNull()
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem('gsa_session_present_v1')).toBeNull()
    })

    it('khách: server trả 200 { authenticated: false } → null, không gọi ?action=me, không đặt cờ', async () => {
      // [audit 2026-09-30 minor 7] Server không còn trả 401 khi không có cookie (console khách sạch).
      const { getCurrentUser } = await import('./clientAuth.js')
      localStorage.removeItem('gsa_session_present_v1')
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ authenticated: false }),
      } as unknown as Response)

      expect(await getCurrentUser()).toBeNull()
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(localStorage.getItem('gsa_session_present_v1')).toBeNull()
    })

    it('mất mạng lúc đổi cookie → null chứ KHÔNG ném lỗi (AuthProvider vẫn dựng được UI)', async () => {
      const { getCurrentUser } = await import('./clientAuth.js')
      localStorage.removeItem('gsa_session_present_v1')
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network down'))
      await expect(getCurrentUser()).resolves.toBeNull()
    })

    it('ĐÃ có cờ trong localStorage → KHÔNG gọi session-from-cookie (không thêm vòng mạng)', async () => {
      const { getCurrentUser } = await import('./clientAuth.js')
      localStorage.setItem('gsa_session_present_v1', 'session:fixture')
      const mockUser = {
        id: 'u-2',
        email: 'c@d.e',
        name: 'C',
        plan: 'free' as const,
        onboarded: true,
        createdAt: Date.now(),
      }
      const fetchSpy = vi
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({ ok: true, json: async () => mockUser } as unknown as Response)

      const user = await getCurrentUser()

      expect(user?.email).toBe('c@d.e')
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(fetchSpy.mock.calls[0]![0]).toBe('/api/auth?action=me')
    })

    it('preloadOAuthProviders chạy an toàn mà không quăng lỗi', async () => {
      const { preloadOAuthProviders } = await import('./clientAuth.js')
      expect(() => preloadOAuthProviders()).not.toThrow()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════════════
// Đợt 2 coverage 2026-09-05: nhánh chưa phủ (branch 82,35% → siết lên ≥93%; 7 hàm OAuth
// Facebook/Apple/Microsoft + loadGoogleScript CHƯA từng được gọi). Không lặp lại ca đã có
// ở trên — chỉ nhắm đúng hàm/nhánh còn thiếu trong uncovered-all.md.
// ═══════════════════════════════════════════════════════════════════════════════════════

type GoogleTokenClientConfig = {
  callback: (resp: { access_token?: string; error?: string; error_description?: string }) => void
  error_callback?: (err: { type?: string; message?: string }) => void
}

// Gán window.google SẴN SÀNG (bỏ qua nhánh tự tải script) và bắt lại config truyền cho
// initTokenClient — dùng chung cho các test loginWithGoogle không cần test luồng tải script.
function mockGoogleReady(): { getConfig: () => GoogleTokenClientConfig } {
  let captured: GoogleTokenClientConfig | undefined
  window.google = {
    accounts: {
      oauth2: {
        initTokenClient: (config) => {
          captured = config
          return { requestAccessToken: () => undefined }
        },
      },
    },
  }
  return {
    getConfig: () => {
      if (!captured) throw new Error('initTokenClient chưa được gọi trong test')
      return captured
    },
  }
}

describe('loginWithGoogle — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  afterEach(() => {
    delete (window as { google?: unknown }).google
  })

  it('script Google CHƯA sẵn sàng → tự tải script (loadGoogleScript) rồi mới mở popup', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'g-client-load')
    delete (window as { google?: unknown }).google
    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      window.google = {
        accounts: {
          oauth2: {
            initTokenClient: (config) => {
              queueMicrotask(() => config.callback({ access_token: 'gtok-loaded' }))
              return { requestAccessToken: () => undefined }
            },
          },
        },
      }
      const script = node as unknown as HTMLScriptElement
      script.onload?.(new Event('load'))
      return node
    })
    const mockUser = {
      id: 'g3',
      email: 'g3@x.com',
      name: 'G3',
      plan: 'free' as const,
      onboarded: true,
      createdAt: Date.now(),
    }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true, user: mockUser }),
    } as unknown as Response)
    const { loginWithGoogle } = await import('./clientAuth.js')
    try {
      const user = await loginWithGoogle()
      expect(user?.email).toBe('g3@x.com')
    } finally {
      appendSpy.mockRestore()
      vi.unstubAllEnvs()
    }
  })

  it('thiếu VITE_GOOGLE_CLIENT_ID → ném lỗi cấu hình', async () => {
    const { loginWithGoogle } = await import('./clientAuth.js')
    await expect(loginWithGoogle()).rejects.toThrow('Thiếu VITE_GOOGLE_CLIENT_ID')
  })

  it('script đã sẵn sàng, access_token hợp lệ → đăng nhập thành công', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'g-client')
    const { getConfig } = mockGoogleReady()
    const mockUser = {
      id: 'g1',
      email: 'g@x.com',
      name: 'G',
      plan: 'free' as const,
      onboarded: true,
      createdAt: Date.now(),
    }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true, user: mockUser }),
    } as unknown as Response)
    const { loginWithGoogle } = await import('./clientAuth.js')
    const promise = loginWithGoogle()
    getConfig().callback({ access_token: 'gtok' })
    const user = await promise
    expect(user?.email).toBe('g@x.com')
    vi.unstubAllEnvs()
  })

  it('callback không có access_token nhưng có resp.error → cảnh báo console rồi null', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'g-client')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { getConfig } = mockGoogleReady()
    const { loginWithGoogle } = await import('./clientAuth.js')
    const promise = loginWithGoogle()
    getConfig().callback({ error: 'access_denied', error_description: 'nguoi dung tu choi' })
    const user = await promise
    expect(user).toBeNull()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
    vi.unstubAllEnvs()
  })

  it('callback không có access_token và KHÔNG có resp.error → null, không cảnh báo', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'g-client')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { getConfig } = mockGoogleReady()
    const { loginWithGoogle } = await import('./clientAuth.js')
    const promise = loginWithGoogle()
    getConfig().callback({})
    const user = await promise
    expect(user).toBeNull()
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
    vi.unstubAllEnvs()
  })

  it('có access_token nhưng callAuthApi thất bại → null', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'g-client')
    const { getConfig } = mockGoogleReady()
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as unknown as Response)
    const { loginWithGoogle } = await import('./clientAuth.js')
    const promise = loginWithGoogle()
    getConfig().callback({ access_token: 'gtok2' })
    const user = await promise
    expect(user).toBeNull()
    vi.unstubAllEnvs()
  })

  it('initTokenClient ném lỗi đồng bộ → reject đúng lỗi đó', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'g-client')
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: () => {
            throw new Error('popup api lỗi')
          },
        },
      },
    }
    const { loginWithGoogle } = await import('./clientAuth.js')
    await expect(loginWithGoogle()).rejects.toThrow('popup api lỗi')
    vi.unstubAllEnvs()
  })

  it.each([
    ['popup_closed', null] as const,
    ['access_denied', 'access_denied'] as const,
    ['popup_blocked_by_browser', 'popup_blocked'] as const,
    ['origin_mismatch', 'origin_mismatch'] as const,
    ['loai-khong-xac-dinh', null] as const,
  ])('error_callback type=%s → %s', async (type, expectedCode) => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'g-client')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { getConfig } = mockGoogleReady()
    const { loginWithGoogle } = await import('./clientAuth.js')
    const promise = loginWithGoogle()
    getConfig().error_callback?.({ type })
    if (expectedCode) {
      await expect(promise).rejects.toMatchObject({ name: 'GoogleAuthError', code: expectedCode })
    } else {
      await expect(promise).resolves.toBeNull()
    }
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
    vi.unstubAllEnvs()
  })
})

describe('loginWithGoogleRedirect — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  it('thiếu VITE_GOOGLE_CLIENT_ID → ném lỗi cấu hình, không điều hướng', async () => {
    const { loginWithGoogleRedirect } = await import('./clientAuth.js')
    expect(() => loginWithGoogleRedirect()).toThrow('Thiếu VITE_GOOGLE_CLIENT_ID')
  })

  it('sessionStorage bị chặn → dừng trước OAuth vì không giữ được state', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'g-redirect')
    // sessionStorage của happy-dom là Proxy tự cài đặt get/set — vi.spyOn trên instance
    // KHÔNG chặn được lời gọi setItem (set trap của happy-dom bỏ qua ghi đè thuộc tính đã có
    // trên prototype). Thay hẳn global bằng bản giả lập tối thiểu chỉ ném lỗi ở setItem.
    let setItemCalled = false
    vi.stubGlobal('sessionStorage', {
      setItem: () => {
        setItemCalled = true
        throw new Error('storage blocked')
      },
    })
    const { loginWithGoogleRedirect } = await import('./clientAuth.js')
    try {
      const previousUrl = window.location.href
      expect(() => loginWithGoogleRedirect()).toThrow('Không lưu được trạng thái bảo mật OAuth')
      expect(setItemCalled).toBe(true)
      expect(window.location.href).toBe(previousUrl)
    } finally {
      vi.unstubAllGlobals()
      vi.unstubAllEnvs()
    }
  })
})

describe('handleOAuthRedirectCallback — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  it('window === undefined (build/SSR) → null ngay, không đọc URL', async () => {
    const { handleOAuthRedirectCallback } = await import('./clientAuth.js')
    vi.stubGlobal('window', undefined)
    try {
      await expect(handleOAuthRedirectCallback()).resolves.toBeNull()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('có access_token nhưng callAuthApi trả null → null', async () => {
    const { handleOAuthRedirectCallback } = await import('./clientAuth.js')
    sessionStorage.setItem('oauth_state_google', 'state-test')
    window.location.hash = '#access_token=tok-that-bai&state=state-test'
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as unknown as Response)
    const user = await handleOAuthRedirectCallback()
    expect(user).toBeNull()
  })

  it('callAuthApi ném lỗi (mất mạng) → null, không crash', async () => {
    const { handleOAuthRedirectCallback } = await import('./clientAuth.js')
    sessionStorage.setItem('oauth_state_google', 'state-test')
    window.location.hash = '#access_token=tok-mang-loi&state=state-test'
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network down'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const user = await handleOAuthRedirectCallback()
    expect(user).toBeNull()
    expect(errSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })
})

describe('loginWithFacebook — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  it('thiếu VITE_FACEBOOK_APP_ID → ném lỗi cấu hình', async () => {
    const { loginWithFacebook } = await import('./clientAuth.js')
    await expect(loginWithFacebook()).rejects.toThrow('Thiếu VITE_FACEBOOK_APP_ID')
  })

  it('SDK Facebook CHƯA tải (loadFacebookScript) → tự khởi tạo qua fbAsyncInit rồi đăng nhập thành công', async () => {
    vi.stubEnv('VITE_FACEBOOK_APP_ID', 'fb-app-id')
    delete (window as { FB?: unknown }).FB
    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      // Facebook SDK thật tự gán window.FB rồi gọi window.fbAsyncInit() khi tải xong.
      window.FB = {
        init: () => undefined,
        login: (cb) => cb({ status: 'connected', authResponse: { accessToken: 'fb-token' } }),
      }
      window.fbAsyncInit?.()
      return node
    })
    const mockUser = {
      id: 'fb1',
      email: 'fb@x.com',
      name: 'FB',
      plan: 'free' as const,
      onboarded: true,
      createdAt: Date.now(),
    }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true, user: mockUser }),
    } as unknown as Response)
    const { loginWithFacebook } = await import('./clientAuth.js')
    try {
      const user = await loginWithFacebook()
      expect(user?.email).toBe('fb@x.com')
    } finally {
      appendSpy.mockRestore()
      vi.unstubAllEnvs()
    }
  })

  it('status khác "connected" (huỷ hộp thoại) → null', async () => {
    vi.stubEnv('VITE_FACEBOOK_APP_ID', 'fb-app-id')
    window.FB!.login = (cb) => cb({ status: 'not_authorized' })
    const { loginWithFacebook } = await import('./clientAuth.js')
    const user = await loginWithFacebook()
    expect(user).toBeNull()
    vi.unstubAllEnvs()
  })

  it('connected nhưng callAuthApi thất bại → null', async () => {
    vi.stubEnv('VITE_FACEBOOK_APP_ID', 'fb-app-id')
    window.FB!.login = (cb) =>
      cb({ status: 'connected', authResponse: { accessToken: 'fb-token-2' } })
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as unknown as Response)
    const { loginWithFacebook } = await import('./clientAuth.js')
    const user = await loginWithFacebook()
    expect(user).toBeNull()
    vi.unstubAllEnvs()
  })
})

describe('loginWithApple — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  it('thiếu VITE_APPLE_CLIENT_ID → ném lỗi cấu hình', async () => {
    const { loginWithApple } = await import('./clientAuth.js')
    await expect(loginWithApple()).rejects.toThrow('Thiếu VITE_APPLE_CLIENT_ID')
  })

  it('script Apple CHƯA tải (loadAppleScript) → tự tải, có tên (first+last) → đăng nhập thành công kèm tên', async () => {
    vi.stubEnv('VITE_APPLE_CLIENT_ID', 'apple-id')
    delete (window as { AppleID?: unknown }).AppleID
    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      window.AppleID = {
        auth: {
          init: () => undefined,
          signIn: async () => ({
            authorization: { id_token: 'apple-idtok' },
            user: { name: { firstName: 'Táo', lastName: 'Tây' } },
          }),
        },
      }
      const script = node as unknown as HTMLScriptElement
      script.onload?.(new Event('load'))
      return node
    })
    let capturedBody: Record<string, unknown> = {}
    vi.spyOn(global, 'fetch').mockImplementationOnce(async (_url, init) => {
      capturedBody = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>
      return {
        ok: true,
        json: async () => ({
          authenticated: true,
          user: {
            id: 'ap1',
            email: 'a@icloud.com',
            name: 'Táo Tây',
            plan: 'free',
            onboarded: true,
            createdAt: Date.now(),
          },
        }),
      } as unknown as Response
    })
    const { loginWithApple } = await import('./clientAuth.js')
    try {
      const user = await loginWithApple()
      expect(user?.email).toBe('a@icloud.com')
      expect(capturedBody.name).toBe('Táo Tây')
    } finally {
      appendSpy.mockRestore()
      vi.unstubAllEnvs()
    }
  })

  it('không có tên (lần đăng nhập sau — Apple chỉ gửi tên lần đầu) → KHÔNG gửi kèm trường name', async () => {
    vi.stubEnv('VITE_APPLE_CLIENT_ID', 'apple-id')
    window.AppleID!.auth.signIn = async () => ({ authorization: { id_token: 'apple-idtok-2' } })
    let capturedBody: Record<string, unknown> = {}
    vi.spyOn(global, 'fetch').mockImplementationOnce(async (_url, init) => {
      capturedBody = JSON.parse((init as RequestInit).body as string) as Record<string, unknown>
      return {
        ok: true,
        json: async () => ({
          authenticated: true,
          user: {
            id: 'ap2',
            email: 'a2@icloud.com',
            name: 'a2',
            plan: 'free',
            onboarded: true,
            createdAt: Date.now(),
          },
        }),
      } as unknown as Response
    })
    const { loginWithApple } = await import('./clientAuth.js')
    const user = await loginWithApple()
    expect(user?.id).toBe('ap2')
    expect(capturedBody.name).toBeUndefined()
    vi.unstubAllEnvs()
  })

  it('callAuthApi thất bại → null', async () => {
    vi.stubEnv('VITE_APPLE_CLIENT_ID', 'apple-id')
    window.AppleID!.auth.signIn = async () => ({ authorization: { id_token: 'x' } })
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as unknown as Response)
    const { loginWithApple } = await import('./clientAuth.js')
    const user = await loginWithApple()
    expect(user).toBeNull()
    vi.unstubAllEnvs()
  })
})

describe('loginWithMicrosoft — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  it('thiếu VITE_MICROSOFT_CLIENT_ID → ném lỗi cấu hình', async () => {
    const { loginWithMicrosoft } = await import('./clientAuth.js')
    await expect(loginWithMicrosoft()).rejects.toThrow('Thiếu VITE_MICROSOFT_CLIENT_ID')
  })

  it('script MSAL CHƯA tải (loadMicrosoftScript) → tự tải rồi đăng nhập thành công', async () => {
    vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', 'ms-id')
    delete (window as { msal?: unknown }).msal
    const initialize = async () => undefined
    const loginPopup = async () => ({ idToken: 'ms-idtok' })
    const appendSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
      window.msal = {
        PublicClientApplication: class {
          initialize = initialize
          loginPopup = loginPopup
        },
      }
      const script = node as unknown as HTMLScriptElement
      script.onload?.(new Event('load'))
      return node
    })
    const mockUser = {
      id: 'ms1',
      email: 'ms@corp.com',
      name: 'MS',
      plan: 'free' as const,
      onboarded: true,
      createdAt: Date.now(),
    }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true, user: mockUser }),
    } as unknown as Response)
    const { loginWithMicrosoft } = await import('./clientAuth.js')
    try {
      const user = await loginWithMicrosoft()
      expect(user?.email).toBe('ms@corp.com')
    } finally {
      appendSpy.mockRestore()
      vi.unstubAllEnvs()
    }
  })

  it('callAuthApi thất bại → null', async () => {
    vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', 'ms-id')
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as unknown as Response)
    const { loginWithMicrosoft } = await import('./clientAuth.js')
    const user = await loginWithMicrosoft()
    expect(user).toBeNull()
    vi.unstubAllEnvs()
  })
})

describe('getCurrentUser / adoptSessionFromCookie — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  it('cookie trả ok nhưng thiếu token/user (dữ liệu bất thường) → null', async () => {
    const { getCurrentUser } = await import('./clientAuth.js')
    localStorage.removeItem('gsa_session_present_v1')
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as unknown as Response)
    const user = await getCurrentUser()
    expect(user).toBeNull()
  })

  it('nhận phiên từ cookie nhưng localStorage bị chặn ĐỌC LẠI (ẩn danh nghiêm ngặt) → vẫn trả user vừa nhận, không gọi thêm ?action=me', async () => {
    const { getCurrentUser } = await import('./clientAuth.js')
    localStorage.removeItem('gsa_session_present_v1')
    const mockUser = {
      id: 'u-priv',
      email: 'priv@x.com',
      name: 'Priv',
      plan: 'free' as const,
      onboarded: true,
      createdAt: Date.now(),
    }
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true, user: mockUser }),
    } as unknown as Response)
    const getItemSpy = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('localStorage bị chặn')
    })
    try {
      const user = await getCurrentUser()
      expect(user).toEqual(mockUser)
      // Chỉ 1 lần gọi (session-from-cookie) — KHÔNG có vòng ?action=me thứ hai, vì auth
      // header vẫn rỗng sau khi lưu (đọc lại localStorage cũng bị chặn).
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    } finally {
      getItemSpy.mockRestore()
    }
  })
})

describe('preloadOAuthProviders — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  it('có đủ client id vẫn chỉ preload Google, không tải SDK của nhà cung cấp ẩn', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'g-preload')
    vi.stubEnv('VITE_FACEBOOK_APP_ID', 'fb-preload')
    vi.stubEnv('VITE_APPLE_CLIENT_ID', 'apple-preload')
    vi.stubEnv('VITE_MICROSOFT_CLIENT_ID', 'ms-preload')
    const { preloadOAuthProviders } = await import('./clientAuth.js')
    try {
      expect(() => preloadOAuthProviders()).not.toThrow()
      const scriptUrls = [...document.querySelectorAll('script[src]')]
        .map((el) => el.getAttribute('src'))
        .join(' ')
      expect(scriptUrls).not.toMatch(/connect\.facebook|appleid\.cdn-apple|alcdn\.msauth/)
    } finally {
      vi.unstubAllEnvs()
    }
  })

  // Module MỚI (vi.resetModules) để loadGoogleScript chạy LẦN ĐẦU với window.google ĐÃ sẵn
  // sàng — nhánh khác với test "script CHƯA sẵn sàng" ở trên (module đã cache SAU lần gọi đó).
  it('script Google ĐÃ sẵn sàng từ trước → loadGoogleScript trả ngay, không tạo thẻ script mới', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'g-already-ready')
    window.google = {
      accounts: { oauth2: { initTokenClient: () => ({ requestAccessToken: () => undefined }) } },
    }
    const appendSpy = vi.spyOn(document.head, 'appendChild')
    const { preloadOAuthProviders } = await import('./clientAuth.js')
    try {
      preloadOAuthProviders()
      await Promise.resolve()
      await Promise.resolve()
      expect(appendSpy).not.toHaveBeenCalled()
    } finally {
      appendSpy.mockRestore()
      vi.unstubAllEnvs()
      delete (window as { google?: unknown }).google
    }
  })
})

describe('register / login — nhánh còn thiếu (Đợt 2 coverage 2026-09-05)', () => {
  it('register: email đã tồn tại (callAuthApi trả null) → null, không lưu token', async () => {
    const { register } = await import('./clientAuth.js')
    localStorage.removeItem('gsa_session_present_v1')
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 409,
    } as unknown as Response)
    const user = await register('trung@example.com', 'Trùng', 'MatKhau123')
    expect(user).toBeNull()
    expect(localStorage.getItem('gsa_session_present_v1')).toBeNull()
  })

  it('login: đúng thông tin → lưu token và trả user', async () => {
    const { login } = await import('./clientAuth.js')
    const mockUser = {
      id: 'u-login',
      email: 'login@example.com',
      name: 'Login User',
      plan: 'free' as const,
      onboarded: true,
      createdAt: Date.now(),
    }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ authenticated: true, user: mockUser }),
    } as unknown as Response)
    const user = await login('login@example.com', 'MatKhau123')
    expect(user).toEqual(mockUser)
    expect(localStorage.getItem('gsa_session_present_v1')).toMatch(/^session:/)
  })
})

describe('chuyển hướng giới hạn origin', () => {
  afterEach(() => vi.unstubAllEnvs())
  it.each([
    '/\\outside.example/path',
    '/%5Coutside.example',
    '//outside.example',
    '/%2foutside.example',
    '/a/..//outside.example',
    '/a/%2e%2e//outside.example',
    'https://user@www.donghanhcungban.org/',
    'https://user:pass@www.donghanhcungban.org/',
    'http://www.donghanhcungban.org/',
    'ftp://www.donghanhcungban.org/',
    'https://unconfigured.donghanhcungban.org/',
    'https://donghanhcungban.com/',
    'https://www.donghanhcungban.org:8443/',
    'https://www.donghanhcungban.org./',
    'https://www.donghanhcungban.org/\n',
    '/%0a/path',
    '/%00/path',
    '/bad%encoding',
    'http://localhost:9999/',
    'http://sub.localhost:5173/',
  ])('từ chối URL không đáng tin %j', (value) => {
    expect(getSafeRedirectUrl(value, '/safe')).toBe('/safe')
  })
  it('production không cho phép loopback kể cả port dev', () => {
    vi.stubEnv('DEV', false)
    expect(getSafeRedirectUrl('http://localhost:5173/', '/safe')).toBe('/safe')
    expect(getSafeRedirectUrl('http://127.0.0.1:3000/', '/safe')).toBe('/safe')
  })
  it('chuẩn hóa đường dẫn hợp lệ mà giữ origin nội bộ', () => {
    expect(getSafeRedirectUrl('/a/../profile?tab=account')).toBe('/profile?tab=account')
    expect(getSafeRedirectUrl('https://WWW.DONGHANHCUNGBAN.ORG:443/profile')).toBe(
      'https://www.donghanhcungban.org/profile',
    )
  })
})

describe('OAuth redirect state chống login CSRF', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    sessionStorage.clear()
  })
  it.each([null, 'wrong-state'])(
    'từ chối state thiếu/sai, không đổi token thành phiên',
    async (state) => {
      const { handleOAuthRedirectCallback } = await import('./clientAuth.js')
      sessionStorage.setItem('oauth_state_google', 'expected-state')
      window.location.hash = `#access_token=provider-token${state ? `&state=${state}` : ''}`
      const fetchSpy = vi.spyOn(global, 'fetch')
      fetchSpy.mockClear()
      expect(await handleOAuthRedirectCallback()).toBeNull()
      expect(fetchSpy).not.toHaveBeenCalled()
      expect(sessionStorage.getItem('oauth_state_google')).toBeNull()
      expect(window.location.hash).toBe('')
    },
  )
})

it.each([
  ['x'.repeat(14), false],
  ['x'.repeat(15), true],
  ['x'.repeat(72), true],
  ['x'.repeat(73), false],
  ['ấ'.repeat(24), true],
  ['ấ'.repeat(25), false],
  ['🙂'.repeat(14), false],
  ['🙂'.repeat(15), true],
])('mật khẩu UI khớp giới hạn server (%s)', async (password, valid) => {
  const { isValidNewPassword } = await import('./clientAuth.js')
  expect(isValidNewPassword(password as string)).toBe(valid)
})
