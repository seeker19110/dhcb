// Test /api/admin-achievement-rewards — chặn quyền non-admin, GET/PUT gọi đúng hàm.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))
vi.mock('@dhcb/core-auth/adminAuth', () => ({
  isAdminUser: (userId: string | null | undefined) => userId === 'user-1',
}))

const getAllMock = vi.fn()
const upsertMock = vi.fn()
vi.mock('../_lib/achievementRewards.js', () => ({
  getAllRewardConfigs: () => getAllMock(),
  upsertRewardConfig: (id: string, patch: unknown) => upsertMock(id, patch),
  ACHIEVEMENT_IDS: ['streak_7', 'vocab_100', 'cefr_a1'],
  supportsPaidReward: (id: string) => id.startsWith('cefr_'),
}))

import handler from './admin-achievement-rewards.js'

beforeEach(() => {
  authState.user = { userId: 'user-1' }
  getAllMock.mockReset()
  upsertMock.mockReset()
})

describe('quyền truy cập', () => {
  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    const res = await handler(new Request('http://localhost/api/admin-achievement-rewards'))
    expect(res.status).toBe(401)
  })

  it('không phải admin → 403', async () => {
    authState.user = { userId: 'non-admin' }
    const res = await handler(new Request('http://localhost/api/admin-achievement-rewards'))
    expect(res.status).toBe(403)
  })
})

describe('GET /api/admin-achievement-rewards', () => {
  it('admin → 200, trả toàn bộ cấu hình', async () => {
    getAllMock.mockResolvedValue([
      { achievementId: 'streak_7', config: { enabled: true, rewardPlan: 'vip', rewardDays: 1 } },
    ])
    const res = await handler(new Request('http://localhost/api/admin-achievement-rewards'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      rewards: [
        { achievementId: 'streak_7', config: { enabled: true, rewardPlan: 'vip', rewardDays: 1 } },
      ],
    })
  })
})

describe('PUT /api/admin-achievement-rewards', () => {
  function putRequest(body: unknown): Request {
    return new Request('http://localhost/api/admin-achievement-rewards', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  it('body thiếu achievementId → 400, không gọi upsert', async () => {
    const res = await handler(putRequest({ enabled: true }))
    expect(res.status).toBe(400)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('achievementId không hợp lệ → 400', async () => {
    const res = await handler(putRequest({ achievementId: 'unknown_id' }))
    expect(res.status).toBe(400)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it.each([{ enabled: true }, { rewardDays: 1 }])(
    'không bật thưởng từ huy hiệu thiếu bằng chứng tin cậy %#',
    async (patch) => {
      const res = await handler(putRequest({ achievementId: 'streak_7', ...patch }))
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({
        error: 'Chỉ huy hiệu CEFR đã xác minh được hỗ trợ thưởng VIP.',
      })
      expect(upsertMock).not.toHaveBeenCalled()
    },
  )

  it('body hợp lệ → gọi upsertRewardConfig đúng tham số, trả ok', async () => {
    const res = await handler(
      putRequest({ achievementId: 'cefr_a1', enabled: false, rewardPlan: 'vip', rewardDays: 5 }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(upsertMock).toHaveBeenCalledWith('cefr_a1', {
      enabled: false,
      rewardPlan: 'vip',
      rewardDays: 5,
    })
  })
})
