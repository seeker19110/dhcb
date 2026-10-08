// apps/dhcb/src/components/studyTabs/ListeningTab.tsx — tách từ components/StudyTabs.tsx (2.071 dòng) ngày 2026-09-06, mã GIỮ NGUYÊN.
// Barrel `components/StudyTabs.tsx` re-export nên nơi dùng không đổi đường import.

import { useState, useEffect, useMemo, useRef } from 'react'
import { RotateCcw, ChevronRight, Home, Volume2, Headphones, Keyboard } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { DictEntry } from '../../types'
import { haptics, vibrate } from '../../lib/haptics'
import { sound } from '../../lib/sound'
import ShareResultCard from '../ShareResultCard'
import { buildQuizShareContent } from '../../lib/shareContent'
import type { Dialogue } from '../../data/dialogues'
import { speak, stopSpeaking } from '../../lib/tts'
import type { AccentClasses } from '../../lib/cefrAccent'
import { buildListeningQuestions, type ExamQuestion } from '../../lib/cefrExam'
import ExamQuestionCard from '../ExamQuestionCard'
import { scorePronunciation, scoreWords, type WordScore } from '../../lib/pronounceScore'
import { buildDictationItems, listeningRateForLevel, type DictationItem } from '../../lib/listening'
import type { CefrId } from '../../lib/placement'
import { buttonClass } from '@core/buttonStyles'

// ── Luyện nghe (tab "Nghe", ③ N3, docs/research/dac-ta-nang-cap-su-pham-2026-07-15.md) ──
// 2 dạng: "Chọn nghĩa" (tái dùng buildListeningQuestions của cefrExam.ts — cùng engine
// phần Nghe của đề thi cuối cấp, KHÔNG viết lại) + "Gõ lại" (dictation — chấm bằng
// scorePronunciation/scoreWords, dùng chung PronunciationCheck.tsx).
const LISTENING_MEANING_COUNT = 8
const DICTATION_COUNT = 6
// Ngưỡng "đúng" cho 1 câu dictation. scorePronunciation dùng Levenshtein KÝ TỰ nên
// ~85% cho phép lệch khoảng 1 ký tự trên câu ngắn (đúng tiêu chí chấp nhận đặc tả).
const DICTATION_PASS_PCT = 85

function MeaningPractice({
  isA,
  accent,
  pool,
  learned,
  rate,
}: {
  isA: boolean
  accent: AccentClasses
  pool: DictEntry[]
  learned: Set<string>
  rate: number
}) {
  const nav = useNavigate()
  const [questions] = useState<ExamQuestion[]>(() =>
    buildListeningQuestions(isA, pool, learned, LISTENING_MEANING_COUNT),
  )
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [done, setDone] = useState(false)

  const [attempt, setAttempt] = useState(0)
  const steps = useMemo(
    () => ({ attempt, picked: new Set<number>(), advanced: new Set<number>() }),
    [attempt],
  )
  const resultHeading = useRef<HTMLHeadingElement>(null)
  const questionContainer = useRef<HTMLDivElement>(null)
  const restartFocus = useRef(false)
  useEffect(() => {
    if (done) resultHeading.current?.focus()
    else if (restartFocus.current) {
      const heading = questionContainer.current?.querySelector<HTMLElement>('h2[tabindex="-1"]')
      if (heading) {
        restartFocus.current = false
        heading.focus()
      }
    }
  }, [done, attempt])

  const q = questions[current]

  // Tự phát audio khi vào câu mới (tốc độ gợi ý theo cấp); dừng khi rời màn.
  useEffect(() => {
    if (!done && q?.audioText && q.audioLang)
      void speak(q.audioText, q.audioLang, q.audioVoice, rate)
    return () => stopSpeaking()
  }, [q, done, rate])

  if (questions.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in">
        <p className="text-zinc-400 text-sm">
          {isA
            ? 'Chưa đủ từ để luyện nghe. Hãy học vài từ ở tab Hôm nay trước nhé.'
            : 'Not enough words yet — learn some words first.'}
        </p>
      </div>
    )
  }
  if (!q) return null

  const score = answers.filter(Boolean).length
  const pct = Math.round((score / questions.length) * 100)

  function pick(opt: string) {
    if (
      !done &&
      selected === null &&
      !steps.picked.has(current) &&
      !steps.advanced.has(current) &&
      q?.options.includes(opt)
    ) {
      steps.picked.add(current)
      setSelected(opt)
      if (opt === q?.correct) {
        haptics.success()
        sound.correct()
      } else {
        vibrate(60)
        sound.wrong()
      }
    }
  }

  function next() {
    if (done || !q || selected === null || steps.advanced.has(current)) return
    steps.advanced.add(current)
    const newAnswers = [...answers, selected === q.correct]
    setAnswers(newAnswers)
    if (current + 1 >= questions.length) setDone(true)
    else {
      setCurrent((c) => c + 1)
      setSelected(null)
    }
  }

  function restart() {
    restartFocus.current = true
    setAttempt((a) => a + 1)
    setCurrent(0)
    setSelected(null)
    setAnswers([])
    setDone(false)
  }

  if (done) {
    const grade =
      pct >= 90
        ? { emoji: '🏆', label: isA ? 'Xuất sắc!' : 'Excellent!' }
        : pct >= 70
          ? { emoji: '👍', label: isA ? 'Tốt lắm!' : 'Good job!' }
          : pct >= 50
            ? { emoji: '💪', label: isA ? 'Cố lên!' : 'Keep going!' }
            : { emoji: '📚', label: isA ? 'Cần nghe nhiều hơn' : 'Listen more' }
    return (
      <div className="animate-fade-in space-y-4">
        <div className="glass rounded-xl p-8 text-center space-y-2">
          <p className="text-4xl">{grade.emoji}</p>
          <h2 ref={resultHeading} tabIndex={-1} className="text-2xl font-bold text-white">
            {score}/{questions.length}
          </h2>
          <p className="text-zinc-400">{grade.label}</p>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full ${pct >= 70 ? 'bg-accent-500' : pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <ShareResultCard {...buildQuizShareContent(score, questions.length, isA)} isA={isA} />
        <div className="flex gap-3">
          <button
            onClick={restart}
            className={buttonClass({ variant: 'outline', size: 'lg', className: 'flex-1' })}
          >
            <RotateCcw className="w-4 h-4" /> {isA ? 'Làm lại' : 'Retry'}
          </button>
          <button
            onClick={() => nav('/')}
            className={buttonClass({ size: 'lg', className: 'flex-1' })}
          >
            <Home className="w-4 h-4" /> {isA ? 'Trang chủ' : 'Home'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={questionContainer} className="animate-fade-in space-y-4">
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-sky-500 rounded-full transition-[width]"
          style={{ width: `${(current / questions.length) * 100}%` }}
        />
      </div>
      <ExamQuestionCard
        q={q}
        isA={isA}
        accent={accent}
        current={current}
        total={questions.length}
        selected={selected}
        onPick={pick}
        onNext={next}
        nextLabel={{
          last: isA ? 'Xem kết quả' : 'See results',
          more: isA ? 'Câu tiếp theo' : 'Next',
        }}
        rate={rate}
      />
    </div>
  )
}

function DictationPractice({
  isA,
  dialogues,
  words,
  rate,
}: {
  isA: boolean
  dialogues: Dialogue[]
  words: DictEntry[]
  rate: number
}) {
  const nav = useNavigate()
  const [items, setItems] = useState<DictationItem[]>(() =>
    buildDictationItems(isA, dialogues, words, DICTATION_COUNT),
  )
  // Nguồn câu đổi SAU khi đã vào chế độ "Gõ lại" (hội thoại về muộn / Thử lại thành công): chỉ NỐI
  // THÊM câu chưa có (khử trùng theo nội dung) — KHÔNG dựng lại cả danh sách, để câu đang gõ dở
  // (`current`, `typed`, `scores`) không bị đảo/reset. Chỉ nối cuối nên chỉ số `current` luôn hợp lệ.
  // Dùng khuôn "chỉnh state ngay lúc render" (React docs) thay vì effect để khỏi nháy một khung cũ.
  const sourceKey = `${isA ? 'a' : 'b'}:${dialogues.length}:${words.length}`
  const [syncedKey, setSyncedKey] = useState(sourceKey)
  if (syncedKey !== sourceKey) {
    setSyncedKey(sourceKey)
    const known = new Set(items.map((i) => i.text))
    const extra = buildDictationItems(isA, dialogues, words, DICTATION_COUNT).filter(
      (i) => !known.has(i.text),
    )
    if (extra.length > 0) setItems([...items, ...extra])
  }
  const [current, setCurrent] = useState(0)
  const [typed, setTyped] = useState('')
  const [checked, setChecked] = useState(false)
  const [scores, setScores] = useState<number[]>([])
  const [done, setDone] = useState(false)

  const item = items[current]

  // Tự phát audio khi vào câu mới (tốc độ gợi ý theo cấp); dừng khi rời màn.
  useEffect(() => {
    if (!done && item) void speak(item.text, item.lang, undefined, rate)
    return () => stopSpeaking()
  }, [item, done, rate])

  if (items.length === 0) {
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in">
        <p className="text-zinc-400 text-sm">
          {isA
            ? 'Chưa đủ câu để luyện gõ chính tả — học thêm hội thoại/từ vựng của cấp này nhé.'
            : 'Not enough sentences for dictation yet — explore more dialogues/vocabulary first.'}
        </p>
      </div>
    )
  }
  if (!item) return null

  const result = checked ? scorePronunciation(item.text, typed) : null
  const wordScores: WordScore[] = checked ? scoreWords(item.text, typed) : []

  function check() {
    if (!typed.trim() || !item) return
    setChecked(true)
    const s = scorePronunciation(item.text, typed)
    if (s >= DICTATION_PASS_PCT) {
      haptics.success()
      sound.correct()
    } else {
      vibrate(60)
      sound.wrong()
    }
  }

  function next() {
    if (!item) return
    setScores((s) => [...s, checked ? scorePronunciation(item.text, typed) : 0])
    setTyped('')
    setChecked(false)
    if (current + 1 >= items.length) setDone(true)
    else setCurrent((c) => c + 1)
  }

  function restart() {
    setCurrent(0)
    setTyped('')
    setChecked(false)
    setScores([])
    setDone(false)
  }

  if (done) {
    const avg = scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : 0
    const passedCount = scores.filter((s) => s >= DICTATION_PASS_PCT).length
    const grade =
      avg >= 90
        ? { emoji: '🏆', label: isA ? 'Xuất sắc!' : 'Excellent!' }
        : avg >= 70
          ? { emoji: '👍', label: isA ? 'Tốt lắm!' : 'Good job!' }
          : avg >= 50
            ? { emoji: '💪', label: isA ? 'Cố lên!' : 'Keep going!' }
            : { emoji: '📚', label: isA ? 'Cần nghe nhiều hơn' : 'Listen more' }
    return (
      <div className="animate-fade-in space-y-4">
        <div className="glass rounded-xl p-8 text-center space-y-2">
          <p className="text-4xl">{grade.emoji}</p>
          <p className="text-2xl font-bold text-white">
            {passedCount}/{items.length}
          </p>
          <p className="text-zinc-400">
            {grade.label} · {isA ? 'điểm TB' : 'avg'} {avg}%
          </p>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full rounded-full ${avg >= 70 ? 'bg-accent-500' : avg >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${avg}%` }}
            />
          </div>
        </div>
        <ShareResultCard {...buildQuizShareContent(passedCount, items.length, isA)} isA={isA} />
        <div className="flex gap-3">
          <button
            onClick={restart}
            className={buttonClass({ variant: 'outline', size: 'lg', className: 'flex-1' })}
          >
            <RotateCcw className="w-4 h-4" /> {isA ? 'Làm lại' : 'Retry'}
          </button>
          <button
            onClick={() => nav('/')}
            className={buttonClass({ size: 'lg', className: 'flex-1' })}
          >
            <Home className="w-4 h-4" /> {isA ? 'Trang chủ' : 'Home'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-4">
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-sky-500 rounded-full transition-[width]"
          style={{ width: `${(current / items.length) * 100}%` }}
        />
      </div>
      <div className="text-center py-2">
        <p className="text-xs text-zinc-400 mb-3">
          {isA
            ? `Câu ${current + 1}/${items.length} — Nghe rồi gõ lại`
            : `${current + 1}/${items.length} — Listen and type`}
        </p>
        <button
          onClick={() => void speak(item.text, item.lang, undefined, rate)}
          className="inline-flex items-center gap-2 px-5 py-4 rounded-2xl bg-sky-500/15 border border-sky-500/40 text-sky-300 theme-light:text-sky-800 font-semibold transition hover:opacity-90"
        >
          <Volume2 className="w-6 h-6" />
          {isA ? 'Nghe lại' : 'Play again'}
        </button>
      </div>

      <textarea
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        disabled={checked}
        rows={2}
        aria-label={isA ? 'Gõ lại câu vừa nghe' : 'Type what you heard'}
        placeholder={isA ? 'Gõ lại câu vừa nghe...' : 'Type what you heard...'}
        className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-4 py-3 text-base sm:text-sm text-white placeholder:text-zinc-400 outline-none focus:border-sky-500/60 transition resize-none disabled:opacity-50"
      />

      {checked && result !== null && (
        <div className="space-y-2 animate-fade-in">
          <p
            className={`text-sm font-bold text-center ${result >= DICTATION_PASS_PCT ? 'text-accent-400' : result >= 50 ? 'text-amber-400 theme-light:text-amber-900' : 'text-rose-400 theme-light:text-rose-900'}`}
          >
            {result}% {result >= DICTATION_PASS_PCT ? (isA ? '· Đúng!' : '· Correct!') : ''}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {wordScores.map((w, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-lg text-sm font-medium ${
                  w.ok
                    ? 'bg-accent-500/15 text-accent-300 border border-accent-500/25'
                    : 'bg-rose-500/15 text-rose-300 theme-light:text-rose-900 border border-rose-500/25'
                }`}
              >
                {w.word}
              </span>
            ))}
          </div>
          <p className="text-xs text-zinc-400 text-center">
            {isA ? 'Câu đúng' : 'Correct sentence'}: "{item.text}"
          </p>
        </div>
      )}

      <button
        onClick={checked ? next : check}
        disabled={!typed.trim()}
        className={buttonClass({ size: 'lg', fullWidth: true })}
      >
        {checked ? (
          <>
            {current + 1 >= items.length
              ? isA
                ? 'Xem kết quả'
                : 'See results'
              : isA
                ? 'Câu tiếp theo'
                : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </>
        ) : isA ? (
          'Kiểm tra'
        ) : (
          'Check'
        )}
      </button>
    </div>
  )
}

export function ListeningTab({
  isA,
  levelId,
  accent,
  pool,
  learned,
  dialogues,
}: {
  isA: boolean
  levelId: CefrId
  accent: AccentClasses
  pool: DictEntry[]
  learned: Set<string>
  dialogues: Dialogue[]
}) {
  const [mode, setMode] = useState<'meaning' | 'dictation'>('meaning')
  const rate = listeningRateForLevel(levelId)

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('meaning')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition ${
            mode === 'meaning'
              ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 theme-light:text-sky-800'
              : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <Headphones className="w-4 h-4" /> {isA ? 'Chọn nghĩa' : 'Choose meaning'}
        </button>
        <button
          onClick={() => setMode('dictation')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium border transition ${
            mode === 'dictation'
              ? 'bg-sky-500/15 border-sky-500/50 text-sky-300 theme-light:text-sky-800'
              : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <Keyboard className="w-4 h-4" /> {isA ? 'Gõ lại' : 'Type it'}
        </button>
      </div>

      {mode === 'meaning' ? (
        <MeaningPractice
          key={`${levelId}-meaning`}
          isA={isA}
          accent={accent}
          pool={pool}
          learned={learned}
          rate={rate}
        />
      ) : (
        <DictationPractice
          key={`${levelId}-dictation`}
          isA={isA}
          dialogues={dialogues}
          words={pool}
          rate={rate}
        />
      )}
    </div>
  )
}
