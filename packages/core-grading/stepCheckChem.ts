// Kiểm một BƯỚC cân bằng phương trình hoá học: đếm nguyên tử từng nguyên tố + tổng điện tích
// hai vế, và xác nhận học sinh không tự đổi chất so với đề.
// Đặc tả: docs/specs/2026-10-09-kiem-buoc-giai-stem.md §6.
//
// Tái dùng bộ đọc công thức của engine chấm (chemistry.ts: ngoặc lồng, chỉ số Unicode, ngậm nước
// `·`, ion `SO4^2-`). File này chỉ thêm: đọc LaTeX phẳng kiểu `H_2 + O_2 \rightarrow H_2O`,
// electron `e^-` (bán phản ứng), kiểm ký hiệu nguyên tố có thật, và so chất với đề.

import { type Composition, type EquationTerm, parseEquation, parseFormula } from './chemistry.js'

export type ChemUnsupportedReason =
  | 'unknown_notation' // lệnh LaTeX/ký hiệu lạ — không đoán
  | 'not_equation' // không tách được hai vế/các chất
  | 'unknown_element' // ký hiệu không phải nguyên tố có thật (Xy, Hz…)

export type ElementCount = { element: string; left: number; right: number }

export type ChemStepCheck =
  | {
      verdict: 'balanced'
      /** Bộ hệ số đã tối giản (ƯCLN = 1). */
      simplified: boolean
      /** Cùng các chất với đề; `null` khi không có đề để so. */
      matchesProblem: boolean | null
    }
  | { verdict: 'unbalanced_atoms'; counts: ElementCount[] }
  | { verdict: 'unbalanced_charge'; left: number; right: number }
  | { verdict: 'substance_changed' }
  | { verdict: 'unsupported'; reason: ChemUnsupportedReason }

/** 118 ký hiệu nguyên tố (IUPAC). Ký hiệu ngoài danh sách → không kiểm, tránh đếm "nguyên tố" bịa. */
const ELEMENTS = new Set(
  (
    'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se ' +
    'Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb ' +
    'Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm ' +
    'Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'
  ).split(' '),
)

/** Lấy nội dung nhóm `{…}` bắt đầu ở `start`; lệch ngoặc → null. */
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

/** Bỏ vỏ các lệnh chỉ để trình bày (`\ce{…}`, `\mathrm{…}`, `\text{…}`), giữ nội dung. */
function unwrapCommands(input: string): string | null {
  let s = input
  for (let guard = 0; guard < 50; guard++) {
    const m = /\\(?:ce|mathrm|text|mathbf|rm)\s*(?=\{)/.exec(s)
    if (m === null) return s
    const group = readBraceGroup(s, m.index + m[0].length)
    if (group === null) return null
    s = `${s.slice(0, m.index)}${group[0]}${s.slice(group[1])}`
  }
  return null
}

/** `\xrightarrow[dưới]{trên}` (điều kiện phản ứng) → `->`. */
function replaceXArrows(input: string): string | null {
  let s = input
  for (let guard = 0; guard < 20; guard++) {
    const m = /\\xrightarrow\s*(\[[^\]]*\])?\s*/.exec(s)
    if (m === null) return s
    const after = m.index + m[0].length
    const group = s.charAt(after) === '{' ? readBraceGroup(s, after) : null
    s = `${s.slice(0, m.index)} -> ${s.slice(group === null ? after : group[1])}`
  }
  return null
}

/** LaTeX phẳng/Unicode của phương trình hoá học → dạng `2H2 + O2 -> 2H2O`. Lệnh lạ → null. */
export function normalizeChemLatex(input: string): string | null {
  let s: string | null = unwrapCommands(input)
  if (s === null) return null
  s = replaceXArrows(s)
  if (s === null) return null
  s = s
    .replace(/\\(?:left|right)(?![a-zA-Z])/g, '')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(
      /\\(?:longrightarrow|rightarrow|Rightarrow|to|rightleftharpoons|leftrightarrow|Longrightarrow)(?![a-zA-Z])/g,
      ' -> ',
    )
    .replace(/[→⟶⇌↔⇒]/g, ' -> ')
    .replace(/\\(?:uparrow|downarrow)(?![a-zA-Z])|[↑↓]/g, '')
    .replace(/\\(?:cdot|bullet)(?![a-zA-Z])|[•∙⋅]/g, '·')
    // Chỉ số dưới/trên dạng nhóm: H_{2} → H2, SO_4^{2-} → SO4^2-.
    .replace(/_\{([^{}]*)\}/g, '$1')
    .replace(/_/g, '')
    .replace(/\^\{([^{}]*)\}/g, '^$1')
    // Trạng thái chất (s)/(l)/(g)/(aq) và kiểu viết Việt (r)/(k)/(dd).
    .replace(/\((?:s|l|g|aq|r|k|dd)\)/g, '')
  // Điều kiện phản ứng ghi trong ngoặc ngay sau mũi tên: `->(t°)`, `->(xt, t°)`. Chỉ bỏ khi bên
  // trong KHÔNG có chữ in hoa — `-> (NH4)2SO4` là một chất, không phải điều kiện.
  s = s.replace(/->\s*\(([^()A-Z]*)\)/g, '->')
  if (/[\\{}]/.test(s)) return null
  return s
}

/** Electron trong bán phản ứng: `e`, `e-`, `e^-`, `e⁻`. */
function isElectron(formula: string): boolean {
  return /^e(?:\^?1?-|⁻)?$/.test(formula.replace(/\s+/g, ''))
}

function compositionOf(formula: string): Composition | 'unknown_element' | null {
  if (isElectron(formula)) return { atoms: {}, charge: -1 }
  const parsed = parseFormula(formula)
  if (parsed === null) return null
  for (const el of Object.keys(parsed.atoms)) if (!ELEMENTS.has(el)) return 'unknown_element'
  return parsed
}

/** Khoá so sánh một chất theo THÀNH PHẦN (không theo cách viết): `H_2O` ≡ `H₂O` ≡ `H2O`. */
function compositionKey(c: Composition): string {
  const atoms = Object.entries(c.atoms)
    .filter(([, n]) => n !== 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([el, n]) => `${el}${n}`)
    .join('')
  return `${atoms}|${c.charge}`
}

type SideInfo = { atoms: Record<string, number>; charge: number; keys: string[] }

function sideInfo(terms: EquationTerm[]): SideInfo | ChemUnsupportedReason {
  const atoms: Record<string, number> = {}
  let charge = 0
  const keys: string[] = []
  for (const term of terms) {
    const c = compositionOf(term.formula)
    if (c === null) return 'not_equation'
    if (c === 'unknown_element') return 'unknown_element'
    for (const [el, n] of Object.entries(c.atoms))
      atoms[el] = (atoms[el] ?? 0) + n * term.coefficient
    charge += c.charge * term.coefficient
    keys.push(compositionKey(c))
  }
  return { atoms, charge, keys: keys.sort() }
}

type ParsedSides = { left: SideInfo; right: SideInfo; coefficients: number[] }

function parseChem(input: string): ParsedSides | ChemUnsupportedReason {
  const normalized = normalizeChemLatex(input)
  if (normalized === null) return 'unknown_notation'
  const eq = parseEquation(normalized)
  if (eq === null) return 'not_equation'
  const left = sideInfo(eq.left)
  const right = sideInfo(eq.right)
  if (typeof left === 'string') return left
  if (typeof right === 'string') return right
  return { left, right, coefficients: [...eq.left, ...eq.right].map((t) => t.coefficient) }
}

const sameKeys = (a: string[], b: string[]) =>
  a.length === b.length && a.every((k, i) => k === b[i])

function gcdInt(a: number, b: number): number {
  let x = Math.abs(a)
  let y = Math.abs(b)
  while (y !== 0) [x, y] = [y, x % y]
  return x
}

/**
 * Kiểm một bước cân bằng.
 * @param step    phương trình học sinh gõ ở bước này.
 * @param problem phương trình của đề (tuỳ chọn) — để bắt lỗi "sửa chỉ số" (đổi chất) thay vì
 *                thêm hệ số. Đề không đọc được thì bỏ qua phần so chất, vẫn đếm nguyên tử.
 */
export function checkChemStep(step: string, problem?: string): ChemStepCheck {
  const parsed = parseChem(step)
  if (typeof parsed === 'string') return { verdict: 'unsupported', reason: parsed }

  let matchesProblem: boolean | null = null
  if (problem !== undefined) {
    const ref = parseChem(problem)
    if (typeof ref !== 'string') {
      matchesProblem =
        sameKeys(ref.left.keys, parsed.left.keys) && sameKeys(ref.right.keys, parsed.right.keys)
      if (!matchesProblem) return { verdict: 'substance_changed' }
    }
  }

  const elements = [
    ...new Set([...Object.keys(parsed.left.atoms), ...Object.keys(parsed.right.atoms)]),
  ].sort()
  const counts = elements
    .map((element) => ({
      element,
      left: parsed.left.atoms[element] ?? 0,
      right: parsed.right.atoms[element] ?? 0,
    }))
    .filter((c) => c.left !== c.right)
  if (counts.length > 0) return { verdict: 'unbalanced_atoms', counts }

  if (parsed.left.charge !== parsed.right.charge) {
    return { verdict: 'unbalanced_charge', left: parsed.left.charge, right: parsed.right.charge }
  }

  const common = parsed.coefficients.reduce((acc, c) => gcdInt(acc, c), 0)
  return { verdict: 'balanced', simplified: common === 1, matchesProblem }
}
