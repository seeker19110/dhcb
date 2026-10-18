import type { TurnHandle } from './voiceMetrics'
// Speech-to-Text dùng Web Speech API (miễn phí, Chrome/Edge)
// Khi production: thay bằng gpt-4o-mini-transcribe hoặc Deepgram

// Web Speech API không có trong lib.dom.d.ts của TypeScript — khai tối thiểu phần dùng tới
// (thay vì `any`) để vẫn có type safety mà không cần cài @types/dom-speech-recognition.
interface SpeechRecognitionResultLike {
  0: { transcript: string }
  isFinal: boolean
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionErrorEventLike {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null
  start(): void
  stop(): void
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

export function isSTTSupported(): boolean {
  return !!(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  )
}

export interface STTResult {
  transcript: string
  isFinal: boolean
}

export interface CaptureOptions {
  readonly signal?: AbortSignal
  readonly metrics?: TurnHandle
}

export type StopListening = (mode?: 'cancel' | 'complete') => void

export function startListening(
  lang: 'en' | 'vi',
  onResult: (r: STTResult) => void,
  onEnd: (lastTranscript: string) => void,
  onError: (err: string) => void,
  { signal, metrics }: CaptureOptions = {},
): StopListening {
  if (signal?.aborted) return () => {}
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  const SRClass = w.SpeechRecognition ?? w.webkitSpeechRecognition
  if (!SRClass) {
    onError('Trình duyệt không hỗ trợ nhận giọng nói. Dùng Chrome hoặc Edge.')
    return () => {}
  }

  const rec = new SRClass()
  rec.lang = lang === 'en' ? 'en-US' : 'vi-VN'
  rec.continuous = false
  rec.interimResults = true

  let lastTranscript = ''
  let gotSpeech = false
  let terminal = false
  let completing = false

  // Chống "mic mở vô tận": tự dừng nếu không nghe thấy gì sau 8s, hoặc nói quá 20s.
  const NO_SPEECH_MS = 8000
  const MAX_MS = 20000
  let noSpeechTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    noSpeechTimer = null
    if (!gotSpeech && !terminal) {
      close()
      try {
        metrics?.capture('stop_requested')
        rec.stop()
      } catch {
        /* recognition đã dừng */
      }
      onError('no-speech')
    }
  }, NO_SPEECH_MS)
  const maxTimer = setTimeout(() => {
    stop('complete')
  }, MAX_MS)

  function clearTimers() {
    if (noSpeechTimer) {
      clearTimeout(noSpeechTimer)
      noSpeechTimer = null
    }
    clearTimeout(maxTimer)
  }

  function close() {
    terminal = true
    clearTimers()
    signal?.removeEventListener('abort', cancel)
    rec.onresult = null
    rec.onend = null
    rec.onerror = null
  }
  function finishError(error: string) {
    if (terminal) return
    close()
    onError(error)
  }
  function cancel() {
    stop('cancel')
  }
  function stop(mode: 'cancel' | 'complete' = 'cancel') {
    if (terminal) return
    if (mode === 'cancel') {
      close()
      if (!completing) {
        try {
          metrics?.capture('stop_requested')
          rec.stop()
        } catch {
          /* recognition đã dừng */
        }
      }
      return
    }
    if (completing) return
    completing = true
    clearTimers()
    try {
      metrics?.capture('stop_requested')
      rec.stop()
    } catch {
      finishError('aborted')
    }
  }

  rec.onresult = (e) => {
    if (terminal) return
    gotSpeech = true
    if (noSpeechTimer) {
      clearTimeout(noSpeechTimer)
      noSpeechTimer = null
    }
    const result = e.results[e.results.length - 1]!
    const t = result[0].transcript
    lastTranscript = t
    onResult({ transcript: t, isFinal: result.isFinal })
  }

  rec.onend = () => {
    if (terminal) return
    close()
    metrics?.capture('stopped')
    if (lastTranscript.trim()) metrics?.textReady('stt')
    onEnd(lastTranscript)
  }
  rec.onerror = (e) => {
    finishError(e.error)
  }
  signal?.addEventListener('abort', cancel, { once: true })
  if (signal?.aborted) {
    cancel()
    return stop
  }
  try {
    rec.start()
  } catch (error) {
    close()
    throw error
  }
  return stop
}
