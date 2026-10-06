import { test, expect } from '@playwright/test'
import { mockLogin } from './helpers/auth'

// Gợi ý "Tiếp tục" (đánh dấu "đã xem" cho Lessons/CommonPhrases) — phần phụ của
// U-5, xem docs/research/cai-tien-ui-ux.md.
test.describe('Gợi ý "Tiếp tục" — đánh dấu đã xem', () => {
  // [U9b, audit 2026-09-30 M19] Hợp đồng mới: "Tiếp tục" trỏ BÀI ĐANG HỌC (bài mở gần nhất),
  // không phải "bài đầu tiên chưa xem" — vừa mở Bài 1 thì "Tiếp tục" phải là Bài 1, không Bài 2.
  test('Lessons: người mới → "Bắt đầu" bài 1; đang mở bài 1 → "Bài tiếp theo" bài 2; quay lại danh sách → "Tiếp tục" bài 1', async ({
    page,
  }) => {
    await mockLogin(page, 'vi')
    await page.goto('/bai-hoc')
    const cta = page.getByRole('button', { name: /^Bắt đầu\s*Bài 1/ })
    await expect(cta).toBeVisible()
    await cta.click()
    // [2026-09-05, đợt 1 "desktop giáo dục"] Playwright chạy ở 1280px, tức nhánh MASTER–DETAIL:
    // danh sách bài ở nguyên cột trái, nội dung bài mở ở cột phải. Kiểm bằng `aria-current` của
    // thẻ bài (id ổn định) — tiêu đề bài xuất hiện ở CẢ hai chỗ nên `getByText` vi phạm
    // strict-mode; `aria-current` cũng chính là hợp đồng a11y.
    await expect(page.locator('#lesson-card-1')).toHaveAttribute('aria-current', 'true')
    // Đang mở bài 1: gợi ý ở cột trái là bài KẾ TIẾP, gọi đúng tên "Bài tiếp theo".
    await expect(page.getByRole('button', { name: /^Bài tiếp theo\s*Bài 2/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Tiếp tục/ })).toHaveCount(0)

    // Rời bài về danh sách: "Tiếp tục" là chính bài đang học — Bài 1.
    await page.goto('/bai-hoc')
    await expect(page.getByRole('button', { name: /^Tiếp tục\s*Bài 1/ })).toBeVisible()
  })

  // [U9b nối tiếp] Cùng luật `suggestContinue`: mở chủ đề rồi quay lại → "Tiếp tục" CHÍNH chủ đề
  // đó (đang học), không nhảy sang chủ đề kế như trước.
  test('CommonPhrases: người mới → "Bắt đầu"; mở một chủ đề rồi quay lại → "Tiếp tục" đúng chủ đề đó', async ({
    page,
  }) => {
    await mockLogin(page, 'vi')
    await page.goto('/cau-thong-dung')
    const cta = page.getByRole('button', { name: /^Bắt đầu/ })
    await expect(cta).toBeVisible()
    const chuDe = (await cta.innerText()).replace(/^Bắt đầu\s*/, '').trim()
    expect(chuDe.length).toBeGreaterThan(0)
    await cta.click()
    await expect(page.getByRole('button', { name: /^Bắt đầu/ })).toHaveCount(0)
    await page.goto('/cau-thong-dung')
    const tiepTuc = page.getByRole('button', { name: /^Tiếp tục/ })
    await expect(tiepTuc).toBeVisible()
    await expect(tiepTuc).toContainText(chuDe)
  })
})
