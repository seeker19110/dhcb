import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDialogBehavior } from '../useDialogBehavior'
import {
  MicroDrillQuestion,
  type NeuralDrillSubmission,
  type NeuralDrillReview,
} from '@dhcb/core-contracts/neuralCurriculum'
import { Zap, CheckCircle2, XCircle, X, ArrowRight, Trophy } from 'lucide-react'

interface MicroDrillModalProps {
  isOpen: boolean
  onClose: () => void
  drills: MicroDrillQuestion[]
  onComplete: (answers: NeuralDrillSubmission['answers']) => Promise<NeuralDrillReview>
}

export default function MicroDrillModal({
  isOpen,
  onClose,
  drills,
  onComplete,
}: MicroDrillModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [isAnswered, setIsAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [answers, setAnswers] = useState<NeuralDrillSubmission['answers']>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [review, setReview] = useState<NeuralDrillReview | null>(null)
  const submissionVersion = useRef(0)

  // Đóng = trả bài luyện về trạng thái đầu rồi mới gọi onClose (giữ nguyên hành vi cũ
  // của nút X). Khai báo TRƯỚC early-return để hook hộp thoại dùng được — nhờ vậy phím
  // Escape và bấm ra nền cũng reset y hệt bấm X.
  const handleReset = useCallback(() => {
    submissionVersion.current++
    setSaving(false)
    setCurrentIndex(0)
    setSelectedOption(null)
    setIsAnswered(false)
    setScore(0)
    setFinished(false)
    setAnswers([])
    setError('')
    setReview(null)
    onClose()
  }, [onClose])

  // 6 hành vi a11y bắt buộc của hộp thoại (Escape, bẫy tiêu điểm, khoá cuộn nền…).
  const { dialogProps, titleId, backdropProps } = useDialogBehavior(handleReset, isOpen)

  if (!isOpen || drills.length === 0) return null
  const currentDrill = drills[currentIndex] || drills[0]

  const handleOptionClick = (option: string) => {
    if (isAnswered || !currentDrill) return
    setAnswers((previous) => [...previous, { drillId: currentDrill.id, answer: option }])
    setSelectedOption(option)
    setIsAnswered(true)
    const correct = option.toLowerCase() === currentDrill.correctAnswer.toLowerCase()
    if (correct) {
      setScore((s) => s + 1)
    }
  }

  const handleNext = async () => {
    const isLast = currentIndex >= drills.length - 1
    if (isLast) {
      if (saving) return
      const version = ++submissionVersion.current
      setSaving(true)
      setError('')
      try {
        const result = await onComplete(answers)
        if (version !== submissionVersion.current) return
        setReview(result)
        setFinished(true)
      } catch {
        if (version === submissionVersion.current) {
          setError('Chưa lưu được bài luyện. Bấm Hoàn tất để thử lại.')
        }
      } finally {
        if (version === submissionVersion.current) setSaving(false)
      }
    } else {
      setCurrentIndex((i) => i + 1)
      setSelectedOption(null)
      setIsAnswered(false)
    }
  }

  // Portal ra document.body: hộp thoại nằm trong khung studio — tổ tiên có `transform` hoặc
  // `space-y-*` (lề dưới 16px) làm lớp phủ `fixed inset-0` lệch/co lại (changelog 0474).
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      {...backdropProps}
    >
      <div
        {...dialogProps}
        className="relative w-full max-w-lg rounded-2xl border border-sky-500/40 bg-zinc-900 p-6 shadow-2xl max-h-[90dvh] overflow-y-auto focus:outline-none"
      >
        <button
          type="button"
          onClick={handleReset}
          aria-label="Đóng"
          className="tap-44 absolute top-2 right-2 w-11 h-11 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-100"
        >
          <X className="w-5 h-5" />
        </button>

        {!finished && currentDrill ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 theme-light:text-sky-900 border border-sky-500/30">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 id={titleId} className="text-sm font-bold text-zinc-100">
                    Micro-Drill 2 Phút
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Câu {currentIndex + 1} / {drills.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-sky-400 theme-light:text-sky-900 font-mono">
                Score: {score}/{drills.length}
              </div>
            </div>

            <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-800">
              <p className="text-sm font-semibold text-zinc-100 mb-1 leading-relaxed font-sans">
                {currentDrill.promptEn}
              </p>
              <p className="text-xs text-zinc-400">{currentDrill.promptVi}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {currentDrill.options.map((opt, idx) => {
                const isSelected = selectedOption === opt
                const isCorrect = opt.toLowerCase() === currentDrill.correctAnswer.toLowerCase()
                let btnStyle = 'bg-zinc-950 text-zinc-200 border-zinc-800 hover:border-sky-500'

                if (isAnswered) {
                  if (isCorrect) {
                    btnStyle =
                      'bg-emerald-950/60 theme-light:bg-emerald-100 text-emerald-300 theme-light:text-emerald-900 border-emerald-500 shadow-md shadow-emerald-500/20'
                  } else if (isSelected) {
                    btnStyle =
                      'bg-rose-950/60 theme-light:bg-rose-100 text-rose-300 theme-light:text-rose-900 border-rose-500'
                  } else {
                    btnStyle = 'opacity-40 border-zinc-800'
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOptionClick(opt)}
                    className={
                      'flex items-center justify-between p-3 rounded-xl text-xs font-bold border transition ' +
                      btnStyle
                    }
                  >
                    <span>{opt}</span>
                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 theme-light:text-emerald-900" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-rose-400 theme-light:text-rose-900" />
                    )}
                  </button>
                )
              })}
            </div>

            {error && (
              <p role="alert" className="text-sm text-zinc-100">
                {error}
              </p>
            )}
            {isAnswered && (
              <div className="rounded-xl bg-sky-950/30 border border-sky-500/30 p-3 flex flex-col gap-2 animate-fade-in">
                <p className="text-xs text-sky-200 theme-light:text-sky-900 font-medium">
                  💡 {currentDrill.explanationVi}
                </p>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={saving}
                  className="self-end flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-zinc-950 hover:bg-sky-400 transition shadow-lg"
                >
                  <span>
                    {saving
                      ? 'Đang lưu…'
                      : currentIndex < drills.length - 1
                        ? 'Câu tiếp theo'
                        : 'Hoàn tất'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-6 space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 theme-light:text-amber-900 border border-amber-500/40 shadow-xl">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h3 id={titleId} className="text-base font-bold text-zinc-100">
                Hoàn tất bài luyện vi mô!
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Bạn đã trả lời đúng {review?.correctCount ?? score} / {drills.length} câu.{' '}
                {review?.recorded ? 'Kết quả đã được lưu.' : 'Đã ôn lại bài; điểm không cộng lặp.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-sky-500 text-zinc-950 hover:bg-sky-400 transition shadow-lg"
            >
              Đóng
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
