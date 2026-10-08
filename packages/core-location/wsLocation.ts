// packages/core-location/wsLocation.ts — WebSocket thời gian thực cho "Đi chung".
//
// Dùng lại đúng khuôn của chat (packages/core-chat/wsHandler.ts): gắn vào http.Server sẵn có,
// auth qua cookie HttpOnly, fan-out qua Redis pub/sub để chạy đúng khi PM2 cluster nhiều
// instance. Kênh theo CHUYẾN (`loc:session:<id>`) chứ không theo user như chat: ai đang mở màn
// hình chuyến nào thì subscribe kênh chuyến đó.
//
// REST (/api/location) vẫn làm được mọi việc — WebSocket chỉ là lớp tăng tốc. Trình duyệt nào
// không mở được WS thì client tự quay về chế độ polling (xem apps/dhcb/src/lib/locationShare.ts).

import type { Server as HttpServer, IncomingMessage } from 'node:http'
import { WebSocketServer, WebSocket, type RawData } from 'ws'
import { checkRateLimit, isAllowedWebSocketOrigin, validateAuth } from '@dhcb/core-auth/security'
import {
  WsLocationClientEventSchema,
  type WsLocationServerEvent,
} from '@dhcb/core-contracts/location'
import { publish, subscribeChannel } from '@dhcb/core-chat/redisChat'
import { getActiveMembership, getSessionState, recordPosition } from './locationService.js'

const WS_PATH = '/ws/location'

// Trần MỘT khung WebSocket: sự kiện vị trí chỉ vài trăm byte. Không đặt thì thư viện `ws` nhận
// tới 100 MiB/khung (vá 2026-09-27).
export const LOCATION_WS_MAX_PAYLOAD = 16 * 1024
// Mỗi sự kiện vị trí = một lần GHI Postgres + phát Redis. Cùng trần với REST /api/location
// (120/phút) nhưng đếm theo NGƯỜI DÙNG — trước đây đường WS không có giới hạn nào.
export const LOCATION_WS_EVENTS_PER_MIN = 120

function sessionChannel(sessionId: string): string {
  return `loc:session:${sessionId}`
}

function send(ws: WebSocket, event: WsLocationServerEvent): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event))
}

/** Phát sự kiện tới mọi người đang mở chuyến — kể cả ở tiến trình PM2 khác. */
export async function broadcastToSession(
  sessionId: string,
  event: WsLocationServerEvent,
): Promise<void> {
  await publish(sessionChannel(sessionId), event)
}

// Socket đang mở TRONG TIẾN TRÌNH NÀY, gom theo chuyến.
const socketsBySession = new Map<string, Set<WebSocket>>()
const channelUnsubscribers = new Map<string, () => void>()
// Chủ của từng socket — cần để thu hồi đúng socket của người vừa rời chuyến.
const socketOwner = new WeakMap<WebSocket, string>()

export function _resetWsLocationStateForTests(): void {
  socketsBySession.clear()
  for (const unsub of channelUnsubscribers.values()) unsub()
  channelUnsubscribers.clear()
}

function ensureChannelSubscription(sessionId: string): void {
  if (channelUnsubscribers.has(sessionId)) return
  const unsub = subscribeChannel(sessionChannel(sessionId), (payload) => {
    const sockets = socketsBySession.get(sessionId)
    if (!sockets) return
    const event = payload as WsLocationServerEvent
    // Thu hồi quyền ngay khi có sự kiện rời/kết thúc (vá 2026-10-07): trước đây socket của người
    // đã RỜI chuyến vẫn nhận vị trí tới khi nó tự gửi sự kiện kế tiếp.
    if (event.type === 'member_left') {
      for (const ws of [...sockets]) {
        if (socketOwner.get(ws) === event.userId) removeSocket(sessionId, ws)
      }
      for (const ws of sockets) send(ws, event)
      return
    }
    const recipients = [...sockets]
    for (const ws of recipients) send(ws, event)
    if (event.type === 'session_ended') {
      for (const ws of recipients) removeSocket(sessionId, ws)
    }
  })
  channelUnsubscribers.set(sessionId, unsub)
}

function addSocket(sessionId: string, ws: WebSocket): void {
  const set = socketsBySession.get(sessionId) ?? new Set<WebSocket>()
  set.add(ws)
  socketsBySession.set(sessionId, set)
  ensureChannelSubscription(sessionId)
}

function removeSocket(sessionId: string, ws: WebSocket): void {
  const set = socketsBySession.get(sessionId)
  if (!set) return
  set.delete(ws)
  if (set.size > 0) return
  socketsBySession.delete(sessionId)
  channelUnsubscribers.get(sessionId)?.()
  channelUnsubscribers.delete(sessionId)
}

async function authenticateUpgrade(req: IncomingMessage): Promise<{ userId: string } | null> {
  const cookie = req.headers.cookie ?? ''
  const fakeRequest = new Request('http://localhost' + WS_PATH, { headers: { cookie } })
  return validateAuth(fakeRequest)
}

export function attachLocationWebSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true, maxPayload: LOCATION_WS_MAX_PAYLOAD })

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '', 'http://localhost')
    if (url.pathname !== WS_PATH) return
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
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req, auth))
      })
      .catch(() => socket.destroy())
  })

  wss.on('connection', (ws: WebSocket, _req: IncomingMessage, auth: { userId: string }) => {
    handleConnection(ws, auth.userId)
  })
}

export function handleConnection(ws: WebSocket, userId: string): void {
  // Chuyến mà socket này đang theo dõi — mỗi lần subscribe đều kiểm quyền lại ở DB.
  const joined = new Set<string>()
  socketOwner.set(ws, userId)

  ws.on('message', (raw: RawData) => {
    // [2026-10-08] Bản cũ `void handleClientEvent(...)` không `.catch`: CSDL/Redis lỗi giữa chừng
    // → promise bị từ chối không ai bắt (Node không có handler unhandledRejection → sập worker
    // PM2) và người dùng không biết vị trí chưa được ghi. Nay log + báo lỗi cho client.
    handleClientEvent(ws, userId, joined, raw).catch((err: unknown) => {
      console.error(
        `[location-ws] lỗi xử lý sự kiện (user ${userId}):`,
        err instanceof Error ? err.message : err,
      )
      send(ws, { type: 'error', message: 'Máy chủ đang trục trặc, thử lại sau' })
    })
  })

  ws.on('close', () => {
    for (const sessionId of joined) removeSocket(sessionId, ws)
    joined.clear()
  })
}

async function handleClientEvent(
  ws: WebSocket,
  userId: string,
  joined: Set<string>,
  raw: RawData,
): Promise<void> {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw.toString())
  } catch {
    send(ws, { type: 'error', message: 'Dữ liệu không hợp lệ' })
    return
  }
  const event = WsLocationClientEventSchema.safeParse(parsed)
  if (!event.success) {
    send(ws, { type: 'error', message: 'Sự kiện không hợp lệ' })
    return
  }

  if (!(await checkRateLimit(userId, LOCATION_WS_EVENTS_PER_MIN, 'location-ws'))) {
    send(ws, { type: 'error', message: 'Gửi vị trí quá dày — chờ chút nhé' })
    return
  }

  const { sessionId } = event.data
  if (event.data.type === 'unsubscribe') {
    joined.delete(sessionId)
    removeSocket(sessionId, ws)
    return
  }

  // KHÔNG tin danh sách `joined` trong bộ nhớ: quyền có thể bị thu hồi giữa chừng (rời chuyến,
  // chuyến hết hạn) nên kiểm lại ở DB mỗi sự kiện.
  const membership = await getActiveMembership(sessionId, userId)
  if (!membership) {
    joined.delete(sessionId)
    removeSocket(sessionId, ws)
    send(ws, { type: 'error', message: 'Bạn không còn ở trong chuyến này' })
    return
  }

  if (event.data.type === 'subscribe') {
    joined.add(sessionId)
    addSocket(sessionId, ws)
    const state = await getSessionState(sessionId, userId)
    if (state) send(ws, { type: 'state', state })
    return
  }

  // type === 'position'
  const member = await recordPosition(sessionId, userId, event.data.position)
  if (!member) return // đang tắt chia sẻ → bỏ qua im lặng, không báo lỗi
  await broadcastToSession(sessionId, { type: 'position', sessionId, member })
}
