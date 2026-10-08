// scripts/lib/sqlAst.ts — Tiện ích AST TypeScript cho bộ trích SQL (scripts/lib/sqlExtract.ts):
// gom khai báo cấp file (hằng, hàm, import/export), tìm chỗ GHI biến, nhận diện hàm/khối/vòng lặp.
// Thuần, không I/O.

import ts from 'typescript'
import type { Scalar } from './sqlValues.js'

// ─── Tiện ích AST ─────────────────────────────────────────────────────────────

// Phương thức làm ĐỔI nội dung mảng/object tại chỗ — `const dieuKien = []; dieuKien.push(...)` là
// giá trị runtime chứ không phải hằng, dù khai báo bằng `const`.
export const MUTATING_METHODS: ReadonlySet<string> = new Set([
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
export function rootIdentifier(node: ts.Expression): string | undefined {
  let cur: ts.Expression = node
  while (
    ts.isPropertyAccessExpression(cur) ||
    ts.isElementAccessExpression(cur) ||
    ts.isParenthesizedExpression(cur) ||
    ts.isNonNullExpression(cur)
  )
    cur = cur.expression
  return ts.isIdentifier(cur) ? cur.text : undefined
}

export function skipWrappers(node: ts.Expression): ts.Expression {
  let cur = node
  while (
    ts.isParenthesizedExpression(cur) ||
    ts.isAsExpression(cur) ||
    ts.isSatisfiesExpression(cur) ||
    ts.isTypeAssertionExpression(cur) ||
    ts.isNonNullExpression(cur) ||
    ts.isAwaitExpression(cur)
  )
    cur = cur.expression
  return cur
}

export const isAssignmentOperator = (kind: ts.SyntaxKind): boolean =>
  kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment

export const isUpdateExpression = (
  node: ts.Node,
): node is ts.PrefixUnaryExpression | ts.PostfixUnaryExpression =>
  (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
  (node.operator === ts.SyntaxKind.PlusPlusToken || node.operator === ts.SyntaxKind.MinusMinusToken)

/** Biểu thức có tác dụng phụ ghi biến (`x++`, `x = …`) — không được tính hai lần / có điều kiện. */
export function containsWrite(node: ts.Node): boolean {
  let found = false
  const visit = (n: ts.Node): void => {
    if (found) return
    if (
      isUpdateExpression(n) ||
      (ts.isBinaryExpression(n) && isAssignmentOperator(n.operatorToken.kind))
    ) {
      found = true
      return
    }
    ts.forEachChild(n, visit)
  }
  visit(node)
  return found
}

/** Tên biến bị `++`/`--` trực tiếp (ngoài hàm lồng) trong một biểu thức. */
export function updatedIdentifiers(node: ts.Node): string[] {
  const out: string[] = []
  const visit = (n: ts.Node): void => {
    if (isFunctionNode(n)) return
    if (isUpdateExpression(n) && ts.isIdentifier(n.operand)) out.push(n.operand.text)
    ts.forEachChild(n, visit)
  }
  visit(node)
  return out
}

export type FunctionNode =
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodDeclaration
  | ts.ConstructorDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration

export function isFunctionNode(node: ts.Node): node is FunctionNode {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  )
}

export function enclosingFunction(node: ts.Node): FunctionNode | ts.SourceFile {
  let cur = node.parent
  while (!ts.isSourceFile(cur)) {
    if (isFunctionNode(cur)) return cur
    cur = cur.parent
  }
  return cur
}

export const contains = (outer: ts.Node, inner: ts.Node): boolean =>
  inner.pos >= outer.pos && inner.end <= outer.end

/** Mọi tên được khai báo bởi một binding (định danh hoặc destructuring). */
export function bindingNames(name: ts.BindingName): string[] {
  if (ts.isIdentifier(name)) return [name.text]
  const out: string[] = []
  for (const el of name.elements)
    if (!ts.isOmittedExpression(el)) out.push(...bindingNames(el.name))
  return out
}

/** Tên khai báo TRỰC TIẾP trong một khối (để bỏ chúng khi ra khỏi khối). */
export function blockDeclaredNames(statements: readonly ts.Statement[]): string[] {
  const out: string[] = []
  for (const s of statements) {
    if (ts.isVariableStatement(s))
      for (const d of s.declarationList.declarations) out.push(...bindingNames(d.name))
    else if (ts.isFunctionDeclaration(s) && s.name) out.push(s.name.text)
  }
  return out
}

/** Vị trí định danh mà mảng/object bị "lọt" ra ngoài (sau đó có thể bị sửa qua bí danh). */
export function isEscapingReference(id: ts.Identifier): boolean {
  const p = id.parent
  if ((ts.isCallExpression(p) || ts.isNewExpression(p)) && p.arguments?.includes(id)) return true
  if (ts.isVariableDeclaration(p) && p.initializer === id) return true
  if (ts.isBinaryExpression(p) && p.right === id && isAssignmentOperator(p.operatorToken.kind))
    return true
  if (ts.isPropertyAssignment(p) && p.initializer === id) return true
  if (ts.isShorthandPropertyAssignment(p)) return true
  if (ts.isArrayLiteralExpression(p)) return true
  if (ts.isReturnStatement(p) || ts.isArrowFunction(p)) return true
  return false
}

/**
 * Các tên bị GHI trong `node`: gán, `++`, `delete`, gọi phương thức sửa tại chỗ, hoặc (với mảng/
 * object — `isReference`) bị truyền/gán đi nơi khác. `inClosure` = ghi bên trong một hàm lồng
 * (chạy vào lúc không biết trước).
 */
export function collectWrites(
  node: ts.Node,
  isReference: (name: string) => boolean,
  skipIdentUpdates = false,
): { direct: Set<string>; inClosure: Set<string> } {
  const direct = new Set<string>()
  const inClosure = new Set<string>()
  const visit = (n: ts.Node, inFn: boolean, shadowed: ReadonlySet<string>): void => {
    const add = (name: string | undefined): void => {
      if (name !== undefined && !shadowed.has(name)) (inFn ? inClosure : direct).add(name)
    }
    if (ts.isBinaryExpression(n) && isAssignmentOperator(n.operatorToken.kind))
      assignedNames(n.left).forEach(add)
    else if (
      (ts.isForOfStatement(n) || ts.isForInStatement(n)) &&
      !ts.isVariableDeclarationList(n.initializer)
    )
      assignedNames(n.initializer).forEach(add) // `for (x of …)` gán vào biến có sẵn
    else if (isUpdateExpression(n)) {
      // `i++` ngay trong biểu thức sắp được TÍNH (bộ tính tự áp tác dụng phụ) thì không tính là ghi.
      if (!(skipIdentUpdates && !inFn && ts.isIdentifier(n.operand))) add(rootIdentifier(n.operand))
    } else if (ts.isDeleteExpression(n)) add(rootIdentifier(n.expression))
    else if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      MUTATING_METHODS.has(n.expression.name.text)
    )
      add(rootIdentifier(n.expression.expression))
    else if (ts.isIdentifier(n) && isReference(n.text) && isEscapingReference(n)) add(n.text)
    // Vào hàm lồng: tên mà chính hàm đó khai báo (tham số, biến cục bộ) là biến KHÁC — ghi vào
    // chúng không phải ghi vào biến bên ngoài trùng tên.
    const entersFn = n !== node && isFunctionNode(n)
    const childShadowed = entersFn ? new Set([...shadowed, ...declaredWithin(n)]) : shadowed
    ts.forEachChild(n, (c) => visit(c, inFn || entersFn, childShadowed))
  }
  const own = isFunctionNode(node)
  visit(node, own, own ? declaredWithin(node) : new Set())
  return { direct, inClosure }
}

/** Biến gốc bị gán bởi vế trái `x = …` / `a.b = …` / `[a, b] = …` / `({ a, b: c } = …)`. */
function assignedNames(target: ts.Expression): string[] {
  const t = skipWrappers(target)
  if (ts.isArrayLiteralExpression(t))
    return t.elements.flatMap((e) =>
      ts.isOmittedExpression(e) ? [] : assignedNames(ts.isSpreadElement(e) ? e.expression : e),
    )
  if (ts.isObjectLiteralExpression(t))
    return t.properties.flatMap((p) => {
      if (ts.isShorthandPropertyAssignment(p)) return [p.name.text]
      if (ts.isPropertyAssignment(p)) return assignedNames(p.initializer)
      if (ts.isSpreadAssignment(p)) return assignedNames(p.expression)
      return []
    })
  if (ts.isBinaryExpression(t) && t.operatorToken.kind === ts.SyntaxKind.EqualsToken)
    return assignedNames(t.left) // giá trị mặc định trong destructuring: `[a = 1] = …`
  const root = rootIdentifier(t)
  return root === undefined ? [] : [root]
}

/** Mọi tên một hàm tự khai báo (tham số + biến/hàm ở bất kỳ đâu trong thân). */
export function declaredWithin(fn: FunctionNode): Set<string> {
  const out = new Set<string>()
  for (const p of fn.parameters) for (const n of bindingNames(p.name)) out.add(n)
  const visit = (n: ts.Node): void => {
    if (ts.isVariableDeclaration(n)) for (const name of bindingNames(n.name)) out.add(name)
    if (ts.isFunctionDeclaration(n) && n.name && n !== fn) out.add(n.name.text)
    ts.forEachChild(n, visit)
  }
  if (fn.body) visit(fn.body)
  return out
}

// ─── Khai báo cấp file ────────────────────────────────────────────────────────

export interface ImportBinding {
  specifier: string
  name: string
}

export interface FileFacts {
  /** Tên → initializer của `const` khai báo ĐÚNG MỘT lần; `null` = không dùng được. */
  consts: Map<string, ts.Expression | null>
  /** Tên bị sửa nội dung tại chỗ ở đâu đó trong file (`x.push(…)`, `x.k = …`, `delete x.k`). */
  mutated: Set<string>
  /** Hàm khai báo `function f` (có thân) ĐÚNG MỘT lần; `null` = trùng tên. */
  functions: Map<string, ts.FunctionDeclaration | null>
  imports: Map<string, ImportBinding>
  /** Tên export → tên cục bộ. */
  exports: Map<string, string>
  reExports: Map<string, ImportBinding>
  /** Số lần mỗi định danh xuất hiện (để biết hàm có được nhắc tới ngoài lời gọi trực tiếp). */
  references: Map<string, ts.Identifier[]>
}

export const hasExportModifier = (node: ts.Node): boolean =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false)

/**
 * Gom khai báo cấp file. `const` chỉ dùng được khi tên của nó KHÔNG trùng bất kỳ binding nào khác
 * trong file (const khác scope, let/var, tham số, import, hàm…) — không đoán scope, thà bỏ qua
 * còn hơn suy sai — và không bị sửa nội dung tại chỗ.
 */
export function collectFileFacts(source: ts.SourceFile): FileFacts {
  const facts: FileFacts = {
    consts: new Map(),
    mutated: new Set(),
    functions: new Map(),
    imports: new Map(),
    exports: new Map(),
    reExports: new Map(),
    references: new Map(),
  }
  const otherBindings = new Set<string>()
  const markMutated = (target: ts.Expression): void => {
    const root = rootIdentifier(target)
    if (root) facts.mutated.add(root)
  }

  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclarationList(node)) {
      const isConst = (node.flags & ts.NodeFlags.Const) !== 0
      for (const decl of node.declarations) {
        if (isConst && ts.isIdentifier(decl.name)) {
          const name = decl.name.text
          facts.consts.set(name, facts.consts.has(name) ? null : (decl.initializer ?? null))
        } else {
          for (const n of bindingNames(decl.name)) otherBindings.add(n)
        }
      }
      if (ts.isVariableStatement(node.parent) && hasExportModifier(node.parent))
        for (const d of node.declarations)
          for (const n of bindingNames(d.name)) facts.exports.set(n, n)
    }
    if (ts.isParameter(node)) for (const n of bindingNames(node.name)) otherBindings.add(n)
    if (ts.isCatchClause(node) && node.variableDeclaration)
      for (const n of bindingNames(node.variableDeclaration.name)) otherBindings.add(n)
    if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node)) && node.name) {
      otherBindings.add(node.name.text)
      if (ts.isFunctionDeclaration(node) && node.body) {
        const name = node.name.text
        facts.functions.set(name, facts.functions.has(name) ? null : node)
      }
    }
    if (ts.isImportDeclaration(node)) collectImport(node, facts, otherBindings)
    if (ts.isExportDeclaration(node)) collectExport(node, facts)
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      MUTATING_METHODS.has(node.expression.name.text)
    ) {
      markMutated(node.expression.expression)
    }
    if (
      ts.isBinaryExpression(node) &&
      isAssignmentOperator(node.operatorToken.kind) &&
      (ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left))
    ) {
      markMutated(node.left)
    }
    if (ts.isDeleteExpression(node)) markMutated(node.expression)
    if (ts.isIdentifier(node)) {
      const list = facts.references.get(node.text)
      if (list) list.push(node)
      else facts.references.set(node.text, [node])
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  for (const name of facts.mutated) if (facts.consts.has(name)) facts.consts.set(name, null)
  for (const name of otherBindings) if (facts.consts.has(name)) facts.consts.set(name, null)
  return facts
}

export function collectImport(
  node: ts.ImportDeclaration,
  facts: FileFacts,
  others: Set<string>,
): void {
  const clause = node.importClause
  if (!clause || !ts.isStringLiteral(node.moduleSpecifier)) return
  const specifier = node.moduleSpecifier.text
  if (clause.name) others.add(clause.name.text)
  const bindings = clause.namedBindings
  if (!bindings) return
  if (ts.isNamespaceImport(bindings)) {
    others.add(bindings.name.text)
    return
  }
  for (const el of bindings.elements) {
    others.add(el.name.text)
    if (clause.isTypeOnly || el.isTypeOnly) continue
    facts.imports.set(el.name.text, { specifier, name: (el.propertyName ?? el.name).text })
  }
}

export function collectExport(node: ts.ExportDeclaration, facts: FileFacts): void {
  if (node.isTypeOnly || !node.exportClause || !ts.isNamedExports(node.exportClause)) return
  const specifier =
    node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
      ? node.moduleSpecifier.text
      : undefined
  for (const el of node.exportClause.elements) {
    const local = (el.propertyName ?? el.name).text
    if (specifier) facts.reExports.set(el.name.text, { specifier, name: local })
    else facts.exports.set(el.name.text, local)
  }
}

export function compareOperator(
  kind: ts.SyntaxKind,
): ((l: Scalar, r: Scalar) => boolean) | undefined {
  // So sánh khác kiểu (số với chuỗi) → không đoán quy tắc ép kiểu của JS.
  const same =
    (f: (l: Scalar, r: Scalar) => boolean) =>
    (l: Scalar, r: Scalar): boolean =>
      typeof l === typeof r && f(l, r)
  switch (kind) {
    case ts.SyntaxKind.EqualsEqualsEqualsToken:
    case ts.SyntaxKind.EqualsEqualsToken:
      return same((l, r) => l === r)
    case ts.SyntaxKind.ExclamationEqualsEqualsToken:
    case ts.SyntaxKind.ExclamationEqualsToken:
      return (l, r) => typeof l === typeof r && l !== r
    case ts.SyntaxKind.GreaterThanToken:
      return same((l, r) => l > r)
    case ts.SyntaxKind.GreaterThanEqualsToken:
      return same((l, r) => l >= r)
    case ts.SyntaxKind.LessThanToken:
      return same((l, r) => l < r)
    case ts.SyntaxKind.LessThanEqualsToken:
      return same((l, r) => l <= r)
    default:
      return undefined
  }
}

/** `khoa: giaTri` đơn giản; có spread/getter/method/khoá tính toán → `undefined` (không chắc đủ khoá). */
export function objectProperties(
  node: ts.ObjectLiteralExpression,
): Map<string, ts.Expression> | undefined {
  const props = new Map<string, ts.Expression>()
  for (const p of node.properties) {
    if (!ts.isPropertyAssignment(p)) return undefined
    const key = ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) ? p.name.text : undefined
    if (key === undefined) return undefined
    props.set(key, p.initializer)
  }
  return props
}

export function callbackBody(
  fn: ts.ArrowFunction | ts.FunctionExpression,
): ts.Expression | undefined {
  if (!ts.isBlock(fn.body)) return fn.body
  const [only] = fn.body.statements
  return fn.body.statements.length === 1 && only && ts.isReturnStatement(only)
    ? only.expression
    : undefined
}

export function loopDeclaredNames(stmt: ts.IterationStatement): string[] {
  const init =
    ts.isForStatement(stmt) || ts.isForInStatement(stmt) || ts.isForOfStatement(stmt)
      ? stmt.initializer
      : undefined
  return init && ts.isVariableDeclarationList(init)
    ? init.declarations.flatMap((d) => bindingNames(d.name))
    : []
}

// Mô tả ngắn vì sao bỏ qua — giúp người đọc thống kê biết khuôn động nào phổ biến.
export function describeDynamic(arg: ts.Expression): string {
  if (ts.isTemplateExpression(arg)) return 'template có nội suy không tính được hằng'
  if (ts.isIdentifier(arg)) return `biến \`${arg.text}\` không suy ra được chuỗi SQL`
  if (ts.isObjectLiteralExpression(arg)) return 'đối số là object cấu hình truy vấn'
  return `biểu thức ${ts.SyntaxKind[arg.kind]}`
}
