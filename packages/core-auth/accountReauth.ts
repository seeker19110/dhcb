// packages/core-auth/accountReauth.ts — XÁC MINH LẠI danh tính trước thao tác không hoàn tác
// (xoá tài khoản) và thao tác lấy toàn bộ dữ liệu ra ngoài (xuất dữ liệu).
//
// Đặc tả: docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md §① (changelog 0533).
//
// Vì sao cần, dù người dùng ĐÃ đăng nhập: kẻ lấy được cookie phiên (máy mượn, XSS, mã độc trình
// duyệt) chưa chắc biết mật khẩu hay đăng nhập được Google của nạn nhân. Đòi bằng chứng đó NGAY
// trong request xoá/xuất thì cookie bị đánh cắp không đủ để xoá sạch hay hút hết dữ liệu.
//
// Hai cách, đúng cơ chế đăng nhập THẬT của app:
//   - Mật khẩu hiện tại (bcrypt, `verifyPassword`).
//   - Google: access token VỪA lấy qua popup GIS (`initTokenClient` — `packages/core-ui/clientAuth.ts`),
//     `sub` phải là identity Google của CHÍNH người này, và token phải được cấp trong ≤ 10 phút.
// Facebook/Apple/Microsoft: KHÔNG hỗ trợ (giao diện không có nút đăng nhập các nhà cung cấp này)
// ⇒ `unavailable`, không có đường tắt bỏ qua xác minh.
//
// Lớp 2FA (nếu người dùng bật) do nơi gọi kiểm thêm bằng `hasStepUp`/`verifyTwoFactor` sẵn có.

import type { Pool } from 'pg'
import type { Reauth, ReauthMethod } from '@dhcb/core-contracts/account'
import { inspectGoogleAccessToken, verifyPassword } from './authService.js'

/** Token Google sống 3600 giây kể từ lúc cấp. */
export const GOOGLE_TOKEN_LIFETIME_SEC = 3600
/** Chấp nhận token cấp trong vòng 10 phút — đủ cho người dùng bấm qua popup, không đủ cho token cũ. */
export const GOOGLE_REAUTH_MAX_AGE_SEC = 10 * 60

export type ReauthOutcome =
  | { ok: true; method: ReauthMethod }
  | {
      ok: false
      /**
       * `unavailable` — tài khoản không có cách xác minh này (vd chỉ đăng nhập Google mà gửi mật
       * khẩu). `failed` — sai mật khẩu / token không hợp lệ / token của người khác. `stale` —
       * token Google hợp lệ nhưng cấp đã lâu.
       */
      reason: 'unavailable' | 'failed' | 'stale'
    }

interface AccountAuthRow {
  password_hash: string | null
  google_sub: string | null
}

async function readAuthRow(pool: Pool, userId: string): Promise<AccountAuthRow | null> {
  const { rows } = await pool.query<AccountAuthRow>(
    `select u.password_hash,
            (select i.provider_user_id from public.identities i
              where i.user_id = u.id and i.provider = 'google'
              order by i.linked_at limit 1) as google_sub
       from public.users u
      where u.id = $1`,
    [userId],
  )
  return rows[0] ?? null
}

/** Các cách xác minh lại mà tài khoản này dùng được (rỗng ⇒ không thể xoá/xuất qua giao diện). */
export async function getReauthMethods(pool: Pool, userId: string): Promise<ReauthMethod[]> {
  const row = await readAuthRow(pool, userId)
  if (!row) return []
  const methods: ReauthMethod[] = []
  if (row.password_hash) methods.push('password')
  if (row.google_sub) methods.push('google')
  return methods
}

/**
 * Kiểm bằng chứng xác minh lại của `userId` (lấy từ PHIÊN, không từ client).
 *
 * Lỗi hạ tầng (CSDL) được NÉM lên — chỉ "sai bằng chứng" mới thành `{ ok: false }`. Mạng tới Google
 * hỏng thì `inspectGoogleAccessToken` trả null ⇒ `failed` (an toàn: từ chối, người dùng thử lại).
 */
export async function verifyAccountReauth(
  pool: Pool,
  userId: string,
  reauth: Reauth,
): Promise<ReauthOutcome> {
  const row = await readAuthRow(pool, userId)
  if (!row) return { ok: false, reason: 'failed' }

  if (reauth.method === 'password') {
    if (!row.password_hash) return { ok: false, reason: 'unavailable' }
    return (await verifyPassword(reauth.password, row.password_hash))
      ? { ok: true, method: 'password' }
      : { ok: false, reason: 'failed' }
  }

  // Google
  if (!row.google_sub) return { ok: false, reason: 'unavailable' }
  const info = await inspectGoogleAccessToken(reauth.accessToken)
  // Token hợp lệ nhưng là Google của NGƯỜI KHÁC ⇒ `failed` (không tiết lộ thêm gì).
  if (!info || info.googleId !== row.google_sub) return { ok: false, reason: 'failed' }
  const minRemaining = GOOGLE_TOKEN_LIFETIME_SEC - GOOGLE_REAUTH_MAX_AGE_SEC
  if (info.expiresInSec == null || info.expiresInSec < minRemaining) {
    return { ok: false, reason: 'stale' }
  }
  return { ok: true, method: 'google' }
}
