// scripts/light-theme-tint-guard.ts — Soi NỀN tô màu tối cố định thiếu bản theme sáng.
//
// VÌ SAO CẦN (changelog 0543): `bg-indigo-950/40`, `from-purple-950/50`… là hex CỐ ĐỊNH của
// Tailwind, KHÔNG đổi theo theme (chỉ `zinc`/`white`/`accent` được ánh xạ sang biến CSS trong
// `apps/dhcb/tailwind.config.js`). Ở hai theme nền sáng (Blue sky, Nhi đồng), chữ trên nền đó
// thường ĐÃ được đổi sang sắc đậm (`theme-light:text-*-900`, hay token `text-content*` vốn đậm
// ở theme sáng) — nhưng nền vẫn tối ⇒ chữ đậm trên nền đậm, đo thật chỉ 1,1–4,6:1.
//
// Cổng a11y E2E (`e2e/a11y*.spec.ts`) KHÔNG bắt được loại lỗi này một cách đáng tin: chúng chỉ
// quét trạng thái BAN ĐẦU của trang, còn các khối tô màu tối gần như toàn là trạng thái SAU
// TƯƠNG TÁC (thẻ đang chọn, phiên đang chạy, bảng điểm tổng kết, khối mở rộng). Script này đọc
// thẳng mã nguồn nên phủ mọi trạng thái, kể cả trạng thái chưa ca E2E nào bấm tới.
//
// LUẬT: mỗi lớp nền `bg-<họ>-900|950` hoặc điểm dừng gradient `from|via|to-<họ>-900|950` (họ màu
// cố định, kể cả khi có biến thể đứng trước như `hover:`) PHẢI có bản theme sáng cùng thuộc tính
// trên CÙNG DÒNG: `theme-light:bg-…` / `theme-light:from-…` (giữ nguyên chuỗi biến thể, vd
// `hover:bg-rose-950/60` cần `theme-light:hover:bg-…`). Gradient chấp nhận thêm
// `theme-light:bg-none` (bỏ hẳn gradient ở theme sáng).
//
// VÌ SAO THEO DÒNG: className của dự án viết trên một dòng (Prettier không ngắt chuỗi), và nhánh
// ternary `isSelected ? '…' : '…'` mỗi nhánh một dòng — đúng phạm vi một "trạng thái". Bản vá đặt
// ở dòng khác (một biến `cn()` khác) là khó soát khi review, nên cổng đòi nó nằm cạnh lớp gốc.
//
// Chạy: npx tsx scripts/light-theme-tint-guard.ts   (in danh sách đầy đủ)
// Cổng CHẶN: scripts/light-theme-tint-guard.test.ts
import { readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { FIXED_FAMILIES, walk } from './fixed-color-contrast-audit.js'

/** Bậc màu "tối" của bảng Tailwind — nền dùng các bậc này là nền tối ở MỌI theme. */
export const DARK_STEPS = ['900', '950'] as const

/** Các thuộc tính tạo NỀN: màu nền và ba điểm dừng gradient. */
const PROPS = ['bg', 'from', 'via', 'to'] as const
type Prop = (typeof PROPS)[number]

export type TintFinding = {
  file: string
  line: number
  /** Lớp gây lỗi, nguyên văn (vd `hover:bg-rose-950/60`). */
  cls: string
  /** Bản vá cần thêm (tiền tố) — vd `theme-light:hover:bg-`. */
  need: string
}

// Một token className: đứng sau đầu dòng/khoảng trắng/dấu nháy/backtick/ngoặc, gồm chuỗi biến thể
// (`hover:`, `group-hover:`, `sm:`…), thuộc tính, họ màu, bậc tối, độ mờ tuỳ chọn.
const TOKEN_RE = new RegExp(
  `(?<=^|[\\s"'\`{(])((?:[a-z0-9-]+:)*)(${PROPS.join('|')})-(${FIXED_FAMILIES.join('|')})-(${DARK_STEPS.join('|')})(?:/[0-9]+)?(?![\\w-])`,
  'g',
)

/** Dòng chú thích (`//`, `/* … *\/`, `{/* … *\/}`, dòng `*` trong khối) — không phải className. */
function isCommentLine(text: string): boolean {
  const t = text.trimStart()
  return t.startsWith('//') || t.startsWith('/*') || t.startsWith('*') || t.startsWith('{/*')
}

/** Soi một dòng mã: trả về mọi lớp nền tối thiếu bản `theme-light:` tương ứng. */
export function auditTintLine(file: string, line: number, text: string): TintFinding[] {
  if (isCommentLine(text)) return []
  const found: TintFinding[] = []
  TOKEN_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = TOKEN_RE.exec(text)) !== null) {
    const variants = m[1] ?? ''
    // Chính bản vá (`theme-light:bg-indigo-900`) là màu ĐẬM cho theme sáng — hợp lệ, bỏ qua.
    if (variants.split(':').includes('theme-light')) continue
    const prop = m[2] as Prop
    const need = `theme-light:${variants}${prop}-`
    const ok =
      text.includes(need) || (prop !== 'bg' && text.includes(`theme-light:${variants}bg-none`))
    if (!ok) found.push({ file, line, cls: m[0], need })
  }
  return found
}

/**
 * Ngoại lệ CÓ LÝ DO — vùng LUÔN tối có chủ đích (vd khung phát video), không phải nợ được tha.
 * Luật a11y của dự án cấm baseline: mỗi mục phải giải thích vì sao nền tối là ĐÚNG ở theme sáng,
 * và test canh bắt buộc mục đó CÒN khớp thật (mục chết phải xoá).
 *
 * Điều kiện để một chỗ được vào đây: nền ĐỤC (không `/độ mờ`) + chữ trên nó là màu SÁNG CỐ ĐỊNH
 * (không có `theme-light:text-…`) ⇒ cặp màu y hệt ở mọi theme, đo một lần là đúng cho cả 3.
 */
export const TINT_ALLOWLIST: ReadonlyArray<{ file: string; cls: string; reason: string }> = [
  {
    file: 'apps/dhcb/src/components/OfflineSyncIndicator.tsx',
    cls: 'bg-amber-950',
    reason:
      'Dải báo ngoại tuyến/tạm dừng chấm nổi đè lên nội dung: cố ý là khối ĐỤC tối ở mọi theme ' +
      '(xem chú thích ngay trên `tone` trong file). Chữ `text-amber-200` cố định: 12,05:1.',
  },
  {
    file: 'apps/dhcb/src/components/OfflineSyncIndicator.tsx',
    cls: 'bg-emerald-950',
    reason:
      'Cùng dải đồng bộ ở trạng thái "đã đồng bộ" — khối đục tối mọi theme. ' +
      'Chữ `text-emerald-200` cố định: 11,87:1.',
  },
  {
    file: 'apps/dhcb/src/components/OfflineSyncIndicator.tsx',
    cls: 'bg-amber-900',
    reason:
      'Huy hiệu "Tự lưu cục bộ" nằm TRONG dải đục tối ở trên. Chữ `text-amber-200` cố định: 7,28:1.',
  },
]

const isAllowed = (f: TintFinding): boolean =>
  TINT_ALLOWLIST.some((a) => a.file === f.file && a.cls === f.cls)

/** Quét toàn bộ `apps/dhcb/src/**\/*.tsx` (trừ file test). */
export function auditTintRepo(root: string): TintFinding[] {
  const out: TintFinding[] = []
  for (const file of walk(join(root, 'apps', 'dhcb', 'src'))) {
    if (file.endsWith('.test.tsx')) continue
    const rel = relative(root, file).split('\\').join('/')
    readFileSync(file, 'utf-8')
      .split('\n')
      .forEach((text, i) => out.push(...auditTintLine(rel, i + 1, text)))
  }
  return out
}

/** Phát hiện chưa được ngoại lệ che — đây là thứ cổng chặn. */
export function blockingTintFindings(root: string): TintFinding[] {
  return auditTintRepo(root).filter((f) => !isAllowed(f))
}

/** Thông điệp lỗi cho người sửa: chỉ đúng file:dòng + lớp cần thêm. */
export function formatTintFindings(findings: TintFinding[]): string {
  return findings
    .map((f) => `${f.file}:${f.line}  ${f.cls}  → thêm \`${f.need}<họ>-50|100\` cùng dòng`)
    .join('\n')
}

if (process.argv[1]?.endsWith('light-theme-tint-guard.ts')) {
  const findings = blockingTintFindings(process.cwd())
  console.log(`Tổng: ${findings.length} lớp nền tối thiếu bản theme sáng\n`)
  console.log(formatTintFindings(findings))
}
