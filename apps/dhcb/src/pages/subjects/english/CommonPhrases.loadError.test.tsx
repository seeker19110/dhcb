// CommonPhrases.loadError.test.tsx — trang Câu thông dụng phải tách "lỗi tải" khỏi "không có kết
// quả" và không được khoá cứng các thẻ khi mở chủ đề lỗi (changelog 0525).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import CommonPhrases from './CommonPhrases'
import { LangProvider } from '../../../context/LangProvider'
import type { SubjectMeta, Subject } from '../../../data/patterns/loader'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const loadIndex = vi.fn<() => Promise<SubjectMeta[]>>()
const loadSubject = vi.fn<(m: SubjectMeta) => Promise<Subject | null>>()

vi.mock('../../../data/patterns/loader', () => ({
  loadIndex: () => loadIndex(),
  loadSubject: (m: SubjectMeta) => loadSubject(m),
}))
vi.mock('../../../components/Layout', () => ({ default: () => null }))
vi.mock('../../../context/useAuth', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('../../../lib/tts', () => ({ speak: vi.fn(), stopSpeaking: vi.fn(), unlockAudio: vi.fn() }))

const META: SubjectMeta = {
  starter: 'I am',
  category: 'Cơ bản',
  color: 'sky',
  count: 1,
  chunk: 0,
  idx: 0,
}

let container: HTMLDivElement
let root: Root

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  })
}

async function render() {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(
      <LangProvider>
        <MemoryRouter>
          <CommonPhrases />
        </MemoryRouter>
      </LangProvider>,
    )
  })
  await flush()
}

const cardButton = () =>
  [...container.querySelectorAll('button')].find(
    (b) => b.textContent?.includes('I am') && !b.textContent.includes('Thử lại'),
  ) as HTMLButtonElement

const retryButton = () =>
  [...container.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Thử lại'),
  ) as HTMLButtonElement

beforeEach(() => {
  localStorage.clear()
  loadIndex.mockReset()
  loadSubject.mockReset()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
      takeRecords() {
        return []
      }
    },
  )
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

describe('CommonPhrases — trạng thái lỗi', () => {
  it('tải danh sách lỗi → khối lỗi + Thử lại, KHÔNG hiện "Không tìm thấy kết quả"', async () => {
    loadIndex.mockRejectedValue(new TypeError('Failed to fetch'))
    await render()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Không kết nối được máy chủ',
    )
    expect(container.textContent).not.toContain('Không tìm thấy kết quả phù hợp.')

    loadIndex.mockResolvedValue([META])
    await act(async () => retryButton().click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(cardButton()).toBeDefined()
  })

  it('mở chủ đề lỗi → báo lỗi, thẻ KHÔNG bị khoá cứng, Thử lại mở được', async () => {
    loadIndex.mockResolvedValue([META])
    loadSubject.mockRejectedValueOnce(new Error('HTTP 502'))
    await render()
    await act(async () => cardButton().click())
    await flush()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Máy chủ đang gặp sự cố',
    )
    expect(cardButton().disabled).toBe(false)

    loadSubject.mockResolvedValueOnce({
      starter: 'I am',
      category: 'Cơ bản',
      color: 'sky',
      sentences: [{ en: 'I am fine.', vi: 'Tôi ổn.' }],
    })
    await act(async () => retryButton().click())
    await flush()
    expect(container.textContent).toContain('I am fine.')
  })

  it('chủ đề không còn trong dữ liệu (null) → báo không tìm thấy', async () => {
    loadIndex.mockResolvedValue([META])
    loadSubject.mockResolvedValue(null)
    await render()
    await act(async () => cardButton().click())
    await flush()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Không tìm thấy chủ đề này.',
    )
  })
})
