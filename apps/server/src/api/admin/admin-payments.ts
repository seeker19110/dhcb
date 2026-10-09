// api/admin-payments.ts — Quản lý danh sách đơn thanh toán SePay & Khớp đơn thủ công cho Admin.
//
// GET  /api/admin-payments?status=pending|paid|expired|failed|cancelled&q=...
// GET  /api/admin-payments?view=refunds   → hàng chờ hoàn tiền thủ công (changelog 0546)
// POST /api/admin-payments  body { action: 'manual-match', paymentId: string, email: string }
// POST /api/admin-payments  body { action: 'mark-refunded', refundId: string, note: string }

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import {
  validateAuth,
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { isAdminUser } from '@dhcb/core-auth/adminAuth'
import { grantPlanDays } from '@dhcb/core-billing/planGrant'
import { listRefunds, markRefunded } from '@dhcb/core-billing/paymentRefunds'
import { REFUND_NOTE_MAX } from '@dhcb/core-contracts/paymentCancel'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
// Kiểu row dùng chung với frontend — đã chuyển sang core-contracts (PR-S4)
import type { AdminPaymentRow } from '@dhcb/core-contracts/adminViews'
export type { AdminPaymentRow } from '@dhcb/core-contracts/adminViews'

const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('manual-match'),
    paymentId: z.string().uuid(),
    email: z.string().trim().toLowerCase().email(),
  }),
  // Admin xác nhận ĐÃ hoàn tiền ngoài hệ thống. Ghi chú bắt buộc (vd mã giao dịch hoàn) — đây là
  // nội dung của bản ghi kiểm toán, không được để trống.
  z.object({
    action: z.literal('mark-refunded'),
    refundId: z.string().uuid(),
    note: z.string().trim().min(1).max(REFUND_NOTE_MAX),
  }),
])

const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'expired', 'cancelled'] as const

const CYCLE_DAYS: Record<string, number> = {
  '10day': 10,
  month: 30,
  year: 365,
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'admin-payments'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-payments' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-payments' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const pool = getPgPool()

  if (req.method === 'GET') {
    const url = new URL(req.url)
    if (url.searchParams.get('view') === 'refunds') {
      return jsonResponse({ refunds: await listRefunds(pool) }, 200, allHeaders)
    }
    const statusFilter = url.searchParams.get('status')?.trim()
    const queryStr = url.searchParams.get('q')?.trim().toLowerCase()

    let sql = `
      select
        p.id,
        p.user_id as "userId",
        u.email as "userEmail",
        pf.name as "userName",
        p.plan,
        p.cycle,
        p.amount_vnd as "amountVnd",
        p.provider,
        p.payment_code as "paymentCode",
        p.provider_txn_id as "providerTxnId",
        p.status,
        p.created_at as "createdAt",
        p.expires_at as "expiresAt",
        p.paid_at as "paidAt",
        p.cancelled_at as "cancelledAt"
      from public.payments p
      left join public.users u on u.id = p.user_id
      left join public.profiles pf on pf.id = p.user_id
      where 1=1
    `
    const params: (string | number)[] = []

    if (statusFilter && (PAYMENT_STATUSES as readonly string[]).includes(statusFilter)) {
      params.push(statusFilter)
      sql += ` and p.status = $${params.length}`
    }

    if (queryStr) {
      params.push(`%${queryStr}%`)
      sql += ` and (lower(p.payment_code) like $${params.length} or lower(coalesce(u.email, '')) like $${params.length})`
    }

    sql += ` order by p.created_at desc limit 100`

    const { rows } = await pool.query<AdminPaymentRow>(sql, params)
    return jsonResponse({ payments: rows }, 200, allHeaders)
  }

  if (req.method === 'POST') {
    const parsed = await readJsonBody(req)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    const val = validateBody(ActionSchema, parsed.raw)
    if (!val.ok) return jsonResponse({ error: val.error.message }, val.error.status, allHeaders)

    if (val.data.action === 'mark-refunded') {
      const { refundId, note } = val.data
      const outcome = await markRefunded(pool, refundId, auth.userId, note)
      if (outcome.kind === 'not_found') {
        return jsonResponse({ error: 'Không tìm thấy khoản cần hoàn' }, 404, allHeaders)
      }
      if (outcome.kind === 'marked') {
        // Dấu vết thứ hai ngoài dòng CSDL (đã có ai/khi nào/ghi chú). Chỉ id kỹ thuật.
        logSecurityEvent('PAYMENT_REFUND_MARKED', clientIp, { refundId, admin: auth.userId })
      }
      return jsonResponse(
        {
          ok: true,
          alreadyRefunded: outcome.kind === 'already_refunded',
          refundedAt: outcome.refundedAt,
          message:
            outcome.kind === 'marked'
              ? 'Đã ghi nhận hoàn tiền'
              : 'Khoản này đã được đánh dấu hoàn tiền từ trước — giữ nguyên bản ghi cũ',
        },
        200,
        allHeaders,
      )
    }

    const { paymentId, email } = val.data

    // Tìm user ID từ email
    const { rows: uRows } = await pool.query<{ id: string }>(
      'select id from public.users where lower(email) = $1',
      [email.toLowerCase()],
    )
    const targetUserId = uRows[0]?.id
    if (!targetUserId) {
      return jsonResponse(
        { error: `Không tìm thấy người dùng với email: ${email}` },
        404,
        allHeaders,
      )
    }

    const outcome = await withTransaction(pool, async (client) => {
      // Khóa tới khi cấp quyền xong; cả admin khác và webhook phải đợi cùng dòng đơn.
      const { rows } = await client.query<{
        status: string
        cycle: '10day' | 'month' | 'year'
        years: number
        user_id: string | null
        anonymized_at: Date | null
      }>(
        'select status, cycle, years, user_id, anonymized_at from public.payments where id = $1 for update',
        [paymentId],
      )
      const pay = rows[0]
      if (!pay) return { error: 'Không tìm thấy đơn thanh toán', status: 404 } as const
      if (pay.status === 'paid') {
        return { error: 'Đơn này đã được ghi nhận thanh toán từ trước', status: 400 } as const
      }
      // Người dùng đã tự huỷ ("tôi chưa chuyển khoản" — changelog 0546): họ đã từ chối mua. Tiền về
      // sau đó nằm ở hàng chờ hoàn tiền; khớp tay ở đây sẽ vừa cấp gói vừa có thể bị hoàn ⇒ chặn.
      if (pay.status === 'cancelled') {
        return {
          error:
            'Người dùng đã tự huỷ đơn này — không khớp tay được. Nếu có tiền chuyển vào, xử lý ở mục "Cần hoàn tiền".',
          status: 400,
        } as const
      }
      // Đơn của tài khoản ĐÃ XOÁ (ẩn danh hoá — changelog 0533): là chứng từ lưu trữ, không phải
      // đơn chờ khớp. Khớp tay đơn này sẽ cấp VIP cho một người KHÁC chủ đơn — chặn hẳn.
      if (pay.user_id === null || pay.anonymized_at !== null) {
        return {
          error:
            'Đơn này thuộc tài khoản đã bị xoá (đã ẩn danh) — không khớp tay được. Nếu có tiền chuyển vào, xử lý ở mục "Cần hoàn tiền".',
          status: 400,
        } as const
      }
      const days =
        (CYCLE_DAYS[pay.cycle] ?? 30) * (pay.cycle === 'year' ? Math.max(1, pay.years ?? 1) : 1)
      // Ghi nhận đơn TRƯỚC, cấp gói SAU (cùng transaction): điều kiện trong WHERE là lớp phòng thủ
      // thứ hai — đơn đã ẩn danh/đã paid thì rowCount=0 và KHÔNG cấp gì.
      const updated = await client.query(
        `update public.payments
         set status = 'paid', paid_at = now(), provider_txn_id = $1
         where id = $2 and status not in ('paid', 'cancelled') and user_id is not null
           and anonymized_at is null`,
        [`MANUAL_${paymentId}`, paymentId],
      )
      if (updated.rowCount !== 1) {
        return {
          error: 'Đơn đã đổi trạng thái — tải lại danh sách rồi thử lại',
          status: 409,
        } as const
      }
      // Đơn gói cũ vẫn được cấp VIP; cấp quyền và ghi nhận thanh toán cùng commit/rollback.
      await grantPlanDays(targetUserId, 'vip', days, new Date(), client)
      return { days } as const
    })
    if ('error' in outcome) {
      return jsonResponse({ error: outcome.error }, outcome.status, allHeaders)
    }
    const { days } = outcome

    return jsonResponse(
      {
        ok: true,
        message: `Đã khớp đơn thủ công và cấp gói VIP (${days} ngày) cho ${email}`,
      },
      200,
      allHeaders,
    )
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}
