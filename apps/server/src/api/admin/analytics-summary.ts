// api/analytics-summary.ts — Cho ADMIN xem tổng hợp sự kiện analytics đã ghi qua /api/analytics.
// Tách riêng khỏi api/analytics.ts (chỉ nhận POST công khai, không auth bắt buộc) vì đây là
// đường ĐỌC cần quyền admin — gộp chung 1 file dễ lẫn giữa "ai cũng ghi được" và "chỉ admin xem
// được".
//
// GET /api/analytics-summary?days=14  (cần đăng nhập — cookie, user phải nằm trong ADMIN_USER_IDS)
// Trả về: tổng số theo event trong N ngày gần nhất + số liệu theo ngày cho biểu đồ đơn giản.
//
// [2026-09-06] Ba bước phễu `signup` · `first_session_done` · `day2_return` KHÔNG còn là sự kiện
// client bắn lên (whitelist từng khai nhưng chưa nơi nào gọi → phễu admin luôn 0 ở đúng ba bước
// quan trọng nhất). Nay SUY RA từ bảng có thẩm quyền — `users.created_at` + `daily_usage` — nên
// không thể quên bắn, không bị chặn quảng cáo, và có luôn số quá khứ. Định nghĩa (đoàn hệ = user
// tạo trong cửa sổ N ngày, ngày theo giờ VN như `daily_usage.day`):
//   signup             — ngày tạo tài khoản
//   first_session_done — ngày ĐẦU TIÊN có bất kỳ lượt dùng nào (chat/viết/nói/học/phát âm/code)
//   day2_return        — ngày đầu tiên có lượt dùng SAU ngày đăng ký (quay lại ít nhất 1 ngày)

import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  validateAuth,
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { isAdminUser } from '@dhcb/core-auth/adminAuth'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const DEFAULT_DAYS = 14
const MAX_DAYS = 90

interface DailyRow {
  day: string
  event: string
  count: number
}

interface DailyPlanRow {
  day: string
  actionKind: string
  plannerVersion: string
  count: number
}

interface DailyPlanActionRow {
  actionKind: string
  plannerVersion: string
  impressionCount: number
  clickCount: number
  completionCount: number
}

// Cột lượt dùng của `daily_usage` — có > 0 ở bất kỳ cột nào = "đã học thật" trong ngày đó.
// Khớp `admin-usage-stats.ts`; thêm cột đếm mới thì thêm vào đây.
const USAGE_SUM =
  'd.chat_count + d.writing_count + d.speaking_count + d.stt_count + d.learn_count + d.pronounce_count + d.code_feedback_count'

// Một câu SQL, ba bước phễu, cùng đoàn hệ. `daily_usage.day` đã là 'YYYY-MM-DD' giờ VN
// (`vnDateStr()` ở core-billing/usage.ts) nên so chuỗi với ngày đăng ký đổi sang giờ VN là đúng.
const FUNNEL_SQL = `
  with cohort as (
    select id,
           to_char(created_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') as signup_day
    from public.users
    where created_at >= now() - ($1 || ' days')::interval
  ),
  active as (
    select d.user_id, d.day
    from public.daily_usage d
    where (${USAGE_SUM}) > 0
  ),
  first_session as (
    select c.id, min(a.day) as day
    from cohort c join active a on a.user_id = c.id
    group by c.id
  ),
  day2 as (
    select c.id, min(a.day) as day
    from cohort c join active a on a.user_id = c.id and a.day > c.signup_day
    group by c.id
  )
  select 'signup' as event, signup_day as day, count(*)::int as count from cohort group by 2
  union all
  select 'first_session_done', day, count(*)::int from first_session group by 2
  union all
  select 'day2_return', day, count(*)::int from day2 group by 2
  order by 2 asc`

const DAILY_PLAN_COMPLETION_SQL = `
  select to_char(occurred_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') as day,
         action_kind as "actionKind",
         planner_version as "plannerVersion",
         count(distinct user_id)::int as count
  from public.daily_plan_completions
  where occurred_at >= now() - ($1 || ' days')::interval
  group by 1, 2, 3
  order by 1 asc, 2 asc, 3 asc`

const DAILY_PLAN_ACTION_SQL = `
  with client_metrics as (
    select ref_code as action_kind,
           utm_source as planner_version,
           count(*) filter (where event = 'daily_plan_impression')::int as impression_count,
           count(*) filter (where event = 'daily_plan_click')::int as click_count
    from public.analytics_events
    where created_at >= now() - ($1 || ' days')::interval
      and event in ('daily_plan_impression', 'daily_plan_click')
    group by 1, 2
  ), completions as (
    select action_kind, planner_version, count(distinct user_id)::int as completion_count
    from public.daily_plan_completions
    where occurred_at >= now() - ($1 || ' days')::interval
    group by 1, 2
  )
  select coalesce(m.action_kind, c.action_kind) as "actionKind",
         coalesce(m.planner_version, c.planner_version) as "plannerVersion",
         coalesce(m.impression_count, 0)::int as "impressionCount",
         coalesce(m.click_count, 0)::int as "clickCount",
         coalesce(c.completion_count, 0)::int as "completionCount"
  from client_metrics m full join completions c using (action_kind, planner_version)
  order by 1, 2`

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })
  if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 20, 'analytics-summary'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/analytics-summary' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/analytics-summary' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  const url = new URL(req.url)
  const rawDays = Number(url.searchParams.get('days'))
  const days =
    Number.isFinite(rawDays) && rawDays > 0 ? Math.min(Math.floor(rawDays), MAX_DAYS) : DEFAULT_DAYS

  const pool = getPgPool()
  // Group theo (ngày giờ VN, event) — dùng timezone Asia/Ho_Chi_Minh ngay trong SQL để khớp
  // đúng ranh giới ngày hiển thị cho admin (giờ VN), không phải UTC.
  const { rows } = await pool.query<DailyRow>(
    `select
       to_char(created_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD') as day,
       event,
       count(*)::int as count
     from public.analytics_events
     where created_at >= now() - ($1 || ' days')::interval
     group by 1, 2
     order by 1 asc`,
    [days],
  )

  const { rows: funnelRows } = await pool.query<DailyRow>(FUNNEL_SQL, [days])

  // Completion là event dẫn xuất chỉ đọc từ receipt server-owned, không đọc analytics client.
  const { rows: dailyPlanCompletions } = await pool.query<DailyPlanRow>(DAILY_PLAN_COMPLETION_SQL, [
    days,
  ])
  const { rows: measuredDailyPlanActions } = await pool.query<DailyPlanActionRow>(
    DAILY_PLAN_ACTION_SQL,
    [days],
  )

  const completionDailyRows: DailyRow[] = dailyPlanCompletions.map((row) => ({
    day: row.day,
    event: 'daily_plan_completion',
    count: row.count,
  }))

  const totalsByEvent: Record<string, number> = {}
  for (const row of [...rows, ...funnelRows, ...completionDailyRows]) {
    totalsByEvent[row.event] = (totalsByEvent[row.event] ?? 0) + row.count
  }

  const daily = [...rows, ...funnelRows, ...completionDailyRows].sort((a, b) =>
    a.day.localeCompare(b.day),
  )
  const dailyPlanActions = ['srs_review', 'continue_learning', 'discover_path'].flatMap((kind) => {
    const rowsForKind = measuredDailyPlanActions.filter((row) => row.actionKind === kind)
    // Một action có thể chạy song song nhiều planner version trong A/B test; giữ từng dòng
    // thay vì Map theo action rồi vô tình ghi đè số liệu phiên bản trước.
    const versions =
      rowsForKind.length > 0
        ? rowsForKind
        : [
            {
              actionKind: kind,
              plannerVersion: 'p1.1',
              impressionCount: 0,
              clickCount: 0,
              completionCount: 0,
            },
          ]
    return versions.map((measured) => {
      const supported = kind === 'srs_review'
      return {
        actionKind: kind,
        plannerVersion: measured.plannerVersion,
        impressionCount: measured.impressionCount,
        clickCount: measured.clickCount,
        completionCount: supported ? measured.completionCount : null,
        completionRate:
          supported && measured.impressionCount > 0
            ? measured.completionCount / measured.impressionCount
            : null,
      }
    })
  })
  return jsonResponse(
    { days, daily, totalsByEvent, dailyPlanCompletions, dailyPlanActions },
    200,
    allHeaders,
  )
}

export const config = { runtime: 'edge' }
