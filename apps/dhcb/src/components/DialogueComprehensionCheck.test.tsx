// Màn kiểm tra hiểu hội thoại — đặc tả docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DialogueComprehensionCheck from './DialogueComprehensionCheck'
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
  onPassed?: () => void
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
        onPassed={props.onPassed ?? vi.fn()}
        onBack={props.onBack ?? vi.fn()}
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
const nop = () => act(() => nutNop().click())

beforeEach(() => {
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

  it('đúng hết → đạt, gọi onPassed ĐÚNG MỘT LẦN, kết quả bằng chữ + focus vào khối kết quả', () => {
    const onPassed = vi.fn()
    render({ onPassed })
    deCua('A').forEach((q, i) => chon(i, q.correctId))
    expect(nutNop().disabled).toBe(false)
    nop()
    expect(onPassed).toHaveBeenCalledTimes(1)
    const status = container.querySelector<HTMLElement>('[role="status"]')!
    expect(status.textContent).toContain('Đúng 3/3 — đạt')
    expect(status.textContent).toContain('đã được ghi là ĐÃ HỌC')
    expect(document.activeElement).toBe(status)
    // Phản hồi từng câu bằng CHỮ, không chỉ màu.
    expect(container.textContent).toContain('Bạn chọn — đúng')
    // Sau khi nộp, các radio bị khoá (fieldset disabled).
    const groups = container.querySelectorAll<HTMLFieldSetElement>('[role="radiogroup"]')
    expect([...groups].every((g) => g.disabled)).toBe(true)
  })

  it('đúng 1/3 → chưa đạt, KHÔNG gọi onPassed, chỉ rõ đáp án đúng; Làm lại ra đề mới', () => {
    const onPassed = vi.fn()
    render({ onPassed })
    const de = deCua('A')
    de.forEach((q, i) =>
      chon(i, i === 0 ? q.correctId : q.options.find((o) => o.id !== q.correctId)!.id),
    )
    nop()
    expect(onPassed).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Đúng 1/3 — chưa đạt (cần 2)')
    expect(container.textContent).toContain('Đáp án đúng')
    expect(container.textContent).toContain('Bạn chọn — chưa đúng')

    const lamLai = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Làm lại'),
    )!
    act(() => lamLai.click())
    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(nutNop().disabled).toBe(true) // câu trả lời cũ đã xoá
    // Màn đang hiện ĐÚNG đề của lần làm thứ 2 (seed đổi theo số lần làm).
    const hien = [...container.querySelectorAll('legend [lang="en"]')].map((e) => e.textContent)
    expect(hien).toEqual(deCua('A', 1).map((q) => q.stem))
  })

  it('đạt nhưng chưa đăng nhập → nói thật là CHƯA lưu', () => {
    render({ canSave: false })
    deCua('A').forEach((q, i) => chon(i, q.correctId))
    nop()
    expect(container.textContent).toContain('cần đăng nhập để lưu tiến độ')
  })

  it('chiều B: câu chữ giao diện tiếng Anh, đề tiếng Việt có lang="vi"', () => {
    render({ isA: false })
    expect(container.textContent).toContain('Comprehension check')
    expect(container.textContent).toContain('Answer all 3 questions to submit.')
    expect(container.querySelector('legend [lang="vi"]')).not.toBeNull()
    deCua('B').forEach((q, i) => chon(i, q.correctId))
    nop()
    expect(container.querySelector('[role="status"]')!.textContent).toContain(
      '3/3 correct — passed',
    )
  })

  it('hội thoại quá ngắn → nói thật là chưa kiểm tra được, không có câu hỏi', () => {
    render({ dialogue: { ...DLG, lines: DLG.lines.slice(0, 2) } })
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(0)
    expect(container.textContent).toContain('Chưa kiểm tra được hội thoại này')
  })

  it('nút quay lại gọi onBack', () => {
    const onBack = vi.fn()
    render({ onBack })
    const back = [...container.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Xem lại hội thoại'),
    )!
    act(() => back.click())
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
