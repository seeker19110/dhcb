import { describe, it, expect } from 'vitest'
import {
  RealtimeVoiceSession,
  MAX_VOICE_BUFFER_BYTES,
  calculatePcmRms,
  type VoiceSessionEvent,
} from './realtimeVoiceService.js'

describe('realtimeVoiceService', () => {
  it('tính RMS chính xác từ buffer PCM', () => {
    const silentBuffer = Buffer.alloc(100, 0)
    expect(calculatePcmRms(silentBuffer)).toBe(0)

    const loudPcm = new Int16Array(50)
    loudPcm.fill(16384) // ~0.5 amplitude
    const loudBuffer = Buffer.from(loudPcm.buffer)
    const rms = calculatePcmRms(loudBuffer)
    expect(rms).toBeGreaterThan(0.4)
    expect(rms).toBeLessThan(0.6)
  })

  it('khởi tạo session và chuyển trạng thái đúng vòng đời', () => {
    const session = new RealtimeVoiceSession({
      sessionId: 'sess-123',
      userId: 'user-456',
    })

    const events: VoiceSessionEvent[] = []
    session.on((e) => events.push(e))

    expect(session.getState()).toBe('idle')
    session.start()
    expect(session.getState()).toBe('listening')

    // Chuyển sang thinking khi có final transcript
    session.pushUserTranscript('Xin chào Đồng Hành', true)
    expect(session.getState()).toBe('thinking')

    // Chuyển sang speaking khi có companion audio chunk
    session.pushCompanionAudioChunk('base64audio...')
    expect(session.getState()).toBe('speaking')

    // Kết thúc turn chuyển về listening
    session.finishCompanionTurn('Chào bạn, tôi có thể giúp gì?')
    expect(session.getState()).toBe('listening')

    session.destroy()
    expect(session.getState()).toBe('idle')
    expect(events.some((e) => e.type === 'session_ended')).toBe(true)
  })

  it('phát hiện barge-in ngắt lời khi Companion đang nói', () => {
    const session = new RealtimeVoiceSession({
      sessionId: 'sess-barge',
      userId: 'user-456',
      bargeInThresholdRms: 0.05,
    })

    const events: VoiceSessionEvent[] = []
    session.on((e) => events.push(e))

    session.start()
    session.pushCompanionAudioChunk('audio...')
    expect(session.getState()).toBe('speaking')

    // Người dùng cất giọng lớn (RMS cao)
    const loudPcm = new Int16Array(100)
    loudPcm.fill(20000)
    session.handleUserAudioChunk(Buffer.from(loudPcm.buffer))

    expect(events.some((e) => e.type === 'interrupted')).toBe(true)
    expect(session.getState()).toBe('listening')
  })

  it('xử lý calculatePcmRms với buffer rỗng hoặc < 2 bytes', () => {
    expect(calculatePcmRms(Buffer.alloc(0))).toBe(0)
    expect(calculatePcmRms(Buffer.alloc(1))).toBe(0)
  })

  it('xử lý getters, unsubscribe, listener throw, và double destroy', () => {
    const session = new RealtimeVoiceSession({
      sessionId: 'sess-extra',
      userId: 'u1',
      sampleRate: 16000,
      maxSessionDurationSeconds: 1,
    })

    expect(session.getSampleRate()).toBe(16000)

    // Unsubscribe
    const unsub = session.on(() => {})
    unsub()

    // Listener throw an toàn
    session.on(() => {
      throw new Error('Listener crash')
    })
    expect(() => session.setState('listening')).not.toThrow()

    // Setting same state does nothing
    session.setState('listening')

    // pushUserTranscript with isFinal=false
    session.pushUserTranscript('partial', false)
    expect(session.getState()).toBe('listening')

    // finishCompanionTurn without transcript
    session.finishCompanionTurn()

    // pushCompanionAudioChunk with text
    session.pushCompanionAudioChunk('audio', 'transcript')
    expect(session.getState()).toBe('speaking')

    // Double destroy
    session.destroy()
    session.destroy()
    expect(() => session.start()).toThrow('Session is already destroyed')
    expect(() => session.pushUserTranscript('x')).not.toThrow()
  })

  it('xử lý timeout phiên đàm thoại vượt maxDurationMs', () => {
    const session = new RealtimeVoiceSession({
      sessionId: 'sess-timeout',
      userId: 'u1',
      maxSessionDurationSeconds: 0.001, // 1ms
    })

    session.start()
    // Giả lập trễ thời gian
    const chunk = Buffer.alloc(100, 0)
    const events: VoiceSessionEvent[] = []
    session.on((e) => events.push(e))

    // Đợi 10ms để vượt 1ms
    const start = Date.now()
    while (Date.now() - start < 10) {
      /* wait */
    }

    session.handleUserAudioChunk(chunk)
    expect(events.some((e) => e.type === 'error')).toBe(true)
  })
})

describe('RealtimeVoiceSession — trần bộ đệm âm thanh (vá 2026-09-27)', () => {
  it('gửi dồn dập bao nhiêu cũng không vượt MAX_VOICE_BUFFER_BYTES, giữ phần MỚI nhất', () => {
    const session = new RealtimeVoiceSession({ sessionId: 's', userId: 'u' })
    session.start()
    const quiet = Buffer.alloc(64 * 1024) // PCM im lặng: không kích hoạt barge-in
    for (let i = 0; i < 100; i++) session.handleUserAudioChunk(quiet)
    expect(session.getBufferedAudioBytes()).toBeLessThanOrEqual(MAX_VOICE_BUFFER_BYTES)
    expect(session.getBufferedAudioBytes()).toBeGreaterThan(MAX_VOICE_BUFFER_BYTES / 2)
  })

  it('một khúc to hơn cả trần → chỉ giữ phần đuôi vừa trần', () => {
    const session = new RealtimeVoiceSession({ sessionId: 's', userId: 'u' })
    session.start()
    session.handleUserAudioChunk(Buffer.alloc(MAX_VOICE_BUFFER_BYTES * 3))
    expect(session.getBufferedAudioBytes()).toBe(MAX_VOICE_BUFFER_BYTES)
  })

  it('destroy() giải phóng bộ đệm', () => {
    const session = new RealtimeVoiceSession({ sessionId: 's', userId: 'u' })
    session.start()
    session.handleUserAudioChunk(Buffer.alloc(1024))
    session.destroy()
    expect(session.getBufferedAudioBytes()).toBe(0)
  })
})
