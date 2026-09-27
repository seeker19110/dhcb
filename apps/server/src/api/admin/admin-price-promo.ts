// api/admin-price-promo.ts — Cho ADMIN (xác thực qua ADMIN_USER_IDS, xem _lib/adminAuth.ts)
// đọc/sửa khuyến mãi % áp dụng cho TOÀN BỘ gói/chu kỳ cùng lúc, lưu trong bảng price_promo
// (postgres/migrations/0026_price_promo.sql). Khác plan_prices.sale_price_vnd (giá tuyệt đối
// riêng từng dòng, không có admin API). Đổi ở đây có hiệu lực gần như ngay (cache 30s), không
// cần deploy — xem api/_lib/pricePromo.ts.
//
// GET  /api/admin-price-promo   (cần đăng nhập — cookie, user phải nằm trong ADMIN_USER_IDS)
// POST /api/admin-price-promo   body: { percent: number, startsAt: string|null, endsAt: string|null }

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
import { getPricePromo, invalidatePricePromoCache } from '@dhcb/core-billing/pricePromo'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const isoDateOrNull = z
  .string()
  .refine((v) => !Number.isNaN(new Date(v).getTime()), { error: 'Ngày không hợp lệ' })
  .nullable()

// percent=0 → tắt khuyến mãi hẳn, startsAt/endsAt có thể null trong ca này.
const UpdateSchema = z
  .object({
    percent: z.number().int().min(0).max(100),
    startsAt: isoDateOrNull,
    endsAt: isoDateOrNull,
  })
  .refine((v) => v.percent === 0 || (v.startsAt != null && v.endsAt != null), {
    error: 'Bật khuyến mãi (percent > 0) phải có đủ ngày bắt đầu và kết thúc',
    path: ['startsAt'],
  })
  .refine(
    (v) =>
      v.startsAt == null ||
      v.endsAt == null ||
      new Date(v.startsAt).getTime() < new Date(v.endsAt).getTime(),
    { error: 'Ngày bắt đầu phải trước ngày kết thúc', path: ['endsAt'] },
  )

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 20, 'admin-price-promo'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-price-promo' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-price-promo' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  if (req.method === 'GET') {
    const promo = await getPricePromo()
    return jsonResponse(promo, 200, allHeaders)
  }

  if (req.method === 'POST') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok) {
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    }
    const parsed = validateBody(UpdateSchema, bodyResult.raw)
    if (!parsed.ok) {
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    }
    const { percent, startsAt, endsAt } = parsed.data

    const pool = getPgPool()
    await pool.query(
      `update public.price_promo set percent = $1, starts_at = $2, ends_at = $3, updated_at = now()
       where id = 1`,
      [percent, startsAt, endsAt],
    )
    invalidatePricePromoCache()

    logSecurityEvent('ADMIN_PRICE_PROMO_UPDATED', clientIp, { percent, startsAt, endsAt })
    const updated = await getPricePromo()
    return jsonResponse(updated, 200, allHeaders)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}

export const config = { runtime: 'edge' }
