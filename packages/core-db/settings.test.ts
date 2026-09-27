import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getAppSettings, isSubjectEnforced, invalidateSettingsCache } from './settings.js'

const queryMock = vi.fn()
vi.mock('./pgPool.js', () => ({
  getPgPool: () => ({ query: (...args: unknown[]) => queryMock(...args) }),
}))

beforeEach(() => {
  queryMock.mockReset()
  invalidateSettingsCache()
})

describe('settings — getAppSettings', () => {
  it('đọc từ DB thành công và cache lại trong TTL', async () => {
    const mockRow = {
      pro_daily_limit: 200,
      vip_daily_limit: 2000,
      promo_until: new Date('2026-12-31T00:00:00.000Z'),
      ai_circuit_breaker: true,
      leaderboard_enabled: true,
      updated_at: new Date('2026-08-18T00:00:00.000Z'),
    }
    queryMock.mockResolvedValue({ rows: [mockRow] })

    const res1 = await getAppSettings()
    expect(res1.limits.free).toBe(200)
    expect(res1.limits.vip).toBe(2000)
    expect(res1.promoUntil).toBe('2026-12-31T00:00:00.000Z')
    expect(res1.aiCircuitBreaker).toBe(true)
    expect(res1.leaderboardEnabled).toBe(true)

    // Lần 2 lấy từ cache, không gọi lại DB
    const res2 = await getAppSettings()
    expect(res2).toEqual(res1)
    expect(queryMock).toHaveBeenCalledTimes(1)
  })

  it('DB không có dòng nào (rows rỗng) → trả giá trị mặc định', async () => {
    queryMock.mockResolvedValue({ rows: [] })

    const res = await getAppSettings()
    expect(res.limits.free).toBe(30)
    expect(res.limits.vip).toBe(300)
    expect(res.promoUntil).toBeNull()
  })

  it('DB ném lỗi → fallback chỉ để hiển thị', async () => {
    queryMock.mockRejectedValue(new Error('connection timeout'))

    const res = await getAppSettings()
    expect(res.limits.free).toBe(30)
    expect(res.limits.vip).toBe(300)
  })
})

describe('settings — cổng chi phí', () => {
  it('không cho fallback hiển thị đầu độc cache authoritative', async () => {
    queryMock.mockResolvedValue({ rows: [] })
    await getAppSettings()
    await expect(getAppSettings({ requireAvailable: true })).rejects.toThrow()
    expect(queryMock).toHaveBeenCalledTimes(2)
  })

  it('từ chối khi DB lỗi và cho retry sau khi DB phục hồi', async () => {
    queryMock.mockRejectedValueOnce(new Error('offline'))
    await expect(getAppSettings({ requireAvailable: true })).rejects.toThrow('offline')
    queryMock.mockResolvedValue({
      rows: [
        {
          pro_daily_limit: 30,
          vip_daily_limit: 300,
          promo_until: null,
          ai_circuit_breaker: true,
          updated_at: new Date(),
        },
      ],
    })
    expect((await getAppSettings({ requireAvailable: true })).aiCircuitBreaker).toBe(true)
  })

  it('đọc cùng runner transaction, không dùng hoặc làm bẩn cache ngoài transaction', async () => {
    const row = {
      pro_daily_limit: 30,
      vip_daily_limit: 300,
      promo_until: null,
      ai_circuit_breaker: false,
      updated_at: new Date(),
    }
    queryMock.mockResolvedValue({ rows: [row] })
    await getAppSettings()
    const runner = {
      query: vi.fn().mockResolvedValue({ rows: [{ ...row, vip_daily_limit: 900 }] }),
    }
    expect((await getAppSettings({ requireAvailable: true, runner })).limits.vip).toBe(900)
    expect(runner.query).toHaveBeenCalledTimes(1)
    expect((await getAppSettings()).limits.vip).toBe(300)
    expect(queryMock).toHaveBeenCalledTimes(1)
  })

  it('không mặc định cầu dao tắt khi cột cấu hình bị thiếu', async () => {
    queryMock.mockResolvedValue({
      rows: [
        {
          pro_daily_limit: 30,
          vip_daily_limit: 300,
          promo_until: null,
          updated_at: new Date(),
        },
      ],
    })
    await expect(getAppSettings({ requireAvailable: true })).rejects.toThrow()
  })
})

describe('settings — isSubjectEnforced', () => {
  it('môn có cấu hình enforced: false → trả false', async () => {
    queryMock.mockResolvedValue({ rows: [{ enforced: false }] })

    const res1 = await isSubjectEnforced('math')
    expect(res1).toBe(false)

    // Hit cache
    const res2 = await isSubjectEnforced('math')
    expect(res2).toBe(false)
    expect(queryMock).toHaveBeenCalledTimes(1)
  })

  it('môn có cấu hình enforced: true hoặc null → trả true', async () => {
    queryMock.mockResolvedValue({ rows: [{ enforced: true }] })
    expect(await isSubjectEnforced('physics')).toBe(true)

    invalidateSettingsCache()
    queryMock.mockResolvedValue({ rows: [{ enforced: null }] })
    expect(await isSubjectEnforced('chemistry')).toBe(true)
  })

  it('môn chưa có dòng nào trong DB → mặc định true (an toàn chi phí)', async () => {
    queryMock.mockResolvedValue({ rows: [] })
    expect(await isSubjectEnforced('unknown')).toBe(true)
  })

  it('DB ném lỗi → mặc định true', async () => {
    queryMock.mockRejectedValue(new Error('db down'))
    expect(await isSubjectEnforced('english')).toBe(true)
  })
})
