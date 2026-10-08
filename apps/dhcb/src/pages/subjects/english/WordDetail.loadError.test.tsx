// WordDetail.loadError.test.tsx — trang từ công khai: tải từ điển hỏng phải hiện lỗi + Thử lại,
// không được quay vòng xoay mãi (changelog 0525).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import WordDetail from './WordDetail'
import type { DictEntry } from '../../../types'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const loadDictionary = vi.fn<() => Promise<DictEntry[]>>()
vi.mock('../../../data/dictionary/loader', () => ({ loadDictionary: () => loadDictionary() }))
vi.mock('../../../lib/tts', () => ({ speak: vi.fn() }))

let container: HTMLDivElement
let root: Root

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  })
}

async function render(word = 'apple') {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <MemoryRouter initialEntries={[`/tu/${word}`]}>
        <Routes>
          <Route path="/tu/:word" element={<WordDetail />} />
        </Routes>
      </MemoryRouter>,
    ),
  )
  await flush()
}

beforeEach(() => {
  loadDictionary.mockReset()
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('WordDetail — tải từ điển', () => {
  it('lỗi → khối lỗi + Thử lại; thử lại thành công → hiện từ', async () => {
    loadDictionary.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await render()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Không kết nối được máy chủ',
    )
    expect(container.querySelector('[role="status"]')).toBeNull()

    loadDictionary.mockResolvedValueOnce([
      { word: 'apple', vi: 'quả táo', ex_en: 'An apple.', ex_vi: 'Một quả táo.' } as DictEntry,
    ])
    const retry = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Thử lại'),
    ) as HTMLButtonElement
    await act(async () => retry.click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('quả táo')
  })

  it('đang tải → có vùng trạng thái có nhãn cho trình đọc màn hình', async () => {
    loadDictionary.mockReturnValue(new Promise(() => {}))
    await render()
    expect(container.querySelector('[role="status"]')?.getAttribute('aria-label')).toBe(
      'Đang tải từ điển',
    )
  })

  it('từ không có trong từ điển → vẫn báo không tìm thấy', async () => {
    loadDictionary.mockResolvedValueOnce([])
    await render('zzz')
    expect(container.textContent).toContain('Không tìm thấy từ "zzz" trong từ điển.')
  })
})
