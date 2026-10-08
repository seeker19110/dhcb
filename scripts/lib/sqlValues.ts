// scripts/lib/sqlValues.ts — Miền giá trị dùng chung của bộ trích SQL (scripts/lib/sqlExtract.ts):
// giá trị khả dĩ (`Alt`) kèm lựa chọn ở từng điểm rẽ, môi trường biến của một đường chạy mô phỏng,
// và các phép kết hợp chúng (tích có trần, gắn khoá, lọc theo lựa chọn). Thuần, không I/O.

import type ts from 'typescript'
import type { ModuleAnalyzer } from './sqlAnalyzer.js'

// Giới hạn độ sâu khi lần theo chuỗi hằng `const A = B; const B = ...` — chặn đệ quy vô hạn nếu
// mã có tham chiếu vòng (TS báo lỗi trước, nhưng script không được treo vì thế).
export const MAX_RESOLVE_DEPTH = 20
// Độ sâu tối đa khi lần tham số hàm ngược về nơi gọi (hàm gọi hàm gọi hàm…).
export const MAX_CALL_DEPTH = 4
// Trần số biến thể (và số đường chạy mô phỏng) của một lời gọi. Quá trần thì coi là động — tránh
// bùng nổ tổ hợp. 64 (không phải 16 như 0529) vì liệt kê tuyến tính có thật cần tới: bảng
// PERSON_TABLES (xuất/xoá dữ liệu cá nhân) có 21 bảng; mỗi biến thể chỉ là một PREPARE (~1 ms).
export const MAX_VARIANTS = 64

// ─── Giá trị ──────────────────────────────────────────────────────────────────

/** Giá trị runtime không suy ra được (tham số, kết quả lời gọi, biến bị ghi chỗ không mô phỏng…). */
export const UNKNOWN: unique symbol = Symbol('unknown')
export type Unknown = typeof UNKNOWN
export type Scalar = string | number
export type Choices = ReadonlyMap<string, string>

/** Object literal trong mã + môi trường để tính các thuộc tính của nó. */
export interface ObjRef {
  readonly kind: 'object'
  readonly node: ts.ObjectLiteralExpression
  readonly mod: ModuleAnalyzer
  readonly env: Env
}
export type Cell = Scalar | ObjRef | Unknown
export type Value = Scalar | readonly Cell[] | ObjRef
/** Một giá trị khả dĩ + các lựa chọn đã chốt ở từng điểm rẽ (khoá điểm rẽ → nhánh). */
export interface Alt {
  value: Value
  choices: Choices
}
/** Mọi giá trị khả dĩ (≥ 1), hoặc `undefined` nếu biểu thức không tính được lúc biên dịch. */
export type Alts = readonly Alt[] | undefined

/** Biến có nhiều giá trị khả dĩ — giữ nguyên danh sách (không tách đường chạy). */
export interface Lazy {
  readonly kind: 'lazy'
  readonly alts: readonly Alt[]
}
export type EnvValue = Value | Lazy | Unknown
export type Env = Map<string, EnvValue>
/** Một đường chạy mô phỏng: giá trị các biến cục bộ + nhánh đã chọn ở từng điểm rẽ. */
export interface Path {
  env: Env
  choices: Choices
}
export type PathResult = { ok: true; paths: Path[] } | { ok: false; reason: string }

export const NO_CHOICES: Choices = new Map()
export const isScalar = (v: unknown): v is Scalar => typeof v === 'string' || typeof v === 'number'
export const isArray = (v: unknown): v is readonly Cell[] => Array.isArray(v)
export const isObjRef = (v: unknown): v is ObjRef =>
  typeof v === 'object' && v !== null && 'kind' in v && v.kind === 'object'
export const isLazy = (v: unknown): v is Lazy =>
  typeof v === 'object' && v !== null && 'kind' in v && v.kind === 'lazy'
export const single = (value: Value, choices: Choices = NO_CHOICES): Alt[] => [{ value, choices }]
export const ok = (paths: Path[]): PathResult => ({ ok: true, paths })
export const clonePath = (p: Path): Path => ({ env: new Map(p.env), choices: p.choices })

/** Gộp lựa chọn của hai nhánh; `undefined` nếu cùng một điểm rẽ mà chọn khác nhau. */
export function mergeChoices(a: Choices, b: Choices): Choices | undefined {
  if (b.size === 0) return a
  if (a.size === 0) return b
  const out = new Map(a)
  for (const [k, v] of b) {
    const prev = out.get(k)
    if (prev !== undefined && prev !== v) return undefined
    out.set(k, v)
  }
  return out
}

/** Kết hợp từng cặp giá trị khả dĩ nhất quán; `undefined` nếu `combine` từ chối hoặc vượt trần. */
export function product(
  a: readonly Alt[],
  b: readonly Alt[],
  combine: (x: Value, y: Value) => Value | undefined,
): Alts {
  const out: Alt[] = []
  for (const x of a) {
    for (const y of b) {
      const choices = mergeChoices(x.choices, y.choices)
      if (!choices) continue // tổ hợp chéo không thể xảy ra ở runtime
      const value = combine(x.value, y.value)
      if (value === undefined) return undefined
      out.push({ value, choices })
      if (out.length > MAX_VARIANTS) return undefined
    }
  }
  return out
}

/** Gắn khoá điểm rẽ `key` = `branch` vào mọi giá trị của một nhánh (bỏ giá trị mâu thuẫn). */
export function tag(alts: readonly Alt[], key: string, branch: string): Alt[] {
  const add = new Map([[key, branch]])
  const out: Alt[] = []
  for (const alt of alts) {
    const choices = mergeChoices(alt.choices, add)
    if (choices) out.push({ value: alt.value, choices })
  }
  return out
}

/** Áp lựa chọn của đường chạy lên các giá trị; bỏ giá trị mâu thuẫn với đường đó. */
export function restrict(alts: readonly Alt[], choices: Choices): Alt[] {
  const out: Alt[] = []
  for (const alt of alts) {
    const merged = mergeChoices(alt.choices, choices)
    if (merged) out.push({ value: alt.value, choices: merged })
  }
  return out
}

export function truthy(v: Value): boolean {
  if (typeof v === 'string') return v !== ''
  if (typeof v === 'number') return v !== 0 && !Number.isNaN(v)
  return true // mảng / object luôn truthy
}

/** Giá trị vô hướng duy nhất của một biểu thức, hoặc `undefined`. */
export function onlyScalar(alts: Alts): Scalar | undefined {
  const only = alts?.length === 1 ? alts[0] : undefined
  return only && isScalar(only.value) ? only.value : undefined
}

// ─── Đường chạy ───────────────────────────────────────────────────────────────

export const emptyPath = (): Path => ({ env: new Map(), choices: NO_CHOICES })

export function plus(x: Value, y: Value): Value | undefined {
  if (typeof x === 'number' && typeof y === 'number') return x + y
  return isScalar(x) && isScalar(y) ? String(x) + String(y) : undefined
}

export function trackedNames(paths: Path[]): Set<string> {
  return new Set(paths[0]?.env.keys() ?? [])
}

export function toEnvValue(alts: readonly Alt[]): EnvValue {
  const [only] = alts
  return alts.length === 1 && only && only.choices.size === 0 ? only.value : { kind: 'lazy', alts }
}

/** Gán kết quả tính vào biến của một đường chạy; `false` nếu đường đó mâu thuẫn (bỏ đường). */
export function assign(p: Path, name: string, alts: Alts): boolean {
  if (!alts) {
    p.env.set(name, UNKNOWN)
    return true
  }
  const [only] = alts
  if (alts.length === 1 && only) {
    const choices = mergeChoices(p.choices, only.choices)
    if (!choices) return false
    p.choices = choices
    p.env.set(name, only.value)
    return true
  }
  const consistent = restrict(alts, p.choices)
  if (consistent.length === 0) return false
  p.env.set(name, consistent.length > MAX_VARIANTS ? UNKNOWN : toEnvValue(consistent))
  return true
}

export function withChoice(p: Path, key: string, branch: string): Path | undefined {
  const choices = mergeChoices(p.choices, new Map([[key, branch]]))
  return choices ? { env: p.env, choices } : undefined
}
