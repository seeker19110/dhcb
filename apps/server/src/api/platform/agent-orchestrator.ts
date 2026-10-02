// api/agent-orchestrator.ts — REST handler cho Studio Điều Phối Agent Tự Trị (ĐÃ GỠ).
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
        message: 'Yêu cầu đăng nhập để truy cập Studio Điều Phối Agent Tự Trị.',
      },
      401,
    )
  }

  // GỠ 2026-10-02 (changelog 0481, chủ dự án chọn "ẩn thẻ"). Trước đây POST trả một phiên
  // "agent" DỰNG SẴN: 5 bước Plan → Handoff luôn `completed`, token/chi phí gán cứng, kết quả soạn
  // sẵn ("100% tiêu chí đạt chuẩn") — không có lệnh gọi AI nào, nhưng giao diện trình bày như agent
  // đã chạy thật. Thẻ giao diện, service và hợp đồng đã xoá. Giữ route để client cũ nhận lỗi rõ
  // (501) thay vì 404 mơ hồ. Làm thật thì cần đặc tả mới (skill `autonomous-agent-orchestrator`).
  if (req.method === 'GET' || req.method === 'POST') {
    return jsonResponse(
      {
        error: 'AGENT_ORCHESTRATOR_UNAVAILABLE',
        message:
          'Studio Điều Phối Agent đã tạm gỡ: bản trước hiển thị kết quả dựng sẵn chứ không chạy ' +
          'agent thật, nên không còn trả phiên nào.',
      },
      501,
    )
  }

  return jsonResponse({ error: 'Method not allowed' }, 405)
}
