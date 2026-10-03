// api/acoustic-phonetics.ts — REST handler của "Acoustic Phonetics & GOP Lab" (ĐÃ GỠ phần chấm).
import { jsonResponse } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  // GỠ 2026-10-02 (changelog 0484, chủ dự án chọn "bỏ số, đổi thành gợi ý"). Trước đây endpoint
  // đoán âm sai từ CHÍNH TẢ câu đã nhận dạng và gán "Điểm GOP" bằng công thức cứng (`92 - idx * 3`,
  // lệch thì 48), không đo âm thanh. Gợi ý luyện âm nay tính ngay ở giao diện
  // (`@dhcb/core-ai/pronunciationHints`), không qua server. Giữ route để client cũ nhận lỗi rõ.
  return jsonResponse(
    {
      error: 'ACOUSTIC_SCORING_UNAVAILABLE',
      message:
        'Lab phát âm không còn chấm điểm: bản trước hiện điểm GOP gán sẵn chứ không đo giọng nói ' +
        'của bạn. Xem phần "Gợi ý luyện âm" trong studio Thử thách.',
    },
    501,
  )
}
