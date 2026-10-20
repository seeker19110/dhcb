// api/_lib/friends.ts — Kết bạn qua mã/URL/QR cá nhân (nền tảng cho chat 1-1, xem
// docs kế hoạch chat trong PROGRESS.md). KHÔNG có luồng gửi/chấp nhận lời mời: chia sẻ
// link/QR đã là hành động chủ động của người mời, người quét xác nhận 1 lần là thành bạn
// ngay lập tức (2 chiều, đối xứng — không phân biệt ai "gửi" ai "nhận").

import { randomInt } from 'node:crypto'
import { getPgPool } from '@dhcb/core-db/pgPool'

// Bộ ký tự sinh mã: bỏ 0/O/1/I/L để người dùng đọc/gõ lại không nhầm — giống referral.ts.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 8 // dài hơn referral_code (6) vì friend_code còn được nhúng vào URL công khai
const MAX_CODE_ATTEMPTS = 8

// randomInt của node:crypto — ngẫu nhiên an toàn, KHÔNG dùng Math.random (audit 2026-10-20,
// F-001). Mã kết bạn là "chìa khoá" công khai: ai có mã là kết bạn được, nên không được để
// suy ra mã của người khác từ trạng thái xorshift128+ của V8. Cùng quy ước với referral.ts,
// emailVerification.ts, companionLinkService.ts, sepay.ts.
function randomCode(): string {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  }
  return out
}

/** Sắp cặp user_id theo thứ tự CHUỖI JS ổn định — dùng làm khoá duy nhất 1 dòng/1 cặp bạn bè. */
function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}

/**
 * Lấy mã kết bạn của user, sinh mới nếu chưa có (sinh lười, retry khi đụng unique constraint).
 */
export async function ensureFriendCode(userId: string): Promise<string> {
  const pool = getPgPool()

  const { rows } = await pool.query<{ friend_code: string | null }>(
    'select friend_code from public.profiles where id = $1',
    [userId],
  )
  const existing = rows[0]?.friend_code
  if (existing) return existing

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = randomCode()
    try {
      const { rows: updated } = await pool.query<{ friend_code: string }>(
        `insert into public.profiles (id, friend_code) values ($1, $2)
         on conflict (id) do update set friend_code = excluded.friend_code
         where public.profiles.friend_code is null
         returning friend_code`,
        [userId, code],
      )
      if (updated[0]?.friend_code) return updated[0].friend_code

      const { rows: reread } = await pool.query<{ friend_code: string | null }>(
        'select friend_code from public.profiles where id = $1',
        [userId],
      )
      if (reread[0]?.friend_code) return reread[0].friend_code
    } catch (err) {
      // 23505 = unique_violation: mã trùng người khác → thử mã khác.
      if ((err as { code?: string }).code !== '23505') throw err
    }
  }

  throw new Error('Không sinh được mã kết bạn sau nhiều lần thử')
}

export interface FriendUserSummary {
  id: string
  name: string
}

/** Tra người dùng theo mã kết bạn — dùng để hiện xác nhận trước khi bấm "Kết bạn". */
export async function findUserByFriendCode(rawCode: string): Promise<FriendUserSummary | null> {
  const pool = getPgPool()
  const code = rawCode.trim().toUpperCase()
  const { rows } = await pool.query<{ id: string; name: string | null }>(
    'select id, name from public.profiles where friend_code = $1',
    [code],
  )
  const row = rows[0]
  if (!row) return null
  return { id: row.id, name: row.name ?? 'Người dùng' }
}

export type AddFriendResult =
  | { ok: true; alreadyFriends: boolean; friend: FriendUserSummary }
  | { ok: false; reason: 'code_not_found' | 'self_add' }

/** Kết bạn bằng mã của người khác — idempotent, an toàn gọi lại nhiều lần. */
export async function addFriendByCode(userId: string, rawCode: string): Promise<AddFriendResult> {
  const pool = getPgPool()
  const target = await findUserByFriendCode(rawCode)
  if (!target) return { ok: false, reason: 'code_not_found' }
  if (target.id === userId) return { ok: false, reason: 'self_add' }

  const [a, b] = orderPair(userId, target.id)
  const { rowCount } = await pool.query(
    `insert into public.friendships (user_id_a, user_id_b) values ($1, $2)
     on conflict (user_id_a, user_id_b) do nothing`,
    [a, b],
  )
  return { ok: true, alreadyFriends: rowCount === 0, friend: target }
}

/** Danh sách bạn bè hiện tại của user (không phân trang — quy mô nhỏ ở giai đoạn 1). */
export async function listFriends(userId: string): Promise<FriendUserSummary[]> {
  const pool = getPgPool()
  const { rows } = await pool.query<{ id: string; name: string | null }>(
    `select p.id, p.name
     from public.friendships f
     join public.profiles p
       on p.id = case when f.user_id_a = $1 then f.user_id_b else f.user_id_a end
     where f.user_id_a = $1 or f.user_id_b = $1
     order by f.created_at desc`,
    [userId],
  )
  return rows.map((r) => ({ id: r.id, name: r.name ?? 'Người dùng' }))
}

/** Huỷ kết bạn — đối xứng, ai gỡ cũng được, không cần bên kia đồng ý. */
export async function removeFriend(userId: string, otherUserId: string): Promise<void> {
  const pool = getPgPool()
  const [a, b] = orderPair(userId, otherUserId)
  await pool.query('delete from public.friendships where user_id_a = $1 and user_id_b = $2', [a, b])
}

/** Kiểm tra 2 user đã là bạn chưa — dùng để chặn tạo phòng chat DM giữa người lạ. */
export async function areFriends(userIdA: string, userIdB: string): Promise<boolean> {
  const pool = getPgPool()
  const [a, b] = orderPair(userIdA, userIdB)
  const { rows } = await pool.query(
    'select 1 from public.friendships where user_id_a = $1 and user_id_b = $2',
    [a, b],
  )
  return rows.length > 0
}
