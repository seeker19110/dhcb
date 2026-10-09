// Unit test huỷ đơn chờ + đơn chờ còn sống (changelog 0546). Hành vi trên Postgres THẬT (đua với
// webhook, CHECK, trigger) nằm ở paymentCancel.integration.test.ts.
import { describe, it, expect, vi } from 'vitest'
import {
  cancelPendingPayment,
  LIVE_PENDING_GRACE_SECONDS,
  listLivePendingPayments,
} from './paymentCancel.js'
import { SEPAY_LATE_GRACE_MS } from './sepay.js'

const PAY = '11111111-1111-4111-8111-111111111111'
const norm = (sql: string) => sql.replace(/\s+/g, ' ')

function db(...results: Array<{ rows: unknown[]; rowCount?: number }>) {
  const query = vi.fn()
  for (const r of results) query.mockResolvedValueOnce({ rowCount: r.rows.length, ...r })
  return { query }
}

describe('cancelPendingPayment', () => {
  it('đơn pending của chính mình → cancelled; UPDATE có điều kiện chủ + pending + lý do', async () => {
    const d = db({ rows: [{ cancelled_at: new Date('2026-10-09T03:00:00Z') }], rowCount: 1 })
    expect(await cancelPendingPayment(d as never, 'user-1', PAY)).toEqual({
      kind: 'cancelled',
      cancelledAt: '2026-10-09T03:00:00.000Z',
    })
    const [sql, params] = d.query.mock.calls[0] as [string, unknown[]]
    expect(norm(sql)).toContain("where id = $1 and user_id = $2 and status = 'pending'")
    expect(params).toEqual([PAY, 'user-1', 'user_not_transferred'])
    expect(d.query).toHaveBeenCalledTimes(1)
  })

  it('đã huỷ từ trước → already_cancelled (idempotent, giữ thời điểm cũ)', async () => {
    const d = db(
      { rows: [], rowCount: 0 },
      { rows: [{ status: 'cancelled', cancelled_at: new Date('2026-10-09T02:00:00Z') }] },
    )
    expect(await cancelPendingPayment(d as never, 'user-1', PAY)).toEqual({
      kind: 'already_cancelled',
      cancelledAt: '2026-10-09T02:00:00.000Z',
    })
  })

  it('đơn đã paid (webhook thắng) → already_paid', async () => {
    const d = db({ rows: [], rowCount: 0 }, { rows: [{ status: 'paid', cancelled_at: null }] })
    expect(await cancelPendingPayment(d as never, 'user-1', PAY)).toEqual({ kind: 'already_paid' })
  })

  it.each(['expired', 'failed'])('đơn %s → not_cancellable', async (status) => {
    const d = db({ rows: [], rowCount: 0 }, { rows: [{ status, cancelled_at: null }] })
    expect(await cancelPendingPayment(d as never, 'user-1', PAY)).toEqual({
      kind: 'not_cancellable',
      status,
    })
  })

  it('đơn của NGƯỜI KHÁC → not_found; câu đọc lại cũng lọc theo user_id', async () => {
    const d = db({ rows: [], rowCount: 0 }, { rows: [] })
    expect(await cancelPendingPayment(d as never, 'user-1', PAY)).toEqual({ kind: 'not_found' })
    const [sql, params] = d.query.mock.calls[1] as [string, unknown[]]
    expect(norm(sql)).toContain('where id = $1 and user_id = $2')
    expect(params).toEqual([PAY, 'user-1'])
  })
})

describe('listLivePendingPayments', () => {
  it('lọc theo user + điều kiện "sống" + ân hạn tính bằng giây; graceEndsAt = expiresAt + 24h', async () => {
    const expires = new Date('2026-10-09T01:30:00Z')
    const d = db({
      rows: [
        {
          id: PAY,
          payment_code: 'DHCB7K2M9QRT',
          amount_vnd: 99_000,
          plan: 'vip',
          cycle: 'month',
          created_at: new Date('2026-10-09T01:00:00Z'),
          expires_at: expires,
        },
      ],
    })
    const list = await listLivePendingPayments(d as never, 'user-1')
    expect(list).toEqual([
      {
        id: PAY,
        paymentCode: 'DHCB7K2M9QRT',
        amountVnd: 99_000,
        plan: 'vip',
        cycle: 'month',
        createdAt: '2026-10-09T01:00:00.000Z',
        expiresAt: '2026-10-09T01:30:00.000Z',
        graceEndsAt: new Date(expires.getTime() + SEPAY_LATE_GRACE_MS).toISOString(),
      },
    ])
    const [sql, params] = d.query.mock.calls[0] as [string, unknown[]]
    expect(norm(sql)).toContain("where user_id = $1 and status = 'pending'")
    expect(params).toEqual(['user-1', LIVE_PENDING_GRACE_SECONDS])
    expect(LIVE_PENDING_GRACE_SECONDS).toBe(86_400)
  })

  it('không có đơn → mảng rỗng', async () => {
    expect(await listLivePendingPayments(db({ rows: [] }) as never, 'user-1')).toEqual([])
  })
})
