import { describe, expect, it } from 'vitest'
import { scoreBand } from './gradientText'

describe('scoreBand', () => {
  it('đúng mốc 7 và 5, kể cả số thập phân ngay dưới mốc', () => {
    expect(scoreBand(9)).toBe('high')
    expect(scoreBand(7)).toBe('high')
    expect(scoreBand(6.5)).toBe('mid')
    expect(scoreBand(5)).toBe('mid')
    expect(scoreBand(4.5)).toBe('low')
    expect(scoreBand(0)).toBe('low')
  })
})
