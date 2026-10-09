// Đại số THỨ NGUYÊN chính xác + bảng đơn vị/hằng số nhỏ cho bộ kiểm bước giải Vật lí.
// Đặc tả: docs/specs/2026-10-09-kiem-thu-nguyen-vat-li.md §5–§6.
//
// Một thứ nguyên là vector số mũ của 7 đại lượng cơ bản SI theo thứ tự [M, L, T, I, Θ, N, J]
// (kg, m, s, A, K, mol, cd) — cùng thứ tự với `units.ts`. Khác `units.ts` (số thực, dùng để QUY ĐỔI
// một đáp số), ở đây số mũ là SỐ HỮU TỈ CHÍNH XÁC (`rational.ts`, BigInt) vì căn bậc hai cho mũ
// ½ (`\sqrt{g}` → m^(1/2)·s⁻¹) và kết luận "lệch thứ nguyên" phải CHỨNG MINH được, không làm tròn.
// Tiền tố (k, m, μ…) không đổi thứ nguyên nên chỉ cần NHẬN ra, không cần hệ số quy đổi.

import { ZERO, add, eq, isZero, mul, neg, rat, sub, type Rational } from './rational.js'

export type Dimension = readonly Rational[]

/** Ký hiệu đơn vị cơ bản SI theo đúng thứ tự trục của vector thứ nguyên. */
const BASE_UNIT_SYMBOLS = ['kg', 'm', 's', 'A', 'K', 'mol', 'cd'] as const

/** Dựng thứ nguyên từ số mũ nguyên theo thứ tự [M, L, T, I, Θ, N, J]. */
export function dim(...exponents: number[]): Dimension {
  return BASE_UNIT_SYMBOLS.map((_, i) => rat(BigInt(exponents[i] ?? 0)))
}

export const DIMENSIONLESS: Dimension = dim()

export function dimMul(a: Dimension, b: Dimension): Dimension {
  return a.map((x, i) => add(x, b[i] ?? ZERO))
}

export function dimDiv(a: Dimension, b: Dimension): Dimension {
  return a.map((x, i) => sub(x, b[i] ?? ZERO))
}

export function dimPow(a: Dimension, exponent: Rational): Dimension {
  return a.map((x) => mul(x, exponent))
}

export function dimInverse(a: Dimension): Dimension {
  return a.map((x) => neg(x))
}

export function dimEq(a: Dimension, b: Dimension): boolean {
  return a.every((x, i) => eq(x, b[i] ?? ZERO))
}

export function isDimensionless(a: Dimension): boolean {
  return a.every((x) => isZero(x))
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
}

/**
 * Thứ nguyên → chữ cho người học, theo đơn vị cơ bản SI: `m·s⁻¹`, `kg·m²·s⁻²`, `m^(1/2)·s⁻¹`.
 * Không thứ nguyên → "không thứ nguyên".
 */
export function formatDimension(d: Dimension): string {
  const parts: string[] = []
  d.forEach((e, i) => {
    if (isZero(e)) return
    const symbol = BASE_UNIT_SYMBOLS[i] ?? '?'
    if (e.d === 1n) {
      if (e.n === 1n) parts.push(symbol)
      else
        parts.push(
          symbol +
            String(e.n)
              .split('')
              .map((c) => SUPERSCRIPT[c] ?? c)
              .join(''),
        )
    } else {
      parts.push(`${symbol}^(${String(e.n)}/${String(e.d)})`)
    }
  })
  return parts.length === 0 ? 'không thứ nguyên' : parts.join('·')
}

// ── Bảng đơn vị ─────────────────────────────────────────────────────────────

type UnitEntry = { readonly dim: Dimension; readonly prefixable: boolean }

const u = (prefixable: boolean, ...exponents: number[]): UnitEntry => ({
  dim: dim(...exponents),
  prefixable,
})

/**
 * Đơn vị SI cơ bản + dẫn xuất + vài đơn vị ngoài SI hay gặp ở chương trình phổ thông Việt Nam.
 * `prefixable` = được ghép tiền tố (km, mA, μs…). Chỉ thứ nguyên, không hệ số: bộ kiểm bước
 * không quy đổi giá trị (việc đó là của `units.ts` khi chấm đáp số).
 */
const UNIT_TABLE: Readonly<Record<string, UnitEntry>> = {
  // 7 đơn vị cơ bản (gam thay kg làm gốc ghép tiền tố: kg = k + g)
  m: u(true, 0, 1),
  g: u(true, 1),
  s: u(true, 0, 0, 1),
  A: u(true, 0, 0, 0, 1),
  K: u(true, 0, 0, 0, 0, 1),
  mol: u(true, 0, 0, 0, 0, 0, 1),
  cd: u(true, 0, 0, 0, 0, 0, 0, 1),
  // Dẫn xuất SI
  N: u(true, 1, 1, -2),
  J: u(true, 1, 2, -2),
  W: u(true, 1, 2, -3),
  Pa: u(true, 1, -1, -2),
  Hz: u(true, 0, 0, -1),
  C: u(true, 0, 0, 1, 1),
  V: u(true, 1, 2, -3, -1),
  Ω: u(true, 1, 2, -3, -2),
  ohm: u(true, 1, 2, -3, -2),
  F: u(true, -1, -2, 4, 2),
  Wb: u(true, 1, 2, -2, -1),
  T: u(true, 1, 0, -2, -1),
  H: u(true, 1, 2, -2, -2),
  S: u(true, -1, -2, 3, 2),
  rad: u(true),
  sr: u(false),
  // Ngoài SI nhưng dùng cùng SI
  L: u(true, 0, 3),
  l: u(true, 0, 3),
  eV: u(true, 1, 2, -2),
  Wh: u(true, 1, 2, -2),
  cal: u(true, 1, 2, -2),
  bar: u(true, 1, -1, -2),
  atm: u(false, 1, -1, -2),
  mmHg: u(false, 1, -1, -2),
  min: u(false, 0, 0, 1),
  h: u(false, 0, 0, 1),
  ha: u(false, 0, 2),
  t: u(false, 1),
  amu: u(false, 1),
  '°C': u(false, 0, 0, 0, 0, 1),
  '℃': u(false, 0, 0, 0, 0, 1),
  '°': u(false),
  '%': u(false),
  // Tên tiếng Việt học sinh hay gõ trong \text{…}
  giây: u(false, 0, 0, 1),
  phút: u(false, 0, 0, 1),
  giờ: u(false, 0, 0, 1),
  ngày: u(false, 0, 0, 1),
  năm: u(false, 0, 0, 1),
  tấn: u(false, 1),
  lít: u(false, 0, 3),
  vòng: u(false),
}

/** Tiền tố SI. `u` là cách gõ thay `μ` trên bàn phím không có chữ Hy Lạp. */
const PREFIXES = [
  'da',
  'Y',
  'Z',
  'E',
  'P',
  'T',
  'G',
  'M',
  'k',
  'h',
  'd',
  'c',
  'm',
  'μ',
  'µ',
  'u',
  'n',
  'p',
  'f',
  'a',
] as const

/** Thứ nguyên của MỘT đơn vị nguyên khối (có thể kèm tiền tố). Mơ hồ hoặc lạ → null. */
function singleUnit(name: string): Dimension | null {
  const exact = UNIT_TABLE[name]
  if (exact !== undefined) return exact.dim
  const found: Dimension[] = []
  for (const p of PREFIXES) {
    if (!name.startsWith(p) || name.length === p.length) continue
    const base = UNIT_TABLE[name.slice(p.length)]
    if (base !== undefined && base.prefixable) found.push(base.dim)
  }
  const first = found[0]
  if (first === undefined) return null
  // Hai cách đọc ra hai thứ nguyên khác nhau → không đoán.
  return found.every((d) => dimEq(d, first)) ? first : null
}

/**
 * Thứ nguyên của một CHUỖI CHỮ CÁI liền là đơn vị: `km`, `ms` (mili-giây — ưu tiên đọc nguyên
 * khối theo ISO), rồi mới thử tách thành tích các đơn vị (`Nm` = N·m, `kgm` = kg·m). Mọi cách tách
 * phải cho CÙNG thứ nguyên, không thì trả null (mơ hồ).
 */
export function unitWordDimension(word: string): Dimension | null {
  if (word.length === 0 || word.length > 12) return null
  const whole = singleUnit(word)
  if (whole !== null) return whole
  const results: Dimension[] = []
  const walk = (start: number, acc: Dimension, pieces: number): void => {
    if (results.length > 8) return
    if (start === word.length) {
      if (pieces >= 2) results.push(acc)
      return
    }
    for (let end = start + 1; end <= word.length; end++) {
      const d = singleUnit(word.slice(start, end))
      if (d !== null) walk(end, dimMul(acc, d), pieces + 1)
    }
  }
  walk(0, DIMENSIONLESS, 0)
  const first = results[0]
  if (first === undefined) return null
  return results.every((d) => dimEq(d, first)) ? first : null
}

/** Tên này có phải ký hiệu đơn vị không (để cảnh báo "vừa là biến vừa là đơn vị"). */
export function isUnitWord(word: string): boolean {
  return unitWordDimension(word) !== null
}

// ── Đọc một BIỂU THỨC ĐƠN VỊ: `m/s^2`, `kg·m/s`, `J/(kg.K)`, `N·m²/kg²`, `s^{-1}`, `m/s2` ─────

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '⁻': '-',
}

/** Đọc dãy chữ số mũ Unicode (`²`, `⁻¹`) tại `pos` → [số mũ, vị trí sau] hoặc null. */
export function readSuperscript(s: string, pos: number): [Rational, number] | null {
  let i = pos
  let text = ''
  while (i < s.length && SUPERSCRIPT_DIGITS[s.charAt(i)] !== undefined) {
    text += SUPERSCRIPT_DIGITS[s.charAt(i)]
    i++
  }
  if (!/^-?\d{1,3}$/.test(text)) return null
  return [rat(BigInt(text)), i]
}

/** `2`, `-1`, `−3`, `1/2` → số hữu tỉ. Lạ → null. */
export function parseExponentLiteral(text: string): Rational | null {
  const t = text.replace(/\s+/g, '').replace(/−/g, '-')
  const m = /^([+-]?\d{1,3})(?:\/(\d{1,3}))?$/.exec(t)
  if (m === null) return null
  const d = BigInt(m[2] ?? '1')
  if (d === 0n) return null
  return rat(BigInt(m[1] ?? '0'), d)
}

/** Chuẩn hoá LaTeX hay gặp BÊN TRONG `\text{…}` về chữ thường. Còn lệnh lạ → null. */
function normalizeUnitLatex(raw: string): string | null {
  const s = raw
    .replace(/\\(?:text|mathrm|textrm|rm)\s*/g, '')
    .replace(/\\Omega(?![a-zA-Z])/g, 'Ω')
    .replace(/\\(?:mu|micro)(?![a-zA-Z])\s*/g, 'μ')
    .replace(/\^\s*\{?\s*\\circ\s*\}?|\\circ(?![a-zA-Z])|\\degree(?![a-zA-Z])/g, '°')
    .replace(/\\%/g, '%')
    .replace(/\\(?:cdot|times)(?![a-zA-Z])|[·×*]/g, '·')
    .replace(/\\[,;:! ]|~/g, ' ')
  if (s.includes('\\')) return null
  return s
}

type UnitItem = { dim: Dimension }

/**
 * Đọc biểu thức đơn vị → thứ nguyên. Quy ước (giống `units.ts` với `J/kg.K`): sau dấu `/`, mọi
 * thừa số tới dấu `/` kế tiếp đều ở MẪU — `J/kg·K` = J/(kg·K). `trailingExponent` là số mũ viết
 * NGOÀI `\text{…}` (`\text{m/s}^2`): nó gắn vào đơn vị CUỐI — đúng như mắt đọc "m/s²".
 *
 * Trả `{ ok: false, bad }` với phần không đọc được để phản hồi nêu đúng chữ lạ.
 */
export function parseUnitExpression(
  raw: string,
  trailingExponent?: Rational,
): { ok: true; dim: Dimension } | { ok: false; bad: string } {
  const s = normalizeUnitLatex(raw)
  if (s === null) return { ok: false, bad: raw.trim() }
  let pos = 0
  const skip = () => {
    while (pos < s.length && s.charAt(pos) === ' ') pos++
  }

  /** Số mũ ngay sau một thừa số: `^2`, `^{-1}`, `^(1/2)`, `²`, `⁻¹`, hoặc chữ số dính liền (`m2`). */
  const readExponent = (): Rational | null | 'none' => {
    const sup = readSuperscript(s, pos)
    if (sup !== null) {
      pos = sup[1]
      return sup[0]
    }
    // `m ^ -1`: cho phép khoảng trắng trước dấu mũ.
    let j = pos
    while (s.charAt(j) === ' ') j++
    if (s.charAt(j) === '^') pos = j
    if (s.charAt(pos) === '^') {
      pos++
      skip()
      const open = s.charAt(pos)
      if (open === '{' || open === '(') {
        const close = s.indexOf(open === '{' ? '}' : ')', pos)
        if (close < 0) return null
        const value = parseExponentLiteral(s.slice(pos + 1, close))
        pos = close + 1
        return value
      }
      const m = /^[+\-−]?\d{1,3}/.exec(s.slice(pos))
      if (m === null) return null
      pos += m[0].length
      return parseExponentLiteral(m[0])
    }
    const m = /^-?\d{1,2}(?![\d.,])/.exec(s.slice(pos))
    if (m !== null) {
      pos += m[0].length
      return parseExponentLiteral(m[0])
    }
    return 'none'
  }

  let bad: string | null = null

  const parseFactor = (): UnitItem[] | null => {
    skip()
    const ch = s.charAt(pos)
    if (ch === '(' || ch === '{') {
      pos++
      const inner = parseQuotient(ch === '(' ? ')' : '}')
      if (inner === null) return null
      skip()
      if (s.charAt(pos) !== (ch === '(' ? ')' : '}')) return null
      pos++
      const e = readExponent()
      if (e === null) return null
      const total = inner.reduce<Dimension>((acc, it) => dimMul(acc, it.dim), DIMENSIONLESS)
      return [{ dim: e === 'none' ? total : dimPow(total, e) }]
    }
    if (ch === '1') {
      // "1/s" — số 1 không thứ nguyên
      pos++
      return [{ dim: DIMENSIONLESS }]
    }
    const m = /^(?:[\p{L}°%℃]+)/u.exec(s.slice(pos))
    if (m === null) {
      bad = s.slice(pos, pos + 8)
      return null
    }
    const word = m[0]
    const d = unitWordDimension(word)
    if (d === null) {
      bad = word
      return null
    }
    pos += word.length
    const e = readExponent()
    if (e === null) {
      bad = word
      return null
    }
    return [{ dim: e === 'none' ? d : dimPow(d, e) }]
  }

  /** Tích các thừa số (ngăn bởi `·`, `.` hoặc khoảng trắng). */
  const parseProduct = (closer: string | null): UnitItem[] | null => {
    const items: UnitItem[] = []
    for (;;) {
      skip()
      const f = parseFactor()
      if (f === null) return null
      items.push(...f)
      skip()
      const ch = s.charAt(pos)
      if (ch === '·' || ch === '.') {
        pos++
        continue
      }
      if (pos >= s.length || ch === '/' || ch === closer) return items
      // thừa số kế tiếp viết liền sau khoảng trắng: "kg m/s"
      if (/[\p{L}(°%{]/u.test(ch)) continue
      bad = s.slice(pos, pos + 8)
      return null
    }
  }

  const parseQuotient = (closer: string | null): UnitItem[] | null => {
    const numerator = parseProduct(closer)
    if (numerator === null) return null
    const items = [...numerator]
    for (;;) {
      skip()
      if (s.charAt(pos) !== '/') return items
      pos++
      const denominator = parseProduct(closer)
      if (denominator === null) return null
      for (const it of denominator) items.push({ dim: dimInverse(it.dim) })
    }
  }

  const items = parseQuotient(null)
  skip()
  if (items === null || pos !== s.length || items.length === 0) {
    return { ok: false, bad: bad ?? raw.trim() }
  }
  if (trailingExponent !== undefined) {
    const last = items[items.length - 1]
    if (last !== undefined) items[items.length - 1] = { dim: dimPow(last.dim, trailingExponent) }
  }
  return { ok: true, dim: items.reduce<Dimension>((acc, it) => dimMul(acc, it.dim), DIMENSIONLESS) }
}

// ── Hằng số vật lí chuẩn ────────────────────────────────────────────────────

/**
 * Hằng số KHÔNG mơ hồ ở chương trình phổ thông — dùng khi đề không khai ký hiệu đó. Bảng biến của
 * đề luôn THẮNG (đề khai `c` là nhiệt dung riêng thì `c` là nhiệt dung riêng).
 */
const CONSTANT_UNITS: Readonly<Record<string, string>> = {
  g: 'm/s^2', // gia tốc trọng trường
  c: 'm/s', // tốc độ ánh sáng
  G: 'N·m^2/kg^2', // hằng số hấp dẫn
  N_A: 'mol^-1', // số Avogadro
  k_B: 'J/K', // hằng số Boltzmann
  ħ: 'J·s', // hằng số Planck rút gọn
  ε_0: 'F/m', // hằng số điện
  μ_0: 'N/A^2', // hằng số từ
  m_e: 'kg', // khối lượng electron
  m_p: 'kg', // khối lượng proton
}

export const PHYSICS_CONSTANTS: ReadonlyMap<string, Dimension> = new Map(
  Object.entries(CONSTANT_UNITS).map(([name, unit]) => {
    const parsed = parseUnitExpression(unit)
    if (!parsed.ok) throw new Error(`Bảng hằng số hỏng: ${name}`)
    return [name, parsed.dim] as const
  }),
)

/**
 * Ký hiệu MƠ HỒ: cùng một chữ là nhiều đại lượng khác thứ nguyên. Đề không khai thì KHÔNG đoán —
 * trả "chưa tự kiểm được" kèm câu này.
 */
export const AMBIGUOUS_SYMBOLS: Readonly<Record<string, string>> = {
  k: 'hằng số Coulomb (N·m²/C²), độ cứng lò xo (N/m) hay hằng số Boltzmann',
  h: 'hằng số Planck (J·s) hay độ cao (m)',
  e: 'điện tích nguyên tố (C) hay cơ số e',
  R: 'hằng số khí (J/(mol·K)), điện trở (Ω) hay bán kính (m)',
}
