import type { TurnHandle } from './voiceMetrics'
// src/lib/sttServer.ts
// Ghi âm giọng nói người dùng bằng MediaRecorder rồi gửi lên /api/stt để nhận diện
// (OpenAI gpt-4o-mini-transcribe). Chính xác hơn Web Speech API và chạy được trên hầu
// hết trình duyệt hiện đại (kể cả Safari mobile). Web Speech API (src/lib/stt.ts) chỉ
// còn là phương án dự phòng khi máy không hỗ trợ ghi âm.

import { getAuthHeader } from '@core/authHeader'

// Trình duyệt có hỗ trợ ghi âm không (cần getUserMedia + MediaRecorder).
export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'
  )
}

export interface Recorder {
  stop: () => Promise<string> // dừng ghi + trả về văn bản nhận diện
  cancel: () => void // hủy, không gọi API
}

export interface CaptureOptions {
  readonly signal?: AbortSignal
  readonly isCurrent?: () => boolean
  readonly metrics?: TurnHandle
}

function captureAborted(): DOMException {
  return new DOMException('Đã hủy ghi âm', 'AbortError')
}

// Chọn định dạng ghi âm mà trình duyệt hỗ trợ (Chrome/FF: webm/opus, Safari: mp4).
function pickMime(): string {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
  for (const c of candidates) {
    if (typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported(c)) {
      return c
    }
  }
  return '' // để trình duyệt tự chọn mặc định
}

// Bắt đầu ghi âm. Trả về đối tượng Recorder để dừng (và nhận text) hoặc hủy.
export async function startRecording(
  lang: 'en' | 'vi',
  { signal, isCurrent, metrics }: CaptureOptions = {},
): Promise<Recorder> {
  // Kiểm owner ngay tại ranh giới thiết bị/request, kể cả trước React commit kế tiếp.
  const captureCurrent = () => {
    try {
      return !signal?.aborted && (isCurrent?.() ?? true)
    } catch {
      return false
    }
  }
  if (!captureCurrent()) throw captureAborted()
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (error) {
    if (!captureCurrent()) throw captureAborted()
    throw error
  }
  let tracksReleased = false
  const releaseTracks = () => {
    if (tracksReleased) return
    tracksReleased = true
    stream.getTracks().forEach((track) => track.stop())
  }
  if (!captureCurrent()) {
    releaseTracks()
    throw captureAborted()
  }

  let mime: string
  let rec: MediaRecorder
  try {
    mime = pickMime()
    rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  } catch (error) {
    releaseTracks()
    throw error
  }
  const chunks: Blob[] = []
  let phase: 'recording' | 'stopping' | 'processing' | 'uploading' | 'terminal' = 'recording'
  let cancelled = false
  let completion: Promise<string> | null = null
  let resolveCompletion: ((text: string) => void) | null = null
  let rejectCompletion: ((error: unknown) => void) | null = null

  const detach = () => {
    signal?.removeEventListener('abort', cancel)
    rec.ondataavailable = null
    rec.onstop = null
  }
  const fail = (error: unknown) => {
    if (phase === 'terminal') return
    phase = 'terminal'
    detach()
    releaseTracks()
    rejectCompletion?.(error)
  }
  function cancel() {
    // Upload đã gửi giữ receipt/lỗi thật và timeout riêng để caller không bỏ sót usage.
    if (phase === 'uploading' || phase === 'terminal') return
    const wasRecording = phase === 'recording'
    cancelled = true
    phase = 'terminal'
    detach()
    releaseTracks()
    if (wasRecording) {
      try {
        rec.stop()
      } catch {
        /* recorder đã dừng */
      }
    }
    rejectCompletion?.(captureAborted())
  }
  const assertCaptureCurrent = () => {
    if (cancelled || !captureCurrent()) throw captureAborted()
  }
  rec.ondataavailable = (event) => {
    if (phase !== 'recording' && phase !== 'stopping') return
    if (event.data && event.data.size > 0) chunks.push(event.data)
  }
  rec.onstop = async () => {
    if (phase !== 'stopping') {
      releaseTracks()
      return
    }
    phase = 'processing'
    metrics?.capture('stopped')
    releaseTracks()
    try {
      assertCaptureCurrent()
      const blob = new Blob(chunks, { type: mime || 'audio/webm' })
      if (blob.size === 0) throw new Error('EMPTY_RECORDING')
      const b64 = await blobToBase64(blob)
      assertCaptureCurrent()
      const text = await transcribe(
        b64,
        blob.type,
        lang,
        () => {
          assertCaptureCurrent()
          phase = 'uploading'
          signal?.removeEventListener('abort', cancel)
        },
        metrics,
      )
      phase = 'terminal'
      detach()
      resolveCompletion?.(text)
    } catch (error) {
      fail(error)
    }
  }
  signal?.addEventListener('abort', cancel, { once: true })
  if (!captureCurrent()) {
    cancel()
    throw captureAborted()
  }
  try {
    rec.start()
  } catch (error) {
    phase = 'terminal'
    detach()
    releaseTracks()
    throw error
  }
  return {
    cancel,
    stop() {
      if (completion) return completion
      completion = new Promise<string>((resolve, reject) => {
        resolveCompletion = resolve
        rejectCompletion = reject
      })
      if (cancelled) {
        rejectCompletion?.(captureAborted())
        return completion
      }
      phase = 'stopping'
      metrics?.capture('stop_requested')
      try {
        rec.stop()
      } catch (error) {
        fail(error)
      }
      return completion
    },
  }
}

// Server /api/stt tự timeout ở 45s khi gọi Groq/OpenAI (xem STT_TIMEOUT_MS trong
// api/_lib/openaiStt.ts) — client chờ lâu hơn một chút để không cắt ngang lúc server
// còn đang xử lý, nhưng vẫn phải có giới hạn để không treo vô thời hạn khi mất mạng.
const CLIENT_STT_TIMEOUT_MS = 60_000

// Gửi audio base64 lên /api/stt và nhận lại văn bản.
async function transcribe(
  audioB64: string,
  mime: string,
  lang: 'en' | 'vi',
  beforeFetch: () => void,
  metrics?: TurnHandle,
): Promise<string> {
  const auth = await getAuthHeader()
  // Không dùng capture signal làm transport signal: sau fetch, accounting cần receipt thật.
  beforeFetch()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CLIENT_STT_TIMEOUT_MS)
  const request = metrics?.request('stt')
  let resp: Response
  try {
    resp = await fetch('/api/stt', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...auth },
      body: JSON.stringify({ audio_b64: audioB64, mime, lang }),
      signal: controller.signal,
    })
  } catch (e) {
    request?.end('error', e instanceof Error && e.name === 'AbortError' ? 'timeout' : 'network')
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('Máy chủ phản hồi quá lâu — kiểm tra mạng rồi thử lại.')
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
  request?.headers()
  if (!resp.ok) {
    request?.end('error', 'http')
    const err = await resp.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `Lỗi STT: ${resp.status}`)
  }
  let data: unknown
  try {
    data = await resp.json()
  } catch (error) {
    request?.end('error', 'invalid_response')
    throw error
  }
  if (!data || typeof data !== 'object' || !('text' in data)) {
    request?.end('error', 'invalid_response')
    throw new Error('STT API returned invalid response')
  }
  const text = (data as { text?: unknown }).text
  if (typeof text !== 'string') {
    request?.end('error', 'invalid_response')
    throw new Error('STT API returned non-string text')
  }
  // Whisper có thể nghe ra rỗng (im lặng/tạp âm) — vẫn là 1 lần gọi API THÀNH CÔNG (server
  // đã trừ lượt), khác hẳn case EMPTY_RECORDING (chưa hề gọi API) ở trên. Trả '' thay vì
  // throw để caller (đã `await` thành công) tính đúng 1 lượt STT thay vì bỏ sót.
  request?.end('ok')
  if (text.trim()) metrics?.textReady('stt')
  return text.trim()
}

// Đọc Blob → chuỗi base64 (bỏ tiền tố "data:...;base64,").
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (!reader.result) {
        reject(new Error('FileReader returned no result'))
        return
      }
      const result = typeof reader.result === 'string' ? reader.result : ''
      const b64 = result.split(',')[1] ?? ''
      if (!b64) {
        reject(new Error('Could not extract base64 from FileReader result'))
      } else {
        resolve(b64)
      }
    }
    reader.onerror = () => reject(new Error('FileReader error'))
    reader.readAsDataURL(blob)
  })
}
