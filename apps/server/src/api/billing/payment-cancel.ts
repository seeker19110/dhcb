// api/billing/payment-cancel.ts — Người dùng tự huỷ đơn SePay đang chờ: "tôi CHƯA chuyển khoản".
// Đặc tả: docs/specs/2026-10-09-huy-don-cho-de-xoa-tai-khoan.md (changelog 0546).
//
// POST /api/payment-cancel { paymentId, confirmNotTransferred: true }
//   200 { ok, alreadyCancelled, cancelledAt } · 404 NOT_FOUND · 409 ALREADY_PAID | NOT_CANCELLABLE
//   429 RATE_LIMITED
//
// Dùng ĐỘC LẬP được (không gắn với xoá tài khoản) — mọi đơn `pending` của chính người dùng. Giao
// diện hiện nút ở khối "Xoá tài khoản" khi bị chặn; đơn huỷ xong không còn chặn xoá.
//
// Kiểm quyền: `userId` CHỈ lấy từ phiên; câu UPDATE lọc `user_id = <phiên>` ⇒ đơn người khác trả
// 404 giống hệt đơn không tồn tại (không lộ mã đơn của ai). POST qua `isTrustedMutation` ở wrapEdge.
// Không đòi xác minh lại: huỷ đơn CHƯA trả không làm mất gì của người dùng; nếu tiền vẫn về, nó vào
// hàng chờ hoàn tiền (không mất tiền) — xem mục Rủi ro của đặc tả.

import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { cancelPendingPayment } from '@dhcb/core-billing/paymentCancel'
import {
  PaymentCancelBodySchema,
  type PaymentCancelErrorCode,
  type PaymentCancelResult,
} from '@dhcb/core-contracts/paymentCancel'
import { accountSubjectHash } from '@dhcb/core-personal/accountErasureShared'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

/** Theo IP — chặn quét mã đơn hàng loạt. */
export const PAYMENT_CANCEL_IP_LIMIT_PER_MIN = 10
/** Theo người dùng — một người không cần huỷ quá vài đơn mỗi phút. */
export const PAYMENT_CANCEL_USER_LIMIT_PER_MIN = 5

function fail(
  error: string,
  code: PaymentCancelErrorCode,
  status: number,
  headers: Record<string, string>,
): Response {
  return jsonResponse({ error, code }, status, headers)
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS, 'Cache-Control': 'no-store' }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, PAYMENT_CANCEL_IP_LIMIT_PER_MIN, 'payment-cancel'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/payment-cancel' })
    return fail('Quá nhiều yêu cầu — thử lại sau 1 phút', 'RATE_LIMITED', 429, {
      ...allHeaders,
      'Retry-After': '60',
    })
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)
  const userId = auth.userId
  // Log không ghi userId trần — cùng mã băm với /api/account (changelog 0533).
  const subject = accountSubjectHash(userId)

  if (
    !(await checkRateLimit(
      `user:${userId}`,
      PAYMENT_CANCEL_USER_LIMIT_PER_MIN,
      'payment-cancel-user',
    ))
  ) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/payment-cancel', subject })
    return fail('Quá nhiều yêu cầu — thử lại sau 1 phút', 'RATE_LIMITED', 429, {
      ...allHeaders,
      'Retry-After': '60',
    })
  }

  const parsedBody = await readJsonBody(req)
  if (!parsedBody.ok)
    return jsonResponse({ error: parsedBody.error.message }, parsedBody.error.status, allHeaders)
  const parsed = validateBody(PaymentCancelBodySchema, parsedBody.raw)
  if (!parsed.ok)
    return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)

  // Lỗi CSDL ⇒ ném ⇒ wrapEdge trả 500 + Sentry (không nuốt).
  const outcome = await cancelPendingPayment(getPgPool(), userId, parsed.data.paymentId)
  switch (outcome.kind) {
    case 'cancelled':
    case 'already_cancelled': {
      if (outcome.kind === 'cancelled') {
        logSecurityEvent('PAYMENT_CANCELLED_BY_USER', clientIp, {
          subject,
          paymentId: parsed.data.paymentId,
        })
      }
      const body: PaymentCancelResult = {
        ok: true,
        alreadyCancelled: outcome.kind === 'already_cancelled',
        cancelledAt: outcome.cancelledAt,
      }
      return jsonResponse(body, 200, allHeaders)
    }
    case 'already_paid':
      return fail(
        'Đơn này đã được thanh toán và gói đã được cấp — không huỷ được.',
        'ALREADY_PAID',
        409,
        allHeaders,
      )
    case 'not_cancellable':
      return fail(
        'Đơn này đã kết thúc (hết hạn hoặc đã đóng) — không cần huỷ nữa.',
        'NOT_CANCELLABLE',
        409,
        allHeaders,
      )
    case 'not_found':
      return fail('Không tìm thấy đơn thanh toán.', 'NOT_FOUND', 404, allHeaders)
  }
}

export const config = { runtime: 'edge' }
