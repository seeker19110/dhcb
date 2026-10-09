import { Client } from 'pg'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './admin-payments.js'

vi.mock('@dhcb/core-db/pgPool', () => {
  const query = vi.fn()
  const transactionQuery = vi.fn((sql: string, params?: unknown[]) =>
    ['begin', 'commit', 'rollback'].includes(sql)
      ? Promise.resolve({ rows: [] })
      : query(sql, params),
  )
  const client = { query: transactionQuery, release: vi.fn() }
  const pool = { query, connect: vi.fn(async () => client) }
  return { getPgPool: () => pool }
})

vi.mock('@dhcb/core-auth/security', () => ({
  validateAuth: vi.fn(),
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: vi.fn(() => Promise.resolve(true)),
  logSecurityEvent: vi.fn(),
}))

vi.mock('@dhcb/core-auth/adminAuth', () => ({
  isAdminUser: (userId?: string) => userId === 'a1',
}))

vi.mock('@dhcb/core-billing/planGrant', () => ({
  grantPlanDays: vi.fn(() => Promise.resolve()),
}))

import { getPgPool } from '@dhcb/core-db/pgPool'
import { validateAuth, checkRateLimit } from '@dhcb/core-auth/security'
import { grantPlanDays } from '@dhcb/core-billing/planGrant'

describe('/api/admin-payments', () => {
  const queryMock = getPgPool().query as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    queryMock.mockReset()
  })

  it('từ chối người dùng chưa đăng nhập (401)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/admin-payments')
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('từ chối người dùng không phải admin (403)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'u1' })

    const req = new Request('http://localhost/api/admin-payments')
    const res = await handler(req)
    expect(res.status).toBe(403)
  })

  it('trả danh sách đơn cho admin (GET 200)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    queryMock.mockResolvedValueOnce({
      rows: [{ id: 'p1', paymentCode: 'DHCB1234', status: 'pending' }],
    })

    const req = new Request('http://localhost/api/admin-payments')
    const res = await handler(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.payments).toHaveLength(1)
  })

  it('GET với ?q=search_term → lọc đơn theo payment_code hoặc email', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    queryMock.mockResolvedValueOnce({
      rows: [{ id: 'p2', paymentCode: 'DHCB5678', status: 'pending' }],
    })

    const req = new Request('http://localhost/api/admin-payments?q=DHCB5678')
    const res = await handler(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.payments).toHaveLength(1)
    // Xác nhận query SQL có chứa tham số lọc %search_term%
    const sqlCall = queryMock.mock.calls[0]
    expect(sqlCall?.[1]).toContain('%dhcb5678%')
  })

  it('POST manual-match: happy path → cấp gói thành công (200)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    // 1) Tìm user bằng email
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'u99' }] })
    // 2) Đọc đơn thanh toán
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 'pay-1',
          status: 'pending',
          plan: 'vip',
          cycle: 'month',
          user_id: 'u99',
          anonymized_at: null,
        },
      ],
    })
    // 3) Update trạng thái đơn
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const req = new Request('http://localhost/api/admin-payments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'manual-match',
        paymentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: 'buyer@example.com',
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.ok).toBe(true)
    expect(json.message).toContain('VIP')
  })

  it('POST manual-match: email không tồn tại → 404', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    // Tìm user bằng email → không có kết quả
    queryMock.mockResolvedValueOnce({ rows: [] })

    const req = new Request('http://localhost/api/admin-payments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'manual-match',
        paymentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: 'notfound@example.com',
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json.error).toContain('notfound@example.com')
  })

  it('POST manual-match: đơn đã paid → 400', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    // 1) Tìm user bằng email
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'u99' }] })
    // 2) Đọc đơn thanh toán → đã paid
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 'pay-1', status: 'paid', plan: 'vip', cycle: 'month' }],
    })

    const req = new Request('http://localhost/api/admin-payments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'manual-match',
        paymentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: 'buyer@example.com',
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toContain('đã được ghi nhận')
  })

  // Rà bảo mật changelog 0533: đơn của tài khoản đã xoá (ẩn danh hoá) không được khớp tay —
  // nếu không, admin gõ email bất kỳ là cấp VIP cho người KHÁC chủ đơn.
  const manualMatch = () =>
    new Request('http://localhost/api/admin-payments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        action: 'manual-match',
        paymentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: 'buyer@example.com',
      }),
    })

  it.each([
    { label: 'user_id null + anonymized_at', user_id: null, anonymized_at: new Date() },
    { label: 'chỉ anonymized_at (dữ liệu lệch)', user_id: 'u-old', anonymized_at: new Date() },
    { label: 'chỉ user_id null', user_id: null, anonymized_at: null },
  ])(
    'POST manual-match: đơn đã ẩn danh ($label) → 400, KHÔNG update, KHÔNG cấp gói',
    async ({ user_id, anonymized_at }) => {
      vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })
      queryMock.mockResolvedValueOnce({ rows: [{ id: 'u99' }] })
      queryMock.mockResolvedValueOnce({
        rows: [{ status: 'expired', cycle: 'month', years: 1, user_id, anonymized_at }],
      })
      const res = await handler(manualMatch())
      expect(res.status).toBe(400)
      expect((await res.json()).error).toContain('đã bị xoá')
      expect(grantPlanDays).not.toHaveBeenCalled()
      const sqls = queryMock.mock.calls.map(([sql]) => String(sql))
      expect(sqls.some((sql) => sql.includes('update public.payments'))).toBe(false)
      expect(sqls[1]).toContain('anonymized_at')
    },
  )

  it('POST manual-match: UPDATE không khớp dòng (lớp phòng thủ 2) → 409, KHÔNG cấp gói', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'u99' }] })
    queryMock.mockResolvedValueOnce({
      rows: [{ status: 'pending', cycle: 'month', years: 1, user_id: 'u1', anonymized_at: null }],
    })
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    const res = await handler(manualMatch())
    expect(res.status).toBe(409)
    expect(grantPlanDays).not.toHaveBeenCalled()
    const updateSql = String(queryMock.mock.calls[2]?.[0])
    expect(updateSql).toContain('user_id is not null')
    expect(updateSql).toContain('anonymized_at is null')
  })

  it('OPTIONS → 204 (preflight CORS), không cần đăng nhập', async () => {
    const res = await handler(
      new Request('http://localhost/api/admin-payments', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
    expect(validateAuth).not.toHaveBeenCalled()
  })

  it('vượt rate limit → 429, chặn TRƯỚC khi xác thực', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce(false)
    const res = await handler(new Request('http://localhost/api/admin-payments'))
    expect(res.status).toBe(429)
    expect(validateAuth).not.toHaveBeenCalled()
  })

  it('method lạ (DELETE) → 405', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    const res = await handler(
      new Request('http://localhost/api/admin-payments', { method: 'DELETE' }),
    )
    expect(res.status).toBe(405)
  })
})

// Mô hình READ COMMITTED + khóa dòng: trạng thái và quyền lợi chỉ lộ ra sau commit.
describe('manual-match — nguyên tử, đồng thời và retry', () => {
  let paid: boolean
  let grantedDays: number
  let failGrant: boolean
  let cycle: 'month' | 'year'
  let years: number
  let lockTail: Promise<void>
  const transactions = new Map<unknown, { days: number }>()
  const paymentId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
  const request = () =>
    new Request('http://localhost/api/admin-payments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'manual-match', paymentId, email: 'buyer@example.com' }),
    })

  beforeEach(() => {
    paid = false
    grantedDays = 0
    failGrant = false
    cycle = 'month'
    years = 1
    lockTail = Promise.resolve()
    transactions.clear()
    vi.mocked(validateAuth).mockResolvedValue({ userId: 'a1' })

    vi.mocked(getPgPool().query).mockReset()
    vi.mocked(getPgPool().query).mockImplementation(async () => ({
      rows: [{ id: 'u99' }],
      rowCount: 1,
      command: 'SELECT',
      oid: 0,
      fields: [],
    }))
    vi.mocked(getPgPool().connect).mockImplementation(async () => {
      let unlock: (() => void) | undefined
      let stagedPaid = false
      const staged = { days: 0 }
      const query = vi.fn(async (sql: string) => {
        if (sql.includes('from public.payments')) {
          expect(sql).toContain('for update')
          const previous = lockTail
          lockTail = new Promise<void>((resolve) => {
            unlock = resolve
          })
          await previous
          stagedPaid = paid
          return {
            rows: [
              {
                status: stagedPaid ? 'paid' : 'pending',
                cycle,
                years,
                user_id: 'u99',
                anonymized_at: null,
              },
            ],
          }
        }
        if (sql.startsWith('update public.payments')) {
          expect(unlock).toBeDefined()
          stagedPaid = true
          return { rows: [], rowCount: 1 }
        }
        if (sql === 'commit') {
          paid = stagedPaid
          grantedDays += staged.days
          unlock?.()
        }
        if (sql === 'rollback') unlock?.()
        return { rows: [] }
      })
      const client = Object.assign(new Client(), { query, release: vi.fn() })
      transactions.set(client, staged)
      return client
    })
    vi.mocked(grantPlanDays).mockImplementation(async (_userId, _plan, days, _now, client) => {
      const staged = transactions.get(client)
      expect(staged).toBeDefined()
      if (failGrant) {
        failGrant = false
        throw new Error('grant failed')
      }
      if (staged) staged.days += days
      return { plan: 'vip', planExpiresAt: null }
    })
  })

  it('hai admin khớp cùng đơn chỉ cấp đúng một lần; retry đã paid không cấp thêm', async () => {
    const results = await Promise.all([handler(request()), handler(request())])
    expect(results.map((result) => result.status).sort()).toEqual([200, 400])
    expect(paid).toBe(true)
    expect(grantedDays).toBe(30)
    expect((await handler(request())).status).toBe(400)
    expect(grantedDays).toBe(30)
  })

  it('cấp gói lỗi không để đơn paid, retry cấp được quyền lợi', async () => {
    failGrant = true
    await expect(handler(request())).rejects.toThrow('grant failed')
    expect(paid).toBe(false)
    expect(grantedDays).toBe(0)
    expect((await handler(request())).status).toBe(200)
    expect(paid).toBe(true)
    expect(grantedDays).toBe(30)
  })

  it('khớp đơn mua nhiều năm cấp đủ thời hạn', async () => {
    cycle = 'year'
    years = 3
    expect((await handler(request())).status).toBe(200)
    expect(grantedDays).toBe(3 * 365)
  })
})
