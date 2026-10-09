// DialogueComprehensionCheck — màn KIỂM TRA HIỂU sau khi xem một hội thoại CEFR.
//
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md
//
// Đề sinh TẤT ĐỊNH từ chính dữ liệu hội thoại (lib/dialogueComprehension.ts), không gọi AI nên
// không tốn lượt. Màn này CHE bản hội thoại (kèm bản dịch) trong lúc làm — nếu không, câu hỏi
// nghĩa chỉ còn là việc dò dòng dịch ngay phía trên.
//
// A11y: mỗi câu là một `fieldset role="radiogroup"` + `legend`, radio THẬT (phím mũi tên chạy sẵn);
// phản hồi đúng/sai bằng CHỮ + biểu tượng, không chỉ bằng màu; sau khi nộp, focus chuyển tới khối
// kết quả (`role="status"`) để trình đọc màn hình đọc điểm ngay.

import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronLeft, ClipboardCheck, RotateCcw, XCircle } from 'lucide-react'
import type { Dialogue } from '../data/dialogues'
import type { AccentClasses } from '../lib/cefrAccent'
import {
  buildComprehensionQuiz,
  comprehensionSeed,
  gradeComprehension,
  requiredCorrect,
  type ComprehensionDirection,
  type ComprehensionResult,
} from '../lib/dialogueComprehension'
import { buttonClass } from '@core/buttonStyles'

export interface DialogueComprehensionCheckProps {
  dialogue: Dialogue
  /** Id unit/vòng sở hữu hội thoại — cùng khoá với "đã xem" (`dialogueKey`). */
  ownerId: string
  isA: boolean
  accent: AccentClasses
  /** Có lưu được tiến độ không (đã đăng nhập). Không thì nói thật là chưa lưu. */
  canSave: boolean
  /** Gọi ĐÚNG MỘT LẦN mỗi lượt đạt — nơi gọi ghi `markDialogueLearned`. */
  onPassed: () => void
  /** Quay lại bản hội thoại. */
  onBack: () => void
}

export default function DialogueComprehensionCheck({
  dialogue,
  ownerId,
  isA,
  accent,
  canSave,
  onPassed,
  onBack,
}: DialogueComprehensionCheckProps) {
  const dir: ComprehensionDirection = isA ? 'A' : 'B'
  // Số lần làm — đổi seed để "Làm lại" ra đề khác (khác câu làm đề + thứ tự phương án).
  const [attempt, setAttempt] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ComprehensionResult | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const questions = useMemo(
    () =>
      buildComprehensionQuiz(
        dialogue,
        dir,
        comprehensionSeed(ownerId, dialogue.titleEn, dir, attempt),
      ),
    [dialogue, dir, ownerId, attempt],
  )
  const answeredAll = questions.every((q) => answers[q.id] !== undefined)

  // Sau khi nộp → đưa focus tới khối kết quả; sau "Làm lại" → về tiêu đề màn.
  useEffect(() => {
    if (result) resultRef.current?.focus()
  }, [result])
  // Mở màn (và mỗi lần "Làm lại") → focus tiêu đề: trình đọc màn hình biết nội dung đã đổi, và
  // trang cuộn về đầu đề thay vì đứng ở vị trí nút vừa bấm phía dưới bản hội thoại.
  useEffect(() => {
    headingRef.current?.focus()
  }, [attempt])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (result || !answeredAll) return
    const graded = gradeComprehension(questions, answers)
    setResult(graded)
    if (graded.passed) onPassed()
  }

  function retry() {
    setAnswers({})
    setResult(null)
    setAttempt((n) => n + 1)
  }

  const backButton = (
    <button
      type="button"
      onClick={onBack}
      className="tap-44-touch-y shrink-0 text-xs text-zinc-400 hover:text-white transition flex items-center gap-1"
    >
      <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
      {isA ? 'Xem lại hội thoại' : 'Back to the dialogue'}
    </button>
  )

  const title = isA ? dialogue.titleVi : dialogue.titleEn

  // Hội thoại quá ngắn → nói thật, KHÔNG tự chế câu hỏi.
  if (questions.length === 0) {
    return (
      <div className="animate-fade-in space-y-3">
        {backButton}
        <div className="glass rounded-2xl p-4 sm:p-5">
          <h3 className="font-bold text-white">
            {isA ? 'Chưa kiểm tra được hội thoại này' : 'This dialogue cannot be checked yet'}
          </h3>
          <p className="mt-2 text-sm text-zinc-300">
            {isA
              ? 'Hội thoại quá ngắn để đặt câu hỏi hiểu bài, nên chưa ghi được là “đã học”.'
              : 'The dialogue is too short for comprehension questions, so it cannot be marked as learned yet.'}
          </p>
        </div>
      </div>
    )
  }

  const total = questions.length
  const need = requiredCorrect(total)

  return (
    <div className="animate-fade-in space-y-3">
      {backButton}
      <form onSubmit={submit} className="glass rounded-2xl p-4 sm:p-5" noValidate>
        <div className="flex items-start gap-2">
          <ClipboardCheck className={`w-5 h-5 mt-0.5 shrink-0 ${accent.text}`} aria-hidden="true" />
          <div className="min-w-0">
            <h3 ref={headingRef} tabIndex={-1} className="font-bold text-white outline-none">
              {isA ? 'Kiểm tra hiểu hội thoại' : 'Comprehension check'}
            </h3>
            <p className="text-sm text-zinc-300 break-words">{title}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-zinc-300">
          {isA
            ? `${total} câu, đạt khi đúng ít nhất ${need}. Câu hỏi lấy từ chính hội thoại vừa xem, không tốn lượt AI.`
            : `${total} questions — pass with at least ${need} correct. Questions come from the dialogue you just read and use no AI credits.`}
        </p>

        <ol className="mt-4 space-y-4">
          {questions.map((q, qi) => {
            const legendId = `cq-${q.id}-legend`
            const item = result?.items[qi]
            return (
              <li key={q.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                {/* Viền nằm ở <li>, fieldset để trần: legend mặc định "ngồi" trên viền fieldset,
                    trông như câu hỏi nằm ngoài khung. `float` + `clear` đưa legend vào luồng. */}
                <fieldset
                  role="radiogroup"
                  aria-labelledby={legendId}
                  disabled={result !== null}
                  className="m-0 min-w-0 border-0 p-0"
                >
                  <legend id={legendId} className="float-left w-full p-0">
                    <span className="block text-xs font-semibold text-zinc-400">
                      {isA ? `Câu ${qi + 1}/${total}` : `Question ${qi + 1} of ${total}`}
                    </span>
                    <span className="mt-1 block text-sm font-medium text-zinc-100">{q.prompt}</span>
                    <span
                      className={`mt-2 block rounded-lg px-3 py-2 text-[0.9375rem] font-medium ${accent.soft} ${accent.text}`}
                    >
                      {q.stemSpeaker && (
                        <span className="mr-1.5 text-xs font-semibold text-zinc-400">
                          {q.stemSpeaker}:
                        </span>
                      )}
                      <span lang={q.stemLang}>{q.stem}</span>
                    </span>
                  </legend>

                  <div className="clear-both space-y-2 pt-3">
                    {q.options.map((o) => {
                      const chosen = answers[q.id] === o.id
                      const isCorrect = o.id === q.correctId
                      const showMark = result !== null && (chosen || isCorrect)
                      const border = !result
                        ? chosen
                          ? accent.ring
                          : 'border-zinc-800'
                        : isCorrect
                          ? 'border-emerald-500/60'
                          : chosen
                            ? 'border-red-500/60'
                            : 'border-zinc-800'
                      return (
                        <label
                          key={o.id}
                          className={`tap-44 flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition ${border} ${
                            result ? 'cursor-default' : 'hover:border-zinc-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`cq-${q.id}`}
                            value={o.id}
                            checked={chosen}
                            onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                            className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--focus-ring))]"
                          />
                          <span className="min-w-0 flex-1 text-sm text-zinc-100 break-words">
                            <span lang={o.lang}>{o.text}</span>
                            {showMark && (
                              <span
                                className={`mt-1 flex items-center gap-1 text-xs font-semibold ${
                                  isCorrect
                                    ? 'text-emerald-400 theme-light:text-emerald-800'
                                    : 'text-red-300 theme-light:text-red-700'
                                }`}
                              >
                                {isCorrect ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                )}
                                {isCorrect
                                  ? chosen
                                    ? isA
                                      ? 'Bạn chọn — đúng'
                                      : 'Your answer — correct'
                                    : isA
                                      ? 'Đáp án đúng'
                                      : 'Correct answer'
                                  : isA
                                    ? 'Bạn chọn — chưa đúng'
                                    : 'Your answer — not correct'}
                              </span>
                            )}
                          </span>
                        </label>
                      )
                    })}
                  </div>

                  {item && (
                    <p className="mt-3 flex items-start gap-1.5 text-sm text-zinc-300">
                      {item.correct ? (
                        <CheckCircle2
                          className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400 theme-light:text-emerald-800"
                          aria-hidden="true"
                        />
                      ) : (
                        <XCircle
                          className="w-4 h-4 mt-0.5 shrink-0 text-red-300 theme-light:text-red-700"
                          aria-hidden="true"
                        />
                      )}
                      <span className="min-w-0 break-words">
                        <strong className="font-semibold text-zinc-100">
                          {item.correct
                            ? isA
                              ? 'Đúng.'
                              : 'Correct.'
                            : isA
                              ? 'Chưa đúng.'
                              : 'Not correct.'}
                        </strong>{' '}
                        {q.explanation.lead}
                        {q.explanation.quote && (
                          <>
                            {' '}
                            <q lang={q.explanation.quoteLang}>{q.explanation.quote}</q>
                          </>
                        )}
                      </span>
                    </p>
                  )}
                </fieldset>
              </li>
            )
          })}
        </ol>

        {!result && (
          <div className="mt-4">
            <button
              type="submit"
              disabled={!answeredAll}
              aria-describedby="cq-submit-hint"
              className={buttonClass({ variant: 'primary', fullWidth: true })}
            >
              {isA ? 'Nộp bài' : 'Submit'}
            </button>
            <p id="cq-submit-hint" className="mt-2 text-xs text-zinc-400 text-center">
              {answeredAll
                ? isA
                  ? 'Đã trả lời đủ — bấm Nộp bài để xem kết quả.'
                  : 'All answered — submit to see your result.'
                : isA
                  ? `Trả lời đủ ${total} câu để nộp bài.`
                  : `Answer all ${total} questions to submit.`}
            </p>
          </div>
        )}

        {result && (
          <div
            ref={resultRef}
            tabIndex={-1}
            role="status"
            className={`mt-4 rounded-xl border p-3 outline-none ${
              result.passed ? 'border-emerald-500/60' : 'border-amber-500/60'
            }`}
          >
            <p className="flex items-center gap-1.5 font-semibold text-zinc-100">
              {result.passed ? (
                <CheckCircle2
                  className="w-4 h-4 shrink-0 text-emerald-400 theme-light:text-emerald-800"
                  aria-hidden="true"
                />
              ) : (
                <XCircle
                  className="w-4 h-4 shrink-0 text-amber-300 theme-light:text-amber-800"
                  aria-hidden="true"
                />
              )}
              {isA
                ? `Đúng ${result.correct}/${result.total} — ${result.passed ? 'đạt' : `chưa đạt (cần ${result.required})`}`
                : `${result.correct}/${result.total} correct — ${result.passed ? 'passed' : `not yet (need ${result.required})`}`}
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {result.passed
                ? canSave
                  ? isA
                    ? 'Hội thoại này đã được ghi là ĐÃ HỌC.'
                    : 'This dialogue is now marked as LEARNED.'
                  : isA
                    ? 'Bạn đã đạt, nhưng cần đăng nhập để lưu tiến độ.'
                    : 'You passed, but you need to sign in to save progress.'
                : isA
                  ? 'Xem lại hội thoại rồi làm lại — lượt sau câu hỏi sẽ khác.'
                  : 'Read the dialogue again, then retry — the questions will change.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={retry}
                className={buttonClass({ variant: result.passed ? 'outline' : 'primary' })}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                {isA ? 'Làm lại (câu hỏi mới)' : 'Retry (new questions)'}
              </button>
              <button
                type="button"
                onClick={onBack}
                className={buttonClass({ variant: result.passed ? 'primary' : 'outline' })}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                {isA ? 'Xem lại hội thoại' : 'Back to the dialogue'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
