// scripts/eval-v2-permissions.ts — Eval Personal Policy (thẩm quyền) trên Postgres THẬT.
//
// Ca: scripts/eval-v2-permissions-cases.ts (lý do bỏ bộ fixture JSON + `pg` giả: xem đầu file đó).
// Chạy:  DATABASE_URL=postgres://postgres@127.0.0.1:5432/dhcb npm run eval:v2:permissions
//        (CSDL đã áp `npm run migrate:pg`; CI chạy trong job `sql-prepare`).
// Mã thoát: 0 = mọi ca đạt · 1 = có ca trượt/hỏng (hoặc không có ca nào) · 2 = DATABASE_URL không
// phải máy cục bộ.
import { Pool } from 'pg'
import { isLocalDatabaseUrl } from './lib/redTeamScoring'
import { cleanupRedTeamUsers, createContext, describeError } from './red-team/redTeamKit'
import { PERMISSION_CASES } from './eval-v2-permissions-cases'

async function main(): Promise<number> {
  const url = process.env.DATABASE_URL
  if (!isLocalDatabaseUrl(url)) {
    console.error(
      '❌ Cần DATABASE_URL trỏ Postgres trên CHÍNH máy này (localhost/127.0.0.1/::1) đã áp migrate:pg.\n' +
        '   Eval gieo người dùng giả — chặn cứng mọi host khác để không bao giờ chạm production.',
    )
    return 2
  }

  const pool = new Pool({ connectionString: url })
  const ctx = createContext(pool)
  const failed: string[] = []
  try {
    await cleanupRedTeamUsers(pool)
    for (const c of PERMISSION_CASES) {
      let mark: string
      let evidence: string
      try {
        const out = await c.run(ctx)
        mark = out.pass ? '✅' : '❌'
        evidence = out.evidence
      } catch (err) {
        // Lỗi ngoài dự kiến ở bước gieo/quan sát — ca không đo được ⇒ tính trượt.
        mark = '💥'
        evidence = `CA HỎNG — ${describeError(err instanceof Error ? err : new Error(String(err)))}`
      }
      if (mark !== '✅') failed.push(c.id)
      console.log(`${mark} ${c.id.padEnd(30)} ${c.title}\n   ${evidence}`)
    }
  } finally {
    await cleanupRedTeamUsers(pool).catch(() => 0)
    await pool.end()
  }

  const total = PERMISSION_CASES.length
  console.log(`\n=== Eval Permissions V2 — Postgres thật ===`)
  if (total > 0 && failed.length === 0) {
    console.log(`✅ ${total}/${total} ca đạt`)
    return 0
  }
  console.log(
    `❌ ${failed.length}/${total} ca trượt hoặc hỏng: ${failed.join(', ') || '(không có ca)'}`,
  )
  return 1
}

main().then(
  (code) => process.exit(code),
  (err: unknown) => {
    console.error('❌ Eval permissions hỏng:', err)
    process.exit(1)
  },
)
