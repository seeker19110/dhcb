import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Pool, PoolClient } from 'pg'
import { shuffle } from '@dhcb/core-contracts/shuffle'
import {
  CefrAssessmentQuestion,
  CefrExamResult,
  CefrAssessmentGrade,
} from '@dhcb/core-contracts/cefrAssessment'
import { computeUnlockedLevels } from '@dhcb/core-learner/cefrUnlock'
import { resolvePlan } from '@dhcb/core-billing/plan'
import { withTransaction } from '@dhcb/core-db/transaction'

export const CEFR_ASSESSMENT_FEATURE = 'cefr_assessment_v1'
const StoredQuestion = CefrAssessmentQuestion.extend({ correct: z.string() })
type Question = z.infer<typeof StoredQuestion>
const Attempt = z.object({
  id: z.string().uuid(),
  level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  isA: z.boolean(),
  expiresAt: z.number(),
  questions: z.array(StoredQuestion).min(1).max(24),
  answers: z.array(z.string()).optional(),
  grade: CefrAssessmentGrade.optional(),
})
const State = z.object({
  exams: z.record(z.string(), CefrExamResult).default({}),
  attempt: Attempt.optional(),
})
const Word = z.object({ word: z.string(), vi: z.string() })
const Level = z.object({
  id: z.string(),
  units: z.array(
    z.object({
      id: z.string(),
      vocabCircleIds: z.array(z.string()),
      grammar: z.array(
        z.object({
          id: z.string(),
          quiz: z
            .array(
              z.object({ q: z.string(), options: z.array(z.string()), answer: z.number().int() }),
            )
            .optional(),
        }),
      ),
    }),
  ),
})
const Dialogue = z.object({
  titleVi: z.string(),
  titleEn: z.string(),
  lines: z.array(z.object({ who: z.enum(['A', 'B']), en: z.string(), vi: z.string() })),
})
function readData(name: string): unknown {
  return JSON.parse(
    readFileSync(join(process.cwd(), 'apps/dhcb/public/data', name + '.json'), 'utf8'),
  )
}
let bank: ReturnType<typeof loadBank> | undefined
function loadBank() {
  return {
    levels: z.array(Level).parse(readData('cefr')),
    circles: z
      .array(z.object({ id: z.string(), words: z.array(Word) }))
      .parse(readData('curriculum')),
    dialogues: z.record(z.string(), z.array(Dialogue)).parse(readData('dialogues')),
  }
}
/** Cùng bốn phần và ngưỡng của bài thi hiện hành; chỉ lấy dữ liệu do repo cung cấp. */
export function buildServerExam(levelId: string, isA: boolean): Question[] {
  bank ??= loadBank()
  const level = bank.levels.find((l) => l.id === levelId)
  if (!level) throw new AssessmentError(400, 'Cấp CEFR không hợp lệ')
  const circleIds = new Set(level.units.flatMap((u) => u.vocabCircleIds))
  const words = Array.from(
    new Map(
      bank.circles
        .filter((c) => circleIds.has(c.id))
        .flatMap((c) => c.words)
        .map((w) => [w.word, w]),
    ).values(),
  )
  const questions: Question[] = []
  const options = (answer: string, pool: string[]) =>
    shuffle([answer, ...shuffle([...new Set(pool.filter((v) => v && v !== answer))]).slice(0, 3)])
  shuffle(words)
    .slice(0, 8)
    .forEach((w, i) => {
      const correct = i % 2 === 0 ? w.vi : w.word
      questions.push({
        key: `v-${i}`,
        part: 'vocab',
        promptKind: 'text',
        prompt: i % 2 === 0 ? w.word : w.vi,
        correct,
        options: options(
          correct,
          words.map((x) => (i % 2 === 0 ? x.vi : x.word)),
        ),
      })
    })
  const grammar = level.units.flatMap((u) =>
    u.grammar.flatMap((g) => (g.quiz ?? []).map((item) => ({ lessonId: g.id, item }))),
  )
  shuffle(grammar)
    .slice(0, 8)
    .forEach(({ lessonId, item }, i) => {
      const correct = item.options[item.answer]
      if (correct)
        questions.push({
          key: `g-${i}`,
          part: 'grammar',
          promptKind: 'text',
          prompt: item.q,
          lessonId,
          correct,
          options: shuffle([...new Set(item.options)]),
        })
    })
  shuffle(words)
    .slice(0, 4)
    .forEach((w, i) => {
      const correct = isA ? w.vi : w.word
      questions.push({
        key: `l-${i}`,
        part: 'listening',
        promptKind: 'audio',
        prompt: '',
        audioText: isA ? w.word : w.vi,
        audioLang: isA ? 'en-US' : 'vi-VN',
        correct,
        options: options(
          correct,
          words.map((x) => (isA ? x.vi : x.word)),
        ),
      })
    })
  const dialogues = level.units
    .flatMap((u) => bank!.dialogues[u.id] ?? [])
    .filter((d) => d.lines.length >= 3)
  shuffle(dialogues)
    .slice(0, 4)
    .forEach((d, i) => {
      const line = shuffle(d.lines)[0]!
      const correct = isA ? line.vi : line.en
      questions.push({
        key: `r-${i}`,
        part: 'reading',
        promptKind: 'text',
        prompt: isA ? line.en : line.vi,
        correct,
        options: options(
          correct,
          dialogues.flatMap((x) => x.lines.map((l) => (isA ? l.vi : l.en))),
        ),
        passage: {
          titleVi: d.titleVi,
          titleEn: d.titleEn,
          lines: d.lines.map((l) => ({ who: l.who, text: isA ? l.en : l.vi })),
        },
      })
    })
  // Không cấp quyền từ đề thiếu một phần hoặc thiếu lựa chọn hợp lệ.
  if (questions.length !== 24 || questions.some((q) => q.options.length < 2))
    throw new AssessmentError(503, 'Chưa đủ dữ liệu đề thi. Vui lòng thử lại sau.')
  return z.array(StoredQuestion).parse(shuffle(questions))
}
export class AssessmentError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
export async function readVerifiedCefrExams(runner: Pick<PoolClient, 'query'>, userId: string) {
  const { rows } = await runner.query<{ cefr_exams: unknown }>(
    `select state->'exams' as cefr_exams from platform.feature_state where user_id=$1 and feature=$2`,
    [userId, CEFR_ASSESSMENT_FEATURE],
  )
  return z.record(z.string(), CefrExamResult).parse(rows[0]?.cefr_exams ?? {})
}
async function unlocked(client: PoolClient, userId: string, exams: Record<string, unknown>) {
  const { rows } = await client.query<{
    plan: string | null
    plan_expires_at: Date | null
    cefr_unlocked_grandfathered: string[] | null
  }>(
    `select p.plan,p.plan_expires_at,lp.cefr_unlocked_grandfathered from public.profiles p left join english.learning_progress lp on lp.user_id=p.id where p.id=$1`,
    [userId],
  )
  return computeUnlockedLevels({
    plan: resolvePlan(rows[0]?.plan, rows[0]?.plan_expires_at),
    exams,
    grandfathered: rows[0]?.cefr_unlocked_grandfathered,
  })
}
export async function assessCefr(
  pool: Pool,
  userId: string,
  request:
    | { action: 'start'; level: z.infer<typeof Attempt>['level']; isA: boolean }
    | { action: 'submit'; attemptId: string; answers: string[] },
) {
  return withTransaction(pool, async (client) => {
    await client.query(
      `insert into platform.feature_state(user_id,feature,state) values($1,$2,'{"exams":{}}'::jsonb) on conflict do nothing`,
      [userId, CEFR_ASSESSMENT_FEATURE],
    )
    const { rows } = await client.query<{ state: unknown }>(
      `select state from platform.feature_state where user_id=$1 and feature=$2 for update`,
      [userId, CEFR_ASSESSMENT_FEATURE],
    )
    const state = State.parse(rows[0]?.state ?? { exams: {} })
    const now = Date.now()
    if (request.action === 'start') {
      if (!(await unlocked(client, userId, state.exams)).includes(request.level))
        throw new AssessmentError(403, 'Cấp này chưa được mở khóa')
      const old = state.attempt
      if (
        !old ||
        old.grade ||
        old.expiresAt <= now ||
        old.level !== request.level ||
        old.isA !== request.isA
      )
        state.attempt = {
          id: randomUUID(),
          level: request.level,
          isA: request.isA,
          expiresAt: now + 60 * 60 * 1000,
          questions: buildServerExam(request.level, request.isA),
        }
      await save(client, userId, state)
      const a = state.attempt!
      return {
        attemptId: a.id,
        expiresAt: a.expiresAt,
        questions: a.questions.map((q) => CefrAssessmentQuestion.parse(q)),
      }
    }
    const a = state.attempt
    if (!a || a.id !== request.attemptId)
      throw new AssessmentError(409, 'Bài thi không còn hiệu lực. Hãy mở đề mới.')
    if (a.grade) {
      if (JSON.stringify(a.answers) !== JSON.stringify(request.answers))
        throw new AssessmentError(409, 'Bài thi đã được nộp')
      return a.grade
    }
    if (a.expiresAt <= now)
      throw new AssessmentError(410, 'Bài thi đã hết thời gian. Hãy mở đề mới.')
    if (
      request.answers.length !== a.questions.length ||
      request.answers.some((answer, i) => !a.questions[i]!.options.includes(answer))
    )
      throw new AssessmentError(400, 'Cần trả lời đủ các câu trong đề thi')
    const correct = a.questions.filter((q, i) => q.correct === request.answers[i]).length
    const pct = Math.round((correct / a.questions.length) * 100)
    const previous = state.exams[a.level]
    const result = {
      passed: previous?.passed === true || pct >= 70,
      bestPct: Math.max(previous?.bestPct ?? 0, pct),
      attempts: (previous?.attempts ?? 0) + 1,
      lastAt: new Date(now).toISOString(),
    }
    state.exams[a.level] = result
    a.answers = request.answers
    a.grade = {
      pct,
      passed: pct >= 70,
      correct,
      total: a.questions.length,
      correctAnswers: a.questions.map((q) => q.correct),
      result,
      cefrUnlocked: await unlocked(client, userId, state.exams),
    }
    await save(client, userId, state)
    return a.grade
  })
}
async function save(client: PoolClient, userId: string, state: z.infer<typeof State>) {
  await client.query(
    'update platform.feature_state set state=$3::jsonb,updated_at=now() where user_id=$1 and feature=$2',
    [userId, CEFR_ASSESSMENT_FEATURE, JSON.stringify(state)],
  )
}
