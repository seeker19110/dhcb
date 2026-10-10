// Phân tích và so khớp BIỂU THỨC đại số.
// Đặc tả §6: docs/research/dac-ta-engine-cham-dung-chung.md
//
// Vấn đề: `2(x+1)`, `2x+2`, `2·x+2` là CÙNG một biểu thức nhưng khác nhau về chuỗi.
// Cách giải: THĂM DÒ SỐ NGẪU NHIÊN thay vì rút gọn ký hiệu bằng CAS.
//   - Gán ngẫu nhiên nhiều bộ giá trị cho các biến, tính cả hai vế, khớp hết thì coi là bằng nhau.
//   - Xác suất hai biểu thức KHÁC nhau trùng khớp tại 20 điểm ngẫu nhiên là gần như bằng 0.
//   - Nhẹ hơn CAS rất nhiều (không kéo thêm thư viện vài trăm kB, không đụng ngân sách bundle),
//     dễ test hơn, và đủ tin cậy cho phạm vi toán phổ thông.
// Bộ sinh số ngẫu nhiên dùng SEED CỐ ĐỊNH nên hàm vẫn TẤT ĐỊNH (yêu cầu ở đặc tả §9).

import { normalizeAnswerText } from './number.js'
import { mulberry32 } from './mulberry32.js'

type Node =
  | { type: 'num'; value: number }
  | { type: 'var'; name: string }
  | { type: 'unary'; op: '+' | '-'; arg: Node }
  | { type: 'binary'; op: '+' | '-' | '*' | '/' | '^'; left: Node; right: Node }
  | { type: 'call'; name: string; arg: Node }

/** Cây biểu thức đã phân tích — xuất ra cho bộ kiểm bước giải (stepCheckMath.ts) duyệt lại. */
export type ExprNode = Node

const FUNCTIONS: Record<string, (x: number) => number> = {
  sqrt: Math.sqrt,
  abs: Math.abs,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
}

const CONSTANTS: Record<string, number> = {
  pi: Math.PI,
}

// ── Tách token ──────────────────────────────────────────────────────────────

type Token =
  { kind: 'num'; value: number } | { kind: 'ident'; name: string } | { kind: 'op'; op: string }

function tokenize(input: string): Token[] | null {
  const tokens: Token[] = []
  let i = 0
  while (i < input.length) {
    const ch = input.charAt(i)
    if (ch === ' ' || ch === '\t') {
      i++
      continue
    }
    if (/[0-9.]/.test(ch)) {
      let j = i
      while (j < input.length && /[0-9.]/.test(input.charAt(j))) j++
      // Ký hiệu khoa học `1.5e3`, `2e-4`. Chỉ nuốt `e` khi phía sau thật sự là số mũ,
      // nếu không `2e` sẽ bị hiểu nhầm thay vì là `2 * e` (tên biến).
      if (j < input.length && (input.charAt(j) === 'e' || input.charAt(j) === 'E')) {
        let k = j + 1
        if (k < input.length && (input.charAt(k) === '+' || input.charAt(k) === '-')) k++
        if (k < input.length && /[0-9]/.test(input.charAt(k))) {
          while (k < input.length && /[0-9]/.test(input.charAt(k))) k++
          j = k
        }
      }
      const value = Number(input.slice(i, j))
      if (!Number.isFinite(value)) return null
      tokens.push({ kind: 'num', value })
      i = j
      continue
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i
      while (j < input.length && /[a-zA-Z_0-9]/.test(input.charAt(j))) j++
      tokens.push({ kind: 'ident', name: input.slice(i, j) })
      i = j
      continue
    }
    if ('+-*/^()'.includes(ch)) {
      tokens.push({ kind: 'op', op: ch })
      i++
      continue
    }
    return null // ký tự lạ → coi như không đọc được, thà báo PARSE_ERROR còn hơn chấm bừa
  }
  return tokens
}

// ── Phân tích cú pháp (đệ quy xuống) ────────────────────────────────────────

class Parser {
  private pos = 0

  constructor(private readonly tokens: Token[]) {}

  parse(): Node | null {
    const node = this.parseAdditive()
    if (node === null || this.pos !== this.tokens.length) return null
    return node
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos]
  }

  private isOp(op: string): boolean {
    const t = this.peek()
    return t !== undefined && t.kind === 'op' && t.op === op
  }

  /** Token này có thể MỞ ĐẦU một biểu thức con không — dùng để nhận phép nhân ngầm (`2x`). */
  private canStartPrimary(): boolean {
    const t = this.peek()
    if (t === undefined) return false
    return t.kind === 'num' || t.kind === 'ident' || (t.kind === 'op' && t.op === '(')
  }

  private parseAdditive(): Node | null {
    let left = this.parseMultiplicative()
    if (left === null) return null
    for (;;) {
      const op = this.isOp('+') ? '+' : this.isOp('-') ? '-' : null
      if (op === null) return left
      this.pos++
      const right = this.parseMultiplicative()
      if (right === null) return null
      left = { type: 'binary', op, left, right }
    }
  }

  private parseMultiplicative(): Node | null {
    let left = this.parseUnary()
    if (left === null) return null
    for (;;) {
      if (this.isOp('*') || this.isOp('/')) {
        const op = this.isOp('*') ? '*' : '/'
        this.pos++
        const right = this.parseUnary()
        if (right === null) return null
        left = { type: 'binary', op, left, right }
        continue
      }
      // Phép nhân ngầm: `2x`, `2(x+1)`, `(x+1)(x-1)`.
      if (this.canStartPrimary()) {
        const right = this.parseUnary()
        if (right === null) return null
        left = { type: 'binary', op: '*', left, right }
        continue
      }
      return left
    }
  }

  private parseUnary(): Node | null {
    if (this.isOp('-') || this.isOp('+')) {
      const op = this.isOp('-') ? '-' : '+'
      this.pos++
      const arg = this.parseUnary()
      if (arg === null) return null
      return { type: 'unary', op, arg }
    }
    return this.parsePower()
  }

  private parsePower(): Node | null {
    const base = this.parsePrimary()
    if (base === null) return null
    if (!this.isOp('^')) return base
    this.pos++
    const exponent = this.parseUnary() // kết hợp phải: 2^3^2 = 2^(3^2)
    if (exponent === null) return null
    return { type: 'binary', op: '^', left: base, right: exponent }
  }

  private parsePrimary(): Node | null {
    const t = this.peek()
    if (t === undefined) return null

    if (t.kind === 'num') {
      this.pos++
      return { type: 'num', value: t.value }
    }

    if (t.kind === 'op' && t.op === '(') {
      this.pos++
      const inner = this.parseAdditive()
      if (inner === null || !this.isOp(')')) return null
      this.pos++
      return inner
    }

    if (t.kind === 'ident') {
      this.pos++
      const name = t.name
      if (name in FUNCTIONS) {
        // Cho phép gọi hàm KHÔNG ngoặc (`sqrt 2` = `sqrt(2)`) — đúng thói quen viết tay `√2`.
        const arg = this.parsePrimary()
        if (arg === null) return null
        return { type: 'call', name, arg }
      }
      const constant = CONSTANTS[name]
      if (constant !== undefined) return { type: 'num', value: constant }
      return { type: 'var', name }
    }

    return null
  }
}

/** Phân tích biểu thức từ chuỗi học sinh nhập. Trả null nếu không đọc được. */
export function parseExpression(raw: string): Node | null {
  const tokens = tokenize(normalizeAnswerText(raw))
  if (tokens === null || tokens.length === 0) return null
  return new Parser(tokens).parse()
}

// ── Tính giá trị ────────────────────────────────────────────────────────────

function evaluateNode(node: Node, vars: Record<string, number>): number {
  switch (node.type) {
    case 'num':
      return node.value
    case 'var':
      return vars[node.name] ?? NaN
    case 'unary':
      return node.op === '-' ? -evaluateNode(node.arg, vars) : evaluateNode(node.arg, vars)
    case 'call': {
      const fn = FUNCTIONS[node.name]
      return fn === undefined ? NaN : fn(evaluateNode(node.arg, vars))
    }
    case 'binary': {
      const a = evaluateNode(node.left, vars)
      const b = evaluateNode(node.right, vars)
      switch (node.op) {
        case '+':
          return a + b
        case '-':
          return a - b
        case '*':
          return a * b
        case '/':
          return b === 0 ? NaN : a / b
        case '^':
          return Math.pow(a, b)
      }
    }
  }
}

/** Tập biến xuất hiện trong biểu thức (hằng số như `pi` đã bị thay bằng số, không tính). */
function collectVars(node: Node, out: Set<string> = new Set()): Set<string> {
  switch (node.type) {
    case 'var':
      out.add(node.name)
      break
    case 'unary':
    case 'call':
      collectVars(node.arg, out)
      break
    case 'binary':
      collectVars(node.left, out)
      collectVars(node.right, out)
      break
    case 'num':
      break
  }
  return out
}

/**
 * Tính giá trị SỐ của một câu trả lời (không được còn biến tự do).
 * Dùng cho đáp án dạng số: hiểu được cả `1/2`, `2^3`, `sqrt 2`, `0,5`.
 */
export function evaluateNumeric(raw: string): number | null {
  const node = parseExpression(raw)
  if (node === null) return null
  if (collectVars(node).size > 0) return null
  const value = evaluateNode(node, {})
  return Number.isFinite(value) ? value : null
}

// ── So khớp bằng thăm dò số ─────────────────────────────────────────────────

const PROBE_SEED = 0x5eed1234
const PROBE_COUNT = 20
const MAX_ATTEMPTS = 200
const PROBE_EPSILON = 1e-9

/** Lấy một giá trị thăm dò, tránh 0 và ±1 vì nhiều biểu thức SAI vẫn trùng nhau tại các điểm đó. */
function probeValue(rng: () => number): number {
  const v = rng() * 8 - 4 // khoảng [-4, 4]
  if (Math.abs(v) < 0.25 || Math.abs(Math.abs(v) - 1) < 0.05) return probeValue(rng)
  return v
}

/**
 * Hai biểu thức có tương đương nhau không.
 * `2(x+1)` = `2x+2` = `2*x + 2` → true · `x+1` vs `x-1` → false.
 */
export function expressionsEqual(a: string, b: string): boolean {
  const nodeA = parseExpression(a)
  const nodeB = parseExpression(b)
  if (nodeA === null || nodeB === null) return false

  const varsA = collectVars(nodeA)
  const varsB = collectVars(nodeB)
  if (varsA.size !== varsB.size) return false
  for (const name of varsA) if (!varsB.has(name)) return false

  // Không có biến → so thẳng giá trị.
  if (varsA.size === 0) {
    const x = evaluateNode(nodeA, {})
    const y = evaluateNode(nodeB, {})
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false
    return Math.abs(x - y) <= PROBE_EPSILON * Math.max(1, Math.abs(x), Math.abs(y))
  }

  const names = [...varsA]
  // mulberry32 với SEED CỐ ĐỊNH để hàm chấm luôn tất định.
  const rng = mulberry32(PROBE_SEED)
  let matched = 0

  for (let attempt = 0; attempt < MAX_ATTEMPTS && matched < PROBE_COUNT; attempt++) {
    const vars: Record<string, number> = {}
    for (const name of names) vars[name] = probeValue(rng)

    const x = evaluateNode(nodeA, vars)
    const y = evaluateNode(nodeB, vars)

    // Mẫu rơi vào chỗ không xác định (chia 0, căn số âm) ở MỘT trong hai vế → bỏ mẫu, lấy mẫu
    // khác. KHÔNG kết luận sai — nếu không sẽ chấm oan các biểu thức có mẫu số triệt tiêu.
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue

    if (Math.abs(x - y) > PROBE_EPSILON * Math.max(1, Math.abs(x), Math.abs(y))) return false
    matched++
  }

  // Không lấy đủ mẫu hợp lệ → không đủ căn cứ khẳng định bằng nhau.
  return matched === PROBE_COUNT
}
