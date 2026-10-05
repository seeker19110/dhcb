// ──────────────────────────────────────────────────────────────────────
// CÁC MÀN CHI TIẾT CỦA LỘ TRÌNH CEFR (dùng chung cho trang từng cấp)
//
// Tách từ RoadmapTab.tsx cũ khi chuyển mỗi cấp thành 1 trang riêng:
//   - GrammarDetail: chi tiết 1 bài ngữ pháp (+ nút "Đã học xong bài này").
//   - QuizCard:      1 câu trắc nghiệm tự kiểm tra trong bài ngữ pháp.
//   - VocabFlash:    flashcard cho 1 vòng từ vựng.
//   - DialogueView:  xem 1 cuộc hội thoại (phát tất cả / tốc độ / chế độ).
// Bảng màu nhấn theo cấp: src/lib/cefrAccent.ts (react-refresh yêu cầu file
// component chỉ export component).
// ──────────────────────────────────────────────────────────────────────

import { thongDiepLoiThanThien } from '../lib/friendlyError'
import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useQuizKeyboard } from '@dhcb/core-ui/useQuizKeyboard'
import QuizOptionKey from './QuizOptionKey'
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Sparkles,
  CheckCircle2,
  X,
  Lightbulb,
  AlertTriangle,
  PencilLine,
  MessageCircle,
  Play,
  Pause,
  Square,
  Volume2,
  Zap,
  RotateCcw,
  Mic,
  Lock,
  Drama,
  Award,
} from 'lucide-react'
import {
  speak,
  stopSpeaking,
  pauseCurrentAudio,
  resumeCurrentAudio,
  unlockAudio,
  prefetchSpeech,
  getRatePref,
  setRatePref,
} from '../lib/tts'
import type { Voice } from '../lib/tts'
import { pickRandomVoice } from '../lib/voiceTiers'
import type { Plan, EvaluationResult } from '../types'
import KaraokeText, { KARAOKE_INDENT } from './KaraokeText'
import VoiceRoleBadge from './VoiceRoleBadge'
import WordCard from './WordCard'
import EvaluationResultView from './EvaluationResultView'
import { InlinePronounce } from '../pages/subjects/english/Lessons'
import type { GrammarLesson, QuizItem } from '../data/cefr'
import type { Circle } from '../data/curriculum'
import type { Dialogue } from '../data/dialogues'
import { getDialogues } from '../data/dialoguesLoader'
import type { DictEntry } from '../types'
import { getLearnedWords, markLearned } from '../lib/vocab'
import { addToSRS, addToSRSKnown } from '../lib/srs'
import { bumpDailyLearned } from '../lib/curriculum'
import { getUsage, incrementUsage, markStudiedToday } from '../lib/storage'
import { isGrammarDone, markGrammarDone, unmarkGrammarDone } from '../lib/cefrProgress'
import { ACCENT, type AccentClasses } from '../lib/cefrAccent'
import { startRecording, isRecordingSupported, type Recorder } from '../lib/sttServer'
import { callClaude, parseJson } from '../lib/ai'
import { shouldAlignPopoverRightFor } from '../lib/popoverAlign'
import { speakingFullEvaluationPrompt } from '../prompts'
import { effectivePlan } from '../lib/promo'
import { isFeatureEnabled } from '../lib/planFeatures'
import { getLimits } from '../lib/appSettings'
import { useApiThrottle } from '../lib/useApiThrottle'
import { shuffle } from '@dhcb/core-contracts/shuffle'
import MixedLangText from './MixedLangText'

// ── Chi tiết 1 bài ngữ pháp ───────────────────────────────────────────────────
export function GrammarDetail({
  lesson,
  isA,
  uid,
  accent,
  onBack,
  onDoneChange,
}: {
  lesson: GrammarLesson
  isA: boolean
  uid: string
  accent: AccentClasses
  onBack: () => void
  // Gọi khi đánh dấu/bỏ đánh dấu "đã học xong" — để trang cha tính lại tiến độ.
  onDoneChange?: () => void
}) {
  const [done, setDone] = useState(() => isGrammarDone(uid, lesson.id))

  function complete() {
    markGrammarDone(uid, lesson.id)
    markStudiedToday(uid) // học ngữ pháp cũng tính là có học hôm nay (streak)
    setDone(true)
    onDoneChange?.()
  }

  function undo() {
    unmarkGrammarDone(uid, lesson.id)
    setDone(false)
    onDoneChange?.()
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition mb-3"
      >
        <ChevronLeft className="w-4 h-4" /> {isA ? 'Quay lại' : 'Back'}
      </button>

      <div className="glass rounded-2xl p-5">
        <h3 className="font-bold text-white text-lg">
          <MixedLangText text={isA ? lesson.titleVi : lesson.titleEn} />
        </h3>

        {/* Công thức */}
        <div className={`mt-3 px-4 py-3 rounded-xl ${accent.soft} border ${accent.ring}`}>
          <p className="text-xs text-zinc-400 mb-1">{isA ? 'Cấu trúc' : 'Structure'}</p>
          {/* [U4 · WCAG 3.1.2] công thức trộn Anh/Việt → `lang` theo từng đoạn. */}
          <p className={`font-mono text-sm font-semibold ${accent.text}`}>
            <MixedLangText text={lesson.structure} />
          </p>
        </div>

        {/* Giải thích tiếng Việt */}
        <div className="mt-4 read-body read-measure text-zinc-300 whitespace-pre-line">
          {lesson.explainVi}
        </div>

        {/* Mẹo / lưu ý */}
        {lesson.tipVi && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <p className="text-xs font-semibold text-amber-300 theme-light:text-amber-800 mb-1 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" /> {isA ? 'Mẹo ghi nhớ' : 'Tip'}
            </p>
            <p className="read-body read-measure text-zinc-300 whitespace-pre-line">
              {lesson.tipVi}
            </p>
          </div>
        )}

        {/* Ví dụ có nghe */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80">
          <p className="text-xs font-semibold text-zinc-400 mb-2">{isA ? 'Ví dụ' : 'Examples'}</p>
          <div className="space-y-2">
            {lesson.examples.map((e, i) => (
              <div
                key={i}
                className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-4 py-3"
              >
                <KaraokeText
                  text={e.en}
                  lang="en-US"
                  textClass={`font-medium text-[15px] leading-snug ${accent.text}`}
                  buttonClass="w-full"
                />
                <p className={`text-sm text-zinc-400 mt-1 ${KARAOKE_INDENT}`}>{e.vi}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Lỗi thường gặp */}
        {lesson.mistakes && lesson.mistakes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800/80">
            <p className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 theme-light:text-rose-700" />
              {isA ? 'Lỗi thường gặp' : 'Common mistakes'}
            </p>
            <div className="space-y-2">
              {lesson.mistakes.map((m, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-4 py-3"
                >
                  <p className="text-sm text-rose-300 theme-light:text-rose-700 line-through decoration-rose-500/60">
                    {m.wrong}
                  </p>
                  <p className="text-sm text-accent-300 theme-light:text-accent-800 mt-0.5 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 shrink-0" /> {m.right}
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">{m.noteVi}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bài tập nhỏ */}
        {lesson.quiz && lesson.quiz.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800/80">
            <p className="text-xs font-semibold text-zinc-400 mb-2 flex items-center gap-1.5">
              <PencilLine className={`w-3.5 h-3.5 ${accent.text}`} />
              {isA ? 'Tự kiểm tra' : 'Quick check'}
            </p>
            <div className="space-y-3">
              {lesson.quiz.map((q, i) => (
                <QuizCard key={i} item={q} isA={isA} />
              ))}
            </div>
          </div>
        )}

        {/* Đánh dấu đã học xong — để lộ trình ẩn bài này + tính tiến độ ngữ pháp */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80">
          {done ? (
            <div
              className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl ${ACCENT.emerald.soft} border ${ACCENT.emerald.ring}`}
            >
              <p className="text-sm font-medium text-accent-300 theme-light:text-accent-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                {isA ? 'Bạn đã hoàn thành bài này' : 'Lesson completed'}
              </p>
              <button
                onClick={undo}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline shrink-0 transition"
              >
                {isA ? 'Bỏ đánh dấu' : 'Undo'}
              </button>
            </div>
          ) : (
            <button
              onClick={complete}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 theme-light:text-accent-800 text-sm font-semibold transition"
            >
              <Check className="w-4 h-4" /> {isA ? 'Đã học xong bài này' : 'Mark as done'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Một câu trắc nghiệm tự kiểm tra ───────────────────────────────────────────
export function QuizCard({ item, isA }: { item: QuizItem; isA: boolean }) {
  // pick = đáp án người dùng đã chọn (null = chưa chọn).
  const [pick, setPick] = useState<number | null>(null)
  const answered = pick !== null
  const correct = pick === item.answer

  return (
    <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-4 py-3">
      <p className="text-sm font-medium text-zinc-200 mb-2">{item.q}</p>
      <div className="space-y-1.5">
        {item.options.map((opt, i) => {
          // Sau khi trả lời: tô xanh đáp án đúng, tô đỏ đáp án đã chọn nếu sai.
          let cls = 'bg-zinc-800/70 border-zinc-700 text-zinc-300 hover:border-zinc-500'
          if (answered) {
            if (i === item.answer)
              cls =
                'bg-accent-500/15 border-accent-500/50 text-accent-300 theme-light:text-accent-800'
            else if (i === pick)
              cls = 'bg-rose-500/15 border-rose-500/50 text-rose-300 theme-light:text-rose-700'
            else cls = 'bg-zinc-800/40 border-zinc-800 text-zinc-400'
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPick(i)}
              className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition ${cls}`}
            >
              {opt}
              {answered && i === item.answer && <Check className="inline w-3.5 h-3.5 ml-1.5" />}
            </button>
          )
        })}
      </div>
      {answered && (
        <p
          className={`text-xs mt-2 ${correct ? 'text-accent-400 theme-light:text-accent-800' : 'text-rose-400 theme-light:text-rose-700'}`}
        >
          {correct ? (isA ? '✓ Chính xác!' : '✓ Correct!') : isA ? '✗ Chưa đúng.' : '✗ Not quite.'}
          {item.explainVi && <span className="text-zinc-400"> {item.explainVi}</span>}
        </p>
      )}
    </div>
  )
}

// ── Flashcard cho 1 vòng từ vựng (gắn vào lộ trình) ───────────────────────────
// ── Test-out: "Tôi đã biết vòng này" — quiz nhanh thay vì lật từng thẻ ────────
// Cho người đã biết sẵn từ vựng (VD: đã học tiếng Anh trước đó) bỏ qua lật thẻ.
// Đúng ≥90% → đánh dấu CẢ VÒNG đã thuộc, vào SRS với interval dài (7 ngày, xem
// addToSRSKnown) — KHÔNG tính vào bộ đếm học/ngày (không phải từ mới học).
const TESTOUT_QUIZ_SIZE = 10
const TESTOUT_CHOICES = 4
const TESTOUT_PASS_RATIO = 0.9

interface TestOutQ {
  word: string
  correct: string
  options: string[]
}

function buildTestOutQuiz(circleWords: DictEntry[], pool: DictEntry[]): TestOutQ[] {
  const size = Math.min(TESTOUT_QUIZ_SIZE, circleWords.length)
  const qs = shuffle(circleWords).slice(0, size)
  const meanings = pool.map((w) => w.vi)
  return qs.map((q) => {
    const wrongs = shuffle(meanings.filter((m) => m !== q.vi)).slice(0, TESTOUT_CHOICES - 1)
    return {
      word: q.word,
      correct: q.vi,
      options: shuffle([q.vi, ...wrongs]),
    }
  })
}

export function VocabFlash({
  circle,
  isA,
  uid,
  pool,
  onProgress,
  onBack,
  onOpenDialogue,
}: {
  circle: Circle
  isA: boolean
  uid: string
  pool: DictEntry[]
  onProgress: () => void
  onBack: () => void
  onOpenDialogue: (d: Dialogue) => void
}) {
  // Lọc ra các từ CHƯA thuộc để học trước; nếu đã thuộc hết thì ôn lại cả vòng.
  const [cards] = useState<DictEntry[]>(() => {
    const learned = getLearnedWords(uid)
    const todo = circle.words.filter(
      (w) => !learned.has(w.word) && !learned.has(w.word.toLowerCase()),
    )
    return todo.length > 0 ? todo : circle.words
  })
  const [idx, setIdx] = useState(0)
  const card = cards[idx]
  const done = idx >= cards.length
  const [dialogues, setDialogues] = useState<Dialogue[]>([])
  useEffect(() => {
    getDialogues(circle.id).then(setDialogues)
  }, [circle.id])

  // Test-out ("Tôi đã biết vòng này")
  const [testOutMode, setTestOutMode] = useState<'quiz' | 'passed' | 'failed' | null>(null)
  const [testOutQs, setTestOutQs] = useState<TestOutQ[]>([])
  const [testOutIdx, setTestOutIdx] = useState(0)
  const [testOutSel, setTestOutSel] = useState<string | null>(null)
  const [testOutAns, setTestOutAns] = useState<boolean[]>([])

  function startTestOut() {
    setTestOutQs(buildTestOutQuiz(circle.words, pool))
    setTestOutIdx(0)
    setTestOutSel(null)
    setTestOutAns([])
    setTestOutMode('quiz')
  }

  function testOutNext() {
    const q = testOutQs[testOutIdx]
    if (!q) return
    const newAns = [...testOutAns, testOutSel === q.correct]
    if (testOutIdx + 1 >= testOutQs.length) {
      const passed = newAns.filter(Boolean).length >= Math.ceil(newAns.length * TESTOUT_PASS_RATIO)
      if (passed) {
        for (const w of circle.words) {
          markLearned(uid, w.word)
          addToSRSKnown(uid, w.word)
        }
        markStudiedToday(uid) // ghi nhận có học hôm nay → tính streak (đồng bộ server)
        onProgress()
      }
      setTestOutAns(newAns)
      setTestOutMode(passed ? 'passed' : 'failed')
    } else {
      setTestOutAns(newAns)
      setTestOutIdx((i) => i + 1)
      setTestOutSel(null)
    }
  }

  // Đếm số lần bấm "Đã thuộc" — dùng làm `key` để phát lại hoạt ảnh ghi nhận ở mỗi lượt.
  // Đây CHỈ để hiển thị, không phải nguồn sự thật về tiến độ (nguồn đó là markLearned).
  const [learnedFlash, setLearnedFlash] = useState(0)

  function learn() {
    if (!card) return
    markLearned(uid, card.word)
    addToSRS(uid, card.word)
    bumpDailyLearned(uid)
    markStudiedToday(uid) // ghi nhận có học hôm nay → tính streak (đồng bộ server)
    onProgress()
    setLearnedFlash((n) => n + 1)
    setIdx((i) => i + 1)
  }

  // Phím tắt cho thẻ từ vựng: 1 = Để sau, 2 = Đã thuộc. Dùng lại đúng hook của bài trắc
  // nghiệm (`answered: false` nên chỉ nhánh phím số sống) — đây là thao tác lặp nhiều nhất
  // của người học, 20–100 lượt mỗi ngày, nên rời tay khỏi bàn phím mỗi lượt là tốn thật.
  // Tắt khi đang ở màn test-out để phím số không vừa chọn đáp án vừa lật thẻ.
  useQuizKeyboard({
    optionCount: 2,
    onPick: (i) => (i === 0 ? setIdx((n) => n + 1) : learn()),
    answered: false,
    enabled: testOutMode === null && !done && Boolean(card),
  })

  if (testOutMode === 'quiz') {
    const q = testOutQs[testOutIdx]
    if (!q) return null
    return (
      <div className="animate-fade-in space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
          <span className="text-violet-400 theme-light:text-violet-800 font-medium">
            {isA ? 'Kiểm tra "Đã biết vòng này"' : 'Test-out quiz'}
          </span>
          <span>
            {testOutIdx + 1}/{testOutQs.length}
          </span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full">
          <div
            className="h-full bg-violet-500 rounded-full transition-all"
            style={{ width: `${(testOutIdx / testOutQs.length) * 100}%` }}
          />
        </div>
        <div className="text-center py-4">
          <p className="text-xs text-zinc-400 mb-3 uppercase tracking-wide">
            {isA ? 'Nghĩa tiếng Việt của từ này là?' : 'Vietnamese meaning?'}
          </p>
          <p className="text-4xl font-bold text-white">{q.word}</p>
        </div>
        <div className="space-y-2.5">
          {q.options.map((opt) => {
            let cls = 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-600'
            if (testOutSel !== null) {
              if (opt === q.correct) cls = 'bg-accent-500/20 border-accent-500/60 text-accent-300'
              else if (opt === testOutSel)
                cls = 'bg-rose-500/20 border-rose-500/60 text-rose-300 theme-light:text-rose-900'
              else cls = 'bg-zinc-900/40 border-zinc-800/40 text-zinc-400'
            }
            return (
              <button
                key={opt}
                onClick={() => {
                  if (testOutSel === null) setTestOutSel(opt)
                }}
                className={`w-full text-left px-4 py-3.5 rounded-2xl border font-medium text-[15px] transition-all ${cls}`}
              >
                {opt}
              </button>
            )
          })}
        </div>
        {testOutSel !== null && (
          <button
            onClick={testOutNext}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-semibold transition animate-fade-in"
          >
            {testOutIdx + 1 >= testOutQs.length
              ? isA
                ? 'Xem kết quả'
                : 'See results'
              : isA
                ? 'Câu tiếp theo'
                : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  if (testOutMode === 'passed' || testOutMode === 'failed') {
    const score = testOutAns.filter(Boolean).length
    const passed = testOutMode === 'passed'
    return (
      <div className="glass rounded-xl p-8 text-center animate-fade-in space-y-3">
        <p className="text-4xl">{passed ? '🏆' : '📚'}</p>
        <p className="text-white font-semibold">
          {passed
            ? isA
              ? `Chính xác! ${score}/${testOutAns.length} — đã đánh dấu cả vòng là đã thuộc`
              : `Nice! ${score}/${testOutAns.length} — whole set marked as known`
            : isA
              ? `${score}/${testOutAns.length} — cần đúng ≥90% để qua vòng`
              : `${score}/${testOutAns.length} — need ≥90% to test out`}
        </p>
        {!passed && (
          <p className="text-sm text-zinc-400">
            {isA ? 'Học lần lượt từng thẻ bên dưới nhé!' : "Let's go through the flashcards!"}
          </p>
        )}
        <div className="flex gap-3 pt-1">
          {!passed && (
            <button
              onClick={startTestOut}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition"
            >
              <RotateCcw className="w-4 h-4" /> {isA ? 'Thử lại' : 'Retry'}
            </button>
          )}
          <button
            onClick={() => (passed ? onBack() : setTestOutMode(null))}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent-500 hover:bg-accent-400 text-black font-semibold transition"
          >
            {passed ? (isA ? 'Quay lại' : 'Back') : isA ? 'Học bình thường' : 'Learn normally'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200 transition mb-3"
      >
        <ChevronLeft className="w-4 h-4" /> {isA ? 'Quay lại' : 'Back'}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400 mb-2">
        <span>{circle.emoji}</span>
        <span>{isA ? circle.titleVi : circle.titleEn}</span>
      </div>

      {idx === 0 && !done && pool.length >= TESTOUT_CHOICES && (
        <button
          onClick={startTestOut}
          className="w-full flex items-center justify-center gap-2 mb-3 py-2.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 theme-light:text-violet-800 text-sm font-medium transition"
        >
          <Zap className="w-4 h-4" />{' '}
          {isA ? 'Tôi đã biết vòng này — kiểm tra nhanh' : 'I already know this set — quick test'}
        </button>
      )}

      {done || !card ? (
        <div className="glass rounded-xl p-8 text-center space-y-3">
          <Check className="w-10 h-10 text-accent-400 mx-auto" />
          <p className="text-white font-semibold">{isA ? 'Xong bộ từ này!' : 'Set complete!'}</p>
          {circle.sentences.length > 0 && (
            <div className="text-left pt-3 border-t border-zinc-800 space-y-2">
              <p className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400 theme-light:text-teal-800" />
                {isA ? 'Câu thông dụng' : 'Common sentences'}
              </p>
              {circle.sentences.map((s, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl px-4 py-3"
                >
                  <KaraokeText
                    text={s.en}
                    lang="en-US"
                    textClass="font-medium text-[15px] leading-snug text-teal-300 theme-light:text-teal-800"
                    buttonClass="w-full"
                  />
                  <p className={`text-sm text-zinc-400 mt-1 ${KARAOKE_INDENT}`}>{s.vi}</p>
                </div>
              ))}
            </div>
          )}
          {dialogues.length > 0 && (
            <div className="text-left pt-3 border-t border-zinc-800 space-y-1.5">
              <p className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-teal-400 theme-light:text-teal-800" />
                {isA ? 'Hội thoại mẫu' : 'Sample dialogues'}
              </p>
              {dialogues.map((dl, i) => (
                <button
                  key={i}
                  onClick={() => onOpenDialogue(dl)}
                  className="w-full flex items-center gap-2 text-left px-3 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-600 transition"
                >
                  <MessageCircle className="w-4 h-4 shrink-0 text-teal-400 theme-light:text-teal-800" />
                  <span className="flex-1 min-w-0 text-sm font-medium text-zinc-200 truncate">
                    {isA ? dl.titleVi : dl.titleEn}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={onBack}
            className="w-full mt-2 py-3 rounded-xl bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 theme-light:text-accent-800 text-sm font-medium transition"
          >
            {isA ? 'Quay lại' : 'Back'}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span>
              {isA ? 'Từ' : 'Word'} {idx + 1}/{cards.length}
            </span>
          </div>
          <div className="h-1 bg-zinc-800 rounded-full mb-4">
            <div
              className="h-full bg-accent-500 rounded-full transition-all"
              style={{ width: `${(idx / cards.length) * 100}%` }}
            />
          </div>

          <WordCard key={card.word} card={card} isA={isA} uid={uid} onUpdate={onProgress} />

          {/* Ghi nhận "Đã thuộc" — thêm 2026-09-02.
              Trước đây bấm "Đã thuộc" là thẻ lật sang từ kế tiếp, không một hồi đáp nào. Đây là
              thao tác lặp 20–100 lượt mỗi ngày, tức là nơi người học cần cảm giác "mình vừa
              làm được một việc" nhất trong toàn app.
              KHÔNG chặn và KHÔNG làm chậm nhịp: thẻ vẫn lật ngay lập tức, dấu tích chỉ trôi
              lên rồi tự mờ đi bên cạnh. `key` đổi theo mỗi lượt bấm để hoạt ảnh chạy lại;
              `pointer-events-none` để nó không bao giờ chắn mất nút bên dưới. */}
          {learnedFlash > 0 && (
            <div className="relative h-0" aria-hidden="true">
              <span
                key={learnedFlash}
                className="pointer-events-none absolute -top-1 right-2 flex items-center gap-1 text-xs font-semibold text-accent-300 theme-light:text-accent-800 animate-fade-up"
              >
                <Check className="w-3.5 h-3.5" /> +1
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setIdx((i) => i + 1)}
              className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition py-3 rounded-xl text-sm font-medium"
            >
              <QuizOptionKey index={0} />
              <X className="w-4 h-4" /> {isA ? 'Để sau' : 'Later'}
            </button>
            <button
              onClick={learn}
              className="flex items-center justify-center gap-2 bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 theme-light:text-accent-800 transition py-3 rounded-xl text-sm font-medium"
            >
              <QuizOptionKey index={1} />
              <Check className="w-4 h-4" /> {isA ? 'Đã thuộc' : 'Got it'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Xem 1 cuộc hội thoại ──────────────────────────────────────────────────────
// Hai người nói A/B hiển thị so le hai bên (giống khung chat). Mỗi câu tiếng Anh
// bấm nghe được (KaraokeText), kèm bản dịch tiếng Việt bên dưới.
// Có thanh điều khiển: tốc độ (0.75× / 1× / 1.25×) + chế độ EN / EN+VI / VI
// + Phát tất cả / Dừng / Tiếp — giống trang Lessons.

type DlgSpeed = 0.75 | 1 | 1.25
type DlgMode = 'en' | 'both' | 'vi'

export function DialogueView({
  dialogue,
  isA,
  accent,
  plan,
  userId,
  onBack,
}: {
  dialogue: Dialogue
  isA: boolean
  accent: AccentClasses
  plan: Plan
  userId: string
  onBack: () => void
}) {
  const [activeLine, setActiveLine] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const [paused, setPaused] = useState(false)
  const [speed, setSpeed] = useState<DlgSpeed>(getRatePref())
  const [mode, setMode] = useState<DlgMode>('en')
  // Panel "Cài đặt giọng" ẩn mặc định, bấm nhãn ở thanh control mới hiện; đặt xong 1 giọng thì
  // tự ẩn lại sau 3s (đỡ chiếm chỗ màn hình nhỏ).
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false)
  const hideVoiceSettingsRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (hideVoiceSettingsRef.current) clearTimeout(hideVoiceSettingsRef.current)
    },
    [],
  )
  function handleVoiceSet() {
    if (hideVoiceSettingsRef.current) clearTimeout(hideVoiceSettingsRef.current)
    hideVoiceSettingsRef.current = setTimeout(() => setVoiceSettingsOpen(false), 3000)
  }
  // Từ đang đọc của dòng đang phát (chỉ theo dõi khi audio đang đọc CHÍNH `ln.en` — đúng văn
  // bản mà KaraokeText hiển thị) — cho karaoke sáng chữ trong lúc "Phát tất cả", không chỉ khi
  // bấm nghe từng dòng riêng lẻ.
  const [dlgWordSync, setDlgWordSync] = useState<{
    lineIdx: number
    wordIdx: number | null
  } | null>(null)

  const stopRef = useRef(false)
  const pauseRef = useRef(false)
  const speedRef = useRef<DlgSpeed>(getRatePref())
  const modeRef = useRef<DlgMode>('en')

  // Phân giọng cho từng nhân vật — RANDOM trong số giọng gói hiện tại cho phép (đúng giới
  // tính của vai), đổi mỗi lần mở hội thoại khác/mở lại (dialogue.titleEn đổi) để người dùng
  // nghe thử được nhiều giọng; nếu cùng giới mà trùng giọng thì random lại B tối đa vài lần.
  // Giống cách làm ở src/pages/Lessons.tsx (LessonView).
  const genderA = dialogue.speakerAGender ?? 'female'
  const genderB = dialogue.speakerBGender ?? 'male'
  const initialVoices = useMemo<{ voiceA: Voice; voiceB: Voice }>(() => {
    const a = pickRandomVoice(genderA, plan)
    let b = pickRandomVoice(genderB, plan)
    for (let i = 0; i < 5 && b === a; i++) b = pickRandomVoice(genderB, plan)
    return { voiceA: a, voiceB: b }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogue.titleEn, genderA, genderB, plan])

  const [voiceA, setVoiceA] = useState<Voice>(initialVoices.voiceA)
  const [voiceB, setVoiceB] = useState<Voice>(initialVoices.voiceB)
  const voiceARef = useRef<Voice>(initialVoices.voiceA)
  const voiceBRef = useRef<Voice>(initialVoices.voiceB)

  // Reset giọng khi mở hội thoại khác — dùng mẫu "so sánh prev trong render"
  // (React cho phép setState có điều kiện ngay trong render để dẫn xuất từ prop,
  // thay cho setState đồng bộ trong effect trước đây).
  const [prevInitialVoices, setPrevInitialVoices] = useState(initialVoices)
  if (prevInitialVoices !== initialVoices) {
    setPrevInitialVoices(initialVoices)
    setVoiceA(initialVoices.voiceA)
    setVoiceB(initialVoices.voiceB)
  }
  // Đồng bộ ref (đọc trong vòng phát async) theo state — ghi ref trong effect, không trong render.
  useEffect(() => {
    voiceARef.current = voiceA
    voiceBRef.current = voiceB
  }, [voiceA, voiceB])

  function changeVoiceA(v: Voice) {
    setVoiceA(v)
    voiceARef.current = v
  }
  function changeVoiceB(v: Voice) {
    setVoiceB(v)
    voiceBRef.current = v
  }

  // Dừng audio khi back
  useEffect(
    () => () => {
      stopRef.current = true
      stopSpeaking()
    },
    [],
  )

  function changeSpeed(s: DlgSpeed) {
    setSpeed(s)
    speedRef.current = s
    setRatePref(s)
  }
  function changeMode(m: DlgMode) {
    setMode(m)
    modeRef.current = m
  }

  async function startPlayAll() {
    unlockAudio() // mở khoá audio iOS NGAY trong cú bấm (trước mọi await)
    stopRef.current = false
    pauseRef.current = false
    setPlaying(true)
    setPaused(false)
    setActiveLine(null)

    const targetLang = isA ? 'en-US' : 'vi-VN'
    const transLang = isA ? 'vi-VN' : 'en-US'

    // Nạp TRƯỚC audio các câu (chạy nền, tuần tự) để phát liền mạch không khựng.
    // Tải nhanh hơn đọc nên bộ nạp luôn đi trước trình phát; trùng câu thì gộp (dedup).
    void (async () => {
      for (const ln of dialogue.lines) {
        if (stopRef.current) break
        const v = ln.who === 'A' ? voiceARef.current : voiceBRef.current
        const m = modeRef.current
        if (m === 'en' || m === 'both') await prefetchSpeech(ln.en, 'en-US', v)
        if (m === 'vi' || m === 'both') await prefetchSpeech(ln.vi, 'vi-VN', v)
      }
    })()

    for (let i = 0; i < dialogue.lines.length; i++) {
      if (stopRef.current) break
      while (pauseRef.current && !stopRef.current) await new Promise((r) => setTimeout(r, 100))
      if (stopRef.current) break

      const ln = dialogue.lines[i]
      if (!ln) continue // i < lines.length nên ln luôn có; guard để TS narrow kiểu
      setActiveLine(i)
      setDlgWordSync(null)

      const curMode = modeRef.current
      const curSpeed = speedRef.current
      const curVoice = ln.who === 'A' ? voiceARef.current : voiceBRef.current

      // Chỉ theo dõi từ đang đọc khi văn bản CHÍNH LÀ câu KaraokeText đang hiển thị (đích học:
      // ln.en ở chiều A, ln.vi ở chiều B) — câu còn lại luôn hiện dạng chữ thường, không karaoke.
      const displayText = isA ? ln.en : ln.vi
      const onWordFor = (text: string) =>
        text === displayText
          ? (wi: number) => setDlgWordSync({ lineIdx: i, wordIdx: wi })
          : undefined

      if (curMode === 'en') {
        await speak(ln.en, 'en-US', curVoice, curSpeed, onWordFor(ln.en))
      } else if (curMode === 'vi') {
        await speak(ln.vi, 'vi-VN', curVoice, curSpeed)
      } else {
        // both: đích trước, bản dịch sau
        const targetText = isA ? ln.en : ln.vi
        const transText = isA ? ln.vi : ln.en
        await speak(targetText, targetLang, curVoice, curSpeed, onWordFor(targetText))
        if (!stopRef.current) {
          await new Promise((r) => setTimeout(r, 250))
          setDlgWordSync(null)
          await speak(transText, transLang, curVoice, curSpeed, onWordFor(transText))
        }
      }
      if (!stopRef.current) await new Promise((r) => setTimeout(r, 400))
    }

    stopRef.current = false
    setPlaying(false)
    setPaused(false)
    setActiveLine(null)
    setDlgWordSync(null)
  }

  function handlePause() {
    pauseRef.current = true
    setPaused(true)
    pauseCurrentAudio()
  }
  function handleResume() {
    pauseRef.current = false
    setPaused(false)
    resumeCurrentAudio()
  }
  function handleStop() {
    stopRef.current = true
    stopSpeaking()
    setPlaying(false)
    setPaused(false)
    setActiveLine(null)
    setDlgWordSync(null)
  }

  // ── Chế độ "Đóng vai" ─────────────────────────────────────────────────────
  // Người dùng chọn 1 vai (theo TÊN NHÂN VẬT thật, không phải chữ A/B) → dòng của vai
  // kia AI đọc bằng TTS như bình thường, dòng của vai người dùng thì DỪNG lại chờ họ
  // bấm ghi âm và tự đọc — viền hội thoại đang tới lượt sáng lên (dùng lại activeLine/
  // isActive có sẵn) kèm chữ sáng dần theo TỐC ĐỘ ĐỌC ước lượng (không có timestamp thật
  // từ STT theo lô nên mô phỏng bằng bộ đếm giờ theo số từ, cùng thang tốc độ 0.75/1/1.25×
  // người dùng đã chọn ở thanh điều khiển). Hết hội thoại → gọi AI chấm điểm 1 lần bằng
  // đúng prompt speakingFullEvaluationPrompt() đang dùng ở trang Luyện nói (Speaking.tsx).
  // Bật/tắt qua ma trận tính năng theo gói (feature key "dialogue_roleplay"), admin chỉnh ở
  // tab "Tính năng theo gói" trong /admin — xem src/lib/planFeatures.ts.
  const isPro = isFeatureEnabled(effectivePlan(plan), 'dialogue_roleplay')
  const canRecord = isRecordingSupported()
  const [rolePlay, setRolePlay] = useState<{ role: 'A' | 'B' } | null>(null)
  const [rolePicker, setRolePicker] = useState(false)
  // Phía neo popover chọn vai, quyết lúc bấm theo vị trí thật của nút (lib/popoverAlign.ts).
  const [rpAlignRight, setRpAlignRight] = useState(false)
  const [rpIdx, setRpIdx] = useState<number | null>(null)
  const [rpRecording, setRpRecording] = useState(false)
  const [rpTranscribing, setRpTranscribing] = useState(false)
  const [rpTranscripts, setRpTranscripts] = useState<Record<number, string>>({})
  const [rpFinished, setRpFinished] = useState(false)
  const [rpEvaluating, setRpEvaluating] = useState(false)
  const [rpEvaluation, setRpEvaluation] = useState<EvaluationResult | null>(null)
  const [rpError, setRpError] = useState('')
  const rpStopRef = useRef(false)
  const rpRecorderRef = useRef<Recorder | null>(null)
  const rpResolveRef = useRef<((text: string) => void) | null>(null)
  const rpWordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { isThrottled: rpThrottled, throttle: rpThrottle } = useApiThrottle()

  function stopWordPacer() {
    if (rpWordTimerRef.current) {
      clearInterval(rpWordTimerRef.current)
      rpWordTimerRef.current = null
    }
  }
  // "Sáng chữ theo tốc độ người đọc": không có mốc thời gian thật của giọng người dùng
  // (STT chỉ trả text sau khi ghi xong) nên ước lượng bằng nhịp đều theo tốc độ đang chọn.
  function startWordPacer(lineIdx: number, text: string) {
    stopWordPacer()
    const words = text.split(/\s+/).filter(Boolean)
    if (words.length === 0) return
    let wi = 0
    setDlgWordSync({ lineIdx, wordIdx: 0 })
    const msPerWord = Math.max(120, 320 / speedRef.current)
    rpWordTimerRef.current = setInterval(() => {
      wi++
      if (wi >= words.length) {
        stopWordPacer()
        return
      }
      setDlgWordSync({ lineIdx, wordIdx: wi })
    }, msPerWord)
  }

  function waitForUserTurn(i: number, text: string): Promise<string> {
    return new Promise((resolve) => {
      rpResolveRef.current = resolve
      startWordPacer(i, text)
    })
  }

  async function beginRolePlayRecording() {
    if (!canRecord || rpIdx === null || rpRecording) return
    unlockAudio()
    try {
      const rec = await startRecording(isA ? 'en' : 'vi')
      rpRecorderRef.current = rec
      setRpRecording(true)
    } catch {
      setRpError(
        isA
          ? 'Không mở được micro. Kiểm tra quyền truy cập trình duyệt.'
          : 'Could not access microphone. Check browser permissions.',
      )
    }
  }

  async function finishRolePlayRecording() {
    const rec = rpRecorderRef.current
    if (!rec) return
    setRpRecording(false)
    setRpTranscribing(true)
    stopWordPacer()
    let text = ''
    try {
      text = await rec.stop()
    } catch {
      text = ''
    }
    rpRecorderRef.current = null
    setRpTranscribing(false)
    rpResolveRef.current?.(text)
    rpResolveRef.current = null
  }

  function skipRolePlayLine() {
    stopWordPacer()
    if (rpRecorderRef.current) {
      rpRecorderRef.current.cancel()
      rpRecorderRef.current = null
    }
    setRpRecording(false)
    rpResolveRef.current?.('')
    rpResolveRef.current = null
  }

  async function startRolePlay(role: 'A' | 'B') {
    unlockAudio()
    rpStopRef.current = false
    setRolePicker(false)
    setRolePlay({ role })
    setRpFinished(false)
    setRpEvaluation(null)
    setRpError('')
    setRpTranscripts({})
    setActiveLine(null)
    setDlgWordSync(null)

    for (let i = 0; i < dialogue.lines.length; i++) {
      if (rpStopRef.current) break
      const ln = dialogue.lines[i]
      if (!ln) continue
      setActiveLine(i)
      setDlgWordSync(null)
      const displayText = isA ? ln.en : ln.vi

      if (ln.who === role) {
        setRpIdx(i)
        const text = await waitForUserTurn(i, displayText)
        setRpIdx(null)
        if (rpStopRef.current) break
        setRpTranscripts((prev) => ({ ...prev, [i]: text }))
      } else {
        const v = ln.who === 'A' ? voiceARef.current : voiceBRef.current
        const lang = isA ? 'en-US' : 'vi-VN'
        await speak(displayText, lang, v, speedRef.current, (wi) =>
          setDlgWordSync({ lineIdx: i, wordIdx: wi }),
        )
        if (!rpStopRef.current) await new Promise((r) => setTimeout(r, 400))
      }
    }

    const wasStopped = rpStopRef.current
    rpStopRef.current = false
    setActiveLine(null)
    setDlgWordSync(null)
    setRpIdx(null)
    if (!wasStopped) setRpFinished(true)
    else setRolePlay(null)
  }

  function stopRolePlay() {
    rpStopRef.current = true
    stopWordPacer()
    stopSpeaking()
    if (rpRecorderRef.current) {
      rpRecorderRef.current.cancel()
      rpRecorderRef.current = null
    }
    rpResolveRef.current?.('')
    rpResolveRef.current = null
    setRpRecording(false)
    setRpTranscribing(false)
    setRolePlay(null)
    setRpFinished(false)
    setRpIdx(null)
    setActiveLine(null)
    setDlgWordSync(null)
  }

  function closeRolePlayResult() {
    setRolePlay(null)
    setRpFinished(false)
    setRpEvaluation(null)
    setRpTranscripts({})
    setActiveLine(null)
  }

  async function gradeRolePlay() {
    if (rpEvaluating || !rolePlay) return
    const usage = getUsage(userId)
    const planForLimit = effectivePlan(plan)
    if (planForLimit !== 'free' && usage.speakingCount >= getLimits()[planForLimit].speaking) {
      setRpError(
        isA
          ? 'Bạn đã dùng hết lượt chấm điểm hôm nay. Thử lại vào ngày mai nhé.'
          : "You've used all your grading turns today. Try again tomorrow.",
      )
      return
    }
    if (rpThrottled) return
    setRpEvaluating(true)
    setRpError('')
    const role = rolePlay.role
    const sys = speakingFullEvaluationPrompt(isA ? 'A' : 'B')
    const history = dialogue.lines.map((ln, i) => ({
      role: ln.who === role ? ('user' as const) : ('assistant' as const),
      content: ln.who === role ? (rpTranscripts[i] ?? '') : isA ? ln.en : ln.vi,
    }))
    try {
      const raw = await callClaude(history, sys, 2048, 'speaking')
      const data = parseJson<EvaluationResult>(raw)
      if (!data) {
        throw new Error(
          isA
            ? 'AI trả về định dạng không đúng. Thử lại.'
            : 'AI returned invalid format. Please try again.',
        )
      }
      setRpEvaluation(data)
      incrementUsage(userId, 'speakingCount')
      rpThrottle()
    } catch (e) {
      setRpError(
        thongDiepLoiThanThien(e, isA ? 'Lỗi không xác định' : 'Unknown error', isA ? 'vi' : 'en'),
      )
    }
    setRpEvaluating(false)
  }

  // Dừng đóng vai khi rời màn hình
  useEffect(
    () => () => {
      rpStopRef.current = true
      stopWordPacer()
      if (rpRecorderRef.current) rpRecorderRef.current.cancel()
    },
    [],
  )

  const isIdle = !playing && !paused && !rolePlay

  const SPEEDS: DlgSpeed[] = [0.75, 1, 1.25]
  const MODES: { key: DlgMode; label: string }[] = [
    { key: 'en', label: 'EN' },
    { key: 'both', label: isA ? 'EN+VI' : 'VI+EN' },
    { key: 'vi', label: 'VI' },
  ]

  // Đang xem kết quả chấm điểm đóng vai → thay toàn bộ nội dung màn hội thoại.
  if (rpEvaluation) {
    return (
      <EvaluationResultView
        evaluation={rpEvaluation}
        onClose={closeRolePlayResult}
        dir={isA ? 'A' : 'B'}
      />
    )
  }

  const speakerName = (who: 'A' | 'B') =>
    who === 'A'
      ? isA
        ? (dialogue.speakerA?.vi ?? 'A')
        : (dialogue.speakerA?.en ?? 'A')
      : isA
        ? (dialogue.speakerB?.vi ?? 'B')
        : (dialogue.speakerB?.en ?? 'B')

  return (
    <div className="animate-fade-in">
      {/* Thanh điều khiển audio */}
      <div className="bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800/40 px-4 py-2.5 -mx-4 mb-3">
        <div className="glass rounded-xl px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          {/* Nút back */}
          <button
            onClick={onBack}
            className="shrink-0 text-xs text-zinc-400 hover:text-white transition flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> {isA ? 'Quay lại' : 'Back'}
          </button>

          <div className="h-3.5 w-px bg-zinc-700" />

          {/* Play / Pause / Resume / Stop */}
          <div className="flex items-center gap-1.5">
            {isIdle && (
              <button
                onClick={() => void startPlayAll()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 theme-light:text-accent-800 text-xs font-medium transition"
              >
                <Play className="w-3 h-3 fill-current" />
                {isA ? 'Phát tất cả' : 'Play all'}
              </button>
            )}
            {playing && !paused && (
              <button
                onClick={handlePause}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 theme-light:text-amber-800 text-xs font-medium transition"
              >
                <Pause className="w-3 h-3 fill-current" />
                {isA ? 'Dừng' : 'Pause'}
              </button>
            )}
            {paused && (
              <button
                onClick={handleResume}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent-500/20 hover:bg-accent-500/30 text-accent-300 theme-light:text-accent-800 text-xs font-medium transition"
              >
                <Play className="w-3 h-3 fill-current" />
                {isA ? 'Tiếp' : 'Resume'}
              </button>
            )}
            {!isIdle && (
              <button
                onClick={handleStop}
                className="w-6 h-6 flex items-center justify-center rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}
          </div>

          <div className="h-3.5 w-px bg-zinc-700" />

          {/* Tốc độ đọc */}
          <div className="flex items-center gap-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-xs font-medium transition ${
                  speed === s
                    ? 'bg-sky-500/20 text-sky-300 theme-light:text-sky-800 border border-sky-500/40'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="h-3.5 w-px bg-zinc-700" />

          {/* Chế độ nghe: EN / EN+VI / VI */}
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-zinc-400 shrink-0" />
            {MODES.map((m) => (
              <button
                key={m.key}
                onClick={() => changeMode(m.key)}
                className={`px-1.5 py-0.5 rounded text-xs font-medium transition ${
                  mode === m.key
                    ? 'bg-violet-500/20 text-violet-300 theme-light:text-violet-800 border border-violet-500/40'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="h-3.5 w-px bg-zinc-700" />

          {/* Đóng vai — chỉ VIP. Free thấy nút khoá + link nâng cấp. */}
          {!rolePlay && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  // Gói Free cũng mở panel — để hiện thông báo nâng cấp.
                  setRpAlignRight(shouldAlignPopoverRightFor(e.currentTarget))
                  setRolePicker((o) => !o)
                }}
                aria-expanded={rolePicker}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  rolePicker
                    ? 'bg-violet-500/20 text-violet-300 theme-light:text-violet-800'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                {isPro ? <Drama className="w-3 h-3" /> : <Lock className="w-3 h-3 text-zinc-500" />}
                {isA ? 'Đóng vai' : 'Role-play'}
              </button>
              {rolePicker && (
                <div
                  className={`absolute ${rpAlignRight ? 'right-0' : 'left-0'} z-20 mt-1.5 w-64 glass rounded-xl p-3 animate-fade-in shadow-xl`}
                >
                  {isPro ? (
                    <>
                      <p className="text-xs text-zinc-400 mb-2">
                        {isA
                          ? 'Chọn vai bạn muốn đọc — AI sẽ đọc vai còn lại, bạn nói vai của mình.'
                          : 'Pick the role you want to read — AI reads the other role, you speak yours.'}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => void startRolePlay('A')}
                          className="text-left px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-accent-500/50 text-sm text-zinc-100 transition"
                        >
                          {speakerName('A')}
                        </button>
                        <button
                          onClick={() => void startRolePlay('B')}
                          className="text-left px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-accent-500/50 text-sm text-zinc-100 transition"
                        >
                          {speakerName('B')}
                        </button>
                      </div>
                      {!canRecord && (
                        <p className="text-[11px] text-amber-400 theme-light:text-amber-900 mt-2">
                          {isA
                            ? 'Trình duyệt này không hỗ trợ ghi âm.'
                            : 'This browser does not support recording.'}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-zinc-300 mb-2">
                        {isA
                          ? 'Đóng vai đọc hội thoại + AI chấm điểm là tính năng dành cho gói VIP.'
                          : 'Dialogue role-play + AI grading is a VIP feature.'}
                      </p>
                      <Link
                        to="/cai-dat"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-accent-400 theme-light:text-accent-700 hover:underline"
                      >
                        {isA ? 'Nâng cấp VIP →' : 'Upgrade to VIP →'}
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {rolePlay && (
            <button
              onClick={stopRolePlay}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 theme-light:text-red-700 text-xs font-medium transition"
            >
              <Square className="w-3 h-3 fill-current" />
              {isA ? 'Dừng đóng vai' : 'Stop role-play'}
            </button>
          )}

          {/* Nút mở/ẩn panel giọng — nằm ở phần còn dư của thanh control */}
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {(playing || rolePlay) && activeLine !== null && (
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-pulse" />
                <span className="text-[11px] text-zinc-400">
                  {activeLine + 1}/{dialogue.lines.length}
                </span>
              </div>
            )}
            {!rolePlay && (
              <button
                type="button"
                onClick={() => setVoiceSettingsOpen((o) => !o)}
                aria-expanded={voiceSettingsOpen}
                className={`px-1.5 py-0.5 rounded text-xs font-medium transition ${
                  voiceSettingsOpen
                    ? 'bg-zinc-800 text-zinc-200'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {isA ? 'Cài đặt giọng' : 'Voice settings'}
              </button>
            )}
          </div>
        </div>

        {/* Thanh tiến độ hội thoại — thêm 2026-09-02.
            Trước đây phần "Đóng vai" chỉ có con số 11px ở góc phải ("3/12"), trong khi mọi
            dạng bài khác của app (quiz, flashcard, luyện nghe) đều có thanh tiến độ. Với một
            hội thoại dài, con số nhỏ đó không cho cảm giác "còn bao xa" — mà chính cảm giác đó
            giữ người học đi hết bài. Dùng đúng chiều cao/bo góc của các thanh khác để nhất
            quán, và `aria-hidden` vì con số bên trên đã nói đủ cho trình đọc màn hình. */}
        {(playing || rolePlay) && activeLine !== null && dialogue.lines.length > 0 && (
          <div aria-hidden="true" className="h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-300"
              style={{ width: `${((activeLine + 1) / dialogue.lines.length) * 100}%` }}
            />
          </div>
        )}

        {/* Giọng đang phát cho từng nhân vật (random mỗi lần mở) + nút đặt làm mặc định — chỉ
            hiện khi bấm "Cài đặt giọng", tự ẩn 3s sau khi đặt mặc định */}
        {voiceSettingsOpen && !rolePlay && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 px-1 animate-fade-in">
            <VoiceRoleBadge
              voice={voiceA}
              gender={genderA}
              label="A"
              isA={isA}
              plan={plan}
              onChange={changeVoiceA}
              onSet={handleVoiceSet}
            />
            <VoiceRoleBadge
              voice={voiceB}
              gender={genderB}
              label="B"
              isA={isA}
              plan={plan}
              onChange={changeVoiceB}
              onSet={handleVoiceSet}
            />
          </div>
        )}

        {rpError && (
          <p className="text-[11px] text-red-400 theme-light:text-red-700 mt-1.5 px-1">{rpError}</p>
        )}

        {/* Kết thúc đóng vai xong (chưa chấm) → mời chấm điểm hoặc nói lại */}
        {rolePlay && rpFinished && (
          <div className="flex items-center gap-2 mt-2 px-1 animate-fade-in">
            <button
              onClick={() => void gradeRolePlay()}
              disabled={rpEvaluating || rpThrottled}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-500/20 hover:bg-accent-500/30 disabled:opacity-50 text-accent-300 theme-light:text-accent-800 text-xs font-semibold transition"
            >
              {rpEvaluating ? (
                isA ? (
                  'Đang chấm điểm...'
                ) : (
                  'Grading...'
                )
              ) : (
                <>
                  <Award className="w-3.5 h-3.5" />
                  {isA ? 'Kết thúc & chấm điểm' : 'Finish & grade'}
                </>
              )}
            </button>
            <button
              onClick={() => void startRolePlay(rolePlay.role)}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              {isA ? 'Đọc lại' : 'Read again'}
            </button>
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className={`w-5 h-5 shrink-0 ${accent.text}`} />
          <h3 className="font-bold text-white">{isA ? dialogue.titleVi : dialogue.titleEn}</h3>
        </div>

        <div className="space-y-2.5">
          {dialogue.lines.map((ln, i) => {
            const isB = ln.who === 'B'
            const isActive = activeLine === i
            const isMyTurn = rolePlay !== null && rpIdx === i
            return (
              <div key={i} className={`flex ${isB ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 border transition-all ${
                    isActive
                      ? isMyTurn
                        ? 'ring-2 ring-offset-1 ring-offset-zinc-950 ring-accent-500/60 animate-pulse'
                        : 'ring-2 ring-offset-1 ring-offset-zinc-950 ring-accent-500/60'
                      : ''
                  } ${isB ? `${accent.soft} ${accent.ring}` : 'bg-zinc-900/80 border-zinc-800/80'}`}
                >
                  {/* Hàng đầu: tên người nói (trái) + nút micro chấm phát âm (phải) —
                      thống nhất vị trí với hội thoại ở trang Lessons; khi mở bảng
                      chấm điểm thì flex-wrap đẩy bảng xuống dòng riêng. */}
                  <div className="flex flex-wrap items-center justify-between gap-x-2">
                    <span
                      className={`text-[11px] font-semibold tracking-wide ${
                        isB ? accent.text : 'text-zinc-400'
                      }`}
                    >
                      {ln.who === 'A'
                        ? isA
                          ? (dialogue.speakerA?.vi ?? 'A')
                          : (dialogue.speakerA?.en ?? 'A')
                        : isA
                          ? (dialogue.speakerB?.vi ?? 'B')
                          : (dialogue.speakerB?.en ?? 'B')}
                      {isMyTurn && (
                        <span className="ml-1.5 text-violet-400 theme-light:text-violet-800">
                          {isA ? '· đến lượt bạn' : '· your turn'}
                        </span>
                      )}
                    </span>
                    {!rolePlay && (
                      <InlinePronounce
                        text={isA ? ln.en : ln.vi}
                        lang={isA ? 'en-US' : 'vi-VN'}
                        isA={isA}
                      />
                    )}
                  </div>
                  <KaraokeText
                    text={isA ? ln.en : ln.vi}
                    lang={isA ? 'en-US' : 'vi-VN'}
                    textClass={`font-medium text-[15px] leading-snug ${isB ? accent.text : 'text-zinc-100'}`}
                    buttonClass="w-full"
                    voice={ln.who === 'A' ? voiceA : voiceB}
                    externalState={
                      (playing || rolePlay) && dlgWordSync?.lineIdx === i
                        ? { playing: true, wordIdx: dlgWordSync.wordIdx }
                        : undefined
                    }
                  />
                  <p className={`text-sm text-zinc-400 mt-1 ${KARAOKE_INDENT}`}>
                    {isA ? ln.vi : ln.en}
                  </p>

                  {/* Đến lượt người dùng trong chế độ đóng vai → nút ghi âm thay vì phát TTS */}
                  {isMyTurn && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/60">
                      {rpTranscribing ? (
                        <span className="text-xs text-zinc-400">
                          {isA ? 'Đang nhận diện...' : 'Transcribing...'}
                        </span>
                      ) : rpRecording ? (
                        <button
                          onClick={() => void finishRolePlayRecording()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 theme-light:text-red-700 text-xs font-semibold animate-pulse transition"
                        >
                          <Square className="w-3 h-3 fill-current" />
                          {isA ? 'Dừng ghi âm' : 'Stop recording'}
                        </button>
                      ) : (
                        <button
                          onClick={() => void beginRolePlayRecording()}
                          disabled={!canRecord}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 disabled:opacity-50 text-violet-300 theme-light:text-violet-800 text-xs font-semibold transition"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          {isA ? 'Bấm để nói câu này' : 'Tap to say this line'}
                        </button>
                      )}
                      {!rpRecording && !rpTranscribing && (
                        <button
                          onClick={skipRolePlayLine}
                          className="text-xs text-zinc-500 hover:text-zinc-300 transition"
                        >
                          {isA ? 'Bỏ qua' : 'Skip'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
