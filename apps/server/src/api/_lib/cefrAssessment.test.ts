// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Client, Pool } from 'pg'
import { z } from 'zod'
import {
  assessCefr,
  buildServerExam,
  CEFR_ASSESSMENT_FEATURE,
  readVerifiedCefrExams,
} from './cefrAssessment.js'
import {
  CefrAssessmentGrade,
  CefrAssessmentLevel,
  CefrAssessmentStart,
  CefrExamResult,
} from '@dhcb/core-contracts/cefrAssessment'

const StoredState = z.object({
  exams: z.record(z.string(), CefrExamResult),
  attempt: z
    .object({
      id: z.string(),
      expiresAt: z.number(),
      questions: z.array(z.object({ correct: z.string(), options: z.array(z.string()) })),
    })
    .optional(),
})

/** Fake giữ khóa từ BEGIN đến COMMIT/ROLLBACK, snapshot riêng từng transaction.
 * Không mock withTransaction: kiểm tra source thực sự commit/rollback/release.
 * Đây là kiểm tra logic, không thay cho kiểm chứng locking trên PostgreSQL thật.
 */
function database() {
  const pool = new Pool()
  let committed = new Map<string, unknown>()
  let tail = Promise.resolve()
  let failNextUpdate = false
  const trace: string[] = []
  const releases = vi.fn()
  const key = (user: string, feature = CEFR_ASSESSMENT_FEATURE) => `${user}:${feature}`
  const profile = { plan: 'free', plan_expires_at: null, cefr_unlocked_grandfathered: [] }

  Object.defineProperty(pool, 'connect', {
    value: async () => {
      let staged = new Map<string, unknown>()
      let unlock = () => {}
      const client = Object.assign(new Client(), { release: releases })
      Object.defineProperty(client, 'query', {
        value: async (sql: string, values: unknown[] = []) => {
          trace.push(sql)
          if (sql === 'begin') {
            const waiting = tail
            tail = new Promise<void>((resolve) => {
              unlock = resolve
            })
            await waiting
            staged = structuredClone(committed)
            return { rows: [] }
          }
          if (sql === 'commit') {
            committed = staged
            unlock()
            return { rows: [] }
          }
          if (sql === 'rollback') {
            unlock()
            return { rows: [] }
          }
          const user = z.string().parse(values[0])
          if (sql.includes('public.profiles')) return { rows: [profile] }
          const feature = z.string().parse(values[1])
          const rowKey = key(user, feature)
          if (sql.startsWith('insert into platform.feature_state')) {
            if (!staged.has(rowKey)) staged.set(rowKey, { exams: {} })
            return { rows: [] }
          }
          if (sql.startsWith('select state from platform.feature_state')) {
            expect(sql).toContain('for update')
            return {
              rows: staged.has(rowKey) ? [{ state: structuredClone(staged.get(rowKey)) }] : [],
            }
          }
          if (sql.startsWith('update platform.feature_state')) {
            if (failNextUpdate) {
              failNextUpdate = false
              throw new Error('simulated storage failure')
            }
            staged.set(rowKey, JSON.parse(z.string().parse(values[2])))
            return { rows: [], rowCount: 1 }
          }
          throw new Error(`SQL chưa có fake: ${sql}`)
        },
      })
      return client
    },
  })
  Object.defineProperty(pool, 'query', {
    value: async (sql: string, values: unknown[]) => {
      expect(sql).toContain("state->'exams'")
      const state = committed.get(key(z.string().parse(values[0]), z.string().parse(values[1])))
      return { rows: state ? [{ cefr_exams: StoredState.parse(state).exams }] : [] }
    },
  })

  return {
    pool,
    trace,
    releases,
    state: (user = 'u1') => StoredState.parse(committed.get(key(user))),
    snapshot: () => structuredClone(committed),
    seed: (user: string, feature: string, state: unknown) =>
      committed.set(key(user, feature), state),
    failSave: () => {
      failNextUpdate = true
    },
  }
}

async function start(db: ReturnType<typeof database>, user = 'u1') {
  return CefrAssessmentStart.parse(
    await assessCefr(db.pool, user, { action: 'start', level: 'A1', isA: true }),
  )
}
function correctAnswers(db: ReturnType<typeof database>, user = 'u1') {
  return db.state(user).attempt!.questions.map((question) => question.correct)
}

describe('CEFR — đề thi từ dữ liệu thật', () => {
  it.each(
    CefrAssessmentLevel.options.flatMap((level) => [true, false].map((isA) => ({ level, isA }))),
  )('$level / isA=$isA đủ 24 câu, bốn phần và đáp án hợp lệ', ({ level, isA }) => {
    const questions = buildServerExam(level, isA)
    expect(questions).toHaveLength(24)
    expect(new Set(questions.map((q) => q.key)).size).toBe(24)
    for (const [part, count] of [
      ['vocab', 8],
      ['grammar', 8],
      ['listening', 4],
      ['reading', 4],
    ] as const) {
      expect(questions.filter((q) => q.part === part)).toHaveLength(count)
    }
    for (const question of questions) {
      expect(question.options).toContain(question.correct)
      expect(new Set(question.options).size).toBe(question.options.length)
    }
    expect(
      questions
        .filter((q) => q.part === 'listening')
        .every((q) => q.audioLang === (isA ? 'en-US' : 'vi-VN')),
    ).toBe(true)
  })
})

describe('CEFR — thẩm quyền server, retry và transaction', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-27T12:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('start giấu correct và retry cùng đề đang mở', async () => {
    const db = database()
    const first = await start(db)
    expect(first.questions).toHaveLength(24)
    expect(first.questions.every((q) => !Object.hasOwn(q, 'correct'))).toBe(true)
    expect(await start(db)).toEqual(first)
    expect(db.releases).toHaveBeenCalledTimes(2)
  })

  it('không mở đề cấp bị khóa; rollback cả dòng vừa tạo', async () => {
    const db = database()
    await expect(
      assessCefr(db.pool, 'u1', { action: 'start', level: 'B2', isA: true }),
    ).rejects.toMatchObject({ status: 403 })
    expect(db.snapshot().size).toBe(0)
    expect(db.trace).toContain('rollback')
    expect(db.releases).toHaveBeenCalledTimes(1)
  })

  it('attemptId của người khác không thể dùng để nộp bài', async () => {
    const db = database()
    const exam = await start(db)
    await expect(
      assessCefr(db.pool, 'outsider', {
        action: 'submit',
        attemptId: exam.attemptId,
        answers: correctAnswers(db),
      }),
    ).rejects.toMatchObject({ status: 409 })
    expect(db.state().exams).toEqual({})
    expect(db.snapshot().size).toBe(1)
  })

  it.each(['missing', 'extra', 'forged'])(
    'từ chối câu trả lời %s, không ghi kết quả',
    async (kind) => {
      const db = database()
      const exam = await start(db)
      const answers = correctAnswers(db)
      if (kind === 'missing') answers.pop()
      if (kind === 'extra') answers.push('extra')
      if (kind === 'forged') answers[0] = 'not-an-option'
      await expect(
        assessCefr(db.pool, 'u1', { action: 'submit', attemptId: exam.attemptId, answers }),
      ).rejects.toMatchObject({ status: 400 })
      expect(db.state().exams).toEqual({})
    },
  )

  it('đề hết hạn bị từ chối; mở lại sinh attemptId mới', async () => {
    const db = database()
    const exam = await start(db)
    vi.advanceTimersByTime(60 * 60 * 1000)
    await expect(
      assessCefr(db.pool, 'u1', {
        action: 'submit',
        attemptId: exam.attemptId,
        answers: correctAnswers(db),
      }),
    ).rejects.toMatchObject({ status: 410 })
    expect((await start(db)).attemptId).not.toBe(exam.attemptId)
  })

  it('nộp đồng thời/retry chỉ tăng attempts một lần và trả cùng kết quả', async () => {
    const db = database()
    const exam = await start(db)
    const submission = {
      action: 'submit' as const,
      attemptId: exam.attemptId,
      answers: correctAnswers(db),
    }
    const results = await Promise.all(
      Array.from({ length: 5 }, () => assessCefr(db.pool, 'u1', submission)),
    )
    const grade = CefrAssessmentGrade.parse(results[0])
    expect(grade).toMatchObject({
      passed: true,
      correct: 24,
      pct: 100,
      result: { attempts: 1 },
      cefrUnlocked: ['A1', 'A2'],
    })
    results.forEach((result) => expect(result).toEqual(grade))
    expect(db.state().exams.A1?.attempts).toBe(1)
    expect(db.releases).toHaveBeenCalledTimes(6)
  })

  it('không cho đổi đáp án sau khi đã biết điểm/đáp án chuẩn', async () => {
    const db = database()
    const exam = await start(db)
    const wrong = db
      .state()
      .attempt!.questions.map((q) => q.options.find((option) => option !== q.correct)!)
    const grade = CefrAssessmentGrade.parse(
      await assessCefr(db.pool, 'u1', {
        action: 'submit',
        attemptId: exam.attemptId,
        answers: wrong,
      }),
    )
    expect(grade.passed).toBe(false)
    expect(grade.cefrUnlocked).toEqual(['A1'])
    await expect(
      assessCefr(db.pool, 'u1', {
        action: 'submit',
        attemptId: exam.attemptId,
        answers: correctAnswers(db),
      }),
    ).rejects.toMatchObject({ status: 409 })
    expect(db.state().exams.A1?.attempts).toBe(1)
  })

  it.each([
    { count: 16, passed: false },
    { count: 17, passed: true },
  ])('$count/24 câu đúng → passed=$passed theo ngưỡng 70%', async ({ count, passed }) => {
    const db = database()
    const exam = await start(db)
    const answers = db
      .state()
      .attempt!.questions.map((q, i) =>
        i < count ? q.correct : q.options.find((option) => option !== q.correct)!,
      )
    const grade = CefrAssessmentGrade.parse(
      await assessCefr(db.pool, 'u1', {
        action: 'submit',
        attemptId: exam.attemptId,
        answers,
      }),
    )
    expect(grade.passed).toBe(passed)
    expect(grade.correct).toBe(count)
    expect(grade.result.passed).toBe(passed)
  })

  it('thi lại điểm thấp vẫn giữ lần đỗ tốt nhất, không cộng attempts từ client', async () => {
    const db = database()
    const first = await start(db)
    await assessCefr(db.pool, 'u1', {
      action: 'submit',
      attemptId: first.attemptId,
      answers: correctAnswers(db),
    })
    const second = await start(db)
    expect(second.attemptId).not.toBe(first.attemptId)
    const answers = db
      .state()
      .attempt!.questions.map((q) => q.options.find((option) => option !== q.correct)!)
    const grade = CefrAssessmentGrade.parse(
      await assessCefr(db.pool, 'u1', {
        action: 'submit',
        attemptId: second.attemptId,
        answers,
      }),
    )
    expect(grade.passed).toBe(false)
    expect(grade.result).toMatchObject({ passed: true, bestPct: 100, attempts: 2 })
    expect(grade.cefrUnlocked).toContain('A2')
  })

  it('lỗi lưu rollback; retry vẫn chấm đúng một lần', async () => {
    const db = database()
    const exam = await start(db)
    const before = db.snapshot()
    const submission = {
      action: 'submit' as const,
      attemptId: exam.attemptId,
      answers: correctAnswers(db),
    }
    db.failSave()
    await expect(assessCefr(db.pool, 'u1', submission)).rejects.toThrow('simulated storage failure')
    expect(db.snapshot()).toEqual(before)
    expect(db.trace.at(-1)).toBe('rollback')
    expect(
      CefrAssessmentGrade.parse(await assessCefr(db.pool, 'u1', submission)).result.attempts,
    ).toBe(1)
  })

  it('chỉ đọc kết quả từ namespace server, tách biệt theo user', async () => {
    const db = database()
    db.seed('u1', 'client_state', {
      exams: { C2: { passed: true, bestPct: 100, attempts: 1, lastAt: 'now' } },
    })
    expect(await readVerifiedCefrExams(db.pool, 'u1')).toEqual({})
    const exam = await start(db)
    await assessCefr(db.pool, 'u1', {
      action: 'submit',
      attemptId: exam.attemptId,
      answers: correctAnswers(db),
    })
    expect((await readVerifiedCefrExams(db.pool, 'u1')).A1?.passed).toBe(true)
    expect(await readVerifiedCefrExams(db.pool, 'u2')).toEqual({})
  })
})
