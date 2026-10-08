// processSafetyNet.ts — lưới an toàn CUỐI cho lỗi không ai bắt ở cấp tiến trình.
//
// Vì sao cần: repo không có handler nào, nên Node (>= 15) mặc định SẬP tiến trình khi một
// promise bị reject mà không ai `.catch`. Mỗi worker PM2 giữ nhiều WebSocket đang mở —
// một promise trôi nổi không nên giết hết chúng.
//
// Hai quyết định có chủ đích (changelog 0528):
//  - unhandledRejection: log + gửi Sentry, KHÔNG thoát. Promise lỗi chỉ hỏng đúng việc nó làm,
//    tiến trình vẫn nhất quán.
//  - uncaughtException: trạng thái tiến trình có thể đã hỏng → log + flush Sentry (timeout
//    ngắn) rồi exit(1) để PM2 khởi động lại sạch.
//
// Module nhận phụ thuộc qua tham số (DI) để test được mà không giết tiến trình test.

export interface SafetyNetDeps {
  /** Ghi log lỗi (production: console.error → log PM2). */
  logger: (message: string, error: unknown) => void
  /** Gửi lỗi lên Sentry (no-op khi chưa cấu hình SENTRY_DSN). */
  captureException: (error: unknown, extra?: Record<string, unknown>) => void
  /** Chờ Sentry gửi nốt sự kiện đang đợi; trả false nếu quá thời gian. */
  flush: (timeoutMs: number) => Promise<boolean>
  /** Thoát tiến trình (production: process.exit). */
  exit: (code: number) => void
}

/** Thời gian tối đa chờ flush Sentry trước khi thoát (ms) — đủ gửi 1 sự kiện, không giữ PM2 lâu. */
export const FLUSH_TIMEOUT_MS = 2000

let removeListeners: (() => void) | null = null

/**
 * Đăng ký handler `unhandledRejection` + `uncaughtException` — gọi MỘT lần ở server.ts.
 * Idempotent: gọi lần 2 không đăng ký thêm. Trả hàm gỡ (dùng cho test).
 */
export function installProcessSafetyNet(deps: SafetyNetDeps): () => void {
  if (removeListeners) return removeListeners

  const onUnhandledRejection = (reason: unknown): void => {
    try {
      deps.logger('[unhandledRejection] promise bị reject mà không ai bắt:', reason)
      deps.captureException(reason, { mechanism: 'unhandledRejection' })
    } catch {
      // Lưới an toàn không được tự ném lỗi — nếu không sẽ thành uncaughtException.
    }
  }

  let exiting = false
  const onUncaughtException = (error: Error): void => {
    // Lỗi thứ hai trong lúc đang thoát: không chờ nữa, thoát ngay.
    if (exiting) {
      deps.exit(1)
      return
    }
    exiting = true
    try {
      deps.logger('[uncaughtException] lỗi không bắt được — sẽ thoát để PM2 khởi động lại:', error)
      deps.captureException(error, { mechanism: 'uncaughtException', fatal: true })
    } catch {
      // Vẫn phải đi tiếp tới exit(1) dù log/capture hỏng.
    }
    // Chờ flush tối đa FLUSH_TIMEOUT_MS; flush lỗi cũng vẫn thoát.
    void deps
      .flush(FLUSH_TIMEOUT_MS)
      .catch(() => false)
      .then(() => deps.exit(1))
  }

  process.on('unhandledRejection', onUnhandledRejection)
  process.on('uncaughtException', onUncaughtException)

  removeListeners = () => {
    process.off('unhandledRejection', onUnhandledRejection)
    process.off('uncaughtException', onUncaughtException)
    removeListeners = null
  }
  return removeListeners
}
