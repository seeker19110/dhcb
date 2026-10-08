// scripts/lib/sqlExtract.ts — Trích câu SQL TĨNH từ mã nguồn TypeScript bằng AST (không regex).
//
// Dùng bởi scripts/check-sql-prepare.ts (cổng CI `sql-prepare`): mỗi câu trích được sẽ đem
// `PREPARE` trên Postgres thật đã áp schema + migration để bắt câu SQL sai cột/bảng/kiểu — loại
// lỗi mà unit test (giả lập `pg`) KHÔNG BAO GIỜ thấy (changelog 0523 bắt 9 câu như vậy bằng tay).
//
// Phạm vi trích: mọi lời gọi `<x>.query(...)` / `<x>.query<T>(...)` có đối số đầu là chuỗi SQL.
//
// "Tính hằng" được (changelog 0529): literal chuỗi/số, template mà MỌI phần nội suy suy ra được,
// phép `+`, hằng `const` cùng file (không bị sửa tại chỗ, không trùng tên với binding khác),
// `[...].join(sep)` trên mảng hằng, tra object literal hằng (`BANG.khoa` / `BANG[khoa]`).
//
// Mở rộng ở changelog 0536 — để số câu "bỏ qua (động)" về mức tối thiểu kiểm TRUNG THỰC được:
//   - Hằng IMPORT từ file khác (qua `ExtractOptions.loadModule`, giữ phần trích thuần).
//   - `Object.values(OBJ)` (object literal hằng, khoá không phải số), `ARR.map(x => …)`.
//   - Hàm "trả lại đối số" cùng file (vd `assertIdent(v, re)`: chỉ ném lỗi hoặc `return v`).
//   - MÔ PHỎNG ĐƯỜNG CHẠY trong thân hàm chứa lời gọi: `let sql = …; if (c) sql += …`,
//     `const where = ['a = $1']; if (c) { params.push(x); where.push(\`b = $${params.length}\`) }`,
//     `$${i++}` — mỗi `if` có điều kiện runtime mà nhánh của nó ghi biến đang theo dõi thì sinh
//     CẢ HAI đường, nên mọi tổ hợp bộ lọc đều được trích (số `$n` đúng theo từng tổ hợp).
//   - `for (const spec of BANG_HANG)` → biến lặp lấy lần lượt từng phần tử.
//   - Tham số của hàm KHÔNG export mà mọi lần nhắc tới nó trong file đều là lời gọi trực tiếp →
//     tham số lấy giá trị từ đối số ở MỌI nơi gọi (vd `auditOne(pool, 'select …')`).
//
// Một biểu thức có thể có NHIỀU giá trị khả dĩ — trích MỌI biến thể (tối đa MAX_VARIANTS), vì
// nhánh ít chạy chính là chỗ tên cột sai nằm im lâu nhất. Mỗi "điểm rẽ" (ternary, if, vòng lặp,
// nơi gọi hàm, khoá tra bảng runtime) gắn một khoá; cùng một điểm rẽ luôn lấy CÙNG một nhánh
// trong một câu — không sinh tổ hợp chéo vô nghĩa kiểu "insert into A … on conflict … B".
//
// NGUYÊN TẮC AN TOÀN (thà bỏ qua còn hơn suy sai): biến bị ghi ở chỗ không mô phỏng được (vòng
// lặp, closure, truyền mảng/object sang hàm khác, gán thuộc tính…) thành KHÔNG BIẾT; biến bị ghi
// trong closure thì không biết VĨNH VIỄN trong lần mô phỏng đó. Không tính được → KHÔNG đoán, ghi
// vào `skipped` kèm lý do để thống kê "bỏ qua (động)".
//
// Thuần (không I/O, không DB) để unit test được — xem sqlExtract.test.ts. Chia file: miền giá trị
// `sqlValues.ts`, tiện ích AST `sqlAst.ts`, tính giá trị + mô phỏng đường chạy `sqlAnalyzer.ts`.

import ts from 'typescript'
import { Project, type ModuleLoader } from './sqlAnalyzer.js'

export type { LoadedModule, ModuleLoader } from './sqlAnalyzer.js'
export { MAX_VARIANTS } from './sqlValues.js'

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

export interface ExtractOptions {
  /** Không truyền → hằng import từ file khác luôn coi là động. */
  loadModule?: ModuleLoader
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

export function extractSqlFromSource(
  file: string,
  text: string,
  options: ExtractOptions = {},
): ExtractResult {
  const mod = new Project(options.loadModule).analyzer(file, text)
  const source = mod.source
  const queries: ExtractedSql[] = []
  const skipped: SkippedSql[] = []

  const visit = (node: ts.Node): void => {
    if (isQueryCall(node)) {
      const arg = node.arguments[0]
      if (arg) {
        // Dòng của CHÍNH chuỗi SQL (không phải dòng `.query<…>(`) — trỏ thẳng chỗ cần sửa.
        const line = source.getLineAndCharacterOfPosition(arg.getStart(source)).line + 1
        const res = mod.sqlOf(node, arg)
        if ('sqls' in res) {
          res.sqls.forEach((sql, i) =>
            queries.push(
              res.sqls.length > 1 ? { file, line, sql, variant: i + 1 } : { file, line, sql },
            ),
          )
        } else {
          skipped.push({ file, line, reason: res.reason })
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return { queries, skipped }
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
