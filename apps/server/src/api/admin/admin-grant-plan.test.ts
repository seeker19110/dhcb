// Test /api/admin-grant-plan — chặn quyền admin, tra cứu gói theo email, cấp/gia hạn gói.
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
const rateLimitState: { ok: boolean } = { ok: true }
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitState.ok,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))
vi.mock('@dhcb/core-auth/adminAuth', () => ({
  isAdminUser: (userId: string | null | undefined) => userId === 'user-1',
}))

import handler from './admin-grant-plan.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

function makeRequest(method: string, path = '', body?: unknown): Request {
  return new Request(`http://localhost/api/admin-grant-plan${path}`, {
    method,
    headers: {
      authorization: 'Bearer test',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  query.mockReset()
  mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  authState.user = { userId: 'user-1' }
  rateLimitState.ok = true
})

describe('/api/admin-grant-plan', () => {
  it('OPTIONS → 204', async () => {
    const resp = await handler(makeRequest('OPTIONS'))
    expect(resp.status).toBe(204)
  })

  it('method sai (PUT) → 405', async () => {
    const resp = await handler(makeRequest('PUT'))
    expect(resp.status).toBe(405)
  })

  it('rate limit vượt ngưỡng → 429', async () => {
    rateLimitState.ok = false
    const resp = await handler(makeRequest('GET', '?email=a@b.com'))
    expect(resp.status).toBe(429)
    expect(query).not.toHaveBeenCalled()
  })

  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    const resp = await handler(makeRequest('GET', '?email=a@b.com'))
    expect(resp.status).toBe(401)
    expect(query).not.toHaveBeenCalled()
  })

  it('không phải admin → 403', async () => {
    authState.user = { userId: 'non-admin' }
    const resp = await handler(makeRequest('GET', '?email=a@b.com'))
    expect(resp.status).toBe(403)
  })

  it('GET thiếu email → 400', async () => {
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(400)
  })

  it('GET không tìm thấy user → 404', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    const resp = await handler(makeRequest('GET', '?email=a@b.com'))
    expect(resp.status).toBe(404)
  })

  it('GET thành công → trả plan hiện tại', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'u1' }] })
      .mockResolvedValueOnce({ rows: [{ plan: 'vip', plan_expires_at: null }] })
    const resp = await handler(makeRequest('GET', '?email=a@b.com'))
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as {
      email: string
      plan: string
      planExpiresAt: string | null
    }
    expect(data).toMatchObject({ email: 'a@b.com', plan: 'vip', planExpiresAt: null })
  })

  it('POST body sai (plan không hợp lệ) → 400', async () => {
    const resp = await handler(
      makeRequest('POST', '', { email: 'a@b.com', plan: 'gold', days: 10 }),
    )
    expect(resp.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('POST không tìm thấy user → 404', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    const resp = await handler(makeRequest('POST', '', { email: 'a@b.com', plan: 'vip', days: 10 }))
    expect(resp.status).toBe(404)
  })

  it('POST thành công → cấp gói, tính đúng ngày hết hạn', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u1' }] }).mockResolvedValueOnce({ rows: [] })
    const resp = await handler(makeRequest('POST', '', { email: 'a@b.com', plan: 'vip', days: 10 }))
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as {
      email: string
      plan: string
      planExpiresAt: string | null
    }
    expect(data.plan).toBe('vip')
    expect(data.planExpiresAt).not.toBeNull()
    const [, params] = query.mock.calls[1] as [string, unknown[]]
    expect(params[0]).toBe('u1')
    expect(params[1]).toBe('vip')
  })

  it('POST plan=vip, days=null → cấp vĩnh viễn (planExpiresAt = null)', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u1' }] }).mockResolvedValueOnce({ rows: [] })
    const resp = await handler(
      makeRequest('POST', '', { email: 'a@b.com', plan: 'vip', days: null }),
    )
    const data = (await resp.json()) as { planExpiresAt: string | null }
    expect(data.planExpiresAt).toBeNull()
  })

  it('lỗi DB → ném lỗi (không bị nuốt âm thầm)', async () => {
    query.mockRejectedValueOnce(new Error('db down'))
    await expect(handler(makeRequest('GET', '?email=a@b.com'))).rejects.toThrow('db down')
  })
})
