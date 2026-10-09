// packages/core-contracts/stemScratchpad.test.ts
import { describe, it, expect } from 'vitest'
import {
  StemSubjectTypeSchema,
  ScratchpadStepSchema,
  StemProblemStateSchema,
  StemVariableTableSchema,
  ScratchpadStepValidationSchema,
  ketQuaBuoc,
  nhanKetQuaBuoc,
  NHAC_KHI_NOP_SAI,
  StemBankQuestionPublicSchema,
  StemMicroHintSchema,
  SubmitReasonSchema,
  SubmitSolutionResultSchema,
  type ScratchpadStepValidation,
} from './stemScratchpad.js'

describe('STEM Scratchpad Contracts', () => {
  it('validates StemSubjectTypeSchema correctly', () => {
    expect(StemSubjectTypeSchema.safeParse('math').success).toBe(true)
    expect(StemSubjectTypeSchema.safeParse('physics').success).toBe(true)
    expect(StemSubjectTypeSchema.safeParse('art').success).toBe(false)
  })

  it('validates ScratchpadStepValidationSchema', () => {
    const val = {
      isValid: true,
      errorType: 'none' as const,
      feedback: 'Excellent algebraic transformation!',
      suggestedCorrection: undefined,
      confidence: 0.98,
    }
    expect(ScratchpadStepValidationSchema.safeParse(val).success).toBe(true)
  })

  it('validates ScratchpadStepSchema', () => {
    const step = {
      stepNumber: 1,
      latexInput: '2x + 5 = 15 \\implies 2x = 10',
      explanation: 'Subtract 5 from both sides',
      validation: {
        isValid: true,
        errorType: 'none' as const,
        feedback: 'Correct application of subtraction property.',
        confidence: 0.99,
      },
      createdAt: '2026-08-20T00:00:00.000Z',
    }
    expect(ScratchpadStepSchema.safeParse(step).success).toBe(true)
  })

  it('validates StemProblemStateSchema', () => {
    const state = {
      id: 'prob-1',
      personId: '11111111-1111-4111-8111-111111111111',
      subject: 'math' as const,
      title: 'Linear Equation Resolution',
      problemStatement: 'Solve for x: 2x + 5 = 15',
      problemLatex: '2x + 5 = 15',
      steps: [],
      isSolved: false,
      hintsUsed: 0,
      createdAt: '2026-08-20T00:00:00.000Z',
      updatedAt: '2026-08-20T00:00:00.000Z',
    }
    expect(StemProblemStateSchema.safeParse(state).success).toBe(true)
  })

  describe('ketQuaBuoc — kết luận hiển thị cho người học (changelog 0473)', () => {
    const goc = { errorType: 'none' as const, feedback: 'x', confidence: 0 }

    it('chưa có kết quả kiểm → unverified', () => {
      expect(ketQuaBuoc(undefined)).toBe('unverified')
    })

    it('bản lưu cũ không có status (từng bị chấm "hợp lệ" giả) → unverified', () => {
      expect(ketQuaBuoc({ ...goc, isValid: true, confidence: 0.95 })).toBe('unverified')
    })

    it('isValid false → invalid dù status ghi gì', () => {
      expect(ketQuaBuoc({ ...goc, isValid: false })).toBe('invalid')
      expect(ketQuaBuoc({ ...goc, isValid: false, status: 'valid' })).toBe('invalid')
    })

    it('status invalid → invalid kể cả khi isValid true (dữ liệu mâu thuẫn thì nghiêng về báo lỗi)', () => {
      expect(ketQuaBuoc({ ...goc, isValid: true, status: 'invalid' })).toBe('invalid')
    })

    it('chỉ status valid tường minh mới là valid', () => {
      expect(ketQuaBuoc({ ...goc, isValid: true, status: 'valid' })).toBe('valid')
      expect(ketQuaBuoc({ ...goc, isValid: true, status: 'unverified' })).toBe('unverified')
    })

    it('schema nhận status mới và vẫn nhận bản cũ không có status', () => {
      expect(
        ScratchpadStepValidationSchema.safeParse({ ...goc, isValid: true, status: 'unverified' })
          .success,
      ).toBe(true)
      expect(
        ScratchpadStepValidationSchema.safeParse({ ...goc, isValid: true, status: 'dung' }).success,
      ).toBe(false)
      expect(ScratchpadStepValidationSchema.safeParse({ ...goc, isValid: true }).success).toBe(true)
    })
  })

  it('nhanKetQuaBuoc: luôn có ký hiệu + chữ, nhãn ✗ cụ thể theo loại lỗi (changelog 0547)', () => {
    const base = { feedback: 'x', confidence: 1 } as const
    expect(nhanKetQuaBuoc(undefined)).toBe('? Chưa tự kiểm được')
    expect(nhanKetQuaBuoc({ ...base, isValid: true, status: 'valid', errorType: 'none' })).toBe(
      '✓ Hợp lệ',
    )
    expect(
      nhanKetQuaBuoc({ ...base, isValid: true, status: 'unverified', errorType: 'none' }),
    ).toBe('? Chưa tự kiểm được')
    const loi = (errorType: ScratchpadStepValidation['errorType']) =>
      nhanKetQuaBuoc({ ...base, isValid: false, status: 'invalid', errorType })
    expect(loi('changed_solutions')).toBe('✗ Đổi nghiệm')
    expect(loi('unbalanced_equation')).toBe('✗ Lệch nguyên tử')
    expect(loi('unbalanced_charge')).toBe('✗ Lệch điện tích')
    expect(loi('substance_changed')).toBe('✗ Đổi chất')
    expect(loi('division_by_zero')).toBe('✗ Chia cho 0')
    expect(loi('dimension_mismatch')).toBe('✗ Lệch thứ nguyên')
    expect(loi('logic_gap')).toBe('✗ Cần chỉnh sửa')
    // Bước cũ (trước 0473) không có status → không bao giờ thành ✓.
    expect(nhanKetQuaBuoc({ ...base, isValid: true, errorType: 'none' })).toBe(
      '? Chưa tự kiểm được',
    )
  })

  it('bảng thứ nguyên biến: tuỳ chọn (đề cũ vẫn hợp lệ), có trần số mục (changelog 0552)', () => {
    expect(StemVariableTableSchema.safeParse({ v: 'm/s', t: 's', N: '' }).success).toBe(true)
    expect(StemVariableTableSchema.safeParse({ '': 'm' }).success).toBe(false)
    const qua = Object.fromEntries(Array.from({ length: 65 }, (_, i) => [`x_${i}`, 'm']))
    expect(StemVariableTableSchema.safeParse(qua).success).toBe(false)
    const de = {
      id: 'p',
      personId: '11111111-1111-4111-8111-111111111111',
      subject: 'physics',
      title: 't',
      problemStatement: 's',
      steps: [],
      isSolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    expect(StemProblemStateSchema.safeParse(de).success).toBe(true)
    expect(StemProblemStateSchema.safeParse({ ...de, variables: { v: 'm/s' } }).success).toBe(true)
  })
})

// changelog 0551 — ngân hàng đề + gợi ý + nộp lời giải.
describe('hợp đồng ngân hàng đề / gợi ý / nộp lời giải', () => {
  const cau = {
    id: 'toan10-c1-b2-q1',
    subject: 'math',
    grade: '10',
    lessonId: 'toan10-c1-b2',
    lessonTitle: 'Tập hợp',
    topic: 'Mệnh đề',
    track: 'core',
    problemStatement: 'Đề',
    needsUnit: false,
    expectsFraction: false,
    reviewStatus: 'draft',
  }

  it('câu công khai .strict(): thêm đáp án/lời giải là bị từ chối', () => {
    expect(StemBankQuestionPublicSchema.safeParse(cau).success).toBe(true)
    expect(
      StemBankQuestionPublicSchema.safeParse({ ...cau, answer: { kind: 'numeric' } }).success,
    ).toBe(false)
    expect(StemBankQuestionPublicSchema.safeParse({ ...cau, explain: 'x' }).success).toBe(false)
  })

  it('gợi ý chỉ có ba bậc, không còn suggestedFormula', () => {
    expect(StemMicroHintSchema.safeParse({ hintText: 'Ẩn là gì?', level: 2 }).success).toBe(true)
    expect(StemMicroHintSchema.safeParse({ hintText: 'x', level: 4 }).success).toBe(false)
    expect(
      StemMicroHintSchema.safeParse({ hintText: 'x', level: 1, suggestedFormula: 'x = 5' }).success,
    ).toBe(false)
  })

  it('kết quả nộp: lời giải tuỳ chọn, mã lý do trong danh sách', () => {
    const ok = { success: true, isSolved: false, correct: false, reason: 'WRONG_VALUE' }
    expect(SubmitSolutionResultSchema.safeParse(ok).success).toBe(true)
    expect(SubmitSolutionResultSchema.safeParse({ ...ok, reason: 'LẠ' }).success).toBe(false)
  })

  it('mọi mã lý do đều có câu nhắc, câu nhắc khi SAI không chứa chữ số (không lộ đáp số)', () => {
    for (const r of SubmitReasonSchema.options) {
      expect(NHAC_KHI_NOP_SAI[r].length).toBeGreaterThan(0)
      expect(NHAC_KHI_NOP_SAI[r]).not.toMatch(/\d/)
    }
  })

  it('phiên có thể mang questionId (bản ghi cũ không có vẫn hợp lệ)', () => {
    const base = {
      id: 'p',
      personId: '11111111-1111-4111-8111-111111111111',
      subject: 'math',
      title: 't',
      problemStatement: 's',
      steps: [],
      isSolved: false,
      createdAt: '2026-10-09T00:00:00.000Z',
      updatedAt: '2026-10-09T00:00:00.000Z',
    }
    expect(StemProblemStateSchema.safeParse(base).success).toBe(true)
    expect(StemProblemStateSchema.parse({ ...base, questionId: 'q' }).questionId).toBe('q')
  })
})
