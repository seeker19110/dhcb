// api/admin-grant-plan.ts — Cho ADMIN cấp/gia hạn gói VIP THỦ CÔNG cho 1 user theo email.
// Đây là "cổng thanh toán tay" tạm thời trong lúc CHƯA nối cổng thanh toán thật (PayOS/Casso...):
// người dùng chuyển khoản, admin xác nhận rồi gọi endpoint này cấp N ngày VIP. Xem
// packages/core-billing/plan.ts (resolvePlan) — VIP tự hết hiệu lực đúng lúc dựa vào plan_expires_at,
// không cần thao tác gì thêm khi hết hạn.
//
// GET  /api/admin-grant-plan?email=...        (tra cứu gói hiện tại của 1 user)
// POST /api/admin-grant-plan  body: { email, plan: 'free'|'vip', days: number|null }
//      days = null → không giới hạn thời gian (vd VIP cấp vĩnh viễn); days > 0 → hết hạn sau N ngày.

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  validateAuth,
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { isAdminUser } from '@dhcb/core-auth/adminAuth'
import { resolvePlan } from '@dhcb/core-billing/plan'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const GrantSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  plan: z.enum(['free', 'vip']),
  days: z.number().int().min(1).max(3650).nullable(),
})

async function findUserIdByEmail(email: string): Promise<string | null> {
  const pool = getPgPool()
  const { rows } = await pool.query<{ id: string }>(
    'select id from public.users where email = $1',
    [email.toLowerCase().trim()],
  )
  return rows[0]?.id ?? null
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 20, 'admin-grant-plan'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-grant-plan' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-grant-plan' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const pool = getPgPool()

  if (req.method === 'GET') {
    const email = new URL(req.url).searchParams.get('email')
    if (!email) return jsonResponse({ error: 'Thiếu tham số email' }, 400, allHeaders)
    const userId = await findUserIdByEmail(email)
    if (!userId)
      return jsonResponse({ error: 'Không tìm thấy user với email này' }, 404, allHeaders)
    const { rows } = await pool.query<{ plan: string; plan_expires_at: Date | null }>(
      'select plan, plan_expires_at from public.profiles where id = $1',
      [userId],
    )
    const row = rows[0]
    return jsonResponse(
      {
        email,
        plan: resolvePlan(row?.plan, row?.plan_expires_at),
        planExpiresAt: row?.plan_expires_at ? new Date(row.plan_expires_at).toISOString() : null,
      },
      200,
      allHeaders,
    )
  }

  if (req.method === 'POST') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok) {
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    }
    const parsed = validateBody(GrantSchema, bodyResult.raw)
    if (!parsed.ok) {
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    }
    const { email, plan, days } = parsed.data

    const userId = await findUserIdByEmail(email)
    if (!userId)
      return jsonResponse({ error: 'Không tìm thấy user với email này' }, 404, allHeaders)

    // plan='free' hoặc days=null → không giới hạn thời gian (free: mãi mãi free; vip: vĩnh viễn)
    const planExpiresAt = plan !== 'free' && days ? new Date(Date.now() + days * 86_400_000) : null

    await pool.query(
      `insert into public.profiles (id, plan, plan_expires_at)
       values ($1, $2, $3)
       on conflict (id) do update set plan = excluded.plan, plan_expires_at = excluded.plan_expires_at`,
      [userId, plan, planExpiresAt],
    )

    logSecurityEvent('ADMIN_GRANT_PLAN', clientIp, { email, plan, days })

    return jsonResponse(
      { email, plan, planExpiresAt: planExpiresAt?.toISOString() ?? null },
      200,
      allHeaders,
    )
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}

export const config = { runtime: 'edge' }
