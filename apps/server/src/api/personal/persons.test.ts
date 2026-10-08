// Test /api/persons — GET danh tính Personal OS, export, và full_erase (V2-03, V2-19).
import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
let rateLimitOk = true
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))

const twoFactor = vi.hoisted(() => ({ getTwoFactorStatus: vi.fn(), hasStepUp: vi.fn() }))
vi.mock('@dhcb/core-auth/twoFactor', () => twoFactor)

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
  twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: true })
  twoFactor.hasStepUp.mockResolvedValue(true)
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
    const res = await handler(makeReq('DELETE', 'http://localhost/api/persons?action=full_erase'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.personId).toBe(PERSON.id)
    expect(body.erasureLogId).toBe('log-1')
    expect(erasePersonDataMock).toHaveBeenCalledWith(expect.anything(), PERSON.id, 'self')
  })

  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    expect(
      (await handler(makeReq('DELETE', 'http://localhost/api/persons?action=full_erase'))).status,
    ).toBe(401)
    expect(erasePersonDataMock).not.toHaveBeenCalled()
  })

  it('chỉ xoá Person của chính chủ: bỏ qua personId/userId client gửi lên', async () => {
    const res = await handler(
      makeReq(
        'DELETE',
        'http://localhost/api/persons?action=full_erase&personId=99999999-9999-4999-8999-999999999999&userId=user-2',
      ),
    )
    expect(res.status).toBe(200)
    expect(getOrCreatePersonMock.mock.calls[0]?.[1]).toBe('user-1')
    expect(erasePersonDataMock).toHaveBeenCalledWith(expect.anything(), PERSON.id, 'self')
  })

  it('xoá lỗi (đã rollback) → ném lên cho routes.ts trả 500, không báo thành công', async () => {
    erasePersonDataMock.mockRejectedValue(new Error('column does not exist'))
    await expect(
      handler(makeReq('DELETE', 'http://localhost/api/persons?action=full_erase')),
    ).rejects.toThrow('column does not exist')
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
