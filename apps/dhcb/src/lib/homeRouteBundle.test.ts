// Canh route `/` (trang chủ đã đăng nhập) không kéo zod BẢN ĐẦY ĐỦ (`vendor-zod`, ~12 kB gzip).
//
// Đợt E4.1b (audit 2026-10-10): trang chủ chỉ cần vài hàm thuần (`todayItemId`, `isOutlineLeaf`,
// khoá hội thoại CEFR) nhưng import chúng từ file hợp đồng có schema zod là kéo cả `vendor-zod`.
// Test này đi theo ĐỒ THỊ import tĩnh từ `Home.tsx` (không phải danh sách file cố định) nên một
// import mới ở bất kỳ tầng nào kéo lại `zod` đều bị bắt, kèm đường đi để biết sửa ở đâu.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(__dirname, '../../../..')

/** `import`/`export … from` TĨNH, bỏ `import type` (bị xoá lúc biên dịch). `import()` động không khớp. */
const STATIC_IMPORT =
  /^(?:import|export)\s+(type\s+)?(?:[\w$*{}\s,]+?\s+from\s+)?['"]([^'"]+)['"]/gm

function resolveSpecifier(spec: string, fromFile: string): string | null {
  let base: string
  if (spec.startsWith('@dhcb/')) base = resolve(ROOT, 'packages', spec.slice('@dhcb/'.length))
  else if (spec.startsWith('@core/')) base = resolve(ROOT, 'packages/core-ui', spec.slice(6))
  else if (spec.startsWith('.')) base = resolve(dirname(fromFile), spec)
  else return null
  base = base.replace(/\.js$/, '')
  for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx']) {
    if (existsSync(base + ext)) return base + ext
  }
  return null
}

/** Mọi file nguồn import `zod` bản đầy đủ, kèm đường đi từ file gốc (gốc ở cuối). */
function fullZodImporters(entry: string): string[] {
  const start = resolve(ROOT, entry)
  const parent = new Map<string, string | null>([[start, null]])
  const queue = [start]
  const hits: string[] = []
  while (queue.length > 0) {
    const file = queue.shift()!
    for (const match of readFileSync(file, 'utf8').matchAll(STATIC_IMPORT)) {
      if (match[1]) continue
      const spec = match[2]!
      if (spec === 'zod' || spec.startsWith('zod/v4') || spec === 'zod/v3') {
        const chain: string[] = []
        for (let f: string | null = file; f; f = parent.get(f) ?? null) {
          chain.push(relative(ROOT, f))
        }
        hits.push(chain.join(' <- '))
        continue
      }
      const next = resolveSpecifier(spec, file)
      if (next && !parent.has(next)) {
        parent.set(next, file)
        queue.push(next)
      }
    }
  }
  return hits
}

describe('route / không kéo zod bản đầy đủ', () => {
  it('Home.tsx: không file nào trong đồ thị import tĩnh dùng `zod` (chỉ được `zod/mini`)', () => {
    expect(fullZodImporters('apps/dhcb/src/pages/core/Home.tsx')).toEqual([])
  })

  // `AuthProvider` → `preloadBrowse` nạp ĐỘNG hai loader này ngay sau khi đăng nhập (lúc trình
  // duyệt rảnh) — dùng zod đầy đủ ở đây là MỌI phiên đã đăng nhập vẫn tải `vendor-zod`.
  it.each(['apps/dhcb/src/data/lessons/loader.ts', 'apps/dhcb/src/data/patterns/loader.ts'])(
    '%s (nạp trước sau đăng nhập) không kéo zod bản đầy đủ',
    (entry) => {
      expect(fullZodImporters(entry)).toEqual([])
    },
  )

  it('bộ dò thật sự bắt được import `zod` (chống test xanh giả)', () => {
    // todayPlan.ts có schema zod đầy đủ — đi từ đó phải ra đúng nó.
    expect(fullZodImporters('packages/core-contracts/todayPlan.ts')).toEqual([
      'packages/core-contracts/todayPlan.ts',
    ])
  })
})
