import type { Page } from '@playwright/test'

// Đo vùng chạm và giãn chữ cho đợt U9a (audit UI/UX 2026-09-30, M20 + M21).
//
// Vì sao tự đo, không dùng axe: axe chỉ có luật 2.5.8 (24px, AA) và bỏ qua phần tử
// `tabindex="-1"`; luật DỰ ÁN là 44px trên mobile (CLAUDE.md mục 4.7, WCAG 2.5.5 AAA). axe cũng
// không có luật nào cho 1.4.12 (giãn chữ) — phải áp CSS giãn chữ rồi đo xem chữ có bị cắt không.

/** Vùng chạm tối thiểu trên mobile (CLAUDE.md mục 4.7, WCAG 2.5.5). */
export const MIN_TOUCH_PX = 44

export type SmallTarget = { desc: string; w: number; h: number }

/**
 * Liệt kê đích chạm nhìn thấy được có cạnh < 44px. Theo các ngoại lệ của WCAG 2.5.5:
 * - **Inline:** liên kết nằm giữa một câu chữ (bố cục `inline` trong đoạn có chữ khác) — kích
 *   thước do dòng chữ quyết định;
 * - **Tương đương:** ô `radio`/`checkbox` gói trong `<label>` (hoặc có `label[for]`) — vùng chạm
 *   thật là cả nhãn, nên đo nhãn;
 * - phần tử bị vô hiệu (`disabled`/`aria-disabled`), ẩn khỏi trợ năng, hoặc chỉ dành cho trình đọc
 *   màn hình (`sr-only`, khung 1×1).
 * Phần tử bị cắt mất (nằm ngoài vùng cuộn ngang) vẫn đo theo hộp thật của nó.
 */
export async function smallTouchTargets(page: Page, min = MIN_TOUCH_PX): Promise<SmallTarget[]> {
  return page.evaluate((minPx) => {
    const SEL = [
      'a[href]',
      'button',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      'summary',
      '[role="button"]',
      '[role="tab"]',
      '[role="switch"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="link"]',
      '[role="menuitem"]',
      '[role="option"]',
    ].join(',')
    const TOL = 0.5
    const out: { desc: string; w: number; h: number }[] = []
    const seen = new Set<Element>()

    const isHidden = (el: Element): boolean => {
      if (el.closest('[aria-hidden="true"], [inert]')) return true
      const cs = getComputedStyle(el)
      if (cs.visibility === 'hidden' || cs.display === 'none') return true
      const r = el.getBoundingClientRect()
      if (r.width <= 1 || r.height <= 1) return true
      // sr-only: clip/clip-path cắt về 0 → chỉ dành cho trình đọc màn hình.
      if (cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)') return true
      return false
    }

    const isInlineInText = (el: Element): boolean => {
      if (el.tagName !== 'A') return false
      const cs = getComputedStyle(el)
      if (cs.display !== 'inline') return false
      const parent = el.parentElement
      if (!parent) return false
      const own = (parent.textContent ?? '').replace(el.textContent ?? '', '').trim()
      return own.length > 0
    }

    const labelOf = (el: Element): Element | null => {
      if (!(el instanceof HTMLInputElement)) return null
      if (el.type !== 'radio' && el.type !== 'checkbox') return null
      const wrap = el.closest('label')
      if (wrap) return wrap
      if (el.id) return document.querySelector(`label[for="${CSS.escape(el.id)}"]`)
      return null
    }

    const describe = (el: Element): string => {
      const name =
        el.getAttribute('aria-label') ??
        (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40) ??
        ''
      const cls = (el.getAttribute('class') ?? '').split(/\s+/).slice(0, 6).join('.')
      const type = el instanceof HTMLInputElement ? `[type=${el.type}]` : ''
      return `${el.tagName.toLowerCase()}${type}${cls ? '.' + cls : ''} «${name}»`
    }

    for (const el of Array.from(document.querySelectorAll(SEL))) {
      if (seen.has(el)) continue
      seen.add(el)
      if (el.closest('[disabled], [aria-disabled="true"]')) continue
      if (isHidden(el)) {
        // Ô radio/checkbox ẩn thị giác nhưng nhãn hiện → đo nhãn ở dưới.
        const lab = labelOf(el)
        if (!lab || isHidden(lab)) continue
      }
      if (isInlineInText(el)) continue
      const target = labelOf(el) ?? el
      // Đích lồng trong một đích khác lớn hơn (vd nút trong thẻ-liên-kết) vẫn đo riêng: người
      // dùng chạm trúng phần tử TRONG CÙNG.
      const r = target.getBoundingClientRect()
      if (r.width + TOL < minPx || r.height + TOL < minPx) {
        out.push({ desc: describe(el), w: Math.round(r.width), h: Math.round(r.height) })
      }
    }
    return out
  }, min)
}

/** CSS giãn chữ đúng mức WCAG 1.4.12 (Text Spacing). */
export const TEXT_SPACING_CSS = `
  *, *::before, *::after {
    line-height: 1.5 !important;
    letter-spacing: 0.12em !important;
    word-spacing: 0.16em !important;
  }
  p { margin-bottom: 2em !important; }
`

/**
 * Đánh dấu (thuộc tính `data-clip-probe`) mọi phần tử đang CẮT chữ của chính nó: có chữ trực
 * tiếp, `overflow` ẩn/cắt (gồm `truncate`, `line-clamp`) và nội dung tràn khỏi hộp. Trả số lượng.
 * Vùng cuộn (`auto`/`scroll`) không tính — chữ vẫn tới được bằng cách cuộn.
 */
async function markClipped(page: Page, attr: string): Promise<number> {
  return page.evaluate((a) => {
    let n = 0
    const hides = (v: string) => v === 'hidden' || v === 'clip'
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('body *'))) {
      const hasOwnText = Array.from(el.childNodes).some(
        (c) => c.nodeType === Node.TEXT_NODE && (c.textContent ?? '').trim().length > 0,
      )
      if (!hasOwnText) continue
      if (el.closest('[aria-hidden="true"]')) continue
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      const r = el.getBoundingClientRect()
      if (r.width <= 1 || r.height <= 1) continue
      if (cs.clip === 'rect(0px, 0px, 0px, 0px)' || cs.clipPath === 'inset(50%)') continue
      const clipX = hides(cs.overflowX) && el.scrollWidth > el.clientWidth + 1
      const clipY = hides(cs.overflowY) && el.scrollHeight > el.clientHeight + 1
      if (clipX || clipY) {
        el.setAttribute(a, '1')
        n++
      }
    }
    return n
  }, attr)
}

export type ClippedText = { desc: string; text: string }

/**
 * Phần tử MỚI bị cắt chữ khi áp giãn chữ WCAG 1.4.12 (đúng thước đo của audit M21): đánh dấu
 * phần tử đang cắt chữ trước khi giãn, áp CSS giãn chữ, rồi trả phần tử cắt chữ mà trước đó
 * không cắt.
 */
export async function newlyClippedOnTextSpacing(page: Page): Promise<ClippedText[]> {
  await markClipped(page, 'data-clip-before')
  await page.addStyleTag({ content: TEXT_SPACING_CSS })
  await page.waitForTimeout(150)
  await markClipped(page, 'data-clip-after')
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-clip-after]:not([data-clip-before])')).map(
      (el) => ({
        desc: `${el.tagName.toLowerCase()}.${(el.getAttribute('class') ?? '').split(/\s+/).slice(0, 8).join('.')}`,
        text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60),
      }),
    ),
  )
}
