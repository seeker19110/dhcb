// WordCard.loadError.test.tsx — ví dụ bổ sung là dữ liệu PHỤ: tải hỏng thì thẻ từ vẫn dùng được và
// KHÔNG được sinh unhandled rejection (changelog 0530). Bản cũ: `loadExtraExamples().then(...)` ở
// cấp module và trong effect đều không có `.catch`.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { ToastProvider } from '@core/ToastProvider'
import type { DictEntry } from '../types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const loadExtraExamples = vi.fn<() => Promise<Record<string, never>>>()
vi.mock('../data/extraExamplesLoader', () => ({ loadExtraExamples: () => loadExtraExamples() }))

const CARD: DictEntry = {
  word: 'hello',
  pos: 'interj',
  vi: 'xin chào',
  ex_en: 'Hello there.',
  ex_vi: 'Xin chào bạn.',
}

let container: HTMLDivElement
let root: Root
const unhandled: unknown[] = []
const onUnhandled = (e: unknown) => unhandled.push(e)

beforeEach(() => {
  unhandled.length = 0
  process.on('unhandledRejection', onUnhandled)
})
afterEach(async () => {
  process.off('unhandledRejection', onUnhandled)
  await act(async () => root.unmount())
  container.remove()
})

describe('WordCard — ví dụ bổ sung tải hỏng', () => {
  it('vẫn hiện thẻ từ, không unhandled rejection', async () => {
    loadExtraExamples.mockRejectedValue(new TypeError('Failed to fetch'))
    // Import SAU khi đặt mock để cả lệnh nạp sẵn ở cấp module cũng gặp lỗi.
    const { default: WordCard } = await import('./WordCard')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () =>
      root.render(
        // App bọc mọi trang trong ToastProvider; nút phát âm (WordVoiceCycleButton) báo hết lượt qua toast.
        <ToastProvider>
          <WordCard card={CARD} isA uid="u" />
        </ToastProvider>,
      ),
    )
    await act(async () => {
      for (let i = 0; i < 5; i++) await Promise.resolve()
    })
    expect(container.textContent).toContain('hello')
    expect(loadExtraExamples).toHaveBeenCalled()
    expect(unhandled).toEqual([])
  })
})
