// api/_lib/sentry.ts — Sentry (error tracking) phía SERVER (server.ts + handler api/*.ts).
//
// CHỈ bật khi có biến môi trường SENTRY_DSN (KHÔNG có tiền tố VITE_ — chỉ server đọc,
// xem .env.example). Không đặt biến này thì initSentryServer()/captureServerException()
// no-op ngay, không ảnh hưởng gì tới hành vi hiện tại (an toàn mặc định).
//
// Không bật tracesSampleRate (performance tracing) — chỉ cần bắt lỗi (exception), giữ gọn
// dữ liệu gửi đi + không vượt quota free của Sentry.

import * as Sentry from '@sentry/node'

let initialized = false

// Gọi 1 lần lúc server khởi động (server.ts, SAU dotenv.config()).
export function initSentryServer(): void {
  const dsn = process.env.SENTRY_DSN
  if (!dsn || initialized) return
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0,
    // unhandledRejection/uncaughtException do processSafetyNet.ts lo (chạy cả khi KHÔNG có
    // DSN, và tránh gửi trùng): bỏ hai integration mặc định của SDK (tên theo @sentry/node 11).
    integrations: (defaults) =>
      defaults.filter((i) => i.name !== 'OnUncaughtException' && i.name !== 'OnUnhandledRejection'),
  })
  initialized = true
}

// Gửi 1 lỗi lên Sentry. No-op nếu chưa cấu hình SENTRY_DSN (initSentryServer() chưa bật).
export function captureServerException(error: unknown, extra?: Record<string, unknown>): void {
  if (!initialized) return
  Sentry.captureException(error, extra ? { extra } : undefined)
}

// Chờ Sentry gửi nốt sự kiện đang đợi (dùng trước khi thoát tiến trình). Chưa bật Sentry → true ngay.
export async function flushServerSentry(timeoutMs: number): Promise<boolean> {
  if (!initialized) return true
  return Sentry.flush(timeoutMs)
}
