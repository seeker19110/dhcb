// api/push.ts — Quản lý Web Push subscriptions + gửi notification nhắc học
// Endpoint: POST /api/push
// Body action="subscribe"    → lưu subscription của user
//        action="unsubscribe" → xóa subscription
//        action="send-daily"  → gửi push cho tất cả users (gọi từ cron, cần CRON_SECRET)

import webpush from 'web-push'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  isAllowedPushEndpoint,
  PushSubscriptionSchema,
} from '@dhcb/core-contracts/pushSubscription'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  logSecurityEvent,
  validateAuth,
} from '@dhcb/core-auth/security'
import { secretMatches } from '@dhcb/core-auth/secretCompare'
import { getClientIp } from '@dhcb/core-http/http'
import { validateBody } from '@dhcb/core-http/validation'
import { vnDateStr, addDays } from '@dhcb/core-db/date'
import {
  pickReminderMessage,
  computeStreakAtRisk,
  computeWeeklyDaysDone,
  type ReminderMessage,
} from '../_lib/reminderContent.js'

// Chỉ validate phần `subscription` (bắt buộc + đúng kiểu dữ liệu + trần độ dài) — action/
// remindHour/hour/secret giữ nguyên cách kiểm tra tay hiện có (có typeof guard trước khi dùng).
// Lỗi field nào cũng trả về CÙNG 1 message (giữ đúng hành vi cũ) — xem nơi gọi bên dưới.
// Host của `endpoint` kiểm riêng (isAllowedPushEndpoint) khi ĐĂNG KÝ và khi GỬI — chống SSRF,
// xem packages/core-contracts/pushSubscription.ts.
const SubscriptionSchema = PushSubscriptionSchema

// Khoá VAPID public của cặp khoá có private key TỪNG BỊ COMMIT vào lịch sử git public (commit
// f6e0caa7, 2026-06-21 — gỡ khỏi script ngày 2026-06-27 nhưng KHÔNG xoay khoá). Ai có private key
// ký được yêu cầu push nhân danh server. Server còn dùng cặp này thì phải xoay (docs/changelog/0465).
export const LEAKED_VAPID_PUBLIC_KEYS: readonly string[] = [
  'BP9nog6CutVAu3TM4KyU87JCZMydVmAgAu-tzPUWMd2uztQ1sfkPvoenQ6m6xMxKJ4cQUeAUPLUfHXjvR5Xog10',
]

export function isLeakedVapidPublicKey(publicKey: string | undefined): boolean {
  return !!publicKey && LEAKED_VAPID_PUBLIC_KEYS.includes(publicKey.trim())
}

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY ?? ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? ''
const VAPID_EMAIL = process.env.VAPID_EMAIL ?? 'mailto:admin@example.com'

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE)
}

// Giờ UTC mặc định để nhắc khi người dùng chưa chọn giờ (13 UTC = 20:00 giờ VN).
const DEFAULT_REMIND_UTC_HOUR = 13

// Kiểu tối thiểu cho các hàng đọc từ Postgres trong file này — tránh `any`.
interface PushSubscriptionRow {
  user_id: string
  endpoint: string
  p256dh: string
  auth_key: string
}
interface DailyUsageRow {
  user_id: string
  chat_count: number | null
  writing_count: number | null
  speaking_count: number | null
  stt_count: number | null
  learn_count: number | null
}
// Bản có thêm `day` — dùng cho truy vấn nhiều ngày (nội dung nhắc theo ngữ cảnh,
// ② M3) khác truy vấn "đã học hôm nay" ở trên (chỉ lọc đúng 1 ngày, không cần day).
interface DailyUsageDayRow extends DailyUsageRow {
  day: string
}
interface ChallengeEntryUserRow {
  user_id: string
}
// Cột `srs`/`weekly_goal` của learning_progress — chỉ khai kiểu tối thiểu cần dùng.
interface LearningProgressRow {
  user_id: string
  srs?: Record<string, { due?: number }> | null
  weekly_goal?: { goal?: number } | null
}

// Cửa sổ ngày để tính streak/tuần cho nội dung nhắc theo ngữ cảnh (② M3) — khớp
// mốc "14 ngày gần nhất" đặc tả nhắc tới cho phần giờ thông minh (không làm ở
// PR này) để nhất quán, đồng thời giữ chi phí truy vấn Postgres hợp lý.
const REMINDER_LOOKBACK_DAYS = 14
// PHẢI khớp DEFAULT_WEEKLY_GOAL của src/lib/weeklyGoal.ts (api/_lib không import
// từ src/lib — xem quy ước ở api/_lib/date.ts).
const DEFAULT_WEEKLY_GOAL = 5

// Cửa sổ "còn đang trong thử thách challenge gần đây" — ước lượng NỚI TAY, chỉ để chọn
// NỘI DUNG thông báo cho thân thiện hơn (không phải luật vé nghỉ chính xác của
// src/lib/challenge.ts — logic đó dùng localStorage nên không gọi được từ server).
// Ai có ít nhất 1 dòng challenge_entries trong N ngày gần nhất được nhắc bằng nội dung
// challenge; còn lại vẫn nhận thông điệp nhắc học chung như trước.
const CHALLENGE_RECENT_WINDOW_DAYS = 8

function todayStr(): string {
  return vnDateStr()
}

// Gửi thông báo "nhắc học" cho các subscription muốn được nhắc vào GIỜ này (UTC),
// nhưng BỎ QUA người đã có hoạt động học hôm nay (đã giữ streak rồi, không cần nhắc).
// Trả về { sent, skipped, expired }. Dùng chung cho cron (/api/push send-daily) và
// bộ hẹn giờ trong server.ts. Tự xoá subscription hết hạn (410/404).
export async function sendReminders(
  hour: number,
): Promise<{ sent: number; skipped: number; expired: number }> {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return { sent: 0, skipped: 0, expired: 0 }
  const pool = getPgPool()

  // Lấy các subscription tới giờ nhắc: đúng remind_hour, HOẶC chưa đặt giờ (null) thì
  // dùng giờ mặc định.
  const { rows: subs } = await (hour === DEFAULT_REMIND_UTC_HOUR
    ? pool.query<PushSubscriptionRow>(
        'select user_id, endpoint, p256dh, auth_key from public.push_subscriptions where remind_hour = $1 or remind_hour is null',
        [hour],
      )
    : pool.query<PushSubscriptionRow>(
        'select user_id, endpoint, p256dh, auth_key from public.push_subscriptions where remind_hour = $1',
        [hour],
      ))
  if (!subs.length) return { sent: 0, skipped: 0, expired: 0 }

  // Tập user đã học hôm nay → bỏ qua, khỏi nhắc.
  const userIds = [...new Set(subs.map((s) => s.user_id))]
  const { rows: usageRows } = await pool.query<DailyUsageRow>(
    `select user_id, chat_count, writing_count, speaking_count, stt_count, learn_count
       from public.daily_usage where day = $1 and user_id = any($2::uuid[])`,
    [todayStr(), userIds],
  )
  const studied = new Set<string>()
  for (const r of usageRows) {
    const total =
      (r.chat_count ?? 0) +
      (r.writing_count ?? 0) +
      (r.speaking_count ?? 0) +
      (r.stt_count ?? 0) +
      (r.learn_count ?? 0)
    if (total > 0) studied.add(r.user_id)
  }

  // Ai CHƯA học hôm nay mà gần đây có tham gia thử thách challenge → nhắc bằng nội dung
  // challenge cụ thể hơn (thân mật, gắn liền tính năng vừa quay). Best-effort: lỗi thì bỏ
  // qua, mọi người vẫn nhận thông điệp chung như trước (không vỡ tính năng nhắc học).
  const notStudiedIds = userIds.filter((id) => !studied.has(id))
  const challengeActive = new Set<string>()
  if (notStudiedIds.length > 0) {
    try {
      const since = vnDateStr(new Date(Date.now() - CHALLENGE_RECENT_WINDOW_DAYS * 86_400_000))
      const { rows: challengeRows } = await pool.query<ChallengeEntryUserRow>(
        'select user_id from english.challenge_entries where user_id = any($1::uuid[]) and day >= $2',
        [notStudiedIds, since],
      )
      for (const r of challengeRows) challengeActive.add(r.user_id)
    } catch (err) {
      console.warn(
        '[push] không đọc được challenge_entries:',
        err instanceof Error ? err.message : err,
      )
    }
  }

  // Nội dung NHẮC THEO NGỮ CẢNH (② M3) — chỉ cần tính cho người CHƯA học hôm
  // nay (người đã học không nhận nhắc, xem vòng lặp gửi bên dưới). Dùng dữ liệu
  // ĐÃ CÓ SẴN, không thêm tracking mới (xem api/_lib/reminderContent.ts).
  // Best-effort: lỗi truy vấn learning_progress/daily_usage mở rộng KHÔNG được
  // làm vỡ việc gửi — rơi về nội dung chung/challenge như cũ.
  const reminderMessages = new Map<string, ReminderMessage>()
  if (notStudiedIds.length > 0) {
    const lookbackStart = addDays(todayStr(), -(REMINDER_LOOKBACK_DAYS - 1))
    let recentUsageRows: DailyUsageDayRow[] = []
    let progressRows: LearningProgressRow[] = []
    try {
      const [recentUsageResult, progressResult] = await Promise.all([
        pool.query<DailyUsageDayRow>(
          `select user_id, day, chat_count, writing_count, speaking_count, stt_count, learn_count
             from public.daily_usage
            where user_id = any($1::uuid[]) and day >= $2 and day < $3`,
          [notStudiedIds, lookbackStart, todayStr()],
        ),
        pool.query<LearningProgressRow>(
          'select user_id, srs, weekly_goal from english.learning_progress where user_id = any($1::uuid[])',
          [notStudiedIds],
        ),
      ])
      recentUsageRows = recentUsageResult.rows
      progressRows = progressResult.rows
    } catch (err) {
      console.warn(
        '[push] không đọc được daily_usage/learning_progress mở rộng:',
        err instanceof Error ? err.message : err,
      )
    }

    const activeDaysByUser = new Map<string, Set<string>>()
    for (const r of recentUsageRows) {
      const total =
        (r.chat_count ?? 0) +
        (r.writing_count ?? 0) +
        (r.speaking_count ?? 0) +
        (r.stt_count ?? 0) +
        (r.learn_count ?? 0)
      if (total <= 0) continue
      const set = activeDaysByUser.get(r.user_id) ?? new Set<string>()
      set.add(r.day)
      activeDaysByUser.set(r.user_id, set)
    }
    const progressByUser = new Map<string, LearningProgressRow>()
    for (const r of progressRows) progressByUser.set(r.user_id, r)

    const nowMs = Date.now()
    for (const uid of notStudiedIds) {
      const activeDays = activeDaysByUser.get(uid) ?? new Set<string>()
      const progress = progressByUser.get(uid)
      // Loại thẻ `grammar:*` (dùng chung kho FSRS với từ vựng, xem srs.ts) — nội dung
      // push nói "N từ cần ôn", không nên đếm cả bài ngữ pháp vào đó (audit 2026-08-23,
      // cùng lỗi với getSRSStats() phía client).
      const srsDue = Object.entries(progress?.srs ?? {}).filter(
        ([key, c]) => !key.startsWith('grammar:') && typeof c?.due === 'number' && c.due <= nowMs,
      ).length
      const weeklyGoal =
        typeof progress?.weekly_goal?.goal === 'number'
          ? progress.weekly_goal.goal
          : DEFAULT_WEEKLY_GOAL
      reminderMessages.set(
        uid,
        pickReminderMessage({
          streakDaysAtRisk: computeStreakAtRisk(activeDays, todayStr()),
          srsDue,
          weeklyGoal,
          weeklyDaysDone: computeWeeklyDaysDone(activeDays, todayStr()),
          challengeActive: challengeActive.has(uid),
        }),
      )
    }
  }
  // Fallback nếu vì lý do gì đó thiếu message tính sẵn (không nên xảy ra —
  // pickReminderMessage() luôn trả về ít nhất nội dung chung chung).
  const fallbackPayload = JSON.stringify({
    title: '🇻🇳→🇬🇧 Tới giờ học rồi!',
    body: 'Chỉ cần vài phút mỗi ngày. Hôm nay bạn chưa học — vào học để giữ streak nhé! 🔥',
    url: '/',
  })

  let sent = 0,
    skipped = 0
  const expired: string[] = []
  await Promise.all(
    subs.map(async (row) => {
      if (studied.has(row.user_id)) {
        skipped++
        return
      }
      // Dòng cũ lưu từ trước bản vá 2026-09-27 có thể trỏ tới host bất kỳ — không bao giờ gửi.
      if (!isAllowedPushEndpoint(row.endpoint)) {
        skipped++
        return
      }
      try {
        const msg = reminderMessages.get(row.user_id)
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth_key } },
          msg ? JSON.stringify(msg) : fallbackPayload,
        )
        sent++
      } catch (err: unknown) {
        if (
          err &&
          typeof err === 'object' &&
          'statusCode' in err &&
          (err.statusCode === 410 || err.statusCode === 404)
        ) {
          expired.push(row.endpoint)
        }
      }
    }),
  )

  if (expired.length) {
    await pool.query('delete from public.push_subscriptions where endpoint = any($1::text[])', [
      expired,
    ])
  }

  return { sent, skipped, expired: expired.length }
}

/**
 * So `secret` client gửi với CRON_SECRET theo thời gian HẰNG (logic ở core-auth/secretCompare).
 * Thiếu CRON_SECRET → luôn từ chối.
 */
export function cronSecretMatches(provided: unknown): boolean {
  return secretMatches(provided, process.env.CRON_SECRET)
}

export default async function handler(req: Request): Promise<Response> {
  const cors = getCorsHeaders(req)
  const headers = { ...cors, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })

  // Endpoint này trước đây KHÔNG có rate limit nào, dù có action cầm CRON_SECRET (xoá TOÀN BỘ
  // subscription) — không có trần thì dò khoá bao nhiêu lần cũng được (vá 2026-09-27).
  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'push'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/push' })
    return new Response(JSON.stringify({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }), {
      status: 429,
      headers,
    })
  }

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return new Response(JSON.stringify({ error: 'Push chưa được cấu hình (thiếu VAPID keys)' }), {
      status: 503,
      headers,
    })
  }

  let body: Record<string, unknown>
  try {
    const parsed = await req.json()
    body = typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {}
  } catch (err) {
    console.error('[push] Invalid JSON in request body:', err)
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers })
  }
  const { action } = body

  // ── Trả VAPID public key cho frontend ────────────────────────────────────
  if (action === 'vapid-key') {
    return new Response(JSON.stringify({ publicKey: VAPID_PUBLIC }), { headers })
  }

  // ── Đăng ký / hủy đăng ký (cần auth) ────────────────────────────────────
  if (action === 'subscribe' || action === 'unsubscribe') {
    const auth = await validateAuth(req)
    if (!auth)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers })

    const subResult = validateBody(SubscriptionSchema, body.subscription)
    if (!subResult.ok) {
      return new Response(JSON.stringify({ error: 'Thiếu dữ liệu subscription' }), {
        status: 400,
        headers,
      })
    }
    const sub = subResult.data
    const pool = getPgPool()

    if (action === 'subscribe') {
      if (!isAllowedPushEndpoint(sub.endpoint)) {
        // Chỉ ghi HOST vào log (URL đầy đủ chứa token của dịch vụ push).
        let host = 'không đọc được'
        try {
          host = new URL(sub.endpoint).host
        } catch {
          // giữ nhãn mặc định
        }
        console.warn(`[push] Từ chối endpoint ngoài danh sách dịch vụ push: ${host}`)
        return new Response(JSON.stringify({ error: 'Dịch vụ push không được hỗ trợ' }), {
          status: 400,
          headers,
        })
      }
      // Lưu subscription — bước này KHÔNG được lỗi.
      const rh = body.remindHour
      const remindHour = typeof rh === 'number' && rh >= 0 && rh <= 23 ? Math.round(rh) : null
      try {
        await pool.query(
          `insert into public.push_subscriptions (user_id, endpoint, p256dh, auth_key, remind_hour)
           values ($1, $2, $3, $4, $5)
           on conflict (user_id, endpoint) do update set
             p256dh = excluded.p256dh, auth_key = excluded.auth_key,
             remind_hour = coalesce(excluded.remind_hour, public.push_subscriptions.remind_hour)`,
          [auth.userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth, remindHour],
        )
      } catch (err) {
        // Không trả thông điệp lỗi CSDL cho client (lộ cấu trúc bảng/ràng buộc).
        console.error('[push] Lỗi lưu/xoá subscription:', err)
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers,
        })
      }
      return new Response(JSON.stringify({ ok: true }), { headers })
    } else {
      try {
        await pool.query(
          'delete from public.push_subscriptions where user_id = $1 and endpoint = $2',
          [auth.userId, sub.endpoint],
        )
      } catch (err) {
        // Không trả thông điệp lỗi CSDL cho client (lộ cấu trúc bảng/ràng buộc).
        console.error('[push] Lỗi lưu/xoá subscription:', err)
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
          status: 500,
          headers,
        })
      }
      return new Response(JSON.stringify({ ok: true }), { headers })
    }
  }

  // ── Gửi push nhắc học cho người tới giờ nhắc (gọi từ cron MỖI GIỜ, cần CRON_SECRET) ──
  // body.hour (UTC 0–23): giờ cần gửi; nếu không truyền → dùng giờ UTC hiện tại.
  // Chỉ nhắc người CHƯA học hôm nay (xem sendReminders).
  if (action === 'send-daily') {
    // Bắt buộc phải có CRON_SECRET — nếu chưa cấu hình thì từ chối luôn
    if (!cronSecretMatches(body.secret)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers })
    }

    const hour =
      typeof body.hour === 'number' && body.hour >= 0 && body.hour <= 23
        ? Math.round(body.hour)
        : new Date().getUTCHours()
    const result = await sendReminders(hour)
    return new Response(JSON.stringify({ hour, ...result }), { headers })
  }

  // ── Xóa toàn bộ push subscriptions (admin, cần CRON_SECRET) ─────────────
  if (action === 'clear-all') {
    if (!cronSecretMatches(body.secret)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers })
    }
    const pool = getPgPool()
    let deleted = 0
    try {
      const result = await pool.query('delete from public.push_subscriptions')
      deleted = result.rowCount ?? 0
    } catch (err) {
      console.error('[push] Lỗi xoá toàn bộ subscription:', err)
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers,
      })
    }
    return new Response(JSON.stringify({ ok: true, deleted }), { headers })
  }

  return new Response(JSON.stringify({ error: 'Action không hợp lệ' }), { status: 400, headers })
}
