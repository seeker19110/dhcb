// Test thưởng huy hiệu & mốc (migration 0026) — trọng tâm: KHÔNG cấp thưởng khi chưa đạt/đã
// nhận rồi/admin tắt thưởng (đây là chỗ đụng tiền thật, giống quests.test.ts).
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Pool, Client } from 'pg'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))

const granted: { calls: { userId: string; plan: string; days: number }[] } = { calls: [] }
vi.mock('@dhcb/core-billing/planGrant', () => ({
  grantPlanDays: vi.fn(async (userId: string, plan: string, days: number) => {
    granted.calls.push({ userId, plan, days })
    return { plan, planExpiresAt: new Date() }
  }),
}))

const streakMock = vi.fn()
vi.mock('./quests.js', () => ({
  getCurrentStreak: (userId: string) => streakMock(userId),
}))

import {
  getAchievementsStatus,
  claimAchievementReward,
  getAllRewardConfigs,
  upsertRewardConfig,
  invalidateAchievementRewardsCache,
  ACHIEVEMENT_IDS,
} from './achievementRewards'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { grantPlanDays } from '@dhcb/core-billing/planGrant'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

const REWARD_ROWS = [
  { achievement_id: 'streak_7', enabled: true, reward_plan: 'vip', reward_days: 1 },
]

function setupQueryImplementation(overrides: {
  learned?: string[]
  cefrExams?: Record<string, { passed?: boolean }>
  speaking?: number
  writing?: number
  challengeCount?: number
  perfectWeek?: boolean
  claimed?: string[]
  rewardRows?: typeof REWARD_ROWS
  insertRowCount?: number
}) {
  query.mockImplementation(async (sql: string) => {
    if (sql.includes('insert into public.achievement_claims')) {
      return { rowCount: overrides.insertRowCount ?? 1 }
    }
    if (sql.includes('insert into public.achievement_rewards')) {
      return { rowCount: 1 }
    }
    if (sql.includes('select achievement_id, enabled, reward_plan, reward_days')) {
      return { rows: overrides.rewardRows ?? REWARD_ROWS }
    }
    if (sql.includes('select achievement_id from public.achievement_claims')) {
      return { rows: (overrides.claimed ?? []).map((achievement_id) => ({ achievement_id })) }
    }
    if (sql.includes('platform.feature_state'))
      return {
        rows: [
          {
            cefr_exams: Object.fromEntries(
              Object.entries(overrides.cefrExams ?? {}).map(([key, value]) => [
                key,
                { bestPct: 80, attempts: 1, lastAt: '2026-09-27', ...value },
              ]),
            ),
          },
        ],
      }
    if (sql.includes('learning_progress')) {
      return {
        rows: [{ learned: overrides.learned ?? [], cefr_exams: overrides.cefrExams ?? {} }],
      }
    }
    if (sql.includes('speaking_sessions')) {
      return { rows: [{ count: String(overrides.speaking ?? 0) }] }
    }
    if (sql.includes('writing_submissions')) {
      return { rows: [{ count: String(overrides.writing ?? 0) }] }
    }
    if (sql.includes('has_perfect')) {
      return { rows: [{ has_perfect: overrides.perfectWeek ?? false }] }
    }
    if (sql.includes('challenge_entries')) {
      return { rows: [{ count: String(overrides.challengeCount ?? 0) }] }
    }
    throw new Error(`Unexpected SQL in test: ${sql}`)
  })
}

beforeEach(() => {
  query.mockReset()
  streakMock.mockReset()
  streakMock.mockResolvedValue(0)
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
  vi.mocked(grantPlanDays).mockImplementation(async (userId, plan, days) => {
    granted.calls.push({ userId, plan, days })
    return { plan, planExpiresAt: new Date() }
  })
  granted.calls = []
  invalidateAchievementRewardsCache()
})

describe('getAchievementsStatus', () => {
  it('đủ điều kiện streak_7 (server tự tính streak) → earned true', async () => {
    streakMock.mockResolvedValue(7)
    setupQueryImplementation({})
    const items = await getAchievementsStatus('u1')
    const streak7 = items.find((i) => i.id === 'streak_7')
    expect(streak7?.earned).toBe(true)
    expect(streak7?.reward).toEqual({ enabled: true, rewardPlan: 'vip', rewardDays: 1 })
  })

  it('huy hiệu chưa có cấu hình admin → mặc định tắt, 0 ngày', async () => {
    streakMock.mockResolvedValue(0)
    setupQueryImplementation({ rewardRows: [] })
    const items = await getAchievementsStatus('u1')
    const vocab100 = items.find((i) => i.id === 'vocab_100')
    expect(vocab100?.reward).toEqual({ enabled: false, rewardPlan: 'vip', rewardDays: 0 })
  })

  it('trả đủ 19 huy hiệu, đúng huy hiệu đã claimed', async () => {
    setupQueryImplementation({ claimed: ['streak_7'] })
    const items = await getAchievementsStatus('u1')
    expect(items).toHaveLength(ACHIEVEMENT_IDS.length)
    expect(items.find((i) => i.id === 'streak_7')?.claimed).toBe(true)
    expect(items.find((i) => i.id === 'vocab_100')?.claimed).toBe(false)
  })

  it('tính đúng vocab/cefr/speaking/writing/challenge từ dữ liệu server', async () => {
    setupQueryImplementation({
      learned: Array.from({ length: 100 }, (_, i) => `w${i}`),
      cefrExams: { A1: { passed: true }, A2: { passed: false } },
      speaking: 10,
      writing: 10,
      challengeCount: 30,
      perfectWeek: true,
    })
    const items = await getAchievementsStatus('u1')
    expect(items.find((i) => i.id === 'vocab_100')?.earned).toBe(true)
    expect(items.find((i) => i.id === 'vocab_500')?.earned).toBe(false)
    expect(items.find((i) => i.id === 'cefr_a1')?.earned).toBe(true)
    expect(items.find((i) => i.id === 'cefr_a2')?.earned).toBe(false)
    expect(items.find((i) => i.id === 'speak_10')?.earned).toBe(true)
    expect(items.find((i) => i.id === 'write_10')?.earned).toBe(true)
    expect(items.find((i) => i.id === 'challenge_10')?.earned).toBe(true)
    expect(items.find((i) => i.id === 'challenge_30')?.earned).toBe(true)
    expect(items.find((i) => i.id === 'challenge_100')?.earned).toBe(false)
    expect(items.find((i) => i.id === 'challenge_perfect_week')?.earned).toBe(true)
  })
})

describe('claimAchievementReward', () => {
  it('achievementId không hợp lệ → ok:false, không đụng DB', async () => {
    const r = await claimAchievementReward('u1', 'khong-ton-tai')
    expect(r).toEqual({ ok: false, message: 'Huy hiệu không hợp lệ.' })
    expect(query).not.toHaveBeenCalled()
  })

  it('admin chưa bật thưởng cho huy hiệu này → ok:false, không cấp', async () => {
    streakMock.mockResolvedValue(7)
    setupQueryImplementation({ rewardRows: [] })
    const r = await claimAchievementReward('u1', 'streak_7')
    expect(r.ok).toBe(false)
    expect(granted.calls).toEqual([])
  })

  it('đã bật thưởng nhưng CHƯA đạt điều kiện → ok:false, không cấp', async () => {
    streakMock.mockResolvedValue(3) // chưa đủ 7 ngày
    setupQueryImplementation({})
    const r = await claimAchievementReward('u1', 'streak_7')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/chưa đạt/)
    expect(granted.calls).toEqual([])
  })

  it('đủ điều kiện + chưa từng nhận → cấp đúng gói/số ngày, ghi nhận claim', async () => {
    streakMock.mockResolvedValue(7)
    setupQueryImplementation({})
    const r = await claimAchievementReward('u1', 'streak_7')
    expect(r).toEqual({ ok: true, rewardDays: 1, rewardPlan: 'vip' })
    expect(granted.calls).toEqual([{ userId: 'u1', plan: 'vip', days: 1 }])
  })

  it('đã nhận thưởng huy hiệu này rồi (insert conflict) → ok:false, KHÔNG cấp thêm', async () => {
    streakMock.mockResolvedValue(7)
    setupQueryImplementation({ insertRowCount: 0 })
    const r = await claimAchievementReward('u1', 'streak_7')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.message).toMatch(/đã nhận thưởng/)
    expect(granted.calls).toEqual([])
  })

  it('lỗi DB → trả ok:false, KHÔNG ném lỗi ra ngoài', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    query.mockRejectedValue(new Error('db down'))
    const r = await claimAchievementReward('u1', 'streak_7')
    expect(r.ok).toBe(false)
    expect(granted.calls).toEqual([])
    spy.mockRestore()
  })
})

describe('claimAchievementReward — nguyên tử, đồng thời và retry', () => {
  let claimed: boolean
  let daysGranted: number
  let failGrant: boolean
  let lockTail: Promise<void>
  const stagedGrants = new Map<unknown, { days: number }>()

  beforeEach(() => {
    claimed = false
    daysGranted = 0
    failGrant = false
    lockTail = Promise.resolve()
    stagedGrants.clear()
    streakMock.mockResolvedValue(7)
    setupQueryImplementation({})
    vi.mocked(getPgPool().connect).mockImplementation(async () => {
      let unlock: (() => void) | undefined
      let stagedClaim = false
      const staged = { days: 0 }
      const transactionQuery = vi.fn(async (sql: string) => {
        if (sql.includes('insert into public.achievement_claims')) {
          expect(sql).toContain('on conflict (user_id, achievement_id) do nothing')
          const previous = lockTail
          lockTail = new Promise<void>((resolve) => {
            unlock = resolve
          })
          await previous
          stagedClaim = claimed
          if (stagedClaim) return { rows: [], rowCount: 0 }
          stagedClaim = true
          return { rows: [], rowCount: 1 }
        }
        if (sql === 'commit') {
          claimed = stagedClaim
          daysGranted += staged.days
          unlock?.()
        }
        if (sql === 'rollback') unlock?.()
        return { rows: [] }
      })
      const client = Object.assign(new Client(), { query: transactionQuery, release: vi.fn() })
      stagedGrants.set(client, staged)
      return client
    })
    vi.mocked(grantPlanDays).mockImplementation(async (_userId, _plan, days, _now, client) => {
      const staged = stagedGrants.get(client)
      expect(staged).toBeDefined()
      if (failGrant) {
        failGrant = false
        throw new Error('grant failed')
      }
      if (staged) staged.days += days
      return { plan: 'vip', planExpiresAt: null }
    })
  })

  it('hai claim đồng thời và retry chỉ cấp một lần', async () => {
    const results = await Promise.all([
      claimAchievementReward('u1', 'streak_7'),
      claimAchievementReward('u1', 'streak_7'),
    ])
    expect(results.filter((result) => result.ok)).toHaveLength(1)
    expect(claimed).toBe(true)
    expect(daysGranted).toBe(1)
    expect((await claimAchievementReward('u1', 'streak_7')).ok).toBe(false)
    expect(daysGranted).toBe(1)
  })

  it('cấp gói lỗi rollback claim và retry vẫn nhận được thưởng', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      failGrant = true
      expect((await claimAchievementReward('u1', 'streak_7')).ok).toBe(false)
      expect(claimed).toBe(false)
      expect(daysGranted).toBe(0)
      expect((await claimAchievementReward('u1', 'streak_7')).ok).toBe(true)
      expect(daysGranted).toBe(1)
    } finally {
      spy.mockRestore()
    }
  })
})

describe('getAllRewardConfigs / upsertRewardConfig (admin)', () => {
  it('getAllRewardConfigs trả đủ 19 huy hiệu kèm cấu hình', async () => {
    setupQueryImplementation({})
    const rows = await getAllRewardConfigs()
    expect(rows).toHaveLength(ACHIEVEMENT_IDS.length)
    expect(rows.find((r) => r.achievementId === 'streak_7')?.config).toEqual({
      enabled: true,
      rewardPlan: 'vip',
      rewardDays: 1,
    })
  })

  it('upsertRewardConfig achievementId không hợp lệ → throw, không đụng DB', async () => {
    await expect(upsertRewardConfig('khong-ton-tai', { enabled: true })).rejects.toThrow(
      'Huy hiệu không hợp lệ.',
    )
    expect(query).not.toHaveBeenCalled()
  })

  it('upsertRewardConfig hợp lệ → gọi đúng câu lệnh, xoá cache', async () => {
    setupQueryImplementation({})
    await upsertRewardConfig('streak_7', { enabled: false, rewardPlan: 'vip', rewardDays: 5 })
    expect(query.mock.calls[0]?.[0]).toContain('insert into public.achievement_rewards')
    expect(query.mock.calls[0]?.[1]).toEqual(['streak_7', false, 'vip', 5])
  })
})

describe('Ca biên: cache cấu hình thưởng và dữ liệu DB thiếu/NULL', () => {
  it('gọi 2 lần liên tiếp → lần 2 dùng CACHE, không đọc lại bảng cấu hình', async () => {
    streakMock.mockResolvedValue(0)
    setupQueryImplementation({})
    invalidateAchievementRewardsCache()

    await getAchievementsStatus('u1')
    const demLan1 = query.mock.calls.filter(([sql]) =>
      String(sql).includes('select achievement_id, enabled, reward_plan, reward_days'),
    ).length
    await getAchievementsStatus('u1')
    const demLan2 = query.mock.calls.filter(([sql]) =>
      String(sql).includes('select achievement_id, enabled, reward_plan, reward_days'),
    ).length
    expect(demLan1).toBe(1)
    expect(demLan2).toBe(1) // không tăng → cache có hiệu lực
  })

  it('invalidateAchievementRewardsCache() → lần sau đọc lại DB', async () => {
    streakMock.mockResolvedValue(0)
    setupQueryImplementation({})
    invalidateAchievementRewardsCache()
    await getAchievementsStatus('u1')
    invalidateAchievementRewardsCache()
    await getAchievementsStatus('u1')
    const dem = query.mock.calls.filter(([sql]) =>
      String(sql).includes('select achievement_id, enabled, reward_plan, reward_days'),
    ).length
    expect(dem).toBe(2)
  })

  it('learning_progress chưa có dòng nào → vocab = 0, không nổ', async () => {
    streakMock.mockResolvedValue(0)
    invalidateAchievementRewardsCache()
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select achievement_id, enabled, reward_plan, reward_days'))
        return { rows: REWARD_ROWS }
      if (sql.includes('select achievement_id from public.achievement_claims')) return { rows: [] }
      // Mọi truy vấn còn lại (progress/speaking/writing/challenge) đều RỖNG.
      return { rows: [] }
    })
    const items = await getAchievementsStatus('u1')
    expect(items.find((i) => i.id === 'vocab_100')?.earned).toBe(false)
    expect(items).toHaveLength(ACHIEVEMENT_IDS.length)
  })

  it('cột learned trong DB không phải mảng (dữ liệu hỏng) → tính 0 từ, không nổ', async () => {
    streakMock.mockResolvedValue(0)
    invalidateAchievementRewardsCache()
    query.mockImplementation(async (sql: string) => {
      if (sql.includes('select achievement_id, enabled, reward_plan, reward_days'))
        return { rows: REWARD_ROWS }
      if (sql.includes('select achievement_id from public.achievement_claims')) return { rows: [] }
      if (sql.includes('learned'))
        return { rows: [{ learned: 'hong-phai-mang', cefr_exams: null }] }
      return { rows: [] }
    })
    const items = await getAchievementsStatus('u1')
    expect(items.find((i) => i.id === 'vocab_100')?.earned).toBe(false)
  })

  it('getAllRewardConfigs: huy hiệu chưa cấu hình → mặc định tắt, 0 ngày', async () => {
    invalidateAchievementRewardsCache()
    setupQueryImplementation({ rewardRows: [] })
    const configs = await getAllRewardConfigs()
    expect(configs).toHaveLength(ACHIEVEMENT_IDS.length)
    expect(configs[0]?.config).toEqual({ enabled: false, rewardPlan: 'vip', rewardDays: 0 })
  })
})
