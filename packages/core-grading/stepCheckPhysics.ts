// Kiểm THỨ NGUYÊN một bước giải Vật lí: hai vế (và mọi hạng tử cộng/trừ) có cùng thứ nguyên không.
// Đặc tả: docs/specs/2026-10-09-kiem-thu-nguyen-vat-li.md.
//
// Bộ kiểm này CHỈ chứng minh được một điều kiện CẦN: một bước lệch thứ nguyên chắc chắn sai; một
// bước khớp thứ nguyên CHƯA chắc đúng (`v = 2at` khớp thứ nguyên nhưng sai hệ số). Vì vậy:
//   - `mismatch`               — CHỨNG MINH được lệch (mọi thừa số liên quan đều đã biết thứ nguyên)
//                                → giao diện được nói "✗ Lệch thứ nguyên";
//   - `conditional_mismatch`   — chỉ lệch NẾU coi số không kèm đơn vị là hệ số thuần (`v = 2t` viết
//                                theo lối SGK "đơn vị ghi sau") → KHÔNG được nói ✗, chỉ hỏi lại;
//   - `consistent`             — khớp thứ nguyên → vẫn là "chưa tự kiểm được", KHÔNG BAO GIỜ ✓;
//   - `unsupported`            — thiếu bảng biến của đề, ký hiệu lạ/mơ hồ, đơn vị lạ… → không đoán.
//
// Thứ nguyên của từng biến lấy từ BẢNG BIẾN của đề (`{ v: 'm/s', t: 's' }`); hằng chuẩn (g, c, G…)
// và đơn vị SI + tiền tố lấy từ `dimension.ts`. Số mũ là số hữu tỉ BigInt → không làm tròn.

import {
  AMBIGUOUS_SYMBOLS,
  DIMENSIONLESS,
  PHYSICS_CONSTANTS,
  dimDiv,
  dimEq,
  dimMul,
  dimPow,
  formatDimension,
  isDimensionless,
  isUnitWord,
  parseExponentLiteral,
  parseUnitExpression,
  readSuperscript,
  unitWordDimension,
  type Dimension,
} from './dimension.js'
import {
  StepCheckLimitError,
  ZERO,
  add as ratAdd,
  neg as ratNeg,
  div as ratDiv,
  isZero,
  mul as ratMul,
  rat,
  ONE,
  type Rational,
} from './rational.js'

// ── Kết luận ────────────────────────────────────────────────────────────────

/** Vì sao không kết luận được — để phản hồi nói rõ, không nói chung chung. */
export type PhysicsUnsupportedReason =
  | 'no_variable_table' // đề không khai bảng thứ nguyên biến → không đoán
  | 'bad_variable_table' // bảng biến của đề có đơn vị/ký hiệu không đọc được
  | 'unknown_symbol' // ký hiệu không có trong bảng biến, không phải hằng chuẩn
  | 'ambiguous_symbol' // ký hiệu nhiều nghĩa (k, h, e, R…) hoặc tách được nhiều cách
  | 'unknown_unit' // `\text{…}` không phải đơn vị đọc được
  | 'unknown_notation' // LaTeX/ký tự bộ đọc không hiểu
  | 'not_equation' // không có dấu `=`
  | 'symbolic_exponent' // số mũ là biến, cơ số lại có thứ nguyên
  | 'numeric_only' // chỉ toàn số không đơn vị → không có thứ nguyên nào để so
  | 'too_complex' // vượt trần độ dài/độ sâu/độ lớn

export type DimensionSide = { readonly text: string; readonly dimension: string }

export type DimensionMismatch = {
  /** `sum`: hai hạng tử cộng/trừ · `equation`: hai vế · `function_argument`/`exponent`: phải không thứ nguyên. */
  readonly context: 'sum' | 'equation' | 'function_argument' | 'exponent'
  readonly functionName?: string
  readonly left: DimensionSide
  readonly right: DimensionSide
}

export type PhysicsStepCheck =
  | { verdict: 'consistent'; dimension: string; assumedCoefficients: boolean }
  | { verdict: 'mismatch'; mismatch: DimensionMismatch }
  | { verdict: 'conditional_mismatch'; mismatch: DimensionMismatch; doubts: readonly string[] }
  | { verdict: 'division_by_zero' }
  | { verdict: 'unsupported'; reason: PhysicsUnsupportedReason; detail?: string }

/** Bảng thứ nguyên biến của đề: tên ký hiệu → đơn vị (`'m/s'`, `'m/s^2'`, `''` = không thứ nguyên). */
export type PhysicsVariableTable = Readonly<Record<string, string>>

// ── Lỗi nội bộ để thoát sớm khỏi đệ quy ─────────────────────────────────────

class Unsupported extends Error {
  constructor(
    readonly reason: PhysicsUnsupportedReason,
    readonly detail?: string,
  ) {
    super(reason)
  }
}
class DivisionByZero extends Error {}
class ProvenMismatch extends Error {
  constructor(readonly mismatch: DimensionMismatch) {
    super('mismatch')
  }
}

// ── Giá trị trung gian ──────────────────────────────────────────────────────

/**
 * Loại của một giá trị khi suy thứ nguyên:
 * - `free`  : chỉ có số trần (không ký hiệu, không đơn vị) — thứ nguyên NGẦM, không so được;
 * - `unit`  : chỉ có đơn vị (`\text{m/s}`);
 * - `known` : thứ nguyên đã CHẮC CHẮN (ký hiệu của đề, hằng chuẩn, số kèm đơn vị);
 * - `cond`  : thứ nguyên phụ thuộc một giả định (số trần nhân với ký hiệu, ký hiệu vừa là biến vừa
 *             là đơn vị…) — lệch ở đây KHÔNG được báo ✗.
 */
type Kind = 'free' | 'unit' | 'known' | 'cond'

type Val = {
  readonly dim: Dimension
  readonly kind: Kind
  /** Giá trị chính xác — chỉ có với `free` khi tính được (để bắt chia cho 0 và đọc số mũ). */
  readonly value: Rational | null
  /** Một con số đơn lẻ (kể cả dạng `2\cdot10^{3}`). */
  readonly literal: boolean
  readonly hasLiteral: boolean
  readonly unitNamedVars: readonly string[]
  /** Đơn vị gõ KHÔNG trong `\text{}` (`10 m/s`) — chỉ hợp lệ khi đi kèm một con số. */
  readonly plainUnits: readonly string[]
  readonly doubts: readonly string[]
  readonly text: string
}

const MAX_TEXT = 40
const MAX_DOUBTS = 3
const MAX_DEPTH = 60
const MAX_EXPONENT_PART = 64n

function shorten(text: string): string {
  const t = text.trim().replace(/\s+/g, ' ')
  return t.length > MAX_TEXT ? `${t.slice(0, MAX_TEXT - 1)}…` : t
}

function mergeList(a: readonly string[], b: readonly string[]): string[] {
  const out = [...a]
  for (const x of b) if (!out.includes(x)) out.push(x)
  return out
}

function freeNumber(value: Rational | null, text: string, literal: boolean): Val {
  return {
    dim: DIMENSIONLESS,
    kind: 'free',
    value,
    literal,
    hasLiteral: true,
    unitNamedVars: [],
    plainUnits: [],
    doubts: [],
    text,
  }
}

function plainVal(dimension: Dimension, kind: Kind, text: string, extra: Partial<Val> = {}): Val {
  return {
    dim: dimension,
    kind,
    value: null,
    literal: false,
    hasLiteral: false,
    unitNamedVars: [],
    plainUnits: [],
    doubts: [],
    text,
    ...extra,
  }
}

const side = (v: Val): DimensionSide => ({
  // `{-t}` (nhóm số mũ) → `-t`: hiển thị đúng phần người học gõ, không kèm ngoặc nhọn LaTeX.
  text: shorten(v.text.trim().replace(/^\{([^{}]*)\}$/, '$1')),
  dimension: formatDimension(v.dim),
})

const isSure = (v: Val): boolean => v.kind === 'known' || v.kind === 'unit'

// ── Bảng ký hiệu ────────────────────────────────────────────────────────────

const GREEK: Readonly<Record<string, string>> = {
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  varepsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  vartheta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  rho: 'ρ',
  sigma: 'σ',
  tau: 'τ',
  phi: 'φ',
  varphi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
  Gamma: 'Γ',
  Theta: 'Θ',
  Lambda: 'Λ',
  Phi: 'Φ',
  Psi: 'Ψ',
  Omega: 'Ω',
  hbar: 'ħ',
}

/** Chữ Hy Lạp Unicode được nhận làm ký hiệu (Δ là tiền tố "độ biến thiên", Σ/Π là phép toán). */
const GREEK_CHAR = /^[α-ωΓΘΛΦΨΩµħϕϑ]/u
const GREEK_NORMALIZE: Readonly<Record<string, string>> = { µ: 'μ', ϕ: 'φ', ϑ: 'θ' }

const FUNCTIONS = new Set([
  'sin',
  'cos',
  'tan',
  'tg',
  'cot',
  'cotg',
  'arcsin',
  'arccos',
  'arctan',
  'sinh',
  'cosh',
  'tanh',
  'exp',
  'ln',
  'log',
  'lg',
])

/** Lệnh "trang trí" chỉ đổi cách viết, không đổi đại lượng: `\vec{v}`, `\bar{v}`. */
const DECORATIONS = new Set([
  'vec',
  'bar',
  'overline',
  'hat',
  'widehat',
  'overrightarrow',
  'mathbf',
  'boldsymbol',
  'mathit',
])

const UNIT_COMMANDS = new Set(['text', 'mathrm', 'textrm', 'mbox', 'rm'])

const FRACTION_COMMANDS = new Set(['frac', 'dfrac', 'tfrac'])

/** Lệnh LaTeX MỞ ĐẦU được một thừa số (để nhận phép nhân ngầm). */
function commandStartsFactor(name: string): boolean {
  return (
    FRACTION_COMMANDS.has(name) ||
    UNIT_COMMANDS.has(name) ||
    DECORATIONS.has(name) ||
    FUNCTIONS.has(name) ||
    name in GREEK ||
    ['sqrt', 'pi', 'Delta', 'operatorname'].includes(name)
  )
}

const SUBSCRIPT_CHARS: Readonly<Record<string, string>> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
  ₐ: 'a',
  ₑ: 'e',
  ₒ: 'o',
  ₓ: 'x',
  ₕ: 'h',
  ₖ: 'k',
  ₗ: 'l',
  ₘ: 'm',
  ₙ: 'n',
  ₚ: 'p',
  ₛ: 's',
  ₜ: 't',
}

type SymbolToken = {
  /** Phần chữ chính: `v`, `mgh`, `ω`. */
  readonly run: string
  readonly sub: string | null
  readonly primes: string
  readonly delta: boolean
}

const fullName = (t: { run: string; sub: string | null; primes: string }): string =>
  t.run + (t.sub !== null ? `_${t.sub}` : '') + t.primes

// ── Bộ đọc ──────────────────────────────────────────────────────────────────

type Conditional = { mismatch: DimensionMismatch; doubts: readonly string[] }

class Parser {
  private pos = 0
  private depth = 0
  conditional: Conditional | null = null
  comparisons = 0
  assumed = false
  sides = 0
  /** Thứ nguyên chung của các vế (khi có ít nhất một vế không phải số trần). */
  resultDim: Dimension | null = null

  constructor(
    private readonly src: string,
    private readonly symbols: ReadonlyMap<string, Dimension>,
  ) {}

  // ── tiện ích quét ──

  private ch(offset = 0): string {
    return this.src.charAt(this.pos + offset)
  }

  private rest(): string {
    return this.src.slice(this.pos)
  }

  /** Lệnh LaTeX tại vị trí hiện tại (không tiêu thụ), vd `frac` cho `\frac`. */
  private peekCommand(): string | null {
    const m = /^\\([a-zA-Z]+)/.exec(this.rest())
    return m === null ? null : (m[1] ?? null)
  }

  private skipSpace(): void {
    for (;;) {
      const r = this.rest()
      const m =
        /^(?:\s+|~|\\[,;:! ]|\\q?quad(?![a-zA-Z])|\\displaystyle(?![a-zA-Z])|\\(?:left|right|big|Big|bigg|Bigg)(?![a-zA-Z])\.?)/.exec(
          r,
        )
      if (m === null || m[0].length === 0) return
      this.pos += m[0].length
    }
  }

  private eat(token: string): boolean {
    this.skipSpace()
    if (this.rest().startsWith(token)) {
      // `\cdot` không được ăn nhầm phần đầu `\cdots`
      if (/^\\[a-zA-Z]+$/.test(token) && /[a-zA-Z]/.test(this.src.charAt(this.pos + token.length)))
        return false
      this.pos += token.length
      return true
    }
    return false
  }

  private enter(): void {
    this.depth++
    if (this.depth > MAX_DEPTH) throw new Unsupported('too_complex')
  }

  // ── ghi nhận lệch có điều kiện ──

  private recordConditional(mismatch: DimensionMismatch, doubts: readonly string[]): void {
    this.conditional ??= { mismatch, doubts: doubts.slice(0, MAX_DOUBTS) }
  }

  /** Đối số hàm siêu việt / số mũ phải KHÔNG thứ nguyên. */
  private requireDimensionless(
    v: Val,
    context: 'function_argument' | 'exponent',
    functionName?: string,
  ): void {
    if (isDimensionless(v.dim) || v.kind === 'free') return
    const mismatch: DimensionMismatch = {
      context,
      ...(functionName !== undefined ? { functionName } : {}),
      left: side(v),
      right: { text: '', dimension: formatDimension(DIMENSIONLESS) },
    }
    if (isSure(v)) throw new ProvenMismatch(mismatch)
    this.recordConditional(mismatch, v.doubts)
  }

  /**
   * Các hạng tử của một tổng (hoặc các vế của một đẳng thức) phải CÙNG thứ nguyên. Lệch giữa hai
   * giá trị đã chắc chắn → chứng minh được; lệch có dính giả định → chỉ ghi nhận có điều kiện.
   */
  private combineAll(items: Val[], context: 'sum' | 'equation', text: string): Val {
    const ref = items.find(isSure)
    for (const it of items) {
      if (it === ref || !isSure(it) || ref === undefined) continue
      if (!dimEq(it.dim, ref.dim)) {
        throw new ProvenMismatch({ context, left: side(ref), right: side(it) })
      }
    }
    const firstCond = items.find((it) => it.kind === 'cond')
    const target = ref ?? firstCond
    for (const it of items) {
      if (it.kind !== 'cond' || it === target || target === undefined) continue
      if (!dimEq(it.dim, target.dim)) {
        const [left, right] =
          items.indexOf(it) < items.indexOf(target) ? [it, target] : [target, it]
        this.recordConditional(
          { context, left: side(left), right: side(right) },
          mergeList(target.doubts, it.doubts),
        )
      }
    }
    const compared = items.filter((it) => it.kind !== 'free')
    if (compared.some((it) => it.kind === 'cond')) this.assumed = true
    if (context === 'equation' && compared.length >= 2) this.comparisons++
    const merged = {
      hasLiteral: items.some((it) => it.hasLiteral),
      unitNamedVars: items.reduce<string[]>((acc, it) => mergeList(acc, it.unitNamedVars), []),
      plainUnits: items.reduce<string[]>((acc, it) => mergeList(acc, it.plainUnits), []),
    }
    if (ref !== undefined) return plainVal(ref.dim, 'known', text, merged)
    if (firstCond !== undefined) {
      const doubts = items.reduce<string[]>((acc, it) => mergeList(acc, it.doubts), [])
      return plainVal(firstCond.dim, 'cond', text, { ...merged, doubts })
    }
    // Toàn số trần: giữ GIÁ TRỊ tổng (cho số mũ `^{1 + 1}`, mẫu `1 - 1`) khi tính được.
    const values = items.map((it) => it.value)
    const sum = values.every((v): v is Rational => v !== null)
      ? values.reduce<Rational>((acc, v) => ratAdd(acc, v), ZERO)
      : null
    return freeNumber(sum, text, false)
  }

  /** Tích/thương hai giá trị — nơi quyết định một kết quả là "chắc chắn" hay "có điều kiện". */
  private combineProduct(a: Val, b: Val, op: '*' | '/', text: string): Val {
    if (op === '/' && b.kind === 'free' && b.value !== null && isZero(b.value)) {
      throw new DivisionByZero()
    }
    const dimension = op === '*' ? dimMul(a.dim, b.dim) : dimDiv(a.dim, b.dim)
    let doubts = mergeList(a.doubts, b.doubts)
    let kind: Kind
    let value: Rational | null = null
    const free = a.kind === 'free' ? a : b.kind === 'free' ? b : null
    const other = free === a ? b : a
    if (a.kind === 'free' && b.kind === 'free') {
      kind = 'free'
      if (a.value !== null && b.value !== null) {
        value = op === '*' ? ratMul(a.value, b.value) : ratDiv(a.value, b.value)
      }
    } else if (free !== null && other.kind === 'unit') {
      // `9{,}8\,\text{m/s}^2`: MỘT con số kèm đơn vị là một đại lượng có thứ nguyên chắc chắn.
      kind = free.literal ? 'known' : 'cond'
      if (!free.literal) doubts = mergeList(doubts, [`số “${shorten(free.text)}” không kèm đơn vị`])
    } else if (a.kind === 'unit' && b.kind === 'unit') {
      kind = 'unit'
    } else if (free !== null) {
      // `2t`: số trần nhân ký hiệu — theo SGK có thể là giá trị đã thay số, đơn vị ghi sau.
      kind = 'cond'
      doubts = mergeList(doubts, [`số “${shorten(free.text)}” không kèm đơn vị`])
    } else if (a.kind === 'cond' || b.kind === 'cond') {
      kind = 'cond'
    } else {
      kind = 'known'
    }
    const hasLiteral = a.hasLiteral || b.hasLiteral
    const hasUnit =
      a.kind === 'unit' || b.kind === 'unit' || a.plainUnits.length + b.plainUnits.length > 0
    const unitNamedVars = mergeList(a.unitNamedVars, b.unitNamedVars)
    const clash = (names: readonly string[]) =>
      names.map((n) => `“${n}” vừa là ký hiệu đại lượng vừa là ký hiệu đơn vị`)
    if (free !== null && free.literal && other.unitNamedVars.length > 0) {
      // `10 m` khi đề có biến `m`: mét hay khối lượng? Không đoán.
      doubts = mergeList(doubts, clash(other.unitNamedVars))
    } else if (kind === 'known' && hasUnit && unitNamedVars.length > 0) {
      // `2{,}0 m/s` khi đề có biến `s`: chữ `s` là giây hay quãng đường? Không đoán.
      kind = 'cond'
      doubts = mergeList(doubts, clash(unitNamedVars))
    }
    return {
      dim: dimension,
      kind,
      value,
      literal: false,
      hasLiteral,
      unitNamedVars,
      plainUnits: mergeList(a.plainUnits, b.plainUnits),
      doubts,
      text,
    }
  }

  /** Luỹ thừa với số mũ đã đọc. */
  private applyPower(base: Val, exponent: Val, text: string): Val {
    this.requireDimensionless(exponent, 'exponent')
    if (exponent.kind !== 'free' || exponent.value === null) {
      if (isDimensionless(base.dim)) return { ...base, value: null, literal: false, text }
      throw new Unsupported('symbolic_exponent', shorten(exponent.text))
    }
    return this.applyRationalPower(base, exponent.value, text)
  }

  private applyRationalPower(base: Val, r: Rational, text: string): Val {
    const abs = (x: bigint) => (x < 0n ? -x : x)
    if (abs(r.n) > MAX_EXPONENT_PART || r.d > MAX_EXPONENT_PART)
      throw new Unsupported('too_complex')
    let value: Rational | null = null
    if (base.kind === 'free' && base.value !== null && r.d === 1n && abs(r.n) <= 32n) {
      if (isZero(base.value)) {
        if (r.n < 0n) throw new DivisionByZero()
        value = r.n === 0n ? null : base.value
      } else {
        let acc: Rational = ONE
        for (let i = 0n; i < abs(r.n); i++) acc = ratMul(acc, base.value)
        value = r.n < 0n ? ratDiv(ONE, acc) : acc
      }
    }
    return { ...base, dim: dimPow(base.dim, r), value, literal: false, text }
  }

  // ── ngữ pháp ──

  /** Toàn bộ một mệnh đề: các vế nối bằng `=`/`≈`. */
  parseRelation(): void {
    const start = this.pos
    const sides: Val[] = [this.parseExpr()]
    for (;;) {
      if (this.eat('=') || this.eat('≈') || this.eat('\\approx') || this.eat('\\simeq')) {
        sides.push(this.parseExpr())
        continue
      }
      break
    }
    this.skipSpace()
    if (this.pos < this.src.length) {
      throw new Unsupported('unknown_notation', shorten(this.src.slice(this.pos)))
    }
    this.sides = sides.length
    if (sides.length >= 2) {
      const combined = this.combineAll(sides, 'equation', this.src.slice(start))
      this.resultDim = combined.kind === 'free' ? null : combined.dim
    }
  }

  /** Tổng/hiệu các hạng tử. */
  private parseExpr(): Val {
    this.enter()
    this.skipSpace()
    const start = this.pos
    const terms: Val[] = []
    // Dấu không đổi thứ nguyên nhưng ĐỔI GIÁ TRỊ — cần cho số mũ `t^{-1}` và phát hiện chia cho 0.
    let sign: Sign = this.eatSign() ?? 1
    for (;;) {
      const term = this.parseTerm()
      this.checkPlainUnits(term)
      terms.push(withSign(term, sign))
      const next = this.eatSign()
      if (next === null) break
      sign = next
    }
    this.depth--
    const text = this.src.slice(start, this.pos)
    const only = terms[0]
    if (terms.length === 1 && only !== undefined) return { ...only, text }
    return this.combineAll(terms, 'sum', text)
  }

  /** Dấu cộng/trừ (cả `±`, cho giá trị 0 = "không xác định một giá trị"). Không có dấu → null. */
  private eatSign(): Sign | null {
    this.skipSpace()
    const c = this.ch()
    if (c === '+' || c === '-' || c === '−' || c === '±' || c === '∓') {
      this.pos++
      return c === '+' ? 1 : c === '-' || c === '−' ? -1 : 0
    }
    return this.eat('\\pm') || this.eat('\\mp') ? 0 : null
  }

  /** Đơn vị gõ thường (`m`, `s`) mà hạng tử không có con số nào → thực ra là ký hiệu lạ. */
  private checkPlainUnits(v: Val): void {
    const name = v.plainUnits[0]
    if (name === undefined || v.hasLiteral) return
    throw new Unsupported(name in AMBIGUOUS_SYMBOLS ? 'ambiguous_symbol' : 'unknown_symbol', name)
  }

  /** Tích/thương các thừa số, kể cả phép nhân ngầm (`2at`, `m g h`). */
  private parseTerm(): Val {
    this.skipSpace()
    const start = this.pos
    let acc = this.parseQuantity()
    for (;;) {
      let op: '*' | '/' | null = null
      if (
        this.eat('\\cdot') ||
        this.eat('\\times') ||
        this.eat('*') ||
        this.eat('·') ||
        this.eat('×')
      ) {
        op = '*'
      } else if (this.eat('/') || this.eat('÷') || this.eat('\\div')) {
        op = '/'
      } else if (this.canStartFactor()) {
        // Lối SGK: "= 2{,}5 (m/s)" — đơn vị ghi trong ngoặc ở CUỐI vế, sau con số.
        if (acc.kind === 'free') {
          const annotation = this.tryUnitAnnotation()
          if (annotation !== null) {
            acc = { ...annotation, hasLiteral: true, text: this.src.slice(start, this.pos) }
            continue
          }
        }
        op = '*'
      }
      if (op === null) break
      const rhs = this.parseQuantity()
      acc = this.combineProduct(acc, rhs, op, this.src.slice(start, this.pos))
    }
    return { ...acc, text: this.src.slice(start, this.pos) }
  }

  /**
   * Một thừa số; nếu là MỘT con số mà ngay sau là đơn vị (`3\,\text{m/s}`, `3 m`) thì gộp thành
   * một đại lượng — để `2\,\text{kg} \cdot 3\,\text{m/s}` không bị đọc thành `(2 kg · 3) · m/s`.
   */
  private parseQuantity(): Val {
    const start = this.pos
    const v = this.parseSignedPower()
    if (!v.literal || !this.canStartFactor()) return v
    const save = this.pos
    try {
      const next = this.parsePower()
      if (next.kind === 'unit')
        return this.combineProduct(v, next, '*', this.src.slice(start, this.pos))
    } catch (err) {
      if (!(err instanceof Unsupported)) throw err
    }
    this.pos = save
    return v
  }

  /** Thừa số có thể mang dấu (`a \cdot -b`). Dấu không đổi thứ nguyên. */
  private parseSignedPower(): Val {
    this.skipSpace()
    const c = this.ch()
    if (c === '-' || c === '+' || c === '−') {
      this.pos++
      return withSign(this.parsePower(), c === '+' ? 1 : -1)
    }
    return this.parsePower()
  }

  private canStartFactor(): boolean {
    this.skipSpace()
    const c = this.ch()
    if (c === '') return false
    if (/[0-9A-Za-z([{√Δπ]/.test(c) || GREEK_CHAR.test(c)) return true
    if (c === '\\') {
      const cmd = this.peekCommand()
      return cmd !== null && commandStartsFactor(cmd)
    }
    return false
  }

  /**
   * Thử đọc `(m/s)` ngay sau một con số, ở CUỐI vế, như MỘT đơn vị. Không phải thì trả null và
   * KHÔNG tiêu thụ gì (để `2(m + M)` vẫn đọc thành phép nhân).
   */
  private tryUnitAnnotation(): Val | null {
    if (this.ch() !== '(') return null
    const close = this.src.indexOf(')', this.pos)
    if (close < 0) return null
    const content = this.src.slice(this.pos + 1, close)
    const after = this.src.slice(close + 1).trimStart()
    const atSideEnd =
      after === '' || after.startsWith('=') || after.startsWith('≈') || after.startsWith('\\approx')
    if (!atSideEnd || !/\p{L}/u.test(content)) return null
    const parsed = parseUnitExpression(content)
    if (!parsed.ok) return null
    const startPos = this.pos
    this.pos = close + 1
    const words = content.match(/\p{L}+/gu) ?? []
    const clash = words.filter((w) => this.symbols.has(w))
    const text = this.src.slice(startPos, this.pos)
    return plainVal(parsed.dim, clash.length > 0 ? 'cond' : 'known', text, {
      doubts:
        clash.length > 0 ? [`“(${content.trim()})” có thể là đơn vị hoặc là biến của đề`] : [],
    })
  }

  /** Cơ số + các số mũ/độ phía sau. */
  private parsePower(): Val {
    const start = this.pos
    let base = this.parsePrimary()
    for (;;) {
      const sup = readSuperscript(this.src, this.pos)
      if (sup !== null) {
        this.pos = sup[1]
        base = this.applyRationalPower(base, sup[0], this.src.slice(start, this.pos))
        continue
      }
      if (this.ch() === '°') {
        this.pos++
        base = this.degree(base, start)
        continue
      }
      if (this.ch() === "'") {
        this.pos++
        continue
      }
      const save = this.pos
      this.skipSpace()
      if (this.ch() !== '^') {
        this.pos = save
        break
      }
      this.pos++
      this.skipSpace()
      if (/^(?:\\circ(?![a-zA-Z])|\{\s*\\circ\s*\})/.test(this.rest())) {
        this.pos += (/^(?:\\circ|\{\s*\\circ\s*\})/.exec(this.rest())?.[0] ?? '').length
        base = this.degree(base, start)
        continue
      }
      const exponent = this.parseExponentGroup()
      base = this.applyPower(base, exponent, this.src.slice(start, this.pos))
    }
    return base
  }

  /** `30°`, `30^\circ` — góc, không thứ nguyên. */
  private degree(base: Val, start: number): Val {
    return plainVal(DIMENSIONLESS, 'known', this.src.slice(start, this.pos), {
      hasLiteral: base.hasLiteral,
    })
  }

  /** Số mũ sau `^`: `{…}`, `-1`, `2`, hoặc một thừa số. */
  private parseExponentGroup(): Val {
    this.skipSpace()
    if (this.ch() === '{') return this.parseGroup('{', '}')
    const m = /^[+\-−]?\d+/.exec(this.rest())
    if (m !== null) {
      this.pos += m[0].length
      const v = parseExponentLiteral(m[0].slice(0, 4))
      if (v === null || m[0].length > 4) throw new Unsupported('too_complex')
      return freeNumber(v, m[0], true)
    }
    return this.parsePrimary()
  }

  private parseGroup(open: string, close: string): Val {
    const start = this.pos
    if (this.ch() !== open) throw new Unsupported('unknown_notation', open)
    this.pos++
    const inner = this.parseExpr()
    this.skipSpace()
    if (this.ch() !== close) throw new Unsupported('unknown_notation', shorten(this.rest()) || open)
    this.pos++
    return { ...inner, literal: false, text: this.src.slice(start, this.pos) }
  }

  private parsePrimary(): Val {
    this.enter()
    try {
      return this.parsePrimaryInner()
    } finally {
      this.depth--
    }
  }

  private parsePrimaryInner(): Val {
    this.skipSpace()
    const c = this.ch()
    if (c === '') throw new Unsupported('unknown_notation', '…')
    if (/[0-9]/.test(c)) return this.parseNumber()
    if (c === '(') return this.parseGroup('(', ')')
    if (c === '[') return this.parseGroup('[', ']')
    if (c === '{') return this.parseGroup('{', '}')
    if (c === '√') {
      const start = this.pos
      this.pos++
      const arg = this.parsePrimary()
      return this.applyRationalPower(arg, rat(1n, 2n), this.src.slice(start, this.pos))
    }
    if (c === 'π') {
      this.pos++
      return freeNumber(null, 'π', false)
    }
    if (c === 'Δ') {
      this.pos++
      return this.parseSymbol(true, this.pos - 1)
    }
    if (/[A-Za-z]/.test(c) || GREEK_CHAR.test(c)) return this.parseSymbol(false, this.pos)
    if (c === '\\') return this.parseCommand()
    throw new Unsupported('unknown_notation', c)
  }

  /** Số thập phân (dấu phẩy hoặc chấm, cả `9{,}8`) + tuỳ chọn `\cdot 10^{k}`. */
  private parseNumber(): Val {
    const start = this.pos
    const m = /^(\d+)(?:(?:\{,\}|[.,])(\d+))?/.exec(this.rest())
    if (m === null) throw new Unsupported('unknown_notation', this.ch())
    this.pos += m[0].length
    const intPart = m[1] ?? '0'
    const fracPart = m[2] ?? ''
    let value: Rational | null = rat(BigInt(intPart + fracPart), 10n ** BigInt(fracPart.length))
    // Dạng khoa học: 2\cdot10^{3}, 1,5 × 10⁻³ — gộp vào CÙNG một con số.
    const sci =
      /^\s*(?:\\cdot|\\times|·|×|\*)\s*10\s*(?:\^\s*(?:\{\s*([+\-−]?\d{1,4})\s*\}|([+\-−]?\d))|([⁻]?[⁰¹²³⁴⁵⁶⁷⁸⁹]{1,3}))/.exec(
        this.rest(),
      )
    if (sci !== null) {
      this.pos += sci[0].length
      const raw = sci[1] ?? sci[2]
      const k =
        raw !== undefined
          ? parseExponentLiteral(raw)
          : (readSuperscript(sci[3] ?? '', 0)?.[0] ?? null)
      if (k === null) throw new Unsupported('unknown_notation', sci[0].trim())
      const kn = Number(k.n)
      value = isZero(value) ? value : Math.abs(kn) <= 30 ? ratMul(value, pow10(kn)) : null
    }
    return freeNumber(value, this.src.slice(start, this.pos), true)
  }

  private parseCommand(): Val {
    const start = this.pos
    const name = this.peekCommand()
    if (name === null) throw new Unsupported('unknown_notation', shorten(this.rest()))
    this.pos += name.length + 1
    if (FRACTION_COMMANDS.has(name)) {
      const numerator = this.parseFracArgument()
      const denominator = this.parseFracArgument()
      return this.combineProduct(numerator, denominator, '/', this.src.slice(start, this.pos))
    }
    if (name === 'sqrt') {
      let index: Rational = rat(2n)
      this.skipSpace()
      if (this.ch() === '[') {
        const close = this.src.indexOf(']', this.pos)
        const n = close < 0 ? null : parseExponentLiteral(this.src.slice(this.pos + 1, close))
        if (n === null || n.d !== 1n || n.n < 2n)
          throw new Unsupported('unknown_notation', '\\sqrt[…]')
        index = n
        this.pos = close + 1
      }
      const arg = this.parseFracArgument()
      return this.applyRationalPower(arg, ratDiv(ONE, index), this.src.slice(start, this.pos))
    }
    if (UNIT_COMMANDS.has(name)) return this.parseUnitGroup(start)
    if (name === 'operatorname') {
      this.skipSpace()
      const m = /^\{\s*([a-zA-Z]+)\s*\}/.exec(this.rest())
      if (m === null || !FUNCTIONS.has(m[1] ?? ''))
        throw new Unsupported('unknown_notation', '\\operatorname')
      this.pos += m[0].length
      return this.parseFunction(m[1] ?? '', start)
    }
    if (FUNCTIONS.has(name)) return this.parseFunction(name, start)
    if (name === 'pi') return freeNumber(null, '\\pi', false)
    if (name === 'Delta') return this.parseSymbol(true, start)
    if (DECORATIONS.has(name)) {
      const inner = this.parseFracArgument()
      return { ...inner, text: this.src.slice(start, this.pos) }
    }
    const greek = GREEK[name]
    if (greek !== undefined) return this.resolveSymbol(this.readSymbolTail(greek, false), start)
    throw new Unsupported('unknown_notation', `\\${name}`)
  }

  /** Đối số của `\frac`/`\sqrt`/`\vec`: `{…}` hoặc MỘT ký tự (`\frac12`). */
  private parseFracArgument(): Val {
    this.skipSpace()
    if (this.ch() === '{') return this.parseGroup('{', '}')
    const c = this.ch()
    if (/[0-9]/.test(c)) {
      this.pos++
      return freeNumber(rat(BigInt(c)), c, true)
    }
    return this.parsePrimary()
  }

  /** `\text{m/s}` (+ số mũ viết ngoài: `\text{m/s}^2` → m/s²). */
  private parseUnitGroup(start: number): Val {
    this.skipSpace()
    if (this.ch() !== '{') throw new Unsupported('unknown_unit', shorten(this.rest()))
    const end = matchBrace(this.src, this.pos)
    if (end < 0) throw new Unsupported('unknown_notation', '{')
    const content = this.src.slice(this.pos + 1, end)
    this.pos = end + 1
    let trailing: Rational | undefined
    const sup = readSuperscript(this.src, this.pos)
    const exp = /^\s*\^\s*(?:\{\s*([+\-−]?\d{1,3}(?:\/\d{1,3})?)\s*\}|([+\-−]?\d))/.exec(
      this.rest(),
    )
    if (sup !== null) {
      trailing = sup[0]
      this.pos = sup[1]
    } else if (exp !== null) {
      const v = parseExponentLiteral(exp[1] ?? exp[2] ?? '')
      if (v === null) throw new Unsupported('unknown_notation', exp[0].trim())
      trailing = v
      this.pos += exp[0].length
    }
    const parsed = parseUnitExpression(content, trailing)
    if (!parsed.ok) throw new Unsupported('unknown_unit', shorten(parsed.bad))
    return plainVal(parsed.dim, 'unit', this.src.slice(start, this.pos))
  }

  /** `\sin x`, `\cos(\omega t)`, `\ln\frac{a}{b}`, `\log_{10}`, `\sin^2 x`. */
  private parseFunction(name: string, start: number): Val {
    this.skipSpace()
    if (this.ch() === '_') {
      this.pos++
      this.skipSpace()
      const m = /^(?:\{\s*\d+\s*\}|\d)/.exec(this.rest())
      if (m === null) throw new Unsupported('unknown_notation', `\\${name}_`)
      this.pos += m[0].length
    }
    this.skipSpace()
    if (this.ch() === '^') {
      this.pos++
      const power = this.parseExponentGroup()
      this.requireDimensionless(power, 'exponent')
    }
    this.skipSpace()
    let arg: Val
    const c = this.ch()
    if (c === '(' || c === '[' || c === '{') {
      arg = this.parseGroup(c, c === '(' ? ')' : c === '[' ? ']' : '}')
    } else {
      // Quy ước LaTeX: `\sin 2x` = sin(2x); dừng ở phép toán viết rõ hoặc hàm kế tiếp.
      const argStart = this.pos
      arg = this.parsePower()
      while (this.canStartFactor() && !this.nextIsFunction()) {
        const rhs = this.parsePower()
        arg = this.combineProduct(arg, rhs, '*', this.src.slice(argStart, this.pos))
      }
    }
    this.checkPlainUnits(arg)
    this.requireDimensionless(arg, 'function_argument', name)
    return plainVal(DIMENSIONLESS, 'known', this.src.slice(start, this.pos))
  }

  private nextIsFunction(): boolean {
    const cmd = this.peekCommand()
    if (cmd !== null) return FUNCTIONS.has(cmd)
    const m = /^[a-z]+/.exec(this.rest())
    return m !== null && FUNCTIONS.has(m[0])
  }

  // ── ký hiệu ──

  /** Đọc phần chỉ số dưới + dấu phẩy trên sau phần chữ chính. */
  private readSymbolTail(run: string, delta: boolean): SymbolToken {
    let sub: string | null = null
    if (this.ch() === '_') {
      this.pos++
      if (this.ch() === '{') {
        const end = matchBrace(this.src, this.pos)
        if (end < 0) throw new Unsupported('unknown_notation', '_{')
        sub = canonicalSubscript(this.src.slice(this.pos + 1, end))
        this.pos = end + 1
      } else {
        const c = this.ch()
        if (!/[A-Za-z0-9]/.test(c)) throw new Unsupported('unknown_notation', `_${c}`)
        sub = c
        this.pos++
      }
      if (sub === '') throw new Unsupported('unknown_notation', '_{}')
    } else {
      let uni = ''
      while (SUBSCRIPT_CHARS[this.ch()] !== undefined) {
        uni += SUBSCRIPT_CHARS[this.ch()]
        this.pos++
      }
      if (uni !== '') sub = uni
    }
    let primes = ''
    while (this.ch() === "'") {
      primes += "'"
      this.pos++
    }
    return { run, sub, primes, delta }
  }

  /** Đọc ký hiệu tại vị trí hiện tại (đã bỏ qua `Δ`/`\Delta` nếu `delta`; `start` = đầu ký hiệu). */
  private parseSymbol(delta: boolean, start: number): Val {
    this.skipSpace()
    let run: string
    const cmd = this.peekCommand()
    if (cmd !== null && GREEK[cmd] !== undefined) {
      this.pos += cmd.length + 1
      run = GREEK[cmd] ?? cmd
    } else if (GREEK_CHAR.test(this.ch())) {
      const g = this.ch()
      this.pos += g.length
      run = GREEK_NORMALIZE[g] ?? g
    } else {
      const m = /^[A-Za-z]+/.exec(this.rest())
      if (m === null) throw new Unsupported('unknown_notation', delta ? 'Δ' : this.ch())
      run = m[0]
      this.pos += run.length
      if (!delta && FUNCTIONS.has(run) && this.ch() !== '_') return this.parseFunction(run, start)
      // Cơ số e: `e^{-t/τ}` — chỉ khi đề không dùng `e` làm biến.
      if (!delta && run === 'e' && !this.symbols.has('e') && /^\s*\^/.test(this.rest())) {
        this.skipSpace()
        this.pos++
        const exponent = this.parseExponentGroup()
        this.requireDimensionless(exponent, 'exponent', 'e')
        return plainVal(DIMENSIONLESS, 'known', this.src.slice(start, this.pos))
      }
    }
    return this.resolveSymbol(this.readSymbolTail(run, delta), start)
  }

  /**
   * Ký hiệu → thứ nguyên. Thứ tự: bảng biến của đề → hằng chuẩn → tách chữ liền thành tích ký hiệu
   * (`mgh`) → chỉ số dưới chưa khai (`v_0` khi đề chỉ khai `v`: CÓ ĐIỀU KIỆN) → đơn vị gõ thường
   * (`10 m/s`) → ký hiệu mơ hồ/lạ (không đoán).
   */
  private resolveSymbol(tok: SymbolToken, start: number): Val {
    const text = this.src.slice(start, this.pos)
    const name = fullName(tok)
    const lookup = (n: string): Dimension | undefined =>
      this.symbols.get(n) ?? PHYSICS_CONSTANTS.get(n)
    const unitNamed = (n: string): string[] => (isUnitWord(n) && n.length <= 3 ? [n] : [])

    if (tok.delta) {
      const declared = this.symbols.get(`Δ${name}`)
      if (declared !== undefined) return plainVal(declared, 'known', text)
    }
    const direct = lookup(name)
    if (direct !== undefined) {
      return plainVal(direct, 'known', text, { unitNamedVars: unitNamed(name) })
    }
    // `mgh`, `v_0t` (đã tách `_0`), `ma`: tách thành tích các ký hiệu đã biết.
    if ([...tok.run].length > 1) {
      const found = segmentations(tok.run, (piece, isLast) => {
        const n = isLast ? piece + (tok.sub !== null ? `_${tok.sub}` : '') + tok.primes : piece
        const d = lookup(n)
        return d === undefined ? null : { dim: d, unitNamed: unitNamed(n) }
      })
      const first = found[0]
      if (first !== undefined) {
        if (!found.every((f) => dimEq(f.dim, first.dim))) {
          throw new Unsupported('ambiguous_symbol', tok.run)
        }
        return plainVal(first.dim, 'known', text, { unitNamedVars: first.unitNamed })
      }
    }
    // Chỉ số dưới / phẩy trên CHƯA khai: v_0, v' — thường cùng đại lượng với v, nhưng không chắc.
    if (tok.sub !== null || tok.primes !== '') {
      const base = lookup(tok.run)
      if (base !== undefined) {
        return plainVal(base, 'cond', text, {
          doubts: [`coi “${name}” cùng thứ nguyên với “${tok.run}” (đề chưa khai “${name}”)`],
        })
      }
    } else if (!tok.delta) {
      const unit = unitWordDimension(tok.run)
      if (unit !== null) return plainVal(unit, 'unit', text, { plainUnits: [tok.run] })
    }
    const ambiguous = AMBIGUOUS_SYMBOLS[tok.run]
    if (ambiguous !== undefined && tok.sub === null) {
      throw new Unsupported('ambiguous_symbol', `${tok.run} (${ambiguous})`)
    }
    throw new Unsupported('unknown_symbol', (tok.delta ? 'Δ' : '') + name)
  }

  /** Đọc riêng MỘT tên ký hiệu (cho khoá của bảng biến). Không phải tên hợp lệ → null. */
  readKeyName(): string | null {
    this.skipSpace()
    let delta = false
    if (this.ch() === 'Δ') {
      delta = true
      this.pos++
    } else if (this.peekCommand() === 'Delta') {
      delta = true
      this.pos += 6
    }
    this.skipSpace()
    let run: string
    const cmd = this.peekCommand()
    if (cmd !== null && GREEK[cmd] !== undefined) {
      this.pos += cmd.length + 1
      run = GREEK[cmd] ?? cmd
    } else if (GREEK_CHAR.test(this.ch())) {
      const g = this.ch()
      this.pos += g.length
      run = GREEK_NORMALIZE[g] ?? g
    } else {
      const m = /^[A-Za-z]+/.exec(this.rest())
      if (m === null) return null
      run = m[0]
      this.pos += run.length
    }
    // Khoá do người soạn đề viết: `v_13` là MỘT chỉ số "13" (khác LaTeX, nơi `v_13` = v₁·3).
    const longSub = /^_([A-Za-z0-9]{2,})\s*$/.exec(this.rest())
    if (longSub !== null) {
      return (delta ? 'Δ' : '') + fullName({ run, sub: longSub[1] ?? '', primes: '' })
    }
    const tok = this.readSymbolTail(run, delta)
    this.skipSpace()
    if (this.pos !== this.src.length) return null
    return (delta ? 'Δ' : '') + fullName(tok)
  }
}

// ── tiện ích thuần ──────────────────────────────────────────────────────────

type Sign = 1 | -1 | 0

/** Áp dấu vào GIÁ TRỊ của số trần (`0` = ± → không còn một giá trị xác định). */
function withSign(v: Val, sign: Sign): Val {
  if (sign === 1 || v.value === null) return v
  return { ...v, value: sign === 0 ? null : ratNeg(v.value) }
}

function pow10(k: number): Rational {
  return k >= 0 ? rat(10n ** BigInt(k)) : rat(1n, 10n ** BigInt(-k))
}

/** Vị trí `}` khớp với `{` tại `start`, lệch → -1. */
function matchBrace(s: string, start: number): number {
  let depth = 0
  for (let i = start; i < s.length; i++) {
    const c = s.charAt(i)
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** `{\text{tb}}`, `{ 12 }`, `{1,2}` → `tb`, `12`, `1,2`. */
function canonicalSubscript(raw: string): string {
  return raw
    .replace(/\\(?:text|mathrm|textrm|rm)\s*/g, '')
    .replace(/[{}\s]/g, '')
    .replace(/[₀-₉]/g, (c) => SUBSCRIPT_CHARS[c] ?? c)
}

type Piece = { dim: Dimension; unitNamed: string[] }

/** Mọi cách tách `run` thành dãy ký hiệu đã biết (tối đa 16 cách). */
function segmentations(
  run: string,
  resolve: (piece: string, isLast: boolean) => Piece | null,
): Piece[] {
  const chars = [...run]
  const out: Piece[] = []
  const walk = (i: number, acc: Piece): void => {
    if (out.length >= 16) return
    if (i === chars.length) {
      out.push(acc)
      return
    }
    for (let j = i + 1; j <= chars.length; j++) {
      const piece = chars.slice(i, j).join('')
      const r = resolve(piece, j === chars.length)
      if (r !== null) {
        walk(j, { dim: dimMul(acc.dim, r.dim), unitNamed: mergeList(acc.unitNamed, r.unitNamed) })
      }
    }
  }
  walk(0, { dim: DIMENSIONLESS, unitNamed: [] })
  return out
}

/** Dấu suy ra giữa các mệnh đề: `v = at ⇒ v = 10\,\text{m/s}`; cả `;` và xuống dòng. */
const STATEMENT_SEPARATOR = /\\implies|\\Longrightarrow|\\Rightarrow|⇒|⟹|=>|(?<!\\);|\\\\|\n/

const MAX_INPUT = 1000
const MAX_VARIABLES = 64

/** Bảng biến của đề → bảng ký hiệu chuẩn hoá. Hỏng → lý do. */
function buildSymbolTable(
  variables: PhysicsVariableTable,
): Map<string, Dimension> | Extract<PhysicsStepCheck, { verdict: 'unsupported' }> {
  const entries = Object.entries(variables)
  if (entries.length > MAX_VARIABLES) return { verdict: 'unsupported', reason: 'too_complex' }
  const table = new Map<string, Dimension>()
  for (const [key, unit] of entries) {
    let name: string | null = null
    try {
      name = new Parser(key, new Map()).readKeyName()
    } catch {
      name = null
    }
    const trimmed = unit.trim()
    const parsed =
      trimmed === '' || trimmed === '1' || trimmed === '-'
        ? ({ ok: true, dim: DIMENSIONLESS } as const)
        : parseUnitExpression(trimmed)
    if (name === null || !parsed.ok) {
      return { verdict: 'unsupported', reason: 'bad_variable_table', detail: `${key}: ${unit}` }
    }
    table.set(name, parsed.dim)
  }
  return table
}

/**
 * Kiểm thứ nguyên MỘT bước giải Vật lí.
 *
 * @param step      chuỗi học sinh gõ (LaTeX phẳng hoặc gõ thường), có thể gồm nhiều mệnh đề nối
 *                  bằng `⇒`/`;`, mỗi mệnh đề là chuỗi `a = b = c`.
 * @param variables bảng thứ nguyên biến của ĐỀ. Thiếu → `unsupported` (không đoán thứ nguyên).
 */
export function checkPhysicsStep(
  step: string,
  variables: PhysicsVariableTable | undefined,
): PhysicsStepCheck {
  if (variables === undefined || Object.keys(variables).length === 0) {
    return { verdict: 'unsupported', reason: 'no_variable_table' }
  }
  if (step.length > MAX_INPUT) return { verdict: 'unsupported', reason: 'too_complex' }
  const symbols = buildSymbolTable(variables)
  if (!(symbols instanceof Map)) return symbols

  const parts = step
    .split(STATEMENT_SEPARATOR)
    .map((p) => p.trim())
    .filter((p) => p !== '')
  if (parts.length === 0) return { verdict: 'unsupported', reason: 'not_equation' }

  let conditional: Conditional | null = null
  let firstProblem: Extract<PhysicsStepCheck, { verdict: 'unsupported' }> | null = null
  let notEquation = false
  let comparisons = 0
  let assumed = false
  let dimension: string | null = null

  for (const part of parts) {
    const parser = new Parser(part, symbols)
    try {
      parser.parseRelation()
    } catch (err) {
      if (err instanceof ProvenMismatch) return { verdict: 'mismatch', mismatch: err.mismatch }
      if (err instanceof DivisionByZero) return { verdict: 'division_by_zero' }
      if (err instanceof Unsupported) {
        firstProblem ??= {
          verdict: 'unsupported',
          reason: err.reason,
          ...(err.detail !== undefined ? { detail: err.detail } : {}),
        }
        conditional ??= parser.conditional
        continue
      }
      if (err instanceof StepCheckLimitError || err instanceof RangeError) {
        firstProblem ??= { verdict: 'unsupported', reason: 'too_complex' }
        continue
      }
      throw err
    }
    conditional ??= parser.conditional
    if (parser.sides < 2) notEquation = true
    comparisons += parser.comparisons
    assumed ||= parser.assumed
    if (parser.comparisons > 0 && parser.resultDim !== null) {
      dimension ??= formatDimension(parser.resultDim)
    }
  }

  if (conditional !== null) {
    return {
      verdict: 'conditional_mismatch',
      mismatch: conditional.mismatch,
      doubts: conditional.doubts,
    }
  }
  if (firstProblem !== null) return firstProblem
  if (notEquation) return { verdict: 'unsupported', reason: 'not_equation' }
  if (comparisons === 0 || dimension === null) {
    return { verdict: 'unsupported', reason: 'numeric_only' }
  }
  return { verdict: 'consistent', dimension, assumedCoefficients: assumed }
}
