// Test TÍCH HỢP trên Postgres THẬT cho "Thẻ hôm nay" (GĐ4a, changelog 0629).
//
// VÌ SAO PHẢI LÀ DB THẬT: trần 3 thẻ/ngày và "không trùng loại" do HAI ràng buộc duy nhất của
// migration 0097 giữ khi hai request đầu ngày đua nhau — pool giả không có ràng buộc nên không
// chứng minh được. Job `unit` của CI KHÔNG có Postgres ⇒ test tự BỎ QUA khi thiếu `DATABASE_URL`
// (khuôn `personErasureService.integration.test.ts`).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Pool } from 'pg'
import { getTodayCards, recordCardFeedback, readCardPreferences } from './companionDailyCards.js'

const DATABASE_URL = process.env.DATABASE_URL

async function seedLearner(pool: Pool): Promise<{ userId: string; personId: string }> {
  const tag = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const user = await pool.query<{ id: string }>(
    `insert into public.users (email) values ($1) returning id`,
    [`daily-cards-0629-${tag}@example.test`],
  )
  const userId = user.rows[0]!.id
  await pool.query(
    `insert into public.profiles (id, goal, daily_minutes) values ($1, 'ielts', 20)
     on conflict (id) do update set goal = excluded.goal, daily_minutes = excluded.daily_minutes`,
    [userId],
  )
  const due = Date.now() - 60_000
  await pool.query(
    `insert into english.learning_progress (user_id, srs) values ($1, $2::jsonb)
     on conflict (user_id) do update set srs = excluded.srs`,
    [userId, JSON.stringify({ 'w:a': { due }, 'w:b': { due } })],
  )
  const person = await pool.query<{ id: string }>(
    `insert into personal.persons (user_id, display_name) values ($1, 'Người học') returning id`,
    [userId],
  )
  const personId = person.rows[0]!.id
  await pool.query(
    `insert into worklife.tasks (id, person_id, title, priority, status, due_at)
     values (gen_random_uuid(), $1, 'Nộp bài', 'high', 'todo', now() - interval '1 hour')`,
    [personId],
  )
  return { userId, personId }
}

describe.skipIf(!DATABASE_URL)('companionDailyCards — Postgres thật', () => {
  let pool: Pool
  const userIds: string[] = []

  beforeAll(() => {
    pool = new Pool({ connectionString: DATABASE_URL })
  })

  afterAll(async () => {
    if (userIds.length > 0) {
      await pool.query('delete from public.users where id = any($1::uuid[])', [userIds])
    }
    await pool.end()
  })

  it('5 request đầu ngày chạy song song ⇒ tổng ≤ 3 thẻ, không trùng loại, cùng một bộ', async () => {
    const subject = await seedLearner(pool)
    userIds.push(subject.userId)
    const results = await Promise.all(Array.from({ length: 5 }, () => getTodayCards(pool, subject)))
    const stored = await pool.query<{ kind: string; position: number }>(
      `select kind, position from personal.companion_daily_cards where person_id = $1`,
      [subject.personId],
    )
    expect(stored.rows.length).toBeGreaterThan(0)
    expect(stored.rows.length).toBeLessThanOrEqual(3)
    const kinds = stored.rows.map((r) => r.kind)
    expect(new Set(kinds).size).toBe(kinds.length)
    // Thứ tự gốc: thẻ ôn (2 thẻ đến hạn) → việc quá hạn → mục tiêu IELTS chưa học hôm nay.
    expect(kinds.sort()).toEqual(['due_tasks', 'learning_goal', 'review_due'])
    const ids = results.map((r) => r.cards.map((c) => c.id).join(','))
    expect(new Set(ids.filter((s) => s.length > 0)).size).toBeLessThanOrEqual(1)
  })

  it('👎 ghi sở thích thật; xoá người ⇒ thẻ + sở thích mất theo (cascade)', async () => {
    const subject = await seedLearner(pool)
    userIds.push(subject.userId)
    const { cards } = await getTodayCards(pool, subject)
    const first = cards[0]!
    await recordCardFeedback(pool, subject.personId, first.id, 'down')
    const prefs = await readCardPreferences(pool, subject.personId)
    expect(prefs.get(first.kind)).toMatchObject({ upCount: 0, downCount: 1 })
    expect(prefs.get(first.kind)?.mutedUntil).toBeInstanceOf(Date)

    await pool.query('delete from personal.persons where id = $1', [subject.personId])
    const left = await pool.query<{ n: number }>(
      `select (select count(*) from personal.companion_daily_cards where person_id = $1)::int
            + (select count(*) from personal.companion_card_preferences where person_id = $1)::int
              as n`,
      [subject.personId],
    )
    expect(left.rows[0]?.n).toBe(0)
  })
})
