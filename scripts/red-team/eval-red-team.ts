// scripts/red-team/eval-red-team.ts — Red-team Companion / tự động hoá / ngữ cảnh trên Postgres THẬT.
//
// Đặc tả: docs/specs/2026-10-12-red-team-eval-that.md · luật viết ca: docs/ops/ai-eval-red-team.md §3.
//
// VÌ SAO VIẾT LẠI (changelog 0622): bản cũ cộng thẳng 20/30 ca vào số "đã chặn" mà không chạy, 2 ca
// qua nhờ đọc nhãn của chính fixture, `main().catch(console.error)` nuốt lỗi với mã thoát 0 — chạy
// thật ra 29/30 ❌ mà không ai thấy. Bản này gọi đúng hàm production, chấm bằng kết quả thật.
//
// Chạy:  DATABASE_URL=postgres://postgres@127.0.0.1:5432/dhcb npm run eval:v2:red-team
//        (CSDL đã áp `npm run migrate:pg`; CI chạy trong job `sql-prepare`).
// Mã thoát: 0 = mọi ca chặn được · 1 = có ca lọt/hỏng · 2 = không chạy được (thiếu/sai DATABASE_URL).
import { Pool } from 'pg'
import { isLocalDatabaseUrl, summarize, type RedTeamResult } from '../lib/redTeamScoring'
import { RED_TEAM_CASES } from './redTeamCases'
import { cleanupRedTeamUsers, createContext, describeError } from './redTeamKit'

/** Biến môi trường khoá AI: xoá hết để mọi lượt đi đường TẤT ĐỊNH, không tốn tiền, không gọi mạng. */
const AI_KEY_PATTERN = /^(ANTHROPIC|GROQ|GEMINI|GOOGLE_GENERATIVE|OPENAI)_/

async function main(): Promise<number> {
  const url = process.env.DATABASE_URL
  if (!isLocalDatabaseUrl(url)) {
    console.error(
      '❌ Cần DATABASE_URL trỏ Postgres trên CHÍNH máy này (localhost/127.0.0.1/::1) đã áp migrate:pg.\n' +
        '   Harness gieo người dùng giả — chặn cứng mọi host khác để không bao giờ chạm production.',
    )
    return 2
  }

  const removedKeys = Object.keys(process.env).filter((k) => AI_KEY_PATTERN.test(k))
  for (const k of removedKeys) delete process.env[k]

  const pool = new Pool({ connectionString: url })
  const ctx = createContext(pool)
  const results: RedTeamResult[] = []
  try {
    // Dọn dư thừa của lần chạy trước bị ngắt giữa chừng (chỉ người dùng giả `@red-team.invalid`).
    await cleanupRedTeamUsers(pool)
    for (const c of RED_TEAM_CASES) {
      try {
        const outcome = await c.run(ctx)
        results.push({ id: c.id, family: c.family, title: c.title, ...outcome, crashed: false })
      } catch (err) {
        // Lỗi ở bước GIEO/QUAN SÁT (không phải lỗi phòng thủ mà ca chờ) — ca không đo được ⇒ đỏ.
        results.push({
          id: c.id,
          family: c.family,
          title: c.title,
          blocked: false,
          crashed: true,
          evidence: `CA HỎNG — ${describeError(err instanceof Error ? err : new Error(String(err)))}`,
        })
      }
    }
  } finally {
    await cleanupRedTeamUsers(pool).catch(() => 0)
    await pool.end()
  }

  const summary = summarize(results)
  console.log('\n=== Red-team V2 — Postgres thật, đường từ khoá (không gọi AI) ===')
  if (removedKeys.length) console.log(`(đã gỡ ${removedKeys.length} biến khoá AI khỏi môi trường)`)
  for (const r of results) {
    const mark = r.crashed ? '💥' : r.blocked ? '✅' : '❌'
    console.log(`${mark} ${r.id.padEnd(9)} ${r.title}\n            ${r.evidence}`)
  }
  for (const family of ['PI', 'TA', 'SL'] as const) {
    const f = summary.byFamily[family]
    console.log(`${family}: ${f.blocked}/${f.total} chặn được`)
  }
  console.log(
    summary.exitCode === 0
      ? `✅ ${summary.blocked}/${summary.total} ca chặn được`
      : `❌ ${summary.failed.length}/${summary.total} ca LỌT hoặc HỎNG: ${summary.failed.map((r) => r.id).join(', ')}`,
  )
  return summary.exitCode
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error('❌ Harness red-team hỏng:', err)
    process.exit(1)
  },
)
