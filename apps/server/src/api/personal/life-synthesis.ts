// api/personal/life-synthesis.ts — GET /api/life-synthesis: "Tổng hợp 30 ngày" của Bạn Đồng Hành.
//
// Đặc tả: docs/specs/2026-10-09-tong-hop-da-mien-du-lieu-that.md (changelog 0550).
//
// Lịch sử: 2026-10-02 (changelog 0475) API này bị tạm ngừng (501) vì trả "phân tích cuộc sống"
// dựng từ số GÁN CỨNG, giống nhau cho mọi người. Nay báo cáo dựng THUẦN từ bản ghi thật của hai
// trụ Học tập + Ghi chú (`@dhcb/core-personal/lifeSynthesisService`): chỉ đếm, không điểm tổng
// hợp, câu chữ sinh tất định theo luật, không gọi AI (nên không tốn lượt AI).
//
// POST (bản cũ nhận số liệu do client tự khai) đã bỏ — client không được là nguồn của số liệu.
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { generateLifeSynthesisReport } from '@dhcb/core-personal/lifeSynthesisService'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { jsonResponse, getClientIp, internalErrorResponse } from '@dhcb/core-http/http'

/** Đọc thuần (2 câu SQL gộp) — 30 lượt/phút/IP là dư cho một khối tự tải khi mở studio. */
const RATE_LIMIT_PER_MINUTE = 30

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  }

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, RATE_LIMIT_PER_MINUTE, 'life_synthesis'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/life-synthesis' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse(
      { error: 'Unauthorized', message: 'Cần đăng nhập để xem bản tổng hợp của bạn.' },
      401,
      headers,
    )
  }

  try {
    // userId lấy từ token — mọi câu SQL lọc theo đúng id này (CLAUDE.md mục 4.2).
    const report = await generateLifeSynthesisReport(getPgPool(), auth.userId)
    return jsonResponse({ report }, 200, headers)
  } catch (err: unknown) {
    if (isAppError(err)) {
      return jsonResponse(toErrorBody(err), err.status, headers)
    }
    return internalErrorResponse(err, headers, 'life-synthesis')
  }
}
