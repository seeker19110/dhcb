// Test TÍCH HỢP trên Postgres THẬT: huỷ đơn chờ + webhook SePay + hàng chờ hoàn tiền + xoá tài
// khoản (changelog 0546, migration 0090).
//
// VÌ SAO PHẢI LÀ DB THẬT: chốt chống đua (UPDATE có điều kiện `status = 'pending'`, khoá dòng của
// Postgres), CHECK `payments_cancelled_fields_check`, trigger một chiều của `payment_refunds` và
// `on conflict` — mock `pg` không chứng minh được cái nào.
//
// Job `unit` của CI KHÔNG có Postgres ⇒ tự BỎ QUA khi thiếu `DATABASE_URL`. Chạy tay: tạo DB,
// `npm run migrate:pg`, rồi
// `DATABASE_URL=... npx vitest run apps/server/src/api/billing/payment-cancel.integration.test.ts`.

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { randomBytes } from 'node:crypto'
import { Pool } from 'pg'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { cancelPendingPayment, listLivePendingPayments } from '@dhcb/core-billing/paymentCancel'
import { listRefunds, markRefunded } from '@dhcb/core-billing/paymentRefunds'
import { deleteAccount, hasLivePendingPayment } from '@dhcb/core-personal/accountErasureService'
import webhook from './payment-webhook.js'

const DATABASE_URL = process.env.DATABASE_URL
// Khoá giả cho test (tên biến tránh mẫu gitleaks `generic-api-key`).
const WEBHOOK_SECRET_FAKE = 'khoa-gia-0546'
const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

function code(): string {
  const bytes = randomBytes(8)
  return `DHCB${Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')}`
}

function txn(): string {
  return `it-0546-${randomBytes(6).toString('hex')}`
}

describe.skipIf(!DATABASE_URL)('huỷ đơn chờ + hàng chờ hoàn tiền (Postgres thật)', () => {
  let pool: Pool

  beforeAll(() => {
    process.env.SEPAY_WEBHOOK_API_KEY = WEBHOOK_SECRET_FAKE
    pool = new Pool({ connectionString: DATABASE_URL, max: 8 })
  })

  afterAll(async () => {
    await pool.end()
    await getPgPool().end()
  })

  async function newUser(): Promise<string> {
    const email = `pay-0546-${randomBytes(6).toString('hex')}@example.test`
    const { rows } = await pool.query<{ id: string }>(
      `insert into public.users (email, password_hash) values ($1, 'x') returning id`,
      [email],
    )
    const id = rows[0]!.id
    await pool.query(`insert into public.profiles (id, name) values ($1, 'T')`, [id])
    return id
  }

  /** Đơn chờ; `expiresInMin` âm = đã quá hạn bấy nhiêu phút. */
  async function newOrder(
    userId: string,
    opts: { expiresInMin?: number; status?: string } = {},
  ): Promise<{ id: string; code: string }> {
    const c = code()
    const { rows } = await pool.query<{ id: string }>(
      `insert into public.payments (user_id, plan, cycle, amount_vnd, payment_code, expires_at, status, paid_at)
       values ($1, 'vip', 'month', 99000, $2, now() + make_interval(mins => $3), $4,
               case when $4 = 'paid' then now() end)
       returning id`,
      [userId, c, opts.expiresInMin ?? 30, opts.status ?? 'pending'],
    )
    return { id: rows[0]!.id, code: c }
  }

  async function payViaWebhook(paymentCode: string, txnId: string, amount = 99_000) {
    const res = await webhook(
      new Request('http://localhost/api/payment-webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Apikey ${WEBHOOK_SECRET_FAKE}`,
        },
        body: JSON.stringify({
          id: txnId,
          gateway: 'Vietcombank',
          transactionDate: '2026-10-09 14:02:37',
          accountNumber: '0123499999',
          content: `NGUYEN VAN A ${paymentCode}`,
          transferType: 'in',
          transferAmount: amount,
          referenceCode: `REF-${txnId}`,
        }),
      }),
    )
    expect(res.status).toBe(200)
  }

  async function order(id: string) {
    const { rows } = await pool.query<{
      status: string
      cancelled_at: Date | null
      cancel_reason: string | null
      provider_txn_id: string | null
    }>(
      'select status, cancelled_at, cancel_reason, provider_txn_id from public.payments where id = $1',
      [id],
    )
    return rows[0]!
  }

  async function plan(userId: string) {
    const { rows } = await pool.query<{ plan: string | null }>(
      'select plan from public.profiles where id = $1',
      [userId],
    )
    return rows[0]?.plan ?? null
  }

  async function refundsFor(paymentId: string) {
    const { rows } = await pool.query<{
      reason: string
      amount_vnd: string
      status: string
      reference_code: string | null
      gateway: string | null
      receiving_account: string | null
      transaction_date: string | null
    }>('select * from public.payment_refunds where payment_id = $1', [paymentId])
    return rows
  }

  it('huỷ đơn của chính mình: cancelled + thời điểm + lý do; hết chặn xoá; bấm lại idempotent', async () => {
    const u = await newUser()
    const o = await newOrder(u)
    expect(await hasLivePendingPayment(pool, u)).toBe(true)
    expect((await listLivePendingPayments(pool, u)).map((p) => p.id)).toEqual([o.id])

    const first = await cancelPendingPayment(pool, u, o.id)
    expect(first.kind).toBe('cancelled')
    const row = await order(o.id)
    expect(row.status).toBe('cancelled')
    expect(row.cancelled_at).toBeInstanceOf(Date)
    expect(row.cancel_reason).toBe('user_not_transferred')
    expect(await hasLivePendingPayment(pool, u)).toBe(false)
    expect(await listLivePendingPayments(pool, u)).toEqual([])

    const again = await cancelPendingPayment(pool, u, o.id)
    expect(again).toEqual({
      kind: 'already_cancelled',
      cancelledAt: row.cancelled_at!.toISOString(),
    })
  })

  it('huỷ đơn NGƯỜI KHÁC (IDOR) → not_found, đơn nguyên vẹn', async () => {
    const owner = await newUser()
    const attacker = await newUser()
    const o = await newOrder(owner)
    expect(await cancelPendingPayment(pool, attacker, o.id)).toEqual({ kind: 'not_found' })
    expect((await order(o.id)).status).toBe('pending')
  })

  it('đơn đã paid → already_paid; đơn expired → not_cancellable; dữ liệu không đổi', async () => {
    const u = await newUser()
    const paid = await newOrder(u, { status: 'paid' })
    const expired = await newOrder(u, { status: 'expired' })
    expect(await cancelPendingPayment(pool, u, paid.id)).toEqual({ kind: 'already_paid' })
    expect(await cancelPendingPayment(pool, u, expired.id)).toEqual({
      kind: 'not_cancellable',
      status: 'expired',
    })
    expect((await order(paid.id)).status).toBe('paid')
    expect((await order(expired.id)).status).toBe('expired')
  })

  it('CHECK: đơn cancelled thiếu thời điểm/lý do bị Postgres chặn (23514)', async () => {
    const u = await newUser()
    const o = await newOrder(u)
    await expect(
      pool.query(`update public.payments set status = 'cancelled' where id = $1`, [o.id]),
    ).rejects.toMatchObject({ code: '23514' })
  })

  it('tiền về SAU khi huỷ → KHÔNG cấp gói, đơn giữ cancelled, đúng MỘT dòng cần hoàn kể cả SePay gửi lại', async () => {
    const u = await newUser()
    const o = await newOrder(u)
    await cancelPendingPayment(pool, u, o.id)
    const t = txn()
    await payViaWebhook(o.code, t)
    await payViaWebhook(o.code, t) // retry
    expect(await plan(u)).not.toBe('vip')
    expect((await order(o.id)).status).toBe('cancelled')
    const rows = await refundsFor(o.id)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      reason: 'cancelled_by_user',
      amount_vnd: '99000',
      status: 'needed',
      reference_code: `REF-${t}`,
      gateway: 'Vietcombank',
      receiving_account: '0123499999',
      transaction_date: '2026-10-09 14:02:37',
    })
    // Không lưu nội dung chuyển khoản (có họ tên người gửi).
    expect(JSON.stringify(rows)).not.toContain('NGUYEN')
  })

  it('đơn còn pending (không huỷ) → webhook cấp VIP như cũ, không vào hàng chờ', async () => {
    const u = await newUser()
    const o = await newOrder(u)
    await payViaWebhook(o.code, txn())
    expect((await order(o.id)).status).toBe('paid')
    expect(await plan(u)).toBe('vip')
    expect(await refundsFor(o.id)).toEqual([])
  })

  it('huỷ → xoá tài khoản được → tiền về sau đó vẫn vào hàng chờ (lý do "người dùng huỷ")', async () => {
    const u = await newUser()
    const o = await newOrder(u)
    await expect(deleteAccount(pool, u)).rejects.toMatchObject({ name: 'PendingPaymentError' })
    await cancelPendingPayment(pool, u, o.id)
    await deleteAccount(pool, u)
    await payViaWebhook(o.code, txn())
    const rows = await refundsFor(o.id)
    expect(rows.map((r) => r.reason)).toEqual(['cancelled_by_user'])
  })

  it('đơn của tài khoản đã xoá (pending quá ân hạn → ẩn danh expired) + tiền về → hàng chờ "tài khoản đã xoá"', async () => {
    const u = await newUser()
    const o = await newOrder(u, { expiresInMin: -25 * 60 }) // quá hạn 25 giờ: không chặn xoá
    await deleteAccount(pool, u)
    await payViaWebhook(o.code, txn())
    expect((await refundsFor(o.id)).map((r) => r.reason)).toEqual(['account_deleted'])
  })

  it('ĐUA (xác định): webhook giữ khoá dòng rồi commit paid → lệnh huỷ chờ, trả already_paid', async () => {
    const u = await newUser()
    const o = await newOrder(u)
    const c = await pool.connect()
    try {
      await c.query('begin')
      await c.query(
        `update public.payments set status = 'paid', paid_at = now(), provider_txn_id = $2
         where id = $1 and status = 'pending'`,
        [o.id, txn()],
      )
      const cancelling = cancelPendingPayment(pool, u, o.id) // bị khoá dòng chặn
      await new Promise((r) => setTimeout(r, 150))
      await c.query('commit')
      expect(await cancelling).toEqual({ kind: 'already_paid' })
    } finally {
      c.release()
    }
    expect((await order(o.id)).status).toBe('paid')
  })

  it('ĐUA (xác định): huỷ giữ khoá dòng, webhook chạy giữa chừng → không cấp gói, vào hàng chờ', async () => {
    const u = await newUser()
    const o = await newOrder(u)
    const c = await pool.connect()
    try {
      await c.query('begin')
      expect((await cancelPendingPayment(c, u, o.id)).kind).toBe('cancelled')
      const paying = payViaWebhook(o.code, txn()) // SELECT thấy pending, UPDATE bị khoá chặn
      await new Promise((r) => setTimeout(r, 150))
      await c.query('commit')
      await paying
    } finally {
      c.release()
    }
    expect(await plan(u)).not.toBe('vip')
    expect((await order(o.id)).status).toBe('cancelled')
    expect((await refundsFor(o.id)).map((r) => r.reason)).toEqual(['cancelled_by_user'])
  })

  it('ĐUA (song song thật, 15 đơn): mỗi đơn đúng MỘT kết cục — hoặc paid+VIP, hoặc cancelled+1 dòng hoàn', async () => {
    const cases = await Promise.all(
      Array.from({ length: 15 }, async () => {
        const u = await newUser()
        return { u, o: await newOrder(u) }
      }),
    )
    await Promise.all(
      cases.flatMap(({ u, o }) => [
        payViaWebhook(o.code, txn()),
        cancelPendingPayment(pool, u, o.id),
      ]),
    )
    for (const { u, o } of cases) {
      const status = (await order(o.id)).status
      const refunds = await refundsFor(o.id)
      if (status === 'paid') {
        expect(await plan(u)).toBe('vip')
        expect(refunds).toEqual([])
      } else {
        expect(status).toBe('cancelled')
        expect(await plan(u)).not.toBe('vip')
        expect(refunds).toHaveLength(1)
      }
    }
  })

  it('sổ hoàn tiền: chỉ needed → refunded; cấm sửa trường khác, cấm quay lại, cấm xoá; đánh dấu lại idempotent', async () => {
    const u = await newUser()
    const o = await newOrder(u)
    await cancelPendingPayment(pool, u, o.id)
    await payViaWebhook(o.code, txn())
    const refund = (await listRefunds(pool, 500)).find((r) => r.paymentId === o.id)!
    expect(refund).toMatchObject({ status: 'needed', amountVnd: 99_000, paymentCode: o.code })

    await expect(
      pool.query('update public.payment_refunds set amount_vnd = 1 where id = $1', [refund.id]),
    ).rejects.toThrow(/chỉ được chuyển needed → refunded/)
    await expect(
      pool.query('delete from public.payment_refunds where id = $1', [refund.id]),
    ).rejects.toThrow(/sổ kiểm toán/)

    const admin = u // id admin bất kỳ (không khoá ngoại)
    const marked = await markRefunded(pool, refund.id, admin, 'Đã CK hoàn FT1')
    expect(marked.kind).toBe('marked')
    const again = await markRefunded(pool, refund.id, admin, 'ghi đè?')
    expect(again.kind).toBe('already_refunded')
    const { rows } = await pool.query<{ refund_note: string }>(
      'select refund_note from public.payment_refunds where id = $1',
      [refund.id],
    )
    expect(rows[0]?.refund_note).toBe('Đã CK hoàn FT1')
    await expect(
      pool.query(
        `update public.payment_refunds set status = 'needed', refunded_at = null,
           refunded_by = null, refund_note = null where id = $1`,
        [refund.id],
      ),
    ).rejects.toThrow(/chỉ được chuyển needed → refunded/)
    // Đơn có tiền về không xoá được (chứng từ).
    await expect(
      pool.query('delete from public.payments where id = $1', [o.id]),
    ).rejects.toMatchObject({ code: '23503' })
  })

  it('sổ hoàn tiền: TRUNCATE cũng bị chặn — cả trực tiếp lẫn kéo theo qua `truncate payments cascade`', async () => {
    const u = await newUser()
    const o = await newOrder(u)
    await cancelPendingPayment(pool, u, o.id)
    await payViaWebhook(o.code, txn())
    // Chạy trong transaction rồi ROLLBACK: nếu trigger hỏng thì test đỏ mà KHÔNG xoá sạch dữ liệu
    // của các test khác dùng chung CSDL.
    for (const sql of ['truncate public.payment_refunds', 'truncate public.payments cascade']) {
      const client = await pool.connect()
      try {
        await client.query('begin')
        await expect(client.query(sql)).rejects.toThrow(/sổ kiểm toán/)
      } finally {
        await client.query('rollback')
        client.release()
      }
    }
    const { rows } = await pool.query<{ n: string }>(
      'select count(*)::text as n from public.payment_refunds where payment_id = $1',
      [o.id],
    )
    expect(rows[0]?.n).toBe('1')
  })
})
