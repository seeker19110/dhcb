// src/lib/errorTracking.ts — Sentry (error tracking) phía CLIENT.
//
// CHỈ bật khi có biến môi trường VITE_SENTRY_DSN (đặt lúc build, xem .env.example).
// Không đặt biến này thì mọi hàm ở đây no-op ngay — KHÔNG tải @sentry/react, không tốn
// byte nào trong bundle chính (an toàn mặc định, không ảnh hưởng ngân sách size-limit).
//
// Dùng import() động (không import tĩnh ở đầu file) để @sentry/react nằm trong chunk
// riêng "vendor-sentry" (xem vite.config.ts) — chỉ tải xuống khi thực sự cần, không nằm
// trong bundle khởi động ban đầu.
//
// [2026-10-10, đo Lighthouse] SDK (~150 KB) KHÔNG còn tải ngay lúc khởi động: nó chen băng thông
// với chunk trang đang mở và đẩy LCP mobile lên 5,1 s. Nay tải khi trang đầu đã vẽ xong
// (runWhenPageSettled — lib/pageSettled.ts), hoặc sớm hơn nếu có lỗi cần gửi (captureException
// tự kích tải). Lỗi xảy ra TRƯỚC khi SDK sẵn sàng được giữ tạm trong hàng đợi nhỏ rồi gửi bù —
// không mất lỗi khởi động.
//
// Không bật tracesSampleRate (performance tracing) hay Session Replay — app này chỉ cần
// bắt lỗi (crash/exception), giữ gọn dữ liệu gửi đi + không vượt quota free của Sentry.
import { runWhenPageSettled } from './pageSettled'

type SentryModule = typeof import('@sentry/react')

let sentryModule: SentryModule | null = null
let initPromise: Promise<void> | null = null

// Hàng đợi lỗi chưa bắt được vì SDK chưa tải — giới hạn để một vòng lặp lỗi không phình bộ nhớ.
const MAX_EARLY_ERRORS = 10
const earlyErrors: unknown[] = []

function getDsn(): string | undefined {
  return import.meta.env.VITE_SENTRY_DSN as string | undefined
}

function queueEarlyError(error: unknown): void {
  if (earlyErrors.length < MAX_EARLY_ERRORS) earlyErrors.push(error)
}

function onEarlyError(event: ErrorEvent): void {
  queueEarlyError(event.error ?? event.message)
}

function onEarlyRejection(event: PromiseRejectionEvent): void {
  queueEarlyError(event.reason)
}

function stopEarlyCapture(): void {
  window.removeEventListener('error', onEarlyError)
  window.removeEventListener('unhandledrejection', onEarlyRejection)
}

// Tải + khởi tạo SDK đúng MỘT lần (idempotent). Từ lúc này Sentry tự bắt lỗi toàn cục, nên gỡ
// bộ nghe tạm và gửi bù các lỗi đã xếp hàng.
function loadSentry(dsn: string): Promise<void> {
  initPromise ??= import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0,
    })
    sentryModule = Sentry
    stopEarlyCapture()
    for (const error of earlyErrors.splice(0)) Sentry.captureException(error)
  })
  return initPromise
}

// Gọi 1 lần lúc app khởi động (main.tsx). No-op nếu chưa cấu hình DSN.
export function initErrorTracking(): void {
  const dsn = getDsn()
  if (!dsn) return
  window.addEventListener('error', onEarlyError)
  window.addEventListener('unhandledrejection', onEarlyRejection)
  runWhenPageSettled(() => {
    // Lỗi mạng khi tải chunk SDK: bỏ qua — app vẫn chạy, lần captureException sau thử lại.
    loadSentry(dsn).catch(() => {
      initPromise = null
    })
  })
}

// Gửi 1 lỗi lên Sentry (vd. từ ErrorBoundary). No-op an toàn nếu chưa bật DSN — không bao giờ
// ném lỗi ngược lại nơi gọi. SDK chưa tải thì tải ngay (lỗi thật quan trọng hơn hiệu năng).
export async function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const dsn = getDsn()
  if (!dsn) return
  try {
    await loadSentry(dsn)
    sentryModule?.captureException(error, context ? { extra: context } : undefined)
  } catch {
    // Không để lỗi báo cáo làm hỏng luồng xử lý lỗi gốc.
    initPromise = null
  }
}
