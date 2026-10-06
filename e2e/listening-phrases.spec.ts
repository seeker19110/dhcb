// e2e/listening-phrases.spec.ts — Cổng canh audit 2026-09-22 P0-1: tab "Mẫu câu" (trước là "Câu thông dụng") của
// Luyện nghe từng in phẳng 1.000 thẻ (74.309px ở 390px). Nay nhóm theo chủ đề + tìm kiếm +
// "Xem thêm"; trang ở 390px phải nằm trong ~4 màn hình.
import { test, expect } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { muteTts } from './helpers/tts'

const ROUTE = '/goc-hoc-tap/english/luyen-nghe'

test.describe('Luyện nghe — tab Mẫu câu', () => {
  test.beforeEach(async ({ page }) => {
    await mockLogin(page)
    await muteTts(page)
  })

  test('390px: trang ≤ 4 màn hình, nhóm đầu mở sẵn, nhóm khác gập', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
    const groups = page.getByRole('button', { expanded: true })
    await expect(groups.first()).toBeVisible()
    expect(await page.getByRole('button', { expanded: false }).count()).toBeGreaterThan(3)
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    expect(height, `trang cao ${height}px`).toBeLessThanOrEqual(844 * 4)
  })

  test('tìm kiếm lọc mẫu câu và mở mọi nhóm khớp', async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
    await page.getByRole('searchbox').fill('I want')
    await expect(page.getByRole('button', { name: /^I want to/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^You are/ })).toHaveCount(0)
  })

  test('"Xem thêm" nạp thêm thẻ trong nhóm', async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
    // Nhóm lớn nhất ("Người (số ít)", 680 mẫu) đang gập — mở nó rồi bấm Xem thêm.
    await page.getByRole('button', { name: /Người \(số ít\)/ }).click()
    const more = page.getByRole('button', { name: /Xem thêm/ }).first()
    await expect(more).toBeVisible()
    const before = await page.locator('section [role=button], section button').count()
    await more.click()
    expect(await page.locator('section [role=button], section button').count()).toBeGreaterThan(
      before,
    )
  })
})
