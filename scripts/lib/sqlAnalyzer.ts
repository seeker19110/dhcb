// scripts/lib/sqlAnalyzer.ts — Phân tích một file nguồn cho bộ trích SQL (scripts/lib/sqlExtract.ts):
// TÍNH giá trị biểu thức (hằng, hằng import, tra bảng, `.join`/`.map`/`Object.values`, hàm trả lại
// đối số) và MÔ PHỎNG ĐƯỜNG CHẠY trong thân hàm chứa lời gọi `.query(` (if/for-of/try/switch, biến
// cục bộ, `push`, `+=`, `i++`, tham số suy từ nơi gọi). Nguyên tắc: không chắc thì KHÔNG BIẾT.

import ts from 'typescript'
import {
  bindingNames,
  blockDeclaredNames,
  callbackBody,
  collectFileFacts,
  collectWrites,
  compareOperator,
  contains,
  containsWrite,
  describeDynamic,
  enclosingFunction,
  hasExportModifier,
  isFunctionNode,
  isUpdateExpression,
  loopDeclaredNames,
  objectProperties,
  skipWrappers,
  updatedIdentifiers,
  type FileFacts,
  type FunctionNode,
} from './sqlAst.js'
import {
  assign,
  clonePath,
  emptyPath,
  isArray,
  isLazy,
  isObjRef,
  isScalar,
  MAX_CALL_DEPTH,
  MAX_RESOLVE_DEPTH,
  MAX_VARIANTS,
  mergeChoices,
  NO_CHOICES,
  ok,
  onlyScalar,
  plus,
  product,
  restrict,
  single,
  tag,
  toEnvValue,
  trackedNames,
  truthy,
  UNKNOWN,
  withChoice,
  type Alt,
  type Alts,
  type Cell,
  type Choices,
  type Env,
  type Path,
  type PathResult,
} from './sqlValues.js'

export interface LoadedModule {
  /** Đường dẫn file (cùng quy ước với `file` truyền vào extractSqlFromSource). */
  file: string
  text: string
}

/** Nạp mã nguồn của `specifier` được import từ `fromFile`; `undefined` nếu không phân giải được. */
export type ModuleLoader = (fromFile: string, specifier: string) => LoadedModule | undefined

// ─── Phân tích một file ───────────────────────────────────────────────────────

/** Bộ nhớ đệm các file đã phân tích + bộ nạp module (cho hằng import). */
export class Project {
  private readonly modules = new Map<string, ModuleAnalyzer>()
  constructor(private readonly loadModule: ModuleLoader | undefined) {}

  analyzer(file: string, text: string): ModuleAnalyzer {
    const cached = this.modules.get(file)
    if (cached) return cached
    const mod = new ModuleAnalyzer(file, text, this)
    this.modules.set(file, mod)
    return mod
  }

  importTarget(fromFile: string, specifier: string): ModuleAnalyzer | undefined {
    const loaded = this.loadModule?.(fromFile, specifier)
    return loaded ? this.analyzer(loaded.file, loaded.text) : undefined
  }
}

interface Ctx {
  /** Biến bị ghi trong closure — KHÔNG BIẾT suốt lần mô phỏng này. */
  volatile: Set<string>
  callDepth: number
}

export class ModuleAnalyzer {
  readonly source: ts.SourceFile
  private readonly facts: FileFacts
  private readonly passthrough = new Map<ts.FunctionDeclaration, number | null>()
  /** Hàm đang được lần tham số ngược về nơi gọi — chặn đệ quy. */
  private readonly inProgress = new Set<ts.Node>()

  constructor(
    readonly file: string,
    text: string,
    private readonly project: Project,
  ) {
    this.source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
    this.facts = collectFileFacts(this.source)
  }

  private key(prefix: string, node: ts.Node): string {
    return `${prefix}${this.file}:${node.getStart(this.source)}`
  }

  // ── Tính giá trị biểu thức ──

  evaluate(node: ts.Expression, env: Env, depth = 0): Alts {
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
      return this.evaluate(node.expression, env, next)
    }
    if (ts.isTemplateExpression(node)) return this.evaluateTemplate(node, env, next)
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
      const l = this.evaluate(node.left, env, next)
      const r = l && this.evaluate(node.right, env, next)
      return l && r ? product(l, r, plus) : undefined
    }
    if (ts.isConditionalExpression(node)) return this.evaluateConditional(node, env, next)
    if (ts.isArrayLiteralExpression(node)) return this.evaluateArray(node, env, next)
    if (ts.isObjectLiteralExpression(node))
      return single({ kind: 'object', node, mod: this, env: new Map(env) })
    if (ts.isCallExpression(node)) return this.evaluateCall(node, env, next)
    if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
      return this.evaluateMemberAccess(node, env, next)
    if (ts.isIdentifier(node)) return this.evaluateIdentifier(node.text, env, next)
    if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node))
      return this.evaluateUnary(node, env)
    return undefined
  }

  private evaluateTemplate(node: ts.TemplateExpression, env: Env, depth: number): Alts {
    let acc: Alts = single(node.head.text)
    for (const span of node.templateSpans) {
      // Đánh giá TUẦN TỰ từ trái sang phải: `$${i++}` ở hai chỗ phải ra hai số khác nhau.
      const v = this.evaluate(span.expression, env, depth)
      if (!acc || !v) return undefined
      const tail = span.literal.text
      acc = product(acc, v, (x, y) =>
        isScalar(x) && isScalar(y) ? String(x) + String(y) + tail : undefined,
      )
    }
    return acc
  }

  // `cond ? A : B` — điều kiện tính được thì chỉ lấy đúng nhánh; không thì lấy CẢ HAI nhánh.
  // Khoá điểm rẽ là vị trí nút: cùng một ternary (vd qua `const table = …` dùng hai lần) luôn
  // chọn cùng nhánh.
  private evaluateConditional(node: ts.ConditionalExpression, env: Env, depth: number): Alts {
    if (containsWrite(node)) return undefined // tác dụng phụ có điều kiện — không mô phỏng
    const cond = this.evaluateCondition(node.condition, env, depth)
    if (cond === true) return this.evaluate(node.whenTrue, env, depth)
    if (cond === false) return this.evaluate(node.whenFalse, env, depth)
    const key = this.key('?:', node)
    const a = this.evaluate(node.whenTrue, env, depth)
    const b = a && this.evaluate(node.whenFalse, env, depth)
    if (!a || !b) return undefined
    const all = [...tag(a, key, 'T'), ...tag(b, key, 'F')]
    return all.length > MAX_VARIANTS ? undefined : all
  }

  private evaluateArray(node: ts.ArrayLiteralExpression, env: Env, depth: number): Alts {
    const cells: Cell[] = []
    let choices: Choices = NO_CHOICES
    for (const el of node.elements) {
      if (ts.isSpreadElement(el) || ts.isOmittedExpression(el)) return undefined // không biết độ dài
      const v = this.evaluate(el, env, depth)
      const only = v?.length === 1 ? v[0] : undefined
      // Phần tử không tính được / nhiều giá trị → ô KHÔNG BIẾT (độ dài mảng vẫn biết — đủ cho
      // `$${params.length}`; còn `.join()` gặp ô không biết thì bỏ cả câu).
      if (!only || isArray(only.value)) {
        cells.push(UNKNOWN)
        continue
      }
      const merged = mergeChoices(choices, only.choices)
      if (!merged) return undefined
      choices = merged
      cells.push(only.value)
    }
    return single(cells, choices)
  }

  private evaluateCall(node: ts.CallExpression, env: Env, depth: number): Alts {
    const callee = node.expression
    if (ts.isPropertyAccessExpression(callee)) {
      const method = callee.name.text
      // `[...].join(sep)` / `HANG_MANG.join(sep)` — khuôn hay gặp khi liệt kê cột.
      if (method === 'join' && node.arguments.length <= 1) {
        const arrs = this.evaluate(callee.expression, env, depth)
        const sepNode = node.arguments[0]
        const seps = sepNode === undefined ? single(',') : this.evaluate(sepNode, env, depth)
        if (!arrs || !seps) return undefined
        return product(arrs, seps, (arr, s) =>
          isArray(arr) && typeof s === 'string' && arr.every(isScalar)
            ? arr.map(String).join(s)
            : undefined,
        )
      }
      if (method === 'map' && node.arguments.length === 1)
        return this.evaluateMap(callee.expression, node.arguments[0], env, depth)
      if (
        method === 'values' &&
        node.arguments.length === 1 &&
        ts.isIdentifier(callee.expression) &&
        callee.expression.text === 'Object' &&
        !this.isBound('Object', env)
      ) {
        return this.evaluateObjectValues(node.arguments[0], env, depth)
      }
      return undefined
    }
    // Hàm cùng file chỉ "trả lại đối số" (vd `assertIdent(v, re)` — ném lỗi hoặc `return v`).
    if (ts.isIdentifier(callee) && !this.isBound(callee.text, env)) {
      const fn = this.facts.functions.get(callee.text)
      const index = fn ? this.passthroughIndex(fn) : null
      const arg = index === null ? undefined : node.arguments[index]
      if (arg && !node.arguments.slice(0, index ?? 0).some(ts.isSpreadElement))
        return this.evaluate(arg, env, depth)
    }
    return undefined
  }

  /** `ARR.map(x => biểuThức)` — mỗi phần tử phải ra đúng một giá trị vô hướng. */
  private evaluateMap(
    receiver: ts.Expression,
    callback: ts.Expression | undefined,
    env: Env,
    depth: number,
  ): Alts {
    if (!callback || !(ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)))
      return undefined
    const param = callback.parameters[0]
    const body = callbackBody(callback)
    if (
      callback.parameters.length !== 1 ||
      !param ||
      !ts.isIdentifier(param.name) ||
      !body ||
      containsWrite(body) // ghi biến ngoài từ trong callback — không mô phỏng
    )
      return undefined
    const paramName = param.name.text
    const arrs = this.evaluate(receiver, env, depth)
    if (!arrs) return undefined
    const out: Alt[] = []
    for (const alt of arrs) {
      if (!isArray(alt.value)) return undefined
      const cells: Cell[] = []
      let choices: Choices | undefined = alt.choices
      for (const cell of alt.value) {
        if (cell === UNKNOWN) return undefined
        const inner: Env = new Map(env)
        inner.set(paramName, cell)
        const v = this.evaluate(body, inner, depth)
        const only = v?.length === 1 ? v[0] : undefined
        if (!only || isArray(only.value)) return undefined
        choices = choices && mergeChoices(choices, only.choices)
        cells.push(only.value)
      }
      if (choices) out.push({ value: cells, choices })
    }
    return out
  }

  /** `Object.values(OBJ)` với OBJ là object literal hằng — thứ tự = thứ tự khai báo khoá. */
  private evaluateObjectValues(arg: ts.Expression | undefined, env: Env, depth: number): Alts {
    if (!arg) return undefined
    const objs = this.evaluate(arg, env, depth)
    if (!objs) return undefined
    const out: Alt[] = []
    for (const alt of objs) {
      if (!isObjRef(alt.value)) return undefined
      const props = objectProperties(alt.value.node)
      // Khoá dạng số nguyên bị JS xếp lên trước — thứ tự khác thứ tự khai báo → không đoán.
      if (!props || [...props.keys()].some((k) => /^\d+$/.test(k))) return undefined
      const cells: Cell[] = []
      let choices: Choices | undefined = alt.choices
      for (const init of props.values()) {
        const v = alt.value.mod.evaluate(init, alt.value.env, depth)
        const only = v?.length === 1 ? v[0] : undefined
        if (!only || isArray(only.value)) return undefined
        choices = choices && mergeChoices(choices, only.choices)
        cells.push(only.value)
      }
      if (choices) out.push({ value: cells, choices })
    }
    return out
  }

  // `BANG.khoa` / `BANG['khoa']` / `BANG[bien]` với `BANG` là object literal; `X.length`.
  private evaluateMemberAccess(
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    env: Env,
    depth: number,
  ): Alts {
    const receivers = this.evaluate(node.expression, env, depth)
    if (!receivers) return undefined
    const out: Alt[] = []
    for (const recv of receivers) {
      const v = this.memberOf(node, recv, env, depth)
      if (!v) return undefined
      out.push(...v)
      if (out.length > MAX_VARIANTS) return undefined
    }
    return out
  }

  private memberOf(
    node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
    recv: Alt,
    env: Env,
    depth: number,
  ): Alts {
    const value = recv.value
    if (ts.isPropertyAccessExpression(node) && node.name.text === 'length') {
      if (isArray(value) || typeof value === 'string') return single(value.length, recv.choices)
    }
    if (!isObjRef(value)) return undefined
    const props = objectProperties(value.node)
    if (!props) return undefined
    const lookup = (key: string): Alts => {
      const init = props.get(key)
      const v = init ? value.mod.evaluate(init, value.env, depth) : undefined
      return v && restrict(v, recv.choices)
    }

    if (ts.isPropertyAccessExpression(node)) return lookup(node.name.text)
    const k = this.evaluate(node.argumentExpression, env, depth)
    const onlyKey = onlyScalar(k)
    if (onlyKey !== undefined) return lookup(String(onlyKey))

    // Khoá runtime (vd `COLUMN[mode]`) → mọi giá trị của bảng đều khả dĩ. Khoá điểm rẽ là CHỮ của
    // biểu thức truy cập: hai lần `COLUMN[mode]` trong cùng câu luôn cùng giá trị.
    const choiceKey = `[]${node.getText(this.source)}`
    const out: Alt[] = []
    for (const key of props.keys()) {
      const v = lookup(key)
      if (!v) return undefined
      out.push(...tag(v, choiceKey, key))
    }
    return out.length === 0 || out.length > MAX_VARIANTS ? undefined : out
  }

  private evaluateIdentifier(name: string, env: Env, depth: number): Alts {
    if (env.has(name)) {
      const v = env.get(name)
      if (v === undefined || v === UNKNOWN) return undefined
      return isLazy(v) ? v.alts : single(v)
    }
    const init = this.facts.consts.get(name)
    if (init) return this.evaluate(init, new Map(), depth)
    const imported = this.resolveImported(name)
    return imported ? imported.mod.evaluate(imported.init, new Map(), depth) : undefined
  }

  /** `-5`, `i++`, `++i` (biến cục bộ đang mô phỏng, giá trị số) — GHI vào `env`. */
  private evaluateUnary(
    node: ts.PrefixUnaryExpression | ts.PostfixUnaryExpression,
    env: Env,
  ): Alts {
    if (
      ts.isPrefixUnaryExpression(node) &&
      node.operator === ts.SyntaxKind.MinusToken &&
      ts.isNumericLiteral(node.operand)
    ) {
      return single(-Number(node.operand.text))
    }
    if (!isUpdateExpression(node) || !ts.isIdentifier(node.operand)) return undefined
    const name = node.operand.text
    const current = env.get(name)
    if (typeof current !== 'number') return undefined
    const updated = node.operator === ts.SyntaxKind.PlusPlusToken ? current + 1 : current - 1
    env.set(name, updated)
    return single(ts.isPostfixUnaryExpression(node) ? current : updated)
  }

  /** Điều kiện chắc chắn đúng/sai, hoặc `undefined` nếu phụ thuộc runtime. */
  evaluateCondition(node: ts.Expression, env: Env, depth = 0): boolean | undefined {
    if (depth > MAX_RESOLVE_DEPTH || containsWrite(node)) return undefined
    const n = skipWrappers(node)
    if (n.kind === ts.SyntaxKind.TrueKeyword) return true
    if (n.kind === ts.SyntaxKind.FalseKeyword) return false
    if (ts.isPrefixUnaryExpression(n) && n.operator === ts.SyntaxKind.ExclamationToken) {
      const c = this.evaluateCondition(n.operand, env, depth + 1)
      return c === undefined ? undefined : !c
    }
    if (ts.isBinaryExpression(n)) {
      const op = n.operatorToken.kind
      if (op === ts.SyntaxKind.AmpersandAmpersandToken || op === ts.SyntaxKind.BarBarToken) {
        const l = this.evaluateCondition(n.left, env, depth + 1)
        const r = this.evaluateCondition(n.right, env, depth + 1)
        if (op === ts.SyntaxKind.AmpersandAmpersandToken)
          return l === false || r === false ? false : l === true && r === true ? true : undefined
        return l === true || r === true ? true : l === false && r === false ? false : undefined
      }
      const cmp = compareOperator(op)
      if (cmp) {
        const l = onlyScalar(this.evaluate(n.left, env, depth + 1))
        const r = onlyScalar(this.evaluate(n.right, env, depth + 1))
        return l === undefined || r === undefined ? undefined : cmp(l, r)
      }
    }
    const v = this.evaluate(n, env, depth + 1)
    if (!v) return undefined
    const truths = new Set(v.map((a) => truthy(a.value)))
    return truths.size === 1 ? truths.has(true) : undefined
  }

  /** Tên có binding cục bộ đang mô phỏng hoặc binding cấp file (không phải biến toàn cục JS). */
  private isBound(name: string, env: Env): boolean {
    return env.has(name) || this.facts.consts.has(name) || this.facts.imports.has(name)
  }

  /**
   * Chỉ số tham số mà hàm luôn trả lại NGUYÊN VẸN (mọi `return` đều là `return <tham số đó>`,
   * tham số không bị gán lại), hoặc `null`. Hàm async/generator trả Promise/iterator → `null`.
   */
  private passthroughIndex(fn: ts.FunctionDeclaration): number | null {
    const cached = this.passthrough.get(fn)
    if (cached !== undefined) return cached
    let result: number | null = null
    const isAsyncOrGen =
      fn.asteriskToken !== undefined ||
      (ts.getModifiers(fn)?.some((m) => m.kind === ts.SyntaxKind.AsyncKeyword) ?? false)
    // Câu cuối phải là `return` — thân "rơi" ra cuối hàm thì trả `undefined`, không phải đối số.
    const last = fn.body?.statements[fn.body.statements.length - 1]
    if (fn.body && !isAsyncOrGen && last && ts.isReturnStatement(last)) {
      const names = fn.parameters.map((p) => (ts.isIdentifier(p.name) ? p.name.text : undefined))
      const returned = new Set<string | undefined>()
      const visit = (n: ts.Node): void => {
        if (n !== fn && isFunctionNode(n)) return // return của hàm lồng không tính
        if (ts.isReturnStatement(n)) {
          const e = n.expression && skipWrappers(n.expression)
          returned.add(e && ts.isIdentifier(e) ? e.text : undefined)
        }
        ts.forEachChild(n, visit)
      }
      visit(fn.body)
      const [only] = [...returned]
      const index = returned.size === 1 && only !== undefined ? names.indexOf(only) : -1
      const writes = collectWrites(fn.body, () => false)
      if (
        index >= 0 &&
        only !== undefined &&
        !writes.direct.has(only) &&
        !writes.inClosure.has(only)
      )
        result = index
    }
    this.passthrough.set(fn, result)
    return result
  }

  private resolveImported(name: string): { mod: ModuleAnalyzer; init: ts.Expression } | undefined {
    const imp = this.facts.imports.get(name)
    if (!imp || this.facts.mutated.has(name)) return undefined
    return this.project.importTarget(this.file, imp.specifier)?.resolveExportedConst(imp.name, 0)
  }

  private resolveExportedConst(
    name: string,
    depth: number,
  ): { mod: ModuleAnalyzer; init: ts.Expression } | undefined {
    if (depth > MAX_RESOLVE_DEPTH) return undefined
    const local = this.facts.exports.get(name)
    if (local !== undefined) {
      const init = this.facts.consts.get(local)
      return init ? { mod: this, init } : undefined
    }
    const re = this.facts.reExports.get(name)
    return re
      ? this.project.importTarget(this.file, re.specifier)?.resolveExportedConst(re.name, depth + 1)
      : undefined
  }

  // ── Mô phỏng đường chạy ──

  /** Mọi giá trị khả dĩ của đối số SQL của lời gọi `call`, hoặc lý do không suy ra được. */
  sqlOf(call: ts.CallExpression, arg: ts.Expression): { sqls: string[] } | { reason: string } {
    const r = this.pathsBefore(call, 0)
    if (!r.ok) return { reason: r.reason }
    if (r.paths.length === 0) return { reason: 'không có đường chạy nào tới được lời gọi' }
    const sqls = new Set<string>()
    for (const path of r.paths) {
      const alts = this.evaluate(arg, new Map(path.env))
      if (!alts) return { reason: describeDynamic(arg) }
      for (const alt of restrict(alts, path.choices)) {
        if (typeof alt.value !== 'string') return { reason: describeDynamic(arg) }
        sqls.add(alt.value)
      }
    }
    if (sqls.size > MAX_VARIANTS) return { reason: `quá ${MAX_VARIANTS} biến thể` }
    return { sqls: [...sqls] }
  }

  /** Các đường chạy (biến cục bộ + lựa chọn) ngay TRƯỚC câu lệnh chứa `target`. */
  private pathsBefore(target: ts.Node, callDepth: number): PathResult {
    const fn = enclosingFunction(target)
    const ctx: Ctx = { volatile: new Set(), callDepth }
    if (ts.isSourceFile(fn)) return this.runUntil(fn.statements, target, [emptyPath()], ctx)
    const start: Path = { env: this.bindParams(fn, ctx), choices: NO_CHOICES }
    if (!fn.body || !ts.isBlock(fn.body)) return ok([start])
    return this.runUntil(fn.body.statements, target, [start], ctx)
  }

  /**
   * Gán giá trị tham số. Hàm `function f` KHÔNG export, mọi lần nhắc tới `f` trong file đều là
   * lời gọi trực tiếp `f(...)` → tham số = hợp mọi đối số ở mọi nơi gọi (mỗi nơi gọi một nhánh,
   * nên các tham số luôn đi cùng nhau). Còn lại → KHÔNG BIẾT.
   */
  private bindParams(fn: FunctionNode, ctx: Ctx): Env {
    const env: Env = new Map()
    for (const p of fn.parameters) for (const n of bindingNames(p.name)) env.set(n, UNKNOWN)
    const sites = this.localCallSites(fn)
    if (!sites || ctx.callDepth >= MAX_CALL_DEPTH || this.inProgress.has(fn)) return env
    this.inProgress.add(fn)
    try {
      const perParam: Alt[][] = fn.parameters.map(() => [])
      const known = fn.parameters.map((p) => ts.isIdentifier(p.name))
      const callKey = this.key('call:', fn)
      sites.forEach((site, i) => {
        const r = this.pathsBefore(site, ctx.callDepth + 1)
        fn.parameters.forEach((param, j) => {
          const alts = r.ok ? this.argumentAlts(site, param, j, r.paths) : undefined
          if (!alts) known[j] = false
          else perParam[j]?.push(...tag(alts, callKey, String(i)))
        })
      })
      fn.parameters.forEach((param, j) => {
        const alts = perParam[j]
        if (!known[j] || !alts || alts.length === 0 || alts.length > MAX_VARIANTS) return
        if (ts.isIdentifier(param.name)) env.set(param.name.text, toEnvValue(alts))
      })
    } finally {
      this.inProgress.delete(fn)
    }
    return env
  }

  /** Giá trị đối số thứ `j` tại một nơi gọi, trên mọi đường chạy tới nơi gọi đó. */
  private argumentAlts(
    site: ts.CallExpression,
    param: ts.ParameterDeclaration,
    j: number,
    paths: Path[],
  ): Alt[] | undefined {
    if (site.arguments.slice(0, j + 1).some(ts.isSpreadElement)) return undefined
    const arg = site.arguments[j] ?? param.initializer
    if (!arg) return undefined
    const out: Alt[] = []
    for (const path of paths) {
      const v = this.evaluate(arg, new Map(path.env))
      if (!v) return undefined
      out.push(...restrict(v, path.choices))
    }
    return out
  }

  /** Mọi lời gọi `f(...)` nếu `fn` là `function f` không export chỉ được dùng bằng cách gọi. */
  private localCallSites(fn: FunctionNode): ts.CallExpression[] | undefined {
    if (!ts.isFunctionDeclaration(fn) || !fn.name || hasExportModifier(fn)) return undefined
    if (this.facts.functions.get(fn.name.text) !== fn) return undefined
    const sites: ts.CallExpression[] = []
    for (const ref of this.facts.references.get(fn.name.text) ?? []) {
      if (ref === fn.name) continue
      const call = ref.parent
      if (!ts.isCallExpression(call) || call.expression !== ref) return undefined
      sites.push(call)
    }
    return sites.length > 0 ? sites : undefined
  }

  private runUntil(
    statements: readonly ts.Statement[],
    target: ts.Node,
    paths: Path[],
    ctx: Ctx,
  ): PathResult {
    let cur = paths
    for (const stmt of statements) {
      if (contains(stmt, target)) return this.descend(stmt, target, cur, ctx)
      const r = this.exec(stmt, cur, ctx)
      if (!r.ok || r.paths.length === 0) return r
      cur = r.paths
    }
    return ok(cur)
  }

  /** Đi vào câu lệnh CHỨA `target` cho tới đúng chỗ lời gọi. */
  private descend(stmt: ts.Statement, target: ts.Node, paths: Path[], ctx: Ctx): PathResult {
    if (ts.isBlock(stmt)) return this.runUntil(stmt.statements, target, paths, ctx)
    if (ts.isLabeledStatement(stmt)) return this.descend(stmt.statement, target, paths, ctx)
    if (ts.isIfStatement(stmt)) {
      if (contains(stmt.expression, target)) return ok(paths)
      this.taint(stmt.expression, paths, ctx)
      const inThen = contains(stmt.thenStatement, target)
      const split = this.splitOnCondition(stmt, paths)
      const branch = inThen ? stmt.thenStatement : stmt.elseStatement
      return branch ? this.descend(branch, target, inThen ? split.t : split.f, ctx) : ok(paths)
    }
    if (ts.isForOfStatement(stmt) && contains(stmt.statement, target))
      return this.descendForOf(stmt, target, paths, ctx)
    if (ts.isIterationStatement(stmt, false)) {
      if (!contains(stmt.statement, target)) return ok(paths)
      // Vòng lặp chung: mọi biến bị ghi trong vòng (kể cả đầu vòng) thành KHÔNG BIẾT.
      this.taint(stmt, paths, ctx)
      this.declareUnknown(loopDeclaredNames(stmt), paths)
      return this.descend(stmt.statement, target, paths, ctx)
    }
    if (ts.isSwitchStatement(stmt)) {
      const clause = stmt.caseBlock.clauses.find((c) => contains(c, target))
      if (!clause) return ok(paths)
      this.taint(stmt.caseBlock, paths, ctx)
      return this.runUntil(clause.statements, target, paths, ctx)
    }
    if (ts.isTryStatement(stmt)) {
      if (contains(stmt.tryBlock, target))
        return this.runUntil(stmt.tryBlock.statements, target, paths, ctx)
      this.taint(stmt.tryBlock, paths, ctx)
      const cc = stmt.catchClause
      if (cc && contains(cc, target)) {
        if (cc.variableDeclaration)
          this.declareUnknown(bindingNames(cc.variableDeclaration.name), paths)
        return this.runUntil(cc.block.statements, target, paths, ctx)
      }
      if (cc) this.taint(cc, paths, ctx)
      return stmt.finallyBlock
        ? this.runUntil(stmt.finallyBlock.statements, target, paths, ctx)
        : ok(paths)
    }
    return ok(paths) // câu lệnh đơn (khai báo / biểu thức / return…) chứa chính lời gọi
  }

  /** `for (const x of BANG)` chứa lời gọi: `x` lấy lần lượt từng phần tử (mỗi phần tử một nhánh). */
  private descendForOf(
    stmt: ts.ForOfStatement,
    target: ts.Node,
    paths: Path[],
    ctx: Ctx,
  ): PathResult {
    this.taint(stmt.statement, paths, ctx) // trạng thái ở vòng thứ k không biết
    const init = stmt.initializer
    if (!ts.isVariableDeclarationList(init)) {
      this.taint(init, paths, ctx)
      return this.descend(stmt.statement, target, paths, ctx)
    }
    const decl = init.declarations[0]
    const key = this.key('for:', stmt)
    for (const path of paths) {
      if (!decl) continue
      for (const n of bindingNames(decl.name)) path.env.set(n, UNKNOWN)
      if (!ts.isIdentifier(decl.name)) continue
      const iter = this.evaluate(stmt.expression, new Map(path.env))
      const only = iter?.length === 1 ? iter[0] : undefined
      if (!only || !isArray(only.value) || only.value.some((c) => c === UNKNOWN)) continue
      const alts: Alt[] = []
      only.value.forEach((cell, i) => {
        if (cell !== UNKNOWN) alts.push({ value: cell, choices: new Map([[key, String(i)]]) })
      })
      if (alts.length > 0 && alts.length <= MAX_VARIANTS)
        path.env.set(decl.name.text, toEnvValue(restrict(alts, only.choices)))
    }
    return this.descend(stmt.statement, target, paths, ctx)
  }

  /** Chạy một câu lệnh KHÔNG chứa lời gọi đích. */
  private exec(stmt: ts.Statement, paths: Path[], ctx: Ctx): PathResult {
    if (ts.isVariableStatement(stmt)) return this.execDeclarations(stmt.declarationList, paths, ctx)
    if (ts.isExpressionStatement(stmt)) return this.execExpression(stmt.expression, paths, ctx)
    if (ts.isIfStatement(stmt)) return this.execIf(stmt, paths, ctx)
    if (ts.isBlock(stmt)) return this.execBlock(stmt.statements, paths, ctx)
    if (
      ts.isReturnStatement(stmt) ||
      ts.isThrowStatement(stmt) ||
      ts.isBreakStatement(stmt) ||
      ts.isContinueStatement(stmt)
    ) {
      return ok([]) // đường này kết thúc, không tới được lời gọi đích
    }
    // Vòng lặp, switch, try, khai báo hàm…: không mô phỏng — biến bị ghi trong đó thành KHÔNG BIẾT.
    this.taint(stmt, paths, ctx)
    return ok(paths)
  }

  private execBlock(statements: readonly ts.Statement[], paths: Path[], ctx: Ctx): PathResult {
    const declared = blockDeclaredNames(statements)
    const before = new Set(paths[0]?.env.keys() ?? [])
    let cur = paths
    for (const stmt of statements) {
      const r = this.exec(stmt, cur, ctx)
      if (!r.ok) return r
      cur = r.paths
      if (cur.length === 0) break
    }
    // Ra khỏi khối: tên khai báo trong khối hết hiệu lực (che tên ngoài → ngoài thành không biết).
    for (const p of cur)
      for (const name of declared) {
        if (before.has(name)) p.env.set(name, UNKNOWN)
        else p.env.delete(name)
      }
    return ok(cur)
  }

  private execDeclarations(list: ts.VariableDeclarationList, paths: Path[], ctx: Ctx): PathResult {
    let cur = paths
    for (const decl of list.declarations) {
      const init = decl.initializer
      if (init) this.taint(init, cur, ctx, ts.isIdentifier(decl.name))
      if (!ts.isIdentifier(decl.name) || !init) {
        this.declareUnknown(bindingNames(decl.name), cur)
        continue
      }
      const name = decl.name.text
      const next: Path[] = []
      for (const p of cur) {
        if (ctx.volatile.has(name)) p.env.set(name, UNKNOWN)
        else if (!assign(p, name, this.evaluateEffects(init, p.env))) continue
        next.push(p)
      }
      cur = next
    }
    return ok(cur)
  }

  private execExpression(expression: ts.Expression, paths: Path[], ctx: Ctx): PathResult {
    const expr = skipWrappers(expression)
    // `X.push(a, b)` trên mảng cục bộ đang mô phỏng.
    if (
      ts.isCallExpression(expr) &&
      ts.isPropertyAccessExpression(expr.expression) &&
      expr.expression.name.text === 'push' &&
      ts.isIdentifier(expr.expression.expression) &&
      this.isTrackedArray(expr.expression.expression.text, paths, ctx)
    ) {
      for (const a of expr.arguments) this.taint(a, paths, ctx, true)
      return this.execPush(expr.expression.expression.text, expr.arguments, paths)
    }
    // `X = …` / `X += …` trên biến cục bộ đang mô phỏng.
    if (
      ts.isBinaryExpression(expr) &&
      ts.isIdentifier(expr.left) &&
      (expr.operatorToken.kind === ts.SyntaxKind.EqualsToken ||
        expr.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken) &&
      this.isTracked(expr.left.text, paths, ctx)
    ) {
      this.taint(expr.right, paths, ctx, true)
      const name = expr.left.text
      const isPlus = expr.operatorToken.kind === ts.SyntaxKind.PlusEqualsToken
      const next: Path[] = []
      for (const p of paths) {
        const right = this.evaluateEffects(expr.right, p.env)
        const left = isPlus ? this.evaluateIdentifier(name, p.env, 0) : undefined
        const value = !isPlus ? right : left && right ? product(left, right, plus) : undefined
        if (assign(p, name, value)) next.push(p)
      }
      return ok(next)
    }
    // `i++` đứng riêng.
    if (isUpdateExpression(expr) && ts.isIdentifier(expr.operand)) {
      const name = expr.operand.text
      if (this.isTracked(name, paths, ctx)) {
        for (const p of paths) if (!this.evaluateUnary(expr, p.env)) p.env.set(name, UNKNOWN)
        return ok(paths)
      }
    }
    this.taint(expr, paths, ctx)
    return ok(paths)
  }

  private execPush(name: string, args: ts.NodeArray<ts.Expression>, paths: Path[]): PathResult {
    let cur = paths
    for (const arg of args) {
      const next: Path[] = []
      for (const p of cur) {
        const arr = p.env.get(name)
        if (!isArray(arr) || ts.isSpreadElement(arg)) {
          p.env.set(name, UNKNOWN) // không biết độ dài nữa
          next.push(p)
          continue
        }
        const v = this.evaluateEffects(arg, p.env)
        if (!v || v.some((a) => isArray(a.value))) {
          p.env.set(name, [...arr, UNKNOWN])
          next.push(p)
          continue
        }
        // Đối số nhiều giá trị (hiếm) → tách đường chạy theo từng giá trị.
        for (const alt of v) {
          const forked = v.length === 1 ? p : clonePath(p)
          const choices = mergeChoices(forked.choices, alt.choices)
          if (!choices || isArray(alt.value)) continue
          forked.choices = choices
          forked.env.set(name, [...arr, alt.value])
          next.push(forked)
        }
      }
      if (next.length > MAX_VARIANTS) return { ok: false, reason: `quá ${MAX_VARIANTS} đường chạy` }
      cur = next
    }
    return ok(cur)
  }

  /**
   * `if`: điều kiện tính được → chỉ chạy đúng nhánh. Không tính được: nếu nhánh có GHI biến đang
   * mô phỏng → tách CẢ HAI đường (khoá = vị trí `if`); nếu không → giữ một đường (env không đổi),
   * chỉ bỏ đường khi mọi nhánh đều kết thúc sớm (return/throw).
   */
  private execIf(stmt: ts.IfStatement, paths: Path[], ctx: Ctx): PathResult {
    this.taint(stmt.expression, paths, ctx)
    const tracked = trackedNames(paths)
    const isRef = (n: string): boolean => this.isTrackedArray(n, paths, ctx)
    const writes = [stmt.thenStatement, stmt.elseStatement].flatMap((s) => {
      if (!s) return []
      const w = collectWrites(s, isRef)
      return [...w.direct, ...w.inClosure]
    })
    const relevant = writes.some((n) => tracked.has(n))
    if (relevant) {
      const { t, f } = this.splitOnCondition(stmt, paths)
      const rt = this.execBranch(stmt.thenStatement, t, ctx)
      if (!rt.ok) return rt
      const rf = this.execBranch(stmt.elseStatement, f, ctx)
      if (!rf.ok) return rf
      const all = [...rt.paths, ...rf.paths]
      if (all.length > MAX_VARIANTS && all.length > paths.length)
        return { ok: false, reason: `quá ${MAX_VARIANTS} đường chạy (nhiều \`if\` lồng nhau)` }
      return ok(all)
    }
    const survivors: Path[] = []
    for (const p of paths) {
      const c = this.evaluateCondition(stmt.expression, p.env)
      const viaThen =
        c === false ? ok([]) : this.execBranch(stmt.thenStatement, [clonePath(p)], ctx)
      const viaElse = c === true ? ok([]) : this.execBranch(stmt.elseStatement, [clonePath(p)], ctx)
      if (!viaThen.ok) return viaThen
      if (!viaElse.ok) return viaElse
      if (viaThen.paths.length > 0 || viaElse.paths.length > 0) survivors.push(p)
    }
    return ok(survivors)
  }

  private execBranch(stmt: ts.Statement | undefined, paths: Path[], ctx: Ctx): PathResult {
    if (!stmt || paths.length === 0) return ok(paths)
    return ts.isBlock(stmt)
      ? this.execBlock(stmt.statements, paths, ctx)
      : this.exec(stmt, paths, ctx)
  }

  /** Chia đường chạy theo điều kiện `if`; điều kiện runtime → đường vào cả hai nhánh (gắn khoá). */
  private splitOnCondition(stmt: ts.IfStatement, paths: Path[]): { t: Path[]; f: Path[] } {
    const key = this.key('if:', stmt)
    const t: Path[] = []
    const f: Path[] = []
    for (const p of paths) {
      const c = this.evaluateCondition(stmt.expression, p.env)
      if (c === true) t.push(p)
      else if (c === false) f.push(p)
      else {
        const pt = withChoice(clonePath(p), key, 'T')
        const pf = withChoice(clonePath(p), key, 'F')
        if (pt) t.push(pt)
        if (pf) f.push(pf)
      }
    }
    return { t, f }
  }

  private isTracked(name: string, paths: Path[], ctx: Ctx): boolean {
    return !ctx.volatile.has(name) && paths.some((p) => p.env.has(name))
  }

  private isTrackedArray(name: string, paths: Path[], ctx: Ctx): boolean {
    return (
      this.isTracked(name, paths, ctx) &&
      paths.some((p) => {
        const v = p.env.get(name)
        const isRef = (x: unknown): boolean => isArray(x) || isObjRef(x)
        return isRef(v) || (isLazy(v) && v.alts.some((a) => isRef(a.value)))
      })
    )
  }

  /**
   * Biến đang mô phỏng bị ghi trong `node` (theo cách không mô phỏng được) → KHÔNG BIẾT.
   * `willEvaluate`: `node` sắp được tính bằng `evaluateEffects` (tự áp `i++`).
   */
  private taint(node: ts.Node, paths: Path[], ctx: Ctx, willEvaluate = false): void {
    const tracked = trackedNames(paths)
    if (tracked.size === 0) return
    const { direct, inClosure } = collectWrites(
      node,
      (n) => this.isTrackedArray(n, paths, ctx),
      willEvaluate,
    )
    for (const name of inClosure) if (tracked.has(name)) ctx.volatile.add(name)
    for (const name of [...direct, ...inClosure])
      if (tracked.has(name)) for (const p of paths) p.env.set(name, UNKNOWN)
  }

  /** Tính biểu thức có thể chứa `i++`; tính hỏng giữa chừng → biến bị `++` thành KHÔNG BIẾT. */
  private evaluateEffects(node: ts.Expression, env: Env): Alts {
    const v = this.evaluate(node, env)
    if (!v) for (const name of updatedIdentifiers(node)) if (env.has(name)) env.set(name, UNKNOWN)
    return v
  }

  private declareUnknown(names: readonly string[], paths: Path[]): void {
    for (const p of paths) for (const n of names) p.env.set(n, UNKNOWN)
  }
}
