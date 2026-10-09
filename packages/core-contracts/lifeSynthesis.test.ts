// lifeSynthesis.test.ts — hợp đồng "Tổng hợp 30 ngày" v2 (changelog 0550).
import { describe, it, expect } from 'vitest'
import {
  LifeSynthesisReportSchema,
  LifeSynthesisResponseSchema,
  SubjectActivitySchema,
  SynthesisTargetSchema,
  type LifeSynthesisReport,
} from './lifeSynthesis.js'

const VALID: LifeSynthesisReport = {
  schemaVersion: 2,
  generatedAt: '2026-10-09T03:00:00.000Z',
  windowDays: 30,
  windowStart: '2026-09-10',
  windowEnd: '2026-10-09',
  learning: {
    activeDays: 3,
    streakDays: 2,
    lastActiveDate: '2026-10-09',
    subjects: [
      {
        subjectId: 'english',
        label: 'Tiếng Anh',
        activeDays: 3,
        lastActiveDate: '2026-10-09',
        streakDays: 2,
        completions: null,
      },
    ],
  },
  notes: {
    totalTasks: 2,
    openTasks: 1,
    overdueTasks: 0,
    dueSoonTasks: 1,
    undatedOpenTasks: 0,
    blockedTasks: 0,
    totalNotes: 0,
    notesCreated: 0,
  },
  observations: [
    {
      ruleId: 'learning.subject_streak',
      domain: 'learning',
      text: 'Có học Tiếng Anh 2 ngày liên tiếp, tính tới hôm nay.',
    },
  ],
  recommendations: [
    {
      ruleId: 'rec.learning_start',
      domain: 'learning',
      text: 'Chọn một môn và học một bài ngắn để bắt đầu.',
      actionLabel: 'Mở Góc học tập',
      target: { kind: 'learning-hub' },
    },
  ],
}

describe('LifeSynthesisReportSchema v2', () => {
  it('nhận báo cáo hợp lệ', () => {
    expect(LifeSynthesisReportSchema.parse(VALID)).toEqual(VALID)
    expect(LifeSynthesisResponseSchema.parse({ report: VALID }).report).toEqual(VALID)
  })

  it('strict: từ chối trường điểm số lạ (vd holisticAlignmentScore của bản v5.4)', () => {
    expect(
      LifeSynthesisReportSchema.safeParse({ ...VALID, holisticAlignmentScore: 88 }).success,
    ).toBe(false)
  })

  it('từ chối bản v5.4 cũ và cửa sổ khác 30 ngày', () => {
    expect(LifeSynthesisReportSchema.safeParse({ ...VALID, schemaVersion: 'v5.4.0' }).success).toBe(
      false,
    )
    expect(LifeSynthesisReportSchema.safeParse({ ...VALID, windowDays: 7 }).success).toBe(false)
  })

  it('từ chối miền đã xoá (career/startup/life) ở môn và ở câu nhận xét', () => {
    expect(
      SubjectActivitySchema.safeParse({ ...VALID.learning.subjects[0], subjectId: 'career' })
        .success,
    ).toBe(false)
    expect(
      LifeSynthesisReportSchema.safeParse({
        ...VALID,
        observations: [{ ruleId: 'learning.none', domain: 'life', text: 'x' }],
      }).success,
    ).toBe(false)
  })

  it('môn có mặt phải có ≥ 1 ngày học; số đếm âm bị từ chối', () => {
    expect(
      SubjectActivitySchema.safeParse({ ...VALID.learning.subjects[0], activeDays: 0 }).success,
    ).toBe(false)
    expect(
      LifeSynthesisReportSchema.safeParse({ ...VALID, notes: { ...VALID.notes, openTasks: -1 } })
        .success,
    ).toBe(false)
  })

  it('tối đa 3 khuyến nghị', () => {
    const rec = VALID.recommendations[0]
    expect(
      LifeSynthesisReportSchema.safeParse({ ...VALID, recommendations: [rec, rec, rec, rec] })
        .success,
    ).toBe(false)
  })

  it('đích khuyến nghị: môn phải là môn có thật', () => {
    expect(SynthesisTargetSchema.safeParse({ kind: 'subject', subjectId: 'english' }).success).toBe(
      true,
    )
    expect(SynthesisTargetSchema.safeParse({ kind: 'subject', subjectId: 'startup' }).success).toBe(
      false,
    )
    expect(SynthesisTargetSchema.safeParse({ kind: 'notes', extra: 1 }).success).toBe(false)
  })
})
