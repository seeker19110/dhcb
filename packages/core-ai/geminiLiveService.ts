// packages/core-ai/geminiLiveService.ts — Cầu nối phiên Gemini Live thật qua WebSocket BidiGenerateContent.
//
// PROTOTYPE (2026-08-21): mới verify bằng WebSocket giả lập trong test (geminiLiveService.test.ts),
// CHƯA chạy được với API key thật (sandbox không có GEMINI_API_KEY).
//
// [2026-08-23] RÀ LẠI THEO TÀI LIỆU HIỆN HÀNH — sửa 2 điểm CHẮC CHẮN HỎNG nếu chạy hôm nay:
//   1. Endpoint ghim `v1alpha`; tài liệu Live API hiện hành dùng `v1beta`.
//   2. Model mặc định `gemini-2.0-flash-exp` — dòng Gemini 2.0 Flash ĐÃ NGỪNG PHỤC VỤ
//      31/03/2026, tức đã chết trước thời điểm này.
// Cả hai nay đọc từ biến môi trường (`GEMINI_LIVE_WS_URL`, `GEMINI_LIVE_MODEL`) để lần sau
// Google đổi tên thì SỬA .env LÀ XONG, không phải sửa code + deploy lại.
//
// XÁC MINH BẰNG MÁY CÓ KEY: `npm run smoke:gemini-live` — script liệt kê đúng những model mà
// tài khoản của bạn được phép dùng cho Live, rồi mở một phiên thật. Đừng tin số liệu ở đây,
// hãy chạy nó.
import { EventEmitter } from 'node:events'
import { WebSocket } from 'ws'
import {
  type GeminiLiveSessionConfig,
  type GeminiLiveStatus,
  type GeminiLiveServerPacket,
  GeminiLiveSessionConfigSchema,
  GEMINI_LIVE_VERSION,
} from '@dhcb/core-contracts/geminiLive'

// Đổi được qua env — xem chú thích đầu file (Google đổi phiên bản/tên model khá thường xuyên).
export const DEFAULT_GEMINI_LIVE_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'

function geminiLiveWsBase(): string {
  return process.env.GEMINI_LIVE_WS_URL || DEFAULT_GEMINI_LIVE_WS_URL
}

/** Cho phép test tiêm factory tạo WebSocket giả — production dùng `ws` thật. */
export type WebSocketFactory = (url: string) => WebSocket
let webSocketFactory: WebSocketFactory = (url) => new WebSocket(url)
export function _setWebSocketFactoryForTests(factory: WebSocketFactory | null): void {
  webSocketFactory = factory ?? ((url) => new WebSocket(url))
}

export class GeminiLiveSession extends EventEmitter {
  public readonly config: GeminiLiveSessionConfig
  private status: GeminiLiveStatus = 'idle'
  private timer: NodeJS.Timeout | null = null
  private idleTimer: NodeJS.Timeout | null = null
  private isDestroyed: boolean = false
  private upstream: WebSocket | null = null
  private providerStarted = false

  constructor(
    rawConfig: Partial<GeminiLiveSessionConfig> & { sessionId: string; personId: string },
  ) {
    super()
    this.config = GeminiLiveSessionConfigSchema.parse(rawConfig)
  }

  public getStatus(): GeminiLiveStatus {
    return this.status
  }

  public hasProviderStarted(): boolean {
    return this.providerStarted
  }

  public start(): void {
    if (this.isDestroyed || this.status !== 'idle') return
    this.status = 'connecting'

    this.timer = setTimeout(() => {
      this.close('Session time limit exceeded')
    }, this.config.maxDurationSeconds * 1000)
    this.resetIdleTimer()

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      // Không có key → chế độ dự phòng, client tự chuyển sang STT/TTS pipeline cũ.
      this.status = 'fallback_mode'
      this.emitPacket({
        type: 'fallback',
        sessionId: this.config.sessionId,
        textDelta: 'Chế độ tương thích: Sẵn sàng nhận giọng nói qua Web Speech / Audio DSP.',
        timestamp: Date.now(),
        schemaVersion: GEMINI_LIVE_VERSION,
      })
      return
    }

    this.connectUpstream(apiKey)
  }

  private connectUpstream(apiKey: string): void {
    const model = process.env.GEMINI_LIVE_MODEL || this.config.model
    const url = `${geminiLiveWsBase()}?key=${encodeURIComponent(apiKey)}`
    const ws = webSocketFactory(url)
    this.providerStarted = true
    this.upstream = ws

    ws.on('open', () => {
      ws.send(
        JSON.stringify({
          setup: {
            model: model.startsWith('models/') ? model : `models/${model}`,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: this.config.voiceName } },
              },
            },
            ...(this.config.systemInstruction
              ? { systemInstruction: { parts: [{ text: this.config.systemInstruction }] } }
              : {}),
          },
        }),
      )
    })

    ws.on('message', (raw) => this.handleUpstreamMessage(raw))

    ws.on('error', () => {
      this.status = 'error'
      this.emitPacket({
        type: 'error',
        sessionId: this.config.sessionId,
        // Lỗi ws có thể chứa URL kèm API key; không phản chiếu chi tiết provider cho client.
        errorMessage: 'Gemini Live tạm thời không khả dụng.',
        timestamp: Date.now(),
        schemaVersion: GEMINI_LIVE_VERSION,
      })
      this.close('Upstream connection failed')
    })

    ws.on('close', () => {
      if (!this.isDestroyed) this.close('Upstream connection closed')
    })
  }

  private handleUpstreamMessage(raw: unknown): void {
    let data: Record<string, unknown>
    try {
      const text =
        typeof raw === 'string' ? raw : Buffer.isBuffer(raw) ? raw.toString('utf8') : String(raw)
      data = JSON.parse(text)
    } catch {
      return
    }

    if (data.setupComplete) {
      this.status = 'active'
      this.emitPacket({
        type: 'session_ready',
        sessionId: this.config.sessionId,
        timestamp: Date.now(),
        schemaVersion: GEMINI_LIVE_VERSION,
      })
      return
    }

    const serverContent = data.serverContent as
      | {
          modelTurn?: { parts?: Array<{ inlineData?: { data?: string }; text?: string }> }
          interrupted?: boolean
          turnComplete?: boolean
        }
      | undefined
    if (!serverContent) return

    if (serverContent.interrupted) {
      this.status = 'barge_in'
      this.emitPacket({
        type: 'interrupted',
        sessionId: this.config.sessionId,
        timestamp: Date.now(),
        schemaVersion: GEMINI_LIVE_VERSION,
      })
    }

    for (const part of serverContent.modelTurn?.parts ?? []) {
      if (part.inlineData?.data) {
        this.status = 'ai_speaking'
        this.emitPacket({
          type: 'audio_chunk',
          sessionId: this.config.sessionId,
          audioBase64: part.inlineData.data,
          timestamp: Date.now(),
          schemaVersion: GEMINI_LIVE_VERSION,
        })
      }
      if (part.text) {
        this.emitPacket({
          type: 'text_delta',
          sessionId: this.config.sessionId,
          textDelta: part.text,
          timestamp: Date.now(),
          schemaVersion: GEMINI_LIVE_VERSION,
        })
      }
    }

    if (serverContent.turnComplete) {
      this.status = 'active'
      this.emitPacket({
        type: 'turn_complete',
        sessionId: this.config.sessionId,
        timestamp: Date.now(),
        schemaVersion: GEMINI_LIVE_VERSION,
      })
    }
  }

  public handleUserAudioChunk(pcmChunk: Buffer | string): void {
    if (this.isDestroyed || this.status === 'closed' || this.status === 'fallback_mode') return

    const base64 = typeof pcmChunk === 'string' ? pcmChunk : pcmChunk.toString('base64')

    if (this.upstream && this.upstream.readyState === WebSocket.OPEN) {
      this.resetIdleTimer()
      this.status = 'user_speaking'
      this.upstream.send(
        JSON.stringify({
          realtimeInput: {
            mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: base64 }],
          },
        }),
      )
    }
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => this.close('Session idle timeout'), 60_000)
    this.idleTimer.unref()
  }

  /** Client báo đã ngắt lời AI (barge-in phía UI) — Live API tự phát hiện qua VAD, đây chỉ cập nhật trạng thái local. */
  public interrupt(): void {
    if (this.isDestroyed) return
    this.status = 'barge_in'
    this.emitPacket({
      type: 'interrupted',
      sessionId: this.config.sessionId,
      timestamp: Date.now(),
      schemaVersion: GEMINI_LIVE_VERSION,
    })
    this.status = 'active'
  }

  public close(reason?: string): void {
    if (this.isDestroyed) return
    this.isDestroyed = true
    this.status = 'closed'

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }

    if (this.upstream) {
      this.upstream.removeAllListeners()
      // ws CONNECTING phát error bất đồng bộ khi close(); giữ listener để không crash process.
      this.upstream.on('error', () => {})
      if (
        this.upstream.readyState === WebSocket.OPEN ||
        this.upstream.readyState === WebSocket.CONNECTING
      ) {
        this.upstream.close()
      }
      this.upstream = null
    }

    this.emitPacket({
      type: 'turn_complete',
      sessionId: this.config.sessionId,
      errorMessage: reason,
      timestamp: Date.now(),
      schemaVersion: GEMINI_LIVE_VERSION,
    })
    this.emit('closed')
    this.removeAllListeners()
  }

  private emitPacket(packet: GeminiLiveServerPacket): void {
    if (this.isDestroyed && packet.type !== 'turn_complete') return
    this.emit('packet', packet)
  }
}

// In-memory active live sessions map
const activeLiveSessions = new Map<string, GeminiLiveSession>()

export function createGeminiLiveSession(
  config: Partial<GeminiLiveSessionConfig> & { sessionId: string; personId: string },
): GeminiLiveSession {
  if (activeLiveSessions.has(config.sessionId)) {
    throw new Error('Session ID already exists')
  }
  const session = new GeminiLiveSession(config)
  activeLiveSessions.set(config.sessionId, session)
  session.once('closed', () => {
    if (activeLiveSessions.get(config.sessionId) === session) {
      activeLiveSessions.delete(config.sessionId)
    }
  })
  return session
}

export function getGeminiLiveSession(sessionId: string): GeminiLiveSession | undefined {
  return activeLiveSessions.get(sessionId)
}

export function removeGeminiLiveSession(sessionId: string): void {
  const session = activeLiveSessions.get(sessionId)
  if (session) {
    session.close()
    activeLiveSessions.delete(sessionId)
  }
}

export function _resetGeminiLiveServiceStateForTests(): void {
  for (const s of activeLiveSessions.values()) {
    s.close()
  }
  activeLiveSessions.clear()
}
