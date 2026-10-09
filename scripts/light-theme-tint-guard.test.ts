// Cổng CHẶN (changelog 0543): nền tô màu TỐI cố định (`bg-indigo-950/40`, `from-purple-950/50`…)
// phải có bản `theme-light:` trên cùng dòng — nếu không, ở Blue sky / Nhi đồng chữ đậm nằm trên
// nền đậm (đo thật 1,1–4,6:1). Vì sao là test tĩnh chứ không phải ca E2E: xem đầu file
// `scripts/light-theme-tint-guard.ts` — lỗi này gần như chỉ sống ở trạng thái SAU TƯƠNG TÁC mà
// cổng a11y E2E không bấm tới.
import { describe, expect, it } from 'vitest'
import {
  TINT_ALLOWLIST,
  auditTintLine,
  auditTintRepo,
  blockingTintFindings,
  formatTintFindings,
} from './light-theme-tint-guard.js'

const ROOT = process.cwd()
const F = 'x.tsx'

describe('auditTintLine — luật từng dòng', () => {
  it('báo nền tối thiếu bản theme sáng, chỉ đúng lớp và bản vá cần thêm', () => {
    const r = auditTintLine(F, 7, `<div className="p-3 bg-violet-950/40 text-violet-100">`)
    expect(r).toEqual([{ file: F, line: 7, cls: 'bg-violet-950/40', need: 'theme-light:bg-' }])
  })

  it('đạt khi có `theme-light:bg-…` cùng dòng (khuôn của changelog 0542)', () => {
    expect(
      auditTintLine(F, 1, `'bg-violet-950/40 theme-light:bg-violet-100 border-violet-500'`),
    ).toEqual([])
  })

  it('bậc 900 cũng tính là nền tối; nền không có độ mờ cũng vậy', () => {
    expect(auditTintLine(F, 1, `"bg-indigo-900/50 ring-2"`).map((f) => f.cls)).toEqual([
      'bg-indigo-900/50',
    ])
    expect(auditTintLine(F, 1, `"bg-amber-950 text-amber-200"`).map((f) => f.cls)).toEqual([
      'bg-amber-950',
    ])
  })

  it('gradient: mỗi điểm dừng tối cần bản theme sáng của CHÍNH điểm dừng đó', () => {
    const line = `"bg-gradient-to-br from-indigo-950/60 to-purple-950/60 theme-light:from-indigo-50"`
    expect(auditTintLine(F, 1, line)).toEqual([
      { file: F, line: 1, cls: 'to-purple-950/60', need: 'theme-light:to-' },
    ])
    expect(
      auditTintLine(F, 1, `"from-teal-950/40 via-emerald-950/20 to-zinc-950 theme-light:bg-none"`),
    ).toEqual([])
  })

  it('biến thể (`hover:`) đòi bản vá cùng biến thể', () => {
    expect(auditTintLine(F, 1, `"hover:bg-rose-950/60 theme-light:bg-rose-50"`)).toEqual([
      { file: F, line: 1, cls: 'hover:bg-rose-950/60', need: 'theme-light:hover:bg-' },
    ])
    expect(auditTintLine(F, 1, `"hover:bg-rose-950/60 theme-light:hover:bg-rose-100"`)).toEqual([])
  })

  it('không báo: họ đã ánh xạ theo theme (zinc/accent), bậc sáng, chính bản vá, chú thích', () => {
    expect(auditTintLine(F, 1, `"bg-zinc-950 via-zinc-900/90 bg-accent-900"`)).toEqual([])
    expect(auditTintLine(F, 1, `"bg-indigo-500/20 bg-emerald-800/40"`)).toEqual([])
    expect(auditTintLine(F, 1, `"theme-light:bg-violet-900 theme-light:text-red-950"`)).toEqual([])
    expect(auditTintLine(F, 1, `  // gradient \`via-slate-900\` KHÔNG đảo theo theme`)).toEqual([])
    expect(auditTintLine(F, 1, `  {/* bg-indigo-950/40 cũ */}`)).toEqual([])
  })

  it('không nhầm chữ nằm giữa từ (vd `abg-red-950`, `bg-red-9500`)', () => {
    expect(auditTintLine(F, 1, `"abg-red-950 bg-red-9500"`)).toEqual([])
  })
})

describe('toàn repo: apps/dhcb/src/**/*.tsx', () => {
  it('không còn nền tô màu tối nào thiếu bản theme sáng', () => {
    const findings = blockingTintFindings(ROOT)
    expect(
      findings.length,
      `Nền tối cố định (hex Tailwind, KHÔNG đổi theo theme) thiếu bản theme sáng — ở Blue sky/Nhi\n` +
        `đồng chữ đậm sẽ nằm trên nền đậm. Cách vá (changelog 0542/0543): thêm ngay cạnh lớp đó\n` +
        `\`theme-light:<cùng thuộc tính>-<họ>-50\` (khối có chữ token phụ) hoặc \`-100\` (chip/hover,\n` +
        `chữ \`-900\`), và đổi chữ \`text-[#fff]\`/màu sáng cố định trên nền đó sang sắc \`-900/-950\`\n` +
        `bằng \`theme-light:text-…\`. Vùng LUÔN tối có chủ đích → TINT_ALLOWLIST kèm lý do.\n` +
        `Danh sách đầy đủ: npx tsx scripts/light-theme-tint-guard.ts\n` +
        formatTintFindings(findings.slice(0, 30)),
    ).toBe(0)
  })

  // Ngoại lệ phải còn che một chỗ có thật; mục chết là baseline trá hình — luật a11y cấm.
  it('mỗi mục TINT_ALLOWLIST còn khớp thật và có lý do', () => {
    const raw = auditTintRepo(ROOT)
    for (const a of TINT_ALLOWLIST) {
      expect(a.reason.length, `${a.file} ${a.cls}: thiếu lý do`).toBeGreaterThan(20)
      expect(
        raw.some((f) => f.file === a.file && f.cls === a.cls),
        `Mục ngoại lệ chết (không còn khớp): ${a.file} ${a.cls} — xoá khỏi TINT_ALLOWLIST`,
      ).toBe(true)
    }
  })

  it('bộ quét thật sự đọc được mã nguồn (chống xanh-giả do quét 0 file)', () => {
    // Ngoại lệ đang khớp ≥ 1 chỗ ⇒ hàm quét đã đi qua file .tsx thật.
    expect(auditTintRepo(ROOT).length).toBeGreaterThan(0)
  })
})
