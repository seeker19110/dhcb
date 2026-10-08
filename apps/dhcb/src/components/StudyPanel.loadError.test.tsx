// StudyPanel.loadError.test.tsx — tải từ điển hỏng phải hiện lỗi + Thử lại, không được kẹt dòng
// "Đang tải từ vựng…" mãi (changelog 0525).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import StudyPanel from './StudyPanel'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const loadCurriculum = vi.fn<() => Promise<void>>()
let curriculumReady = false

vi.mock('../lib/curriculum', () => ({
  loadCurriculum: () => loadCurriculum(),
  isCurriculumReady: () => curriculumReady,
  getLearningPath: () => [],
}))
vi.mock('./StudyTabs', () => ({
  TodayLesson: () => <p>Bài hôm nay</p>,
  SRSReview: () => null,
  HardWords: () => null,
  QuizTab: () => null,
}))
vi.mock('../lib/vocab', () => ({ getDifficultWords: () => [] }))
vi.mock('../lib/srs', () => ({ getDueWords: () => [] }))

let container: HTMLDivElement
let root: Root

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  })
}

async function render(isA = true) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<StudyPanel uid="u1" isA={isA} tab="today" />))
  await flush()
}

beforeEach(() => {
  loadCurriculum.mockReset()
  curriculumReady = false
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

describe('StudyPanel — tải từ điển', () => {
  it('lỗi → khối lỗi + Thử lại thay vì "Đang tải từ vựng…" mãi; thử lại thành công → vào bài', async () => {
    loadCurriculum.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await render()
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Không kết nối được máy chủ')
    expect(alert?.textContent).toContain('Từ bạn đã học và lịch ôn vẫn được giữ nguyên.')
    expect(container.textContent).not.toContain('Đang tải từ vựng…')

    loadCurriculum.mockImplementationOnce(async () => {
      curriculumReady = true
    })
    const retry = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Thử lại'),
    ) as HTMLButtonElement
    await act(async () => retry.click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('Bài hôm nay')
  })

  it('chiều B → khối lỗi bằng tiếng Anh', async () => {
    loadCurriculum.mockRejectedValueOnce(new Error('ECONNRESET'))
    await render(false)
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Could not load data')
    expect(alert?.textContent).toContain('Could not load the vocabulary.')
    expect(alert?.textContent).toContain('Try again')
  })

  it('từ điển đã nạp sẵn → vào bài ngay, không qua màn chờ', async () => {
    curriculumReady = true
    loadCurriculum.mockResolvedValue(undefined)
    await render()
    expect(container.textContent).toContain('Bài hôm nay')
  })
})
