// DialogueComprehensionCheck — màn KIỂM TRA HIỂU sau khi xem một hội thoại CEFR.
//
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md
//
// Đề sinh TẤT ĐỊNH từ chính dữ liệu hội thoại (lib/dialogueComprehension.ts), không gọi AI nên
// không tốn lượt. Màn này CHE bản hội thoại (kèm bản dịch) trong lúc làm — nếu không, câu hỏi
// nghĩa chỉ còn là việc dò dòng dịch ngay phía trên.
//
// SERVER CẤP LƯỢT + CHẤM (đợt 0555 + 0558 — docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md):
// đã đăng nhập thì màn MỞ LƯỢT ở `/api/learning/evidence?action=cefr-dialogue-start` để nhận token
// mờ + đề ĐÃ BỎ ĐÁP ÁN (seed không rời server, máy không tính được đáp án), rồi nộp token + lựa chọn
// thô; server chấm và CHỈ server ghi "đã học". Câu sai KHÔNG được báo đáp án đúng — người học xem
// lại hội thoại rồi Làm lại (đề mới). Không tới được server lúc nộp → nói thật "chưa chấm", giữ
// nguyên lựa chọn, Gửi lại gửi lại đúng lượt đó.
// Chưa đăng nhập (khách): đề từ seed máy, chấm tại máy, có lời giải — kết quả khách vốn không lưu.
//
// A11y: mỗi câu là một `fieldset role="radiogroup"` + `legend`, radio THẬT (phím mũi tên chạy sẵn);
// phản hồi đúng/sai bằng CHỮ + biểu tượng, không chỉ bằng màu; sau khi nộp, focus chuyển tới khối
// kết quả (`role="status"`) để trình đọc màn hình đọc điểm ngay.

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  RefreshCw,
  RotateCcw,
  Send,
  XCircle,
} from 'lucide-react'
import type { Dialogue } from '../data/dialogues'
import type { AccentClasses } from '../lib/cefrAccent'
import {
  buildComprehensionQuiz,
  comprehensionSeed,
  gradeComprehension,
  requiredCorrect,
  toPublicComprehensionQuestion,
  type ComprehensionDirection,
  type ComprehensionExplanation,
  type ComprehensionQuestion,
} from '../lib/dialogueComprehension'
import {
  startDialogueCheck,
  submitDialogueCheck,
  type DialogueCheckFailure,
  type DialogueCheckOutcome,
  type DialogueStartOutcome,
} from '../lib/dialogueCheckClient'
import type { PublicDialogueQuestion } from '@dhcb/core-contracts/cefrDialogueCheck'
import { buttonClass } from '@core/buttonStyles'

export interface DialogueComprehensionCheckProps {
  dialogue: Dialogue
  /** Id unit/vòng sở hữu hội thoại — cùng khoá với "đã xem" (`dialogueKey`). */
  ownerId: string
  isA: boolean
  accent: AccentClasses
  /** Đã đăng nhập (server cấp lượt và ghi được tiến độ). Không thì chấm tại máy và nói thật là chưa lưu. */
  canSave: boolean
  /**
   * Gọi ĐÚNG MỘT LẦN mỗi lượt mà SERVER xác nhận đã ghi "đã học" (`saved: true`) — nơi gọi phản
   * chiếu vào kho máy (`recordServerVerifiedDialogue`) và tính lại mục lục. Client không tự ghi.
   */
  onVerified: () => void
  /** Quay lại bản hội thoại. */
  onBack: () => void
  /** Số lượt bắt đầu của đề KHÁCH (seed máy). Mặc định ngẫu nhiên; test truyền số cố định. */
  initialAttempt?: number
}

/** Trần số lượt khách (seed máy) — số nguyên dương 31 bit. */
const MAX_GUEST_ATTEMPT = 2_147_483_647

/** Đề đang hiện: từ server (token) hoặc tại máy (khách — giữ cả bản đầy đủ để chấm). */
type Quiz =
  | { source: 'server'; token: string; questions: PublicDialogueQuestion[] }
  | { source: 'local'; questions: PublicDialogueQuestion[]; full: ComprehensionQuestion[] }

/** Trạng thái lấy đề. */
type Phase =
  | { kind: 'loading' }
  | { kind: 'start-failed'; failure: DialogueCheckFailure['kind'] }
  | { kind: 'no-quiz' }
  | { kind: 'ready'; quiz: Quiz }

/** Lời nhắn kèm kết quả ĐÃ CHẤM. */
type GradedNotice = 'saved' | 'server-not-passed' | 'guest'
/**
 * Lời nhắn khi lượt nộp KHÔNG được chấm lần này. `already-saved`: lượt trước đã đạt và server đã
 * ghi "đã học" nhưng phản hồi rơi trên đường về — không phải lỗi, phản chiếu như đã lưu.
 */
type FailedNotice = Exclude<DialogueCheckOutcome['kind'], 'graded'> | 'already-saved'

interface GradedView {
  correct: number
  total: number
  required: number
  passed: boolean
  /** Theo thứ tự câu. `correctId` null = server không cho biết (câu sai, đã đăng nhập). */
  items: {
    correct: boolean
    correctId: string | null
    explanation: ComprehensionExplanation | null
  }[]
  notice: GradedNotice
}

/** Kết cục gửi lại được (lỗi tạm thời) — hiện nút "Gửi lại" với đúng các câu trả lời đó. */
const RESENDABLE: ReadonlySet<FailedNotice> = new Set([
  'offline',
  'rate-limited',
  'error',
  'unavailable',
])

function randomAttempt(): number {
  return Math.floor(Math.random() * MAX_GUEST_ATTEMPT)
}

/** Lời nhắn dưới điểm số của kết quả ĐÃ CHẤM — "đã học" chỉ nói khi server xác nhận. */
function gradedNoticeText(r: GradedView, isA: boolean): string {
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
  }
}

/** Lời nhắn khi lượt nộp CHƯA được chấm — nói thật lý do + việc cần làm. */
function failedNoticeText(notice: FailedNotice, isA: boolean): string {
  switch (notice) {
    case 'offline':
      return isA
        ? 'Chưa chấm: mất kết nối nên máy chủ chưa nhận được lượt này. Kiểm tra mạng rồi bấm Gửi lại — câu trả lời của bạn vẫn còn.'
        : "Not checked: you're offline, so the server hasn't received this attempt. Check your connection, then press Send again — your answers are kept."
    case 'rate-limited':
      return isA
        ? 'Chưa chấm: bạn nộp hơi nhanh. Đợi khoảng một phút rồi bấm Gửi lại.'
        : 'Not checked: too many submissions. Wait about a minute, then press Send again.'
    case 'error':
      return isA
        ? 'Chưa chấm: máy chủ đang gặp lỗi. Thử Gửi lại sau ít phút.'
        : 'Not checked: the server ran into a problem. Try Send again in a few minutes.'
    case 'unavailable':
      return isA
        ? 'Chưa chấm: máy chủ tạm bận. Thử Gửi lại sau ít phút — không cần làm lại bài.'
        : 'Not checked: the server is busy. Try Send again in a few minutes — no need to redo the check.'
    case 'auth':
      return isA
        ? 'Chưa chấm: phiên đăng nhập đã hết. Đăng nhập lại rồi làm lại bài.'
        : 'Not checked: your session has expired. Sign in again, then retake the check.'
    case 'attempt-used':
      return isA
        ? 'Chưa chấm: lượt này đã được nộp trước đó nên không chấm lại. Bấm Làm lại để có câu hỏi mới.'
        : 'Not checked: this attempt was already submitted, so it cannot be checked again. Press Retry for new questions.'
    case 'already-saved':
      return isA
        ? 'Lượt này đã được chấm trước đó và máy chủ ĐÃ ghi hội thoại này là ĐÃ HỌC (kết quả lần trước không về tới máy bạn).'
        : 'This attempt was already checked and the server has marked this dialogue as LEARNED (the earlier result did not reach your device).'
    case 'attempt-expired':
      return isA
        ? 'Chưa chấm: lượt này đã hết hạn. Bấm Làm lại để có câu hỏi mới.'
        : 'Not checked: this attempt has expired. Press Retry for new questions.'
    case 'outdated':
      return isA
        ? 'Chưa chấm: nội dung hội thoại vừa được cập nhật. Tải lại trang rồi làm lại.'
        : 'Not checked: this dialogue was just updated. Reload the page, then retake the check.'
  }
}

/** Lý do không lấy được đề từ server. */
function startFailureText(failure: DialogueCheckFailure['kind'], isA: boolean): string {
  switch (failure) {
    case 'offline':
      return isA
        ? 'Mất kết nối nên chưa lấy được câu hỏi từ máy chủ. Kiểm tra mạng rồi bấm Thử lại.'
        : "You're offline, so the questions could not be fetched. Check your connection, then press Try again."
    case 'auth':
      return isA
        ? 'Phiên đăng nhập đã hết. Đăng nhập lại rồi mở lại bài kiểm tra.'
        : 'Your session has expired. Sign in again, then reopen the check.'
    case 'rate-limited':
      return isA
        ? 'Bạn mở bài hơi nhanh. Đợi khoảng một phút rồi bấm Thử lại.'
        : 'Too many attempts opened. Wait about a minute, then press Try again.'
    case 'unavailable':
      return isA
        ? 'Máy chủ tạm bận. Thử lại sau ít phút.'
        : 'The server is busy. Try again in a few minutes.'
    case 'error':
      return isA
        ? 'Máy chủ đang gặp lỗi. Thử lại sau ít phút.'
        : 'The server ran into a problem. Try again in a few minutes.'
  }
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
  // Số lượt khách (seed máy) — "Làm lại" tăng để đề đổi câu. Đã đăng nhập thì mỗi Làm lại là một
  // lần mở lượt mới ở server; `round` tăng để useEffect mở lượt chạy lại và focus về tiêu đề.
  const [attempt, setAttempt] = useState(() => initialAttempt ?? randomAttempt())
  const [round, setRound] = useState(0)
  // Trạng thái lấy đề từ SERVER (chỉ dùng khi đã đăng nhập). Khách: đề tính thẳng bằng useMemo.
  const [serverPhase, setServerPhase] = useState<Phase>({ kind: 'loading' })
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<GradedView | null>(null)
  const [failure, setFailure] = useState<FailedNotice | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // Lượt đang chờ server — để bỏ phản hồi đến muộn của lượt cũ (người học đã bấm Làm lại).
  const pendingTokenRef = useRef<string | null>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  /** Đề khách: dựng tại máy từ seed máy (giữ bản đầy đủ để chấm tại máy). */
  const localPhase = useMemo<Phase>(() => {
    if (canSave) return { kind: 'loading' }
    const full = buildComprehensionQuiz(
      dialogue,
      dir,
      comprehensionSeed(ownerId, dialogue.titleEn, dir, attempt),
    )
    if (full.length === 0) return { kind: 'no-quiz' }
    return {
      kind: 'ready',
      quiz: { source: 'local', questions: full.map(toPublicComprehensionQuestion), full },
    }
  }, [canSave, dialogue, dir, ownerId, attempt])

  const titleEn = dialogue.titleEn
  // Mở lượt ở server (đã đăng nhập) — mỗi lần mở màn và mỗi lần Làm lại/Thử lại (`round` tăng,
  // `retry` đã đặt lại `serverPhase` về loading trước đó).
  useEffect(() => {
    if (!canSave) return
    // Cờ cục bộ của LẦN mở này: cleanup bật lên khi deps đổi/unmount → phản hồi đến muộn bị bỏ
    // (StrictMode dev chạy effect 2 lần cũng nhờ vậy mà không hiện đề của lần đầu).
    let cancelled = false
    startDialogueCheck({ ownerId, titleEn, direction: dir })
      // `startDialogueCheck` không ném; `.catch` chỉ là lưới an toàn nếu sau này đổi.
      .catch((): DialogueStartOutcome => ({ kind: 'error' }))
      .then((outcome: DialogueStartOutcome) => {
        if (cancelled) return
        if (outcome.kind === 'started') {
          setServerPhase({
            kind: 'ready',
            quiz: {
              source: 'server',
              token: outcome.result.token,
              questions: outcome.result.questions,
            },
          })
        } else if (outcome.kind === 'no-quiz') {
          setServerPhase({ kind: 'no-quiz' })
        } else {
          setServerPhase({ kind: 'start-failed', failure: outcome.kind })
        }
      })
    return () => {
      cancelled = true
    }
  }, [canSave, ownerId, titleEn, dir, round])

  const phase: Phase = canSave ? serverPhase : localPhase

  // Sau khi có kết quả/lỗi nộp → đưa focus tới khối trạng thái; mở màn (và mỗi Làm lại) → về tiêu đề.
  useEffect(() => {
    if (result || failure) resultRef.current?.focus()
  }, [result, failure])
  useEffect(() => {
    headingRef.current?.focus()
  }, [round, attempt])

  const questions = phase.kind === 'ready' ? phase.quiz.questions : []
  const answeredAll = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined)

  /** Chấm tại máy — CHỈ cho khách (có bản đề đầy đủ). */
  function gradeLocal(full: ComprehensionQuestion[]): GradedView {
    const g = gradeComprehension(full, answers)
    return {
      correct: g.correct,
      total: g.total,
      required: g.required,
      passed: g.passed,
      items: full.map((q, i) => ({
        correctId: q.correctId,
        correct: g.items[i]?.correct ?? false,
        explanation: q.explanation,
      })),
      notice: 'guest',
    }
  }

  async function send(token: string, qs: PublicDialogueQuestion[]) {
    pendingTokenRef.current = token
    setSubmitting(true)
    setFailure(null)
    const outcome = await submitDialogueCheck({
      token,
      answers: qs.flatMap((q) => {
        const optionId = answers[q.id]
        return optionId === undefined ? [] : [{ questionId: q.id, optionId }]
      }),
    })
    // Đã bấm Làm lại / rời màn trong lúc chờ → phản hồi này không còn thuộc màn đang hiện.
    if (pendingTokenRef.current !== token) return
    pendingTokenRef.current = null
    setSubmitting(false)
    if (outcome.kind !== 'graded') {
      if (outcome.kind === 'attempt-used' && outcome.saved) {
        // Lượt trước đã đạt, server đã ghi — phản chiếu vào kho máy như một lượt "saved".
        setFailure('already-saved')
        onVerified()
        return
      }
      setFailure(outcome.kind)
      return
    }
    const r = outcome.result
    const byId = new Map(r.items.map((it) => [it.questionId, it]))
    setResult({
      correct: r.correct,
      total: r.total,
      required: r.required,
      passed: r.passed,
      items: qs.map((q) => {
        const it = byId.get(q.id)
        const correct = it?.correct ?? false
        return {
          correct,
          // Đúng thì đáp án chính là lựa chọn; sai thì server KHÔNG cho biết (chống dò đáp án).
          correctId: correct ? (it?.chosenId ?? null) : null,
          explanation: it?.explanation ?? null,
        }
      }),
      notice: r.passed && r.saved ? 'saved' : 'server-not-passed',
    })
    if (r.passed && r.saved) onVerified()
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (phase.kind !== 'ready' || result || submitting || !answeredAll) return
    if (phase.quiz.source === 'local') {
      // Khách: không có tài khoản để server ghi — chấm tại máy và nói thật là chưa lưu.
      setResult(gradeLocal(phase.quiz.full))
      return
    }
    void send(phase.quiz.token, phase.quiz.questions)
  }

  function resend() {
    if (phase.kind !== 'ready' || phase.quiz.source !== 'server' || submitting) return
    void send(phase.quiz.token, phase.quiz.questions)
  }

  function retry() {
    pendingTokenRef.current = null
    setSubmitting(false)
    setAnswers({})
    setResult(null)
    setFailure(null)
    if (canSave) {
      setServerPhase({ kind: 'loading' })
      setRound((n) => n + 1)
    } else {
      setAttempt((n) => (n + 1) % MAX_GUEST_ATTEMPT)
    }
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
  if (phase.kind === 'no-quiz') {
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

  // Đang mở lượt ở server / mở lượt thất bại.
  if (phase.kind === 'loading' || phase.kind === 'start-failed') {
    const loading = phase.kind === 'loading'
    return (
      <div className="animate-fade-in space-y-3">
        {backButton}
        <div className="glass rounded-2xl p-4 sm:p-5" role="status" aria-busy={loading}>
          <h3 ref={headingRef} tabIndex={-1} className="font-bold text-white outline-none">
            {loading
              ? isA
                ? 'Đang lấy câu hỏi…'
                : 'Fetching questions…'
              : isA
                ? 'Chưa lấy được câu hỏi'
                : 'Could not fetch the questions'}
          </h3>
          <p className="mt-2 text-sm text-zinc-300">
            {loading
              ? isA
                ? 'Máy chủ đang chuẩn bị bài kiểm tra cho bạn.'
                : 'The server is preparing your check.'
              : startFailureText(phase.failure, isA)}
          </p>
          {!loading && (
            <div className="mt-3 flex flex-wrap gap-2">
              {phase.failure !== 'auth' && (
                <button
                  type="button"
                  onClick={retry}
                  className={buttonClass({ variant: 'primary' })}
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  {isA ? 'Thử lại' : 'Try again'}
                </button>
              )}
              <button
                type="button"
                onClick={onBack}
                className={buttonClass({ variant: 'outline' })}
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                {isA ? 'Xem lại hội thoại' : 'Back to the dialogue'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const total = questions.length
  const need = requiredCorrect(total)
  const locked = result !== null || submitting

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
            const correctId = item?.correctId ?? null
            return (
              <li key={q.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
                {/* Viền nằm ở <li>, fieldset để trần: legend mặc định "ngồi" trên viền fieldset,
                    trông như câu hỏi nằm ngoài khung. `float` + `clear` đưa legend vào luồng. */}
                <fieldset
                  role="radiogroup"
                  aria-labelledby={legendId}
                  disabled={locked}
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
                      const isCorrect = correctId !== null && o.id === correctId
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
                        {item.explanation ? (
                          <>
                            {item.explanation.lead}
                            {item.explanation.quote && (
                              <>
                                {' '}
                                <q lang={item.explanation.quoteLang}>{item.explanation.quote}</q>
                              </>
                            )}
                          </>
                        ) : // Câu sai khi đã đăng nhập: server không cho biết đáp án — chỉ đường về hội thoại.
                        isA ? (
                          'Xem lại đoạn này trong hội thoại rồi làm lại.'
                        ) : (
                          'Look at this part of the dialogue again, then retry.'
                        )}
                      </span>
                    </p>
                  )}
                </fieldset>
              </li>
            )
          })}
        </ol>

        {!result && !failure && (
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

        {(result || failure) && (
          <div
            ref={resultRef}
            tabIndex={-1}
            role="status"
            className={`mt-4 rounded-xl border p-3 outline-none ${
              result?.notice === 'saved' || failure === 'already-saved'
                ? 'border-emerald-500/60'
                : 'border-amber-500/60'
            }`}
          >
            <p className="flex items-center gap-1.5 font-semibold text-zinc-100">
              {result?.passed || failure === 'already-saved' ? (
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
              {result
                ? isA
                  ? `Đúng ${result.correct}/${result.total} — ${result.passed ? 'đạt' : `chưa đạt (cần ${result.required})`}${result.notice === 'guest' ? ' · chưa lưu' : ''}`
                  : `${result.correct}/${result.total} correct — ${result.passed ? 'passed' : `not yet (need ${result.required})`}${result.notice === 'guest' ? ' · not saved' : ''}`
                : failure === 'already-saved'
                  ? isA
                    ? 'Đã học — ghi từ lượt trước'
                    : 'Learned — saved from the earlier attempt'
                  : isA
                    ? 'Chưa chấm được lượt này'
                    : 'This attempt was not checked'}
            </p>
            <p className="mt-1 text-sm text-zinc-300">
              {result
                ? gradedNoticeText(result, isA)
                : failure
                  ? failedNoticeText(failure, isA)
                  : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {failure && RESENDABLE.has(failure) && (
                <button
                  type="button"
                  onClick={resend}
                  disabled={submitting}
                  aria-busy={submitting}
                  className={buttonClass({ variant: 'primary' })}
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  {submitting ? (isA ? 'Đang gửi…' : 'Sending…') : isA ? 'Gửi lại' : 'Send again'}
                </button>
              )}
              <button
                type="button"
                onClick={retry}
                className={buttonClass({
                  variant:
                    result?.passed || (failure && RESENDABLE.has(failure)) ? 'outline' : 'primary',
                })}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                {isA ? 'Làm lại (câu hỏi mới)' : 'Retry (new questions)'}
              </button>
              <button
                type="button"
                onClick={onBack}
                className={buttonClass({
                  variant:
                    result?.notice === 'saved' || failure === 'already-saved'
                      ? 'primary'
                      : 'outline',
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
