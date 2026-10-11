// Đo tương phản CHỮ GRADIENT (`bg-clip-text text-transparent`) — điểm mù của axe-core.
//
// axe không tính được tương phản khi màu chữ là ảnh nền bị cắt theo hình chữ: nó xếp phần tử vào
// `incomplete` và cổng A/AA vẫn XANH. Changelog 0598 bắt được đúng lỗi này ở tiêu đề hub: ở theme
// sáng chữ chỉ đạt 1,27–2,05:1 suốt nhiều tháng mà không cổng nào kêu. Hàm thuần ở đây nhận số đo
// lấy từ trình duyệt (màu các điểm dừng gradient + nền thật + cỡ chữ) và trả danh sách lỗi.
//
// Luật áp: chữ gradient ở dự án là TIÊU ĐỀ/CON SỐ để đọc → mức AAA của nội dung (CLAUDE.md mục
// 4.5): chữ lớn ≥ 4,5:1, chữ thường ≥ 7:1. Lấy điểm dừng TỆ NHẤT: một đoạn chữ rơi vào vùng màu
// nhạt nhất vẫn phải đọc được.
import { contrastRatio, parseCssColor, type Rgb } from './contrast.ts'

export interface GradientTextSample {
  /** Bộ chọn/mô tả ngắn để log CI chỉ đúng chỗ. */
  readonly target: string
  /** `getComputedStyle(el).backgroundImage`. */
  readonly backgroundImage: string
  /** Màu nền đặc gần nhất phía sau (đã đi ngược lên tổ tiên), dạng CSS. */
  readonly background: string
  readonly fontSizePx: number
  readonly fontWeight: number
}

/** Ngưỡng "chữ lớn" của WCAG: ≥ 24px, hoặc ≥ 18,66px (14pt) khi đậm (≥ 700). */
export function isLargeText(fontSizePx: number, fontWeight: number): boolean {
  return fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700)
}

export const GRADIENT_TEXT_LARGE_MIN = 4.5
export const GRADIENT_TEXT_NORMAL_MIN = 7

// Mọi hàm màu trong chuỗi gradient. "in oklab" (không ngoặc) là cách nội suy, không phải màu.
const COLOR_FN = /(?:rgba?|oklch|oklab|hsla?)\([^)]*\)|#[0-9a-f]{3,8}\b/gi

/**
 * Độ mờ (alpha) của một màu CSS: `rgb(r g b / a)`, `oklch(… / a)`, `rgba(r, g, b, a)`; không ghi
 * thì là 1. Màu trong suốt trộn với nền, nên đo nó như màu đặc là đo LẠC QUAN — chỗ gọi coi
 * alpha < 1 là không đo được.
 */
export function alphaOf(color: string): number {
  const c = color.trim()
  const slash = /\/\s*([\d.]+)(%?)\s*\)$/.exec(c)
  const comma = /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*,\s*([\d.]+)(%?)\s*\)$/i.exec(c)
  const m = slash ?? comma
  if (!m) return 1
  return Number(m[1]) / (m[2] === '%' ? 100 : 1)
}

/** Trả danh sách lỗi; rỗng = mọi chữ gradient đạt. Không đọc được màu → LỖI (không bỏ qua). */
export function gradientTextFindings(samples: readonly GradientTextSample[]): string[] {
  const findings: string[] = []
  for (const s of samples) {
    const bg = parseCssColor(s.background)
    if (!bg || alphaOf(s.background) < 1) {
      findings.push(`${s.target}: không đọc được nền đặc "${s.background}"`)
      continue
    }
    const stops = s.backgroundImage.match(COLOR_FN) ?? []
    if (stops.length === 0) {
      findings.push(`${s.target}: không tìm thấy màu nào trong "${s.backgroundImage}"`)
      continue
    }
    const min = isLargeText(s.fontSizePx, s.fontWeight)
      ? GRADIENT_TEXT_LARGE_MIN
      : GRADIENT_TEXT_NORMAL_MIN
    let worst: { ratio: number; color: string } | null = null
    let unreadable: string | null = null
    for (const raw of stops) {
      const rgb: Rgb | null = parseCssColor(raw)
      if (!rgb || alphaOf(raw) < 1) {
        unreadable = raw
        break
      }
      const ratio = contrastRatio(rgb, bg)
      if (!worst || ratio < worst.ratio) worst = { ratio, color: raw }
    }
    if (unreadable) {
      findings.push(`${s.target}: không đo được điểm dừng "${unreadable}"`)
    } else if (worst && worst.ratio < min) {
      findings.push(
        `${s.target}: chữ gradient ${worst.ratio.toFixed(2)}:1 (điểm dừng ${worst.color} trên ${s.background}) < ${min}:1`,
      )
    }
  }
  return findings
}
