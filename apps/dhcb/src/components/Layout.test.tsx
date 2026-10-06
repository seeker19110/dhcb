// apps/dhcb/src/components/Layout.test.tsx — Cổng canh CHẾ ĐỘ TẬP TRUNG của header.
//
// VÌ SAO CẦN (đợt B thiết kế lại UI/UX, 2026-09-03): trang ngồi học lâu bật `focus` để ẩn
// huy hiệu streak — thứ không phục vụ việc đang làm. Đây là thứ RẤT dễ mất im lặng: thêm một
// prop mới vào Layout, hay dựng lại khối streak, là cờ này thành no-op mà không có gì đỏ. Test
// dưới canh cả hai chiều (bật thì ẩn, TẮT thì vẫn còn) — chỉ canh chiều "ẩn" thì một Layout
// hỏng hẳn cũng qua được.
// [2026-09-20] Bộ chuyển Studio (dropdown "Studio" ở header) đã GỠ HẲN khỏi Layout — trùng với
// sidebar/trang Hồ sơ. Các test trước đây canh nó đã bỏ hoặc đổi sang canh "đã gỡ".
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import Layout from './Layout'

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'An' } }),
}))
vi.mock('../context/useLang', () => ({
  useLang: () => ({
    T: { home: 'Trang chủ', appName: 'Đồng Hành', aboutApp: 'Giới thiệu', streakDays: 'ngày' },
  }),
}))
vi.mock('../lib/storage', () => ({ getStreak: () => 7 }))
// ThemeToggle đòi ThemeContext của `@core/*`; test này chỉ quan tâm các khe khác của header
// nên thay bằng một chỗ giữ chỗ, không dựng cả cây provider chỉ để render một nút.
vi.mock('./ThemeToggle', () => ({ default: () => null }))

const render = (focus: boolean) =>
  renderToStaticMarkup(
    <MemoryRouter>
      <Layout title="Bài học" focus={focus} />
    </MemoryRouter>,
  )

describe('Layout — chế độ tập trung', () => {
  it('mặc định (focus tắt): còn huy hiệu streak', () => {
    const html = render(false)
    expect(html).toContain('🔥')
  })

  it('focus bật: ẩn huy hiệu streak', () => {
    const html = render(true)
    expect(html).not.toContain('🔥')
  })

  it('focus bật vẫn GIỮ đường lùi và nút Bạn Đồng Hành (trợ giúp ngay trong lúc học)', () => {
    const html = render(true)
    expect(html).toContain('Trang chủ')
    expect(html).toContain('Mở Bạn Đồng Hành AI')
  })

  it('không còn chấm nhấp nháy vĩnh viễn trong header', () => {
    expect(render(false)).not.toContain('animate-ping')
    expect(render(false)).not.toContain('animate-pulse')
  })
})

// [2026-09-20] Bộ chuyển Studio đã gỡ khỏi header — canh nó KHÔNG còn trong markup tĩnh.
describe('Layout — bộ chuyển Studio đã gỡ khỏi header', () => {
  it('header không còn dropdown Studio lẫn dấu vết không gian Học Tiếng Anh', () => {
    const html = render(false)
    expect(html).not.toContain('Chuyển đổi Studio')
    expect(html).not.toContain('Không Gian Nền Tảng')
    expect(html).not.toContain('Học Tiếng Anh')
    expect(html).not.toContain('/hoc-tieng-anh')
  })
})

// ── P0-4 (2026-09-17): header mobile 4 khe ──────────────────────────────────────────────
// Dưới 1024px, header phải RÚT xuống còn tối đa 4 phần tử tương tác (Back/Logo · [title] ·
// AI/streak · avatar) — bộ chuyển Studio và nút đổi giao diện dời hẳn sang trang Hồ sơ.
// happy-dom mặc định innerWidth=1024 (khớp `(min-width: 1024px)` → desktop), nên nhóm test
// này TỰ đặt viewport hẹp bằng `window.happyDOM.setViewport` trước khi render.
function withViewport(width: number) {
  ;(
    window as unknown as { happyDOM?: { setViewport: (o: { width: number }) => void } }
  ).happyDOM?.setViewport({ width })
}

function demSoPhanTuTuongTac(html: string): number {
  // Đếm thẻ <button ...> và <a ...> mở đầu trong markup tĩnh — đủ để canh SỐ LƯỢNG khe
  // tương tác của header mà không cần dựng cả cây provider để `getAllByRole` thật.
  const matches = html.match(/<(button|a)\b/g)
  return matches ? matches.length : 0
}

describe('Layout — header mobile 4 khe (P0-4)', () => {
  afterEach(() => withViewport(1024)) // trả viewport về mặc định cho các describe khác

  it('trang chủ, mobile (390px): không quá 4 phần tử tương tác trong header', () => {
    withViewport(390)
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Layout back={false} />
      </MemoryRouter>,
    )
    expect(demSoPhanTuTuongTac(html)).toBeLessThanOrEqual(4)
    // Nút đổi giao diện đã dời sang Hồ sơ — không còn ở header mobile. Bộ chuyển Studio đã
    // gỡ hẳn khỏi header (mọi bề rộng), không riêng gì mobile.
    expect(html).not.toContain('Chuyển đổi Studio')
  })

  it('trang thường, mobile (390px): không quá 4 phần tử tương tác trong header', () => {
    withViewport(390)
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/bai-hoc']}>
        <Layout title="Bài học" />
      </MemoryRouter>,
    )
    expect(demSoPhanTuTuongTac(html)).toBeLessThanOrEqual(4)
    expect(html).not.toContain('Chuyển đổi Studio')
  })

  it('chế độ tập trung, mobile (390px): không quá 3 phần tử tương tác trong header', () => {
    withViewport(390)
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/bai-hoc']}>
        <Layout title="Bài học" focus />
      </MemoryRouter>,
    )
    expect(demSoPhanTuTuongTac(html)).toBeLessThanOrEqual(3)
  })

  it('trang chủ, mobile (390px): ẩn nút "Đồng Hành AI" (Orb ở BottomNav đã là lối vào)', () => {
    withViewport(390)
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Layout back={false} />
      </MemoryRouter>,
    )
    expect(html).not.toContain('Mở Bạn Đồng Hành AI')
  })

  // [audit 2026-09-30 minor 9] Dưới 1024px Orb của BottomNav luôn có mặt → header không lặp
  // lối vào thứ hai, ở MỌI trang (không chỉ Trang chủ).
  it('trang thường, mobile (390px): KHÔNG còn nút "Đồng Hành AI" ở header', () => {
    withViewport(390)
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/bai-hoc']}>
        <Layout title="Bài học" />
      </MemoryRouter>,
    )
    expect(html).not.toContain('Mở Bạn Đồng Hành AI')
  })

  it('trang thường, desktop (≥1024px): còn nút "Đồng Hành AI" (không có BottomNav)', () => {
    withViewport(1280)
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/bai-hoc']}>
        <Layout title="Bài học" />
      </MemoryRouter>,
    )
    expect(html).toContain('Mở Bạn Đồng Hành AI')
  })

  it('desktop (≥1024px): không còn bộ chuyển Studio, vẫn còn nút "Trang chủ" ra ngoài app', () => {
    withViewport(1280)
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={['/bai-hoc']}>
        <Layout title="Bài học" />
      </MemoryRouter>,
    )
    expect(html).not.toContain('Chuyển đổi Studio')
    expect(html).toContain('Trang chủ Đồng Hành Cùng Bạn')
  })
})

// [2026-09-20] Nút "Trang chủ" ở header (ra ngoài app, tới `@dhcb/hub`) chỉ hiện khi sidebar
// KHÔNG đang mở rộng — sidebar mở rộng đã có sẵn nút "Trang chủ" riêng ở hàng đầu, đứng hai
// nút cùng chữ cạnh nhau là thừa. `document.documentElement.dataset.sidebar` là nơi
// `DesktopSidebar` ghi trạng thái mở/thu gọn — Layout đọc lại qua MutationObserver.
describe('Layout — nút "Trang chủ" header theo trạng thái sidebar', () => {
  afterEach(() => {
    withViewport(1024)
    delete document.documentElement.dataset.sidebar
  })

  it('sidebar mở rộng ("expanded"): ẩn nút "Trang chủ" ở header', () => {
    withViewport(1280)
    document.documentElement.dataset.sidebar = 'expanded'
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Layout back={false} />
      </MemoryRouter>,
    )
    expect(html).not.toContain('Trang chủ Đồng Hành Cùng Bạn')
  })

  it('sidebar thu gọn ("collapsed"): hiện lại nút "Trang chủ" ở header', () => {
    withViewport(1280)
    document.documentElement.dataset.sidebar = 'collapsed'
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Layout back={false} />
      </MemoryRouter>,
    )
    expect(html).toContain('Trang chủ Đồng Hành Cùng Bạn')
  })

  it('không có sidebar ("off", vd trang đăng nhập): vẫn hiện nút "Trang chủ" ở header', () => {
    withViewport(1280)
    document.documentElement.dataset.sidebar = 'off'
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <Layout back={false} />
      </MemoryRouter>,
    )
    expect(html).toContain('Trang chủ Đồng Hành Cùng Bạn')
  })
})

// `IS_REACT_ACT_ENVIRONMENT`: bắt buộc để `act()` bao mount thật (createRoot) không cảnh báo.
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('Layout — cờ document.documentElement.dataset.focus (P0-4 AC-2)', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    delete document.documentElement.dataset.focus
  })
  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    delete document.documentElement.dataset.focus
  })

  function dung(focus: boolean) {
    act(() => {
      root.render(
        <MemoryRouter>
          <Layout title="Bài học" focus={focus} />
        </MemoryRouter>,
      )
    })
  }

  it('focus=true: đặt dataset.focus = "1"', () => {
    dung(true)
    expect(document.documentElement.dataset.focus).toBe('1')
  })

  it('focus=false: KHÔNG có dataset.focus', () => {
    dung(false)
    expect(document.documentElement.dataset.focus).toBeUndefined()
  })

  it('unmount: xoá dataset.focus dù đang bật', () => {
    dung(true)
    expect(document.documentElement.dataset.focus).toBe('1')
    act(() => root.unmount())
    expect(document.documentElement.dataset.focus).toBeUndefined()
  })
})
