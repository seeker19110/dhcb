import { describe, it, expect } from 'vitest'
import {
  LearnerIntentSchema,
  LEARNER_INTENT_SCHEMA_VERSION,
  isStemIntentSubject,
  STEM_INTENT_SUBJECT_IDS,
} from './learnerIntent.js'

const base = {
  schemaVersion: LEARNER_INTENT_SCHEMA_VERSION,
  subjectIds: ['programming'],
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
}

describe('LearnerIntentSchema', () => {
  it('nhận bản tối thiểu: một môn + hai mốc thời gian', () => {
    const parsed = LearnerIntentSchema.parse(base)
    expect(parsed.subjectIds).toEqual(['programming'])
    expect(parsed.purpose).toBeUndefined()
  })

  it('nhận bản đầy đủ và GIỮ nguyên thứ tự môn người dùng chọn', () => {
    const parsed = LearnerIntentSchema.parse({
      ...base,
      subjectIds: ['physics', 'english', 'mathematics'],
      purpose: 'thi_cu',
      timeBudget: 20,
      level: 'lv_some',
      grade: '11',
    })
    expect(parsed.subjectIds).toEqual(['physics', 'english', 'mathematics'])
  })

  it('từ chối subjectIds rỗng', () => {
    expect(LearnerIntentSchema.safeParse({ ...base, subjectIds: [] }).success).toBe(false)
  })

  it('từ chối id môn lạ', () => {
    expect(LearnerIntentSchema.safeParse({ ...base, subjectIds: ['music'] }).success).toBe(false)
  })

  it('từ chối id môn TRÙNG', () => {
    const r = LearnerIntentSchema.safeParse({ ...base, subjectIds: ['english', 'english'] })
    expect(r.success).toBe(false)
  })

  it('từ chối schemaVersion sai', () => {
    expect(LearnerIntentSchema.safeParse({ ...base, schemaVersion: 2 }).success).toBe(false)
  })

  it('từ chối trường lạ (strict) — kể cả trường chấm điểm', () => {
    expect(LearnerIntentSchema.safeParse({ ...base, score: 72 }).success).toBe(false)
    expect(LearnerIntentSchema.safeParse({ ...base, rank: 'A' }).success).toBe(false)
  })

  it('từ chối grade khi KHÔNG có môn STEM nào', () => {
    const r = LearnerIntentSchema.safeParse({ ...base, subjectIds: ['english'], grade: '10' })
    expect(r.success).toBe(false)
  })

  it('cho phép grade khi có ít nhất một môn STEM', () => {
    const r = LearnerIntentSchema.safeParse({
      ...base,
      subjectIds: ['english', 'chemistry'],
      grade: '12',
    })
    expect(r.success).toBe(true)
  })

  it('nhận lớp THCS 6–9 khi có môn Toán (bổ sung 2026-10-10)', () => {
    for (const grade of ['6', '7', '8', '9']) {
      const r = LearnerIntentSchema.safeParse({
        ...base,
        subjectIds: ['physics', 'mathematics'],
        grade,
      })
      expect(r.success, grade).toBe(true)
    }
  })

  it('từ chối lớp THCS khi KHÔNG có môn Toán — Lí/Hoá/Sinh chưa có bài THCS', () => {
    const r = LearnerIntentSchema.safeParse({ ...base, subjectIds: ['physics'], grade: '8' })
    expect(r.success).toBe(false)
  })

  it('từ chối lớp ngoài 6–12', () => {
    for (const grade of ['5', '13', '06']) {
      const r = LearnerIntentSchema.safeParse({ ...base, subjectIds: ['mathematics'], grade })
      expect(r.success, grade).toBe(false)
    }
  })

  it('từ chối createdAt không phải số nguyên dương', () => {
    expect(LearnerIntentSchema.safeParse({ ...base, createdAt: 'hôm qua' }).success).toBe(false)
    expect(LearnerIntentSchema.safeParse({ ...base, createdAt: -1 }).success).toBe(false)
    expect(LearnerIntentSchema.safeParse({ ...base, createdAt: 1.5 }).success).toBe(false)
  })

  it('từ chối timeBudget ngoài 5/10/20/30 và level/purpose lạ', () => {
    expect(LearnerIntentSchema.safeParse({ ...base, timeBudget: 15 }).success).toBe(false)
    expect(LearnerIntentSchema.safeParse({ ...base, level: 'gioi' }).success).toBe(false)
    expect(LearnerIntentSchema.safeParse({ ...base, purpose: 'vui' }).success).toBe(false)
  })

  it('từ chối quá 6 môn', () => {
    const r = LearnerIntentSchema.safeParse({
      ...base,
      subjectIds: ['english', 'programming', 'mathematics', 'physics', 'chemistry', 'biology', 'x'],
    })
    expect(r.success).toBe(false)
  })
})

describe('isStemIntentSubject', () => {
  it('đúng cho 4 môn STEM, sai cho môn khác', () => {
    for (const id of STEM_INTENT_SUBJECT_IDS) expect(isStemIntentSubject(id)).toBe(true)
    expect(isStemIntentSubject('english')).toBe(false)
    expect(isStemIntentSubject('programming')).toBe(false)
    expect(isStemIntentSubject('khong-co')).toBe(false)
  })
})
