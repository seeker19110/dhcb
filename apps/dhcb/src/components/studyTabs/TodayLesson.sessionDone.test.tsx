// Test NGHIỆM THU AC-3 của P1-6 `SessionDone` — tích hợp với `TodayLesson` THẬT.
// Đặc tả: docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md §P1-6 ④ AC-3:
//   "Trong một lần hoàn thành có cả streak mốc 7 lẫn đạt mục tiêu tuần: DOM chỉ có MỘT
//    [role="dialog"]".
//
// Cách seed (giờ VN, ghim bằng fake Date — chỉ giả `Date`, timer React vẫn chạy thật):
//   - Hôm nay = Thứ 4 14/10/2026. Seed 6 ngày liền trước (8–13/10) mỗi ngày có `learnCount` 1.
//   - Mục tiêu tuần = 3 ngày: tuần này (T2 12/10, T3 13/10) mới có 2 ngày ⇒ CHƯA đạt;
//     lần học từ cuối cùng hôm nay làm ngày thứ 3 ⇒ `shouldCelebrateWeeklyGoal` thành true.
//   - Streak: 6 ngày seed + hôm nay = đúng 7 ⇒ chạm mốc 7 (và `shouldCelebrateStreak` true vì
//     chưa từng đánh dấu đã mừng hôm nay).
// Mock tối thiểu: Router, toast, thẻ từ (WordCard), âm thanh/rung, confetti, mạng đồng bộ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import type { DailyUsage, DictEntry } from '../../types'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ show: vi.fn(), success: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))
vi.mock('../WordCard', () => ({ default: () => null }))
vi.mock('../../lib/haptics', () => ({
  haptics: { success: vi.fn(), tap: vi.fn() },
  vibrate: vi.fn(),
}))
vi.mock('../../lib/sound', () => ({
  sound: { correct: vi.fn(), wrong: vi.fn(), milestone: vi.fn() },
}))
vi.mock('../../lib/confetti', () => ({ burst: vi.fn() }))
vi.mock('../../lib/analytics', () => ({ track: vi.fn() }))

import { TodayLesson } from './TodayLesson'

const UID = 'u-ac3'
// 12:00 giờ VN Thứ 4 14/10/2026 (= 05:00 UTC).
const NOW = new Date('2026-10-14T05:00:00Z')

const POOL: DictEntry[] = [
  { word: 'alpha', pos: 'n', vi: 'chữ a', ex_en: 'Alpha is first.', ex_vi: 'Alpha đứng đầu.' },
  { word: 'beta', pos: 'n', vi: 'chữ b', ex_en: 'Beta is second.', ex_vi: 'Beta đứng thứ hai.' },
]

function seedUsage(date: string): void {
  const usage: DailyUsage = {
    date,
    chatCount: 0,
    writingCount: 0,
    speakingCount: 0,
    sttCount: 0,
    pronounceCount: 0,
    learnCount: 1,
  }
  localStorage.setItem(`et_usage_${UID}_${date}`, JSON.stringify(usage))
}

let root: Root | undefined
let host: HTMLDivElement | undefined

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  // Đồng bộ nền (pushLearnDay/pushProgress…) bắn-rồi-quên — trả rỗng, không đụng mạng.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('{}', { status: 200 })),
  )
  // 6 ngày liên tiếp trước hôm nay (8→13/10) đã có học.
  for (const d of ['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11', '2026-10-12']) {
    seedUsage(d)
  }
  seedUsage('2026-10-13')
  // Mục tiêu tuần 3 ngày; tốc độ 5 từ/lượt (dailyMax 25) để batch 2 từ không chạm trần ngày.
  localStorage.setItem(
    `et_weekly_goal_${UID}`,
    JSON.stringify({ goal: 3, updatedAt: NOW.toISOString() }),
  )
  localStorage.setItem(`et_speed_${UID}`, '5')
})

afterEach(() => {
  if (root) act(() => root?.unmount())
  host?.remove()
  root = undefined
  host = undefined
  // Dọn `?xong=1` do overlay gắn lên URL để không rò sang test khác.
  window.history.replaceState(null, '', '/')
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

function mountTodayLesson(): HTMLDivElement {
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() =>
    root?.render(
      <MemoryRouter>
        <TodayLesson uid={UID} isA pool={POOL} onProgress={vi.fn()} />
      </MemoryRouter>,
    ),
  )
  return host
}

function clickGotIt(view: HTMLElement): void {
  const btn = Array.from(view.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('Đã thuộc'),
  )
  if (!btn) throw new Error('Không thấy nút "Đã thuộc" — TodayLesson chưa ở phase learning')
  act(() => btn.click())
}

describe('TodayLesson + SessionDone — AC-3 (streak mốc 7 + đạt mục tiêu tuần)', () => {
  it('seed đúng: trước khi học, chưa có dialog nào', () => {
    const view = mountTodayLesson()
    expect(document.querySelectorAll('[role="dialog"]').length).toBe(0)
    expect(view.textContent).toContain('Đã thuộc')
  })

  it('hoàn thành bài chạm cả streak 7 lẫn mục tiêu tuần: DOM chỉ có MỘT dialog chứa cả hai tầng', () => {
    const view = mountTodayLesson()

    // Từ 1: chưa hết batch ⇒ chưa có overlay.
    clickGotIt(view)
    expect(document.querySelectorAll('[role="dialog"]').length).toBe(0)

    // Từ 2 (cuối batch) ⇒ SessionDone mở.
    clickGotIt(view)

    const dialogs = document.querySelectorAll('[role="dialog"]')
    expect(dialogs.length).toBe(1)

    const text = dialogs[0]?.textContent ?? ''
    // Tầng streak: đúng mốc 7 ngày (câu động viên riêng của mốc 7).
    expect(text).toContain('Chuỗi 7 ngày')
    expect(text).toContain('Tròn 1 tuần')
    // Tầng mục tiêu tuần: đạt 3/3 ngày.
    expect(text).toContain('Đạt mục tiêu tuần')
    expect(text).toContain('3/3 ngày')

    // Overlay đã gắn ?xong=1 vào URL (nền của AC-4 ở E2E).
    expect(new URLSearchParams(window.location.search).get('xong')).toBe('1')
  })
})
