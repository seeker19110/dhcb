import { test, expect, type Page } from '@playwright/test'
import { mockLogin } from './helpers/auth'
import { muteTts } from './helpers/tts'

// Thẻ Nói đè theo mẫu và Scenario Holodeck (studio "Thử thách") từng nuốt lỗi tải danh mục:
// API lỗi thì thân thẻ để TRỐNG, không báo gì. Nay qua `useCatalogList`: tải / lỗi + Thử lại /
// rỗng / sẵn sàng tách bạch. Chỉ chặn GET danh mục — POST (luyện, bắt đầu phiên) không đụng tới.

const PASSAGE = {
  id: 'e2e_passage',
  title: 'Bài mẫu E2E — Giọng Mỹ',
  targetText: 'Stay hungry, stay foolish.',
  speakerAccent: 'us_standard',
  audioUrl: '/audio/e2e.mp3',
  bpmPacing: 120,
  syllableCount: 6,
  difficulty: 'beginner',
  schemaVersion: 'v3.0.0',
}

const SCENARIO = {
  id: 'e2e_scenario',
  title: 'Phỏng vấn E2E',
  description: 'Kịch bản dựng cho test trạng thái tải.',
  scenarioType: 'panel_interview',
  difficulty: 'beginner',
  personas: [
    {
      id: 'p1',
      name: 'Người phỏng vấn',
      role: 'tech_lead',
      avatar: '/avatars/e2e.png',
      temperament: 'neutral',
      speakingStyle: 'Ngắn gọn',
    },
  ],
  initialPrompt: 'Giới thiệu bản thân.',
  schemaVersion: 'v3.0.0',
}

type CatalogResponse = { status: number; body: unknown }

/**
 * Chặn GET `url` và trả phản hồi HIỆN TẠI. Đổi phản hồi bằng `set()` thay vì đếm số lần gọi:
 * dev server chạy React StrictMode nên effect tải chạy hai lần lúc mount — hàng đợi theo số lần
 * gọi sẽ bị lần gọi đầu (đã huỷ) ăn mất.
 */
async function mockCatalog(page: Page, url: string, initial: CatalogResponse) {
  let current = initial
  await page.route(`**${url}`, (route) => {
    if (route.request().method() !== 'GET') return route.fallback()
    return route.fulfill({
      status: current.status,
      contentType: 'application/json',
      body: JSON.stringify(current.body),
    })
  })
  return {
    set: (next: CatalogResponse) => {
      current = next
    },
  }
}

async function openLabs(page: Page) {
  await mockLogin(page, 'vi', 'blue-sky')
  await muteTts(page)
  await page.goto('/ban-dong-hanh', { waitUntil: 'domcontentloaded' })
  const tab = page.getByRole('button', { name: 'Thử thách', exact: true })
  await tab.click()
  await expect(tab).toHaveAttribute('aria-pressed', 'true')
}

/** Khung thẻ chứa tiêu đề `title` (tổ tiên gần nhất có padding thẻ). */
function card(page: Page, title: string) {
  return page
    .getByRole('heading', { name: title, exact: true })
    .locator('xpath=ancestor::div[contains(@class,"p-5")][1]')
}

test('Nói đè theo mẫu: lỗi tải hiện thông báo + Thử lại, thử lại thành công thì hiện bài mẫu', async ({
  page,
}) => {
  const api = await mockCatalog(page, '/api/echo-shadowing', {
    status: 500,
    body: { error: 'boom' },
  })
  await openLabs(page)
  const echo = card(page, 'Nói đè theo mẫu')
  await expect(echo.getByRole('alert')).toContainText('Không tải được dữ liệu')
  api.set({ status: 200, body: { passages: [PASSAGE] } })
  await echo.getByRole('button', { name: 'Thử lại' }).click()
  await expect(echo.getByRole('alert')).toHaveCount(0)
  await expect(echo.getByRole('button', { name: /Bài mẫu E2E/ })).toBeVisible()
  await expect(echo.getByText('Stay hungry, stay foolish.')).toBeVisible()
})

test('Scenario Holodeck: danh mục rỗng báo "chưa có", không báo lỗi', async ({ page }) => {
  await mockCatalog(page, '/api/scenario-holodeck', { status: 200, body: { scenarios: [] } })
  await openLabs(page)
  const holodeck = card(page, 'Scenario Holodeck V3')
  await expect(holodeck.getByText('Chưa có kịch bản nào để luyện.')).toBeVisible()
  await expect(holodeck.getByRole('alert')).toHaveCount(0)
})

test('Scenario Holodeck: dữ liệu sai hợp đồng là lỗi (không coi là rỗng), thử lại thì hiện kịch bản', async ({
  page,
}) => {
  const api = await mockCatalog(page, '/api/scenario-holodeck', {
    status: 200,
    body: { scenarios: [{ id: 'thiếu trường' }] },
  })
  await openLabs(page)
  const holodeck = card(page, 'Scenario Holodeck V3')
  await expect(holodeck.getByRole('alert')).toContainText('không đúng định dạng')
  api.set({ status: 200, body: { scenarios: [SCENARIO] } })
  await holodeck.getByRole('button', { name: 'Thử lại' }).click()
  await expect(holodeck.getByRole('button', { name: /Phỏng vấn E2E/ })).toBeVisible()
  await expect(holodeck.getByRole('alert')).toHaveCount(0)
})
