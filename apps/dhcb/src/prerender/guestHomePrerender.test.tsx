// guestHomePrerender.test.tsx — Canh bản HTML dựng sẵn của trang chủ khách KHÔNG lệch khỏi
// component thật. File `guestHome.prerender.html` là đầu ra của chính phép render này; Vite chèn
// nó vào index.html lúc build (plugin trong apps/dhcb/vite.config.ts).
//
// ĐỎ ở đây = đã sửa một component trong cây trang chủ khách mà chưa sinh lại bản dựng sẵn.
// Cách sửa: `npm run gen:prerender-home`, xem diff file .html rồi commit cùng thay đổi.
import { join } from 'node:path'
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { format, resolveConfig } from 'prettier'
import { GuestHomePrerender } from './GuestHomePrerender'

vi.mock('../lib/analytics', () => ({ track: vi.fn() }))

// Bản dựng sẵn chỉ dùng cho màn HẸP (xem shouldShowGuestPrerender) → render như máy mobile, theme
// mặc định: MỌI media query đều không khớp (không desktop, không chế độ tối, không giảm chuyển động).
vi.spyOn(window, 'matchMedia').mockImplementation(
  (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList,
)

describe('bản dựng sẵn trang chủ khách', () => {
  localStorage.clear()
  const html = renderToStaticMarkup(<GuestHomePrerender />)

  it('khớp guestHome.prerender.html (sai → npm run gen:prerender-home)', async () => {
    // Định dạng bằng CHÍNH cấu hình Prettier của repo: file sinh ra qua được `format:check` và diff
    // của nó đọc được khi review (thay vì một dòng ~14 KB). Prettier giữ nguyên ngữ nghĩa khoảng
    // trắng của HTML (htmlWhitespaceSensitivity mặc định 'css') nên trang vẽ ra không đổi.
    const file = join(__dirname, 'guestHome.prerender.html')
    const formatted = await format(html, { ...(await resolveConfig(file)), filepath: file })
    await expect(formatted).toMatchFileSnapshot('./guestHome.prerender.html')
  })

  it('có đủ nội dung chính của trang chủ khách, không có khung chờ', () => {
    expect(html).toContain('id="noi-dung-chinh"')
    expect(html).toContain('Bắt đầu — chọn việc đầu tiên')
    expect(html).toContain('href="/bat-dau"')
    expect(html).not.toContain('data-page-loading')
    expect(html).not.toContain('aria-busy')
  })

  it('không chứa id riêng của máy hay chuỗi ngẫu nhiên', () => {
    expect(html).not.toContain('guest_prerender')
    expect(html).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/)
  })
})
