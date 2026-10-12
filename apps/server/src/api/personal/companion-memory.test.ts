// companion-memory.test.ts — hai công tắc ký ức = hai consent chuẩn (GĐ2a ⑤).
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  COMPANION_CONSENT_PURPOSE,
  COMPANION_CONSENT_SCOPES,
} from '@dhcb/core-contracts/consentGrant'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
let rateLimitOk = true
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({}) }))

const getOrCreatePerson = vi.fn()
vi.mock('@dhcb/core-personal/personService', () => ({
  getOrCreatePerson: (...a: unknown[]) => getOrCreatePerson(...a),
}))

const consents = vi.hoisted(() => ({
  grantConsent: vi.fn(),
  listConsents: vi.fn(),
  revokeConsent: vi.fn(),
}))
vi.mock('@dhcb/core-personal/consentService', () =>
  Object.fromEntries(Object.entries(consents).map(([k, fn]) => [k, (...a: unknown[]) => fn(...a)])),
)

import handler from './companion-memory.js'

const PERSON = '11111111-1111-4111-8111-111111111111'
const MEMORY_GRANT = '22222222-2222-4222-8222-222222222222'
const HISTORY_GRANT = '33333333-3333-4333-8333-333333333333'

function req(method: string, body?: unknown) {
  return new Request('http://localhost/api/companion-memory', {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

/** Giả lập bảng consent: trạng thái active theo scope, listConsents lọc đúng scope. */
function seedConsents(active: Partial<Record<'memory' | 'history', boolean>>) {
  consents.listConsents.mockImplementation(async (_pool, _person, opts: { scope?: string }) => {
    const rows = []
    if (active.memory && opts.scope === COMPANION_CONSENT_SCOPES.memory) {
      rows.push({
        id: MEMORY_GRANT,
        scope: opts.scope,
        purpose: COMPANION_CONSENT_PURPOSE,
        status: 'active',
      })
    }
    if (active.history && opts.scope === COMPANION_CONSENT_SCOPES.history) {
      rows.push({
        id: HISTORY_GRANT,
        scope: opts.scope,
        purpose: COMPANION_CONSENT_PURPOSE,
        status: 'active',
      })
    }
    return rows
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
  getOrCreatePerson.mockResolvedValue({ id: PERSON })
  seedConsents({})
  consents.grantConsent.mockResolvedValue({ id: 'new' })
  consents.revokeConsent.mockResolvedValue(undefined)
})

describe('auth / rate limit / method', () => {
  it('OPTIONS → 204; không token → 401; quá tải → 429; PATCH → 405', async () => {
    expect((await handler(req('OPTIONS'))).status).toBe(204)
    authState.user = null
    expect((await handler(req('GET'))).status).toBe(401)
    authState.user = { userId: 'user-1' }
    rateLimitOk = false
    expect((await handler(req('GET'))).status).toBe(429)
    rateLimitOk = true
    expect((await handler(req('PATCH', {}))).status).toBe(405)
  })
})

describe('GET /api/companion-memory', () => {
  it('phản ánh consent thật: mặc định cả hai tắt; chỉ đọc đúng scope chuẩn', async () => {
    const res = await handler(req('GET'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ settings: { rememberMemories: false, useHistory: false } })
    const scopes = consents.listConsents.mock.calls.map((c) => (c[2] as { scope: string }).scope)
    expect(scopes.sort()).toEqual(
      [COMPANION_CONSENT_SCOPES.memory, COMPANION_CONSENT_SCOPES.history].sort(),
    )
  })

  it('consent active của scope ký ức nhưng purpose khác → KHÔNG tính là bật', async () => {
    consents.listConsents.mockResolvedValue([
      {
        id: MEMORY_GRANT,
        scope: COMPANION_CONSENT_SCOPES.memory,
        purpose: 'export',
        status: 'active',
      },
    ])
    const res = await handler(req('GET'))
    expect(await res.json()).toEqual({ settings: { rememberMemories: false, useHistory: false } })
  })

  it('cả hai bật', async () => {
    seedConsents({ memory: true, history: true })
    const res = await handler(req('GET'))
    expect(await res.json()).toEqual({ settings: { rememberMemories: true, useHistory: true } })
  })
})

describe('POST /api/companion-memory set_settings', () => {
  it('bật ký ức → grantConsent đúng scope + purpose; công tắc không gửi thì không đụng', async () => {
    const res = await handler(req('POST', { action: 'set_settings', rememberMemories: true }))
    expect(res.status).toBe(200)
    expect(consents.grantConsent).toHaveBeenCalledTimes(1)
    expect(consents.grantConsent).toHaveBeenCalledWith(expect.anything(), {
      personId: PERSON,
      scope: COMPANION_CONSENT_SCOPES.memory,
      purpose: COMPANION_CONSENT_PURPOSE,
    })
    expect(consents.revokeConsent).not.toHaveBeenCalled()
  })

  it('tắt lịch sử → revokeConsent bản active; tắt ký ức đang tắt → lũy đẳng, không ghi', async () => {
    seedConsents({ history: true })
    const res = await handler(
      req('POST', { action: 'set_settings', rememberMemories: false, useHistory: false }),
    )
    expect(res.status).toBe(200)
    expect(consents.revokeConsent).toHaveBeenCalledTimes(1)
    expect(consents.revokeConsent).toHaveBeenCalledWith(expect.anything(), PERSON, HISTORY_GRANT)
    expect(consents.grantConsent).not.toHaveBeenCalled()
  })

  it('bật công tắc đã bật → không cấp thêm bản mới (giữ version)', async () => {
    seedConsents({ memory: true })
    await handler(req('POST', { action: 'set_settings', rememberMemories: true }))
    expect(consents.grantConsent).not.toHaveBeenCalled()
    expect(consents.revokeConsent).not.toHaveBeenCalled()
  })

  it('trả về trạng thái đọc lại SAU khi ghi', async () => {
    let memoryOn = false
    consents.listConsents.mockImplementation(async (_p, _person, opts: { scope?: string }) =>
      memoryOn && opts.scope === COMPANION_CONSENT_SCOPES.memory
        ? [
            {
              id: MEMORY_GRANT,
              scope: opts.scope,
              purpose: COMPANION_CONSENT_PURPOSE,
              status: 'active',
            },
          ]
        : [],
    )
    consents.grantConsent.mockImplementation(async () => {
      memoryOn = true
      return { id: MEMORY_GRANT }
    })
    const res = await handler(req('POST', { action: 'set_settings', rememberMemories: true }))
    expect(await res.json()).toEqual({ settings: { rememberMemories: true, useHistory: false } })
  })

  it('body sai (action lạ / trường thừa / JSON hỏng) → 400', async () => {
    expect((await handler(req('POST', { action: 'nope' }))).status).toBe(400)
    expect(
      (await handler(req('POST', { action: 'set_settings', rememberMemories: true, extra: 1 })))
        .status,
    ).toBe(400)
    const broken = new Request('http://localhost/api/companion-memory', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    })
    expect((await handler(broken)).status).toBe(400)
  })

  it('AppError từ consentService (409 khi hai request đua nhau) → trả đúng mã', async () => {
    const { ConflictError } = await import('@dhcb/core-errors/appError')
    seedConsents({ memory: true })
    consents.revokeConsent.mockRejectedValue(new ConflictError('Consent đã được thu hồi'))
    const res = await handler(req('POST', { action: 'set_settings', rememberMemories: false }))
    expect(res.status).toBe(409)
  })
})
