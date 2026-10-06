// src/components/DetailedPronunciationCheck.tsx — "Chấm chi tiết bằng AI" (① Giai đoạn 2):
// ghi âm → WAV 16kHz mono (src/lib/wav.ts) → /api/pronounce-assess (Azure) → điểm TỪNG ÂM VỊ.
// CHỈ dùng được cho tiếng Anh (lang='en') — Azure chưa hỗ trợ chấm phát âm tiếng Việt, nơi gọi
// (PronunciationCheck.tsx) đã lọc trước khi render component này.
//
// Khi chưa cấu hình Azure / hết lượt / lỗi mạng → hiện thông điệp gọn, gợi ý dùng "Chấm phát
// âm" (Giai đoạn 1, miễn phí) đã có ngay phía trên — KHÔNG chặn luồng học.
import { useEffect, useRef, useState } from 'react'
import { Sparkles, Square, Loader2, RotateCcw } from 'lucide-react'
import {
  startAudioRecording,
  isAudioRecordingSupported,
  MAX_PRONOUNCE_RECORD_SEC,
  AUDIO_REC_ERR_PERMISSION,
  type AudioRecorderHandle,
} from '../lib/audioRecorder'
import { assessPronunciationClient, type PronounceAssessResult } from '../lib/pronounceAssessApi'

type Stage = 'idle' | 'recording' | 'processing' | 'result' | 'error'

// Ngưỡng màu điểm — khớp pronounceFeedback (src/lib/pronounceScore.ts) để nhất quán cảm nhận
// giữa Giai đoạn 1 và 2 (cùng 1 người dùng không thấy 2 thang điểm "cảm giác" khác nhau).
function scoreColor(score: number): string {
  if (score >= 85) return 'text-emerald-400 theme-light:text-emerald-800'
  if (score >= 65) return 'text-lime-400 theme-light:text-lime-800'
  if (score >= 40) return 'text-amber-400 theme-light:text-amber-800'
  return 'text-rose-400 theme-light:text-rose-700'
}
function scoreChipCls(score: number): string {
  if (score >= 85)
    return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 theme-light:text-emerald-800'
  if (score >= 65)
    return 'bg-lime-500/15 border-lime-500/30 text-lime-300 theme-light:text-lime-800'
  if (score >= 40)
    return 'bg-amber-500/15 border-amber-500/30 text-amber-300 theme-light:text-amber-800'
  return 'bg-rose-500/15 border-rose-500/30 text-rose-300 theme-light:text-rose-700'
}

interface Props {
  target: string
  isA: boolean
  uiLang?: 'vi' | 'en'
}

export default function DetailedPronunciationCheck({
  target,
  isA,
  uiLang = isA ? 'vi' : 'en',
}: Props) {
  const uiVi = uiLang === 'vi'
  const [stage, setStage] = useState<Stage>('idle')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [result, setResult] = useState<PronounceAssessResult | null>(null)
  const [message, setMessage] = useState<
    | ''
    | 'permission'
    | 'recording'
    | 'audio_processing'
    | 'network'
    | 'assessment_unavailable'
    | 'assessment_failed'
  >('')
  const [expandedWord, setExpandedWord] = useState<number | null>(null)

  const handleRef = useRef<AudioRecorderHandle | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const generationRef = useRef(0)

  useEffect(
    () => () => {
      generationRef.current += 1
      if (timerRef.current) clearInterval(timerRef.current)
      handleRef.current?.cancel()
    },
    [],
  )

  if (!isAudioRecordingSupported()) return null

  async function start() {
    const generation = ++generationRef.current
    setMessage('')
    setResult(null)
    setExpandedWord(null)
    try {
      const handle = await startAudioRecording(MAX_PRONOUNCE_RECORD_SEC)
      if (generation !== generationRef.current) {
        handle.cancel()
        return
      }
      handleRef.current = handle
      setElapsedSec(0)
      setStage('recording')
      timerRef.current = setInterval(() => {
        setElapsedSec((s) => {
          const next = s + 1
          if (next >= MAX_PRONOUNCE_RECORD_SEC) void stop()
          return next
        })
      }, 1000)
    } catch (e) {
      if (generation !== generationRef.current) return
      const isPermission = e instanceof Error && e.message === AUDIO_REC_ERR_PERMISSION
      setMessage(isPermission ? 'permission' : 'recording')
      setStage('error')
    }
  }

  async function stop() {
    const generation = generationRef.current
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    const handle = handleRef.current
    if (!handle) return
    handleRef.current = null
    setStage('processing')
    try {
      const recording = await handle.stop()
      if (generation !== generationRef.current) return
      const outcome = await assessPronunciationClient(recording.blob, target, {
        includeErrorCode: true,
      })
      if (generation !== generationRef.current) return
      if (outcome.ok) {
        setResult(outcome.result)
        setStage('result')
      } else {
        setMessage(
          outcome.errorCode ?? (outcome.fallback ? 'assessment_unavailable' : 'assessment_failed'),
        )
        setStage('error')
      }
    } catch {
      if (generation !== generationRef.current) return
      setMessage('audio_processing')
      setStage('error')
    }
  }

  function cancel() {
    generationRef.current += 1
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    handleRef.current?.cancel()
    handleRef.current = null
    setStage('idle')
  }

  return (
    <div className="w-full flex flex-col items-center gap-2 pt-1">
      {stage === 'idle' && (
        <button
          onClick={() => void start()}
          className="tap-44 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/15 text-violet-300 theme-light:text-violet-800 border border-violet-500/25 hover:bg-violet-500/25 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {uiVi ? 'Chấm chi tiết bằng AI (beta)' : 'Detailed AI scoring (beta)'}
        </button>
      )}

      {stage === 'recording' && (
        <div className="flex flex-col items-center gap-1.5">
          <p className="text-xs text-rose-400 theme-light:text-rose-700 font-mono">
            🔴 {elapsedSec}s / {MAX_PRONOUNCE_RECORD_SEC}s — {uiVi ? 'Đọc' : 'Say'}: "{target}"
          </p>
          <button
            onClick={() => void stop()}
            aria-label={uiVi ? 'Dừng ghi âm' : 'Stop recording'}
            className="tap-44 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-300 theme-light:text-rose-700 border border-rose-500/30 transition"
          >
            <Square className="w-3.5 h-3.5" />
            {uiVi ? 'Dừng' : 'Stop'}
          </button>
          <button
            onClick={cancel}
            className="tap-44 text-[0.6875rem] text-zinc-400 hover:text-zinc-300 underline"
          >
            {uiVi ? 'Hủy' : 'Cancel'}
          </button>
        </div>
      )}

      {stage === 'processing' && (
        <p className="flex items-center gap-1.5 text-xs text-zinc-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          {uiVi ? 'Đang chấm điểm chi tiết...' : 'Scoring in detail...'}
        </p>
      )}

      {stage === 'result' && result && (
        <div className="w-full text-center space-y-2">
          <p className={`text-sm font-bold ${scoreColor(result.overall)}`}>
            {result.overall}% {uiVi ? '(tổng)' : '(overall)'}
          </p>
          <p className="text-[0.6875rem] text-zinc-400">
            {uiVi ? 'Chuẩn' : 'Accuracy'} {result.accuracy}% · {uiVi ? 'Trôi chảy' : 'Fluency'}{' '}
            {result.fluency}% · {uiVi ? 'Đầy đủ' : 'Completeness'} {result.completeness}%
          </p>

          <div className="flex flex-wrap justify-center gap-1.5">
            {result.words.map((w, i) => (
              <button
                key={i}
                onClick={() => setExpandedWord(expandedWord === i ? null : i)}
                className={`px-2 py-0.5 rounded-lg text-sm font-medium border transition ${scoreChipCls(w.score)}`}
              >
                {w.word} · {w.score}%
              </button>
            ))}
          </div>

          {expandedWord != null && result.words[expandedWord] && (
            <div className="flex flex-wrap justify-center gap-1 text-[0.6875rem]">
              {result.words[expandedWord]!.phonemes.map((p, i) => (
                <span key={i} className={`px-1.5 py-0.5 rounded border ${scoreChipCls(p.score)}`}>
                  {p.phoneme} {p.score}%
                </span>
              ))}
              {result.words[expandedWord]!.phonemes.length === 0 && (
                <span className="text-zinc-400">
                  {uiVi ? 'Không có dữ liệu âm vị cho từ này' : 'No phoneme data for this word'}
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => void start()}
            className="tap-44 flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-300 transition mx-auto px-1"
          >
            <RotateCcw className="w-3 h-3" /> {uiVi ? 'Thử lại' : 'Try again'}
          </button>
        </div>
      )}

      {stage === 'error' && (
        <div className="text-center space-y-1.5">
          <p className="text-xs text-rose-400 theme-light:text-rose-900/80">
            {uiVi
              ? ({
                  permission: 'Bạn cần cho phép quyền micro để dùng tính năng này.',
                  recording: 'Không quay được — thử lại sau.',
                  assessment_unavailable:
                    'Chấm chi tiết tạm thời không khả dụng — dùng "Chấm phát âm" ở trên nhé.',
                  audio_processing: 'Không xử lý được bản ghi âm — thử lại.',
                  network: 'Không kết nối được máy chủ — kiểm tra mạng rồi thử lại.',
                  assessment_failed: 'Không chấm được phát âm — thử lại sau.',
                }[message || 'assessment_failed'] ?? 'Không chấm được phát âm — thử lại sau.')
              : ({
                  permission: 'Please allow microphone access to use this feature.',
                  recording: 'Could not start recording — try again later.',
                  assessment_unavailable:
                    'Detailed scoring is temporarily unavailable — use "Check pronunciation" above.',
                  audio_processing: 'Could not process the recording — try again.',
                  network: 'Cannot reach the server — check your connection and try again.',
                  assessment_failed: 'Could not assess pronunciation — try again later.',
                }[message || 'assessment_failed'] ??
                'Could not assess pronunciation — try again later.')}
          </p>
          <button
            onClick={() => void start()}
            className="tap-44 text-xs text-zinc-400 hover:text-zinc-300 underline"
          >
            {uiVi ? 'Thử lại' : 'Try again'}
          </button>
        </div>
      )}
    </div>
  )
}
