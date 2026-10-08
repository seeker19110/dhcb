// Test /api/admin-usage-stats — chặn quyền, kẹp tham số days, và các phép tính tiền bạc
// (chi phí ước tính, lãi/lỗ, tỉ lệ trả phí) phải đúng vì đây là số liệu để ra quyết định.
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))

// Hạn mức Free đọc từ app_settings (GĐ1 2026-09-12) — mock để KHÔNG tiêu mất một lượt gọi của
// `query` giả bên dưới (nó trả kết quả theo THỨ TỰ, lệch một nhịp là sai toàn bộ assertion).
vi.mock('@dhcb/core-db/settings', () => ({
  getAppSettings: async () => ({ limits: { free: 30, vip: 300 } }),
}))
const authState: { user: { userId: string } | null; rateLimitOk: boolean } = {
  user: { userId: 'user-1' },
  rateLimitOk: true,
}
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => authState.rateLimitOk,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))
vi.mock('@dhcb/core-auth/adminAuth', () => ({
  isAdminUser: (userId: string | null | undefined) => userId === 'user-1',
}))

import handler from './admin-usage-stats.js'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { getUnitCostsUsd, getUsdVndRate } from '@dhcb/core-ai/aiCost'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

// Trả kết quả theo THỨ TỰ Promise.all trong handler (12 truy vấn; ⑫ token thật mặc định rỗng).
function seedQueries(overrides: Record<number, unknown[]> = {}) {
  const defaults: unknown[][] = [
    [{ total: 100, new_in_range: 10 }], // ① users
    [
      { plan: 'free', count: 90 },
      { plan: 'vip', count: 10 },
    ], // ② plan
    [], // ③ daily
    [], // ④ plan usage
    [{}], // ⑤ reach
    [{ dau: 5, wau: 20, mau: 50, returning: 12 }], // ⑥ active
    [], // ⑦ payments
    [], // ⑧ paid breakdown
    [], // ⑨ revenue daily
    [{ users: 0, total: 0, exhausted: 0 }], // ⑩ sức khoẻ hạn mức ngày gói Free
    [], // ⑪ top users
  ]
  let call = 0
  query.mockImplementation(() => {
    const idx = call++
    return Promise.resolve({ rows: overrides[idx] ?? defaults[idx] ?? [] })
  })
}

beforeEach(() => {
  query.mockReset()
  mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  authState.user = { userId: 'user-1' }
  authState.rateLimitOk = true
  seedQueries()
})

function makeRequest(qs = ''): Request {
  return new Request(`http://localhost/api/admin-usage-stats${qs}`, { method: 'GET' })
}

interface Body {
  range: { days: number }
  users: { byPlan: Record<string, number>; paidUsers: number; paidRatio: number }
  usage: { totals: Record<string, number> }
  cost: { totalUsd: number; totalVnd: number; perActiveUserVnd: number }
  revenue: { vnd: number; marginVnd: number; payRate: number; createdOrders: number }
}

describe('GET /api/admin-usage-stats', () => {
  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    expect((await handler(makeRequest())).status).toBe(401)
  })

  it('đăng nhập nhưng không phải admin → 403', async () => {
    authState.user = { userId: 'non-admin' }
    expect((await handler(makeRequest())).status).toBe(403)
  })

  it('method khác GET → 405', async () => {
    const res = await handler(
      new Request('http://localhost/api/admin-usage-stats', { method: 'POST' }),
    )
    expect(res.status).toBe(405)
  })

  it('days mặc định 30, kẹp trần 180, giá trị rác → mặc định', async () => {
    expect(((await (await handler(makeRequest())).json()) as Body).range.days).toBe(30)
    seedQueries()
    expect(((await (await handler(makeRequest('?days=999'))).json()) as Body).range.days).toBe(180)
    seedQueries()
    expect(((await (await handler(makeRequest('?days=abc'))).json()) as Body).range.days).toBe(30)
    seedQueries()
    expect(((await (await handler(makeRequest('?days=-5'))).json()) as Body).range.days).toBe(30)
  })

  it('người dùng chưa có dòng profiles vẫn được tính là Free', async () => {
    // 100 user nhưng chỉ 30 dòng profiles → 70 người còn lại phải rơi vào Free.
    seedQueries({
      1: [{ plan: 'vip', count: 30 }],
    })
    const body = (await (await handler(makeRequest())).json()) as Body
    expect(body.users.byPlan.free).toBe(70)
    expect(body.users.paidUsers).toBe(30)
    expect(body.users.paidRatio).toBeCloseTo(0.3)
  })

  it('chi phí ước tính = lượt × đơn giá, và lãi/lỗ = doanh thu − chi phí', async () => {
    const unit = getUnitCostsUsd()
    const rate = getUsdVndRate()
    seedQueries({
      2: [
        {
          day: '2026-07-01',
          chat: 100,
          writing: 10,
          speaking: 20,
          stt: 30,
          pronounce: 40,
          code_feedback: 5,
          learn: 500,
          active_users: 7,
        },
      ],
      6: [{ status: 'paid', count: 3, vnd: 120_000 }],
    })
    const body = (await (await handler(makeRequest())).json()) as Body

    const expectedUsd =
      100 * unit.chat +
      10 * unit.writing +
      20 * unit.speaking +
      30 * unit.stt +
      40 * unit.pronounce +
      5 * unit.code_feedback
    expect(body.cost.totalUsd).toBeCloseTo(expectedUsd, 8)
    expect(body.cost.totalVnd).toBeCloseTo(expectedUsd * rate, 4)
    // learn_count KHÔNG được tính vào chi phí AI (học từ vựng chạy ở client).
    expect(body.usage.totals.learn).toBe(500)
    expect(body.revenue.vnd).toBe(120_000)
    expect(body.revenue.marginVnd).toBeCloseTo(120_000 - expectedUsd * rate, 4)
    // mau = 50 theo dữ liệu mẫu ⑥
    expect(body.cost.perActiveUserVnd).toBeCloseTo((expectedUsd * rate) / 50, 6)
  })

  it('tỉ lệ trả tiền tính trên TỔNG đơn đã tạo, không chỉ đơn đã trả', async () => {
    seedQueries({
      6: [
        { status: 'paid', count: 2, vnd: 80_000 },
        { status: 'pending', count: 6, vnd: 240_000 },
        { status: 'expired', count: 2, vnd: 80_000 },
      ],
    })
    const body = (await (await handler(makeRequest())).json()) as Body
    expect(body.revenue.createdOrders).toBe(10)
    expect(body.revenue.payRate).toBeCloseTo(0.2)
    // Doanh thu chỉ lấy từ đơn status='paid', không cộng nhầm đơn pending/expired.
    expect(body.revenue.vnd).toBe(80_000)
  })

  it('không có dữ liệu nào → vẫn trả 200 với số 0, không chia cho 0', async () => {
    seedQueries({
      0: [{ total: 0, new_in_range: 0 }],
      1: [],
      5: [{ dau: 0, wau: 0, mau: 0, returning: 0 }],
    })
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const body = (await res.json()) as Body
    expect(body.users.paidRatio).toBe(0)
    expect(body.cost.perActiveUserVnd).toBe(0)
    expect(body.revenue.payRate).toBe(0)
  })

  it('lỗi DB → 500 (KHÔNG trả số 0 giả, tránh đọc nhầm là "không ai dùng")', async () => {
    query.mockReset()
    query.mockRejectedValue(new Error('db down'))
    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
  })

  it('OPTIONS (preflight) → 204 rỗng, không chạm DB', async () => {
    const res = await handler(
      new Request('http://localhost/api/admin-usage-stats', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
    expect(query).not.toHaveBeenCalled()
  })

  it('vượt rate limit → 429 TRƯỚC khi xác thực/chạm DB', async () => {
    authState.rateLimitOk = false
    expect((await handler(makeRequest())).status).toBe(429)
    expect(query).not.toHaveBeenCalled()
  })

  it('DB trả về KHÔNG dòng nào ở mọi truy vấn → 200 với số 0 (không ném vì đọc rows[0])', async () => {
    query.mockReset()
    query.mockResolvedValue({ rows: [] })
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const body = (await res.json()) as Body & {
      users: { total: number; newInRange: number; dau: number; returningInRange: number }
      usage: { reach: Record<string, number> }
      freeCredit: { cap: number; users: number; total: number; exhausted: number }
    }
    expect(body.users).toMatchObject({
      total: 0,
      newInRange: 0,
      byPlan: { free: 0, vip: 0 },
      dau: 0,
      returningInRange: 0,
    })
    expect(body.usage.reach).toEqual({})
    expect(body.freeCredit).toEqual({ cap: 30, users: 0, total: 0, exhausted: 0 })
  })

  it('trạng thái đơn lạ (không thuộc 4 trạng thái biết) bị bỏ qua, không làm sai tỉ lệ', async () => {
    seedQueries({
      6: [
        { status: 'paid', count: 1, vnd: 40_000 },
        { status: 'refunded', count: 99, vnd: 0 },
      ],
    })
    const body = (await (await handler(makeRequest())).json()) as Body & {
      revenue: { payments: Record<string, number> }
    }
    expect(body.revenue.payments).toEqual({ pending: 0, paid: 1, failed: 0, expired: 0 })
    expect(body.revenue.createdOrders).toBe(1)
    expect(body.revenue.payRate).toBe(1)
  })

  it('lượt dùng theo gói: chi phí từng gói = lượt × đơn giá của gói đó', async () => {
    const unit = getUnitCostsUsd()
    const counts = { chat: 4, writing: 0, speaking: 1, stt: 0, pronounce: 0, code_feedback: 2 }
    seedQueries({ 3: [{ plan: 'free', users: 3, ...counts }] })
    const body = (await (await handler(makeRequest())).json()) as {
      usage: { byPlan: Array<{ plan: string; users: number; counts: unknown; costUsd: number }> }
    }
    expect(body.usage.byPlan).toHaveLength(1)
    expect(body.usage.byPlan[0]).toMatchObject({ plan: 'free', users: 3, counts })
    expect(body.usage.byPlan[0]!.costUsd).toBeCloseTo(
      4 * unit.chat + 1 * unit.speaking + 2 * unit.code_feedback,
      10,
    )
  })

  it('token THẬT (⑫): chuỗi numeric của Postgres đổi sang số, NULL/rác → 0, cộng tổng đúng', async () => {
    seedQueries({
      11: [
        {
          provider: 'gemini',
          model: 'm1',
          mode: 'chat',
          calls: 3,
          prompt_tokens: '1000',
          completion_tokens: '200',
          cache_read_tokens: '50',
          cost_usd: '0.0125',
        },
        {
          provider: 'groq',
          model: 'm2',
          mode: 'stt',
          calls: 2,
          // sum() trên nhóm toàn NULL trả NULL → ::text vẫn là null.
          prompt_tokens: null as unknown as string,
          completion_tokens: 'không-phải-số',
          cache_read_tokens: '0',
          cost_usd: '0.5',
        },
      ],
    })
    const body = (await (await handler(makeRequest())).json()) as {
      tokenCost: {
        totals: Record<string, number>
        totalVnd: number
        byProviderModel: Array<Record<string, unknown>>
      }
    }
    expect(body.tokenCost.byProviderModel[1]).toMatchObject({
      promptTokens: 0,
      completionTokens: 0,
      costUsd: 0.5,
    })
    expect(body.tokenCost.totals).toEqual({
      calls: 5,
      promptTokens: 1000,
      completionTokens: 200,
      cacheReadTokens: 50,
      costUsd: 0.5125,
    })
    expect(body.tokenCost.totalVnd).toBeCloseTo(0.5125 * getUsdVndRate(), 6)
  })
})
