// scripts/no-control-chars.test.ts — Chốt chặn: KHÔNG file nguồn nào được chứa ký tự điều
// khiển thật (NUL và họ hàng).
//
// VÌ SAO CẦN: `apps/dhcb/src/lib/learningSession.ts` (vào `main` ở #932) gõ ký tự NUL THẬT làm
// dấu ngăn trong `contentFingerprint`. Hậu quả không phải lỗi chạy — mã chạy đúng — mà là
// `git diff` coi cả file là NHỊ PHÂN, nên không ai review được bằng mắt. Một file mã nguồn
// trượt khỏi mọi con mắt review là kiểu hỏng IM LẶNG: không cổng nào đỏ, chỉ mất khả năng
// kiểm soát. `CLAUDE.md` mục 8 đã cảnh báo đúng câu này ("dùng escape thay vì gõ ký tự thật")
// nhưng cảnh báo bằng chữ thì người ta quên; test thì không.
//
// CÁCH SỬA khi test này đỏ: thay ký tự thật bằng escape trong chuỗi — dùng \u0000 cho NUL,
// \t cho tab, v.v. Giá trị chuỗi lúc chạy KHÔNG đổi, chỉ file là đọc được bằng mắt trở lại.
//
// Cố ý CHO PHÉP `\t`, `\n`, `\r`: đó là khoảng trắng bình thường của file văn bản.

import { describe, it, expect } from 'vitest'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

/** Phần mở rộng được coi là "file nguồn người đọc" — nơi diff nhị phân gây thiệt hại thật. */
const SOURCE_EXT =
  /\.(ts|tsx|js|jsx|mjs|cjs|json|css|scss|md|sql|ya?ml|sh|html|txt|snap|svg|toml)$/i

/**
 * Byte bị cấm: mọi ký tự điều khiển C0 trừ tab (0x09) · LF (0x0a) · CR (0x0d), cộng DEL (0x7f).
 * Đây là đúng tập byte khiến `git diff` chuyển một file sang chế độ nhị phân.
 */
function bytesCam(buf: Buffer): Map<number, number> {
  const out = new Map<number, number>()
  for (const b of buf) {
    const cam = b < 0x09 || b === 0x0b || b === 0x0c || (b >= 0x0e && b <= 0x1f) || b === 0x7f
    if (cam) out.set(b, (out.get(b) ?? 0) + 1)
  }
  return out
}

/**
 * Ký tự ĐỊNH DẠNG vô hình (Unicode Cf) — người review không thấy, nhưng trình biên dịch và mô
 * hình AI thì đọc: zero-width space/non-joiner, word joiner, BOM, điều khiển hướng chữ bidi
 * ("Trojan Source", CVE-2021-42574). CHO PHÉP U+200D (zero-width joiner): emoji ghép như 👩‍💼
 * cần nó. Khai bằng MÃ ĐIỂM số, không bằng escape kiểu backslash-u: công cụ ghi file của tác tử
 * từng giải mã escape đó thành ký tự thật (changelog 0468). Thêm 2026-10-01 sau khi quét toàn
 * repo thấy một zero-width space lạc làm vỡ chữ trong docs/research/uiux-va-giao-dien.md.
 */
const VO_HINH: ReadonlyArray<readonly [number, number]> = [
  [0x200b, 0x200c],
  [0x2060, 0x2060],
  [0xfeff, 0xfeff],
  [0x202a, 0x202e],
  [0x2066, 0x2069],
]
const VO_HINH_RE = new RegExp(
  `[${VO_HINH.map(([lo, hi]) => `${String.fromCodePoint(lo)}-${String.fromCodePoint(hi)}`).join('')}]`,
  'u',
)

/** Dòng đầu tiên chứa ký tự định dạng vô hình; 0 = sạch. */
function dongVoHinh(text: string): number {
  const m = VO_HINH_RE.exec(text)
  if (!m) return 0
  return text.slice(0, m.index).split(String.fromCodePoint(0x0a)).length
}

/** Dòng đầu tiên dính byte cấm — báo đủ để người sửa nhảy thẳng tới chỗ đó. */
function dongDauTien(buf: Buffer): number {
  let line = 1
  for (const b of buf) {
    if (b === 0x0a) line += 1
    const cam = b < 0x09 || b === 0x0b || b === 0x0c || (b >= 0x0e && b <= 0x1f) || b === 0x7f
    if (cam) return line
  }
  return 0
}

describe('file nguồn không chứa ký tự điều khiển', () => {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'buffer' })
    .toString('utf-8')
    .split('\u0000')
    .filter((f) => f !== '' && SOURCE_EXT.test(f))

  it('có file để kiểm (tự bảo vệ khỏi test rỗng luôn xanh)', () => {
    expect(files.length).toBeGreaterThan(1000)
  })

  // Quét toàn bộ source có thể vượt default 5s khi suite coverage chạy song song trên CI.
  it('không file nào có NUL hay ký tự điều khiển khác', () => {
    const viPham: string[] = []
    for (const f of files) {
      let buf: Buffer
      try {
        buf = readFileSync(f)
      } catch {
        continue // file đã xoá trong thư mục làm việc — không phải việc của test này
      }
      const bad = bytesCam(buf)
      if (bad.size === 0) continue
      const mo = [...bad.entries()]
        .map(([b, n]) => `0x${b.toString(16).padStart(2, '0')}×${n}`)
        .join(' ')
      viPham.push(`${f}:${dongDauTien(buf)} — ${mo}`)
    }
    // In thẳng danh sách: người sửa thấy ngay file nào, dòng nào, byte nào.
    expect(viPham).toEqual([])
  }, 30_000)

  it('bộ dò ký tự vô hình bắt ký tự thật, bỏ qua ZWJ của emoji ghép', () => {
    expect(dongVoHinh(`a${String.fromCodePoint(0x202e)}b`)).toBe(1)
    expect(dongVoHinh(`x${String.fromCodePoint(0x0a)}y${String.fromCodePoint(0x200b)}`)).toBe(2)
    expect(dongVoHinh(`👩${String.fromCodePoint(0x200d)}💼`)).toBe(0)
    expect(dongVoHinh('Tiếng Việt có dấu — bình thường')).toBe(0)
  })

  it('không file nào có ký tự định dạng vô hình (zero-width, BOM, bidi)', () => {
    const viPham: string[] = []
    for (const f of files) {
      let text: string
      try {
        text = readFileSync(f, 'utf8')
      } catch {
        continue // file đã xoá trong thư mục làm việc — không phải việc của test này
      }
      const dong = dongVoHinh(text)
      if (dong > 0) viPham.push(`${f}:${dong}`)
    }
    expect(viPham).toEqual([])
  }, 30_000)
})
