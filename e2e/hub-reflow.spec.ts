import { test, expect, type Page } from '@playwright/test'
import { createServer, type ViteDevServer } from 'vite'
import { fileURLToPath } from 'node:url'

// Cổng chống tràn ngang cho HUB (apps/hub) — audit UI/UX 2026-09-30, C6.
//
// Hub là một Vite app RIÊNG (`apps/hub`), không chạy trong `webServer` của playwright.config.ts
// (config chỉ dựng app chính). Nên spec này TỰ dựng dev server của hub bằng API của Vite, ở cổng
// tự chọn — không cần sửa config, không đụng cổng 5179 của E2E chính.
//
// Lỗi gốc: cụm nút "Đăng nhập · Bắt đầu" + logo có chữ thương hiệu rộng hơn khung điện thoại,
// `scrollWidth − clientWidth` = 194px ở 390px, nút thò ra ngoài (WCAG 1.4.10 Reflow).

const HUB_ROOT = fileURLToPath(new URL('../apps/hub', import.meta.url))

/** Hai bề rộng đặc tả nêu đích danh + mốc ngay quanh các điểm đổi bố cục của header. */
const WIDTHS = [320, 390, 559, 560, 639, 640, 768]

let server: ViteDevServer
let baseURL = ''

test.beforeAll(async () => {
  server = await createServer({
    root: HUB_ROOT,
    configFile: fileURLToPath(new URL('../apps/hub/vite.config.ts', import.meta.url)),
    server: { port: 0, strictPort: false, host: '127.0.0.1' },
    logLevel: 'error',
  })
  await server.listen()
  const url = server.resolvedUrls?.local[0]
  if (!url) throw new Error('Không dựng được dev server của hub')
  baseURL = url.replace(/\/$/, '')
})

test.afterAll(async () => {
  await server?.close()
})

/** API công khai của hub không cần thật: trả rỗng để trang dựng ở trạng thái "chưa đăng nhập". */
async function openHub(page: Page, path: string, width: number): Promise<void> {
  await page.setViewportSize({ width, height: 800 })
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  )
  await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' })
}

for (const path of ['/', '/login']) {
  for (const width of WIDTHS) {
    test(`hub ${path} không tràn ngang ở ${width}px`, async ({ page }) => {
      await openHub(page, path, width)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
}

test('hub: logo-link có tên đọc được dù chữ thương hiệu ẩn ở điện thoại', async ({ page }) => {
  await openHub(page, '/', 390)
  await expect(page.getByRole('link', { name: /Đồng Hành Cùng Bạn/ }).first()).toBeVisible()
})

test('hub /login: logo-link có tên đọc được', async ({ page }) => {
  await openHub(page, '/login', 390)
  await expect(page.getByRole('link', { name: /Đồng Hành Cùng Bạn.*trang chủ/ })).toBeVisible()
})

test('hub: nút "Đăng nhập" và "Bắt đầu" nằm gọn trong khung 320px', async ({ page }) => {
  await openHub(page, '/', 320)
  for (const name of ['Đăng nhập', 'Bắt đầu']) {
    const box = await page.getByRole('link', { name, exact: true }).first().boundingBox()
    expect(box, `không thấy nút "${name}"`).not.toBeNull()
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(320)
    }
  }
})
