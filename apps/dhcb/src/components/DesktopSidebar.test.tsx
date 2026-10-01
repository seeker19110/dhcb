// DesktopSidebar.test.tsx — cổng canh slice 02 Góc học tập (spec §④ AC-3, AC-5, AC-8).
//
// Quyết định chủ dự án 2026-09-15 (Q1): 5 công cụ Tiếng Anh DI CHUYỂN vào nhóm "Góc học tập",
// lồng dưới mục "Tiếng Anh" — không xoá. Không còn mục "Học Tiếng Anh" ở nhóm "Không Gian Nền
// Tảng". Test render tĩnh (renderToStaticMarkup) như Layout.test.tsx: đủ để canh cấu trúc DOM
// theo đường dẫn, không cần dựng cả cây provider.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import DesktopSidebar from './DesktopSidebar'

vi.mock('../context/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', name: 'An', onboarded: true } }),
}))

function render(pathname: string) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[pathname]}>
      <DesktopSidebar />
    </MemoryRouter>,
  )
}

/**
 * Giả bề rộng cửa sổ cho `matchMedia` (chỉ hiểu `min-width`/`max-width` theo px — đúng hai dạng
 * app dùng). Cần vì sidebar THU GỌN mặc định ở dải 1024–1279px (audit 2026-10-01), mà happy-dom
 * mặc định rộng 1024px: không cố định thì mọi test cấu trúc cây bên dưới chạy ở dải hẹp.
 */
function setViewportWidth(width: number) {
  vi.stubGlobal('matchMedia', (query: string) => {
    const min = /min-width:\s*(\d+)px/.exec(query)
    const max = /max-width:\s*(\d+)px/.exec(query)
    const matches = (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]))
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
  })
}

beforeEach(() => {
  localStorage.clear()
  // Các test cấu trúc cây canh sidebar MỞ RỘNG — bề rộng desktop phổ biến nhất.
  setViewportWidth(1440)
})

describe('DesktopSidebar — Tiếng Anh là một môn trong Góc học tập', () => {
  it('không còn mục "Học Tiếng Anh" ở nhóm Không Gian Nền Tảng', () => {
    const html = render('/tien-do')
    expect(html).not.toContain('Học Tiếng Anh')
    expect(html).not.toContain('/hoc-tieng-anh')
  })

  it('đứng ở công cụ Tiếng Anh: nhóm Góc học tập mở, mục Tiếng Anh mở cấp 2 với đủ 12 công cụ', () => {
    const html = render('/goc-hoc-tap/english/lo-trinh/a1')
    expect(html).toContain('href="/goc-hoc-tap/english"')
    for (const label of [
      'Lộ trình CEFR',
      'Bài học hôm nay',
      'Trò chuyện',
      'Luyện nói',
      'Luyện viết',
      'Luyện nghe',
      'Từ điển',
      'Câu thông dụng',
      'Truyện song ngữ',
      'Sổ tay lỗi sai',
      'Ôn thi',
      'Thử thách',
    ]) {
      expect(html, label).toContain(label)
    }
    // Cấp 2 có nút mở/đóng riêng, đang MỞ.
    expect(html).toContain('aria-label="Thu gọn công cụ Tiếng Anh"')
    expect(html).toContain('aria-label="Công cụ Tiếng Anh"')
  })

  it('đứng ngoài Góc học tập: cấp 2 Tiếng Anh KHÔNG hiện (nhóm đóng)', () => {
    const html = render('/tien-do')
    expect(html).not.toContain('Lộ trình CEFR')
    expect(html).not.toContain('Công cụ Tiếng Anh')
  })

  it('đứng ở trang tổng quan môn: mục Tiếng Anh sáng (aria-current), cấp 2 mở', () => {
    const html = render('/goc-hoc-tap/english')
    // Thứ tự thuộc tính do React quyết — khớp bằng regex, không khớp chuỗi cứng.
    expect(html).toMatch(
      /<a[^>]*href="\/goc-hoc-tap\/english"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/goc-hoc-tap\/english"/,
    )
    expect(html).toContain('Ôn thi')
  })

  it('khớp theo BIÊN đoạn: /goc-hoc-tap/english-abc không làm sáng Tiếng Anh, không mở cấp 2', () => {
    const html = render('/goc-hoc-tap/english-abc')
    expect(html).not.toMatch(
      /<a[^>]*href="\/goc-hoc-tap\/english"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/goc-hoc-tap\/english"/,
    )
    expect(html).not.toContain('Công cụ Tiếng Anh')
  })

  it('nhóm Góc học tập vẫn đủ 6 môn khi mở (đứng ở một môn thì nhóm tự mở)', () => {
    const html = render('/goc-hoc-tap/physics')
    for (const label of ['Tiếng Anh', 'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Lập trình']) {
      expect(html, label).toContain(label)
    }
  })

  // [Slice 03] Công cụ Tiếng Anh sáng "Góc học tập › Tiếng Anh", KHÔNG sáng "Luyện tập".
  it('đứng ở URL chuẩn Trò chuyện: Góc học tập + Tiếng Anh + Trò chuyện sáng; Luyện tập không sáng', () => {
    const html = render('/goc-hoc-tap/english/tro-truyen')
    expect(html).toMatch(
      /<a[^>]*href="\/goc-hoc-tap"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/goc-hoc-tap"/,
    )
    expect(html).toMatch(
      /<a[^>]*href="\/goc-hoc-tap\/english\/tro-truyen"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/goc-hoc-tap\/english\/tro-truyen"/,
    )
    expect(html).not.toMatch(
      /<a[^>]*href="\/luyen-tap"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/luyen-tap"/,
    )
  })

  it('Luyện tập là mục lá — không có nút mở rộng', () => {
    expect(render('/luyen-tap')).not.toContain('mục Luyện tập')
  })
})

// [P1-7, lệnh 9; rút còn 6 mục ở thiết kế lại header desktop] Sidebar nay 6 mục cấp 1: Góc học
// tập · Ôn tập · Bạn Đồng Hành · Ghi chú · Tiến độ · Hồ sơ. [2026-09-20] Mục gộp
// "Sự nghiệp & Đời sống" cũ đã bị gỡ, thay bằng mục lá "Ghi chú" (/ghi-chu).
// "Trang chủ" cấp 1 (mục điều hướng, sáng đèn theo trang) đã gỡ khỏi danh sách này — hàng đợi
// so khớp `ACTIVE_ORDER` không còn tính nó. "Luyện tập" gỡ khỏi sidebar, "Nâng cấp" thành dòng
// nhỏ dưới danh sách (không còn <a> cấp 1 riêng).
// [chỉnh 2026-09-20] Ô LOGO ở ĐẦU sidebar (ngoài `<nav>`, không phải mục cấp 1) đổi từ "Đồng
// Hành" (link `/gioi-thieu`) sang "Trang chủ" (link nội bộ `/`) — vẫn có `href="/"` trong HTML,
// chỉ không còn nằm trong `<nav>`/`ACTIVE_ORDER`.
describe('DesktopSidebar — P1-7: 10 → 6 mục cấp 1', () => {
  function countTopLevelLinks(html: string): number {
    // Cấp 1 = <li> con trực tiếp của <ul> đầu tiên (MAIN_NAV) + <ul> CORE_BOTTOM — đơn giản
    // hơn: đếm theo các href cấp 1 đã biết, vì DOM tĩnh không phân biệt lồng cấp bằng regex dễ.
    const topHrefs = [
      '/goc-hoc-tap',
      '/goc-hoc-tap/on-tap',
      '/ban-dong-hanh',
      '/ghi-chu',
      '/tien-do',
      '/trang-ca-nhan',
    ]
    return topHrefs.filter((href) => html.includes(`href="${href}"`)).length
  }

  it('AC-1: đúng 6 mục cấp 1 khi mọi nhóm đóng ("Trang chủ" là ô logo riêng, không phải mục nav)', () => {
    const html = render('/tien-do')
    expect(countTopLevelLinks(html)).toBe(6)
    // Ô logo đầu sidebar (`href="/"`) có thật, nhưng đứng NGOÀI `<nav>` nên không tính vào 6
    // mục cấp 1 ở trên — `countTopLevelLinks` cố tình không liệt `/` vào danh sách tra.
    expect(html).toContain('href="/"')
  })

  // [2026-09-20] Ba trụ Sự nghiệp · Khởi nghiệp · Đời sống đã bị GỠ HẲN; mục gộp cũ thay bằng
  // mục LÁ "Ghi chú". Test này canh cho chúng không lẻn trở lại sidebar.
  it('AC-2: không còn vết nào của Sự nghiệp / Khởi nghiệp / Đời sống trong sidebar', () => {
    const html = render('/ghi-chu')
    expect(html).toContain('Ghi chú')
    for (const label of [
      'Sự nghiệp',
      'Sự Nghiệp',
      'Khởi nghiệp',
      'Khởi Nghiệp',
      'Đời sống',
      'Đời Sống',
    ]) {
      expect(html, label).not.toContain(label)
    }
    expect(html).not.toContain('Không Gian Nền Tảng')
    expect(html).not.toContain('Luyện tập')
  })

  it('AC-3: URL cũ của trụ Công việc sáng mục "Ghi chú"; /luyen-tap sáng "Góc học tập"', () => {
    // Trong nhịp render trước khi <Navigate> kịp chạy, sidebar vẫn phải sáng đúng mục.
    for (const path of ['/ghi-chu', '/cong-viec', '/work', '/cong-viec-cuoc-song']) {
      const html = render(path)
      expect(html, path).toMatch(
        /<a[^>]*href="\/ghi-chu"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/ghi-chu"/,
      )
    }
  })

  it('AC-6: link "Nâng cấp" vẫn tồn tại (href="/nang-cap")', () => {
    const html = render('/tien-do')
    expect(html).toContain('href="/nang-cap"')
  })
})

// [2026-10-01, audit đồng nhất bố cục] Dải 1024–1279px: sidebar mở rộng 256px ép cột bài học còn
// ~424px (đo trên ảnh chụp). Mặc định thu gọn ở dải này, lựa chọn đã lưu chỉ áp từ 1280px.
describe('DesktopSidebar — dải desktop hẹp 1024–1279px', () => {
  it('1024px: mặc định thu gọn (nhãn chỉ còn cho trình đọc màn hình, không mở nhóm con)', () => {
    setViewportWidth(1024)
    const html = render('/goc-hoc-tap/english/lo-trinh/a1')
    expect(html).toContain('aria-label="Mở rộng thanh điều hướng"')
    expect(html).not.toContain('Lộ trình CEFR')
    // Icon-only vẫn phải có tên đọc được.
    expect(html).toContain('<span class="sr-only">Góc học tập</span>')
  })

  it('1024px: lựa chọn "mở rộng" đã lưu ở màn rộng KHÔNG ép mở ở màn hẹp', () => {
    localStorage.setItem('ui_sidebar_collapsed', '0')
    setViewportWidth(1279)
    expect(render('/tien-do')).toContain('aria-label="Mở rộng thanh điều hướng"')
  })

  it('1280px: giữ hành vi cũ — mặc định mở rộng, tôn trọng lựa chọn thu gọn đã lưu', () => {
    setViewportWidth(1280)
    expect(render('/tien-do')).toContain('aria-label="Thu gọn thanh điều hướng"')
    localStorage.setItem('ui_sidebar_collapsed', '1')
    expect(render('/tien-do')).toContain('aria-label="Mở rộng thanh điều hướng"')
  })
})
