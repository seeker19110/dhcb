// e2e/sales-hunter-entry.spec.ts — Lối vào Sales-Hunter trên trang chủ (PR #1183).
//
// Khối này là ứng dụng RIÊNG (sales.donghanhcungban.org), chỉ đặt ở trang chủ. Spec gác bốn điều
// mà cổng a11y chung KHÔNG thấy vì khối mặc định đóng (`<details>`) nên chữ bên trong không được
// quét: (1) chỉ có ở `/`, không lọt vào trang khác; (2) mở được bằng bàn phím; (3) mặc định
// không có link ra ngoài; (4) khi mở, đạt AA ở 3 theme và chữ nội dung đạt AAA (≥ 7:1).

import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, type ThemeName } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'

const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']
const SECTION = '#sales-hunter-entry'
const AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function openWithKeyboard(page: Page) {
  const summary = page.locator(`${SECTION} summary`)
  await summary.focus()
  await page.keyboard.press('Enter')
  await expect(page.getByText(/Chưa mở truy cập/)).toBeVisible()
}

async function scanSection(page: Page, tags: string[]) {
  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page }).include(SECTION).withTags(tags).analyze()
  return violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} phần tử)`)
}

for (const theme of THEMES) {
  test(`Sales-Hunter: mở bằng bàn phím, 0 vi phạm A/AA + AAA theme=${theme}`, async ({ page }) => {
    await mockLogin(page, 'vi', theme)
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.locator(SECTION).waitFor({ state: 'visible', timeout: 15_000 })

    await openWithKeyboard(page)
    // Mặc định (không bật cờ build) KHÔNG có link nào dẫn ra ứng dụng Sales.
    await expect(page.locator(`${SECTION} a`)).toHaveCount(0)

    expect(await scanSection(page, AA_TAGS)).toEqual([])
    expect(await scanSection(page, ['wcag2aaa'])).toEqual([])
  })
}

test('Sales-Hunter chỉ ở trang chủ, không lọt vào trang khác', async ({ page }) => {
  await mockLogin(page, 'vi')
  await page.goto('/tien-do', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeAttached()
  await expect(page.locator(SECTION)).toHaveCount(0)
})
