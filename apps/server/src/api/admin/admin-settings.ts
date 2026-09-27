// api/admin-settings.ts — Cho ADMIN (xác thực qua ADMIN_USER_IDS, xem _lib/adminAuth.ts) đọc/sửa
// hạn mức lượt dùng AI theo gói (free/pro/vip) + mốc khuyến mãi, lưu trong bảng app_settings
// (postgres/migrations/0001_app_settings.sql) — thay vì phải sửa code + deploy lại mỗi lần
// đổi số. Không CHECK constraint DB nào khác bị ảnh hưởng.
//
// GET  /api/admin-settings   (cần đăng nhập — cookie, user phải nằm trong ADMIN_USER_IDS)
// POST /api/admin-settings   body: { limits: {free:{...},pro:{...},vip:{...}}, promoUntil: string|null }

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
import { getAppSettings, invalidateSettingsCache } from '@dhcb/core-db/settings'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

// Quyết định 2026-07-27: 1 hạn mức TỔNG lượt/ngày cho MỌI tính năng AI cộng lại (không còn
// chia riêng chat/writing/speaking/stt/pronounce) — xem packages/core-db/settings.ts.
// GĐ1 2026-09-12: `limits.free` ghi vào ĐÚNG cột DB cũ `pro_daily_limit` (giữ tên cột để khỏi
// phải migration đổi tên; ý nghĩa nay là hạn mức người dùng miễn phí).
const UpdateSchema = z.object({
  limits: z.object({
    free: z.number().int().min(0).max(1_000_000),
    vip: z.number().int().min(0).max(1_000_000),
  }),
  // null = tắt khuyến mãi; chuỗi = ISO datetime hợp lệ
  promoUntil: z
    .string()
    .refine((v) => !Number.isNaN(new Date(v).getTime()), { error: 'promoUntil không hợp lệ' })
    .nullable(),
  // Cầu dao khẩn cấp chặn toàn bộ lượt gọi AI — KHÔNG đặt .default() ở đây: client cũ (chưa
  // có UI cho field này) sẽ không gửi lên, và nếu default về false thì MỖI LẦN admin lưu cấu
  // hình khác (vd đổi hạn mức) sẽ vô tình bật lại AI dù trước đó đã chủ động tắt khẩn cấp. Xử
  // lý "giữ nguyên giá trị cũ nếu client không gửi" ở handler bên dưới.
  aiCircuitBreaker: z.boolean().optional(),
  // Bật/tắt bảng xếp hạng — cùng lý do KHÔNG .default(): client cũ không gửi thì phải giữ
  // nguyên giá trị đang có, không âm thầm bật/tắt lại.
  leaderboardEnabled: z.boolean().optional(),
})

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 20, 'admin-settings'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-settings' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-settings' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  if (req.method === 'GET') {
    const settings = await getAppSettings()
    return jsonResponse(settings, 200, allHeaders)
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
    const { limits, promoUntil } = parsed.data
    // Giữ nguyên giá trị cũ nếu client không gửi field này (xem comment ở UpdateSchema).
    const current = await getAppSettings()
    const aiCircuitBreaker = parsed.data.aiCircuitBreaker ?? current.aiCircuitBreaker
    const leaderboardEnabled = parsed.data.leaderboardEnabled ?? current.leaderboardEnabled

    const pool = getPgPool()
    await pool.query(
      `update public.app_settings set
         pro_daily_limit = $1, vip_daily_limit = $2,
         promo_until = $3, ai_circuit_breaker = $4, leaderboard_enabled = $5, updated_at = now()
       where id = 1`,
      [limits.free, limits.vip, promoUntil, aiCircuitBreaker, leaderboardEnabled],
    )
    invalidateSettingsCache()

    const updated = await getAppSettings()
    return jsonResponse(updated, 200, allHeaders)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}

export const config = { runtime: 'edge' }
