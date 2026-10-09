// Chọn cổng dev server cho Playwright E2E (hàm thuần, test ở e2ePort.test.ts).
// Mặc định 5179 + dùng lại server sẵn có ngoài CI (hành vi cũ, CI không đổi). Khi đặt
// `E2E_PORT` khác mặc định thì BẮT BUỘC dựng server của chính worktree này (reuse = false),
// để nhiều worktree/tác nhân chạy song song không phục vụ nhầm mã của nhau (TRAPS.md mục 19).

export const DEFAULT_E2E_PORT = 5179
const MIN_PORT = 1024
const MAX_PORT = 65535

export interface E2ePortConfig {
  port: number
  reuseExistingServer: boolean
}

export function resolveE2ePort(raw: string | undefined, isCi: boolean = false): E2ePortConfig {
  const text = raw?.trim() ?? ''
  if (text === '') return { port: DEFAULT_E2E_PORT, reuseExistingServer: !isCi }
  const port = Number(text)
  if (!/^\d+$/.test(text) || !Number.isInteger(port) || port < MIN_PORT || port > MAX_PORT) {
    throw new Error(
      `E2E_PORT="${text}" không hợp lệ: phải là số nguyên từ ${MIN_PORT} đến ${MAX_PORT} (ví dụ E2E_PORT=5181).`,
    )
  }
  return { port, reuseExistingServer: port === DEFAULT_E2E_PORT && !isCi }
}
