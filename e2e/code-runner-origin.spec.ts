import { test, expect, type Page } from '@playwright/test'
import { mockLogin } from './helpers/auth'

// Code học viên chạy ở ORIGIN RIÊNG (đặc tả docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md,
// bước R2). Playwright dựng app ở `localhost` và đặt VITE_CODE_RUNNER_ORIGIN = `127.0.0.1` cùng
// cổng (playwright.config.ts) — khác origin VÀ khác site, đúng như `en-vi.` ⇄ `run.` ở production.
//
// Các test khác của môn Lập trình chứng minh "vẫn chấm đúng"; file này chứng minh "chạy ở ĐÂU":
// nếu bridge lặng lẽ rơi về Worker trong trang app thì mọi test kia vẫn xanh — ở đây thì đỏ.

function runnerOriginOf(baseURL: string | undefined): string {
  const port = new URL(baseURL ?? 'http://localhost:5179').port
  return `http://127.0.0.1:${port}`
}

async function openPlayground(page: Page) {
  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/chay-thu', { waitUntil: 'domcontentloaded' })
}

async function runPython(page: Page, code: string) {
  await page.getByRole('textbox', { name: 'Ô soạn code Python' }).fill(code)
  await page.getByRole('button', { name: 'Chạy', exact: true }).click()
}

test('Python học viên chạy ở origin runner, không phải origin app', async ({ page, baseURL }) => {
  test.setTimeout(120_000)
  const runner = runnerOriginOf(baseURL)
  await openPlayground(page)
  // `js` = globalThis của Worker chạy Pyodide — origin của nó là origin code học viên thật sự có.
  await runPython(page, 'import js\nprint("ORIGIN=" + js.location.origin)')
  await expect(page.getByText(`ORIGIN=${runner}`)).toBeVisible({ timeout: 90_000 })

  // Khung runner ẩn, không ai tab vào được, và mang đúng origin cấu hình.
  const khung = page.locator('iframe[title="Khung chạy code"]')
  await expect(khung).toHaveCount(1)
  await expect(khung).toHaveAttribute('src', new RegExp(`^${runner}/runner\\.html\\?parent=`))
  await expect(khung).toHaveAttribute('sandbox', 'allow-scripts allow-same-origin')
  await expect(khung).toBeHidden()
})

test('JavaScript học viên: Worker được tải từ origin runner, KHÔNG từ origin app', async ({
  page,
  baseURL,
}) => {
  test.setTimeout(120_000)
  const runner = runnerOriginOf(baseURL)
  const workerUrls: string[] = []
  page.context().on('request', (req) => {
    if (/\/workers\/jsWorker\.ts/.test(req.url())) workerUrls.push(req.url())
  })

  await mockLogin(page, 'vi', 'dark-blue')
  await page.goto('/goc-hoc-tap/programming/bai-hoc/p3-u6-l1', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Tự viết' }).click()
  await page.getByRole('button', { name: 'Xem code mẫu' }).click()
  await page.getByRole('button', { name: 'Chấm bài' }).click()
  await expect(page.getByText('Đạt toàn bộ test!')).toBeVisible({ timeout: 60_000 })

  expect(workerUrls.length).toBeGreaterThan(0)
  expect(workerUrls.every((url) => url.startsWith(`${runner}/`))).toBe(true)
})

test('Python vòng lặp vô hạn ở runner: bị ngắt đúng câu báo, trang app vẫn bấm được', async ({
  page,
}) => {
  test.setTimeout(150_000)
  await openPlayground(page)
  await runPython(page, 'while True:\n    pass')
  // Trong lúc runner đang bận, trang app vẫn phản hồi: đổi bài mẫu được.
  await expect(page.getByRole('button', { name: 'Dừng' })).toBeVisible({ timeout: 90_000 })
  await page.getByLabel('Bài mẫu bậc P1').selectOption({ index: 1 })
  await expect(page.getByText(/quá 10 giây nên đã bị dừng/)).toBeVisible({ timeout: 90_000 })
})

test('mở thẳng runner.html (không nằm trong khung): không nhận lệnh chạy code', async ({
  page,
  baseURL,
}) => {
  const runner = runnerOriginOf(baseURL)
  const app = new URL(baseURL ?? 'http://localhost:5179').origin
  const workerRequests: string[] = []
  page.on('request', (req) => {
    if (/\/workers\//.test(req.url())) workerRequests.push(req.url())
  })
  await page.goto(`${runner}/runner.html?parent=${encodeURIComponent(app)}`)
  await page.evaluate(() => {
    window.postMessage(
      { type: 'run', id: 'x', req: { lane: 'javascript', code: 'console.log(1)' } },
      window.location.origin,
    )
  })
  // Không có gì để chờ xuất hiện — đợi đủ lâu để một Worker kịp được tạo nếu runner nhận lệnh.
  await page.waitForTimeout(1_500)
  expect(workerRequests).toEqual([])
})
