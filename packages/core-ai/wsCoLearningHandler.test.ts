import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { createServer } from 'node:http'
import {
  _resetWsCoLearningHandlerStateForTests,
  WS_CO_LEARNING_PATH,
  attachCoLearningWebSocketServer,
} from './wsCoLearningHandler.js'
import { processAudioChunk, requestAiSocraticHint } from './audioCoLearningService.js'
import { MAX_CO_LEARNING_MESSAGE_BYTES } from '@dhcb/core-contracts/audioCoLearningRoom'

const state = vi.hoisted(() => ({
  server: null as import('node:events').EventEmitter | null,
  options: null as Record<string, unknown> | null,
}))
vi.mock('ws', async () => {
  const { EventEmitter } = await import('node:events')
  return {
    WebSocket: { OPEN: 1 },
    WebSocketServer: class extends EventEmitter {
      constructor(options: Record<string, unknown>) {
        super()
        state.server = this
        state.options = options
      }
    },
  }
})
vi.mock('@dhcb/core-auth/security', () => ({
  validateAuth: vi.fn(async () => ({ userId: 'authenticated-user' })),
  isAllowedWebSocketOrigin: (origin: unknown) => origin === 'https://en-vi.donghanhcungban.org',
}))
vi.mock('./audioCoLearningService.js', () => ({
  processAudioChunk: vi.fn(),
  requestAiSocraticHint: vi.fn().mockResolvedValue(null),
  joinAudioRoom: vi.fn().mockReturnValue({ success: true }),
  leaveAudioRoom: vi.fn(),
  setMemberMuted: vi.fn(),
  broadcastAiSocraticHint: vi.fn(),
  subscribeToRoomEvents: vi.fn().mockReturnValue(() => {}),
  getAudioRoom: vi.fn(),
}))

class FakeSocket extends EventEmitter {
  readyState = 1
  send = vi.fn()
}

describe('wsCoLearningHandler', () => {
  beforeEach(() => {
    _resetWsCoLearningHandlerStateForTests()
    vi.clearAllMocks()
    vi.mocked(processAudioChunk).mockReturnValue({
      relayTo: [],
      isSpeaking: false,
      shouldTriggerAiModerator: true,
      silenceDurationMs: 9_000,
    })
  })

  function joinedSocket() {
    attachCoLearningWebSocketServer(createServer())
    const socket = new FakeSocket()
    state.server!.emit('connection', socket, {}, { userId: 'authenticated-user' })
    socket.emit(
      'message',
      Buffer.from(JSON.stringify({ type: 'join_room', roomId: 'room-a', displayName: 'User' })),
      false,
    )
    return socket
  }

  it('should define correct WS path', () => {
    expect(WS_CO_LEARNING_PATH).toBe('/ws/co-learning-room')
  })

  it('should reset state cleanly without error', () => {
    expect(() => _resetWsCoLearningHandlerStateForTests()).not.toThrow()
  })

  it('giới hạn frame tại WebSocket trước khi parse', () => {
    joinedSocket()
    expect(state.options?.maxPayload).toBe(MAX_CO_LEARNING_MESSAGE_BYTES)
  })

  it.each([true, false])('binary=%s đi qua cổng AI với user của session', (binary) => {
    const socket = joinedSocket()
    const data = binary
      ? Buffer.from([0, 0])
      : Buffer.from(
          JSON.stringify({
            type: 'audio_chunk',
            roomId: 'room-a',
            audioBase64: 'AAA=',
            audioLevel: 0,
            userId: 'forged-user',
          }),
        )
    socket.emit('message', data, binary)
    expect(requestAiSocraticHint).toHaveBeenCalledExactlyOnceWith(
      'room-a',
      'authenticated-user',
      binary ? 'probing_reasons' : 'probing_assumptions',
    )
  })

  it('manual request cũng đi qua cổng AI và không nhận userId giả', () => {
    const socket = joinedSocket()
    socket.emit(
      'message',
      Buffer.from(
        JSON.stringify({
          type: 'request_ai_hint',
          roomId: 'room-a',
          userId: 'forged-user',
        }),
      ),
      false,
    )
    expect(requestAiSocraticHint).toHaveBeenCalledExactlyOnceWith(
      'room-a',
      'authenticated-user',
      'clarification',
      'manual',
    )
  })

  it('không gọi AI cho phòng khác với session', () => {
    const socket = joinedSocket()
    socket.emit(
      'message',
      Buffer.from(
        JSON.stringify({
          type: 'request_ai_hint',
          roomId: 'other-room',
        }),
      ),
      false,
    )
    expect(requestAiSocraticHint).not.toHaveBeenCalled()
  })

  it.each([true, false])('từ chối audio quá lớn binary=%s trước relay/gọi AI', (binary) => {
    const socket = joinedSocket()
    const data = binary
      ? Buffer.alloc(64_001)
      : Buffer.from(
          JSON.stringify({
            type: 'audio_chunk',
            roomId: 'room-a',
            audioBase64: 'A'.repeat(90_000),
          }),
        )
    socket.emit('message', data, binary)
    expect(processAudioChunk).not.toHaveBeenCalled()
    expect(requestAiSocraticHint).not.toHaveBeenCalled()
  })
})

describe('wsCoLearningHandler — chống chiếm phiên WebSocket (vá 2026-09-27)', () => {
  it.each([undefined, 'https://sales.donghanhcungban.org', 'https://evil.test'])(
    'upgrade từ Origin %s → 403, không kiểm phiên',
    async (origin) => {
      const httpServer = new EventEmitter()
      attachCoLearningWebSocketServer(httpServer as never)
      const socket = { write: vi.fn(), destroy: vi.fn() }
      httpServer.emit(
        'upgrade',
        { url: WS_CO_LEARNING_PATH, headers: { cookie: 'session_token=x', origin } },
        socket,
        Buffer.alloc(0),
      )
      await new Promise((r) => setTimeout(r, 0))
      expect(socket.write).toHaveBeenCalledWith(expect.stringContaining('403'))
      expect(socket.destroy).toHaveBeenCalled()
    },
  )
})
