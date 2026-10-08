import { test, expect } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { muteTts } from './helpers/tts'

// Cổng BỀ RỘNG NỘI DUNG (audit UI/UX 2026-09-30 M17, changelog 0516).
//
// Audit đo được 11 bề rộng nội dung khác nhau ở 1440px (448 → 1152px). Đo lại 2026-10-08 trên
// 40+ route: còn ĐÚNG bốn giá trị, mỗi giá trị một lý do —
//   • 1152 — `PageShell width="standard"`: bề rộng chuẩn, thẳng mép với header.
//   • 1184 — `width="fluid"`: tự co theo viewport trừ thanh bên 256px (Trang chủ, Tiến độ).
//   • 768  — `width="reading"`: trang chủ yếu là chữ (Cài đặt, Giới thiệu, Xếp lớp).
//   • 448  — biểu mẫu một cột có chủ đích (`/bat-dau`).
// Test này chốt các số đó theo từng route đại diện: trang nào tự đặt `max-w-*` riêng thay vì
// chọn loại nội dung của `PageShell` sẽ lệch số và đỏ ở đây. Muốn đổi bề rộng một trang thì sửa
// bảng dưới ĐỒNG THỜI với lý do — đừng sửa cho test vừa.
//
// Chỉ đo `<main id="noi-dung-chinh">` (khung `PageShell`) và khối con đầu tiên; mock đăng nhập
// là đủ vì khung dựng trước khi dữ liệu về.
const AT_1440: Array<{ route: string; main: number; child: number; why: string }> = [
  { route: '/', main: 1184, child: 1152, why: 'fluid' },
  { route: '/tien-do', main: 1184, child: 1152, why: 'fluid' },
  { route: '/goc-hoc-tap', main: 1152, child: 1120, why: 'standard' },
  { route: '/goc-hoc-tap/english', main: 1152, child: 1120, why: 'standard' },
  { route: '/luyen-tap', main: 1152, child: 1120, why: 'standard' },
  { route: '/trang-ca-nhan', main: 1152, child: 1120, why: 'standard' },
  { route: '/nang-cap', main: 1152, child: 1120, why: 'standard' },
  { route: '/ghi-chu', main: 1152, child: 1120, why: 'standard' },
  { route: '/ban-dong-hanh', main: 1152, child: 1120, why: 'standard' },
  { route: '/cai-dat', main: 768, child: 736, why: 'reading' },
  { route: '/gioi-thieu', main: 768, child: 736, why: 'reading' },
  { route: '/placement', main: 768, child: 736, why: 'reading' },
  { route: '/bat-dau', main: 1184, child: 448, why: 'biểu mẫu một cột có chủ đích' },
]

test.describe('Bề rộng nội dung ở 1440px chỉ thuộc bốn giá trị đã chốt', () => {
  test.use({ viewport: { width: 1440, height: 900 } })
  for (const { route, main, child, why } of AT_1440) {
    test(`${route} — main ${main}px (${why})`, async ({ page }) => {
      await mockLogin(page, 'vi', 'blue-sky')
      await muteTts(page)
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('main#noi-dung-chinh', { timeout: 30_000 })
      await page.waitForTimeout(1200)
      const got = await page.evaluate(() => {
        const m = document.getElementById('noi-dung-chinh') as HTMLElement
        const kid = Array.from(m.children).find((c) => (c as HTMLElement).offsetHeight > 40)
        return {
          main: Math.round(m.getBoundingClientRect().width),
          child: kid ? Math.round(kid.getBoundingClientRect().width) : 0,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        }
      })
      expect(got.main, `${route}: bề rộng <main>`).toBe(main)
      expect(got.child, `${route}: bề rộng khối nội dung đầu`).toBe(child)
      expect(got.overflow, `${route}: tràn ngang`).toBeLessThanOrEqual(0)
    })
  }
})

// Ở 1024px thanh bên tự thu thành rail (M18, `DesktopSidebar.tsx`): nội dung phải ĐƯỢC cả phần
// bề rộng giải phóng, không ép lại ~424px như audit đo ngày 2026-09-30.
test.describe('Dải 1024px: cột chính không bị ép', () => {
  test.use({ viewport: { width: 1024, height: 800 } })
  for (const route of ['/', '/goc-hoc-tap', '/luyen-tap']) {
    test(`${route} — main ≥ 900px`, async ({ page }) => {
      await mockLogin(page, 'vi', 'blue-sky')
      await muteTts(page)
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector('main#noi-dung-chinh', { timeout: 30_000 })
      await page.waitForTimeout(1200)
      const w = await page.evaluate(() =>
        Math.round(document.getElementById('noi-dung-chinh')!.getBoundingClientRect().width),
      )
      expect(w).toBeGreaterThanOrEqual(900)
    })
  }
})
