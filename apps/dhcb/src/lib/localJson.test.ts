import { afterEach, describe, expect, it, vi } from 'vitest'
import { readLocalArray } from './localJson'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('readLocalArray', () => {
  it('đọc đúng mảng đã lưu', () => {
    localStorage.setItem('k', JSON.stringify(['a', 'b']))
    expect(readLocalArray<string>('k')).toEqual(['a', 'b'])
  })

  it.each([
    ['thiếu khoá', null],
    ['chuỗi rỗng', ''],
    ['JSON hỏng', '{['],
    ['không phải mảng', '{"a":1}'],
    ['null', 'null'],
  ])('%s → mảng rỗng', (_label, raw) => {
    if (raw !== null) localStorage.setItem('k', raw)
    expect(readLocalArray('k')).toEqual([])
  })

  it('localStorage bị chặn (getItem ném lỗi) → mảng rỗng, không ném', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(readLocalArray('k')).toEqual([])
  })
})
