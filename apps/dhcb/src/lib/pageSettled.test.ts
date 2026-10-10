// pageSettled.test.ts — canh thời điểm chạy việc nền (đo Lighthouse 2026-10-10): KHÔNG được chạy
// trước `load`, chạy SETTLE_DELAY_MS sau `load` (tương tác không kích hoạt sớm), đúng một lần,
// và huỷ được.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { runWhenPageSettled } from './pageSettled'

type IdleWindow = Window & { requestIdleCallback?: unknown; cancelIdleCallback?: unknown }

function setReadyState(state: DocumentReadyState) {
  Object.defineProperty(document, 'readyState', { configurable: true, get: () => state })
}

describe('runWhenPageSettled', () => {
  const w = window as IdleWindow
  let savedRic: unknown
  let savedCic: unknown

  beforeEach(() => {
    vi.useFakeTimers()
    savedRic = w.requestIdleCallback
    savedCic = w.cancelIdleCallback
    // Mặc định: trình duyệt KHÔNG có requestIdleCallback (Safari) → chạy ngay khi ổn định.
    w.requestIdleCallback = undefined
    w.cancelIdleCallback = undefined
  })

  afterEach(() => {
    vi.useRealTimers()
    w.requestIdleCallback = savedRic
    w.cancelIdleCallback = savedCic
    setReadyState('complete')
  })

  it('trang chưa load: không chạy dù đã quá thời gian chờ; load xong + 4 s mới chạy', () => {
    setReadyState('loading')
    const task = vi.fn()
    runWhenPageSettled(task)
    vi.advanceTimersByTime(10_000)
    expect(task).not.toHaveBeenCalled()

    window.dispatchEvent(new Event('load'))
    vi.advanceTimersByTime(3999)
    expect(task).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(task).toHaveBeenCalledTimes(1)
  })

  it('chỉ chạy MỘT lần, và tương tác KHÔNG kích hoạt sớm (cú chạm đầu thường là chuyển trang)', () => {
    setReadyState('complete')
    const task = vi.fn()
    runWhenPageSettled(task)
    window.dispatchEvent(new Event('pointerdown'))
    vi.advanceTimersByTime(3999)
    expect(task).not.toHaveBeenCalled()
    vi.advanceTimersByTime(10_000)
    expect(task).toHaveBeenCalledTimes(1)
  })

  it('có requestIdleCallback: đợi tới lúc rảnh (có timeout) rồi mới chạy', () => {
    setReadyState('complete')
    const ric = vi.fn((cb: () => void) => {
      setTimeout(cb, 50)
      return 7
    })
    w.requestIdleCallback = ric
    const task = vi.fn()
    runWhenPageSettled(task)
    vi.advanceTimersByTime(4000)
    expect(ric).toHaveBeenCalledWith(expect.any(Function), { timeout: 3000 })
    expect(task).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)
    expect(task).toHaveBeenCalledTimes(1)
  })

  it('huỷ trước khi ổn định: không bao giờ chạy', () => {
    setReadyState('complete')
    const task = vi.fn()
    const cancel = runWhenPageSettled(task)
    vi.advanceTimersByTime(1000)
    cancel()
    vi.advanceTimersByTime(10_000)
    expect(task).not.toHaveBeenCalled()
  })

  it('huỷ khi đang chờ lúc rảnh: gọi cancelIdleCallback và không chạy', () => {
    setReadyState('complete')
    const cic = vi.fn()
    w.requestIdleCallback = vi.fn(() => 42)
    w.cancelIdleCallback = cic
    const task = vi.fn()
    const cancel = runWhenPageSettled(task)
    vi.advanceTimersByTime(4000)
    cancel()
    expect(cic).toHaveBeenCalledWith(42)
    expect(task).not.toHaveBeenCalled()
  })
})
