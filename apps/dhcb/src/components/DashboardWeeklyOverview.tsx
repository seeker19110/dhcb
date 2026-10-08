// DashboardWeeklyOverview — khối "Tuần này" ở trang Tiến độ (R3-3, UX-R3 §6.2).
//
// GỘP BA VÙNG RỜI CŨ (streak · mục tiêu tuần · lịch hoạt động) THÀNH MỘT STORY.
// Trước R3-3, Dashboard.tsx tự vẽ ba `<section>` cạnh nhau, mỗi cái có surface/viền riêng —
// nhìn như ba thẻ độc lập dù cùng trả lời một câu hỏi "tuần này tôi học thế nào?". Đặc tả
// `docs/specs/2026-09-18-ui-clarity-dashboard-progressive-disclosure.md` §6.2 gộp lại dưới
// đúng MỘT heading "Tuần này", có scope label rõ ràng vì số liệu chỉ tính hoạt động Tiếng Anh
// (storage `et_usage_*`) — người chỉ học Lập trình không được hiểu nhầm đây là tiến độ mọi môn.
import { useRef, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import ActivityCalendarCard, { type ActivityCalendarCardProps } from './ActivityCalendarCard'
import type { WeeklyProgress } from '../lib/weeklyGoal'
import { buttonClass } from '@core/buttonStyles'

// Dòng động viên theo trạng thái mục tiêu tuần — giữ nguyên logic cũ từ Dashboard.tsx.
function weeklyLine(p: WeeklyProgress, vi: boolean): string {
  if (p.achieved)
    return vi
      ? '🎉 Đã đạt mục tiêu tuần này — giữ nhịp nhé!'
      : '🎉 Weekly goal reached — keep the rhythm!'
  const left = p.goal - p.daysDone
  if (left === 1)
    return vi
      ? 'Chỉ còn 1 ngày học nữa là đạt mục tiêu tuần!'
      : 'Just 1 more study day to hit your weekly goal!'
  return vi
    ? `Đã học ${p.daysDone}/${p.goal} ngày tuần này — mỗi ngày một chút nhé!`
    : `${p.daysDone}/${p.goal} days this week — a little every day!`
}

export interface DashboardWeeklyOverviewProps {
  vi: boolean
  /** Tổng hoạt động 7 ngày gần nhất (storage English) — 0 nghĩa là chưa có evidence English. */
  weekTotal: number
  weekly: WeeklyProgress
  onChangeGoal: () => void
  calendar: Pick<
    ActivityCalendarCardProps,
    'calendar' | 'uid' | 'isDesktop' | 'weeks' | 'wdow' | 'selectedDate' | 'onSelectedDateChange'
  >
}

/**
 * Boundary "Tuần này": streak/mục tiêu/scope English/một câu narrative/lịch + chi tiết.
 * KHÔNG fetch, KHÔNG tự tạo authoritative progress — chỉ đọc props đã tính sẵn từ Dashboard.
 */
export default function DashboardWeeklyOverview({
  vi,
  weekTotal,
  weekly,
  onChangeGoal,
  calendar,
}: DashboardWeeklyOverviewProps) {
  // Mặc định MỞ SẴN theo yêu cầu người dùng (trước đây đóng, phải bấm mới thấy lịch).
  const [calendarExpanded, setCalendarExpanded] = useState(true)
  const calendarToggleRef = useRef<HTMLButtonElement>(null)
  const calendarPanelRef = useRef<HTMLDivElement>(null)
  // Chưa có hoạt động Tiếng Anh nào được ghi nhận tuần này (fixture programming-only): không
  // được suy diễn số ngày/mục tiêu từ dữ liệu rỗng, và tuyệt đối không cộng nhầm evidence của
  // môn khác vào con số English.
  const hasEnglishEvidence = weekTotal > 0 || weekly.daysDone > 0

  function toggleCalendar() {
    if (calendarExpanded) {
      const active = document.activeElement
      if (active instanceof Node && calendarPanelRef.current?.contains(active)) {
        calendarToggleRef.current?.focus()
      }
      setCalendarExpanded(false)
      return
    }
    setCalendarExpanded(true)
  }

  return (
    <section
      aria-labelledby="dashboard-weekly-overview-heading"
      className="bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 shadow-sm animate-fade-in motion-reduce:animate-none"
    >
      <div className="flex items-center gap-2 mb-1">
        <CalendarCheck className="w-4 h-4 text-accent-400" />
        <h2 id="dashboard-weekly-overview-heading" className="text-sm font-bold text-zinc-200">
          {vi ? 'Tuần này' : 'This week'}
        </h2>
      </div>
      <p className="text-xs text-zinc-400 mb-4">
        {vi ? 'Hoạt động Tiếng Anh đã ghi nhận' : 'Recorded English activity'}
      </p>

      {hasEnglishEvidence ? (
        <>
          <p className="text-sm text-zinc-300 read-measure">
            <span className="sr-only">
              {vi
                ? `Đã học ${weekly.daysDone} trên ${weekly.goal} ngày mục tiêu. `
                : `Studied ${weekly.daysDone} of ${weekly.goal} goal days. `}
            </span>
            {vi
              ? `${weekly.daysDone}/${weekly.goal} ngày · ${weekTotal} hoạt động / 7 ngày`
              : `${weekly.daysDone}/${weekly.goal} days · ${weekTotal} activities / 7 days`}
          </p>
          <p className="text-sm text-zinc-300 mt-1 read-measure">{weeklyLine(weekly, vi)}</p>
        </>
      ) : (
        <p className="text-sm text-zinc-300 read-measure">
          {vi
            ? 'Chưa có hoạt động Tiếng Anh được ghi nhận tuần này.'
            : 'No English activity recorded this week yet.'}
        </p>
      )}

      <button
        onClick={onChangeGoal}
        className="min-h-11 px-2 -ml-2 text-xs font-medium text-accent-400 theme-light:text-accent-800 hover:underline mt-2 inline-flex items-center gap-1 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        {vi ? 'Đổi mục tiêu ở Hồ sơ →' : 'Change goal in Profile →'}
      </button>

      <div className="mt-4">
        <button
          ref={calendarToggleRef}
          id="dashboard-calendar-toggle"
          type="button"
          aria-expanded={calendarExpanded}
          aria-controls="dashboard-calendar-panel"
          onClick={toggleCalendar}
          className={buttonClass({ variant: 'outline', fullWidth: true })}
        >
          {calendarExpanded
            ? vi
              ? 'Ẩn lịch hoạt động'
              : 'Hide activity calendar'
            : vi
              ? 'Xem lịch hoạt động'
              : 'View activity calendar'}
        </button>
        <div
          ref={calendarPanelRef}
          id="dashboard-calendar-panel"
          hidden={!calendarExpanded}
          className="mt-4 min-w-0"
        >
          <ActivityCalendarCard {...calendar} vi={vi} presentation="embedded" />
        </div>
      </div>
    </section>
  )
}
