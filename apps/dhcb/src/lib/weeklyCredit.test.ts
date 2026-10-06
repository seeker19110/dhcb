import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWeeklyCredit } from './weeklyCredit'

vi.mock('@core/authHeader', () => ({
  getAuthHeader: vi.fn(() => ({ Authorization: 'Bearer fake-token' })),
}))

describe('fetchWeeklyCredit — lượt còn lại của gói Free từ server', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('server trả thành công → parse đúng dữ liệu JSON', async () => {
    const data = { plan: 'free' as const, freeWeeklyCredit: 3, freeWeeklyCap: 10 }
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => data } as Response)
    await expect(fetchWeeklyCredit()).resolves.toEqual(data)
    expect(fetch).toHaveBeenCalledWith(
      '/api/usage-summary',
      expect.objectContaining({ headers: { Authorization: 'Bearer fake-token' } }),
    )
  })

  it('credit bằng 0 là dữ liệu ready hợp lệ', async () => {
    const data = { plan: 'free' as const, freeWeeklyCredit: 0, freeWeeklyCap: 30 }
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => data } as Response)
    await expect(fetchWeeklyCredit()).resolves.toEqual(data)
  })

  it.each([
    ['credit null', { plan: 'free', freeWeeklyCredit: null, freeWeeklyCap: 30 }],
    ['plan không hợp lệ', { plan: 'pro', freeWeeklyCredit: 2, freeWeeklyCap: 30 }],
    ['thiếu field', { plan: 'free', freeWeeklyCredit: 2 }],
    ['credit âm', { plan: 'free', freeWeeklyCredit: -1, freeWeeklyCap: 30 }],
    ['credit vượt cap', { plan: 'free', freeWeeklyCredit: 31, freeWeeklyCap: 30 }],
    ['credit thập phân', { plan: 'free', freeWeeklyCredit: 1.5, freeWeeklyCap: 30 }],
    ['cap bằng 0', { plan: 'free', freeWeeklyCredit: 0, freeWeeklyCap: 0 }],
    ['cap âm', { plan: 'free', freeWeeklyCredit: 0, freeWeeklyCap: -1 }],
    ['cap thập phân', { plan: 'free', freeWeeklyCredit: 1, freeWeeklyCap: 1.5 }],
  ])('payload %s → null thay vì tin dữ liệu ngoài biên', async (_name, data) => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => data } as Response)
    await expect(fetchWeeklyCredit()).resolves.toBeNull()
  })

  it('VIP unlimited là dữ liệu thật dù credit null và cap 0', async () => {
    const data = {
      plan: 'vip',
      unlimited: true,
      usedToday: 9999,
      freeWeeklyCredit: null,
      freeWeeklyCap: 0,
    }
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => data } as Response)
    await expect(fetchWeeklyCredit()).resolves.toEqual(data)
  })

  it.each([
    { plan: 'free', unlimited: true, usedToday: 1, freeWeeklyCredit: null, freeWeeklyCap: 0 },
    { plan: 'vip', unlimited: true, usedToday: -1, freeWeeklyCredit: null, freeWeeklyCap: 0 },
    { plan: 'vip', unlimited: true, freeWeeklyCredit: null, freeWeeklyCap: 0 },
    { plan: 'vip', usedToday: 1, freeWeeklyCredit: null, freeWeeklyCap: 0 },
    { plan: 'vip', unlimited: true, usedToday: 1, freeWeeklyCredit: null, freeWeeklyCap: 300 },
  ])('unlimited sai hợp đồng %o không trở thành quyền lợi thật', async (data) => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => data } as Response)
    await expect(fetchWeeklyCredit()).resolves.toBeNull()
  })

  it('server trả HTTP lỗi → trả về null (an toàn, coi như hết lượt)', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 500 } as Response)
    await expect(fetchWeeklyCredit()).resolves.toBeNull()
  })

  it('mất mạng (fetch reject) → trả về null, không throw', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'))
    await expect(fetchWeeklyCredit()).resolves.toBeNull()
  })
})
