// apps/dhcb/src/lib/home/weekRhythm.ts — Hàm THUẦN dựng dữ liệu cho `WeekRhythm` (P1-5).
//
// Đặc tả: docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md §P1-5 (lệnh 7).
//
// "Tuần này N/7 ngày" đếm SỐ NGÀY CÓ HỌC — không phải phần trăm, không phải so mục tiêu
// tuần (mục tiêu tuần vẫn ở `/tien-do`, xem `weeklyGoal.ts`). Chấm "done" chỉ vẽ khi
// `DayActivity.active` THẬT (không vẽ ✓ giả) — cùng nguyên tắc với `WeeklyGoalCelebration`.
import type { DayActivity } from '../stats'
import type { QuestsStatus } from '../quests'

export type DayDot = 'done' | 'missed' | 'today-pending' | 'future'

export interface WeekRhythmModel {
  dots: DayDot[] // luôn length 7, index 0 = T2
  daysDone: number // 0..7
  quests?: { done: number; total: number }
  latestBadge?: { id: string; label: string }
  visible: boolean // false = không render gì
}

export interface BuildWeekRhythmInput {
  weekDays: DayActivity[] // getWeekDays(uid): T2 → hôm nay (đã trôi qua, kể cả hôm nay)
  todayIndex: number // 0..6 — vị trí hôm nay trong tuần (0 = T2)
  streak: number
  quests: QuestsStatus | null
  latestBadge: { id: string; label: string } | null
}

// Đếm nhiệm vụ "đủ điều kiện nhận thưởng hôm nay" — server tự tính đã claim hay chưa
// (canClaim=false sau khi claim), nên "done" = KHÔNG còn canClaim, "total" = tổng số mục
// có thể quy về nhiệm vụ (chia sẻ + streak + mỗi cấp CEFR). Referral không tính (không có
// hạn "hôm nay", là cơ chế dài hạn khác nhóm nhiệm vụ ngày/tuần).
function countQuests(quests: QuestsStatus | null): { done: number; total: number } | undefined {
  if (!quests) return undefined
  // share/streak: "done" = KHÔNG canClaim (đã nhận hoặc chưa đủ điều kiện — cùng coi là xong lượt này).
  const activeShare = quests.share.rewardDays > 0
  const activeStreak = quests.streak.rewardDays > 0
  const doneShare = activeShare && !quests.share.canClaim ? 1 : 0
  const doneStreak = activeStreak && !quests.streak.canClaim ? 1 : 0
  const doneCefr = quests.cefrExams.filter((e) => e.claimed).length
  return {
    done: doneShare + doneStreak + doneCefr,
    total: Number(activeShare) + Number(activeStreak) + quests.cefrExams.length,
  }
}

export function buildWeekRhythm(input: BuildWeekRhythmInput): WeekRhythmModel {
  const { weekDays, todayIndex, streak, quests, latestBadge } = input

  const dots: DayDot[] = []
  for (let i = 0; i < 7; i++) {
    if (i < todayIndex) {
      // Ngày đã qua (trước hôm nay): có trong weekDays nếu app đã ghi nhận.
      dots.push(weekDays[i]?.active ? 'done' : 'missed')
    } else if (i === todayIndex) {
      dots.push(weekDays[i]?.active ? 'done' : 'today-pending')
    } else {
      dots.push('future')
    }
  }

  const daysDone = dots.filter((d) => d === 'done').length
  const weekEmpty = daysDone === 0
  const visible = !(weekEmpty && streak === 0)

  return {
    dots,
    daysDone,
    quests: countQuests(quests),
    latestBadge: latestBadge ?? undefined,
    visible,
  }
}
