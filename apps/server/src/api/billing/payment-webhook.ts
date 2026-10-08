// api/payment-webhook.ts — SePay gọi endpoint này khi có tiền vào tài khoản ngân hàng. KHÔNG
// có Bearer token của app (SePay không đăng nhập) — xác thực bằng header
// `Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>` (xem api/_lib/sepay.ts verifySepayApiKey).
//
// Đọc kỹ trước khi sửa: docs/research/dac-ta-thanh-toan-2026-07-25.md mục "API cần thêm" +
// "Ca lệch" + "Bảo mật". SePay retry tới 7 lần trong 5 giờ cho CÙNG một giao dịch nếu response
// không phải {"success":true} — mọi nhánh xử lý xong đều PHẢI trả success:true, kể cả khi
// không khớp được đơn nào (khớp thất bại là lỗi phía người dùng/dữ liệu, không phải lỗi ta cần
// SePay lặp lại).

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import { logSecurityEvent } from '@dhcb/core-auth/security'
import { extractPaymentCode, verifySepayApiKey } from '@dhcb/core-billing/sepay'
import { grantPlanDays } from '@dhcb/core-billing/planGrant'
import { CYCLE_DAYS, type PayableCycle, type PayablePlan } from '@dhcb/core-billing/prices'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse } from '@dhcb/core-http/http'

const WebhookSchema = z.object({
  id: z.union([z.string(), z.number()]),
  transferType: z.string().optional(),
  transferAmount: z.number(),
  code: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
})

function ok(headers: Record<string, string>) {
  return jsonResponse({ success: true }, 200, headers)
}

export default async function handler(req: Request): Promise<Response> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, headers)

  const expectedKey = process.env.SEPAY_WEBHOOK_API_KEY
  if (!expectedKey || !verifySepayApiKey(req.headers.get('authorization'), expectedKey)) {
    logSecurityEvent('SEPAY_WEBHOOK_UNAUTHORIZED', 'sepay', {})
    return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  }

  const bodyResult = await readJsonBody(req)
  if (!bodyResult.ok) return ok(headers) // body hỏng không phải ca ta xử lý được — không lặp lại
  const parsed = validateBody(WebhookSchema, bodyResult.raw)
  if (!parsed.ok) {
    logSecurityEvent('SEPAY_WEBHOOK_BAD_PAYLOAD', 'sepay', { raw: bodyResult.raw })
    return ok(headers)
  }
  const { id, transferType, transferAmount, code, content } = parsed.data
  const txnId = String(id)

  // Tiền RA khỏi tài khoản không liên quan tới thanh toán gói.
  if (transferType && transferType !== 'in') return ok(headers)

  const paymentCode = extractPaymentCode(code) ?? extractPaymentCode(content)
  if (!paymentCode) {
    logSecurityEvent('SEPAY_WEBHOOK_UNMATCHED', 'sepay', { txnId, transferAmount })
    return ok(headers)
  }

  const pool = getPgPool()
  const { rows } = await pool.query<{
    id: string
    user_id: string | null
    plan: PayablePlan
    cycle: PayableCycle
    amount_vnd: number
    status: string
    years: number
    expires_at: Date | null
  }>(
    'select id, user_id, plan, cycle, amount_vnd, status, years, expires_at from public.payments where payment_code = $1',
    [paymentCode],
  )
  const payment = rows[0]
  if (!payment) {
    logSecurityEvent('SEPAY_WEBHOOK_UNMATCHED', 'sepay', { txnId, paymentCode, transferAmount })
    return ok(headers)
  }
  if (payment.status === 'paid') return ok(headers) // đã xử lý — idempotent, không log lỗi

  // Đơn của tài khoản ĐÃ XOÁ (ẩn danh hoá — migration 0088, changelog 0533): không còn ai để cấp
  // gói. Ghi log để admin đối chiếu tay/hoàn tiền theo quy trình ngoài hệ thống, không cấp gì.
  if (payment.user_id === null) {
    logSecurityEvent('SEPAY_PAYMENT_ORPHANED', 'sepay', {
      paymentId: payment.id,
      txnId,
      transferAmount,
    })
    return ok(headers)
  }

  // Đơn quá hạn: UI hết hạn sau 30 phút nhưng trước đây server không kiểm — người dùng có thể
  // chuyển khoản NHIỀU THÁNG sau và vẫn được cấp gói với giá đã chốt lúc khuyến mãi (audit
  // 2026-08-24). Cho ân hạn 24h (chuyển khoản liên ngân hàng có thể chậm); quá nữa thì giữ
  // 'pending' để admin đối chiếu tay, KHÔNG tự cấp gói.
  const LATE_GRACE_MS = 24 * 60 * 60 * 1000
  if (payment.expires_at && Date.now() > new Date(payment.expires_at).getTime() + LATE_GRACE_MS) {
    logSecurityEvent('SEPAY_PAYMENT_LATE', 'sepay', {
      paymentId: payment.id,
      txnId,
      expiresAt: new Date(payment.expires_at).toISOString(),
      transferAmount,
    })
    return ok(headers)
  }

  if (transferAmount < payment.amount_vnd) {
    // Chuyển thiếu: KHÔNG cấp gói, giữ 'pending' để admin đối chiếu tay + người dùng có thể
    // chuyển bù. Không đánh dấu provider_txn_id — nếu người dùng chuyển đúng tiếp theo, đơn
    // này vẫn khớp được (xem mục "Ca lệch" trong đặc tả).
    logSecurityEvent('SEPAY_PAYMENT_INSUFFICIENT', 'sepay', {
      paymentId: payment.id,
      txnId,
      expected: payment.amount_vnd,
      got: transferAmount,
    })
    return ok(headers)
  }

  try {
    // Hai thao tác dưới đây (đánh dấu payment đã trả, cấp gói) phải cùng
    // thành công hoặc cùng thất bại — nếu grantPlanDays() lỗi SAU KHI đã set status='paid' mà
    // không có transaction, user mất tiền nhưng không được cấp gói, và lần webhook retry sau đó
    // (SePay lặp lại tới 7 lần) sẽ bị chặn ngay ở nhánh `status === 'paid'` phía trên nên KHÔNG
    // tự phục hồi được (phát hiện khi trace luồng payment cho V2-00, xem
    // docs/architecture-v2/V2-00-CRITICAL-FLOWS.md risk register #1).
    const won = await withTransaction(pool, async (client) => {
      // WHERE status='pending' là chốt CHỐNG TRÙNG chính: 2 webhook song song cho cùng đơn chỉ
      // đúng 1 cái thấy rowCount=1 (Postgres tự khoá dòng khi UPDATE). UNIQUE trên
      // provider_txn_id là lớp chống trùng THỨ HAI cho ca hiếm hơn: cùng txnId khớp nhầm 2 đơn.
      const { rowCount, rows: updated } = await client.query<{
        user_id: string
        plan: PayablePlan
        cycle: PayableCycle
        years: number
      }>(
        `update public.payments set status = 'paid', paid_at = now(), provider_txn_id = $2
         where id = $1 and status = 'pending' and user_id is not null
         returning user_id, plan, cycle, years`,
        [payment.id, txnId],
      )
      const row = updated[0]
      if (!rowCount || !row) return null // race: request khác vừa xử lý xong

      // years > 1 CHỈ có ý nghĩa với cycle='year' (mua nhiều năm liền — xem api/checkout.ts).
      const grantDays = CYCLE_DAYS[row.cycle] * (row.cycle === 'year' ? Math.max(1, row.years) : 1)
      await grantPlanDays(row.user_id, row.plan, grantDays, new Date(), client)
      // Chuyển khoản chứng minh thanh toán, không chứng minh sở hữu hộp thư.
      return row
    })
    if (!won) return ok(headers) // race: request khác vừa xử lý xong

    logSecurityEvent('SEPAY_PAYMENT_PAID', 'sepay', {
      paymentId: payment.id,
      userId: won.user_id,
      plan: won.plan,
      cycle: won.cycle,
      txnId,
    })
  } catch (err) {
    if ((err as { code?: string }).code === '23505') return ok(headers) // txnId trùng — đã xử lý
    throw err
  }

  return ok(headers)
}

export const config = { runtime: 'edge' }
