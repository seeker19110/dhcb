// Ca biên của bộ kiểm bước giải phương trình một ẩn (đặc tả docs/specs/2026-10-09-kiem-buoc-giai-stem.md §8).
// Luật bất biến: chỉ `equivalent` khi CHỨNG MINH được; không đọc được thì `unsupported`, không đoán.
import { describe, it, expect } from 'vitest'
import { checkMathStep, describeMathStep } from './stepCheckMath.js'

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

describe('checkMathStep — dấu chia `:` kiểu SGK (đợt 0562)', () => {
  it.each([
    ['x : 2 = 3', 'x = 6', 'equivalent'],
    ['x / 2 = 3', 'x : 2 = 3', 'equivalent'],
    ['x = 6', 'x : 2 = 3', 'equivalent'],
    ['(x+1) : 3 = 2', 'x = 5', 'equivalent'],
    ['x = 6 : 2 : 3 + 2', 'x = 3', 'equivalent'], // 6:2:3 = (6:2):3 = 1, kết hợp trái
    ['x = 6 : 2 : 3', 'x = 1', 'equivalent'],
    ['x = 6 : (2 : 3)', 'x = 9', 'equivalent'],
    ['x = 10 : 2', '2x = 10', 'equivalent'],
    ['x = \\frac{6:2}{3} + 4', 'x = 5', 'equivalent'], // `:` trong tử của \frac vẫn là chia
    ['x = 6 \\: 2', 'x = 3', 'changed'], // `\:` là khoảng trắng LaTeX, không phải chia
    ['x : 2 = 3', 'x = 5', 'changed'],
  ])('%s (đề %s) → %s', (step, anchor, v) => {
    expect(verdict(step, anchor)).toBe(v)
  })

  it('chia cho 0 bằng `:` → division_by_zero như `/`', () => {
    expect(verdict('x : 0 = 3', 'x = 6')).toBe('division_by_zero')
    expect(verdict('x = 10 : (5-5)', '2x = 10')).toBe('division_by_zero')
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
    ['\\sqrt[3]{x} = 2', 'x = 4', 'unknown_notation'], // căn bậc khác 2
    ['\\sin x = 0', 'x = 0', 'unknown_notation'],
    ['x = \\pi', 'x = 3', 'unknown_notation'],
    ['x = π', 'x = 3', 'unknown_notation'],
    ['x \\neq 5', '2x + 5 = 15', 'unknown_notation'],
    ['15 - 5', '2x + 5 = 15', 'not_equation'],
    ['x + y = 5', '2x + 5 = 15', 'multi_variable'],
    ['y = 5', '2x + 5 = 15', 'multi_variable'],
    ['xy = 5', 'xy = 5', 'multi_variable'],
    ['x^{1/2} = 2', 'x = 4', 'non_polynomial'],
    ['x^{100} = 1', 'x = 1', 'too_complex'],
    ['x = \\frac{1}{2', '2x = 1', 'unknown_notation'],
    ['x = \\alpha', '2x = 1', 'unknown_notation'],
    ['x = 10 :: 2', '2x = 10', 'unknown_notation'], // `::` không phải phép chia
    ['x = : 2', '2x = 10', 'unknown_notation'], // `:` thiếu toán hạng
    ['x = 10 :', '2x = 10', 'unknown_notation'],
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
    expect(checkMathStep('x = 2', '\\sqrt[3]{x} = 2')).toEqual({
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
    expect(verdict('2x = 10 \\implies \\sqrt[3]{x} = 5', '2x + 5 = 15')).toBe('unsupported')
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
    // Hàm gõ không dấu \ (sin x) vẫn là ngoài phạm vi đa thức.
    expect(checkMathStep('sin(x) = 0', 'x = 0')).toEqual({
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
    expect(checkMathStep('x = 10', '2x + 5 = 15', '\\sqrt[3]{x} = 5')).toMatchObject({
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

// changelog 0551 — hình dạng bước cho gợi ý Socratic: chỉ đặc điểm hình thức, không nghiệm.
describe('describeMathStep', () => {
  it('nhận đúng từng đặc điểm', () => {
    expect(describeMathStep('2x + 5 - 5 = 15 - 5')).toMatchObject({
      hasLikeTerms: true,
      constantBesideVariable: true,
      degree: 1,
      isAnswerForm: false,
    })
    expect(describeMathStep('2x = 10')).toMatchObject({
      coefficientNotOne: true,
      hasLikeTerms: false,
      constantBesideVariable: false,
    })
    expect(describeMathStep('\\frac{x}{3} = 2')?.coefficientNotOne).toBe(true)
    expect(describeMathStep('x = 5')).toMatchObject({
      isAnswerForm: true,
      coefficientNotOne: false,
    })
    expect(describeMathStep('3x - 6 = 2x + 1')?.variableOnBothSides).toBe(true)
    expect(describeMathStep('3(x - 2) = 7')?.hasExpandableProduct).toBe(true)
    expect(describeMathStep('(x - 1)^2 = 4')?.hasExpandableProduct).toBe(true)
    expect(describeMathStep('x^2 - 5x + 6 = 0')).toMatchObject({ degree: 2, hasLikeTerms: false })
    expect(describeMathStep('2x^2 + 3x^2 = 5')?.hasLikeTerms).toBe(true)
    expect(describeMathStep('\\frac{1}{x - 1} = 2')?.hasVariableDenominator).toBe(true)
    expect(describeMathStep('x = x')?.degree).toBe(0)
  })

  it('lấy mệnh đề cuối sau ⇒', () => {
    expect(describeMathStep('2x = 10 \\implies x = 5')?.isAnswerForm).toBe(true)
  })

  it('ngoài phạm vi → null (không đoán)', () => {
    for (const s of [
      '\\sqrt{x} = 5',
      'x + y = 5',
      'x = 2 hoặc x = 3',
      '2x',
      'a = b = c',
      'x = 1/0',
    ]) {
      expect(describeMathStep(s), s).toBeNull()
    }
  })
})

describe('lồng sâu / quá dài — KHÔNG ném lỗi (rà soát bảo mật 0551)', () => {
  // Trước đây 30000 ngoặc lồng nhau làm tràn ngăn xếp (RangeError) → API trả 500.
  const longNgoac = (n: number) => `x = ${'('.repeat(n)}1${')'.repeat(n)}`
  const congDai = `x = ${Array.from({ length: 30000 }, () => '1').join('+')}`

  it('ngoặc lồng sâu ở bước → unsupported too_complex; dưới trần vẫn kiểm bình thường', () => {
    expect(checkMathStep(longNgoac(30000), 'x = 1')).toEqual({
      verdict: 'unsupported',
      reason: 'too_complex',
    })
    expect(checkMathStep(longNgoac(20), 'x = 1').verdict).toBe('equivalent')
  })

  it('ngoặc lồng sâu ở mốc → anchor_unsupported', () => {
    expect(checkMathStep('x = 1', longNgoac(30000))).toEqual({
      verdict: 'unsupported',
      reason: 'anchor_unsupported',
    })
  })

  it('chuỗi cộng rất dài không ngoặc (đệ quy ngoài bộ phân tích) → too_complex, không ném', () => {
    expect(checkMathStep(congDai, 'x = 1')).toEqual({
      verdict: 'unsupported',
      reason: 'too_complex',
    })
  })

  it('describeMathStep trả null thay vì ném', () => {
    expect(describeMathStep(longNgoac(30000))).toBeNull()
    expect(() => describeMathStep(congDai)).not.toThrow()
  })
})

// Đặc tả docs/specs/2026-10-11-kiem-buoc-bat-phuong-trinh.md — bất phương trình một ẩn, so tập
// nghiệm CHÍNH XÁC bằng phân hoạch trục số (mathSolutionSet.ts).
describe('checkMathStep — bất phương trình (bảng ③)', () => {
  it('quên đổi chiều khi chia cho số âm → mất + thêm, đánh dấu phần bù', () => {
    expect(checkMathStep('x < -3', '-2x < 6')).toEqual({
      verdict: 'changed',
      lost: true,
      extra: true,
      sameAsPrevious: false,
      inequality: { complementOnIntervals: true },
    })
    expect(checkMathStep('x > -3', '-2x < 6').verdict).toBe('equivalent')
  })

  it('x² < 4 → x < 2 thêm nửa dưới (không phải phần bù)', () => {
    expect(checkMathStep('x < 2', 'x^2 < 4')).toMatchObject({
      verdict: 'changed',
      lost: false,
      extra: true,
      inequality: { complementOnIntervals: false },
    })
    expect(verdict('-2 < x < 2', 'x^2 < 4')).toBe('equivalent')
  })

  it('nhân hai vế với ẩn chưa biết dấu: 1/x > 1 → 1 > x thêm x ≤ 0', () => {
    expect(checkMathStep('1 > x', '\\frac{1}{x} > 1')).toMatchObject({
      verdict: 'changed',
      lost: false,
      extra: true,
    })
    expect(verdict('0 < x < 1', '\\frac{1}{x} > 1')).toBe('equivalent')
  })

  it('rút gọn mất điều kiện xác định: (x−1)/(x−1) ≥ 0 → 1 ≥ 0 thêm đúng x = 1', () => {
    expect(checkMathStep('1 \\ge 0', '\\frac{x-1}{x-1} \\ge 0')).toMatchObject({
      verdict: 'changed',
      lost: false,
      extra: true,
      inequality: { complementOnIntervals: false },
    })
  })

  it('cả hai tập rỗng → tương đương', () => {
    expect(verdict('x^2 < -1', 'x^2 + 1 < 0')).toBe('equivalent')
  })

  it('lượng giác → "?"', () => {
    expect(checkMathStep('\\sin x > 0', 'x > 0')).toEqual({
      verdict: 'unsupported',
      reason: 'unknown_notation',
    })
  })

  it('phương trình so với bất phương trình (và ngược lại) là hai tập bình thường', () => {
    expect(checkMathStep('x < 5', '2x + 5 = 15')).toMatchObject({
      verdict: 'changed',
      lost: true,
      extra: true,
    })
    // `2 ≤ x ≤ 2` chỉ có đúng x = 2 → tương đương phương trình x = 2.
    expect(verdict('2 \\le x \\le 2', 'x = 2')).toBe('equivalent')
    expect(verdict('x = 2', '2 \\le x \\le 2')).toBe('equivalent')
  })
})

describe('checkMathStep — bất phương trình: đọc ký hiệu', () => {
  it.each([
    ['x \\le 2', 'x \\leq 2'],
    ['x <= 2', 'x \\leqslant 2'],
    ['x ≤ 2', 'x ⩽ 2'],
    ['x \\ge 2', 'x >= 2'],
    ['x \\geq 2', 'x ≥ 2'],
    ['x \\lt 2', 'x < 2'],
    ['x \\gt 2', '2 < x'],
    ['\\left(x+1\\right) \\le 3', 'x \\le 2'], // `\left` không bị đọc thành `\le`
    ['x < -1 \\text{ hoặc } x > 1', 'x^2 > 1'],
    ['x < -1; x > 1', 'x^2 - 1 > 0'],
    ['2x - 4 > 0 \\implies 2x > 4 \\implies x > 2', 'x > 2'],
  ])('%s ⇔ %s', (step, anchor) => {
    expect(verdict(step, anchor)).toBe('equivalent')
  })

  it('`>=` không bị hiểu nhầm là dấu suy ra `=>`', () => {
    expect(verdict('x >= 2', 'x - 2 \\ge 0')).toBe('equivalent')
  })
})

describe('checkMathStep — bất phương trình: chính xác ở nghiệm vô tỉ và đầu mút (④)', () => {
  it('x² < 2: đáp số có căn và dạng đa thức đều so chính xác', () => {
    expect(verdict('-\\sqrt{2} < x < \\sqrt{2}', 'x^2 < 2')).toBe('equivalent')
    expect(verdict('x^2 - 2 < 0', 'x^2 < 2')).toBe('equivalent')
    expect(checkMathStep('x^2 < 3', 'x^2 < 2')).toMatchObject({
      verdict: 'changed',
      lost: false,
      extra: true,
    })
    expect(checkMathStep('x^2 \\le 2', 'x^2 < 2')).toMatchObject({ lost: false, extra: true })
    expect(checkMathStep('x^2 < 2', 'x^2 \\le 2')).toMatchObject({ lost: true, extra: false })
  })

  it('nghiệm vô tỉ của đa thức bậc ba: so dấu đúng tại nghiệm', () => {
    // x³ − 2 có nghiệm ∛2 vô tỉ; (x³−2)(x−1) đổi dấu ở 1 và ∛2.
    expect(verdict('(x^3 - 2)(x - 1) \\le 0', 'x^4 - x^3 - 2x + 2 \\le 0')).toBe('equivalent')
    expect(checkMathStep('(x^3 - 2)(x - 1) < 0', 'x^4 - x^3 - 2x + 2 \\le 0')).toMatchObject({
      lost: true,
      extra: false,
    })
  })

  it('đầu mút: x ≤ 2 so với x < 2 → mất đúng điểm 2', () => {
    expect(checkMathStep('x < 2', 'x \\le 2')).toMatchObject({
      verdict: 'changed',
      lost: true,
      extra: false,
      inequality: { complementOnIntervals: false },
    })
  })

  it('hai nghiệm rất sát nhau vẫn tách được', () => {
    expect(verdict('(x - 1)(x - 1.0001) < 0', '1 < x < 1.0001')).toBe('equivalent')
  })

  it('bậc 25 → too_complex, không treo', { timeout: 2000 }, () => {
    expect(checkMathStep('x^{25} > 0', 'x > 0')).toEqual({
      verdict: 'unsupported',
      reason: 'too_complex',
    })
    expect(checkMathStep('x^{13} \\cdot x^{12} > 0', 'x > 0')).toEqual({
      verdict: 'unsupported',
      reason: 'too_complex',
    })
  })

  it('bậc cao dưới trần vẫn kiểm nhanh', { timeout: 2000 }, () => {
    expect(verdict('x^{24} - 1 > 0', 'x^{24} > 1')).toBe('equivalent')
  })
})

describe('checkMathStep — bất phương trình: đáp số và bước trước', () => {
  it('dạng đáp số: x op c, a op x op b (cùng chiều), nối "hoặc"', () => {
    expect(checkMathStep('x > 2', '2x - 4 > 0')).toEqual({
      verdict: 'equivalent',
      isFinalAnswer: true,
    })
    expect(checkMathStep('-2 < x < 2', 'x^2 < 4')).toMatchObject({ isFinalAnswer: true })
    expect(checkMathStep('x < -1 hoặc x > 1', 'x^2 > 1')).toMatchObject({ isFinalAnswer: true })
    expect(checkMathStep('2 > x > -2', 'x^2 < 4')).toMatchObject({ isFinalAnswer: true })
    // Chưa phải đáp số: còn biểu thức, hoặc hai dấu ngược chiều.
    expect(checkMathStep('x^2 - 4 < 0', 'x^2 < 4')).toMatchObject({ isFinalAnswer: false })
    expect(checkMathStep('2x > 4', '2x - 4 > 0')).toMatchObject({ isFinalAnswer: false })
  })

  it('sameAsPrevious cho bất phương trình', () => {
    expect(checkMathStep('x < -3', '-2x < 6', '-2x > 6 \\implies x < -3')).toMatchObject({
      verdict: 'changed',
      sameAsPrevious: true,
    })
    expect(checkMathStep('x < -3', '-2x < 6', '2x > -6')).toMatchObject({
      verdict: 'changed',
      sameAsPrevious: false,
    })
  })

  it('describeMathStep chỉ mô tả phương trình — bất phương trình → null', () => {
    expect(describeMathStep('2x > 4')).toBeNull()
    expect(describeMathStep('1 < x \\le 3')).toBeNull()
  })

  it('kết luận phương trình KHÔNG mang trường inequality', () => {
    expect(checkMathStep('x = 1', 'x^2 = x')).not.toHaveProperty('inequality')
  })
})

// Đặc tả docs/specs/2026-10-11-ky-hieu-khoang-va-tri-tuyet-doi.md ③.
describe('checkMathStep — ký hiệu khoảng/tập', () => {
  it.each([
    ['S = (2; +\\infty)', '2x - 4 > 0'],
    ['S=(2;+∞)', '2x - 4 > 0'],
    ['S = \\left(2; +\\infty\\right)', '2x - 4 > 0'],
    ['S = (2, +inf)', '2x - 4 > 0'], // dấu phẩy ngăn đầu mút khi không có `;`
    ['x \\in (2; +\\infty)', '2x - 4 > 0'],
    ['x ∈ (\\frac{4}{2}; +\\infty)', '2x - 4 > 0'],
    ['S = (-\\infty; 1) \\cup (3; +\\infty)', 'x^2 - 4x + 3 > 0'],
    ['S = (-∞; 1) ∪ (3; +∞)', 'x^2 - 4x + 3 > 0'],
    ['S = (-inf; 1) U (3; +inf)', 'x^2 - 4x + 3 > 0'],
    ['S = [1; 3]', 'x^2 - 4x + 3 \\le 0'],
    ['S = \\{2; -2\\}', 'x^2 = 4'],
    ['S = {-2, 2}', 'x^2 = 4'],
    ['S = \\{5\\}', '2x + 5 = 15'],
    ['S = \\emptyset', 'x^2 + 1 < 0'],
    ['S = ∅', 'x^2 + 1 = 0'],
    ['S = \\mathbb{R}', 'x^2 + 1 > 0'],
    ['S = \\mathbb{R} \\setminus \\{2\\}', '(x-2)^2 > 0'],
    ['S = R \\ {3; -1}', '(x-3)^2 (x+1)^2 > 0'],
    ['x \\in [1; 3) \\cup \\{5\\}', '\\frac{(x - 1)(x - 5)^2}{x - 3} \\le 0'],
    ['S = (2,5; +\\infty)', '2x - 5 > 0'], // dấu phẩy thập phân kiểu Việt khi đã ngăn bằng `;`
  ])('%s  (đề: %s) → tương đương, là đáp số', (step, anchor) => {
    expect(checkMathStep(step, anchor)).toEqual({ verdict: 'equivalent', isFinalAnswer: true })
  })

  it('đầu mút đóng/mở sai → đổi tập nghiệm', () => {
    expect(checkMathStep('S = [2; +\\infty)', '2x - 4 > 0')).toMatchObject({
      verdict: 'changed',
      lost: false,
      extra: true,
    })
    expect(
      checkMathStep('x \\in (-\\infty; 1) U [3; +\\infty)', 'x^2 - 4x + 3 \\ge 0'),
    ).toMatchObject({ verdict: 'changed', lost: true, extra: false })
    expect(checkMathStep('S = \\{2\\}', 'x^2 = 4')).toMatchObject({
      verdict: 'changed',
      lost: true,
    })
  })

  it.each([
    ['S = [2; +\\infty]'], // ngoặc vuông ở vô cực
    ['S = (5; 2)'], // đầu mút ngược
    ['S = (2; 2)'],
    ['S = (+\\infty; 2)'],
    ['S = (2; -\\infty)'],
    ['S = (2; 3; 4)'],
    ['x \\in \\mathbb{Z}'],
    ['S = ]2; +\\infty['], // ngoặc kiểu Pháp
  ])('ký hiệu sai/chưa hỗ trợ %s → "?"', (step) => {
    expect(checkMathStep(step, '2x - 4 > 0').verdict).toBe('unsupported')
  })

  it('không có tiền tố S =/x ∈ → luật `;` = "hoặc" giữ nguyên', () => {
    expect(checkMathStep('x = 2; x = -2', 'x^2 = 4')).toEqual({
      verdict: 'equivalent',
      isFinalAnswer: true,
    })
    // Khoảng đứng trơn (có thể là toạ độ) không đọc như tập.
    expect(checkMathStep('(2; +\\infty)', '2x - 4 > 0').verdict).toBe('unsupported')
    // Tập xác định D = … không phải tập nghiệm.
    expect(checkMathStep('D = \\mathbb{R} \\setminus \\{1\\}', 'x > 1').verdict).toBe('unsupported')
  })

  it('ẩn nêu sau ∈ khác ẩn của đề → nhiều ẩn', () => {
    expect(checkMathStep('y \\in (2; +\\infty)', '2x - 4 > 0')).toEqual({
      verdict: 'unsupported',
      reason: 'multi_variable',
    })
  })

  it('S = … khi S là ẩn của phương trình vẫn đọc như phương trình', () => {
    expect(checkMathStep('S = 5', '2S = 10')).toEqual({
      verdict: 'equivalent',
      isFinalAnswer: true,
    })
    expect(checkMathStep('S = (1 + 4)', '2S = 10').verdict).toBe('equivalent')
  })

  it('chuỗi suy ra kết thúc bằng ký hiệu tập', () => {
    expect(
      checkMathStep('2x > 4 \\implies x > 2 \\implies S = (2; +\\infty)', '2x - 4 > 0'),
    ).toEqual({ verdict: 'equivalent', isFinalAnswer: true })
  })

  it('describeMathStep không mô tả ký hiệu tập', () => {
    expect(describeMathStep('S = \\{5\\}')).toBeNull()
  })
})

describe('checkMathStep — trị tuyệt đối (chia trường hợp)', () => {
  it.each([
    ['-5 < 2x - 1 < 5', '|2x - 1| < 5'],
    ['-2 < x < 3', '\\left|2x - 1\\right| < 5'],
    ['-2 < x < 3', '\\lvert 2x - 1 \\rvert < 5'],
    ['-2 < x < 3', 'abs(2x - 1) < 5'],
    ['x = 4 hoặc x = -2', '|x - 1| = 3'],
    ['x - 1 = 3 \\text{ hoặc } x - 1 = -3', '|x - 1| = 3'],
    ['S = \\emptyset', '|x| = -1'],
    ['S = (-\\infty; 0] \\cup [2; +\\infty)', '|x - 1| \\ge 1'],
    ['x \\le \\frac{1}{2}', '|x - 1| \\ge x'], // ẩn ở ngoài trị tuyệt đối
    ['x = 0', '|x| + |x| = 0'],
    ['x \\ge 0', '|x| = x'],
    ['x \\ge 1 hoặc x \\le -1', '||x| - 1| = |x| - 1'], // lồng nhau
    ['S = \\mathbb{R}', '2|x - 1||x + 1| = 16|x^2 - 1| - 14|x^2 - 1|'], // hằng đẳng thức
    ['|x - 1| < 3', '-2 < x < 4'], // viết ngược lại cũng so được
  ])('%s  (đề: %s) → tương đương', (step, anchor) => {
    expect(checkMathStep(step, anchor).verdict).toBe('equivalent')
  })

  it('bỏ một trường hợp → mất nghiệm, có cờ trị tuyệt đối, không phải câu bất phương trình', () => {
    const kq = checkMathStep('x - 1 = 3', '|x - 1| = 3')
    expect(kq).toMatchObject({
      verdict: 'changed',
      lost: true,
      extra: false,
      absoluteValue: { casesSplit: true },
    })
    expect(kq).not.toHaveProperty('inequality')
  })

  it('bất phương trình bỏ trị tuyệt đối sai → thêm khoảng, có cờ trị tuyệt đối', () => {
    expect(checkMathStep('2x - 1 < 5', '|2x - 1| < 5')).toMatchObject({
      verdict: 'changed',
      lost: false,
      extra: true,
      inequality: { complementOnIntervals: false },
      absoluteValue: { casesSplit: true },
    })
  })

  it('bước còn trị tuyệt đối thì không gắn cờ chia trường hợp', () => {
    expect(checkMathStep('|x - 1| = 4', '|x - 1| = 3')).not.toHaveProperty('absoluteValue')
  })

  it('lệch số | → "?"', () => {
    expect(checkMathStep('|x - 1 = 3', 'x = 4')).toEqual({
      verdict: 'unsupported',
      reason: 'unknown_notation',
    })
    expect(checkMathStep('x = 4', '|x - 1| = 3|')).toEqual({
      verdict: 'unsupported',
      reason: 'anchor_unsupported',
    })
  })

  it('quá 4 trị tuyệt đối khác nhau → too_complex, không treo', () => {
    expect(checkMathStep('x = 0', '|x| + |x - 1| + |x - 2| + |x - 3| + |x - 4| = 10')).toEqual({
      verdict: 'unsupported',
      reason: 'anchor_unsupported',
    })
    expect(checkMathStep('|x| + |x - 1| + |x - 2| + |x - 3| + |x - 4| = 10', 'x = 0')).toEqual({
      verdict: 'unsupported',
      reason: 'too_complex',
    })
    // Đúng 4 thì vẫn kiểm.
    expect(checkMathStep('|x| + |x - 1| + |x - 2| + |x - 3| = 10', 'x = 0').verdict).toBe('changed')
  }, 2000)

  it('describeMathStep không mô tả phương trình có trị tuyệt đối', () => {
    expect(describeMathStep('|x - 1| = 3')).toBeNull()
  })
})

// docs/specs/2026-10-11-can-bac-hai.md — căn bậc hai, vẫn CHÍNH XÁC (A + B·√f, không làm tròn).
describe('checkMathStep — căn bậc hai', () => {
  it.each([
    ['x = 6', '\\sqrt{x + 3} = x - 3'],
    ['x = 4', '\\sqrt{x} = 2'],
    ['x = 4', '√x = 2'],
    ['x = 4', '√(x) = 2'],
    ['x = 4', 'sqrt(x) = 2'],
    ['x = \\sqrt{2} hoặc x = -\\sqrt{2}', 'x^2 = 2'],
    ['x = \\pm\\sqrt{2}', 'x^2 = 2'],
    ['x = ±√2', 'x^2 = 2'],
    ['x = \\frac{1 \\pm \\sqrt{5}}{2}', 'x^2 - x - 1 = 0'], // công thức nghiệm
    ['x = 2 \\pm 2\\sqrt{2}', 'x^2 - 4x - 4 = 0'],
    ['S = \\emptyset', '\\sqrt{x} = -1'],
    ['x = 3', '\\sqrt{2x + 1} = \\sqrt{x + 4}'], // √f = √g
    ['S = \\emptyset', '\\sqrt{x - 5} = \\sqrt{1 - x}'], // f = g nhưng ngoài điều kiện
    ['0 \\le x < 4', '\\sqrt{x} < 2'],
    ['x > 5', '\\sqrt{x - 1} > 2'],
    ['x \\ge 1', '\\sqrt{x - 1} + 1 > 0'],
    ['0 \\le x \\le 1', 'x - \\sqrt{x} \\le 0'], // hệ số âm trước căn
    ['x > 4', 'x - 2 > \\sqrt{x}'],
    ['0 \\le x \\le 4', '\\sqrt{x} \\ge x - 2'],
    ['0 \\le x < 4', 'x - 2 < \\sqrt{x}'],
    ['x \\le -1 hoặc x \\ge 1', '\\sqrt{x^2 - 1} \\ge 0'],
    ['-1 \\le x < 3', '\\sqrt{x + 1} < 2'],
    ['x \\ge 0', '\\sqrt{x}^2 = x'], // (√x)² = x đúng trên tập xác định
    ['S = \\mathbb{R}', '\\sqrt{x^2} = |x|'], // √(x²) = |x|
    ['x = 1', '\\frac{1}{\\sqrt{x}} = 1'], // chia cho căn thuần
    ['x = 4', '\\frac{x}{\\sqrt{x}} = 2'],
    ['x = 4', '\\sqrt{x} + 2\\sqrt{x} = 6'], // cùng một căn lặp lại
    ['x = 4', '2x\\sqrt{x} = 16'], // `2x√x` không dính thành tên biến
    ['x = 3', '2x|x| = 18'], // tương tự với trị tuyệt đối
    ['x = 3 hoặc x = -3', '\\sqrt{|x| + 1} = 2'], // trị tuyệt đối dưới căn
  ])('%s  (đề: %s) → tương đương', (step, anchor) => {
    expect(checkMathStep(step, anchor).verdict).toBe('equivalent')
  })

  it('đáp số có căn được nhận là dạng đáp số', () => {
    expect(checkMathStep('x = \\pm\\sqrt{2}', 'x^2 = 2')).toEqual({
      verdict: 'equivalent',
      isFinalAnswer: true,
    })
  })

  it('bình phương hai vế quên điều kiện → THÊM nghiệm lạ, có cờ bỏ căn', () => {
    const kq = checkMathStep('x + 3 = (x - 3)^2', '\\sqrt{x + 3} = x - 3')
    expect(kq).toEqual({
      verdict: 'changed',
      lost: false,
      extra: true,
      sameAsPrevious: false,
      squareRoot: { removed: true },
    })
    expect(checkMathStep('x = 1 hoặc x = 6', '\\sqrt{x + 3} = x - 3')).toMatchObject({
      lost: false,
      extra: true,
    })
  })

  it('bình phương sai (khai triển thiếu hạng tử) → mất nghiệm, có cờ bỏ căn', () => {
    expect(checkMathStep('x + 3 = x^2 - 9', '\\sqrt{x + 3} = x - 3')).toMatchObject({
      verdict: 'changed',
      lost: true,
      squareRoot: { removed: true },
    })
  })

  it('bất phương trình bỏ căn quên điều kiện dưới căn → thêm khoảng', () => {
    expect(checkMathStep('x < 4', '\\sqrt{x} < 2')).toMatchObject({
      verdict: 'changed',
      lost: false,
      extra: true,
      inequality: { complementOnIntervals: false },
      squareRoot: { removed: true },
    })
    // Bỏ mất đầu mút.
    expect(checkMathStep('x \\ge 5', '\\sqrt{x - 1} > 2')).toMatchObject({ extra: true })
  })

  it('điều kiện dưới căn giữ cả khi căn triệt tiêu: √x − √x = 0 chỉ đúng với x ≥ 0', () => {
    expect(checkMathStep('S = \\mathbb{R}', '\\sqrt{x} - \\sqrt{x} = 0')).toMatchObject({
      verdict: 'changed',
      lost: false,
      extra: true,
    })
    expect(checkMathStep('x \\ge 0', '\\sqrt{x} - \\sqrt{x} = 0').verdict).toBe('equivalent')
  })

  it('nghiệm vô tỉ đúng một nửa → mất nghiệm (không làm tròn)', () => {
    expect(checkMathStep('x = \\sqrt{2}', 'x^2 = 2')).toMatchObject({
      verdict: 'changed',
      lost: true,
      extra: false,
    })
    // √2 ≈ 1,41421356…: hai số hữu tỉ sát √2 KHÔNG phải nghiệm.
    expect(checkMathStep('x = 1.41421356', 'x = \\sqrt{2}')).toMatchObject({ verdict: 'changed' })
  })

  it('bước còn căn thì không gắn cờ bỏ căn', () => {
    expect(checkMathStep('\\sqrt{x + 3} = x', '\\sqrt{x + 3} = x - 3')).not.toHaveProperty(
      'squareRoot',
    )
  })

  it.each([
    ['\\sqrt{\\sqrt{x}} = 2'], // căn lồng căn
    ['\\sqrt{x} + \\sqrt{x + 1} + \\sqrt{x + 2} = 3'], // ba căn khác nhau
    ['\\frac{x}{\\sqrt{x} + 1} = 1'], // mẫu dạng C + D√f — cần trục căn
  ])('ngoài phạm vi %s → too_complex ("?")', (step) => {
    expect(checkMathStep(step, 'x = 1')).toEqual({ verdict: 'unsupported', reason: 'too_complex' })
  })

  it.each([
    ['\\sqrt[3]{x} = 2'], // căn bậc ba
    ['\\sqrt x = 2'], // \sqrt không ngoặc nhọn: `\sqrt 23` dễ đọc nhầm
    ['√x² = 4'], // căn của bình phương hay bình phương của căn?
    ['√2^3 = x'],
  ])('ký hiệu %s → unknown_notation', (step) => {
    expect(checkMathStep(step, 'x = 1')).toEqual({
      verdict: 'unsupported',
      reason: 'unknown_notation',
    })
  })

  it('chia cho căn của 0 → chia cho 0', () => {
    expect(checkMathStep('x = \\frac{1}{\\sqrt{0}}', 'x = 1')).toEqual({
      verdict: 'division_by_zero',
    })
  })

  it('describeMathStep không mô tả phương trình có căn', () => {
    expect(describeMathStep('\\sqrt{x} = 3')).toBeNull()
  })
})

// docs/specs/2026-10-11-hai-can-khac-nhau.md — hai căn khác nhau: tháp hai tầng, vẫn chính xác.
describe('checkMathStep — hai căn khác nhau', () => {
  it.each([
    ['x = 4', '\\sqrt{x + 5} + \\sqrt{x} = 5'],
    ['\\sqrt{x + 5} = 5 - \\sqrt{x}', '\\sqrt{x + 5} + \\sqrt{x} = 5'], // chuyển vế
    ['x + 5 = 25 - 10\\sqrt{x} + x', '\\sqrt{x + 5} + \\sqrt{x} = 5'], // bình phương đúng
    ['10\\sqrt{x} = 20', '\\sqrt{x + 5} + \\sqrt{x} = 5'],
    ['\\sqrt{x} = 2', '\\sqrt{x + 5} + \\sqrt{x} = 5'],
    ['x = 4', '2\\sqrt{x} = \\sqrt{x + 12}'], // một vế có hệ số
    ['x = 1', '\\sqrt{x + 3} - \\sqrt{x} = 1'],
    ['x = 6', '\\sqrt{x + 3} - \\sqrt{x - 2} = 1'],
    ['x = 6', '\\sqrt{x + 3} + \\sqrt{x - 2} = 5'],
    ['S = \\emptyset', '\\sqrt{x - 3} + \\sqrt{1 - x} = 1'], // hai điều kiện rời nhau
    ['x \\ge 4', '\\sqrt{x + 5} + \\sqrt{x} \\ge 5'],
    ['0 \\le x < 4', '\\sqrt{x + 5} + \\sqrt{x} < 5'],
    ['0 \\le x < \\frac{1}{16}', '\\sqrt{x} + 2 < \\sqrt{x + 5}'], // nhánh (a ≤ 0, b > 0, P < 0)
    ['x = \\frac{\\sqrt{6}}{6}', 'x = \\frac{1}{\\sqrt{2} \\cdot \\sqrt{3}}'], // chia cho √2·√3
    // Đáp số có hai căn: bốn nghiệm ±√2 ± √3 của x⁴ − 10x² + 1 = 0.
    [
      'x = \\sqrt{2} + \\sqrt{3} hoặc x = \\sqrt{2} - \\sqrt{3} hoặc x = -\\sqrt{2} + \\sqrt{3} hoặc x = -\\sqrt{2} - \\sqrt{3}',
      'x^4 - 10x^2 + 1 = 0',
    ],
  ])('%s  (đề: %s) → tương đương', (step, anchor) => {
    expect(checkMathStep(step, anchor).verdict).toBe('equivalent')
  })

  it('bình phương sai khi còn hai căn → mất nghiệm, có cờ bỏ căn', () => {
    // (5 − √x)² viết thành 25 + x: thiếu hạng tử −10√x.
    expect(checkMathStep('x + 5 = 25 + x', '\\sqrt{x + 5} + \\sqrt{x} = 5')).toMatchObject({
      verdict: 'changed',
      lost: true,
      squareRoot: { removed: true },
    })
  })

  it('thiếu nghiệm vô tỉ có căn → mất nghiệm (không làm tròn)', () => {
    expect(checkMathStep('x = \\sqrt{2} + \\sqrt{3}', 'x^4 - 10x^2 + 1 = 0')).toMatchObject({
      verdict: 'changed',
      lost: true,
      extra: false,
    })
  })

  it('bỏ đầu mút khi bất phương trình có hai căn → mất nghiệm', () => {
    expect(checkMathStep('x > 4', '\\sqrt{x + 5} + \\sqrt{x} \\ge 5')).toMatchObject({
      verdict: 'changed',
      lost: true,
      extra: false,
    })
  })

  it('cùng một biểu thức dưới căn viết khác nhau vẫn là MỘT căn', () => {
    expect(checkMathStep('x = 3', '\\sqrt{x + 1} + \\sqrt{1 + x} = 4').verdict).toBe('equivalent')
  })

  it('mẫu có căn ở tầng trên chia được khi thuần căn', () => {
    expect(checkMathStep('x = 1', '\\frac{\\sqrt{x + 3}}{\\sqrt{x}} = 2').verdict).toBe(
      'equivalent',
    )
    expect(checkMathStep('x = 1', '\\frac{1}{\\sqrt{x + 3} - \\sqrt{x}} = 1')).toEqual({
      verdict: 'unsupported',
      reason: 'anchor_unsupported',
    })
  })
})
