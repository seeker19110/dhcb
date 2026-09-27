// Test /api/admin-users — chặn quyền admin, kẹp limit/offset, và trả đúng field cho UI.
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))
vi.mock('@dhcb/core-auth/adminAuth', () => ({
  isAdminUser: (userId: string | null | undefined) => userId === 'user-1',
}))

import handler from './admin-users.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

function makeRequest(qs = ''): Request {
  return new Request(`http://localhost/api/admin-users${qs}`, {
    headers: { authorization: 'Bearer test' },
  })
}

beforeEach(() => {
  query.mockReset()
  mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  authState.user = { userId: 'user-1' }
})

describe('/api/admin-users', () => {
  it('chưa đăng nhập → 401, không đụng DB', async () => {
    authState.user = null
    const resp = await handler(makeRequest())
    expect(resp.status).toBe(401)
    expect(query).not.toHaveBeenCalled()
  })

  it('không phải admin → 403', async () => {
    authState.user = { userId: 'non-admin' }
    const resp = await handler(makeRequest())
    expect(resp.status).toBe(403)
  })

  it('admin → trả danh sách user với đúng field, limit mặc định 20', async () => {
    query.mockResolvedValueOnce({ rows: [{ count: '2' }] }).mockResolvedValueOnce({
      rows: [
        {
          id: 'u1',
          email: 'a@b.com',
          created_at: '2026-01-01T00:00:00Z',
          email_verified: '2026-01-02T00:00:00Z',
          plan: 'vip',
          plan_expires_at: '2026-02-01T00:00:00Z',
          last_active_day: '2026-01-15',
        },
        {
          id: 'u2',
          email: 'c@d.com',
          created_at: '2026-01-03T00:00:00Z',
          email_verified: null,
          plan: 'free',
          plan_expires_at: null,
          last_active_day: null,
        },
      ],
    })
    const resp = await handler(makeRequest())
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as {
      total: number
      users: { email: string; emailVerified: boolean; plan: string }[]
    }
    expect(data.total).toBe(2)
    expect(data.users).toHaveLength(2)
    expect(data.users[0]).toMatchObject({ email: 'a@b.com', emailVerified: true, plan: 'vip' })
    expect(data.users[1]).toMatchObject({ email: 'c@d.com', emailVerified: false, plan: 'free' })
    const [, params] = query.mock.calls[1] as [string, unknown[]]
    expect(params).toEqual(['%%', 20, 0])
  })

  it('kẹp limit vượt trần (>100) về 100', async () => {
    query.mockResolvedValueOnce({ rows: [{ count: '0' }] }).mockResolvedValueOnce({ rows: [] })
    await handler(makeRequest('?limit=999'))
    const [, params] = query.mock.calls[1] as [string, unknown[]]
    expect(params[1]).toBe(100)
  })

  it('search truyền qua đúng dạng ILIKE %...%', async () => {
    query.mockResolvedValueOnce({ rows: [{ count: '0' }] }).mockResolvedValueOnce({ rows: [] })
    await handler(makeRequest('?search=Gmail'))
    const [, params] = query.mock.calls[1] as [string, unknown[]]
    expect(params[0]).toBe('%gmail%')
  })
})
