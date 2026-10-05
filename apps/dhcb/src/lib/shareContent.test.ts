import { describe, it, expect } from 'vitest'
import {
  buildEvaluationShareContent,
  buildChallengeShareContent,
  buildQuizShareContent,
  buildProgressShareContent,
} from './shareContent'
import type { EvaluationResult } from '../types'

const mkEvaluation = (overrides: Partial<EvaluationResult['scores']> = {}): EvaluationResult => ({
  scores: { fluency: 7, lexical: 6.5, grammar: 8, overall: 7.2, ...overrides },
  errors: [],
  strengths: [],
  suggestions: [],
  encouragement: '',
})

describe('buildEvaluationShareContent', () => {
  it('trả về title + lines đủ khi có đủ điểm (chiều A)', () => {
    const r = buildEvaluationShareContent(mkEvaluation({ pronunciation: 8.5 }), true)
    expect(r.title).toContain('7.2')
    expect(r.lines).toHaveLength(4)
    expect(r.lines.some((l) => l.includes('Phát âm'))).toBe(true)
  })

  it('bỏ qua êm dòng pronunciation khi thiếu (Chat không có audio)', () => {
    const r = buildEvaluationShareContent(mkEvaluation(), true)
    expect(r.lines).toHaveLength(3)
    expect(r.lines.some((l) => l.includes('Phát âm'))).toBe(false)
  })

  it('dùng tiếng Anh khi isA=false', () => {
    const r = buildEvaluationShareContent(mkEvaluation(), false)
    expect(r.title).toContain('Conversation score')
    expect(r.lines[0]).toContain('Fluency')
  })

  it('không crash khi scores thiếu field / undefined, vẫn ra nội dung hợp lý', () => {
    const broken = {
      errors: [],
      strengths: [],
      suggestions: [],
      encouragement: '',
    } as unknown as EvaluationResult
    const r = buildEvaluationShareContent(broken, true)
    expect(r.title).toContain('0/9')
    expect(r.lines).toEqual([])
  })
})

describe('buildChallengeShareContent', () => {
  it('trả về title + pace khi có đủ dữ liệu', () => {
    const r = buildChallengeShareContent({ count: 5, firstWpm: 80, lastWpm: 110 }, true)
    expect(r.title).toBe('Tổng kết tuần: 5/7 ngày')
    expect(r.lines[0]).toContain('80 → 110')
  })

  it('streak = 0 / null không crash, vẫn ra nội dung hợp lý', () => {
    const r = buildChallengeShareContent(null, true)
    expect(r.title).toBe('Tổng kết tuần: 0/7 ngày')
    expect(r.lines.length).toBeGreaterThan(0)
  })

  it('count=0 kèm wpm=0 vẫn không crash, không thêm dòng pace rỗng', () => {
    const r = buildChallengeShareContent({ count: 0, firstWpm: 0, lastWpm: 0 }, false)
    expect(r.title).toBe('Week recap: 0/7 days')
    expect(r.lines.some((l) => l.includes('Pace'))).toBe(false)
  })

  it('dùng tiếng Anh khi isA=false', () => {
    const r = buildChallengeShareContent({ count: 3, firstWpm: 90, lastWpm: 95 }, false)
    expect(r.title).toBe('Week recap: 3/7 days')
    expect(r.lines[0]).toContain('words/min')
  })
})

describe('buildQuizShareContent', () => {
  it('tính % đúng, tiếng Việt khi isA=true', () => {
    const r = buildQuizShareContent(8, 10, true)
    expect(r.title).toBe('Kết quả bài kiểm tra: 8/10')
    expect(r.lines).toEqual(['Đạt 80%'])
  })

  it('tiếng Anh khi isA=false', () => {
    const r = buildQuizShareContent(5, 10, false)
    expect(r.title).toBe('Quiz result: 5/10')
    expect(r.lines).toEqual(['Scored 50%'])
  })

  it('total=0 → không chia cho 0, pct = 0', () => {
    const r = buildQuizShareContent(0, 0, true)
    expect(r.lines).toEqual(['Đạt 0%'])
  })
})

describe('buildProgressShareContent', () => {
  it('tiếng Việt: streak + số từ đã học', () => {
    const r = buildProgressShareContent(7, 120, true)
    expect(r.title).toBe('Chuỗi học 7 ngày liên tiếp 🔥')
    expect(r.lines).toEqual(['Đã học 120 từ'])
  })

  it('tiếng Anh khi isA=false', () => {
    const r = buildProgressShareContent(3, 50, false)
    expect(r.title).toBe('3-day streak 🔥')
    expect(r.lines).toEqual(['50 words learned'])
  })
})
