import { useState } from 'react'
import { ListChecks, Send } from 'lucide-react'
import type { InteractiveQuestion } from '@dhcb/core-contracts/interactiveQuestion'
import { buildAnswerText, type SelectionMap } from './interactiveAnswer'

interface InteractiveQuestionCardProps {
  questions: InteractiveQuestion[]
  /** Gửi câu trả lời đã gom thành một tin nhắn văn bản vào luồng chat như bình thường. */
  onSubmit: (answerText: string) => void
  /** Khoá thẻ khi AI đang trả lời câu khác (tránh gửi chồng lượt). */
  disabled?: boolean
}

/**
 * Thẻ câu hỏi tick chọn của Bạn Đồng Hành AI.
 *
 * Người dùng bấm chọn thay vì gõ tay; bấm "Gửi câu trả lời" sẽ gom mọi lựa chọn thành MỘT tin
 * nhắn tiếng Việt dễ đọc rồi đẩy vào luồng chat sẵn có — nhờ vậy AI vẫn xử lý như tin nhắn thường
 * và cơ chế ghi nhận hồ sơ (`update_fact`) không phải sửa gì.
 */
export default function InteractiveQuestionCard({
  questions,
  onSubmit,
  disabled = false,
}: InteractiveQuestionCardProps) {
  const [selections, setSelections] = useState<SelectionMap>({})
  const [freeTexts, setFreeTexts] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const toggleOption = (question: InteractiveQuestion, optionId: string) => {
    setSelections((prev) => {
      const current = prev[question.id] ?? []
      if (!question.multi) {
        // Chọn một: bấm lại đúng lựa chọn đang chọn thì bỏ chọn (người dùng đổi ý được).
        return { ...prev, [question.id]: current[0] === optionId ? [] : [optionId] }
      }
      return {
        ...prev,
        [question.id]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      }
    })
  }

  const answerText = buildAnswerText(questions, selections, freeTexts)
  const canSubmit = answerText.length > 0 && !disabled && !submitted

  const handleSubmit = () => {
    if (!canSubmit) return
    setSubmitted(true)
    onSubmit(answerText)
  }

  return (
    <div className="mt-4 pt-3.5 border-t border-zinc-800/80 space-y-3.5">
      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-200">
        <ListChecks className="w-4 h-4 text-accent-400 theme-light:text-accent-800" />
        Chọn nhanh câu trả lời ({questions.length} câu):
      </div>

      {questions.map((question) => {
        const chosen = selections[question.id] ?? []
        return (
          <fieldset
            key={question.id}
            disabled={submitted || disabled}
            className="bg-zinc-950/80 border border-zinc-800/90 rounded-2xl p-3.5 space-y-2.5 shadow-inner disabled:opacity-70"
          >
            <legend className="sr-only">{question.text}</legend>
            <p className="text-[0.8125rem] font-semibold text-zinc-100 leading-relaxed">
              {question.text}
              <span className="ml-1.5 font-normal text-[0.6875rem] text-zinc-400">
                {question.multi ? '(chọn nhiều)' : '(chọn một)'}
              </span>
            </p>

            <div className="flex flex-col gap-1.5">
              {question.options.map((option) => {
                const isChosen = chosen.includes(option.id)
                return (
                  <label
                    key={option.id}
                    className={`flex items-center gap-2.5 min-h-[44px] px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors border ${
                      isChosen
                        ? 'bg-accent-500/15 border-accent-500/50 text-zinc-100'
                        : 'bg-zinc-900/70 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/70'
                    }`}
                  >
                    <input
                      type={question.multi ? 'checkbox' : 'radio'}
                      name={`iq-${question.id}`}
                      checked={isChosen}
                      onChange={() => toggleOption(question, option.id)}
                      className="w-4 h-4 shrink-0 accent-accent-500"
                    />
                    <span className="leading-snug">{option.label}</span>
                  </label>
                )
              })}
            </div>

            {question.allowFreeText && (
              <input
                type="text"
                value={freeTexts[question.id] ?? ''}
                onChange={(e) =>
                  setFreeTexts((prev) => ({ ...prev, [question.id]: e.target.value }))
                }
                placeholder="Khác… (tự viết câu trả lời của bạn)"
                aria-label={`Câu trả lời khác cho: ${question.text}`}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-zinc-900/70 border border-zinc-800/80 text-base sm:text-xs text-zinc-100 placeholder-zinc-400 outline-none focus:border-accent-500/70 transition-colors"
              />
            )}
          </fieldset>
        )
      })}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full min-h-[44px] py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
          canSubmit
            ? 'bg-accent-500 hover:bg-accent-400 text-black shadow-md active:scale-98'
            : 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
        }`}
      >
        <Send className="w-4 h-4" />
        {submitted ? 'Đã gửi câu trả lời' : 'Gửi câu trả lời đã chọn'}
      </button>

      {!submitted && answerText.length === 0 && (
        <p className="text-[0.6875rem] text-zinc-400 text-center">
          Chọn ít nhất một đáp án, hoặc cứ nhắn tin tự do bên dưới nếu bạn muốn.
        </p>
      )}
    </div>
  )
}
