// Tập nghiệm của BẤT PHƯƠNG TRÌNH một ẩn — so CHÍNH XÁC hai tập bằng phân hoạch trục số.
// Đặc tả: docs/specs/2026-10-11-kiem-buoc-bat-phuong-trinh.md ①. Chỉ `stepCheckMath.ts` import.
//
// Ý tưởng: một tập nghiệm là một CÔNG THỨC dấu ("N/D < 0 VÀ mẫu ≠ 0", nối "hoặc"…) trên các đa
// thức hệ số hữu tỉ. Gộp mọi đa thức của HAI tập cần so thành một đa thức tới hạn C (không lặp).
// Nghiệm thực của C chia trục số thành các Ô: từng khoảng mở giữa hai nghiệm liền kề và từng
// nghiệm. Trên mỗi ô, dấu của MỌI đa thức đã gộp là không đổi — nên hai tập bằng nhau ⇔ cùng
// thuộc/không thuộc ở từng ô. Mọi phép tính là số hữu tỉ BigInt + dãy Sturm, không làm tròn:
//   - ô khoảng: tính dấu tại một điểm HỮU TỈ bên trong;
//   - ô nghiệm (có thể vô tỉ, vd √2): nghiệm được cách ly trong (lo, hi) chứa đúng MỘT nghiệm
//     của C. Đa thức p (ước của C về tập nghiệm) bằng 0 tại nghiệm đó ⇔ ƯCLN(p, C) đổi dấu trên
//     (lo, hi); nếu không, p không có nghiệm nào trong (lo, hi) nên dấu của p tại nghiệm = dấu
//     tại lo.

import {
  StepCheckLimitError,
  add,
  div,
  mul,
  neg,
  rat,
  sign,
  sub,
  type Rational,
} from './rational.js'
import {
  type Poly,
  ONE_POLY,
  degree,
  isConstant,
  isZeroPoly,
  leading,
  monic,
  polyEval,
  polyExactDiv,
  polyGcd,
  polyMul,
  signChanges,
  squareFree,
  sturmChain,
} from './polynomial.js'

/** Quan hệ giữa hai vế. `≤`/`≥` đã chuẩn hoá từ `\le`, `<=`, `⩽`… ở bộ đọc. */
export type Rel = '=' | '<' | '>' | '≤' | '≥'

/** Công thức dấu mô tả một tập nghiệm thực. */
export type SetFormula =
  | { kind: 'atom'; num: Poly; den: Poly; rel: Rel } // (num/den) rel 0, mẫu ≠ 0 do `nonzero` lo
  | { kind: 'nonzero'; poly: Poly } // điều kiện xác định: poly ≠ 0
  | { kind: 'and'; parts: SetFormula[] }
  | { kind: 'or'; parts: SetFormula[] }

/**
 * Trần số ô của phân hoạch. Với trần bậc 24 của `polynomial.ts`, C có tối đa 24 nghiệm nên tối
 * đa 49 ô — trần này là lưới an toàn thứ hai, phòng khi trần bậc bị nới.
 */
const MAX_CELLS = 200
/** Trần số lần chia đôi khi cách ly nghiệm — hai nghiệm sát nhau tới mức này thì "chưa kiểm". */
const MAX_BISECTIONS = 4000

function relHolds(rel: Rel, s: number): boolean {
  switch (rel) {
    case '=':
      return s === 0
    case '<':
      return s < 0
    case '>':
      return s > 0
    case '≤':
      return s <= 0
    case '≥':
      return s >= 0
  }
}

function polysOf(f: SetFormula, out: Poly[]): void {
  switch (f.kind) {
    case 'atom':
      out.push(f.num, f.den)
      return
    case 'nonzero':
      out.push(f.poly)
      return
    case 'and':
    case 'or':
      for (const p of f.parts) polysOf(p, out)
  }
}

/** Bội chung nhỏ nhất (không lặp, dạng chuẩn) của mọi đa thức KHÁC hằng. */
function criticalPoly(polys: readonly Poly[]): Poly {
  let c: Poly = ONE_POLY
  for (const p of polys) {
    if (isConstant(p)) continue
    const sf = squareFree(p)
    c = monic(polyMul(c, polyExactDiv(sf, polyGcd(c, sf))))
  }
  return c
}

/** Ô của phân hoạch: một điểm hữu tỉ đại diện khoảng mở, hoặc một nghiệm cách ly trong (lo, hi). */
type Cell = { kind: 'interval'; at: Rational } | { kind: 'root'; lo: Rational; hi: Rational }

const absRat = (a: Rational): Rational => (sign(a) < 0 ? neg(a) : a)
const half = rat(1n, 2n)

/** Cận Cauchy: mọi nghiệm thực r thoả |r| < 1 + max|aᵢ/aₙ| (bất đẳng thức NGẶT). */
function cauchyBound(p: Poly): Rational {
  const lc = leading(p)
  let max = rat(0n)
  for (let i = 0; i < p.length - 1; i++) {
    const v = absRat(div(p[i] ?? rat(0n), lc))
    if (sub(v, max).n > 0n) max = v
  }
  return add(max, rat(1n))
}

/** Cách ly mọi nghiệm thực của `c` (không lặp) thành các khoảng mở rời nhau, xếp tăng dần. */
function isolateRoots(c: Poly): { lo: Rational; hi: Rational }[] {
  if (isConstant(c)) return []
  const chain = sturmChain(c)
  const v = (x: Rational) => signChanges(chain.map((q) => sign(polyEval(q, x))))
  const isRoot = (x: Rational) => sign(polyEval(c, x)) === 0
  const out: { lo: Rational; hi: Rational }[] = []
  let budget = MAX_BISECTIONS

  // Điểm chia nằm trong (lo, hi) và KHÔNG phải nghiệm của c: thử 1/2, rồi 1/2 + 1/(4+j). C có
  // tối đa `degree(c)` nghiệm nên chắc chắn tìm được trong degree(c) + 1 lần thử.
  const splitPoint = (lo: Rational, hi: Rational): Rational => {
    const width = sub(hi, lo)
    for (let j = -1; j <= degree(c); j++) {
      const frac = j < 0 ? half : add(half, rat(1n, BigInt(4 + j)))
      const t = add(lo, mul(width, frac))
      if (!isRoot(t)) return t
    }
    throw new StepCheckLimitError('Không tìm được điểm chia')
  }

  // Duyệt trái → phải bằng ngăn xếp (không đệ quy) để ra thứ tự tăng dần.
  const bound = cauchyBound(c)
  const stack: [Rational, Rational, number, number][] = [
    [neg(bound), bound, v(neg(bound)), v(bound)],
  ]
  while (stack.length > 0) {
    const [lo, hi, vlo, vhi] = stack.pop() as [Rational, Rational, number, number]
    const n = vlo - vhi
    if (n === 0) continue
    if (n === 1) {
      out.push({ lo, hi })
      continue
    }
    if (--budget < 0) throw new StepCheckLimitError('Nghiệm quá sát nhau')
    const mid = splitPoint(lo, hi)
    const vm = v(mid)
    stack.push([mid, hi, vm, vhi]) // nửa phải vào trước → nửa trái ra trước
    stack.push([lo, mid, vlo, vm])
  }
  return out
}

/** Phân hoạch trục số theo nghiệm thực của `c`. */
function cellsOf(c: Poly): Cell[] {
  const roots = isolateRoots(c)
  const first = roots[0]
  const last = roots[roots.length - 1]
  if (first === undefined || last === undefined) return [{ kind: 'interval', at: rat(0n) }]
  const cells: Cell[] = [{ kind: 'interval', at: sub(first.lo, rat(1n)) }]
  roots.forEach((r, i) => {
    cells.push({ kind: 'root', lo: r.lo, hi: r.hi })
    const next = roots[i + 1]
    // Giữa hai khoảng cách ly liền kề không có nghiệm nào → trung điểm [hi_i, lo_{i+1}] hợp lệ.
    cells.push({
      kind: 'interval',
      at: next === undefined ? add(r.hi, rat(1n)) : mul(add(r.hi, next.lo), half),
    })
  })
  if (cells.length > MAX_CELLS) throw new StepCheckLimitError('Quá nhiều ô')
  return cells
}

/** Dấu CHÍNH XÁC của `p` trên ô (mọi nghiệm thực của p đều là nghiệm của `c`). */
function signOn(p: Poly, cell: Cell, c: Poly): number {
  if (isZeroPoly(p)) return 0
  if (isConstant(p)) return sign(leading(p))
  if (cell.kind === 'interval') return sign(polyEval(p, cell.at))
  const g = polyGcd(p, c)
  if (!isConstant(g) && sign(polyEval(g, cell.lo)) !== sign(polyEval(g, cell.hi))) return 0
  return sign(polyEval(p, cell.lo))
}

function holdsOn(f: SetFormula, cell: Cell, c: Poly): boolean {
  switch (f.kind) {
    case 'atom':
      return relHolds(f.rel, signOn(f.num, cell, c) * signOn(f.den, cell, c))
    case 'nonzero':
      return signOn(f.poly, cell, c) !== 0
    case 'and':
      return f.parts.every((p) => holdsOn(p, cell, c))
    case 'or':
      return f.parts.some((p) => holdsOn(p, cell, c))
  }
}

export type FormulaComparison = {
  /** Có số thực thuộc tập `a` mà không thuộc tập `b`. */
  lost: boolean
  /** Có số thực thuộc tập `b` mà không thuộc tập `a`. */
  extra: boolean
  /**
   * Trên MỌI khoảng mở của phân hoạch, `b` thuộc đúng chỗ `a` không thuộc và ngược lại — tức `b`
   * là phần bù của `a` (sai khác tối đa ở các điểm đầu mút). Dấu hiệu của "quên đổi chiều" khi
   * nhân/chia hai vế cho số âm.
   */
  complementOnIntervals: boolean
}

/** So hai tập nghiệm CHÍNH XÁC. Vượt trần → `StepCheckLimitError` (nơi gọi đổi thành "?"). */
export function compareFormulas(a: SetFormula, b: SetFormula): FormulaComparison {
  const polys: Poly[] = []
  polysOf(a, polys)
  polysOf(b, polys)
  const c = criticalPoly(polys)
  let lost = false
  let extra = false
  let complementOnIntervals = true
  for (const cell of cellsOf(c)) {
    const inA = holdsOn(a, cell, c)
    const inB = holdsOn(b, cell, c)
    if (inA && !inB) lost = true
    if (inB && !inA) extra = true
    if (cell.kind === 'interval' && inA === inB) complementOnIntervals = false
  }
  return { lost, extra, complementOnIntervals }
}
