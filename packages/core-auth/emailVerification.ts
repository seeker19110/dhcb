// api/_lib/emailVerification.ts — Xác thực email bằng mã 6 chữ số gửi qua mail.
//
// Mục đích: chống đăng ký bằng email giả/dùng-một-lần để cày thưởng mời bạn. Chỉ tài khoản đã
// xác thực email mới được tính thưởng referral (xem api/_lib/referral.ts).
//
// CHỦ Ý KHÔNG chặn học khi chưa xác thực: app miễn phí cho cộng đồng, bắt xác thực mới được
// dùng sẽ chặn cả người học thật (email nhập sai, mail vào spam, học sinh không rành). Xác thực
// chỉ mở khoá phần THƯỞNG — đúng chỗ có tiền thật, không cản đường người học.

import { createHash, randomInt } from 'node:crypto'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import type { MailStatus } from '@dhcb/core-http/mailer'
import { sendMailWithQuota } from '@dhcb/core-http/mailQuota'

// Mã sống 15 phút — đủ để mở mail, đủ ngắn để mã lộ không dùng được lâu.
const CODE_TTL_MS = 15 * 60 * 1000
// Tối đa 5 lần nhập sai cho mỗi mã (6 chữ số = 1 triệu khả năng; 5 lần là quá đủ cho người thật).
const MAX_ATTEMPTS = 5
// Chặn bấm "gửi lại" dồn dập — mỗi lần gửi tốn tiền mail và làm phiền người dùng.
const RESEND_COOLDOWN_MS = 60 * 1000

function hashCode(userId: string, email: string, code: string): string {
  // Ràng buộc mã vào đúng người + hộp thư. Mã cũ trước bản vá cần được gửi lại.
  return createHash('sha256')
    .update(JSON.stringify([userId, email.toLowerCase(), code]))
    .digest('hex')
}

function generateCode(): string {
  // randomInt của node:crypto — ngẫu nhiên an toàn, KHÔNG dùng Math.random cho mã bảo mật.
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

export type SendResult =
  | { ok: true; mail: MailStatus }
  | { ok: false; reason: 'already_verified' | 'cooldown' | 'user_not_found' }

/**
 * Sinh mã mới và gửi tới email của user. Ghi đè mã cũ nếu có.
 */
export async function sendVerificationCode(userId: string): Promise<SendResult> {
  const pool = getPgPool()

  const prepared = await withTransaction(
    pool,
    async (
      client,
    ): Promise<{ email: string; code: string } | Exclude<SendResult, { ok: true }>> => {
      const { rows } = await client.query<{ email: string; email_verified: Date | null }>(
        'select email, email_verified from public.users where id = $1 for update',
        [userId],
      )
      const user = rows[0]
      if (!user) return { ok: false, reason: 'user_not_found' }
      if (user.email_verified) return { ok: false, reason: 'already_verified' }

      // Chặn gửi lại quá nhanh — kiểm tra ở DB (nguồn sự thật) chứ không tin client.
      const { rows: existing } = await client.query<{ last_sent_at: Date }>(
        'select last_sent_at from public.email_verifications where user_id = $1',
        [userId],
      )
      const lastSent = existing[0]?.last_sent_at
      if (lastSent && Date.now() - new Date(lastSent).getTime() < RESEND_COOLDOWN_MS) {
        return { ok: false, reason: 'cooldown' }
      }

      const code = generateCode()
      const expiresAt = new Date(Date.now() + CODE_TTL_MS)

      await client.query(
        `insert into public.email_verifications (user_id, code_hash, expires_at, attempts, last_sent_at)
     values ($1, $2, $3, 0, now())
     on conflict (user_id) do update set
       code_hash = excluded.code_hash,
       expires_at = excluded.expires_at,
       attempts = 0,
       last_sent_at = now()`,
        [userId, hashCode(userId, user.email, code), expiresAt],
      )

      return { email: user.email, code }
    },
  )
  if ('ok' in prepared) return prepared
  const { email, code } = prepared

  const mail = await sendMailWithQuota({
    to: email,
    subject: `${code} là mã xác thực Đồng Hành Cùng Bạn`,
    text: `Mã xác thực của bạn là: ${code}\n\nMã có hiệu lực trong 15 phút.\nNếu bạn không đăng ký tài khoản, hãy bỏ qua email này.`,
    html: `<p>Mã xác thực của bạn là:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:16px 0">${code}</p>
<p>Mã có hiệu lực trong <strong>15 phút</strong>.</p>
<p style="color:#666;font-size:13px">Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.</p>`,
  })

  // Vẫn trả ok:true kể cả khi gửi lỗi, vì mã ĐÃ được tạo hợp lệ trong DB. Trạng thái gửi trả
  // kèm để nơi gọi báo ĐÚNG tình trạng cho người dùng thay vì báo "đã gửi" giả — đặc biệt
  // mail='rejected' nghĩa là địa chỉ không nhận được thư, gần như chắc chắn gõ sai email.
  return { ok: true, mail: mail.status }
}

export type VerifyResult =
  { ok: true } | { ok: false; reason: 'no_code' | 'expired' | 'too_many_attempts' | 'wrong_code' }

/**
 * Kiểm tra mã người dùng nhập. Đúng → đánh dấu users.email_verified và xoá mã.
 */
export async function verifyCode(userId: string, rawCode: string): Promise<VerifyResult> {
  const pool = getPgPool()
  const code = rawCode.trim()

  return withTransaction(pool, async (client): Promise<VerifyResult> => {
    // Khóa cùng hàng với changeEmail/sendVerificationCode để không đọc mã/email lệch phiên bản.
    const { rows: users } = await client.query<{ email: string }>(
      'select email from public.users where id = $1 for update',
      [userId],
    )
    const user = users[0]
    if (!user) return { ok: false, reason: 'no_code' }
    const { rows } = await client.query<{
      code_hash: string
      expires_at: Date
      attempts: number
    }>(
      'select code_hash, expires_at, attempts from public.email_verifications where user_id = $1',
      [userId],
    )
    const record = rows[0]
    if (!record) return { ok: false, reason: 'no_code' }

    if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: 'too_many_attempts' }
    if (new Date(record.expires_at).getTime() <= Date.now()) return { ok: false, reason: 'expired' }

    if (hashCode(userId, user.email, code) !== record.code_hash) {
      // Đếm số lần sai NGAY tại DB (atomic) — 2 request song song không thể cùng lách qua ngưỡng.
      await client.query(
        'update public.email_verifications set attempts = attempts + 1 where user_id = $1',
        [userId],
      )
      return { ok: false, reason: 'wrong_code' }
    }

    // Đúng mã: đánh dấu đã xác thực + xoá mã (dùng 1 lần).
    await client.query('update public.users set email_verified = now() where id = $1', [userId])
    await client.query('delete from public.email_verifications where user_id = $1', [userId])

    return { ok: true }
  })
}

export async function isEmailVerified(userId: string): Promise<boolean> {
  const pool = getPgPool()
  const { rows } = await pool.query<{ email_verified: Date | null }>(
    'select email_verified from public.users where id = $1',
    [userId],
  )
  return rows[0]?.email_verified != null
}
