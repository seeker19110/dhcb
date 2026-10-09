// Ca biên của bộ kiểm thứ nguyên Vật lí — đặc tả docs/specs/2026-10-09-kiem-thu-nguyen-vat-li.md §④.
import { describe, expect, it } from 'vitest'
import { checkPhysicsStep, type PhysicsStepCheck } from './stepCheckPhysics.js'

/** Bảng biến dùng chung cho phần lớn ca: động học + động lực học + dao động. */
const DE = {
  v: 'm/s',
  v_0: 'm/s',
  a: 'm/s^2',
  t: 's',
  s: 'm',
  x: 'm',
  m: 'kg',
  F: 'N',
  E: 'J',
  A: 'm',
  '\\omega': 'rad/s',
  N: '',
  N_0: '',
  λ: '1/s',
  h: 'm',
  n: '',
} as const

const kiem = (step: string, table: Record<string, string> = DE) => checkPhysicsStep(step, table)

const verdict = (r: PhysicsStepCheck) => r.verdict

describe('checkPhysicsStep — khớp thứ nguyên (không bao giờ tự nhận là "đúng")', () => {
  it.each([
    ['v = a t'],
    ['v = v_0 + a \\cdot t'],
    ['s = v_0 t + \\frac{1}{2} a t^2'],
    ['F = ma'], // chữ liền: tách thành m·a
    ['E = \\frac{1}{2} m v^2'],
    ['v = \\sqrt{2 g h}'], // hằng chuẩn g
    ['E = m c^2'], // hằng chuẩn c
    ['x = A \\cos(\\omega t)'],
    ['N = N_0 e^{-\\lambda t}'],
    ['v = at \\Rightarrow v = 2 \\cdot 5 = 10\\,\\text{m/s}'],
    ['v = \\left( a \\cdot t \\right)'],
  ])('%s → consistent', (step) => {
    expect(verdict(kiem(step))).toBe('consistent')
  })

  it('nêu thứ nguyên chung bằng đơn vị cơ bản SI, và cờ "có giả định hệ số"', () => {
    expect(kiem('v = a t')).toEqual({
      verdict: 'consistent',
      dimension: 'm·s⁻¹',
      assumedCoefficients: false,
    })
    const coHeSo = kiem('E = \\frac{1}{2} m v^2')
    expect(coHeSo).toMatchObject({ verdict: 'consistent', assumedCoefficients: true })
  })
})

describe('checkPhysicsStep — lệch thứ nguyên CHỨNG MINH được', () => {
  it('hai vế khác thứ nguyên: nêu đúng phần người học gõ + thứ nguyên từng vế', () => {
    expect(kiem('v = a t^2')).toEqual({
      verdict: 'mismatch',
      mismatch: {
        context: 'equation',
        left: { text: 'v', dimension: 'm·s⁻¹' },
        right: { text: 'a t^2', dimension: 'm' },
      },
    })
  })

  it('cộng hai hạng tử khác thứ nguyên → nêu đích danh hai hạng tử', () => {
    expect(kiem('s = v t + a t')).toEqual({
      verdict: 'mismatch',
      mismatch: {
        context: 'sum',
        left: { text: 'v t', dimension: 'm' },
        right: { text: 'a t', dimension: 'm·s⁻¹' },
      },
    })
    expect(verdict(kiem('F = m a + m'))).toBe('mismatch')
    // Không có dấu "=" vẫn bắt được tổng lệch.
    expect(verdict(kiem('v + a'))).toBe('mismatch')
  })

  it('hằng chuẩn: E = mc (thiếu bình phương) lệch', () => {
    expect(kiem('E = m c')).toMatchObject({
      verdict: 'mismatch',
      mismatch: { right: { dimension: 'kg·m·s⁻¹' } },
    })
  })

  it('mũ phân số: \\sqrt{g} ra m^(1/2)·s⁻¹; t^{1/2} và t^{0,5} đọc chính xác', () => {
    expect(kiem('v = \\sqrt{g}')).toMatchObject({
      verdict: 'mismatch',
      mismatch: { right: { dimension: 'm^(1/2)·s⁻¹' } },
    })
    expect(kiem('x = t^{1/2}')).toMatchObject({
      mismatch: { right: { dimension: 's^(1/2)' } },
    })
    expect(verdict(kiem('v = \\sqrt[3]{x}', { v: 'm/s', x: 'm^3/s^3' }))).toBe('consistent')
    expect(verdict(kiem('v = x^{0,5}', { v: 'm', x: 'm^2' }))).toBe('consistent')
  })

  it('hàm siêu việt đòi đối số KHÔNG thứ nguyên: cos(t), ln(t), e^{-t}', () => {
    expect(kiem('x = A \\cos(t)')).toMatchObject({
      verdict: 'mismatch',
      mismatch: { context: 'function_argument', functionName: 'cos', left: { dimension: 's' } },
    })
    expect(kiem('x = \\ln(t)', { x: '', t: 's' })).toMatchObject({
      mismatch: { context: 'function_argument', functionName: 'ln' },
    })
    expect(kiem('N = N_0 e^{-t}')).toMatchObject({
      mismatch: { context: 'exponent', functionName: 'e', left: { text: '-t' } },
    })
    // Tỉ số cùng thứ nguyên trong ln — hợp lệ.
    expect(verdict(kiem('x = \\ln\\frac{t}{\\tau}', { x: '', t: 's', '\\tau': 's' }))).toBe(
      'consistent',
    )
  })

  it('tiền tố SI: mm là độ dài, ms là thời gian, μs là thời gian, km/h là tốc độ', () => {
    expect(kiem('x = 5\\,\\text{mm} + 2\\,\\text{ms}')).toMatchObject({
      verdict: 'mismatch',
      mismatch: { left: { dimension: 'm' }, right: { dimension: 's' } },
    })
    expect(verdict(kiem('v = 20\\,\\text{μs}'))).toBe('mismatch')
    expect(verdict(kiem('v = 20\\,\\text{\\mu s}'))).toBe('mismatch')
    expect(verdict(kiem('v = 30\\,\\text{km/h}'))).toBe('consistent')
    expect(verdict(kiem('E = 5\\,\\text{kJ} + 3\\,\\text{kWh}', { E: 'J' }))).toBe('consistent')
  })

  it('số có đơn vị kiểu SGK: 9{,}8\\,\\text{m/s}^2 — số mũ ngoài \\text gắn vào đơn vị cuối', () => {
    expect(kiem('a = 9{,}8\\,\\text{m/s}^2')).toMatchObject({
      verdict: 'consistent',
      dimension: 'm·s⁻²',
    })
    expect(verdict(kiem('v = 3 \\cdot 10^{8}\\,\\text{m/s}'))).toBe('consistent')
    // Hai đại lượng kèm đơn vị nhân nhau không bị đọc lệch thành (2 kg · 3) · m/s.
    expect(verdict(kiem('F = 2\\,\\text{kg} \\cdot 3\\,\\text{m/s}^2'))).toBe('consistent')
  })

  it('bảng biến của đề THẮNG hằng chuẩn: c là nhiệt dung riêng khi đề khai vậy', () => {
    expect(verdict(kiem('Q = m c \\Delta T', { Q: 'J', m: 'kg', c: 'J/(kg.K)', T: 'K' }))).toBe(
      'consistent',
    )
    // Không khai c → c là tốc độ ánh sáng → lệch (chứng minh được với bảng đó).
    expect(verdict(kiem('Q = m c \\Delta T', { Q: 'J', m: 'kg', T: 'K' }))).toBe('mismatch')
  })

  it('Δ giữ thứ nguyên của đại lượng: Δt cùng thứ nguyên t', () => {
    expect(verdict(kiem('a = \\frac{\\Delta v}{\\Delta t}'))).toBe('consistent')
    expect(verdict(kiem('a = \\frac{\\Delta v}{\\Delta s}'))).toBe('mismatch')
  })

  it('chia cho 0 → division_by_zero', () => {
    expect(kiem('v = s/0')).toEqual({ verdict: 'division_by_zero' })
    expect(kiem('v = \\frac{s}{0} + a t')).toEqual({ verdict: 'division_by_zero' })
    expect(kiem('v = 1/0 \\cdot t')).toEqual({ verdict: 'division_by_zero' })
  })
})

describe('checkPhysicsStep — chỉ lệch CÓ ĐIỀU KIỆN thì không được báo ✗', () => {
  it('lối SGK "v = 2t" (đơn vị ghi sau): số trần nhân ký hiệu → conditional, kèm lý do', () => {
    const r = kiem('v = 2t')
    expect(r.verdict).toBe('conditional_mismatch')
    if (r.verdict === 'conditional_mismatch') {
      expect(r.doubts.join(' ')).toContain('“2” không kèm đơn vị')
    }
  })

  it('½·a·t thiếu một t: hệ số trần có thể là giá trị đã thay số → conditional, không ✗', () => {
    expect(verdict(kiem('s = v t + \\frac{1}{2} a t'))).toBe('conditional_mismatch')
  })

  it('chữ vừa là biến vừa là đơn vị ("10 m/s" khi đề có biến m) → không đoán', () => {
    expect(verdict(kiem('v = 10 m/s'))).toBe('conditional_mismatch')
    // Đề KHÔNG có biến m, s → m/s là đơn vị → chắc chắn.
    expect(verdict(kiem('v = 10 m/s', { v: 'm/s', a: 'm/s^2', t: 's' }))).toBe('consistent')
  })

  it('chỉ số dưới chưa khai (v_1 khi đề chỉ khai v): coi cùng thứ nguyên NHƯNG có điều kiện', () => {
    expect(kiem('v = v_1 + a t')).toMatchObject({
      verdict: 'consistent',
      assumedCoefficients: true,
    })
    expect(verdict(kiem('v = v_1 t'))).toBe('conditional_mismatch')
  })
})

describe('checkPhysicsStep — không đoán: unsupported có lý do', () => {
  it('thiếu bảng biến (tương thích ngược với đề cũ)', () => {
    expect(checkPhysicsStep('v = a t', undefined)).toEqual({
      verdict: 'unsupported',
      reason: 'no_variable_table',
    })
    expect(kiem('v = a t', {})).toMatchObject({ reason: 'no_variable_table' })
  })

  it('bảng biến hỏng (đơn vị lạ trong bảng)', () => {
    expect(kiem('v = a t', { v: 'm/s', a: 'furlong' })).toMatchObject({
      reason: 'bad_variable_table',
      detail: 'a: furlong',
    })
  })

  it('đơn vị lạ trong \\text{} và chữ không phải đơn vị', () => {
    expect(kiem('v = 2\\,\\text{furlong}')).toMatchObject({
      reason: 'unknown_unit',
      detail: 'furlong',
    })
    expect(kiem('v = 2x \\text{ hoặc } 3')).toMatchObject({ reason: 'unknown_unit' })
  })

  it('ký hiệu lạ / ký hiệu mơ hồ (k, R) chưa khai', () => {
    expect(kiem('v = q t')).toMatchObject({ reason: 'unknown_symbol', detail: 'q' })
    expect(kiem('F = k x')).toMatchObject({ reason: 'ambiguous_symbol' })
    expect(kiem('U = I R', { U: 'V', I: 'A' })).toMatchObject({ reason: 'ambiguous_symbol' })
    // Khai rồi thì kiểm được.
    expect(verdict(kiem('F = k x', { F: 'N', k: 'N/m', x: 'm' }))).toBe('consistent')
    expect(verdict(kiem('U = I R', { U: 'V', I: 'A', R: '\\Omega' }))).toBe('consistent')
  })

  it('chỉ toàn số / không có dấu bằng / số mũ là biến / LaTeX lạ', () => {
    expect(kiem('v = 2 \\cdot 5')).toMatchObject({ reason: 'numeric_only' })
    expect(kiem('v = 0')).toMatchObject({ reason: 'numeric_only' })
    expect(kiem('a t')).toMatchObject({ reason: 'not_equation' })
    expect(kiem('x = t^n')).toMatchObject({ reason: 'symbolic_exponent', detail: 'n' })
    expect(kiem('v = \\int a\\,dt')).toMatchObject({ reason: 'unknown_notation' })
    expect(kiem('v = a t @')).toMatchObject({ reason: 'unknown_notation' })
  })

  it('trần độ dài / độ sâu → too_complex, không treo', () => {
    expect(kiem(`v = ${'a'.repeat(1001)}`)).toMatchObject({ reason: 'too_complex' })
    expect(kiem(`v = ${'('.repeat(80)}a t${')'.repeat(80)}`)).toMatchObject({
      reason: 'too_complex',
    })
  })
})

describe('checkPhysicsStep — bất biến', () => {
  it('tất định: cùng vào → cùng ra', () => {
    for (const s of ['v = a t^2', 'v = 2t', 'v = a t', 'v = q t']) {
      expect(kiem(s)).toEqual(kiem(s))
    }
  })

  it('bước SAI rõ ràng không bao giờ ra "consistent"', () => {
    for (const s of ['v = a t^2', 's = v t + a t', 'E = m c', 'x = A \\cos(t)', 'v = \\sqrt{g}']) {
      expect(verdict(kiem(s))).toBe('mismatch')
    }
  })
})

describe('checkPhysicsStep — dòng lời giải THẬT của sách (packages/subject-physics, lối SGK)', () => {
  // Trích nguyên văn bước tính trong `workedExample.steps` của bài học Vật lí 10 (bỏ phần lời).
  // Đây là bước ĐÚNG: bộ kiểm không được báo lệch (dù viết số trần + đơn vị trong ngoặc ở cuối).
  it.each([
    [
      'a = (v_t - v_o) / Δt = (25 - 10) / 5 = 15 / 5 = 3 (m/s²)',
      { a: 'm/s^2', v_t: 'm/s', v_o: 'm/s', Δt: 's' },
    ],
    ['v = s / t = 0,80 / 0,40 = 2,0 (m/s)', { v: 'm/s', s: 'm', t: 's' }],
    ['v₁₃ = v₁₂ + v₂₃ = 4 + 1,5 = 5,5 (m/s)', { v_13: 'm/s', 'v_{12}': 'm/s', 'v₂₃': 'm/s' }],
    ['Δd = d₂ - d₁ = 10 - 2 = 8 m', { d: 'm', d_1: 'm', d_2: 'm' }],
    ['v = Δd / Δt = 8 / 4 = 2 (m/s)', { v: 'm/s', d: 'm', t: 's' }],
    [
      'd = AC = √(AB² + BC²) = √(4² + 3²) = √25 = 5 (km)',
      { d: 'km', AC: 'km', AB: 'km', BC: 'km' },
    ],
    ['s = AB + BC = 4 + 3 = 7 (km)', { s: 'km', AB: 'km', BC: 'km' }],
  ])('%s → consistent', (step, table) => {
    expect(verdict(kiem(step, table))).toBe('consistent')
  })
})

describe('checkPhysicsStep — dấu đổi GIÁ TRỊ số mũ (hồi quy phát hiện khi viết đợt 0552)', () => {
  it('t^{-1} là s⁻¹ (dấu trong ngoặc nhọn không được rơi mất), 0^{-1} và s/(1 - 1) là chia cho 0', () => {
    const T = { v: 'm/s', t: 's', s: 'm', f: 'Hz' }
    expect(kiem('f = t^{-1}', T)).toMatchObject({ verdict: 'consistent', dimension: 's⁻¹' })
    expect(verdict(kiem('f = t^{1}', T))).toBe('mismatch')
    expect(verdict(kiem('v = s t^{1 - 2}', T))).toBe('consistent')
    expect(verdict(kiem('v = s t^{-(1)}', T))).toBe('consistent')
    expect(kiem('v = 0^{-1}', T)).toEqual({ verdict: 'division_by_zero' })
    expect(kiem('v = s/(1 - 1)', T)).toEqual({ verdict: 'division_by_zero' })
    // ± trong số mũ → không còn MỘT giá trị → không đoán.
    expect(kiem('v = s t^{\\pm 1}', T)).toMatchObject({ reason: 'symbolic_exponent' })
    expect(verdict(kiem('v = a \\cdot -t'))).toBe('consistent')
  })
})

describe('checkPhysicsStep — phủ cú pháp LaTeX/gõ thường', () => {
  const T = {
    v: 'm/s',
    "v'": 'm/s',
    a: 'm/s^2',
    t: 's',
    s: 'm',
    x: 'm',
    m: 'kg',
    y: '',
    '\\alpha': '',
    '\\omega': 'rad/s',
    '\\tau': 's',
  }
  it.each([
    ['y = \\sin^2 \\alpha + \\cos^2\\alpha', 'consistent'],
    ['y = \\log_{10}(x/s)', 'consistent'],
    ['y = \\log_2 x', 'mismatch'],
    ['y = \\operatorname{sin}(\\alpha)', 'consistent'],
    ['y = sin(\\alpha)', 'consistent'], // gõ thường không có "\"
    ['y = sin x', 'mismatch'],
    ['y = \\sin x \\cos x', 'mismatch'], // đối số của sin dừng trước \cos
    ['y = \\sin \\omega t', 'consistent'],
    ['a = \\frac{\\Delta\\omega}{t} \\cdot s', 'consistent'],
    ["v' = a t", 'consistent'],
    ["v'' = a t", 'consistent'], // phẩy trên chưa khai → có điều kiện, vẫn khớp
    ['x = \\vec{v} t', 'consistent'],
    ['x = \\bar v t', 'consistent'],
    ['v = \\frac12 a t', 'consistent'],
    ['x = \\frac a2 t^2', 'consistent'],
    ['x = [v t]', 'consistent'],
    ['v = \\left[ a t \\right]', 'consistent'],
    ['v = \\Big( a t \\Big)', 'consistent'],
    ['v = \\displaystyle a t', 'consistent'],
    ['x = v t \\pm a t^2', 'consistent'],
    ['x = v t \\mp a t', 'mismatch'],
    ['v ≈ a t', 'consistent'],
    ['v \\approx a t^2', 'mismatch'],
    ['v = a t; x = v t', 'consistent'],
    ['v = a t \\\\ x = v', 'mismatch'], // mệnh đề thứ hai lệch
    ['v = a \\times t', 'consistent'],
    ['v = a ÷ t \\cdot t^2', 'consistent'],
    ['v = s \\div t', 'consistent'],
    ['v = a t^-1 \\cdot s', 'mismatch'],
    ['v = 3 \\cdot 10^{-40}\\,\\text{m/s}', 'consistent'],
    ['v = 2\\cdot 10⁻³ \\,\\text{m/s}', 'consistent'],
    ['x = 1{,}5 \\,\\text{km} + 200\\,\\text{m}', 'consistent'],
    ['v = 5\\,\\mathrm{m\\,s^{-1}}', 'consistent'],
    ['v = 5\\,\\text{m}\\cdot\\text{s}^{-1}', 'consistent'],
    ['v = 5\\,\\text{m/s}^{1/2}', 'mismatch'],
    ['x = \\exp(t/\\tau)', 'mismatch'], // m = không thứ nguyên
    ['m = 500\\,\\text{g}', 'consistent'],
    ['v = π a t', 'consistent'],
    ['v = 2 (a t)', 'consistent'],
    ['v = 2 (m + a)', 'mismatch'],
    ['x = v_{\\text{tb}} t', 'consistent'],
    ['y = \\cos 30°', 'consistent'],
    ['y = \\cos 60^\\circ', 'consistent'],
    ['y = \\cos 60^{\\circ}', 'consistent'],
  ])('%s → %s', (step, expected) => {
    expect(verdict(kiem(step, T))).toBe(expected)
  })

  it.each([
    ['v = a_ t', 'unknown_notation'],
    ['v = a_{} t', 'unknown_notation'],
    ['v = a_{t', 'unknown_notation'],
    ['v = \\sqrt[0]{x}', 'unknown_notation'],
    ['v = \\sqrt[x]{x}', 'unknown_notation'],
    ['v = |a| t', 'unknown_notation'],
    ['v = a t \\cdots', 'unknown_notation'],
    ['v = \\pmb{a}', 'unknown_notation'],
    ['y = \\operatorname{foo}(x)', 'unknown_notation'],
    ['v = (a t', 'unknown_notation'],
    ['v = a t)', 'unknown_notation'],
    ['v = \\vec', 'unknown_notation'],
    ['v = a \\cdot', 'unknown_notation'],
    ['v = Δ', 'unknown_notation'],
    ['v = \\Delta', 'unknown_notation'],
    ['v = 5 \\text', 'unknown_unit'],
    ['x = e', 'ambiguous_symbol'],
    ['v = 2,5 (xyz)', 'unknown_symbol'],
    ['W = 10\\,\\text{N} \\cdot 2\\,\\text{m}', 'unknown_symbol'], // W chưa khai
    ['v = \\pi', 'numeric_only'],
  ])('%s → unsupported (%s)', (step, reason) => {
    expect(kiem(step, T)).toMatchObject({ verdict: 'unsupported', reason })
  })

  it('khoá bảng biến không hợp lệ → bad_variable_table; "" / "1" / "-" = không thứ nguyên', () => {
    expect(kiem('v = a t', { v_: 'm' })).toMatchObject({ reason: 'bad_variable_table' })
    expect(kiem('v = a t', { '2v': 'm' })).toMatchObject({ reason: 'bad_variable_table' })
    expect(kiem('v = a t', { v: '', a: '1/s', t: '-' })).toMatchObject({ verdict: 'mismatch' })
    expect(kiem('y = a t', { y: '1', a: '1/s', t: 's' })).toMatchObject({ verdict: 'consistent' })
    const nhieu = Object.fromEntries(Array.from({ length: 65 }, (_, i) => [`x_${i}`, 'm']))
    expect(kiem('v = a t', nhieu)).toMatchObject({ reason: 'too_complex' })
  })

  it('Δ hiển thị đúng phần người học gõ trong phản hồi lệch', () => {
    expect(kiem('v = \\Delta t')).toMatchObject({
      verdict: 'mismatch',
      mismatch: { right: { text: '\\Delta t', dimension: 's' } },
    })
  })
})
