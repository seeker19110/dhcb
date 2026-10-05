import { test, expect, type Page } from '@playwright/test'
import { mockLogin } from './helpers/auth'

// Hộp thoại mở từ các studio của Bạn Đồng Hành phải phủ ĐÚNG TOÀN CỬA SỔ (TRAPS mục 18,
// changelog 0474). Hai bẫy đã dính thật, cả hai làm lớp phủ `fixed inset-0` sai kích thước mà
// không cổng nào khác bắt được:
//   1. Tổ tiên giữ `transform` (`animate-fade-in` chạy với fill-mode `both`) → `fixed` neo theo
//      khung studio: hộp thoại lệch xuống nửa dưới, cắt mất nội dung, nền mờ không phủ sidebar.
//   2. Lớp phủ là con trực tiếp của `space-y-4` → Tailwind 4 gán `margin-bottom: 16px` → lớp phủ
//      hụt 16px ở đáy.
// Cách sửa: hộp thoại render qua `createPortal(…, document.body)` + hoạt ảnh không giữ transform.

const CASES = [
  { studio: 'Thử thách', trigger: /Mở bảng nháp/ },
  { studio: 'Ghi nhớ', trigger: /Khám phá Cung Điện/ },
]
const SIZES = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]

/** Khung của tổ tiên gần nhất có `position: fixed` chứa hộp thoại (tức lớp phủ). */
async function khungLopPhu(page: Page) {
  return page.getByRole('dialog').evaluate((dialog) => {
    let el: Element | null = dialog
    while (el && getComputedStyle(el).position !== 'fixed') el = el.parentElement
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  })
}

for (const c of CASES) {
  test(`hộp thoại studio "${c.studio}" phủ đúng toàn cửa sổ`, async ({ page }) => {
    await mockLogin(page, 'vi', 'dark-blue')
    for (const size of SIZES) {
      await page.setViewportSize(size)
      await page.goto('/ban-dong-hanh', { waitUntil: 'domcontentloaded' })
      await page
        .getByRole('button', { name: new RegExp(c.studio) })
        .first()
        .click()
      await page.getByRole('button', { name: c.trigger }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      // Chờ hoạt ảnh xuất hiện (≤ 0,4s) chạy xong — bẫy 1 chỉ lộ SAU khi hoạt ảnh kết thúc.
      await page.waitForTimeout(600)
      expect(await khungLopPhu(page), `${size.width}px`).toEqual({ x: 0, y: 0, ...size })
    }
  })
}
