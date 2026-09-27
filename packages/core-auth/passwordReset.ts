// api/_lib/passwordReset.ts — Quên mật khẩu: gửi link reset qua email, người dùng tự điền mật
// khẩu mới. Xem migration 0011 để biết vì sao dùng token ngẫu nhiên dài thay vì mã ngắn.
//
// BẢO MẬT — 3 điểm dễ sai nhất của tính năng "quên mật khẩu" trên MỌI hệ thống:
//   1. KHÔNG được để endpoint "yêu cầu reset" lộ được email nào có tồn tại trong hệ thống
//      (dò email hàng loạt). Luôn trả về cùng 1 kết quả bất kể email có tồn tại hay không.
//   2. KHÔNG được để THỜI GIAN PHẢN HỒI lộ điều tương tự — nhánh "email tồn tại" (phải hash mật
//      khẩu... không, phải gửi mail, ghi DB) chậm hơn hẳn nhánh "không tồn tại" (chỉ 1 SELECT
//      rồi dừng). Đo độ trễ vẫn dò được dù response body giống hệt nhau. App này nhiều trẻ em
//      dùng nên khoá luôn kênh rò rỉ này — ép CẢ HAI nhánh chờ đủ MIN_RESPONSE_MS mới trả lời.
//   3. Sau khi đổi mật khẩu thành công, PHẢI thu hồi toàn bộ session cũ — nếu không, kẻ tấn công
//      chiếm được máy đang đăng nhập sẵn (session cũ) vẫn giữ được quyền truy cập dù chủ tài
//      khoản vừa đổi mật khẩu vì lo bị lộ.

import { randomBytes, createHash } from 'node:crypto'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import { hashPassword } from './authService.js'
import { sendMailWithQuota } from '@dhcb/core-http/mailQuota'

const TOKEN_TTL_MS = 30 * 60 * 1000 // 30 phút — dài hơn mã xác thực email vì phải mở mail rồi mới bấm link, không gõ tay ngay.
const RESEND_COOLDOWN_MS = 60 * 1000

// Sàn thời gian phản hồi cho MỌI nhánh của requestPasswordReset — che giấu chênh lệch thời gian
// xử lý giữa "email tồn tại" (chậm: query thêm + gửi mail) và "không tồn tại"/"cooldown" (nhanh:
// dừng sớm). Đặt cao hơn thời gian nhánh chậm nhất trong điều kiện bình thường; nếu nhánh chậm
// vượt mốc này thì không che được nữa, nhưng đó là tình huống hạ tầng bất thường, không phải
// điểm rò rỉ có thể khai thác lặp lại ổn định.
const MIN_RESPONSE_MS = 400

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex')
}

function siteUrl(): string {
  return (
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    'https://www.donghanhcungban.org'
  ).replace(/\/$/, '')
}

/**
 * Yêu cầu reset mật khẩu. LUÔN trả về cùng 1 kết quả bất kể email có tồn tại hay không, để
 * KHÔNG lộ email nào có tài khoản (chống dò email hàng loạt) — xem chú thích bảo mật ở đầu file.
 *
 * Bọc ngoài `doRequestPasswordReset` để ép SÀN THỜI GIAN cố định (MIN_RESPONSE_MS) cho mọi
 * nhánh — nếu chỉ đồng bộ nội dung trả về mà bỏ qua thời gian, kẻ dò email vẫn phân biệt được
 * "tồn tại" (chậm hơn vì phải gửi mail) và "không tồn tại" (trả lời gần như ngay lập tức).
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const startedAt = Date.now()
  try {
    await doRequestPasswordReset(rawEmail)
  } finally {
    const elapsed = Date.now() - startedAt
    if (elapsed < MIN_RESPONSE_MS) await sleep(MIN_RESPONSE_MS - elapsed)
  }
}

async function doRequestPasswordReset(rawEmail: string): Promise<void> {
  const pool = getPgPool()
  const email = rawEmail.trim().toLowerCase()

  const { rows } = await pool.query<{ id: string; password_hash: string | null }>(
    'select id, password_hash from public.users where email = $1',
    [email],
  )
  const user = rows[0]
  // Tài khoản không tồn tại, hoặc chỉ đăng nhập Google (không có mật khẩu để reset) — âm thầm
  // dừng lại, KHÔNG báo lỗi khác với trường hợp thành công (chống dò email).
  if (!user || !user.password_hash) return

  // Cooldown chống spam nút "gửi lại" — kiểm tra token GẦN NHẤT còn hiệu lực của user này.
  const { rows: recent } = await pool.query<{ created_at: Date }>(
    `select created_at from public.password_resets
     where user_id = $1 and used_at is null and expires_at > now()
     order by created_at desc limit 1`,
    [user.id],
  )
  if (recent[0] && Date.now() - new Date(recent[0].created_at).getTime() < RESEND_COOLDOWN_MS) {
    return
  }

  const rawToken = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS)

  await pool.query(
    `insert into public.password_resets (user_id, token_hash, expires_at) values ($1, $2, $3)`,
    [user.id, hashToken(rawToken), expiresAt],
  )

  const link = `${siteUrl()}/reset-password?token=${rawToken}`
  await sendMailWithQuota({
    to: email,
    subject: 'Đặt lại mật khẩu — Đồng Hành Cùng Bạn',
    text: `Bấm vào link sau để đặt mật khẩu mới (hết hạn sau 30 phút):\n${link}\n\nNếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này — mật khẩu hiện tại vẫn an toàn.`,
    html: `<p>Bấm vào nút bên dưới để đặt mật khẩu mới. Link có hiệu lực trong <strong>30 phút</strong>.</p>
<p><a href="${link}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Đặt mật khẩu mới</a></p>
<p style="color:#666;font-size:13px">Nếu nút không bấm được, dán link này vào trình duyệt:<br>${link}</p>
<p style="color:#666;font-size:13px">Nếu bạn không yêu cầu đổi mật khẩu, hãy bỏ qua email này — mật khẩu hiện tại vẫn an toàn.</p>`,
  })
}

export type ResetPasswordResult =
  { ok: true } | { ok: false; reason: 'invalid_or_expired' | 'already_used' }

/**
 * Xác nhận token + đặt mật khẩu mới. THU HỒI toàn bộ session cũ sau khi đổi thành công (xem
 * chú thích bảo mật ở đầu file) — nếu không, phiên đăng nhập cũ (có thể đã bị kẻ khác chiếm)
 * vẫn giữ được quyền truy cập.
 */
export async function resetPassword(
  rawToken: string,
  newPassword: string,
): Promise<ResetPasswordResult> {
  const pool = getPgPool()
  const tokenHash = hashToken(rawToken)

  const { rows } = await pool.query<{
    id: string
    user_id: string
    expires_at: Date
    used_at: Date | null
  }>('select id, user_id, expires_at, used_at from public.password_resets where token_hash = $1', [
    tokenHash,
  ])
  const record = rows[0]
  if (!record) return { ok: false, reason: 'invalid_or_expired' }
  if (record.used_at) return { ok: false, reason: 'already_used' }
  if (new Date(record.expires_at).getTime() <= Date.now()) {
    return { ok: false, reason: 'invalid_or_expired' }
  }

  const passwordHash = await hashPassword(newPassword)

  return withTransaction(pool, async (client): Promise<ResetPasswordResult> => {
    // UPDATE có điều kiện giữ khóa dòng đến commit: hai request cùng token chỉ một request
    // nhận được dòng. Đổi mật khẩu và thu hồi phiên thất bại sẽ hoàn tác cả lần tiêu thụ này.
    const consumed = await client.query<{ user_id: string }>(
      `update public.password_resets set used_at = now()
       where id = $1 and used_at is null and expires_at > now()
       returning user_id`,
      [record.id],
    )
    if (!consumed.rows[0]) return { ok: false, reason: 'invalid_or_expired' }
    await client.query('update public.users set password_hash = $1 where id = $2', [
      passwordHash,
      consumed.rows[0].user_id,
    ])
    await client.query('delete from public.sessions where user_id = $1', [consumed.rows[0].user_id])
    return { ok: true }
  })
}
