// packages/core-chat/wsHandler.ts — WebSocket server cho chat real-time, gắn vào http.Server
// hiện có của server.ts (KHÔNG tạo cổng riêng). Auth qua cookie HttpOnly — request upgrade của
// trình duyệt tự gửi kèm cookie, đọc thủ công từ header rồi tái dùng validateAuth() sẵn có
// (packages/core-auth/security.ts) bằng cách dựng 1 Web Request tối giản.
//
// Fan-out qua Redis (packages/core-chat/redisChat.ts, có fallback single-process khi chưa có
// REDIS_URL): mỗi user kết nối sẽ subscribe kênh riêng `chat:user:<userId>` — publish vào kênh
// này khi có tin nhắn/typing/read/presence liên quan tới họ, bất kể tin đó được XỬ LÝ Ở INSTANCE
// PM2 NÀO.

import type { Server as HttpServer, IncomingMessage } from 'node:http'
import { WebSocketServer, WebSocket, type RawData } from 'ws'
import { checkRateLimit, isAllowedWebSocketOrigin, validateAuth } from '@dhcb/core-auth/security'
import { WsClientEventSchema, type WsServerEvent } from '@dhcb/core-contracts/chat'
import {
  sendMessage,
  isRoomMember,
  getRoomMemberIds,
  getRoomPeerIds,
  markRead,
} from './chatService.js'
import { publish, subscribeChannel, setPresence, clearPresence } from './redisChat.js'
import { notifyOfflinePeers } from './chatPush.js'

const WS_PATH = '/ws/chat'

// Trần MỘT khung WebSocket. Tin nhắn tối đa 4.000 ký tự (WsClientEventSchema) — kể cả khi mọi
// ký tự bị escape `\uXXXX` thì JSON vẫn dưới 32 KiB. Không đặt thì thư viện `ws` nhận tới
// 100 MiB/khung: một tài khoản đủ làm tràn RAM worker (PM2 giới hạn 400 MB) — vá 2026-09-27.
export const CHAT_WS_MAX_PAYLOAD = 32 * 1024
// Tần suất theo NGƯỜI DÙNG. Đường WS trước đây không có giới hạn nào (HTTP /api/chat có 60/phút
// theo IP), nên một thành viên phòng spam được tin nhắn — và MỖI tin còn kích hoạt thông báo đẩy
// tới người đang offline. Sự kiện nhẹ (typing/read) có trần riêng, rộng hơn.
export const CHAT_WS_MESSAGES_PER_MIN = 30
export const CHAT_WS_EVENTS_PER_MIN = 120

function userChannel(userId: string): string {
  return `chat:user:${userId}`
}

function send(ws: WebSocket, event: WsServerEvent): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event))
}

async function authenticateUpgrade(req: IncomingMessage): Promise<{ userId: string } | null> {
  const cookie = req.headers.cookie ?? ''
  // validateAuth() chỉ đọc header 'cookie' (xem sessionCookie.ts#readSessionCookie) — dựng 1
  // Web Request tối giản là đủ, không cần toàn bộ request thật.
  const fakeRequest = new Request('http://localhost' + WS_PATH, { headers: { cookie } })
  return validateAuth(fakeRequest)
}

// Socket đang mở, theo dõi TRONG TIẾN TRÌNH NÀY — 1 user có thể mở nhiều tab/thiết bị.
const localSockets = new Map<string, Set<WebSocket>>()
const channelUnsubscribers = new Map<string, () => void>()

export function _resetWsHandlerStateForTests(): void {
  localSockets.clear()
  for (const unsub of channelUnsubscribers.values()) unsub()
  channelUnsubscribers.clear()
}

/** Gắn WebSocket server vào httpServer hiện có, chỉ xử lý upgrade request tới đúng WS_PATH. */
export function attachChatWebSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true, maxPayload: CHAT_WS_MAX_PAYLOAD })

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '', 'http://localhost')
    if (url.pathname !== WS_PATH) return // để middleware/handler upgrade khác (nếu có) xử lý
    // Chống Cross-Site WebSocket Hijacking: chỉ nhận upgrade từ origin tin cậy (vá 2026-09-27).
    if (!isAllowedWebSocketOrigin(req.headers.origin)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n')
      socket.destroy()
      return
    }

    authenticateUpgrade(req)
      .then((auth) => {
        if (!auth) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
          socket.destroy()
          return
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
          wss.emit('connection', ws, req, auth)
        })
      })
      .catch(() => socket.destroy())
  })

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage, auth: { userId: string }) => {
    handleConnection(ws, auth.userId).catch((err: unknown) => {
      // Redis/CSDL lỗi lúc đăng ký presence → chưa kịp gắn listener 'message', socket mở mà
      // "chết". Đóng hẳn (1011 = lỗi máy chủ) để client tự kết nối lại thay vì treo im lặng.
      logWsError('kết nối', auth.userId, err)
      ws.close(1011, 'server error')
      // Listener 'close' chưa kịp gắn → tự dọn socket khỏi localSockets, tránh rò bộ nhớ.
      handleDisconnect(ws, auth.userId).catch((cleanupErr: unknown) =>
        logWsError('dọn kết nối lỗi', auth.userId, cleanupErr),
      )
    })
  })
}

// [2026-10-08] Các handler sự kiện chạy kiểu bắn-rồi-quên (callback của `ws` không chờ promise).
// Trước đây gọi bằng `void handler()` không kèm `.catch`: một lần CSDL/Redis chập chờn là
// promise bị từ chối không ai bắt → Node (không có handler `unhandledRejection`) SẬP cả worker
// PM2, còn người gửi không nhận được phản hồi nào. Mọi lời gọi nền đều phải đi qua đây.
function logWsError(stage: string, uid: string, err: unknown): void {
  console.error(
    `[chat-ws] lỗi xử lý ${stage} (user ${uid}):`,
    err instanceof Error ? err.message : err,
  )
}

async function handleConnection(ws: WebSocket, userId: string): Promise<void> {
  let sockets = localSockets.get(userId)
  if (!sockets) {
    sockets = new Set()
    localSockets.set(userId, sockets)
    channelUnsubscribers.set(
      userId,
      subscribeChannel(userChannel(userId), (payload) => {
        for (const socket of localSockets.get(userId) ?? []) send(socket, payload as WsServerEvent)
      }),
    )
  }
  sockets.add(ws)

  await setPresence(userId)
  await broadcastPresence(userId, true)

  ws.on('message', (raw: RawData) => {
    handleClientMessage(ws, userId, raw).catch((err: unknown) => {
      logWsError('sự kiện', userId, err)
      // Người gửi phải biết thao tác KHÔNG thành công (vd tin nhắn chưa tới người nhận).
      send(ws, {
        type: 'error',
        code: 'SERVER_ERROR',
        message: 'Máy chủ đang trục trặc, thử lại sau',
      })
    })
  })
  const disconnect = () => {
    handleDisconnect(ws, userId).catch((err: unknown) => logWsError('ngắt kết nối', userId, err))
  }
  ws.on('close', disconnect)
  ws.on('error', disconnect)
}

async function handleDisconnect(ws: WebSocket, userId: string): Promise<void> {
  const sockets = localSockets.get(userId)
  sockets?.delete(ws)
  if (sockets && sockets.size > 0) return // vẫn còn tab/thiết bị khác đang mở

  localSockets.delete(userId)
  channelUnsubscribers.get(userId)?.()
  channelUnsubscribers.delete(userId)
  await clearPresence(userId)
  await broadcastPresence(userId, false)
}

async function broadcastPresence(userId: string, online: boolean): Promise<void> {
  const peers = await getRoomPeerIds(userId)
  const event: WsServerEvent = { type: 'presence', userId, online }
  await Promise.all(peers.map((peerId) => publish(userChannel(peerId), event)))
}

async function handleClientMessage(ws: WebSocket, userId: string, raw: RawData): Promise<void> {
  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(raw.toString())
  } catch {
    send(ws, { type: 'error', code: 'BAD_JSON', message: 'Payload không hợp lệ (cần JSON)' })
    return
  }

  const parsed = WsClientEventSchema.safeParse(parsedJson)
  if (!parsed.success) {
    send(ws, { type: 'error', code: 'BAD_EVENT', message: 'Sự kiện không hợp lệ' })
    return
  }
  const event = parsed.data

  if (event.type === 'ping') {
    send(ws, { type: 'pong' })
    return
  }

  if (!(await checkRateLimit(userId, CHAT_WS_EVENTS_PER_MIN, 'chat-ws-event'))) {
    send(ws, {
      type: 'error',
      code: 'RATE_LIMITED',
      message: 'Bạn thao tác quá nhanh — chờ chút nhé',
    })
    return
  }

  if (event.type === 'message') {
    if (!(await checkRateLimit(userId, CHAT_WS_MESSAGES_PER_MIN, 'chat-ws-message'))) {
      send(ws, {
        type: 'error',
        code: 'RATE_LIMITED',
        message: 'Bạn gửi tin quá nhanh — chờ một chút rồi gửi tiếp',
      })
      return
    }
    const result = await sendMessage(event.roomId, userId, event.content)
    if (!result.ok) {
      send(ws, {
        type: 'error',
        code: result.reason === 'blocked' ? 'MODERATION_BLOCKED' : 'ROOM_NOT_MEMBER',
        message:
          result.reason === 'blocked'
            ? 'Tin nhắn vi phạm quy định cộng đồng, không thể gửi'
            : 'Bạn không phải thành viên phòng này',
      })
      return
    }
    const memberIds = await getRoomMemberIds(event.roomId, userId)
    const serverEvent: WsServerEvent = { type: 'message', message: result.message }
    send(ws, serverEvent) // phản hồi ngay cho chính người gửi, không chờ vòng pub/sub
    await Promise.all(memberIds.map((id) => publish(userChannel(id), serverEvent)))
    // Thông báo đẩy là việc nền, không chờ — nhưng lỗi (Redis isOnline…) vẫn phải được bắt.
    notifyOfflinePeers(memberIds, userId, event.roomId, result.message.content).catch(
      (err: unknown) => logWsError('thông báo đẩy', userId, err),
    )
    return
  }

  if (event.type === 'typing') {
    if (!(await isRoomMember(event.roomId, userId))) return
    const memberIds = await getRoomMemberIds(event.roomId, userId)
    const serverEvent: WsServerEvent = {
      type: 'typing',
      roomId: event.roomId,
      userId,
      senderName: '',
    }
    await Promise.all(memberIds.map((id) => publish(userChannel(id), serverEvent)))
    return
  }

  if (event.type === 'read') {
    if (!(await isRoomMember(event.roomId, userId))) return
    await markRead(event.roomId, userId)
    const memberIds = await getRoomMemberIds(event.roomId, userId)
    const serverEvent: WsServerEvent = {
      type: 'read',
      roomId: event.roomId,
      userId,
      messageId: event.messageId,
    }
    await Promise.all(memberIds.map((id) => publish(userChannel(id), serverEvent)))
  }
}
