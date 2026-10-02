// api/life-synthesis.ts — REST handler cho Cross-Domain Life Synthesis & Predictive Goal Horizon.
import { jsonResponse } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse(
      {
        error: 'Unauthorized',
        message: 'Yêu cầu đăng nhập để truy cập Báo cáo Tổng hợp Đa Miền.',
      },
      401,
    )
  }

  // TẠM NGỪNG 2026-10-02 (changelog 0475). Trước đây GET không nhận dữ liệu nào nên
  // `generateLifeSynthesisReport` (packages/core-personal/lifeSynthesisService.ts) dùng số hoạt
  // động GÁN CỨNG, điểm mặc định, mục tiêu mẫu và câu nhận xét soạn sẵn — mọi người dùng đều
  // thấy cùng một "phân tích cuộc sống" bịa. Chưa có nguồn dữ liệu hoạt động thật để tổng hợp,
  // nên trả lỗi rõ (501) thay vì báo cáo giả. Studio "Tổng kết" gọi API này cũng đã gỡ.
  if (req.method === 'GET' || req.method === 'POST') {
    return jsonResponse(
      {
        error: 'LIFE_SYNTHESIS_UNAVAILABLE',
        message:
          'Báo cáo tổng hợp đa miền đang tạm ngừng: hệ thống chưa có dữ liệu hoạt động thật để ' +
          'tổng hợp, nên không trả số liệu ước đoán.',
      },
      501,
    )
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}
