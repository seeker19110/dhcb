// scripts/check-sql-prepare.ts — Cổng "SQL trên CSDL thật": PREPARE mọi câu SQL TĨNH trong mã
// server trên một Postgres đã áp postgres/schema.sql + toàn bộ postgres/migrations/.
//
// VÌ SAO CẦN: unit test giả lập `pg`, nên câu SQL sai tên cột/bảng hay lệch kiểu (`uuid <> text`)
// vẫn xanh hết — lỗi chỉ lộ ra ở production, thường còn bị một `catch` nuốt im lặng. Changelog
// 0523 làm tay đúng cách này và bắt 9 câu sai mà toàn bộ unit test không thấy. Chủ dự án duyệt
// đưa thành cổng CI ngày 2026-10-08 (job `sql-prepare` trong .github/workflows/ci.yml).
//
// CÁCH LÀM:
//   1. Trích câu SQL bằng AST từ mọi lời gọi `.query(` trong apps/server/src + packages (bỏ test,
//      dist) — xem scripts/lib/sqlExtract.ts. Câu dựng động không suy ra được thì BỎ QUA + đếm.
//   2. Mỗi câu: `BEGIN; PREPARE dhcb_chk_N AS <sql>; DEALLOCATE; ROLLBACK`. PREPARE chỉ phân
//      tích + lập kế hoạch, KHÔNG chạy câu lệnh → không đổi dữ liệu; ROLLBACK cho chắc.
//   3. Câu lỗi mà không nằm trong scripts/sql-prepare-allowlist.json → in file:dòng + thông điệp
//      Postgres, thoát mã 1.
//
// LƯU Ý "could not determine data type of parameter $N": KHÔNG bỏ qua lỗi này. Đã đo thật
// (2026-10-08, Postgres 16): `pg` gửi tham số không kèm kiểu nên server suy kiểu y hệt PREPARE —
// câu `select $1 is null` lỗi giống nhau ở cả hai đường. Đây là lỗi runtime thật.
//
// Chạy: DATABASE_URL=postgres://... npm run check:sql   (CSDL phải đã `npm run migrate:pg`)

import * as dotenv from 'dotenv'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'
import { findAllowlistEntry, parseAllowlist, type AllowlistEntry } from './lib/sqlAllowlist.js'
import {
  extractSqlFromSource,
  leadingKeyword,
  normalizeSql,
  PREPARABLE_KEYWORDS,
  TRANSACTION_KEYWORDS,
  type ExtractedSql,
  type SkippedSql,
} from './lib/sqlExtract.js'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
dotenv.config({ path: join(ROOT, '.env'), quiet: true })

const SCAN_ROOTS = ['apps/server/src', 'packages']
const SKIP_DIRS: ReadonlySet<string> = new Set(['node_modules', 'dist', '__tests__', '__mocks__'])
const ALLOWLIST_FILE = join(ROOT, 'scripts', 'sql-prepare-allowlist.json')
const MIGRATIONS_DIR = join(ROOT, 'postgres', 'migrations')
// Tự bảo vệ khỏi "xanh rỗng": lúc thêm cổng (2026-10-08) trích được ~500 câu. Nếu một ngày số
// câu tụt dưới sàn này, gần như chắc chắn bộ trích hỏng (đổi cấu trúc thư mục, đổi tên hàm gọi
// CSDL…) chứ không phải mã server đột nhiên hết SQL — báo đỏ để người sửa nhìn lại.
const MIN_EXPECTED_QUERIES = 300
// Cắt câu SQL khi in báo lỗi — đủ để nhận ra câu, không làm ngập log CI.
const SQL_PREVIEW_CHARS = 220

function isSourceFile(name: string): boolean {
  return /\.tsx?$/.test(name) && !/\.(test|spec)\.tsx?$/.test(name) && !name.endsWith('.d.ts')
}

function listSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) listSourceFiles(full, out)
    } else if (isSourceFile(entry.name)) {
      out.push(full)
    }
  }
  return out
}

interface Failure {
  query: ExtractedSql
  message: string
}

function location(q: ExtractedSql): string {
  return `${q.file}:${q.line}${q.variant ? ` (biến thể ${q.variant})` : ''}`
}

function preview(sql: string): string {
  const flat = normalizeSql(sql)
  return flat.length > SQL_PREVIEW_CHARS ? `${flat.slice(0, SQL_PREVIEW_CHARS)}…` : flat
}

/** PREPARE một câu trong transaction rollback. Trả thông điệp lỗi, hoặc `null` nếu hợp lệ. */
async function prepareOnce(client: Client, sql: string, n: number): Promise<string | null> {
  const name = `dhcb_chk_${n}`
  await client.query('begin')
  try {
    await client.query(`prepare ${name} as ${sql}`)
    await client.query(`deallocate ${name}`)
    return null
  } catch (err) {
    return err instanceof Error ? err.message : String(err)
  } finally {
    await client.query('rollback')
  }
}

/** CSDL phải đã áp ĐỦ migration — kiểm trên schema thiếu thì mọi kết quả đều vô nghĩa. */
async function assertMigrated(client: Client): Promise<void> {
  const expected = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).length
  const { rows: tracked } = await client.query<{ ok: boolean }>(
    "select to_regclass('public._schema_migrations') is not null as ok",
  )
  if (!tracked[0]?.ok) {
    throw new Error(
      'CSDL chưa áp migration nào — chạy `npm run migrate:pg` với cùng DATABASE_URL trước.',
    )
  }
  const { rows } = await client.query<{ n: string }>(
    "select count(*)::text as n from public._schema_migrations where filename like '%.sql'",
  )
  const applied = Number(rows[0]?.n ?? 0)
  if (applied !== expected) {
    throw new Error(
      `CSDL mới áp ${applied}/${expected} migration — chạy \`npm run migrate:pg\` với cùng DATABASE_URL trước.`,
    )
  }
}

async function main(): Promise<number> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('[check:sql] Thiếu DATABASE_URL — trỏ tới Postgres đã chạy `npm run migrate:pg`.')
    return 1
  }

  // 1. Trích câu SQL.
  const queries: ExtractedSql[] = []
  const skipped: SkippedSql[] = []
  let fileCount = 0
  for (const scanRoot of SCAN_ROOTS) {
    for (const full of listSourceFiles(join(ROOT, scanRoot))) {
      fileCount++
      const rel = relative(ROOT, full).split(sep).join('/')
      const res = extractSqlFromSource(rel, readFileSync(full, 'utf8'))
      queries.push(...res.queries)
      skipped.push(...res.skipped)
    }
  }

  const allowlist: AllowlistEntry[] = existsSync(ALLOWLIST_FILE)
    ? parseAllowlist(JSON.parse(readFileSync(ALLOWLIST_FILE, 'utf8')) as unknown)
    : []

  // 2. PREPARE từng câu.
  const client = new Client({ connectionString })
  await client.connect()
  const failures: Failure[] = []
  const allowed: { failure: Failure; entry: AllowlistEntry }[] = []
  const usedEntries = new Set<AllowlistEntry>()
  let prepared = 0
  let transactionControl = 0
  try {
    await assertMigrated(client)
    for (const q of queries) {
      const kw = leadingKeyword(q.sql)
      let message: string | null
      if (TRANSACTION_KEYWORDS.has(kw)) {
        transactionControl++
        continue
      } else if (PREPARABLE_KEYWORDS.has(kw)) {
        prepared++
        message = await prepareOnce(client, q.sql, prepared)
      } else {
        // DDL/SET/LOCK… không PREPARE được — phải được khai tường minh trong allowlist.
        message = `lệnh "${kw || '?'}" không PREPARE được (chỉ SELECT/INSERT/UPDATE/DELETE/MERGE/VALUES/WITH) — thêm vào allowlist kèm lý do nếu cố ý`
      }
      if (message === null) continue
      const failure: Failure = { query: q, message }
      const entry = findAllowlistEntry(allowlist, q.file, q.sql)
      if (entry) {
        usedEntries.add(entry)
        allowed.push({ failure, entry })
      } else {
        failures.push(failure)
      }
    }
  } finally {
    await client.end()
  }

  // 3. Báo cáo.
  console.log(`[check:sql] Quét ${fileCount} file nguồn trong ${SCAN_ROOTS.join(' + ')}.`)
  console.log(
    `[check:sql] Trích ${queries.length} câu SQL tĩnh · PREPARE ${prepared} · điều khiển transaction (bỏ qua) ${transactionControl} · bỏ qua (động) ${skipped.length}.`,
  )
  if (skipped.length > 0) {
    console.log('[check:sql] Câu dựng động, không suy ra được SQL tĩnh (không kiểm):')
    for (const s of skipped) console.log(`  - ${s.file}:${s.line} — ${s.reason}`)
  }
  if (allowed.length > 0) {
    console.log(`[check:sql] ${allowed.length} câu lỗi ĐƯỢC MIỄN theo allowlist:`)
    for (const { failure, entry } of allowed) {
      console.log(
        `  - ${location(failure.query)} — ${failure.message}\n      lý do miễn: ${entry.reason}`,
      )
    }
  }
  for (const entry of allowlist) {
    if (!usedEntries.has(entry)) {
      console.log(
        `::warning::[check:sql] Mục allowlist không còn khớp câu lỗi nào — gỡ khỏi scripts/sql-prepare-allowlist.json: ${entry.file} « ${entry.sqlIncludes} »`,
      )
    }
  }

  if (queries.length < MIN_EXPECTED_QUERIES) {
    console.error(
      `::error::[check:sql] Chỉ trích được ${queries.length} câu (< sàn ${MIN_EXPECTED_QUERIES}) — bộ trích có thể đã hỏng, xem scripts/lib/sqlExtract.ts.`,
    )
    return 1
  }
  if (failures.length > 0) {
    console.error(`[check:sql] ❌ ${failures.length} câu SQL KHÔNG hợp lệ trên schema hiện tại:`)
    for (const f of failures) {
      console.error(`::error file=${f.query.file},line=${f.query.line}::${f.message}`)
      console.error(`  ${location(f.query)}\n    ${f.message}\n    SQL: ${preview(f.query.sql)}`)
    }
    return 1
  }
  console.log(
    `[check:sql] ✅ Không có câu SQL lỗi ngoài allowlist (PREPARE ${prepared} câu, ${allowed.length} câu lỗi được miễn).`,
  )
  return 0
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error('[check:sql] Lỗi không mong đợi:', err instanceof Error ? err.message : err)
    process.exit(1)
  },
)
