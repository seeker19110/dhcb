// packages/core-ai/realtimeVoiceService.ts — Quản lý phiên đàm thoại duplex thời gian thực
// Hỗ trợ State Machine (LISTENING/THINKING/SPEAKING/INTERRUPTED), phát hiện ngắt lời (Barge-in),
// và buffer luồng dữ liệu âm thanh PCM.

export type VoiceSessionState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'interrupted'

export interface VoiceSessionConfig {
  sessionId: string
  userId: string
  sampleRate?: number // Mặc định 16000 hoặc 24000 Hz
  bargeInThresholdRms?: number // Ngưỡng âm lượng để kích hoạt ngắt lời (mặc định 0.05)
  maxSessionDurationSeconds?: number // Giới hạn phiên thoại (mặc định 600s = 10 phút)
}

export interface VoiceSessionEvent {
  type: 'state_changed' | 'transcript' | 'audio_chunk' | 'interrupted' | 'error' | 'session_ended'
  state?: VoiceSessionState
  text?: string
  isFinal?: boolean
  sender?: 'user' | 'companion'
  audioBase64?: string
  error?: string
  timestamp: string
}

export type VoiceEventHandler = (event: VoiceSessionEvent) => void

/** Tính năng lượng trung bình RMS (Root Mean Square) từ buffer PCM 16-bit */
export function calculatePcmRms(pcmData: Buffer | Uint8Array): number {
  if (pcmData.length < 2) return 0
  const int16Array = new Int16Array(
    pcmData.buffer,
    pcmData.byteOffset,
    Math.floor(pcmData.byteLength / 2),
  )
  if (int16Array.length === 0) return 0

  let sumSquares = 0
  for (let i = 0; i < int16Array.length; i++) {
    const val = int16Array[i] ?? 0
    const normalized = val / 32768
    sumSquares += normalized * normalized
  }
  return Math.sqrt(sumSquares / int16Array.length)
}

// Trần bộ đệm âm thanh người dùng trong MỘT phiên: ~40 giây PCM16 24 kHz mono. Trước bản vá
// 2026-09-27 mảng này chỉ lớn lên suốt 10 phút phiên (không ai tiêu thụ), nên một client gửi dồn
// dập là làm tràn RAM worker. Vượt trần thì bỏ các khúc CŨ NHẤT, giữ phần mới nhất.
export const MAX_VOICE_BUFFER_BYTES = 2 * 1024 * 1024

export class RealtimeVoiceSession {
  public readonly sessionId: string
  public readonly userId: string
  private state: VoiceSessionState = 'idle'
  private sampleRate: number
  private bargeInThresholdRms: number
  private maxDurationMs: number
  private startTime: number = 0
  private listeners: Set<VoiceEventHandler> = new Set()
  private audioBuffer: Buffer[] = []
  private audioBufferBytes = 0
  private isDestroyed: boolean = false

  constructor(config: VoiceSessionConfig) {
    this.sessionId = config.sessionId
    this.userId = config.userId
    this.sampleRate = config.sampleRate ?? 24000
    this.bargeInThresholdRms = config.bargeInThresholdRms ?? 0.04
    this.maxDurationMs = (config.maxSessionDurationSeconds ?? 600) * 1000
  }

  public getState(): VoiceSessionState {
    return this.state
  }

  public getSampleRate(): number {
    return this.sampleRate
  }

  public on(handler: VoiceEventHandler): () => void {
    this.listeners.add(handler)
    return () => this.listeners.delete(handler)
  }

  private emit(event: Omit<VoiceSessionEvent, 'timestamp'>): void {
    if (this.isDestroyed) return
    const fullEvent: VoiceSessionEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    }
    for (const listener of this.listeners) {
      try {
        listener(fullEvent)
      } catch (err) {
        console.error('[VoiceSession] Error in listener handler:', err)
      }
    }
  }

  public start(): void {
    if (this.isDestroyed) throw new Error('Session is already destroyed')
    this.startTime = Date.now()
    this.setState('listening')
  }

  public setState(newState: VoiceSessionState): void {
    if (this.state === newState || this.isDestroyed) return
    this.state = newState
    this.emit({ type: 'state_changed', state: newState })
  }

  /** Xử lý một gói tin âm thanh gửi lên từ client micro */
  public handleUserAudioChunk(chunk: Buffer): void {
    if (this.isDestroyed) return

    // Kiểm tra hết thời gian tối đa phiên thoại
    if (this.startTime > 0 && Date.now() - this.startTime > this.maxDurationMs) {
      this.emit({ type: 'error', error: 'Đã đạt giới hạn thời gian phiên đàm thoại (10 phút)' })
      this.destroy()
      return
    }

    const rms = calculatePcmRms(chunk)

    // Phát hiện ngắt lời (Barge-in): Khi Companion đang nói mà người dùng cất tiếng
    if (this.state === 'speaking' && rms >= this.bargeInThresholdRms) {
      this.state = 'interrupted'
      this.emit({ type: 'interrupted' })
      this.setState('listening')
      this.audioBuffer = []
      this.audioBufferBytes = 0
      this.appendAudio(chunk)
      return
    }

    if (this.state === 'idle' || this.state === 'interrupted') {
      this.setState('listening')
    }

    if (this.state === 'listening') {
      this.appendAudio(chunk)
    }
  }

  /** Số byte âm thanh đang giữ (để test/giám sát trần bộ đệm). */
  public getBufferedAudioBytes(): number {
    return this.audioBufferBytes
  }

  private appendAudio(chunk: Buffer): void {
    // Một khúc to hơn cả trần → chỉ giữ phần đuôi vừa trần.
    const piece =
      chunk.length > MAX_VOICE_BUFFER_BYTES
        ? chunk.subarray(chunk.length - MAX_VOICE_BUFFER_BYTES)
        : chunk
    this.audioBuffer.push(piece)
    this.audioBufferBytes += piece.length
    while (this.audioBufferBytes > MAX_VOICE_BUFFER_BYTES && this.audioBuffer.length > 1) {
      const oldest = this.audioBuffer.shift()
      this.audioBufferBytes -= oldest?.length ?? 0
    }
  }

  /** Nhận kết quả phiên âm văn bản từ người dùng */
  public pushUserTranscript(text: string, isFinal: boolean = false): void {
    if (this.isDestroyed) return
    this.emit({ type: 'transcript', sender: 'user', text, isFinal })
    if (isFinal) {
      this.setState('thinking')
    }
  }

  /** Companion phát âm thanh phản hồi ra */
  public pushCompanionAudioChunk(audioBase64: string, transcriptChunk?: string): void {
    if (this.isDestroyed || this.state === 'interrupted') return
    if (this.state !== 'speaking') {
      this.setState('speaking')
    }
    this.emit({
      type: 'audio_chunk',
      sender: 'companion',
      audioBase64,
      text: transcriptChunk,
    })
  }

  /** Companion kết thúc lượt nói */
  public finishCompanionTurn(fullTranscript?: string): void {
    if (this.isDestroyed) return
    if (fullTranscript) {
      this.emit({ type: 'transcript', sender: 'companion', text: fullTranscript, isFinal: true })
    }
    this.setState('listening')
  }

  public destroy(): void {
    if (this.isDestroyed) return
    this.state = 'idle'
    this.audioBuffer = []
    this.audioBufferBytes = 0
    this.emit({ type: 'session_ended' })
    this.isDestroyed = true
    this.listeners.clear()
  }
}
