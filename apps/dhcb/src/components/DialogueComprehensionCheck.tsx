// DialogueComprehensionCheck — màn KIỂM TRA HIỂU sau khi xem một hội thoại CEFR.
//
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md
//
// Đề sinh TẤT ĐỊNH từ chính dữ liệu hội thoại (lib/dialogueComprehension.ts), không gọi AI nên
// không tốn lượt. Màn này CHE bản hội thoại (kèm bản dịch) trong lúc làm — nếu không, câu hỏi
// nghĩa chỉ còn là việc dò dòng dịch ngay phía trên.
//
// SERVER CHẤM (đợt 0555 — docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md): đã đăng nhập
// thì lượt nộp được gửi lên `/api/learning/evidence?action=cefr-dialogue`; server dựng lại đúng đề
// từ seed, chấm, và CHỈ server ghi "đã học". Màn hiện kết quả theo phản hồi server; không tới được
// server (mất mạng, hết phiên, lỗi…) thì vẫn cho xem kết quả chấm tại máy nhưng NÓI THẬT là chưa lưu.
// Chưa đăng nhập: chấm tại máy, nói thật là cần đăng nhập để lưu.
//
// A11y: mỗi câu là một `fieldset role="radiogroup"` + `legend`, radio THẬT (phím mũi tên chạy sẵn);
// phản hồi đúng/sai bằng CHỮ + biểu tượng, không chỉ bằng màu; sau khi nộp, focus chuyển tới khối
// kết quả (`role="status"`) để trình đọc màn hình đọc điểm ngay.

import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, ChevronLeft, ClipboardCheck, RotateCcw, Send, XCircle } from 'lucide-react'
import type { Dialogue } from '../data/dialogues'
import type { AccentClasses } from '../lib/cefrAccent'
import {
  buildComprehensionQuiz,
  comprehensionSeed,
  gradeComprehension,
  requiredCorrect,
  type ComprehensionDirection,
} from '../lib/dialogueComprehension'
import { submitDialogueCheck, type DialogueCheckOutcome } from '../lib/dialogueCheckClient'
import { MAX_DIALOGUE_ATTEMPT } from '@dhcb/core-contracts/cefrDialogueCheck'
import { buttonClass } from '@core/buttonStyles'

export interface DialogueComprehensionCheckProps {
  dialogue: Dialogue
  /** Id unit/vòng sở hữu hội thoại — cùng khoá với "đã xem" (`dialogueKey`). */
  ownerId: string
  isA: boolean
  accent: AccentClasses
  /** Đã đăng nhập (server ghi được tiến độ). Không thì chấm tại máy và nói thật là chưa lưu. */
  canSave: boolean
  /**
   * Gọi ĐÚNG MỘT LẦN mỗi lượt mà SERVER xác nhận đã ghi "đã học" (`saved: true`) — nơi gọi phản
   * chiếu vào kho máy (`recordServerVerifiedDialogue`) và tính lại mục lục. Client không tự ghi.
   */
  onVerified: () => void
  /** Quay lại bản hội thoại. */
  onBack: () => void
  /**
   * Số lượt bắt đầu (seed). Mặc định NGẪU NHIÊN: server chỉ chấm mỗi lượt MỘT lần, nên mở lại màn
   * này phải ra lượt mới chứ không quay về lượt 0 đã dùng. Test truyền số cố định.
   */
  initialAttempt?: number
}

/** Kết cục của lần nộp, gắn với lời nhắn hiện cho người học. */
type Notice =
  'saved' | 'server-not-passed' | 'guest' | Exclude<DialogueCheckOutcome['kind'], 'graded'>

/** Kết quả đang hiện: từ server (nguồn sự thật) hoặc chấm tại máy (khi không lưu được). */
interface ShownResult {
  source: 'server' | 'local'
  correct: number
  total: number
  required: number
  passed: boolean
  /** Theo thứ tự câu: đáp án đúng + đúng/sai của lựa chọn. */
  items: { correctId: string; correct: boolean }[]
  notice: Notice
}

/** Kết cục gửi lại được (lỗi tạm thời) — hiện nút "Gửi lại" với đúng các câu trả lời đó. */
const RESENDABLE: ReadonlySet<Notice> = new Set(['offline', 'rate-limited', 'error'])

/**
 * Lời nhắn dưới điểm số — nói THẬT tình trạng lưu. "Đã học" chỉ được nói khi server xác nhận.
 * Kết quả chấm tại máy luôn kèm "chưa lưu" và lý do + việc cần làm.
 */
function noticeText(r: ShownResult, isA: boolean): string {
  const retryHint = isA
    ? 'Xem lại hội thoại rồi làm lại — lượt sau câu hỏi sẽ khác.'
    : 'Read the dialogue again, then retry — the questions will change.'
  switch (r.notice) {
    case 'saved':
      return isA
        ? 'Máy chủ đã chấm và ghi hội thoại này là ĐÃ HỌC.'
        : 'Checked by the server — this dialogue is now marked as LEARNED.'
    case 'server-not-passed':
      return retryHint
    case 'guest':
      return r.passed
        ? isA
          ? 'Bạn đã đạt, nhưng cần đăng nhập để lưu tiến độ.'
          : 'You passed, but you need to sign in to save progress.'
        : retryHint
    case 'offline':
      return isA
        ? 'Chưa lưu: mất kết nối nên máy chủ chưa chấm lượt này. Điểm trên là chấm tại máy. Kiểm tra mạng rồi bấm Gửi lại.'
        : "Not saved: you're offline, so the server hasn't checked this attempt. The score above was checked on this device. Check your connection, then press Send again."
    case 'rate-limited':
      return isA
        ? 'Chưa lưu: bạn nộp hơi nhanh. Đợi khoảng một phút rồi bấm Gửi lại.'
        : 'Not saved: too many submissions. Wait about a minute, then press Send again.'
    case 'error':
      return isA
        ? 'Chưa lưu: máy chủ đang gặp lỗi. Thử Gửi lại sau ít phút.'
        : 'Not saved: the server ran into a problem. Try Send again in a few minutes.'
    case 'auth':
      return isA
        ? 'Chưa lưu: phiên đăng nhập đã hết. Đăng nhập lại rồi làm lại bài.'
        : 'Not saved: your session has expired. Sign in again, then retake the check.'
    case 'attempt-used':
      return isA
        ? 'Chưa lưu: lượt này đã được nộp trước đó nên không chấm lại. Bấm Làm lại để có câu hỏi mới.'
        : 'Not saved: this attempt was already submitted, so it cannot be checked again. Press Retry for new questions.'
    case 'outdated':
      return isA
        ? 'Chưa lưu: nội dung hội thoại vừa được cập nhật. Tải lại trang rồi làm lại.'
        : 'Not saved: this dialogue was just updated. Reload the page, then retake the check.'
  }
}

function randomAttempt(): number {
  return Math.floor(Math.random() * MAX_DIALOGUE_ATTEMPT)
}

export default function DialogueComprehensionCheck({
  dialogue,
  ownerId,
  isA,
  accent,
  canSave,
  onVerified,
  onBack,
  initialAttempt,
}: DialogueComprehensionCheckProps) {
  const dir: ComprehensionDirection = isA ? 'A' : 'B'
  // Số lần làm — đổi seed để "Làm lại" ra đề khác (khác câu làm đề + thứ tự phương án).
  const [attempt, setAttempt] = useState(() => initialAttempt ?? randomAttempt())
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<ShownResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Lượt đang chờ server — để bỏ phản hồi đến muộn của lượt cũ (người học đã bấm Làm lại).
  const pendingAttemptRef = useRef<number | null>(null)
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

  /** Chấm tại máy — chỉ dùng khi KHÔNG có kết quả server (khách, hoặc không lưu được). */
  function localResult(notice: Notice): ShownResult {
    const g = gradeComprehension(questions, answers)
    return {
      source: 'local',
      correct: g.correct,
      total: g.total,
      required: g.required,
      passed: g.passed,
      items: questions.map((q, i) => ({
        correctId: q.correctId,
        correct: g.items[i]?.correct ?? false,
      })),
      notice,
    }
  }

  async function send() {
    const sentAttempt = attempt
    pendingAttemptRef.current = sentAttempt
    setSubmitting(true)
    const outcome = await submitDialogueCheck({
      ownerId,
      titleEn: dialogue.titleEn,
      direction: dir,
      attempt: sentAttempt,
      answers: questions.flatMap((q) => {
        const optionId = answers[q.id]
        return optionId === undefined ? [] : [{ questionId: q.id, optionId }]
      }),
    })
    // Đã bấm Làm lại / rời màn trong lúc chờ → phản hồi này không còn thuộc màn đang hiện.
    if (pendingAttemptRef.current !== sentAttempt) return
    pendingAttemptRef.current = null
    setSubmitting(false)
    if (outcome.kind !== 'graded') {
      setResult(localResult(outcome.kind))
      return
    }
    const r = outcome.result
    const byId = new Map(r.items.map((it) => [it.questionId, it]))
    setResult({
      source: 'server',
      correct: r.correct,
      total: r.total,
      required: r.required,
      passed: r.passed,
      items: questions.map((q) => {
        const it = byId.get(q.id)
        return { correctId: it?.correctId ?? q.correctId, correct: it?.correct ?? false }
      }),
      notice: r.passed && r.saved ? 'saved' : 'server-not-passed',
    })
    if (r.passed && r.saved) onVerified()
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (result || submitting || !answeredAll) return
    if (!canSave) {
      // Khách: không có tài khoản để server ghi — chấm tại máy và nói thật là chưa lưu.
      setResult(localResult('guest'))
      return
    }
    void send()
  }

  function resend() {
    if (submitting) return
    setResult(null)
    void send()
  }

  function retry() {
    pendingAttemptRef.current = null
    setSubmitting(false)
    setAnswers({})
    setResult(null)
    setAttempt((n) => (n + 1) % MAX_DIALOGUE_ATTEMPT)
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
            // Sau khi nộp: đáp án đúng lấy theo KẾT QUẢ ĐANG HIỆN (server nếu có).
            const correctId = item?.correctId ?? q.correctId
            return (
              <li key={q.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                {/* Viền nằm ở <li>, fieldset để trần: legend mặc định "ngồi" trên viền fieldset,
                    trông như câu hỏi nằm ngoài khung. `float` + `clear` đưa legend vào luồng. */}
                <fieldset
                  role="radiogroup"
                  aria-labelledby={legendId}
                  disabled={result !== null || submitting}
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
                      const isCorrect = o.id === correctId
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
              disabled={!answeredAll || submitting}
              aria-describedby="cq-submit-hint"
              aria-busy={submitting}
              className={buttonClass({ variant: 'primary', fullWidth: true })}
            >
              {submitting
                ? isA
                  ? 'Đang gửi để chấm…'
                  : 'Sending for checking…'
                : isA
                  ? 'Nộp bài'
                  : 'Submit'}
            </button>
            <p id="cq-submit-hint" className="mt-2 text-xs text-zinc-400 text-center">
              {submitting
                ? isA
                  ? 'Máy chủ đang chấm bài của bạn.'
                  : 'The server is checking your answers.'
                : answeredAll
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
              result.notice === 'saved' ? 'border-emerald-500/60' : 'border-amber-500/60'
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
                ? `Đúng ${result.correct}/${result.total} — ${result.passed ? 'đạt' : `chưa đạt (cần ${result.required})`}${result.source === 'local' ? ' · chưa lưu' : ''}`
                : `${result.correct}/${result.total} correct — ${result.passed ? 'passed' : `not yet (need ${result.required})`}${result.source === 'local' ? ' · not saved' : ''}`}
            </p>
            <p className="mt-1 text-sm text-zinc-300">{noticeText(result, isA)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {RESENDABLE.has(result.notice) && (
                <button
                  type="button"
                  onClick={resend}
                  className={buttonClass({ variant: 'primary' })}
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  {isA ? 'Gửi lại' : 'Send again'}
                </button>
              )}
              <button
                type="button"
                onClick={retry}
                className={buttonClass({
                  variant: result.passed || RESENDABLE.has(result.notice) ? 'outline' : 'primary',
                })}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                {isA ? 'Làm lại (câu hỏi mới)' : 'Retry (new questions)'}
              </button>
              <button
                type="button"
                onClick={onBack}
                className={buttonClass({
                  variant: result.notice === 'saved' ? 'primary' : 'outline',
                })}
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
