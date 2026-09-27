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

const buildContextPackage = vi.fn()
vi.mock('@dhcb/core-personal/contextEngine', () => ({
  buildContextPackage: (...a: unknown[]) => buildContextPackage(...a),
}))

import handler from './context-package.js'

const PERSON = '11111111-1111-4111-8111-111111111111'

function req(method: string, body?: unknown) {
  return new Request('http://localhost/api/context-package', {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: false })
  twoFactor.hasStepUp.mockResolvedValue(false)
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
  getOrCreatePerson.mockResolvedValue({ id: PERSON })
  buildContextPackage.mockResolvedValue({
    id: '22222222-2222-4222-8222-222222222222',
    personId: PERSON,
    requestId: 'req-1',
    items: [],
    tokenBudget: 2000,
    tokenUsed: 0,
    createdAt: new Date().toISOString(),
    schemaVersion: 1,
  })
})

describe('auth, rate limit and validation for /api/context-package', () => {
  it('OPTIONS -> 204', async () => {
    const res = await handler(req('OPTIONS'))
    expect(res.status).toBe(204)
  })

  it('rate limit exceeded -> 429', async () => {
    rateLimitOk = false
    const res = await handler(req('POST', { requestText: 'hi', purpose: 'chat' }))
    expect(res.status).toBe(429)
  })

  it('unauthenticated -> 401', async () => {
    authState.user = null
    const res = await handler(req('POST', { requestText: 'hi', purpose: 'chat' }))
    expect(res.status).toBe(401)
  })

  it('method not allowed on GET -> 405', async () => {
    const res = await handler(req('GET'))
    expect(res.status).toBe(405)
  })
})

describe('POST /api/context-package', () => {
  it('builds context package successfully with valid payload', async () => {
    const res = await handler(
      req('POST', {
        requestText: 'Help me review grammar',
        purpose: 'tutoring',
        domain: 'learning',
        tokenBudget: 1500,
      }),
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.contextPackage.id).toBe('22222222-2222-4222-8222-222222222222')
    expect(buildContextPackage).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        personId: PERSON,
        requestText: 'Help me review grammar',
        purpose: 'tutoring',
        domain: 'learning',
        tokenBudget: 1500,
      }),
    )
  })

  it('rejects missing purpose with 400', async () => {
    const res = await handler(req('POST', { requestText: 'hello' }))
    expect(res.status).toBe(400)
  })
})

describe('không đọc vòng qua context-package để bỏ cổng 2FA', () => {
  beforeEach(() => {
    buildContextPackage.mockResolvedValue({
      items: [{ sensitivity: 'sensitive', content: 'HIDDEN_PROFILE' }],
    })
  })
  it('chưa bật 2FA bị từ chối trước khi trả T2', async () => {
    const response = await handler(req('POST', { requestText: 'hi', purpose: 'chat' }))
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ code: 'TWO_FACTOR_SETUP_REQUIRED' })
  })
  it('đã bật nhưng chưa step-up bị từ chối', async () => {
    twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: true })
    const response = await handler(req('POST', { requestText: 'hi', purpose: 'chat' }))
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ code: 'STEP_UP_REQUIRED' })
  })
  it('phiên đã step-up được đọc context chính chủ', async () => {
    twoFactor.getTwoFactorStatus.mockResolvedValue({ enabled: true })
    twoFactor.hasStepUp.mockResolvedValue(true)
    const response = await handler(req('POST', { requestText: 'hi', purpose: 'chat' }))
    expect(response.status).toBe(200)
  })
})
