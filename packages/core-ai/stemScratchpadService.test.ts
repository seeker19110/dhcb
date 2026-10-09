// packages/core-ai/stemScratchpadService.test.ts
import { describe, it, expect } from 'vitest'
import { StemScratchpadService } from './stemScratchpadService.js'

describe('StemScratchpadService', () => {
  it('creates a STEM problem session', () => {
    const prob = StemScratchpadService.createProblemSession({
      personId: '11111111-1111-4111-8111-111111111111',
      subject: 'math',
      title: 'Linear equation',
      problemStatement: 'Solve 2x + 5 = 15',
      problemLatex: '2x + 5 = 15',
    })

    expect(prob.id).toBeDefined()
    expect(prob.subject).toBe('math')
    expect(prob.steps).toEqual([])
  })

  it('validates step and detects unbalanced parentheses', () => {
    const res = StemScratchpadService.validateStep('math', '(2x + 5 = 15')
    expect(res.isValid).toBe(false)
    expect(res.errorType).toBe('arithmetic_error')
  })

  it('bắt lỗi chuyển vế sai dấu bằng so tập nghiệm (không còn gán cứng chuỗi)', () => {
    const prevSteps = [
      {
        stepNumber: 1,
        latexInput: '2x + 5 = 15',
        createdAt: new Date().toISOString(),
      },
    ]

    const res = StemScratchpadService.validateStep('math', '2x = 15 + 5', prevSteps)
    expect(res.isValid).toBe(false)
    expect(res.status).toBe('invalid')
    expect(res.errorType).toBe('changed_solutions')
    expect(res.suggestedCorrection).toBeDefined()
    // Gợi ý Socratic: KHÔNG lộ bước đúng hay nghiệm (bản gán cứng cũ đưa luôn "2x = 10").
    expect(res.suggestedCorrection).not.toMatch(/10|x\s*=\s*5/)
    expect(res.feedback).not.toMatch(/10|x\s*=\s*5/)
  })

  it('detects unbalanced chemistry reaction', () => {
    const res = StemScratchpadService.validateStep('chemistry', 'H_2 + O_2 -> H_2O')
    expect(res.isValid).toBe(false)
    expect(res.errorType).toBe('unbalanced_equation')
    expect(res.feedback).toContain('O (vế trái 2, vế phải 1)')
  })

  it('mọi nhánh bắt được lỗi đều gắn status invalid', () => {
    const prev = [{ stepNumber: 1, latexInput: '2x + 5 = 15', createdAt: new Date().toISOString() }]
    const ketQua = [
      StemScratchpadService.validateStep('math', '   '),
      StemScratchpadService.validateStep('math', '(2x + 5 = 15'),
      StemScratchpadService.validateStep('math', '2x = 15 + 5', prev),
      StemScratchpadService.validateStep('math', 'x = 10/0', prev),
      StemScratchpadService.validateStep('chemistry', 'H_2 + O_2 -> H_2O'),
      StemScratchpadService.validateStep('chemistry', 'Fe^{3+} + 2e^- -> Fe^{2+}'),
      StemScratchpadService.validateStep('chemistry', 'H_2 + O_2 -> H_2O_2', [], {
        problemLatex: 'H_2 + O_2 \\rightarrow H_2O',
      }),
    ]
    for (const r of ketQua) {
      expect(r.isValid).toBe(false)
      expect(r.status).toBe('invalid')
    }
    expect(ketQua.map((r) => r.errorType)).toEqual([
      'logic_gap',
      'arithmetic_error',
      'changed_solutions',
      'division_by_zero',
      'unbalanced_equation',
      'unbalanced_charge',
      'substance_changed',
    ])
  })

  // Hồi quy changelog 0473: trước đây mọi bước không khớp vài mẫu lỗi đều được chấm "Bước biến đổi
  // logic chính xác" (confidence 0,95). Từ 0547 bước SAI đọc được thì bị ✗; bước KHÔNG đọc được
  // thì vẫn phải nói thật "chưa tự kiểm được" — không bao giờ khen.
  it('bước sai rõ ràng không bao giờ valid; bước ngoài phạm vi báo unverified', () => {
    const prev = [{ stepNumber: 1, latexInput: '2x + 5 = 15', createdAt: new Date().toISOString() }]
    for (const input of ['2x = 15 + 7', 'x = 100', 'x = 50', '2x = 5']) {
      const r = StemScratchpadService.validateStep('math', input, prev)
      expect(r.status).toBe('invalid')
      expect(r.errorType).toBe('changed_solutions')
    }
    for (const input of ['\\sqrt{x} = 5', 'x \\neq 5', '2H_2 + O_2 -> H_2O', 'x + y = 5']) {
      const r = StemScratchpadService.validateStep('math', input, prev)
      expect(r.status).toBe('unverified')
      expect(r.confidence).toBe(0)
      expect(r.feedback).not.toMatch(/chính xác|đúng rồi|hợp lệ/i)
      expect(r.feedback).toContain('chưa tự kiểm được')
      expect(r.feedback).toContain('MỘT ẩn')
    }
    const ly = StemScratchpadService.validateStep('physics', 'v = 2 \\cdot 5', [], {
      problemLatex: 'v = a \\cdot t',
      problemStatement: 'bất kỳ',
    })
    expect(ly.status).toBe('unverified')
    expect(ly.feedback).toContain('Vật lí')
  })

  it('bước giữa tương đương → valid nhưng CHƯA phải đáp số; dạng x = … mới là đáp số', () => {
    const toan = { problemLatex: '2x + 5 = 15', problemStatement: 'bất kỳ' }
    const giua = StemScratchpadService.validateStep('math', '2x = 10', [], toan)
    expect(giua.status).toBe('valid')
    expect(giua.isFinalAnswer).toBe(false)
    const cuoi = StemScratchpadService.validateStep('math', 'x = 5', [], toan)
    expect(cuoi.status).toBe('valid')
    expect(cuoi.isFinalAnswer).toBe(true)

    const hoa = { problemLatex: 'H_2 + O_2 \\rightarrow H_2O' }
    const chuaToiGian = StemScratchpadService.validateStep(
      'chemistry',
      '4H_2 + 2O_2 -> 4H_2O',
      [],
      hoa,
    )
    expect(chuaToiGian.status).toBe('valid')
    expect(chuaToiGian.isFinalAnswer).toBe(false)
    expect(chuaToiGian.feedback).toContain('tối giản')
    const xong = StemScratchpadService.validateStep('chemistry', '2H_2 + O_2 -> 2H_2O', [], hoa)
    expect(xong.isFinalAnswer).toBe(true)
  })

  it('gợi ý Socratic theo đúng loại đổi nghiệm (mất / thêm), không lộ nghiệm', () => {
    const mat = StemScratchpadService.validateStep('math', 'x = 1', [], { problemLatex: 'x^2 = x' })
    expect(mat.feedback).toContain('MẤT nghiệm')
    expect(mat.suggestedCorrection).toContain('chia hai vế cho một biểu thức chứa ẩn')
    expect(mat.suggestedCorrection).not.toMatch(/x\s*=\s*0/)

    const them = StemScratchpadService.validateStep('math', 'x^2 = 9', [], {
      problemLatex: 'x = 3',
    })
    expect(them.feedback).toContain('THÊM nghiệm lạ')
    expect(them.suggestedCorrection).toContain('bình phương hai vế')

    const ion = StemScratchpadService.validateStep('chemistry', 'Fe^{3+} + 2e^- -> Fe^{2+}')
    expect(ion.feedback).toContain('vế trái +1, vế phải +2')
  })

  it('lỗi mang từ bước trước được chỉ ra', () => {
    const toan = { problemLatex: '2x + 5 = 15' }
    const prev = [{ stepNumber: 1, latexInput: '2x = 20', createdAt: new Date().toISOString() }]
    const r = StemScratchpadService.validateStep('math', 'x = 10', prev, toan)
    expect(r.status).toBe('invalid')
    expect(r.feedback).toContain('bước TRƯỚC')
  })

  it('đề có phương trình: x = 5 là đáp số; gần giống thì không bao giờ valid', () => {
    const toan = { problemLatex: '2x + 5 = 15', problemStatement: 'bất kỳ' }
    expect(StemScratchpadService.validateStep('math', 'x = 5', [], toan).status).toBe('valid')
    expect(
      StemScratchpadService.validateStep('math', '2x = 10 \\implies x=5', [], toan).status,
    ).toBe('valid')
    for (const gan of ['x = 50', '2x = 5', 'x = 5 + 1']) {
      expect(StemScratchpadService.validateStep('math', gan, [], toan).status).toBe('invalid')
    }
    expect(StemScratchpadService.validateStep('math', 'y = 5', [], toan).status).toBe('unverified')
    // Vật lí: đề mẫu viết cứng (v = a·t) đã gỡ ở changelog 0551 — bước Lí luôn "chưa tự kiểm được".
    const ly = StemScratchpadService.validateStep('physics', 'v = 10 m/s', [], {
      problemLatex: 'v = a \\cdot t',
    })
    expect(ly.status).toBe('unverified')
  })

  // changelog 0551: đề NGÂN HÀNG là lời văn (không có problemLatex) → bước 1 là mốc. Không được
  // nói "khớp đề bài", và không bao giờ là đáp số cuối (bước 1 có thể đã sai so với đề).
  it('đề lời văn: bước 1 là MỐC, các bước sau so với bước 1, không bao giờ isFinalAnswer', () => {
    const dau = StemScratchpadService.validateStep('math', '2x + 5 = 15', [])
    expect(dau.status).toBe('unverified')
    expect(dau.feedback).toContain('MỐC')
    expect(dau.feedback).not.toContain('chưa đọc căn')

    const prev = [{ stepNumber: 1, latexInput: '2x + 5 = 15', createdAt: new Date().toISOString() }]
    const cuoi = StemScratchpadService.validateStep('math', 'x = 5', prev)
    expect(cuoi.status).toBe('valid')
    expect(cuoi.isFinalAnswer).toBe(false)
    expect(cuoi.feedback).toContain('bước 1 của em')
    expect(cuoi.feedback).not.toContain('đề bài')

    const sai = StemScratchpadService.validateStep('math', 'x = 50', prev)
    expect(sai.status).toBe('invalid')
    expect(sai.feedback).toContain('bước 1 của em')

    // Bước 1 không đọc được (căn) → vẫn câu "chưa tự kiểm được" theo phạm vi.
    expect(StemScratchpadService.validateStep('math', '\\sqrt{x} = 5', []).feedback).toContain(
      'MỘT ẩn',
    )
  })

  it('generateMicroHint trả CÂU HỎI kèm bậc, không còn suggestedFormula lộ lời giải', () => {
    const prob = StemScratchpadService.createProblemSession({
      personId: '11111111-1111-4111-8111-111111111111',
      subject: 'math',
      title: 'Linear equation',
      problemStatement: 'Solve 2x + 5 = 15',
      problemLatex: '2x + 5 = 15',
    })

    const initialHint = StemScratchpadService.generateMicroHint(prob)
    expect(initialHint.level).toBe(1)
    expect(initialHint.hintText).toContain('?')

    prob.steps.push({
      stepNumber: 1,
      latexInput: '2x = 10',
      createdAt: new Date().toISOString(),
    })

    const nextHint = StemScratchpadService.generateMicroHint(prob)
    expect(nextHint).not.toHaveProperty('suggestedFormula')
    expect(nextHint.hintText).not.toMatch(/x\s*=\s*5|\\frac|chia cho 2/)
    expect(nextHint.level).toBe(2)
  })

  it('createProblemSession gắn questionId khi mở từ ngân hàng đề', () => {
    const prob = StemScratchpadService.createProblemSession({
      personId: '11111111-1111-4111-8111-111111111111',
      subject: 'physics',
      title: 'Bài',
      problemStatement: 'Đề',
      questionId: 'ly10-c2-b5-q1',
    })
    expect(prob.questionId).toBe('ly10-c2-b5-q1')
    const khong = StemScratchpadService.createProblemSession({
      personId: '11111111-1111-4111-8111-111111111111',
      subject: 'math',
      title: 'Bài',
      problemStatement: 'Đề',
    })
    expect(khong).not.toHaveProperty('questionId')
  })
})
