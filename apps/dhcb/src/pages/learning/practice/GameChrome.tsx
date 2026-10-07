// apps/dhcb/src/pages/learning/practice/GameChrome.tsx — tách từ pages/learning/Practice.tsx ngày 2026-09-06, mã GIỮ NGUYÊN.
// Hai khung dùng chung của mọi mini-game: màn kết quả + thanh tiêu đề.

import { RotateCcw } from 'lucide-react'

// ── Kết quả cuối phiên (dùng chung cho mọi mini-game) ─────────────────────
export function GameResult({
  score,
  total,
  uiLang,
  onRetry,
  onExit,
}: {
  score: number
  total: number
  // Giữ tương thích caller; nhãn kết quả chỉ theo uiLang.
  isA?: boolean
  uiLang: 'vi' | 'en'
  onRetry: () => void
  onExit: () => void
}) {
  const isUiVi = uiLang === 'vi'
  const pct = total > 0 ? (score / total) * 100 : 0
  const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '🌟' : '💪'

  return (
    <div className="text-center space-y-6 py-10 max-w-sm mx-auto animate-fade-up">
      <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-accent-500/20 to-indigo-500/10 border border-accent-500/30 flex items-center justify-center text-4xl shadow-lg">
        {emoji}
      </div>
      <div>
        <p className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
          {score}
          <span className="text-2xl text-zinc-500 font-bold">/{total}</span>
        </p>
        <p className="text-sm font-medium text-zinc-400 mt-1.5">
          {isUiVi ? 'Điểm phiên luyện tập này' : 'Score for this session'}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={onRetry}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 min-h-11 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm font-semibold hover:bg-zinc-800 hover:border-zinc-700 transition duration-200 active:scale-95 shadow-sm"
        >
          <RotateCcw className="w-4 h-4" /> {isUiVi ? 'Làm lại' : 'Retry'}
        </button>
        <button
          onClick={onExit}
          className="flex-1 px-5 py-3.5 min-h-11 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 text-white text-sm font-bold hover:from-accent-400 hover:to-accent-500 transition duration-200 shadow-md active:scale-95"
        >
          {isUiVi ? 'Về Luyện tập' : 'Back to Practice'}
        </button>
      </div>
    </div>
  )
}

export function MiniHeader({
  title,
  sub,
  uiLang,
  onBack,
}: {
  title: string
  sub: string
  uiLang: 'vi' | 'en'
  onBack: () => void
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-xs text-zinc-400">{sub}</p>
      </div>
      <button
        onClick={onBack}
        aria-label={uiLang === 'vi' ? 'Về Luyện tập' : 'Back to Practice'}
        className="min-h-11 min-w-11 text-xs text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800/60 transition"
      >
        ✕
      </button>
    </div>
  )
}
