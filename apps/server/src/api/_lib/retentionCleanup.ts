// api/_lib/retentionCleanup.ts — Dọn dữ liệu đã hết hạn / quá thời hạn giữ (audit 2026-10-10, E3;
// changelog 0583). Gọi một lần mỗi ngày từ server.ts (chỉ instance PM2 số 0).
//
// Trước đợt này các bảng dưới đây chỉ có ghi, không có xoá:
//   • public.sessions            — phiên đăng nhập hết hạn (đăng xuất mới xoá, quên thì nằm mãi).
//   • public.password_resets     — token đặt lại mật khẩu đã hết hạn.
//   • public.email_verifications — mã xác thực email đã hết hạn.
//   • public.analytics_events    — sự kiện đo marketing giữ VĨNH VIỄN. Chủ dự án chốt 2026-10-10:
//                                  giữ 365 ngày (đủ so sánh cùng kỳ năm trước).
// Tính đúng đắn KHÔNG phụ thuộc job này (mã/token/phiên hết hạn vẫn luôn bị code từ chối) — job
// chỉ để bảng không phình và không giữ dữ liệu cá nhân lâu hơn cần thiết.

import type { Pool } from 'pg'

/** Thời hạn giữ sự kiện analytics (ngày) — quyết định của chủ dự án, đổi là đổi chính sách dữ liệu. */
export const ANALYTICS_RETENTION_DAYS = 365

// Xoá analytics theo LÔ: lần chạy đầu có thể phải xoá rất nhiều dòng tích luỹ từ trước; một câu
// DELETE khổng lồ dễ chạm `statement_timeout` 60s (packages/core-db/pgPool.ts) và giữ khoá lâu.
const ANALYTICS_DELETE_BATCH = 5_000
// Chặn trên số lô mỗi lần chạy (≤ 1 triệu dòng/ngày) — phần còn lại để ngày mai, không chạy vô hạn.
const ANALYTICS_MAX_BATCHES = 200

export interface AuthCleanupResult {
  sessions: number
  passwordResets: number
  emailVerifications: number
}

// Token/mã đã hết hạn được giữ thêm 1 ngày trước khi xoá — để admin còn tra được khi người dùng
// vừa báo "mã không dùng được"; cooldown gửi lại chỉ xét dòng CÒN hạn nên không bị ảnh hưởng.
// SQL viết tĩnh (không ghép chuỗi) để `npm run check:sql` PREPARE được.
export async function purgeExpiredAuthRows(pool: Pick<Pool, 'query'>): Promise<AuthCleanupResult> {
  const sessions = await pool.query('delete from public.sessions where expires < now()')
  const passwordResets = await pool.query(
    "delete from public.password_resets where expires_at < now() - interval '1 day'",
  )
  const emailVerifications = await pool.query(
    "delete from public.email_verifications where expires_at < now() - interval '1 day'",
  )
  return {
    sessions: sessions.rowCount ?? 0,
    passwordResets: passwordResets.rowCount ?? 0,
    emailVerifications: emailVerifications.rowCount ?? 0,
  }
}

export async function purgeOldAnalyticsEvents(
  pool: Pick<Pool, 'query'>,
  retentionDays: number = ANALYTICS_RETENTION_DAYS,
): Promise<{ deleted: number }> {
  let deleted = 0
  for (let batch = 0; batch < ANALYTICS_MAX_BATCHES; batch++) {
    const { rowCount } = await pool.query(
      `delete from public.analytics_events
        where id in (select id from public.analytics_events
                      where created_at < now() - make_interval(days => $1::int)
                      limit $2)`,
      [retentionDays, ANALYTICS_DELETE_BATCH],
    )
    deleted += rowCount ?? 0
    if ((rowCount ?? 0) < ANALYTICS_DELETE_BATCH) break
  }
  return { deleted }
}
