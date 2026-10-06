import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { MOCK_APP_SETTINGS, mockLogin, USER_ID } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'

async function mockPolicy(page: Page) {
  await page.route('**/api/app-settings**', (route) =>
    route.fulfill({
      json: { ...MOCK_APP_SETTINGS, vipUnlimited: true, updatedAt: '2026-10-06:vip-unlimited' },
    }),
  )
}

for (const width of [390, 1440]) {
  test(`Giới thiệu học hỏi công khai, không ép đăng nhập (${width}px)`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 })
    await mockPolicy(page)
    await page.goto('/gioi-thieu')
    await expect(
      page.getByRole('heading', { name: 'Học điều bạn muốn. Hiểu điều bạn học.' }),
    ).toBeVisible()
    await expect(
      page.getByText('Thử ngay, không cần đăng nhập. Các tính năng AI dùng thử có hạn mức.', {
        exact: true,
      }),
    ).toBeVisible()
    await expect(
      page.getByText(/Không giới hạn lượt AI trong thời gian gói còn hiệu lực/),
    ).toBeVisible()
    await freezeAnimations(page)
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(violations).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await testInfo.attach(`about-${width}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    await page.getByRole('link', { name: 'Bắt đầu học miễn phí', exact: true }).click()
    await expect(page).toHaveURL(/\/bat-dau$/)
  })
}

test('Landing tiếng Anh giữ ý định khi chuyển vào luồng khách', async ({ page }) => {
  await page.goto('/welcome')
  await page.getByRole('button', { name: 'Bắt đầu học miễn phí', exact: true }).click()
  await expect(page).toHaveURL(/\/bat-dau\?mon=english$/)
})

test('VIP hiển thị số đã dùng thật, không còn thanh hạn mức ngày hay quảng cáo 300 lượt cũ', async ({
  page,
}, testInfo) => {
  await mockLogin(page)
  await mockPolicy(page)
  await page.route('**/api/auth?action=me', (route) =>
    route.fulfill({
      json: {
        id: USER_ID,
        email: 'vip-test@example.com',
        name: 'VIP Test',
        plan: 'vip',
        onboarded: true,
        planExpiresAt: '2099-12-31T00:00:00.000Z',
      },
    }),
  )
  await page.route('**/api/usage-summary**', (route) =>
    route.fulfill({
      json: {
        plan: 'vip',
        unlimited: true,
        usedToday: 4321,
        freeWeeklyCredit: null,
        freeWeeklyCap: 0,
      },
    }),
  )
  await page.route('**/api/plan-marketing**', (route) =>
    route.fulfill({
      json: {
        plans: {
          vip: {
            badge: 'VIP',
            taglineVi: 'Học chủ động',
            taglineEn: 'Active learning',
            bullets: [{ textVi: '300 lượt AI/ngày', textEn: '300 AI turns/day' }],
          },
        },
        updatedAt: '2026-10-06',
      },
    }),
  )
  await page.goto('/nang-cap')
  await expect(page.getByText(/Hôm nay đã dùng 4321 lượt/)).toBeVisible()
  const summary = page.getByRole('region', { name: 'Gói của bạn: VIP' })
  await expect(summary).not.toContainText('300 lượt AI')
  await expect(summary).not.toContainText('4321/')
  await expect(summary).not.toContainText('Infinity')
  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations).toEqual([])
  await testInfo.attach('vip-unlimited', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  })
})
