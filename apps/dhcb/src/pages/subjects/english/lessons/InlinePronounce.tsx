// apps/dhcb/src/pages/subjects/english/lessons/InlinePronounce.tsx — tách từ pages/subjects/english/Lessons.tsx (1.693 dòng) ngày 2026-09-06, mã GIỮ NGUYÊN.

import { useState, useRef, useEffect } from 'react'
import { Square, Mic, RotateCcw } from 'lucide-react'
import { startListening, isSTTSupported } from '../../../../lib/stt'
import { scorePronunciation, pronounceFeedback, scoreWords } from '../../../../lib/pronounceScore'

// ── Kiểm tra phát âm inline cho 1 câu hội thoại ──────────────────────────────
export function InlinePronounce({
  text,
  lang,
  isA,
}: {
  text: string
  lang: 'en-US' | 'vi-VN'
  isA: boolean
}) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'listening'>('idle')
  const [score, setScore] = useState<number | null>(null)
  const [heard, setHeard] = useState('')
  const [words, setWords] = useState<Array<{ word: string; ok: boolean }>>([])
  const [err, setErr] = useState('')
  const stopRef = useRef<(() => void) | null>(null)

  // Dừng nhận diện giọng nói khi rời trang/đóng component để micro KHÔNG mở dai dẳng
  // (~20s tới khi Web Speech tự timeout) và tránh setState sau khi đã unmount.
  useEffect(
    () => () => {
      stopRef.current?.()
    },
    [],
  )

  if (!isSTTSupported()) return null

  function reset() {
    setScore(null)
    setHeard('')
    setWords([])
    setErr('')
  }

  function start() {
    reset()
    setStatus('listening')
    stopRef.current = startListening(
      lang === 'en-US' ? 'en' : 'vi',
      () => {},
      (last) => {
        setStatus('idle')
        if (last.trim()) {
          setHeard(last)
          setScore(scorePronunciation(text, last))
          setWords(scoreWords(text, last))
        } else {
          setErr(isA ? 'Không nghe rõ, thử lại.' : 'Did not catch that.')
        }
      },
      () => {
        setStatus('idle')
        setErr(isA ? 'Lỗi micro.' : 'Mic error.')
      },
    )
  }

  function stop() {
    stopRef.current?.()
    setStatus('idle')
  }

  const fb = score !== null ? pronounceFeedback(score, isA) : null

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true)
          reset()
        }}
        title={isA ? 'Kiểm tra phát âm câu này' : 'Check pronunciation'}
        aria-label={isA ? 'Kiểm tra phát âm câu này' : 'Check pronunciation'}
        className="tap-44 shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 hover:text-violet-300 hover:bg-violet-500/15 transition"
      >
        <Mic className="w-[1.125rem] h-[1.125rem]" />
      </button>
    )
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={status === 'listening' ? stop : start}
          className={`tap-44 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
            status === 'listening'
              ? 'bg-rose-500/20 text-rose-300 theme-light:text-rose-900'
              : 'bg-violet-500/20 text-violet-300 theme-light:text-violet-800 hover:bg-violet-500/30'
          }`}
        >
          {status === 'listening' ? (
            <>
              <Square className="w-3 h-3" /> {isA ? 'Dừng' : 'Stop'}
            </>
          ) : (
            <>
              <Mic className="w-3 h-3" /> {isA ? 'Nói lại' : 'Repeat'}
            </>
          )}
        </button>
        <button
          onClick={() => {
            stop()
            setOpen(false)
            reset()
          }}
          className="tap-44 text-[0.6875rem] text-zinc-400 hover:text-zinc-300 transition px-1"
        >
          {isA ? 'Đóng' : 'Close'}
        </button>
        {status === 'listening' && (
          <span className="text-[0.6875rem] text-zinc-400 animate-pulse">
            {isA ? `Đọc: "${text}"` : `Say: "${text}"`}
          </span>
        )}
      </div>

      {fb && (
        <div className="space-y-1.5">
          <p className={`text-xs font-bold ${fb.color}`}>
            {score}% · {fb.label}
          </p>
          {words.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {words.map((w, i) => (
                <span
                  key={i}
                  className={`px-1.5 py-0.5 rounded text-xs ${
                    w.ok
                      ? 'bg-accent-500/15 text-accent-300'
                      : 'bg-rose-500/15 text-rose-300 theme-light:text-rose-900'
                  }`}
                >
                  {w.word}
                </span>
              ))}
            </div>
          )}
          <p className="text-[0.6875rem] text-zinc-400">
            {isA ? 'Bạn đọc' : 'You said'}: "{heard}"
          </p>
          <button
            onClick={start}
            className="flex items-center gap-1 text-[0.6875rem] text-zinc-400 hover:text-zinc-300 transition"
          >
            <RotateCcw className="w-2.5 h-2.5" /> {isA ? 'Thử lại' : 'Retry'}
          </button>
        </div>
      )}
      {err && <p className="text-[0.6875rem] text-rose-400 theme-light:text-rose-900">{err}</p>}
    </div>
  )
}
