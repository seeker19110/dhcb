// [U6 · M3] Avatar Bạn Đồng Hành phải tôn trọng "giảm chuyển động" và dừng khi tab ẩn.
// Bản cũ gọi `requestAnimationFrame` vô hạn bất kể hai điều kiện đó (audit 2026-09-30, M3).
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CyberTutorAvatar3D from './CyberTutorAvatar3D'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// Ngữ cảnh canvas giả: mọi phương thức là hàm rỗng (gradient trả về đối tượng có
// `addColorStop`), mọi phép gán thuộc tính đều nhận — đủ để hàm vẽ chạy hết một khung.
function fakeContext(clearRect: () => void): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => undefined }
  return new Proxy({} as CanvasRenderingContext2D, {
    get: (_target, prop) => (prop === 'clearRect' ? clearRect : () => gradient),
    set: () => true,
  })
}

function mockReducedMotion(reduce: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: reduce && query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
}

let container: HTMLDivElement
let root: Root
let clearRect: ReturnType<typeof vi.fn>
let raf: ReturnType<typeof vi.spyOn>
let caf: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  clearRect = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => fakeContext(clearRect) as unknown as RenderingContext,
  )
  raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 42)
  caf = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
})

describe('CyberTutorAvatar3D — tuỳ chọn chuyển động', () => {
  it('giảm chuyển động: vẽ một khung tĩnh, KHÔNG hẹn requestAnimationFrame nào', () => {
    mockReducedMotion(true)
    act(() => root.render(<CyberTutorAvatar3D />))
    expect(clearRect).toHaveBeenCalledTimes(1)
    expect(raf).not.toHaveBeenCalled()
  })

  it('mặc định có hẹn khung; tab ẩn thì huỷ khung đang hẹn', () => {
    mockReducedMotion(false)
    act(() => root.render(<CyberTutorAvatar3D />))
    expect(raf).toHaveBeenCalled()
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(caf).toHaveBeenCalledWith(42)
  })
})
