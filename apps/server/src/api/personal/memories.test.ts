import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState: { user: { userId: string } | null } = {
  user: { userId: 'user-1' },
}
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

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({}) }))

const getOrCreatePerson = vi.fn()
vi.mock('@dhcb/core-personal/personService', () => ({
  getOrCreatePerson: (...a: unknown[]) => getOrCreatePerson(...a),
}))

const service = vi.hoisted(() => ({
  evaluateMemoryCandidate: vi.fn(),
  getMemoryRecord: vi.fn(),
  ingestMemory: vi.fn(),
  listMemoryRecords: vi.fn(),
  expireMemoryRecord: vi.fn(),
  deleteMemoryRecord: vi.fn(),
}))

vi.mock('@dhcb/core-personal/memoryService', () =>
  Object.fromEntries(Object.entries(service).map(([k, fn]) => [k, (...a: unknown[]) => fn(...a)])),
)

import handler from './memories.js'

const PERSON = '11111111-1111-4111-8111-111111111111'
const RECORD_ID = '22222222-2222-4222-8222-222222222222'

function req(method: string, query = '', body?: unknown) {
  return new Request(`http://localhost/api/memories${query}`, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

beforeEach(() => {
  twoFactor.getTwoFactorStatus.mockReset()
  twoFactor.hasStepUp.mockReset()
  twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: true })
  twoFactor.hasStepUp.mockResolvedValue(true)
  vi.clearAllMocks()
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
  getOrCreatePerson.mockResolvedValue({ id: PERSON })
  service.getMemoryRecord.mockResolvedValue(null)
  service.listMemoryRecords.mockResolvedValue([])
  service.evaluateMemoryCandidate.mockResolvedValue({ outcome: 'ACCEPT', reason: 'ok' })
  service.ingestMemory.mockResolvedValue({
    record: { id: RECORD_ID, content: 'test', status: 'accepted' },
    evaluation: { outcome: 'ACCEPT', reason: 'ok' },
  })
  service.expireMemoryRecord.mockResolvedValue({ id: RECORD_ID, status: 'expired' })
  service.deleteMemoryRecord.mockResolvedValue(undefined)
})

describe('auth, rate limit and validation for /api/memories', () => {
  it('OPTIONS -> 204', async () => {
    const res = await handler(req('OPTIONS'))
    expect(res.status).toBe(204)
  })

  it('rate limit exceeded -> 429', async () => {
    rateLimitOk = false
    const res = await handler(req('GET'))
    expect(res.status).toBe(429)
  })

  it('unauthenticated -> 401', async () => {
    authState.user = null
    const res = await handler(req('GET'))
    expect(res.status).toBe(401)
  })
})

describe('GET /api/memories', () => {
  it('lists memory records for person with optional namespace', async () => {
    service.listMemoryRecords.mockResolvedValueOnce([{ id: RECORD_ID, content: 'Test memory' }])
    const res = await handler(req('GET', '?namespace=semantic&includeExpired=true'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.records.length).toBe(1)
    expect(service.listMemoryRecords).toHaveBeenCalledWith(expect.anything(), PERSON, {
      namespace: 'semantic',
      includeExpired: true,
    })
  })

  it('returns 400 on invalid namespace query parameter', async () => {
    const res = await handler(req('GET', '?namespace=invalid_ns'))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/memories', () => {
  it('evaluates candidate when action = evaluate', async () => {
    const res = await handler(
      req('POST', '', {
        action: 'evaluate',
        candidate: {
          namespace: 'preference',
          content: 'Prefers audio exercises',
          provenance: 'user_declared:settings',
          sensitivity: 'personal',
        },
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.evaluation.outcome).toBe('ACCEPT')
    expect(service.evaluateMemoryCandidate).toHaveBeenCalled()
  })

  it('ingests candidate when action = ingest', async () => {
    const res = await handler(
      req('POST', '', {
        action: 'ingest',
        candidate: {
          namespace: 'semantic',
          content: 'Targeting IELTS 7.5',
          provenance: 'user_declared:goal',
          sensitivity: 'personal',
        },
      }),
    )
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.record.id).toBe(RECORD_ID)
    expect(service.ingestMemory).toHaveBeenCalled()
  })

  it('rejects invalid body format with 400', async () => {
    const res = await handler(req('POST', '', { action: 'unknown_action' }))
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/memories and DELETE /api/memories', () => {
  it('expires record on PATCH with expectedVersion', async () => {
    const res = await handler(
      req('PATCH', '', {
        id: RECORD_ID,
        action: 'expire',
        expectedVersion: 1,
      }),
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.record.status).toBe('expired')
    expect(service.expireMemoryRecord).toHaveBeenCalledWith(
      expect.anything(),
      PERSON,
      RECORD_ID,
      1,
      'user:user-1',
    )
  })

  it('deletes record on DELETE', async () => {
    const res = await handler(req('DELETE', '', { id: RECORD_ID }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(service.deleteMemoryRecord).toHaveBeenCalledWith(
      expect.anything(),
      PERSON,
      RECORD_ID,
      'user:user-1',
    )
  })
})

describe('hồ sơ riêng tư yêu cầu xác minh hai bước', () => {
  it('chưa bật 2FA → yêu cầu thiết lập, không trả dữ liệu', async () => {
    service.listMemoryRecords.mockResolvedValue([{ id: RECORD_ID, sensitivity: 'sensitive' }])
    twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: false })
    const response = await handler(req('GET'))
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ code: 'TWO_FACTOR_SETUP_REQUIRED' })
  })
  it('phiên chưa xác minh/hết hạn → STEP_UP_REQUIRED', async () => {
    service.listMemoryRecords.mockResolvedValue([{ id: RECORD_ID, sensitivity: 'sensitive' }])
    twoFactor.hasStepUp.mockResolvedValue(false)
    const response = await handler(req('GET'))
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ code: 'STEP_UP_REQUIRED' })
  })
  it('phiên đã xác minh → đọc thành công', async () => {
    service.listMemoryRecords.mockResolvedValue([{ id: RECORD_ID, sensitivity: 'sensitive' }])
    expect((await handler(req('GET'))).status).toBe(200)
  })
  it('danh tính/dữ liệu thường không bị ép bật 2FA', async () => {
    service.listMemoryRecords.mockResolvedValue([{ id: RECORD_ID, sensitivity: 'personal' }])
    twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: false })
    expect((await handler(req('GET'))).status).toBe(200)
    expect(twoFactor.getTwoFactorStatus).not.toHaveBeenCalled()
  })
})

it('evaluate MERGE không đọc vòng qua mergedContent của memory T2', async () => {
  service.evaluateMemoryCandidate.mockResolvedValue({
    outcome: 'MERGE',
    existingRecordId: RECORD_ID,
    mergedContent: 'SECRET',
  })
  service.getMemoryRecord.mockResolvedValue({ id: RECORD_ID, sensitivity: 'sensitive' })
  twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: false })
  const response = await handler(
    req('POST', '', {
      action: 'evaluate',
      candidate: {
        namespace: 'semantic',
        content: 'hello',
        provenance: 'user',
        sensitivity: 'personal',
      },
    }),
  )
  expect(response.status).toBe(403)
  expect(await response.text()).not.toContain('SECRET')
})

it('expire T2 vẫn được phép nhưng response không đọc lại nội dung', async () => {
  service.expireMemoryRecord.mockResolvedValue({
    id: RECORD_ID,
    status: 'expired',
    sensitivity: 'sensitive',
    content: 'SECRET',
  })
  const response = await handler(
    req('PATCH', '', { id: RECORD_ID, action: 'expire', expectedVersion: 1 }),
  )
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ record: { id: RECORD_ID, status: 'expired' } })
})
