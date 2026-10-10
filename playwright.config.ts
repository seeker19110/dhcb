import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'
import { resolveE2ePort } from './scripts/lib/e2ePort.ts'

// Cổng dev server riêng cho E2E (tránh đụng 5173 nếu đang chạy dev tay). Mặc định 5179; đặt
// `E2E_PORT` để mỗi worktree tự chọn cổng (khi đó luôn dựng server riêng, không dùng lại).
const { port: PORT, reuseExistingServer: reuseLocalServer } = resolveE2ePort(
  process.env.E2E_PORT,
  !!process.env.CI,
)
const baseURL = `http://localhost:${PORT}`
// Code học viên chạy ở origin THỨ HAI như production (`run.…`): cùng dev server nhưng qua
// 127.0.0.1 — khác origin VÀ khác site với `localhost`, nên E2E chứng minh được cách ly thật
// (đặc tả docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md, lib/runnerBridge.ts).
export const RUNNER_ORIGIN = `http://127.0.0.1:${PORT}`

// Dùng Chromium cài sẵn của môi trường nếu có (KHÔNG chạy "playwright install");
// nếu không (vd. CI tự cài browser), để trống cho Playwright tự tìm bản của nó.
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH || '/opt/pw-browsers/chromium'
// Chromium trên Windows có thể làm GPU process crash trong suite E2E dài dù UI/DOM vẫn đúng.
// E2E không kiểm thử WebGL/GPU, nên tắt GPU chỉ ở Windows để browser runner ổn định.
const chromiumArgs = process.platform === 'win32' ? ['--disable-gpu'] : []
const launchOptions = {
  ...(existsSync(chromiumPath) ? { executablePath: chromiumPath } : {}),
  ...(chromiumArgs.length > 0 ? { args: chromiumArgs } : {}),
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Giữ đúng 2 worker ở local và CI: server Vite dùng chung cache transform, còn mỗi test vẫn
  // có BrowserContext riêng. Tránh local tự chọn quá nhiều worker rồi tạo tải khác hẳn CI.
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  // Làm nóng cache transform của Vite và tài nguyên worker/WASM trước khi worker test đầu
  // tiên chạy. Script dùng browser/context RIÊNG và đóng ngay, không chia session với test.
  globalSetup: './scripts/e2e-prewarm.mjs',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions,
      },
    },
  ],
  webServer: {
    // `--host 127.0.0.1`: runner chạy ở origin 127.0.0.1, nên server PHẢI nghe trên IPv4. Mặc định
    // Vite nghe `localhost` — trên máy CI `localhost` phân giải ra `::1` nên 127.0.0.1 bị từ chối
    // kết nối (đỏ CI ở PR #1346). App vẫn mở bằng `localhost`: trình duyệt thử `::1` rồi tự
    // chuyển sang 127.0.0.1.
    command: `npm run dev -- --port ${PORT} --strictPort --host 127.0.0.1`,
    // Kiểm sẵn sàng qua đúng địa chỉ server nghe (xem `--host` ở trên).
    url: RUNNER_ORIGIN,
    timeout: 120_000,
    reuseExistingServer: reuseLocalServer,
    // `E2E_RUNNER_ORIGIN=''` chạy lại suite ở đường lui (Worker trong trang, như dev).
    env: { VITE_CODE_RUNNER_ORIGIN: process.env.E2E_RUNNER_ORIGIN ?? RUNNER_ORIGIN },
  },
})
