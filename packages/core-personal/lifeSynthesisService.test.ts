// lifeSynthesisService.test.ts — "Tổng hợp 30 ngày" chỉ nói điều có thật (changelog 0550).
// Mỗi luật câu chữ có ca biên hai phía (ngay dưới ngưỡng → không nói; chạm ngưỡng → nói), cộng
// một phép quét tổ hợp chứng minh không câu nào mang ngôn ngữ chấm điểm (Luật số 1).
import { describe, it, expect, vi } from 'vitest'
import type { Pool } from 'pg'
import {
  LifeSynthesisReportSchema,
  type LearningSummary,
  type NotesSummary,
  type SubjectActivity,
} from '@dhcb/core-contracts/lifeSynthesis'
import { findForbiddenLanguage } from './intakeSuggestion.js'
import {
  ACTIVITY_SQL,
  LAPSE_DAYS,
  NOTES_SQL,
  UNDATED_RECOMMEND_THRESHOLD,
  composeLifeSynthesisReport,
  composeObservations,
  composeRecommendations,
  computeStreak,
  daysBetween,
  formatVnDay,
  generateLifeSynthesisReport,
  readLifeSynthesisSignals,
  summarizeLearning,
  synthesisWindow,
  type ActivityDayRow,
} from './lifeSynthesisService.js'

const TODAY = '2026-10-09'
// 10:00 giờ VN ngày TODAY.
const NOW = new Date('2026-10-09T03:00:00Z')
const WINDOW_START = '2026-09-10'

const NO_NOTES: NotesSummary = {
  totalTasks: 0,
  openTasks: 0,
  overdueTasks: 0,
  dueSoonTasks: 0,
  undatedOpenTasks: 0,
  blockedTasks: 0,
  totalNotes: 0,
  notesCreated: 0,
}

const NO_LEARNING: LearningSummary = {
  activeDays: 0,
  streakDays: 0,
  lastActiveDate: null,
  subjects: [],
}

function notes(patch: Partial<NotesSummary>): NotesSummary {
  return { ...NO_NOTES, totalTasks: 1, openTasks: 1, ...patch }
}

function subject(patch: Partial<SubjectActivity>): SubjectActivity {
  return {
    subjectId: 'english',
    label: 'Tiếng Anh',
    activeDays: 1,
    lastActiveDate: TODAY,
    streakDays: 1,
    completions: null,
    ...patch,
  }
}

function learningOf(...subjects: SubjectActivity[]): LearningSummary {
  return {
    activeDays: Math.max(0, ...subjects.map((s) => s.activeDays)),
    streakDays: Math.max(0, ...subjects.map((s) => s.streakDays)),
    lastActiveDate: subjects[0]?.lastActiveDate ?? null,
    subjects,
  }
}

/** Ngày cách TODAY `n` ngày về trước. */
function ago(n: number): string {
  const d = new Date(`${TODAY}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

const rules = (xs: { ruleId: string }[]) => xs.map((x) => x.ruleId)

describe('synthesisWindow — ranh giới ngày theo giờ Việt Nam', () => {
  it('30 ngày tính cả hôm nay', () => {
    const w = synthesisWindow(NOW)
    expect(w.today).toBe(TODAY)
    expect(w.windowStart).toBe(WINDOW_START)
    expect(daysBetween(w.windowStart, w.today)).toBe(29)
    expect(w.startAt.toISOString()).toBe('2026-09-09T17:00:00.000Z')
    expect(w.endAt.toISOString()).toBe('2026-10-09T17:00:00.000Z')
  })

  it('00:30 giờ VN đã là ngày mới dù UTC còn ngày cũ', () => {
    expect(synthesisWindow(new Date('2026-10-09T17:30:00Z')).today).toBe('2026-10-10')
  })
})

describe('computeStreak', () => {
  it('không có ngày nào → 0', () => {
    expect(computeStreak(new Set(), TODAY)).toBe(0)
  })
  it('chỉ hôm nay → 1', () => {
    expect(computeStreak(new Set([TODAY]), TODAY)).toBe(1)
  })
  it('hôm nay chưa học nhưng hôm qua + hôm kia có → 2 (ngày chưa hết, chuỗi chưa đứt)', () => {
    expect(computeStreak(new Set([ago(1), ago(2)]), TODAY)).toBe(2)
  })
  it('hôm nay và hôm qua đều trống → 0 dù trước đó học dài', () => {
    expect(computeStreak(new Set([ago(2), ago(3), ago(4)]), TODAY)).toBe(0)
  })
  it('một ngày trống ở giữa làm đứt chuỗi', () => {
    expect(computeStreak(new Set([TODAY, ago(1), ago(3)]), TODAY)).toBe(2)
  })
  it('trần là số ngày của cửa sổ', () => {
    const all = new Set(Array.from({ length: 40 }, (_, i) => ago(i)))
    expect(computeStreak(all, TODAY)).toBe(30)
  })
})

describe('summarizeLearning', () => {
  it('rỗng → 0 ngày, không môn, lastActiveDate null (khác 0)', () => {
    expect(summarizeLearning([], TODAY, WINDOW_START)).toEqual(NO_LEARNING)
  })

  it('gộp nhiều nguồn cùng ngày thành MỘT ngày; Tiếng Anh completions null, Lập trình 0 là 0', () => {
    const rows: ActivityDayRow[] = [
      { subjectId: 'english', day: TODAY, completions: 0 },
      { subjectId: 'english', day: ago(1), completions: 0 },
      { subjectId: 'programming', day: ago(3), completions: 0 },
    ]
    const s = summarizeLearning(rows, TODAY, WINDOW_START)
    expect(s.activeDays).toBe(3)
    expect(s.streakDays).toBe(2)
    expect(s.lastActiveDate).toBe(TODAY)
    expect(s.subjects).toEqual([
      {
        subjectId: 'english',
        label: 'Tiếng Anh',
        activeDays: 2,
        lastActiveDate: TODAY,
        streakDays: 2,
        completions: null,
      },
      {
        subjectId: 'programming',
        label: 'Lập trình',
        activeDays: 1,
        lastActiveDate: ago(3),
        streakDays: 0,
        completions: 0,
      },
    ])
  })

  it('cộng số bài hoàn thành qua các ngày; dòng ngoài cửa sổ (kể cả "tương lai") bị bỏ', () => {
    const rows: ActivityDayRow[] = [
      { subjectId: 'mathematics', day: ago(2), completions: 2 },
      { subjectId: 'mathematics', day: ago(5), completions: 1 },
      { subjectId: 'mathematics', day: ago(30), completions: 9 },
      { subjectId: 'mathematics', day: '2026-10-10', completions: 9 },
    ]
    const s = summarizeLearning(rows, TODAY, WINDOW_START)
    expect(s.subjects).toHaveLength(1)
    expect(s.subjects[0]).toMatchObject({ label: 'Toán học', activeDays: 2, completions: 3 })
  })

  it('xếp môn học gần nhất lên đầu, hoà ngày thì môn nhiều ngày hơn', () => {
    const rows: ActivityDayRow[] = [
      { subjectId: 'biology', day: ago(1), completions: 0 },
      { subjectId: 'physics', day: ago(1), completions: 0 },
      { subjectId: 'physics', day: ago(4), completions: 0 },
      { subjectId: 'chemistry', day: TODAY, completions: 0 },
    ]
    const ids = summarizeLearning(rows, TODAY, WINDOW_START).subjects.map((x) => x.subjectId)
    expect(ids).toEqual(['chemistry', 'physics', 'biology'])
  })
})

describe('composeObservations — luật Học tập', () => {
  it('learning.none: không hoạt động → nói thật, không câu mẫu nào khác về học', () => {
    const obs = composeObservations(NO_LEARNING, NO_NOTES, TODAY)
    expect(obs.filter((o) => o.domain === 'learning')).toEqual([
      {
        ruleId: 'learning.none',
        domain: 'learning',
        text: 'Chưa có hoạt động học nào trong 30 ngày qua.',
      },
    ])
  })

  it('learning.subject_streak: 1 ngày → im; 2 ngày → nói', () => {
    const one = composeObservations(learningOf(subject({ streakDays: 1 })), NO_NOTES, TODAY)
    expect(rules(one)).not.toContain('learning.subject_streak')
    const two = composeObservations(
      learningOf(subject({ streakDays: 2, activeDays: 2 })),
      NO_NOTES,
      TODAY,
    )
    expect(two.find((o) => o.ruleId === 'learning.subject_streak')?.text).toBe(
      'Có học Tiếng Anh 2 ngày liên tiếp, tính tới hôm nay.',
    )
  })

  it('chuỗi kết thúc hôm qua thì nói "tính tới hôm qua"; chạm trần 30 thì nói "ít nhất"', () => {
    const y = composeObservations(
      learningOf(subject({ streakDays: 3, activeDays: 3, lastActiveDate: ago(1) })),
      NO_NOTES,
      TODAY,
    )
    expect(y.find((o) => o.ruleId === 'learning.subject_streak')?.text).toContain(
      'tính tới hôm qua',
    )
    const cap = composeObservations(
      learningOf(subject({ streakDays: 30, activeDays: 30 })),
      NO_NOTES,
      TODAY,
    )
    expect(cap.find((o) => o.ruleId === 'learning.subject_streak')?.text).toContain(
      'ít nhất 30 ngày liên tiếp',
    )
  })

  it('learning.streak chỉ khi chuỗi chung DÀI HƠN mọi chuỗi từng môn', () => {
    const same = composeObservations(
      { ...learningOf(subject({ streakDays: 3, activeDays: 3 })), streakDays: 3 },
      NO_NOTES,
      TODAY,
    )
    expect(rules(same)).not.toContain('learning.streak')
    const mixed = composeObservations(
      {
        ...learningOf(
          subject({ streakDays: 1 }),
          subject({ subjectId: 'programming', label: 'Lập trình', lastActiveDate: ago(1) }),
        ),
        streakDays: 2,
      },
      NO_NOTES,
      TODAY,
    )
    expect(mixed.find((o) => o.ruleId === 'learning.streak')?.text).toBe(
      'Có học 2 ngày liên tiếp (xen kẽ các môn), tính tới hôm nay.',
    )
  })

  it('learning.completions: null và 0 → im; 1 → nói', () => {
    const silent = composeObservations(
      learningOf(
        subject({ completions: null }),
        subject({ subjectId: 'programming', label: 'Lập trình', completions: 0 }),
      ),
      NO_NOTES,
      TODAY,
    )
    expect(rules(silent)).not.toContain('learning.completions')
    const one = composeObservations(
      learningOf(subject({ subjectId: 'programming', label: 'Lập trình', completions: 1 })),
      NO_NOTES,
      TODAY,
    )
    expect(one.find((o) => o.ruleId === 'learning.completions')?.text).toBe(
      'Hoàn thành 1 bài Lập trình trong 30 ngày qua.',
    )
  })

  it(`learning.lapsed: vắng ${LAPSE_DAYS - 1} ngày → im; vắng ${LAPSE_DAYS} ngày → nói kèm ngày dd/mm`, () => {
    const six = composeObservations(
      learningOf(subject({ lastActiveDate: ago(LAPSE_DAYS - 1), streakDays: 0 })),
      NO_NOTES,
      TODAY,
    )
    expect(rules(six)).not.toContain('learning.lapsed')
    const seven = composeObservations(
      learningOf(subject({ lastActiveDate: ago(LAPSE_DAYS), streakDays: 0 })),
      NO_NOTES,
      TODAY,
    )
    expect(seven.find((o) => o.ruleId === 'learning.lapsed')?.text).toBe(
      'Đã 7 ngày chưa quay lại Tiếng Anh (lần gần nhất 02/10).',
    )
  })
})

describe('composeObservations — luật Ghi chú', () => {
  it('notes.none: chưa có việc lẫn ghi chú → một câu duy nhất, không câu "0 việc"', () => {
    const obs = composeObservations(NO_LEARNING, NO_NOTES, TODAY).filter(
      (o) => o.domain === 'notes',
    )
    expect(obs).toEqual([
      {
        ruleId: 'notes.none',
        domain: 'notes',
        text: 'Chưa có việc hay ghi chú nào trong Ghi chú.',
      },
    ])
  })

  it('chỉ có ghi chú, không việc → không "notes.none", không "notes.all_closed"', () => {
    const obs = composeObservations(
      NO_LEARNING,
      { ...NO_NOTES, totalNotes: 2, notesCreated: 2 },
      TODAY,
    )
    expect(rules(obs)).toEqual(['learning.none', 'notes.created'])
    expect(obs.at(-1)?.text).toBe('2 ghi chú mới trong 30 ngày qua.')
  })

  it('mỗi số đếm 0 → im; 1 → đúng một câu', () => {
    const zero = composeObservations(NO_LEARNING, notes({}), TODAY)
    expect(rules(zero)).toEqual(['learning.none'])
    const all = composeObservations(
      NO_LEARNING,
      notes({ overdueTasks: 1, dueSoonTasks: 1, undatedOpenTasks: 1, blockedTasks: 1 }),
      TODAY,
    )
    expect(all.filter((o) => o.domain === 'notes').map((o) => o.text)).toEqual([
      '1 việc đã quá hạn.',
      '1 việc đến hạn trong 7 ngày tới (tính cả hôm nay).',
      '1 việc đang mở chưa có hạn.',
      '1 việc đang bị vướng.',
    ])
  })

  it('notes.all_closed: có việc nhưng không còn việc mở', () => {
    const obs = composeObservations(NO_LEARNING, notes({ totalTasks: 4, openTasks: 0 }), TODAY)
    expect(obs.find((o) => o.ruleId === 'notes.all_closed')?.text).toBe(
      'Không còn việc nào đang mở.',
    )
  })
})

describe('composeRecommendations', () => {
  it('không học gì → gợi ý bắt đầu, đích Góc học tập', () => {
    expect(composeRecommendations(NO_LEARNING, NO_NOTES, TODAY)).toEqual([
      {
        ruleId: 'rec.learning_start',
        domain: 'learning',
        text: 'Chọn một môn và học một bài ngắn để bắt đầu.',
        actionLabel: 'Mở Góc học tập',
        target: { kind: 'learning-hub' },
      },
    ])
  })

  it('quá hạn đứng đầu; trùng đích Ghi chú thì chỉ giữ một', () => {
    const recs = composeRecommendations(
      learningOf(subject({})),
      notes({ overdueTasks: 2, undatedOpenTasks: 5 }),
      TODAY,
    )
    expect(rules(recs)).toEqual(['rec.notes_overdue'])
    expect(recs[0]?.text).toBe('Xem lại 2 việc quá hạn: làm tiếp, dời hạn hoặc đánh dấu xong.')
  })

  it(`việc chưa có hạn: ${UNDATED_RECOMMEND_THRESHOLD - 1} → không gợi ý; ${UNDATED_RECOMMEND_THRESHOLD} → gợi ý`, () => {
    const below = composeRecommendations(
      learningOf(subject({})),
      notes({ undatedOpenTasks: UNDATED_RECOMMEND_THRESHOLD - 1 }),
      TODAY,
    )
    expect(rules(below)).toEqual([])
    const at = composeRecommendations(
      learningOf(subject({})),
      notes({ undatedOpenTasks: UNDATED_RECOMMEND_THRESHOLD }),
      TODAY,
    )
    expect(rules(at)).toEqual(['rec.notes_undated'])
  })

  it('chuỗi giữ tới hôm qua → "học tiếp" đúng môn đó, thắng gợi ý quay lại môn vắng', () => {
    const recs = composeRecommendations(
      learningOf(
        subject({ lastActiveDate: ago(1), streakDays: 4, activeDays: 4 }),
        subject({
          subjectId: 'physics',
          label: 'Vật lí',
          lastActiveDate: ago(10),
          streakDays: 0,
          completions: 0,
        }),
      ),
      NO_NOTES,
      TODAY,
    )
    expect(recs).toEqual([
      {
        ruleId: 'rec.learning_continue',
        domain: 'learning',
        text: 'Học tiếp Tiếng Anh hôm nay để nối dài chuỗi 4 ngày.',
        actionLabel: 'Mở Tiếng Anh',
        target: { kind: 'subject', subjectId: 'english' },
      },
    ])
  })

  it('đã học hôm nay → không nhắc "học tiếp"; môn vắng gần nhất được gợi quay lại', () => {
    const recs = composeRecommendations(
      learningOf(
        subject({ streakDays: 3, activeDays: 3 }),
        subject({
          subjectId: 'chemistry',
          label: 'Hóa học',
          lastActiveDate: ago(8),
          streakDays: 0,
        }),
        subject({
          subjectId: 'biology',
          label: 'Sinh học',
          lastActiveDate: ago(20),
          streakDays: 0,
        }),
      ),
      NO_NOTES,
      TODAY,
    )
    expect(recs.map((r) => r.target)).toEqual([{ kind: 'subject', subjectId: 'chemistry' }])
    expect(recs[0]?.text).toBe('Quay lại Hóa học với một bài ngắn.')
  })

  it('không bao giờ quá 3 khuyến nghị', () => {
    const recs = composeRecommendations(
      NO_LEARNING,
      notes({ overdueTasks: 1, undatedOpenTasks: 9 }),
      TODAY,
    )
    expect(recs.length).toBeLessThanOrEqual(3)
    expect(rules(recs)).toEqual(['rec.notes_overdue', 'rec.learning_start'])
  })
})

describe('Luật số 1 — bất biến ngôn ngữ trên MỌI tổ hợp đầu vào', () => {
  // Quét tổ hợp: 6 hình dạng Học tập × 32 hình dạng Ghi chú.
  const learningShapes: LearningSummary[] = [
    NO_LEARNING,
    learningOf(subject({})),
    learningOf(subject({ streakDays: 30, activeDays: 30 })),
    learningOf(subject({ lastActiveDate: ago(29), streakDays: 0 })),
    learningOf(
      subject({ subjectId: 'programming', label: 'Lập trình', completions: 12, streakDays: 5 }),
      subject({
        subjectId: 'mathematics',
        label: 'Toán học',
        completions: 0,
        lastActiveDate: ago(9),
        streakDays: 0,
      }),
    ),
    {
      ...learningOf(
        subject({ lastActiveDate: ago(1) }),
        subject({ subjectId: 'biology', label: 'Sinh học' }),
      ),
      streakDays: 7,
    },
  ]
  const noteShapes: NotesSummary[] = []
  for (let mask = 0; mask < 32; mask++) {
    noteShapes.push({
      totalTasks: mask & 1 ? 10 : 0,
      openTasks: mask & 2 ? 6 : 0,
      overdueTasks: mask & 4 ? 3 : 0,
      dueSoonTasks: mask & 8 ? 2 : 0,
      undatedOpenTasks: mask & 16 ? 4 : 0,
      blockedTasks: mask & 4 ? 1 : 0,
      totalNotes: mask & 8 ? 5 : 0,
      notesCreated: mask & 16 ? 1 : 0,
    })
  }

  it('không câu nào có điểm x/100, phần trăm, xếp hạng, so sánh hay ngôn ngữ khiếm khuyết', () => {
    const texts: string[] = []
    for (const l of learningShapes) {
      for (const n of noteShapes) {
        for (const o of composeObservations(l, n, TODAY)) texts.push(o.text)
        for (const r of composeRecommendations(l, n, TODAY)) texts.push(r.text, r.actionLabel)
      }
    }
    expect(texts.length).toBeGreaterThan(500)
    expect(findForbiddenLanguage(texts)).toEqual([])
  })

  it('hợp đồng strict không có trường điểm số nào', () => {
    const keys = Object.keys(LifeSynthesisReportSchema.shape)
    for (const k of keys) expect(k).not.toMatch(/score|index|probability|percent/i)
  })
})

describe('readLifeSynthesisSignals — đọc CSDL', () => {
  function fakePool(handler: (sql: string, params: unknown[]) => { rows: unknown[] }) {
    const query = vi.fn(async (sql: string, params: unknown[]) => handler(sql, params))
    return { pool: { query } as unknown as Pool, query }
  }

  it('cả hai câu lọc theo userId ($1) và đúng biên cửa sổ', async () => {
    const { pool, query } = fakePool(() => ({ rows: [] }))
    await readLifeSynthesisSignals(pool, 'user-1', NOW)
    expect(query).toHaveBeenCalledTimes(2)
    expect(query).toHaveBeenCalledWith(ACTIVITY_SQL, [
      'user-1',
      '2026-09-09T17:00:00.000Z',
      '2026-10-09T17:00:00.000Z',
      WINDOW_START,
      TODAY,
      Date.parse('2026-09-09T17:00:00.000Z'),
      Date.parse('2026-10-09T17:00:00.000Z'),
    ])
    expect(query).toHaveBeenCalledWith(NOTES_SQL, [
      'user-1',
      '2026-10-08T17:00:00.000Z',
      '2026-10-15T17:00:00.000Z',
      '2026-09-09T17:00:00.000Z',
    ])
  })

  it('chưa có hồ sơ Person (0 dòng) → mọi số Ghi chú là 0 thật; môn lạ bị bỏ qua', async () => {
    const { pool } = fakePool((sql) =>
      sql === ACTIVITY_SQL
        ? {
            rows: [
              { subject_id: 'english', vn_day: TODAY, completions: 0 },
              { subject_id: 'career', vn_day: TODAY, completions: 3 },
            ],
          }
        : { rows: [] },
    )
    const s = await readLifeSynthesisSignals(pool, 'user-1', NOW)
    expect(s.activity).toEqual([{ subjectId: 'english', day: TODAY, completions: 0 }])
    expect(s.notes).toEqual(NO_NOTES)
  })

  it('CSDL lỗi → ném ra, không trả báo cáo bịa', async () => {
    const { pool } = fakePool(() => {
      throw new Error('db down')
    })
    await expect(generateLifeSynthesisReport(pool, 'user-1', NOW)).rejects.toThrow('db down')
  })

  it('dựng báo cáo đầy đủ, hợp lệ theo hợp đồng strict', async () => {
    const { pool } = fakePool((sql) =>
      sql === ACTIVITY_SQL
        ? {
            rows: [
              { subject_id: 'programming', vn_day: ago(1), completions: 1 },
              { subject_id: 'programming', vn_day: TODAY, completions: 0 },
            ],
          }
        : {
            rows: [
              {
                total_tasks: 3,
                open_tasks: 2,
                overdue_tasks: 1,
                due_soon_tasks: 0,
                undated_open_tasks: 1,
                blocked_tasks: 0,
                total_notes: 0,
                notes_created: 0,
              },
            ],
          },
    )
    const report = await generateLifeSynthesisReport(pool, 'user-1', NOW)
    expect(LifeSynthesisReportSchema.parse(report)).toEqual(report)
    expect(report.windowStart).toBe(WINDOW_START)
    expect(report.windowEnd).toBe(TODAY)
    expect(report.learning.streakDays).toBe(2)
    expect(rules(report.observations)).toEqual([
      'learning.subject_streak',
      'learning.completions',
      'notes.overdue',
      'notes.undated',
    ])
    expect(rules(report.recommendations)).toEqual(['rec.notes_overdue'])
  })
})

describe('composeLifeSynthesisReport — tất định', () => {
  it('cùng đầu vào → cùng báo cáo (không ngẫu nhiên, không AI)', () => {
    const signals = {
      activity: [{ subjectId: 'english' as const, day: TODAY, completions: 0 }],
      notes: NO_NOTES,
    }
    expect(composeLifeSynthesisReport(signals, NOW)).toEqual(
      composeLifeSynthesisReport(signals, NOW),
    )
  })
})

describe('formatVnDay', () => {
  it('YYYY-MM-DD → dd/mm', () => {
    expect(formatVnDay('2026-01-05')).toBe('05/01')
  })
})
