// api/admin-vip-whitelist.ts — Cho ADMIN quản lý danh sách email được cấp VIP vĩnh viễn
// (người quen biết, có công lớn...). Khác api/admin-grant-plan.ts (cấp tay 1 lần, có thể có
// hạn) — đây là danh sách SỐNG: có mặt trong bảng vip_whitelist thì user đó (đang có tài khoản
// hoặc đăng ký sau này, xem ensureProfileRow trong _lib/authService.ts) tự động là VIP vĩnh
// viễn; xoá khỏi danh sách thì hạ về free ngay.
//
// GET    /api/admin-vip-whitelist                (danh sách hiện tại)
// POST   /api/admin-vip-whitelist  body: { email, note? }   (thêm/cập nhật ghi chú)
// DELETE /api/admin-vip-whitelist  body: { email }           (gỡ khỏi danh sách, hạ về free)

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
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const AddSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  note: z.string().trim().max(500).optional(),
})

const RemoveSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 20, 'admin-vip-whitelist'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-vip-whitelist' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-vip-whitelist' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const pool = getPgPool()

  if (req.method === 'GET') {
    const { rows } = await pool.query<{ email: string; note: string | null; created_at: Date }>(
      'select email, note, created_at from public.vip_whitelist order by created_at desc',
    )
    return jsonResponse(
      {
        items: rows.map((r) => ({
          email: r.email,
          note: r.note,
          createdAt: r.created_at.toISOString(),
        })),
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
    const parsed = validateBody(AddSchema, bodyResult.raw)
    if (!parsed.ok) {
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    }
    const { email, note } = parsed.data

    await pool.query(
      `insert into public.vip_whitelist (email, note) values ($1, $2)
       on conflict (email) do update set note = excluded.note`,
      [email, note ?? null],
    )
    // User đã có tài khoản sẵn → cấp VIP vĩnh viễn ngay. Chưa có tài khoản thì sẽ tự cấp lúc
    // đăng ký (xem ensureProfileRow).
    await pool.query(
      `update public.profiles set plan = 'vip', plan_expires_at = null
       where id = (select id from public.users where lower(email) = $1)`,
      [email],
    )

    logSecurityEvent('ADMIN_VIP_WHITELIST_ADD', clientIp, { email })
    return jsonResponse({ email, note: note ?? null }, 200, allHeaders)
  }

  if (req.method === 'DELETE') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok) {
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    }
    const parsed = validateBody(RemoveSchema, bodyResult.raw)
    if (!parsed.ok) {
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    }
    const { email } = parsed.data

    await pool.query('delete from public.vip_whitelist where email = $1', [email])
    // Hạ về free ngay — chỉ áp dụng cho user đang là vip do whitelist cấp (không đụng user đã
    // mua VIP thật qua thanh toán, việc đó dùng plan_expires_at riêng của giao dịch mua).
    // Whitelist cấp vĩnh viễn (plan_expires_at = null) nên không phân biệt được nguồn gốc VIP
    // vĩnh viễn khác — admin cần biết: gỡ khỏi danh sách này sẽ hạ MỌI VIP vĩnh viễn về free.
    await pool.query(
      `update public.profiles set plan = 'free', plan_expires_at = null
       where id = (select id from public.users where lower(email) = $1)
         and plan = 'vip' and plan_expires_at is null`,
      [email],
    )

    logSecurityEvent('ADMIN_VIP_WHITELIST_REMOVE', clientIp, { email })
    return jsonResponse({ email, removed: true }, 200, allHeaders)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}

export const config = { runtime: 'edge' }
