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

  // Trang admin KHÔNG được thấy/ghi đè bằng cấu hình MẶC ĐỊNH khi CSDL lỗi (audit 2026-10-10,
  // E1.7): bản mặc định có cầu dao TẮT — admin bấm lưu lúc đó sẽ vô tình bật lại AI. Lỗi đọc
  // → ném ra để adapter trả 500.
  if (req.method === 'GET') {
    const settings = await getAppSettings({ requireAvailable: true })
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
    // Giữ nguyên giá trị cũ nếu client không gửi field này (xem comment ở UpdateSchema): làm
    // NGAY TRONG SQL bằng coalesce, không đọc `getAppSettings()` trước — bản đọc đó có thể là
    // cache 30s của tiến trình này (PM2 chạy nhiều tiến trình), ghi lại giá trị cũ sẽ lật
    // ngược cầu dao vừa bật ở tiến trình khác.
    const pool = getPgPool()
    const result = await pool.query(
      `update public.app_settings set
         pro_daily_limit = $1, vip_daily_limit = $2, promo_until = $3,
         ai_circuit_breaker = coalesce($4::boolean, ai_circuit_breaker),
         leaderboard_enabled = coalesce($5::boolean, leaderboard_enabled),
         updated_at = now()
       where id = 1`,
      [
        limits.free,
        limits.vip,
        promoUntil,
        parsed.data.aiCircuitBreaker ?? null,
        parsed.data.leaderboardEnabled ?? null,
      ],
    )
    if (result.rowCount !== 1) {
      console.error('[admin-settings] app_settings id=1 không tồn tại — chưa ghi được cấu hình')
      return jsonResponse({ error: 'Chưa lưu được cấu hình — thử lại sau' }, 500, allHeaders)
    }
    invalidateSettingsCache()

    const updated = await getAppSettings({ requireAvailable: true })
    return jsonResponse(updated, 200, allHeaders)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}

export const config = { runtime: 'edge' }
