import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getViewedIds, markViewed, markLastOpened, getLastOpened } from './viewedTracking'

describe('viewedTracking — theo dõi "đã xem" (Lessons/CommonPhrases)', () => {
  beforeEach(() => localStorage.clear())

  it('mặc định chưa xem gì', () => {
    expect(getViewedIds('lessons', 'u1').size).toBe(0)
  })

  it('markViewed ghi nhớ, đọc lại đúng id đã xem', () => {
    markViewed('lessons', 'u1', '5')
    expect(getViewedIds('lessons', 'u1').has('5')).toBe(true)
  })

  it('đánh dấu 2 lần cùng id vẫn chỉ có 1 phần tử (idempotent)', () => {
    markViewed('lessons', 'u1', '5')
    markViewed('lessons', 'u1', '5')
    expect(getViewedIds('lessons', 'u1').size).toBe(1)
  })

  it('tách riêng theo namespace — "lessons" và "phrases" không lẫn nhau', () => {
    markViewed('lessons', 'u1', '5')
    markViewed('phrases', 'u1', "I'm")
    expect(getViewedIds('lessons', 'u1').has("I'm")).toBe(false)
    expect(getViewedIds('phrases', 'u1').has('5')).toBe(false)
  })

  it('tách riêng theo uid — user A không thấy đã xem của user B', () => {
    markViewed('lessons', 'u1', '5')
    expect(getViewedIds('lessons', 'u2').has('5')).toBe(false)
  })

  it('dữ liệu localStorage hỏng → Set rỗng, không lỗi', () => {
    localStorage.setItem('et_viewed_lessons_u1', 'not-json{{')
    expect(getViewedIds('lessons', 'u1').size).toBe(0)
  })
})

describe('viewedTracking — mục mở gần nhất (U9b)', () => {
  beforeEach(() => localStorage.clear())

  it('chưa mở gì → null; mở rồi đọc lại đúng mục mở SAU CÙNG, tách theo người và danh sách', () => {
    expect(getLastOpened('lessons', 'u1')).toBeNull()
    markLastOpened('lessons', 'u1', '1')
    markLastOpened('lessons', 'u1', '3')
    expect(getLastOpened('lessons', 'u1')).toBe('3')
    expect(getLastOpened('lessons', 'u2')).toBeNull()
    expect(getLastOpened('phrases', 'u1')).toBeNull()
  })

  it('localStorage ném lỗi → đọc null, ghi không ném', () => {
    const get = vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const set = vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => markLastOpened('lessons', 'u1', '1')).not.toThrow()
    expect(getLastOpened('lessons', 'u1')).toBeNull()
    get.mockRestore()
    set.mockRestore()
  })
})
