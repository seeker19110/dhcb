// packages/core-chat/chatService.ts — Business logic cho Real-time User-to-User Chat (DM 1-1).
// Mọi thao tác đọc/ghi room đều TỰ KIỂM thành viên (roomId + userId) — không tin client gửi
// đúng roomId là đủ quyền, giống nguyên tắc validateAuth() ở CLAUDE.md mục 4.2.

import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import { areFriends } from './friends.js'
import { moderateContent } from './moderator.js'
import type { ChatMessage, RoomSummary } from '@dhcb/core-contracts/chat'

export type CreateDmRoomResult =
  { ok: true; roomId: string } | { ok: false; reason: 'not_friends' | 'self_chat' }

/** Tạo (hoặc lấy lại) phòng DM giữa 2 user — CHỈ cho phép giữa bạn bè (xem migration 0053). */
export async function createOrGetDmRoom(
  userIdA: string,
  userIdB: string,
): Promise<CreateDmRoomResult> {
  if (userIdA === userIdB) return { ok: false, reason: 'self_chat' }
  if (!(await areFriends(userIdA, userIdB))) return { ok: false, reason: 'not_friends' }

  const pool = getPgPool()
  // Phòng DM hiện có: room không phải group, có ĐÚNG 2 thành viên là 2 user này.
  const { rows: existing } = await pool.query<{ room_id: string }>(
    `select r.id as room_id
     from chat.rooms r
     where r.is_group = false
       and (select count(*) from chat.room_members m where m.room_id = r.id) = 2
       and exists (select 1 from chat.room_members m where m.room_id = r.id and m.user_id = $1)
       and exists (select 1 from chat.room_members m where m.room_id = r.id and m.user_id = $2)
     limit 1`,
    [userIdA, userIdB],
  )
  if (existing[0]) return { ok: true, roomId: existing[0].room_id }

  const roomId = await withTransaction(pool, async (client) => {
    const { rows } = await client.query<{ id: string }>(
      'insert into chat.rooms (is_group, created_by) values (false, $1) returning id',
      [userIdA],
    )
    const newRoomId = rows[0]!.id
    await client.query(
      'insert into chat.room_members (room_id, user_id) values ($1, $2), ($1, $3)',
      [newRoomId, userIdA, userIdB],
    )
    return newRoomId
  })
  return { ok: true, roomId }
}

export async function isRoomMember(roomId: string, userId: string): Promise<boolean> {
  const pool = getPgPool()
  const { rows } = await pool.query(
    'select 1 from chat.room_members where room_id = $1 and user_id = $2',
    [roomId, userId],
  )
  return rows.length > 0
}

/** Các user_id KHÁC trong 1 phòng (dùng để phát WS event) — không kiểm quyền, gọi SAU KHI đã
 * biết chắc `userId` là thành viên hợp lệ của `roomId`. */
export async function getRoomMemberIds(roomId: string, excludeUserId?: string): Promise<string[]> {
  const pool = getPgPool()
  // `$2::uuid` ép kiểu TƯỜNG MINH (sửa 2026-10-08): bản cũ `user_id <> coalesce($2, '')` làm
  // Postgres suy $2 là text → "operator does not exist: uuid <> text" ở MỌI lần gọi, kể cả khi
  // $2 null. Lỗi bị nuốt vì nơi gọi (wsHandler) bắn-rồi-quên, nên chat real-time hỏng im lặng.
  const { rows } = await pool.query<{ user_id: string }>(
    'select user_id from chat.room_members where room_id = $1 and ($2::uuid is null or user_id <> $2::uuid)',
    [roomId, excludeUserId ?? null],
  )
  return rows.map((r) => r.user_id)
}

/** Toàn bộ user_id là "bạn chat cùng phòng" của `userId`, gộp qua mọi room — dùng để phát sự
 * kiện presence (online/offline) khi user kết nối/ngắt kết nối WebSocket. */
export async function getRoomPeerIds(userId: string): Promise<string[]> {
  const pool = getPgPool()
  const { rows } = await pool.query<{ user_id: string }>(
    `select distinct m2.user_id
     from chat.room_members m1
     join chat.room_members m2 on m2.room_id = m1.room_id and m2.user_id <> m1.user_id
     where m1.user_id = $1`,
    [userId],
  )
  return rows.map((r) => r.user_id)
}

export type SendMessageResult =
  { ok: true; message: ChatMessage } | { ok: false; reason: 'not_member' | 'blocked' }

/** Gửi tin nhắn — chạy qua moderation TRƯỚC khi lưu. severity='high' → KHÔNG lưu, KHÔNG phát. */
export async function sendMessage(
  roomId: string,
  senderId: string,
  content: string,
): Promise<SendMessageResult> {
  const pool = getPgPool()
  if (!(await isRoomMember(roomId, senderId))) return { ok: false, reason: 'not_member' }

  const moderation = moderateContent(content)

  if (moderation.blocked) {
    await pool.query(
      `insert into chat.messages (room_id, sender_id, content, is_blocked)
       values ($1, $2, $3, true)`,
      [roomId, senderId, content],
    )
    await logModerationEvent(senderId, null, moderation.severity, moderation.matches, 'blocked')
    return { ok: false, reason: 'blocked' }
  }

  const contentClean = moderation.severity === 'none' ? null : moderation.clean
  const { rows } = await pool.query<{
    id: string
    created_at: string
    sender_name: string | null
  }>(
    `insert into chat.messages (room_id, sender_id, content, content_clean, moderation_flags)
     values ($1, $2, $3, $4, $5)
     returning id, created_at,
       (select name from public.profiles where id = $2) as sender_name`,
    [
      roomId,
      senderId,
      content,
      contentClean,
      moderation.severity === 'none' ? null : JSON.stringify(moderation),
    ],
  )
  const row = rows[0]!

  if (moderation.severity !== 'none') {
    await logModerationEvent(senderId, row.id, moderation.severity, moderation.matches, 'filtered')
  }

  return {
    ok: true,
    message: {
      id: row.id,
      roomId,
      senderId,
      senderName: row.sender_name ?? 'Người dùng',
      content: contentClean ?? content,
      createdAt: row.created_at,
    },
  }
}

async function logModerationEvent(
  userId: string,
  messageId: string | null,
  severity: string,
  matched: string[],
  action: 'filtered' | 'blocked',
): Promise<void> {
  const pool = getPgPool()
  await pool.query(
    `insert into chat.moderation_events (user_id, message_id, severity, matched, action)
     values ($1, $2, $3, $4, $5)`,
    [userId, messageId, severity, matched, action],
  )
}

export type GetMessagesResult =
  { ok: true; messages: ChatMessage[] } | { ok: false; reason: 'not_member' }

export async function getMessages(
  roomId: string,
  userId: string,
  limit = 30,
  before?: string,
): Promise<GetMessagesResult> {
  if (!(await isRoomMember(roomId, userId))) return { ok: false, reason: 'not_member' }

  const pool = getPgPool()
  const { rows } = await pool.query<{
    id: string
    sender_id: string | null
    sender_name: string | null
    content: string
    content_clean: string | null
    created_at: string
  }>(
    `select m.id, m.sender_id, p.name as sender_name,
       m.content, m.content_clean, m.created_at
     from chat.messages m
     left join public.profiles p on p.id = m.sender_id
     where m.room_id = $1 and m.deleted_at is null and m.is_blocked = false
       and ($3::timestamptz is null or m.created_at < $3::timestamptz)
     order by m.created_at desc
     limit $2`,
    [roomId, limit, before ?? null],
  )

  return {
    ok: true,
    messages: rows
      .map((r) => ({
        id: r.id,
        roomId,
        senderId: r.sender_id,
        senderName: r.sender_name ?? 'Người dùng',
        content: r.content_clean ?? r.content,
        createdAt: r.created_at,
      }))
      .reverse(),
  }
}

export async function getRooms(userId: string): Promise<RoomSummary[]> {
  const pool = getPgPool()
  const { rows } = await pool.query<{
    room_id: string
    peer_id: string
    peer_name: string | null
    last_id: string | null
    last_sender_id: string | null
    last_sender_name: string | null
    last_content: string | null
    last_content_clean: string | null
    last_created_at: string | null
    last_read_at: string
    unread_count: string
  }>(
    `select
       rm.room_id,
       peer.user_id as peer_id,
       p.name as peer_name,
       last.id as last_id,
       last.sender_id as last_sender_id,
       lastp.name as last_sender_name,
       last.content as last_content,
       last.content_clean as last_content_clean,
       last.created_at as last_created_at,
       rm.last_read_at,
       (select count(*) from chat.messages m
        where m.room_id = rm.room_id and m.deleted_at is null and m.is_blocked = false
          and m.created_at > rm.last_read_at) as unread_count
     from chat.room_members rm
     join chat.room_members peer on peer.room_id = rm.room_id and peer.user_id <> rm.user_id
     join public.profiles p on p.id = peer.user_id
     left join lateral (
       select * from chat.messages m
       where m.room_id = rm.room_id and m.deleted_at is null and m.is_blocked = false
       order by m.created_at desc limit 1
     ) last on true
     left join public.profiles lastp on lastp.id = last.sender_id
     where rm.user_id = $1
     order by coalesce(last.created_at, rm.joined_at) desc`,
    [userId],
  )

  return rows.map((r) => ({
    roomId: r.room_id,
    peer: { id: r.peer_id, name: r.peer_name ?? 'Người dùng' },
    lastMessage: r.last_id
      ? {
          id: r.last_id,
          roomId: r.room_id,
          senderId: r.last_sender_id,
          senderName: r.last_sender_name ?? 'Người dùng',
          content: r.last_content_clean ?? r.last_content ?? '',
          createdAt: r.last_created_at ?? '',
        }
      : null,
    unreadCount: Number(r.unread_count),
  }))
}

export async function markRead(roomId: string, userId: string): Promise<void> {
  const pool = getPgPool()
  await pool.query(
    'update chat.room_members set last_read_at = now() where room_id = $1 and user_id = $2',
    [roomId, userId],
  )
}

export async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
  const pool = getPgPool()
  const { rowCount } = await pool.query(
    `update chat.messages set deleted_at = now()
     where id = $1 and sender_id = $2 and deleted_at is null`,
    [messageId, userId],
  )
  return (rowCount ?? 0) > 0
}
