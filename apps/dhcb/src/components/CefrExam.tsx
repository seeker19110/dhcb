// ──────────────────────────────────────────────────────────────────────
// BÀI THI CUỐI CẤP — màn thi toàn màn hình (1 câu/màn)
//
// Máy chủ dựng đề xáo trộn 4 phần (Từ vựng · Ngữ pháp · Nghe · Đọc hiểu) từ kho của
// cấp (lib/cefrExam.ts buildExam). Đạt ≥70% → "qua cấp" (lưu kết quả, mở khóa
// cấp sau ở computeLockedMap). Trượt → xem câu sai + mở lại bài ngữ pháp + thi lại
// (đề MỚI). Máy chủ chấm và lưu biên nhận trước khi cấp quyền.
//
// Điều kiện DỰ THI do trang cấp (CefrLevelPage) kiểm tra trước khi cho vào đây.
// ──────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react'
import { GraduationCap, RotateCcw, ArrowLeft } from 'lucide-react'
import type { CefrLevel } from '../data/cefr'
import type { AgeGroup } from '../types'
import type { AccentClasses } from '../lib/cefrAccent'
import { stopSpeaking, speak } from '../lib/tts'
import { scoreExam, EXAM_PASS_PCT, type ExamQuestion } from '../lib/cefrExam'
import ExamQuestionCard from './ExamQuestionCard'
import { PART_META } from '../lib/examParts'
import { checkNewAchievements, achievementMessage } from '../lib/achievements'
import { useToast } from '@core/ToastProvider'
import { pullProgress } from '../lib/progressSync'
import { startCefrAssessment, submitCefrAssessment } from '../lib/cefrAssessmentApi'
import { claimCefrExamQuest } from '../lib/quests'
import { buttonClass } from '@core/buttonStyles'

export default function CefrExam({
  uid,
  isA,
  level,
  accent,
  onClose,
  onOpenLesson,
}: {
  uid: string
  isA: boolean
  level: CefrLevel
  accent: AccentClasses
  onClose: () => void
  onOpenLesson: (lessonId: string) => void
  ageGroup?: AgeGroup
}) {
  const toast = useToast()

  // Bộ đếm để dựng lại đề MỚI mỗi lần "Thi lại".
  const [attempt, setAttempt] = useState(0)
  const [questions, setQuestions] = useState<
    (Omit<ExamQuestion, 'correct'> & { correct?: string })[] | null
  >(null)
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [attemptId, setAttemptId] = useState('')
  const [chosen, setChosen] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [savedPct, setSavedPct] = useState<number | null>(null)

  // Nạp hội thoại của tất cả unit trong cấp (cho phần Đọc) rồi dựng đề luôn
  // trong callback async — setState trong callback async là hợp lệ với rule
  // set-state-in-effect (không còn effect setState đồng bộ như trước).
  useEffect(() => {
    let alive = true
    startCefrAssessment(level.id, isA)
      .then((exam) => {
        if (!alive) return
        setAttemptId(exam.attemptId)
        setQuestions(exam.questions)
        setCurrent(0)
        setSelected(null)
        setAnswers([])
        setChosen([])
        setError(null)
        setDone(false)
        setSavedPct(null)
      })
      .catch((cause: unknown) => {
        if (alive) setError(cause instanceof Error ? cause.message : 'Chưa tải được đề thi')
      })
    return () => {
      alive = false
    }
  }, [level.id, attempt, isA])

  const q = questions?.[current]
  const steps = useMemo(
    () => ({ questions, picked: new Set<number>(), advanced: new Set<number>() }),
    [questions],
  )
  const resultHeading = useRef<HTMLHeadingElement>(null)
  const questionContainer = useRef<HTMLDivElement>(null)
  const restartFocus = useRef(false)
  useEffect(() => {
    if (done) resultHeading.current?.focus()
    else if (questions && restartFocus.current) {
      const heading = questionContainer.current?.querySelector<HTMLElement>('h2[tabindex="-1"]')
      if (heading) {
        restartFocus.current = false
        heading.focus()
      }
    }
  }, [done, questions])

  // Tự phát audio khi vào 1 câu NGHE (và dừng audio khi rời câu/màn).
  useEffect(() => {
    if (!done && q?.promptKind === 'audio' && q.audioText && q.audioLang) {
      void speak(q.audioText, q.audioLang, q.audioVoice)
    }
    return () => stopSpeaking()
  }, [q, done])

  if (error && !questions) {
    return (
      <div role="alert" className="glass rounded-xl p-6 space-y-3 text-zinc-300">
        <p>{error}</p>
        <button
          className="tap-44 underline"
          onClick={() => {
            setError(null)
            setAttempt((a) => a + 1)
          }}
        >
          {isA ? 'Thử lại' : 'Try again'}
        </button>
        <button className="tap-44 underline ml-4" onClick={onClose}>
          {isA ? 'Quay lại' : 'Back'}
        </button>
      </div>
    )
  }
  if (questions == null) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in">
        <p className="text-zinc-400 text-sm">{isA ? 'Đang chuẩn bị đề thi…' : 'Preparing exam…'}</p>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in space-y-3">
        <p className="text-zinc-400 text-sm">
          {isA
            ? 'Chưa đủ dữ liệu để tạo đề thi cho cấp này.'
            : 'Not enough data to build an exam for this level yet.'}
        </p>
        <button
          onClick={onClose}
          className="tap-44-y inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition"
        >
          <ArrowLeft className="w-4 h-4" /> {isA ? 'Quay lại' : 'Back'}
        </button>
      </div>
    )
  }

  function pick(opt: string) {
    if (
      done ||
      !q ||
      selected !== null ||
      steps.picked.has(current) ||
      steps.advanced.has(current) ||
      !q.options.includes(opt)
    )
      return
    steps.picked.add(current)
    setSelected(opt)
  }

  async function submit(allAnswers: string[]) {
    if (submitting || !attemptId || !questions) return
    setSubmitting(true)
    setError(null)
    try {
      const grade = await submitCefrAssessment(attemptId, allAnswers)
      setQuestions(
        questions.map((question, i) => ({ ...question, correct: grade.correctAnswers[i] })),
      )
      setAnswers(grade.correctAnswers.map((answer, i) => answer === allAnswers[i]))
      setSavedPct(grade.result.bestPct)
      try {
        // Chỉ cache phản hồi vừa được máy chủ chấm, không tính quyền từ điểm trình duyệt.
        localStorage.setItem(`et_cefr_unlocked_${uid}`, JSON.stringify(grade.cefrUnlocked))
        const key = `et_cefr_exams_${uid}`
        const old: unknown = JSON.parse(localStorage.getItem(key) ?? '{}')
        const map = typeof old === 'object' && old && !Array.isArray(old) ? old : {}
        localStorage.setItem(key, JSON.stringify({ ...map, [level.id]: grade.result }))
      } catch {
        /* Cache lỗi không làm mất bài thi đã lưu trên máy chủ. */
      }
      setDone(true)
      stopSpeaking()
      // Đồng bộ kết quả đã chấm; lỗi đồng bộ không làm mất receipt bài nộp trên server.
      await pullProgress(uid).catch(() => undefined)
      for (const a of checkNewAchievements(uid)) toast.success(achievementMessage(a, isA))
      if (grade.passed) {
        const days = await claimCefrExamQuest(level.id).catch(() => 0)
        if (days)
          toast.success(
            isA
              ? `Chúc mừng qua cấp ${level.id}! Tặng ${days} ngày VIP.`
              : `Passed ${level.id}! ${days} VIP days added.`,
          )
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa nộp được bài thi')
    } finally {
      setSubmitting(false)
    }
  }

  function next() {
    if (done || submitting || !q || !questions || selected === null || steps.advanced.has(current))
      return
    steps.advanced.add(current)
    const newAnswers = [...chosen, selected]
    setChosen(newAnswers)
    if (current + 1 >= questions.length) {
      void submit(newAnswers)
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
    }
  }

  function retry() {
    restartFocus.current = true
    stopSpeaking()
    setQuestions(null)
    setDone(false)
    setAttempt((a) => a + 1) // → useEffect dựng đề MỚI
  }

  // ── Màn kết quả ─────────────────────────────────────────────────────
  if (done) {
    const correct = answers.filter(Boolean).length
    const s = scoreExam(correct, questions.length)
    const passThreshold = Math.round(EXAM_PASS_PCT * 100)
    const wrong = questions.filter((_, i) => !answers[i])
    return (
      <div className="animate-fade-in space-y-4">
        <div className="glass rounded-2xl p-8 text-center space-y-2">
          <p className="text-5xl">{s.passed ? '🎓' : '📚'}</p>
          <h2 ref={resultHeading} tabIndex={-1} className="text-2xl font-bold text-white">
            {s.correct}/{s.total} · {s.pct}%
          </h2>
          {s.passed ? (
            <>
              <p className={`font-semibold ${accent.text}`}>
                {isA ? `Chúc mừng! Bạn đã QUA cấp ${level.id} 🎉` : `You PASSED ${level.id}! 🎉`}
              </p>
              <p className="text-sm text-zinc-400">
                {isA
                  ? 'Cấp tiếp theo đã được mở khóa. Tiếp tục hành trình nhé!'
                  : 'The next level is now unlocked. Keep going!'}
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-400">
              {isA
                ? `Cần đạt ≥${passThreshold}% để qua cấp. Xem lại câu sai rồi thi lại (đề mới) nhé!`
                : `Need ≥${passThreshold}% to pass. Review the misses and retry (new exam)!`}
            </p>
          )}
          {savedPct != null && (
            <p className="text-xs text-zinc-300">
              {isA ? `Điểm cao nhất đã lưu: ${savedPct}%` : `Best score saved: ${savedPct}%`}
            </p>
          )}
        </div>

        {/* Danh sách câu sai (+ mở lại bài với câu ngữ pháp) */}
        {wrong.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-zinc-400 px-1">
              {isA ? `Câu cần xem lại (${wrong.length})` : `To review (${wrong.length})`}
            </p>
            {wrong.map((qq) => (
              <div
                key={qq.key}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm bg-rose-500/10 text-rose-300 theme-light:text-rose-900"
              >
                <span className="text-[0.6875rem] font-semibold uppercase shrink-0 opacity-80">
                  {isA ? PART_META[qq.part].vi : PART_META[qq.part].en}
                </span>
                <span className="font-medium truncate">
                  {qq.promptKind === 'audio' ? `🔊 ${qq.audioText}` : qq.prompt}
                </span>
                <span className="text-zinc-400 flex-1 truncate">= {qq.correct}</span>
                {qq.part === 'grammar' && qq.lessonId && (
                  <button
                    onClick={() => onOpenLesson(qq.lessonId!)}
                    className="text-xs text-violet-300 theme-light:text-violet-800 hover:text-violet-200 underline underline-offset-2 shrink-0"
                  >
                    {isA ? 'Mở lại bài' : 'Review'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          {!s.passed && (
            <button
              onClick={retry}
              className={buttonClass({ variant: 'primary', size: 'lg', className: 'flex-1' })}
            >
              <RotateCcw className="w-4 h-4" /> {isA ? 'Thi lại (đề mới)' : 'Retry (new exam)'}
            </button>
          )}
          <button
            onClick={onClose}
            className={buttonClass({
              variant: s.passed ? 'primary' : 'outline',
              size: 'lg',
              className: 'flex-1',
            })}
          >
            {isA ? 'Xong' : 'Done'}
          </button>
        </div>
      </div>
    )
  }

  // ── Màn 1 câu ───────────────────────────────────────────────────────
  if (!q) return null

  return (
    <div ref={questionContainer} className="animate-fade-in space-y-4">
      {/* Đầu bài: nút thoát + tiến độ */}
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="tap-44-y flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {isA ? 'Thoát' : 'Exit'}
        </button>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <GraduationCap className={`w-4 h-4 ${accent.text}`} />
          {isA ? `Thi cuối cấp ${level.id}` : `${level.id} exam`}
        </span>
        <span className="text-xs text-zinc-400">
          {current + 1}/{questions.length}
        </span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${accent.bar} transition-[width]`}
          style={{ width: `${(current / questions.length) * 100}%` }}
        />
      </div>

      {submitting && (
        <p role="status" className="text-zinc-300">
          {isA ? 'Đang chấm và lưu bài thi…' : 'Grading and saving…'}
        </p>
      )}
      {error && (
        <div role="alert" className="text-zinc-300">
          <p>{error}</p>
          <button className="tap-44 underline" onClick={() => void submit(chosen)}>
            {isA ? 'Nộp lại bài' : 'Retry submission'}
          </button>
        </div>
      )}
      <ExamQuestionCard
        q={q}
        isA={isA}
        accent={accent}
        current={current}
        total={questions.length}
        selected={selected}
        onPick={pick}
        onNext={next}
      />
    </div>
  )
}
