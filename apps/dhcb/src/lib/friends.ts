// src/lib/friends.ts — Client cho tính năng kết bạn qua mã/URL/QR (xem api/friends.ts).

import { z } from 'zod'
import { getAuthHeader } from '@core/authHeader'

export interface FriendUserSummary {
  id: string
  name: string
}

export interface FriendsState {
  code: string
  friends: FriendUserSummary[]
}

/** Đường dẫn chia sẻ để người khác quét/bấm là kết bạn ngay — dùng cho link + QR. */
export function buildFriendInviteUrl(code: string): string {
  return `${window.location.origin}/ket-ban/${code}`
}

const FriendUserSchema = z.object({ id: z.string(), name: z.string() })
const FriendsStateSchema = z.object({ code: z.string(), friends: z.array(FriendUserSchema) })
const LookupSchema = z.object({ user: FriendUserSchema.nullable() })

// [changelog 0525] Hai hàm đọc dưới đây từng trả `null` cho MỌI lỗi (mạng, 5xx, body hỏng). Trang
// Bạn bè vì thế hiện "Chưa có bạn bè nào", trang Kết bạn hiện "Mã kết bạn không tồn tại" khi chỉ
// là mất mạng — người dùng tưởng mất bạn bè / mã sai. Nay lỗi thì NÉM để UI hiện lỗi + Thử lại.

/** Mã kết bạn + danh sách bạn bè. Ném lỗi khi mạng/HTTP lỗi hoặc body lệch hợp đồng. */
export async function fetchFriendsState(): Promise<FriendsState> {
  const res = await fetch('/api/friends', { headers: getAuthHeader() })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const parsed = FriendsStateSchema.safeParse(await res.json())
  if (!parsed.success) throw new Error('Dữ liệu bạn bè không đúng định dạng.')
  return parsed.data
}

/** Tra người dùng theo mã. `null` = mã không tồn tại (server trả `user: null`); lỗi thì ném. */
export async function lookupFriendByCode(code: string): Promise<FriendUserSummary | null> {
  const res = await fetch(`/api/friends?lookup=${encodeURIComponent(code)}`, {
    headers: getAuthHeader(),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const parsed = LookupSchema.safeParse(await res.json())
  if (!parsed.success) throw new Error('Dữ liệu tra mã kết bạn không đúng định dạng.')
  return parsed.data.user
}

export type AddFriendResult =
  { ok: true; alreadyFriends: boolean; friend: FriendUserSummary } | { ok: false; message: string }

export async function addFriendByCode(code: string): Promise<AddFriendResult> {
  try {
    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ code }),
    })
    const data = (await res.json()) as {
      ok?: boolean
      alreadyFriends?: boolean
      friend?: FriendUserSummary
      error?: string
    }
    if (!res.ok || !data.ok || !data.friend) {
      return { ok: false, message: data.error ?? 'Không kết bạn được' }
    }
    return { ok: true, alreadyFriends: !!data.alreadyFriends, friend: data.friend }
  } catch {
    return { ok: false, message: 'Lỗi mạng — thử lại sau' }
  }
}

export async function removeFriend(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/friends?userId=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    })
    return res.ok
  } catch {
    return false
  }
}
