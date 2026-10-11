// Home.test.tsx — cổng canh S05-2 AC-19: khối "Bộ môn & không gian" render từ SUBJECT_ENTRIES
// (packages/core-learner/subjectEntry.ts, một nguồn dùng chung với hub) thay vì khai tay 3 dòng
// (english / stem gộp / career-life). Mock mọi con nặng ký (AI briefing, banner…) để cô lập
// đúng phần đang canh: số thẻ MÔN = SUBJECT_ENTRIES.length, nhãn khớp registry.
//
// [P1-8] `useIsDesktopViewport` mock `false` (mobile) → `SubjectSpaceList` chỉ hiện 3 thẻ đầu +
// nút "Xem tất cả" (đặc tả §P1-8 AC-2); bấm nút đó trước khi đếm thẻ để giữ nguyên bất biến của
// test này (đủ SUBJECT_ENTRIES.length thẻ, đúng thứ tự registry vì không mock `useTodayPlan` nên
// `todayPlan` là null/`seen=[]`).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { SUBJECT_ENTRIES } from '@dhcb/core-learner/subjectEntry'
import { vnDateStr } from '../../lib/date'

;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('../../components/FirstTaskCard', () => ({ default: () => null }))
vi.mock('../../components/Layout.js', () => ({ default: () => null }))
vi.mock('../../components/PricePromoBanner.js', () => ({ default: () => null }))
vi.mock('../../components/RewardTipBanner.js', () => ({ default: () => null }))
vi.mock('../../components/Home/HomeAiBriefingCard.js', () => ({
  default: ({
    isDesktop,
    reserveComeback,
    comeback,
  }: {
    isDesktop: boolean
    reserveComeback?: boolean
    comeback?: unknown
  }) => (
    <div
      data-testid="home-companion"
      data-desktop={String(isDesktop)}
      data-reserve-comeback={String(reserveComeback ?? false)}
      data-has-comeback={String(Boolean(comeback))}
    />
  ),
}))
vi.mock('../../components/Home/HomeUniversalAiBar.js', () => ({
  default: ({ isDesktop }: { isDesktop: boolean }) => (
    <div data-testid="home-quick-ask" data-desktop={String(isDesktop)} />
  ),
}))
vi.mock('../../lib/useCloudSync', () => ({ useCloudSync: () => 0 }))
vi.mock('../../lib/usePageTitle', () => ({ usePageTitle: () => undefined }))
vi.mock('../../lib/useIsDesktopViewport', () => ({ useIsDesktopViewport: () => false }))
vi.mock('../../lib/appSettings', () => ({ getAppSettings: () => ({ promoUntil: null }) }))
vi.mock('../../lib/rewardTip', () => ({ shouldShowRewardTip: () => false }))
vi.mock('../../context/useLang', () => ({
  useLang: () => ({ T: { greeting: 'Xin chào' }, lang: 'vi' as const }),
}))

function mockAuth(user: { id: string; name: string; email: string; isGuest?: boolean }) {
  vi.doMock('../../context/useAuth', () => ({
    useAuth: () => ({ user, isGuest: user.isGuest === true }),
  }))
}

function seedActivityDaysAgo(uid: string, daysAgo: number) {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  const dateKey = vnDateStr(date)
  localStorage.setItem(
    `et_usage_${uid}_${dateKey}`,
    JSON.stringify({
      date: dateKey,
      chatCount: 0,
      writingCount: 0,
      speakingCount: 0,
      sttCount: 0,
      learnCount: 1,
    }),
  )
}

describe('Home — khối Bộ môn & không gian dùng SUBJECT_ENTRIES (AC-19)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.doUnmock('../../context/useAuth')
    vi.doUnmock('../../data/cefrLoader')
    vi.doUnmock('../../data/curriculumLoader')
    vi.resetModules()
    localStorage.clear()
  })

  async function hien() {
    const { default: HomeAfterMock } = await import('./Home')
    root = createRoot(container)
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <HomeAfterMock />
        </MemoryRouter>,
      )
    })
    // Mobile (mock isDesktop=false): SubjectSpaceList chỉ hiện 3 thẻ đầu — bấm "Xem tất cả" để
    // các test dưới đây vẫn đếm được đủ SUBJECT_ENTRIES.length thẻ như trước P1-8.
    const xemTatCa = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.startsWith('Xem tất cả'),
    )
    if (xemTatCa) {
      act(() => xemTatCa.click())
    }
  }

  it('tài khoản: số thẻ môn = SUBJECT_ENTRIES.length (6), nhãn khớp registry, đúng thứ tự', async () => {
    mockAuth({ id: 'u1', name: 'An', email: 'an@vd.vn' })
    await hien()
    const titles = Array.from(container.querySelectorAll('h3')).map((h) => h.textContent ?? '')
    const subjectTitles = SUBJECT_ENTRIES.map((e) => e.label)
    for (const label of subjectTitles) {
      expect(titles, `thiếu thẻ môn "${label}"`).toContain(label)
    }
    // Đúng số thẻ MÔN (không tính thẻ "Ghi chú" — không phải môn học).
    const subjectHeadings = titles.filter((t) => subjectTitles.includes(t))
    expect(subjectHeadings.length).toBe(SUBJECT_ENTRIES.length)
    expect(subjectHeadings).toEqual(subjectTitles)
    // [2026-09-20] Thẻ "Ghi chú" thay cho thẻ "Sự nghiệp, Khởi nghiệp & Đời sống" cũ.
    expect(titles).toContain('Ghi chú')
    expect(titles).not.toContain('Sự nghiệp, Khởi nghiệp & Đời sống')
  })

  it('khách (isGuest): thấy đủ dải môn (chip) qua GuestHome — Home không chặn khách', async () => {
    mockAuth({ id: 'guest_1', name: 'Khách', email: '', isGuest: true })
    await hien()
    for (const label of SUBJECT_ENTRIES.map((e) => e.label)) {
      expect(container.textContent, `thiếu môn "${label}" (khách)`).toContain(label)
    }
  })

  // [P0-3] AC-1: khách thấy GuestHome, KHÔNG thấy khối "Hôm nay"/ô tìm kiếm/FirstTaskCard —
  // những khối đó cần tài khoản để tính (streak, todayPlan theo uid thật…).
  it('khách (isGuest): KHÔNG render #today-card-heading', async () => {
    mockAuth({ id: 'guest_1', name: 'Khách', email: '', isGuest: true })
    await hien()
    expect(container.querySelector('#today-card-heading')).toBeNull()
  })

  it('member mobile giữ thứ tự Companion → Today → Hỏi nhanh và chỉ một control Tiến độ trong main', async () => {
    mockAuth({ id: 'u1', name: 'An', email: 'an@vd.vn' })
    await hien()
    const companion = container.querySelector('[data-testid="home-companion"]')
    const today = container.querySelector('#today-card-heading')
    const quickAsk = container.querySelector('[data-testid="home-quick-ask"]')
    expect(companion?.getAttribute('data-desktop')).toBe('false')
    expect(companion?.compareDocumentPosition(today!) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(today?.compareDocumentPosition(quickAsk!) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(container.querySelectorAll('button[aria-label="Xem bảng tiến độ"]')).toHaveLength(1)
    expect(container.textContent).not.toContain('Xem tiến độ')
  })

  it('member mobile: thẻ Ghi chú chỉ còn entry chính, không render shortcut', async () => {
    mockAuth({ id: 'u1', name: 'An', email: 'an@vd.vn' })
    await hien()
    expect(container.textContent).toContain('Ghi chú')
    // Shortcut chỉ hiện ở desktop. Ba nhãn của các trụ ĐÃ GỠ cũng không được xuất hiện lại.
    for (const shortcut of ['Bảng Kanban', 'Phỏng vấn thử', 'Lean Canvas', 'Đời sống']) {
      expect(
        Array.from(container.querySelectorAll('button')).some(
          (button) => button.textContent?.trim() === shortcut,
        ),
      ).toBe(false)
    }
  })

  it('có bằng chứng English + vắng 5 ngày: reserve comeback bật ngay trước CEFR async', async () => {
    vi.doMock('../../data/cefrLoader', () => ({ loadCefr: () => new Promise(() => {}) }))
    vi.doMock('../../data/curriculumLoader', () => ({
      loadFoundationIndex: () => new Promise(() => {}),
    }))
    localStorage.setItem('et_learned_u1', JSON.stringify(['hello']))
    seedActivityDaysAgo('u1', 5)
    mockAuth({ id: 'u1', name: 'An', email: 'an@vd.vn' })
    await hien()
    const companion = container.querySelector('[data-testid="home-companion"]')
    expect(companion?.getAttribute('data-reserve-comeback')).toBe('true')
  })

  it('English đã hoàn thành, loader settle nhưng không còn next: gỡ reserve 173px', async () => {
    vi.doMock('../../data/cefrLoader', () => ({ loadCefr: async () => [] }))
    vi.doMock('../../data/curriculumLoader', () => ({ loadFoundationIndex: async () => [] }))
    localStorage.setItem('et_learned_u1', JSON.stringify(['hello']))
    seedActivityDaysAgo('u1', 5)
    mockAuth({ id: 'u1', name: 'An', email: 'an@vd.vn' })
    await hien()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const companion = container.querySelector('[data-testid="home-companion"]')
    expect(companion?.getAttribute('data-reserve-comeback')).toBe('false')
    expect(companion?.getAttribute('data-has-comeback')).toBe('false')
  })

  it('loader CEFR lỗi: bắt rejection và gỡ reserve thay vì giữ khoảng trắng vĩnh viễn', async () => {
    vi.doMock('../../data/cefrLoader', () => ({
      loadCefr: async () => Promise.reject(new Error('fixture CEFR lỗi')),
    }))
    vi.doMock('../../data/curriculumLoader', () => ({ loadFoundationIndex: async () => [] }))
    localStorage.setItem('et_learned_u1', JSON.stringify(['hello']))
    seedActivityDaysAgo('u1', 5)
    mockAuth({ id: 'u1', name: 'An', email: 'an@vd.vn' })
    await hien()
    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })
    const companion = container.querySelector('[data-testid="home-companion"]')
    expect(companion?.getAttribute('data-reserve-comeback')).toBe('false')
    expect(companion?.getAttribute('data-has-comeback')).toBe('false')
  })

  it('chỉ có hoạt động Programming, không bằng chứng English: không comeback và không reserve', async () => {
    seedActivityDaysAgo('u1', 5)
    mockAuth({ id: 'u1', name: 'An', email: 'an@vd.vn' })
    await hien()
    const companion = container.querySelector('[data-testid="home-companion"]')
    expect(companion?.getAttribute('data-reserve-comeback')).toBe('false')
    expect(companion?.getAttribute('data-has-comeback')).toBe('false')
  })
})

// [P0-1] AC-2 + AC-3: `pickHomeBanner` chọn ĐÚNG MỘT banner phụ, và khối "Hôm nay" đứng TRƯỚC
// mọi banner phụ trong DOM.
describe('Home — banner phụ (P0-1)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.resetModules()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.doUnmock('../../context/useAuth')
    vi.doUnmock('../../lib/appSettings')
    vi.doUnmock('../../lib/rewardTip')
  })

  async function hienVoiBanner() {
    const { default: HomeAfterMock } = await import('./Home')
    root = createRoot(container)
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <HomeAfterMock />
        </MemoryRouter>,
      )
    })
  }

  it('AC-2: có cả khuyến mãi giá (còn nhiều ngày) LẪN mẹo thưởng → chỉ MỘT [data-home-banner], đúng kind pricePromo (ưu tiên cao hơn)', async () => {
    vi.doMock('../../context/useAuth', () => ({
      useAuth: () => ({ user: { id: 'u2', name: 'Bình', email: 'binh@vd.vn', plan: 'free' } }),
    }))
    // Khuyến mãi giá còn 20 ngày (không "sắp hết" — chỉ đủ điều kiện `pricePromo`, không phải
    // `promoEnding`) VÀ có mẹo thưởng chưa xem cùng lúc.
    vi.doMock('../../lib/appSettings', () => ({
      getAppSettings: () => ({ promoUntil: new Date(Date.now() + 20 * 86400000).toISOString() }),
    }))
    vi.doMock('../../lib/rewardTip', () => ({ shouldShowRewardTip: () => true }))
    await hienVoiBanner()
    const banners = container.querySelectorAll('[data-home-banner]')
    expect(banners).toHaveLength(1)
    expect(banners[0].getAttribute('data-home-banner-kind')).toBe('pricePromo')
  })

  it('AC-3: tiêu đề "Hôm nay" (#today-card-heading) đứng TRƯỚC banner phụ trong DOM', async () => {
    vi.doMock('../../context/useAuth', () => ({
      useAuth: () => ({ user: { id: 'u3', name: 'Chi', email: 'chi@vd.vn', plan: 'free' } }),
    }))
    vi.doMock('../../lib/appSettings', () => ({
      getAppSettings: () => ({ promoUntil: new Date(Date.now() + 20 * 86400000).toISOString() }),
    }))
    vi.doMock('../../lib/rewardTip', () => ({ shouldShowRewardTip: () => false }))
    await hienVoiBanner()
    const heading = container.querySelector('#today-card-heading')
    const banner = container.querySelector('[data-home-banner]')
    expect(heading).not.toBeNull()
    expect(banner).not.toBeNull()
    // DOCUMENT_POSITION_FOLLOWING (4): `banner` đứng SAU `heading` trong cây DOM.
    const viTri = heading!.compareDocumentPosition(banner!)
    expect(viTri & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('không có khuyến mãi lẫn mẹo thưởng → không có banner phụ nào', async () => {
    vi.doMock('../../context/useAuth', () => ({
      useAuth: () => ({ user: { id: 'u4', name: 'Dung', email: 'dung@vd.vn', plan: 'free' } }),
    }))
    vi.doMock('../../lib/appSettings', () => ({ getAppSettings: () => ({ promoUntil: null }) }))
    vi.doMock('../../lib/rewardTip', () => ({ shouldShowRewardTip: () => false }))
    await hienVoiBanner()
    expect(container.querySelectorAll('[data-home-banner]')).toHaveLength(0)
  })
})

// [P1-5, lệnh 7] AC-4: khách không có dữ liệu cá nhân để vẽ 7 chấm → `WeekRhythm` không render.
describe('Home — WeekRhythm ẩn với khách (AC-4)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    vi.doUnmock('../../context/useAuth')
  })

  it('khách (isGuest) → không có [data-dot] nào trên trang chủ', async () => {
    vi.doMock('../../context/useAuth', () => ({
      useAuth: () => ({ user: { id: 'guest_2', name: 'Khách', email: '', isGuest: true } }),
    }))
    const { default: HomeAfterMock } = await import('./Home')
    root = createRoot(container)
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <HomeAfterMock />
        </MemoryRouter>,
      )
    })
    expect(container.querySelectorAll('[data-dot]')).toHaveLength(0)
  })
})
