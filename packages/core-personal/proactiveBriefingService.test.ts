// packages/core-personal/proactiveBriefingService.test.ts — audit UI/UX M10 (đợt U5): bản tin chỉ
// nói điều có thật — không mục trụ đã xoá, không số gán cứng, lỗi là lỗi, không khen suông.
import { describe, it, expect, vi } from 'vitest'
import type { Pool } from 'pg'
import { ProactiveBriefingSchema } from '@dhcb/core-contracts/proactiveBriefing'
import {
  composeBriefing,
  generateProactiveBriefing,
  readBriefingSignals,
  resolveBriefingType,
  startOfNextVnDay,
  type BriefingSignals,
} from './proactiveBriefingService.js'

const PERSON_ID = '11111111-1111-4111-8111-111111111111'
const USER_ID = '22222222-2222-4222-8222-222222222222'
// 08:30 giờ VN ngày 18/08/2026.
const MORNING = new Date('2026-08-18T01:30:00Z')
// 20:00 giờ VN ngày 18/08/2026.
const EVENING = new Date('2026-08-18T13:00:00Z')
const NONE: BriefingSignals = { srsDueCount: 0, openTaskCount: 0, dueTaskCount: 0 }

const PAST_MS = Date.now() - 60_000
const FUTURE_MS = Date.now() + 86_400_000

/** Pool giả: trả dữ liệu theo câu SQL, ghi lại tham số để kiểm id truyền vào. */
function fakePool(opts: {
  srs?: Record<string, { due: number }>
  tasks?: { open_count: number; due_count: number }
  failOn?: 'profiles' | 'tasks'
}) {
  const calls: { sql: string; params: unknown[] }[] = []
  const query = vi.fn(async (sql: string, params: unknown[]) => {
    calls.push({ sql, params })
    if (sql.includes('public.profiles')) {
      if (opts.failOn === 'profiles') throw new Error('db down')
      return { rows: [{ onboarded: true, goal: null, daily_minutes: 15 }] }
    }
    if (sql.includes('english.learning_progress')) {
      return {
        rows: [{ learned: [], srs: opts.srs ?? {}, placement: null, updated_at: new Date() }],
      }
    }
    if (sql.includes('worklife.tasks')) {
      if (opts.failOn === 'tasks') throw new Error('db down')
      return { rows: [opts.tasks ?? { open_count: 0, due_count: 0 }] }
    }
    throw new Error(`SQL ngoài dự kiến: ${sql}`)
  })
  return { pool: { query } as unknown as Pool, calls }
}

describe('resolveBriefingType — theo giờ Việt Nam, không theo giờ máy chủ', () => {
  it('trước 17:00 giờ VN là sáng, từ 17:00 là tối', () => {
    expect(resolveBriefingType(undefined, MORNING)).toBe('morning')
    expect(resolveBriefingType(undefined, EVENING)).toBe('evening')
    // 16:59 / 17:00 giờ VN = 09:59 / 10:00 UTC (biên).
    expect(resolveBriefingType(undefined, new Date('2026-08-18T09:59:00Z'))).toBe('morning')
    expect(resolveBriefingType(undefined, new Date('2026-08-18T10:00:00Z'))).toBe('evening')
    // 23:30 UTC = 06:30 sáng hôm sau giờ VN.
    expect(resolveBriefingType(undefined, new Date('2026-08-18T23:30:00Z'))).toBe('morning')
  })

  it('type truyền vào thắng giờ', () => {
    expect(resolveBriefingType('evening', MORNING)).toBe('evening')
  })
})

describe('startOfNextVnDay', () => {
  it('ra 00:00 giờ VN của ngày mai, kể cả khi ngày UTC còn là hôm trước', () => {
    expect(startOfNextVnDay(MORNING).toISOString()).toBe('2026-08-18T17:00:00.000Z')
    // 18:00 UTC ngày 18 = 01:00 ngày 19 giờ VN → mốc là 00:00 ngày 20 giờ VN.
    expect(startOfNextVnDay(new Date('2026-08-18T18:00:00Z')).toISOString()).toBe(
      '2026-08-19T17:00:00.000Z',
    )
  })
})

describe('composeBriefing — chỉ việc thật của Học tập / Ghi chú', () => {
  it('không có việc gì: không mục nào, KHÔNG khen, không nhận định chung chung', () => {
    const b = composeBriefing(PERSON_ID, NONE, 'morning', MORNING)
    expect(b.actionItems).toEqual([])
    expect(b.insights).toEqual([])
    expect(b.summary).toBe(
      'Hôm nay chưa có thẻ ôn hay việc nào đến hạn. Chọn một bài học để bắt đầu nhé.',
    )
    expect(JSON.stringify(b)).not.toMatch(/Tuyệt vời|hoàn thành|chuỗi|mục tiêu trọng tâm/i)
    expect(ProactiveBriefingSchema.safeParse(b).success).toBe(true)
  })

  it('không có việc gì buổi tối: câu trung tính, không khen', () => {
    const b = composeBriefing(PERSON_ID, NONE, 'evening', EVENING)
    expect(b.summary).toBe('Không còn thẻ ôn hay việc nào đến hạn hôm nay. Hẹn bạn ngày mai.')
    expect(b.summary).not.toMatch(/Tuyệt vời|giữ vững/)
  })

  it('chỉ có thẻ ôn: một mục Học tập trỏ đúng route ôn tập, số đúng như dữ liệu', () => {
    const b = composeBriefing(PERSON_ID, { ...NONE, srsDueCount: 4 }, 'morning', MORNING)
    expect(b.actionItems).toHaveLength(1)
    expect(b.actionItems[0]).toMatchObject({
      domain: 'learning',
      route: '/goc-hoc-tap/on-tap',
      priority: 'high',
    })
    expect(b.summary).toBe('Hôm nay có 4 thẻ từ vựng cần ôn.')
  })

  it('biên ưu tiên thẻ ôn: 10 thẻ = high, 11 thẻ = urgent', () => {
    const ten = composeBriefing(PERSON_ID, { ...NONE, srsDueCount: 10 }, 'morning', MORNING)
    const eleven = composeBriefing(PERSON_ID, { ...NONE, srsDueCount: 11 }, 'morning', MORNING)
    expect(ten.actionItems[0]!.priority).toBe('high')
    expect(eleven.actionItems[0]!.priority).toBe('urgent')
  })

  it('việc đến hạn trong Ghi chú thắng "việc đang mở" (không ra hai mục Ghi chú)', () => {
    const b = composeBriefing(
      PERSON_ID,
      { srsDueCount: 3, openTaskCount: 5, dueTaskCount: 2 },
      'evening',
      EVENING,
    )
    expect(b.actionItems.map((i) => i.domain)).toEqual(['learning', 'work'])
    expect(b.actionItems[1]).toMatchObject({ route: '/ghi-chu', priority: 'high' })
    expect(b.summary).toBe(
      'Trước khi kết thúc ngày, còn 3 thẻ từ vựng cần ôn và 2 việc đến hạn trong Ghi chú.',
    )
  })

  it('chỉ có việc đang mở (chưa đến hạn): một mục Ghi chú mức normal', () => {
    const b = composeBriefing(PERSON_ID, { ...NONE, openTaskCount: 3 }, 'morning', MORNING)
    expect(b.actionItems).toHaveLength(1)
    expect(b.actionItems[0]).toMatchObject({ domain: 'work', priority: 'normal' })
    expect(b.summary).toBe('Hôm nay có 3 việc đang mở trong Ghi chú.')
  })

  it('không bao giờ trỏ tới trụ đã xoá (life/career/startup) hay route không tồn tại', () => {
    const b = composeBriefing(
      PERSON_ID,
      { srsDueCount: 20, openTaskCount: 9, dueTaskCount: 9 },
      'morning',
      MORNING,
    )
    for (const item of b.actionItems) {
      expect(['learning', 'work']).toContain(item.domain)
      expect(['/goc-hoc-tap/on-tap', '/ghi-chu']).toContain(item.route)
    }
  })
})

describe('readBriefingSignals / generateProactiveBriefing — đọc dữ liệu thật', () => {
  it('đếm thẻ đến hạn từ SRS + việc Ghi chú; dùng userId cho hồ sơ học, personId cho Ghi chú', async () => {
    const { pool, calls } = fakePool({
      srs: { a: { due: PAST_MS }, b: { due: PAST_MS }, c: { due: FUTURE_MS } },
      tasks: { open_count: 4, due_count: 1 },
    })
    const signals = await readBriefingSignals(
      pool,
      { personId: PERSON_ID, userId: USER_ID },
      MORNING,
    )
    expect(signals).toEqual({ srsDueCount: 2, openTaskCount: 4, dueTaskCount: 1 })
    const profileCall = calls.find((c) => c.sql.includes('public.profiles'))!
    const progressCall = calls.find((c) => c.sql.includes('english.learning_progress'))!
    const taskCall = calls.find((c) => c.sql.includes('worklife.tasks'))!
    // Bản cũ truyền nhầm personId làm userId → luôn 0 thẻ.
    expect(profileCall.params).toEqual([USER_ID])
    expect(progressCall.params).toEqual([USER_ID])
    expect(taskCall.params).toEqual([PERSON_ID, '2026-08-18T17:00:00.000Z'])
  })

  it('CSDL lỗi khi đọc học tập → NÉM lỗi, không bịa số thẻ', async () => {
    const { pool } = fakePool({ failOn: 'profiles' })
    await expect(
      generateProactiveBriefing(pool, { personId: PERSON_ID, userId: USER_ID }, { now: MORNING }),
    ).rejects.toThrow('db down')
  })

  it('CSDL lỗi khi đọc Ghi chú → NÉM lỗi', async () => {
    const { pool } = fakePool({ failOn: 'tasks' })
    await expect(
      generateProactiveBriefing(pool, { personId: PERSON_ID, userId: USER_ID }, { now: MORNING }),
    ).rejects.toThrow('db down')
  })

  it('người mới (chưa có tiến độ, chưa có việc): bản tin hợp lệ, không mục nào, không khen', async () => {
    const { pool } = fakePool({})
    const b = await generateProactiveBriefing(
      pool,
      { personId: PERSON_ID, userId: USER_ID },
      { now: EVENING },
    )
    expect(b.type).toBe('evening')
    expect(b.actionItems).toEqual([])
    expect(b.summary).not.toMatch(/Tuyệt vời/)
    expect(ProactiveBriefingSchema.safeParse(b).success).toBe(true)
  })
})
