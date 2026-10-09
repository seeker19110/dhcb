// Test /api/persons — GET danh tính Personal OS, export, và full_erase (V2-03, V2-19).
import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
let rateLimitOk = true
// Bộ đếm cửa sổ (xác minh lại / sai mã 2FA) — test chặn từng khoá bằng `counters.allow`.
const counters = vi.hoisted(() => ({
  allow: new Map<string, boolean>(),
  consumed: [] as string[],
  reset: [] as string[],
}))
const events: { type: string; meta: Record<string, unknown> }[] = []
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
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

const twoFactor = vi.hoisted(() => ({
  getTwoFactorStatus: vi.fn(),
  hasStepUp: vi.fn(),
  verifyTwoFactor: vi.fn(),
}))
vi.mock('@dhcb/core-auth/twoFactor', () => twoFactor)

const reauthMock = vi.hoisted(() => ({ verifyAccountReauth: vi.fn() }))
vi.mock('@dhcb/core-auth/accountReauth', () => reauthMock)

vi.mock('../core/two-factor.js', () => ({
  twoFactorUserKey: (id: string) => `2fa-user:${id}`,
  TWO_FACTOR_USER_MAX_ATTEMPTS: 10,
  TWO_FACTOR_USER_WINDOW_MS: 900_000,
}))

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn().mockReturnValue({}) }))

const getOrCreatePersonMock = vi.fn()
vi.mock('@dhcb/core-personal/personService', () => ({
  getOrCreatePerson: (...args: unknown[]) => getOrCreatePersonMock(...args),
}))

const exportPersonDataMock = vi.fn()
const erasePersonDataMock = vi.fn()
vi.mock('@dhcb/core-personal/personErasureService', () => ({
  exportPersonData: (...args: unknown[]) => exportPersonDataMock(...args),
  erasePersonData: (...args: unknown[]) => erasePersonDataMock(...args),
}))

import handler from './persons.js'
import { accountReauthKey } from '../_lib/reauthGate.js'

const PERSON = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'user-1',
  displayName: 'Liên',
  createdAt: '2026-08-16T00:00:00.000Z',
  updatedAt: '2026-08-16T00:00:00.000Z',
  schemaVersion: 1,
}

const EXPORT_DATA = {
  exportedAt: '2026-08-17T00:00:00.000Z',
  personId: PERSON.id,
  person: PERSON,
  personalFacts: [],
  memories: [],
  consentGrants: [],
  personalPolicies: [],
  lifeGraphNodes: [],
  lifeGraphEdges: [],
  automationGrants: [],
  actionReceipts: [],
  decisionRecords: [],
  workProjects: [],
  workTasks: [],
  workMeetings: [],
  workDocuments: [],
}

const ERASE_RESULT = {
  personId: PERSON.id,
  schemasCleared: ['personal.persons'],
  recordsDeletedCount: 5,
  erasureLogId: 'log-1',
}

beforeEach(() => {
  twoFactor.getTwoFactorStatus.mockReset()
  twoFactor.hasStepUp.mockReset()
  twoFactor.verifyTwoFactor.mockReset()
  twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: true })
  twoFactor.hasStepUp.mockResolvedValue(true)
  twoFactor.verifyTwoFactor.mockResolvedValue({ ok: true, usedRecoveryCode: false })
  reauthMock.verifyAccountReauth.mockReset()
  reauthMock.verifyAccountReauth.mockResolvedValue({ ok: true, method: 'password' })
  counters.allow.clear()
  counters.consumed.length = 0
  counters.reset.length = 0
  events.length = 0
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
  getOrCreatePersonMock.mockReset()
  getOrCreatePersonMock.mockResolvedValue(PERSON)
  exportPersonDataMock.mockReset()
  exportPersonDataMock.mockResolvedValue(EXPORT_DATA)
  erasePersonDataMock.mockReset()
  erasePersonDataMock.mockResolvedValue(ERASE_RESULT)
})

function makeReq(method = 'GET', url = 'http://localhost/api/persons'): Request {
  return new Request(url, { method })
}

const ERASE_URL = 'http://localhost/api/persons?action=full_erase'
const REAUTH_OK = { reauth: { method: 'password', password: 'mat-khau-dung' } }

/** DELETE full_erase kèm body JSON (mặc định: bằng chứng xác minh lại hợp lệ). */
function eraseReq(body: unknown = REAUTH_OK, url = ERASE_URL): Request {
  return new Request(url, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('GET /api/persons', () => {
  it('OPTIONS → 204', async () => {
    expect((await handler(makeReq('OPTIONS'))).status).toBe(204)
  })

  it('vượt rate limit → 429', async () => {
    rateLimitOk = false
    expect((await handler(makeReq())).status).toBe(429)
  })

  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    expect((await handler(makeReq())).status).toBe(401)
  })

  it('method khác GET/DELETE → 405', async () => {
    expect((await handler(makeReq('POST'))).status).toBe(405)
  })

  it('đăng nhập → trả Person, personId lấy từ token (không từ client)', async () => {
    const res = await handler(makeReq())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(PERSON)
    expect(getOrCreatePersonMock.mock.calls[0]?.[1]).toBe('user-1')
  })
})

describe('GET /api/persons?action=export', () => {
  it('trả toàn bộ personal data export', async () => {
    const res = await handler(makeReq('GET', 'http://localhost/api/persons?action=export'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.personId).toBe(PERSON.id)
    expect(Array.isArray(body.personalFacts)).toBe(true)
    expect(exportPersonDataMock).toHaveBeenCalledWith(expect.anything(), PERSON.id)
  })

  it('chỉ xuất dữ liệu của chính chủ: bỏ qua personId client gửi lên', async () => {
    await handler(
      makeReq(
        'GET',
        'http://localhost/api/persons?action=export&personId=99999999-9999-4999-8999-999999999999',
      ),
    )
    expect(getOrCreatePersonMock.mock.calls[0]?.[1]).toBe('user-1')
    expect(exportPersonDataMock).toHaveBeenCalledWith(expect.anything(), PERSON.id)
  })

  it('xuất lỗi → ném lên (500), không trả bản xuất thiếu', async () => {
    exportPersonDataMock.mockRejectedValue(new Error('db down'))
    await expect(
      handler(makeReq('GET', 'http://localhost/api/persons?action=export')),
    ).rejects.toThrow('db down')
  })

  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    expect(
      (await handler(makeReq('GET', 'http://localhost/api/persons?action=export'))).status,
    ).toBe(401)
  })
})

describe('DELETE /api/persons?action=full_erase', () => {
  it('xoá dữ liệu cascade và trả erasure result', async () => {
    const res = await handler(eraseReq())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.personId).toBe(PERSON.id)
    expect(body.erasureLogId).toBe('log-1')
    expect(erasePersonDataMock).toHaveBeenCalledWith(expect.anything(), PERSON.id, 'self')
  })

  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    expect((await handler(eraseReq())).status).toBe(401)
    expect(erasePersonDataMock).not.toHaveBeenCalled()
    expect(reauthMock.verifyAccountReauth).not.toHaveBeenCalled()
  })

  it('chỉ xoá Person của chính chủ: bỏ qua personId/userId client gửi lên', async () => {
    const res = await handler(
      eraseReq(
        { ...REAUTH_OK, personId: '99999999-9999-4999-8999-999999999999', userId: 'user-2' },
        `${ERASE_URL}&personId=99999999-9999-4999-8999-999999999999&userId=user-2`,
      ),
    )
    expect(res.status).toBe(200)
    expect(getOrCreatePersonMock.mock.calls[0]?.[1]).toBe('user-1')
    expect(erasePersonDataMock).toHaveBeenCalledWith(expect.anything(), PERSON.id, 'self')
  })

  it('xoá lỗi (đã rollback) → ném lên cho routes.ts trả 500, không báo thành công', async () => {
    erasePersonDataMock.mockRejectedValue(new Error('column does not exist'))
    await expect(handler(eraseReq())).rejects.toThrow('column does not exist')
  })
})

describe('DELETE /api/persons?action=full_erase — xác minh lại danh tính (0541)', () => {
  it('không gửi body (client cũ) → 403 REAUTH_REQUIRED, không trừ lượt, không xoá', async () => {
    const res = await handler(makeReq('DELETE', ERASE_URL))
    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ code: 'REAUTH_REQUIRED' })
    expect(counters.consumed).toEqual([])
    expect(getOrCreatePersonMock).not.toHaveBeenCalled()
    expect(erasePersonDataMock).not.toHaveBeenCalled()
  })

  it('body thiếu reauth / reauth sai dạng → 403 REAUTH_REQUIRED', async () => {
    for (const body of [{}, { reauth: { method: 'password', password: '' } }, { reauth: 'x' }]) {
      const res = await handler(eraseReq(body))
      expect(res.status).toBe(403)
      expect(await res.json()).toMatchObject({ code: 'REAUTH_REQUIRED' })
    }
    expect(reauthMock.verifyAccountReauth).not.toHaveBeenCalled()
    expect(erasePersonDataMock).not.toHaveBeenCalled()
  })

  it('JSON hỏng → 400, không xoá', async () => {
    const res = await handler(eraseReq('{khong-phai-json'))
    expect(res.status).toBe(400)
    expect(erasePersonDataMock).not.toHaveBeenCalled()
  })

  it('sai mật khẩu → 401 REAUTH_FAILED, ghi sự kiện, không xoá', async () => {
    reauthMock.verifyAccountReauth.mockResolvedValue({ ok: false, reason: 'failed' })
    const res = await handler(eraseReq())
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ code: 'REAUTH_FAILED', error: 'Mật khẩu không đúng.' })
    expect(erasePersonDataMock).not.toHaveBeenCalled()
    const failed = events.find((e) => e.type === 'ACCOUNT_REAUTH_FAILED')
    expect(failed?.meta).toMatchObject({ action: 'person_full_erase', method: 'password' })
    // Log không chứa userId trần.
    expect(JSON.stringify(events)).not.toContain('user-1')
  })

  it('xác minh bằng userId của PHIÊN, không phải id client gửi', async () => {
    await handler(eraseReq({ ...REAUTH_OK, userId: 'user-2' }))
    expect(reauthMock.verifyAccountReauth).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      REAUTH_OK.reauth,
    )
  })

  it('cách xác minh không khả dụng → 409 REAUTH_UNAVAILABLE', async () => {
    reauthMock.verifyAccountReauth.mockResolvedValue({ ok: false, reason: 'unavailable' })
    const res = await handler(
      eraseReq({ reauth: { method: 'google', accessToken: 'ya29.token-gia-lap' } }),
    )
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ code: 'REAUTH_UNAVAILABLE' })
    expect(erasePersonDataMock).not.toHaveBeenCalled()
  })

  it('DÙNG CHUNG hạn mức lượt thử với /api/account: hết lượt → 429, không gọi xác minh', async () => {
    counters.allow.set(accountReauthKey('user-1'), false)
    const res = await handler(eraseReq())
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('900')
    expect(await res.json()).toMatchObject({ code: 'RATE_LIMITED' })
    expect(reauthMock.verifyAccountReauth).not.toHaveBeenCalled()
    expect(erasePersonDataMock).not.toHaveBeenCalled()
  })

  it('bật 2FA, phiên chưa nâng quyền, không gửi mã → 403 STEP_UP_REQUIRED', async () => {
    twoFactor.hasStepUp.mockResolvedValue(false)
    const res = await handler(eraseReq())
    expect(res.status).toBe(403)
    expect(await res.json()).toMatchObject({ code: 'STEP_UP_REQUIRED' })
    expect(erasePersonDataMock).not.toHaveBeenCalled()
  })

  it('bật 2FA, mã sai → 401 TWO_FACTOR_INVALID, không xoá, không reset bộ đếm', async () => {
    twoFactor.hasStepUp.mockResolvedValue(false)
    twoFactor.verifyTwoFactor.mockResolvedValue({ ok: false })
    const res = await handler(eraseReq({ ...REAUTH_OK, twoFactorCode: '000000' }))
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ code: 'TWO_FACTOR_INVALID' })
    expect(counters.consumed).toContain('2fa-user:user-1')
    expect(counters.reset).toEqual([])
    expect(erasePersonDataMock).not.toHaveBeenCalled()
  })

  it('bật 2FA, mã đúng → xoá được, reset bộ đếm sai mã', async () => {
    twoFactor.hasStepUp.mockResolvedValue(false)
    const res = await handler(eraseReq({ ...REAUTH_OK, twoFactorCode: '123456' }))
    expect(res.status).toBe(200)
    expect(twoFactor.verifyTwoFactor).toHaveBeenCalledWith(expect.anything(), 'user-1', '123456')
    expect(counters.reset).toEqual(['2fa-user:user-1'])
    expect(erasePersonDataMock).toHaveBeenCalledWith(expect.anything(), PERSON.id, 'self')
  })

  it('không bật 2FA + mật khẩu đúng → xoá được, không đòi mã', async () => {
    twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: false })
    const res = await handler(eraseReq())
    expect(res.status).toBe(200)
    expect(twoFactor.verifyTwoFactor).not.toHaveBeenCalled()
    expect(erasePersonDataMock).toHaveBeenCalledTimes(1)
  })

  it('export KHÔNG bị đòi reauth (giữ nguyên hợp đồng cũ)', async () => {
    const res = await handler(makeReq('GET', 'http://localhost/api/persons?action=export'))
    expect(res.status).toBe(200)
    expect(reauthMock.verifyAccountReauth).not.toHaveBeenCalled()
  })
})

describe('hồ sơ riêng tư yêu cầu xác minh hai bước', () => {
  it('chưa bật 2FA → yêu cầu thiết lập, không trả dữ liệu', async () => {
    twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: false })
    const response = await handler(makeReq('GET', 'http://localhost/api/persons?action=export'))
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ code: 'TWO_FACTOR_SETUP_REQUIRED' })
    expect(exportPersonDataMock).not.toHaveBeenCalled()
  })
  it('phiên chưa xác minh/hết hạn → STEP_UP_REQUIRED', async () => {
    twoFactor.hasStepUp.mockResolvedValue(false)
    const response = await handler(makeReq('GET', 'http://localhost/api/persons?action=export'))
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ code: 'STEP_UP_REQUIRED' })
    expect(exportPersonDataMock).not.toHaveBeenCalled()
  })
  it('phiên đã xác minh → đọc thành công', async () => {
    expect(
      (await handler(makeReq('GET', 'http://localhost/api/persons?action=export'))).status,
    ).toBe(200)
  })
  it('danh tính/dữ liệu thường không bị ép bật 2FA', async () => {
    twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: false })
    expect((await handler(makeReq())).status).toBe(200)
    expect(twoFactor.getTwoFactorStatus).not.toHaveBeenCalled()
  })
})
