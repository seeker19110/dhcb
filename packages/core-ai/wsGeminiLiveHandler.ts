// Gemini Live chỉ mở upstream sau Origin, phiên đăng nhập và cổng ngân sách dùng chung REST/WS.
import { randomUUID } from 'node:crypto'
import type { Server as HttpServer, IncomingMessage } from 'node:http'
import { WebSocketServer, WebSocket, type RawData } from 'ws'
import { validateAuth, getCorsHeaders, checkRateLimit } from '@dhcb/core-auth/security'
import { getAppSettings } from '@dhcb/core-db/settings'
import { getClientIp } from '@dhcb/core-http/http'
import {
  createGeminiLiveSession,
  removeGeminiLiveSession,
  type GeminiLiveSession,
} from './geminiLiveService.js'
import { reserveGeminiLiveUsage, type GeminiLiveAdmission } from './geminiLiveAdmission.js'
import {
  GeminiLiveClientPacketSchema,
  type GeminiLiveServerPacket,
} from '@dhcb/core-contracts/geminiLive'

export const WS_GEMINI_LIVE_PATH = '/ws/gemini-live'
export const WS_GEMINI_MAX_PAYLOAD = 64 * 1024
const REVALIDATE_MS = 30_000
const IDLE_MS = 60_000
const activeLiveSockets = new Map<WebSocket, () => void>()

function upgradeRequest(req: IncomingMessage): Request {
  const headers = new Headers({
    cookie: req.headers.cookie ?? '',
    origin: req.headers.origin ?? '',
  })
  // Cùng chính sách proxy với HTTP: CF/Nginx phải ghi đè real IP và chặn truy cập origin trực tiếp.
  for (const name of ['cf-connecting-ip', 'x-real-ip', 'x-forwarded-for']) {
    const value = req.headers[name]
    if (typeof value === 'string') headers.set(name, value)
  }
  return new Request('http://localhost' + WS_GEMINI_LIVE_PATH, {
    headers,
  })
}

function allowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const cors = getCorsHeaders(request)
  // Không dùng '*' cho WebSocket có cookie; cùng whitelist chính xác của HTTP/CORS.
  return Boolean(
    origin &&
    cors['Access-Control-Allow-Origin'] === origin &&
    cors['Access-Control-Allow-Credentials'] === 'true',
  )
}

export function _resetWsGeminiLiveHandlerStateForTests(): void {
  for (const cleanup of activeLiveSockets.values()) cleanup()
  activeLiveSockets.clear()
}

function connectClient(
  ws: WebSocket,
  request: Request,
  userId: string,
  admission: GeminiLiveAdmission,
): void {
  const sessionId = `live-${randomUUID()}`
  let session: GeminiLiveSession | undefined
  let closed = false
  let lastActivity = Date.now()
  let checking = false
  let windowStart = Date.now()
  let frameCount = 0
  let audioBytes = 0
  let timer: ReturnType<typeof setInterval> | undefined
  const cleanup = () => {
    if (closed) return
    closed = true
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
    // Khi upstream đã được mở, không hoàn lượt vì client ngắt kết nối/lỗi tiếp theo.
    if (session?.hasProviderStarted()) admission.markStarted()
    removeGeminiLiveSession(sessionId)
    admission.release()
    void admission.refundBeforeStart()
    activeLiveSockets.delete(ws)
    ws.terminate()
  }
  activeLiveSockets.set(ws, cleanup)
  ws.on('close', cleanup)
  ws.on('error', cleanup)

  try {
    session = createGeminiLiveSession({ sessionId, personId: userId })
    session.once('closed', cleanup)
    session.on('packet', (packet: GeminiLiveServerPacket) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(packet))
    })
    session.start()
    if (session.hasProviderStarted()) admission.markStarted()
    else void admission.refundBeforeStart()
  } catch {
    cleanup()
    return
  }
  if (closed) return

  timer = setInterval(() => {
    if (Date.now() - lastActivity >= IDLE_MS) {
      cleanup()
      return
    }
    if (checking || closed) return
    checking = true
    void Promise.all([validateAuth(request), getAppSettings({ requireAvailable: true })])
      .then(([auth, settings]) => {
        if (auth?.userId !== userId || settings.aiCircuitBreaker) cleanup()
      })
      .catch(cleanup)
      .finally(() => {
        checking = false
      })
  }, REVALIDATE_MS)
  timer.unref()

  ws.on('message', (rawData: RawData, isBinary: boolean) => {
    if (closed) return
    try {
      if (Date.now() - windowStart >= 1000) {
        windowStart = Date.now()
        frameCount = 0
        audioBytes = 0
      }
      if (++frameCount > 100) {
        cleanup()
        return
      }
      const data = Array.isArray(rawData)
        ? Buffer.concat(rawData)
        : Buffer.isBuffer(rawData)
          ? rawData
          : Buffer.from(rawData)
      if (data.length > WS_GEMINI_MAX_PAYLOAD) {
        cleanup()
        return
      }
      if (isBinary) {
        audioBytes += data.length
        if (audioBytes > 64_000) {
          cleanup()
          return
        }
        session?.handleUserAudioChunk(data)
      } else {
        const validation = GeminiLiveClientPacketSchema.safeParse(JSON.parse(data.toString()))
        if (!validation.success) {
          cleanup()
          return
        }
        const packet = validation.data
        if (packet.type === 'realtime_input') {
          const chunks = packet.mediaChunks
          // Chỉ PCM 16kHz hợp lệ; giới hạn bytes thực, không tin mimeType hoặc base64 client tự khai.
          if (
            chunks.length > 8 ||
            chunks.some(
              (chunk) =>
                chunk.mimeType !== 'audio/pcm;rate=16000' ||
                !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
                  chunk.data,
                ),
            )
          ) {
            cleanup()
            return
          }
          audioBytes += chunks.reduce(
            (sum, chunk) => sum + Buffer.byteLength(chunk.data, 'base64'),
            0,
          )
          if (audioBytes > 64_000) {
            cleanup()
            return
          }
          for (const chunk of chunks) session?.handleUserAudioChunk(chunk.data)
        } else if (packet.type === 'interrupt') {
          session?.interrupt()
        }
        // setup/client_content không được phép ghi đè cấu hình/chi phí server.
      }
      lastActivity = Date.now()
    } catch {
      cleanup()
    }
  })
}

/** Gắn WebSocket server Gemini Live vào httpServer. */
export function attachGeminiLiveWebSocketServer(server: HttpServer): void {
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: WS_GEMINI_MAX_PAYLOAD,
    perMessageDeflate: false,
  })
  server.on('upgrade', (req, socket, head) => {
    if (req.url?.split('?')[0] !== WS_GEMINI_LIVE_PATH) return
    const request = upgradeRequest(req)
    const reject = (status: 401 | 403 | 429 | 503) => {
      if (!socket.destroyed) {
        socket.write(`HTTP/1.1 ${status} Rejected\r\nConnection: close\r\n\r\n`)
        socket.destroy()
      }
    }
    if (!allowedOrigin(request)) {
      reject(403)
      return
    }
    // Socket upgrade có thể half-close trong lúc đợi DB; ws chưa gắn listener để dọn hộ.
    const endBeforeUpgrade = () => socket.destroy()
    socket.once('end', endBeforeUpgrade)
    void (async () => {
      const forwardedIp = getClientIp(request)
      const clientIp =
        forwardedIp === 'unknown' ? (req.socket.remoteAddress ?? 'unknown') : forwardedIp
      if (!(await checkRateLimit(clientIp, 10, 'gemini-live-upgrade'))) {
        reject(429)
        return
      }
      const auth = await validateAuth(request)
      if (!auth) {
        reject(401)
        return
      }
      if (socket.destroyed || socket.readableEnded) return
      const gate = await reserveGeminiLiveUsage(auth.userId)
      if (!gate.ok) {
        reject(gate.status)
        return
      }
      let connected = false
      const abandon = () => {
        if (connected) return
        gate.admission.release()
        void gate.admission.refundBeforeStart()
      }
      socket.once('close', abandon)
      try {
        if (socket.destroyed || socket.readableEnded) {
          abandon()
          return
        }
        wss.handleUpgrade(req, socket, head, (ws) => {
          connected = true
          socket.removeListener('end', endBeforeUpgrade)
          socket.removeListener('close', abandon)
          connectClient(ws, request, auth.userId, gate.admission)
        })
      } catch {
        abandon()
        reject(503)
      }
    })().catch(() => reject(503))
  })
  server.on('close', () => {
    _resetWsGeminiLiveHandlerStateForTests()
    wss.close()
  })
}
