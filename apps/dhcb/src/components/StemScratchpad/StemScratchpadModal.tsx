import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDialogBehavior } from '../useDialogBehavior'
import {
  ketQuaBuoc,
  nhanKetQuaBuoc,
  NHAC_KHI_NOP_SAI,
  type ScratchpadStep,
  type StemBankQuestionPublic,
  type StemMicroHint,
  type StemProblemState,
  type StemSubjectType,
  type StepVerdict,
  type SubmitSolutionResult,
} from '@dhcb/core-contracts/stemScratchpad'
import {
  createStemProblemFromBankApi,
  fetchStemQuestionsApi,
  getStemHintApi,
  submitStemSolutionApi,
  validateStemStepApi,
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

const MON: ReadonlyArray<{ id: StemSubjectType; nhan: string }> = [
  { id: 'math', nhan: '🔢 Toán học' },
  { id: 'chemistry', nhan: '🧪 Hóa học' },
  { id: 'physics', nhan: '⚡ Vật lí' },
]

/** Ví dụ cách gõ một bước, theo môn — chỉ minh hoạ CÁCH GÕ, không liên quan đề đang giải. */
const VI_DU_BUOC: Record<StemSubjectType, string> = {
  math: 'Bước tiếp theo, vd 2x = 10',
  chemistry: 'Bước tiếp theo, vd 2H_2 + O_2 -> 2H_2O',
  physics: 'Bước tiếp theo, vd v = 2 · 5',
  biology: 'Bước tiếp theo',
}

/** Lớp chung cho nút hành động: vùng chạm ≥ 44px, chữ không bao giờ bị ép xuống 2 dòng. */
const NUT_CO_BAN =
  'min-h-11 px-4 rounded-2xl text-sm font-bold whitespace-nowrap transition disabled:opacity-50 inline-flex items-center justify-center gap-1.5'

type TaiDe =
  { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; questions: StemBankQuestionPublic[] }

type TrangThaiNop =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'done'; result: SubmitSolutionResult }
  | { kind: 'error' }

export default function StemScratchpadModal({ onClose }: StemScratchpadModalProps) {
  // 6 hành vi a11y bắt buộc của hộp thoại.
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(onClose)
  const stepInputId = useId()
  const answerInputId = useId()
  const answerHelpId = useId()

  const [subject, setSubject] = useState<StemSubjectType>('math')
  const [taiDe, setTaiDe] = useState<TaiDe>({ kind: 'loading' })
  const [viTri, setViTri] = useState(0)
  const [problem, setProblem] = useState<StemProblemState | null>(null)
  const [moPhienLoi, setMoPhienLoi] = useState(false)

  const [latexInput, setLatexInput] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [loiKiemBuoc, setLoiKiemBuoc] = useState(false)

  const [goiY, setGoiY] = useState<StemMicroHint | null>(null)
  const [dangLayGoiY, setDangLayGoiY] = useState(false)
  const [loiGoiY, setLoiGoiY] = useState(false)

  const [dapSo, setDapSo] = useState('')
  const [nop, setNop] = useState<TrangThaiNop>({ kind: 'idle' })

  // Mỗi lần đổi môn/đổi đề tăng số này; phản hồi mạng đến muộn của lượt cũ bị bỏ qua (tránh đề
  // của môn trước "đè" lên môn vừa chọn khi người học bấm nhanh).
  const luot = useRef(0)

  const moPhien = useCallback(async (question: StemBankQuestionPublic) => {
    const lan = ++luot.current
    setProblem(null)
    setMoPhienLoi(false)
    setGoiY(null)
    setLoiGoiY(false)
    setLoiKiemBuoc(false)
    setDapSo('')
    setNop({ kind: 'idle' })
    try {
      const prob = await createStemProblemFromBankApi(question.id)
      if (lan === luot.current) setProblem(prob)
    } catch {
      if (lan === luot.current) setMoPhienLoi(true)
    }
  }, [])

  // Tải ngân hàng đề của một môn. Mọi setState nằm trong callback của promise (an toàn khi gọi từ
  // effect lúc mở hộp thoại). `lan` = lượt tải — lượt cũ về muộn thì bỏ.
  const napNganHang = useCallback(
    (mon: StemSubjectType, lan: number) =>
      fetchStemQuestionsApi(mon).then(
        (questions) => {
          if (lan !== luot.current) return
          setTaiDe({ kind: 'ready', questions })
          const dau = questions[0]
          if (dau) void moPhien(dau)
        },
        () => {
          if (lan === luot.current) setTaiDe({ kind: 'error' })
        },
      ),
    [moPhien],
  )

  /** Đổi môn / thử lại: xoá đề đang hiện rồi tải lại. */
  const taiNganHang = (mon: StemSubjectType) => {
    const lan = ++luot.current
    setTaiDe({ kind: 'loading' })
    setProblem(null)
    setViTri(0)
    void napNganHang(mon, lan)
  }

  // Mở hộp thoại: trạng thái ban đầu đã là "đang tải", chỉ cần nạp môn Toán.
  useEffect(() => {
    void napNganHang('math', ++luot.current)
  }, [napNganHang])

  const doiMon = (mon: StemSubjectType) => {
    if (mon === subject) return
    setSubject(mon)
    void taiNganHang(mon)
  }

  const cauHienTai = taiDe.kind === 'ready' ? taiDe.questions[viTri] : undefined

  const deKhac = () => {
    if (taiDe.kind !== 'ready' || taiDe.questions.length < 2) return
    const tiep = (viTri + 1) % taiDe.questions.length
    const cau = taiDe.questions[tiep]
    if (!cau) return
    setViTri(tiep)
    void moPhien(cau)
  }

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!latexInput.trim() || !problem || isValidating) return

    setIsValidating(true)
    setLoiKiemBuoc(false)
    try {
      const res = await validateStemStepApi({
        problemId: problem.id,
        latexInput: latexInput.trim(),
      })
      setProblem(res.problem)
      setLatexInput('')
      // Gợi ý cũ nói về bước trước — bước mới đã đổi tình trạng bài.
      setGoiY(null)
    } catch {
      setLoiKiemBuoc(true)
    } finally {
      setIsValidating(false)
    }
  }

  const handleGetHint = async () => {
    if (!problem || dangLayGoiY) return
    setDangLayGoiY(true)
    setLoiGoiY(false)
    try {
      const data = await getStemHintApi(problem.id)
      setGoiY(data.hint)
    } catch {
      setLoiGoiY(true)
    } finally {
      setDangLayGoiY(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!problem || !dapSo.trim() || nop.kind === 'submitting') return
    setNop({ kind: 'submitting' })
    try {
      const result = await submitStemSolutionApi(problem.id, dapSo.trim())
      setNop({ kind: 'done', result })
      if (result.isSolved) setProblem({ ...problem, isSolved: true })
    } catch {
      setNop({ kind: 'error' })
    }
  }

  const buocCuoi = problem?.steps[problem.steps.length - 1]
  const daXong = problem?.isSolved === true
  const tongCau = taiDe.kind === 'ready' ? taiDe.questions.length : 0

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
        <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-teal-950/40 theme-light:from-teal-50 via-emerald-950/20 theme-light:via-emerald-50 to-zinc-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-xl">
              📐
            </div>
            <div className="min-w-0">
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
          {/* Chọn môn — vùng chạm ≥ 44px, cuộn ngang được nếu màn quá hẹp (không tràn trang). */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-2xl w-full sm:w-fit overflow-x-auto">
            {MON.map((m) => (
              <button
                key={m.id}
                type="button"
                aria-pressed={subject === m.id}
                onClick={() => doiMon(m.id)}
                className={`min-h-11 flex-1 sm:flex-none px-3 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  subject === m.id
                    ? 'bg-teal-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {m.nhan}
              </button>
            ))}
          </div>

          {/* Đề bài — lấy từ ngân hàng đề THẬT (bài học STEM), không phải đề mẫu viết cứng. */}
          <section
            aria-labelledby={`${titleId}-de`}
            aria-busy={taiDe.kind === 'loading' || (cauHienTai !== undefined && !problem)}
            className="p-4 rounded-2xl bg-teal-950/20 theme-light:bg-teal-50 border border-teal-500/20"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3
                id={`${titleId}-de`}
                className="text-xs font-bold text-teal-300 theme-light:text-teal-900"
              >
                Đề bài{cauHienTai ? ` · câu ${viTri + 1}/${tongCau}` : ''}
              </h3>
              {daXong && (
                <span className="text-[0.6875rem] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 theme-light:text-emerald-900 border border-emerald-500/30 font-bold">
                  ✓ ĐÃ GIẢI XONG
                </span>
              )}
            </div>

            {taiDe.kind === 'loading' && (
              <p className="text-sm text-zinc-300 mt-1">Đang tải ngân hàng đề…</p>
            )}
            {taiDe.kind === 'error' && (
              <div role="alert" className="mt-1 space-y-2">
                <p className="text-sm text-rose-300 theme-light:text-rose-900">
                  Không tải được ngân hàng đề. Kiểm tra kết nối mạng rồi thử lại.
                </p>
                <button
                  type="button"
                  onClick={() => void taiNganHang(subject)}
                  className={`${NUT_CO_BAN} bg-white/10 hover:bg-white/20 text-white`}
                >
                  Thử lại
                </button>
              </div>
            )}
            {taiDe.kind === 'ready' && !cauHienTai && (
              <p className="text-sm text-zinc-300 mt-1">
                Môn này chưa có câu nào có đáp án tự chấm được.
              </p>
            )}
            {cauHienTai && (
              <>
                <p className="text-sm text-white font-medium mt-1">{cauHienTai.problemStatement}</p>
                <p className="mt-2 text-xs text-zinc-400">
                  Lớp {cauHienTai.grade} · {cauHienTai.topic} · bài “{cauHienTai.lessonTitle}”
                </p>
                {cauHienTai.reviewStatus === 'draft' && (
                  <p className="mt-1 text-xs text-amber-300 theme-light:text-amber-900">
                    ⚠ Bản nháp — đề lấy từ bài học chưa duyệt chuyên môn.
                  </p>
                )}
                {moPhienLoi && (
                  <div role="alert" className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-sm text-rose-300 theme-light:text-rose-900">
                      Không mở được bài này.
                    </p>
                    <button
                      type="button"
                      onClick={() => void moPhien(cauHienTai)}
                      className={`${NUT_CO_BAN} bg-white/10 hover:bg-white/20 text-white`}
                    >
                      Thử lại
                    </button>
                  </div>
                )}
                {tongCau > 1 && (
                  <button
                    type="button"
                    onClick={deKhac}
                    className={`${NUT_CO_BAN} mt-3 bg-white/10 hover:bg-white/20 text-teal-200 theme-light:text-teal-900`}
                  >
                    Đề khác →
                  </button>
                )}
              </>
            )}
          </section>

          {/* Trình đọc màn hình nghe được kết luận của bước VỪA kiểm (nhãn có ký hiệu + chữ, không
              chỉ dựa vào màu). */}
          <p role="status" className="sr-only">
            {buocCuoi
              ? `Bước ${buocCuoi.stepNumber}: ${nhanKetQuaBuoc(buocCuoi.validation)}. ${buocCuoi.validation?.feedback ?? ''}`
              : ''}
          </p>

          {/* Steps Timeline */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-zinc-400">
              Các bước biến đổi ({problem?.steps.length || 0})
            </h3>

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
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-zinc-300">
                        Bước {step.stepNumber}:
                      </span>
                      <span
                        className={`text-[0.6875rem] font-bold px-2 py-0.5 rounded-full ${hienThi.huyHieu}`}
                      >
                        {nhanKetQuaBuoc(step.validation)}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-white bg-black/30 p-2 rounded-xl border border-white/5 break-words">
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

          {/* Gợi ý Socratic — luôn là CÂU HỎI dẫn dắt (không phải AI, không chứa đáp số). */}
          {goiY && (
            <div
              role="status"
              className="p-3.5 rounded-2xl bg-amber-950/30 theme-light:bg-amber-50 border border-amber-500/30 text-amber-200 theme-light:text-amber-900 text-xs animate-fade-in flex items-start gap-2"
            >
              <span className="text-base" aria-hidden="true">
                💡
              </span>
              <div className="flex-1">
                <span className="font-bold">Gợi ý bậc {goiY.level}/3 (câu hỏi dẫn dắt): </span>
                <span>{goiY.hintText}</span>
              </div>
            </div>
          )}
          {loiGoiY && (
            <p role="alert" className="text-xs text-rose-300 theme-light:text-rose-900">
              Không lấy được gợi ý. Thử lại sau giây lát.
            </p>
          )}

          {/* Nộp đáp số cuối — chấm theo đáp án của bài học (submit_solution). */}
          {problem && (
            <form
              onSubmit={handleSubmit}
              className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-2"
            >
              <label htmlFor={answerInputId} className="block text-xs font-bold text-zinc-300">
                Đáp số cuối
              </label>
              <p id={answerHelpId} className="text-xs text-zinc-400">
                Ghi đáp số của câu hỏi
                {cauHienTai?.needsUnit ? ' (nhớ kèm đơn vị)' : ''}
                {cauHienTai?.expectsFraction ? ' (dạng phân số a/b)' : ''}.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id={answerInputId}
                  type="text"
                  value={dapSo}
                  onChange={(e) => setDapSo(e.target.value)}
                  aria-describedby={answerHelpId}
                  disabled={daXong || nop.kind === 'submitting'}
                  className="w-full sm:flex-1 min-h-11 px-4 rounded-2xl bg-zinc-900 border border-white/10 focus:border-teal-500 focus:outline-none text-sm text-white placeholder-zinc-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={daXong || !dapSo.trim() || nop.kind === 'submitting'}
                  className={`${NUT_CO_BAN} bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md`}
                >
                  {nop.kind === 'submitting' ? 'Đang chấm…' : 'Nộp lời giải'}
                </button>
              </div>
              {nop.kind === 'error' && (
                <p role="alert" className="text-xs text-rose-300 theme-light:text-rose-900">
                  Chưa nộp được — kiểm tra kết nối rồi thử lại.
                </p>
              )}
              {nop.kind === 'done' && (
                <div role="status" className="text-xs space-y-1">
                  <p
                    className={
                      nop.result.correct
                        ? 'font-bold text-emerald-300 theme-light:text-emerald-900'
                        : 'text-rose-300 theme-light:text-rose-900'
                    }
                  >
                    {nop.result.correct ? '✓ ' : '✗ '}
                    {NHAC_KHI_NOP_SAI[nop.result.reason]}
                  </p>
                  {nop.result.explanation && (
                    <p className="text-zinc-300">
                      <span className="font-bold">Lời giải của bài học: </span>
                      {nop.result.explanation}
                    </p>
                  )}
                </div>
              )}
            </form>
          )}
        </div>

        {/* Ô nhập bước — mobile-first: 390px thì ô nhập một hàng, hai nút một hàng bên dưới. */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-zinc-950/90">
          <form onSubmit={handleAddStep} className="space-y-2">
            {loiKiemBuoc && (
              <p role="alert" className="text-xs text-rose-300 theme-light:text-rose-900">
                Không kiểm được bước này — kiểm tra kết nối rồi thử lại.
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <label htmlFor={stepInputId} className="sr-only">
                Bước giải tiếp theo
              </label>
              <input
                id={stepInputId}
                type="text"
                value={latexInput}
                onChange={(e) => setLatexInput(e.target.value)}
                placeholder={VI_DU_BUOC[subject]}
                disabled={isValidating || !problem || daXong}
                className="w-full sm:flex-1 min-w-0 min-h-11 px-4 rounded-2xl bg-zinc-900 border border-white/10 focus:border-teal-500 focus:outline-none text-sm text-white placeholder-zinc-500 disabled:opacity-50"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isValidating || !latexInput.trim() || !problem || daXong}
                  className={`${NUT_CO_BAN} flex-1 sm:flex-none bg-teal-500 hover:bg-teal-400 text-zinc-950 shadow-md active:scale-95`}
                >
                  {isValidating ? 'Đang kiểm…' : 'Kiểm tra'}
                </button>
                <button
                  type="button"
                  onClick={handleGetHint}
                  disabled={!problem || daXong || dangLayGoiY}
                  className={`${NUT_CO_BAN} flex-1 sm:flex-none bg-white/10 hover:bg-white/20 text-amber-300 theme-light:text-amber-900`}
                >
                  <span aria-hidden="true">💡</span> Gợi ý
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
