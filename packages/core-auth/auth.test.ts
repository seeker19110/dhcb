// Test api/auth.ts — trước GĐ1 (nền tảng đa lĩnh vực), file này CHƯA có test nào dù xử lý
// toàn bộ đăng ký/đăng nhập/OAuth (Google/Facebook/Apple/Microsoft)/logout. Trọng tâm ở đây:
// đăng nhập Google (action 'google' và 'google-token') — luồng GĐ1 sẽ đụng vào khi tách
// packages/core-auth, cần có test trước để phát hiện hồi quy.

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('./security.js', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: async (req: Request) => {
    const header = req.headers.get('Authorization')
    if (header === 'Bearer valid-token') return { userId: 'user-1' }
    return null
  },
  logSecurityEvent: vi.fn(),
}))

const authService = vi.hoisted(() => ({
  createUserWithPassword: vi.fn(),
  verifyUserPassword: vi.fn(),
  verifyGoogleIdToken: vi.fn(),
  verifyGoogleAccessToken: vi.fn(),
  findOrCreateGoogleUser: vi.fn(),
  verifyFacebookAccessToken: vi.fn(),
  findOrCreateFacebookUser: vi.fn(),
  verifyAppleIdToken: vi.fn(),
  findOrCreateAppleUser: vi.fn(),
  verifyMicrosoftIdToken: vi.fn(),
  findOrCreateMicrosoftUser: vi.fn(),
  createSession: vi.fn(async () => 'session-token-abc'),
  revokeSession: vi.fn(),
  ensureProfileRow: vi.fn(async (_userId: string, name: string) => ({
    plan: 'free' as const,
    onboarded: false,
    name,
    planExpiresAt: null,
  })),
  getUserById: vi.fn(),
  validateSessionToken: vi.fn(),
  SESSION_TTL_MS: 30 * 24 * 60 * 60 * 1000,
}))
vi.mock('./authService.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./authService.js')>()
  return {
    ...authService,
    MicrosoftAccountLinkRequiredError: actual.MicrosoftAccountLinkRequiredError,
  }
})

vi.mock('./emailVerification.js', () => ({
  sendVerificationCode: vi.fn(async () => ({ ok: true, mail: 'sent' })),
  verifyCode: vi.fn(),
  isEmailVerified: vi.fn(async () => false),
}))

vi.mock('./adminAuth.js', () => ({ isAdminEmail: () => false }))

const trial = vi.hoisted(() => ({ grantSignupTrial: vi.fn(async () => true) }))
vi.mock('./trial.js', () => ({ ...trial, SIGNUP_TRIAL_DAYS: 14 }))

vi.mock('./changeEmail.js', () => ({ changeEmail: vi.fn() }))
vi.mock('./passwordReset.js', () => ({
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}))

import handler from './auth.js'
import { MicrosoftAccountLinkRequiredError } from './authService.js'

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  authService.createSession.mockResolvedValue('session-token-abc')
  authService.ensureProfileRow.mockImplementation(async (_userId: string, name: string) => ({
    plan: 'free' as const,
    onboarded: false,
    name,
    planExpiresAt: null,
  }))
  trial.grantSignupTrial.mockResolvedValue(true)
})

describe('/api/auth — action google (One Tap idToken)', () => {
  it('idToken hợp lệ, user đã tồn tại → đăng nhập, KHÔNG cấp lại quà dùng thử', async () => {
    authService.verifyGoogleIdToken.mockResolvedValue({
      googleId: 'g-1',
      email: 'a@b.com',
      name: 'A',
    })
    authService.findOrCreateGoogleUser.mockResolvedValue({
      user: { id: 'user-1', email: 'a@b.com' },
      isNew: false,
    })

    const resp = await handler(makeRequest({ action: 'google', idToken: 'x'.repeat(20) }))
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as { token: string; signupTrialGranted: boolean }
    expect(data.token).toBe('session-token-abc')
    expect(data.signupTrialGranted).toBe(false)
    expect(trial.grantSignupTrial).not.toHaveBeenCalled()
  })

  it('user MỚI qua Google → cấp quà dùng thử ngay (không cần xác thực email)', async () => {
    authService.verifyGoogleIdToken.mockResolvedValue({
      googleId: 'g-2',
      email: 'new@b.com',
      name: 'New',
    })
    authService.findOrCreateGoogleUser.mockResolvedValue({
      user: { id: 'user-2', email: 'new@b.com' },
      isNew: true,
    })

    const resp = await handler(makeRequest({ action: 'google', idToken: 'x'.repeat(20) }))
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as { signupTrialGranted: boolean }
    expect(data.signupTrialGranted).toBe(true)
    expect(trial.grantSignupTrial).toHaveBeenCalledWith('user-2')
  })

  it('idToken không hợp lệ → 401, không tạo phiên', async () => {
    authService.verifyGoogleIdToken.mockResolvedValue(null)

    const resp = await handler(makeRequest({ action: 'google', idToken: 'x'.repeat(20) }))
    expect(resp.status).toBe(401)
    expect(authService.findOrCreateGoogleUser).not.toHaveBeenCalled()
    expect(authService.createSession).not.toHaveBeenCalled()
  })

  it('idToken thiếu/ngắn → 400 (Zod chặn trước khi gọi Google)', async () => {
    const resp = await handler(makeRequest({ action: 'google', idToken: 'short' }))
    expect(resp.status).toBe(400)
    expect(authService.verifyGoogleIdToken).not.toHaveBeenCalled()
  })
})

describe('/api/auth — action google-token (popup OAuth2, Safari/iOS/PWA)', () => {
  it('accessToken hợp lệ → đăng nhập thành công', async () => {
    authService.verifyGoogleAccessToken.mockResolvedValue({
      googleId: 'g-3',
      email: 'c@d.com',
      name: 'C',
    })
    authService.findOrCreateGoogleUser.mockResolvedValue({
      user: { id: 'user-3', email: 'c@d.com' },
      isNew: false,
    })

    const resp = await handler(makeRequest({ action: 'google-token', accessToken: 'y'.repeat(20) }))
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as { user: { email: string } }
    expect(data.user.email).toBe('c@d.com')
  })

  it('accessToken không hợp lệ (Google từ chối) → 401', async () => {
    authService.verifyGoogleAccessToken.mockResolvedValue(null)

    const resp = await handler(makeRequest({ action: 'google-token', accessToken: 'y'.repeat(20) }))
    expect(resp.status).toBe(401)
    expect(authService.findOrCreateGoogleUser).not.toHaveBeenCalled()
  })
})

describe('/api/auth — action register/login (đối chiếu hành vi trước khi tách core-auth)', () => {
  it('đăng ký thành công → 200, gửi mã xác thực, KHÔNG cấp quà dùng thử ngay', async () => {
    authService.createUserWithPassword.mockResolvedValue({ id: 'user-4', email: 'e@f.com' })

    const resp = await handler(
      makeRequest({ action: 'register', email: 'e@f.com', name: 'E', password: 'abcdef' }),
    )
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as { signupTrialGranted?: boolean }
    expect(data.signupTrialGranted).toBeUndefined()
    expect(trial.grantSignupTrial).not.toHaveBeenCalled()
  })

  it('đăng ký email đã tồn tại → 409, không lộ lý do cụ thể', async () => {
    authService.createUserWithPassword.mockResolvedValue(null)

    const resp = await handler(
      makeRequest({ action: 'register', email: 'e@f.com', name: 'E', password: 'abcdef' }),
    )
    expect(resp.status).toBe(409)
  })

  it('đăng nhập sai mật khẩu → 401', async () => {
    authService.verifyUserPassword.mockResolvedValue(null)

    const resp = await handler(
      makeRequest({ action: 'login', email: 'e@f.com', password: 'wrong' }),
    )
    expect(resp.status).toBe(401)
    expect(authService.createSession).not.toHaveBeenCalled()
  })
})

describe('/api/auth — action session-from-cookie (đăng nhập nối tiếp giữa các subdomain)', () => {
  // Token trả về KHÔNG phải chứng chỉ xác thực: từ Bước 6, validateAuth chỉ đọc cookie
  // `session_token` và bỏ qua header Authorization. Cookie có Domain=.donghanhcungban.org nên
  // API trên subdomain mới vốn đã gọi được; endpoint này chỉ nạp lại CỜ đã-đăng-nhập mà giao
  // diện đọc từ localStorage (cô lập theo origin).
  // happy-dom (môi trường test) CHẶN set header "Cookie" qua `new Request(...)` — đó là
  // forbidden header name theo spec fetch, giống trình duyệt thật. Node thật (server.ts chạy
  // undici) KHÔNG chặn vì đây không phải script trong trang. Giả một Request tối giản, đúng
  // idiom đã dùng ở sessionCookie.test.ts.
  function makeCookieRequest(cookie?: string, method = 'POST'): Request {
    const body = JSON.stringify({ action: 'session-from-cookie' })
    return {
      method,
      url: 'http://localhost/api/auth',
      headers: {
        get: (name: string) => {
          const n = name.toLowerCase()
          if (n === 'cookie') return cookie ?? null
          if (n === 'content-type') return 'application/json'
          return null
        },
      },
      text: async () => body,
    } as unknown as Request
  }

  it('cookie hợp lệ → trả ĐÚNG token trong cookie, KHÔNG tạo phiên mới', async () => {
    authService.validateSessionToken.mockResolvedValue({ userId: 'user-1' })
    authService.getUserById.mockResolvedValue({ id: 'user-1', email: 'a@b.c' })

    const resp = await handler(makeCookieRequest('session_token=token-abc'))
    expect(resp.status).toBe(200)
    const body = (await resp.json()) as { token: string; user: { email: string } }

    expect(body.token).toBe('token-abc')
    expect(body.user.email).toBe('a@b.c')
    // Bất biến: không sinh thêm bản ghi phiên, không kéo dài hạn — cookie CHÍNH LÀ token.
    expect(authService.createSession).not.toHaveBeenCalled()
  })

  it('không có cookie → 401', async () => {
    const resp = await handler(makeCookieRequest())
    expect(resp.status).toBe(401)
    expect(authService.validateSessionToken).not.toHaveBeenCalled()
  })

  it('cookie hết hạn / không hợp lệ → 401, không lộ token', async () => {
    authService.validateSessionToken.mockResolvedValue(null)
    const resp = await handler(makeCookieRequest('session_token=token-cu'))
    expect(resp.status).toBe(401)
    expect(await resp.json()).toEqual({ error: 'Unauthorized' })
  })

  it('validateSessionToken ném lỗi (DB chập) → 401 chứ không 500', async () => {
    authService.validateSessionToken.mockRejectedValue(new Error('db down'))
    const resp = await handler(makeCookieRequest('session_token=token-abc'))
    expect(resp.status).toBe(401)
  })

  it('phiên hợp lệ nhưng user đã bị xoá → 401', async () => {
    authService.validateSessionToken.mockResolvedValue({ userId: 'user-1' })
    authService.getUserById.mockResolvedValue(null)
    const resp = await handler(makeCookieRequest('session_token=token-abc'))
    expect(resp.status).toBe(401)
  })

  it('GET không dùng được — chỉ POST (SameSite=Lax chặn POST chéo site)', async () => {
    const resp = await handler(makeCookieRequest('session_token=token-abc', 'GET'))
    expect(resp.status).toBe(405)
  })
})

describe('/api/auth — action logout', () => {
  it('có cookie session_token → thu hồi phiên', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    })
    // happy-dom (môi trường test) chặn set header "Cookie" ngay lúc khởi tạo Request (forbidden
    // header name theo spec) — set qua headers.set() SAU khi tạo thì được (Node thật/production
    // không có giới hạn này vì đó không phải script chạy trong trang).
    req.headers.set('Cookie', 'session_token=valid-token')
    const resp = await handler(req)
    expect(resp.status).toBe(200)
    expect(authService.revokeSession).toHaveBeenCalledWith('valid-token')
  })

  it('KHÔNG có cookie → vẫn trả 200, không gọi revokeSession', async () => {
    const resp = await handler(makeRequest({ action: 'logout' }))
    expect(resp.status).toBe(200)
    expect(authService.revokeSession).not.toHaveBeenCalled()
  })
})

describe('/api/auth — action facebook/apple/microsoft', () => {
  it('facebook: accessToken hợp lệ → đăng nhập thành công', async () => {
    authService.verifyFacebookAccessToken.mockResolvedValue({
      facebookId: 'fb1',
      email: 'fb@b.com',
      name: 'FB',
    })
    authService.findOrCreateFacebookUser.mockResolvedValue({
      user: { id: 'user-fb', email: 'fb@b.com' },
      isNew: false,
    })
    const resp = await handler(makeRequest({ action: 'facebook', accessToken: 'z'.repeat(20) }))
    expect(resp.status).toBe(200)
  })

  it('facebook: token không hợp lệ → 401', async () => {
    authService.verifyFacebookAccessToken.mockResolvedValue(null)
    const resp = await handler(makeRequest({ action: 'facebook', accessToken: 'z'.repeat(20) }))
    expect(resp.status).toBe(401)
    expect(authService.findOrCreateFacebookUser).not.toHaveBeenCalled()
  })

  it('apple: idToken hợp lệ → đăng nhập thành công', async () => {
    authService.verifyAppleIdToken.mockResolvedValue({
      appleId: 'ap1',
      email: 'ap@b.com',
      name: 'AP',
    })
    authService.findOrCreateAppleUser.mockResolvedValue({
      user: { id: 'user-ap', email: 'ap@b.com' },
      isNew: true,
    })
    const resp = await handler(makeRequest({ action: 'apple', idToken: 'z'.repeat(20) }))
    expect(resp.status).toBe(200)
    expect(trial.grantSignupTrial).toHaveBeenCalledWith('user-ap')
  })

  it('apple: idToken không hợp lệ → 401', async () => {
    authService.verifyAppleIdToken.mockResolvedValue(null)
    const resp = await handler(makeRequest({ action: 'apple', idToken: 'z'.repeat(20) }))
    expect(resp.status).toBe(401)
  })

  it('microsoft: idToken hợp lệ → đăng nhập thành công', async () => {
    authService.verifyMicrosoftIdToken.mockResolvedValue({
      microsoftId: 'ms1',
      email: 'ms@b.com',
      name: 'MS',
    })
    authService.findOrCreateMicrosoftUser.mockResolvedValue({
      user: { id: 'user-ms', email: 'ms@b.com' },
      isNew: false,
    })
    const resp = await handler(makeRequest({ action: 'microsoft', idToken: 'z'.repeat(20) }))
    expect(resp.status).toBe(200)
  })

  it('microsoft: idToken không hợp lệ → 401', async () => {
    authService.verifyMicrosoftIdToken.mockResolvedValue(null)
    const resp = await handler(makeRequest({ action: 'microsoft', idToken: 'z'.repeat(20) }))
    expect(resp.status).toBe(401)
  })
})

describe('/api/auth — GET ?action=me', () => {
  it('KHÔNG có token hợp lệ → 401', async () => {
    const req = new Request('http://localhost/api/auth?action=me', { method: 'GET' })
    const resp = await handler(req)
    expect(resp.status).toBe(401)
  })

  it('token hợp lệ nhưng user không còn tồn tại (đã bị xoá) → 401', async () => {
    authService.getUserById.mockResolvedValue(null)
    const req = new Request('http://localhost/api/auth?action=me', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const resp = await handler(req)
    expect(resp.status).toBe(401)
  })

  it('token hợp lệ, user tồn tại → 200 kèm profile', async () => {
    authService.getUserById.mockResolvedValue({ id: 'user-1', email: 'a@b.com' })
    const req = new Request('http://localhost/api/auth?action=me', {
      method: 'GET',
      headers: { Authorization: 'Bearer valid-token' },
    })
    const resp = await handler(req)
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as { email: string }
    expect(data.email).toBe('a@b.com')
  })
})

describe('/api/auth — xác thực email / đổi email (cần đăng nhập)', () => {
  it('send-verification KHÔNG có token → 401', async () => {
    const resp = await handler(makeRequest({ action: 'send-verification' }))
    expect(resp.status).toBe(401)
  })

  it('verify-email KHÔNG có token → 401', async () => {
    const resp = await handler(makeRequest({ action: 'verify-email', code: '123456' }))
    expect(resp.status).toBe(401)
  })

  it('change-email KHÔNG có token → 401', async () => {
    const resp = await handler(makeRequest({ action: 'change-email', newEmail: 'x@y.com' }))
    expect(resp.status).toBe(401)
  })
})

describe('/api/auth — request-password-reset / reset-password', () => {
  it('request-password-reset LUÔN trả ok:true (chống dò email)', async () => {
    const resp = await handler(
      makeRequest({ action: 'request-password-reset', email: 'khong-ton-tai@b.com' }),
    )
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as { ok: boolean }
    expect(data.ok).toBe(true)
  })
})

describe('/api/auth — method/route không hợp lệ', () => {
  it('method PUT không hỗ trợ → 405', async () => {
    const req = new Request('http://localhost/api/auth', { method: 'PUT' })
    const resp = await handler(req)
    expect(resp.status).toBe(405)
  })

  it('OPTIONS (preflight CORS) → 204', async () => {
    const req = new Request('http://localhost/api/auth', { method: 'OPTIONS' })
    const resp = await handler(req)
    expect(resp.status).toBe(204)
  })

  it('body không khớp schema nào (action lạ) → 400', async () => {
    const resp = await handler(makeRequest({ action: 'khong-ton-tai' }))
    expect(resp.status).toBe(400)
  })

  it('body không phải JSON hợp lệ → lỗi 400 từ readJsonBody', async () => {
    const req = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{khong-phai-json',
    })
    const resp = await handler(req)
    expect(resp.status).toBe(400)
  })
})

it('Microsoft chưa liên kết → 403 rõ ràng, không tạo phiên/trial', async () => {
  authService.verifyMicrosoftIdToken.mockResolvedValue({
    microsoftId: 'new',
    email: 'victim@example.com',
    name: 'Test',
  })
  authService.findOrCreateMicrosoftUser.mockRejectedValue(new MicrosoftAccountLinkRequiredError())
  const response = await handler(makeRequest({ action: 'microsoft', idToken: 'token-for-test' }))
  expect(response.status).toBe(403)
  expect(await response.json()).toMatchObject({ code: 'MICROSOFT_ACCOUNT_LINK_REQUIRED' })
  expect(authService.createSession).not.toHaveBeenCalled()
  expect(trial.grantSignupTrial).not.toHaveBeenCalled()
})
