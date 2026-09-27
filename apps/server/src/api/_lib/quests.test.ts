import { Pool, Client } from 'pg'
// Test nhiệm vụ "Chia sẻ công khai" — trọng tâm: KHÔNG cấp được 2 lần trong cùng cửa sổ hồi
// (7 ngày), đây là chỗ đụng tiền thật (grantPlanDays).
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const granted: { calls: { userId: string; plan: string; days: number }[] } = { calls: [] }
vi.mock('@dhcb/core-billing/planGrant', () => ({
  grantPlanDays: vi.fn(async (userId: string, plan: string, days: number) => {
    granted.calls.push({ userId, plan, days })
    return { plan, planExpiresAt: new Date() }
  }),
}))

vi.mock('./referral.js', () => ({
  getReferralStats: async () => ({
    code: 'ABC123',
    rewardedCount: 0,
    pendingCount: 0,
    maxRewarded: 10,
    rewardDays: 7,
  }),
}))

import {
  claimShareQuest,
  claimStreakQuest,
  claimCefrExamQuest,
  getCurrentStreak,
  getQuestsStatus,
  CEFR_EXAM_QUEST_REWARD_DAYS,
} from './quests'
import { vnDateStr, addDays } from '@dhcb/core-db/date'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { grantPlanDays } from '@dhcb/core-billing/planGrant'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

beforeEach(() => {
  query.mockReset()
  const client = Object.assign(new Client(), {
    query: vi.fn((sql: string, params?: unknown[]) =>
      ['begin', 'commit', 'rollback'].includes(sql)
        ? Promise.resolve({ rows: [] })
        : query(sql, params),
    ),
    release: vi.fn(),
  })
  mockedGetPool.mockReturnValue(
    Object.assign(new Pool(), { query, connect: vi.fn(async () => client) }),
  )
  granted.calls = []
})

describe('thưởng từ dữ liệu client tự khai', () => {
  it.each([claimShareQuest, claimStreakQuest])(
    'từ chối dù cooldown và dữ liệu cũ đủ điều kiện',
    async (claim) => {
      query.mockResolvedValue({ rows: [{ claim_quest_if_ready: true }] })
      const result = await claim('u1')
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.message).toMatch(/xác minh/)
      expect(query).not.toHaveBeenCalled()
      expect(granted.calls).toEqual([])
    },
  )
})

describe('getCurrentStreak', () => {
  it('có đủ ngày liên tiếp gần nhất (kể cả hôm nay) → đếm đúng', async () => {
    const today = vnDateStr()
    query.mockResolvedValueOnce({
      rows: [{ day: today }, { day: addDays(today, -1) }, { day: addDays(today, -2) }],
    })
    expect(await getCurrentStreak('u1')).toBe(3)
  })

  it('đứt quãng (thiếu 1 ngày ở giữa) → chỉ đếm từ hôm nay lùi tới chỗ đứt', async () => {
    const today = vnDateStr()
    query.mockResolvedValueOnce({
      rows: [{ day: today }, { day: addDays(today, -3) }], // thiếu hôm qua, hôm kia
    })
    expect(await getCurrentStreak('u1')).toBe(1)
  })

  it('hôm nay chưa học → streak = 0 dù hôm qua có học', async () => {
    const today = vnDateStr()
    query.mockResolvedValueOnce({ rows: [{ day: addDays(today, -1) }] })
    expect(await getCurrentStreak('u1')).toBe(0)
  })
})

describe('claimCefrExamQuest', () => {
  it('chưa thi đạt cấp → không cấp, không gọi hàm SQL claim', async () => {
    query.mockResolvedValueOnce({ rows: [{ cefr_exams: { A1: { passed: false } } }] })
    const r = await claimCefrExamQuest('u1', 'A1')
    expect(r.ok).toBe(false)
    expect(granted.calls).toEqual([])
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('đã thi đạt cấp → cấp thưởng', async () => {
    query.mockResolvedValueOnce({
      rows: [{ cefr_exams: { A1: { passed: true } } }],
    })
    query.mockResolvedValueOnce({ rows: [{ claim_quest_if_ready: true }] })
    const r = await claimCefrExamQuest('u1', 'A1')
    expect(r).toEqual({ ok: true, rewardDays: CEFR_EXAM_QUEST_REWARD_DAYS })
  })

  it('không đọc kết quả tự khai trong learning_progress để cấp VIP', async () => {
    query.mockImplementation((sql: string) =>
      Promise.resolve({
        rows: sql.includes('english.learning_progress')
          ? [{ cefr_exams: { A1: { passed: true } } }]
          : [],
      }),
    )
    expect((await claimCefrExamQuest('u1', 'A1')).ok).toBe(false)
    expect(granted.calls).toEqual([])
    expect(query).toHaveBeenCalledTimes(1)
    expect(query.mock.calls[0]?.[0]).toContain("feature = 'cefr_assessment_v1'")
  })

  it('kho chấm thi server chưa có dòng nào → coi như chưa đạt, không throw', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    const r = await claimCefrExamQuest('u1', 'A1')
    expect(r.ok).toBe(false)
  })
})

describe('getQuestsStatus', () => {
  it('gộp đủ 4 mục (share/streak/cefrExams/referral), streak/cefr đọc lại từ DB', async () => {
    const today = vnDateStr()
    query.mockImplementation((sql: string) => {
      if (sql.includes('from public.quest_claims')) return Promise.resolve({ rows: [] })
      if (sql.includes('from public.free_daily_credit'))
        return Promise.resolve({ rows: [{ day: today }] })
      if (sql.includes('from platform.feature_state'))
        return Promise.resolve({
          rows: [{ cefr_exams: { A1: { passed: true } } }],
        })
      return Promise.resolve({ rows: [] })
    })
    const status = await getQuestsStatus('u1')
    expect(status.streak.current).toBe(1)
    expect(status.cefrExams.find((e) => e.level === 'A1')?.passed).toBe(true)
    expect(status.cefrExams.find((e) => e.level === 'A2')?.passed).toBe(false)
    expect(status.referral.code).toBe('ABC123')
    expect(status.share.rewardDays).toBe(0)
    expect(status.share.canClaim).toBe(false)
    expect(status.streak.rewardDays).toBe(0)
    expect(status.streak.canClaim).toBe(false)
  })
})

describe('nhận thưởng — nguyên tử và đồng thời', () => {
  let claimed: boolean
  let grantedDays: number
  let failGrant: boolean
  let lockTail: Promise<void>
  const transactions = new Map<unknown, { days: number }>()

  beforeEach(() => {
    claimed = false
    grantedDays = 0
    failGrant = false
    lockTail = Promise.resolve()
    transactions.clear()
    const connect = vi.fn(async () => {
      let unlock: (() => void) | undefined
      let stagedClaimed = false
      const staged = { days: 0 }
      const query = vi.fn(async (sql: string) => {
        if (sql.includes('claim_quest_if_ready')) {
          const previous = lockTail
          lockTail = new Promise<void>((resolve) => {
            unlock = resolve
          })
          await previous
          const allowed = !claimed
          stagedClaimed = true
          return { rows: [{ claim_quest_if_ready: allowed }] }
        }
        if (sql === 'commit') {
          claimed = stagedClaimed
          grantedDays += staged.days
          unlock?.()
        }
        if (sql === 'rollback') unlock?.()
        return { rows: [] }
      })
      const client = Object.assign(new Client(), { query, release: vi.fn() })
      transactions.set(client, staged)
      return client
    })
    query.mockResolvedValue({ rows: [{ cefr_exams: { A1: { passed: true } } }] })
    mockedGetPool.mockReturnValue(Object.assign(new Pool(), { query, connect }))
    vi.mocked(grantPlanDays).mockImplementation(async (_userId, _plan, days, _now, client) => {
      const staged = transactions.get(client)
      expect(staged).toBeDefined()
      if (failGrant) {
        failGrant = false
        throw new Error('grant failed')
      }
      if (staged) staged.days += days
      return { plan: 'vip', planExpiresAt: null }
    })
  })

  it('hai yêu cầu đồng thời chỉ một lần nhận và cấp thưởng', async () => {
    const results = await Promise.all([
      claimCefrExamQuest('u1', 'A1'),
      claimCefrExamQuest('u1', 'A1'),
    ])
    expect(results.filter((result) => result.ok)).toHaveLength(1)
    expect(claimed).toBe(true)
    expect(grantedDays).toBe(CEFR_EXAM_QUEST_REWARD_DAYS)
  })

  it('grant thất bại rollback claim, retry còn nhận được thưởng', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      failGrant = true
      expect((await claimCefrExamQuest('u1', 'A1')).ok).toBe(false)
      expect(claimed).toBe(false)
      expect(grantedDays).toBe(0)
      expect((await claimCefrExamQuest('u1', 'A1')).ok).toBe(true)
      expect(claimed).toBe(true)
      expect(grantedDays).toBe(CEFR_EXAM_QUEST_REWARD_DAYS)
      expect((await claimCefrExamQuest('u1', 'A1')).ok).toBe(false)
      expect(grantedDays).toBe(CEFR_EXAM_QUEST_REWARD_DAYS)
    } finally {
      spy.mockRestore()
    }
  })
})
