// Offline, không .env/key/provider. Tham số duy nhất tùy chọn là đường dẫn bộ cassette.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runCompanionReplay } from './lib/companionReplayEval'

async function main() {
  if (process.argv.length > 3) throw new Error('Chỉ nhận một đường dẫn cassette tùy chọn')
  const file =
    process.argv[2] ?? resolve(import.meta.dirname, 'eval-companion-replay-fixtures.json')
  const raw: unknown = JSON.parse(readFileSync(file, 'utf8'))
  const summary = await runCompanionReplay(raw)
  for (const r of summary.results) {
    console.log(
      `${r.passed ? 'PASS' : 'FAIL'} ${r.id}${r.passed ? '' : `: ${r.violations.join(',')}`}`,
    )
  }
  console.log(
    `Replay provider tổng hợp: ${summary.passed}/${summary.total}; không phải eval model thật`,
  )
  process.exitCode = summary.exitCode
}

main().catch(() => {
  console.error('FAIL: cassette hoặc runner không hợp lệ')
  process.exitCode = 1
})
