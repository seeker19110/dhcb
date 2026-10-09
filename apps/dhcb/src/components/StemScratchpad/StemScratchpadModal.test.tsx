// StemScratchpadModal.test.tsx — bảng nháp STEM trên DOM thật (changelog 0551): đề lấy từ ngân hàng
// đề, nút "Nộp lời giải" gọi submit_solution với đủ trạng thái tải/lỗi/thành công, gợi ý hiện bậc,
// lỗi mạng hiện ra cho người học (trước đây chỉ console.error).
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  StemBankQuestionPublic,
  StemProblemState,
  SubmitSolutionResult,
} from '@dhcb/core-contracts/stemScratchpad'
import StemScratchpadModal from './StemScratchpadModal'
import * as api from '../../lib/stemScratchpadApi.js'

vi.mock('../../lib/stemScratchpadApi.js', async () => ({
  // Lớp lỗi THẬT (giao diện dùng `instanceof` để biết câu nào hiện được cho người học).
  StemApiError: (
    await vi.importActual<typeof import('../../lib/stemScratchpadApi.js')>(
      '../../lib/stemScratchpadApi.js',
    )
  ).StemApiError,
  fetchStemQuestionsApi: vi.fn(),
  createStemProblemFromBankApi: vi.fn(),
  validateStemStepApi: vi.fn(),
  getStemHintApi: vi.fn(),
  submitStemSolutionApi: vi.fn(),
}))

const cau = (id: string, problemStatement: string, extra: Partial<StemBankQuestionPublic> = {}) =>
  ({
    id,
    subject: 'math',
    grade: '10',
    lessonId: 'toan10-c1-b2',
    lessonTitle: 'Tập hợp',
    topic: 'Mệnh đề và tập hợp',
    track: 'core',
    problemStatement,
    needsUnit: false,
    expectsFraction: false,
    reviewStatus: 'draft',
    ...extra,
  }) satisfies StemBankQuestionPublic

const phien = (questionId: string, extra: Partial<StemProblemState> = {}): StemProblemState => ({
  id: `prob-${questionId}`,
  personId: '11111111-1111-4111-8111-111111111111',
  subject: 'math',
  title: 'Tập hợp',
  problemStatement: 'Đề',
  questionId,
  steps: [],
  isSolved: false,
  hintsUsed: 0,
  wrongSubmits: 0,
  createdAt: '2026-10-09T00:00:00.000Z',
  updatedAt: '2026-10-09T00:00:00.000Z',
  ...extra,
})

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  vi.mocked(api.fetchStemQuestionsApi).mockResolvedValue([
    cau('q1', 'Một tổ có 30 bạn: hỏi có bao nhiêu bạn biết cả hai?'),
    cau('q2', 'Tính khoảng cách từ A tới đường thẳng.', { expectsFraction: true }),
  ])
  vi.mocked(api.createStemProblemFromBankApi).mockImplementation(async (id) => phien(id))
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.clearAllMocks()
})

const chu = () => document.body.textContent ?? ''
const nut = (ten: RegExp) => {
  const b = [...document.body.querySelectorAll('button')].find((x) => ten.test(x.textContent ?? ''))
  if (!b) throw new Error(`không thấy nút ${ten}`)
  return b
}
const oNhap = (nhan: string) => {
  const label = [...document.body.querySelectorAll('label')].find((l) => l.textContent === nhan)
  const id = label?.getAttribute('for')
  const el = id ? document.getElementById(id) : null
  if (!(el instanceof HTMLInputElement)) throw new Error(`không thấy ô ${nhan}`)
  return el
}
async function go(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  await act(async () => {
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function bam(el: HTMLElement) {
  await act(async () => {
    el.click()
  })
}
async function mo() {
  await act(async () => {
    root.render(<StemScratchpadModal onClose={() => {}} />)
  })
}

describe('StemScratchpadModal', () => {
  it('đề lấy từ ngân hàng thật, nói rõ bản nháp; "Đề khác" mở phiên câu kế', async () => {
    await mo()
    expect(api.fetchStemQuestionsApi).toHaveBeenCalledWith('math')
    expect(api.createStemProblemFromBankApi).toHaveBeenCalledWith('q1')
    expect(chu()).toContain('Một tổ có 30 bạn')
    expect(chu()).toContain('câu 1/2')
    expect(chu()).toContain('Bản nháp')
    expect(chu()).not.toContain('2x + 5 = 15')
    await bam(nut(/Đề khác/))
    expect(api.createStemProblemFromBankApi).toHaveBeenLastCalledWith('q2')
    expect(chu()).toContain('câu 2/2')
    expect(chu()).toContain('dạng phân số a/b')
  })

  it('tải ngân hàng lỗi → báo lỗi + Thử lại; môn chưa có câu → nói rõ', async () => {
    vi.mocked(api.fetchStemQuestionsApi).mockRejectedValueOnce(new Error('mạng'))
    await mo()
    expect(document.body.querySelector('[role="alert"]')?.textContent).toContain(
      'Không tải được ngân hàng đề',
    )
    await bam(nut(/Thử lại/))
    expect(chu()).toContain('Một tổ có 30 bạn')

    vi.mocked(api.fetchStemQuestionsApi).mockResolvedValueOnce([])
    await bam(nut(/Hóa học/))
    expect(api.fetchStemQuestionsApi).toHaveBeenLastCalledWith('chemistry')
    expect(chu()).toContain('chưa có câu nào')
  })

  it('nộp lời giải: đang chấm → sai (không lộ đáp số) → đúng (hiện lời giải, khoá ô nhập)', async () => {
    await mo()
    let traKetQua: (v: SubmitSolutionResult) => void = () => {}
    vi.mocked(api.submitStemSolutionApi).mockImplementationOnce(
      () => new Promise((r) => (traKetQua = r)),
    )
    await go(oNhap('Đáp số cuối'), '18')
    await bam(nut(/Nộp lời giải/))
    expect(chu()).toContain('Đang chấm…')
    expect(api.submitStemSolutionApi).toHaveBeenCalledWith('prob-q1', '18')
    await act(async () =>
      traKetQua({ success: true, isSolved: false, correct: false, attemptsLeft: 4 }),
    )
    expect(chu()).toContain('✗ Chưa đúng')
    expect(chu()).toContain('Còn 4 lần nộp cho đề này.')
    expect(chu()).not.toContain('ĐÃ GIẢI XONG')

    vi.mocked(api.submitStemSolutionApi).mockResolvedValueOnce({
      success: true,
      isSolved: true,
      correct: true,
      reason: 'CORRECT',
      attemptsLeft: 4,
      explanation: 'Dùng công thức n(A ∪ B).',
    })
    await go(oNhap('Đáp số cuối'), '8')
    await bam(nut(/Nộp lời giải/))
    expect(chu()).toContain('✓ Đúng đáp số.')
    expect(chu()).toContain('Lời giải của bài học: Dùng công thức n(A ∪ B).')
    expect(chu()).toContain('ĐÃ GIẢI XONG')
    expect(oNhap('Đáp số cuối').disabled).toBe(true)
    expect(nut(/Gợi ý/).disabled).toBe(true)
  })

  it('nộp sai hết lượt → khoá ô nộp; 409 từ server → hiện đúng câu của server', async () => {
    await mo()
    vi.mocked(api.submitStemSolutionApi).mockResolvedValueOnce({
      success: true,
      isSolved: false,
      correct: false,
      attemptsLeft: 0,
    })
    await go(oNhap('Đáp số cuối'), '9')
    await bam(nut(/Nộp lời giải/))
    expect(chu()).toContain('Đã hết lượt nộp cho đề này')
    expect(oNhap('Đáp số cuối').disabled).toBe(true)

    // Mở đề khác → phiên mới, ô nộp mở lại; server trả 409 → câu của server, không phải "kết nối".
    await bam(nut(/Đề khác/))
    vi.mocked(api.submitStemSolutionApi).mockRejectedValueOnce(
      new api.StemApiError(
        409,
        'Em đã nộp sai quá 5 lần cho đề này — xem lại các bước rồi mở đề khác nhé.',
        {
          forLearner: true,
        },
      ),
    )
    await go(oNhap('Đáp số cuối'), '9')
    await bam(nut(/Nộp lời giải/))
    expect(chu()).toContain('Em đã nộp sai quá 5 lần')
    expect(chu()).not.toContain('kiểm tra kết nối')
  })

  it('nộp lỗi mạng → báo lỗi, không đánh dấu xong', async () => {
    await mo()
    vi.mocked(api.submitStemSolutionApi).mockRejectedValueOnce(new Error('409'))
    await go(oNhap('Đáp số cuối'), '8')
    await bam(nut(/Nộp lời giải/))
    expect(chu()).toContain('Chưa nộp được')
    expect(chu()).not.toContain('ĐÃ GIẢI XONG')
  })

  it('gợi ý hiện bậc + câu hỏi; lỗi gợi ý / lỗi kiểm bước hiện ra cho người học', async () => {
    await mo()
    vi.mocked(api.getStemHintApi).mockResolvedValueOnce({
      hint: { hintText: 'Đề hỏi đại lượng nào?', level: 1 },
      hintsUsed: 1,
    })
    await bam(nut(/Gợi ý/))
    expect(chu()).toContain('Gợi ý bậc 1/3 (câu hỏi dẫn dắt): Đề hỏi đại lượng nào?')
    expect(chu()).not.toContain('AI Tutor')

    vi.mocked(api.getStemHintApi).mockRejectedValueOnce(new Error('500'))
    await bam(nut(/Gợi ý/))
    expect(chu()).toContain('Không lấy được gợi ý')

    vi.mocked(api.validateStemStepApi).mockRejectedValueOnce(new Error('500'))
    await go(oNhap('Bước giải tiếp theo'), 'x = 20 + 15')
    await bam(nut(/^Kiểm tra$/))
    expect(chu()).toContain('Không kiểm được bước này')
  })

  it('kiểm bước thành công: hiện bước + nhãn, xoá gợi ý cũ', async () => {
    await mo()
    vi.mocked(api.getStemHintApi).mockResolvedValueOnce({
      hint: { hintText: 'Đề hỏi đại lượng nào?', level: 1 },
      hintsUsed: 1,
    })
    await bam(nut(/Gợi ý/))
    vi.mocked(api.validateStemStepApi).mockResolvedValueOnce({
      step: { stepNumber: 1, latexInput: 'x = 8', createdAt: '2026-10-09T00:00:00.000Z' },
      validation: {
        isValid: true,
        status: 'unverified',
        errorType: 'none',
        feedback: 'Đề này không cho sẵn phương trình, nên bước 1 là MỐC.',
        confidence: 0,
      },
      isSolved: false,
      problem: phien('q1', {
        steps: [
          {
            stepNumber: 1,
            latexInput: 'x = 8',
            createdAt: '2026-10-09T00:00:00.000Z',
            validation: {
              isValid: true,
              status: 'unverified',
              errorType: 'none',
              feedback: 'Đề này không cho sẵn phương trình, nên bước 1 là MỐC.',
              confidence: 0,
            },
          },
        ],
      }),
    })
    await go(oNhap('Bước giải tiếp theo'), 'x = 8')
    await bam(nut(/^Kiểm tra$/))
    expect(chu()).toContain('? Chưa tự kiểm được')
    expect(chu()).not.toContain('Gợi ý bậc 1/3')
    expect(oNhap('Bước giải tiếp theo').value).toBe('')
  })
})
