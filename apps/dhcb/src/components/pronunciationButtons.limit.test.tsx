// @vitest-environment happy-dom
// Hai nút loa gọi /api/pronunciation (PronounceButton ở Từ điển, WordVoiceCycleButton ở thẻ học từ).
// Từ 2026-10-08 (changelog 0534) cache MISS của endpoint này trừ lượt AI: hết lượt → 429 kèm câu
// thông báo. Canh: câu đó PHẢI hiện cho người học (không nuốt vào console như trước), và từ vẫn
// được đọc bằng Web Speech để thẻ học không bị câm.
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const toastInfo = vi.fn()
vi.mock('@core/ToastProvider', () => ({
  useToast: () => ({ info: toastInfo, error: vi.fn(), success: vi.fn(), show: vi.fn() }),
}))

const playAudioUrl = vi.fn()
vi.mock('../lib/tts', () => ({
  getVoicePref: () => 'Kore',
  getVoiceRandomPref: () => false,
  playAudioUrl: (url: string) => playAudioUrl(url),
}))

const fetchPronunciation = vi.fn()
vi.mock('../lib/pronunciationApi', () => ({
  fetchPronunciation: (...args: unknown[]) => fetchPronunciation(...args),
}))

import PronounceButton from './PronounceButton'
import WordVoiceCycleButton from './WordVoiceCycleButton'

const speak = vi.fn()
let container: HTMLDivElement
let root: Root

beforeEach(() => {
  toastInfo.mockReset()
  playAudioUrl.mockReset()
  fetchPronunciation.mockReset()
  speak.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal('speechSynthesis', { getVoices: () => [], cancel: vi.fn(), speak })
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      lang = ''
      voice: unknown = null
      constructor(public text: string) {}
    },
  )
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const BUTTONS = [
  ['PronounceButton', () => <PronounceButton word="apple" random={false} />],
  ['WordVoiceCycleButton', () => <WordVoiceCycleButton word="apple" />],
] as const

async function renderAndClick(make: () => React.ReactElement) {
  await act(async () => root.render(make()))
  const button = container.querySelector('button')
  expect(button).not.toBeNull()
  await act(async () => button!.click())
}

describe.each(BUTTONS)('%s', (_name, make) => {
  it('hết lượt AI (refused) → HIỆN đúng câu thông báo của server + vẫn đọc bằng Web Speech', async () => {
    const message = 'Bạn đã dùng hết lượt hôm nay. Thử lại vào ngày mai nhé.'
    fetchPronunciation.mockResolvedValue({ kind: 'refused', message })
    await renderAndClick(make)
    expect(toastInfo).toHaveBeenCalledExactlyOnceWith(message)
    expect(speak).toHaveBeenCalledOnce()
    expect(playAudioUrl).not.toHaveBeenCalled()
  })

  it('lỗi thường (mạng/5xx) → không bật thông báo, lặng lẽ đọc bằng Web Speech như cũ', async () => {
    fetchPronunciation.mockResolvedValue({ kind: 'error', message: 'Lỗi 500' })
    await renderAndClick(make)
    expect(toastInfo).not.toHaveBeenCalled()
    expect(speak).toHaveBeenCalledOnce()
  })

  it('thành công → phát audio Google, không thông báo, không Web Speech', async () => {
    fetchPronunciation.mockResolvedValue({
      kind: 'ok',
      audioUrl: 'https://cdn/apple.mp3',
      voice: 'Kore',
    })
    await renderAndClick(make)
    expect(fetchPronunciation).toHaveBeenCalledWith('apple', 'Kore', 'en-US')
    expect(playAudioUrl).toHaveBeenCalledExactlyOnceWith('https://cdn/apple.mp3')
    expect(toastInfo).not.toHaveBeenCalled()
    expect(speak).not.toHaveBeenCalled()
  })
})
