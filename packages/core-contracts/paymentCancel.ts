// packages/core-contracts/paymentCancel.ts — Hợp đồng "Huỷ đơn chờ — tôi CHƯA chuyển khoản" +
// hàng chờ hoàn tiền ở /admin. Đặc tả: docs/specs/2026-10-09-huy-don-cho-de-xoa-tai-khoan.md §③
// (changelog 0546). Dùng chung server (validate body) và giao diện (validate phản hồi).

import { z } from 'zod'

// ── Đơn chờ còn "sống" (chặn xoá tài khoản) ─────────────────────────────────────

export const LivePendingPaymentSchema = z.object({
  id: z.string().uuid(),
  paymentCode: z.string(),
  amountVnd: z.number().int().nonnegative(),
  plan: z.string(),
  cycle: z.string(),
  createdAt: z.string(),
  expiresAt: z.string(),
  /** expiresAt + ân hạn 24 giờ: sau mốc này đơn tự thôi chặn xoá tài khoản. */
  graceEndsAt: z.string(),
})
export type LivePendingPaymentView = z.infer<typeof LivePendingPaymentSchema>

// ── POST /api/payment-cancel ───────────────────────────────────────────────────

export const PaymentCancelBodySchema = z.object({
  paymentId: z.string().uuid(),
  // Người dùng PHẢI tự tick "tôi chưa chuyển khoản" — server từ chối nếu thiếu (không mặc định).
  confirmNotTransferred: z.literal(true),
})
export type PaymentCancelBody = z.infer<typeof PaymentCancelBodySchema>

export const PaymentCancelResultSchema = z.object({
  ok: z.literal(true),
  /** true = đơn đã huỷ từ trước (bấm lại) — idempotent. */
  alreadyCancelled: z.boolean(),
  cancelledAt: z.string(),
})
export type PaymentCancelResult = z.infer<typeof PaymentCancelResultSchema>

/** Mã lỗi máy đọc được cho `/api/payment-cancel`. */
export const PAYMENT_CANCEL_ERROR_CODES = [
  'NOT_FOUND', // không có đơn, hoặc đơn của người khác (cùng mã — không lộ đơn tồn tại)
  'ALREADY_PAID', // tiền đã về, gói đã cấp — không huỷ được
  'NOT_CANCELLABLE', // đơn đã kết thúc theo đường khác (expired/failed)
  'RATE_LIMITED',
] as const
export type PaymentCancelErrorCode = (typeof PAYMENT_CANCEL_ERROR_CODES)[number]

// ── Admin: hàng chờ hoàn tiền ──────────────────────────────────────────────────

export const RefundReasonSchema = z.enum(['cancelled_by_user', 'account_deleted'])

export const AdminRefundRowSchema = z.object({
  id: z.string(),
  paymentId: z.string(),
  paymentCode: z.string(),
  provider: z.string(),
  providerTxnId: z.string(),
  amountVnd: z.number(),
  reason: RefundReasonSchema,
  gateway: z.string().nullable(),
  referenceCode: z.string().nullable(),
  receivingAccount: z.string().nullable(),
  transactionDate: z.string().nullable(),
  receivedAt: z.string(),
  status: z.enum(['needed', 'refunded']),
  refundedAt: z.string().nullable(),
  refundedBy: z.string().nullable(),
  refundNote: z.string().nullable(),
})
export type AdminRefundRow = z.infer<typeof AdminRefundRowSchema>

export const AdminRefundListSchema = z.object({ refunds: z.array(AdminRefundRowSchema) })

/** Ghi chú khi đánh dấu đã hoàn — bắt buộc (vd mã giao dịch hoàn tiền) để kiểm toán có nội dung. */
export const REFUND_NOTE_MAX = 500
