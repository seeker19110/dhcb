import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ActivityCalendarCard from './ActivityCalendarCard'
import type { ActivityCalendar } from '../lib/stats'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function makeCalendar(totalDays: number): ActivityCalendar {
  const end = new Date('2026-09-18T00:00:00Z')
  const days = Array.from({ length: totalDays }, (_, index) => {
    const date = new Date(end.getTime() - (totalDays - index - 1) * 86_400_000)
    return {
      date: date.toISOString().slice(0, 10),
      dow: date.getUTCDay(),
      count: index,
      active: index > 0,
    }
  })
  return {
    days,
    firstColumn: ((days[0]?.dow ?? 0) + 6) % 7,
    activeDays: days.filter((day) => day.active).length,
    bestDay: Math.max(0, ...days.map((day) => day.count)),
  }
}

const calendar = makeCalendar(8)

let container: HTMLDivElement
let root: Root
const scrollIntoView = vi.fn()

function render(
  isDesktop = false,
  nextCalendar = calendar,
  selectedDate?: string,
  onSelectedDateChange?: (date: string) => void,
) {
  act(() => {
    root.render(
      <ActivityCalendarCard
        calendar={nextCalendar}
        uid="u1"
        vi
        isDesktop={isDesktop}
        weeks={5}
        wdow={['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']}
        selectedDate={selectedDate}
        onSelectedDateChange={onSelectedDateChange}
      />,
    )
  })
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  scrollIntoView.mockReset()
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: scrollIntoView,
  })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('ActivityCalendarCard', () => {
  it('dùng cùng lưới 7 cột 44px trong một scroller trên mobile', () => {
    render()
    const grid = container.querySelector<HTMLElement>('[role="grid"]')
    const scroller = grid?.parentElement
    const headers = scroller?.querySelectorAll('span.w-11') ?? []
    const cells = grid?.querySelectorAll<HTMLElement>('[role="gridcell"]') ?? []

    expect(scroller?.className).toContain('overflow-x-auto')
    expect(grid?.className).toContain('w-max')
    expect(headers).toHaveLength(7)
    expect(cells).toHaveLength(8)
    cells.forEach((cell) => expect(cell.className).toContain('w-11 h-11'))
    expect(Array.from(cells).filter((cell) => cell.tabIndex === 0)).toHaveLength(1)
  })

  it('focus ô kế cận và cuộn nó vào tầm nhìn khi dùng phím', () => {
    render()
    const selected = container.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')
    act(() =>
      selected?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })),
    )

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', inline: 'nearest' })
    expect(document.activeElement?.getAttribute('data-cell')).toBe('6')
  })

  // [U6 · M6] Trước đây test này GHIM ô desktop 16×16px — đúng cỡ dưới sàn WCAG 2.5.8 (AA,
  // ≥ 24px) mà audit 2026-09-30 chỉ ra. Nay ghim vùng chạm 24px (`w-6 h-6`); ô màu nhìn thấy
  // là <span> bên trong. Đo px thật ở trình duyệt: `e2e/u6-user-preferences.spec.ts`.
  it('ô desktop có vùng chạm 24×24px, ô màu nằm bên trong', () => {
    render(true)
    const cells = container.querySelectorAll<HTMLElement>('[role="gridcell"]')
    expect(cells.length).toBeGreaterThan(0)
    cells.forEach((cell) => {
      expect(cell.className).toContain('w-6 h-6')
      expect(cell.querySelector('span[aria-hidden="true"]')?.className).toMatch(/\bbg-/)
    })
  })

  it('giữ ngày chọn, node và focus khi đổi hình học 5 → 13 → 26 tuần', () => {
    const fiveWeeks = makeCalendar(35)
    const thirteenWeeks = makeCalendar(91)
    const twentySixWeeks = makeCalendar(182)
    const selectedDate = fiveWeeks.days[10]!.date
    const onChange = vi.fn()

    render(false, fiveWeeks, selectedDate, onChange)
    const original = container.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`)!
    original.focus()

    render(true, thirteenWeeks, selectedDate, onChange)
    const afterDesktop = container.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`)!
    expect(afterDesktop).toBe(original)
    expect(document.activeElement).toBe(afterDesktop)

    render(true, twentySixWeeks, selectedDate, onChange)
    const afterWide = container.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`)!
    expect(afterWide).toBe(original)
    expect(document.activeElement).toBe(afterWide)
    expect(afterWide.getAttribute('aria-selected')).toBe('true')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('giữ node của ngày đầu partial week qua 5 → 26 → 5 tuần', () => {
    const fiveWeeks = makeCalendar(35)
    const twentySixWeeks = makeCalendar(182)
    const partialWeekDate = fiveWeeks.days[0]!.date

    render(false, fiveWeeks, partialWeekDate)
    const original = container.querySelector<HTMLElement>(`[data-date="${partialWeekDate}"]`)!
    original.focus()

    render(true, twentySixWeeks, partialWeekDate)
    const expanded = container.querySelector<HTMLElement>(`[data-date="${partialWeekDate}"]`)!
    expect(expanded).toBe(original)
    expect(document.activeElement).toBe(expanded)

    render(false, fiveWeeks, partialWeekDate)
    const collapsed = container.querySelector<HTMLElement>(`[data-date="${partialWeekDate}"]`)!
    expect(collapsed).toBe(original)
    expect(document.activeElement).toBe(collapsed)
  })

  it('clamp ngày ngoài range và chuyển focus khi chính ô đang focus biến mất', () => {
    const twentySixWeeks = makeCalendar(182)
    const fiveWeeks = makeCalendar(35)
    const oldDate = twentySixWeeks.days[0]!.date
    const fallbackDate = fiveWeeks.days[0]!.date
    const onChange = vi.fn()

    render(true, twentySixWeeks, oldDate, onChange)
    container.querySelector<HTMLElement>(`[data-date="${oldDate}"]`)!.focus()
    render(false, fiveWeeks, oldDate, onChange)

    const fallback = container.querySelector<HTMLElement>(`[data-date="${fallbackDate}"]`)!
    expect(onChange).toHaveBeenLastCalledWith(fallbackDate)
    expect(fallback.getAttribute('aria-selected')).toBe('true')
    expect(document.activeElement).toBe(fallback)
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain('15/08')
  })

  it('không cướp focus ngoài calendar khi range thu hẹp', () => {
    const twentySixWeeks = makeCalendar(182)
    const fiveWeeks = makeCalendar(35)
    const oldDate = twentySixWeeks.days[0]!.date
    const outside = document.createElement('button')
    document.body.appendChild(outside)

    render(true, twentySixWeeks, oldDate)
    outside.focus()
    render(false, fiveWeeks, oldDate)

    expect(document.activeElement).toBe(outside)
    outside.remove()
  })

  it('uncontrolled lưu ngày đã clamp, không resurrect ngày cũ khi range mở rộng lại', () => {
    const twentySixWeeks = makeCalendar(182)
    const fiveWeeks = makeCalendar(35)
    const oldDate = twentySixWeeks.days[0]!.date
    const clampedDate = fiveWeeks.days[0]!.date
    const onChange = vi.fn()

    render(true, twentySixWeeks, undefined, onChange)
    act(() => container.querySelector<HTMLButtonElement>(`[data-date="${oldDate}"]`)!.click())
    expect(onChange).toHaveBeenLastCalledWith(oldDate)

    render(false, fiveWeeks, undefined, onChange)
    expect(onChange).toHaveBeenLastCalledWith(clampedDate)
    expect(
      container.querySelector(`[data-date="${clampedDate}"]`)?.getAttribute('aria-selected'),
    ).toBe('true')

    render(true, twentySixWeeks, undefined, onChange)
    expect(container.querySelector(`[data-date="${oldDate}"]`)?.getAttribute('aria-selected')).toBe(
      'false',
    )
    expect(
      container.querySelector(`[data-date="${clampedDate}"]`)?.getAttribute('aria-selected'),
    ).toBe('true')
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('giữ tương thích uncontrolled và chỉ một điểm roving tabindex sau khi chọn', () => {
    render(false, makeCalendar(35))
    const target = container.querySelectorAll<HTMLButtonElement>('[role="gridcell"]')[3]!
    act(() => target.click())

    expect(target.getAttribute('aria-selected')).toBe('true')
    expect(target.tabIndex).toBe(0)
    expect(container.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1)
  })

  it('presentation mặc định standalone giữ nguyên section/heading/viền riêng', () => {
    render(false)
    expect(container.querySelector('section')).not.toBeNull()
    expect(container.querySelector('h2')?.textContent).toContain('Lịch hoạt động')
  })

  it('presentation embedded (R3-3) không sinh card/heading lồng nhưng giữ aria-label và roving tabindex', () => {
    act(() => {
      root.render(
        <ActivityCalendarCard
          calendar={calendar}
          uid="u1"
          vi
          isDesktop={false}
          weeks={5}
          wdow={['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']}
          presentation="embedded"
        />,
      )
    })
    // Không surface/viền/nền/heading riêng: không có <section>/<h2> — section cha
    // (DashboardWeeklyOverview) sở hữu heading của toàn khối "Tuần này".
    expect(container.querySelector('section')).toBeNull()
    expect(container.querySelector('h2')).toBeNull()
    // aria-label + live detail của grid vẫn còn nguyên.
    const grid = container.querySelector('[role="grid"]')!
    expect(grid.getAttribute('aria-label')).toBe('Lịch hoạt động theo ngày')
    expect(container.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1)
  })
})
