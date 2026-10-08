// Stories.loadError.test.tsx — trang Truyện + trang đọc truyện phải tách "lỗi tải" khỏi "chưa có
// truyện" / "không tìm thấy truyện", kèm Thử lại (changelog 0525).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Stories from './Stories'
import StoryReader from './StoryReader'
import { LangProvider } from '../../../context/LangProvider'
import { duongDanTruyen } from '../../../lib/englishRoutes'
import type { Story, StoryMeta } from '../../../data/stories/index'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const loadStoryIndex = vi.fn<() => Promise<StoryMeta[]>>()
const loadStory = vi.fn<(id: string) => Promise<Story | null>>()

vi.mock('../../../data/stories/loader', () => ({
  loadStoryIndex: () => loadStoryIndex(),
  loadStory: (id: string) => loadStory(id),
}))
vi.mock('../../../components/Layout', () => ({ default: () => null }))
vi.mock('../../../context/useAuth', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('../../../lib/useIsDesktopViewport', () => ({ useIsDesktopViewport: () => false }))
vi.mock('../../../lib/tts', () => ({
  speak: vi.fn(),
  stopSpeaking: vi.fn(),
  pauseCurrentAudio: vi.fn(),
  resumeCurrentAudio: vi.fn(),
  unlockAudio: vi.fn(),
}))

const STORY: Story = {
  id: 'fox',
  kind: 'fable',
  titleEn: 'The Fox',
  titleVi: 'Con cáo',
  countryVi: 'Hy Lạp',
  countryEn: 'Greece',
  flag: '🇬🇷',
  level: 'A2',
  lineCount: 1,
  source: { en: 'Aesop', enUrl: '', vi: 'Dịch tay' },
  lines: [{ p: 0, en: 'A fox.', vi: 'Một con cáo.' }],
}

let container: HTMLDivElement
let root: Root

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  })
}

async function render(node: ReactNode) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<LangProvider>{node}</LangProvider>))
  await flush()
}

const retryButton = () =>
  [...container.querySelectorAll('button')].find((b) =>
    b.textContent?.includes('Thử lại'),
  ) as HTMLButtonElement

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('et_direction', 'A')
  loadStoryIndex.mockReset()
  loadStory.mockReset()
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
  Element.prototype.scrollIntoView = vi.fn()
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

describe('Stories — danh sách truyện', () => {
  it('tải lỗi → khối lỗi + Thử lại, KHÔNG hiện màn "chưa có truyện"', async () => {
    loadStoryIndex.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await render(
      <MemoryRouter>
        <Stories />
      </MemoryRouter>,
    )
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Không kết nối được máy chủ')
    expect(alert?.textContent).toContain('Vị trí đọc dở của bạn vẫn được giữ.')

    loadStoryIndex.mockResolvedValueOnce([STORY])
    await act(async () => retryButton().click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('The Fox')
  })
})

describe('StoryReader — đọc truyện', () => {
  const renderReader = () =>
    render(
      <MemoryRouter initialEntries={[duongDanTruyen('fox')]}>
        <Routes>
          <Route path={duongDanTruyen(':id')} element={<StoryReader />} />
        </Routes>
      </MemoryRouter>,
    )

  it('lỗi mạng → khối lỗi + Thử lại, KHÔNG báo "Không tìm thấy truyện này."', async () => {
    loadStory.mockRejectedValueOnce(new Error('HTTP 503'))
    await renderReader()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Máy chủ đang gặp sự cố',
    )
    expect(container.textContent).not.toContain('Không tìm thấy truyện này.')

    loadStory.mockResolvedValueOnce(STORY)
    await act(async () => retryButton().click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('A fox.')
  })

  it('truyện không tồn tại (null) → vẫn báo không tìm thấy', async () => {
    loadStory.mockResolvedValueOnce(null)
    await renderReader()
    expect(container.textContent).toContain('Không tìm thấy truyện này.')
  })
})
