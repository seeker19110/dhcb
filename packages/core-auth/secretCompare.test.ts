import { describe, expect, it } from 'vitest'
import { secretMatches } from './secretCompare.js'

describe('secretMatches', () => {
  it('đúng khoá → true', () => {
    expect(secretMatches('abc123', 'abc123')).toBe(true)
  })

  it('sai khoá (cùng độ dài hoặc khác độ dài) → false', () => {
    expect(secretMatches('abc124', 'abc123')).toBe(false)
    expect(secretMatches('abc', 'abc123')).toBe(false)
    expect(secretMatches('abc123456', 'abc123')).toBe(false)
  })

  it('thiếu/rỗng/không phải chuỗi → false', () => {
    expect(secretMatches('', 'abc123')).toBe(false)
    expect(secretMatches(null, 'abc123')).toBe(false)
    expect(secretMatches(undefined, 'abc123')).toBe(false)
    expect(secretMatches(123, 'abc123')).toBe(false)
  })

  it('server chưa cấu hình khoá → luôn false, kể cả khi client gửi rỗng', () => {
    expect(secretMatches('abc123', undefined)).toBe(false)
    expect(secretMatches('abc123', '')).toBe(false)
    expect(secretMatches('', '')).toBe(false)
  })
})
