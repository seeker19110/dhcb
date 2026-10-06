// Khối "1 câu hỏi trắc nghiệm" dùng CHUNG cho bài thi cuối cấp (CefrExam.tsx) và
// bài test xếp lớp (pages/Placement.tsx) — cùng kiểu dữ liệu ExamQuestion
// (lib/cefrExam.ts) nên tách ra đây để không copy UI 2 lần (CLAUDE.md §4.4 DRY).
// Header riêng của từng màn (nút Thoát, tiêu đề, thanh tiến trình) do trang cha
// tự vẽ vì nội dung khác nhau — component này chỉ lo phần "thân câu hỏi".

import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Volume2, ChevronRight } from 'lucide-react'
import { useQuizKeyboard } from '@dhcb/core-ui/useQuizKeyboard'
import QuizOptionKey from './QuizOptionKey'
import type { ExamQuestion } from '../lib/cefrExam'
import type { AccentClasses } from '../lib/cefrAccent'
import { speak } from '../lib/tts'
import { PART_META } from '../lib/examParts'

export default function ExamQuestionCard({
  q,
  isA,
  accent,
  current,
  total,
  selected,
  onPick,
  onNext,
  nextLabel,
  rate,
}: {
  q: Omit<ExamQuestion, 'correct'> & { correct?: string }
  isA: boolean
  accent: AccentClasses
  current: number
  total: number
  selected: string | null
  onPick: (opt: string) => void
  onNext: () => void
  // Nhãn nút cuối cùng (mặc định "Nộp bài/Submit") — khác nhau giữa 2 nơi dùng.
  nextLabel?: { last: string; more: string }
  // Tốc độ phát nút "Nghe lại" — mặc định undefined = dùng getRatePref() (lựa
  // chọn toàn cục) như cũ. Bài luyện nghe theo cấp (③ N3) truyền tốc độ gợi ý
  // riêng theo cấp (lib/listening.ts) — không ảnh hưởng đề thi/placement.
  rate?: number
}) {
  const headingId = useId()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const step = `${current}:${q.key}`
  const previousStep = useRef(step)
  const picked = useRef(false)
  const advanced = useRef(false)
  const [status, setStatus] = useState('')

  // Chỉ Next hợp lệ mới yêu cầu focus; mount/restore không cướp focus điều hướng.
  useLayoutEffect(() => {
    if (previousStep.current === step) return
    previousStep.current = step
    if (advanced.current) headingRef.current?.focus()
    picked.current = false
    advanced.current = false
  }, [step])

  function feedback(opt: string) {
    if (q.correct === undefined) return isA ? `Đã chọn: ${opt}.` : `Selected: ${opt}.`
    const correct = opt === q.correct
    return isA
      ? `${correct ? 'Đúng.' : 'Chưa đúng.'} Bạn đã chọn: ${opt}.${correct ? '' : ` Đáp án đúng: ${q.correct}.`}`
      : `${correct ? 'Correct.' : 'Not correct.'} You selected: ${opt}.${correct ? '' : ` Correct answer: ${q.correct}.`}`
  }

  function pick(opt: string) {
    if (selected !== null || picked.current || advanced.current || !q.options.includes(opt)) return
    picked.current = true
    optionRefs.current[q.options.indexOf(opt)]?.focus()
    setStatus(feedback(opt))
    onPick(opt)
  }

  function next() {
    if (selected === null || advanced.current) return
    advanced.current = true
    setStatus('')
    onNext()
  }

  // Phím tắt đặt Ở ĐÂY chứ không ở từng trang cha: component này sở hữu cả danh sách đáp án,
  // `onPick` lẫn `onNext`, nên mọi nơi dùng nó (thi cuối cấp, test xếp lớp, luyện nghe) có
  // phím tắt cùng lúc. Nếu để mỗi trang tự lắp thì ô số 1·2·3·4 vẫn hiện ở trang quên lắp —
  // tức giao diện hứa một thao tác không tồn tại.
  useQuizKeyboard({
    optionCount: q.options.length,
    onPick: (i) => {
      const opt = q.options[i]
      if (opt !== undefined) pick(opt)
    },
    onNext: next,
    answered: selected !== null,
  })

  const meta = PART_META[q.part]
  const MetaIcon = meta.icon
  const isLast = current + 1 >= total
  const label = nextLabel ?? {
    last: isA ? 'Nộp bài' : 'Submit',
    more: isA ? 'Câu tiếp theo' : 'Next',
  }

  return (
    <>
      {/* Nhãn phần */}
      <div className="flex items-center gap-1.5 text-[0.6875rem] font-semibold text-zinc-400">
        <MetaIcon aria-hidden="true" className={`w-3.5 h-3.5 ${accent.text}`} />
        {isA ? meta.vi : meta.en}
      </div>

      {/* Phần ĐỌC: hiện hội thoại (ngôn ngữ đích) */}
      {q.promptKind !== 'audio' && q.part === 'reading' && q.passage && (
        <div className="glass rounded-xl p-3 max-h-56 overflow-y-auto space-y-1.5">
          <p className="text-xs text-zinc-400 mb-1">
            {isA ? q.passage.titleVi : q.passage.titleEn}
          </p>
          {q.passage.lines.map((ln, i) => (
            <p
              key={i}
              className={`text-sm leading-snug ${ln.text === q.prompt ? `font-semibold ${accent.text}` : 'text-zinc-300'}`}
            >
              <span className="text-zinc-500">{ln.who}: </span>
              {ln.text}
            </p>
          ))}
        </div>
      )}

      {/* Câu hỏi */}
      <div className="text-center py-2">
        <h2
          id={headingId}
          ref={headingRef}
          tabIndex={-1}
          className={`text-white leading-snug px-2 ${q.promptKind === 'audio' ? 'text-base font-semibold mb-3' : q.part === 'grammar' || q.part === 'reading' ? 'text-xl font-semibold' : 'text-4xl font-bold'}`}
        >
          <span className="sr-only">
            {isA ? 'Câu' : 'Question'} {current + 1}.{' '}
          </span>
          {q.promptKind === 'audio'
            ? isA
              ? 'Nghe rồi chọn đáp án đúng'
              : 'Listen, then choose the answer'
            : q.prompt}
        </h2>
        {q.promptKind === 'audio' ? (
          <button
            type="button"
            onClick={() =>
              q.audioText && q.audioLang && void speak(q.audioText, q.audioLang, q.audioVoice, rate)
            }
            className={`inline-flex items-center gap-2 px-5 py-4 rounded-2xl ${accent.soft} border ${accent.ring} ${accent.text} font-semibold transition-colors motion-reduce:transition-none hover:opacity-90`}
          >
            <Volume2 aria-hidden="true" className="w-6 h-6" />
            {isA ? 'Nghe lại' : 'Play again'}
          </button>
        ) : null}
        {q.part === 'reading' && (
          <p className="text-xs text-zinc-400 mt-2">
            {isA ? 'Câu trên có nghĩa là gì?' : 'What does the line above mean?'}
          </p>
        )}
      </div>

      {/* Đáp án */}
      <div role="group" aria-labelledby={headingId} className="space-y-2.5">
        {q.options.map((opt, optIdx) => {
          let cls = 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-600'
          if (selected !== null) {
            // Đúng → phồng nhẹ; đáp án sai đã chọn → lắc ngang. Giống hệt mini-quiz và tab
            // Kiểm tra: phản hồi phải là quy ước của cả app, không phải đặc sản của vài màn —
            // trước đây bài nghe là loại bài DUY NHẤT trả lời xong mà màn hình đứng im.
            if (q.correct === undefined)
              cls =
                opt === selected
                  ? 'bg-accent-500/20 border-accent-500/60 text-accent-300'
                  : 'bg-zinc-900/40 border-zinc-800/40 text-zinc-400'
            else if (opt === q.correct)
              cls = 'bg-accent-500/20 border-accent-500/60 text-accent-300 animate-pop-correct'
            else if (opt === selected)
              cls =
                'bg-rose-500/20 border-rose-500/60 text-rose-300 theme-light:text-rose-900 animate-shake'
            else cls = 'bg-zinc-900/40 border-zinc-800/40 text-zinc-400'
          }
          return (
            <button
              key={opt}
              data-quiz-option
              type="button"
              ref={(node) => {
                optionRefs.current[optIdx] = node
              }}
              aria-label={opt}
              aria-pressed={selected === opt}
              aria-disabled={selected !== null}
              onClick={() => pick(opt)}
              className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl border font-medium text-[0.9375rem] transition-colors motion-reduce:animate-none motion-reduce:transition-none ${cls}`}
            >
              <QuizOptionKey index={optIdx} />
              <span className="min-w-0 flex-1">{opt}</span>
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <p className="text-white text-sm leading-relaxed break-words">{feedback(selected)}</p>
      )}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {status}
      </div>

      {selected !== null && (
        <button
          type="button"
          onClick={next}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-violet-500 hover:bg-violet-400 text-white font-semibold transition-colors animate-fade-in motion-reduce:animate-none motion-reduce:transition-none"
        >
          {isLast ? label.last : label.more}
          <ChevronRight aria-hidden="true" className="w-4 h-4" />
        </button>
      )}
    </>
  )
}
