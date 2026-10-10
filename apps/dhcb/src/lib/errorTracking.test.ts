// errorTracking.test.ts — canh việc HOÃN tải Sentry (đo Lighthouse 2026-10-10): không DSN thì
// không làm gì; có DSN thì SDK chỉ tải khi trang ổn định, lỗi xảy ra trước đó được gửi bù, và
// captureException tự kích tải SDK khi cần gửi lỗi ngay.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const sentry = vi.hoisted(() => ({ init: vi.fn(), captureException: vi.fn() }))
vi.mock('@sentry/react', () => sentry)

// Giữ lại task đã hẹn để test tự quyết định lúc "trang ổn định".
const settled = vi.hoisted(() => ({ tasks: [] as Array<() => void> }))
vi.mock('./pageSettled', () => ({
  runWhenPageSettled: (task: () => void) => {
    settled.tasks.push(task)
    return () => {}
  },
}))

async function loadModule() {
  vi.resetModules()
  return import('./errorTracking')
}

async function flush() {
  for (let i = 0; i < 5; i++) await Promise.resolve()
  await new Promise((r) => setTimeout(r, 0))
}

describe('errorTracking — hoãn tải Sentry', () => {
  beforeEach(() => {
    sentry.init.mockReset()
    sentry.captureException.mockReset()
    settled.tasks = []
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('không có DSN: không hẹn tải, captureException là no-op', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')
    const { initErrorTracking, captureException } = await loadModule()
    initErrorTracking()
    await captureException(new Error('x'))
    expect(settled.tasks).toHaveLength(0)
    expect(sentry.init).not.toHaveBeenCalled()
  })

  it('có DSN: KHÔNG tải SDK lúc khởi động; lỗi sớm được gửi bù khi trang ổn định', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://k@o0.ingest.sentry.io/0')
    const { initErrorTracking } = await loadModule()
    initErrorTracking()
    expect(sentry.init).not.toHaveBeenCalled()

    const early = new Error('lỗi lúc khởi động')
    window.dispatchEvent(new ErrorEvent('error', { error: early }))

    expect(settled.tasks).toHaveLength(1)
    settled.tasks[0]!()
    await flush()
    expect(sentry.init).toHaveBeenCalledTimes(1)
    expect(sentry.captureException).toHaveBeenCalledWith(early)

    // Sau khi SDK sẵn sàng, bộ nghe tạm đã gỡ — Sentry tự bắt, không gửi trùng.
    sentry.captureException.mockClear()
    window.dispatchEvent(new ErrorEvent('error', { error: new Error('sau') }))
    expect(sentry.captureException).not.toHaveBeenCalled()
  })

  it('captureException trước khi trang ổn định: tự tải SDK ngay và gửi kèm context', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://k@o0.ingest.sentry.io/0')
    const { initErrorTracking, captureException } = await loadModule()
    initErrorTracking()
    const err = new Error('boundary')
    await captureException(err, { where: 'ErrorBoundary' })
    expect(sentry.init).toHaveBeenCalledTimes(1)
    expect(sentry.captureException).toHaveBeenCalledWith(err, { extra: { where: 'ErrorBoundary' } })

    // Trang ổn định sau đó: không khởi tạo lần hai.
    settled.tasks[0]!()
    await flush()
    expect(sentry.init).toHaveBeenCalledTimes(1)
  })
})
