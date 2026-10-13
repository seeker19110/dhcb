// CompanionBreakReminder — lời nhắc nghỉ khi trẻ trò chuyện lâu với Bạn Đồng Hành (GĐ4b).
//
// Đặc tả: docs/specs/2026-10-13-ban-dong-hanh-gd4b-nhac-nghi.md (changelog 0631).
// Câu chữ do NGƯỜI viết sẵn (không gọi AI), nói rõ "mình là bạn đồng hành AI" (California SB 243),
// gợi ý việc cụ thể, KHÔNG câu tội lỗi, KHÔNG nhắc chuỗi ngày. Khối `role="status"` — cú hích nhẹ,
// không phải hộp thoại chặn.
import { Coffee } from 'lucide-react'
import { buttonClass } from '@core/buttonStyles'
import { BREAK_REMINDER_COPY, type BreakAgeGroup } from '../../lib/companionBreakReminder'

const HEADING_ID = 'companion-break-reminder-heading'

interface Props {
  ageGroup: BreakAgeGroup
  minutes: number
  onBreak: () => void
  onSnooze: () => void
}

export default function CompanionBreakReminder({ ageGroup, minutes, onBreak, onSnooze }: Props) {
  const copy = BREAK_REMINDER_COPY[ageGroup]
  return (
    <section
      role="status"
      aria-labelledby={HEADING_ID}
      data-testid="companion-break-reminder"
      className="mb-3 flex flex-col gap-3 rounded-2xl border border-accent-500/30 bg-accent-500/10 p-4 sm:flex-row sm:items-center"
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-accent-500/30 bg-accent-500/15 text-accent-300 theme-light:text-accent-800">
          <Coffee aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 id={HEADING_ID} className="text-base font-bold text-content">
            {copy.title}
          </h2>
          <p className="text-sm leading-relaxed text-content-secondary">{copy.body(minutes)}</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:shrink-0 sm:flex-row">
        <button
          type="button"
          onClick={onBreak}
          className={buttonClass({ className: 'tap-44 w-full sm:w-auto' })}
        >
          Mình nghỉ đây
        </button>
        <button
          type="button"
          onClick={onSnooze}
          className={buttonClass({ variant: 'outline', className: 'tap-44 w-full sm:w-auto' })}
        >
          Thêm một chút
        </button>
      </div>
    </section>
  )
}
