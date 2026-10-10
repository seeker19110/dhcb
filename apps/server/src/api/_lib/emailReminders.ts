// api/_lib/emailReminders.ts — Tự động gửi Email Nhắc Nhở Thông Minh (Smart Email Reminders)
// cho các học viên chưa học hôm nay, không đăng ký Web Push, và đang trong cooldown 3 ngày.

import { getPgPool } from '@dhcb/core-db/pgPool'
import { vnDateStr, addDays } from '@dhcb/core-db/date'
import { sendMailWithQuota } from '@dhcb/core-http/mailQuota'
import {
  pickReminderMessage,
  computeStreakAtRisk,
  computeWeeklyDaysDone,
  type ReminderMessage,
} from './reminderContent.js'

const EMAIL_COOLDOWN_DAYS = 3 // Chỉ gửi nhắc email tối đa 1 lần mỗi 3 ngày
const ACTIVE_LOOKBACK_DAYS = 14 // Chỉ nhắc học viên có hoạt động trong 14 ngày gần nhất
const DEFAULT_WEEKLY_GOAL = 5

export interface EmailReminderResult {
  sent: number
  /** Không gửi vì lý do bình thường: hết hạn mức mail ngày, địa chỉ bị máy chủ nhận từ chối. */
  skipped: number
  /** Gửi HỎNG vì hạ tầng (SMTP lỗi/chưa cấu hình) — tách khỏi `skipped` để log thấy được. */
  failed: number
}

export async function sendEmailReminders(): Promise<EmailReminderResult> {
  const pool = getPgPool()
  const today = vnDateStr()

  // 1. Tìm các user_id đã học hôm nay
  const { rows: studiedRows } = await pool.query<{ user_id: string }>(
    `select distinct user_id from public.daily_usage
     where day = $1 and (chat_count > 0 or writing_count > 0 or speaking_count > 0 or stt_count > 0 or learn_count > 0)`,
    [today],
  )
  const studiedUserIds = new Set(studiedRows.map((r) => r.user_id))

  // 2. Tìm tất cả user có hoạt động trong 14 ngày qua
  const since = vnDateStr(new Date(Date.now() - ACTIVE_LOOKBACK_DAYS * 86_400_000))
  const { rows: activeRows } = await pool.query<{ user_id: string }>(
    `select distinct user_id from public.daily_usage
     where day >= $1 and day < $2 and (chat_count > 0 or writing_count > 0 or speaking_count > 0 or stt_count > 0 or learn_count > 0)`,
    [since, today],
  )
  const activeUserIds = activeRows.map((r) => r.user_id).filter((uid) => !studiedUserIds.has(uid))

  if (activeUserIds.length === 0) {
    return { sent: 0, skipped: 0, failed: 0 }
  }

  // 3. Lọc bỏ các user đã có Web Push subscription (họ đã nhận push rồi, không gửi email trùng)
  const { rows: pushSubs } = await pool.query<{ user_id: string }>(
    'select distinct user_id from public.push_subscriptions where user_id = any($1::uuid[])',
    [activeUserIds],
  )
  const usersWithPush = new Set(pushSubs.map((r) => r.user_id))
  const targetUserIds = activeUserIds.filter((uid) => !usersWithPush.has(uid))

  if (targetUserIds.length === 0) {
    return { sent: 0, skipped: 0, failed: 0 }
  }

  // 4. Lọc tiếp theo cooldown 3 ngày của email reminder
  const cooldownLimit = new Date(Date.now() - EMAIL_COOLDOWN_DAYS * 86_400_000)
  const { rows: recentReminders } = await pool.query<{ user_id: string }>(
    'select user_id from public.email_reminders where last_sent_at >= $1',
    [cooldownLimit],
  )
  const usersInCooldown = new Set(recentReminders.map((r) => r.user_id))
  const finalUserIds = targetUserIds.filter((uid) => !usersInCooldown.has(uid))

  if (finalUserIds.length === 0) {
    return { sent: 0, skipped: 0, failed: 0 }
  }

  // 5. Đọc thông tin email + dữ liệu tiến độ để cá nhân hóa nội dung email
  const { rows: userEmails } = await pool.query<{ id: string; email: string }>(
    'select id, email from public.users where id = any($1::uuid[]) and email_verified is not null',
    [finalUserIds],
  )
  if (userEmails.length === 0) {
    return { sent: 0, skipped: 0, failed: 0 }
  }

  const userEmailMap = new Map(userEmails.map((u) => [u.id, u.email]))
  const finalVerifiedUserIds = userEmails.map((u) => u.id)

  // Đọc learning progress và recent daily usage để tính toán streak & srs & weekly goals
  const lookbackStart = addDays(today, -(ACTIVE_LOOKBACK_DAYS - 1))
  const [recentUsageResult, progressResult] = await Promise.all([
    pool.query<{
      user_id: string
      day: string
      chat_count: number | null
      writing_count: number | null
      speaking_count: number | null
      stt_count: number | null
      learn_count: number | null
    }>(
      `select user_id, day, chat_count, writing_count, speaking_count, stt_count, learn_count
       from public.daily_usage
       where user_id = any($1::uuid[]) and day >= $2 and day < $3`,
      [finalVerifiedUserIds, lookbackStart, today],
    ),
    pool.query<{
      user_id: string
      srs: Record<string, { due?: number }> | null
      weekly_goal: { goal?: number } | null
    }>(
      'select user_id, srs, weekly_goal from english.learning_progress where user_id = any($1::uuid[])',
      [finalVerifiedUserIds],
    ),
  ])

  const activeDaysByUser = new Map<string, Set<string>>()
  for (const r of recentUsageResult.rows) {
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

  const progressByUser = new Map(progressResult.rows.map((p) => [p.user_id, p]))

  let sent = 0
  let skipped = 0
  let failed = 0
  const nowMs = Date.now()

  for (const uid of finalVerifiedUserIds) {
    const email = userEmailMap.get(uid)
    if (!email) {
      skipped++
      continue
    }

    const activeDays = activeDaysByUser.get(uid) ?? new Set<string>()
    const progress = progressByUser.get(uid)
    const srsDue = Object.values(progress?.srs ?? {}).filter(
      (c) => typeof c?.due === 'number' && c.due <= nowMs,
    ).length
    const weeklyGoal =
      typeof progress?.weekly_goal?.goal === 'number'
        ? progress.weekly_goal.goal
        : DEFAULT_WEEKLY_GOAL

    const msg: ReminderMessage = pickReminderMessage({
      streakDaysAtRisk: computeStreakAtRisk(activeDays, today),
      srsDue,
      weeklyGoal,
      weeklyDaysDone: computeWeeklyDaysDone(activeDays, today),
      challengeActive: false, // email reminder không kiểm tra challenge để giữ đơn giản
    })

    // Gửi email nhắc học thông minh
    const mailResult = await sendMailWithQuota({
      to: email,
      subject: `📚 [Gia sư AI] ${msg.title}`,
      text: `${msg.body}\n\nĐăng nhập ngay để tiếp tục lộ trình học của bạn: https://www.donghanhcungban.org${msg.url}`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e4e4e7; rounded: 12px;">
          <h2 style="color: #10b981; margin-top: 0;">${msg.title}</h2>
          <p style="font-size: 14px; color: #3f3f46; line-height: 1.6;">${msg.body}</p>
          <div style="margin-top: 24px; text-align: center;">
            <a href="https://www.donghanhcungban.org${msg.url}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">
              Vào Học Ngay
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 24px 0;" />
          <p style="font-size: 11px; color: #a1a1aa; text-align: center;">
            Thư nhắc học tự động từ Đồng Hành Cùng Bạn. Bạn nhận được thư này vì bạn đã đăng ký tài khoản học tiếng Anh.
          </p>
        </div>
      `,
    })

    if (mailResult.status === 'sent') {
      sent++
      // Cập nhật mốc thời gian đã gửi email nhắc nhở. Lỗi CSDL ở đây KHÔNG được dừng cả vòng
      // (audit 2026-10-10, E1.9): thư đã đi rồi, người sau vẫn phải được nhắc — chỉ ghi log.
      try {
        await pool.query(
          `insert into public.email_reminders (user_id, last_sent_at)
           values ($1, now())
           on conflict (user_id) do update set last_sent_at = now()`,
          [uid],
        )
      } catch (err) {
        console.error('[reminder:email] đã gửi nhưng không ghi được mốc cooldown:', uid, err)
      }
    } else if (mailResult.status === 'error' || mailResult.status === 'not_configured') {
      failed++
    } else {
      skipped++
    }
  }

  return { sent, skipped, failed }
}
