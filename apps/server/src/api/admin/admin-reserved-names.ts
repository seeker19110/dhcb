// api/admin-reserved-names.ts — Quản lý danh sách từ cấm / tên giả danh cho Admin.
//
// GET  /api/admin-reserved-names
// POST /api/admin-reserved-names  body { action: 'add', phrase: string }
//                                  body { action: 'remove', id: string }

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
// Kiểu row dùng chung với frontend — đã chuyển sang core-contracts (PR-S4)
import type { ReservedNameRow } from '@dhcb/core-contracts/adminViews'
export type { ReservedNameRow } from '@dhcb/core-contracts/adminViews'

const AddSchema = z.object({
  action: z.literal('add'),
  phrase: z.string().trim().min(2).max(100),
})

const RemoveSchema = z.object({
  action: z.literal('remove'),
  id: z.string().uuid(),
})

const ActionSchema = z.discriminatedUnion('action', [AddSchema, RemoveSchema])

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'admin-reserved-names'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-reserved-names' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-reserved-names' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const pool = getPgPool()

  if (req.method === 'GET') {
    const { rows } = await pool.query<ReservedNameRow>(
      `select id, phrase, created_at as "createdAt"
       from public.reserved_names
       order by phrase asc`,
    )
    return jsonResponse({ reservedNames: rows }, 200, allHeaders)
  }

  if (req.method === 'POST') {
    const parsed = await readJsonBody(req)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    const val = validateBody(ActionSchema, parsed.raw)
    if (!val.ok) return jsonResponse({ error: val.error.message }, val.error.status, allHeaders)

    const d = val.data

    if (d.action === 'add') {
      const clean = d.phrase.toLowerCase().trim()
      await pool.query(
        `insert into public.reserved_names (phrase)
         values ($1)
         on conflict (phrase) do nothing`,
        [clean],
      )
      return jsonResponse({ ok: true, message: `Đã thêm cụm từ cấm "${clean}"` }, 200, allHeaders)
    }

    if (d.action === 'remove') {
      await pool.query(`delete from public.reserved_names where id = $1`, [d.id])
      return jsonResponse({ ok: true, message: 'Đã xóa cụm từ cấm' }, 200, allHeaders)
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}
