// Kiểm một BƯỚC GIẢI phương trình/bất phương trình đại số MỘT ẨN: bước này có giữ nguyên tập
// nghiệm của đề không. Đặc tả: docs/specs/2026-10-09-kiem-buoc-giai-stem.md §4–§5 (phương trình)
// + docs/specs/2026-10-11-kiem-buoc-bat-phuong-trinh.md (bất phương trình, `mathSolutionSet.ts`).
//
// Ý tưởng: mỗi phương trình `trái = phải` đổi về `N(x)/D(x) = 0` với N, D là đa thức hệ số HỮU TỈ
// CHÍNH XÁC (polynomial.ts), kèm danh sách mọi mẫu số đã gặp (tập xác định). Tập nghiệm thực =
// nghiệm thực của N trừ đi nghiệm của các mẫu số. So hai tập nghiệm bằng ƯCLN đa thức + đếm nghiệm
// thực bằng dãy Sturm — KHÔNG lấy mẫu số ngẫu nhiên, KHÔNG làm tròn, nên:
//   - "tương đương" là CHỨNG MINH được (mới được báo ✓);
//   - "đổi nghiệm" cũng chứng minh được (có nghiệm thực bị mất hoặc sinh thêm) → ✗;
//   - mọi thứ ngoài phạm vi (căn bậc ≥ 3, lượng giác, log, π, nhiều ẩn, LaTeX lạ, quá lớn) →
//     "unsupported" để giao diện nói thật "? Chưa tự kiểm được" — tuyệt đối không đoán.
// Ký hiệu tập (`S = (2; +∞)`, `x ∈ [1; 3)`) và trị tuyệt đối (`|2x - 1| < 5`, chia trường hợp):
// docs/specs/2026-10-11-ky-hieu-khoang-va-tri-tuyet-doi.md.
// Căn bậc hai (`\sqrt{x + 3} = x - 3`, `x = \pm\sqrt{2}`): docs/specs/2026-10-11-can-bac-hai.md.
// Khi MỌI đoạn đều là phương trình, đi đúng nhánh cũ (finite/cofinite) — kết luận không đổi. Có
// bất phương trình ở bất kỳ đâu thì so bằng phân hoạch trục số (`compareFormulas`).

import { parseExpression, type ExprNode } from './expression.js'
import { StepCheckLimitError, fromNumber, toSmallInteger, type Rational } from './rational.js'
import {
  type Poly,
  MAX_DEGREE,
  ONE_POLY,
  X_POLY,
  constPoly,
  countRealRoots,
  isConstant,
  isZeroPoly,
  leading,
  monic,
  polyAdd,
  polyExactDiv,
  polyGcd,
  polyMul,
  polyNeg,
  polyScale,
  polySub,
  removeFactorsOf,
  squareFree,
} from './polynomial.js'
import { div as ratDiv, ONE, ZERO, sign, sub as ratSub } from './rational.js'
import { compareFormulas, type Rel, type SetFormula } from './mathSolutionSet.js'

/** Vì sao bộ kiểm KHÔNG kết luận được — để phản hồi nói rõ giới hạn, không nói chung chung. */
export type MathUnsupportedReason =
  | 'not_equation' // không có dấu `=` hay dấu bất đẳng thức (biểu thức trơn)
  | 'unknown_notation' // lệnh LaTeX/ký hiệu bộ đọc không hiểu
  | 'multi_variable' // nhiều hơn một ẩn, hoặc tên ẩn không phải một chữ cái
  | 'non_polynomial' // lượng giác, log, π, số mũ không nguyên…
  | 'too_complex' // vượt trần bậc/độ lớn hệ số
  | 'anchor_unsupported' // chính đề bài (hoặc bước mốc) không đọc được

export type MathStepCheck =
  | { verdict: 'equivalent'; isFinalAnswer: boolean }
  | {
      verdict: 'changed'
      /** Có nghiệm thực của đề KHÔNG còn là nghiệm của bước này. */
      lost: boolean
      /** Bước này có nghiệm thực mà đề KHÔNG có (nghiệm ngoại lai). */
      extra: boolean
      /** Bước này cùng tập nghiệm với bước liền trước → lỗi nằm ở một bước TRƯỚC đó. */
      sameAsPrevious: boolean
      /**
       * Chỉ có khi đề hoặc bước là BẤT phương trình. `complementOnIntervals`: tập của bước là phần
       * bù của tập đúng trên mọi khoảng (chỉ có thể trùng ở đầu mút) — dấu hiệu "quên đổi chiều".
       */
      inequality?: { complementOnIntervals: boolean }
      /** Mốc có trị tuyệt đối còn bước thì không — người học đang chia trường hợp. */
      absoluteValue?: { casesSplit: true }
      /** Mốc có căn bậc hai còn bước thì không — người học vừa bình phương để bỏ căn. */
      squareRoot?: { removed: true }
    }
  | { verdict: 'division_by_zero' }
  | { verdict: 'unsupported'; reason: MathUnsupportedReason }

// ── Lỗi nội bộ để thoát sớm khỏi đệ quy ─────────────────────────────────────

class Unsupported extends Error {
  constructor(readonly reason: MathUnsupportedReason) {
    super(reason)
  }
}
class DivisionByZero extends Error {}

// ── Tập nghiệm ──────────────────────────────────────────────────────────────

/**
 * Tập nghiệm THỰC của một phương trình/hệ:
 *  - `finite`: nghiệm thực của `poly` (dạng chuẩn, không lặp; `ONE_POLY` = vô nghiệm);
 *  - `cofinite`: mọi số thực TRỪ nghiệm của `excluded` (`ONE_POLY` = mọi số thực — hằng đẳng thức).
 */
type SolutionSet = { kind: 'finite'; poly: Poly } | { kind: 'cofinite'; excluded: Poly }

const ALL_REALS: SolutionSet = { kind: 'cofinite', excluded: ONE_POLY }

function intersect(a: SolutionSet, b: SolutionSet): SolutionSet {
  if (a.kind === 'finite') {
    return b.kind === 'finite'
      ? { kind: 'finite', poly: polyGcd(a.poly, b.poly) }
      : { kind: 'finite', poly: monic(removeFactorsOf(a.poly, b.excluded)) }
  }
  if (b.kind === 'finite') return intersect(b, a)
  return { kind: 'cofinite', excluded: squareFree(polyMul(a.excluded, b.excluded)) }
}

function union(a: SolutionSet, b: SolutionSet): SolutionSet {
  if (a.kind === 'finite' && b.kind === 'finite') {
    return { kind: 'finite', poly: squareFree(polyMul(a.poly, b.poly)) }
  }
  // "x = 2 hoặc 0 = 0" — hiếm, và hợp hai tập vô hạn cần thêm logic; nói thật là chưa kiểm.
  throw new Unsupported('too_complex')
}

/** Bỏ khỏi tập nghiệm mọi điểm làm một mẫu số bằng 0 (ngoài tập xác định). */
function restrictToDomain(set: SolutionSet, domain: readonly Poly[]): SolutionSet {
  let current = set
  for (const d of domain) {
    if (isConstant(d)) continue
    current = intersect(current, { kind: 'cofinite', excluded: squareFree(d) })
  }
  return current
}

/**
 * So tập nghiệm của BƯỚC với tập nghiệm của MỐC (đề bài). Mọi kết luận ở đây là chính xác:
 * "có nghiệm thực bị mất" ⇔ đa thức thương còn nghiệm thực (đếm bằng dãy Sturm).
 */
function compareSets(anchor: SolutionSet, step: SolutionSet): { lost: boolean; extra: boolean } {
  const hasRealRoot = (p: Poly): boolean => countRealRoots(p) > 0
  if (anchor.kind === 'finite') {
    if (step.kind === 'cofinite') {
      return { lost: hasRealRoot(polyGcd(anchor.poly, step.excluded)), extra: true }
    }
    const g = polyGcd(anchor.poly, step.poly)
    return {
      lost: hasRealRoot(polyExactDiv(anchor.poly, g)),
      extra: hasRealRoot(polyExactDiv(step.poly, g)),
    }
  }
  if (step.kind === 'finite') {
    // Đề có vô số nghiệm, bước chỉ còn hữu hạn → chắc chắn mất nghiệm. Nghiệm của bước rơi vào
    // điểm đề loại trừ thì là nghiệm lạ.
    return { lost: true, extra: hasRealRoot(polyGcd(step.poly, anchor.excluded)) }
  }
  // Cả hai là "mọi x trừ vài điểm": khác nhau đúng ở các điểm bị loại trừ.
  const g = polyGcd(anchor.excluded, step.excluded)
  return {
    lost: hasRealRoot(polyExactDiv(step.excluded, g)),
    extra: hasRealRoot(polyExactDiv(anchor.excluded, g)),
  }
}

// ── Phân thức hữu tỉ N/D ────────────────────────────────────────────────────

type RatFn = { num: Poly; den: Poly }

/** Rút gọn N/D và đưa mẫu về dạng chuẩn (hệ số cao nhất = 1). */
function reduce(num: Poly, den: Poly): RatFn {
  if (isZeroPoly(num)) return { num, den: ONE_POLY }
  const g = polyGcd(num, den)
  const n = isConstant(g) ? num : polyExactDiv(num, g)
  const d = isConstant(g) ? den : polyExactDiv(den, g)
  const scale: Rational = ratDiv(ONE, leading(d))
  return { num: polyScale(n, scale), den: polyScale(d, scale) }
}

function power(base: RatFn, k: number): RatFn {
  let num: Poly = ONE_POLY
  let den: Poly = ONE_POLY
  for (let i = 0; i < k; i++) {
    num = polyMul(num, base.num)
    den = polyMul(den, base.den)
  }
  return reduce(num, den)
}

/**
 * Đổi cây biểu thức → phân thức. Mỗi phép chia ghi mẫu số vào `domain` (điều kiện xác định),
 * vì rút gọn phân thức sẽ làm MẤT dấu vết điều kiện (x/x rút thành 1 nhưng x ≠ 0 vẫn phải giữ).
 */
function toRatFn(node: ExprNode, variable: string | null, domain: Poly[]): RatFn {
  switch (node.type) {
    case 'num': {
      const c = fromNumber(node.value)
      if (c === null) throw new Unsupported('non_polynomial')
      return { num: constPoly(c), den: ONE_POLY }
    }
    case 'var':
      if (node.name !== variable && node.name !== SET_VAR) throw new Unsupported('multi_variable')
      return { num: X_POLY, den: ONE_POLY }
    case 'unary': {
      const arg = toRatFn(node.arg, variable, domain)
      return node.op === '-' ? { num: polyNeg(arg.num), den: arg.den } : arg
    }
    case 'call':
      throw new Unsupported('non_polynomial')
    case 'binary': {
      const a = toRatFn(node.left, variable, domain)
      if (node.op === '^') return powerNode(a, node.right, variable, domain)
      const b = toRatFn(node.right, variable, domain)
      switch (node.op) {
        case '+':
          return fnAdd(a, b)
        case '-':
          return fnSub(a, b)
        case '*':
          return fnMul(a, b)
        case '/':
          return fnDiv(a, b, domain)
      }
    }
  }
}

const fnAdd = (a: RatFn, b: RatFn): RatFn =>
  reduce(polyAdd(polyMul(a.num, b.den), polyMul(b.num, a.den)), polyMul(a.den, b.den))
const fnSub = (a: RatFn, b: RatFn): RatFn =>
  reduce(polySub(polyMul(a.num, b.den), polyMul(b.num, a.den)), polyMul(a.den, b.den))
const fnMul = (a: RatFn, b: RatFn): RatFn => reduce(polyMul(a.num, b.num), polyMul(a.den, b.den))
const fnNeg = (a: RatFn): RatFn => ({ num: polyNeg(a.num), den: a.den })

/** a / b, ghi tử của b vào điều kiện xác định (khác 0). */
function fnDiv(a: RatFn, b: RatFn, domain: Poly[]): RatFn {
  if (isZeroPoly(b.num)) throw new DivisionByZero()
  if (!isConstant(b.num)) domain.push(b.num)
  return reduce(polyMul(a.num, b.den), polyMul(a.den, b.num))
}

/** Số mũ phải là hằng số NGUYÊN, |số mũ| ≤ trần bậc. */
function integerExponent(exponentNode: ExprNode, variable: string | null, domain: Poly[]): number {
  const e = toRatFn(exponentNode, variable, domain)
  if (!isConstant(e.num) || !isConstant(e.den)) throw new Unsupported('non_polynomial')
  const value = isZeroPoly(e.num) ? 0 : toSmallInteger(ratDiv(leading(e.num), leading(e.den)))
  if (value === null) throw new Unsupported('non_polynomial') // x^(1/2) = căn → ngoài phạm vi
  if (Math.abs(value) > MAX_DEGREE) throw new Unsupported('too_complex')
  return value
}

/** Luỹ thừa: chỉ nhận số mũ là hằng số NGUYÊN (âm thì thành phân thức, ghi điều kiện ≠ 0). */
function powerNode(base: RatFn, exponentNode: ExprNode, variable: string | null, domain: Poly[]) {
  const value = integerExponent(exponentNode, variable, domain)
  if (value === 0) {
    if (isZeroPoly(base.num)) throw new Unsupported('non_polynomial') // 0^0
    return { num: ONE_POLY, den: ONE_POLY }
  }
  if (value > 0) return power(base, value)
  if (isZeroPoly(base.num)) throw new DivisionByZero()
  if (!isConstant(base.num)) domain.push(base.num)
  return power(reduce(base.den, base.num), -value)
}

// ── Đọc chuỗi học sinh gõ ───────────────────────────────────────────────────

/** Dấu suy ra giữa các vế của một chuỗi biến đổi: `2x = 10 ⇒ x = 5`. */
const IMPLIES = /\\implies|\\Longrightarrow|\\Rightarrow|⇒|⟹|=>/
/** Dấu "hoặc" giữa các nghiệm: `x = 2 hoặc x = -2`, `x = 2; x = -2`, `x=2 \lor x=-2`. */
// `;` đứng sau `\` là khoảng trắng LaTeX (`\;`), không phải dấu "hoặc".
const OR = /\\text\{\s*(?:hoặc|or)\s*\}|\\lor|∨|(?<!\\);|\s(?:hoặc|or)\s/u
const PLUS_MINUS = /\\pm|±/g

/** Nhóm ngoặc nhọn bắt đầu tại `start` (ký tự `{`) → [nội dung, vị trí sau `}`], lệch thì null. */
function readBraceGroup(s: string, start: number): [string, number] | null {
  if (s.charAt(start) !== '{') return null
  let depth = 0
  for (let i = start; i < s.length; i++) {
    const ch = s.charAt(i)
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return [s.slice(start + 1, i), i + 1]
    }
  }
  return null
}

/** `\frac{a}{b}` (và `\dfrac`, `\tfrac`) → `((a)/(b))`, xử lý lồng nhau. Lệch ngoặc → null. */
function expandFractions(input: string): string | null {
  let s = input
  for (let guard = 0; guard < 50; guard++) {
    const m = /\\[dt]?frac\s*/.exec(s)
    if (m === null) return s
    const numer = readBraceGroup(s, m.index + m[0].length)
    if (numer === null) return null
    const denom = readBraceGroup(s, numer[1])
    if (denom === null) return null
    s = `${s.slice(0, m.index)}((${numer[0]})/(${denom[0]}))${s.slice(denom[1])}`
  }
  return null
}

/** LaTeX phẳng của một vế → chuỗi bộ phân tích biểu thức đọc được. Còn lệnh lạ → null. */
function latexToPlain(input: string): string | null {
  let s = input
    .replace(/\\(?:left|right)(?![a-zA-Z])/g, '')
    .replace(/\\[lr]?vert(?![a-zA-Z])/g, '|')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/\\(?:cdot|times|ast)(?![a-zA-Z])/g, '*')
    .replace(/\\div(?![a-zA-Z])/g, '/')
    // Dấu chia kiểu SGK Việt Nam `6 : 2` — cùng độ ưu tiên với `/` và `÷`. Đặt SAU bước đổi `\:`
    // (khoảng trắng LaTeX) nên không nhầm. Trong MỘT BƯỚC GIẢI phương trình một ẩn thì `:` là chia;
    // tỉ lệ `a:b` (hình học/xác suất/Sinh) ở đây cũng đọc là a/b — cùng giá trị nên không sai nghĩa.
    // `::`, `:` đầu/cuối thành `//`, `/` thừa → bộ phân tích báo không đọc được như với `/`.
    .replace(/:/g, '/')
  const fractions = expandFractions(s)
  const expanded = fractions === null ? null : expandSquareRoots(fractions)
  if (expanded === null) return null
  s = expanded.replace(/\{/g, '(').replace(/\}/g, ')')
  if (s.includes('\\')) return null // LaTeX lạ (\sin, \pi, \neq, \sqrt[3]…) — không đoán
  if (/pi|π/.test(s)) return null // π không phải số hữu tỉ
  // `√x²`, `√2^3`: căn của bình phương hay bình phương của căn? Viết tay không phân biệt được.
  if (/√\s*(?:[0-9.]+|[a-zA-Z])\s*(?:\^|[⁰¹²³⁴-⁹])/.test(s)) return null
  // `√` gõ tay: thêm khoảng trắng TRƯỚC để `2x√x` không dính thành tên biến `xsqrt`.
  return absBarsToCalls(s.replace(/√/g, ' sqrt '))
}

/**
 * `\sqrt{a}` → ` sqrt((a))`, xử lý lồng nhau. Chỉ nhận dạng có ngoặc nhọn: `\sqrt[3]{…}` (căn bậc
 * khác) và `\sqrt 23` (LaTeX hiểu là √2·3, dễ đọc nhầm) → null, không đoán.
 */
function expandSquareRoots(input: string): string | null {
  let s = input
  for (let guard = 0; guard < 50; guard++) {
    const m = /\\sqrt(?![a-zA-Z])\s*/.exec(s)
    if (m === null) return s
    const radicand = readBraceGroup(s, m.index + m[0].length)
    if (radicand === null) return null
    s = `${s.slice(0, m.index)} sqrt((${radicand[0]}))${s.slice(radicand[1])}`
  }
  return null
}

/**
 * `|f|` → `abs(f)`. Một `|` là dấu MỞ khi chưa có `|` nào đang mở, hoặc ngay trước nó (bỏ khoảng
 * trắng) là đầu chuỗi, toán tử, dấu quan hệ, ngoặc mở hay một `|` mở; còn lại là dấu ĐÓNG. Nhờ
 * vậy `2|x - 1|`, `|x||y|`, `||x| - 1|` đều đọc đúng. Lệch số `|` → null (không đoán).
 */
function absBarsToCalls(s: string): string | null {
  let out = ''
  let open = 0
  let prev: 'start' | 'operator' | 'operand' = 'start'
  for (const ch of s) {
    if (ch === '|') {
      if (open === 0 || prev !== 'operand') {
        out += ' abs(' // khoảng trắng trước: `2x|x|` không dính thành tên biến `xabs`
        open++
        prev = 'operator'
      } else {
        out += ')'
        open--
        prev = 'operand'
      }
      continue
    }
    out += ch
    if (ch === ' ' || ch === '\t') continue
    prev = '+-*/^(=<>≤≥'.includes(ch) ? 'operator' : 'operand'
  }
  return open === 0 ? out : null
}

/** Các vế nối nhau bằng quan hệ: `a = b = c`, `a < x \le b` (`rels[i]` nằm giữa vế i và i+1). */
type Clause = {
  sides: ExprNode[]
  rels: Rel[]
  /** Mệnh đề dựng từ ký hiệu tập (`S = (2; +∞)`) — luôn là dạng đáp số. */
  fromSet?: true
}
type Statement = Clause[] // các mệnh đề nối bằng "hoặc"

/**
 * Đưa mọi cách viết dấu bất đẳng thức về một ký tự: `\le`, `\leq`, `\leqslant`, `<=`, `⩽` → `≤`…
 * `(?![a-zA-Z])` để `\left` không bị đọc thành `\le` + `ft`. Chạy SAU khi đã tách `⇒`/`=>`.
 */
function normalizeRelations(raw: string): string {
  return raw
    .replace(/\\(?:leqslant|leq|le)(?![a-zA-Z])|<=|⩽/g, '≤')
    .replace(/\\(?:geqslant|geq|ge)(?![a-zA-Z])|>=|⩾/g, '≥')
    .replace(/\\lt(?![a-zA-Z])/g, '<')
    .replace(/\\gt(?![a-zA-Z])/g, '>')
}

const REL_SPLIT = /([=<>≤≥])/

/** Một mệnh đề "hoặc" → danh sách vế đã phân tích + quan hệ giữa chúng. */
function parseClause(raw: string): Clause {
  const plain = latexToPlain(normalizeRelations(raw))
  if (plain === null) throw new Unsupported('unknown_notation')
  const tokens = plain.split(REL_SPLIT)
  if (tokens.length < 3) throw new Unsupported('not_equation')
  const sides: ExprNode[] = []
  const rels: Rel[] = []
  tokens.forEach((tok, i) => {
    if (i % 2 === 1) {
      rels.push(tok as Rel)
      return
    }
    const node = parseExpression(tok)
    if (node === null) throw new Unsupported('unknown_notation')
    sides.push(node)
  })
  return { sides, rels }
}

/** Mệnh đề chỉ toàn dấu `=`, không có trị tuyệt đối hay căn — đi nhánh so tập nghiệm cũ. */
const isEquationOnly = (st: Statement): boolean =>
  st.every(
    (clause) =>
      clause.rels.every((r) => r === '=') &&
      !clause.sides.some((n) => containsAbs(n) || containsSqrt(n)),
  )

/** Có dấu bất đẳng thức ở đâu đó — để chọn câu phản hồi của bất phương trình. */
const hasInequality = (st: Statement): boolean =>
  st.some((clause) => clause.rels.some((r) => r !== '='))

const statementHasAbs = (st: Statement): boolean =>
  st.some((clause) => clause.sides.some(containsAbs))

const statementHasSqrt = (st: Statement): boolean =>
  st.some((clause) => clause.sides.some(containsSqrt))

/** Một đoạn (giữa hai dấu ⇒) → các mệnh đề "hoặc", đã khai triển ±. */
function parseStatement(raw: string): Statement {
  // Ký hiệu tập đọc TRƯỚC khi tách "hoặc": trong `(a; b)` dấu `;` là dấu ngăn đầu mút.
  const asSet = parseSetStatement(raw)
  if (asSet !== null) return asSet
  const clauses: Clause[] = []
  for (const part of raw.split(OR)) {
    const pm = part.match(PLUS_MINUS)?.length ?? 0
    if (pm > 1 || /\\mp|∓/.test(part)) throw new Unsupported('unknown_notation')
    if (pm === 1) {
      clauses.push(parseClause(part.replace(PLUS_MINUS, '+')))
      clauses.push(parseClause(part.replace(PLUS_MINUS, '-')))
    } else {
      clauses.push(parseClause(part))
    }
  }
  return clauses
}

// ── Ký hiệu tập: `S = (2; +∞)`, `x ∈ [1; 3) ∪ {5}`, `S = ℝ \ {2}` ───────────────

/**
 * Tên ẩn tạm cho tập viết `S = …` (không nêu tên ẩn): `toRatFn` coi nó là ẩn của đề, còn
 * `statementVars` bỏ qua nó. Ký tự NUL không thể có trong tên do bộ tách token sinh ra.
 */
const SET_VAR = '\u0000S'

/** Tiền tố bắt buộc: `S =` hoặc `<ẩn> \in` / `<ẩn> ∈` (nhóm 1 = tên ẩn). */
const SET_PREFIX = /^\s*(?:S\s*=|([a-zA-Z])\s*(?:\\in(?![a-zA-Z])|∈))\s*/
const SET_UNION = /\\cup(?![a-zA-Z])|∪|\bU\b/
const EMPTY_SET = /^(?:\\emptyset|\\varnothing|∅|Ø|\\\{\s*\\\}|\{\s*\})$/
const REALS = String.raw`(?:\\mathbb\s*\{\s*R\s*\}|\\mathbb\s+R|ℝ|R)`
const REALS_ONLY = new RegExp(`^${REALS}$`)
const REALS_MINUS = new RegExp(String.raw`^${REALS}\s*(?:\\setminus|\\backslash|\\)\s*(.+)$`)
const FINITE_SET = /^\\?\{(.*?)\\?\}$/
const INFINITY = /^([+-]?)\s*(?:\\infty|∞|inf)$/i

type Endpoint =
  { kind: 'inf'; sign: '+' | '-' | '' } | { kind: 'num'; node: ExprNode; value: Rational }

/** Một đầu mút: vô cực, hoặc biểu thức HẰNG hữu tỉ. Không đọc được → null. */
function parseEndpoint(raw: string): Endpoint | null {
  const text = raw.trim()
  const inf = INFINITY.exec(text)
  if (inf !== null) return { kind: 'inf', sign: (inf[1] ?? '') as '+' | '-' | '' }
  const plain = latexToPlain(text)
  const node = plain === null ? null : parseExpression(plain)
  if (node === null) return null
  try {
    const fn = toRatFn(node, null, [])
    if (!isConstant(fn.num) || !isConstant(fn.den)) return null
    const value = isZeroPoly(fn.num) ? ZERO : ratDiv(leading(fn.num), leading(fn.den))
    return { kind: 'num', node, value }
  } catch (err) {
    if (err instanceof Unsupported || err instanceof DivisionByZero) return null
    throw err
  }
}

/** Tách các phần tử ở mức ngoặc ngoài cùng: theo `;`, hoặc theo `,` khi không có `;`. */
function splitItems(inner: string): string[] {
  const at = (sep: string) => {
    const parts: string[] = []
    let depth = 0
    let start = 0
    for (let i = 0; i < inner.length; i++) {
      const ch = inner.charAt(i)
      if ('([{'.includes(ch)) depth++
      else if (')]}'.includes(ch)) depth--
      else if (ch === sep && depth === 0 && inner.charAt(i - 1) !== '\\') {
        parts.push(inner.slice(start, i))
        start = i + 1
      }
    }
    parts.push(inner.slice(start))
    return parts
  }
  const bySemicolon = at(';')
  return bySemicolon.length > 1 ? bySemicolon : at(',')
}

const lessThan = (a: Rational, b: Rational): boolean => sign(ratSub(a, b)) < 0

/** `x = a` cho từng phần tử của tập hữu hạn; phần tử không phải hằng → null. */
function finitePoints(inner: string): Extract<Endpoint, { kind: 'num' }>[] | null {
  const points: Extract<Endpoint, { kind: 'num' }>[] = []
  for (const item of splitItems(inner)) {
    const p = parseEndpoint(item)
    if (p === null || p.kind !== 'num') return null
    points.push(p)
  }
  return points
}

/** Một hạng của biểu thức tập → các mệnh đề "hoặc" (rỗng = tập rỗng). Không phải tập → null. */
function parseSetTerm(term: string, x: ExprNode): Clause[] | null {
  const allReals: Clause = { sides: [x, x], rels: ['='], fromSet: true }
  const between = (lo: ExprNode | null, hi: ExprNode | null, rLo: Rel, rHi: Rel): Clause => {
    if (lo !== null && hi !== null) return { sides: [lo, x, hi], rels: [rLo, rHi], fromSet: true }
    if (lo !== null) return { sides: [lo, x], rels: [rLo], fromSet: true }
    if (hi !== null) return { sides: [x, hi], rels: [rHi], fromSet: true }
    return allReals
  }

  if (EMPTY_SET.test(term)) return []
  if (REALS_ONLY.test(term)) return [allReals]

  const minus = REALS_MINUS.exec(term)
  if (minus !== null) {
    // ℝ \ {p₁; …; pₙ} = (−∞; p₁) ∪ (p₁; p₂) ∪ … ∪ (pₙ; +∞), đầu mút sắp xếp CHÍNH XÁC.
    const set = FINITE_SET.exec((minus[1] ?? '').trim())
    const points = set === null ? null : finitePoints(set[1] ?? '')
    if (points === null || points.length === 0) return null
    const sorted = [...points].sort((a, b) => sign(ratSub(a.value, b.value)))
    const unique = sorted.filter(
      (p, i) => i === 0 || lessThan(sorted[i - 1]?.value ?? p.value, p.value),
    )
    const cuts = [null, ...unique.map((p) => p.node), null]
    return cuts.slice(1).map((hi, i) => between(cuts[i] ?? null, hi, '<', '<'))
  }

  const finite = FINITE_SET.exec(term)
  if (finite !== null) {
    const points = finitePoints(finite[1] ?? '')
    if (points === null) return null
    return points.map((p) => ({ sides: [x, p.node], rels: ['='], fromSet: true }))
  }

  const interval = /^([[(])(.*)([\])])$/.exec(term)
  if (interval === null) return null
  const items = splitItems(interval[2] ?? '')
  if (items.length !== 2) return null
  const lo = parseEndpoint(items[0] ?? '')
  const hi = parseEndpoint(items[1] ?? '')
  if (lo === null || hi === null) return null
  const openLo = interval[1] === '('
  const openHi = interval[3] === ')'
  // Vô cực chỉ đứng sau ngoặc tròn, −∞ chỉ ở trái, +∞ chỉ ở phải; đầu mút trái < phải.
  if (lo.kind === 'inf' && (lo.sign !== '-' || !openLo)) return null
  if (hi.kind === 'inf' && (hi.sign === '-' || !openHi)) return null
  if (lo.kind === 'num' && hi.kind === 'num' && !lessThan(lo.value, hi.value)) return null
  return [
    between(
      lo.kind === 'num' ? lo.node : null,
      hi.kind === 'num' ? hi.node : null,
      openLo ? '<' : '≤',
      openHi ? '<' : '≤',
    ),
  ]
}

/**
 * Đoạn viết bằng ký hiệu tập → các mệnh đề "hoặc" (một khoảng = chuỗi kép `a < x ≤ b`). Không có
 * tiền tố `S =`/`x ∈`, hoặc phần sau không phải biểu thức tập hợp lệ → null (đi đường cũ).
 */
function parseSetStatement(raw: string): Statement | null {
  const prefix = SET_PREFIX.exec(raw)
  if (prefix === null) return null
  const x: ExprNode = { type: 'var', name: prefix[1] ?? SET_VAR }
  const body = raw
    .slice(prefix[0].length)
    .replace(/\\(?:left|right)(?![a-zA-Z])/g, '')
    .replace(/\\[,;:! ](?![a-zA-Z{])/g, ' ')
  const clauses: Clause[] = []
  for (const term of body.split(SET_UNION)) {
    const parsed = parseSetTerm(term.trim(), x)
    if (parsed === null) return null
    clauses.push(...parsed)
  }
  // Toàn tập rỗng → mệnh đề luôn sai `0 = 1`.
  if (clauses.length === 0) {
    const zero: ExprNode = { type: 'num', value: 0 }
    const one: ExprNode = { type: 'num', value: 1 }
    return [{ sides: [zero, one], rels: ['='], fromSet: true }]
  }
  return clauses
}

function collectVars(node: ExprNode, out: Set<string>): void {
  switch (node.type) {
    case 'var':
      out.add(node.name)
      return
    case 'unary':
    case 'call':
      collectVars(node.arg, out)
      return
    case 'binary':
      collectVars(node.left, out)
      collectVars(node.right, out)
      return
    case 'num':
      return
  }
}

function statementVars(statements: readonly Statement[]): Set<string> {
  const vars = new Set<string>()
  for (const st of statements) {
    for (const clause of st) for (const n of clause.sides) collectVars(n, vars)
  }
  vars.delete(SET_VAR)
  return vars
}

/** Tập nghiệm của một đoạn: hợp các mệnh đề; mỗi mệnh đề là giao các cặp vế liền nhau. */
function solutionSetOf(statement: Statement, variable: string | null): SolutionSet {
  return statement
    .map((clause) => clauseSetOf(clause, variable))
    .reduce((acc, set) => union(acc, set))
}

/** Tập nghiệm của `a = b = c…`: giao các cặp vế liền nhau, rồi bỏ điểm ngoài tập xác định. */
function clauseSetOf(clause: Clause, variable: string | null): SolutionSet {
  const domain: Poly[] = []
  const fns = clause.sides.map((node) => toRatFn(node, variable, domain))
  let clauseSet: SolutionSet = ALL_REALS
  fns.slice(1).forEach((b, i) => {
    const a = fns[i] ?? b
    // a = b ⇔ (tử của a − b) = 0, trên tập xác định.
    const diff = polySub(polyMul(a.num, b.den), polyMul(b.num, a.den))
    const pairSet: SolutionSet = isZeroPoly(diff)
      ? ALL_REALS
      : { kind: 'finite', poly: squareFree(diff) }
    clauseSet = intersect(clauseSet, pairSet)
  })
  return restrictToDomain(clauseSet, domain)
}

// ── Công thức dấu cho nhánh bất phương trình (mathSolutionSet.ts) ──────────

/**
 * Trần số trị tuyệt đối KHÁC NHAU trong một mệnh đề — mỗi cái nhân đôi số nhánh (4 → 16 nhánh).
 * Bài phổ thông hiếm khi quá 2.
 */
const MAX_ABS_PER_CLAUSE = 4

const isAbs = (node: ExprNode): boolean => node.type === 'call' && node.name === 'abs'

/** Cây có gọi hàm `name` ở đâu đó không. */
function containsCall(node: ExprNode, name: string): boolean {
  switch (node.type) {
    case 'call':
      return node.name === name || containsCall(node.arg, name)
    case 'unary':
      return containsCall(node.arg, name)
    case 'binary':
      return containsCall(node.left, name) || containsCall(node.right, name)
    default:
      return false
  }
}

const containsAbs = (node: ExprNode): boolean => containsCall(node, 'abs')
const containsSqrt = (node: ExprNode): boolean => containsCall(node, 'sqrt')

/** Mọi nút `abs(…)` của cây (để đếm số trị tuyệt đối khác nhau). */
function absNodes(node: ExprNode, out: ExprNode[]): void {
  switch (node.type) {
    case 'call':
      if (isAbs(node)) out.push(node)
      absNodes(node.arg, out)
      return
    case 'unary':
      absNodes(node.arg, out)
      return
    case 'binary':
      absNodes(node.left, out)
      absNodes(node.right, out)
      return
    default:
      return
  }
}

/** Một `abs(g)` mà `g` không còn trị tuyệt đối nào (trong cùng) — tách nó trước. */
function innermostAbs(node: ExprNode): Extract<ExprNode, { type: 'call' }> | null {
  switch (node.type) {
    case 'call':
      return innermostAbs(node.arg) ?? (node.name === 'abs' ? node : null)
    case 'unary':
      return innermostAbs(node.arg)
    case 'binary':
      return innermostAbs(node.left) ?? innermostAbs(node.right)
    default:
      return null
  }
}

/** Thay MỌI `abs(…)` giống hệt `key` (so cấu trúc) bằng `replacement`. */
function replaceAbs(node: ExprNode, key: string, replacement: ExprNode): ExprNode {
  switch (node.type) {
    case 'call':
      if (isAbs(node) && JSON.stringify(node) === key) return replacement
      return { ...node, arg: replaceAbs(node.arg, key, replacement) }
    case 'unary':
      return { ...node, arg: replaceAbs(node.arg, key, replacement) }
    case 'binary':
      return {
        ...node,
        left: replaceAbs(node.left, key, replacement),
        right: replaceAbs(node.right, key, replacement),
      }
    default:
      return node
  }
}

/** Một nhánh sau khi bỏ trị tuyệt đối: các vế không còn `abs` + điều kiện dấu của nhánh. */
type AbsBranch = { sides: ExprNode[]; guards: { arg: ExprNode; rel: '≥' | '<' }[] }

/**
 * Chia trường hợp CHÍNH XÁC: `|g|` = `g` khi `g ≥ 0`, = `−g` khi `g < 0`. Tách từ trong ra ngoài
 * nên `g` của mỗi điều kiện đã sạch trị tuyệt đối.
 */
function splitAbsolute(sides: ExprNode[], guards: AbsBranch['guards'] = []): AbsBranch[] {
  let target: Extract<ExprNode, { type: 'call' }> | null = null
  for (const side of sides) {
    target = innermostAbs(side)
    if (target !== null) break
  }
  if (target === null) return [{ sides, guards }]
  const { arg } = target
  const key = JSON.stringify(target)
  const negArg: ExprNode = { type: 'unary', op: '-', arg }
  return [
    ...splitAbsolute(
      sides.map((s) => replaceAbs(s, key, arg)),
      [...guards, { arg, rel: '≥' }],
    ),
    ...splitAbsolute(
      sides.map((s) => replaceAbs(s, key, negArg)),
      [...guards, { arg, rel: '<' }],
    ),
  ]
}

/** Một mệnh đề → công thức dấu; có trị tuyệt đối thì "hoặc" của các nhánh chia trường hợp. */
function clauseFormula(clause: Clause, variable: string | null): SetFormula {
  if (!clause.sides.some(containsAbs))
    return plainClauseFormula(clause.sides, clause.rels, variable)
  const found: ExprNode[] = []
  for (const side of clause.sides) absNodes(side, found)
  if (new Set(found.map((n) => JSON.stringify(n))).size > MAX_ABS_PER_CLAUSE) {
    throw new Unsupported('too_complex')
  }
  return {
    kind: 'or',
    parts: splitAbsolute(clause.sides).map((branch) => ({
      kind: 'and',
      parts: [
        ...branch.guards.map((g) => relationFormula(g.arg, ZERO_NODE, g.rel, variable)),
        plainClauseFormula(branch.sides, clause.rels, variable),
      ],
    })),
  }
}

/** Các vế (không còn trị tuyệt đối) → "mọi cặp vế liền nhau thoả quan hệ" VÀ "mọi mẫu số ≠ 0". */
function plainClauseFormula(
  sides: readonly ExprNode[],
  rels: readonly Rel[],
  variable: string | null,
): SetFormula {
  const parts: SetFormula[] = []
  rels.forEach((rel, i) => {
    const a = sides[i]
    const b = sides[i + 1]
    if (a === undefined || b === undefined) return
    parts.push(relationFormula(a, b, rel, variable))
  })
  return { kind: 'and', parts }
}

const ZERO_NODE: ExprNode = { type: 'num', value: 0 }

/**
 * `a rel b` (hai vế không còn trị tuyệt đối) → công thức dấu, kèm "mọi mẫu số ≠ 0" và "mọi biểu
 * thức dưới căn ≥ 0". Căn bậc hai: xem `radicalFormula`.
 */
function relationFormula(a: ExprNode, b: ExprNode, rel: Rel, variable: string | null): SetFormula {
  const domain: Poly[] = []
  const parts =
    containsSqrt(a) || containsSqrt(b)
      ? radicalFormula(a, b, rel, variable, domain)
      : [fnAtom(fnSub(toRatFn(a, variable, domain), toRatFn(b, variable, domain)), rel)]
  for (const d of domain) if (!isConstant(d)) parts.push({ kind: 'nonzero', poly: d })
  return { kind: 'and', parts }
}

/** `R rel 0` với R là phân thức (mẫu ≠ 0 do điều kiện xác định lo). */
const fnAtom = (r: RatFn, rel: Rel): SetFormula => ({
  kind: 'atom',
  num: r.num,
  den: r.den,
  rel,
})

// ── Căn bậc hai: docs/specs/2026-10-11-can-bac-hai.md ───────────────────────

/**
 * Một biểu thức có MỘT căn `s = √f`: `A + B·s` với A, B, f là phân thức của ẩn. Mọi phép tính
 * dùng `s² = f` nên vẫn CHÍNH XÁC (không làm tròn √2 thành 1,414…).
 */
type Surd = { a: RatFn; b: RatFn }

const ZERO_FN: RatFn = { num: [], den: ONE_POLY }
const ONE_FN: RatFn = { num: ONE_POLY, den: ONE_POLY }

const sameFn = (p: RatFn, q: RatFn): boolean => isZeroPoly(fnSub(p, q).num)

/** Mọi nút `sqrt(…)` của cây. */
function sqrtNodes(node: ExprNode, out: Extract<ExprNode, { type: 'call' }>[]): void {
  switch (node.type) {
    case 'call':
      if (node.name === 'sqrt') out.push(node)
      sqrtNodes(node.arg, out)
      return
    case 'unary':
      sqrtNodes(node.arg, out)
      return
    case 'binary':
      sqrtNodes(node.left, out)
      sqrtNodes(node.right, out)
      return
    default:
      return
  }
}

/**
 * `a rel b` có căn bậc hai → các phần của công thức dấu. Hai dạng đọc được:
 *  - MỘT biểu thức dưới căn (có thể lặp lại: `√x + 2√x`): đưa `a − b` về `A + B·√f`;
 *  - `√f rel √g` (mỗi vế đúng một căn): căn đồng biến trên [0; +∞) nên ⇔ f ≥ 0, g ≥ 0, f rel g.
 * Căn lồng nhau, hai căn khác nhau ở dạng khác → `too_complex` ("?").
 */
function radicalFormula(
  a: ExprNode,
  b: ExprNode,
  rel: Rel,
  variable: string | null,
  domain: Poly[],
): SetFormula[] {
  const nodes: Extract<ExprNode, { type: 'call' }>[] = []
  sqrtNodes(a, nodes)
  sqrtNodes(b, nodes)
  const radicands: RatFn[] = []
  for (const n of nodes) {
    if (containsSqrt(n.arg)) throw new Unsupported('too_complex') // căn lồng căn
    const f = toRatFn(n.arg, variable, domain)
    if (!radicands.some((r) => sameFn(r, f))) radicands.push(f)
  }
  const nonNegative = radicands.map((f) => fnAtom(f, '≥'))
  const [f, g] = radicands
  if (f === undefined) throw new Unsupported('too_complex') // không xảy ra: nơi gọi đã thấy căn
  if (g === undefined) {
    const d = surdSub(toSurd(a, variable, domain, f), toSurd(b, variable, domain, f))
    return [...nonNegative, surdSign(d, f, rel)]
  }
  const lone = (n: ExprNode) => n.type === 'call' && n.name === 'sqrt'
  if (radicands.length === 2 && lone(a) && lone(b)) {
    return [...nonNegative, fnAtom(fnSub(f, g), rel)]
  }
  throw new Unsupported('too_complex')
}

const surdSub = (p: Surd, q: Surd): Surd => ({ a: fnSub(p.a, q.a), b: fnSub(p.b, q.b) })

/** Biểu thức (chỉ chứa căn `√f`) → `A + B·√f`. */
function toSurd(node: ExprNode, variable: string | null, domain: Poly[], f: RatFn): Surd {
  if (!containsSqrt(node)) return { a: toRatFn(node, variable, domain), b: ZERO_FN }
  switch (node.type) {
    case 'call':
      if (node.name !== 'sqrt') throw new Unsupported('non_polynomial')
      if (!sameFn(toRatFn(node.arg, variable, domain), f)) throw new Unsupported('too_complex')
      return { a: ZERO_FN, b: ONE_FN }
    case 'unary': {
      const arg = toSurd(node.arg, variable, domain, f)
      return node.op === '-' ? { a: fnNeg(arg.a), b: fnNeg(arg.b) } : arg
    }
    case 'binary': {
      const p = toSurd(node.left, variable, domain, f)
      if (node.op === '^') {
        const k = integerExponent(node.right, variable, domain)
        let base = p
        if (k < 0) base = surdDiv({ a: ONE_FN, b: ZERO_FN }, p, f, domain)
        let out: Surd = { a: ONE_FN, b: ZERO_FN }
        for (let i = 0; i < Math.abs(k); i++) out = surdMul(out, base, f)
        return out
      }
      const q = toSurd(node.right, variable, domain, f)
      switch (node.op) {
        case '+':
          return { a: fnAdd(p.a, q.a), b: fnAdd(p.b, q.b) }
        case '-':
          return surdSub(p, q)
        case '*':
          return surdMul(p, q, f)
        case '/':
          return surdDiv(p, q, f, domain)
      }
    }
  }
  // `num`/`var` không chứa căn — đã trả ở đầu hàm; tới đây là cây lạ.
  throw new Unsupported('too_complex')
}

/** (A + B√f)(C + D√f) = (AC + BDf) + (AD + BC)√f. */
const surdMul = (p: Surd, q: Surd, f: RatFn): Surd => ({
  a: fnAdd(fnMul(p.a, q.a), fnMul(fnMul(p.b, q.b), f)),
  b: fnAdd(fnMul(p.a, q.b), fnMul(p.b, q.a)),
})

/**
 * Chia cho `C` (không căn) hoặc cho `D·√f` (thuần căn): `x / (D√f) = x·√f / (D·f)`, điều kiện
 * D ≠ 0 và f ≠ 0 — đúng bằng điều kiện mẫu `D√f ≠ 0`. Mẫu dạng `C + D√f` (cả hai khác 0) cần
 * trục căn, có thể đẻ thêm điểm loại trừ sai → `too_complex`, không đoán.
 */
function surdDiv(p: Surd, q: Surd, f: RatFn, domain: Poly[]): Surd {
  if (isZeroPoly(q.b.num)) return { a: fnDiv(p.a, q.a, domain), b: fnDiv(p.b, q.a, domain) }
  if (!isZeroPoly(q.a.num)) throw new Unsupported('too_complex')
  const df = fnMul(q.b, f)
  if (isZeroPoly(df.num)) throw new DivisionByZero()
  return { a: fnDiv(p.b, q.b, domain), b: fnDiv(p.a, df, domain) }
}

/**
 * `A + B·√f rel 0` (với f ≥ 0 đã ghi riêng) → công thức dấu CHÍNH XÁC. Đặt P = A² − B²f =
 * (A + B√f)(A − B√f):
 *  - `= 0` ⇔ P = 0 và A·B ≤ 0 (A, B√f trái dấu hoặc cùng bằng 0);
 *  - `> 0` ⇔ (A > 0, B ≥ 0) hoặc (A > 0, P > 0) hoặc (A ≤ 0, B > 0, P < 0);
 *  - `≥ 0` ⇔ (A ≥ 0, B ≥ 0) hoặc (A ≥ 0, P ≥ 0) hoặc (A ≤ 0, B ≥ 0, P ≤ 0);
 *  - `<`, `≤`: đổi dấu cả A, B rồi dùng `>`, `≥`.
 */
function surdSign(d: Surd, f: RatFn, rel: Rel): SetFormula {
  const { a, b } = d
  if (isZeroPoly(b.num)) return fnAtom(a, rel)
  if (rel === '<') return surdSign({ a: fnNeg(a), b: fnNeg(b) }, f, '>')
  if (rel === '≤') return surdSign({ a: fnNeg(a), b: fnNeg(b) }, f, '≥')
  const p = fnSub(fnMul(a, a), fnMul(fnMul(b, b), f))
  const and = (...parts: SetFormula[]): SetFormula => ({ kind: 'and', parts })
  if (rel === '=') return and(fnAtom(p, '='), fnAtom(fnMul(a, b), '≤'))
  if (rel === '>') {
    return {
      kind: 'or',
      parts: [
        and(fnAtom(a, '>'), fnAtom(b, '≥')),
        and(fnAtom(a, '>'), fnAtom(p, '>')),
        and(fnAtom(a, '≤'), fnAtom(b, '>'), fnAtom(p, '<')),
      ],
    }
  }
  return {
    kind: 'or',
    parts: [
      and(fnAtom(a, '≥'), fnAtom(b, '≥')),
      and(fnAtom(a, '≥'), fnAtom(p, '≥')),
      and(fnAtom(a, '≤'), fnAtom(b, '≥'), fnAtom(p, '≤')),
    ],
  }
}

function statementFormula(statement: Statement, variable: string | null): SetFormula {
  return { kind: 'or', parts: statement.map((clause) => clauseFormula(clause, variable)) }
}

/** Tập nghiệm của MỘT đoạn ở dạng so được: nhánh phương trình cũ, hoặc công thức dấu. */
type Comparable = { kind: 'set'; set: SolutionSet } | { kind: 'formula'; formula: SetFormula }

function comparableOf(
  statement: Statement,
  variable: string | null,
  asFormula: boolean,
): Comparable {
  return asFormula
    ? { kind: 'formula', formula: statementFormula(statement, variable) }
    : { kind: 'set', set: solutionSetOf(statement, variable) }
}

/** Tập `finite`/`cofinite` → công thức dấu tương đương. */
function setToFormula(set: SolutionSet): SetFormula {
  return set.kind === 'finite'
    ? { kind: 'atom', num: set.poly, den: ONE_POLY, rel: '=' }
    : { kind: 'nonzero', poly: set.excluded }
}

const asFormula = (c: Comparable): SetFormula =>
  c.kind === 'formula' ? c.formula : setToFormula(c.set)

/**
 * So hai tập: cả hai là phương trình → nhánh cũ (y hệt trước đây); còn lại → phân hoạch.
 * `inequality` chỉ gắn khi `withInequality` (có dấu bất đẳng thức thật) — phương trình có trị
 * tuyệt đối cũng đi phân hoạch nhưng phản hồi vẫn là câu của phương trình.
 */
function compareComparable(
  a: Comparable,
  b: Comparable,
  withInequality: boolean,
): { lost: boolean; extra: boolean; inequality?: { complementOnIntervals: boolean } } {
  if (a.kind === 'set' && b.kind === 'set') return compareSets(a.set, b.set)
  const { lost, extra, complementOnIntervals } = compareFormulas(asFormula(a), asFormula(b))
  return withInequality ? { lost, extra, inequality: { complementOnIntervals } } : { lost, extra }
}

/** Đoạn cuối có ở dạng đáp số chưa — mỗi mệnh đề là một trong:
 *  `ẩn <qh> hằng số`, `hằng số <qh> ẩn` (qh là `=` hoặc dấu bất đẳng thức),
 *  `a <qh> ẩn <qh> b` với hai dấu CÙNG chiều (`a < x \le b`), a, b là hằng số, hoặc
 *  viết bằng ký hiệu tập (`S = (2; +∞)`). */
function isAnswerForm(statement: Statement, variable: string | null): boolean {
  if (statement.every((clause) => clause.fromSet === true)) return true
  if (variable === null) return false
  const isVar = (n: ExprNode) => n.type === 'var' && n.name === variable
  const hasNoVar = (n: ExprNode) => {
    const s = new Set<string>()
    collectVars(n, s)
    return s.size === 0
  }
  const up = (r: Rel) => r === '<' || r === '≤'
  const down = (r: Rel) => r === '>' || r === '≥'
  return statement.every(({ sides, rels }) => {
    if (sides.length === 2) {
      const [a, b] = sides as [ExprNode, ExprNode]
      return (isVar(a) && hasNoVar(b)) || (isVar(b) && hasNoVar(a))
    }
    if (sides.length !== 3) return false
    const [a, x, b] = sides as [ExprNode, ExprNode, ExprNode]
    const [r1, r2] = rels as [Rel, Rel]
    const sameDirection = (up(r1) && up(r2)) || (down(r1) && down(r2))
    return sameDirection && isVar(x) && hasNoVar(a) && hasNoVar(b)
  })
}

/**
 * Độ sâu ngoặc tối đa bộ kiểm chịu đọc. Bộ phân tích và các hàm duyệt cây đều ĐỆ QUY: chuỗi lồng
 * hàng chục nghìn ngoặc làm tràn ngăn xếp (`RangeError`) — trước rà soát bảo mật 0551 lỗi đó lọt
 * ra thành 500. Bài phổ thông không bao giờ lồng quá vài tầng, nên 100 vẫn thừa rộng.
 */
const MAX_NESTING = 100

/** Độ sâu ngoặc lớn nhất của chuỗi — `( [ {` cùng tính. Đếm vòng lặp, không đệ quy. */
function nestingDepth(text: string): number {
  let depth = 0
  let max = 0
  for (const ch of text) {
    if (ch === '(' || ch === '[' || ch === '{') max = Math.max(max, ++depth)
    else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1)
  }
  return max
}

/** Chạy `fn`, đổi các lỗi nội bộ thành kết luận "không kiểm được"/"chia cho 0". */
function guarded<T>(fn: () => T): T | Extract<MathStepCheck, { verdict: 'unsupported' }> | 'div0' {
  try {
    return fn()
  } catch (err) {
    if (err instanceof Unsupported) return { verdict: 'unsupported', reason: err.reason }
    if (err instanceof DivisionByZero) return 'div0'
    if (err instanceof StepCheckLimitError) return { verdict: 'unsupported', reason: 'too_complex' }
    throw err
  }
}

/**
 * Kiểm một bước giải phương trình một ẩn so với MỐC (thường là đề bài).
 *
 * @param step     chuỗi học sinh gõ cho bước này (LaTeX phẳng hoặc gõ thường), có thể là chuỗi
 *                 `a ⇒ b` — mọi đoạn đều phải tương đương mốc.
 * @param anchor   phương trình gốc để đối chiếu (đề bài).
 * @param previous bước liền trước (tuỳ chọn) — chỉ để nói lỗi đến từ bước này hay bước trước.
 */
export function checkMathStep(step: string, anchor: string, previous?: string): MathStepCheck {
  if (nestingDepth(step) > MAX_NESTING) return { verdict: 'unsupported', reason: 'too_complex' }
  if (nestingDepth(anchor) > MAX_NESTING) {
    return { verdict: 'unsupported', reason: 'anchor_unsupported' }
  }
  // Các hàm duyệt cây (tìm ẩn, so tập nghiệm) cũng đệ quy và chạy NGOÀI `guarded`: chuỗi
  // `1+1+…+1` vài chục nghìn hạng tử không có ngoặc vẫn làm tràn ngăn xếp → bắt ở đây.
  try {
    return checkMathStepUnsafe(step, anchor, previous)
  } catch (err) {
    if (err instanceof RangeError) return { verdict: 'unsupported', reason: 'too_complex' }
    throw err
  }
}

function checkMathStepUnsafe(step: string, anchor: string, previous?: string): MathStepCheck {
  const anchorStmt = guarded(() => parseStatement(anchor))
  if (anchorStmt === 'div0' || 'verdict' in anchorStmt) {
    return { verdict: 'unsupported', reason: 'anchor_unsupported' }
  }

  const parts = step.split(IMPLIES).map((p) => p.trim())
  if (parts.some((p) => p === '')) return { verdict: 'unsupported', reason: 'not_equation' }
  const stepStmts: Statement[] = []
  let firstProblem: MathStepCheck | null = null
  for (const part of parts) {
    const parsed = guarded(() => parseStatement(part))
    if (parsed === 'div0') return { verdict: 'division_by_zero' }
    if ('verdict' in parsed) {
      firstProblem ??= parsed
      continue
    }
    stepStmts.push(parsed)
  }

  // Một ẩn duy nhất, tên là MỘT chữ cái (bộ tách token gộp `xy` thành một tên → coi là nhiều ẩn).
  const vars = statementVars([anchorStmt, ...stepStmts])
  if (vars.size > 1) return { verdict: 'unsupported', reason: 'multi_variable' }
  const variable = vars.size === 1 ? ([...vars][0] ?? null) : null
  if (variable !== null && !/^[a-zA-Z]$/.test(variable)) {
    return { verdict: 'unsupported', reason: 'multi_variable' }
  }

  // Có bất phương trình (hoặc trị tuyệt đối) ở đề hay ở bất kỳ đoạn nào → cả bước so bằng công
  // thức dấu.
  const useFormula = ![anchorStmt, ...stepStmts].every(isEquationOnly)
  const withInequality = [anchorStmt, ...stepStmts].some(hasInequality)
  const anchorHasAbs = statementHasAbs(anchorStmt)
  const anchorHasSqrt = statementHasSqrt(anchorStmt)
  const anchorSet = guarded(() => comparableOf(anchorStmt, variable, useFormula))
  if (anchorSet === 'div0' || 'verdict' in anchorSet) {
    return { verdict: 'unsupported', reason: 'anchor_unsupported' }
  }

  for (const stmt of stepStmts) {
    const outcome = guarded(() => {
      const set = comparableOf(stmt, variable, useFormula)
      return { set, diff: compareComparable(anchorSet, set, withInequality) }
    })
    if (outcome === 'div0') return { verdict: 'division_by_zero' }
    if ('verdict' in outcome) {
      firstProblem ??= outcome
      continue
    }
    if (outcome.diff.lost || outcome.diff.extra) {
      return {
        verdict: 'changed',
        lost: outcome.diff.lost,
        extra: outcome.diff.extra,
        sameAsPrevious:
          previous !== undefined && sameSetAsPrevious(outcome.set, previous, variable),
        ...(outcome.diff.inequality === undefined ? {} : { inequality: outcome.diff.inequality }),
        ...(anchorHasAbs && !statementHasAbs(stmt)
          ? { absoluteValue: { casesSplit: true as const } }
          : {}),
        ...(anchorHasSqrt && !statementHasSqrt(stmt)
          ? { squareRoot: { removed: true as const } }
          : {}),
      }
    }
  }

  // Có đoạn không đọc được → không được kết luận "tương đương" cho cả bước.
  if (firstProblem !== null) return firstProblem

  const last = stepStmts[stepStmts.length - 1]
  return {
    verdict: 'equivalent',
    isFinalAnswer:
      last !== undefined && isAnswerForm(last, variable) && !isAnswerForm(anchorStmt, variable),
  }
}

// ── Hình dạng một bước (cho gợi ý Socratic — changelog 0551) ────────────────

/**
 * Mô tả CẤU TRÚC của một phương trình một ẩn — để gợi ý hỏi đúng chỗ ("hai vế còn hạng tử nào
 * gộp được?") mà KHÔNG phải giải hộ. Chỉ là đặc điểm hình thức, không chứa nghiệm hay hệ số.
 */
export type MathStepShape = {
  /** Có mẫu số chứa ẩn → phương trình có điều kiện xác định (ĐKXĐ). */
  hasVariableDenominator: boolean
  /** Ẩn có mặt ở CẢ hai vế. */
  variableOnBothSides: boolean
  /** Một vế còn ≥ 2 hạng tử cùng loại (hai hằng số, hoặc hai hạng tử cùng bậc của ẩn). */
  hasLikeTerms: boolean
  /** Còn tích/luỹ thừa của một tổng có chứa ẩn — phá ngoặc được, vd `2(x + 3)`. */
  hasExpandableProduct: boolean
  /** Vế chứa ẩn còn kèm hạng tử tự do, vế kia không có ẩn (dạng ax + b = c). */
  constantBesideVariable: boolean
  /** Dạng `a·x = b` với a ≠ 1: chỉ còn bước làm cho ẩn đứng một mình. */
  coefficientNotOne: boolean
  /** Bậc của ẩn sau khi chuyển hết về một vế (0 khi không còn ẩn). */
  degree: number
  /** Đã ở dạng đáp số `ẩn = hằng số`. */
  isAnswerForm: boolean
}

/** Tách một vế thành các hạng tử cộng/trừ (bỏ dấu, chỉ giữ hình dạng). */
function additiveTerms(node: ExprNode): ExprNode[] {
  if (node.type === 'binary' && (node.op === '+' || node.op === '-')) {
    return [...additiveTerms(node.left), ...additiveTerms(node.right)]
  }
  if (node.type === 'unary') return additiveTerms(node.arg)
  return [node]
}

const hasVar = (node: ExprNode): boolean => {
  const s = new Set<string>()
  collectVars(node, s)
  return s.size > 0
}

/** Có nhân/luỹ thừa một TỔNG chứa ẩn không (`2(x+3)`, `(x-1)^2`). */
function hasProductOfSum(node: ExprNode): boolean {
  if (node.type === 'binary') {
    if (node.op === '*' || node.op === '^') {
      const isSumWithVar = (n: ExprNode) =>
        n.type === 'binary' && (n.op === '+' || n.op === '-') && hasVar(n)
      if (isSumWithVar(node.left) || isSumWithVar(node.right)) return true
    }
    return hasProductOfSum(node.left) || hasProductOfSum(node.right)
  }
  if (node.type === 'unary' || node.type === 'call') return hasProductOfSum(node.arg)
  return false
}

/** Bậc của một hạng tử là đơn thức (`3x²`); không phải đơn thức (có mẫu chứa ẩn…) → null. */
function monomialDegree(term: ExprNode, variable: string): number | null {
  const fn = toRatFn(term, variable, [])
  if (!isConstant(fn.den)) return null
  const nonZero = fn.num.filter((c) => c.n !== 0n).length
  return nonZero === 1 ? fn.num.length - 1 : null
}

/** Hai hạng tử cùng loại trên một vế: hai hằng số, hoặc hai đơn thức cùng bậc. */
function sideHasLikeTerms(terms: readonly ExprNode[], variable: string | null): boolean {
  const seen = new Set<number>()
  for (const t of terms) {
    const deg = hasVar(t) ? (variable === null ? null : monomialDegree(t, variable)) : 0
    if (deg === null) continue
    if (seen.has(deg)) return true
    seen.add(deg)
  }
  return false
}

/**
 * Đặc điểm hình thức của MỆNH ĐỀ CUỐI trong bước (sau dấu ⇒ cuối). `null` khi không đọc được,
 * có "hoặc", có nhiều hơn hai vế, nhiều ẩn hoặc ngoài phạm vi — khi đó gợi ý dùng câu chung.
 */
export function describeMathStep(step: string): MathStepShape | null {
  if (nestingDepth(step) > MAX_NESTING) return null
  try {
    return describeMathStepUnsafe(step)
  } catch (err) {
    if (err instanceof RangeError) return null
    throw err
  }
}

function describeMathStepUnsafe(step: string): MathStepShape | null {
  const parts = step.split(IMPLIES)
  const last = parts[parts.length - 1]?.trim() ?? ''
  const result = guarded((): MathStepShape | null => {
    const stmt = parseStatement(last)
    if (stmt.length !== 1) return null
    const clause = stmt[0]
    // Hình dạng chỉ mô tả PHƯƠNG TRÌNH hai vế; bất phương trình → câu gợi ý chung.
    if (clause === undefined || clause.sides.length !== 2 || clause.rels[0] !== '=') return null
    if (clause.fromSet === true) return null
    if (clause.sides.some((n) => containsAbs(n) || containsSqrt(n))) return null
    const vars = statementVars([stmt])
    if (vars.size > 1) return null
    const variable = vars.size === 1 ? ([...vars][0] ?? null) : null
    if (variable !== null && !/^[a-zA-Z]$/.test(variable)) return null

    const [left, right] = clause.sides as [ExprNode, ExprNode]
    const domain: Poly[] = []
    const l = toRatFn(left, variable, domain)
    const r = toRatFn(right, variable, domain)
    const diff = polySub(polyMul(l.num, r.den), polyMul(r.num, l.den))

    const leftTerms = additiveTerms(left)
    const rightTerms = additiveTerms(right)
    const leftHasVar = hasVar(left)
    const rightHasVar = hasVar(right)
    const varSideTerms = leftHasVar && !rightHasVar ? leftTerms : rightTerms
    const singleVarSide = leftHasVar !== rightHasVar
    const onlyTerm = varSideTerms.length === 1 ? varSideTerms[0] : undefined
    const otherSide = leftHasVar ? right : left

    return {
      hasVariableDenominator: domain.length > 0,
      variableOnBothSides: leftHasVar && rightHasVar,
      hasLikeTerms: sideHasLikeTerms(leftTerms, variable) || sideHasLikeTerms(rightTerms, variable),
      hasExpandableProduct: hasProductOfSum(left) || hasProductOfSum(right),
      constantBesideVariable: singleVarSide && varSideTerms.some((t) => !hasVar(t)),
      coefficientNotOne:
        singleVarSide &&
        variable !== null &&
        onlyTerm !== undefined &&
        additiveTerms(otherSide).length === 1 &&
        !(onlyTerm.type === 'var') &&
        monomialDegree(onlyTerm, variable) === 1,
      degree: isZeroPoly(diff) ? 0 : diff.length - 1,
      isAnswerForm: isAnswerForm(stmt, variable),
    }
  })
  if (result === null || result === 'div0' || 'verdict' in result) return null
  return result
}

/**
 * Bộ kiểm có ĐỌC được bước này không (phương trình hoặc bất phương trình một ẩn, mọi đoạn ⇒) —
 * dùng khi bước là MỐC (đề lời văn, bước 1) nên không có gì để so. Không kết luận đúng/sai.
 */
export function readsAsMathStatement(step: string): boolean {
  if (nestingDepth(step) > MAX_NESTING) return false
  try {
    const result = guarded(() => {
      const stmts = step.split(IMPLIES).map((p) => parseStatement(p.trim()))
      const vars = statementVars(stmts)
      if (vars.size > 1) return false
      const variable = vars.size === 1 ? ([...vars][0] ?? null) : null
      if (variable !== null && !/^[a-zA-Z]$/.test(variable)) return false
      for (const st of stmts) statementFormula(st, variable)
      return true
    })
    return result === true
  } catch (err) {
    if (err instanceof RangeError) return false
    throw err
  }
}

/** Bước này có cùng tập nghiệm với bước liền trước không (để chỉ đúng chỗ lỗi bắt đầu). */
function sameSetAsPrevious(
  stepSet: Comparable,
  previous: string,
  variable: string | null,
): boolean {
  const parts = previous.split(IMPLIES)
  const lastPart = parts[parts.length - 1]?.trim() ?? ''
  const result = guarded(() => {
    const stmt = parseStatement(lastPart)
    // Bước trước dùng ẩn khác → không so được, coi như khác.
    for (const name of statementVars([stmt])) if (name !== variable) return false
    const asFormula = stepSet.kind === 'formula' || !isEquationOnly(stmt)
    const diff = compareComparable(comparableOf(stmt, variable, asFormula), stepSet, false)
    return !diff.lost && !diff.extra
  })
  return result === true
}
