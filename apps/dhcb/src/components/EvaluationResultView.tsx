import { Trophy } from 'lucide-react'
import type { Direction, EvaluationResult } from '../types'
import ShareResultCard from './ShareResultCard'
import { buildEvaluationShareContent } from '../lib/shareContent'

// Thanh điểm 0–9 dùng chung — tách riêng vì Chat/Speaking đều cần (giống ScoreBar ở Writing.tsx
// nhưng đặt ở component dùng chung để không lặp code giữa 2 trang).
function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = (score / 9) * 100
  const color = score >= 7 ? 'bg-accent-500' : score >= 5 ? 'bg-amber-500' : 'bg-red-500'
  const textColor =
    score >= 7
      ? 'text-accent-400 theme-light:text-accent-800'
      : score >= 5
        ? 'text-amber-400 theme-light:text-amber-800'
        : 'text-red-400 theme-light:text-red-700'
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-400 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-[width] duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-bold w-6 text-right ${textColor}`}>{score}</span>
    </div>
  )
}

// Màn "Kết thúc & chấm điểm" dùng chung cho Chat + Speaking — không có route/Layout riêng,
// trang gọi component này thay thế phần nội dung hội thoại khi có kết quả chấm điểm.
// Kết quả CHỈ hiện tạm trong phiên (không lưu Supabase) nên không cần đổi schema DB.
export default function EvaluationResultView({
  evaluation,
  onClose,
  dir,
  landmark = true,
}: {
  evaluation: EvaluationResult
  onClose: () => void
  dir: Direction
  /**
   * [S09c] Mặc định `true` = giữ NGUYÊN hành vi cho Chat/Speaking: component thay cả màn và tự
   * là landmark `<main>`. Bài hội thoại mẫu nhúng kết quả vào một phần `#ket-qua` BÊN TRONG
   * trang đã có `<main>` → truyền `false` để không sinh landmark main thứ hai lồng nhau.
   */
  landmark?: boolean
}) {
  const isA = dir === 'A'
  const Khung = landmark ? 'main' : 'div'
  const { scores } = evaluation
  const overall = scores.overall
  const scoreGradient =
    overall >= 7
      ? 'from-accent-400 to-accent-300'
      : overall >= 5
        ? 'from-amber-400 to-yellow-300'
        : 'from-red-400 to-orange-300'

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <Khung className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-fade-up">
        <div className="glass rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-zinc-400 mb-1">
            {isA ? 'Điểm đánh giá hội thoại' : 'Conversation score'}
          </p>
          <div
            className={`text-7xl font-black bg-gradient-to-b ${scoreGradient} bg-clip-text text-transparent leading-none py-2`}
          >
            {overall}
          </div>
          <p className="text-sm text-zinc-400 mt-3 max-w-xs mx-auto">{evaluation.encouragement}</p>
        </div>

        <div className="glass rounded-2xl p-5 space-y-3 animate-fade-in delay-100">
          <p className="text-sm font-semibold text-zinc-200 mb-4">
            {isA ? 'Chi tiết điểm thành phần' : 'Score breakdown'}
          </p>
          <ScoreBar label="Fluency & Coherence" score={scores.fluency} />
          <ScoreBar label="Lexical Resource" score={scores.lexical} />
          <ScoreBar label="Grammatical Range" score={scores.grammar} />
          {scores.pronunciation !== undefined && (
            <ScoreBar label="Pronunciation" score={scores.pronunciation} />
          )}
        </div>

        {evaluation.strengths.length > 0 && (
          <div className="glass rounded-2xl p-5 animate-fade-in delay-150">
            <p className="text-sm font-semibold text-zinc-200 mb-3">
              {isA ? 'Điểm mạnh' : 'Strengths'}
            </p>
            <ul className="space-y-2">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-400">
                  <span className="text-accent-500 shrink-0 font-bold">·</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.errors.length > 0 && (
          <div className="glass rounded-2xl p-5 animate-fade-in delay-200">
            <p className="text-sm font-semibold text-zinc-200 mb-4">
              {isA ? 'Lỗi cần sửa' : 'Errors to fix'}
              <span className="ml-2 text-xs font-normal text-zinc-400">
                ({evaluation.errors.length})
              </span>
            </p>
            <div className="space-y-3">
              {evaluation.errors.map((err, i) => (
                <div key={i} className="border border-zinc-800/80 rounded-xl overflow-hidden">
                  <div className="px-3 py-2 bg-red-500/8 border-b border-zinc-800/60">
                    <p className="text-xs text-red-400 theme-light:text-red-700 line-through">
                      {err.original}
                    </p>
                  </div>
                  <div className="px-3 py-2 bg-accent-500/6 border-b border-zinc-800/60">
                    <p className="text-xs text-accent-400 theme-light:text-accent-800">
                      → {err.corrected}
                    </p>
                  </div>
                  <div className="px-3 py-2">
                    <p className="text-xs text-zinc-400">{err.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {evaluation.suggestions.length > 0 && (
          <div className="glass rounded-2xl p-5 animate-fade-in delay-250">
            <p className="text-sm font-semibold text-zinc-200 mb-3">
              {isA ? 'Gợi ý cải thiện' : 'Suggestions to improve'}
            </p>
            <ul className="space-y-2">
              {evaluation.suggestions.map((s, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-400">
                  <span className="text-accent-500 shrink-0 font-bold">·</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <ShareResultCard {...buildEvaluationShareContent(evaluation, isA)} isA={isA} />

        <button
          onClick={onClose}
          aria-label={isA ? 'Đóng và tiếp tục hội thoại' : 'Close and continue conversation'}
          className="w-full flex items-center justify-center gap-2 border border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-xl py-3 text-sm transition hover:bg-zinc-800/40 active:scale-[0.99]"
        >
          {isA ? 'Tiếp tục hội thoại' : 'Continue conversation'}
        </button>
      </Khung>
    </div>
  )
}
