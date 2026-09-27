// api/admin-plan-marketing.ts — Cho ADMIN quản lý nội dung mô tả gói (badge/tagline + gạch đầu
// dòng tính năng/lợi ích) hiển thị ở trang Nâng cấp. Khác api/admin-plan-features.ts (bật/tắt
// TRUY CẬP tính năng theo gói) — đây thuần là NỘI DUNG QUẢNG CÁO, không ảnh hưởng quyền dùng.
//
// GET    /api/admin-plan-marketing                                          (toàn bộ nội dung)
// PUT    /api/admin-plan-marketing  body: { plan, badge?, taglineVi?, taglineEn? } (sửa badge/tagline)
// POST   /api/admin-plan-marketing  body: { plan, textVi, textEn, sortOrder? }     (thêm 1 hàng)
// PATCH  /api/admin-plan-marketing  body: { id, textVi?, textEn?, sortOrder? }     (sửa 1 hàng)
// DELETE /api/admin-plan-marketing  body: { id }                                  (xoá 1 hàng)

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
import { getPlanMarketing, invalidatePlanMarketingCache } from '@dhcb/core-billing/planMarketing'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const PlanEnum = z.enum(['free', 'vip'])

const UpdateInfoSchema = z.object({
  plan: PlanEnum,
  badge: z.string().trim().max(10).optional(),
  taglineVi: z.string().trim().max(200).optional(),
  taglineEn: z.string().trim().max(200).optional(),
})

const CreateBulletSchema = z.object({
  plan: PlanEnum,
  textVi: z.string().trim().min(1).max(500),
  textEn: z.string().trim().min(1).max(500),
  sortOrder: z.number().int().optional(),
})

const UpdateBulletSchema = z.object({
  id: z.number().int(),
  textVi: z.string().trim().min(1).max(500).optional(),
  textEn: z.string().trim().min(1).max(500).optional(),
  sortOrder: z.number().int().optional(),
})

const DeleteBulletSchema = z.object({
  id: z.number().int(),
})

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'admin-plan-marketing'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-plan-marketing' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-plan-marketing' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const pool = getPgPool()

  if (req.method === 'GET') {
    return jsonResponse(await getPlanMarketing(), 200, allHeaders)
  }

  if (req.method === 'PUT') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok)
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    const parsed = validateBody(UpdateInfoSchema, bodyResult.raw)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    const { plan, badge, taglineVi, taglineEn } = parsed.data

    await pool.query(
      `insert into public.plan_marketing_info (plan, badge, tagline_vi, tagline_en, updated_at)
       values ($1, coalesce($2, ''), coalesce($3, ''), coalesce($4, ''), now())
       on conflict (plan) do update set
         badge = coalesce($2, plan_marketing_info.badge),
         tagline_vi = coalesce($3, plan_marketing_info.tagline_vi),
         tagline_en = coalesce($4, plan_marketing_info.tagline_en),
         updated_at = now()`,
      [plan, badge, taglineVi, taglineEn],
    )

    invalidatePlanMarketingCache()
    logSecurityEvent('ADMIN_PLAN_MARKETING_UPDATE_INFO', clientIp, { plan })
    return jsonResponse({ ok: true }, 200, allHeaders)
  }

  if (req.method === 'POST') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok)
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    const parsed = validateBody(CreateBulletSchema, bodyResult.raw)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    const { plan, textVi, textEn, sortOrder } = parsed.data

    let order = sortOrder
    if (order === undefined) {
      const { rows } = await pool.query<{ max_order: number | null }>(
        'select max(sort_order) as max_order from public.plan_marketing_bullets where plan = $1',
        [plan],
      )
      order = (rows[0]?.max_order ?? 0) + 10
    }

    const { rows: inserted } = await pool.query<{ id: number }>(
      `insert into public.plan_marketing_bullets (plan, sort_order, text_vi, text_en)
       values ($1, $2, $3, $4) returning id`,
      [plan, order, textVi, textEn],
    )

    invalidatePlanMarketingCache()
    logSecurityEvent('ADMIN_PLAN_MARKETING_CREATE_BULLET', clientIp, { plan })
    return jsonResponse({ id: inserted[0]?.id }, 200, allHeaders)
  }

  if (req.method === 'PATCH') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok)
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    const parsed = validateBody(UpdateBulletSchema, bodyResult.raw)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    const { id, textVi, textEn, sortOrder } = parsed.data

    const result = await pool.query(
      `update public.plan_marketing_bullets set
         text_vi = coalesce($2, text_vi),
         text_en = coalesce($3, text_en),
         sort_order = coalesce($4, sort_order),
         updated_at = now()
       where id = $1`,
      [id, textVi, textEn, sortOrder],
    )
    if (result.rowCount === 0) {
      return jsonResponse({ error: 'Không tìm thấy hàng này' }, 404, allHeaders)
    }

    invalidatePlanMarketingCache()
    logSecurityEvent('ADMIN_PLAN_MARKETING_UPDATE_BULLET', clientIp, { id })
    return jsonResponse({ ok: true }, 200, allHeaders)
  }

  if (req.method === 'DELETE') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok)
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    const parsed = validateBody(DeleteBulletSchema, bodyResult.raw)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)

    await pool.query('delete from public.plan_marketing_bullets where id = $1', [parsed.data.id])
    invalidatePlanMarketingCache()
    logSecurityEvent('ADMIN_PLAN_MARKETING_DELETE_BULLET', clientIp, { id: parsed.data.id })
    return jsonResponse({ id: parsed.data.id, removed: true }, 200, allHeaders)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}

export const config = { runtime: 'edge' }
