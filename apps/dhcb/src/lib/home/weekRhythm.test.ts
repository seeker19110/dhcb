// weekRhythm.test.ts — bảng ca cho `buildWeekRhythm` (P1-5, lệnh 7).
import { describe, it, expect } from 'vitest'
import { buildWeekRhythm, type BuildWeekRhythmInput } from './weekRhythm'
import type { DayActivity } from '../stats'

function day(active: boolean, dow = 0): DayActivity {
  return { date: '2026-09-01', dow, count: active ? 1 : 0, active }
}

function base(over: Partial<BuildWeekRhythmInput> = {}): BuildWeekRhythmInput {
  return {
    weekDays: [],
    todayIndex: 0,
    streak: 0,
    quests: null,
    latestBadge: null,
    ...over,
  }
}

describe('buildWeekRhythm', () => {
  it('T2, chưa học hôm nay → today-pending + 6 future', () => {
    const m = buildWeekRhythm(base({ weekDays: [day(false)], todayIndex: 0 }))
    expect(m.dots).toEqual([
      'today-pending',
      'future',
      'future',
      'future',
      'future',
      'future',
      'future',
    ])
    expect(m.daysDone).toBe(0)
  })

  it('CN, đủ 7 ngày → toàn "done"', () => {
    const weekDays = Array.from({ length: 7 }, () => day(true))
    const m = buildWeekRhythm(base({ weekDays, todayIndex: 6, streak: 7 }))
    expect(m.dots).toEqual(['done', 'done', 'done', 'done', 'done', 'done', 'done'])
    expect(m.daysDone).toBe(7)
  })

  it('giữa tuần (T5, index 3) có nghỉ 1 ngày', () => {
    const weekDays = [day(true), day(true), day(false), day(true)]
    const m = buildWeekRhythm(base({ weekDays, todayIndex: 3, streak: 2 }))
    expect(m.dots).toEqual(['done', 'done', 'missed', 'done', 'future', 'future', 'future'])
    expect(m.daysDone).toBe(3)
  })

  it('hôm nay chưa học, giữa tuần → dot "today-pending" đúng vị trí', () => {
    const weekDays = [day(true), day(true), day(false)]
    const m = buildWeekRhythm(base({ weekDays, todayIndex: 2, streak: 1 }))
    expect(m.dots[2]).toBe('today-pending')
  })

  it('tuần rỗng (không ngày nào học) + streak 0 → ẩn hoàn toàn', () => {
    const weekDays = [day(false), day(false)]
    const m = buildWeekRhythm(base({ weekDays, todayIndex: 1, streak: 0 }))
    expect(m.visible).toBe(false)
  })

  it('tuần rỗng nhưng streak > 0 (vé nghỉ streak, chưa học tuần này) → vẫn hiện', () => {
    const weekDays = [day(false), day(false)]
    const m = buildWeekRhythm(base({ weekDays, todayIndex: 1, streak: 5 }))
    expect(m.visible).toBe(true)
    expect(m.daysDone).toBe(0)
  })

  it('có ít nhất 1 ngày học → luôn hiện dù streak 0', () => {
    const weekDays = [day(true)]
    const m = buildWeekRhythm(base({ weekDays, todayIndex: 0, streak: 0 }))
    expect(m.visible).toBe(true)
  })

  it('quests null → không có trường quests trong model', () => {
    const m = buildWeekRhythm(base({ quests: null }))
    expect(m.quests).toBeUndefined()
  })

  it('quests có dữ liệu → đếm done/total đúng (share+streak+cefr)', () => {
    const m = buildWeekRhythm(
      base({
        quests: {
          share: { cooldownDays: 7, rewardDays: 1, canClaim: false },
          streak: { current: 5, required: 7, rewardDays: 1, cooldownDays: 7, canClaim: true },
          cefrExams: [
            { level: 'A1', passed: true, claimed: true, rewardDays: 3 },
            { level: 'A2', passed: false, claimed: false, rewardDays: 3 },
          ],
          referral: { code: 'x', rewardedCount: 0, pendingCount: 0, maxRewarded: 5, rewardDays: 1 },
        },
      }),
    )
    // share done (canClaim=false) + streak chưa done (canClaim=true) + 1 cefr claimed = 2/4
    expect(m.quests).toEqual({ done: 2, total: 4 })
  })

  it('không có huy hiệu mới → latestBadge undefined', () => {
    const m = buildWeekRhythm(base())
    expect(m.latestBadge).toBeUndefined()
  })

  it('payout share/streak bị tắt không được tính nhầm thành nhiệm vụ đã hoàn thành', () => {
    const model = buildWeekRhythm(
      base({
        quests: {
          share: { cooldownDays: 7, rewardDays: 0, canClaim: false },
          streak: { current: 8, required: 5, rewardDays: 0, cooldownDays: 7, canClaim: false },
          cefrExams: [{ level: 'A1', passed: true, claimed: true, rewardDays: 3 }],
          referral: {
            code: 'x',
            rewardedCount: 0,
            pendingCount: 0,
            maxRewarded: 10,
            rewardDays: 7,
          },
        },
      }),
    )
    expect(model.quests).toEqual({ done: 1, total: 1 })
  })

  it('có huy hiệu mới → giữ nguyên id/label', () => {
    const m = buildWeekRhythm(base({ latestBadge: { id: 'streak_7', label: 'Chuỗi 7 ngày' } }))
    expect(m.latestBadge).toEqual({ id: 'streak_7', label: 'Chuỗi 7 ngày' })
  })
})
