// api/usage-summary.ts — Cho CLIENT (user đã đăng nhập, không cần admin) đọc "còn bao nhiêu
// lượt AI" để hiển thị UI đúng.
//
// GĐ1 2026-09-12 (docs/specs/2026-09-12-gd1-xoa-goi-pro.md): gói Free bỏ kho lượt cửa sổ trượt
// 7 ngày, chuyển sang hạn mức TỔNG/ngày y như VIP (chỉ khác con số, đọc từ app_settings). Vì
// hạn mức là TỔNG mọi mode cộng lại — không suy ra được từ dữ liệu local per-mode của client —
// nên client vẫn phải hỏi server.
//
// HỢP ĐỒNG TRẢ VỀ giữ nguyên tên field cũ (`freeWeeklyCredit`/`freeWeeklyCap`) để không phải
// sửa đồng loạt client + cache localStorage đã phát hành; Ý NGHĨA nay là "còn bao nhiêu lượt
// HÔM NAY" / "hạn mức lượt mỗi ngày".
//
// GET /api/usage-summary  (cần đăng nhập — cookie)

import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
import { lookupPlan, DEFAULT_SUBJECT, AI_USAGE_COLUMNS } from '@dhcb/core-billing/usage'
import { getAppSettings } from '@dhcb/core-db/settings'
import { hasUnlimitedAiTurns } from '@dhcb/core-billing/aiUsagePolicy'
import { vnDateStr } from '@dhcb/core-db/date'

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'usage-summary'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/usage-summary' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  try {
    const plan = await lookupPlan(auth.userId)
    const { limits } = await getAppSettings()
    const cap = limits[plan]

    const pool = getPgPool()
    const today = vnDateStr()
    // Đã dùng bao nhiêu lượt HÔM NAY — PHẢI cùng công thức với hàm SQL consume_usage_total
    // (cộng tay từng cột mode của đúng ngày + đúng môn), chỉ khác là chỉ đọc, không tiêu lượt.
    const { rows } = await pool.query<{ used: string | null }>(
      `select ${AI_USAGE_COLUMNS.join(' + ')} as used
         from public.daily_usage
        where user_id = $1 and day = $2 and subject = $3`,
      [auth.userId, today, DEFAULT_SUBJECT],
    )
    const used = Number(rows[0]?.used ?? 0)
    if (!Number.isSafeInteger(used) || used < 0) throw new Error('Invalid usage total')
    if (hasUnlimitedAiTurns(plan)) {
      // Không gửi Infinity qua JSON; null + cờ tường minh khác với "chưa đọc được lượt".
      // Các field cũ giữ tên để client đã phát hành không vỡ; client mới đọc nhánh unlimited.
      return jsonResponse(
        { plan, unlimited: true, usedToday: used, freeWeeklyCredit: null, freeWeeklyCap: 0 },
        200,
        { ...allHeaders, 'Cache-Control': 'no-store' },
      )
    }
    // Kẹp về [0, cap] — admin có thể hạ hạn mức xuống dưới số đã dùng, không được hiện số âm.
    const remaining = Math.max(0, Math.min(cap - used, cap))

    return jsonResponse({ plan, freeWeeklyCredit: remaining, freeWeeklyCap: cap }, 200, allHeaders)
  } catch (err) {
    console.warn('[usage-summary] lỗi đọc lượt đã dùng → fail-open (ẩn số, không chặn):', err)
    // Lỗi hạ tầng: KHÔNG bịa con số. `null` = client tự hiểu là chưa biết và không hiện thanh
    // tiến trình sai — việc chặn thật vẫn do server quyết ở checkAndConsumeUsage().
    return jsonResponse({ plan: 'free', freeWeeklyCredit: null, freeWeeklyCap: 0 }, 200, allHeaders)
  }
}
