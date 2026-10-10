// api/_lib/changeEmail.ts — Đổi email của tài khoản đang đăng nhập, rồi gửi lại mã xác thực.
//
// Vì sao cần: người dùng gõ nhầm email lúc đăng ký sẽ KHÔNG BAO GIỜ nhận được mã, tức là kẹt
// vĩnh viễn (không xác thực được → không mở khoá thưởng mời bạn). Phải có đường tự sửa.
//
// BẢO MẬT (đổi email là đường chiếm tài khoản kinh điển — đổi email rồi "quên mật khẩu"):
//   • Tài khoản có mật khẩu → BẮT BUỘC nhập đúng mật khẩu hiện tại mới cho đổi. Chỉ có session
//     token (vd máy dùng chung quên đăng xuất) là KHÔNG đủ.
//   • Tài khoản chỉ đăng nhập Google (password_hash = null) → không có mật khẩu để hỏi; danh
//     tính vẫn neo vào google_id nên đổi email KHÔNG cướp được quyền đăng nhập.
//   • Email mới luôn về trạng thái CHƯA xác thực, kèm gửi mã mới.

import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import { verifyPassword } from './authService.js'
import { sendVerificationCode } from './emailVerification.js'
import type { MailStatus } from '@dhcb/core-http/mailer'

export type ChangeEmailResult =
  | { ok: true; mail: MailStatus }
  | {
      ok: false
      reason:
        'user_not_found' | 'wrong_password' | 'password_required' | 'email_taken' | 'same_email'
    }

export async function changeEmail(
  userId: string,
  rawNewEmail: string,
  password: string | null,
): Promise<ChangeEmailResult> {
  const pool = getPgPool()
  const newEmail = rawNewEmail.trim().toLowerCase()

  // Băm mật khẩu (scrypt/bcrypt — hàng trăm ms CPU) làm TRƯỚC, NGOÀI transaction (audit
  // 2026-10-10, E2.7): bản cũ băm trong lúc đang giữ `for update` trên dòng users, nên mọi request
  // khác chạm dòng này (gửi/kiểm mã xác thực…) phải xếp hàng chờ, và giữ một kết nối pool suốt
  // thời gian đó. Trong transaction chỉ kiểm lại `password_hash` KHÔNG đổi so với lúc đã kiểm.
  const { rows: before } = await pool.query<{ email: string; password_hash: string | null }>(
    'select email, password_hash from public.users where id = $1',
    [userId],
  )
  const snapshot = before[0]
  if (!snapshot) return { ok: false, reason: 'user_not_found' }
  if (snapshot.email.toLowerCase() === newEmail) return { ok: false, reason: 'same_email' }
  if (snapshot.password_hash) {
    if (!password) return { ok: false, reason: 'password_required' }
    if (!(await verifyPassword(password, snapshot.password_hash))) {
      return { ok: false, reason: 'wrong_password' }
    }
  }

  try {
    const changed = await withTransaction(
      pool,
      async (client): Promise<ChangeEmailResult | null> => {
        // Cùng thứ tự khóa với gửi/kiểm mã: luôn khóa users trước email_verifications.
        const { rows } = await client.query<{ email: string; password_hash: string | null }>(
          'select email, password_hash from public.users where id = $1 for update',
          [userId],
        )
        const user = rows[0]
        if (!user) return { ok: false, reason: 'user_not_found' }
        if (user.email.toLowerCase() === newEmail) return { ok: false, reason: 'same_email' }
        // Mật khẩu vừa bị đổi (hoặc vừa được đặt) giữa lúc kiểm và lúc khoá → mật khẩu đã kiểm
        // không còn là mật khẩu hiện tại: từ chối, người dùng nhập lại.
        if (user.password_hash !== snapshot.password_hash) {
          return { ok: false, reason: user.password_hash ? 'wrong_password' : 'user_not_found' }
        }

        await client.query(
          'update public.users set email = $1, email_verified = null where id = $2',
          [newEmail, userId],
        )
        // Đổi địa chỉ và hủy mã cũ là nguyên tử: mã hộp thư cũ không xác thực được địa chỉ mới.
        await client.query('delete from public.email_verifications where user_id = $1', [userId])
        return null
      },
    )
    if (changed) return changed
  } catch (err) {
    if ((err as { code?: string }).code === '23505') return { ok: false, reason: 'email_taken' }
    throw err
  }

  const sent = await sendVerificationCode(userId)
  return { ok: true, mail: sent.ok ? sent.mail : 'error' }
}
