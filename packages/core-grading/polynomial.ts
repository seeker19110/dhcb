// Đa thức MỘT BIẾN với hệ số hữu tỉ chính xác — nền cho bộ kiểm bước giải (stepCheckMath.ts).
// Đặc tả: docs/specs/2026-10-09-kiem-buoc-giai-stem.md §5.
//
// Biểu diễn: mảng hệ số theo bậc TĂNG dần (`[c0, c1, c2]` = c0 + c1·x + c2·x²), không có số 0
// thừa ở cuối. Đa thức 0 là mảng rỗng.
//
// Ba công cụ then chốt:
//  - ƯCLN đa thức (Euclid) → tìm phần nghiệm chung của hai phương trình.
//  - Phần không lặp (square-free) p / ƯCLN(p, p') → nghiệm kép chỉ tính một lần.
//  - Dãy Sturm → ĐẾM CHÍNH XÁC số nghiệm thực phân biệt, không cần tìm nghiệm bằng số gần đúng.

import {
  type Rational,
  StepCheckLimitError,
  ZERO,
  ONE,
  add,
  sub,
  mul,
  div,
  neg,
  isZero,
  eq,
  sign,
} from './rational.js'

export type Poly = readonly Rational[]

/** Trần bậc đa thức — toán phổ thông không cần cao hơn; vượt thì "chưa tự kiểm được". */
export const MAX_DEGREE = 24

function trim(coeffs: Rational[]): Poly {
  let end = coeffs.length
  while (end > 0 && isZero(coeffs[end - 1] ?? ZERO)) end--
  const out = coeffs.slice(0, end)
  if (out.length - 1 > MAX_DEGREE) throw new StepCheckLimitError('Bậc đa thức quá cao')
  return out
}

const at = (p: Poly, i: number): Rational => p[i] ?? ZERO

export const ZERO_POLY: Poly = []
export const ONE_POLY: Poly = [ONE]
export const X_POLY: Poly = [ZERO, ONE]

export const constPoly = (c: Rational): Poly => (isZero(c) ? ZERO_POLY : [c])
/** Bậc đa thức; đa thức 0 có bậc −1 theo quy ước của file này. */
export const degree = (p: Poly): number => p.length - 1
export const isZeroPoly = (p: Poly): boolean => p.length === 0
export const isConstant = (p: Poly): boolean => p.length <= 1
export const leading = (p: Poly): Rational => at(p, p.length - 1)

export function polyEq(a: Poly, b: Poly): boolean {
  return a.length === b.length && a.every((c, i) => eq(c, at(b, i)))
}

export function polyAdd(a: Poly, b: Poly): Poly {
  const n = Math.max(a.length, b.length)
  const out: Rational[] = []
  for (let i = 0; i < n; i++) out.push(add(at(a, i), at(b, i)))
  return trim(out)
}

export function polyNeg(a: Poly): Poly {
  return a.map(neg)
}

export function polySub(a: Poly, b: Poly): Poly {
  return polyAdd(a, polyNeg(b))
}

export function polyMul(a: Poly, b: Poly): Poly {
  if (isZeroPoly(a) || isZeroPoly(b)) return ZERO_POLY
  if (degree(a) + degree(b) > MAX_DEGREE) throw new StepCheckLimitError('Bậc đa thức quá cao')
  const out: Rational[] = Array.from({ length: a.length + b.length - 1 }, () => ZERO)
  a.forEach((ca, i) => {
    b.forEach((cb, j) => {
      out[i + j] = add(out[i + j] ?? ZERO, mul(ca, cb))
    })
  })
  return trim(out)
}

export function polyScale(a: Poly, c: Rational): Poly {
  return trim(a.map((x) => mul(x, c)))
}

/** Chia có dư: a = q·b + r với bậc r < bậc b. `b` khác 0. */
export function polyDivMod(a: Poly, b: Poly): { q: Poly; r: Poly } {
  if (isZeroPoly(b)) throw new RangeError('Chia đa thức cho 0')
  const r: Rational[] = [...a]
  const q: Rational[] = Array.from({ length: Math.max(0, a.length - b.length + 1) }, () => ZERO)
  const lb = leading(b)
  for (let k = a.length - b.length; k >= 0; k--) {
    const coef = div(r[k + b.length - 1] ?? ZERO, lb)
    q[k] = coef
    if (isZero(coef)) continue
    for (let j = 0; j < b.length; j++) {
      r[k + j] = sub(r[k + j] ?? ZERO, mul(coef, at(b, j)))
    }
  }
  return { q: trim(q), r: trim(r.slice(0, Math.max(0, b.length - 1))) }
}

/** Đưa hệ số cao nhất về 1 (đa thức 0 giữ nguyên). */
export function monic(p: Poly): Poly {
  if (isZeroPoly(p)) return p
  const lc = leading(p)
  return p.map((c) => div(c, lc))
}

/** ƯCLN dạng chuẩn (hệ số cao nhất = 1). ƯCLN(0, 0) = 0. */
export function polyGcd(a: Poly, b: Poly): Poly {
  let x = a
  let y = b
  while (!isZeroPoly(y)) {
    const { r } = polyDivMod(x, y)
    x = y
    y = r
  }
  return monic(x)
}

/** Chia hết (đã biết b | a). */
export function polyExactDiv(a: Poly, b: Poly): Poly {
  return polyDivMod(a, b).q
}

export function derivative(p: Poly): Poly {
  const out: Rational[] = []
  for (let i = 1; i < p.length; i++) out.push(mul(at(p, i), { n: BigInt(i), d: 1n }))
  return trim(out)
}

/** Phần không lặp, dạng chuẩn: cùng tập nghiệm (phức) với `p` nhưng mỗi nghiệm bậc 1. */
export function squareFree(p: Poly): Poly {
  if (isConstant(p)) return isZeroPoly(p) ? p : ONE_POLY
  return monic(polyExactDiv(p, polyGcd(p, derivative(p))))
}

/** Bỏ khỏi `p` MỌI nhân tử chung với `q` (dùng để loại các điểm ngoài tập xác định). */
export function removeFactorsOf(p: Poly, q: Poly): Poly {
  if (isZeroPoly(p) || isConstant(q)) return p
  let current = p
  for (;;) {
    const g = polyGcd(current, q)
    if (isConstant(g)) return current
    current = polyExactDiv(current, g)
  }
}

/** Dấu của đa thức tại +∞ (`atPlus`) hoặc −∞. */
function signAtInfinity(p: Poly, atPlus: boolean): number {
  const s = sign(leading(p))
  return atPlus || degree(p) % 2 === 0 ? s : -s
}

/**
 * Số nghiệm THỰC PHÂN BIỆT của `p` (định lý Sturm) — tính chính xác trên số hữu tỉ.
 * `p` khác 0. Đa thức hằng khác 0 không có nghiệm.
 */
export function countRealRoots(p: Poly): number {
  if (isZeroPoly(p)) throw new RangeError('Đa thức 0 có vô số nghiệm')
  if (isConstant(p)) return 0
  const sf = squareFree(p)
  const chain: Poly[] = [sf, derivative(sf)]
  for (;;) {
    const a = chain[chain.length - 2] ?? ZERO_POLY
    const b = chain[chain.length - 1] ?? ZERO_POLY
    const { r } = polyDivMod(a, b)
    if (isZeroPoly(r)) break
    chain.push(polyNeg(r))
  }
  const changes = (atPlus: boolean): number => {
    let count = 0
    let prev = 0
    for (const q of chain) {
      const s = signAtInfinity(q, atPlus)
      if (s !== 0 && prev !== 0 && s !== prev) count++
      if (s !== 0) prev = s
    }
    return count
  }
  return changes(false) - changes(true)
}
