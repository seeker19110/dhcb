// ParsonsStep — bước ⑤ "Xếp code": ghép các dòng ĐÃ CHO về đúng thứ tự (PR-UX2).
//
// Bậc thang giữa "đọc hiểu" và "tự viết": học viên chưa phải nghĩ ra câu lệnh, nhưng đã phải
// nắm được trình tự chương trình chạy. Xáo trộn là tất định theo id bài (parsonsShuffle) nên
// mở lại bài không bị đảo khác đi.
import { CheckCircle2 } from 'lucide-react'
import { PARSONS_COPY } from '../../lib/feedbackCopy'
import { buttonClass } from '@core/buttonStyles'

interface Props {
  prompt: string
  /** Kho dòng đã xáo trộn (thứ tự hiển thị). */
  shuffledLines: string[]
  /** Các dòng học viên đã xếp, theo thứ tự. */
  arranged: string[]
  result: 'correct' | 'wrong' | null
  onArrangedChange: (lines: string[]) => void
  onCheck: () => void
}

export default function ParsonsStep({
  prompt,
  shuffledLines,
  arranged,
  result,
  onArrangedChange,
  onCheck,
}: Props) {
  // Dòng trùng nội dung xuất hiện nhiều lần trong kho: chỉ ẩn đúng số lần đã dùng.
  const remaining = shuffledLines.filter((line) => {
    const used = arranged.filter((a) => a === line).length
    const total = shuffledLines.filter((s) => s === line).length
    return used < total
  })

  return (
    <section className="space-y-3">
      <p className="text-sm text-zinc-300">{prompt}</p>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-zinc-400 uppercase">
          Bài của bạn (bấm dòng để trả lại kho)
        </p>
        <div className="min-h-[64px] rounded-2xl border border-dashed border-zinc-700 bg-zinc-950 p-2 space-y-1">
          {arranged.map((line, i) => (
            <button
              key={`${line}-${i}`}
              onClick={() => onArrangedChange(arranged.filter((_, idx) => idx !== i))}
              className="tap-44 w-full text-left px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-sm text-zinc-100 whitespace-pre hover:border-amber-500/50"
            >
              {line}
            </button>
          ))}
          {arranged.length === 0 && (
            <p className="text-xs text-zinc-500 p-2">
              Bấm các dòng ở kho bên dưới theo đúng thứ tự…
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-zinc-400 uppercase">Kho dòng code (đã xáo trộn)</p>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-2 space-y-1">
          {remaining.map((line, i) => (
            <button
              key={`${line}-${i}`}
              onClick={() => onArrangedChange([...arranged, line])}
              className="tap-44 w-full text-left px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-sm text-zinc-200 whitespace-pre hover:border-accent-500/60"
            >
              {line}
            </button>
          ))}
        </div>
      </div>

      <button onClick={onCheck} disabled={arranged.length === 0} className={buttonClass()}>
        <CheckCircle2 className="w-4 h-4" />
        <span>Kiểm tra thứ tự</span>
      </button>

      {result === 'correct' && (
        <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-zinc-100">
          {PARSONS_COPY.dung}
        </p>
      )}
      {result === 'wrong' && (
        <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-zinc-100">
          {PARSONS_COPY.sai}
        </p>
      )}
    </section>
  )
}
