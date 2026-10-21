// e2e/a11y-companion-link.spec.ts — Cổng a11y cho khối "Người thân theo dõi" (trang Hồ sơ).
//
// Cùng lý do tồn tại như `a11y-2fa.spec.ts`: `e2e/a11y.spec.ts` không quét `/profile`, và khối
// này chỉ render khi `/api/companion-link` trả 200 (không có backend trong E2E → phải giả lập).
// Quét CẢ hai trạng thái đáng ngờ nhất về tương phản: danh sách "Họ thấy / Họ KHÔNG thấy" (chữ
// xanh lá + hồng trên nền tối) và mã mời (chữ màu nhấn trên nền tối).
//
// Phạm vi quét giới hạn trong chính khối (`include`) — không biến spec này thành cổng cho toàn
// bộ trang Hồ sơ vốn chưa từng được gác.
//
// Chiều B (2026-09-03, trả nợ): khối nay có bản tiếng Anh — quét thêm 1 vòng ở `direction='B'`
// (2 theme đại diện, giống cách `a11y.spec.ts` gác trang chủ chiều B) để không lặp lại y hệt
// việc quét 5 theme đã làm ở chiều A.

import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, type ThemeName } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'

const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']
const SECTION = '#companion-link-section'

async function mockApi(page: Page) {
  await page.route('**/api/companion-link*', async (route) => {
    const req = route.request()
    if (req.method() === 'GET') {
      return route.fulfill({
        json: {
          watchers: [
            {
              linkId: '44444444-4444-4444-8444-444444444444',
              userId: 'u2',
              name: 'Mẹ',
              relation: 'family',
              createdAt: '2026-08-20T00:00:00.000Z',
              lastReportAt: '2026-08-24T12:00:00.000Z',
            },
          ],
          following: [{ linkId: '55555555-5555-4555-8555-555555555555', userId: 'u3', name: 'Na' }],
        },
      })
    }
    return route.fulfill({
      json: { code: 'ABCDEFGH2345', expiresAt: '2026-08-27T00:00:00.000Z' },
    })
  })
}

async function scanSection(page: Page, tags: string[]) {
  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page }).include(SECTION).withTags(tags).analyze()
  return violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} phần tử)`)
}

const AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

for (const theme of THEMES) {
  test(`a11y: khối Người thân theo dõi theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await mockLogin(page, 'vi', theme)
    await mockApi(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    const section = page.locator(SECTION)
    await section.waitFor({ state: 'visible', timeout: 15_000 })

    // Mở phần "Họ thấy được những gì?" và tạo mã mời — hai trạng thái mới sinh ra màu mới.
    await page.getByText('Họ thấy được những gì?').click()
    await page.getByRole('button', { name: 'Tạo mã mời người thân' }).click()
    await expect(page.getByRole('button', { name: 'Chép mã' })).toBeVisible()

    expect(await scanSection(page, AA_TAGS)).toEqual([])
  })
}

test('a11y AAA: chữ nội dung trong khối đạt tương phản ≥ 7:1', async ({ page }) => {
  await mockLogin(page, 'vi')
  await mockApi(page)
  await page.goto('/profile', { waitUntil: 'domcontentloaded' })
  await page.locator(SECTION).waitFor({ state: 'visible', timeout: 15_000 })
  await page.getByText('Họ thấy được những gì?').click()

  expect(await scanSection(page, ['wcag2aaa'])).toEqual([])
})

const DIRECTION_B_THEMES: ThemeName[] = ['blue-sky']

for (const theme of DIRECTION_B_THEMES) {
  test(`a11y: khối Follow along (chiều B) theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await mockLogin(page, 'en', theme)
    await page.addInitScript(() => localStorage.setItem('et_direction', 'B'))
    await mockApi(page)
    await page.goto('/profile', { waitUntil: 'domcontentloaded' })

    const section = page.locator(SECTION)
    await section.waitFor({ state: 'visible', timeout: 15_000 })

    await page.getByText('What can they see?').click()
    await page.getByRole('button', { name: 'Create invite code' }).click()
    await expect(page.getByRole('button', { name: 'Copy code' })).toBeVisible()

    expect(await scanSection(page, AA_TAGS)).toEqual([])
  })
}

test('a11y AAA chiều B: chữ nội dung trong khối đạt tương phản ≥ 7:1', async ({ page }) => {
  await mockLogin(page, 'en')
  await page.addInitScript(() => localStorage.setItem('et_direction', 'B'))
  await mockApi(page)
  await page.goto('/profile', { waitUntil: 'domcontentloaded' })
  await page.locator(SECTION).waitFor({ state: 'visible', timeout: 15_000 })
  await page.getByText('What can they see?').click()

  expect(await scanSection(page, ['wcag2aaa'])).toEqual([])
})
