import { test, expect, type Page } from '@playwright/test'
import { mockLogin } from './helpers/auth'

// ──────────────────────────────────────────────────────────────────────────────
// Trang cấp CEFR trên mobile: vị trí cuộn khi mở/đóng màn con (changelog 0605).
//
// Trước đây trang giữ nguyên `scrollY` của danh sách khi mở một vòng từ vựng: bấm vòng ở cuối danh
// sách là thẻ từ mở ra lưng chừng. Từ 0603 (màn con nạp lười) lần mở ĐẦU lại về đầu còn các lần sau
// thì không. Nay chốt: mở → về đầu màn con; đóng → danh sách về đúng chỗ đang đọc lúc bấm mở.
// ──────────────────────────────────────────────────────────────────────────────

test.use({ viewport: { width: 390, height: 844 } })

const CAP_A1 = '/goc-hoc-tap/english/lo-trinh/a1'
// Hai vòng nằm ở phần 6 (cuối các phần chính) của A1 — phải cuộn xa mới thấy.
const VONG = [
  { nut: /^❓ Từ để hỏi & giới từ/, tieuDe: 'Từ để hỏi & giới từ' },
  { nut: /^🧍 Cơ thể/, tieuDe: 'Cơ thể' },
] as const

const scrollY = (page: Page) => page.evaluate(() => window.scrollY)

test('mở vòng từ vựng ở cuối danh sách → về đầu màn; đóng → danh sách về chỗ cũ (2 lần liền)', async ({
  page,
}) => {
  test.setTimeout(120_000)
  await mockLogin(page, 'vi', 'blue-sky')
  await page.goto(CAP_A1, { waitUntil: 'domcontentloaded' })

  for (const vong of VONG) {
    const nut = page.getByRole('button', { name: vong.nut })
    await nut.scrollIntoViewIfNeeded({ timeout: 60_000 })
    const yDanhSach = await scrollY(page)
    expect(yDanhSach).toBeGreaterThan(400)

    await nut.click()
    await expect(page.getByText(vong.tieuDe, { exact: true })).toBeVisible({ timeout: 60_000 })
    await expect.poll(() => scrollY(page)).toBe(0)

    await page.getByRole('button', { name: 'Quay lại', exact: true }).click()
    await expect(nut).toBeVisible()
    // Dung sai nhỏ: thanh header dính có thể làm trình duyệt làm tròn khác nhau vài px.
    await expect.poll(async () => Math.abs((await scrollY(page)) - yDanhSach)).toBeLessThan(4)
  }
})
