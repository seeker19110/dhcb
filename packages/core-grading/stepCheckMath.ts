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
//   - mọi thứ ngoài phạm vi (căn, lượng giác, trị tuyệt đối, ký hiệu khoảng, nhiều ẩn, LaTeX lạ,
//     quá lớn) → "unsupported" để giao diện nói thật "? Chưa tự kiểm được" — tuyệt đối không đoán.
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
import { div as ratDiv, ONE } from './rational.js'
import { compareFormulas, type Rel, type SetFormula } from './mathSolutionSet.js'

/** Vì sao bộ kiểm KHÔNG kết luận được — để phản hồi nói rõ giới hạn, không nói chung chung. */
export type MathUnsupportedReason =
  | 'not_equation' // không có dấu `=` hay dấu bất đẳng thức (biểu thức trơn)
  | 'unknown_notation' // lệnh LaTeX/ký hiệu bộ đọc không hiểu
  | 'multi_variable' // nhiều hơn một ẩn, hoặc tên ẩn không phải một chữ cái
  | 'non_polynomial' // căn, lượng giác, log, π, số mũ không nguyên…
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
      if (node.name !== variable) throw new Unsupported('multi_variable')
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
          return reduce(
            polyAdd(polyMul(a.num, b.den), polyMul(b.num, a.den)),
            polyMul(a.den, b.den),
          )
        case '-':
          return reduce(
            polySub(polyMul(a.num, b.den), polyMul(b.num, a.den)),
            polyMul(a.den, b.den),
          )
        case '*':
          return reduce(polyMul(a.num, b.num), polyMul(a.den, b.den))
        case '/':
          if (isZeroPoly(b.num)) throw new DivisionByZero()
          if (!isConstant(b.num)) domain.push(b.num)
          return reduce(polyMul(a.num, b.den), polyMul(a.den, b.num))
      }
    }
  }
}

/** Luỹ thừa: chỉ nhận số mũ là hằng số NGUYÊN (âm thì thành phân thức, ghi điều kiện ≠ 0). */
function powerNode(base: RatFn, exponentNode: ExprNode, variable: string | null, domain: Poly[]) {
  const e = toRatFn(exponentNode, variable, domain)
  if (!isConstant(e.num) || !isConstant(e.den)) throw new Unsupported('non_polynomial')
  const value = isZeroPoly(e.num) ? 0 : toSmallInteger(ratDiv(leading(e.num), leading(e.den)))
  if (value === null) throw new Unsupported('non_polynomial') // x^(1/2) = căn → ngoài phạm vi
  if (Math.abs(value) > MAX_DEGREE) throw new Unsupported('too_complex')
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
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/\\(?:cdot|times|ast)(?![a-zA-Z])/g, '*')
    .replace(/\\div(?![a-zA-Z])/g, '/')
    // Dấu chia kiểu SGK Việt Nam `6 : 2` — cùng độ ưu tiên với `/` và `÷`. Đặt SAU bước đổi `\:`
    // (khoảng trắng LaTeX) nên không nhầm. Trong MỘT BƯỚC GIẢI phương trình một ẩn thì `:` là chia;
    // tỉ lệ `a:b` (hình học/xác suất/Sinh) ở đây cũng đọc là a/b — cùng giá trị nên không sai nghĩa.
    // `::`, `:` đầu/cuối thành `//`, `/` thừa → bộ phân tích báo không đọc được như với `/`.
    .replace(/:/g, '/')
  const expanded = expandFractions(s)
  if (expanded === null) return null
  s = expanded.replace(/\{/g, '(').replace(/\}/g, ')')
  if (s.includes('\\')) return null // LaTeX lạ (\sqrt, \sin, \pi, \neq, \le…) — không đoán
  if (/pi|π/.test(s)) return null // π không phải số hữu tỉ
  return s
}

/** Các vế nối nhau bằng quan hệ: `a = b = c`, `a < x \le b` (`rels[i]` nằm giữa vế i và i+1). */
type Clause = { sides: ExprNode[]; rels: Rel[] }
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

/** Mệnh đề chỉ toàn dấu `=` (phương trình) — đi nhánh so tập nghiệm cũ. */
const isEquationOnly = (st: Statement): boolean =>
  st.every((clause) => clause.rels.every((r) => r === '='))

/** Một đoạn (giữa hai dấu ⇒) → các mệnh đề "hoặc", đã khai triển ±. */
function parseStatement(raw: string): Statement {
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

/** Một mệnh đề → "mọi cặp vế liền nhau thoả quan hệ" VÀ "mọi mẫu số ≠ 0". */
function clauseFormula(clause: Clause, variable: string | null): SetFormula {
  const domain: Poly[] = []
  const fns = clause.sides.map((node) => toRatFn(node, variable, domain))
  const parts: SetFormula[] = []
  clause.rels.forEach((rel, i) => {
    const a = fns[i]
    const b = fns[i + 1]
    if (a === undefined || b === undefined) return
    // a rel b ⇔ (a − b) rel 0, với a − b = (a.num·b.den − b.num·a.den) / (a.den·b.den).
    const num = polySub(polyMul(a.num, b.den), polyMul(b.num, a.den))
    parts.push({ kind: 'atom', num, den: polyMul(a.den, b.den), rel })
  })
  for (const d of domain) if (!isConstant(d)) parts.push({ kind: 'nonzero', poly: d })
  return { kind: 'and', parts }
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

/** So hai tập: cả hai là phương trình → nhánh cũ (y hệt trước đây); còn lại → phân hoạch. */
function compareComparable(
  a: Comparable,
  b: Comparable,
): { lost: boolean; extra: boolean; inequality?: { complementOnIntervals: boolean } } {
  if (a.kind === 'set' && b.kind === 'set') return compareSets(a.set, b.set)
  const { lost, extra, complementOnIntervals } = compareFormulas(asFormula(a), asFormula(b))
  return { lost, extra, inequality: { complementOnIntervals } }
}

/** Đoạn cuối có ở dạng đáp số chưa — mỗi mệnh đề là một trong:
 *  `ẩn <qh> hằng số`, `hằng số <qh> ẩn` (qh là `=` hoặc dấu bất đẳng thức), hoặc
 *  `a <qh> ẩn <qh> b` với hai dấu CÙNG chiều (`a < x \le b`), a, b là hằng số. */
function isAnswerForm(statement: Statement, variable: string | null): boolean {
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

  // Có bất phương trình ở đề hoặc ở bất kỳ đoạn nào → cả bước so bằng công thức dấu.
  const useFormula = ![anchorStmt, ...stepStmts].every(isEquationOnly)
  const anchorSet = guarded(() => comparableOf(anchorStmt, variable, useFormula))
  if (anchorSet === 'div0' || 'verdict' in anchorSet) {
    return { verdict: 'unsupported', reason: 'anchor_unsupported' }
  }

  for (const stmt of stepStmts) {
    const outcome = guarded(() => {
      const set = comparableOf(stmt, variable, useFormula)
      return { set, diff: compareComparable(anchorSet, set) }
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
    const diff = compareComparable(comparableOf(stmt, variable, asFormula), stepSet)
    return !diff.lost && !diff.extra
  })
  return result === true
}
