import { test, expect, type Page, type Route } from '@playwright/test'
import { mockLogin } from './helpers/auth'

// ──────────────────────────────────────────────────────────────────────────────
// Trang cấp CEFR vẽ nội dung KHÔNG chờ dữ liệu nặng (changelog 0601).
//
// Trước đây trang chờ `curriculum.json` (~1 MB nén: nghĩa + câu ví dụ của mọi vòng) mới vẽ được
// danh sách bài — đo Slow 4G trên production: 6,3–7,3 s. Nay trang vẽ từ `cefr.json` + bản tóm
// tắt `curriculum-index.json`; bản đầy đủ + từ điển tải SAU, chỉ thẻ từ vựng và tab học cần.
//
// Spec canh ba bất biến bằng cách GIỮ (không trả) request nặng:
//  1. Danh sách bài hiện ra trong khi `curriculum.json` + từ điển còn treo.
//  2. Mở thẻ từ lúc bản đầy đủ chưa về → "Đang tải từ vựng…", về rồi → thẻ từ.
//  3. Bản đầy đủ lỗi → khối lỗi + Thử lại; mạng hồi → bấm Thử lại → thẻ từ.
// ──────────────────────────────────────────────────────────────────────────────

const CAP_A1 = '/goc-hoc-tap/english/lo-trinh/a1'
// Vòng từ vựng đầu tiên của A1 (`cefr.json` → a1-greetings → `greetings`).
const VONG_DAU = 'Đại từ & lời chào'
const NANG = ['**/data/curriculum.json', '**/data/dictionary/chunk-*.json'] as const
// Nút vòng trong danh sách phần (thẻ "Học tiếp" cũng nhắc tên vòng nên neo theo emoji đầu nút).
const nutVong = (page: Page) => page.getByRole('button', { name: /^👋 Đại từ & lời chào/ })
// Tên vòng ở đầu thẻ từ — khớp ĐÚNG cả chuỗi để không nhầm nút mục lục "Từ vựng: …".
const tieuDeTheTu = (page: Page) => page.getByText(VONG_DAU, { exact: true })

/** Giữ mọi request nặng tới khi gọi hàm trả về; trả kèm số request đã được TRẢ LỜI. */
async function giuDuLieuNang(page: Page) {
  let nha!: () => void
  const cong = new Promise<void>((resolve) => (nha = resolve))
  let daTra = 0
  const handler = async (route: Route) => {
    await cong
    daTra++
    await route.continue()
  }
  for (const p of NANG) await page.route(p, handler)
  return { nha, daTra: () => daTra }
}

test('danh sách bài hiện ra khi curriculum.json + từ điển còn treo', async ({ page }) => {
  await mockLogin(page, 'vi', 'dark-blue')
  const gate = await giuDuLieuNang(page)
  const chiMuc = page.waitForResponse('**/data/curriculum-index.json')
  await page.goto(CAP_A1, { waitUntil: 'domcontentloaded' })

  await expect(nutVong(page)).toBeVisible({ timeout: 60_000 })
  expect((await chiMuc).ok()).toBe(true)
  // Nội dung đã vẽ mà CHƯA một request nặng nào được trả lời.
  expect(gate.daTra()).toBe(0)
  gate.nha()
})

test('mở thẻ từ lúc bản đầy đủ chưa về → "Đang tải từ vựng…", về rồi → thẻ từ', async ({
  page,
}) => {
  await mockLogin(page, 'vi', 'blue-sky')
  const gate = await giuDuLieuNang(page)
  await page.goto(CAP_A1, { waitUntil: 'domcontentloaded' })

  await nutVong(page).click({ timeout: 60_000 })
  await expect(page.getByText('Đang tải từ vựng…')).toBeVisible()
  await expect(tieuDeTheTu(page)).toHaveCount(0)

  gate.nha()
  await expect(tieuDeTheTu(page)).toBeVisible({ timeout: 60_000 })
  await expect(page.getByText('Đang tải từ vựng…')).toHaveCount(0)
})

test('bản đầy đủ lỗi → khối lỗi + Thử lại; mạng hồi → thẻ từ', async ({ page }) => {
  await mockLogin(page, 'vi', 'dark-blue')
  const loi = (route: Route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"down"}' })
  await page.route('**/data/curriculum.json', loi)
  await page.goto(CAP_A1, { waitUntil: 'domcontentloaded' })

  await nutVong(page).click({ timeout: 60_000 })
  const alert = page.getByRole('alert').filter({ hasText: 'Không tải được dữ liệu' })
  await expect(alert).toBeVisible({ timeout: 60_000 })

  await page.unroute('**/data/curriculum.json', loi)
  await alert.getByRole('button', { name: 'Thử lại' }).click()
  await expect(tieuDeTheTu(page)).toBeVisible({ timeout: 60_000 })
  await expect(alert).toHaveCount(0)
})

// ── JS của màn con + tab học + bài thi nạp LƯỜI (changelog 0603) ──────────────────────────────
// Ba module này chỉ cần khi người học bấm vào. Giữ treo chúng mà danh sách bài vẫn phải hiện —
// nếu ai đó import tĩnh lại (trực tiếp hay qua module khác), trang sẽ kẹt và ca này đỏ.
// E2E chạy trên dev server của Vite nên mỗi module là một request riêng theo đường dẫn nguồn.
const MODULE_LUOI = [
  '**/components/CefrLessonViews.tsx*',
  '**/components/StudyTabs.tsx*',
  '**/components/CefrExam.tsx*',
] as const

test('màn con + tab học + bài thi nạp lười: giữ treo JS của chúng, danh sách bài vẫn hiện', async ({
  page,
}) => {
  await mockLogin(page, 'vi', 'blue-sky')
  let nha!: () => void
  const cong = new Promise<void>((resolve) => (nha = resolve))
  const daXin = new Set<string>()
  const giu = async (route: Route) => {
    daXin.add(new URL(route.request().url()).pathname)
    await cong
    await route.continue()
  }
  for (const p of MODULE_LUOI) await page.route(p, giu)
  await page.goto(CAP_A1, { waitUntil: 'domcontentloaded' })

  await expect(nutVong(page)).toBeVisible({ timeout: 60_000 })
  // Mở vòng lúc JS màn con còn treo → ô chờ, không trắng trang.
  await nutVong(page).click()
  await expect(page.getByText('Đang tải…', { exact: true })).toBeVisible()

  nha()
  await expect(tieuDeTheTu(page)).toBeVisible({ timeout: 60_000 })
  // Có xin thật (nạp trước lúc rảnh hoặc lúc bấm) — tức là module đúng là được nạp lười.
  expect([...daXin].some((p) => p.endsWith('/components/CefrLessonViews.tsx'))).toBe(true)
})
