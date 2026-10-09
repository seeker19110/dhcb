// packages/core-billing/paymentRefunds.ts — Hàng chờ HOÀN TIỀN THỦ CÔNG cho tiền SePay về đơn đã
// huỷ hoặc đã ẩn danh (tài khoản đã xoá). Đặc tả: docs/specs/2026-10-09-huy-don-cho-de-xoa-tai-khoan.md
// (changelog 0546). Bảng `public.payment_refunds` (migration 0090).
//
// Nguyên tắc:
//   - Webhook KHÔNG cấp gói cho các đơn này (người dùng đã từ chối / không còn tài khoản) nhưng
//     TIỀN ĐÃ VÀO ⇒ phải có một dòng cho admin xử lý, không chỉ một dòng log dễ trôi.
//   - Chỉ lưu thông tin SePay cần cho hoàn tiền; KHÔNG lưu nội dung chuyển khoản (thường chứa họ
//     tên người gửi) — admin tra sao kê ngân hàng theo `reference_code`.
//   - Idempotent theo (provider, provider_txn_id): SePay retry tới 7 lần ⇒ đúng một dòng.
//   - Đánh dấu "đã hoàn" là chuyển MỘT CHIỀU needed → refunded (trigger CSDL canh), ghi ai/khi
//     nào/ghi chú ⇒ chính dòng đó là bản ghi kiểm toán.

import type { Pool, PoolClient } from 'pg'

export type RefundReason = 'cancelled_by_user' | 'account_deleted'

/** Trường lấy từ payload SePay — null khi payload không có. */
export interface SepayRefundEvidence {
  gateway: string | null
  referenceCode: string | null
  receivingAccount: string | null
  transactionDate: string | null
}

export interface RecordRefundInput extends SepayRefundEvidence {
  paymentId: string
  providerTxnId: string
  amountVnd: number
  reason: RefundReason
}

/**
 * Đơn ở trạng thái này mà tiền vẫn về ⇒ cần hoàn tiền (không cấp gói). Trả null nếu KHÔNG phải ca
 * hoàn tiền. Ưu tiên `cancelled` (người dùng chủ động từ chối) trước "tài khoản đã xoá": một đơn đã
 * huỷ rồi chủ tài khoản xoá luôn vẫn là "người dùng huỷ".
 */
export function refundReasonFor(payment: {
  status: string
  user_id: string | null
}): RefundReason | null {
  if (payment.status === 'paid') return null
  if (payment.status === 'cancelled') return 'cancelled_by_user'
  if (payment.user_id === null) return 'account_deleted'
  return null
}

const INSERT_SQL = `insert into public.payment_refunds
     (payment_id, provider, provider_txn_id, amount_vnd, reason,
      gateway, reference_code, receiving_account, transaction_date)
   values ($1, 'sepay', $2, $3, $4, $5, $6, $7, $8)
   on conflict (provider, provider_txn_id) do nothing
   returning id`

/**
 * Chuẩn hoá số tiền SePay báo về thành số nguyên VND không âm cho cột `amount_vnd`
 * (bigint, CHECK >= 0). Schema webhook nhận `z.number()` nên về lý thuyết có thể là số lẻ/âm/rất
 * lớn — ghi thẳng thì INSERT lỗi 22P02/23514/22003 ⇒ 500 ⇒ SePay hết 7 lần thử là MẤT dấu vết
 * tiền. Thà ghi một dòng số tiền đã chỉnh (admin đối chiếu sao kê theo `reference_code`) còn hơn
 * không có dòng nào. `adjusted=true` khi số đã bị đổi so với số gốc.
 */
export function normalizeRefundAmount(raw: number): { amountVnd: number; adjusted: boolean } {
  const rounded = Number.isFinite(raw) ? Math.round(raw) : 0
  const amountVnd = Math.min(Math.max(rounded, 0), Number.MAX_SAFE_INTEGER)
  return { amountVnd, adjusted: amountVnd !== raw }
}

/**
 * Ghi một khoản cần hoàn tiền. `created=false` nghĩa là giao dịch SePay này đã được ghi từ trước
 * (retry) — không phải lỗi. Lỗi CSDL thì NÉM: webhook trả 5xx để SePay gửi lại, không nuốt mất
 * dấu vết tiền đã vào.
 */
export async function recordRefundNeeded(
  db: Pool | PoolClient,
  input: RecordRefundInput,
): Promise<{ created: boolean }> {
  const { amountVnd, adjusted } = normalizeRefundAmount(input.amountVnd)
  if (adjusted) {
    // Chỉ id kỹ thuật + số tiền gốc — không PII. Dòng vẫn được ghi để không mất dấu vết tiền.
    console.warn('[payment_refunds] số tiền SePay bất thường, đã chuẩn hoá trước khi ghi', {
      paymentId: input.paymentId,
      providerTxnId: input.providerTxnId,
      rawAmount: input.amountVnd,
      recordedAmountVnd: amountVnd,
    })
  }
  const res = await db.query(INSERT_SQL, [
    input.paymentId,
    input.providerTxnId,
    amountVnd,
    input.reason,
    input.gateway,
    input.referenceCode,
    input.receivingAccount,
    input.transactionDate,
  ])
  return { created: res.rowCount === 1 }
}

/** Một dòng hàng chờ hoàn tiền cho màn admin (kiểu dùng chung: core-contracts/adminViews). */
export interface RefundRow {
  id: string
  paymentId: string
  paymentCode: string
  provider: string
  providerTxnId: string
  amountVnd: number
  reason: RefundReason
  gateway: string | null
  referenceCode: string | null
  receivingAccount: string | null
  transactionDate: string | null
  receivedAt: string
  status: 'needed' | 'refunded'
  refundedAt: string | null
  refundedBy: string | null
  refundNote: string | null
}

const LIST_SQL = `select r.id, r.payment_id, p.payment_code, r.provider, r.provider_txn_id,
          r.amount_vnd, r.reason, r.gateway, r.reference_code, r.receiving_account,
          r.transaction_date, r.received_at, r.status, r.refunded_at, r.refunded_by, r.refund_note
   from public.payment_refunds r
   join public.payments p on p.id = r.payment_id
   order by r.status asc, r.received_at desc
   limit $1`
// Thứ tự: 'needed' < 'refunded' theo chữ cái ⇒ `status asc` đưa việc CHƯA làm lên đầu mà vẫn dùng
// được chỉ mục trên cột (biểu thức `(status = 'needed') desc` thì không). Thêm trạng thái mới vào
// CHECK của bảng thì phải xem lại thứ tự này.

/** Danh sách cho admin: việc CHƯA làm lên đầu. */
export async function listRefunds(db: Pool | PoolClient, limit = 100): Promise<RefundRow[]> {
  const { rows } = await db.query<{
    id: string
    payment_id: string
    payment_code: string
    provider: string
    provider_txn_id: string
    amount_vnd: string | number
    reason: RefundReason
    gateway: string | null
    reference_code: string | null
    receiving_account: string | null
    transaction_date: string | null
    received_at: Date
    status: 'needed' | 'refunded'
    refunded_at: Date | null
    refunded_by: string | null
    refund_note: string | null
  }>(LIST_SQL, [limit])
  return rows.map((r) => ({
    id: r.id,
    paymentId: r.payment_id,
    paymentCode: r.payment_code,
    provider: r.provider,
    providerTxnId: r.provider_txn_id,
    // bigint về dạng chuỗi qua `pg` — số tiền VNĐ nằm xa ngoài vùng mất chính xác của Number.
    amountVnd: Number(r.amount_vnd),
    reason: r.reason,
    gateway: r.gateway,
    referenceCode: r.reference_code,
    receivingAccount: r.receiving_account,
    transactionDate: r.transaction_date,
    receivedAt: new Date(r.received_at).toISOString(),
    status: r.status,
    refundedAt: r.refunded_at ? new Date(r.refunded_at).toISOString() : null,
    refundedBy: r.refunded_by,
    refundNote: r.refund_note,
  }))
}

export type MarkRefundedOutcome =
  | { kind: 'marked'; refundedAt: string }
  /** Đã đánh dấu từ trước — idempotent, KHÔNG ghi đè người/thời điểm/ghi chú cũ. */
  | { kind: 'already_refunded'; refundedAt: string }
  | { kind: 'not_found' }

const MARK_SQL = `update public.payment_refunds
   set status = 'refunded', refunded_at = now(), refunded_by = $2, refund_note = $3
   where id = $1 and status = 'needed'
   returning refunded_at`

const READ_REFUND_SQL = 'select status, refunded_at from public.payment_refunds where id = $1'

/** Admin xác nhận đã hoàn tiền. Cập nhật có điều kiện ⇒ hai admin bấm cùng lúc chỉ một bản ghi. */
export async function markRefunded(
  db: Pool | PoolClient,
  refundId: string,
  adminUserId: string,
  note: string,
): Promise<MarkRefundedOutcome> {
  const res = await db.query<{ refunded_at: Date }>(MARK_SQL, [refundId, adminUserId, note])
  const row = res.rows[0]
  if (res.rowCount === 1 && row) {
    return { kind: 'marked', refundedAt: new Date(row.refunded_at).toISOString() }
  }
  const cur = await db.query<{ status: string; refunded_at: Date | null }>(READ_REFUND_SQL, [
    refundId,
  ])
  const c = cur.rows[0]
  if (c?.status === 'refunded' && c.refunded_at) {
    return { kind: 'already_refunded', refundedAt: new Date(c.refunded_at).toISOString() }
  }
  return { kind: 'not_found' }
}
