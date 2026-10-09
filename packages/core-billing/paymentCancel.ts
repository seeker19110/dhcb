// packages/core-billing/paymentCancel.ts — Người dùng TỰ HUỶ đơn SePay đang chờ ("tôi CHƯA chuyển
// khoản") + liệt kê đơn chờ còn "sống". Đặc tả: docs/specs/2026-10-09-huy-don-cho-de-xoa-tai-khoan.md
// (changelog 0546).
//
// Vì sao cần: đơn `pending` "sống" (chưa quá `expires_at` + ân hạn SEPAY_LATE_GRACE_MS) chặn xoá tài
// khoản tới ~24,5 giờ (changelog 0533) để không mất tiền chuyển muộn. Người dùng CHẮC CHẮN chưa
// chuyển tiền có thể tự huỷ đơn để gỡ chặn; nếu tiền vẫn về sau đó, webhook KHÔNG cấp gói mà ghi
// vào hàng chờ hoàn tiền (paymentRefunds.ts) — không mất tiền ở cả hai phía.
//
// Chống đua với webhook: cả hai cùng `update … where status = 'pending'`. Postgres khoá dòng khi
// UPDATE; câu đến sau chờ, rồi đánh giá lại điều kiện trên bản mới nhất (READ COMMITTED) ⇒ đúng
// MỘT bên thắng. Bên thua đọc lại trạng thái để trả kết quả đúng.

import type { Pool, PoolClient } from 'pg'
import { SEPAY_LATE_GRACE_MS } from './sepay.js'

/** Lý do huỷ duy nhất hiện có — khớp CHECK `payments_cancelled_fields_check` (migration 0090). */
export const CANCEL_REASON_USER_NOT_TRANSFERRED = 'user_not_transferred'

/**
 * Điều kiện SQL "đơn còn sống" — webhook vẫn tự cấp gói nếu tiền về. Tham số `$2` = ân hạn tính
 * bằng GIÂY. DÙNG CHUNG với `hasLivePendingPayment` (accountErasureService) để hai nơi không lệch.
 */
export const LIVE_PENDING_CONDITION_SQL = `status = 'pending'
     and expires_at > now() - make_interval(secs => $2::double precision)`

/** Ân hạn tính bằng giây, truyền làm `$2` cho LIVE_PENDING_CONDITION_SQL. */
export const LIVE_PENDING_GRACE_SECONDS = SEPAY_LATE_GRACE_MS / 1000

/** Đơn chờ trả còn sống, đủ để người dùng NHẬN RA đơn (không có thông tin người khác). */
export interface LivePendingPayment {
  id: string
  paymentCode: string
  amountVnd: number
  plan: string
  cycle: string
  createdAt: string
  expiresAt: string
  /** Mốc webhook thôi tự cấp gói = expiresAt + ân hạn. Sau mốc này đơn không còn chặn xoá. */
  graceEndsAt: string
}

const LIST_LIVE_SQL = `select id, payment_code, amount_vnd, plan, cycle, created_at, expires_at
   from public.payments
   where user_id = $1 and ${LIVE_PENDING_CONDITION_SQL}
   order by created_at desc
   limit 20`

/** Liệt kê đơn chờ còn sống của CHÍNH người dùng (userId lấy từ phiên ở nơi gọi). */
export async function listLivePendingPayments(
  db: Pool | PoolClient,
  userId: string,
): Promise<LivePendingPayment[]> {
  const { rows } = await db.query<{
    id: string
    payment_code: string
    amount_vnd: number
    plan: string
    cycle: string
    created_at: Date
    expires_at: Date
  }>(LIST_LIVE_SQL, [userId, LIVE_PENDING_GRACE_SECONDS])
  return rows.map((r) => {
    const expiresAt = new Date(r.expires_at)
    return {
      id: r.id,
      paymentCode: r.payment_code,
      amountVnd: r.amount_vnd,
      plan: r.plan,
      cycle: r.cycle,
      createdAt: new Date(r.created_at).toISOString(),
      expiresAt: expiresAt.toISOString(),
      graceEndsAt: new Date(expiresAt.getTime() + SEPAY_LATE_GRACE_MS).toISOString(),
    }
  })
}

export type CancelPaymentOutcome =
  /** Vừa huỷ xong. */
  | { kind: 'cancelled'; cancelledAt: string }
  /** Đã huỷ từ trước (bấm hai lần / hai tab) — idempotent, không đổi gì. */
  | { kind: 'already_cancelled'; cancelledAt: string }
  /** Tiền đã về và gói đã cấp — KHÔNG huỷ được (webhook thắng đua). */
  | { kind: 'already_paid' }
  /** Đơn đã kết thúc theo đường khác (expired/failed) — không còn gì để huỷ. */
  | { kind: 'not_cancellable'; status: string }
  /** Không có đơn này, HOẶC đơn của người khác — cùng một kết quả để không lộ đơn tồn tại (IDOR). */
  | { kind: 'not_found' }

const CANCEL_SQL = `update public.payments
   set status = 'cancelled', cancelled_at = now(), cancel_reason = $3
   where id = $1 and user_id = $2 and status = 'pending'
   returning cancelled_at`

const READ_OWN_SQL = `select status, cancelled_at from public.payments
   where id = $1 and user_id = $2`

/**
 * Huỷ đơn chờ của CHÍNH người dùng. Cập nhật có điều kiện `status = 'pending'` là chốt chống đua
 * với webhook (xem đầu file); `user_id = $2` là chốt quyền sở hữu.
 */
export async function cancelPendingPayment(
  db: Pool | PoolClient,
  userId: string,
  paymentId: string,
): Promise<CancelPaymentOutcome> {
  const updated = await db.query<{ cancelled_at: Date }>(CANCEL_SQL, [
    paymentId,
    userId,
    CANCEL_REASON_USER_NOT_TRANSFERRED,
  ])
  const row = updated.rows[0]
  if (updated.rowCount === 1 && row) {
    return { kind: 'cancelled', cancelledAt: new Date(row.cancelled_at).toISOString() }
  }

  // Không thắng UPDATE: đọc lại để biết vì sao (vẫn lọc theo user_id — đơn người khác = not_found).
  const current = await db.query<{ status: string; cancelled_at: Date | null }>(READ_OWN_SQL, [
    paymentId,
    userId,
  ])
  const cur = current.rows[0]
  if (!cur) return { kind: 'not_found' }
  if (cur.status === 'cancelled' && cur.cancelled_at) {
    return { kind: 'already_cancelled', cancelledAt: new Date(cur.cancelled_at).toISOString() }
  }
  if (cur.status === 'paid') return { kind: 'already_paid' }
  return { kind: 'not_cancellable', status: cur.status }
}
