// Test /api/admin-payments phần hàng chờ hoàn tiền + đơn người dùng tự huỷ (changelog 0546).
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
import { validateAuth, logSecurityEvent } from '@dhcb/core-auth/security'
import { grantPlanDays } from '@dhcb/core-billing/planGrant'

const REFUND_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22'
const queryMock = getPgPool().query as unknown as ReturnType<typeof vi.fn>

const post = (body: unknown) =>
  new Request('http://localhost/api/admin-payments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

beforeEach(() => {
  vi.clearAllMocks()
  queryMock.mockReset()
  vi.mocked(validateAuth).mockResolvedValue({ userId: 'a1' })
})

describe('GET ?view=refunds', () => {
  it('admin → danh sách, việc CHƯA hoàn lên đầu, bigint số tiền thành number', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: REFUND_ID,
          payment_id: 'p1',
          payment_code: 'DHCB7K2M9QRT',
          provider: 'sepay',
          provider_txn_id: '92704',
          amount_vnd: '99000',
          reason: 'cancelled_by_user',
          gateway: 'Vietcombank',
          reference_code: 'MBVCB.1',
          receiving_account: '0123',
          transaction_date: '2026-10-09 14:02:37',
          received_at: new Date('2026-10-09T07:02:40Z'),
          status: 'needed',
          refunded_at: null,
          refunded_by: null,
          refund_note: null,
        },
      ],
    })
    const res = await handler(new Request('http://localhost/api/admin-payments?view=refunds'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as { refunds: Array<Record<string, unknown>> }
    expect(body.refunds[0]).toMatchObject({
      id: REFUND_ID,
      amountVnd: 99_000,
      reason: 'cancelled_by_user',
      referenceCode: 'MBVCB.1',
      receivedAt: '2026-10-09T07:02:40.000Z',
      status: 'needed',
    })
    const sql = String(queryMock.mock.calls[0]?.[0])
    expect(sql).toContain('order by r.status asc, r.received_at desc') // 'needed' < 'refunded'
  })

  it('không phải admin → 403, không đọc CSDL', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'u1' })
    const res = await handler(new Request('http://localhost/api/admin-payments?view=refunds'))
    expect(res.status).toBe(403)
    expect(queryMock).not.toHaveBeenCalled()
  })
})

describe('POST mark-refunded', () => {
  it('đánh dấu một chiều needed → refunded, ghi admin + ghi chú, log kiểm toán', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ refunded_at: new Date('2026-10-09T08:00:00Z') }],
      rowCount: 1,
    })
    const res = await handler(
      post({ action: 'mark-refunded', refundId: REFUND_ID, note: '  Đã CK hoàn FT123  ' }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true, alreadyRefunded: false })
    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]]
    expect(sql).toContain("where id = $1 and status = 'needed'")
    expect(params).toEqual([REFUND_ID, 'a1', 'Đã CK hoàn FT123'])
    expect(logSecurityEvent).toHaveBeenCalledWith(
      'PAYMENT_REFUND_MARKED',
      expect.anything(),
      expect.objectContaining({ refundId: REFUND_ID, admin: 'a1' }),
    )
  })

  it('bấm lại khi đã hoàn → 200 alreadyRefunded, KHÔNG ghi đè, không log lại', async () => {
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 }).mockResolvedValueOnce({
      rows: [{ status: 'refunded', refunded_at: new Date('2026-10-09T08:00:00Z') }],
    })
    const res = await handler(post({ action: 'mark-refunded', refundId: REFUND_ID, note: 'x' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      alreadyRefunded: true,
      refundedAt: '2026-10-09T08:00:00.000Z',
    })
    expect(logSecurityEvent).not.toHaveBeenCalledWith(
      'PAYMENT_REFUND_MARKED',
      expect.anything(),
      expect.anything(),
    )
  })

  it('không có khoản này → 404', async () => {
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 }).mockResolvedValueOnce({ rows: [] })
    const res = await handler(post({ action: 'mark-refunded', refundId: REFUND_ID, note: 'x' }))
    expect(res.status).toBe(404)
  })

  it.each([
    { label: 'ghi chú rỗng', note: '   ' },
    { label: 'ghi chú quá dài', note: 'x'.repeat(501) },
  ])('$label → 400, không đụng CSDL', async ({ note }) => {
    const res = await handler(post({ action: 'mark-refunded', refundId: REFUND_ID, note }))
    expect(res.status).toBe(400)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('người không phải admin → 403', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'u1' })
    const res = await handler(post({ action: 'mark-refunded', refundId: REFUND_ID, note: 'x' }))
    expect(res.status).toBe(403)
    expect(queryMock).not.toHaveBeenCalled()
  })
})

describe('manual-match đơn người dùng đã tự huỷ', () => {
  it('→ 400, KHÔNG update, KHÔNG cấp gói (tiền về nằm ở hàng chờ hoàn)', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'u99' }] })
    queryMock.mockResolvedValueOnce({
      rows: [
        { status: 'cancelled', cycle: 'month', years: 1, user_id: 'u99', anonymized_at: null },
      ],
    })
    const res = await handler(
      post({
        action: 'manual-match',
        paymentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: 'buyer@example.com',
      }),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('tự huỷ')
    expect(grantPlanDays).not.toHaveBeenCalled()
    const sqls = queryMock.mock.calls.map(([sql]) => String(sql))
    expect(sqls.some((sql) => sql.includes('update public.payments'))).toBe(false)
  })

  it('lớp phòng thủ 2: câu UPDATE loại trừ cả paid lẫn cancelled', async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'u99' }] })
    queryMock.mockResolvedValueOnce({
      rows: [{ status: 'pending', cycle: 'month', years: 1, user_id: 'u99', anonymized_at: null }],
    })
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    const res = await handler(
      post({
        action: 'manual-match',
        paymentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        email: 'buyer@example.com',
      }),
    )
    expect(res.status).toBe(409)
    expect(String(queryMock.mock.calls[2]?.[0])).toContain("status not in ('paid', 'cancelled')")
  })

  it('lọc danh sách theo status=cancelled được chấp nhận', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] })
    const res = await handler(new Request('http://localhost/api/admin-payments?status=cancelled'))
    expect(res.status).toBe(200)
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['cancelled'])
    expect(String(queryMock.mock.calls[0]?.[0])).toContain('cancelled_at')
  })
})
