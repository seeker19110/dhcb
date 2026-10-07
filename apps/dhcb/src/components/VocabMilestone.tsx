import { useState } from 'react'
import { Trophy, Target } from 'lucide-react'
import { getLearnedCount } from '../lib/vocab'

interface Props {
  userId: string
  // refreshKey: đổi giá trị này (vd sau khi học flashcard) để buộc tính lại số từ đã thuộc
  refreshKey?: number
}

// Các mốc từ vựng theo nghiên cứu ngôn ngữ học (số word families) + trình độ tương ứng.
const MILESTONES = [
  { count: 1000, label: 'Sống sót', cefr: 'A1–A2', desc: 'Hiểu ~85% hội thoại cơ bản' },
  { count: 3000, label: 'Giao tiếp', cefr: 'B1', desc: 'Hiểu ~95% lời nói hằng ngày' },
  { count: 5000, label: 'Thành thạo', cefr: 'B2–C1', desc: 'Đọc báo khá thoải mái (~98%)' },
  { count: 8000, label: 'Đọc tự do', cefr: 'C1+', desc: 'Đọc tiểu thuyết không cần tra' },
]
const GOAL = MILESTONES[MILESTONES.length - 1]!.count // mốc cuối = 8000 (mảng literal luôn có phần tử)

// Thanh tiến độ hiển thị số từ đã thuộc so với các mốc 1k/3k/5k/8k.
export default function VocabMilestone({ userId, refreshKey }: Props) {
  const [learned, setLearned] = useState(() => getLearnedCount(userId))

  // Tính lại khi userId hoặc refreshKey đổi (sau khi học flashcard) — mẫu
  // "so sánh prev trong render" thay cho setState đồng bộ trong effect.
  const recomputeKey = `${userId}|${refreshKey ?? ''}`
  const [prevKey, setPrevKey] = useState(recomputeKey)
  if (recomputeKey !== prevKey) {
    setPrevKey(recomputeKey)
    setLearned(getLearnedCount(userId))
  }

  // % vị trí trên thanh (giới hạn tối đa 100%)
  const pct = Math.min(100, (learned / GOAL) * 100)

  // Mốc kế tiếp chưa đạt (để hiện "còn bao nhiêu từ nữa")
  const next = MILESTONES.find((m) => learned < m.count)
  // Trình độ hiện tại = mốc cao nhất đã vượt
  const current = [...MILESTONES].reverse().find((m) => learned >= m.count)

  return (
    <div className="glass rounded-xl p-4 mb-4 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400 theme-light:text-amber-900" />
          <span className="text-sm font-semibold text-white">Mốc từ vựng</span>
        </div>
        <span className="text-xs text-zinc-400">
          <strong className="text-accent-300 theme-light:text-accent-900">
            {learned.toLocaleString('vi-VN')}
          </strong>{' '}
          từ đã thuộc
        </span>
      </div>

      {/* Thanh tiến độ + các vạch mốc */}
      <div className="relative h-2 bg-zinc-800 rounded-full mb-1">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-accent-500 to-accent-400 rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
        {/* Vạch đánh dấu từng mốc */}
        {MILESTONES.slice(0, -1).map((m) => (
          <div
            key={m.count}
            className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-zinc-600"
            style={{ left: `${(m.count / GOAL) * 100}%` }}
          />
        ))}
      </div>

      {/* Nhãn các mốc dưới thanh */}
      <div className="flex justify-between text-[0.6875rem] text-zinc-400 mb-3">
        <span>0</span>
        {MILESTONES.map((m) => (
          <span key={m.count} className={learned >= m.count ? 'text-accent-400 font-medium' : ''}>
            {m.count >= 1000 ? `${m.count / 1000}k` : m.count}
          </span>
        ))}
      </div>

      {/* Trạng thái hiện tại */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        {current ? (
          <span className="text-zinc-300">
            Trình độ:{' '}
            <strong className="text-accent-300 theme-light:text-accent-900">{current.label}</strong>
            <span className="text-zinc-400"> ({current.cefr})</span>
          </span>
        ) : (
          <span className="text-zinc-400">Bắt đầu học để đạt mốc đầu tiên (1.000 từ)</span>
        )}
        {next && (
          <span className="flex items-center gap-1 text-zinc-400">
            <Target className="w-3 h-3 text-zinc-400" />
            Còn{' '}
            <strong className="text-white">
              {(next.count - learned).toLocaleString('vi-VN')}
            </strong>{' '}
            từ → {next.label}
          </span>
        )}
      </div>
    </div>
  )
}
