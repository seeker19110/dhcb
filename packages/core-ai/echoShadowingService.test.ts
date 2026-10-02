import { describe, it, expect } from 'vitest'
import { listShadowingPassages, getShadowingPassage } from './echoShadowingService.js'
import * as service from './echoShadowingService.js'

describe('echoShadowingService', () => {
  it('lists predefined passages', () => {
    const list = listShadowingPassages()
    expect(list.length).toBeGreaterThanOrEqual(3)
    expect(list[0]?.id).toBe('jobs_stanford_commencement')
  })

  it('getShadowingPassage tra đúng id, id lạ trả undefined', () => {
    expect(getShadowingPassage('churchill_we_shall_fight')?.difficulty).toBe('advanced')
    expect(getShadowingPassage('khong-ton-tai')).toBeUndefined()
  })

  // Changelog 0484: không còn hàm chấm điểm từ số ngẫu nhiên.
  it('không còn export hàm chấm điểm shadowing', () => {
    expect('evaluateShadowingSession' in service).toBe(false)
  })

  // Bài mẫu được đọc to làm mẫu — câu phải đúng ngữ pháp, không nhắc tới các trụ đã xoá.
  it('bài mẫu viết đúng sở hữu cách và không nhắc "life domains"', () => {
    const texts = listShadowingPassages().map((p) => p.targetText)
    expect(texts.join(' ')).not.toMatch(/someone else life|other people thinking|life domains/)
  })
})
