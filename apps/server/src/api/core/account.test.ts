// @vitest-environment node
// Test /api/account — xoá tài khoản + xuất dữ liệu (changelog 0533).
// Canh: kiểm quyền (401, IDOR), xác minh lại (bypass step-up), 2FA, rate limit, thứ tự kiểm,
// không nuốt lỗi, cookie bị xoá sau khi xoá tài khoản.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
let ipOk = true
const counters = vi.hoisted(() => ({
  allow: new Map<string, boolean>(),
  consumed: [] as string[],
  reset: [] as string[],
}))
const events: { type: string; meta: Record<string, unknown> }[] = []

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => ipOk,
  consumeWindowCounter: async (key: string) => {
    counters.consumed.push(key)
    return counters.allow.get(key) ?? true
  },
  resetCounter: async (key: string) => {
    counters.reset.push(key)
  },
  validateAuth: async () => authState.user,
  logSecurityEvent: (type: string, _ip: string, meta: Record<string, unknown>) =>
    events.push({ type, meta }),
}))

let cookieToken: string | null = 'raw-session'
vi.mock('@dhcb/core-auth/sessionCookie', () => ({
  readSessionCookie: () => cookieToken,
  buildClearSessionCookie: () => 'session_token=; Max-Age=0',
}))

const tf = vi.hoisted(() => ({
  getTwoFactorStatus: vi.fn(),
  hasStepUp: vi.fn(),
  verifyTwoFactor: vi.fn(),
}))
vi.mock('@dhcb/core-auth/twoFactor', () => tf)

const reauth = vi.hoisted(() => ({ getReauthMethods: vi.fn(), verifyAccountReauth: vi.fn() }))
vi.mock('@dhcb/core-auth/accountReauth', () => reauth)

const svc = vi.hoisted(() => ({ deleteAccount: vi.fn(), exportAccountData: vi.fn() }))
vi.mock('@dhcb/core-personal/accountErasureService', () => svc)

vi.mock('./two-factor.js', () => ({
  twoFactorUserKey: (id: string) => `2fa-user:${id}`,
  TWO_FACTOR_USER_MAX_ATTEMPTS: 10,
  TWO_FACTOR_USER_WINDOW_MS: 900_000,
}))
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))

import handler, { accountReauthKey } from './account.js'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { NotFoundError } from '@dhcb/core-errors/appError'

const query = vi.fn()
let profile: { plan: string | null; plan_expires_at: Date | null } = {
  plan: 'free',
  plan_expires_at: null,
}

beforeEach(() => {
  authState.user = { userId: 'user-1' }
  ipOk = true
  counters.allow.clear()
  counters.consumed.length = 0
  counters.reset.length = 0
  events.length = 0
  cookieToken = 'raw-session'
  profile = { plan: 'free', plan_expires_at: null }
  query.mockReset()
  query.mockImplementation(async () => ({ rows: [profile] }))
  vi.mocked(getPgPool).mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  for (const fn of [...Object.values(tf), ...Object.values(reauth), ...Object.values(svc)])
    fn.mockReset()
  tf.getTwoFactorStatus.mockResolvedValue({ enabled: false, pending: false, recoveryCodesLeft: 0 })
  tf.hasStepUp.mockResolvedValue(true)
  tf.verifyTwoFactor.mockResolvedValue({ ok: true, usedRecoveryCode: false })
  reauth.getReauthMethods.mockResolvedValue(['password'])
  reauth.verifyAccountReauth.mockResolvedValue({ ok: true, method: 'password' })
  svc.deleteAccount.mockResolvedValue({
    erasedAt: '2026-10-08T10:00:00.000Z',
    erasureLogId: 'log-1',
    tableCounts: {},
    recordsDeleted: 10,
    recordsAnonymized: 2,
    personErasureLogId: null,
  })
  svc.exportAccountData.mockResolvedValue({
    format: 'dhcb-account-export',
    userId: 'user-1',
    tables: {},
  })
})

const URL_BASE = 'http://localhost/api/account'
const post = (body: unknown, url = URL_BASE) =>
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

const DELETE_OK = {
  action: 'delete',
  reauth: { method: 'password', password: 'mat-khau-dung' },
  confirmation: 'XOÁ TÀI KHOẢN',
}
const EXPORT_OK = { action: 'export', reauth: { method: 'password', password: 'mat-khau-dung' } }

async function json(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>
}

describe('cổng vào', () => {
  it('OPTIONS → 204', async () => {
    expect((await handler(new Request(URL_BASE, { method: 'OPTIONS' }))).status).toBe(204)
  })

  it('chưa đăng nhập → 401, không chạm dịch vụ', async () => {
    authState.user = null
    expect((await handler(post(DELETE_OK))).status).toBe(401)
    expect(svc.deleteAccount).not.toHaveBeenCalled()
  })

  it('vượt rate limit theo IP → 429 RATE_LIMITED', async () => {
    ipOk = false
    const res = await handler(post(DELETE_OK))
    expect(res.status).toBe(429)
    expect((await json(res)).code).toBe('RATE_LIMITED')
  })

  it('method lạ → 405; GET thiếu action → 400', async () => {
    expect((await handler(new Request(URL_BASE, { method: 'PUT' }))).status).toBe(405)
    expect((await handler(new Request(URL_BASE))).status).toBe(400)
  })

  it('body sai Zod (thiếu reauth) → 400, không trừ lượt xác minh', async () => {
    const res = await handler(post({ action: 'delete', confirmation: 'XOÁ TÀI KHOẢN' }))
    expect(res.status).toBe(400)
    expect(counters.consumed).toEqual([])
  })
})

describe('GET ?action=options', () => {
  it('trả cách xác minh, cần 2FA hay không, trạng thái VIP', async () => {
    reauth.getReauthMethods.mockResolvedValue(['password', 'google'])
    tf.getTwoFactorStatus.mockResolvedValue({ enabled: true, pending: false, recoveryCodesLeft: 3 })
    tf.hasStepUp.mockResolvedValue(false)
    const exp = new Date(Date.now() + 86_400_000)
    profile = { plan: 'vip', plan_expires_at: exp }
    const res = await handler(new Request(`${URL_BASE}?action=options`))
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual({
      methods: ['password', 'google'],
      twoFactorRequired: true,
      vipActive: true,
      planExpiresAt: exp.toISOString(),
    })
    expect(reauth.getReauthMethods).toHaveBeenCalledWith(expect.anything(), 'user-1')
  })

  it('VIP đã hết hạn ⇒ vipActive=false', async () => {
    profile = { plan: 'vip', plan_expires_at: new Date(Date.now() - 1000) }
    const res = await handler(new Request(`${URL_BASE}?action=options`))
    expect(await json(res)).toMatchObject({ vipActive: false, planExpiresAt: null })
  })
})

describe('POST delete — thứ tự kiểm', () => {
  it('câu xác nhận sai → 400 CONFIRMATION_MISMATCH, KHÔNG trừ lượt, không xoá', async () => {
    const res = await handler(post({ ...DELETE_OK, confirmation: 'xoá đi' }))
    expect(res.status).toBe(400)
    expect((await json(res)).code).toBe('CONFIRMATION_MISMATCH')
    expect(counters.consumed).toEqual([])
    expect(svc.deleteAccount).not.toHaveBeenCalled()
  })

  it('VIP còn hạn mà chưa xác nhận không hoàn tiền → 409 VIP_ACK_REQUIRED, không trừ lượt', async () => {
    profile = { plan: 'vip', plan_expires_at: null } // VIP vĩnh viễn
    const res = await handler(post(DELETE_OK))
    expect(res.status).toBe(409)
    expect((await json(res)).code).toBe('VIP_ACK_REQUIRED')
    expect(counters.consumed).toEqual([])
  })

  it('VIP còn hạn + acknowledgeNoRefund=true → xoá được', async () => {
    profile = { plan: 'vip', plan_expires_at: null }
    const res = await handler(post({ ...DELETE_OK, acknowledgeNoRefund: true }))
    expect(res.status).toBe(200)
  })

  it('quá lượt xác minh theo NGƯỜI DÙNG → 429, không gọi xác minh', async () => {
    counters.allow.set(accountReauthKey('user-1'), false)
    const res = await handler(post(DELETE_OK))
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('900')
    expect(reauth.verifyAccountReauth).not.toHaveBeenCalled()
  })
})

describe('POST delete — xác minh lại (step-up)', () => {
  it('sai mật khẩu → 401 REAUTH_FAILED, KHÔNG xoá, ghi sự kiện bảo mật', async () => {
    reauth.verifyAccountReauth.mockResolvedValue({ ok: false, reason: 'failed' })
    const res = await handler(post(DELETE_OK))
    expect(res.status).toBe(401)
    expect((await json(res)).code).toBe('REAUTH_FAILED')
    expect(svc.deleteAccount).not.toHaveBeenCalled()
    expect(events.map((e) => e.type)).toContain('ACCOUNT_REAUTH_FAILED')
  })

  it('token Google cũ → 401 REAUTH_FAILED (thông báo bảo lấy lại)', async () => {
    reauth.verifyAccountReauth.mockResolvedValue({ ok: false, reason: 'stale' })
    const res = await handler(
      post({ ...DELETE_OK, reauth: { method: 'google', accessToken: 'ya29.cu-roi-abc' } }),
    )
    expect(res.status).toBe(401)
    expect(String((await json(res)).error)).toMatch(/Google đã cũ/)
  })

  it('cách xác minh không khả dụng → 409 REAUTH_UNAVAILABLE', async () => {
    reauth.verifyAccountReauth.mockResolvedValue({ ok: false, reason: 'unavailable' })
    const res = await handler(post(DELETE_OK))
    expect(res.status).toBe(409)
    expect((await json(res)).code).toBe('REAUTH_UNAVAILABLE')
  })

  it('IDOR: userId/personId client gửi trong body/query bị bỏ qua — chỉ dùng userId của phiên', async () => {
    const res = await handler(
      post({ ...DELETE_OK, userId: 'victim', personId: 'victim-p' }, `${URL_BASE}?userId=victim`),
    )
    expect(res.status).toBe(200)
    expect(reauth.verifyAccountReauth).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      DELETE_OK.reauth,
    )
    expect(svc.deleteAccount).toHaveBeenCalledWith(expect.anything(), 'user-1')
  })

  it('2FA bật, chưa nâng quyền, thiếu mã → 403 STEP_UP_REQUIRED, không xoá', async () => {
    tf.getTwoFactorStatus.mockResolvedValue({ enabled: true, pending: false, recoveryCodesLeft: 5 })
    tf.hasStepUp.mockResolvedValue(false)
    const res = await handler(post(DELETE_OK))
    expect(res.status).toBe(403)
    expect((await json(res)).code).toBe('STEP_UP_REQUIRED')
    expect(svc.deleteAccount).not.toHaveBeenCalled()
  })

  it('2FA: mã sai → 401 TWO_FACTOR_INVALID, trừ lượt theo bộ đếm CHUNG của /api/two-factor', async () => {
    tf.getTwoFactorStatus.mockResolvedValue({ enabled: true, pending: false, recoveryCodesLeft: 5 })
    tf.hasStepUp.mockResolvedValue(false)
    tf.verifyTwoFactor.mockResolvedValue({ ok: false, reason: 'invalid' })
    const res = await handler(post({ ...DELETE_OK, twoFactorCode: '000000' }))
    expect(res.status).toBe(401)
    expect((await json(res)).code).toBe('TWO_FACTOR_INVALID')
    expect(counters.consumed).toContain('2fa-user:user-1')
    expect(svc.deleteAccount).not.toHaveBeenCalled()
  })

  it('2FA: quá lượt nhập mã → 429', async () => {
    tf.getTwoFactorStatus.mockResolvedValue({ enabled: true, pending: false, recoveryCodesLeft: 5 })
    tf.hasStepUp.mockResolvedValue(false)
    counters.allow.set('2fa-user:user-1', false)
    const res = await handler(post({ ...DELETE_OK, twoFactorCode: '123456' }))
    expect(res.status).toBe(429)
    expect(tf.verifyTwoFactor).not.toHaveBeenCalled()
  })

  it('2FA: mã đúng → xoá được, reset bộ đếm 2FA', async () => {
    tf.getTwoFactorStatus.mockResolvedValue({ enabled: true, pending: false, recoveryCodesLeft: 5 })
    tf.hasStepUp.mockResolvedValue(false)
    const res = await handler(post({ ...DELETE_OK, twoFactorCode: '123456' }))
    expect(res.status).toBe(200)
    expect(counters.reset).toContain('2fa-user:user-1')
  })

  it('2FA bật nhưng phiên đang trong cửa sổ nâng quyền → không cần mã', async () => {
    tf.getTwoFactorStatus.mockResolvedValue({ enabled: true, pending: false, recoveryCodesLeft: 5 })
    tf.hasStepUp.mockResolvedValue(true)
    expect((await handler(post(DELETE_OK))).status).toBe(200)
    expect(tf.verifyTwoFactor).not.toHaveBeenCalled()
  })
})

describe('POST delete — kết quả', () => {
  it('thành công → 200 {ok, erasedAt}, xoá cookie phiên, no-store, log không chứa userId', async () => {
    const res = await handler(post(DELETE_OK))
    expect(res.status).toBe(200)
    expect(await json(res)).toEqual({ ok: true, erasedAt: '2026-10-08T10:00:00.000Z' })
    expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    const done = events.find((e) => e.type === 'ACCOUNT_DELETED')
    expect(done?.meta).toEqual({ erasureLogId: 'log-1' })
  })

  it('xoá song song đã xong trước (NotFound) → 404 + xoá cookie', async () => {
    svc.deleteAccount.mockRejectedValue(new NotFoundError('Không tìm thấy tài khoản'))
    const res = await handler(post(DELETE_OK))
    expect(res.status).toBe(404)
    expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0')
  })

  it('lỗi CSDL → NÉM tiếp (wrapEdge trả 500 + Sentry), có sự kiện ACCOUNT_DELETE_FAILED', async () => {
    svc.deleteAccount.mockRejectedValue(new Error('db chết giữa chừng'))
    await expect(handler(post(DELETE_OK))).rejects.toThrow('db chết giữa chừng')
    expect(events.map((e) => e.type)).toContain('ACCOUNT_DELETE_FAILED')
  })
})

describe('POST export', () => {
  it('xác minh xong → tệp JSON đính kèm, no-store', async () => {
    const res = await handler(post(EXPORT_OK))
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Disposition')).toMatch(
      /^attachment; filename="dhcb-du-lieu-cua-toi-\d{4}-\d{2}-\d{2}\.json"$/,
    )
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(JSON.parse(await res.text())).toMatchObject({ format: 'dhcb-account-export' })
    expect(svc.exportAccountData).toHaveBeenCalledWith(expect.anything(), 'user-1')
  })

  it('xuất KHÔNG cần câu xác nhận nhưng VẪN cần xác minh lại', async () => {
    reauth.verifyAccountReauth.mockResolvedValue({ ok: false, reason: 'failed' })
    expect((await handler(post(EXPORT_OK))).status).toBe(401)
    expect(svc.exportAccountData).not.toHaveBeenCalled()
  })

  it('lỗi đọc dữ liệu → NÉM (không trả bản xuất thiếu)', async () => {
    svc.exportAccountData.mockRejectedValue(new Error('đọc lỗi'))
    await expect(handler(post(EXPORT_OK))).rejects.toThrow('đọc lỗi')
  })
})
