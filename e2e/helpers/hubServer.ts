import { test } from '@playwright/test'
import { createServer, type ViteDevServer } from 'vite'
import { fileURLToPath } from 'node:url'

// Dev server của HUB (`apps/hub`) dựng ngay trong spec, dùng chung cho mọi spec hub.
//
// Hub là một Vite app RIÊNG, không nằm trong `webServer` của playwright.config.ts (config chỉ dựng
// app chính). Dựng bằng API của Vite ở cổng tự chọn: không sửa config, không bắt 6 mảnh E2E của CI
// dựng thêm server cho vài spec hub, không đụng cổng 5179 của E2E chính.

const HUB_ROOT = fileURLToPath(new URL('../../apps/hub', import.meta.url))
const HUB_CONFIG = fileURLToPath(new URL('../../apps/hub/vite.config.ts', import.meta.url))

/**
 * Đăng ký `beforeAll`/`afterAll` dựng và tắt dev server hub cho spec gọi nó. Trả hàm đọc origin
 * (`http://127.0.0.1:<cổng>`) — chỉ có giá trị SAU `beforeAll`, nên gọi bên trong test.
 */
export function registerHubServer(): () => string {
  let server: ViteDevServer | undefined
  let origin = ''
  test.beforeAll(async () => {
    server = await createServer({
      root: HUB_ROOT,
      configFile: HUB_CONFIG,
      server: { port: 0, strictPort: false, host: '127.0.0.1' },
      logLevel: 'error',
    })
    await server.listen()
    const url = server.resolvedUrls?.local[0]
    if (!url) throw new Error('Không dựng được dev server của hub')
    origin = url.replace(/\/$/, '')
  })
  test.afterAll(async () => {
    await server?.close()
  })
  return () => {
    if (!origin) throw new Error('Dev server hub chưa sẵn sàng — chỉ gọi hubOrigin() trong test')
    return origin
  }
}
