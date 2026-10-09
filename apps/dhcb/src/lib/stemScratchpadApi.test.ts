// apps/dhcb/src/lib/stemScratchpadApi.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createStemProblemFromBankApi,
  fetchStemQuestionsApi,
  getStemHintApi,
  submitStemSolutionApi,
  validateStemStepApi,
} from './stemScratchpadApi.js'

const CAU = {
  id: 'toan10-c1-b2-q1',
  subject: 'math' as const,
  grade: '10' as const,
  lessonId: 'toan10-c1-b2',
  lessonTitle: 'Tập hợp',
  topic: 'Mệnh đề và tập hợp',
  track: 'core' as const,
  problemStatement: 'Một tổ có 30 bạn…',
  needsUnit: false,
  expectsFraction: false,
  reviewStatus: 'draft' as const,
}

const PHIEN = {
  id: 'prob-1',
  personId: '11111111-1111-4111-8111-111111111111',
  subject: 'math' as const,
  title: 'Tập hợp',
  problemStatement: 'Một tổ có 30 bạn…',
  questionId: 'toan10-c1-b2-q1',
  steps: [],
  isSolved: false,
  hintsUsed: 0,
  createdAt: '2026-10-09T00:00:00.000Z',
  updatedAt: '2026-10-09T00:00:00.000Z',
}

function traVe(body: unknown, ok = true, status = 200) {
  return vi.spyOn(global, 'fetch').mockResolvedValueOnce({
    ok,
    status,
    json: async () => body,
  } as unknown as Response)
}

describe('stemScratchpadApi Client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.setItem('gsa_session_token_v1', 'fake-token-123')
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('tải ngân hàng đề theo môn và validate bằng Zod', async () => {
    const spy = traVe({ success: true, questions: [CAU], total: 1 })
    expect(await fetchStemQuestionsApi('math')).toEqual([CAU])
    expect(String(spy.mock.calls[0]?.[0])).toContain('action=get_questions&subject=math')
  })

  it('ném lỗi khi tải ngân hàng đề hỏng (mạng hoặc dữ liệu sai hợp đồng)', async () => {
    traVe({}, false, 500)
    await expect(fetchStemQuestionsApi('math')).rejects.toThrow('Lỗi tải ngân hàng đề STEM: 500')
    // Server lỡ trả kèm đáp án → hợp đồng .strict() từ chối, không âm thầm dùng.
    traVe({ questions: [{ ...CAU, answer: { kind: 'numeric', value: 8 } }], total: 1 })
    await expect(fetchStemQuestionsApi('math')).rejects.toThrow()
  })

  it('mở phiên từ questionId', async () => {
    const spy = traVe({ success: true, problem: PHIEN })
    expect((await createStemProblemFromBankApi(CAU.id)).questionId).toBe(CAU.id)
    expect(JSON.parse(String(spy.mock.calls[0]?.[1]?.body))).toEqual({ questionId: CAU.id })
    traVe({}, false, 404)
    await expect(createStemProblemFromBankApi('x')).rejects.toThrow('Lỗi tạo bài tập STEM: 404')
  })

  it('validates stem step successfully', async () => {
    const mockResult = {
      step: { stepNumber: 1, latexInput: 'x = 2' },
      validation: { isValid: true },
      isSolved: false,
      problem: { id: 'p1' },
    }
    traVe(mockResult)
    const res = await validateStemStepApi({ problemId: 'p1', latexInput: 'x = 2' })
    expect(res).toEqual(mockResult)
  })

  it('throws error when validating stem step fails', async () => {
    traVe({}, false, 400)
    await expect(validateStemStepApi({ problemId: 'p1', latexInput: 'x = 2' })).rejects.toThrow(
      'Lỗi kiểm tra bước giải: 400',
    )
  })

  it('lấy gợi ý: câu hỏi kèm bậc; dữ liệu sai hợp đồng thì ném lỗi', async () => {
    const mockHint = { hint: { hintText: 'Ẩn cần tìm là gì?', level: 1 }, hintsUsed: 1 }
    traVe(mockHint)
    expect(await getStemHintApi('p1')).toEqual(mockHint)
    traVe({ hint: { hintText: 'x', level: 4 }, hintsUsed: 1 })
    await expect(getStemHintApi('p1')).rejects.toThrow()
  })

  it('throws error when getting hint fails', async () => {
    traVe({}, false, 500)
    await expect(getStemHintApi('p1')).rejects.toThrow('Lỗi lấy gợi ý: 500')
  })

  it('nộp lời giải: trả kết quả đã validate; lỗi mạng/409 thì ném', async () => {
    const kq = { success: true, isSolved: false, correct: false, reason: 'WRONG_VALUE' }
    const spy = traVe(kq)
    expect(await submitStemSolutionApi('prob-1', '18')).toEqual(kq)
    expect(JSON.parse(String(spy.mock.calls[0]?.[1]?.body))).toEqual({
      problemId: 'prob-1',
      finalAnswer: '18',
    })
    traVe({}, false, 409)
    await expect(submitStemSolutionApi('prob-1', '8')).rejects.toThrow('Lỗi nộp lời giải: 409')
  })
})
