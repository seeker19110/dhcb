// api/admin/admin-intake-stats.ts — GỢI Ý CỦA LUỒNG NGƯỜI MỚI CÓ TRÚNG KHÔNG?
// Đặc tả: docs/research/luong-nguoi-moi-ho-so-nang-luc-an-2026-08-23.md mục 10.
//
// GET /api/admin-intake-stats?days=30   (chỉ admin)
//
// Trả lời hai câu hỏi KHÁC NHAU, đừng gộp:
//   1. SUY LUẬN có đúng không? → tỷ lệ nhận việc chính / đổi việc / bỏ qua.
//   2. Gợi ý có TÁC DỤNG THẬT không? → tỷ lệ làm xong việc đầu trong 7 ngày.
// Một gợi ý được nhận ngay nhưng không ai làm xong vẫn là gợi ý tồi. Ngược lại, tỷ lệ "đổi việc"
// cao KHÔNG hẳn là xấu — nó nghĩa là màn gợi ý đang làm đúng việc của nó (đưa lựa chọn thật), chỉ
// là thuật toán xếp thứ tự chưa chuẩn.
//
// Chỉ ĐẾM, không đọc nội dung câu trả lời của ai: hai cột tự do đã mã hoá và truy vấn ở đây không
// đụng tới chúng (có test chốt điều này).

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
import { getIntakeStats } from '@dhcb/core-personal/intakeService'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const DaysSchema = z.coerce.number().int().min(1).max(365).catch(30)

/** Tỷ lệ phần trăm, làm tròn 1 chữ số. Mẫu số 0 ⇒ null chứ KHÔNG phải 0 — "chưa có dữ liệu" và
 *  "bằng không" là hai chuyện khác nhau, gộp lại là tự lừa mình khi đọc số liệu. */
function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 1000) / 10
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 20, 'admin-intake-stats'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-intake-stats' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-intake-stats' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const days = DaysSchema.parse(new URL(req.url).searchParams.get('days'))
  const s = await getIntakeStats(getPgPool(), days)

  return jsonResponse(
    {
      days,
      counts: s,
      rates: {
        // Câu 1 — suy luận có đúng không
        tookSuggested: rate(s.tookSuggested, s.answered),
        switched: rate(s.switched, s.answered),
        skipped: rate(s.skipped, s.answered),
        // Câu 2 — có tác dụng thật không. Mẫu số là những người ĐÃ CHỌN một việc, không phải tất
        // cả người trả lời: người chưa chọn việc nào thì không có gì để làm xong.
        doneAmongChosen: rate(s.done, s.tookSuggested + s.switched),
        doneWithin7DaysAmongChosen: rate(s.doneWithin7Days, s.tookSuggested + s.switched),
      },
      // Ghi thẳng vào payload để người đọc số liệu không quên: đây là TỰ KHAI.
      note: 'Việc "đã làm xong" là người dùng tự đánh dấu, không đo được khách quan.',
    },
    200,
    allHeaders,
  )
}
