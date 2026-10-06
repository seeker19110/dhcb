// PathStageQuiz — Quiz sau chặng của lộ trình mục tiêu (đợt 3/4, xem đặc tả
// docs/specs/2026-08-31-khoa-hoc-ky-su-truong-ai.md). Chấm ở SERVER; component chỉ gửi câu trả
// lời và hiện kết quả. Làm lại KHÔNG giới hạn, KHÔNG phạt, không lưu điểm hiển thị lâu dài —
// mỗi lượt mở lại quiz là một lượt làm mới, sạch trạng thái cũ.
//
// Sau khi ĐẠT, mở nút tuỳ chọn "Giải thích lại cho Bạn Đồng Hành" — MỘT lượt hội thoại qua
// /api/agent (mode 'chat', đếm lượt Free/Pro hiện hành, KHÔNG lưu lại nội dung hội thoại).
import { thongDiepLoiThanThien } from '../lib/friendlyError'
import { useState } from 'react'
import { CheckCircle2, ClipboardCheck, XCircle, MessageCircle, Loader2 } from 'lucide-react'
import { buttonClass } from '@core/buttonStyles'
import {
  quizOfStage,
  type StageQuizQuestion,
} from '@dhcb/subject-programming/learningPaths/stageQuizzes'
import { submitPathQuiz } from '../lib/programmingPathQuiz'
import { callClaude } from '../lib/ai'
import { pathCheckSystemPrompt } from '../prompts/pathCheckPrompt'

interface Props {
  pathId: string
  stageId: string
  stageName: string
  topics: string[]
  /** Gọi khi quiz đạt yêu cầu — trang cha refetch tiến độ để hiện dấu "đã xong". */
  onPassed?: () => void
  /**
   * Dạng GỌN cho danh sách nhiều chặng (trang lộ trình — audit 2026-09-30 M22, changelog 0500).
   *
   * Dạng khối mặc định là một hộp có viền mang dòng "Bài kiểm sau chặng — Mở bài kiểm"; trang lộ
   * trình `principal-ai` có 32 chặng nên lặp đúng hộp đó 32 lần (trang 11.523px ở 390px). Dạng
   * gọn chỉ còn MỘT nút viền, trả về dạng Fragment để trang cha đặt nó vào cùng hàng với nút
   * "Vào học chặng này" (hàng `flex-wrap`); khi mở, khung câu hỏi chiếm trọn một dòng riêng
   * (`basis-full`) ngay dưới hàng nút.
   */
  inline?: boolean
}

export default function PathStageQuiz({
  pathId,
  stageId,
  stageName,
  topics,
  onPassed,
  inline = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [choices, setChoices] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{ correct: number; total: number; passed: boolean } | null>(
    null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Ngân hàng câu hỏi thật của chặng — hằng biên dịch, không I/O nên đọc thẳng không cần lazy.
  const questions: StageQuizQuestion[] = quizOfStage(stageId)

  function reset() {
    setChoices({})
    setResult(null)
    setError(null)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    const answers = questions.map((q) => ({ questionId: q.id, choiceIndex: choices[q.id] ?? -1 }))
    const res = await submitPathQuiz(pathId, stageId, answers)
    setSubmitting(false)
    if (!res) {
      setError('Không nộp được bài — kiểm tra mạng rồi thử lại.')
      return
    }
    setResult(res)
    if (res.passed) onPassed?.()
  }

  function toggle() {
    setOpen((o) => !o)
    reset()
  }

  const panel = open && (
    <div className="space-y-3">
      {!result &&
        questions.map((q, idx) => (
          <div key={q.id} className="space-y-1.5">
            <p className="text-xs font-semibold text-zinc-200">
              Câu {idx + 1}: {q.prompt}
            </p>
            <div className="space-y-1">
              {q.choices.map((choice, ci) => (
                <label
                  key={ci}
                  className="tap-44 flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={q.id}
                    checked={choices[q.id] === ci}
                    onChange={() => setChoices((c) => ({ ...c, [q.id]: ci }))}
                  />
                  <span className="text-xs text-zinc-200">{choice}</span>
                </label>
              ))}
            </div>
          </div>
        ))}

      {!result && (
        <button
          onClick={() => void handleSubmit()}
          disabled={submitting || Object.keys(choices).length < questions.length}
          className="tap-44 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-black font-semibold text-xs transition active:scale-[0.98]"
        >
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
          <span>{submitting ? 'Đang chấm…' : 'Nộp bài'}</span>
        </button>
      )}

      {error && <p className="text-xs text-rose-400 theme-light:text-rose-900">{error}</p>}

      {result && (
        <div className="space-y-2.5">
          <p
            className={`flex items-center gap-2 text-sm font-semibold ${
              result.passed
                ? 'text-emerald-300 theme-light:text-emerald-900'
                : 'text-amber-300 theme-light:text-amber-900'
            }`}
          >
            {result.passed ? (
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            ) : (
              <XCircle className="w-4 h-4" aria-hidden="true" />
            )}
            <span>
              {result.correct}/{result.total} câu đúng —{' '}
              {result.passed ? 'Đạt, chặng này đã hoàn thành!' : 'Chưa đạt, làm lại nhé.'}
            </span>
          </p>
          <ol className="space-y-1.5">
            {questions.map((q, idx) => {
              const yourChoice = choices[q.id]
              const right = yourChoice === q.answerIndex
              return (
                <li key={q.id} className="text-xs text-zinc-300 leading-relaxed">
                  <span
                    className={
                      right
                        ? 'text-emerald-300 theme-light:text-emerald-900'
                        : 'text-rose-300 theme-light:text-rose-900'
                    }
                  >
                    Câu {idx + 1}: {right ? 'Đúng' : 'Chưa đúng'}.
                  </span>{' '}
                  {q.explain}
                </li>
              )
            })}
          </ol>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="tap-44 flex-1 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-accent-500/60 text-zinc-200 font-semibold text-xs transition active:scale-[0.98]"
            >
              Làm lại
            </button>
          </div>
          {result.passed && <CompanionCheckIn stageName={stageName} topics={topics} />}
        </div>
      )}
    </div>
  )

  if (inline) {
    return (
      <>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          // Tên đọc kèm tên chặng: 32 nút cùng một tên "Mở bài kiểm" thì trình đọc màn hình không
          // phân biệt được nút nào của chặng nào (WCAG 2.4.6). Chữ hiển thị nằm trọn trong tên
          // đọc (2.5.3 — nhãn trong tên).
          aria-label={`${open ? 'Thu gọn bài kiểm' : 'Mở bài kiểm'} sau chặng ${stageName}`}
          className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
          <span>{open ? 'Thu gọn bài kiểm' : 'Mở bài kiểm'}</span>
        </button>
        {panel && (
          <div className="basis-full rounded-2xl bg-zinc-950 border border-zinc-800 p-3">
            {panel}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-3 space-y-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="tap-44 w-full text-left flex items-center justify-between gap-2"
      >
        <span className="text-xs font-semibold text-zinc-200">Bài kiểm sau chặng</span>
        <span className="text-[0.6875rem] text-accent-400 theme-light:text-accent-800">
          {open ? 'Thu gọn' : 'Mở bài kiểm'}
        </span>
      </button>
      {panel}
    </div>
  )
}

/** Bước Companion kiểm hiểu — TUỲ CHỌN, một lượt hỏi-đáp, không lưu lại nội dung. */
function CompanionCheckIn({ stageName, topics }: { stageName: string; topics: string[] }) {
  const [started, setStarted] = useState(false)
  const [question, setQuestion] = useState<string | null>(null)
  const [answer, setAnswer] = useState('')
  const [reply, setReply] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function ask() {
    setStarted(true)
    setLoading(true)
    setErr(null)
    try {
      const system = pathCheckSystemPrompt(stageName, topics)
      const text = await callClaude(
        [{ role: 'user', content: 'Hãy đặt câu hỏi đào sâu cho tôi.' }],
        system,
        400,
        'chat',
      )
      setQuestion(text)
    } catch (e) {
      setErr(thongDiepLoiThanThien(e, 'Không hỏi được Bạn Đồng Hành lúc này.'))
    } finally {
      setLoading(false)
    }
  }

  async function respond() {
    if (!question) return
    setLoading(true)
    setErr(null)
    try {
      const system = pathCheckSystemPrompt(stageName, topics)
      const text = await callClaude(
        [
          { role: 'assistant', content: question },
          { role: 'user', content: answer },
        ],
        system,
        400,
        'chat',
      )
      setReply(text)
    } catch (e) {
      setErr(thongDiepLoiThanThien(e, 'Không phản hồi được lúc này.'))
    } finally {
      setLoading(false)
    }
  }

  if (!started) {
    return (
      <button
        onClick={() => void ask()}
        className="tap-44 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-accent-500/60 text-zinc-200 font-semibold text-xs transition active:scale-[0.98]"
      >
        <MessageCircle className="w-3.5 h-3.5 text-accent-400" aria-hidden="true" />
        <span>Giải thích lại cho Bạn Đồng Hành (tuỳ chọn)</span>
      </button>
    )
  }

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 space-y-2">
      {loading && !question && <p className="text-xs text-zinc-400">Bạn Đồng Hành đang hỏi…</p>}
      {question && <p className="text-xs text-zinc-200 leading-relaxed">{question}</p>}
      {question && !reply && (
        <div className="space-y-1.5">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Giải thích lại bằng lời của bạn…"
            className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-2.5 py-2 text-xs text-zinc-100"
            rows={3}
          />
          <button
            onClick={() => void respond()}
            disabled={loading || answer.trim().length === 0}
            className="tap-44 w-full py-2 rounded-lg bg-accent-500 hover:bg-accent-400 disabled:opacity-50 text-black font-semibold text-xs transition active:scale-[0.98]"
          >
            {loading ? 'Đang gửi…' : 'Gửi'}
          </button>
        </div>
      )}
      {reply && (
        <p className="text-xs text-emerald-200 theme-light:text-emerald-900 leading-relaxed">
          {reply}
        </p>
      )}
      {err && <p className="text-xs text-rose-400 theme-light:text-rose-900">{err}</p>}
    </div>
  )
}
