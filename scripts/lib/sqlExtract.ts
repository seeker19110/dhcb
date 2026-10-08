// scripts/lib/sqlExtract.ts — Trích câu SQL TĨNH từ mã nguồn TypeScript bằng AST (không regex).
//
// Dùng bởi scripts/check-sql-prepare.ts (cổng CI `sql-prepare`): mỗi câu trích được sẽ đem
// `PREPARE` trên Postgres thật đã áp schema + migration để bắt câu SQL sai cột/bảng/kiểu — loại
// lỗi mà unit test (giả lập `pg`) KHÔNG BAO GIỜ thấy (changelog 0523 bắt 9 câu như vậy bằng tay).
//
// Phạm vi trích: mọi lời gọi `<x>.query(...)` / `<x>.query<T>(...)` có đối số đầu là chuỗi SQL.
// Đối số đầu được "tính hằng" nếu được: literal chuỗi/số, template mà MỌI phần nội suy đều suy ra
// được hằng, phép `+`, hằng `const` khai báo trong CÙNG file (và không bị sửa tại chỗ),
// `[...].join(sep)` trên mảng hằng.
//
// Một biểu thức có thể có NHIỀU giá trị khả dĩ — `cond ? 'a' : 'b'`, `BANG[khoa]` với `BANG` là
// object literal hằng và `khoa` là biến runtime — khi đó trích MỌI biến thể (tối đa MAX_VARIANTS),
// vì nhánh ít chạy chính là chỗ tên cột sai nằm im lâu nhất. Mỗi "điểm rẽ" được gắn một khoá; cùng
// một điểm rẽ dùng hai lần trong một câu (vd `${table}` xuất hiện ở hai chỗ) luôn lấy CÙNG một giá
// trị — không sinh tổ hợp chéo vô nghĩa kiểu "insert into A … on conflict … B".
//
// Không tính được (biến runtime, hằng import từ file khác, lời gọi hàm…) → KHÔNG đoán, ghi vào
// `skipped` kèm lý do để thống kê "bỏ qua (động)".
//
// Thuần (không I/O, không DB) để unit test được — xem sqlExtract.test.ts.

import ts from 'typescript'

export interface ExtractedSql {
  /** Đường dẫn file như được truyền vào (thường tương đối gốc repo). */
  file: string
  /** Dòng (đếm từ 1) nơi đối số SQL bắt đầu. */
  line: number
  sql: string
  /** Số thứ tự biến thể (từ 1) khi một lời gọi sinh nhiều câu; không có nếu chỉ một câu. */
  variant?: number
}

export interface SkippedSql {
  file: string
  line: number
  /** Vì sao không suy ra được câu SQL tĩnh. */
  reason: string
}

export interface ExtractResult {
  queries: ExtractedSql[]
  skipped: SkippedSql[]
}

// Giới hạn độ sâu khi lần theo chuỗi hằng `const A = B; const B = ...` — chặn đệ quy vô hạn nếu
// mã có tham chiếu vòng (TS báo lỗi trước, nhưng script không được treo vì thế).
const MAX_RESOLVE_DEPTH = 20
// Trần số biến thể một lời gọi được sinh ra. Quá trần thì coi là động — tránh bùng nổ tổ hợp.
export const MAX_VARIANTS = 16

type Scalar = string | number
type Value = Scalar | readonly Scalar[]
/** Một giá trị khả dĩ + các lựa chọn đã chốt ở từng điểm rẽ (khoá điểm rẽ → nhánh). */
interface Alt {
  value: Value
  choices: ReadonlyMap<string, string>
}
/** Mọi giá trị khả dĩ (≥ 1), hoặc `undefined` nếu biểu thức không tính được lúc biên dịch. */
type Alts = readonly Alt[] | undefined

const isScalar = (v: Value): v is Scalar => typeof v === 'string' || typeof v === 'number'
const single = (value: Value): Alt[] => [{ value, choices: new Map() }]

/** Gộp lựa chọn của hai nhánh; `undefined` nếu cùng một điểm rẽ mà chọn khác nhau. */
function mergeChoices(
  a: ReadonlyMap<string, string>,
  b: ReadonlyMap<string, string>,
): ReadonlyMap<string, string> | undefined {
  if (b.size === 0) return a
  const out = new Map(a)
  for (const [k, v] of b) {
    const prev = out.get(k)
    if (prev !== undefined && prev !== v) return undefined
    out.set(k, v)
  }
  return out
}

/** Kết hợp từng cặp giá trị khả dĩ nhất quán; `undefined` nếu `combine` từ chối hoặc vượt trần. */
function product(
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

/** Gắn khoá điểm rẽ `key` = `branch` vào mọi giá trị của một nhánh. */
function tag(alts: readonly Alt[], key: string, branch: string): Alt[] | undefined {
  const out: Alt[] = []
  for (const alt of alts) {
    const choices = mergeChoices(alt.choices, new Map([[key, branch]]))
    if (choices) out.push({ value: alt.value, choices })
  }
  return out
}

// Phương thức làm ĐỔI nội dung mảng/object tại chỗ — `const dieuKien = []; dieuKien.push(...)` là
// giá trị runtime chứ không phải hằng, dù khai báo bằng `const`.
const MUTATING_METHODS: ReadonlySet<string> = new Set([
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
  'fill',
  'copyWithin',
])

/** Tên biến gốc của `a.b.c` / `a[0]` (vd `a`), hoặc `undefined` nếu gốc không phải định danh. */
function rootIdentifier(node: ts.Expression): string | undefined {
  let cur: ts.Expression = node
  while (ts.isPropertyAccessExpression(cur) || ts.isElementAccessExpression(cur))
    cur = cur.expression
  return ts.isIdentifier(cur) ? cur.text : undefined
}

/**
 * Gom mọi khai báo `const <tên> = <biểu thức>` trong file. Đánh dấu KHÔNG dùng được (`null`):
 * tên khai báo NHIỀU lần (ở các scope khác nhau — không đoán scope, thà bỏ qua còn hơn suy sai)
 * và biến bị sửa nội dung tại chỗ (`x.push(…)`, `x.k = …`, `x[i] = …`, `delete x.k`).
 */
function collectConstDeclarations(source: ts.SourceFile): Map<string, ts.Expression | null> {
  const map = new Map<string, ts.Expression | null>()
  const mutated = new Set<string>()
  const markMutated = (target: ts.Expression): void => {
    const root = rootIdentifier(target)
    if (root) mutated.add(root)
  }
  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.Const) !== 0) {
      for (const decl of node.declarations) {
        if (!ts.isIdentifier(decl.name)) continue
        const name = decl.name.text
        map.set(name, map.has(name) ? null : (decl.initializer ?? null))
      }
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      MUTATING_METHODS.has(node.expression.name.text)
    ) {
      markMutated(node.expression.expression)
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment &&
      (ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left))
    ) {
      markMutated(node.left)
    }
    if (ts.isDeleteExpression(node)) markMutated(node.expression)
    ts.forEachChild(node, visit)
  }
  visit(source)
  for (const name of mutated) if (map.has(name)) map.set(name, null)
  return map
}

class Evaluator {
  constructor(
    private readonly source: ts.SourceFile,
    private readonly consts: Map<string, ts.Expression | null>,
  ) {}

  evaluate(node: ts.Expression, depth = 0): Alts {
    if (depth > MAX_RESOLVE_DEPTH) return undefined
    const next = depth + 1

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      return single(node.text)
    if (ts.isNumericLiteral(node)) return single(Number(node.text))
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node) ||
      ts.isTypeAssertionExpression(node) ||
      ts.isNonNullExpression(node)
    ) {
      return this.evaluate(node.expression, next)
    }
    if (ts.isTemplateExpression(node)) {
      let acc: Alts = single(node.head.text)
      for (const span of node.templateSpans) {
        const v = this.evaluate(span.expression, next)
        if (!acc || !v) return undefined
        const tail = span.literal.text
        acc = product(acc, v, (x, y) =>
          isScalar(x) && isScalar(y) ? String(x) + String(y) + tail : undefined,
        )
      }
      return acc
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const l = this.evaluate(node.left, next)
      const r = this.evaluate(node.right, next)
      if (!l || !r) return undefined
      return product(l, r, (x, y) => {
        if (typeof x === 'number' && typeof y === 'number') return x + y
        return isScalar(x) && isScalar(y) ? String(x) + String(y) : undefined
      })
    }
    // `cond ? A : B` — điều kiện là giá trị runtime, nên lấy CẢ HAI nhánh. Khoá điểm rẽ là vị trí
    // nút trong file: cùng một ternary (vd qua `const table = …` dùng hai lần) luôn chọn cùng nhánh.
    if (ts.isConditionalExpression(node)) {
      const key = `?:${node.getStart(this.source)}`
      const a = this.evaluate(node.whenTrue, next)
      const b = this.evaluate(node.whenFalse, next)
      const ta = a && tag(a, key, 'T')
      const tb = b && tag(b, key, 'F')
      if (!ta || !tb) return undefined
      const all = [...ta, ...tb]
      return all.length > MAX_VARIANTS ? undefined : all
    }
    if (ts.isArrayLiteralExpression(node)) {
      const items: Scalar[] = []
      for (const el of node.elements) {
        const v = this.evaluate(el, next)
        // Phần tử mảng phải có ĐÚNG một giá trị vô hướng — mảng nhiều biến thể thì bỏ qua.
        const only = v?.length === 1 ? v[0] : undefined
        if (!only || !isScalar(only.value)) return undefined
        items.push(only.value)
      }
      return single(items)
    }
    // `[...].join(sep)` / `HANG_MANG.join(sep)` — khuôn hay gặp khi liệt kê cột.
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === 'join' &&
      node.arguments.length <= 1
    ) {
      const arrs = this.evaluate(node.expression.expression, next)
      const sepNode = node.arguments[0]
      const seps: Alts = sepNode === undefined ? single(',') : this.evaluate(sepNode, next)
      if (!arrs || !seps) return undefined
      return product(arrs, seps, (arr, s) =>
        Array.isArray(arr) && typeof s === 'string' ? arr.map(String).join(s) : undefined,
      )
    }
    // `BANG.khoa` / `BANG['khoa']` / `BANG[bien]` với `BANG` là object literal hằng cùng file.
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
      return this.evaluateMemberAccess(node, next)
    }
    if (ts.isIdentifier(node)) {
      const init = this.consts.get(node.text)
      if (!init) return undefined // không phải const cùng file, hoặc mơ hồ/bị sửa tại chỗ
      return this.evaluate(init, next)
    }
    return undefined
  }

  private evaluateMemberAccess(
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    depth: number,
  ): Alts {
    const obj = this.resolveObjectLiteral(node.expression, depth)
    if (!obj) return undefined
    const props = new Map<string, ts.Expression>()
    for (const p of obj.properties) {
      // Chỉ nhận `khoa: giaTri` đơn giản; có spread/getter/method → không chắc đủ khoá → bỏ.
      if (!ts.isPropertyAssignment(p)) return undefined
      const key = ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) ? p.name.text : undefined
      if (key === undefined) return undefined
      props.set(key, p.initializer)
    }

    const lookup = (key: string): Alts => {
      const init = props.get(key)
      return init ? this.evaluate(init, depth) : undefined
    }

    if (ts.isPropertyAccessExpression(node)) return lookup(node.name.text)
    const k = this.evaluate(node.argumentExpression, depth)
    const onlyKey = k?.length === 1 ? k[0] : undefined
    if (onlyKey && isScalar(onlyKey.value)) return lookup(String(onlyKey.value))

    // Khoá runtime (vd `COLUMN[mode]`) → mọi giá trị của bảng đều khả dĩ. Khoá điểm rẽ là CHỮ của
    // biểu thức truy cập: hai lần `COLUMN[mode]` trong cùng câu luôn cùng giá trị.
    const choiceKey = `[]${node.getText(this.source)}`
    const out: Alt[] = []
    for (const key of props.keys()) {
      const v = lookup(key)
      const tagged = v && tag(v, choiceKey, key)
      if (!tagged) return undefined
      out.push(...tagged)
    }
    return out.length === 0 || out.length > MAX_VARIANTS ? undefined : out
  }

  private resolveObjectLiteral(
    node: ts.Expression,
    depth: number,
  ): ts.ObjectLiteralExpression | undefined {
    if (depth > MAX_RESOLVE_DEPTH) return undefined
    if (ts.isObjectLiteralExpression(node)) return node
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isSatisfiesExpression(node)
    ) {
      return this.resolveObjectLiteral(node.expression, depth + 1)
    }
    if (ts.isIdentifier(node)) {
      const init = this.consts.get(node.text)
      return init ? this.resolveObjectLiteral(init, depth + 1) : undefined
    }
    return undefined
  }
}

/** Lời gọi có dạng `<biểu thức>.query(...)` (kể cả `?.query` và `.query<T>(...)`). */
function isQueryCall(node: ts.Node): node is ts.CallExpression {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === 'query' &&
    node.arguments.length > 0
  )
}

export function extractSqlFromSource(file: string, text: string): ExtractResult {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  const evaluator = new Evaluator(source, collectConstDeclarations(source))
  const queries: ExtractedSql[] = []
  const skipped: SkippedSql[] = []

  const visit = (node: ts.Node): void => {
    if (isQueryCall(node)) {
      const arg = node.arguments[0]
      if (arg) {
        // Dòng của CHÍNH chuỗi SQL (không phải dòng `.query<…>(`) — trỏ thẳng chỗ cần sửa.
        const line = source.getLineAndCharacterOfPosition(arg.getStart(source)).line + 1
        const alts = evaluator.evaluate(arg)
        // Bỏ trùng: hai tổ hợp lựa chọn khác nhau có thể ra cùng một câu.
        const sqls = [...new Set(alts?.map((a) => a.value))]
        if (alts && sqls.every((s): s is string => typeof s === 'string')) {
          sqls.forEach((sql, i) =>
            queries.push(
              sqls.length > 1 ? { file, line, sql, variant: i + 1 } : { file, line, sql },
            ),
          )
        } else {
          skipped.push({ file, line, reason: describeDynamic(arg) })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return { queries, skipped }
}

// Mô tả ngắn vì sao bỏ qua — giúp người đọc thống kê biết khuôn động nào phổ biến.
function describeDynamic(arg: ts.Expression): string {
  if (ts.isTemplateExpression(arg)) return 'template có nội suy không tính được hằng'
  if (ts.isIdentifier(arg)) return `biến \`${arg.text}\` không phải hằng chuỗi cùng file`
  if (ts.isObjectLiteralExpression(arg)) return 'đối số là object cấu hình truy vấn'
  return `biểu thức ${ts.SyntaxKind[arg.kind]}`
}

/** Từ khoá đầu câu (chữ thường), bỏ khoảng trắng và comment SQL `--` / `/* *\/` ở đầu. */
export function leadingKeyword(sql: string): string {
  const stripped = sql.replace(/^(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)+/, '').toLowerCase()
  return /^[a-z_]+/.exec(stripped)?.[0] ?? ''
}

/** Câu điều khiển transaction — không PREPARE được và cũng không có gì để kiểm schema. */
export const TRANSACTION_KEYWORDS: ReadonlySet<string> = new Set([
  'begin',
  'start',
  'commit',
  'end',
  'rollback',
  'savepoint',
  'release',
  'abort',
])

/** Lệnh Postgres cho phép `PREPARE` (SELECT/INSERT/UPDATE/DELETE/MERGE/VALUES, kể cả mở đầu WITH). */
export const PREPARABLE_KEYWORDS: ReadonlySet<string> = new Set([
  'select',
  'insert',
  'update',
  'delete',
  'merge',
  'values',
  'with',
  'table',
])

/** Rút gọn một câu SQL về một dòng — để so khớp allowlist ổn định bất kể xuống dòng/thụt lề. */
export function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim()
}
