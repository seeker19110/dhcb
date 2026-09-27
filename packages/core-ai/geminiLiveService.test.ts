// packages/core-ai/geminiLiveService.test.ts — Tests cho Gemini Live Service (WebSocket thật, giả lập bằng fake factory)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import {
  GeminiLiveSession,
  createGeminiLiveSession,
  getGeminiLiveSession,
  removeGeminiLiveSession,
  _resetGeminiLiveServiceStateForTests,
  _setWebSocketFactoryForTests,
} from './geminiLiveService.js'

/** WebSocket giả tối thiểu — đủ để service gọi .on/.send/.close/.readyState mà không nối mạng thật. */
class FakeUpstreamSocket extends EventEmitter {
  public readyState = 0 // CONNECTING
  public sent: string[] = []

  open(): void {
    this.readyState = 1 // OPEN
    this.emit('open')
  }

  serverMessage(payload: unknown): void {
    this.emit('message', JSON.stringify(payload))
  }

  send(data: string): void {
    this.sent.push(data)
  }

  close(): void {
    this.readyState = 3 // CLOSED
    this.emit('close')
  }
}

describe('geminiLiveService', () => {
  const originalKey = process.env.GEMINI_API_KEY
  let fakeSocket: FakeUpstreamSocket

  beforeEach(() => {
    _resetGeminiLiveServiceStateForTests()
    process.env.GEMINI_API_KEY = 'test-gemini-live-key'
    fakeSocket = new FakeUpstreamSocket()
    _setWebSocketFactoryForTests(() => fakeSocket as never)
  })

  afterEach(() => {
    _resetGeminiLiveServiceStateForTests()
    vi.useRealTimers()
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY
    else process.env.GEMINI_API_KEY = originalKey
    _setWebSocketFactoryForTests(null)
  })

  it('ID trùng không ghi đè phiên đang mở của người khác', () => {
    const owner = createGeminiLiveSession({ sessionId: 'same-id', personId: 'owner' })
    expect(() => createGeminiLiveSession({ sessionId: 'same-id', personId: 'attacker' })).toThrow(
      'Session ID already exists',
    )
    expect(getGeminiLiveSession('same-id')).toBe(owner)
  })

  it('start gọi lặp không mở thêm upstream và timeout tự dọn registry', () => {
    vi.useFakeTimers()
    const factory = vi.fn(() => fakeSocket as never)
    _setWebSocketFactoryForTests(factory)
    const session = createGeminiLiveSession({
      sessionId: 'idempotent-start',
      personId: 'owner',
      maxDurationSeconds: 30,
    })
    session.start()
    session.start()
    expect(factory).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(30_000)
    expect(session.getStatus()).toBe('closed')
    expect(getGeminiLiveSession('idempotent-start')).toBeUndefined()
  })

  it('lỗi upstream không đưa URL/API key vào packet và dọn phiên', () => {
    const session = createGeminiLiveSession({ sessionId: 'error-cleanup', personId: 'owner' })
    const packets: unknown[] = []
    session.on('packet', (packet) => packets.push(packet))
    session.start()
    fakeSocket.emit('error', new Error('wss://provider?key=SECRET'))
    expect(JSON.stringify(packets)).not.toContain('SECRET')
    expect(session.getStatus()).toBe('closed')
    expect(getGeminiLiveSession('error-cleanup')).toBeUndefined()
    expect(() => fakeSocket.emit('error', new Error('late closing error'))).not.toThrow()
  })

  it('should connect to upstream and reach active status after setupComplete', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-01', personId: 'person-01' })
    expect(session).toBeInstanceOf(GeminiLiveSession)
    expect(session.getStatus()).toBe('idle')

    session.start()
    expect(session.getStatus()).toBe('connecting')

    fakeSocket.open()
    expect(fakeSocket.sent).toHaveLength(1)
    expect(JSON.parse(fakeSocket.sent[0]!)).toHaveProperty('setup')

    fakeSocket.serverMessage({ setupComplete: {} })
    expect(session.getStatus()).toBe('active')
  })

  it('should start in fallback mode when API key is missing', () => {
    delete process.env.GEMINI_API_KEY
    const session = createGeminiLiveSession({
      sessionId: 'sess-fallback',
      personId: 'person-01',
    })
    session.start()
    expect(session.getStatus()).toBe('fallback_mode')
  })

  it('should retrieve active session by ID', () => {
    createGeminiLiveSession({
      sessionId: 'sess-02',
      personId: 'person-02',
    })
    const retrieved = getGeminiLiveSession('sess-02')
    expect(retrieved).toBeDefined()
    expect(retrieved?.config.sessionId).toBe('sess-02')
  })

  it('should remove and close session properly', () => {
    const session = createGeminiLiveSession({
      sessionId: 'sess-03',
      personId: 'person-03',
    })
    session.start()
    removeGeminiLiveSession('sess-03')
    expect(getGeminiLiveSession('sess-03')).toBeUndefined()
    expect(session.getStatus()).toBe('closed')
  })

  it('should forward user audio chunks to upstream once active, and handle barge-in interrupt', () => {
    const session = createGeminiLiveSession({
      sessionId: 'sess-04',
      personId: 'person-04',
    })
    session.start()
    fakeSocket.open()
    fakeSocket.serverMessage({ setupComplete: {} })

    session.handleUserAudioChunk(Buffer.from([0, 1, 2, 3]))
    expect(session.getStatus()).toBe('user_speaking')
    const forwarded = fakeSocket.sent.find((m) => m.includes('realtimeInput'))
    expect(forwarded).toBeDefined()

    session.interrupt()
    expect(session.getStatus()).toBe('active')
  })

  it('should emit audio_chunk when upstream sends inline audio data', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-05', personId: 'person-05' })
    const packets: string[] = []
    session.on('packet', (p: { type: string }) => packets.push(p.type))

    session.start()
    fakeSocket.open()
    fakeSocket.serverMessage({ setupComplete: {} })
    fakeSocket.serverMessage({
      serverContent: {
        modelTurn: { parts: [{ inlineData: { data: 'YWJj' } }] },
        turnComplete: true,
      },
    })

    expect(packets).toContain('audio_chunk')
    expect(packets).toContain('turn_complete')
  })

  // ═══════════════════════════════════════════════════════════════════════════════════════
  // Đợt 2 coverage 2026-09-05: nhánh chưa phủ (branch 67,39% → siết lên ≥93%; webSocketFactory
  // mặc định CHƯA từng được gọi). Không lặp lại ca đã có ở trên — chỉ nhắm đúng nhánh còn
  // thiếu trong uncovered-all.md.
  // ═══════════════════════════════════════════════════════════════════════════════════════

  it('dùng WebSocket factory MẶC ĐỊNH (new WebSocket(url) từ gói ws) khi không tiêm factory giả', async () => {
    // KHÔNG dùng `ws` thật ở đây: gọi close() ngay sau start() với một socket CONNECTING thật
    // khiến `ws` tự ném lỗi bất đồng bộ "closed before connection established" — không listener
    // nào bắt được vì removeAllListeners() đã chạy trước đó (sandbox test cũng không có mạng ra
    // ngoài). Thay vào đó mock hẳn module `ws` rồi nạp lại module đích qua import động, để kiểm
    // đúng nhánh `factory ?? ((url) => new WebSocket(url))` mà không đụng mạng thật.
    vi.resetModules()
    class FakeWsCtor extends EventEmitter {
      static readonly CONNECTING = 0
      static readonly OPEN = 1
      static readonly CLOSING = 2
      static readonly CLOSED = 3
      public readyState = FakeWsCtor.CONNECTING
      public readonly url: string
      constructor(url: string) {
        super()
        this.url = url
      }
      send(): void {
        /* no-op */
      }
      close(): void {
        this.readyState = FakeWsCtor.CLOSED
        this.emit('close')
      }
    }
    vi.doMock('ws', () => ({ WebSocket: FakeWsCtor }))
    try {
      const mod = await import('./geminiLiveService.js')
      mod._resetGeminiLiveServiceStateForTests()
      mod._setWebSocketFactoryForTests(null) // dùng lại factory mặc định: (url) => new WebSocket(url)
      const session = mod.createGeminiLiveSession({ sessionId: 'sess-real-ws', personId: 'p' })
      session.start()
      expect(session.getStatus()).toBe('connecting')
      session.close()
      expect(session.getStatus()).toBe('closed')
    } finally {
      vi.doUnmock('ws')
      vi.resetModules()
    }
  })

  it('start(): gọi khi session ĐÃ bị đóng trước đó → không làm gì (không quay lại "connecting")', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-destroyed-start', personId: 'p' })
    session.close()
    expect(session.getStatus()).toBe('closed')
    session.start()
    expect(session.getStatus()).toBe('closed')
  })

  it('model đã có tiền tố "models/" → giữ nguyên, không thêm tiền tố lần hai', () => {
    const session = createGeminiLiveSession({
      sessionId: 'sess-model-prefixed',
      personId: 'p',
      model: 'models/gemini-custom',
    })
    session.start()
    fakeSocket.open()
    const setupMsg = JSON.parse(fakeSocket.sent[0]!) as { setup: { model: string } }
    expect(setupMsg.setup.model).toBe('models/gemini-custom')
  })

  it('có systemInstruction → gửi kèm trong setup gửi lên upstream', () => {
    const session = createGeminiLiveSession({
      sessionId: 'sess-sysinstr',
      personId: 'p',
      systemInstruction: 'Bạn là gia sư tiếng Anh thân thiện.',
    })
    session.start()
    fakeSocket.open()
    const setupMsg = JSON.parse(fakeSocket.sent[0]!) as {
      setup: { systemInstruction?: { parts: { text: string }[] } }
    }
    expect(setupMsg.setup.systemInstruction).toEqual({
      parts: [{ text: 'Bạn là gia sư tiếng Anh thân thiện.' }],
    })
  })

  it('upstream gửi message dạng Buffer (không phải string) → parse đúng qua toString utf8', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-buf-msg', personId: 'p' })
    session.start()
    fakeSocket.open()
    fakeSocket.emit('message', Buffer.from(JSON.stringify({ setupComplete: {} })))
    expect(session.getStatus()).toBe('active')
  })

  it('upstream gửi message không phải string cũng không phải Buffer → ép qua String(), không crash', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-other-raw', personId: 'p' })
    session.start()
    fakeSocket.open()
    expect(() => fakeSocket.emit('message', 12345)).not.toThrow()
    expect(session.getStatus()).toBe('connecting')
  })

  it('upstream gửi message KHÔNG PHẢI JSON hợp lệ → bỏ qua, không crash, không đổi trạng thái', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-badjson', personId: 'p' })
    session.start()
    fakeSocket.open()
    expect(() => fakeSocket.emit('message', 'khong-phai-json-{{{')).not.toThrow()
    expect(session.getStatus()).toBe('connecting')
  })

  it('message không có setupComplete lẫn serverContent → bỏ qua, không đổi trạng thái', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-empty-msg', personId: 'p' })
    session.start()
    fakeSocket.open()
    fakeSocket.serverMessage({ setupComplete: {} })
    fakeSocket.serverMessage({ somethingElse: true })
    expect(session.getStatus()).toBe('active')
  })

  it('serverContent.interrupted=true → phát sự kiện interrupted, trạng thái barge_in', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-interrupted-server', personId: 'p' })
    const packets: string[] = []
    session.on('packet', (p: { type: string }) => packets.push(p.type))
    session.start()
    fakeSocket.open()
    fakeSocket.serverMessage({ setupComplete: {} })
    fakeSocket.serverMessage({ serverContent: { interrupted: true } })
    expect(session.getStatus()).toBe('barge_in')
    expect(packets).toContain('interrupted')
  })

  it('serverContent có phần text (không có inlineData) → phát text_delta đúng nội dung', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-text-delta', personId: 'p' })
    const packets: { type: string; textDelta?: string }[] = []
    session.on('packet', (p: { type: string; textDelta?: string }) => packets.push(p))
    session.start()
    fakeSocket.open()
    fakeSocket.serverMessage({ setupComplete: {} })
    fakeSocket.serverMessage({
      serverContent: { modelTurn: { parts: [{ text: 'Xin chào!' }] } },
    })
    const textPacket = packets.find((p) => p.type === 'text_delta')
    expect(textPacket?.textDelta).toBe('Xin chào!')
  })

  it('handleUserAudioChunk: session đã đóng → bỏ qua, không gửi lên upstream', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-audio-closed', personId: 'p' })
    session.start()
    fakeSocket.open()
    session.close()
    fakeSocket.sent = []
    session.handleUserAudioChunk(Buffer.from([1, 2, 3]))
    expect(fakeSocket.sent).toHaveLength(0)
  })

  it('handleUserAudioChunk: đang ở fallback_mode (thiếu API key) → bỏ qua, không throw', () => {
    delete process.env.GEMINI_API_KEY
    const session = createGeminiLiveSession({ sessionId: 'sess-audio-fallback', personId: 'p' })
    session.start()
    expect(session.getStatus()).toBe('fallback_mode')
    expect(() => session.handleUserAudioChunk('base64data')).not.toThrow()
    expect(session.getStatus()).toBe('fallback_mode')
  })

  it('handleUserAudioChunk: pcmChunk truyền vào dạng chuỗi (đã base64 sẵn) → gửi nguyên chuỗi, không encode lại', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-audio-string', personId: 'p' })
    session.start()
    fakeSocket.open()
    fakeSocket.serverMessage({ setupComplete: {} })
    session.handleUserAudioChunk('da-base64-roi')
    const sent = fakeSocket.sent.find((m) => m.includes('realtimeInput'))
    const parsed = JSON.parse(sent!) as { realtimeInput: { mediaChunks: { data: string }[] } }
    expect(parsed.realtimeInput.mediaChunks[0]?.data).toBe('da-base64-roi')
  })

  it('interrupt(): gọi sau khi session đã đóng → không làm gì, không phát sự kiện', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-interrupt-closed', personId: 'p' })
    session.close()
    const packets: string[] = []
    session.on('packet', (p: { type: string }) => packets.push(p.type))
    session.interrupt()
    expect(packets).toHaveLength(0)
  })

  it('close(): gọi hai lần → lần thứ hai không làm gì thêm (idempotent)', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-close-twice', personId: 'p' })
    session.start()
    fakeSocket.open()
    session.close('lần 1')
    const packets: string[] = []
    session.on('packet', (p: { type: string }) => packets.push(p.type))
    session.close('lần 2 - không nên chạy')
    expect(packets).toHaveLength(0)
  })

  // emitPacket() là hàm PRIVATE, và bất biến "isDestroyed + type khác turn_complete → chặn"
  // không có đường vào nào qua API công khai (mọi listener upstream đã bị removeAllListeners()
  // trong close() TRƯỚC khi isDestroyed có thể true mà emitPacket còn được gọi lại) — gọi thẳng
  // qua ép kiểu để xác nhận đúng bất biến phòng thủ này, không phải lỗ hổng.
  it('emitPacket(): gọi trực tiếp sau khi đóng với packet KHÔNG PHẢI turn_complete → bị chặn (bất biến phòng thủ)', () => {
    const session = createGeminiLiveSession({ sessionId: 'sess-emit-guard', personId: 'p' })
    session.close()
    const packets: string[] = []
    session.on('packet', (p: { type: string }) => packets.push(p.type))
    const internal = session as unknown as {
      emitPacket: (p: {
        type: string
        sessionId: string
        timestamp: number
        schemaVersion: string
      }) => void
    }
    internal.emitPacket({
      type: 'error',
      sessionId: session.config.sessionId,
      timestamp: Date.now(),
      schemaVersion: '1',
    })
    expect(packets).toHaveLength(0)
  })
})
