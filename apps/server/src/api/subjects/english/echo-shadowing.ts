// api/echo-shadowing.ts — V3 Real-Time Echo Shadowing Endpoint.
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { listShadowingPassages, getShadowingPassage } from '@dhcb/core-ai/echoShadowingService'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'echo_shadowing_api'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/echo-shadowing' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  }

  // Danh mục bài mẫu là dữ liệu tĩnh — không cần chạm CSDL (trước đây tạo hồ sơ `person` chỉ để
  // truyền vào hàm chấm điểm đã gỡ ở changelog 0484).
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const passageId = url.searchParams.get('passageId')

    if (passageId) {
      const passage = getShadowingPassage(passageId)
      if (!passage) {
        return jsonResponse({ error: 'Không tìm thấy đoạn văn' }, 404, headers)
      }
      return jsonResponse({ passage }, 200, headers)
    }

    const passages = listShadowingPassages()
    return jsonResponse({ passages }, 200, headers)
  }

  // GỠ 2026-10-02 (changelog 0484, chủ dự án chọn "bỏ điểm, giữ bài luyện"). Trước đây POST trả
  // "Band", độ trễ, độ đồng bộ nhịp tính từ hai con số client sinh bằng `Math.random()` — thẻ
  // không ghi âm gì. Giữ nhánh để client cũ nhận lỗi rõ (501) thay vì 405 mơ hồ.
  if (req.method === 'POST') {
    return jsonResponse(
      {
        error: 'ECHO_SHADOWING_SCORING_UNAVAILABLE',
        message:
          'Bài nói đuổi chưa chấm điểm: bản trước hiện điểm tính từ số ngẫu nhiên chứ không đo ' +
          'giọng nói của bạn.',
      },
      501,
      headers,
    )
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, headers)
}
