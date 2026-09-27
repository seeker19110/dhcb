// api/admin-users.ts — Tab "Người dùng" trong /admin-s: liệt kê user thật để admin theo dõi
// (tìm theo email, xem gói/trạng thái xác thực/lần hoạt động gần nhất), không phải báo cáo
// tổng hợp (khác api/admin-usage-stats.ts — file đó GROUP BY toàn bảng, không lộ danh sách).
//
// GET /api/admin-users?search=&limit=&offset=   (cần đăng nhập — cookie, ID trong ADMIN_USER_IDS)
//   search: lọc theo email chứa chuỗi (không phân biệt hoa/thường), rỗng = tất cả.
//   limit: 1-100 (mặc định 20). offset: phân trang.

import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  validateAuth,
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { isAdminUser } from '@dhcb/core-auth/adminAuth'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// Phải khớp EFFECTIVE_PLAN_SQL ở api/admin-usage-stats.ts (nguồn chân lý logic resolvePlan()).
const EFFECTIVE_PLAN_SQL = `case
  when p.plan in ('plus', 'pro', 'vip') and (p.plan_expires_at is null or p.plan_expires_at > now())
    then 'vip'
  else 'free'
end`

interface UserRow {
  id: string
  email: string
  created_at: string
  email_verified: string | null
  plan: 'free' | 'vip'
  plan_expires_at: string | null
  last_active_day: string | null
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'admin-users'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-users' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-users' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const url = new URL(req.url)
  const search = (url.searchParams.get('search') ?? '').trim().toLowerCase()
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number(url.searchParams.get('limit')) || DEFAULT_LIMIT),
  )
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0)

  const pool = getPgPool()
  const searchPattern = `%${search}%`

  const { rows: countRows } = await pool.query<{ count: string }>(
    `select count(*)::text as count from public.users u where u.email ilike $1`,
    [searchPattern],
  )
  const total = Number(countRows[0]?.count ?? 0)

  const { rows } = await pool.query<UserRow>(
    `select u.id, u.email, u.created_at, u.email_verified,
            ${EFFECTIVE_PLAN_SQL} as plan, p.plan_expires_at,
            (select max(day) from public.daily_usage d where d.user_id = u.id) as last_active_day
     from public.users u
     left join public.profiles p on p.id = u.id
     where u.email ilike $1
     order by u.created_at desc
     limit $2 offset $3`,
    [searchPattern, limit, offset],
  )

  return jsonResponse(
    {
      total,
      users: rows.map((r) => ({
        id: r.id,
        email: r.email,
        createdAt: new Date(r.created_at).toISOString(),
        emailVerified: r.email_verified != null,
        plan: r.plan,
        planExpiresAt: r.plan_expires_at ? new Date(r.plan_expires_at).toISOString() : null,
        lastActiveDay: r.last_active_day,
      })),
    },
    200,
    allHeaders,
  )
}

export const config = { runtime: 'edge' }
