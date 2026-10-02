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

  it('detects sign transposition error in algebra', () => {
    const prevSteps = [
      {
        stepNumber: 1,
        latexInput: '2x + 5 = 15',
        createdAt: new Date().toISOString(),
      },
    ]

    const res = StemScratchpadService.validateStep('math', '2x = 15 + 5', prevSteps)
    expect(res.isValid).toBe(false)
    expect(res.errorType).toBe('sign_error')
    expect(res.suggestedCorrection).toBeDefined()
  })

  it('detects unbalanced chemistry reaction', () => {
    const res = StemScratchpadService.validateStep('chemistry', 'H_2 + O_2 -> H_2O')
    expect(res.isValid).toBe(false)
    expect(res.errorType).toBe('unbalanced_equation')
  })

  it('mọi nhánh bắt được lỗi đều gắn status invalid', () => {
    const prev = [{ stepNumber: 1, latexInput: '2x + 5 = 15', createdAt: new Date().toISOString() }]
    const ketQua = [
      StemScratchpadService.validateStep('math', '   '),
      StemScratchpadService.validateStep('math', '(2x + 5 = 15'),
      StemScratchpadService.validateStep('math', '2x = 15 + 5', prev),
      StemScratchpadService.validateStep('chemistry', 'H_2 + O_2 -> H_2O'),
    ]
    for (const r of ketQua) {
      expect(r.isValid).toBe(false)
      expect(r.status).toBe('invalid')
    }
  })

  // Hồi quy changelog 0473: trước đây mọi bước không khớp vài mẫu lỗi đều được chấm "Bước biến đổi
  // logic chính xác" (confidence 0,95) — kể cả bước SAI rõ ràng như dưới đây.
  it('bước không tự kiểm được thì báo unverified, KHÔNG BAO GIỜ khen là đúng', () => {
    const prev = [{ stepNumber: 1, latexInput: '2x + 5 = 15', createdAt: new Date().toISOString() }]
    const buocSai = ['2x = 15 + 7', 'x = 100', '2H_2 + O_2 -> H_2O']
    for (const input of buocSai) {
      const r = StemScratchpadService.validateStep('math', input, prev)
      expect(r.status).toBe('unverified')
      expect(r.status).not.toBe('valid')
      expect(r.confidence).toBe(0)
      expect(r.feedback).not.toMatch(/chính xác|đúng rồi|hợp lệ/i)
      expect(r.feedback).toContain('chưa tự kiểm được')
    }
  })

  it('đáp số khớp nguyên vẹn đáp số đã biết của đề mẫu → valid; gần giống thì không', () => {
    const toan = { problemLatex: '2x + 5 = 15', problemStatement: 'bất kỳ' }
    expect(StemScratchpadService.validateStep('math', 'x = 5', [], toan).status).toBe('valid')
    expect(
      StemScratchpadService.validateStep('math', '2x = 10 \\implies x=5', [], toan).status,
    ).toBe('valid')
    for (const gan of ['x = 50', '2x = 5', 'x = 5 + 1', 'y = 5']) {
      expect(StemScratchpadService.validateStep('math', gan, [], toan).status).toBe('unverified')
    }

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
