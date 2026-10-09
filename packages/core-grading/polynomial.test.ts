// Nền số học chính xác của bộ kiểm bước giải (đặc tả docs/specs/2026-10-09-kiem-buoc-giai-stem.md §5).
import { describe, it, expect } from 'vitest'
import {
  rat,
  fromNumber,
  toSmallInteger,
  div,
  add,
  StepCheckLimitError,
  ZERO,
  ONE,
} from './rational.js'
import {
  type Poly,
  countRealRoots,
  polyDivMod,
  polyGcd,
  polyMul,
  removeFactorsOf,
  squareFree,
  derivative,
  MAX_DEGREE,
  X_POLY,
  constPoly,
  polySub,
} from './polynomial.js'

/** Đa thức từ hệ số nguyên theo bậc tăng dần. */
const P = (...coeffs: number[]): Poly => coeffs.map((c) => rat(BigInt(c)))
const show = (p: Poly) => p.map((c) => (c.d === 1n ? `${c.n}` : `${c.n}/${c.d}`))

describe('rational', () => {
  it('tối giản, mẫu dương, 0 chuẩn', () => {
    expect(rat(4n, -6n)).toEqual({ n: -2n, d: 3n })
    expect(rat(0n, -5n)).toBe(ZERO)
    expect(add(rat(1n, 3n), rat(1n, 6n))).toEqual({ n: 1n, d: 2n })
  })

  it('mẫu 0 và chia 0 là lỗi lập trình (nơi gọi phải chặn trước)', () => {
    expect(() => rat(1n, 0n)).toThrow(RangeError)
    expect(() => div(ONE, ZERO)).toThrow(RangeError)
  })

  it('vượt trần độ lớn → StepCheckLimitError', () => {
    expect(() => rat(1n << 3000n)).toThrow(StepCheckLimitError)
    expect(() => fromNumber(1e-320)).toThrow(StepCheckLimitError)
  })

  it('fromNumber đọc đúng dạng thập phân ngắn nhất, kể cả ký hiệu khoa học', () => {
    expect(fromNumber(0.1)).toEqual({ n: 1n, d: 10n })
    expect(fromNumber(-2.5)).toEqual({ n: -5n, d: 2n })
    expect(fromNumber(1e21)).toEqual({ n: 10n ** 21n, d: 1n })
    expect(fromNumber(1.5e-7)).toEqual({ n: 3n, d: 20_000_000n })
    expect(fromNumber(Number.NaN)).toBeNull()
    expect(fromNumber(Number.POSITIVE_INFINITY)).toBeNull()
  })

  it('toSmallInteger chỉ nhận số nguyên nhỏ', () => {
    expect(toSmallInteger(rat(-3n))).toBe(-3)
    expect(toSmallInteger(rat(1n, 2n))).toBeNull()
    expect(toSmallInteger(rat(10n ** 9n))).toBeNull()
  })
})

describe('polynomial', () => {
  it('chia có dư và ƯCLN dạng chuẩn', () => {
    // x² − 1 = (x − 1)(x + 1)
    const { q, r } = polyDivMod(P(-1, 0, 1), P(-1, 1))
    expect(show(q)).toEqual(['1', '1'])
    expect(r).toEqual([])
    expect(show(polyGcd(P(-1, 0, 1), P(2, 2)))).toEqual(['1', '1']) // x + 1
    expect(() => polyDivMod(P(1), [])).toThrow(RangeError)
  })

  it('phần không lặp gộp nghiệm kép', () => {
    expect(show(squareFree(P(1, -2, 1)))).toEqual(['-1', '1']) // (x−1)² → x − 1
    expect(squareFree(P(5))).toEqual([ONE])
    expect(squareFree([])).toEqual([])
    expect(derivative(P(7))).toEqual([])
  })

  it('đếm nghiệm thực phân biệt bằng dãy Sturm', () => {
    expect(countRealRoots(P(1, 0, 1))).toBe(0) // x² + 1
    expect(countRealRoots(P(0, -1, 0, 1))).toBe(3) // x³ − x
    expect(countRealRoots(P(1, -2, 1))).toBe(1) // (x − 1)²
    expect(countRealRoots(P(-2, 0, 1))).toBe(2) // x² − 2 (nghiệm vô tỉ)
    expect(countRealRoots(P(4))).toBe(0)
    expect(() => countRealRoots([])).toThrow(RangeError)
  })

  it('removeFactorsOf bỏ hết mọi luỹ thừa của nhân tử chung', () => {
    const xSquared = polyMul(X_POLY, X_POLY)
    expect(show(removeFactorsOf(polyMul(xSquared, P(-1, 1)), X_POLY))).toEqual(['-1', '1'])
    expect(removeFactorsOf([], X_POLY)).toEqual([])
    expect(removeFactorsOf(P(1, 1), constPoly(rat(3n)))).toEqual(P(1, 1))
  })

  it('vượt trần bậc → StepCheckLimitError', () => {
    let p: Poly = X_POLY
    expect(() => {
      for (let i = 0; i < MAX_DEGREE + 1; i++) p = polyMul(p, X_POLY)
    }).toThrow(StepCheckLimitError)
    const big: Poly = Array.from({ length: MAX_DEGREE + 2 }, () => ONE)
    expect(() => polySub(big, [])).toThrow(StepCheckLimitError)
  })
})
