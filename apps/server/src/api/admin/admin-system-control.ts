// api/admin-system-control.ts — Quản lý Cầu dao khẩn cấp (AI Circuit Breaker) cho Admin.
//
// GET  /api/admin-system-control
// POST /api/admin-system-control  body { action: 'toggle-circuit-breaker', enabled: boolean }

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { invalidateSettingsEverywhere } from '../_lib/settingsSync.js'
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

const ActionSchema = z.object({
  action: z.literal('toggle-circuit-breaker'),
  enabled: z.boolean(),
})

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 20, 'admin-system-control'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-system-control' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-system-control' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const pool = getPgPool()

  if (req.method === 'GET') {
    const { rows } = await pool.query<{ ai_circuit_breaker: boolean }>(
      `select ai_circuit_breaker from public.app_settings where id = 1`,
    )
    const enabled = rows[0]?.ai_circuit_breaker ?? false
    return jsonResponse({ circuitBreakerEnabled: enabled }, 200, allHeaders)
  }

  if (req.method === 'POST') {
    const parsed = await readJsonBody(req)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    const val = validateBody(ActionSchema, parsed.raw)
    if (!val.ok) return jsonResponse({ error: val.error.message }, val.error.status, allHeaders)

    const { enabled } = val.data

    const result = await pool.query(
      `update public.app_settings
       set ai_circuit_breaker = $1, updated_at = now()
       where id = 1`,
      [enabled],
    )
    // Không có hàng id=1 thì cầu dao KHÔNG đổi — không được báo "ĐÃ KÍCH HOẠT" (audit 2026-10-10).
    if (result.rowCount !== 1) {
      console.error('[admin-system-control] app_settings id=1 không tồn tại — cầu dao chưa đổi')
      return jsonResponse({ error: 'Chưa đổi được cầu dao — thử lại sau' }, 500, allHeaders)
    }
    // Xoá cache 30s ở tiến trình này NGAY + phát tin qua Redis để các tiến trình PM2 khác cũng
    // xoá — cầu dao có hiệu lực ở cả cụm, không đợi hết TTL (xem settingsSync.ts).
    invalidateSettingsEverywhere()

    logSecurityEvent('CIRCUIT_BREAKER_TOGGLED', clientIp, {
      adminUserId: auth.userId,
      enabled,
    })

    return jsonResponse(
      {
        ok: true,
        circuitBreakerEnabled: enabled,
        message: enabled
          ? 'ĐÃ KÍCH HOẠT CẦU DAO KHẨN CẤP — Tạm thời dập tất cả dịch vụ gọi AI!'
          : 'Đã tắt Cầu dao khẩn cấp — Dịch vụ gọi AI hoạt động bình thường.',
      },
      200,
      allHeaders,
    )
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}
