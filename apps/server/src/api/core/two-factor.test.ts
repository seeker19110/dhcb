// Test /api/two-factor — bật/tắt/xác minh xác thực hai bước.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
let rateLimitOk = true
let userAttemptOk = true
const counter = vi.hoisted(() => ({ consumed: [] as unknown[][], reset: [] as string[] }))
const securityEvents: { type: string; meta: unknown }[] = []

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
  consumeWindowCounter: async (...args: unknown[]) => {
    counter.consumed.push(args)
    return userAttemptOk
  },
  resetCounter: async (key: string) => {
    counter.reset.push(key)
  },
  validateAuth: async () => authState.user,
  logSecurityEvent: (type: string, _ip: string, meta: unknown) =>
    securityEvents.push({ type, meta }),
}))

let cookieToken: string | null = 'raw-session'
vi.mock('@dhcb/core-auth/sessionCookie', () => ({ readSessionCookie: () => cookieToken }))

let passwordOk = true
vi.mock('@dhcb/core-auth/authService', () => ({ verifyPassword: async () => passwordOk }))

// vi.hoisted vì vi.mock được nâng lên đầu file — biến khai báo thường sẽ chưa khởi tạo kịp.
const svc = vi.hoisted(() => ({
  getTwoFactorStatus: vi.fn(),
  startTwoFactorSetup: vi.fn(),
  confirmTwoFactorSetup: vi.fn(),
  verifyTwoFactor: vi.fn(),
  disableTwoFactor: vi.fn(),
  regenerateRecoveryCodes: vi.fn(),
  grantStepUp: vi.fn(),
}))
vi.mock('@dhcb/core-auth/twoFactor', () => svc)
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))

import handler, {
  twoFactorUserKey,
  TWO_FACTOR_USER_MAX_ATTEMPTS,
  TWO_FACTOR_USER_WINDOW_MS,
} from './two-factor.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const query = vi.fn()

beforeEach(() => {
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
  userAttemptOk = true
  counter.consumed.length = 0
  counter.reset.length = 0
  cookieToken = 'raw-session'
  passwordOk = true
  securityEvents.length = 0
  query.mockReset()
  query.mockResolvedValue({ rows: [{ email: 'a@b.vn', password_hash: 'hash' }] })
  vi.mocked(getPgPool).mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  for (const fn of Object.values(svc)) fn.mockReset()
  svc.grantStepUp.mockResolvedValue(new Date(Date.now() + 900_000))
  svc.verifyTwoFactor.mockResolvedValue({ ok: true, usedRecoveryCode: false })
})

const post = (body: unknown) =>
  new Request('http://localhost/api/two-factor', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('cổng vào', () => {
  it('OPTIONS → 204', async () => {
    expect(
      (await handler(new Request('http://localhost/api/two-factor', { method: 'OPTIONS' }))).status,
    ).toBe(204)
  })

  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    expect((await handler(new Request('http://localhost/api/two-factor'))).status).toBe(401)
  })

  it('vượt rate limit → 429 (đây là đường dò mã 6 chữ số, phải chặn chặt)', async () => {
    rateLimitOk = false
    expect((await handler(post({ action: 'verify', code: '123456' }))).status).toBe(429)
  })

  it('method lạ → 405', async () => {
    expect(
      (await handler(new Request('http://localhost/api/two-factor', { method: 'DELETE' }))).status,
    ).toBe(405)
  })

  it('body sai → 400, KHÔNG gọi tới service', async () => {
    expect((await handler(post({ action: 'xoá-hết' }))).status).toBe(400)
    expect(svc.verifyTwoFactor).not.toHaveBeenCalled()
  })
})

describe('GET trạng thái', () => {
  it('trả nguyên trạng thái từ service', async () => {
    svc.getTwoFactorStatus.mockResolvedValue({
      enabled: true,
      pending: false,
      recoveryCodesLeft: 3,
    })
    const res = await handler(new Request('http://localhost/api/two-factor'))
    expect(await res.json()).toEqual({ enabled: true, pending: false, recoveryCodesLeft: 3 })
  })
})

describe('setup', () => {
  it('dùng email làm nhãn hiện trong app xác thực', async () => {
    svc.startTwoFactorSetup.mockResolvedValue({ secret: 'S', otpauthUri: 'otpauth://x' })
    const res = await handler(post({ action: 'setup' }))
    expect(res.status).toBe(200)
    expect(svc.startTwoFactorSetup).toHaveBeenCalledWith(expect.anything(), 'user-1', 'a@b.vn')
  })

  it('không có email → rơi về user id, không vỡ luồng', async () => {
    query.mockResolvedValue({ rows: [{ email: null }] })
    svc.startTwoFactorSetup.mockResolvedValue({ secret: 'S', otpauthUri: 'otpauth://x' })
    await handler(post({ action: 'setup' }))
    expect(svc.startTwoFactorSetup).toHaveBeenCalledWith(expect.anything(), 'user-1', 'user-1')
  })

  it('2FA đã bật → 409 (đổi secret phải qua luồng tắt)', async () => {
    svc.startTwoFactorSetup.mockRejectedValue(new Error('2FA đã bật — hãy tắt trước'))
    const res = await handler(post({ action: 'setup' }))
    expect(res.status).toBe(409)
  })
})

describe('confirm', () => {
  it('mã đúng → trả mã khôi phục và mở luôn cửa sổ nâng quyền', async () => {
    svc.confirmTwoFactorSetup.mockResolvedValue({ ok: true, recoveryCodes: ['A', 'B'] })
    const res = await handler(post({ action: 'confirm', code: '123456' }))
    expect(res.status).toBe(200)
    expect((await res.json()).recoveryCodes).toEqual(['A', 'B'])
    expect(svc.grantStepUp).toHaveBeenCalled()
  })

  it('mã sai → 400 và GHI NHẬT KÝ bảo mật', async () => {
    svc.confirmTwoFactorSetup.mockResolvedValue({ ok: false, reason: 'Mã không đúng' })
    const res = await handler(post({ action: 'confirm', code: '000000' }))
    expect(res.status).toBe(400)
    expect(securityEvents.some((e) => e.type === 'AUTH_FAILURE')).toBe(true)
  })
})

describe('verify (nâng quyền)', () => {
  it('mã đúng → mở cửa sổ, trả hạn', async () => {
    const res = await handler(post({ action: 'verify', code: '123456' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(typeof body.stepUpUntil).toBe('string')
    expect(svc.grantStepUp).toHaveBeenCalledWith(expect.anything(), 'raw-session')
  })

  it('mã sai → 401, ghi nhật ký, KHÔNG mở cửa sổ', async () => {
    svc.verifyTwoFactor.mockResolvedValue({ ok: false, reason: 'invalid' })
    const res = await handler(post({ action: 'verify', code: '000000' }))
    expect(res.status).toBe(401)
    expect(svc.grantStepUp).not.toHaveBeenCalled()
    expect(securityEvents.some((e) => e.type === 'AUTH_FAILURE')).toBe(true)
  })

  it('chưa bật 2FA → 409, phân biệt rõ với mã sai', async () => {
    svc.verifyTwoFactor.mockResolvedValue({ ok: false, reason: 'not_enabled' })
    expect((await handler(post({ action: 'verify', code: '123456' }))).status).toBe(409)
  })

  it('không đọc được cookie phiên → 401, không mở cửa sổ cho phiên nào cả', async () => {
    cookieToken = null
    const res = await handler(post({ action: 'verify', code: '123456' }))
    expect(res.status).toBe(401)
    expect(svc.grantStepUp).not.toHaveBeenCalled()
  })
})

describe('disable', () => {
  it('đòi CẢ mã 2FA lẫn mật khẩu', async () => {
    const res = await handler(post({ action: 'disable', code: '123456', password: 'mk' }))
    expect(res.status).toBe(200)
    expect(svc.disableTwoFactor).toHaveBeenCalled()
  })

  it('mật khẩu sai → 401, KHÔNG tắt', async () => {
    passwordOk = false
    const res = await handler(post({ action: 'disable', code: '123456', password: 'sai' }))
    expect(res.status).toBe(401)
    expect(svc.disableTwoFactor).not.toHaveBeenCalled()
  })

  it('mã 2FA sai → 401, KHÔNG tắt (không kiểm tới mật khẩu)', async () => {
    svc.verifyTwoFactor.mockResolvedValue({ ok: false, reason: 'invalid' })
    const res = await handler(post({ action: 'disable', code: '000000', password: 'mk' }))
    expect(res.status).toBe(401)
    expect(svc.disableTwoFactor).not.toHaveBeenCalled()
  })

  it('tài khoản Google (không có mật khẩu) → 401, không có đường tắt', async () => {
    query.mockResolvedValue({ rows: [{ password_hash: null }] })
    const res = await handler(post({ action: 'disable', code: '123456', password: 'bất kỳ' }))
    expect(res.status).toBe(401)
    expect(svc.disableTwoFactor).not.toHaveBeenCalled()
  })

  it('thiếu mật khẩu → 400 ngay ở tầng validate', async () => {
    expect((await handler(post({ action: 'disable', code: '123456' }))).status).toBe(400)
  })
})

describe('regenerate-recovery', () => {
  it('mã đúng → phát bộ mới', async () => {
    svc.regenerateRecoveryCodes.mockResolvedValue(['X', 'Y'])
    const res = await handler(post({ action: 'regenerate-recovery', code: '123456' }))
    expect((await res.json()).recoveryCodes).toEqual(['X', 'Y'])
  })

  it('mã sai → 401, KHÔNG phát mã mới', async () => {
    svc.verifyTwoFactor.mockResolvedValue({ ok: false, reason: 'invalid' })
    expect(
      (await handler(post({ action: 'regenerate-recovery', code: '0' + '00000' }))).status,
    ).toBe(401)
    expect(svc.regenerateRecoveryCodes).not.toHaveBeenCalled()
  })
})

describe('giới hạn thử mã theo NGƯỜI DÙNG (vá 2026-09-27)', () => {
  it.each(['verify', 'confirm', 'regenerate-recovery'] as const)(
    '%s: hết lượt theo userId → 429, KHÔNG kiểm mã',
    async (action) => {
      userAttemptOk = false
      const resp = await handler(post({ action, code: '123456' }))
      expect(resp.status).toBe(429)
      expect(resp.headers.get('Retry-After')).toBe(String(TWO_FACTOR_USER_WINDOW_MS / 1000))
      expect(svc.verifyTwoFactor).not.toHaveBeenCalled()
      expect(svc.confirmTwoFactorSetup).not.toHaveBeenCalled()
      expect(securityEvents.map((e) => e.type)).toContain('TWO_FACTOR_USER_THROTTLED')
    },
  )

  it('đếm theo userId với đúng ngưỡng/cửa sổ — đổi IP không thoát được', async () => {
    svc.verifyTwoFactor.mockResolvedValue({ ok: false, reason: 'invalid' })
    await handler(post({ action: 'verify', code: '000000' }))
    expect(counter.consumed).toEqual([
      [twoFactorUserKey('user-1'), TWO_FACTOR_USER_MAX_ATTEMPTS, TWO_FACTOR_USER_WINDOW_MS],
    ])
    expect(counter.reset).toEqual([]) // sai mã → không xoá bộ đếm
  })

  it('nhập đúng mã → xoá bộ đếm', async () => {
    const resp = await handler(post({ action: 'verify', code: '123456' }))
    expect(resp.status).toBe(200)
    expect(counter.reset).toEqual([twoFactorUserKey('user-1')])
  })

  it("'setup' không nhận mã nên không trừ lượt", async () => {
    svc.startTwoFactorSetup.mockResolvedValue({ secret: 's', otpauthUrl: 'otpauth://x' })
    await handler(post({ action: 'setup' }))
    expect(counter.consumed).toEqual([])
  })
})
