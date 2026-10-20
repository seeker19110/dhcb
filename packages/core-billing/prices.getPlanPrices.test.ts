// prices.getPlanPrices.test.ts — Audit 2026-10-20, D-3/D-4: đường đọc bảng giá VIP trên đường
// nóng /api/checkout chưa có test cho nhánh lỗi DB (fail-open về giá mặc định), cache TTL, lọc
// gói đã ngừng bán và `sale_until` null/có giá trị. Sai ở đây là bán sai giá.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const query = vi.fn()
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({ query }) }))

import { getPlanPrices, invalidatePricesCache } from './prices.js'

const DEFAULT_VIP = {
  '10day': { priceVnd: 30_000, salePriceVnd: null, saleUntil: null },
  month: { priceVnd: 75_000, salePriceVnd: null, saleUntil: null },
  year: { priceVnd: 500_000, salePriceVnd: null, saleUntil: null },
}

beforeEach(() => {
  query.mockReset()
  invalidatePricesCache()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('getPlanPrices — nhánh lỗi DB (D-3)', () => {
  it('pool.query ném → trả ĐÚNG giá mặc định (khớp seed 0014/0055), có warn, KHÔNG cache lỗi', async () => {
    query.mockRejectedValueOnce(new Error('db down'))
    expect(await getPlanPrices()).toEqual({ vip: DEFAULT_VIP })
    expect(vi.mocked(console.warn)).toHaveBeenCalledTimes(1)
    // Lần sau DB sống lại phải đọc được ngay, không bị kẹt ở giá mặc định 30 giây.
    query.mockResolvedValueOnce({
      rows: [
        { plan: 'vip', cycle: 'month', price_vnd: 80_000, sale_price_vnd: null, sale_until: null },
      ],
    })
    expect((await getPlanPrices()).vip.month.priceVnd).toBe(80_000)
    expect(query).toHaveBeenCalledTimes(2)
  })
})

describe('getPlanPrices — cache TTL và ghi đè từ DB (D-4)', () => {
  it('DB rỗng → vẫn đủ 3 chu kỳ với giá mặc định (không undefined làm vỡ checkout)', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    expect(await getPlanPrices()).toEqual({ vip: DEFAULT_VIP })
  })

  it('trong 30 s gọi lại KHÔNG query DB; qua 30 s thì đọc lại', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-20T00:00:00Z'))
    query.mockResolvedValue({ rows: [] })
    await getPlanPrices()
    await getPlanPrices()
    expect(query).toHaveBeenCalledTimes(1)
    vi.setSystemTime(new Date('2026-10-20T00:00:31Z'))
    await getPlanPrices()
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('invalidatePricesCache() ép đọc lại ngay (admin vừa đổi giá)', async () => {
    query.mockResolvedValue({ rows: [] })
    await getPlanPrices()
    invalidatePricesCache()
    await getPlanPrices()
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('dòng gói cũ plus/pro trong DB bị BỎ QUA; dòng vip ghi đè; sale_until Date → ISO, null → null', async () => {
    query.mockResolvedValueOnce({
      rows: [
        { plan: 'pro', cycle: 'month', price_vnd: 1, sale_price_vnd: null, sale_until: null },
        { plan: 'plus', cycle: 'year', price_vnd: 2, sale_price_vnd: null, sale_until: null },
        {
          plan: 'vip',
          cycle: 'month',
          price_vnd: 79_000,
          sale_price_vnd: 59_000,
          sale_until: new Date('2026-12-31T16:59:59.000Z'),
        },
        { plan: 'vip', cycle: 'year', price_vnd: 520_000, sale_price_vnd: null, sale_until: null },
      ],
    })
    const prices = await getPlanPrices()
    expect(prices.vip.month).toEqual({
      priceVnd: 79_000,
      salePriceVnd: 59_000,
      saleUntil: '2026-12-31T16:59:59.000Z',
    })
    expect(prices.vip.year).toEqual({ priceVnd: 520_000, salePriceVnd: null, saleUntil: null })
    // Chu kỳ không có dòng DB giữ mặc định; giá "1đ"/"2đ" của gói cũ không lọt vào đâu.
    expect(prices.vip['10day']).toEqual(DEFAULT_VIP['10day'])
    expect(JSON.stringify(prices)).not.toMatch(/"priceVnd":[12]\b/)
  })

  it('chu kỳ lạ trong DB (chưa có trong CYCLE_DAYS) bị bỏ qua, không thêm khoá mới', async () => {
    query.mockResolvedValueOnce({
      rows: [{ plan: 'vip', cycle: 'week', price_vnd: 9, sale_price_vnd: null, sale_until: null }],
    })
    const prices = await getPlanPrices()
    expect(Object.keys(prices.vip).sort()).toEqual(['10day', 'month', 'year'])
  })
})
