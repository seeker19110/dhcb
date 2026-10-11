import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import type { ThemeName } from './helpers/auth'
import { freezeAnimations, waitForStableDom } from './helpers/axe'
import { measureGradientText } from './helpers/gradientText'
import { registerHubServer } from './helpers/hubServer'

// Cổng a11y A/AA cho HUB — trang chủ ở tên miền gốc (`apps/hub`, Vite app riêng).
//
// Vì sao có file riêng: `e2e/a11y.spec.ts` chỉ quét app nền tảng (`apps/dhcb`). Hub là cửa vào
// đầu tiên của người lạ nhưng trước đợt này chỉ có test đơn vị (`HubLogin.a11y.test.tsx`) — jsdom
// không tính được tương phản, vùng chạm hay bố cục thật. Chủ dự án chốt "Thêm vào cổng"
// (2026-10-10). Luật giống hệt cổng app: 0 vi phạm A/AA ở MỌI mức tác động, không baseline,
// đủ 3 theme hiện hành (CLAUDE.md mục 4.5).
//
// Hub là Vite app riêng — dev server dựng ngay trong spec (`e2e/helpers/hubServer.ts`). API của hub
// đi qua proxy tới Express — E2E không dựng Express, nên mọi `/api/*` được giả lập tại đây.
const hubOrigin = registerHubServer()
const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']

// Hai phép đo, một danh sách lỗi: axe (A/AA) + tương phản chữ gradient, điểm mù của axe. Chính
// phép đo thứ hai bắt được tiêu đề hub chỉ đạt 1,27:1 ở theme sáng (changelog 0598).
async function scan(page: Page): Promise<string[]> {
  await freezeAnimations(page)
  await waitForStableDom(page)
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  const axe = violations.map((v) => {
    const first = v.nodes[0]?.target
    const sel = Array.isArray(first) ? first.join(' ') : String(first ?? '?')
    return `${v.id} (${v.impact}, ${v.nodes.length} phần tử, đầu tiên: ${sel})`
  })
  return [...axe, ...(await measureGradientText(page))]
}

/** Khách (chưa đăng nhập): `/api/hub-stats` trả `{}` như server thật trả cho người lạ. */
async function moHub(page: Page, theme: ThemeName, path: string, stats: object = {}) {
  await page.addInitScript((t) => localStorage.setItem('ui_theme', t), theme)
  await page.route('**/api/hub-stats', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(stats) }),
  )
  // `HubLogin` hỏi phiên hiện tại khi mở — khách thì server trả 401.
  await page.route('**/api/auth**', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"error":"unauthorized"}',
    }),
  )
  await page.goto(`${hubOrigin()}${path}`)
}

for (const theme of THEMES) {
  test(`a11y hub: trang chủ theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await moHub(page, theme, '/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    expect(await scan(page)).toEqual([])
  })

  test(`a11y hub: đăng nhập theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await moHub(page, theme, '/login')
    await expect(page.getByLabel(/Email/i).first()).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    expect(await scan(page)).toEqual([])
  })
}

// Người đã đăng nhập thấy thanh trên khác (tên + lối vào app) — quét một theme sáng, nơi màu
// cố định dễ rớt AA nhất.
test('a11y hub: trang chủ khi đã đăng nhập — 0 vi phạm A/AA', async ({ page }) => {
  await moHub(page, 'blue-sky', '/', { loggedIn: true, userName: 'Người học E2E' })
  await expect(page.getByText('Người học E2E').first()).toBeVisible()
  expect(await scan(page)).toEqual([])
})
