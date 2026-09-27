// Test /api/admin-vip-whitelist — chặn quyền admin, thêm/xoá email khỏi danh sách VIP vĩnh viễn.
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

import handler from './admin-vip-whitelist.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

function makeRequest(method: string, body?: unknown): Request {
  return new Request('http://localhost/api/admin-vip-whitelist', {
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

describe('/api/admin-vip-whitelist', () => {
  it('OPTIONS → 204', async () => {
    const resp = await handler(makeRequest('OPTIONS'))
    expect(resp.status).toBe(204)
  })

  it('method sai (PATCH) → 405', async () => {
    const resp = await handler(makeRequest('PATCH'))
    expect(resp.status).toBe(405)
  })

  it('rate limit vượt ngưỡng → 429', async () => {
    rateLimitState.ok = false
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(429)
    expect(query).not.toHaveBeenCalled()
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

  it('GET → trả danh sách whitelist, map đúng field', async () => {
    query.mockResolvedValueOnce({
      rows: [
        { email: 'a@b.com', note: 'ghi chú', created_at: new Date('2026-01-01T00:00:00Z') },
        { email: 'c@d.com', note: null, created_at: new Date('2026-01-02T00:00:00Z') },
      ],
    })
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as {
      items: { email: string; note: string | null; createdAt: string }[]
    }
    expect(data.items).toHaveLength(2)
    expect(data.items[0]).toMatchObject({ email: 'a@b.com', note: 'ghi chú' })
    expect(data.items[1]).toMatchObject({ email: 'c@d.com', note: null })
  })

  it('POST body sai (email không hợp lệ) → 400', async () => {
    const resp = await handler(makeRequest('POST', { email: 'khong-phai-email' }))
    expect(resp.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('POST thành công → thêm vào whitelist và cấp VIP ngay', async () => {
    query.mockResolvedValueOnce({}).mockResolvedValueOnce({})
    const resp = await handler(makeRequest('POST', { email: 'A@B.com', note: 'bạn thân' }))
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual({ email: 'a@b.com', note: 'bạn thân' })
    expect(query).toHaveBeenCalledTimes(2)
    const [firstSql, firstParams] = query.mock.calls[0] as [string, unknown[]]
    expect(firstSql).toContain('insert into public.vip_whitelist')
    expect(firstParams).toEqual(['a@b.com', 'bạn thân'])
    const [secondSql, secondParams] = query.mock.calls[1] as [string, unknown[]]
    expect(secondSql).toContain("plan = 'vip'")
    expect(secondParams).toEqual(['a@b.com'])
  })

  it('DELETE body sai (thiếu email) → 400', async () => {
    const resp = await handler(makeRequest('DELETE', {}))
    expect(resp.status).toBe(400)
  })

  it('DELETE thành công → gỡ khỏi whitelist và hạ về free', async () => {
    query.mockResolvedValueOnce({}).mockResolvedValueOnce({})
    const resp = await handler(makeRequest('DELETE', { email: 'a@b.com' }))
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual({ email: 'a@b.com', removed: true })
    expect(query).toHaveBeenCalledTimes(2)
    const [secondSql] = query.mock.calls[1] as [string, unknown[]]
    expect(secondSql).toContain("plan = 'free'")
  })

  it('lỗi DB → ném lỗi', async () => {
    query.mockRejectedValueOnce(new Error('db down'))
    await expect(handler(makeRequest('GET'))).rejects.toThrow('db down')
  })
})
