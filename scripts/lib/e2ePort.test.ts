import { describe, expect, it } from 'vitest'
import { resolveE2ePort } from './e2ePort'

describe('resolveE2ePort', () => {
  it('không đặt → 5179, dùng lại server sẵn có (hành vi cũ)', () => {
    expect(resolveE2ePort(undefined)).toEqual({ port: 5179, reuseExistingServer: true })
    expect(resolveE2ePort('')).toEqual({ port: 5179, reuseExistingServer: true })
  })
  it('CI không đặt → 5179, không dùng lại server', () => {
    expect(resolveE2ePort(undefined, true)).toEqual({ port: 5179, reuseExistingServer: false })
  })
  it('đặt cổng khác → dùng cổng đó và ép dựng server riêng', () => {
    expect(resolveE2ePort('5181')).toEqual({ port: 5181, reuseExistingServer: false })
  })
  it('đặt đúng 5179 → coi như mặc định', () => {
    expect(resolveE2ePort('5179')).toEqual({ port: 5179, reuseExistingServer: true })
  })
  it('chấp nhận biên 1024 và 65535', () => {
    expect(resolveE2ePort('1024').port).toBe(1024)
    expect(resolveE2ePort('65535').port).toBe(65535)
  })
  it.each(['abc', '5181x', '1023', '65536', '51.5', '-1', '1e4'])(
    '"%s" → ném lỗi tiếng Việt',
    (v) => {
      expect(() => resolveE2ePort(v)).toThrow(/không hợp lệ/)
    },
  )
})
