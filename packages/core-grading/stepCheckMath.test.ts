// Ca biên của bộ kiểm bước giải phương trình một ẩn (đặc tả docs/specs/2026-10-09-kiem-buoc-giai-stem.md §8).
// Luật bất biến: chỉ `equivalent` khi CHỨNG MINH được; không đọc được thì `unsupported`, không đoán.
import { describe, it, expect } from 'vitest'
import { checkMathStep } from './stepCheckMath.js'

const verdict = (step: string, anchor: string, previous?: string) =>
  checkMathStep(step, anchor, previous).verdict

describe('checkMathStep — biến đổi tương đương (✓)', () => {
  it.each([
    ['2x = 10', '2x + 5 = 15'],
    ['2x = 15 - 5', '2x + 5 = 15'],
    ['2 \\cdot x = 10', '2x + 5 = 15'],
    ['2 \\times x = 10', '2x + 5 = 15'],
    ['10 = 2x', '2x + 5 = 15'], // đổi chỗ hai vế
    ['x = \\frac{10}{2}', '2x + 5 = 15'],
    ['x = \\dfrac{10}{2}', '2x + 5 = 15'],
    ['x = 10/2 = 5', '2x = 10'], // chuỗi bằng nhau
    ['(x-2)(x+2) = 0', 'x^2 - 4 = 0'], // khác dạng nhưng cùng nghiệm
    ['x^{2} = 4', 'x^2 - 4 = 0'],
    ['x² = 4', 'x^2 - 4 = 0'],
    ['x = 0,5', '2x = 1'], // dấu phẩy thập phân kiểu Việt
    ['x = 2', '(x-2)^2 = 0'], // nghiệm kép
    ['x = 0', 'x(x^2+1) = 0'], // x²+1 không có nghiệm thực → chia được, vẫn tương đương
    ['x = 3', '\\frac{x}{x} = 1 + x - 3 \\cdot 1 + 0'],
    ['2(x+1) = 2x + 2', '2x + 2 = 2(x+1)'], // hằng đẳng thức ⇔ hằng đẳng thức
    ['\\left(x+1\\right) = 4', 'x + 1 = 4'],
    ['2x\\;=\\;10', '2x + 5 = 15'], // khoảng trắng LaTeX `\;` không bị hiểu là "hoặc"
    ['x = 2 \\cdot 10^{3}', 'x = 2000'],
  ])('%s  (đề: %s)', (step, anchor) => {
    expect(verdict(step, anchor)).toBe('equivalent')
  })

  it('nhận "hoặc", dấu ;, \\lor và ± cho tập nhiều nghiệm', () => {
    for (const s of [
      'x = 2 hoặc x = -2',
      'x = 2; x = -2',
      'x = 2 \\lor x = -2',
      'x = 2 \\text{ hoặc } x = -2',
      'x = \\pm 2',
      'x = ±2',
    ]) {
      expect(verdict(s, 'x^2 = 4')).toBe('equivalent')
    }
  })

  it('đánh dấu dạng đáp số cuối, bước giữa thì chưa', () => {
    expect(checkMathStep('x = 5', '2x + 5 = 15')).toEqual({
      verdict: 'equivalent',
      isFinalAnswer: true,
    })
    expect(checkMathStep('5 = x', '2x + 5 = 15')).toEqual({
      verdict: 'equivalent',
      isFinalAnswer: true,
    })
    expect(checkMathStep('2x = 10', '2x + 5 = 15')).toEqual({
      verdict: 'equivalent',
      isFinalAnswer: false,
    })
    expect(checkMathStep('2x = 10 \\implies x = 5', '2x + 5 = 15')).toEqual({
      verdict: 'equivalent',
      isFinalAnswer: true,
    })
    // Đề vốn đã là "x = 5": chép lại đề không phải là giải.
    expect(checkMathStep('x = 5', 'x = 5')).toEqual({ verdict: 'equivalent', isFinalAnswer: false })
  })
})

describe('checkMathStep — đổi nghiệm (✗)', () => {
  it('sai dấu khi chuyển vế: mất nghiệm đề + có nghiệm lạ', () => {
    expect(checkMathStep('2x = 15 + 5', '2x + 5 = 15')).toEqual({
      verdict: 'changed',
      lost: true,
      extra: true,
      sameAsPrevious: false,
    })
    // Ca hồi quy trong skill: KHÔNG BAO GIỜ được ra equivalent.
    expect(verdict('2x = 15 + 7', '2x + 5 = 15')).toBe('changed')
    expect(verdict('x = 50', '2x + 5 = 15')).toBe('changed')
    expect(verdict('x = -5', '2x + 5 = 15')).toBe('changed')
  })

  it('chia hai vế cho biểu thức chứa ẩn → mất nghiệm', () => {
    expect(checkMathStep('x = 1', 'x^2 = x')).toMatchObject({
      verdict: 'changed',
      lost: true,
      extra: false,
    })
  })

  it('chỉ lấy một nghiệm của x² = 4 → mất nghiệm', () => {
    expect(checkMathStep('x = 2', 'x^2 = 4')).toMatchObject({ lost: true, extra: false })
  })

  it('rút gọn phân thức bỏ điều kiện xác định → sinh nghiệm lạ', () => {
    // (x²−1)/(x−1) = 2 vô nghiệm (x = 1 bị loại), nhưng x + 1 = 2 có nghiệm x = 1.
    expect(checkMathStep('x + 1 = 2', '\\frac{x^2-1}{x-1} = 2')).toMatchObject({
      verdict: 'changed',
      lost: false,
      extra: true,
    })
  })

  it('bình phương hai vế → nghiệm lạ', () => {
    expect(checkMathStep('x^2 = 9', 'x = 3')).toMatchObject({ lost: false, extra: true })
  })

  it('hằng đẳng thức ↔ phương trình hữu hạn nghiệm là khác nhau', () => {
    expect(checkMathStep('x = 3', '2(x+1) = 2x + 2')).toMatchObject({ lost: true })
  })

  it('một đoạn sai trong chuỗi ⇒ vẫn là ✗', () => {
    expect(verdict('2x = 10 \\implies x = 4', '2x + 5 = 15')).toBe('changed')
  })

  it('nói rõ lỗi đến từ bước trước khi bước này khớp bước trước', () => {
    expect(checkMathStep('x = 10', '2x + 5 = 15', '2x = 20')).toMatchObject({
      verdict: 'changed',
      sameAsPrevious: true,
    })
    expect(checkMathStep('x = 10', '2x + 5 = 15', '2x = 10')).toMatchObject({
      verdict: 'changed',
      sameAsPrevious: false,
    })
  })
})

describe('checkMathStep — chia cho 0', () => {
  it('mẫu số bằng 0 hằng → division_by_zero', () => {
    expect(verdict('2x/0 = 10', '2x = 10')).toBe('division_by_zero')
    expect(verdict('x = 10/(5-5)', '2x = 10')).toBe('division_by_zero')
    expect(verdict('x = 0^{-1}', '2x = 10')).toBe('division_by_zero')
  })
})

describe('checkMathStep — ngoài phạm vi ⇒ unsupported (KHÔNG đoán)', () => {
  it.each([
    ['\\sqrt{x} = 2', 'x = 4', 'unknown_notation'],
    ['\\sin x = 0', 'x = 0', 'unknown_notation'],
    ['x = \\pi', 'x = 3', 'unknown_notation'],
    ['x = π', 'x = 3', 'unknown_notation'],
    ['x \\neq 5', '2x + 5 = 15', 'unknown_notation'],
    ['x < 5', '2x + 5 = 15', 'not_equation'],
    ['15 - 5', '2x + 5 = 15', 'not_equation'],
    ['x + y = 5', '2x + 5 = 15', 'multi_variable'],
    ['y = 5', '2x + 5 = 15', 'multi_variable'],
    ['xy = 5', 'xy = 5', 'multi_variable'],
    ['x^{1/2} = 2', 'x = 4', 'non_polynomial'],
    ['x^{100} = 1', 'x = 1', 'too_complex'],
    ['x = \\frac{1}{2', '2x = 1', 'unknown_notation'],
    ['x = \\alpha', '2x = 1', 'unknown_notation'],
    ['x = 10 : 2', '2x = 10', 'unknown_notation'], // dấu `:` (chia kiểu Việt) chưa nhận — nói thật
    ['x = 5 (thoả mãn)', '2x = 10', 'unknown_notation'],
    ['x = \\pm 2 \\pm 1', 'x^2 = 4', 'unknown_notation'],
  ])('%s (đề %s) → %s', (step, anchor, reason) => {
    expect(checkMathStep(step, anchor)).toEqual({ verdict: 'unsupported', reason })
  })

  it('đề bài không đọc được → anchor_unsupported', () => {
    expect(checkMathStep('v = 10', 'v = a \\cdot t')).toEqual({
      verdict: 'unsupported',
      reason: 'multi_variable',
    })
    expect(checkMathStep('x = 2', '\\sqrt{x} = 2')).toEqual({
      verdict: 'unsupported',
      reason: 'anchor_unsupported',
    })
    expect(checkMathStep('x = 2', 'x/0 = 1')).toEqual({
      verdict: 'unsupported',
      reason: 'anchor_unsupported',
    })
  })

  it('chuỗi ⇒ có đoạn rỗng hoặc đoạn không đọc được thì không khẳng định ✓', () => {
    expect(verdict('2x = 10 \\implies', '2x + 5 = 15')).toBe('unsupported')
    expect(verdict('2x = 10 \\implies \\sqrt{x} = 5', '2x + 5 = 15')).toBe('unsupported')
  })

  it('các nhánh hiếm của tập nghiệm/điều kiện xác định', () => {
    // Chuỗi hai cặp vế đều hữu hạn nghiệm: x² = x = 1 chỉ còn x = 1.
    expect(verdict('x = 1', 'x^2 = x = 1')).toBe('equivalent')
    // Hai mẫu số chứa ẩn: hằng đẳng thức trên R \ {0; 1}; bỏ hết mẫu → sinh thêm 0 và 1.
    expect(checkMathStep('2 = 2', '\\frac{x}{x} + \\frac{x-1}{x-1} = 2')).toMatchObject({
      verdict: 'changed',
      lost: false,
      extra: true,
    })
    expect(verdict('\\frac{x+1}{x+1} = 1 + \\frac{x}{x} - 1', '\\frac{x}{x} = 1')).toBe('changed')
    expect(verdict('\\frac{2x}{x} = 2', '\\frac{x}{x} = 1')).toBe('equivalent')
    // Đề hữu hạn nghiệm, bước thành hằng đẳng thức → nghiệm lạ.
    expect(checkMathStep('2(x+1) = 2x + 2', 'x = 3')).toMatchObject({ extra: true })
    // Số mũ 0 và âm.
    expect(verdict('x = 2^0', 'x = 1')).toBe('equivalent')
    expect(verdict('x^{-1} = 2', '2x = 1')).toBe('equivalent')
    expect(checkMathStep('x = 0^0', 'x = 1')).toEqual({
      verdict: 'unsupported',
      reason: 'non_polynomial',
    })
    // Hàm gõ không dấu \ (sqrt x) vẫn là ngoài phạm vi đa thức.
    expect(checkMathStep('sqrt(x) = 2', 'x = 4')).toEqual({
      verdict: 'unsupported',
      reason: 'non_polynomial',
    })
    // \frac thiếu ngoặc nhọn → không đoán.
    expect(checkMathStep('x = \\frac 12', '2x = 1')).toEqual({
      verdict: 'unsupported',
      reason: 'unknown_notation',
    })
    // "hoặc" với một vế là hằng đẳng thức — hợp tập vô hạn: chưa kiểm.
    expect(checkMathStep('x = 2 hoặc 0 = 0', 'x = 2')).toEqual({
      verdict: 'unsupported',
      reason: 'too_complex',
    })
  })

  it('bước trước dùng ẩn khác hoặc không đọc được → không khẳng định "khớp bước trước"', () => {
    expect(checkMathStep('x = 10', '2x + 5 = 15', 'y = 10')).toMatchObject({
      sameAsPrevious: false,
    })
    expect(checkMathStep('x = 10', '2x + 5 = 15', '\\sqrt{x} = 5')).toMatchObject({
      sameAsPrevious: false,
    })
    expect(checkMathStep('x = 10', '2x + 5 = 15', '2x = 30 \\implies 2x = 20')).toMatchObject({
      sameAsPrevious: true,
    })
  })

  it('tất định: gọi lại cho cùng kết quả', () => {
    const a = checkMathStep('x = 1', 'x^3 - x = 0')
    const b = checkMathStep('x = 1', 'x^3 - x = 0')
    expect(a).toEqual(b)
    expect(a).toMatchObject({ verdict: 'changed', lost: true })
  })
})
