// apps/dhcb/src/components/Home/WeekRhythm.tsx — 7 chấm tuần + nhiệm vụ + huy hiệu mới nhất.
//
// Đặc tả: docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md §P1-5 (lệnh 7).
//
// LUẬT SẢN PHẨM (bất biến, có test canh — xem `weekRhythm.test.ts`/`.test.tsx`): trang chủ
// KHÔNG BAO GIỜ hiện con số chẩn đoán (%, band CEFR, bậc P1-6) — component này chỉ đếm NGÀY
// CÓ HỌC / NHIỆM VỤ / HUY HIỆU, không suy ra trình độ.
import { Link } from 'react-router-dom'
import type { DayDot, WeekRhythmModel } from '../../lib/home/weekRhythm'

const DOT_LABEL_VI: Record<DayDot, string> = {
  done: 'có học',
  missed: 'chưa học',
  'today-pending': 'hôm nay, chưa học',
  future: 'chưa tới',
}

const WEEKDAY_LABELS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

// Ký hiệu chấm — ● done · ○ missed · ◐ today-pending · ▢ future (đúng theo đặc tả).
function dotGlyph(dot: DayDot): string {
  switch (dot) {
    case 'done':
      return '●'
    case 'missed':
      return '○'
    case 'today-pending':
      return '◐'
    case 'future':
      return '▢'
  }
}

function dotClass(dot: DayDot): string {
  if (dot === 'done') return 'bg-accent-500/20 text-accent-400 border-accent-500/40'
  if (dot === 'future') return 'bg-transparent text-content-muted/50 border-line-strong opacity-50'
  if (dot === 'today-pending') return 'bg-transparent text-accent-400 border-accent-500/40'
  return 'bg-transparent text-content-muted border-line-strong'
}

export interface WeekRhythmProps {
  model: WeekRhythmModel
}

export default function WeekRhythm({ model }: WeekRhythmProps) {
  if (!model.visible) return null

  const ariaLabel = `Tuần này học ${model.daysDone} trên 7 ngày`

  return (
    <Link
      to="/nhiem-vu"
      className="block rounded-3xl border border-line-strong bg-zinc-900/90 p-4 sm:p-5 transition hover:border-accent-500/40 animate-fade-in"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1.5" role="img" aria-label={ariaLabel}>
          {model.dots.map((dot, i) => (
            <span
              key={WEEKDAY_LABELS_VI[i]}
              data-dot={dot}
              title={`${WEEKDAY_LABELS_VI[i]}: ${DOT_LABEL_VI[dot]}`}
              className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs leading-none ${dotClass(dot)}`}
            >
              {dotGlyph(dot)}
            </span>
          ))}
        </div>
        <span className="text-sm font-semibold text-content">Tuần này {model.daysDone}/7 ngày</span>
      </div>

      {(model.quests || model.latestBadge) && (
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-content-secondary">
          {model.quests && (
            <span>
              Nhiệm vụ {model.quests.done}/{model.quests.total}
            </span>
          )}
          {model.latestBadge && <span>Huy hiệu mới: {model.latestBadge.label}</span>}
        </div>
      )}
    </Link>
  )
}
