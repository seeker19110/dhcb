// apps/dhcb/src/pages/learning/practice/ReverseInterview.tsx — tách từ pages/learning/Practice.tsx (1.752 dòng) ngày 2026-09-06, mã GIỮ NGUYÊN.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Mic, Square, Sparkles } from 'lucide-react'
import { getUsage, incrementUsage } from '../../../lib/storage'
import { startListening, isSTTSupported } from '../../../lib/stt'
import { callClaude, parseJson } from '../../../lib/ai'
import { interviewAnswerFeedbackPrompt } from '../../../prompts'
import { effectivePlan } from '../../../lib/promo'
import { getLimits } from '../../../lib/appSettings'
import { CHALLENGE_TOPICS } from '../../../data/challengeTopics'
import type { User } from '../../../types'
import { shuffle } from '@dhcb/core-contracts/shuffle'
import { Button } from '@core/Button'
import { INTERVIEW_ROUNDS } from './shared'
import { GameResult } from './GameChrome'

interface InterviewFeedback {
  score: number
  feedback: string
  correction: string
}

// ── 8) Phỏng vấn ngược — AI hỏi (chủ đề Challenge có sẵn), học viên trả lời
// nói tự do, 1 lượt gọi AI chấm NHANH nội dung. Dùng chung cột lượt "speaking"
// (LIMITS trong types.ts) — KHÔNG thêm cột đếm mới.
export function ReverseInterview({
  isA,
  uiLang,
  user,
  onExit,
}: {
  isA: boolean
  uiLang: 'vi' | 'en'
  user: User
  onExit: () => void
}) {
  const uiVi = uiLang === 'vi'
  const topics = useMemo(() => shuffle(CHALLENGE_TOPICS).slice(0, INTERVIEW_ROUNDS), [])
  const [idx, setIdx] = useState(0)
  const [passCount, setPassCount] = useState(0)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [grading, setGrading] = useState(false)
  const [result, setResult] = useState<InterviewFeedback | null>(null)
  const [error, setError] = useState('')
  const [limitHit, setLimitHit] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)
  const generationRef = useRef(0)
  const gradingRef = useRef(false)
  const topic = topics[idx]

  useEffect(
    () => () => {
      generationRef.current += 1
      stopRef.current?.()
      stopRef.current = null
    },
    [],
  )

  if (!isSTTSupported()) {
    return (
      <p className="text-sm text-zinc-400 text-center py-8">
        {uiVi
          ? 'Trình duyệt không hỗ trợ nhận giọng nói — dùng Chrome hoặc Edge.'
          : 'Your browser does not support speech recognition — use Chrome or Edge.'}
      </p>
    )
  }

  if (idx >= topics.length || !topic) {
    return (
      <GameResult
        score={passCount}
        total={topics.length}
        uiLang={uiLang}
        onRetry={() => {
          generationRef.current += 1
          stopRef.current?.()
          stopRef.current = null
          setIdx(0)
          setPassCount(0)
          setResult(null)
          setTranscript('')
        }}
        onExit={onExit}
      />
    )
  }

  function startAnswer() {
    const generation = ++generationRef.current
    setTranscript('')
    setResult(null)
    setError('')
    setListening(true)
    stopRef.current = startListening(
      isA ? 'en' : 'vi',
      () => {},
      (last) => {
        if (generation !== generationRef.current) return
        setListening(false)
        if (!last.trim()) {
          setError('unclear')
          return
        }
        setTranscript(last)
      },
      () => {
        if (generation !== generationRef.current) return
        setListening(false)
        setError('mic')
      },
    )
  }

  function stopAnswer() {
    stopRef.current?.()
    setListening(false)
  }

  async function grade() {
    if (!topic || gradingRef.current) return
    // Free plan: server tự chặn theo kho lượt tuần (không suy được từ localStorage) —
    // chỉ chặn TRƯỚC ở client cho gói trả phí, giống Speaking.tsx.
    const plan = effectivePlan(user.plan)
    const usage = getUsage(user.id)
    if (plan !== 'free' && usage.speakingCount >= getLimits()[plan].speaking) {
      setLimitHit(true)
      return
    }
    gradingRef.current = true
    const generation = generationRef.current
    setGrading(true)
    setError('')
    try {
      const question = isA ? topic.titleEn : topic.titleVi
      const sys = interviewAnswerFeedbackPrompt(isA ? 'A' : 'B')
      const raw = await callClaude(
        [{ role: 'user', content: `Câu hỏi: "${question}"\nCâu trả lời: "${transcript}"` }],
        sys,
        512,
        'speaking',
      )
      const ai = parseJson<InterviewFeedback>(raw)
      if (!ai) throw new Error('parse')
      incrementUsage(user.id, 'speakingCount')
      if (generation === generationRef.current) {
        setResult(ai)
        if (ai.score >= 60) setPassCount((c) => c + 1)
      }
    } catch (e) {
      if (generation === generationRef.current)
        setError(e instanceof Error && /429|limit|quota/i.test(e.message) ? 'limit' : 'request')
    } finally {
      gradingRef.current = false
      if (generation === generationRef.current) setGrading(false)
    }
  }

  if (limitHit) {
    return (
      <p className="text-sm text-zinc-400 text-center py-8">
        {uiVi
          ? 'Bạn đã dùng hết lượt Nói hôm nay — quay lại vào ngày mai hoặc nâng cấp gói.'
          : 'You have used all your speaking turns today — come back tomorrow or upgrade.'}
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-xs text-zinc-500 text-center">
        {idx + 1}/{topics.length}
      </p>
      <div className="text-center space-y-1">
        <p className="text-[11px] text-accent-400 theme-light:text-accent-800 font-semibold">
          {uiVi ? 'AI hỏi' : 'AI asks'}
        </p>
        <p className="text-lg font-semibold text-white px-2">
          {isA ? topic.titleEn : topic.titleVi}
        </p>
      </div>

      <div className="flex justify-center">
        <button
          onClick={listening ? stopAnswer : startAnswer}
          disabled={grading}
          className={`flex items-center gap-2 px-6 py-4 rounded-2xl border transition disabled:opacity-40 ${
            listening
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-300 theme-light:text-rose-800'
              : 'bg-accent-500/15 border-accent-500/30 text-accent-300 theme-light:text-accent-800 hover:bg-accent-500/25'
          }`}
        >
          {listening ? (
            <>
              <Square className="w-5 h-5" />
              <span className="text-sm font-medium">
                {uiVi ? 'Đang nghe... bấm để dừng' : 'Listening... tap to stop'}
              </span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span className="text-sm font-medium">
                {uiVi ? 'Trả lời bằng giọng nói' : 'Answer by voice'}
              </span>
            </>
          )}
        </button>
      </div>

      {transcript && !result && (
        <div className="text-center space-y-3">
          <p className="text-xs text-zinc-400">
            {uiVi ? 'Bạn trả lời' : 'You answered'}: "{transcript}"
          </p>
          <button
            onClick={() => void grade()}
            disabled={grading}
            className="flex items-center gap-1.5 mx-auto px-4 py-2.5 min-h-11 rounded-xl bg-accent-500 text-black text-sm font-semibold hover:bg-accent-400 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {grading
              ? uiVi
                ? 'Đang chấm...'
                : 'Grading...'
              : uiVi
                ? 'AI chấm điểm'
                : 'Grade with AI'}
          </button>
        </div>
      )}

      {result && (
        <div className="text-center space-y-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p
            className={`text-2xl font-bold ${result.score >= 60 ? 'text-emerald-400 theme-light:text-emerald-800' : 'text-rose-400 theme-light:text-rose-800'}`}
          >
            {result.score}%
          </p>
          <p className="text-sm text-zinc-200">{result.feedback}</p>
          {result.correction && (
            <p className="text-xs text-amber-300/90 theme-light:text-amber-800/90">
              {uiVi ? 'Gợi ý câu tốt hơn' : 'Better version'}: {result.correction}
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-400/80 theme-light:text-rose-800/80 text-center">
          {uiVi
            ? error === 'unclear'
              ? 'Không nghe rõ, thử lại nhé.'
              : error === 'mic'
                ? 'Lỗi micro, thử lại.'
                : error === 'limit'
                  ? 'Đã đạt giới hạn lượt — thử lại sau.'
                  : 'Không chấm được câu trả lời — thử lại.'
            : error === 'unclear'
              ? 'Did not catch that, try again.'
              : error === 'mic'
                ? 'Mic error, try again.'
                : error === 'limit'
                  ? 'Usage limit reached — try again later.'
                  : 'Could not grade your answer — try again.'}
        </p>
      )}

      {result && (
        <Button
          onClick={() => {
            generationRef.current += 1
            stopRef.current?.()
            stopRef.current = null
            setIdx((i) => i + 1)
          }}
          fullWidth
        >
          {uiVi ? 'Câu hỏi tiếp theo →' : 'Next question →'}
        </Button>
      )}
    </div>
  )
}
