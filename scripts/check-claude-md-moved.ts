// scripts/check-claude-md-moved.ts — chạy khi RÚT GỌN CLAUDE.md: chứng minh không mất chữ nào.
//
// Dùng: npm run check:claude-md -- <git-ref của CLAUDE.md trước khi rút gọn>   (vd origin/main)
// Mọi dòng của CLAUDE.md cũ phải còn nguyên văn ở CLAUDE.md mới HOẶC ở docs/claude-md-chi-tiet.md.
// Thoát 1 và in từng dòng bị mất nếu có. Không phải cổng CI (ref so sánh đổi theo từng lần rút
// gọn) — cổng CI lâu dài là scripts/claude-md-split.test.ts.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { FILE_CHI_TIET, dongBiMat } from './lib/claudeMdSplit.js'

const ref = process.argv[2]
if (!ref) {
  console.error('Dùng: npm run check:claude-md -- <git-ref của CLAUDE.md trước khi rút gọn>')
  process.exit(2)
}

const cu = execFileSync('git', ['show', `${ref}:CLAUDE.md`], { encoding: 'utf8' })
const moi = readFileSync('CLAUDE.md', 'utf8')
const chiTiet = readFileSync(FILE_CHI_TIET, 'utf8')
const mat = dongBiMat(cu, moi, chiTiet)

console.log(`CLAUDE.md: ${cu.length} → ${moi.length} ký tự (${FILE_CHI_TIET}: ${chiTiet.length}).`)
if (mat.length > 0) {
  console.error(`✖ ${mat.length} dòng của CLAUDE.md ở ${ref} không còn ở đâu cả:`)
  for (const dong of mat) console.error(`  - ${dong.slice(0, 160)}`)
  process.exit(1)
}
console.log(`✔ Mọi dòng của CLAUDE.md ở ${ref} còn nguyên văn ở CLAUDE.md hoặc ${FILE_CHI_TIET}.`)
