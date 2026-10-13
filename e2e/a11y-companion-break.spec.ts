// e2e/a11y-companion-break.spec.ts — Cổng a11y cho lời nhắc nghỉ của Bạn Đồng Hành (GĐ4b,
// đặc tả docs/specs/2026-10-13-ban-dong-hanh-gd4b-nhac-nghi.md, changelog 0631).
//
// Vì sao cần spec RIÊNG: lời nhắc chỉ hiện với nhóm tuổi nhi_dong/thieu_nien SAU 20–40 phút trò
// chuyện, nên các vòng quét chung (người dùng mặc định là người lớn, vừa mở trang) không bao giờ
// chạm tới nó. Spec này gieo sẵn trạng thái phiên "đã tới mốc nhắc" vào localStorage rồi quét
// riêng khối đó.
//
// Nhi đồng bị khoá theme "kid" (AppThemeProvider), nên hai theme tự chọn được quét với nhóm
// thiếu niên — vừa phủ đủ 3 theme, vừa phủ đủ hai bộ câu chữ.

import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, USER_ID, type ThemeName } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'

const SECTION = '[data-testid="companion-break-reminder"]'
const BREAK_KEY = `dhcb:companion-break:${USER_ID}`

const CASES: { theme: ThemeName; ageGroup: 'nhi_dong' | 'thieu_nien'; heading: string }[] = [
  { theme: 'dark-blue', ageGroup: 'thieu_nien', heading: 'Nghỉ giải lao chút không?' },
  { theme: 'blue-sky', ageGroup: 'thieu_nien', heading: 'Nghỉ giải lao chút không?' },
  { theme: 'kid', ageGroup: 'nhi_dong', heading: 'Mình nghỉ một chút nhé!' },
]

async function asAgeGroup(page: Page, ageGroup: string) {
  // Đăng ký SAU mockLogin ⇒ Playwright ưu tiên route này (route mới nhất khớp trước).
  const profile = {
    id: USER_ID,
    email: 'e2e@example.com',
    name: 'E2E User',
    plan: 'free',
    onboarded: true,
    userLevel: 'beginner',
    goal: 'daily',
    dailyMinutes: 10,
    ageGroup,
    isAdmin: false,
  }
  for (const url of ['**/api/auth?action=me', '**/api/profile**']) {
    await page.route(url, (route) => route.fulfill({ json: profile }))
  }
}

async function seedSessionDue(page: Page) {
  // Phiên bắt đầu 25 phút trước, lượt cuối 1 phút trước, mốc nhắc đã qua ⇒ hiện ngay khi vào.
  await page.addInitScript((key) => {
    const now = Date.now()
    localStorage.setItem(
      key,
      JSON.stringify({
        sessionStartMs: now - 25 * 60_000,
        lastActivityMs: now - 60_000,
        nextReminderAtMs: now - 1_000,
      }),
    )
  }, BREAK_KEY)
}

for (const { theme, ageGroup, heading } of CASES) {
  test(`a11y: lời nhắc nghỉ (${ageGroup}) theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await mockLogin(page, 'vi', theme)
    await asAgeGroup(page, ageGroup)
    await seedSessionDue(page)
    await page.goto('/ban-dong-hanh', { waitUntil: 'domcontentloaded' })

    const section = page.locator(SECTION)
    await expect(section).toBeVisible({ timeout: 15_000 })
    await expect(section.getByRole('heading', { name: heading })).toBeVisible()
    await expect(section).toContainText('bạn đồng hành AI')

    await freezeAnimations(page)
    const { violations } = await new AxeBuilder({ page })
      .include(SECTION)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} phần tử)`)).toEqual([])

    // Chữ nội dung/tiêu đề phải đạt AAA (≥ 7:1, CLAUDE.md mục 4.5); nút chỉ cần AA ở trên.
    // Chặn cả "incomplete": nền trong mờ mà axe không đo được thì KHÔNG được coi là đạt.
    const aaa = await new AxeBuilder({ page })
      .include(`${SECTION} h2`)
      .include(`${SECTION} p`)
      .withRules(['color-contrast-enhanced'])
      .analyze()
    expect(aaa.violations.flatMap((v) => v.nodes.map((n) => n.target.join(' ')))).toEqual([])
    expect(aaa.incomplete.flatMap((v) => v.nodes.map((n) => n.target.join(' ')))).toEqual([])
    expect(aaa.passes.flatMap((v) => v.nodes).length).toBeGreaterThanOrEqual(2)
  })
}

test('lời nhắc nghỉ: "Thêm một chút" ẩn đi, "Mình nghỉ đây" về Trang chủ', async ({ page }) => {
  await mockLogin(page, 'vi', 'blue-sky')
  await asAgeGroup(page, 'thieu_nien')
  await seedSessionDue(page)
  await page.goto('/ban-dong-hanh', { waitUntil: 'domcontentloaded' })

  const section = page.locator(SECTION)
  await expect(section).toBeVisible({ timeout: 15_000 })
  await section.getByRole('button', { name: 'Thêm một chút' }).click()
  await expect(section).toBeHidden()

  // Gieo lại phiên đã tới mốc (addInitScript chạy lại khi tải trang) rồi chọn nghỉ.
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(section).toBeVisible({ timeout: 15_000 })
  await section.getByRole('button', { name: 'Mình nghỉ đây' }).click()
  await expect(page).toHaveURL(/\/$/)
  expect(await page.evaluate((key) => localStorage.getItem(key), BREAK_KEY)).toBeNull()
})
