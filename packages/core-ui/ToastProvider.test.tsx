// @vitest-environment happy-dom
// Audit 2026-09-30 C2: toast không có vùng aria-live (trình đọc màn hình không bao giờ đọc) và tự
// tắt sau 4 giây cố định (người đọc chậm không kịp). Canh: hai vùng live luôn có mặt, lỗi đi vùng
// alert, thời gian theo loại + độ dài, dừng hẹn giờ khi rê chuột/focus.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ToastProvider, toastDurationMs, useToast } from './ToastProvider.js'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root
let api: ReturnType<typeof useToast>
const setApi = (value: ReturnType<typeof useToast>) => {
  api = value
}

/** Lấy API toast ra ngoài để test gọi trực tiếp (gán trong effect, không gán lúc render). */
function Grab() {
  const toast = useToast()
  useEffect(() => setApi(toast), [toast])
  return null
}

beforeEach(async () => {
  vi.useFakeTimers()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(
      <ToastProvider>
        <Grab />
      </ToastProvider>,
    )
  })
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.useRealTimers()
})

const alertRegion = () => container.querySelector('[aria-live="assertive"]')
const statusRegion = () => container.querySelector('[aria-live="polite"]')

describe('ToastProvider — vùng thông báo đọc được', () => {
  it('hai vùng live có sẵn trong DOM ngay cả khi chưa có toast nào', () => {
    expect(alertRegion()).not.toBeNull()
    expect(statusRegion()).not.toBeNull()
    expect(alertRegion()?.textContent).toBe('')
  })

  it('vùng live KHÔNG mang role alert/status (tránh "alert" rỗng trên mọi trang)', () => {
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('lỗi vào vùng assertive; thành công/thông tin vào vùng polite', async () => {
    await act(async () => {
      api.error('Mất mạng')
      api.success('Đã lưu')
      api.info('Mẹo nhỏ')
    })
    expect(alertRegion()?.textContent).toContain('Mất mạng')
    expect(alertRegion()?.textContent).not.toContain('Đã lưu')
    expect(statusRegion()?.textContent).toContain('Đã lưu')
    expect(statusRegion()?.textContent).toContain('Mẹo nhỏ')
    expect(statusRegion()?.textContent).not.toContain('Mất mạng')
  })
})

describe('toastDurationMs — đủ thời gian đọc', () => {
  it('thông tin/thành công tối thiểu 5 giây, lỗi tối thiểu 10 giây', () => {
    expect(toastDurationMs('info', 'Ok')).toBe(5000)
    expect(toastDurationMs('success', 'Ok')).toBe(5000)
    expect(toastDurationMs('error', 'Lỗi')).toBe(10000)
  })

  it('câu dài thì sống lâu hơn (60 ms/ký tự)', () => {
    const long = 'x'.repeat(300)
    expect(toastDurationMs('info', long)).toBe(18000)
    expect(toastDurationMs('error', long)).toBe(18000)
  })
})

describe('ToastProvider — hẹn giờ', () => {
  it('lỗi KHÔNG tắt sau 4 giây như trước, tắt sau 10 giây', async () => {
    await act(async () => api.error('Không lưu được'))
    await act(async () => vi.advanceTimersByTime(4000))
    expect(alertRegion()?.textContent).toContain('Không lưu được')
    await act(async () => vi.advanceTimersByTime(6000))
    expect(alertRegion()?.textContent).toBe('')
  })

  it('rê chuột vào toast thì dừng hẹn giờ; rời ra thì chạy tiếp phần CÒN LẠI', async () => {
    await act(async () => api.info('Đang đồng bộ'))
    await act(async () => vi.advanceTimersByTime(3000))
    const item = statusRegion()?.firstElementChild as HTMLElement
    await act(async () => {
      item.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
    })
    await act(async () => vi.advanceTimersByTime(20000))
    expect(statusRegion()?.textContent).toContain('Đang đồng bộ')
    await act(async () => {
      item.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
    })
    // Còn 2 giây (5 − 3): chưa tắt ở 1,9 giây, tắt sau 2 giây.
    await act(async () => vi.advanceTimersByTime(1900))
    expect(statusRegion()?.textContent).toContain('Đang đồng bộ')
    await act(async () => vi.advanceTimersByTime(200))
    expect(statusRegion()?.textContent).toBe('')
  })

  it('focus vào nút đóng cũng dừng hẹn giờ', async () => {
    await act(async () => api.success('Đã gửi'))
    const close = container.querySelector(
      'button[aria-label="Đóng thông báo"]',
    ) as HTMLButtonElement
    await act(async () => close.focus())
    await act(async () => vi.advanceTimersByTime(30000))
    expect(statusRegion()?.textContent).toContain('Đã gửi')
  })

  it('bấm "Đóng thông báo" thì gỡ ngay', async () => {
    await act(async () => api.error('Lỗi'))
    const close = container.querySelector(
      'button[aria-label="Đóng thông báo"]',
    ) as HTMLButtonElement
    await act(async () => close.click())
    expect(alertRegion()?.textContent).toBe('')
  })
})
