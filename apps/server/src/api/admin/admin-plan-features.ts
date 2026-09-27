// api/admin-plan-features.ts — Cho ADMIN quản lý ma trận "tính năng nào bật cho gói nào"
// (bảng feature_catalog + plan_feature_flags). Khác api/admin-settings.ts (số hạn mức
// lượt/ngày) — đây là bật/tắt TỪNG tính năng cho TỪNG gói, admin thêm/xoá tính năng được.
//
// GET    /api/admin-plan-features                        (danh mục + ma trận hiện tại)
// POST   /api/admin-plan-features  body: { featureKey, plan, enabled }   (bật/tắt 1 ô)
// PUT    /api/admin-plan-features  body: { key, label, description? }   (thêm tính năng mới,
//                                                                         mặc định bật cả 2 gói)
// DELETE /api/admin-plan-features  body: { key }                        (xoá hẳn tính năng)

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
import { getPlanFeatureMatrix, invalidatePlanFeatureCache } from '@dhcb/core-billing/planFeatures'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const ToggleSchema = z.object({
  featureKey: z.string().trim().min(1).max(100),
  plan: z.enum(['free', 'vip']),
  enabled: z.boolean(),
})

const CreateSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, 'Key chỉ gồm chữ thường/số/gạch dưới'),
  label: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
})

const DeleteSchema = z.object({
  key: z.string().trim().min(1).max(100),
})

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'admin-plan-features'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-plan-features' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-plan-features' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const pool = getPgPool()

  if (req.method === 'GET') {
    const matrix = await getPlanFeatureMatrix()
    return jsonResponse(matrix, 200, allHeaders)
  }

  if (req.method === 'POST') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok)
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    const parsed = validateBody(ToggleSchema, bodyResult.raw)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    const { featureKey, plan, enabled } = parsed.data

    const result = await pool.query(
      `update public.plan_feature_flags set enabled = $3, updated_at = now()
       where feature_key = $1 and plan = $2`,
      [featureKey, plan, enabled],
    )
    if (result.rowCount === 0) {
      return jsonResponse({ error: 'Không tìm thấy tính năng này' }, 404, allHeaders)
    }

    invalidatePlanFeatureCache()
    logSecurityEvent('ADMIN_PLAN_FEATURE_TOGGLE', clientIp, { featureKey, plan, enabled })
    return jsonResponse({ featureKey, plan, enabled }, 200, allHeaders)
  }

  if (req.method === 'PUT') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok)
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    const parsed = validateBody(CreateSchema, bodyResult.raw)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    const { key, label, description } = parsed.data

    // "Key đã tồn tại" là kết quả NGHIỆP VỤ bình thường (409), không phải lỗi hạ tầng — nên
    // không throw để thoát transaction, mà trả về cờ rồi tự quyết rollback/commit trong fn. Nếu
    // throw ở đây, withTransaction() sẽ coi là lỗi thật và ném ra ngoài thay vì cho phép trả 409
    // gọn gàng.
    const outcome = await withTransaction(pool, async (client) => {
      const inserted = await client.query(
        `insert into public.feature_catalog (key, label, description)
         values ($1, $2, $3)
         on conflict (key) do nothing
         returning key`,
        [key, label, description ?? null],
      )
      if (inserted.rowCount === 0) {
        return { ok: false as const }
      }
      await client.query(
        `insert into public.plan_feature_flags (feature_key, plan, enabled)
         select $1, p.plan, true from (values ('free'), ('vip')) as p(plan)`,
        [key],
      )
      return { ok: true as const }
    })

    if (!outcome.ok) {
      return jsonResponse({ error: 'Key này đã tồn tại' }, 409, allHeaders)
    }

    invalidatePlanFeatureCache()
    logSecurityEvent('ADMIN_PLAN_FEATURE_CREATE', clientIp, { key })
    return jsonResponse({ key, label, description: description ?? null }, 200, allHeaders)
  }

  if (req.method === 'DELETE') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok)
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    const parsed = validateBody(DeleteSchema, bodyResult.raw)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    const { key } = parsed.data

    await pool.query('delete from public.feature_catalog where key = $1', [key])
    invalidatePlanFeatureCache()
    logSecurityEvent('ADMIN_PLAN_FEATURE_DELETE', clientIp, { key })
    return jsonResponse({ key, removed: true }, 200, allHeaders)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}

export const config = { runtime: 'edge' }
