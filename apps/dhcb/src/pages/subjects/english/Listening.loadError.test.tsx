// Listening.loadError.test.tsx — trang Nghe phải HIỆN LỖI + Thử lại khi tải hỏng, không được kẹt
// skeleton mãi (changelog 0525). Bản cũ: `loadIndex().then(setIndex)` / `getAllDialogues().then`
// không có nhánh lỗi; `open()` reject thì `opening` kẹt true.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import Listening from './Listening'
import { LangProvider } from '../../../context/LangProvider'
import type { SubjectMeta, Subject } from '../../../data/patterns/loader'
import type { Dialogue } from '../../../data/dialogues'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const loadIndex = vi.fn<() => Promise<SubjectMeta[]>>()
const loadSubject = vi.fn<(m: SubjectMeta) => Promise<Subject | null>>()
const getAllDialogues = vi.fn<() => Promise<Record<string, Dialogue[]>>>()

vi.mock('../../../data/patterns/loader', () => ({
  loadIndex: () => loadIndex(),
  loadSubject: (m: SubjectMeta) => loadSubject(m),
}))
vi.mock('../../../data/dialoguesLoader', () => ({ getAllDialogues: () => getAllDialogues() }))
vi.mock('../../../components/Layout', () => ({ default: () => null }))
vi.mock('../../../context/useAuth', () => ({ useAuth: () => ({ user: null }) }))
vi.mock('../../../lib/useIsDesktopViewport', () => ({ useIsDesktopViewport: () => false }))
vi.mock('../../../lib/tts', () => ({
  speak: vi.fn(),
  stopSpeaking: vi.fn(),
  unlockAudio: vi.fn(),
}))

const META: SubjectMeta = {
  starter: 'I want to',
  category: 'Mong muốn',
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

async function render(path = '/listening') {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(
      <LangProvider>
        <MemoryRouter initialEntries={[path]}>
          <Listening />
        </MemoryRouter>
      </LangProvider>,
    )
  })
  await flush()
}

function buttonByText(text: string): HTMLButtonElement {
  const btn = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(text))
  if (!btn) throw new Error(`không thấy nút "${text}"`)
  return btn
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem('et_direction', 'A')
  loadIndex.mockReset()
  loadSubject.mockReset()
  getAllDialogues.mockReset()
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('Listening — tab Mẫu câu', () => {
  it('tải chỉ mục lỗi → khối lỗi + Thử lại (không phải skeleton mãi)', async () => {
    loadIndex.mockRejectedValue(new TypeError('Failed to fetch'))
    await render()
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Không tải được dữ liệu')
    expect(alert?.textContent).toContain('Không kết nối được máy chủ')

    loadIndex.mockResolvedValue([META])
    await act(async () => buttonByText('Thử lại').click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('I want to')
  })

  it('mở mẫu lỗi → về danh sách kèm lỗi, bấm Thử lại mở được', async () => {
    loadIndex.mockResolvedValue([META])
    loadSubject.mockRejectedValueOnce(new Error('HTTP 503'))
    await render()
    await act(async () => buttonByText('I want to').click())
    await flush()
    // Không kẹt skeleton: danh sách vẫn còn và có khối lỗi.
    expect(container.textContent).toContain('I want to')
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Máy chủ đang gặp sự cố',
    )

    loadSubject.mockResolvedValueOnce({
      starter: 'I want to',
      category: 'Mong muốn',
      color: 'sky',
      sentences: [{ en: 'I want to sleep.', vi: 'Tôi muốn ngủ.' }],
    })
    await act(async () => buttonByText('Thử lại').click())
    await flush()
    expect(container.textContent).toContain('I want to sleep.')
  })

  it('mẫu không còn trong chunk (null) → báo không tìm thấy, không màn trắng', async () => {
    loadIndex.mockResolvedValue([META])
    loadSubject.mockResolvedValue(null)
    await render()
    await act(async () => buttonByText('I want to').click())
    await flush()
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Không tìm thấy mẫu câu này.',
    )
  })
})

describe('Listening — tab Hội thoại', () => {
  it('tải hội thoại lỗi → khối lỗi + Thử lại; thử lại thành công → danh sách', async () => {
    loadIndex.mockResolvedValue([])
    getAllDialogues.mockRejectedValueOnce(new Error('Dialogues HTTP 500'))
    await render('/listening?tab=dialogues')
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Máy chủ đang gặp sự cố',
    )

    getAllDialogues.mockResolvedValueOnce({
      'a1-greet': [{ titleVi: 'Chào hỏi', titleEn: 'Greetings', lines: [] }],
    })
    await act(async () => buttonByText('Thử lại').click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('Chào hỏi')
  })
})
