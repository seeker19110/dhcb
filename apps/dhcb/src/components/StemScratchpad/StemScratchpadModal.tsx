import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useDialogBehavior } from '../useDialogBehavior'
import {
  ketQuaBuoc,
  nhanKetQuaBuoc,
  type StemProblemState,
  type ScratchpadStep,
  type StemSubjectType,
  type StepVerdict,
} from '@dhcb/core-contracts/stemScratchpad'
import {
  createStemProblemApi,
  validateStemStepApi,
  getStemHintApi,
} from '../../lib/stemScratchpadApi.js'

interface StemScratchpadModalProps {
  onClose: () => void
}

/**
 * Cách hiển thị từng kết luận của bộ kiểm. `unverified` (vàng, "Chưa tự kiểm được") tách riêng
 * khỏi `valid` (xanh lá = "đúng" — CLAUDE.md mục 4.8): bộ kiểm chưa chứng minh được bước nào
 * đúng thì không được tô xanh (changelog 0473).
 */
const HIEN_THI_KET_QUA: Record<StepVerdict, { khung: string; huyHieu: string; phanHoi: string }> = {
  valid: {
    khung: 'bg-emerald-950/20 theme-light:bg-emerald-50 border-emerald-500/30',
    huyHieu: 'bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-900',
    phanHoi:
      'bg-emerald-900/30 theme-light:bg-emerald-100 text-emerald-200 theme-light:text-emerald-900',
  },
  invalid: {
    khung: 'bg-rose-950/20 theme-light:bg-rose-50 border-rose-500/30',
    huyHieu: 'bg-rose-500/20 text-rose-300 theme-light:text-rose-900',
    phanHoi: 'bg-rose-900/30 theme-light:bg-rose-100 text-rose-200 theme-light:text-rose-900',
  },
  unverified: {
    khung: 'bg-amber-950/20 theme-light:bg-amber-50 border-amber-500/30',
    huyHieu: 'bg-amber-500/20 text-amber-300 theme-light:text-amber-900',
    phanHoi: 'bg-amber-900/30 theme-light:bg-amber-100 text-amber-200 theme-light:text-amber-900',
  },
}

export default function StemScratchpadModal({ onClose }: StemScratchpadModalProps) {
  // 6 hành vi a11y bắt buộc của hộp thoại.
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose)
  const [problem, setProblem] = useState<StemProblemState | null>(null)
  const [subject, setSubject] = useState<StemSubjectType>('math')
  const [latexInput, setLatexInput] = useState('')
  const [explanation, setExplanation] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [activeHint, setActiveHint] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const prob = await createStemProblemApi({
          subject: 'math',
          title: 'Phương trình bậc nhất',
          problemStatement: 'Tìm giá trị của x thoả mãn: 2x + 5 = 15',
          problemLatex: '2x + 5 = 15',
        })
        setProblem(prob)
      } catch (err) {
        console.error('Failed to init STEM problem:', err)
      }
    }
    void init()
  }, [])

  const handleSubjectChange = async (newSubject: StemSubjectType) => {
    setSubject(newSubject)
    setActiveHint(null)
    try {
      let title = 'Phương trình bậc nhất'
      let statement = 'Tìm giá trị của x: 2x + 5 = 15'
      let latex = '2x + 5 = 15'

      if (newSubject === 'chemistry') {
        title = 'Cân bằng phản ứng'
        statement = 'Cân bằng phản ứng tạo nước: H₂ + O₂ → H₂O'
        latex = 'H_2 + O_2 \\rightarrow H_2O'
      } else if (newSubject === 'physics') {
        title = 'Động học chất điểm'
        statement = 'Tính vận tốc sau 5s khi gia tốc a = 2m/s² từ trạng thái nghỉ:'
        latex = 'v = a \\cdot t'
      }

      const prob = await createStemProblemApi({
        subject: newSubject,
        title,
        problemStatement: statement,
        problemLatex: latex,
      })
      setProblem(prob)
    } catch (err) {
      console.error('Failed to change subject:', err)
    }
  }

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!latexInput.trim() || !problem || isValidating) return

    setIsValidating(true)
    try {
      const res = await validateStemStepApi({
        problemId: problem.id,
        latexInput: latexInput.trim(),
        explanation: explanation.trim() || undefined,
      })
      setProblem(res.problem)
      setLatexInput('')
      setExplanation('')
    } catch (err) {
      console.error('Failed to validate step:', err)
    } finally {
      setIsValidating(false)
    }
  }

  const handleGetHint = async () => {
    if (!problem) return
    try {
      const data = await getStemHintApi(problem.id)
      setActiveHint(data.hint.hintText)
    } catch (err) {
      console.error('Failed to get hint:', err)
    }
  }

  const buocCuoi = problem?.steps[problem.steps.length - 1]

  // Portal ra document.body: hộp thoại nằm trong khung studio — tổ tiên có `transform` hoặc
  // `space-y-*` (lề dưới 16px) làm lớp phủ `fixed inset-0` lệch/co lại (changelog 0474).
  return createPortal(
    // role/aria-modal trước đây nằm nhầm ở LỚP NỀN (phủ kín màn hình); nay chuyển vào
    // đúng khung hộp thoại, kèm Escape + bẫy tiêu điểm + khoá cuộn nền.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in"
      {...backdropProps}
    >
      <div
        {...dialogProps}
        className="relative w-full max-w-3xl max-h-[90dvh] flex flex-col rounded-3xl border border-teal-500/30 bg-zinc-950 text-white shadow-2xl overflow-hidden focus:outline-none"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-teal-950/40 theme-light:from-teal-50 via-emerald-950/20 theme-light:via-emerald-50 to-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-xl">
              📐
            </div>
            <div>
              <h2 id={titleId} className="text-base sm:text-lg font-bold text-white">
                STEM Interactive Scratchpad
              </h2>
              <p className="text-xs text-teal-300 theme-light:text-teal-900">
                Kiểm thử từng bước biến đổi logic & nhận dạng sai lầm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="tap-44 shrink-0 w-11 h-11 flex items-center justify-center rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Subject Selector Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit">
            {(['math', 'chemistry', 'physics'] as StemSubjectType[]).map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => handleSubjectChange(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  subject === subj
                    ? 'bg-teal-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {subj === 'math'
                  ? '🔢 Toán học'
                  : subj === 'chemistry'
                    ? '🧪 Hóa học'
                    : '⚡ Vật lí'}
              </button>
            ))}
          </div>

          {/* Problem Statement Card */}
          <div className="p-4 rounded-2xl bg-teal-950/20 theme-light:bg-teal-50 border border-teal-500/20">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-teal-300 theme-light:text-teal-900">Đề bài</h4>
              {problem?.isSolved && (
                <span className="text-[0.6875rem] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-900 border border-emerald-500/30 font-bold">
                  ✓ ĐÃ GIẢI XONG
                </span>
              )}
            </div>
            <p className="text-sm text-white font-medium mt-1">{problem?.problemStatement}</p>
            {problem?.problemLatex && (
              <div className="mt-2 font-mono text-xs px-3 py-1.5 rounded-xl bg-black/40 text-teal-200 theme-light:text-teal-900 border border-white/5">
                {problem.problemLatex}
              </div>
            )}
          </div>

          {/* Trình đọc màn hình nghe được kết luận của bước VỪA kiểm (nhãn có ký hiệu + chữ, không
              chỉ dựa vào màu). */}
          <p role="status" className="sr-only">
            {buocCuoi
              ? `Bước ${buocCuoi.stepNumber}: ${nhanKetQuaBuoc(buocCuoi.validation)}. ${buocCuoi.validation?.feedback ?? ''}`
              : ''}
          </p>

          {/* Steps Timeline */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-400">
              Các bước biến đổi ({problem?.steps.length || 0})
            </h4>

            {problem?.steps.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                Chưa có bước biến đổi nào. Hãy nhập biểu thức bước 1 bên dưới!
              </div>
            ) : (
              problem?.steps.map((step: ScratchpadStep) => {
                const hienThi = HIEN_THI_KET_QUA[ketQuaBuoc(step.validation)]
                return (
                  <div
                    key={step.stepNumber}
                    className={`p-3.5 rounded-2xl border ${hienThi.khung}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-zinc-300">
                        Bước {step.stepNumber}:
                      </span>
                      <span
                        className={`text-[0.6875rem] font-bold px-2 py-0.5 rounded-full ${hienThi.huyHieu}`}
                      >
                        {nhanKetQuaBuoc(step.validation)}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-white bg-black/30 p-2 rounded-xl border border-white/5">
                      {step.latexInput}
                    </div>

                    {step.explanation && (
                      <p className="text-xs text-zinc-400 mt-1 italic">{step.explanation}</p>
                    )}

                    {step.validation && (
                      <div className={`mt-2 text-xs p-2 rounded-xl ${hienThi.phanHoi}`}>
                        {step.validation.feedback}
                        {step.validation.suggestedCorrection && (
                          <div className="mt-1 text-[0.6875rem] text-amber-300 theme-light:text-amber-900">
                            Gợi ý: {step.validation.suggestedCorrection}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Micro Hint Display */}
          {activeHint && (
            <div className="p-3.5 rounded-2xl bg-amber-950/30 theme-light:bg-amber-50 border border-amber-500/30 text-amber-200 theme-light:text-amber-900 text-xs animate-fade-in flex items-start gap-2">
              <span className="text-base">💡</span>
              <div className="flex-1">
                <span className="font-bold">Gợi ý từ AI Tutor: </span>
                <span>{activeHint}</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/90">
          <form onSubmit={handleAddStep} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={latexInput}
                onChange={(e) => setLatexInput(e.target.value)}
                placeholder="Nhập biểu thức bước tiếp theo (ví dụ: 2x = 10 hoặc 2H_2 + O_2 -> 2H_2O)"
                disabled={isValidating || problem?.isSolved}
                className="flex-1 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 focus:border-teal-500 focus:outline-none text-xs sm:text-sm text-white placeholder-zinc-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isValidating || !latexInput.trim() || problem?.isSolved}
                className="px-4 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-zinc-950 font-bold text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isValidating ? '...' : 'Kiểm tra'}
              </button>
              <button
                type="button"
                onClick={handleGetHint}
                disabled={!problem || problem.isSolved}
                className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-xs text-amber-300 theme-light:text-amber-900 font-semibold transition"
                title="Nhận gợi ý"
              >
                💡 Gợi ý
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
