// src/lib/paymentCancelApi.ts — Gọi POST /api/payment-cancel: người dùng tự huỷ đơn chờ "tôi CHƯA
// chuyển khoản" (changelog 0546). Nghiệp vụ ở server (apps/server/src/api/billing/payment-cancel.ts);
// file này chỉ gọi mạng + kiểm hình dạng phản hồi bằng Zod (dữ liệu ngoài — CLAUDE.md mục 4.1).

import { z } from 'zod'
import {
  PAYMENT_CANCEL_ERROR_CODES,
  PaymentCancelResultSchema,
  type PaymentCancelErrorCode,
  type PaymentCancelResult,
} from '@dhcb/core-contracts/paymentCancel'

const ErrorSchema = z.object({
  error: z.string(),
  code: z.enum(PAYMENT_CANCEL_ERROR_CODES).optional(),
})

export class PaymentCancelError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: PaymentCancelErrorCode,
  ) {
    super(message)
    this.name = 'PaymentCancelError'
  }
}

export async function cancelPendingPayment(paymentId: string): Promise<PaymentCancelResult> {
  let res: Response
  try {
    res = await fetch('/api/payment-cancel', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ paymentId, confirmNotTransferred: true }),
    })
  } catch {
    throw new PaymentCancelError('Lỗi kết nối — kiểm tra mạng rồi thử lại.', 0)
  }
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    const parsed = ErrorSchema.safeParse(body)
    throw parsed.success
      ? new PaymentCancelError(parsed.data.error, res.status, parsed.data.code)
      : new PaymentCancelError(`Lỗi ${res.status} — thử lại sau.`, res.status)
  }
  const parsed = PaymentCancelResultSchema.safeParse(await res.json().catch(() => null))
  if (!parsed.success) throw new PaymentCancelError('Phản hồi không hợp lệ — thử lại sau.', 0)
  return parsed.data
}
