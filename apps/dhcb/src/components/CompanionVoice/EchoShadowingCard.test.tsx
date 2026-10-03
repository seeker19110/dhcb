// Thẻ nói đuổi (changelog 0484): bỏ "Band"/độ trễ/độ đồng bộ tính từ số ngẫu nhiên, giữ bài luyện 3
// pha (nghe → nói đuổi → tự nói) với giọng mẫu đọc bằng TTS thật. Canh: không còn gửi lượt đi
// chấm, không hiện con số nào, nút phát gọi đúng `speak`, chuyển pha đúng, lỗi phát có role=alert.
// Lỗi tải danh sách bài mẫu đã có `e2e/companion-catalog-states.spec.ts` canh (PR #1178).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import EchoShadowingCard from './EchoShadowingCard'
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const tts = vi.hoisted(() => ({
  speak: vi.fn(async () => 1),
  stopSpeaking: vi.fn(),
}))
vi.mock('../../lib/tts', () => tts)

const PASSAGE = {
  id: 'unit_passage',
  title: 'Bài mẫu — Giọng Mỹ',
  targetText: 'Stay hungry, stay foolish.',
  speakerAccent: 'us_standard',
  audioUrl: '/audio/unit.mp3',
  bpmPacing: 120,
  syllableCount: 6,
  difficulty: 'beginner',
  schemaVersion: 'v3.0.0',
}

let container: HTMLDivElement
let root: Root
const fetchMock = vi.fn(
  async () => new Response(JSON.stringify({ passages: [PASSAGE] }), { status: 200 }),
)

function button(label: string): HTMLButtonElement | undefined {
  return [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(label))
}

async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<EchoShadowingCard />)
  })
}

async function click(label: string) {
  const b = button(label)
  expect(b, `không thấy nút "${label}"`).toBeTruthy()
  await act(async () => {
    b?.click()
  })
}

function currentStep(): string | null | undefined {
  return container.querySelector('[aria-current="step"]')?.textContent
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  tts.speak.mockReset().mockResolvedValue(1)
  tts.stopSpeaking.mockReset()
  fetchMock.mockClear()
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('EchoShadowingCard — bài luyện 3 pha, không chấm điểm', () => {
  it('pha 1: nút "Nghe mẫu" đọc đúng câu mẫu bằng TTS', async () => {
    await render()
    expect(currentStep()).toContain('Nghe chủ động')
    await click('Nghe mẫu')
    expect(tts.speak).toHaveBeenCalledWith('Stay hungry, stay foolish.', 'en-US')
  })

  it('không gửi lượt đi chấm và không hiện Band/ms/% nào', async () => {
    await render()
    await click('Nghe mẫu')
    await click('Pha tiếp')
    await click('Phát mẫu để nói đuổi')
    await click('Pha tiếp')
    await click('Nghe lại mẫu để so')
    const methods = fetchMock.mock.calls.map((c) => (c as unknown[])[1] as RequestInit | undefined)
    expect(methods.some((init) => init?.method === 'POST')).toBe(false)
    expect(container.textContent).not.toMatch(/Band|\d+\s?ms|\d+%/)
    expect(container.textContent).toContain('không chấm điểm')
  })

  it('chuyển pha: tiếp → trước → tới pha cuối thì "Luyện lại từ đầu" về pha 1', async () => {
    await render()
    await click('Pha tiếp')
    expect(currentStep()).toContain('Nói đuổi')
    await click('Pha trước')
    expect(currentStep()).toContain('Nghe chủ động')
    await click('Pha tiếp')
    await click('Pha tiếp')
    expect(currentStep()).toContain('Tự nói')
    expect(button('Pha tiếp')).toBeUndefined()
    await click('Luyện lại từ đầu')
    expect(currentStep()).toContain('Nghe chủ động')
  })

  it('phát lỗi: báo role=alert, không im lặng', async () => {
    tts.speak.mockRejectedValueOnce(new Error('audio'))
    await render()
    await click('Nghe mẫu')
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Chưa phát được')
  })

  it('đang phát thì nút đổi thành "Dừng giọng mẫu" và bấm là dừng', async () => {
    let finish: (v: number) => void = () => {}
    tts.speak.mockImplementationOnce(() => new Promise<number>((r) => (finish = r)))
    await render()
    await click('Nghe mẫu')
    await click('Dừng giọng mẫu')
    expect(tts.stopSpeaking).toHaveBeenCalled()
    await act(async () => finish(1))
  })
})
