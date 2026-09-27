// api/admin-payments.ts — Quản lý danh sách đơn thanh toán SePay & Khớp đơn thủ công cho Admin.
//
// GET  /api/admin-payments?status=pending|paid|expired|failed&q=...
// POST /api/admin-payments  body { action: 'manual-match', paymentId: string, email: string }

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
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
// Kiểu row dùng chung với frontend — đã chuyển sang core-contracts (PR-S4)
import type { AdminPaymentRow } from '@dhcb/core-contracts/adminViews'
export type { AdminPaymentRow } from '@dhcb/core-contracts/adminViews'

const ActionSchema = z.object({
  action: z.literal('manual-match'),
  paymentId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email(),
})

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
        p.paid_at as "paidAt"
      from public.payments p
      left join public.users u on u.id = p.user_id
      left join public.profiles pf on pf.id = p.user_id
      where 1=1
    `
    const params: (string | number)[] = []

    if (statusFilter && ['pending', 'paid', 'failed', 'expired'].includes(statusFilter)) {
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
      }>('select status, cycle, years from public.payments where id = $1 for update', [paymentId])
      const pay = rows[0]
      if (!pay) return { error: 'Không tìm thấy đơn thanh toán', status: 404 } as const
      if (pay.status === 'paid') {
        return { error: 'Đơn này đã được ghi nhận thanh toán từ trước', status: 400 } as const
      }
      const days =
        (CYCLE_DAYS[pay.cycle] ?? 30) * (pay.cycle === 'year' ? Math.max(1, pay.years ?? 1) : 1)
      // Đơn gói cũ vẫn được cấp VIP; cấp quyền và ghi nhận thanh toán cùng commit/rollback.
      await grantPlanDays(targetUserId, 'vip', days, new Date(), client)
      await client.query(
        `update public.payments
         set status = 'paid', paid_at = now(), provider_txn_id = $1
         where id = $2`,
        [`MANUAL_${paymentId}`, paymentId],
      )
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
