// apps/hub/src/hubStyle.design.test.ts — Cổng canh audit UI/UX 2026-09-30 minor 10.
//
// VÌ SAO CẦN: hub từng dùng font hệ thống trong khi app chính dùng Inter (hai trang của cùng một
// sản phẩm trông như hai sản phẩm), và `scroll-behavior: smooth` áp vô điều kiện — người bật
// "giảm chuyển động" vẫn bị cuộn trượt dài khi bấm liên kết neo (WCAG 2.3.3). Cả hai đều chỉ là
// một dòng CSS, rất dễ quay lại im lặng khi ai đó dọn file.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Bỏ chú thích CSS trước khi quét — chú thích được phép nhắc tới `scroll-behavior: smooth`.
const css = readFileSync(join(__dirname, 'index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const main = readFileSync(join(__dirname, 'main.tsx'), 'utf8')

describe('hub — font và cuộn mượt (audit minor 10)', () => {
  it('nạp Inter tự host và đặt Inter đứng đầu font-family', () => {
    expect(main).toContain("import '@fontsource-variable/inter/wght.css'")
    expect(css).toMatch(/font-family:\s*'Inter Variable'/)
  })

  it('scroll-behavior: smooth CHỈ nằm trong nhánh prefers-reduced-motion: no-preference', () => {
    const matches = [...css.matchAll(/scroll-behavior:\s*smooth/g)]
    expect(matches.length).toBeGreaterThan(0)
    for (const m of matches) {
      const before = css.slice(0, m.index)
      const lastMedia = before.lastIndexOf('@media')
      expect(lastMedia, 'scroll-behavior: smooth nằm ngoài mọi @media').toBeGreaterThan(-1)
      const mediaLine = before.slice(lastMedia, before.indexOf('{', lastMedia))
      expect(mediaLine).toContain('prefers-reduced-motion: no-preference')
      // Không có dấu đóng khối nào làm @media đó kết thúc trước khi tới dòng scroll-behavior
      // ở cùng cấp: đếm ngoặc từ @media tới vị trí khớp phải còn mở.
      const segment = css.slice(lastMedia, m.index)
      const open = (segment.match(/{/g) ?? []).length
      const close = (segment.match(/}/g) ?? []).length
      expect(open - close, 'scroll-behavior: smooth phải còn nằm TRONG @media').toBeGreaterThan(0)
    }
  })
})

// Changelog 0520: hub dùng `buttonClass` biến thể `outline`/`ghost` — các biến thể này cần token
// ngữ nghĩa (`border-line-strong`, `text-content`, `bg-surface-raised`). Thiếu ánh xạ trong cấu hình
// Tailwind của hub thì class sinh ra rỗng, nút mất viền/màu chữ mà không cổng nào báo. Ánh xạ phải
// TRÙNG với app để một nút trông giống nhau ở hai nơi.
describe('hub — token ngữ nghĩa khớp app (changelog 0520)', () => {
  // So VĂN BẢN của từng khối thay vì import cấu hình: cấu hình app dựng đường dẫn từ
  // `import.meta.url`, không nạp được trong môi trường test. Bỏ chú thích + khoảng trắng rồi so.
  const block = (src: string, key: string): string => {
    const m = new RegExp(`\\n\\s*${key}: \\{([^}]*)\\}`).exec(src)
    if (!m) throw new Error(`không thấy khối "${key}"`)
    return (m[1] ?? '').replace(/\/\/[^\n]*/g, '').replace(/\s+/g, '')
  }
  const hub = readFileSync(join(__dirname, '..', 'tailwind.config.js'), 'utf8')
  const app = readFileSync(join(__dirname, '..', '..', 'dhcb', 'tailwind.config.js'), 'utf8')

  for (const key of ['surface', 'line', 'content']) {
    it(`khối \`${key}\` trong apps/hub/tailwind.config.js trùng apps/dhcb`, () => {
      expect(block(hub, key)).toBe(block(app, key))
      expect(block(hub, key)).toContain('rgb(var(--')
    })
  }
})
