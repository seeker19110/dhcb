import type { Page } from '@playwright/test'
import type { NodeResult } from 'axe-core'

// Đo tương phản chữ nằm trên NỀN GRADIENT — chỗ axe trả "incomplete" (messageKey `bgGradient`)
// vì không biết lấy điểm nào của dải màu làm nền (changelog 0544).
//
// Cách đo BẢO THỦ (lấy trường hợp TỆ NHẤT, không lấy trung bình):
//   - Đi từ gốc tài liệu xuống phần tử, trộn alpha từng lớp nền: màu nền đặc, và với gradient thì
//     MỖI điểm dừng màu + điểm giữa hai điểm dừng liền nhau là một nền ứng viên.
//   - Màu chữ (kể cả alpha) trộn lên từng nền ứng viên; tỉ lệ tương phản = giá trị THẤP NHẤT.
// Không kết luận (trả `unresolved`, để cổng vẫn ĐỎ) khi không chắc chắn: selector không duy nhất,
// tổ tiên có `opacity` < 1 / `filter` / `mix-blend-mode`, nền là ảnh `url(...)`, gradient không đọc
// được điểm dừng nào, hoặc có phần tử KHÔNG phải tổ tiên chồng lên/nằm dưới chữ (nền bị che).

export type GradientContrast =
  | { status: 'measured'; ratio: number; foreground: string; background: string }
  | { status: 'unresolved'; reason: string }

/** axe bỏ ngỏ vì nền gradient (chỉ ca này mới đem đo ở đây — mọi lý do khác giữ nguyên là lỗi). */
export function isGradientIncomplete(node: NodeResult): boolean {
  return [...node.any, ...node.all, ...node.none].some((check) => {
    const data: unknown = check.data
    return (
      !!data && typeof data === 'object' && 'messageKey' in data && data.messageKey === 'bgGradient'
    )
  })
}

export async function measureGradientContrast(
  page: Page,
  target: NodeResult['target'],
): Promise<GradientContrast> {
  return page.evaluate((target): GradientContrast => {
    if (target.length !== 1 || typeof target[0] !== 'string')
      return { status: 'unresolved', reason: 'unsupported target' }
    const matches = document.querySelectorAll(target[0])
    if (matches.length !== 1) return { status: 'unresolved', reason: 'missing or nonunique target' }
    const el = matches[0] as Element

    type Rgba = [number, number, number, number]
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return { status: 'unresolved', reason: 'no canvas' }
    // Trình duyệt tự đổi mọi cú pháp màu CSS (oklab, oklch, color-mix đã tính…) sang sRGB.
    const parse = (color: string): Rgba | null => {
      ctx.clearRect(0, 0, 1, 1)
      ctx.fillStyle = '#000'
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      return r === undefined || g === undefined || b === undefined || a === undefined
        ? null
        : [r, g, b, a / 255]
    }
    const over = (top: Rgba, bottom: Rgba): Rgba => {
      const a = top[3]
      return [
        top[0] * a + bottom[0] * (1 - a),
        top[1] * a + bottom[1] * (1 - a),
        top[2] * a + bottom[2] * (1 - a),
        1,
      ]
    }
    const luminance = (c: Rgba) => {
      const ch = (v: number) => {
        const s = v / 255
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2])
    }
    const contrast = (a: Rgba, b: Rgba) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
      return (hi + 0.05) / (lo + 0.05)
    }
    const hex = (c: Rgba) =>
      '#' +
      c
        .slice(0, 3)
        .map((v) => Math.round(v).toString(16).padStart(2, '0'))
        .join('')
    const COLOR_RE = /(?:oklch|oklab|rgba?|hsla?|lab|lch|color)\([^()]*\)|#[0-9a-fA-F]{3,8}/g

    // Phần tử không phải tổ tiên nằm ở tâm chữ (trên hoặc dưới) = nền không chỉ là chuỗi tổ tiên.
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0)
      return { status: 'unresolved', reason: 'empty geometry' }
    const stack = document.elementsFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)
    for (const other of stack) {
      if (other === el || el.contains(other) || other.contains(el)) continue
      return { status: 'unresolved', reason: `overlapped by <${other.tagName.toLowerCase()}>` }
    }

    const chain: Element[] = []
    for (let node: Element | null = el; node; node = node.parentElement) chain.unshift(node)
    let candidates: Rgba[] = [[255, 255, 255, 1]]
    for (const node of chain) {
      const cs = getComputedStyle(node)
      if (parseFloat(cs.opacity) < 1) return { status: 'unresolved', reason: 'ancestor opacity' }
      if (cs.filter !== 'none' || cs.mixBlendMode !== 'normal')
        return { status: 'unresolved', reason: 'ancestor filter/blend' }
      const bg = parse(cs.backgroundColor)
      if (!bg) return { status: 'unresolved', reason: 'unparsed background-color' }
      if (bg[3] > 0) candidates = candidates.map((c) => over(bg, c))
      const image = cs.backgroundImage
      if (image === 'none') continue
      if (!image.includes('gradient(') || image.includes('url('))
        return { status: 'unresolved', reason: 'background image' }
      const stops = (image.match(COLOR_RE) ?? []).map(parse)
      if (stops.length === 0 || stops.some((s) => s === null))
        return { status: 'unresolved', reason: 'unparsed gradient stops' }
      const solid = stops as Rgba[]
      // Điểm giữa hai điểm dừng liền nhau cũng là ứng viên (dải nội suy đi qua nó).
      const samples = solid.flatMap((s, i) => {
        const next = solid[i + 1]
        return next ? [s, s.map((v, k) => (v + (next[k] ?? v)) / 2) as Rgba] : [s]
      })
      candidates = candidates.flatMap((c) => samples.map((s) => over(s, c)))
    }

    const cs = getComputedStyle(el)
    const fg = parse(cs.color)
    if (!fg) return { status: 'unresolved', reason: 'unparsed color' }
    let worst = { ratio: Infinity, foreground: '', background: '' }
    for (const bg of candidates) {
      const text = over(fg, bg)
      const ratio = contrast(text, bg)
      if (ratio < worst.ratio) worst = { ratio, foreground: hex(text), background: hex(bg) }
    }
    return { status: 'measured', ...worst, ratio: Math.floor(worst.ratio * 100) / 100 }
  }, target)
}
