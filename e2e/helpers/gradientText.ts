import type { Page } from '@playwright/test'
import { gradientTextFindings, type GradientTextSample } from '../../scripts/lib/gradientText.ts'

// Thu số đo của mọi chữ gradient (`background-clip: text`) đang HIỆN trên trang rồi chấm bằng
// `gradientTextFindings` — lấp điểm mù của axe (xem scripts/lib/gradientText.ts).
//
// Nền = màu nền đặc của tổ tiên gần nhất. Gặp tổ tiên có ẢNH nền (gradient/ảnh) trước khi gặp nền
// đặc thì trả nguyên chuỗi ảnh nền đó: hàm chấm không đọc được → báo lỗi, không đoán.
export async function measureGradientText(page: Page): Promise<string[]> {
  const samples: GradientTextSample[] = await page.evaluate(() => {
    const out: GradientTextSample[] = []
    for (const el of document.querySelectorAll<HTMLElement>('body *')) {
      const cs = getComputedStyle(el)
      if (cs.backgroundClip !== 'text' && cs.webkitBackgroundClip !== 'text') continue
      if (el.getClientRects().length === 0 || !el.textContent?.trim()) continue
      let background = 'transparent'
      for (let p = el.parentElement; p; p = p.parentElement) {
        const pcs = getComputedStyle(p)
        if (pcs.backgroundImage !== 'none') {
          background = pcs.backgroundImage
          break
        }
        const c = pcs.backgroundColor
        if (c !== 'transparent' && !/,\s*0\)$|\/\s*0\)$/.test(c)) {
          background = c
          break
        }
      }
      const tag = el.tagName.toLowerCase()
      out.push({
        target: `${tag} "${el.textContent.trim().slice(0, 40)}"`,
        backgroundImage: cs.backgroundImage,
        background,
        fontSizePx: parseFloat(cs.fontSize),
        fontWeight: Number(cs.fontWeight),
      })
    }
    return out
  })
  return gradientTextFindings(samples)
}
