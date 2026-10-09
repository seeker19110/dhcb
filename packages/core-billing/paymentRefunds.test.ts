// Unit test hàng chờ hoàn tiền (changelog 0546). Ràng buộc/trigger thật: paymentCancel.integration.test.ts.
import { describe, it, expect, vi } from 'vitest'
import {
  markRefunded,
  normalizeRefundAmount,
  recordRefundNeeded,
  refundReasonFor,
} from './paymentRefunds.js'

describe('refundReasonFor — đơn nào mà tiền về thì phải hoàn', () => {
  it.each([
    { status: 'pending', user_id: 'u1', want: null },
    { status: 'paid', user_id: 'u1', want: null },
    { status: 'paid', user_id: null, want: null }, // đã trả xong rồi mới xoá tài khoản: không hoàn
    { status: 'expired', user_id: 'u1', want: null }, // quá hạn thường: giữ luồng LATE cũ
    { status: 'cancelled', user_id: 'u1', want: 'cancelled_by_user' },
    { status: 'cancelled', user_id: null, want: 'cancelled_by_user' },
    { status: 'expired', user_id: null, want: 'account_deleted' },
    { status: 'pending', user_id: null, want: 'account_deleted' },
  ])('status=$status user=$user_id → $want', ({ status, user_id, want }) => {
    expect(refundReasonFor({ status, user_id })).toBe(want)
  })
})

describe('normalizeRefundAmount — cột bigint CHECK >= 0 không được làm mất dòng', () => {
  it.each([
    { raw: 99_000, want: 99_000, adjusted: false },
    { raw: 0, want: 0, adjusted: false },
    { raw: 99_000.4, want: 99_000, adjusted: true },
    { raw: 99_000.5, want: 99_001, adjusted: true },
    { raw: -1, want: 0, adjusted: true },
    { raw: 1e30, want: Number.MAX_SAFE_INTEGER, adjusted: true },
    { raw: Number.POSITIVE_INFINITY, want: 0, adjusted: true },
  ])('$raw → $want', ({ raw, want, adjusted }) => {
    expect(normalizeRefundAmount(raw)).toEqual({ amountVnd: want, adjusted })
  })
})

describe('recordRefundNeeded', () => {
  const input = {
    paymentId: 'p1',
    providerTxnId: '92704',
    amountVnd: 99_000,
    reason: 'cancelled_by_user' as const,
    gateway: 'VCB',
    referenceCode: 'R1',
    receivingAccount: '0123',
    transactionDate: '2026-10-09 14:02:37',
  }

  it('dòng mới → created=true; idempotent nhờ on conflict', async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 1, rows: [{ id: 'r1' }] })
    expect(await recordRefundNeeded({ query } as never, input)).toEqual({ created: true })
    const [sql, params] = query.mock.calls[0] as [string, unknown[]]
    expect(sql).toContain('on conflict (provider, provider_txn_id) do nothing')
    expect(params).toEqual([
      'p1',
      '92704',
      99_000,
      'cancelled_by_user',
      'VCB',
      'R1',
      '0123',
      '2026-10-09 14:02:37',
    ])
  })

  it('SePay gửi lại → created=false (không lỗi)', async () => {
    const query = vi.fn().mockResolvedValue({ rowCount: 0, rows: [] })
    expect(await recordRefundNeeded({ query } as never, input)).toEqual({ created: false })
  })

  it('lỗi CSDL → ném', async () => {
    const query = vi.fn().mockRejectedValue(new Error('db down'))
    await expect(recordRefundNeeded({ query } as never, input)).rejects.toThrow('db down')
  })
})

describe('markRefunded', () => {
  it('needed → marked', async () => {
    const query = vi
      .fn()
      .mockResolvedValue({ rowCount: 1, rows: [{ refunded_at: new Date('2026-10-09T08:00:00Z') }] })
    expect(await markRefunded({ query } as never, 'r1', 'a1', 'note')).toEqual({
      kind: 'marked',
      refundedAt: '2026-10-09T08:00:00.000Z',
    })
  })

  it('đã refunded → already_refunded với thời điểm CŨ', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({
        rows: [{ status: 'refunded', refunded_at: new Date('2026-10-01T00:00:00Z') }],
      })
    expect(await markRefunded({ query } as never, 'r1', 'a1', 'note')).toEqual({
      kind: 'already_refunded',
      refundedAt: '2026-10-01T00:00:00.000Z',
    })
  })

  it('không tồn tại → not_found', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rowCount: 0, rows: [] })
      .mockResolvedValueOnce({ rows: [] })
    expect(await markRefunded({ query } as never, 'r1', 'a1', 'note')).toEqual({
      kind: 'not_found',
    })
  })
})
