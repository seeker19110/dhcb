// Đổi mật khẩu khi đã đăng nhập: chứng minh biết mật khẩu cũ, CAS chống ghi đè,
// đổi hash + vô hiệu hoá link reset + thu hồi MỌI phiên trong cùng giao dịch.
import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import { hashPassword, verifyPassword } from './authService.js'

export type ChangePasswordResult =
  | { ok: true }
  | {
      ok: false
      reason: 'wrong_password' | 'no_password' | 'same_password' | 'changed_concurrently'
    }

export async function getPasswordStatus(userId: string): Promise<boolean | null> {
  const { rows } = await getPgPool().query<{ has_password: boolean }>(
    'select (password_hash is not null) as has_password from public.users where id = $1',
    [userId],
  )
  return rows[0]?.has_password ?? null
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  const pool = getPgPool()
  const { rows } = await pool.query<{ password_hash: string | null }>(
    'select password_hash from public.users where id = $1',
    [userId],
  )
  const oldHash = rows[0]?.password_hash
  if (!oldHash) return { ok: false, reason: 'no_password' }
  if (!(await verifyPassword(currentPassword, oldHash)))
    return { ok: false, reason: 'wrong_password' }
  if (await verifyPassword(newPassword, oldHash)) return { ok: false, reason: 'same_password' }
  const newHash = await hashPassword(newPassword)

  return withTransaction(pool, async (client): Promise<ChangePasswordResult> => {
    // Không khoá dòng trong lúc bcrypt đang chạy. Compare-and-swap bảo đảm mật khẩu vừa
    // được reset/đổi ở một yêu cầu khác KHÔNG bị mật khẩu cũ ghi đè.
    const updated = await client.query<{ id: string }>(
      `update public.users set password_hash = $1
       where id = $2 and password_hash = $3 returning id`,
      [newHash, userId, oldHash],
    )
    if (!updated.rows[0]) return { ok: false, reason: 'changed_concurrently' }
    await client.query('delete from public.password_resets where user_id = $1', [userId])
    await client.query('delete from public.sessions where user_id = $1', [userId])
    return { ok: true }
  })
}
