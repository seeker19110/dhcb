// Màn kiểm tra hiểu hội thoại — đặc tả docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md
// + đợt 0555 (server chấm lại): docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DialogueCheckOutcome } from '../lib/dialogueCheckClient'

const submitMock = vi.hoisted(() => vi.fn())
vi.mock('../lib/dialogueCheckClient', () => ({ submitDialogueCheck: submitMock }))

import DialogueComprehensionCheck from './DialogueComprehensionCheck'
import * as cefrProgress from '../lib/cefrProgress'
import { ACCENT } from '../lib/cefrAccent'
import type { Dialogue, DialogueLine } from '../data/dialogues'
import {
  buildComprehensionQuiz,
  comprehensionSeed,
  type ComprehensionDirection,
} from '../lib/dialogueComprehension'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const l = (who: 'A' | 'B', en: string, vi: string): DialogueLine => ({ who, en, vi })
const DLG: Dialogue = {
  titleVi: 'Làm quen ở lớp học',
  titleEn: 'Meeting in class',
  speakerA: { vi: 'Lan', en: 'Lan' },
  speakerB: { vi: 'Minh', en: 'Minh' },
  lines: [
    l('A', 'Hello! Are you a new student?', 'Xin chào! Bạn là học viên mới à?'),
    l('B', 'Yes, I am. My name is Minh.', 'Vâng. Tôi tên Minh.'),
    l('A', 'Nice to meet you. Where are you from?', 'Rất vui được gặp bạn. Bạn từ đâu?'),
    l('B', 'I am from Hanoi, the capital.', 'Tôi đến từ Hà Nội, thủ đô.'),
    l('A', 'Is this your first class here?', 'Đây là buổi học đầu của bạn à?'),
    l('B', 'Yes, it is my first class.', 'Vâng, đây là buổi đầu của tôi.'),
  ],
}
const OWNER = 'a1-greetings'
const accent = Object.values(ACCENT)[0]!

let container: HTMLDivElement
let root: Root

function render(props: {
  dialogue?: Dialogue
  isA?: boolean
  canSave?: boolean
  onVerified?: () => void
  onBack?: () => void
}) {
  act(() => {
    root.render(
      <DialogueComprehensionCheck
        dialogue={props.dialogue ?? DLG}
        ownerId={OWNER}
        isA={props.isA ?? true}
        accent={accent}
        canSave={props.canSave ?? true}
        onVerified={props.onVerified ?? vi.fn()}
        onBack={props.onBack ?? vi.fn()}
        initialAttempt={0}
      />,
    )
  })
}

/** Đề đúng như màn đang hiện (cùng seed: lần làm thứ `attempt`). */
const deCua = (dir: ComprehensionDirection, attempt = 0) =>
  buildComprehensionQuiz(DLG, dir, comprehensionSeed(OWNER, DLG.titleEn, dir, attempt))

function chon(questionIndex: number, optionId: string) {
  const group =
    container.querySelectorAll<HTMLFieldSetElement>('[role="radiogroup"]')[questionIndex]!
  const radio = group.querySelector<HTMLInputElement>(`input[value="${optionId}"]`)!
  act(() => radio.click())
}

const nutNop = () => container.querySelector<HTMLButtonElement>('button[type="submit"]')!
/** Nộp rồi chờ promise gửi server xong (mock resolve ngay). */
async function nop() {
  await act(async () => {
    nutNop().click()
  })
}
const nut = (text: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.includes(text))
const status = () => container.querySelector<HTMLElement>('[role="status"]')!

/** Phản hồi server "chấm thật" cho đề `dir`/`attempt` với các lựa chọn trong payload gửi lên. */
function serverGrades(dir: ComprehensionDirection, attempt = 0) {
  submitMock.mockImplementation(
    async (input: { answers: { questionId: string; optionId: string }[] }) => {
      const de = deCua(dir, attempt)
      const chosen = new Map(input.answers.map((a) => [a.questionId, a.optionId]))
      const items = de.map((q) => ({
        questionId: q.id,
        chosenId: chosen.get(q.id) ?? null,
        correctId: q.correctId,
        correct: chosen.get(q.id) === q.correctId,
      }))
      const correct = items.filter((i) => i.correct).length
      const passed = correct >= 2
      return {
        kind: 'graded',
        result: { correct, total: de.length, required: 2, passed, saved: passed, items },
      } satisfies DialogueCheckOutcome
    },
  )
}

beforeEach(() => {
  submitMock.mockReset()
  localStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('DialogueComprehensionCheck', () => {
  it('mỗi câu là một radiogroup có tên (legend), radio thật, nhóm theo câu', () => {
    render({})
    const groups = container.querySelectorAll<HTMLFieldSetElement>('[role="radiogroup"]')
    expect(groups).toHaveLength(3)
    for (const g of groups) {
      const legendId = g.getAttribute('aria-labelledby')!
      expect(container.querySelector(`#${CSS.escape(legendId)}`)?.tagName).toBe('LEGEND')
      const radios = g.querySelectorAll<HTMLInputElement>('input[type="radio"]')
      expect(radios.length).toBeGreaterThanOrEqual(2)
      expect(new Set([...radios].map((r) => r.name)).size).toBe(1)
    }
    // Đề bằng ngôn ngữ đích được gắn lang (WCAG 3.1.2).
    expect(container.querySelector('legend [lang="en"]')).not.toBeNull()
  })

  it('chưa trả lời đủ thì chưa nộp được, có lời nhắc bằng chữ', () => {
    render({})
    expect(nutNop().disabled).toBe(true)
    expect(container.textContent).toContain('Trả lời đủ 3 câu để nộp bài.')
  })

  it('đã đăng nhập: gửi LỰA CHỌN THÔ + seed lên server; server đạt → onVerified ĐÚNG MỘT LẦN', async () => {
    serverGrades('A')
    const onVerified = vi.fn()
    render({ onVerified })
    const de = deCua('A')
    de.forEach((q, i) => chon(i, q.correctId))
    expect(nutNop().disabled).toBe(false)
    await nop()
    expect(submitMock).toHaveBeenCalledTimes(1)
    expect(submitMock).toHaveBeenCalledWith({
      ownerId: OWNER,
      titleEn: DLG.titleEn,
      direction: 'A',
      attempt: 0,
      answers: de.map((q) => ({ questionId: q.id, optionId: q.correctId })),
    })
    expect(onVerified).toHaveBeenCalledTimes(1)
    expect(status().textContent).toContain('Đúng 3/3 — đạt')
    expect(status().textContent).not.toContain('chưa lưu')
    expect(status().textContent).toContain('Máy chủ đã chấm và ghi hội thoại này là ĐÃ HỌC')
    expect(document.activeElement).toBe(status())
    // Phản hồi từng câu bằng CHỮ, không chỉ màu.
    expect(container.textContent).toContain('Bạn chọn — đúng')
    // Sau khi nộp, các radio bị khoá (fieldset disabled).
    const groups = container.querySelectorAll<HTMLFieldSetElement>('[role="radiogroup"]')
    expect([...groups].every((g) => g.disabled)).toBe(true)
  })

  it('client KHÔNG tự ghi "đã học": cefrProgress không còn markDialogueLearned, màn không đụng kho', async () => {
    expect('markDialogueLearned' in cefrProgress).toBe(false)
    serverGrades('A')
    render({})
    deCua('A').forEach((q, i) => chon(i, q.correctId))
    await nop()
    // Ghi kho là việc của nơi gọi (onVerified) — màn này không tự viết localStorage.
    expect(JSON.stringify({ ...localStorage })).not.toContain('learned|')
  })

  it('server chấm chưa đạt (1/3) → KHÔNG onVerified, chỉ rõ đáp án đúng; Làm lại ra đề mới', async () => {
    serverGrades('A')
    const onVerified = vi.fn()
    render({ onVerified })
    const de = deCua('A')
    de.forEach((q, i) =>
      chon(i, i === 0 ? q.correctId : q.options.find((o) => o.id !== q.correctId)!.id),
    )
    await nop()
    expect(onVerified).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Đúng 1/3 — chưa đạt (cần 2)')
    expect(container.textContent).toContain('Đáp án đúng')
    expect(container.textContent).toContain('Bạn chọn — chưa đúng')

    act(() => nut('Làm lại')!.click())
    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(nutNop().disabled).toBe(true) // câu trả lời cũ đã xoá
    // Màn đang hiện ĐÚNG đề của lần làm thứ 2 (seed đổi theo số lần làm).
    const hien = [...container.querySelectorAll('legend [lang="en"]')].map((e) => e.textContent)
    expect(hien).toEqual(deCua('A', 1).map((q) => q.stem))
  })

  it('đánh dấu đúng/sai theo KẾT QUẢ SERVER, không theo phép chấm ở máy', async () => {
    const de = deCua('A')
    // Server (nguồn sự thật) báo câu 1 sai dù máy tưởng đúng → màn phải hiện "chưa đúng".
    submitMock.mockResolvedValue({
      kind: 'graded',
      result: {
        correct: 2,
        total: 3,
        required: 2,
        passed: true,
        saved: true,
        items: de.map((q, i) => ({
          questionId: q.id,
          chosenId: q.correctId,
          correctId: i === 0 ? q.options.find((o) => o.id !== q.correctId)!.id : q.correctId,
          correct: i !== 0,
        })),
      },
    } satisfies DialogueCheckOutcome)
    render({})
    de.forEach((q, i) => chon(i, q.correctId))
    await nop()
    expect(container.textContent).toContain('Đúng 2/3 — đạt')
    expect(container.textContent).toContain('Bạn chọn — chưa đúng')
  })

  it('mất mạng → kết quả chấm tại máy kèm "chưa lưu", KHÔNG onVerified; Gửi lại gửi đúng bài đó', async () => {
    submitMock.mockResolvedValueOnce({ kind: 'offline' } satisfies DialogueCheckOutcome)
    const onVerified = vi.fn()
    render({ onVerified })
    deCua('A').forEach((q, i) => chon(i, q.correctId))
    await nop()
    expect(status().textContent).toContain('Đúng 3/3 — đạt · chưa lưu')
    expect(status().textContent).toContain('mất kết nối')
    expect(status().textContent).not.toContain('ĐÃ HỌC')
    expect(onVerified).not.toHaveBeenCalled()

    serverGrades('A')
    await act(async () => {
      nut('Gửi lại')!.click()
    })
    expect(submitMock).toHaveBeenCalledTimes(2)
    expect(submitMock.mock.calls[1]![0]).toEqual(submitMock.mock.calls[0]![0])
    expect(onVerified).toHaveBeenCalledTimes(1)
    expect(status().textContent).toContain('ĐÃ HỌC')
  })

  it.each([
    ['rate-limited', 'nộp hơi nhanh', true],
    ['error', 'máy chủ đang gặp lỗi', true],
    ['auth', 'phiên đăng nhập đã hết', false],
    ['attempt-used', 'lượt này đã được nộp trước đó', false],
    ['outdated', 'Tải lại trang', false],
  ] as const)(
    'server trả %s → nói thật lý do chưa lưu; Gửi lại chỉ khi lỗi tạm',
    async (kind, text, resend) => {
      submitMock.mockResolvedValue({ kind } satisfies DialogueCheckOutcome)
      const onVerified = vi.fn()
      render({ onVerified })
      deCua('A').forEach((q, i) => chon(i, q.correctId))
      await nop()
      expect(status().textContent).toContain('chưa lưu')
      expect(status().textContent).toContain(text)
      expect(Boolean(nut('Gửi lại'))).toBe(resend)
      expect(onVerified).not.toHaveBeenCalled()
    },
  )

  it('đang chờ server: nút nộp khoá + "Đang gửi để chấm…", không nộp đúp được', async () => {
    let resolve: (o: DialogueCheckOutcome) => void = () => {}
    submitMock.mockReturnValue(new Promise<DialogueCheckOutcome>((r) => (resolve = r)))
    const onVerified = vi.fn()
    render({ onVerified })
    deCua('A').forEach((q, i) => chon(i, q.correctId))
    act(() => nutNop().click())
    expect(nutNop().disabled).toBe(true)
    expect(nutNop().textContent).toContain('Đang gửi để chấm…')
    act(() => nutNop().click())
    expect(submitMock).toHaveBeenCalledTimes(1)
    await act(async () => {
      resolve({
        kind: 'graded',
        result: { correct: 3, total: 3, required: 2, passed: true, saved: true, items: [] },
      })
    })
    expect(onVerified).toHaveBeenCalledTimes(1)
  })

  it('chưa đăng nhập → KHÔNG gọi server, chấm tại máy, nói thật là CHƯA lưu', async () => {
    render({ canSave: false })
    deCua('A').forEach((q, i) => chon(i, q.correctId))
    await nop()
    expect(submitMock).not.toHaveBeenCalled()
    expect(container.textContent).toContain('cần đăng nhập để lưu tiến độ')
    expect(container.textContent).toContain('· chưa lưu')
  })

  it('chiều B: câu chữ giao diện tiếng Anh, đề tiếng Việt có lang="vi", gửi direction B', async () => {
    serverGrades('B')
    render({ isA: false })
    expect(container.textContent).toContain('Comprehension check')
    expect(container.textContent).toContain('Answer all 3 questions to submit.')
    expect(container.querySelector('legend [lang="vi"]')).not.toBeNull()
    deCua('B').forEach((q, i) => chon(i, q.correctId))
    await nop()
    expect(submitMock.mock.calls[0]![0]).toMatchObject({ direction: 'B' })
    expect(status().textContent).toContain('3/3 correct — passed')
    expect(status().textContent).toContain('marked as LEARNED')
  })

  it('hội thoại quá ngắn → nói thật là chưa kiểm tra được, không có câu hỏi', () => {
    render({ dialogue: { ...DLG, lines: DLG.lines.slice(0, 2) } })
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(0)
    expect(container.textContent).toContain('Chưa kiểm tra được hội thoại này')
  })

  it('nút quay lại gọi onBack', () => {
    const onBack = vi.fn()
    render({ onBack })
    act(() => nut('Xem lại hội thoại')!.click())
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
