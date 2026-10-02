// @vitest-environment node
// Môi trường node: cấu hình Tailwind dùng `import.meta.url` (dựng đường dẫn tuyệt đối cho glob).
import { describe, it, expect } from 'vitest'
import config from '../../tailwind.config.js'

// Bất biến (TRAPS mục 18, changelog 0474): hoạt ảnh CHẠY MỘT LẦN mà khung cuối có `transform`
// thì KHÔNG được giữ khung cuối sau khi chạy (fill-mode `both`/`forwards`). Giữ lại là phần tử
// mang `transform` mãi mãi → thành containing block → mọi `position: fixed` bên trong (hộp
// thoại, lớp phủ) neo theo phần tử đó thay vì màn hình. Đã dính thật: `animate-fade-in` bọc các
// studio của Bạn Đồng Hành làm 10 hộp thoại lệch xuống, cắt nội dung, nền mờ không phủ hết trang.
//
// Hoạt ảnh lặp vô hạn (`infinite`) nằm ngoài luật: nó luôn có `transform` khi chạy, fill-mode
// không đổi được điều đó — đừng đặt hộp thoại trong phần tử chạy hoạt ảnh vô hạn.

type KhungHinh = Record<string, Record<string, string>>
const extend = (config as { theme: { extend: Record<string, unknown> } }).theme.extend
const animation = extend.animation as Record<string, string>
const keyframes = extend.keyframes as Record<string, KhungHinh>

const FILL_MODES = ['none', 'forwards', 'backwards', 'both']

/** Khung cuối = mọi khoá có `100%` hoặc `to` (khoá gộp kiểu "0%, 100%" cũng tính). */
function khungCuoiCoTransform(khung: KhungHinh): boolean {
  return Object.entries(khung).some(
    ([khoa, kieu]) => /(^|,\s*)(100%|to)\s*(,|$)/.test(khoa) && 'transform' in kieu,
  )
}

describe('hoạt ảnh Tailwind không để lại transform sau khi chạy xong', () => {
  const chayMotLan = Object.entries(animation).filter(([, giaTri]) => !/\binfinite\b/.test(giaTri))

  it('có hoạt ảnh để kiểm (đọc được cấu hình)', () => {
    expect(chayMotLan.length).toBeGreaterThan(0)
  })

  for (const [ten, giaTri] of chayMotLan) {
    it(`animate-${ten}: khung cuối có transform thì fill-mode không được là both/forwards`, () => {
      const tokens = giaTri.split(/\s+/)
      const khung = keyframes[tokens[0]!]
      expect(khung, `thiếu keyframes "${tokens[0]}"`).toBeDefined()
      const fill = tokens.find((t) => FILL_MODES.includes(t)) ?? 'none'
      if (khungCuoiCoTransform(khung!)) {
        expect(['both', 'forwards'], `"${giaTri}" giữ transform của khung cuối`).not.toContain(fill)
      }
    })
  }

  it('bộ dò bắt được ca vi phạm (tự kiểm chính nó)', () => {
    expect(khungCuoiCoTransform({ '0%': { opacity: '0' }, '100%': { transform: 'none' } })).toBe(
      true,
    )
    expect(khungCuoiCoTransform({ '0%, 100%': { transform: 'translateX(0)' } })).toBe(true)
    expect(khungCuoiCoTransform({ from: { opacity: '0' }, to: { opacity: '1' } })).toBe(false)
  })
})
