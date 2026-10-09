// dialogues.loadError.test.tsx — `getDialogues()` hỏng phải hiện khối lỗi + Thử lại ở MỌI nơi gọi,
// không được mất phần hội thoại im lặng và không để unhandled rejection (changelog 0530).
// Bản cũ: `getDialogues(id).then(set)` không có nhánh lỗi ở VocabFlash và BatchDoneView (tab Hôm
// nay). Trang cấp CEFR (3 chỗ gọi) được canh ở e2e/load-error-states.spec.ts.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import type { Dialogue } from '../data/dialogues'
import type { Circle } from '../data/curriculumTypes'
import type { CefrUnit } from '../data/cefrTypes'
import { ACCENT } from '../lib/cefrAccent'
import { VocabFlash } from './CefrLessonViews'
import { BatchDoneView } from './studyTabs/TodayLesson'
import { UnitSection } from '../pages/subjects/english/CefrLevelPage'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const getDialogues = vi.fn<(id: string) => Promise<Dialogue[]>>()
vi.mock('../data/dialoguesLoader', () => ({
  getDialogues: (id: string) => getDialogues(id),
  getAllDialogues: async () => ({}),
}))
// BatchDoneView chọn vòng theo từ; giả lập để mọi từ thuộc vòng "c1".
vi.mock('../lib/curriculum', async (orig) => ({
  ...(await orig<typeof import('../lib/curriculum')>()),
  findCircleOfWord: () => ({ id: 'c1' }),
}))

const DIALOGUE: Dialogue = {
  titleVi: 'Chào hỏi',
  titleEn: 'Greetings',
  lines: [{ who: 'A', en: 'Hi', vi: 'Chào' }],
}

const CIRCLE: Circle = {
  id: 'c1',
  titleVi: 'Vòng',
  titleEn: 'Circle',
  emoji: '📘',
  words: [],
  sentences: [],
}
const UNIT: CefrUnit = {
  id: 'u1',
  titleVi: 'Phần một',
  titleEn: 'Part one',
  emoji: '📗',
  grammar: [],
  vocabCircleIds: [],
}

let container: HTMLDivElement
let root: Root
const unhandled: unknown[] = []
const onUnhandled = (e: unknown) => unhandled.push(e)

async function flush() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve()
  })
}

async function render(ui: React.ReactElement) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<MemoryRouter>{ui}</MemoryRouter>))
  await flush()
}

function retryButton(): HTMLButtonElement {
  const btn = [...container.querySelectorAll('button')].find((b) =>
    /Thử lại|Try again/.test(b.textContent ?? ''),
  )
  if (!btn) throw new Error('không thấy nút Thử lại')
  return btn
}

const vocabFlash = (isA: boolean) => (
  <VocabFlash
    circle={CIRCLE}
    isA={isA}
    uid="u"
    pool={[]}
    onProgress={() => undefined}
    onBack={() => undefined}
    onOpenDialogue={() => undefined}
  />
)
const batchDone = (isA: boolean) => (
  <BatchDoneView
    batch={[{ word: 'hello' } as never]}
    uid="u"
    isA={isA}
    dailyStart={0}
    onStartQuiz={() => undefined}
  />
)
const unitSection = (
  dialogues: Dialogue[] | undefined,
  viewed: Set<string> = new Set(),
  learnedDlg: Set<string> = new Set(),
) => (
  <UnitSection
    unit={UNIT}
    index={0}
    isA
    accent={ACCENT.cyan}
    circleById={{}}
    learned={new Set()}
    doneGrammar={new Set()}
    viewedDialogues={viewed}
    learnedDialogues={learnedDlg}
    dialogues={dialogues}
    lessonStartIndex={0}
    onOpenLesson={() => undefined}
    onOpenCircle={() => undefined}
    onOpenDialogue={() => undefined}
  />
)

beforeEach(() => {
  getDialogues.mockReset()
  unhandled.length = 0
  process.on('unhandledRejection', onUnhandled)
})
afterEach(async () => {
  process.off('unhandledRejection', onUnhandled)
  await act(async () => root.unmount())
  container.remove()
})

describe.each([
  ['VocabFlash', vocabFlash],
  ['BatchDoneView (tab Hôm nay)', batchDone],
])('%s — getDialogues hỏng', (_ten, ui) => {
  it('hiện khối lỗi + Thử lại, không unhandled rejection; thử lại thành công → hiện hội thoại', async () => {
    getDialogues.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    getDialogues.mockResolvedValue([DIALOGUE])
    await render(ui(true))
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Không kết nối được máy chủ')
    expect(alert?.textContent).toContain('Phần còn lại của bài học vẫn dùng được bình thường.')
    expect(container.textContent).not.toContain('Chào hỏi')

    await act(async () => retryButton().click())
    await flush()
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('Chào hỏi')
    expect(getDialogues).toHaveBeenCalledTimes(2)
    expect(unhandled).toEqual([])
  })

  it('chiều B: khối lỗi bằng tiếng Anh', async () => {
    getDialogues.mockRejectedValue(new TypeError('Failed to fetch'))
    await render(ui(false))
    const alert = container.querySelector('[role="alert"]')
    expect(alert?.textContent).toContain('Could not load data')
    expect(alert?.textContent).toContain('Cannot reach the server')
    expect(alert?.textContent).toContain('The rest of the lesson still works.')
    expect(alert?.textContent).not.toContain('Không')
  })

  it('tải được thì KHÔNG có khối lỗi', async () => {
    getDialogues.mockResolvedValue([DIALOGUE])
    await render(ui(true))
    expect(container.querySelector('[role="alert"]')).toBeNull()
    expect(container.textContent).toContain('Chào hỏi')
  })
})

// Trang cấp tải hội thoại MỘT lần cho mọi unit (đường lỗi + Thử lại của trang cấp được canh ở
// e2e/load-error-states.spec.ts — trang quá nặng để dựng bằng mock). Ở đây canh phần UnitSection.
describe('UnitSection — hội thoại do trang cấp truyền xuống', () => {
  it('có hội thoại → hiện bước ③; chưa có (đang tải/lỗi) → không hiện, không tự gọi getDialogues', async () => {
    await render(unitSection([DIALOGUE]))
    expect(container.textContent).toContain('Chào hỏi')
    await act(async () => root.unmount())
    container.remove()
    await render(unitSection(undefined))
    expect(container.textContent).not.toContain('Chào hỏi')
    expect(getDialogues).not.toHaveBeenCalled()
  })

  // Đặc tả docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md — nhãn CHỮ ba trạng thái.
  it('nhãn trạng thái bằng chữ: chưa xem → đã xem (vẫn hiện, chưa xong) → đã học (ẩn vào mục đã xong)', async () => {
    const key = `${UNIT.id}:${DIALOGUE.titleEn}`
    await render(unitSection([DIALOGUE]))
    expect(container.textContent).toContain('Chưa xem')
    await act(async () => root.unmount())
    container.remove()
    await render(unitSection([DIALOGUE], new Set([key])))
    expect(container.textContent).toContain('Chào hỏi')
    expect(container.textContent).toContain('Đã xem · chưa kiểm tra hiểu')
    await act(async () => root.unmount())
    container.remove()
    await render(unitSection([DIALOGUE], new Set([key]), new Set([key])))
    // Unit chỉ có hội thoại này → đã học hết → unit thu gọn "Hoàn thành".
    expect(container.textContent).toContain('Hoàn thành')
  })
})
