// Thẻ "Gợi ý luyện âm" (changelog 0484) thay "GOP Lab" hiện điểm gán sẵn. Canh: không gọi server
// chấm, không hiện con số/điểm, gợi ý đổi theo câu mẫu, nút nghe gọi đúng `speak`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import PronunciationHintsCard from './PronunciationHintsCard'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const tts = vi.hoisted(() => ({
  speak: vi.fn(async () => 1),
  stopSpeaking: vi.fn(),
}))
vi.mock('../../lib/tts', () => tts)

let container: HTMLDivElement
let root: Root
const fetchMock = vi.fn()

async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<PronunciationHintsCard />)
  })
}

async function click(label: string) {
  const b = [...container.querySelectorAll('button')].find((x) => x.textContent?.includes(label))
  expect(b, `không thấy nút "${label}"`).toBeTruthy()
  await act(async () => {
    b?.click()
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockClear()
  tts.speak.mockReset().mockResolvedValue(1)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('PronunciationHintsCard', () => {
  it('câu mặc định hiện gợi ý /θ/, /ð/, /ks/ kèm từ, không có điểm số', async () => {
    await render()
    const text = container.textContent ?? ''
    expect(text).toContain('/θ/')
    expect(text).toContain('/ð/')
    expect(text).toContain('/ks/')
    expect(text).not.toMatch(/GOP|\d+\s?%|\/\s?100|wpm/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('đổi câu mẫu thì gợi ý đổi theo', async () => {
    await render()
    await click('She sells seashells')
    expect(container.textContent).toContain('/ʃ/')
    expect(container.textContent).not.toContain('/θ/')
  })

  it('nút "Nghe câu mẫu" đọc đúng câu đang chọn', async () => {
    await render()
    await click('Red leather yellow leather')
    await click('Nghe câu mẫu')
    expect(tts.speak).toHaveBeenCalledWith('Red leather yellow leather', 'en-US')
  })

  it('phát lỗi: báo role=alert', async () => {
    tts.speak.mockRejectedValueOnce(new Error('audio'))
    await render()
    await click('Nghe câu mẫu')
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Chưa phát được')
  })
})
