// apps/dhcb/src/pages/core/FontSizeRem.design.test.ts — Cổng canh cỡ chữ theo tuỳ chọn người dùng
// (đợt U6 · M5, audit UI/UX 2026-09-30 mục 5 M5 + mục 11 điểm (f)).
//
// VÌ SAO CẦN: EN 301 549 v4.1.1 §9.7 / WCAG 1.4.4 — người dùng đổi cỡ chữ mặc định của trình duyệt
// (16→24px) thì chữ phải lớn theo. `font-size` viết bằng px KHOÁ cỡ chữ: audit đo được 87% nút chữ
// trang đọc truyện giữ nguyên cỡ vì `.read-body { font-size: 15px }`. Viết bằng rem
// (11px = 0.6875rem, 13px = 0.8125rem, 15px = 0.9375rem, 16px = 1rem) thì chữ theo cỡ người dùng.
//
// HAI LUẬT:
// 1. File CSS (apps/dhcb, apps/hub, packages): KHÔNG có `font-size: <số>px` nào — tuyệt đối.
//    Cần sàn px (vd chống iOS tự zoom ô nhập) thì dùng `max(1rem, 16px)`: không dưới 16px mà vẫn
//    lớn theo người dùng.
// 2. Mã TS/TSX: `text-[<số>px]` (Tailwind) và `fontSize: '<số>px'`/`fontSize: <số>` (style) là NỢ CŨ
//    (~500 chỗ, chủ yếu `text-[11px]`) — chuyển hàng loạt sang rem là việc cơ học, tách đợt riêng
//    để không xung đột với các đợt sửa giao diện song song. Test này là CHỐT CHẶN MỘT CHIỀU: mỗi
//    file chỉ được GIỮ NGUYÊN hoặc GIẢM số chỗ so với danh sách dưới; file mới phải là 0. Đã
//    chuyển sang rem ở file nào thì hạ số của file đó xuống (hoặc xoá dòng) cho chốt siết lại.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const REPO_ROOT = join(__dirname, '../../../../..')
const SCAN_ROOTS = ['apps/dhcb/src', 'apps/hub/src', 'packages']
const SKIP_DIRS = new Set(['node_modules', 'dist'])

/** `font-size: 15px` trong CSS — KHÔNG khớp `max(1rem, 16px)` (giá trị không bắt đầu bằng số). */
const CSS_PX_FONT_SIZE = /font-size\s*:\s*[\d.]+px/g
/** `text-[11px]` (Tailwind) · `fontSize: '11px'` · `fontSize: 11` (React hiểu số là px). */
const TS_PX_FONT_SIZE = /text-\[\d+(?:\.\d+)?px\]|fontSize:\s*(?:['"]\d+(?:\.\d+)?px['"]|\d)/g

function walk(dir: string, exts: string[]): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full, exts))
    else if (exts.includes(extname(entry))) out.push(full)
  }
  return out
}

function rel(full: string): string {
  return full
    .slice(REPO_ROOT.length + 1)
    .split('\\')
    .join('/')
}

function countMatches(source: string, pattern: RegExp): number {
  return source.match(pattern)?.length ?? 0
}

// Nợ cũ đã xoá (chuyên đổi sang rem theo đợt 2026-10-06).
// Danh sách trống = KHÔNG CÓ nợ px nào còn lại.
const LEGACY_PX_FONT_SIZE: Record<string, number> = {}
const LEGACY_TOTAL = 0

describe('Cỡ chữ theo tuỳ chọn người dùng — không khoá px (U6 · M5)', () => {
  const cssFiles = SCAN_ROOTS.flatMap((r) => walk(join(REPO_ROOT, r), ['.css']))
  const tsFiles = SCAN_ROOTS.flatMap((r) => walk(join(REPO_ROOT, r), ['.ts', '.tsx'])).filter(
    (f) => !/\.test\.tsx?$/.test(f) && !f.endsWith('.d.ts'),
  )

  it('hàm quét thấy đủ file (chống quét rỗng rồi xanh giả)', () => {
    expect(cssFiles.map(rel)).toContain('apps/dhcb/src/index.css')
    expect(tsFiles.length).toBeGreaterThan(500)
  })

  it('không file CSS nào còn `font-size: <số>px`', () => {
    const offenders = cssFiles
      .map((f) => [rel(f), countMatches(readFileSync(f, 'utf8'), CSS_PX_FONT_SIZE)] as const)
      .filter(([, n]) => n > 0)
    expect(offenders, 'đổi sang rem; cần sàn px thì dùng max(1rem, <số>px)').toEqual([])
  })

  it('mã TS/TSX: không file nào THÊM cỡ chữ px so với nợ cũ; file mới phải là 0', () => {
    const grown: string[] = []
    let total = 0
    for (const f of tsFiles) {
      const n = countMatches(readFileSync(f, 'utf8'), TS_PX_FONT_SIZE)
      total += n
      const allowed = LEGACY_PX_FONT_SIZE[rel(f)] ?? 0
      if (n > allowed) grown.push(`${rel(f)}: ${n} > ${allowed}`)
    }
    expect(
      grown,
      'dùng rem: text-[0.6875rem] thay text-[11px], text-[0.9375rem] thay text-[15px]',
    ).toEqual([])
    expect(total).toBeLessThanOrEqual(LEGACY_TOTAL)
  })

  it('CA GIẢ — mẫu regex bắt đúng ca px và tha ca rem/max()', () => {
    expect(countMatches('.a { font-size: 15px; }', CSS_PX_FONT_SIZE)).toBe(1)
    expect(countMatches('.a { font-size:12.5px }', CSS_PX_FONT_SIZE)).toBe(1)
    expect(countMatches('.a { font-size: 0.9375rem; }', CSS_PX_FONT_SIZE)).toBe(0)
    expect(countMatches('input { font-size: max(1rem, 16px) !important; }', CSS_PX_FONT_SIZE)).toBe(
      0,
    )
    expect(countMatches('className="text-[11px] font-bold"', TS_PX_FONT_SIZE)).toBe(1)
    expect(countMatches("style={{ fontSize: '11px' }}", TS_PX_FONT_SIZE)).toBe(1)
    expect(countMatches('style={{ fontSize: 12 }}', TS_PX_FONT_SIZE)).toBe(1)
    expect(countMatches('className="text-[0.6875rem]"', TS_PX_FONT_SIZE)).toBe(0)
    expect(countMatches("fontSize: '1rem'", TS_PX_FONT_SIZE)).toBe(0)
  })
})
