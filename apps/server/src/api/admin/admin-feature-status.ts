// api/admin-feature-status.ts — Kiểm tra & báo trạng thái hoạt động các tính năng dùng API
// bên thứ ba (AI chat, STT, TTS, R2 storage, SePay) và không dùng API (Postgres) của dự án.
//
// GET  /api/admin-feature-status            — Admin xem lượt kiểm tra gần nhất + lịch sử.
// POST /api/admin-feature-status            — Chạy 1 lượt kiểm tra ngay, lưu kết quả. Hai
//   đường vào: (1) Admin đã đăng nhập bấm nút "Kiểm tra thủ công" (Bearer token, như các
//   endpoint admin khác). (2) crontab trên VPS gọi tự động 2 lần/ngày, xác thực bằng header
//   `x-cron-key` khớp biến môi trường FEATURE_STATUS_CRON_KEY (không cần đăng nhập — cron chạy
//   ngoài trình duyệt, không có Bearer token người dùng). Xem docs/deploy-vps-ubuntu.md để biết
//   dòng crontab mẫu.

import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  validateAuth,
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { getUserById } from '@dhcb/core-auth/authService'
import { isAdminUser } from '@dhcb/core-auth/adminAuth'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
import { runAllFeatureChecks, summarizeOverallStatus } from '../_lib/featureStatusChecks.js'

const HISTORY_LIMIT = 30

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 20, 'admin-feature-status'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-feature-status' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const pool = getPgPool()

  if (req.method === 'GET') {
    const auth = await validateAuth(req)
    if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)
    if (!isAdminUser(auth.userId)) {
      logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-feature-status' })
      return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
    }

    const { rows } = await pool.query(
      `select id, run_at, triggered_by, triggered_by_email, overall_status, results
       from public.feature_status_checks
       order by run_at desc
       limit $1`,
      [HISTORY_LIMIT],
    )
    return jsonResponse({ latest: rows[0] ?? null, history: rows }, 200, allHeaders)
  }

  if (req.method === 'POST') {
    const cronKey = req.headers.get('x-cron-key')
    const expectedCronKey = process.env.FEATURE_STATUS_CRON_KEY

    let triggeredBy: 'cron' | 'manual'
    let triggeredByEmail: string | null = null

    if (expectedCronKey && cronKey === expectedCronKey) {
      triggeredBy = 'cron'
    } else {
      const auth = await validateAuth(req)
      if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)
      if (!isAdminUser(auth.userId)) {
        logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-feature-status' })
        return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
      }
      const admin = await getUserById(auth.userId)
      triggeredBy = 'manual'
      triggeredByEmail = admin?.email ?? null
    }

    const results = await runAllFeatureChecks()
    const overallStatus = summarizeOverallStatus(results)

    const { rows } = await pool.query(
      `insert into public.feature_status_checks
         (triggered_by, triggered_by_email, overall_status, results)
       values ($1, $2, $3, $4)
       returning id, run_at, triggered_by, triggered_by_email, overall_status, results`,
      [triggeredBy, triggeredByEmail, overallStatus, JSON.stringify(results)],
    )

    if (overallStatus !== 'up') {
      logSecurityEvent('FEATURE_STATUS_DEGRADED', clientIp, { triggeredBy, overallStatus, results })
    }

    return jsonResponse(rows[0], 200, allHeaders)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}
