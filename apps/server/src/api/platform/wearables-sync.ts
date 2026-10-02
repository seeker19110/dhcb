// api/wearables-sync.ts — REST handler cho thẻ "Wearables & Circadian Bio-Adaptive MCP" (ĐÃ GỠ).
import { jsonResponse } from '@dhcb/core-http/http'
import { validateAuth, getCorsHeaders } from '@dhcb/core-auth/security'

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: getCorsHeaders(req) })
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  // GỠ 2026-10-02 (changelog 0484, chủ dự án chọn "ẩn thẻ"). Trước đây thẻ giao diện gửi HRV,
  // nhịp tim nghỉ, điểm giấc ngủ, phút ngủ sâu đều sinh bằng `Math.random()`; server lưu vào bộ
  // nhớ tạm và tính "khung giờ học sinh học" từ đó, kèm huy hiệu "BIO-SYNC ACTIVE" và nút Apple
  // HealthKit / Oura / Garmin — không có tích hợp thiết bị nào. Thẻ, service và hợp đồng đã xoá.
  // Giữ route để client cũ nhận lỗi rõ (501) thay vì 404 mơ hồ. Làm thật cần đặc tả tích hợp
  // thiết bị (OAuth từng hãng, đồng ý chia sẻ dữ liệu sức khoẻ).
  if (req.method === 'GET' || req.method === 'POST') {
    return jsonResponse(
      {
        error: 'WEARABLES_UNAVAILABLE',
        message:
          'Đồng bộ thiết bị đeo đã tạm gỡ: bản trước hiển thị số sinh trắc ngẫu nhiên chứ không ' +
          'đọc từ thiết bị nào.',
      },
      501,
    )
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}
