// api/admin-feedback.ts — Quản trị ý kiến đóng góp người dùng và phản hồi chất lượng gia sư AI.
//
// GET   /api/admin-feedback?type=user|tutor&category=...&status=...
// PATCH /api/admin-feedback body: { id, status, adminNotes? }

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
import { FeedbackStatusSchema, type UserFeedbackRecord } from '@dhcb/core-contracts/feedback'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
// Kiểu row dùng chung với frontend — đã chuyển sang core-contracts (PR-S4)
import type { TutorFeedbackRow } from '@dhcb/core-contracts/adminViews'
export type { TutorFeedbackRow } from '@dhcb/core-contracts/adminViews'

const PatchSchema = z.object({
  id: z.string().uuid(),
  status: FeedbackStatusSchema.optional(),
  adminNotes: z.string().max(5000).optional(),
})

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'admin-feedback'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-feedback' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-feedback' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const pool = getPgPool()

  if (req.method === 'GET') {
    const url = new URL(req.url)
    const feedbackType = url.searchParams.get('type')?.trim() ?? 'user'

    if (feedbackType === 'tutor') {
      const sourceFilter = url.searchParams.get('source')?.trim()
      let sql = `
        select
          tf.id,
          tf.user_id as "userId",
          u.email as "userEmail",
          tf.source,
          tf.user_input as "userInput",
          tf.ai_feedback as "aiFeedback",
          tf.created_at as "createdAt"
        from english.tutor_feedback tf
        left join public.users u on u.id = tf.user_id
        where 1=1
      `
      const params: string[] = []
      if (sourceFilter && ['chat', 'speaking'].includes(sourceFilter)) {
        params.push(sourceFilter)
        sql += ` and tf.source = $1`
      }
      sql += ` order by tf.created_at desc limit 100`
      const { rows } = await pool.query<TutorFeedbackRow>(sql, params)
      return jsonResponse({ feedbackList: rows, type: 'tutor' }, 200, allHeaders)
    }

    // Default: General User Feedback
    const categoryFilter = url.searchParams.get('category')?.trim()
    const statusFilter = url.searchParams.get('status')?.trim()

    let sql = `
      select
        uf.id,
        uf.user_id as "userId",
        coalesce(u.email, uf.contact_email) as "userEmail",
        uf.category,
        uf.rating,
        uf.title,
        uf.message,
        uf.contact_email as "contactEmail",
        uf.context_info as "contextInfo",
        uf.status,
        uf.admin_notes as "adminNotes",
        uf.created_at as "createdAt",
        uf.updated_at as "updatedAt"
      from public.user_feedback uf
      left join public.users u on u.id = uf.user_id
      where 1=1
    `
    const params: unknown[] = []
    let paramIdx = 1

    if (categoryFilter) {
      sql += ` and uf.category = $${paramIdx++}`
      params.push(categoryFilter)
    }
    if (statusFilter) {
      sql += ` and uf.status = $${paramIdx++}`
      params.push(statusFilter)
    }

    sql += ` order by uf.created_at desc limit 100`

    const { rows } = await pool.query<UserFeedbackRecord>(sql, params)
    return jsonResponse({ feedbackList: rows, type: 'user' }, 200, allHeaders)
  }

  if (req.method === 'PATCH') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok) {
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    }
    const parsed = validateBody(PatchSchema, bodyResult.raw)
    if (!parsed.ok) {
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    }

    const { id, status, adminNotes } = parsed.data

    const { rows } = await pool.query<{ id: string }>(
      `update public.user_feedback set
         status = coalesce($2, status),
         admin_notes = coalesce($3, admin_notes),
         updated_at = now()
       where id = $1
       returning id`,
      [id, status ?? null, adminNotes ?? null],
    )

    if (rows.length === 0) {
      return jsonResponse({ error: 'Feedback không tồn tại' }, 404, allHeaders)
    }

    return jsonResponse({ ok: true, id }, 200, allHeaders)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}

export const config = { runtime: 'edge' }
