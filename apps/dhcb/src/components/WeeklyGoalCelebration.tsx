// ── Khối nội dung ĐẠT MỤC TIÊU TUẦN — tầng (2) của SessionDone ───────────────
// (② M1, docs/research/dac-ta-nang-cap-su-pham-2026-07-15.md; gộp vào SessionDone ở P1-6/lệnh
// 8, docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md).
//
// [2026-09-17, P1-6] KHÔNG còn tự bật overlay riêng (từng bọc `Celebration`) — nội dung này
// giờ là MỘT sub-block bên trong overlay duy nhất `SessionDone`. Gate `shouldCelebrateWeeklyGoal`
// + `markWeeklyGoalCelebrated` vẫn do NƠI GỌI xử lý (giữ nguyên hành vi "chỉ mừng 1 lần/tuần").
//
// Trung thực: hàng chấm T2→CN hiện ĐÚNG ngày có học; ngày chưa tới trong tuần hiện ô mờ — không
// vẽ ✓ giả.

import { getWeeklyProgress, getWeekDays } from '../lib/weeklyGoal'

// Nhãn thứ bắt đầu từ Thứ 2 (tuần mục tiêu tính từ T2 → CN).
const DOW_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const DOW_EN = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export interface WeeklyGoalCelebrationContentProps {
  uid: string
  isA: boolean
}

/** Nội dung mục tiêu tuần (tiêu đề + hàng chấm T2→CN) — dùng làm sub-block trong `SessionDone`. */
export function WeeklyGoalCelebrationContent({ uid, isA }: WeeklyGoalCelebrationContentProps) {
  const p = getWeeklyProgress(uid)
  const days = getWeekDays(uid) // T2 → hôm nay; ngày sau hôm nay chưa có phần tử
  const labels = isA ? DOW_VI : DOW_EN

  return (
    <div className="text-center">
      <p className="text-lg font-bold text-content">
        {isA ? '🎯 Đạt mục tiêu tuần!' : '🎯 Weekly goal reached!'}
      </p>
      <p className="text-sm text-content-secondary mt-0.5">
        {isA
          ? `Bạn đã học ${p.daysDone}/${p.goal} ngày tuần này — đều đặn chính là sức mạnh!`
          : `You studied ${p.daysDone}/${p.goal} days this week — consistency is power!`}
      </p>
      {/* Hàng 7 chấm T2→CN — chấm hôm nay (cuối phần đã trôi qua) pop nổi bật */}
      <div className="flex justify-center gap-2.5 mt-3" aria-hidden="true">
        {labels.map((label, i) => {
          const d = days[i] // undefined = ngày chưa tới trong tuần
          const isToday = i === days.length - 1
          return (
            <div key={label} className="flex flex-col items-center gap-1">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[0.6875rem] font-bold ${
                  d?.active
                    ? 'bg-accent-500 text-black'
                    : d
                      ? 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      : 'bg-zinc-900 border border-zinc-800' // ngày chưa tới — ô mờ
                } ${isToday ? 'animate-pop-correct ring-2 ring-accent-400/60' : ''}`}
              >
                {d?.active ? '✓' : ''}
              </span>
              <span
                className={`text-[0.6875rem] ${isToday ? 'text-accent-400 font-bold' : 'text-zinc-500'}`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default WeeklyGoalCelebrationContent
