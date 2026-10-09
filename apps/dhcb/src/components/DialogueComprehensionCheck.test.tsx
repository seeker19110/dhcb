// Màn kiểm tra hiểu hội thoại — đặc tả docs/specs/2026-10-09-hoi-thoai-cefr-bang-chung-da-hoc.md
// + đợt 0555 (server chấm lại) + đợt 0558 (server cấp lượt, không trả đáp án câu sai):
// docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md §④.5
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DialogueCheckOutcome, DialogueStartOutcome } from '../lib/dialogueCheckClient'

const startMock = vi.hoisted(() => vi.fn())
const submitMock = vi.hoisted(() => vi.fn())
vi.mock('../lib/dialogueCheckClient', () => ({
  startDialogueCheck: startMock,
  submitDialogueCheck: submitMock,
}))

import DialogueComprehensionCheck from './DialogueComprehensionCheck'
import * as cefrProgress from '../lib/cefrProgress'
import { ACCENT } from '../lib/cefrAccent'
import { buttonClass } from '@core/buttonStyles'
import type { Dialogue, DialogueLine } from '../data/dialogues'
import {
  buildComprehensionQuiz,
  comprehensionSeed,
  toPublicComprehensionQuestion,
  type ComprehensionDirection,
  type ComprehensionQuestion,
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

/** Render rồi chờ lượt mở (mock resolve ngay) để màn tới trạng thái sẵn sàng. */
async function render(props: {
  dialogue?: Dialogue
  isA?: boolean
  canSave?: boolean
  onVerified?: () => void
  onBack?: () => void
}) {
  await act(async () => {
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

/** Đề đầy đủ (có đáp án) của lượt thứ `n` — "server giả" của test dùng seed này. */
const deCua = (dir: ComprehensionDirection, n = 0) =>
  buildComprehensionQuiz(DLG, dir, comprehensionSeed(OWNER, DLG.titleEn, dir, n))

/** Server giả: mỗi lần mở lượt cấp token mới `tok-<n>` với đề của lượt n (đề KHÔNG có đáp án). */
const issued = new Map<string, ComprehensionQuestion[]>()
function serverStarts(dir: ComprehensionDirection) {
  let n = 0
  startMock.mockImplementation(async () => {
    const full = deCua(dir, n)
    const token = `tok-${n}`
    n += 1
    issued.set(token, full)
    return {
      kind: 'started',
      result: {
        token,
        expiresAt: Date.now() + 60_000,
        questions: full.map(toPublicComprehensionQuestion),
      },
    } satisfies DialogueStartOutcome
  })
}

/** Server giả chấm theo đề của token; KHÔNG trả correctId, explanation chỉ cho câu đúng. */
function serverGrades() {
  submitMock.mockImplementation(
    async (input: { token: string; answers: { questionId: string; optionId: string }[] }) => {
      const de = issued.get(input.token)
      if (!de) return { kind: 'attempt-expired' } satisfies DialogueCheckOutcome
      const chosen = new Map(input.answers.map((a) => [a.questionId, a.optionId]))
      const items = de.map((q) => {
        const correct = chosen.get(q.id) === q.correctId
        return {
          questionId: q.id,
          chosenId: chosen.get(q.id) ?? null,
          correct,
          ...(correct ? { explanation: q.explanation } : {}),
        }
      })
      const correct = items.filter((i) => i.correct).length
      const passed = correct >= 2
      return {
        kind: 'graded',
        result: { correct, total: de.length, required: 2, passed, saved: passed, items },
      } satisfies DialogueCheckOutcome
    },
  )
}

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
const stems = () =>
  [...container.querySelectorAll('legend [lang="en"], legend [lang="vi"]')].map(
    (e) => e.textContent,
  )

beforeEach(() => {
  startMock.mockReset()
  submitMock.mockReset()
  issued.clear()
  localStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('DialogueComprehensionCheck — đã đăng nhập (đề từ server)', () => {
  it('mở màn → gọi mở lượt ĐÚNG MỘT LẦN với owner/title/chiều; đề hiện là đề server trả, mỗi câu một radiogroup có legend', async () => {
    serverStarts('A')
    await render({})
    expect(startMock).toHaveBeenCalledTimes(1)
    expect(startMock).toHaveBeenCalledWith({ ownerId: OWNER, titleEn: DLG.titleEn, direction: 'A' })
    const groups = container.querySelectorAll<HTMLFieldSetElement>('[role="radiogroup"]')
    expect(groups).toHaveLength(3)
    for (const g of groups) {
      const legendId = g.getAttribute('aria-labelledby')!
      expect(container.querySelector(`#${CSS.escape(legendId)}`)?.tagName).toBe('LEGEND')
      const radios = g.querySelectorAll<HTMLInputElement>('input[type="radio"]')
      expect(radios.length).toBeGreaterThanOrEqual(2)
      expect(new Set([...radios].map((r) => r.name)).size).toBe(1)
    }
    expect(stems()).toEqual(deCua('A', 0).map((q) => q.stem))
    // Đề bằng ngôn ngữ đích được gắn lang (WCAG 3.1.2).
    expect(container.querySelector('legend [lang="en"]')).not.toBeNull()
  })

  it('đang mở lượt: hiện "Đang lấy câu hỏi…" (role=status, aria-busy), chưa có câu hỏi', async () => {
    let resolve: (o: DialogueStartOutcome) => void = () => {}
    startMock.mockReturnValue(new Promise<DialogueStartOutcome>((r) => (resolve = r)))
    await render({})
    expect(container.textContent).toContain('Đang lấy câu hỏi…')
    expect(container.querySelector('[role="status"]')?.getAttribute('aria-busy')).toBe('true')
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(0)
    serverStarts('A')
    const full = deCua('A', 0)
    await act(async () => {
      resolve({
        kind: 'started',
        result: {
          token: 'tok-x',
          expiresAt: Date.now() + 60_000,
          questions: full.map(toPublicComprehensionQuestion),
        },
      })
    })
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(3)
  })

  it('chưa trả lời đủ thì chưa nộp được, có lời nhắc bằng chữ', async () => {
    serverStarts('A')
    await render({})
    expect(nutNop().disabled).toBe(true)
    expect(container.textContent).toContain('Trả lời đủ 3 câu để nộp bài.')
  })

  it('gửi TOKEN + lựa chọn thô (không gửi seed/attempt); server đạt → onVerified ĐÚNG MỘT LẦN, "ĐÃ HỌC"', async () => {
    serverStarts('A')
    serverGrades()
    const onVerified = vi.fn()
    await render({ onVerified })
    const de = deCua('A', 0)
    de.forEach((q, i) => chon(i, q.correctId))
    expect(nutNop().disabled).toBe(false)
    await nop()
    expect(submitMock).toHaveBeenCalledTimes(1)
    expect(submitMock).toHaveBeenCalledWith({
      token: 'tok-0',
      answers: de.map((q) => ({ questionId: q.id, optionId: q.correctId })),
    })
    expect(onVerified).toHaveBeenCalledTimes(1)
    expect(status().textContent).toContain('Đúng 3/3 — đạt')
    expect(status().textContent).not.toContain('chưa lưu')
    expect(status().textContent).toContain('Máy chủ đã chấm và ghi hội thoại này là ĐÃ HỌC')
    expect(document.activeElement).toBe(status())
    // Phản hồi từng câu bằng CHỮ, không chỉ màu; câu đúng có lời giải.
    expect(container.textContent).toContain('Bạn chọn — đúng')
    expect(container.textContent).toContain('Nghĩa đúng:')
    // Sau khi nộp, các radio bị khoá (fieldset disabled).
    const groups = container.querySelectorAll<HTMLFieldSetElement>('[role="radiogroup"]')
    expect([...groups].every((g) => g.disabled)).toBe(true)
  })

  it('client KHÔNG tự ghi "đã học": cefrProgress không còn markDialogueLearned, màn không đụng kho', async () => {
    expect('markDialogueLearned' in cefrProgress).toBe(false)
    serverStarts('A')
    serverGrades()
    await render({})
    deCua('A', 0).forEach((q, i) => chon(i, q.correctId))
    await nop()
    expect(JSON.stringify({ ...localStorage })).not.toContain('learned|')
  })

  it('server chấm chưa đạt (1/3) → KHÔNG onVerified; câu SAI KHÔNG hiện "Đáp án đúng", chỉ đường về hội thoại; Làm lại → mở lượt mới, đề mới', async () => {
    serverStarts('A')
    serverGrades()
    const onVerified = vi.fn()
    await render({ onVerified })
    const de = deCua('A', 0)
    de.forEach((q, i) =>
      chon(i, i === 0 ? q.correctId : q.options.find((o) => o.id !== q.correctId)!.id),
    )
    await nop()
    expect(onVerified).not.toHaveBeenCalled()
    expect(container.textContent).toContain('Đúng 1/3 — chưa đạt (cần 2)')
    expect(container.textContent).toContain('Bạn chọn — chưa đúng')
    expect(container.textContent).not.toContain('Đáp án đúng')
    expect(container.textContent).toContain('Xem lại đoạn này trong hội thoại rồi làm lại.')
    // Lời giải của câu sai KHÔNG lọt ra giao diện (đáp án đúng là chính bản dịch/câu tiếp theo).
    for (const q of de.slice(1)) {
      const dapAn = q.options.find((o) => o.id === q.correctId)!.text
      const marks = [...container.querySelectorAll('label')].filter(
        (lb) => lb.textContent?.includes(dapAn) && lb.textContent?.includes('Đáp án đúng'),
      )
      expect(marks).toHaveLength(0)
    }

    await act(async () => {
      nut('Làm lại')!.click()
    })
    expect(startMock).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[role="status"]')).toBeNull()
    expect(nutNop().disabled).toBe(true) // câu trả lời cũ đã xoá
    // Màn đang hiện ĐÚNG đề của lượt mở thứ 2 (token mới).
    expect(stems()).toEqual(deCua('A', 1).map((q) => q.stem))
  })

  it('đánh dấu đúng/sai theo KẾT QUẢ SERVER; câu đúng lấy đáp án = lựa chọn, câu sai không có đáp án', async () => {
    serverStarts('A')
    const de = deCua('A', 0)
    // Server (nguồn sự thật) báo câu 1 sai dù máy "tưởng" đúng → màn phải hiện "chưa đúng".
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
          correct: i !== 0,
          ...(i !== 0 ? { explanation: q.explanation } : {}),
        })),
      },
    } satisfies DialogueCheckOutcome)
    await render({})
    de.forEach((q, i) => chon(i, q.correctId))
    await nop()
    expect(container.textContent).toContain('Đúng 2/3 — đạt')
    expect(container.textContent).toContain('Bạn chọn — chưa đúng')
    expect(container.querySelectorAll('label.border-emerald-500\\/60')).toHaveLength(2)
    expect(container.querySelectorAll('label.border-red-500\\/60')).toHaveLength(1)
  })

  it('mất mạng lúc nộp → "Chưa chấm được lượt này" (không có điểm), KHÔNG onVerified; Gửi lại gửi lại ĐÚNG token + lựa chọn', async () => {
    serverStarts('A')
    submitMock.mockResolvedValueOnce({ kind: 'offline' } satisfies DialogueCheckOutcome)
    const onVerified = vi.fn()
    await render({ onVerified })
    deCua('A', 0).forEach((q, i) => chon(i, q.correctId))
    await nop()
    expect(status().textContent).toContain('Chưa chấm được lượt này')
    expect(status().textContent).toContain('mất kết nối')
    expect(status().textContent).not.toMatch(/Đúng \d\/\d/)
    expect(status().textContent).not.toContain('ĐÃ HỌC')
    expect(onVerified).not.toHaveBeenCalled()
    // Lựa chọn còn nguyên, radio khoá trong lúc chờ gửi lại? Không — chưa chấm nên vẫn mở để sửa.
    expect(
      container.querySelectorAll<HTMLInputElement>('input[type="radio"]:checked'),
    ).toHaveLength(3)

    serverGrades()
    await act(async () => {
      nut('Gửi lại')!.click()
    })
    expect(submitMock).toHaveBeenCalledTimes(2)
    expect(submitMock.mock.calls[1]![0]).toEqual(submitMock.mock.calls[0]![0])
    expect(onVerified).toHaveBeenCalledTimes(1)
    expect(status().textContent).toContain('ĐÃ HỌC')
  })

  it('409 ATTEMPT_USED kèm saved=true (phản hồi lần trước rơi) → phản chiếu "ĐÃ HỌC", onVerified MỘT lần, không Gửi lại', async () => {
    serverStarts('A')
    submitMock.mockResolvedValue({
      kind: 'attempt-used',
      saved: true,
    } satisfies DialogueCheckOutcome)
    const onVerified = vi.fn()
    await render({ onVerified })
    deCua('A', 0).forEach((q, i) => chon(i, q.correctId))
    await nop()
    expect(onVerified).toHaveBeenCalledTimes(1)
    expect(status().textContent).toContain('Đã học — ghi từ lượt trước')
    expect(status().textContent).toContain('ĐÃ HỌC')
    expect(nut('Gửi lại')).toBeUndefined()
  })

  it.each([
    [{ kind: 'rate-limited' }, 'nộp hơi nhanh', true],
    [{ kind: 'error' }, 'máy chủ đang gặp lỗi', true],
    [{ kind: 'unavailable' }, 'máy chủ tạm bận', true],
    [{ kind: 'auth' }, 'phiên đăng nhập đã hết', false],
    [{ kind: 'attempt-used', saved: false }, 'lượt này đã được nộp trước đó', false],
    [{ kind: 'attempt-expired' }, 'lượt này đã hết hạn', false],
    [{ kind: 'outdated' }, 'Tải lại trang', false],
  ] as const satisfies readonly (readonly [DialogueCheckOutcome, string, boolean])[])(
    'nộp mà server trả %o → nói thật lý do chưa chấm; Gửi lại chỉ khi lỗi tạm',
    async (outcome, text, resend) => {
      serverStarts('A')
      submitMock.mockResolvedValue(outcome)
      const onVerified = vi.fn()
      await render({ onVerified })
      deCua('A', 0).forEach((q, i) => chon(i, q.correctId))
      await nop()
      expect(status().textContent).toContain('Chưa chấm')
      expect(status().textContent).toContain(text)
      expect(Boolean(nut('Gửi lại'))).toBe(resend)
      expect(Boolean(nut('Làm lại'))).toBe(true)
      expect(onVerified).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['offline', 'Mất kết nối', true],
    ['rate-limited', 'mở bài hơi nhanh', true],
    ['unavailable', 'Máy chủ tạm bận', true],
    ['error', 'Máy chủ đang gặp lỗi', true],
    ['auth', 'Phiên đăng nhập đã hết', false],
  ] as const)(
    'mở lượt thất bại (%s) → "Chưa lấy được câu hỏi" + lý do; Thử lại gọi mở lượt lần nữa (trừ hết phiên)',
    async (kind, text, canRetry) => {
      startMock.mockResolvedValueOnce({ kind } satisfies DialogueStartOutcome)
      await render({})
      expect(container.textContent).toContain('Chưa lấy được câu hỏi')
      expect(container.textContent).toContain(text)
      expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(0)
      expect(Boolean(nut('Thử lại'))).toBe(canRetry)
      expect(Boolean(nut('Xem lại hội thoại'))).toBe(true)
      if (!canRetry) return
      serverStarts('A')
      await act(async () => {
        nut('Thử lại')!.click()
      })
      expect(startMock).toHaveBeenCalledTimes(2)
      expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(3)
    },
  )

  it('server báo hội thoại quá ngắn (no-quiz) → nói thật là chưa kiểm tra được', async () => {
    startMock.mockResolvedValue({ kind: 'no-quiz' } satisfies DialogueStartOutcome)
    await render({})
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(0)
    expect(container.textContent).toContain('Chưa kiểm tra được hội thoại này')
  })

  it('đang chờ server chấm: nút nộp khoá + "Đang gửi để chấm…", không nộp đúp được', async () => {
    serverStarts('A')
    let resolve: (o: DialogueCheckOutcome) => void = () => {}
    submitMock.mockReturnValue(new Promise<DialogueCheckOutcome>((r) => (resolve = r)))
    const onVerified = vi.fn()
    await render({ onVerified })
    deCua('A', 0).forEach((q, i) => chon(i, q.correctId))
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

  it('chiều B: câu chữ giao diện tiếng Anh, đề tiếng Việt có lang="vi", mở lượt với direction B', async () => {
    serverStarts('B')
    serverGrades()
    await render({ isA: false })
    expect(startMock.mock.calls[0]![0]).toMatchObject({ direction: 'B' })
    expect(container.textContent).toContain('Comprehension check')
    expect(container.textContent).toContain('Answer all 3 questions to submit.')
    expect(container.querySelector('legend [lang="vi"]')).not.toBeNull()
    deCua('B', 0).forEach((q, i) => chon(i, q.correctId))
    await nop()
    expect(status().textContent).toContain('3/3 correct — passed')
    expect(status().textContent).toContain('marked as LEARNED')
  })

  it('nút quay lại gọi onBack', async () => {
    serverStarts('A')
    const onBack = vi.fn()
    await render({ onBack })
    act(() => nut('Xem lại hội thoại')!.click())
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})

// Đợt 0559 — trần lượt nộp sai theo (người, hội thoại): đặc tả 0558 §⑥.
describe('DialogueComprehensionCheck — trần lượt nộp sai', () => {
  /** Server giả chấm chưa đạt (0/3) kèm số lượt còn lại. */
  function serverFails(attemptsLeft: number) {
    submitMock.mockImplementation(async (input: { token: string }) => {
      const de = issued.get(input.token)!
      return {
        kind: 'graded',
        result: {
          correct: 0,
          total: de.length,
          required: 2,
          passed: false,
          saved: false,
          items: de.map((q) => ({ questionId: q.id, chosenId: 'o0', correct: false })),
          attemptsLeft,
        },
      } satisfies DialogueCheckOutcome
    })
  }
  const lamBai = async () => {
    deCua('A', 0).forEach((q, i) => chon(i, q.options[0]!.id))
    await nop()
  }

  it('mở lượt bị chặn (409 ATTEMPT_CAP) → nói rõ hết lượt hôm nay; KHÔNG có đề, KHÔNG Thử lại/Làm lại; chỉ Xem lại hội thoại', async () => {
    startMock.mockResolvedValue({ kind: 'attempt-cap' } satisfies DialogueStartOutcome)
    const onBack = vi.fn()
    await render({ onBack })
    expect(container.textContent).toContain('Hôm nay đã hết lượt thử hội thoại này')
    expect(status().textContent).toContain('thử sai 5 lần hôm nay')
    expect(status().textContent).toContain('mai làm tiếp')
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(0)
    expect(nut('Thử lại')).toBeUndefined()
    expect(nut('Làm lại')).toBeUndefined()
    const back = [...status().querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Xem lại hội thoại'),
    )!
    act(() => back.click())
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(startMock).toHaveBeenCalledTimes(1)
  })

  it('chưa đạt, còn lượt → "Còn N lượt thử hôm nay" + vẫn có Làm lại', async () => {
    serverStarts('A')
    serverFails(3)
    await render({})
    await lamBai()
    expect(status().textContent).toContain('Đúng 0/3 — chưa đạt')
    expect(status().textContent).toContain('Còn 3 lượt thử hôm nay.')
    expect(nut('Làm lại')).toBeTruthy()
  })

  it('chưa đạt ở lượt CUỐI (attemptsLeft=0) → lời nhắn hết lượt, KHÔNG Làm lại, Xem lại hội thoại là nút chính', async () => {
    serverStarts('A')
    serverFails(0)
    await render({})
    await lamBai()
    expect(status().textContent).toContain('thử sai 5 lần hôm nay')
    expect(nut('Làm lại')).toBeUndefined()
    const back = [...status().querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Xem lại hội thoại'),
    )!
    expect(back.className).toBe(buttonClass({ variant: 'primary' }))
  })

  it('nộp bị chặn (409 ATTEMPT_CAP) → "Chưa chấm" + hết lượt; KHÔNG Gửi lại, KHÔNG Làm lại, KHÔNG onVerified', async () => {
    serverStarts('A')
    submitMock.mockResolvedValue({ kind: 'attempt-cap' } satisfies DialogueCheckOutcome)
    const onVerified = vi.fn()
    await render({ onVerified })
    await lamBai()
    expect(status().textContent).toContain('Chưa chấm')
    expect(status().textContent).toContain('mai làm tiếp')
    expect(status().textContent).not.toMatch(/Đúng \d\/\d/)
    expect(nut('Gửi lại')).toBeUndefined()
    expect(nut('Làm lại')).toBeUndefined()
    expect(onVerified).not.toHaveBeenCalled()
  })

  it('chiều B: câu chữ tiếng Anh, số ít "1 try left today"', async () => {
    serverStarts('B')
    serverFails(1)
    await render({ isA: false })
    deCua('B', 0).forEach((q, i) => chon(i, q.options[0]!.id))
    await nop()
    expect(status().textContent).toContain('1 try left today.')
  })
})

describe('DialogueComprehensionCheck — khách (chưa đăng nhập, đề tại máy)', () => {
  it('KHÔNG gọi server (không mở lượt, không nộp), chấm tại máy, nói thật là CHƯA lưu, có lời giải', async () => {
    await render({ canSave: false })
    expect(startMock).not.toHaveBeenCalled()
    expect(stems()).toEqual(deCua('A', 0).map((q) => q.stem))
    deCua('A', 0).forEach((q, i) => chon(i, q.correctId))
    await nop()
    expect(submitMock).not.toHaveBeenCalled()
    expect(container.textContent).toContain('cần đăng nhập để lưu tiến độ')
    expect(container.textContent).toContain('· chưa lưu')
    expect(container.textContent).toContain('Nghĩa đúng:')
  })

  it('khách làm sai → chỉ rõ đáp án đúng (chấm tại máy, có gì để chống đâu); Làm lại ra đề mới tại máy', async () => {
    await render({ canSave: false })
    const de = deCua('A', 0)
    de.forEach((q, i) =>
      chon(i, i === 0 ? q.correctId : q.options.find((o) => o.id !== q.correctId)!.id),
    )
    await nop()
    expect(container.textContent).toContain('Đúng 1/3 — chưa đạt (cần 2) · chưa lưu')
    expect(container.textContent).toContain('Đáp án đúng')
    act(() => nut('Làm lại')!.click())
    expect(startMock).not.toHaveBeenCalled()
    expect(stems()).toEqual(deCua('A', 1).map((q) => q.stem))
  })

  it('hội thoại quá ngắn → nói thật là chưa kiểm tra được, không có câu hỏi', async () => {
    await render({ canSave: false, dialogue: { ...DLG, lines: DLG.lines.slice(0, 2) } })
    expect(container.querySelectorAll('[role="radiogroup"]')).toHaveLength(0)
    expect(container.textContent).toContain('Chưa kiểm tra được hội thoại này')
  })
})
