// apps/dhcb/src/pages/learning/practice/FillBlankQuiz.tsx — tách từ pages/learning/Practice.tsx
// (1.752 dòng) ngày 2026-09-06. S05 (2026-09-24): câu hỏi lấy từ builder thuần đã kiểm chứng
// `fillBlankQuestions.ts` — lọc câu hợp lệ TRƯỚC khi trộn/cắt, chấm theo id option, chặn chấm đôi.

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import type { DictEntry } from '../../../types'
import { shuffle } from '@dhcb/core-contracts/shuffle'
import { Button } from '@core/Button'
import { SESSION_SIZE } from './shared'
import { GameResult } from './GameChrome'
import { BLANK_MARKER, FILL_BLANK_MIN_SESSION, buildFillBlankQuestions } from './fillBlankQuestions'

// ── 4) Khôi phục câu ví dụ đã học — chọn từ đúng lấp vào chỗ trống ─────────
export function FillBlankQuiz({
  pool,
  isA,
  uiLang,
  onExit,
}: {
  pool: DictEntry[]
  isA: boolean
  uiLang: 'vi' | 'en'
  onExit: () => void
}) {
  const isUiVi = uiLang === 'vi'
  // Seed cố định suốt phiên: bốn options giữ nguyên khi đổi ngôn ngữ UI hoặc render lại.
  const [seed] = useState(() => Math.random().toString(36).slice(2))
  const items = useMemo(() => {
    const { questions } = buildFillBlankQuestions(shuffle(pool), isA ? 'A' : 'B', {
      seed,
      maxQuestions: SESSION_SIZE,
    })
    // Duyệt pool đã trộn đến khi đủ câu hợp lệ; không dựng hàng nghìn câu rồi bỏ đi.
    return questions
  }, [pool, isA, seed])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [pickedId, setPickedId] = useState<string | null>(null)
  // Guard đồng bộ: hai lần bấm trước khi React render lại vẫn chỉ chấm một lần.
  const answeredIdx = useRef(-1)
  const nextWrapRef = useRef<HTMLDivElement>(null)
  const questionRef = useRef<HTMLParagraphElement>(null)
  const movedByUser = useRef(false)
  const current = items[idx]

  // Bàn phím: chọn xong (các nút bị khoá) thì đưa focus tới "Câu tiếp theo"; sang câu mới thì
  // đưa focus về câu hỏi để trình đọc màn hình đọc câu kế tiếp.
  useEffect(() => {
    if (pickedId) nextWrapRef.current?.querySelector('button')?.focus()
  }, [pickedId])
  useEffect(() => {
    if (movedByUser.current) questionRef.current?.focus()
  }, [idx])

  if (items.length < FILL_BLANK_MIN_SESSION) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-sm text-zinc-300">
          {isUiVi
            ? 'Chưa đủ câu ví dụ phù hợp để luyện điền từ. Hãy học thêm từ mới rồi quay lại.'
            : 'Not enough suitable example sentences yet. Learn more words, then come back.'}
        </p>
        <Button onClick={onExit} variant="secondary">
          {isUiVi ? 'Về Luyện tập' : 'Back to Practice'}
        </Button>
      </div>
    )
  }

  if (!current) {
    return (
      <GameResult
        score={score}
        total={items.length}
        uiLang={uiLang}
        onRetry={() => {
          answeredIdx.current = -1
          movedByUser.current = false
          setIdx(0)
          setScore(0)
          setPickedId(null)
        }}
        onExit={onExit}
      />
    )
  }

  function choose(optionId: string) {
    if (answeredIdx.current === idx) return
    answeredIdx.current = idx
    setPickedId(optionId)
    if (optionId === current!.correctOptionId) setScore((s) => s + 1)
  }

  const answered = pickedId !== null
  const isRight = pickedId === current.correctOptionId

  return (
    <div className="space-y-5">
      <p className="text-xs text-zinc-300 text-center">
        {idx + 1}/{items.length}
      </p>
      <p
        ref={questionRef}
        tabIndex={-1}
        lang={current.targetLang}
        className="text-center text-base text-white leading-relaxed px-2 focus:outline-none"
      >
        {current.prefix}
        <span aria-hidden="true">{BLANK_MARKER}</span>
        <span className="sr-only">{isUiVi ? ' (chỗ trống) ' : ' (blank) '}</span>
        {current.suffix}
      </p>
      <div
        className="grid grid-cols-1 gap-2.5"
        role="group"
        aria-label={isUiVi ? 'Chọn từ cho chỗ trống' : 'Choose the word for the blank'}
      >
        {current.options.map((opt) => {
          const isCorrect = opt.id === current.correctOptionId
          const isPicked = opt.id === pickedId
          return (
            <button
              key={opt.id}
              type="button"
              lang={current.targetLang}
              onClick={() => choose(opt.id)}
              disabled={answered}
              className={`flex items-center justify-between px-4 py-3 min-h-11 rounded-xl text-sm font-medium border transition text-left ${
                answered && isCorrect
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 theme-light:text-emerald-800'
                  : answered && isPicked
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 theme-light:text-rose-800'
                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {opt.label}
              {answered && isCorrect && <Check className="w-4 h-4" aria-hidden="true" />}
              {answered && isPicked && !isCorrect && <X className="w-4 h-4" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
      {/* Phản hồi bằng CHỮ, không chỉ màu/icon; vùng live để trình đọc màn hình đọc kết quả. */}
      <p role="status" className="text-sm text-center text-zinc-200 min-h-5">
        {answered &&
          (isRight
            ? isUiVi
              ? 'Chính xác!'
              : 'Correct!'
            : isUiVi
              ? `Chưa đúng. Đáp án: ${current.answer}`
              : `Not quite. Answer: ${current.answer}`)}
      </p>
      {answered && (
        <div ref={nextWrapRef}>
          <Button
            onClick={() => {
              movedByUser.current = true
              setIdx((i) => i + 1)
              setPickedId(null)
            }}
            fullWidth
          >
            {isUiVi ? 'Câu tiếp theo →' : 'Next →'}
          </Button>
        </div>
      )}
    </div>
  )
}
