// scripts/tailwind-sources.test.ts — Canh NGUỒN class Tailwind của app `apps/dhcb` (changelog 0606).
//
// VÌ SAO CẦN: `apps/dhcb/src/index.css` dùng `@import 'tailwindcss' source(none)` để tắt tự quét
// class trên cả repo (Vite chạy từ gốc repo nên Tailwind quét luôn docs/, scripts/, dữ liệu bài
// học… và sinh ~170 rule rác vào CSS chặn hiển thị của mọi trang). Cái giá: class CHỈ được sinh
// từ các đường dẫn trong `content` của `apps/dhcb/tailwind.config.js` (src của app + core-ui).
// Một gói khác bắt đầu dùng `className` thì class của nó LẶNG LẼ không được sinh — giao diện mất
// kiểu mà không cổng nào đỏ. Test này bắt đúng chỗ đó.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const read = (p: string) => readFileSync(join(ROOT, p), 'utf-8')

/** Mọi file .ts/.tsx (trừ test) dưới `dir`, đường dẫn tương đối so với gốc repo. */
function listSources(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...listSources(full))
    else if (
      /\.tsx?$/.test(entry) &&
      !/\.(test|spec)\.tsx?$/.test(entry) &&
      !entry.endsWith('.d.ts')
    )
      out.push(relative(ROOT, full).split('\\').join('/'))
  }
  return out
}

describe('nguồn class Tailwind của apps/dhcb', () => {
  it('index.css tắt tự quét (source(none)) và dùng cấu hình JS', () => {
    const css = read('apps/dhcb/src/index.css')
    expect(css).toContain("@import 'tailwindcss' source(none);")
    expect(css).toContain("@config '../tailwind.config.js';")
  })

  it('content của tailwind.config.js vẫn quét src của app + packages/core-ui', () => {
    const cfg = read('apps/dhcb/tailwind.config.js')
    expect(cfg).toContain("'src/**/*.{js,ts,jsx,tsx}'")
    expect(cfg).toContain("'../../packages/core-ui/'")
  })

  it('không gói nào ngoài core-ui có .tsx hoặc dùng className (nếu có: thêm vào content)', () => {
    const viPham = listSources(join(ROOT, 'packages'))
      .filter((f) => !f.startsWith('packages/core-ui/'))
      .filter((f) => f.endsWith('.tsx') || read(f).includes('className'))
    expect(viPham, 'Thêm thư mục này vào `content` của apps/dhcb/tailwind.config.js').toEqual([])
  })
})
