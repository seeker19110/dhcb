import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LevelProgress } from '../../lib/stats'
import type { WeeklyCreditInfo } from '../../lib/weeklyCredit'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => ({
  user: { id: 'u1', name: 'An', email: 'an@example.test', plan: 'free' as 'free' | 'vip' },
  syncVersion: 0,
  fetchWeeklyCredit: vi.fn<() => Promise<WeeklyCreditInfo | null>>(),
  loadCurriculum: vi.fn<() => Promise<void>>(),
  getCefrProgress: vi.fn<() => Promise<LevelProgress[]>>(),
  isDesktop: false,
  isWide: false,
}))

vi.mock('../../components/Layout', () => ({ default: () => null }))
vi.mock('../../components/QuickActions', () => ({
  default: function QuickActionsMock() {
    const [open, setOpen] = useState(false)
    return (
      <div data-testid="quick-actions">
        <button onClick={() => setOpen(true)}>Công cụ</button>
        {open && (
          <div role="dialog" aria-label="Công cụ đang mở">
            <button>Trong hộp thoại</button>
          </div>
        )}
      </div>
    )
  },
}))
vi.mock('../../components/ActivityCalendarCard', () => ({
  default: ({
    calendar,
    selectedDate,
    onSelectedDateChange,
  }: {
    calendar: { days: { date: string }[] }
    selectedDate?: string
    onSelectedDateChange?: (date: string) => void
  }) => (
    <div data-testid="activity-calendar" data-selected-date={selectedDate}>
      Lịch
      <button onClick={() => onSelectedDateChange?.(calendar.days[0]!.date)}>Chọn ngày đầu</button>
    </div>
  ),
}))
vi.mock('../../components/SubjectProgressSection', () => ({
  default: () => <section>Tiến độ theo môn</section>,
}))
vi.mock('@core/PageShell', () => ({
  PageShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}))
vi.mock('@core/TwoPane', () => ({
  TwoPane: ({ children, rail }: { children: React.ReactNode; rail: React.ReactNode }) => (
    <div>
      {children}
      <aside>{rail}</aside>
    </div>
  ),
}))
vi.mock('../../context/useAuth', () => ({ useAuth: () => ({ user: mocks.user }) }))
vi.mock('../../context/useLang', () => ({
  useLang: () => ({ lang: 'vi' as const, T: { streakDays: 'ngày liên tiếp' } }),
}))
vi.mock('../../lib/useCloudSync', () => ({ useCloudSync: () => mocks.syncVersion }))
vi.mock('../../lib/usePageTitle', () => ({ usePageTitle: () => undefined }))
vi.mock('../../lib/useIsDesktopViewport', () => ({
  useIsDesktopViewport: () => mocks.isDesktop,
  useMediaQuery: () => mocks.isWide,
}))
vi.mock('../../lib/onboarding', () => ({ useOnboarding: () => undefined }))
vi.mock('../../lib/storage', () => ({
  getStreak: () => 0,
  getUsage: () => ({ chatCount: 0, speakingCount: 0, writingCount: 0 }),
  getChatSessions: () => [],
  getWritingSubs: () => [],
  getSpeakingSessions: () => [],
}))
vi.mock('../../lib/vocab', () => ({
  getLearnedWords: () => new Set<string>(),
  getLearnedCount: () => 0,
}))
vi.mock('../../lib/srs', () => ({ getSRSStats: () => ({ due: 0, total: 0 }) }))
vi.mock('../../lib/mistakes', () => ({ getMistakeStats: () => ({ due: 0, total: 0 }) }))
vi.mock('../../lib/cefrExam', () => ({ getExamMap: () => ({}) }))
vi.mock('../../lib/curriculum', () => ({
  loadCurriculum: mocks.loadCurriculum,
  getPathProgress: () => ({ done: 0, total: 10 }),
  getDailyLearned: () => 0,
  getDailySpeed: () => 10,
}))
vi.mock('../../lib/stats', () => ({
  getActivity7Days: () =>
    Array.from({ length: 7 }, (_, index) => ({
      date: `2026-09-${10 + index}`,
      count: 0,
      active: false,
      dow: index,
    })),
  getWeekTotal: () => 0,
  getCefrProgress: mocks.getCefrProgress,
  getActivityCalendar: (_uid: string, totalDays = 35) => {
    const end = new Date('2026-09-18T00:00:00Z')
    const days = Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(end.getTime() - (totalDays - index - 1) * 86_400_000)
      return {
        date: date.toISOString().slice(0, 10),
        dow: date.getUTCDay(),
        count: 0,
        active: false,
      }
    })
    return { days, firstColumn: 0, activeDays: 0, bestDay: 0 }
  },
  getWritingProgress: () => ({ count: 0, latest: null, best: null, avg: null, history: [] }),
}))
vi.mock('../../lib/weeklyGoal', () => ({
  getWeeklyProgress: () => ({ daysDone: 0, goal: 3, achieved: false }),
}))
vi.mock('../../lib/promo', () => ({ effectivePlan: (plan: 'free' | 'vip') => plan }))
vi.mock('../../lib/weeklyCredit', () => ({ fetchWeeklyCredit: mocks.fetchWeeklyCredit }))

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function level(id: 'A1' | 'A2', title: string): LevelProgress {
  return {
    id,
    titleVi: title,
    titleEn: title,
    doneWords: id === 'A1' ? 1 : 2,
    totalWords: 10,
    pct: id === 'A1' ? 10 : 20,
    accent: id === 'A1' ? 'emerald' : 'sky',
    grammarCount: 2,
  }
}

describe('Dashboard — async truth, retry và focus', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    mocks.user = { id: 'u1', name: 'An', email: 'an@example.test', plan: 'free' }
    mocks.syncVersion = 0
    mocks.isDesktop = false
    mocks.isWide = false
    mocks.fetchWeeklyCredit.mockReset().mockResolvedValue({
      plan: 'free',
      freeWeeklyCredit: 3,
      freeWeeklyCap: 30,
    })
    mocks.loadCurriculum.mockReset().mockResolvedValue(undefined)
    mocks.getCefrProgress.mockReset().mockResolvedValue([level('A1', 'A1 hiện tại')])
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  async function renderDashboard() {
    const { default: Dashboard } = await import('./Dashboard')
    await act(async () => {
      root.render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>,
      )
      await Promise.resolve()
    })
  }

  async function rerenderDashboard() {
    const { default: Dashboard } = await import('./Dashboard')
    await act(async () => {
      root.render(
        <MemoryRouter>
          <Dashboard />
        </MemoryRouter>,
      )
      await Promise.resolve()
    })
  }

  function retryInSection(headingSelector: string): HTMLButtonElement {
    const section = container.querySelector(headingSelector)?.closest('section')
    const button = section?.querySelector<HTMLButtonElement>('button')
    if (!button) throw new Error(`Không tìm thấy Retry trong ${headingSelector}`)
    return button
  }

  it('weekly null → error; Retry chỉ tạo một request, credit 0 ready và focus về heading', async () => {
    const retryResult = deferred<WeeklyCreditInfo | null>()
    mocks.fetchWeeklyCredit.mockResolvedValueOnce(null).mockReturnValueOnce(retryResult.promise)
    await renderDashboard()
    expect(container.textContent).toContain('Chưa tải được lượt AI hôm nay.')

    const heading = container.querySelector<HTMLElement>('#dashboard-weekly-credit-heading')!
    const retry = retryInSection('#dashboard-weekly-credit-heading')
    retry.focus()
    act(() => {
      retry.click()
      retry.click()
    })
    expect(mocks.fetchWeeklyCredit).toHaveBeenCalledTimes(2)
    expect(retry.getAttribute('aria-disabled')).toBe('true')

    await act(async () =>
      retryResult.resolve({ plan: 'free', freeWeeklyCredit: 0, freeWeeklyCap: 30 }),
    )
    expect(container.textContent).toContain('0/30')
    expect(document.activeElement).toBe(heading)
  })

  it('weekly success không cướp focus nếu người dùng đã chuyển đi', async () => {
    const retryResult = deferred<WeeklyCreditInfo | null>()
    mocks.fetchWeeklyCredit.mockResolvedValueOnce(null).mockReturnValueOnce(retryResult.promise)
    await renderDashboard()
    const retry = retryInSection('#dashboard-weekly-credit-heading')
    retry.focus()
    act(() => retry.click())
    const outside = document.createElement('button')
    outside.textContent = 'Ngoài resource'
    document.body.appendChild(outside)
    outside.focus()

    await act(async () =>
      retryResult.resolve({ plan: 'free', freeWeeklyCredit: 5, freeWeeklyCap: 30 }),
    )
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })

  it('weekly response cũ của user trước không overwrite key user mới', async () => {
    const first = deferred<WeeklyCreditInfo | null>()
    const second = deferred<WeeklyCreditInfo | null>()
    mocks.fetchWeeklyCredit.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    await renderDashboard()

    mocks.user = { ...mocks.user, id: 'u2' }
    await rerenderDashboard()
    await act(async () => second.resolve({ plan: 'free', freeWeeklyCredit: 8, freeWeeklyCap: 30 }))
    expect(container.textContent).toContain('8/30')
    await act(async () => first.resolve({ plan: 'free', freeWeeklyCredit: 1, freeWeeklyCap: 30 }))
    expect(container.textContent).toContain('8/30')
    expect(container.textContent).not.toContain('1/30')
  })

  // [audit M9] VIP cũng có hạn mức TỔNG/ngày (300) — phải hỏi server như Free, không còn
  // đọc hạn mức theo chế độ ở client (từng ra "0/").
  it('VIP cũng hỏi server và hiện "x/300 lượt"', async () => {
    mocks.user = { ...mocks.user, plan: 'vip' }
    mocks.fetchWeeklyCredit.mockResolvedValueOnce({
      plan: 'vip',
      freeWeeklyCredit: 288,
      freeWeeklyCap: 300,
    })
    await renderDashboard()
    expect(mocks.fetchWeeklyCredit).toHaveBeenCalledTimes(1)
    expect(container.textContent).toContain('288/300 lượt')
  })

  it('đổi Free → VIP gọi lại endpoint và response Free cũ không xuất hiện', async () => {
    const oldFreeRequest = deferred<WeeklyCreditInfo | null>()
    const vipRequest = deferred<WeeklyCreditInfo | null>()
    mocks.fetchWeeklyCredit
      .mockReturnValueOnce(oldFreeRequest.promise)
      .mockReturnValueOnce(vipRequest.promise)
    await renderDashboard()
    mocks.user = { ...mocks.user, plan: 'vip' }
    await rerenderDashboard()
    expect(mocks.fetchWeeklyCredit).toHaveBeenCalledTimes(2)

    await act(async () =>
      oldFreeRequest.resolve({ plan: 'free', freeWeeklyCredit: 4, freeWeeklyCap: 30 }),
    )
    expect(container.textContent).not.toContain('4/30')
    await act(async () =>
      vipRequest.resolve({ plan: 'vip', freeWeeklyCredit: 250, freeWeeklyCap: 300 }),
    )
    expect(container.textContent).toContain('250/300')
  })

  function openEnglishDetails(): HTMLButtonElement {
    const toggle = container.querySelector<HTMLButtonElement>('#dashboard-english-details-toggle')!
    act(() => toggle.click())
    return toggle
  }

  it('CEFR nằm trong panel đóng mặc định; mở panel, Retry thật resolve và đưa focus về heading khi Retry còn active', async () => {
    const retryResult = deferred<void>()
    mocks.loadCurriculum
      .mockRejectedValueOnce(new Error('fixture'))
      .mockReturnValueOnce(retryResult.promise)
    await renderDashboard()
    expect(container.querySelector<HTMLElement>('#dashboard-english-details-panel')?.hidden).toBe(
      true,
    )
    openEnglishDetails()
    expect(container.textContent).toContain('Chưa tải được lộ trình Tiếng Anh.')

    const heading = container.querySelector<HTMLElement>('#dashboard-cefr-heading')!
    const retry = retryInSection('#dashboard-cefr-heading')
    retry.focus()
    act(() => {
      retry.click()
      retry.click()
    })
    expect(mocks.loadCurriculum).toHaveBeenCalledTimes(2)
    await act(async () => retryResult.resolve())
    expect(container.textContent).toContain('A1 hiện tại')
    expect(document.activeElement).toBe(heading)
  })

  it('CEFR success giữ focus ở control khác, không cướp lại sau Retry', async () => {
    const retryResult = deferred<void>()
    mocks.loadCurriculum
      .mockRejectedValueOnce(new Error('fixture'))
      .mockReturnValueOnce(retryResult.promise)
    await renderDashboard()
    openEnglishDetails()
    const retry = retryInSection('#dashboard-cefr-heading')
    retry.focus()
    act(() => retry.click())
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()

    await act(async () => retryResult.resolve())
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })

  it('CEFR Retry→đóng panel giữa chừng→success không cướp focus, giữ ở toggle', async () => {
    const retryResult = deferred<void>()
    mocks.loadCurriculum
      .mockRejectedValueOnce(new Error('fixture'))
      .mockReturnValueOnce(retryResult.promise)
    await renderDashboard()
    const toggle = openEnglishDetails()
    const retry = retryInSection('#dashboard-cefr-heading')
    retry.focus()
    act(() => retry.click())
    expect(document.activeElement).toBe(retry)

    // Đóng panel giữa chừng lúc Retry vẫn đang loading — hide handler phải đưa focus về toggle
    // (§6.3) trước khi resolve tới, chứ không được để lại focus trên nút đã biến mất.
    act(() => toggle.click())
    expect(document.activeElement).toBe(toggle)
    expect(container.querySelector<HTMLElement>('#dashboard-english-details-panel')?.hidden).toBe(
      true,
    )

    await act(async () => retryResult.resolve())
    expect(document.activeElement).toBe(toggle)
    expect(container.querySelector<HTMLElement>('#dashboard-english-details-panel')?.hidden).toBe(
      true,
    )
  })

  it('CEFR response cũ sau sync không overwrite response của key mới', async () => {
    const first = deferred<LevelProgress[]>()
    const second = deferred<LevelProgress[]>()
    mocks.getCefrProgress.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    await renderDashboard()
    mocks.syncVersion = 1
    await rerenderDashboard()

    await act(async () => second.resolve([level('A2', 'A2 mới')]))
    expect(container.textContent).toContain('A2 mới')
    await act(async () => first.resolve([level('A1', 'A1 cũ')]))
    expect(container.textContent).toContain('A2 mới')
    expect(container.textContent).not.toContain('A1 cũ')
  })

  it('dùng một DOM tree theo thứ tự header → môn → tuần → English → công cụ', async () => {
    await renderDashboard()
    const main = container.querySelector('main')!
    const ordered = [
      main.querySelector('h1')!,
      Array.from(main.querySelectorAll('section')).find(
        (section) => section.textContent === 'Tiến độ theo môn',
      )!,
      main.querySelector('[data-dashboard-region="weekly"]')!,
      main.querySelector('[data-dashboard-region="english"]')!,
      main.querySelector('[data-dashboard-region="actions"]')!,
    ]

    expect(container.querySelectorAll('[data-dashboard-region="weekly"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-testid="quick-actions"]')).toHaveLength(1)
    for (let index = 0; index < ordered.length - 1; index += 1) {
      expect(
        Boolean(
          ordered[index]!.compareDocumentPosition(ordered[index + 1]!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
        ),
      ).toBe(true)
    }
  })

  it('calendar mở mặc định mọi viewport, giữ expanded/selection/node qua 1023→1024→1280→390', async () => {
    await renderDashboard()
    const toggle = container.querySelector<HTMLButtonElement>('#dashboard-calendar-toggle')!
    const panel = container.querySelector<HTMLDivElement>('#dashboard-calendar-panel')!
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(panel.hidden).toBe(false)

    const calendarNode = container.querySelector<HTMLElement>('[data-testid="activity-calendar"]')!
    act(() => calendarNode.querySelector<HTMLButtonElement>('button')!.click())
    const selected = calendarNode.dataset.selectedDate
    expect(panel.hidden).toBe(false)

    mocks.isDesktop = true
    await rerenderDashboard()
    mocks.isWide = true
    await rerenderDashboard()
    mocks.isDesktop = false
    mocks.isWide = false
    await rerenderDashboard()

    const afterResize = container.querySelector<HTMLElement>('[data-testid="activity-calendar"]')!
    expect(afterResize).toBe(calendarNode)
    expect(afterResize.dataset.selectedDate).toBe(selected)
    expect(
      container
        .querySelector<HTMLButtonElement>('#dashboard-calendar-toggle')
        ?.getAttribute('aria-expanded'),
    ).toBe('true')
    expect(container.querySelectorAll('[data-testid="activity-calendar"]')).toHaveLength(1)
  })

  it('đưa focus về toggle trước khi ẩn calendar, nhưng không steal focus ở ngoài', async () => {
    await renderDashboard()
    const toggle = container.querySelector<HTMLButtonElement>('#dashboard-calendar-toggle')!
    // Mặc định đã MỞ SẴN (xem test "mở mặc định" ở trên) — không cần click để mở nữa.
    const inside = container.querySelector<HTMLButtonElement>(
      '[data-testid="activity-calendar"] button',
    )!
    inside.focus()
    act(() => toggle.click())
    expect(document.activeElement).toBe(toggle)
    expect(container.querySelector<HTMLDivElement>('#dashboard-calendar-panel')?.hidden).toBe(true)

    act(() => toggle.click())
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()
    act(() => toggle.click())
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })

  it('QuickActions và dialog đang mở không remount qua breakpoint', async () => {
    await renderDashboard()
    const quickActions = container.querySelector<HTMLElement>('[data-testid="quick-actions"]')!
    act(() => quickActions.querySelector<HTMLButtonElement>('button')!.click())
    const dialogControl = quickActions.querySelector<HTMLButtonElement>('[role="dialog"] button')!
    dialogControl.focus()

    mocks.isDesktop = true
    await rerenderDashboard()
    mocks.isWide = true
    await rerenderDashboard()

    expect(container.querySelector('[data-testid="quick-actions"]')).toBe(quickActions)
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.activeElement).toBe(dialogControl)
  })
})
