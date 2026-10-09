// api/articulatory-phonetics.ts — Hướng dẫn khẩu hình (mặt cắt miệng) cho âm người Việt hay nhầm.
//
// GET  → danh sách hướng dẫn, hoặc một hướng dẫn theo `?phoneme=`. Dữ liệu tĩnh viết tay
//        (`ARTICULATORY_GUIDES`), không gọi AI, không đọc/ghi CSDL.
// POST → 501 `PITCH_ANALYSIS_UNAVAILABLE`. GỠ 2026-10-09 (changelog 0563, khuôn 0484): bản trước
//        "phân tích ngữ điệu" mà KHÔNG nhận âm thanh nào — client gửi điểm `Math.random()`, server
//        sinh đường pitch "của bạn" = pitch mẫu + nhiễu ngẫu nhiên và trả "Khớp N%". Giữ route để
//        client cũ nhận lỗi rõ thay vì 404. Đo ngữ điệu thật cần ghi âm + trích F0 — tính năng mới,
//        phải có đặc tả.
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import {
  getArticulatoryGuide,
  ARTICULATORY_GUIDES,
} from '@dhcb/core-ai/articulatoryPhoneticsService'
import { L1PhonemeTargetSchema } from '@dhcb/core-contracts/articulatoryPhonetics'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'articulatory_phonetics_api'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/articulatory-phonetics' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  }

  if (req.method === 'GET') {
    const phonemeParam = new URL(req.url).searchParams.get('phoneme')
    if (phonemeParam === null) {
      return jsonResponse({ guides: Object.values(ARTICULATORY_GUIDES) }, 200, headers)
    }
    const phoneme = L1PhonemeTargetSchema.safeParse(phonemeParam)
    if (!phoneme.success) {
      return jsonResponse({ error: 'Âm vị không hợp lệ' }, 400, headers)
    }
    return jsonResponse({ guide: getArticulatoryGuide(phoneme.data) }, 200, headers)
  }

  if (req.method === 'POST') {
    return jsonResponse(
      {
        error: 'PITCH_ANALYSIS_UNAVAILABLE',
        message:
          'Chưa có phân tích ngữ điệu: bản trước hiện "Khớp N%" từ số ngẫu nhiên chứ không nghe ' +
          'giọng bạn. Thẻ nay chỉ hướng dẫn khẩu hình.',
      },
      501,
      headers,
    )
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, headers)
}
