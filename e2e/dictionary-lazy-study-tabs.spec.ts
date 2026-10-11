import { test, expect, type Route } from '@playwright/test'
import { mockLogin } from './helpers/auth'

// ──────────────────────────────────────────────────────────────────────────────
// Trang Từ điển: JS của 4 tab học nạp LƯỜI (changelog 0604).
//
// Tab mặc định là "Tra từ". `StudyPanel` (kéo theo toàn bộ `StudyTabs`: FSRS, quiz, chấm phát
// âm…) chỉ cần khi người học bấm sang tab học. Trước đây nó được import tĩnh — trang phải tải hết
// JS đó mới vẽ được ô tra từ.
//
// Spec giữ treo module `StudyPanel` (E2E chạy dev server của Vite → mỗi module một request theo
// đường dẫn nguồn): ô tra từ vẫn phải hiện; bấm "Hôm nay" lúc còn treo → ô chờ; nhả ra → hết chờ.
// Nếu ai đó import tĩnh lại (trực tiếp hay qua module khác), trang kẹt và ca này đỏ.
// ──────────────────────────────────────────────────────────────────────────────

const TU_DIEN = '/goc-hoc-tap/english/tu-dien'

test('giữ treo JS tab học: ô tra từ vẫn hiện; bấm "Hôm nay" → chờ → nội dung tab', async ({
  page,
}) => {
  await mockLogin(page, 'vi', 'blue-sky')
  let nha!: () => void
  const cong = new Promise<void>((resolve) => (nha = resolve))
  let daXin = false
  await page.route('**/components/StudyPanel.tsx*', async (route: Route) => {
    daXin = true
    await cong
    await route.continue()
  })
  await page.goto(TU_DIEN, { waitUntil: 'domcontentloaded' })

  await expect(page.locator('#dict-search-desktop')).toBeVisible({ timeout: 60_000 })

  await page.getByRole('button', { name: 'Hôm nay', exact: true }).click()
  const cho = page.getByText('Đang tải từ vựng…')
  await expect(cho).toBeVisible()

  nha()
  await expect(cho).toHaveCount(0, { timeout: 60_000 })
  expect(daXin).toBe(true)
})
