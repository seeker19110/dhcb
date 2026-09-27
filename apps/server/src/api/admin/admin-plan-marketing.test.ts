// Test /api/admin-plan-marketing — chặn quyền admin, sửa badge/tagline + CRUD gạch đầu dòng.
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
const marketingResult = { plans: {}, updatedAt: '2026-01-01T00:00:00.000Z' }
const getPlanMarketing = vi.fn(async () => marketingResult)
const invalidatePlanMarketingCache = vi.fn()
vi.mock('@dhcb/core-billing/planMarketing', () => ({
  getPlanMarketing: () => getPlanMarketing(),
  invalidatePlanMarketingCache: (...args: unknown[]) => invalidatePlanMarketingCache(...args),
}))

import handler from './admin-plan-marketing.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

function makeRequest(method: string, body?: unknown): Request {
  return new Request('http://localhost/api/admin-plan-marketing', {
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
  getPlanMarketing.mockClear()
  invalidatePlanMarketingCache.mockClear()
})

describe('/api/admin-plan-marketing', () => {
  it('OPTIONS → 204', async () => {
    const resp = await handler(makeRequest('OPTIONS'))
    expect(resp.status).toBe(204)
  })

  it('method không được hỗ trợ (HEAD) → 405', async () => {
    const resp = await handler(makeRequest('HEAD'))
    expect(resp.status).toBe(405)
  })

  it('rate limit vượt ngưỡng → 429', async () => {
    rateLimitState.ok = false
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(429)
  })

  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(401)
  })

  it('không phải admin → 403', async () => {
    authState.user = { userId: 'non-admin' }
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(403)
  })

  it('GET → trả nội dung marketing', async () => {
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual(marketingResult)
  })

  it('PUT body sai (plan không hợp lệ) → 400', async () => {
    const resp = await handler(makeRequest('PUT', { plan: 'gold' }))
    expect(resp.status).toBe(400)
  })

  it('PUT thành công → cập nhật badge/tagline', async () => {
    query.mockResolvedValueOnce({})
    const resp = await handler(
      makeRequest('PUT', { plan: 'vip', badge: 'HOT', taglineVi: 'Xin chào' }),
    )
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual({ ok: true })
    const [, params] = query.mock.calls[0] as [string, unknown[]]
    expect(params).toEqual(['vip', 'HOT', 'Xin chào', undefined])
    expect(invalidatePlanMarketingCache).toHaveBeenCalledTimes(1)
  })

  it('POST body sai (thiếu textEn) → 400', async () => {
    const resp = await handler(makeRequest('POST', { plan: 'vip', textVi: 'abc' }))
    expect(resp.status).toBe(400)
  })

  it('POST không truyền sortOrder → tự tính max+10', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ max_order: 20 }] })
      .mockResolvedValueOnce({ rows: [{ id: 5 }] })
    const resp = await handler(makeRequest('POST', { plan: 'vip', textVi: 'Vi', textEn: 'En' }))
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual({ id: 5 })
    const [, params] = query.mock.calls[1] as [string, unknown[]]
    expect(params[1]).toBe(30)
  })

  it('POST có sortOrder → dùng luôn, không truy vấn max', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 7 }] })
    const resp = await handler(
      makeRequest('POST', { plan: 'vip', textVi: 'Vi', textEn: 'En', sortOrder: 5 }),
    )
    expect(resp.status).toBe(200)
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('PATCH body sai (thiếu id) → 400', async () => {
    const resp = await handler(makeRequest('PATCH', { textVi: 'x' }))
    expect(resp.status).toBe(400)
  })

  it('PATCH không tìm thấy hàng → 404', async () => {
    query.mockResolvedValueOnce({ rowCount: 0 })
    const resp = await handler(makeRequest('PATCH', { id: 1, textVi: 'x' }))
    expect(resp.status).toBe(404)
  })

  it('PATCH thành công → sửa 1 hàng', async () => {
    query.mockResolvedValueOnce({ rowCount: 1 })
    const resp = await handler(makeRequest('PATCH', { id: 1, textVi: 'Mới' }))
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual({ ok: true })
  })

  it('DELETE body sai (id không phải số) → 400', async () => {
    const resp = await handler(makeRequest('DELETE', { id: 'abc' }))
    expect(resp.status).toBe(400)
  })

  it('DELETE thành công → xoá 1 hàng', async () => {
    query.mockResolvedValueOnce({})
    const resp = await handler(makeRequest('DELETE', { id: 3 }))
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual({ id: 3, removed: true })
  })

  it('GET lỗi DB → ném lỗi', async () => {
    getPlanMarketing.mockRejectedValueOnce(new Error('db down'))
    await expect(handler(makeRequest('GET'))).rejects.toThrow('db down')
  })
})
