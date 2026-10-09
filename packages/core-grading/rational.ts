// Số hữu tỉ CHÍNH XÁC trên BigInt — nền cho bộ kiểm bước giải (stepCheckMath.ts).
// Đặc tả: docs/specs/2026-10-09-kiem-buoc-giai-stem.md §5.
//
// Vì sao không dùng số thực (float): bộ kiểm bước chỉ được nói "✓ hợp lệ" khi ĐÃ CHỨNG MINH.
// Phép chia đa thức/ƯCLN trên float sai số tích luỹ → có thể "chứng minh" nhầm hai tập nghiệm
// bằng nhau. Trên số hữu tỉ chính xác, mọi phép tính là đúng tuyệt đối.

/** Vượt trần độ lớn → dừng kiểm (trả "chưa tự kiểm được"), KHÔNG đoán. */
export class StepCheckLimitError extends Error {
  constructor(message = 'Biểu thức quá lớn để tự kiểm') {
    super(message)
    this.name = 'StepCheckLimitError'
  }
}

/** Trần số bit của tử/mẫu — đủ rộng cho toán phổ thông, chặn biểu thức cố tình phình to. */
const MAX_BITS = 2048n
const LIMIT = 1n << MAX_BITS

export type Rational = { readonly n: bigint; readonly d: bigint }

function bigAbs(x: bigint): bigint {
  return x < 0n ? -x : x
}

function bigGcd(a: bigint, b: bigint): bigint {
  let x = bigAbs(a)
  let y = bigAbs(b)
  while (y !== 0n) {
    const t = x % y
    x = y
    y = t
  }
  return x
}

/** Dựng số hữu tỉ tối giản, mẫu luôn dương. Mẫu 0 là lỗi lập trình (nơi gọi phải chặn trước). */
export function rat(n: bigint, d: bigint = 1n): Rational {
  if (d === 0n) throw new RangeError('Mẫu số bằng 0')
  if (n === 0n) return ZERO
  const sign = d < 0n ? -1n : 1n
  const g = bigGcd(n, d)
  const nn = (sign * n) / g
  const dd = (sign * d) / g
  if (bigAbs(nn) >= LIMIT || dd >= LIMIT) throw new StepCheckLimitError()
  return { n: nn, d: dd }
}

export const ZERO: Rational = { n: 0n, d: 1n }
export const ONE: Rational = { n: 1n, d: 1n }

export const isZero = (a: Rational): boolean => a.n === 0n
export const sign = (a: Rational): -1 | 0 | 1 => (a.n === 0n ? 0 : a.n < 0n ? -1 : 1)
export const neg = (a: Rational): Rational => (a.n === 0n ? ZERO : { n: -a.n, d: a.d })
export const add = (a: Rational, b: Rational): Rational => rat(a.n * b.d + b.n * a.d, a.d * b.d)
export const sub = (a: Rational, b: Rational): Rational => rat(a.n * b.d - b.n * a.d, a.d * b.d)
export const mul = (a: Rational, b: Rational): Rational => rat(a.n * b.n, a.d * b.d)
export const eq = (a: Rational, b: Rational): boolean => a.n === b.n && a.d === b.d

export function div(a: Rational, b: Rational): Rational {
  if (b.n === 0n) throw new RangeError('Chia cho 0')
  return rat(a.n * b.d, a.d * b.n)
}

/**
 * Đổi một số JS (đã đọc từ chuỗi THẬP PHÂN học sinh gõ) về số hữu tỉ chính xác.
 * `String(0.1)` trả đúng "0.1" (dạng thập phân ngắn nhất), nên 0.1 → 1/10 chứ không phải
 * 3602879701896397/36028797018963968. Trả null với NaN/Infinity.
 */
export function fromNumber(value: number): Rational | null {
  if (!Number.isFinite(value)) return null
  const text = String(value)
  const match = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/.exec(text)
  if (match === null) return null
  const negative = match[1] === '-'
  const intPart = match[2] ?? '0'
  const fracPart = match[3] ?? ''
  const exponent = Number(match[4] ?? '0') - fracPart.length
  if (Math.abs(exponent) > 300) throw new StepCheckLimitError()
  let n = BigInt(intPart + fracPart)
  let d = 1n
  if (exponent >= 0) n *= 10n ** BigInt(exponent)
  else d = 10n ** BigInt(-exponent)
  return rat(negative ? -n : n, d)
}

/** Số hữu tỉ này có phải số nguyên không — trả về số nguyên đó (dạng number) hoặc null. */
export function toSmallInteger(a: Rational): number | null {
  if (a.d !== 1n) return null
  if (bigAbs(a.n) > 1_000_000n) return null
  return Number(a.n)
}
