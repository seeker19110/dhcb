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

  it('đáp số khớp đáp số đã biết của đề mẫu → valid; gần giống thì không bao giờ valid', () => {
    const toan = { problemLatex: '2x + 5 = 15', problemStatement: 'bất kỳ' }
    expect(StemScratchpadService.validateStep('math', 'x = 5', [], toan).status).toBe('valid')
    expect(
      StemScratchpadService.validateStep('math', '2x = 10 \\implies x=5', [], toan).status,
    ).toBe('valid')
    for (const gan of ['x = 50', '2x = 5', 'x = 5 + 1']) {
      expect(StemScratchpadService.validateStep('math', gan, [], toan).status).toBe('invalid')
    }
    expect(StemScratchpadService.validateStep('math', 'y = 5', [], toan).status).toBe('unverified')

    const hoa = { problemLatex: 'H_2 + O_2 \\rightarrow H_2O' }
    expect(StemScratchpadService.khopDapSo('chemistry', hoa, '2H_2 + O_2 -> 2H_2O')).toBe(true)
    expect(StemScratchpadService.khopDapSo('chemistry', hoa, '2H_2 + O_2 → 2H_2O')).toBe(true)
    // Chưa cân bằng (4 H bên phải, 2 H bên trái) — trước đây vẫn được tính "giải xong".
    expect(StemScratchpadService.khopDapSo('chemistry', hoa, 'H_2 + O_2 -> 2H_2O')).toBe(false)

    // Đề vật lý: công thức v = a·t không tự quyết định đáp số → phải khớp cả lời đề.
    const ly = {
      problemLatex: 'v = a \\cdot t',
      problemStatement: 'Tính vận tốc sau 5s khi gia tốc a = 2m/s² từ trạng thái nghỉ:',
    }
    expect(StemScratchpadService.khopDapSo('physics', ly, 'v = 10 m/s')).toBe(true)
    const lyDung = StemScratchpadService.validateStep('physics', 'v = 10 m/s', [], ly)
    expect(lyDung.status).toBe('valid')
    expect(lyDung.isFinalAnswer).toBe(true)
    expect(
      StemScratchpadService.khopDapSo(
        'physics',
        { ...ly, problemStatement: 'a = 3, t = 4' },
        'v = 10',
      ),
    ).toBe(false)

    // Sai môn hoặc đề lạ → không có đáp số để so → không bao giờ valid.
    expect(StemScratchpadService.khopDapSo('physics', toan, 'x = 5')).toBe(false)
    expect(StemScratchpadService.khopDapSo('math', { problemLatex: '3x = 30' }, 'x = 5')).toBe(
      false,
    )
  })

  it('generates micro hints for problem resolution', () => {
    const prob = StemScratchpadService.createProblemSession({
      personId: '11111111-1111-4111-8111-111111111111',
      subject: 'math',
      title: 'Linear equation',
      problemStatement: 'Solve 2x + 5 = 15',
      problemLatex: '2x + 5 = 15',
    })

    const initialHint = StemScratchpadService.generateMicroHint(prob)
    expect(initialHint.hintText).toBeDefined()

    prob.steps.push({
      stepNumber: 1,
      latexInput: '2x = 10',
      createdAt: new Date().toISOString(),
    })

    const nextHint = StemScratchpadService.generateMicroHint(prob)
    expect(nextHint.suggestedFormula).toContain('x =')
  })
})
