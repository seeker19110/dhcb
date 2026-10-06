// Test canh gác R3-4 §6.3 — summary luôn hiển thị (không nằm trong panel hidden), panel
// disclosure stable id + HTML `hidden`, focus transfer trước khi ẩn, và đủ các destination
// English hiện hành (Hôm nay · Từ vựng · Sổ lỗi · CEFR · IELTS · Tổng kết) qua 5 state.
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DashboardEnglishDetails, {
  type DashboardEnglishDetailsProps,
} from './DashboardEnglishDetails'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

function baseProps(
  overrides: Partial<DashboardEnglishDetailsProps> = {},
): DashboardEnglishDetailsProps {
  return {
    vi: true,
    expanded: false,
    onToggle: () => {},
    srsDue: 3,
    weeklyCredit: {
      info: { freeWeeklyCredit: 10, freeWeeklyCap: 30 },
      status: 'ready',
      retryRevision: 0,
    },
    weeklyCreditRetryRef: { current: null },
    onRetryWeeklyCredit: () => {},
    learnedToday: 2,
    dailySpeed: 10,
    learnedTotal: 50,
    srsTotal: 20,
    pathDone: 5,
    pathTotal: 50,
    pathReady: true,
    mistakesDue: 1,
    mistakesTotal: 4,
    onOpenMistakes: () => {},
    cefr: {
      state: { status: 'ready', data: [] },
      retryRevision: 0,
      examMap: {},
      overallPct: 40,
    },
    cefrRetryRef: { current: null },
    onRetryCefr: () => {},
    writing: { count: 0, latest: null, best: null, avg: null, history: [] },
    onWriteFirst: () => {},
    chatN: 1,
    writeN: 2,
    speakN: 3,
    englishSubjectHref: '/mon-hoc/tieng-anh',
    ...overrides,
  }
}

function render(props: Partial<DashboardEnglishDetailsProps> = {}) {
  act(() => {
    root.render(
      <MemoryRouter>
        <DashboardEnglishDetails {...baseProps(props)} />
      </MemoryRouter>,
    )
  })
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('DashboardEnglishDetails (R3-4)', () => {
  it('panel đóng mặc định, dùng HTML hidden với stable id, aria-expanded/controls khớp toggle', () => {
    render()
    const toggle = container.querySelector<HTMLButtonElement>('#dashboard-english-details-toggle')!
    const panel = container.querySelector<HTMLDivElement>('#dashboard-english-details-panel')!
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(toggle.getAttribute('aria-controls')).toBe('dashboard-english-details-panel')
    expect(panel.hidden).toBe(true)
    expect(toggle.textContent).toBe('Xem chi tiết Tiếng Anh')
  })

  it('weekly-credit-heading luôn hiện, KHÔNG nằm trong panel hidden dù panel đóng', () => {
    render({ expanded: false, weeklyCredit: baseProps().weeklyCredit })
    const heading = container.querySelector<HTMLElement>('#dashboard-weekly-credit-heading')!
    const panel = container.querySelector<HTMLDivElement>('#dashboard-english-details-panel')!
    expect(heading).not.toBeNull()
    expect(panel.contains(heading)).toBe(false)
    expect(heading.tabIndex).toBe(-1)
  })

  it('mở panel bằng đúng một click, đổi nhãn nút và aria-expanded', () => {
    let expanded = false
    const onToggle = vi.fn(() => {
      expanded = !expanded
    })
    render({ expanded, onToggle })
    const toggle = container.querySelector<HTMLButtonElement>('#dashboard-english-details-toggle')!
    act(() => toggle.click())
    expect(onToggle).toHaveBeenCalledTimes(1)

    render({ expanded: true, onToggle })
    const toggleAfter = container.querySelector<HTMLButtonElement>(
      '#dashboard-english-details-toggle',
    )!
    expect(toggleAfter.getAttribute('aria-expanded')).toBe('true')
    expect(toggleAfter.textContent).toBe('Ẩn chi tiết Tiếng Anh')
    expect(
      container.querySelector<HTMLDivElement>('#dashboard-english-details-panel')?.hidden,
    ).toBe(false)
  })

  it('trước khi ẩn: focus trong panel chuyển về toggle; focus ngoài panel không bị steal', () => {
    let expanded = true
    const onToggle = vi.fn(() => {
      expanded = false
    })
    render({ expanded, onToggle })
    const toggle = container.querySelector<HTMLButtonElement>('#dashboard-english-details-toggle')!
    const panelButton = container.querySelector<HTMLButtonElement>(
      '#dashboard-english-details-panel button',
    )!
    panelButton.focus()
    expect(document.activeElement).toBe(panelButton)
    act(() => toggle.click())
    expect(document.activeElement).toBe(toggle)

    // Ca không steal: focus đã ở ngoài panel trước khi đóng.
    expanded = true
    const onToggle2 = vi.fn(() => {
      expanded = false
    })
    render({ expanded, onToggle: onToggle2 })
    const toggle2 = container.querySelector<HTMLButtonElement>('#dashboard-english-details-toggle')!
    const outside = document.createElement('button')
    document.body.appendChild(outside)
    outside.focus()
    act(() => toggle2.click())
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })

  it('panel chứa đủ 6 destination: Hôm nay · Từ vựng · Sổ lỗi · CEFR · IELTS · Tổng kết', () => {
    render({
      expanded: true,
      mistakesTotal: 4,
      cefr: {
        state: {
          status: 'ready',
          data: [
            {
              id: 'A1',
              titleVi: 'A1',
              titleEn: 'A1',
              doneWords: 1,
              totalWords: 10,
              pct: 10,
              accent: 'emerald',
              grammarCount: 1,
            },
          ],
        },
        retryRevision: 0,
        examMap: {},
        overallPct: 10,
      },
      writing: {
        count: 1,
        latest: 6,
        best: 7,
        avg: 6,
        history: [{ date: '2026-09-01', overall: 6 }],
      },
    })
    const panel = container.querySelector<HTMLDivElement>('#dashboard-english-details-panel')!
    expect(panel.textContent).toContain('Hôm nay')
    expect(panel.textContent).toContain('Từ vựng')
    expect(panel.textContent).toContain('Sổ lỗi của tôi')
    expect(panel.textContent).toContain('Lộ trình CEFR')
    expect(panel.textContent).toContain('Điểm viết IELTS')
    expect(panel.textContent).toContain('Tổng kết')
  })

  it('summary state: chưa đo/tải/lỗi phải nói bằng chữ, credit 0 vẫn là ready hợp lệ', () => {
    render({
      weeklyCredit: {
        ...baseProps().weeklyCredit,
        info: { freeWeeklyCredit: 0, freeWeeklyCap: 30 },
      },
      cefr: { state: { status: 'loading' }, retryRevision: 0, examMap: {}, overallPct: 0 },
    })
    expect(container.textContent).toContain('0/30')
    expect(container.textContent).toContain('Đang tải…')
  })

  it('summary lỗi lượt AI hiện copy thân thiện + nút Thử lại, không lộ exception thô', () => {
    render({
      weeklyCredit: {
        ...baseProps().weeklyCredit,
        info: null,
        status: 'error',
      },
    })
    expect(container.textContent).toContain('Chưa tải được lượt AI hôm nay.')
    expect(container.textContent).not.toMatch(/Error|undefined|NaN/)
  })

  // [audit M9] VIP từng hiện lưới Chat/Nói/Viết đọc hạn mức THEO CHẾ ĐỘ (đã bỏ từ GĐ1) → "0/".
  // Nay mọi gói cùng một thẻ: số còn lại / hạn mức TỔNG/ngày do server trả.
  it('VIP dùng chung thẻ lượt TỔNG/ngày: hiện "x/300 lượt", không có mẫu số rỗng', () => {
    render({
      weeklyCredit: {
        info: { freeWeeklyCredit: 288, freeWeeklyCap: 300 },
        status: 'ready',
        retryRevision: 0,
      },
    })
    expect(container.querySelector('#dashboard-weekly-credit-heading')).not.toBeNull()
    expect(container.textContent).toContain('288/300 lượt')
    expect(container.textContent).not.toMatch(/\d\/(\s|$)|undefined|NaN/)
  })
})
