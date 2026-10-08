import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockLogin } from './helpers/auth'
import { freezeAnimations } from './helpers/axe'

// ──────────────────────────────────────────────────────────────────────────────
// Lỗi tải phải HIỆN RA, không được giả làm "đang tải mãi" hay "rỗng" (changelog 0525).
//
// Unit test đã canh từng trang với loader giả; spec này canh đúng chuỗi THẬT trong trình duyệt:
// máy chủ trả 503 cho dữ liệu → trang hiện khối `LoadError` (role="alert") + nút Thử lại → mạng
// hồi lại, bấm Thử lại → nội dung hiện. Đồng thời quét axe AA ngay trên màn lỗi — trạng thái này
// `a11y.spec.ts` không bao giờ nhìn thấy (chỉ quét trạng thái mặc định).
//
// Trang trong spec: trang cấp CEFR (tab "Hôm nay" chờ từ điển — không có unit test vì trang quá
// nặng để dựng bằng mock), Luyện nghe, Bạn bè.
// ──────────────────────────────────────────────────────────────────────────────

const CAP_A1_HOM_NAY = '/goc-hoc-tap/english/lo-trinh/a1?tab=today'

/** Cho route `pattern` trả 503 tới khi gọi hàm trả về (mạng "hồi lại"). */
async function failUntilRestored(page: Page, pattern: string): Promise<() => Promise<void>> {
  const handler = (route: Parameters<Parameters<Page['route']>[1]>[0]) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"down"}' })
  await page.route(pattern, handler)
  return () => page.unroute(pattern, handler)
}

async function expectAccessibleError(page: Page) {
  const alert = page.getByRole('alert').filter({ hasText: 'Không tải được dữ liệu' })
  await expect(alert).toBeVisible({ timeout: 60_000 })
  await expect(alert).toContainText('Máy chủ đang gặp sự cố')
  await freezeAnimations(page)
  const { violations } = await new AxeBuilder({ page })
    .include('[role="alert"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(violations.map((v) => `${v.id} (${v.nodes.length})`)).toEqual([])
  const retry = alert.getByRole('button', { name: 'Thử lại' })
  const box = await retry.boundingBox()
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
  return { alert, retry }
}

test('trang cấp CEFR: từ điển lỗi → khối lỗi + Thử lại (không kẹt "Đang tải từ vựng…")', async ({
  page,
}) => {
  await mockLogin(page, 'vi', 'dark-blue')
  const restore = await failUntilRestored(page, '**/data/dictionary/chunk-*.json')
  await page.goto(CAP_A1_HOM_NAY, { waitUntil: 'domcontentloaded' })

  const { alert, retry } = await expectAccessibleError(page)
  await expect(page.getByText('Đang tải từ vựng…')).toHaveCount(0)

  await restore()
  await retry.click()
  await expect(alert).toHaveCount(0, { timeout: 60_000 })
})

test('Luyện nghe: chỉ mục mẫu câu lỗi → khối lỗi + Thử lại', async ({ page }) => {
  await mockLogin(page, 'vi', 'blue-sky')
  const restore = await failUntilRestored(page, '**/data/patterns/index.json')
  await page.goto('/goc-hoc-tap/english/luyen-nghe', { waitUntil: 'domcontentloaded' })

  const { alert, retry } = await expectAccessibleError(page)
  await restore()
  await retry.click()
  await expect(alert).toHaveCount(0, { timeout: 60_000 })
  await expect(page.getByRole('searchbox').first()).toBeVisible()
})

test('Bạn bè: API lỗi → khối lỗi, KHÔNG hiện "Chưa có bạn bè nào"', async ({ page }) => {
  await mockLogin(page, 'vi', 'dark-blue')
  const restore = await failUntilRestored(page, '**/api/friends')
  await page.goto('/ban-be', { waitUntil: 'domcontentloaded' })

  const { alert, retry } = await expectAccessibleError(page)
  await expect(page.getByText('Chưa có bạn bè nào')).toHaveCount(0)

  await restore()
  await page.route('**/api/friends', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'ABCD1234', friends: [] }),
    }),
  )
  await retry.click()
  await expect(alert).toHaveCount(0, { timeout: 60_000 })
  await expect(page.getByText('ABCD1234')).toBeVisible()
})
