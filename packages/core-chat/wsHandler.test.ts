// Test WebSocket handler — mock 'ws' bằng EventEmitter giả lập, mock chatService/redisChat.
// Tập trung vào: chặn upgrade khi chưa đăng nhập (không cookie hợp lệ), gửi tin nhắn hợp lệ →
// echo cho chính người gửi + publish cho thành viên khác, tin nhắn bị chặn (severity high) →
// KHÔNG publish gì, chỉ trả lỗi cho người gửi, và ping → pong ngay không qua DB/Redis.

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventEmitter } from 'node:events'

const authState: { user: { userId: string } | null } = { user: null }
const TRUSTED_ORIGIN = 'https://en-vi.donghanhcungban.org'
const rateLimit = vi.hoisted(() => ({ ok: true, calls: [] as unknown[][] }))
vi.mock('@dhcb/core-auth/security', () => ({
  validateAuth: async () => authState.user,
  isAllowedWebSocketOrigin: (origin: unknown) => origin === 'https://en-vi.donghanhcungban.org',
  checkRateLimit: async (...args: unknown[]) => {
    rateLimit.calls.push(args)
    return rateLimit.ok
  },
}))

const sendMessageMock = vi.fn()
const isRoomMemberMock = vi.fn()
const getRoomMemberIdsMock = vi.fn()
const getRoomPeerIdsMock = vi.fn()
const markReadMock = vi.fn()
vi.mock('./chatService.js', () => ({
  sendMessage: (...a: unknown[]) => sendMessageMock(...a),
  isRoomMember: (...a: unknown[]) => isRoomMemberMock(...a),
  getRoomMemberIds: (...a: unknown[]) => getRoomMemberIdsMock(...a),
  getRoomPeerIds: (...a: unknown[]) => getRoomPeerIdsMock(...a),
  markRead: (...a: unknown[]) => markReadMock(...a),
}))

const publishMock = vi.fn()
const subscribeChannelMock = vi.fn((channel: string, fn: (payload: unknown) => void) => {
  void channel
  void fn
  return () => {}
})
const setPresenceMock = vi.fn()
const clearPresenceMock = vi.fn()
const isOnlineMock = vi.fn().mockResolvedValue(true)
vi.mock('./redisChat.js', () => ({
  publish: (...a: unknown[]) => publishMock(...a),
  subscribeChannel: (channel: string, fn: (payload: unknown) => void) =>
    subscribeChannelMock(channel, fn),
  setPresence: (...a: unknown[]) => setPresenceMock(...a),
  clearPresence: (...a: unknown[]) => clearPresenceMock(...a),
  isOnline: (...a: unknown[]) => isOnlineMock(...a),
}))

// Không dùng node:events ở đây — vi.hoisted() chạy TRƯỚC mọi import (kể cả import ở đầu file
// này), nên tự cài event emitter tối giản để tránh phụ thuộc thứ tự hoist.
const { FakeWebSocket, FakeWebSocketServer } = vi.hoisted(() => {
  class MiniEmitter {
    private listeners = new Map<string, Set<(...args: unknown[]) => void>>()
    on(event: string, fn: (...args: unknown[]) => void) {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set())
      this.listeners.get(event)!.add(fn)
      return this
    }
    emit(event: string, ...args: unknown[]) {
      for (const fn of this.listeners.get(event) ?? []) fn(...args)
      return true
    }
  }

  class FakeWebSocket extends MiniEmitter {
    static OPEN = 1
    readyState = 1
    sent: unknown[] = []
    send(data: string) {
      this.sent.push(JSON.parse(data))
    }
  }

  class FakeWebSocketServer extends MiniEmitter {
    static lastOptions: unknown = undefined
    constructor(options?: unknown) {
      super()
      FakeWebSocketServer.lastOptions = options
    }
    handleUpgrade(
      _req: unknown,
      _socket: unknown,
      _head: unknown,
      cb: (ws: InstanceType<typeof FakeWebSocket>) => void,
    ) {
      cb(new FakeWebSocket())
    }
  }

  return { FakeWebSocket, FakeWebSocketServer }
})

vi.mock('ws', () => ({ WebSocketServer: FakeWebSocketServer, WebSocket: FakeWebSocket }))

import {
  attachChatWebSocketServer,
  _resetWsHandlerStateForTests,
  CHAT_WS_MAX_PAYLOAD,
  CHAT_WS_MESSAGES_PER_MIN,
} from './wsHandler.js'

type FakeWebSocketInstance = InstanceType<typeof FakeWebSocket>

const flush = () => new Promise((r) => setImmediate(r))

// origin `null` = trình duyệt/công cụ KHÔNG gửi header Origin.
function fakeUpgradeReq(cookie: string, origin: string | null = TRUSTED_ORIGIN) {
  return { url: '/ws/chat', headers: { cookie, origin: origin ?? undefined } }
}

beforeEach(() => {
  _resetWsHandlerStateForTests()
  authState.user = null
  rateLimit.ok = true
  rateLimit.calls.length = 0
  sendMessageMock.mockReset()
  isRoomMemberMock.mockReset()
  getRoomMemberIdsMock.mockReset()
  getRoomMemberIdsMock.mockResolvedValue([])
  getRoomPeerIdsMock.mockReset()
  getRoomPeerIdsMock.mockResolvedValue([])
  markReadMock.mockReset()
  publishMock.mockReset()
  subscribeChannelMock.mockClear()
  setPresenceMock.mockReset()
  clearPresenceMock.mockReset()
})

describe('attachChatWebSocketServer — upgrade auth', () => {
  it('chưa đăng nhập → 401, đóng socket, KHÔNG upgrade', async () => {
    authState.user = null
    const httpServer = new EventEmitter()
    attachChatWebSocketServer(httpServer as never)

    const socket = { write: vi.fn(), destroy: vi.fn() }
    httpServer.emit('upgrade', fakeUpgradeReq(''), socket, Buffer.alloc(0))
    await flush()

    expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('401'))
    expect(socket.destroy).toHaveBeenCalled()
  })

  it.each([null, 'https://sales.donghanhcungban.org', 'https://evil.test', 'null'])(
    'CHẶN HỒI QUY 2026-09-27: Origin %s → 403, không kiểm phiên, không upgrade',
    async (origin) => {
      authState.user = { userId: 'u1' }
      const httpServer = new EventEmitter()
      attachChatWebSocketServer(httpServer as never)
      const socket = { write: vi.fn(), destroy: vi.fn() }
      const upgrade = vi.spyOn(FakeWebSocketServer.prototype, 'handleUpgrade')
      httpServer.emit(
        'upgrade',
        fakeUpgradeReq('session_token=abc', origin),
        socket,
        Buffer.alloc(0),
      )
      await flush()
      expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('403'))
      expect(socket.destroy).toHaveBeenCalled()
      expect(upgrade).not.toHaveBeenCalled()
      upgrade.mockRestore()
    },
  )

  it('sai đường dẫn (khác /ws/chat) → bỏ qua, không đụng socket', async () => {
    const httpServer = new EventEmitter()
    attachChatWebSocketServer(httpServer as never)
    const socket = { write: vi.fn(), destroy: vi.fn() }
    httpServer.emit('upgrade', { url: '/khac', headers: {} }, socket, Buffer.alloc(0))
    await flush()
    expect(socket.write).not.toHaveBeenCalled()
    expect(socket.destroy).not.toHaveBeenCalled()
  })
})

describe('attachChatWebSocketServer — luồng sau khi kết nối', () => {
  async function connect(userId: string): Promise<FakeWebSocketInstance> {
    authState.user = { userId }
    const httpServer = new EventEmitter()
    attachChatWebSocketServer(httpServer as never)
    const socket = { write: vi.fn(), destroy: vi.fn() }
    let capturedWs: FakeWebSocketInstance | undefined
    const originalHandleUpgrade = FakeWebSocketServer.prototype.handleUpgrade
    FakeWebSocketServer.prototype.handleUpgrade = function (req, sock, head, cb) {
      originalHandleUpgrade.call(this, req, sock, head, (ws: FakeWebSocketInstance) => {
        capturedWs = ws
        cb(ws)
      })
    }
    httpServer.emit('upgrade', fakeUpgradeReq('session_token=abc'), socket, Buffer.alloc(0))
    await flush()
    FakeWebSocketServer.prototype.handleUpgrade = originalHandleUpgrade
    return capturedWs!
  }

  it('ping → pong ngay, không gọi DB/Redis', async () => {
    const ws = await connect('u1')
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'ping' })))
    await flush()
    expect(ws.sent).toContainEqual({ type: 'pong' })
    expect(sendMessageMock).not.toHaveBeenCalled()
  })

  it('gửi tin nhắn hợp lệ → echo cho người gửi + publish cho thành viên khác', async () => {
    const ws = await connect('u1')
    sendMessageMock.mockResolvedValue({
      ok: true,
      message: {
        id: 'm1',
        roomId: 'r1',
        senderId: 'u1',
        senderName: 'A',
        content: 'hi',
        createdAt: 'x',
      },
    })
    getRoomMemberIdsMock.mockResolvedValue(['u2'])

    ws.emit(
      'message',
      Buffer.from(
        JSON.stringify({
          type: 'message',
          roomId: '11111111-1111-4111-8111-111111111111',
          content: 'hi',
        }),
      ),
    )
    await flush()

    expect(ws.sent).toContainEqual({
      type: 'message',
      message: {
        id: 'm1',
        roomId: 'r1',
        senderId: 'u1',
        senderName: 'A',
        content: 'hi',
        createdAt: 'x',
      },
    })
    expect(publishMock).toHaveBeenCalledWith(
      'chat:user:u2',
      expect.objectContaining({ type: 'message' }),
    )
  })

  it('tin nhắn bị chặn (severity high) → trả lỗi cho người gửi, KHÔNG publish', async () => {
    const ws = await connect('u1')
    sendMessageMock.mockResolvedValue({ ok: false, reason: 'blocked' })

    ws.emit(
      'message',
      Buffer.from(
        JSON.stringify({
          type: 'message',
          roomId: '11111111-1111-4111-8111-111111111111',
          content: 'fuck you',
        }),
      ),
    )
    await flush()

    expect(ws.sent).toContainEqual(
      expect.objectContaining({ type: 'error', code: 'MODERATION_BLOCKED' }),
    )
    expect(publishMock).not.toHaveBeenCalled()
  })

  it('tin nhắn bị từ chối do không phải thành viên → trả lỗi ROOM_NOT_MEMBER', async () => {
    const ws = await connect('u1')
    sendMessageMock.mockResolvedValue({ ok: false, reason: 'not_member' })

    ws.emit(
      'message',
      Buffer.from(
        JSON.stringify({
          type: 'message',
          roomId: '11111111-1111-4111-8111-111111111111',
          content: 'hello strangers',
        }),
      ),
    )
    await flush()

    expect(ws.sent).toContainEqual(
      expect.objectContaining({ type: 'error', code: 'ROOM_NOT_MEMBER' }),
    )
    expect(publishMock).not.toHaveBeenCalled()
  })

  it('sự kiện typing: publish cho thành viên phòng nếu là member', async () => {
    const ws = await connect('u1')
    isRoomMemberMock.mockResolvedValue(true)
    getRoomMemberIdsMock.mockResolvedValue(['u2'])

    ws.emit(
      'message',
      Buffer.from(
        JSON.stringify({
          type: 'typing',
          roomId: '11111111-1111-4111-8111-111111111111',
        }),
      ),
    )
    await flush()

    expect(publishMock).toHaveBeenCalledWith(
      'chat:user:u2',
      expect.objectContaining({ type: 'typing', roomId: '11111111-1111-4111-8111-111111111111' }),
    )

    // Nếu không phải member → không publish
    publishMock.mockClear()
    isRoomMemberMock.mockResolvedValue(false)
    ws.emit(
      'message',
      Buffer.from(
        JSON.stringify({
          type: 'typing',
          roomId: '11111111-1111-4111-8111-111111111111',
        }),
      ),
    )
    await flush()
    expect(publishMock).not.toHaveBeenCalled()
  })

  it('sự kiện read: markRead và publish cho thành viên phòng', async () => {
    const ws = await connect('u1')
    isRoomMemberMock.mockResolvedValue(true)
    getRoomMemberIdsMock.mockResolvedValue(['u2'])

    const validMsgId = '22222222-2222-4222-8222-222222222222'
    ws.emit(
      'message',
      Buffer.from(
        JSON.stringify({
          type: 'read',
          roomId: '11111111-1111-4111-8111-111111111111',
          messageId: validMsgId,
        }),
      ),
    )
    await flush()

    expect(markReadMock).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111', 'u1')
    expect(publishMock).toHaveBeenCalledWith(
      'chat:user:u2',
      expect.objectContaining({ type: 'read', messageId: validMsgId }),
    )

    // Nếu không phải member → không markRead / publish
    markReadMock.mockClear()
    publishMock.mockClear()
    isRoomMemberMock.mockResolvedValue(false)
    ws.emit(
      'message',
      Buffer.from(
        JSON.stringify({
          type: 'read',
          roomId: '11111111-1111-4111-8111-111111111111',
          messageId: validMsgId,
        }),
      ),
    )
    await flush()
    expect(markReadMock).not.toHaveBeenCalled()
    expect(publishMock).not.toHaveBeenCalled()
  })

  it('sự kiện close: xoá presence và broadcast offline', async () => {
    getRoomPeerIdsMock.mockResolvedValue(['p1'])
    const ws = await connect('u1')
    expect(setPresenceMock).toHaveBeenCalledWith('u1')

    ws.emit('close')
    await flush()

    expect(clearPresenceMock).toHaveBeenCalledWith('u1')
    expect(publishMock).toHaveBeenCalledWith(
      'chat:user:p1',
      expect.objectContaining({ type: 'presence', userId: 'u1', online: false }),
    )
  })

  it('sự kiện error trên ws: kích hoạt disconnect', async () => {
    getRoomPeerIdsMock.mockResolvedValue(['p2'])
    const ws = await connect('u2')

    ws.emit('error', new Error('conn reset'))
    await flush()

    expect(clearPresenceMock).toHaveBeenCalledWith('u2')
  })

  it('khi nhận tin từ redis pubsub: chuyển tiếp cho client local', async () => {
    let subHandler: ((payload: unknown) => void) | undefined
    subscribeChannelMock.mockImplementation((_ch, fn) => {
      subHandler = fn
      return () => {}
    })

    const ws = await connect('u3')
    expect(subHandler).toBeDefined()

    subHandler?.({ type: 'presence', userId: 'p3', online: true })
    expect(ws.sent).toContainEqual({ type: 'presence', userId: 'p3', online: true })
  })

  it('payload không phải JSON hợp lệ → trả lỗi BAD_JSON', async () => {
    const ws = await connect('u1')
    ws.emit('message', Buffer.from('không phải json'))
    await flush()
    expect(ws.sent).toContainEqual(expect.objectContaining({ type: 'error', code: 'BAD_JSON' }))
  })

  it('sự kiện sai schema → trả lỗi BAD_EVENT', async () => {
    const ws = await connect('u1')
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'khong-ton-tai' })))
    await flush()
    expect(ws.sent).toContainEqual(expect.objectContaining({ type: 'error', code: 'BAD_EVENT' }))
  })
})

describe('attachChatWebSocketServer — trần kích thước + tần suất (vá 2026-09-27)', () => {
  const ROOM = '11111111-1111-4111-8111-111111111111'
  it('đặt maxPayload (không để mặc định 100 MiB của thư viện ws)', () => {
    attachChatWebSocketServer(new EventEmitter() as never)
    expect(FakeWebSocketServer.lastOptions).toMatchObject({ maxPayload: CHAT_WS_MAX_PAYLOAD })
    expect(CHAT_WS_MAX_PAYLOAD).toBeLessThanOrEqual(64 * 1024)
  })

  async function connectAs(userId: string): Promise<FakeWebSocketInstance> {
    authState.user = { userId }
    const httpServer = new EventEmitter()
    attachChatWebSocketServer(httpServer as never)
    let captured: FakeWebSocketInstance | undefined
    const original = FakeWebSocketServer.prototype.handleUpgrade
    FakeWebSocketServer.prototype.handleUpgrade = function (req, sock, head, cb) {
      original.call(this, req, sock, head, (ws: FakeWebSocketInstance) => {
        captured = ws
        cb(ws)
      })
    }
    httpServer.emit(
      'upgrade',
      fakeUpgradeReq('session_token=abc'),
      { write: vi.fn(), destroy: vi.fn() },
      Buffer.alloc(0),
    )
    await flush()
    FakeWebSocketServer.prototype.handleUpgrade = original
    return captured!
  }

  it('vượt trần tin nhắn/phút → lỗi RATE_LIMITED, KHÔNG lưu/publish/đẩy thông báo', async () => {
    const ws = await connectAs('u1')
    rateLimit.ok = false
    ws.emit(
      'message',
      Buffer.from(JSON.stringify({ type: 'message', roomId: ROOM, content: 'spam' })),
    )
    await flush()
    expect(ws.sent).toContainEqual(expect.objectContaining({ type: 'error', code: 'RATE_LIMITED' }))
    expect(sendMessageMock).not.toHaveBeenCalled()
    expect(publishMock).not.toHaveBeenCalled()
  })

  it('đếm theo userId (đổi IP/mở thêm socket không thoát được), ping không bị đếm', async () => {
    const ws = await connectAs('u7')
    ws.emit('message', Buffer.from(JSON.stringify({ type: 'ping' })))
    await flush()
    expect(rateLimit.calls).toEqual([])
    sendMessageMock.mockResolvedValue({ ok: false, reason: 'not_member' })
    ws.emit(
      'message',
      Buffer.from(JSON.stringify({ type: 'message', roomId: ROOM, content: 'hi' })),
    )
    await flush()
    expect(rateLimit.calls).toContainEqual(['u7', CHAT_WS_MESSAGES_PER_MIN, 'chat-ws-message'])
  })
})
