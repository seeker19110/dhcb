// Test business logic chat — tập trung vào: CHỈ tạo DM room được với bạn bè (areFriends), không
// tự chat với chính mình, mọi thao tác đọc/ghi room đều TỰ KIỂM thành viên, và tin nhắn severity
// 'high' bị chặn hoàn toàn (không lộ nội dung, không trả message cho client).

import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockQuery = vi.fn()
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({ query: mockQuery }) }))
vi.mock('@dhcb/core-db/transaction', () => ({
  withTransaction: async (_pool: unknown, fn: (client: { query: typeof mockQuery }) => unknown) =>
    fn({ query: mockQuery }),
}))

const areFriendsMock = vi.fn()
vi.mock('./friends.js', () => ({ areFriends: (...a: unknown[]) => areFriendsMock(...a) }))

import {
  createOrGetDmRoom,
  isRoomMember,
  sendMessage,
  getMessages,
  getRooms,
  markRead,
  deleteMessage,
  getRoomMemberIds,
  getRoomPeerIds,
} from './chatService.js'

beforeEach(() => {
  mockQuery.mockReset()
  mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })
  areFriendsMock.mockReset()
})

describe('createOrGetDmRoom', () => {
  it('tự chat với chính mình → từ chối, không đụng DB', async () => {
    expect(await createOrGetDmRoom('u1', 'u1')).toEqual({ ok: false, reason: 'self_chat' })
    expect(mockQuery).not.toHaveBeenCalled()
    expect(areFriendsMock).not.toHaveBeenCalled()
  })

  it('không phải bạn bè → từ chối', async () => {
    areFriendsMock.mockResolvedValue(false)
    expect(await createOrGetDmRoom('u1', 'u2')).toEqual({ ok: false, reason: 'not_friends' })
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('đã bạn bè, chưa có phòng → khoá theo cặp, kiểm lại, rồi tạo phòng mới', async () => {
    areFriendsMock.mockResolvedValue(true)
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // tìm phòng có sẵn: không có
      .mockResolvedValueOnce({ rows: [] }) // pg_advisory_xact_lock
      .mockResolvedValueOnce({ rows: [] }) // kiểm lại trong khoá: vẫn không có
      .mockResolvedValueOnce({ rows: [{ id: 'room-1' }] }) // insert room
      .mockResolvedValueOnce({ rows: [] }) // insert members
    expect(await createOrGetDmRoom('u1', 'u2')).toEqual({ ok: true, roomId: 'room-1' })
    const [lockSql, lockParams] = mockQuery.mock.calls[1] as [string, unknown[]]
    expect(lockSql).toContain('pg_advisory_xact_lock')
    expect(lockParams).toEqual(['chat-dm:u1:u2'])
  })

  it('khoá theo CẶP không phụ thuộc thứ tự — u2 mở với u1 cũng dùng cùng khoá', async () => {
    areFriendsMock.mockResolvedValue(true)
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'room-1' }] })
    await createOrGetDmRoom('u2', 'u1')
    expect((mockQuery.mock.calls[1] as [string, unknown[]])[1]).toEqual(['chat-dm:u1:u2'])
  })

  it('request song song đã tạo phòng trong lúc chờ khoá → trả phòng đó, KHÔNG tạo thêm (E2.6)', async () => {
    areFriendsMock.mockResolvedValue(true)
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // đường nhanh: chưa có
      .mockResolvedValueOnce({ rows: [] }) // chờ được khoá
      .mockResolvedValueOnce({ rows: [{ room_id: 'room-by-other-request' }] }) // kiểm lại: đã có
    expect(await createOrGetDmRoom('u1', 'u2')).toEqual({
      ok: true,
      roomId: 'room-by-other-request',
    })
    expect(
      mockQuery.mock.calls.some(([sql]) => String(sql).includes('insert into chat.rooms')),
    ).toBe(false)
  })

  it('đã bạn bè, ĐÃ có phòng → trả lại phòng cũ, không tạo mới', async () => {
    areFriendsMock.mockResolvedValue(true)
    mockQuery.mockResolvedValueOnce({ rows: [{ room_id: 'room-existing' }] })
    expect(await createOrGetDmRoom('u1', 'u2')).toEqual({ ok: true, roomId: 'room-existing' })
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })
})

describe('isRoomMember', () => {
  it('có dòng khớp → true', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })
    expect(await isRoomMember('room-1', 'u1')).toBe(true)
  })
  it('không có dòng → false', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    expect(await isRoomMember('room-1', 'u1')).toBe(false)
  })
})

describe('sendMessage', () => {
  it('không phải thành viên phòng → từ chối, KHÔNG lưu DB', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }) // isRoomMember: false
    const result = await sendMessage('room-1', 'u1', 'xin chào')
    expect(result).toEqual({ ok: false, reason: 'not_member' })
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('nội dung bình thường → lưu, trả message với content gốc', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // isRoomMember: true
      .mockResolvedValueOnce({
        rows: [{ id: 'msg-1', created_at: '2026-01-01T00:00:00Z', sender_name: 'Bình' }],
      })
    const result = await sendMessage('room-1', 'u1', 'xin chào')
    expect(result).toEqual({
      ok: true,
      message: {
        id: 'msg-1',
        roomId: 'room-1',
        senderId: 'u1',
        senderName: 'Bình',
        content: 'xin chào',
        createdAt: '2026-01-01T00:00:00Z',
      },
    })
  })

  it('severity high (chửi tục nặng) → CHẶN, không trả message, có lưu bản ghi is_blocked + moderation_events', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // isRoomMember: true
      .mockResolvedValueOnce({ rows: [] }) // insert is_blocked message
      .mockResolvedValueOnce({ rows: [] }) // insert moderation_events
    const result = await sendMessage('room-1', 'u1', 'fuck you')
    expect(result).toEqual({ ok: false, reason: 'blocked' })
    expect(mockQuery.mock.calls[1]?.[0]).toContain('is_blocked')
    expect(mockQuery.mock.calls[2]?.[0]).toContain('moderation_events')
  })

  it('severity medium (ngu) → lưu content_clean đã mask, ghi moderation_events', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // isRoomMember
      .mockResolvedValueOnce({
        rows: [{ id: 'msg-2', created_at: '2026-01-01T00:00:00Z', sender_name: 'Bình' }],
      })
      .mockResolvedValueOnce({ rows: [] }) // moderation_events
    const result = await sendMessage('room-1', 'u1', 'mày ngu quá')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.message.content).toBe('mày n** quá')
    expect(mockQuery.mock.calls[2]?.[0]).toContain('moderation_events')
  })
})

describe('getMessages', () => {
  it('không phải thành viên → từ chối', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })
    expect(await getMessages('room-1', 'u1')).toEqual({ ok: false, reason: 'not_member' })
  })

  it('là thành viên → trả tin nhắn theo thứ tự CŨ → MỚI (đảo ngược query DESC)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] }) // isRoomMember
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'm2',
            sender_id: 'u2',
            sender_name: 'B',
            content: 'sau',
            content_clean: null,
            created_at: '2026-01-02',
          },
          {
            id: 'm1',
            sender_id: 'u1',
            sender_name: 'A',
            content: 'trước',
            content_clean: null,
            created_at: '2026-01-01',
          },
        ],
      })
    const result = await getMessages('room-1', 'u1')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.messages.map((m) => m.id)).toEqual(['m1', 'm2'])
  })
})

describe('getRooms', () => {
  it('trả danh sách phòng kèm tin nhắn cuối + số chưa đọc', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          room_id: 'room-1',
          peer_id: 'u2',
          peer_name: 'Bình',
          last_id: 'm1',
          last_sender_id: 'u2',
          last_sender_name: 'Bình',
          last_content: 'chào',
          last_content_clean: null,
          last_created_at: '2026-01-01',
          last_read_at: '2025-12-31',
          unread_count: '2',
        },
      ],
    })
    const rooms = await getRooms('u1')
    expect(rooms).toEqual([
      {
        roomId: 'room-1',
        peer: { id: 'u2', name: 'Bình' },
        lastMessage: {
          id: 'm1',
          roomId: 'room-1',
          senderId: 'u2',
          senderName: 'Bình',
          content: 'chào',
          createdAt: '2026-01-01',
        },
        unreadCount: 2,
      },
    ])
  })
})

describe('markRead / deleteMessage / getRoomMemberIds / getRoomPeerIds', () => {
  it('markRead gọi đúng update', async () => {
    await markRead('room-1', 'u1')
    expect(mockQuery.mock.calls[0]?.[0]).toContain('update chat.room_members')
  })

  it('deleteMessage: xoá thành công → true', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 })
    expect(await deleteMessage('m1', 'u1')).toBe(true)
  })

  it('deleteMessage: không phải của mình/không tồn tại → false', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 0 })
    expect(await deleteMessage('m1', 'u1')).toBe(false)
  })

  it('getRoomMemberIds trả danh sách user_id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'u2' }, { user_id: 'u3' }] })
    expect(await getRoomMemberIds('room-1')).toEqual(['u2', 'u3'])
  })

  it('CHẶN HỒI QUY 2026-10-08: getRoomMemberIds ép $2 về uuid (không so uuid với text)', async () => {
    // `user_id <> coalesce($2, '')` khiến Postgres suy $2 là text → lỗi "operator does not
    // exist: uuid <> text" ở MỌI lần gọi (đã đo bằng PREPARE trên CSDL đã migrate). Mock pg
    // không tái hiện được lỗi kiểu, nên canh đúng hình dạng câu lệnh.
    await getRoomMemberIds('room-1', 'u1')
    const sql = String(mockQuery.mock.calls[0]?.[0])
    expect(sql).not.toMatch(/coalesce\(\$2,\s*''\)/)
    expect(sql).toContain('$2::uuid')
    expect(mockQuery.mock.calls[0]?.[1]).toEqual(['room-1', 'u1'])
  })

  it('getRoomPeerIds trả danh sách user_id là bạn chat cùng phòng', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'u2' }] })
    expect(await getRoomPeerIds('u1')).toEqual(['u2'])
  })

  it('getRooms xử lý phòng chưa có tin nhắn nào và fallback Người dùng khi tên null', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          room_id: 'room-empty',
          peer_id: 'u3',
          peer_name: null,
          last_id: null,
          last_sender_id: null,
          last_sender_name: null,
          last_content: null,
          last_content_clean: null,
          last_created_at: null,
          last_read_at: null,
          unread_count: '0',
        },
      ],
    })
    const rooms = await getRooms('u1')
    expect(rooms).toEqual([
      {
        roomId: 'room-empty',
        peer: { id: 'u3', name: 'Người dùng' },
        lastMessage: null,
        unreadCount: 0,
      },
    ])
  })
})
