import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getCorsHeaders,
  checkRateLimit,
  consumeWindowCounter,
  consumeWindowCounterCount,
  peekWindowCounter,
  resetCounter,
  rateLimitSubject,
  isAllowedWebSocketOrigin,
  warnIfClusterWithoutRedis,
  validateAuth,
  validateContentType,
  logSecurityEvent,
  SECURITY_HEADERS,
  PERMISSIONS_POLICY,
  HSTS_VALUE,
} from './security.js'
import { ServiceUnavailableError } from '@dhcb/core-errors/appError'

const validateSessionToken = vi.hoisted(() => vi.fn())
vi.mock('./authService.js', () => ({ validateSessionToken }))

// Request giả tối thiểu — chỉ cần headers.get(...).
function reqWithHeaders(headers: Record<string, string | null>): Request {
  return {
    headers: { get: (k: string) => headers[k] ?? null },
  } as unknown as Request
}

// Request giả tối thiểu — chỉ cần headers.get('Origin').
function reqWithOrigin(origin: string | null): Request {
  return { headers: { get: (k: string) => (k === 'Origin' ? origin : null) } } as unknown as Request
}

describe('getCorsHeaders (H10 — CORS)', () => {
  const OLD = process.env.ALLOWED_ORIGINS
  afterEach(() => {
    process.env.ALLOWED_ORIGINS = OLD
  })

  it('không cấu hình ALLOWED_ORIGINS → "*", KHÔNG kèm credentials', () => {
    delete process.env.ALLOWED_ORIGINS
    const h = getCorsHeaders(reqWithOrigin('https://evil.com'))
    expect(h['Access-Control-Allow-Origin']).toBe('*')
    expect(h['Access-Control-Allow-Credentials']).toBeUndefined()
  })

  it('origin trong whitelist → phản chiếu origin + credentials', () => {
    process.env.ALLOWED_ORIGINS = 'https://app.com,https://www.app.com'
    const h = getCorsHeaders(reqWithOrigin('https://app.com'))
    expect(h['Access-Control-Allow-Origin']).toBe('https://app.com')
    expect(h['Access-Control-Allow-Credentials']).toBe('true')
  })

  it('origin NGOÀI whitelist → KHÔNG phản chiếu, KHÔNG credentials', () => {
    process.env.ALLOWED_ORIGINS = 'https://app.com'
    const h = getCorsHeaders(reqWithOrigin('https://evil.com'))
    expect(h['Access-Control-Allow-Origin']).toBe('https://app.com') // origin đầu danh sách
    expect(h['Access-Control-Allow-Credentials']).toBeUndefined()
  })
})

// Không set REDIS_URL trong test → toàn bộ khối này chạy nhánh FALLBACK Map in-memory,
// tức xác nhận hành vi cũ được giữ nguyên khi môi trường chưa có Redis (dev local, CI).
describe('checkRateLimit (fallback Map in-memory khi không có REDIS_URL)', () => {
  beforeEach(() => {
    delete process.env.REDIS_URL
    vi.useRealTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('không cấu hình REDIS_URL → vẫn đếm được bằng Map, không ném lỗi', async () => {
    expect(process.env.REDIS_URL).toBeUndefined()
    const ip = 'ip-' + Math.random()
    await expect(checkRateLimit(ip, 1, 'fallback')).resolves.toBe(true)
    await expect(checkRateLimit(ip, 1, 'fallback')).resolves.toBe(false)
  })

  it('cho qua tới hạn rồi chặn request vượt', async () => {
    const ip = 'ip-' + Math.random()
    expect(await checkRateLimit(ip, 3, 'b1')).toBe(true)
    expect(await checkRateLimit(ip, 3, 'b1')).toBe(true)
    expect(await checkRateLimit(ip, 3, 'b1')).toBe(true)
    expect(await checkRateLimit(ip, 3, 'b1')).toBe(false) // request thứ 4 → chặn
  })

  it('bộ đếm tách biệt theo bucket', async () => {
    const ip = 'ip-' + Math.random()
    expect(await checkRateLimit(ip, 1, 'bucketA')).toBe(true)
    expect(await checkRateLimit(ip, 1, 'bucketA')).toBe(false)
    // bucket khác vẫn còn lượt riêng
    expect(await checkRateLimit(ip, 1, 'bucketB')).toBe(true)
  })

  it('reset sau cửa sổ 60s', async () => {
    vi.useFakeTimers()
    const ip = 'ip-' + Math.random()
    expect(await checkRateLimit(ip, 1, 'win')).toBe(true)
    expect(await checkRateLimit(ip, 1, 'win')).toBe(false)
    vi.advanceTimersByTime(61_000)
    expect(await checkRateLimit(ip, 1, 'win')).toBe(true) // cửa sổ mới
  })
})

describe('rateLimitSubject — gom IPv6 theo /64 (vá 2026-09-27)', () => {
  it.each([
    ['2001:db8:abcd:12::1', '2001:db8:abcd:12::/64'],
    ['2001:0db8:abcd:0012:ffff:ffff:ffff:ffff', '2001:db8:abcd:12::/64'],
    ['2001:DB8:ABCD:12:1:2:3:4', '2001:db8:abcd:12::/64'],
    ['fe80::1%eth0', 'fe80:0:0:0::/64'],
    ['::1', '0:0:0:0::/64'],
    ['2001:db8::', '2001:db8:0:0::/64'],
  ])('%s → %s', (input, expected) => {
    expect(rateLimitSubject(input)).toBe(expected)
  })

  it('IPv4-mapped IPv6 → chính IPv4 đó (cùng bộ đếm với IPv4 thuần)', () => {
    expect(rateLimitSubject('::ffff:203.0.113.7')).toBe('203.0.113.7')
    expect(rateLimitSubject('::ffff:cb00:7107')).toBe('203.0.113.7')
  })

  it.each(['203.0.113.7', 'unknown', '6f1c2d3e-aaaa-bbbb-cccc-1234567890ab', 'user-1', ''])(
    'không phải IPv6 → giữ nguyên: %s',
    (input) => {
      expect(rateLimitSubject(input)).toBe(input)
    },
  )

  it('checkRateLimit: đổi địa chỉ trong cùng /64 KHÔNG được thêm lượt', async () => {
    delete process.env.REDIS_URL
    const prefix = `2001:db8:${Math.floor(Math.random() * 0xffff).toString(16)}:7`
    expect(await checkRateLimit(`${prefix}::1`, 2, 'v6')).toBe(true)
    expect(await checkRateLimit(`${prefix}::2`, 2, 'v6')).toBe(true)
    expect(await checkRateLimit(`${prefix}:dead:beef:1:2`, 2, 'v6')).toBe(false)
    // Dải /64 khác thì là chủ thể khác.
    expect(await checkRateLimit(`${prefix.slice(0, -1)}8::1`, 2, 'v6')).toBe(true)
  })
})

describe('isAllowedWebSocketOrigin (chống Cross-Site WebSocket Hijacking — 2026-09-27)', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('production: chỉ nhận origin trong danh sách, chặn subdomain lạ và thiếu Origin', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('ALLOWED_ORIGINS', undefined)
    expect(isAllowedWebSocketOrigin('https://en-vi.donghanhcungban.org')).toBe(true)
    expect(isAllowedWebSocketOrigin('https://sales.donghanhcungban.org')).toBe(false)
    expect(isAllowedWebSocketOrigin('https://evil.test')).toBe(false)
    expect(isAllowedWebSocketOrigin('null')).toBe(false)
    expect(isAllowedWebSocketOrigin(undefined)).toBe(false)
    expect(isAllowedWebSocketOrigin(['https://en-vi.donghanhcungban.org'])).toBe(false)
  })

  it('dev (không ALLOWED_ORIGINS): chỉ localhost', () => {
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('VERCEL_ENV', undefined)
    vi.stubEnv('ALLOWED_ORIGINS', undefined)
    expect(isAllowedWebSocketOrigin('http://localhost:5173')).toBe(true)
    expect(isAllowedWebSocketOrigin('https://en-vi.donghanhcungban.org')).toBe(false)
  })
})

describe('consumeWindowCounter + resetCounter (fallback Map)', () => {
  beforeEach(() => {
    delete process.env.REDIS_URL
    vi.useRealTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('chặn sau `limit` lượt trong cửa sổ, mở lại khi hết cửa sổ', async () => {
    vi.useFakeTimers()
    const key = 'win-' + Math.random()
    expect(await consumeWindowCounter(key, 2, 15 * 60_000)).toBe(true)
    expect(await consumeWindowCounter(key, 2, 15 * 60_000)).toBe(true)
    expect(await consumeWindowCounter(key, 2, 15 * 60_000)).toBe(false)
    vi.advanceTimersByTime(15 * 60_000 + 1)
    expect(await consumeWindowCounter(key, 2, 15 * 60_000)).toBe(true)
  })

  it('resetCounter xoá hẳn số lượt đã đếm', async () => {
    const key = 'reset-' + Math.random()
    expect(await consumeWindowCounter(key, 1, 60_000)).toBe(true)
    expect(await consumeWindowCounter(key, 1, 60_000)).toBe(false)
    await resetCounter(key)
    expect(await consumeWindowCounter(key, 1, 60_000)).toBe(true)
  })

  it('limit <= 0 → luôn chặn', async () => {
    expect(await consumeWindowCounter('zero-' + Math.random(), 0, 60_000)).toBe(false)
  })

  it('consumeWindowCounterCount trả số đếm; peekWindowCounter đọc KHÔNG tăng, hết cửa sổ → 0', async () => {
    vi.useFakeTimers()
    const key = 'count-' + Math.random()
    expect(await peekWindowCounter(key)).toBe(0)
    expect(await consumeWindowCounterCount(key, 60_000)).toBe(1)
    expect(await consumeWindowCounterCount(key, 60_000)).toBe(2)
    expect(await peekWindowCounter(key)).toBe(2)
    expect(await peekWindowCounter(key)).toBe(2)
    vi.advanceTimersByTime(60_001)
    expect(await peekWindowCounter(key)).toBe(0)
    expect(await consumeWindowCounterCount(key, 60_000)).toBe(1)
  })
})

describe('warnIfClusterWithoutRedis (cảnh báo lúc khởi động — H: rate limit lỏng khi cluster thiếu Redis)', () => {
  const OLD_INSTANCE = process.env.NODE_APP_INSTANCE
  const OLD_REDIS = process.env.REDIS_URL
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })
  afterEach(() => {
    warnSpy.mockRestore()
    if (OLD_INSTANCE === undefined) delete process.env.NODE_APP_INSTANCE
    else process.env.NODE_APP_INSTANCE = OLD_INSTANCE
    if (OLD_REDIS === undefined) delete process.env.REDIS_URL
    else process.env.REDIS_URL = OLD_REDIS
  })

  it('chạy dưới PM2 (NODE_APP_INSTANCE có set) mà KHÔNG có REDIS_URL → cảnh báo', () => {
    process.env.NODE_APP_INSTANCE = '0'
    delete process.env.REDIS_URL
    warnIfClusterWithoutRedis()
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0]?.[0]).toContain('REDIS_URL')
  })

  it('chạy dưới PM2 nhưng ĐÃ có REDIS_URL → không cảnh báo', () => {
    process.env.NODE_APP_INSTANCE = '0'
    process.env.REDIS_URL = 'redis://127.0.0.1:6379'
    warnIfClusterWithoutRedis()
    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('không chạy dưới PM2 (dev local) → không cảnh báo dù thiếu REDIS_URL', () => {
    delete process.env.NODE_APP_INSTANCE
    delete process.env.REDIS_URL
    warnIfClusterWithoutRedis()
    expect(warnSpy).not.toHaveBeenCalled()
  })
})

// ── validateAuth — nhánh TỪ CHỐI là quan trọng nhất (bảo mật) ──────────────────────────
describe('validateAuth', () => {
  const OLD_SKIP = process.env.SKIP_AUTH
  const OLD_NODE_ENV = process.env.NODE_ENV
  const OLD_VERCEL_ENV = process.env.VERCEL_ENV

  beforeEach(() => {
    validateSessionToken.mockReset()
  })
  afterEach(() => {
    if (OLD_SKIP === undefined) delete process.env.SKIP_AUTH
    else process.env.SKIP_AUTH = OLD_SKIP
    if (OLD_NODE_ENV === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = OLD_NODE_ENV
    if (OLD_VERCEL_ENV === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = OLD_VERCEL_ENV
  })

  // [Cập nhật Bước 6, docs/adr/0002-quan-ly-nguoi-dung.md] Bearer đã bị bỏ hoàn toàn — chỉ
  // còn cookie `session_token` (packages/core-auth/sessionCookie.ts) làm nguồn xác thực.
  it('THIẾU cookie → null, không gọi validateSessionToken', async () => {
    delete process.env.SKIP_AUTH
    const result = await validateAuth(reqWithHeaders({}))
    expect(result).toBeNull()
    expect(validateSessionToken).not.toHaveBeenCalled()
  })

  it('CÓ header Authorization nhưng KHÔNG còn được dùng để xác thực → null', async () => {
    delete process.env.SKIP_AUTH
    const result = await validateAuth(reqWithHeaders({ Authorization: 'Bearer hop-le' }))
    expect(result).toBeNull()
    expect(validateSessionToken).not.toHaveBeenCalled()
  })

  it('cookie không chứa session_token → null', async () => {
    delete process.env.SKIP_AUTH
    const result = await validateAuth(reqWithHeaders({ Cookie: 'other=xyz' }))
    expect(result).toBeNull()
    expect(validateSessionToken).not.toHaveBeenCalled()
  })

  it('cookie session_token ĐÚNG định dạng nhưng hết hạn/không tồn tại (validateSessionToken trả null) → null', async () => {
    delete process.env.SKIP_AUTH
    validateSessionToken.mockResolvedValue(null)
    const result = await validateAuth(reqWithHeaders({ Cookie: 'session_token=het-han' }))
    expect(result).toBeNull()
  })

  // Đổi có chủ đích 2026-10-10 (audit E1.5): bản cũ trả null → 401 → client xoá phiên, nên một
  // lần CSDL chập chờn đăng xuất mọi người. Nay ném 503 có mã ổn định, kèm log ở server.
  it('validateSessionToken ném lỗi (DB lỗi) → ném ServiceUnavailableError 503, KHÔNG trả null', async () => {
    delete process.env.SKIP_AUTH
    validateSessionToken.mockRejectedValue(new Error('db down'))
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const err = await validateAuth(reqWithHeaders({ Cookie: 'session_token=x' })).catch(
      (e: unknown) => e,
    )
    expect(err).toBeInstanceOf(ServiceUnavailableError)
    expect(err).toMatchObject({ status: 503, code: 'service_unavailable' })
    // Thông điệp nội bộ của pg chỉ nằm trong log server, không nằm trong lỗi trả client.
    expect((err as Error).message).not.toContain('db down')
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('[auth]'), 'db down')
    errSpy.mockRestore()
  })

  it('cookie session_token hợp lệ → trả userId', async () => {
    delete process.env.SKIP_AUTH
    validateSessionToken.mockResolvedValue({ userId: 'user-cookie' })
    const result = await validateAuth(reqWithHeaders({ Cookie: 'session_token=abc123' }))
    expect(result).toEqual({ userId: 'user-cookie' })
    expect(validateSessionToken).toHaveBeenCalledWith('abc123')
  })

  it('SKIP_AUTH=true nhưng NODE_ENV=production → KHÔNG bypass (an toàn production)', async () => {
    process.env.SKIP_AUTH = 'true'
    process.env.NODE_ENV = 'production'
    delete process.env.VERCEL_ENV
    const result = await validateAuth(reqWithHeaders({}))
    expect(result).toBeNull()
  })

  it('SKIP_AUTH=true nhưng VERCEL_ENV=production → KHÔNG bypass', async () => {
    process.env.SKIP_AUTH = 'true'
    delete process.env.NODE_ENV
    process.env.VERCEL_ENV = 'production'
    const result = await validateAuth(reqWithHeaders({}))
    expect(result).toBeNull()
  })

  it('SKIP_AUTH=true và KHÔNG phải production nào → bypass, trả user giả dev', async () => {
    process.env.SKIP_AUTH = 'true'
    process.env.NODE_ENV = 'development'
    delete process.env.VERCEL_ENV
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const result = await validateAuth(reqWithHeaders({}))
    expect(result).toEqual({ userId: 'dev-skip-auth' })
    warnSpy.mockRestore()
  })
})

describe('validateContentType', () => {
  it('Content-Type application/json → true', () => {
    expect(validateContentType(reqWithHeaders({ 'Content-Type': 'application/json' }))).toBe(true)
  })

  it('Content-Type có charset kèm theo (application/json; charset=utf-8) → vẫn true', () => {
    expect(
      validateContentType(reqWithHeaders({ 'Content-Type': 'application/json; charset=utf-8' })),
    ).toBe(true)
  })

  it('Content-Type khác (text/plain) → false', () => {
    expect(validateContentType(reqWithHeaders({ 'Content-Type': 'text/plain' }))).toBe(false)
  })

  it('THIẾU Content-Type → false', () => {
    expect(validateContentType(reqWithHeaders({}))).toBe(false)
  })
})

describe('logSecurityEvent', () => {
  it('ghi log cảnh báo có kèm loại sự kiện + ip', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    logSecurityEvent('LOGIN_FAILED', '1.2.3.4', { email: 'a@b.com' })
    expect(warnSpy).toHaveBeenCalledWith(
      '[Security][LOGIN_FAILED] ip=1.2.3.4',
      JSON.stringify({ email: 'a@b.com' }),
    )
    warnSpy.mockRestore()
  })
})

// Bất biến header bảo mật — audit 2026-08-25 (F4) phát hiện `Permissions-Policy` vắng mặt
// hoàn toàn và HSTS chỉ có ở response API. Test này chặn việc âm thầm bỏ lại một header.
describe('SECURITY_HEADERS', () => {
  it('có đủ các header bắt buộc', () => {
    for (const name of [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Strict-Transport-Security',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cache-Control',
    ]) {
      expect(SECURITY_HEADERS[name], `thiếu header ${name}`).toBeTruthy()
    }
  })

  it('X-Frame-Options khớp `frame-ancestors self` của CSP, không tự mâu thuẫn', () => {
    expect(SECURITY_HEADERS['X-Frame-Options']).toBe('SAMEORIGIN')
  })

  it('HSTS dùng chung đúng một giá trị', () => {
    expect(SECURITY_HEADERS['Strict-Transport-Security']).toBe(HSTS_VALUE)
    expect(HSTS_VALUE).toMatch(/^max-age=\d+;/)
  })

  it('Permissions-Policy cho phép đúng microphone + camera (app có dùng), chặn phần còn lại', () => {
    expect(SECURITY_HEADERS['Permissions-Policy']).toBe(PERMISSIONS_POLICY)
    // Hai tính năng app THẬT SỰ dùng: ghi âm luyện nói + quay video challenge.
    expect(PERMISSIONS_POLICY).toContain('microphone=(self)')
    expect(PERMISSIONS_POLICY).toContain('camera=(self)')
    // Không dùng tới → phải đóng hẳn.
    expect(PERMISSIONS_POLICY).toContain('geolocation=()')
    expect(PERMISSIONS_POLICY).toContain('payment=()')
  })
})
