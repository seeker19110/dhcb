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
 * MỘT nguồn cho cả bộ lọc nhanh (`BYTE_CAM_RE`) lẫn phần báo chi tiết (`laByteCam`).
 */
const BYTE_CAM: ReadonlyArray<readonly [number, number]> = [
  [0x00, 0x08],
  [0x0b, 0x0c],
  [0x0e, 0x1f],
  [0x7f, 0x7f],
]

function laByteCam(b: number): boolean {
  return BYTE_CAM.some(([lo, hi]) => b >= lo && b <= hi)
}

// LỌC NHANH bằng regex (chạy trong mã máy của V8) trên chuỗi latin1 — latin1 ánh xạ đúng 1 byte
// thành 1 ký tự 0–255, nên khớp regex ⇔ file có byte cấm. Trước đây MỌI file đi qua vòng lặp
// JS TỪNG BYTE (~4.300 file, ~71 MB): chạy riêng 0,5 s, nhưng dưới đo coverage V8 (đếm từng
// khối lệnh) lên 9,2 s, máy tải cao 11,3 s, và đỏ vì quá 30 s trong `test:coverage` toàn bộ
// (đo 2026-10-08, changelog 0532). Vòng lặp từng byte giờ CHỈ chạy trên file đã bị bắt, để in
// chi tiết. Dựng từ mã điểm số — không gõ ký tự điều khiển vào mã nguồn (đúng luật file này canh).
const BYTE_CAM_RE = new RegExp(
  `[${BYTE_CAM.map(([lo, hi]) => `${String.fromCharCode(lo)}-${String.fromCharCode(hi)}`).join('')}]`,
)

function coByteCam(buf: Buffer): boolean {
  return BYTE_CAM_RE.test(buf.toString('latin1'))
}

function bytesCam(buf: Buffer): Map<number, number> {
  const out = new Map<number, number>()
  for (const b of buf) {
    if (laByteCam(b)) out.set(b, (out.get(b) ?? 0) + 1)
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

// LỌC NHANH trên BYTE thô, cùng lý do với `BYTE_CAM_RE`: giải mã UTF-8 cả ~71 MB mới là phần
// đắt nhất của ca quét (đo 2026-10-08 máy tải ~20: giải mã utf8 + regex 0,89 s, so với latin1
// + regex 0,23 s). Mỗi ký tự trong `VO_HINH` được mã hoá UTF-8 thành đúng một dãy byte, viết
// lại dưới dạng chuỗi latin1 rồi ghép thành phép "hoặc". UTF-8 tự đồng bộ nên văn bản giải mã
// chứa ký tự đó ⇔ byte thô chứa đúng dãy đó — bộ lọc không bỏ sót; quyết định cuối vẫn do
// `dongVoHinh` trên văn bản đã giải mã.
const VO_HINH_BYTE_RE = new RegExp(
  VO_HINH.flatMap(([lo, hi]) =>
    Array.from({ length: hi - lo + 1 }, (_, i) =>
      Buffer.from(String.fromCodePoint(lo + i), 'utf8').toString('latin1'),
    ),
  ).join('|'),
)

function coTheCoVoHinh(buf: Buffer): boolean {
  return VO_HINH_BYTE_RE.test(buf.toString('latin1'))
}

/** Dòng đầu tiên dính byte cấm — báo đủ để người sửa nhảy thẳng tới chỗ đó. */
function dongDauTien(buf: Buffer): number {
  let line = 1
  for (const b of buf) {
    if (b === 0x0a) line += 1
    if (laByteCam(b)) return line
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

  // Bộ lọc nhanh và bộ đếm chi tiết phải cùng một tập byte — lệch là ca thật bị bỏ sót im lặng.
  it('bộ lọc nhanh bắt đúng 30 byte cấm trên cả 256 giá trị byte, tha tab/LF/CR', () => {
    const cam: number[] = []
    for (let b = 0; b < 256; b += 1) {
      const loc = coByteCam(Buffer.from([0x61, b, 0x62]))
      expect(loc, `byte 0x${b.toString(16)}`).toBe(laByteCam(b))
      if (loc) cam.push(b)
    }
    expect(cam).toHaveLength(30)
    expect(cam).not.toContain(0x09)
    expect(cam).not.toContain(0x0a)
    expect(cam).not.toContain(0x0d)
    expect(cam).toContain(0x00)
    expect(cam).toContain(0x7f)
    // Byte cao (UTF-8 của chữ Việt) không bị nhầm là byte cấm.
    expect(coByteCam(Buffer.from('Tiếng Việt — đầy đủ dấu', 'utf8'))).toBe(false)
  })

  // Đọc ~71 MB từ đĩa là chi phí thật (đã bỏ phần quét JS từng byte, xem `BYTE_CAM_RE`) — giữ
  // ngưỡng 30 s riêng cho ca này.
  it('không file nào có NUL hay ký tự điều khiển khác', () => {
    const viPham: string[] = []
    for (const f of files) {
      let buf: Buffer
      try {
        buf = readFileSync(f)
      } catch {
        continue // file đã xoá trong thư mục làm việc — không phải việc của test này
      }
      if (!coByteCam(buf)) continue
      const bad = bytesCam(buf)
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

  it('bộ lọc byte của ký tự vô hình bắt MỌI mã điểm trong VO_HINH, tha chữ Việt và ZWJ', () => {
    for (const [lo, hi] of VO_HINH) {
      for (let cp = lo; cp <= hi; cp += 1) {
        const buf = Buffer.from(`Việt${String.fromCodePoint(cp)}—x`, 'utf8')
        expect(coTheCoVoHinh(buf), `U+${cp.toString(16)}`).toBe(true)
        // Bộ lọc và bộ dò chính phải cùng kết luận trên cùng dữ liệu.
        expect(dongVoHinh(buf.toString('utf8'))).toBe(1)
      }
    }
    expect(coTheCoVoHinh(Buffer.from('Tiếng Việt — “ngoặc” … đủ dấu', 'utf8'))).toBe(false)
    expect(coTheCoVoHinh(Buffer.from(`👩${String.fromCodePoint(0x200d)}💼`, 'utf8'))).toBe(false)
  })

  it('không file nào có ký tự định dạng vô hình (zero-width, BOM, bidi)', () => {
    const viPham: string[] = []
    for (const f of files) {
      let buf: Buffer
      try {
        buf = readFileSync(f)
      } catch {
        continue // file đã xoá trong thư mục làm việc — không phải việc của test này
      }
      if (!coTheCoVoHinh(buf)) continue
      const dong = dongVoHinh(buf.toString('utf8'))
      if (dong > 0) viPham.push(`${f}:${dong}`)
    }
    expect(viPham).toEqual([])
  }, 30_000)
})
