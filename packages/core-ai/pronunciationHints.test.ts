import { describe, it, expect } from 'vitest'
import { findPronunciationHints, patternKeysForWord } from './pronunciationHints.js'

const keysOf = (sentence: string) => findPronunciationHints(sentence).map((h) => h.key)

describe('pronunciationHints', () => {
  it('phân biệt /θ/ và /ð/ theo từ', () => {
    expect(patternKeysForWord('think')).toContain('th_voiceless')
    expect(patternKeysForWord('the')).toContain('th_voiced')
    expect(patternKeysForWord('feathers')).toContain('th_voiced')
  })

  it('"Think outside the box": /θ/, /ð/ và /ks/ cuối, kèm đúng từ', () => {
    const hints = findPronunciationHints('Think outside the box')
    expect(hints.map((h) => h.key)).toEqual(['th_voiceless', 'th_voiced', 'final_ks'])
    expect(hints.find((h) => h.key === 'final_ks')?.words).toEqual(['box'])
    expect(hints.find((h) => h.key === 'th_voiceless')?.words).toEqual(['Think'])
  })

  it('/æ/ chỉ cho từ một âm tiết kiểu bad/man/that; không bắt "car", "ball", "rain"', () => {
    expect(patternKeysForWord('bad')).toContain('ash')
    expect(patternKeysForWord('that')).toContain('ash')
    for (const w of ['car', 'ball', 'rain', 'leather', 'say']) {
      expect(patternKeysForWord(w)).not.toContain('ash')
    }
  })

  it('/r/ trước nguyên âm; /ʃ/ với "sh"', () => {
    expect(keysOf('Red leather yellow leather')).toEqual(['th_voiced', 'r'])
    expect(keysOf('She sells seashells')).toEqual(['sh'])
  })

  it('bỏ dấu câu, không lặp từ, câu không có âm nào → rỗng', () => {
    const hints = findPronunciationHints('Think, think!')
    expect(hints[0]?.words).toEqual(['Think'])
    expect(findPronunciationHints('you see me')).toEqual([])
    expect(findPronunciationHints('   ')).toEqual([])
  })

  it('không trả con số điểm nào', () => {
    const json = JSON.stringify(findPronunciationHints('Three thousand feathers'))
    expect(json).not.toMatch(/score|gop|\d/i)
  })
})
