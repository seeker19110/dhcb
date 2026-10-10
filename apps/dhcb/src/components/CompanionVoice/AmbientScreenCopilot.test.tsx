// Hồi quy đợt E4 (audit 2026-10-10): dừng chia sẻ màn hình từ thanh của TRÌNH DUYỆT (sự kiện
// 'ended' trên track) phải đưa panel về "Chưa kích hoạt". Bản cũ đọc `stream` qua closure lúc
// còn null nên không làm gì — panel kẹt ở "Đang bật".
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AmbientScreenCopilot } from './AmbientScreenCopilot'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let container: HTMLDivElement
let root: Root

function fakeStream() {
  const listeners: Record<string, () => void> = {}
  const track = {
    stop: vi.fn(),
    addEventListener: vi.fn((type: string, fn: () => void) => {
      listeners[type] = fn
    }),
  }
  const stream = {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream
  return { stream, track, fire: (type: string) => listeners[type]?.() }
}

const button = (label: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(label))

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function openAndStart(fake: ReturnType<typeof fakeStream>) {
  // happy-dom chỉ nhận MediaStream thật cho `srcObject` — luồng giả thì bỏ qua phép gán.
  vi.spyOn(HTMLMediaElement.prototype, 'srcObject', 'set').mockImplementation(() => {})
  vi.stubGlobal('navigator', {
    ...navigator,
    mediaDevices: { getDisplayMedia: vi.fn(async () => fake.stream) },
  })
  act(() => root.render(<AmbientScreenCopilot />))
  act(() => button('Trợ Lý Nhìn Màn Hình')?.click())
  await act(async () => {
    button('Bật chia sẻ màn hình')?.click()
  })
  expect(container.textContent).toContain('Đang bật')
}

describe('AmbientScreenCopilot — dừng chia sẻ', () => {
  it('dừng từ thanh của trình duyệt (track "ended") → panel về "Chưa kích hoạt"', async () => {
    const fake = fakeStream()
    await openAndStart(fake)
    act(() => fake.fire('ended'))
    expect(container.textContent).toContain('Chưa kích hoạt')
    expect(button('Bật chia sẻ màn hình')).toBeDefined()
  })

  it('bấm "Dừng quan sát" → dừng track + về "Chưa kích hoạt"', async () => {
    const fake = fakeStream()
    await openAndStart(fake)
    act(() => button('Dừng quan sát')?.click())
    expect(fake.track.stop).toHaveBeenCalled()
    expect(container.textContent).toContain('Chưa kích hoạt')
  })

  it('gỡ component khi đang chia sẻ → dừng track (không để camera/màn hình chạy ngầm)', async () => {
    const fake = fakeStream()
    await openAndStart(fake)
    act(() => root.render(<></>))
    expect(fake.track.stop).toHaveBeenCalled()
  })
})
