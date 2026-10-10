// scripts/check-startup-coverage.ts — Mọi file JS tải NGAY khi mở trang (entry + modulepreload
// trong `dist/index.html`) phải được mục "Initial JS" của `.size-limit.json` đếm. Thiếu → thoát
// mã 1 và in đúng file thiếu. Lý do: xem đầu `scripts/lib/startupCoverage.ts`.
//
// Dùng: chạy sau `npm run build`, nối vào `npm run size` (CI job `build`).
import { readFileSync } from 'node:fs'
import { startupScripts, uncoveredStartupFiles } from './lib/startupCoverage'

interface SizeLimitEntry {
  name: string
  path: string | string[]
}

const entries = JSON.parse(readFileSync('.size-limit.json', 'utf8')) as SizeLimitEntry[]
const initialJs = entries.find((e) => e.name.startsWith('Initial JS'))
if (!initialJs) {
  console.error('❌ .size-limit.json không còn mục "Initial JS…" — phép kiểm phủ không biết đo gì.')
  process.exit(1)
}
const globs = Array.isArray(initialJs.path) ? initialJs.path : [initialJs.path]

let html: string
try {
  html = readFileSync('dist/index.html', 'utf8')
} catch {
  console.error('❌ Chưa có dist/index.html — chạy `npm run build` trước.')
  process.exit(1)
}

const files = startupScripts(html).map((f) => `dist/${f}`)
const missing = uncoveredStartupFiles(files, globs)
if (missing.length > 0) {
  console.error(
    `❌ ${missing.length} file JS tải ngay lúc khởi động KHÔNG được "${initialJs.name}" đếm:\n` +
      missing.map((f) => `   - ${f}`).join('\n') +
      '\n   → thêm glob tương ứng vào .size-limit.json (giữ nguyên trần), hoặc đưa module đó ra' +
      ' khỏi đường khởi động.',
  )
  process.exit(1)
}
console.log(`✅ ${files.length} file JS khởi động đều được "${initialJs.name}" đếm.`)
