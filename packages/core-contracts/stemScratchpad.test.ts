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
  MAX_WRONG_SUBMITS,
  NHAC_KHI_NOP,
  NHAC_NOP_SAI_CHUNG,
  PublicSubmitReasonSchema,
  publicSubmitReason,
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

  it('kết quả nộp: lời giải tuỳ chọn; CHỈ mã công khai, mã chi tiết đơn vị bị từ chối', () => {
    const ok = { success: true, isSolved: false, correct: false, attemptsLeft: 3 }
    expect(SubmitSolutionResultSchema.safeParse(ok).success).toBe(true)
    expect(SubmitSolutionResultSchema.safeParse({ ...ok, reason: 'PARSE_ERROR' }).success).toBe(
      true,
    )
    // Rà soát bảo mật 0551: các mã lộ thông tin đáp án không còn được phép trong hợp đồng.
    for (const lo of ['MISSING_UNIT', 'WRONG_UNIT', 'WRONG_DIMENSION', 'SIGN_ERROR', 'LẠ']) {
      expect(SubmitSolutionResultSchema.safeParse({ ...ok, reason: lo }).success, lo).toBe(false)
    }
    expect(
      SubmitSolutionResultSchema.safeParse({ ...ok, attemptsLeft: MAX_WRONG_SUBMITS + 1 }).success,
    ).toBe(false)
  })

  it('publicSubmitReason: chỉ giữ CORRECT/CORRECT_LOOSE/PARSE_ERROR/EMPTY, còn lại ẩn', () => {
    for (const r of SubmitReasonSchema.options) {
      const pub = publicSubmitReason(r)
      if (PublicSubmitReasonSchema.safeParse(r).success) expect(pub).toBe(r)
      else expect(pub, r).toBeUndefined()
    }
  })

  it('câu nhắc khi nộp không chứa chữ số (không lộ đáp số)', () => {
    for (const r of PublicSubmitReasonSchema.options) {
      expect(NHAC_KHI_NOP[r].length).toBeGreaterThan(0)
      expect(NHAC_KHI_NOP[r]).not.toMatch(/\d/)
    }
    expect(NHAC_NOP_SAI_CHUNG).not.toMatch(/\d/)
  })

  it('wrongSubmits: bản ghi cũ không có trường → mặc định 0; số âm bị từ chối', () => {
    const cu = {
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
    const r = StemProblemStateSchema.safeParse(cu)
    expect(r.success && r.data.wrongSubmits).toBe(0)
    expect(StemProblemStateSchema.safeParse({ ...cu, wrongSubmits: -1 }).success).toBe(false)
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
