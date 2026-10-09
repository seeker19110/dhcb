// packages/core-contracts/visionSolver.test.ts
import { describe, it, expect } from 'vitest'
import {
  VisionSolveRequestSchema,
  VisionSolveResponseSchema,
  type VisionSolveResponse,
} from './visionSolver.js'

describe('VisionSolver Contracts', () => {
  it('validates a valid vision solve request', () => {
    const req = {
      imageBase64:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      subjectId: 'physics',
      gradeLevel: 'grade_12',
      userPrompt: 'Giải chi tiết câu 3',
    }
    const parsed = VisionSolveRequestSchema.parse(req)
    expect(parsed.subjectId).toBe('physics')
    expect(parsed.mimeType).toBe('image/jpeg')
  })

  it('validates a valid vision solve response', () => {
    const res: VisionSolveResponse = {
      problemText: 'Cho hàm số y = x^3 - 3x. Tìm cực trị của hàm số.',
      steps: [
        {
          title: 'Bước 1: Tính đạo hàm',
          detail: 'Lấy đạo hàm bậc nhất của hàm số:',
          formula: "y' = 3x^2 - 3",
        },
        {
          title: 'Bước 2: Tìm nghiệm đạo hàm',
          detail: "y' = 0 <=> x = ±1",
          formula: 'x = 1; x = -1',
        },
      ],
      finalAnswer: 'Cực đại tại x = -1 (y = 2), cực tiểu tại x = 1 (y = -2)',
      confidence: 0.98,
      tokenUsed: 350,
    }
    const parsed = VisionSolveResponseSchema.parse(res)
    expect(parsed.steps).toHaveLength(2)
    expect(parsed.confidence).toBe(0.98)
  })

  it('không tự điền confidence khi thiếu (không bịa số mặc định)', () => {
    const parsed = VisionSolveResponseSchema.parse({
      problemText: 'Đề',
      steps: [{ title: 'B1', detail: 'Giải' }],
      finalAnswer: 'x = 1',
    })
    expect(parsed.confidence).toBeUndefined()
  })

  it('rejects empty steps response', () => {
    const invalid = {
      problemText: 'Bài toán',
      steps: [],
      finalAnswer: '1',
    }
    expect(() => VisionSolveResponseSchema.parse(invalid)).toThrow()
  })
})
