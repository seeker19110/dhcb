import { describe, expect, it } from 'vitest'
import { formatEloDelta } from './pvpEloDelta'

describe('formatEloDelta', () => {
  it('thắng: thêm dấu cộng', () => {
    expect(formatEloDelta(16)).toBe('+16')
  })

  it('thua: dấu trừ thật, KHÔNG ra "+-14" như bản cũ', () => {
    expect(formatEloDelta(-14)).toBe('−14')
    expect(formatEloDelta(-14)).not.toContain('+')
  })

  it('hoà: 0, không dấu', () => {
    expect(formatEloDelta(0)).toBe('0')
  })
})
