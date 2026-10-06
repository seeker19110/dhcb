// api/analytics.ts — Analytics tự viết (KHÔNG dùng script bên thứ 3 như Google Analytics —
// tránh vấn đề cookie/GDPR/CSP, khớp triết lý "không tin client" của dự án). Đo hiệu quả
// các kênh marketing và hành vi sản phẩm nhẹ, không block trải nghiệm.
//
// POST /api/analytics  body { event, refCode?, utmSource?, path? } → ghi 1 dòng vào
// bảng analytics_events (migration 0006). Auth TUỲ CHỌN — phải ghi được cả khi khách
// CHƯA đăng nhập (vd xem landing page trước khi đăng ký); validateAuth() tự trả null
// nếu không có/token không hợp lệ, không hề chặn request trong trường hợp đó.

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
} from '@dhcb/core-auth/security'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

// Whitelist cố định — KHÔNG nhận chuỗi tự do để tránh spam bảng dữ liệu rác.
// [2026-09-06] `signup` / `first_session_done` / `day2_return` đã BỎ khỏi đây: chúng được suy
// ra từ `users` + `daily_usage` trong analytics-summary.ts, không nhận từ client nữa.
// [2026-09-08] Daily Plan dùng refCode = action kind và utmSource = planner version để đo
// impression/click mà không cần migration hay metadata tự do.
// [2026-09-13] onboarding_step_view: đo rớt từng bước Intake/Onboarding (refCode =
// `intake:<step>`/`onboarding:<step>`) — điều tra vì sao chỉ 20% đăng ký hoàn thành phiên đầu.
// [2026-10-05, U9b] onboarding_skip: bấm "Bỏ qua" trong Onboarding (refCode = `onboarding:<step>`
// hoặc `onboarding:subject`) — đo cạnh onboarding_step_view.
const EVENT_TYPES = [
  'landing_view',
  'cta_click',
  'share_click',
  'daily_plan_impression',
  'daily_plan_click',
  'onboarding_step_view',
  'onboarding_skip',
  'session_done_view',
  'session_done_more',
] as const

const AnalyticsSchema = z.object({
  event: z.enum(EVENT_TYPES),
  refCode: z.string().max(100).optional(),
  utmSource: z.string().max(100).optional(),
  path: z.string().max(100).optional(),
})

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
  }

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 120, 'analytics'))) {
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const parsedBody = await readJsonBody(req)
  if (!parsedBody.ok)
    return jsonResponse({ error: parsedBody.error.message }, parsedBody.error.status, allHeaders)
  const result = validateBody(AnalyticsSchema, parsedBody.raw)
  if (!result.ok)
    return jsonResponse({ error: result.error.message }, result.error.status, allHeaders)
  const e = result.data

  const auth = await validateAuth(req)

  const pool = getPgPool()
  await pool.query(
    `insert into public.analytics_events (event, user_id, ref_code, utm_source, path)
     values ($1, $2, $3, $4, $5)`,
    [e.event, auth?.userId ?? null, e.refCode ?? null, e.utmSource ?? null, e.path ?? null],
  )

  return jsonResponse({ ok: true }, 200, allHeaders)
}
