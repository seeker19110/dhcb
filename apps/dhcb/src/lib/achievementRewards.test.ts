import { describe, it, expect, vi, beforeEach } from 'vitest'

const headerState: { value: Record<string, string> } = { value: { Authorization: 'Bearer t' } }
vi.mock('@core/authHeader', () => ({
  getAuthHeader: () => headerState.value,
  getStoredToken: () => (headerState.value.Authorization ? 'session:fixture' : null),
}))

import { fetchAchievementRewards, claimAchievementReward } from './achievementRewards'

beforeEach(() => {
  vi.clearAllMocks()
  headerState.value = { Authorization: 'Bearer t' }
})

describe('fetchAchievementRewards', () => {
  it('chưa đăng nhập (không có Authorization) → null, không gọi fetch', async () => {
    headerState.value = {}
    global.fetch = vi.fn() as unknown as typeof fetch
    expect(await fetchAchievementRewards()).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('server trả lỗi → null', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch
    expect(await fetchAchievementRewards()).toBeNull()
  })

  it('server trả danh sách → trả về items', async () => {
    const items = [
      {
        id: 'streak_7',
        earned: true,
        claimed: false,
        reward: { enabled: true, rewardPlan: 'pro', rewardDays: 1 },
      },
    ]
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items }),
    }) as unknown as typeof fetch
    expect(await fetchAchievementRewards()).toEqual(items)
  })

  it('lỗi mạng → null, không ném lỗi', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network')) as unknown as typeof fetch
    expect(await fetchAchievementRewards()).toBeNull()
  })
})

describe('claimAchievementReward', () => {
  it('chưa đăng nhập → null, không gọi fetch', async () => {
    headerState.value = {}
    global.fetch = vi.fn() as unknown as typeof fetch
    expect(await claimAchievementReward('streak_7')).toBeNull()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('claim thành công → trả rewardDays/rewardPlan', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true, rewardDays: 3, rewardPlan: 'vip' }),
    }) as unknown as typeof fetch
    expect(await claimAchievementReward('streak_7')).toEqual({ rewardDays: 3, rewardPlan: 'vip' })
  })

  it('server trả lỗi HTTP → null', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch
    expect(await claimAchievementReward('streak_7')).toBeNull()
  })

  it('claim thất bại (ok:false từ server) → null', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: false }),
    }) as unknown as typeof fetch
    expect(await claimAchievementReward('streak_7')).toBeNull()
  })
})
