import { describe, it, expect } from 'vitest'
import {
  INTERACTIVE_QUESTION_FENCE,
  InteractiveQuestionSetSchema,
  extractInteractiveQuestions,
} from './interactiveQuestion.js'

function fenced(json: string): string {
  return '```' + INTERACTIVE_QUESTION_FENCE + '\n' + json + '\n```'
}

const VALID_SET = {
  schemaVersion: 1,
  questions: [
    {
      id: 'linh_vuc',
      text: 'Bạn muốn khám phá lĩnh vực nào nhất?',
      multi: true,
      options: [
        { id: 'ngon_ngu', label: 'Học một ngôn ngữ mới' },
        { id: 'cong_nghe', label: 'Công nghệ, lập trình' },
      ],
      allowFreeText: true,
    },
  ],
}

describe('InteractiveQuestionSetSchema', () => {
  it('chấp nhận bộ câu hỏi hợp lệ', () => {
    expect(InteractiveQuestionSetSchema.safeParse(VALID_SET).success).toBe(true)
  })

  it('từ chối câu hỏi chỉ có 1 lựa chọn (không có gì để chọn)', () => {
    const oneOption = structuredClone(VALID_SET)
    oneOption.questions[0]!.options = [{ id: 'a', label: 'A' }]
    expect(InteractiveQuestionSetSchema.safeParse(oneOption).success).toBe(false)
  })

  it('từ chối quá 8 lựa chọn và quá 5 câu hỏi', () => {
    const manyOptions = structuredClone(VALID_SET)
    manyOptions.questions[0]!.options = Array.from({ length: 9 }, (_, i) => ({
      id: `o${i}`,
      label: `Lựa chọn ${i}`,
    }))
    expect(InteractiveQuestionSetSchema.safeParse(manyOptions).success).toBe(false)

    const manyQuestions = structuredClone(VALID_SET)
    manyQuestions.questions = Array.from({ length: 6 }, (_, i) => ({
      ...structuredClone(VALID_SET.questions[0]!),
      id: `q${i}`,
    }))
    expect(InteractiveQuestionSetSchema.safeParse(manyQuestions).success).toBe(false)
  })

  it('từ chối trường lạ (strict) và schemaVersion sai', () => {
    expect(InteractiveQuestionSetSchema.safeParse({ ...VALID_SET, extra: 'x' }).success).toBe(false)
    expect(InteractiveQuestionSetSchema.safeParse({ ...VALID_SET, schemaVersion: 2 }).success).toBe(
      false,
    )
  })
})

describe('extractInteractiveQuestions', () => {
  it('tách được khối câu hỏi và gỡ nó khỏi lời văn', () => {
    const reply = 'Mình tò mò muốn hỏi bạn:\n\n' + fenced(JSON.stringify(VALID_SET))
    const result = extractInteractiveQuestions(reply)

    expect(result.questions).toHaveLength(1)
    expect(result.questions[0]?.options).toHaveLength(2)
    expect(result.text).toBe('Mình tò mò muốn hỏi bạn:')
    expect(result.text).not.toContain(INTERACTIVE_QUESTION_FENCE)
  })

  it('trả nguyên văn khi không có khối nào', () => {
    const reply = 'Chào bạn! Hôm nay bạn muốn học gì?'
    expect(extractInteractiveQuestions(reply)).toEqual({ text: reply, questions: [] })
  })

  it('bỏ qua khối ```json thường (không phải khối câu hỏi)', () => {
    const reply = 'Ví dụ dữ liệu:\n```json\n{"schemaVersion":1,"questions":[]}\n```'
    const result = extractInteractiveQuestions(reply)
    expect(result.questions).toEqual([])
    expect(result.text).toBe(reply)
  })

  it('JSON hỏng cú pháp → vẫn gỡ khối, không ném lỗi, không có câu hỏi', () => {
    const reply = 'Câu hỏi cho bạn:\n' + fenced('{"schemaVersion":1, "questions": [')
    const result = extractInteractiveQuestions(reply)
    expect(result.questions).toEqual([])
    expect(result.text).toBe('Câu hỏi cho bạn:')
  })

  it('JSON đúng cú pháp nhưng sai schema → gỡ khối, không có câu hỏi', () => {
    const reply = 'Hỏi nhé:\n' + fenced(JSON.stringify({ schemaVersion: 1, questions: 'nhiều' }))
    const result = extractInteractiveQuestions(reply)
    expect(result.questions).toEqual([])
    expect(result.text).toBe('Hỏi nhé:')
  })

  it('id câu hỏi trùng nhau → bỏ cả bộ (tránh React dựng nhầm phần tử)', () => {
    const dup = structuredClone(VALID_SET)
    dup.questions = [dup.questions[0]!, structuredClone(dup.questions[0]!)]
    const result = extractInteractiveQuestions('Hỏi:\n' + fenced(JSON.stringify(dup)))
    expect(result.questions).toEqual([])
  })

  it('id lựa chọn trùng nhau trong cùng câu → bỏ cả bộ', () => {
    const dup = structuredClone(VALID_SET)
    dup.questions[0]!.options = [
      { id: 'a', label: 'Lựa chọn 1' },
      { id: 'a', label: 'Lựa chọn 2' },
    ]
    const result = extractInteractiveQuestions('Hỏi:\n' + fenced(JSON.stringify(dup)))
    expect(result.questions).toEqual([])
  })

  it('khối bị cắt cụt giữa chừng (LLM hết token, chưa có dấu ``` đóng) → giấu khỏi lời văn', () => {
    const reply =
      'Chào bạn! Mình muốn hỏi thêm:\n\n---\n\n' +
      '```' +
      INTERACTIVE_QUESTION_FENCE +
      '\n{"schemaVersion":1,"questions":[{"id":"linh_vuc","text":"Bạn muốn khám phá lĩnh vực nào ' +
      'nhất?","multi":true,"options":[{"id":"a","label":"A"'
    const result = extractInteractiveQuestions(reply)
    expect(result.questions).toEqual([])
    expect(result.text).toBe('Chào bạn! Mình muốn hỏi thêm:\n\n---')
    expect(result.text).not.toContain(INTERACTIVE_QUESTION_FENCE)
    expect(result.text).not.toContain('schemaVersion')
  })

  it('chỉ lấy khối ĐẦU TIÊN khi LLM lỡ xuất hai khối', () => {
    const second = structuredClone(VALID_SET)
    second.questions[0]!.id = 'khac'
    const reply = fenced(JSON.stringify(VALID_SET)) + '\n' + fenced(JSON.stringify(second))
    const result = extractInteractiveQuestions(reply)
    expect(result.questions).toHaveLength(1)
    expect(result.questions[0]?.id).toBe('linh_vuc')
    expect(result.text).toBe('')
  })

  it('khối reserved đứng cuối: không để phần sau header lọt ra lời văn', () => {
    const reply = 'Lời mở đầu.\n' + fenced(JSON.stringify(VALID_SET)) + '\n{"private":1}'
    expect(extractInteractiveQuestions(reply).text).toBe('Lời mở đầu.')
  })

  it('ID trong bộ câu hỏi có cấu trúc được giữ nguyên', () => {
    const set = structuredClone(VALID_SET)
    set.questions[0]!.id = '11111111-1111-4111-8111-111111111111'
    set.questions[0]!.options[0]!.id = '22222222-2222-4222-8222-222222222222'
    const result = extractInteractiveQuestions(fenced(JSON.stringify(set)))
    expect(result.questions[0]?.id).toBe(set.questions[0]!.id)
    expect(result.questions[0]?.options[0]?.id).toBe(set.questions[0]!.options[0]!.id)
  })
})
