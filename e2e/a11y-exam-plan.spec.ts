// e2e/a11y-exam-plan.spec.ts — Cổng a11y cho trang "Ôn thi" (/on-thi).
//
// Quét CẢ HAI màn hình của trang, vì chúng dùng bảng màu khác hẳn nhau:
//   1. Chưa có kế hoạch → biểu mẫu (input ngày, thanh trượt, nút chọn ngày nghỉ).
//   2. Đã có kế hoạch → đồng hồ đếm ngược + khối cảnh báo "không kịp" (nền hổ phách).
// Màn hình 2 cần giả lập API vì E2E chạy bằng Vite dev, không có backend.
//
// Chiều B (2026-09-05, trả nợ): trang nay có bản tiếng Anh cho người nước ngoài học tiếng Việt
// (kỳ thi `vsl-b1`) — quét thêm 2 theme ở `direction='B'` + 1 vòng AAA, cùng khuôn đã áp cho
// `a11y-companion-link.spec.ts`.

import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin, USER_ID, type ThemeName } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'

const THEMES: ThemeName[] = ['dark-blue', 'blue-sky', 'kid']
const AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

// Ngày thi rất gần + phạm vi lớn ⇒ ép ra trạng thái "không kịp" (khối cảnh báo hổ phách), tức là
// quét luôn tổ hợp màu khó nhất chứ không chỉ trạng thái đẹp.
const NEAR_PLAN = {
  id: '22222222-2222-4222-8222-222222222222',
  userId: USER_ID,
  examKind: 'vao10-english',
  examDate: '2099-01-05',
  targetLabel: '8 điểm',
  scopeItems: 100000,
  dailyCapItems: 5,
  restDays: [],
  status: 'active',
  createdAt: '2026-08-26T00:00:00.000Z',
  schemaVersion: 1,
}

async function mockApi(page: Page, plan: unknown) {
  await page.route('**/api/exam-plan*', (route) => route.fulfill({ json: { plan } }))
}

async function scan(page: Page, tags: string[]) {
  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page }).include('main').withTags(tags).analyze()
  return violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length} phần tử)`)
}

for (const theme of THEMES) {
  test(`a11y: /on-thi — biểu mẫu tạo kế hoạch, theme=${theme} — 0 vi phạm A/AA`, async ({
    page,
  }) => {
    await mockLogin(page, 'vi', theme)
    await mockApi(page, null)
    await page.goto('/on-thi', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Bắt đầu đếm ngược' })).toBeVisible({
      timeout: 15_000,
    })
    expect(await scan(page, AA_TAGS)).toEqual([])
  })

  test(`a11y: /on-thi — đã có kế hoạch, theme=${theme} — 0 vi phạm A/AA`, async ({ page }) => {
    await mockLogin(page, 'vi', theme)
    await mockApi(page, NEAR_PLAN)
    await page.goto('/on-thi', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Hôm nay' })).toBeVisible({ timeout: 15_000 })
    expect(await scan(page, AA_TAGS)).toEqual([])
  })
}

test('a11y AAA: chữ nội dung trang Ôn thi đạt tương phản ≥ 7:1', async ({ page }) => {
  await mockLogin(page, 'vi')
  await mockApi(page, NEAR_PLAN)
  await page.goto('/on-thi', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Hôm nay' })).toBeVisible({ timeout: 15_000 })
  expect(await scan(page, ['wcag2aaa'])).toEqual([])
})

// ── Chiều B ─────────────────────────────────────────────────────────────────
const DIRECTION_B_THEMES: ThemeName[] = ['blue-sky']

/** Cùng kế hoạch "không kịp" như chiều A, chỉ đổi kỳ thi + nhãn mục tiêu sang chiều B. */
const NEAR_PLAN_B = { ...NEAR_PLAN, examKind: 'vsl-b1', targetLabel: 'level 3' }

async function gotoPlanB(page: Page, theme?: ThemeName) {
  await mockLogin(page, 'en', theme)
  await page.addInitScript(() => localStorage.setItem('et_direction', 'B'))
  await mockApi(page, NEAR_PLAN_B)
  await page.goto('/on-thi', { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible({ timeout: 15_000 })
}

for (const theme of DIRECTION_B_THEMES) {
  test(`a11y: /on-thi chiều B — biểu mẫu tạo kế hoạch, theme=${theme} — 0 vi phạm A/AA`, async ({
    page,
  }) => {
    await mockLogin(page, 'en', theme)
    await page.addInitScript(() => localStorage.setItem('et_direction', 'B'))
    await mockApi(page, null)
    await page.goto('/on-thi', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Start the countdown' })).toBeVisible({
      timeout: 15_000,
    })
    expect(await scan(page, AA_TAGS)).toEqual([])
  })

  test(`a11y: /on-thi chiều B — đã có kế hoạch, theme=${theme} — 0 vi phạm A/AA`, async ({
    page,
  }) => {
    await gotoPlanB(page, theme)
    expect(await scan(page, AA_TAGS)).toEqual([])
  })
}

test('a11y AAA chiều B: chữ nội dung trang Exam prep đạt tương phản ≥ 7:1', async ({ page }) => {
  await gotoPlanB(page)
  expect(await scan(page, ['wcag2aaa'])).toEqual([])
})

// Canh bất biến của đợt trả nợ: chiều B KHÔNG được lọt chuỗi tiếng Việt nào ra giao diện.
test('chiều B: trang Ôn thi không lọt chuỗi tiếng Việt nào', async ({ page }) => {
  await gotoPlanB(page)
  const text = (await page.locator('main').innerText()).replace(/Đồng Hành Cùng Bạn/gi, '')
  // Dấu phụ tiếng Việt (ăâêôơưđ + thanh điệu) — tiếng Anh không có ký tự nào trong dải này.
  expect(text).not.toMatch(/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i)
})
