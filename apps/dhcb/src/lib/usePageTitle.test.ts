// Test khuôn tiêu đề tab (audit 2026-09-30 C8 + quyết định 2026-10-06: thương hiệu viết hoa từng
// chữ "Đồng Hành Cùng Bạn", giống header/đăng nhập/hub/PWA).
import { describe, it, expect } from 'vitest'
import { BRAND_TITLE, formatPageTitle } from './usePageTitle'

describe('formatPageTitle', () => {
  it('thương hiệu là "Đồng Hành Cùng Bạn" (viết hoa từng chữ)', () => {
    expect(BRAND_TITLE).toBe('Đồng Hành Cùng Bạn')
  })

  it('tiêu đề trần → thêm hậu tố " | thương hiệu"', () => {
    expect(formatPageTitle('Từ điển')).toBe('Từ điển | Đồng Hành Cùng Bạn')
  })

  it('tiêu đề có phần → nối thương hiệu bằng " · "', () => {
    expect(formatPageTitle('Bài học | Môn tiếng Anh')).toBe(
      'Bài học | Môn tiếng Anh · Đồng Hành Cùng Bạn',
    )
  })

  it('đã kèm thương hiệu (kể cả viết thường kiểu cũ) → chuẩn hoá về đúng một hậu tố viết hoa', () => {
    expect(formatPageTitle('Tin nhắn | Đồng hành cùng bạn')).toBe('Tin nhắn | Đồng Hành Cùng Bạn')
    expect(formatPageTitle('Bài học | Môn tiếng Anh · Đồng Hành Cùng Bạn')).toBe(
      'Bài học | Môn tiếng Anh · Đồng Hành Cùng Bạn',
    )
  })

  it('tiêu đề tiếng Anh cũng mang đúng thương hiệu (không còn ngoại lệ "Your Companion")', () => {
    expect(formatPageTitle('Practice | Your Companion')).toBe(
      'Practice | Your Companion · Đồng Hành Cùng Bạn',
    )
    expect(formatPageTitle('Practice')).toBe('Practice | Đồng Hành Cùng Bạn')
  })

  it('chỉ có thương hiệu hoặc rỗng → chỉ thương hiệu', () => {
    expect(formatPageTitle('Đồng Hành Cùng Bạn')).toBe('Đồng Hành Cùng Bạn')
    expect(formatPageTitle('   ')).toBe('Đồng Hành Cùng Bạn')
  })
})
