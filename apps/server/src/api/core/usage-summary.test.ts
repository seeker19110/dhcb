// Test /api/usage-summary — trả số lượt AI còn lại HÔM NAY cho client.
// GĐ1 2026-09-12: cả Free lẫn VIP đều dùng hạn mức TỔNG/ngày (đọc app_settings) rồi trừ đi số
// đã dùng trong `daily_usage` của đúng ngày + đúng môn. Kiểm cả nhánh lỗi DB fail-open.
import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
let rateLimitOk = true
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))

const lookupPlanMock = vi.fn()
vi.mock('@dhcb/core-billing/usage', () => ({
  lookupPlan: (userId: string) => lookupPlanMock(userId),
  DEFAULT_SUBJECT: 'english',
  AI_USAGE_COLUMNS: ['chat_count', 'writing_count'],
}))

vi.mock('@dhcb/core-db/settings', () => ({
  getAppSettings: async () => ({ limits: { free: 30, vip: 300 } }),
}))

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))

import handler from './usage-summary.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

beforeEach(() => {
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
  lookupPlanMock.mockReset()
  query.mockReset()
  mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
})

describe('GET /api/usage-summary', () => {
  it('OPTIONS → 204', async () => {
    const res = await handler(
      new Request('http://localhost/api/usage-summary', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
  })

  it('method khác GET → 405', async () => {
    const res = await handler(new Request('http://localhost/api/usage-summary', { method: 'POST' }))
    expect(res.status).toBe(405)
  })

  it('vượt rate limit → 429', async () => {
    rateLimitOk = false
    const res = await handler(new Request('http://localhost/api/usage-summary'))
    expect(res.status).toBe(429)
  })

  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    const res = await handler(new Request('http://localhost/api/usage-summary'))
    expect(res.status).toBe(401)
  })

  it('VIP → trạng thái unlimited tường minh và thống kê thật', async () => {
    lookupPlanMock.mockResolvedValue('vip')
    query.mockResolvedValue({ rows: [{ used: '20' }] })
    const res = await handler(new Request('http://localhost/api/usage-summary'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      plan: 'vip',
      unlimited: true,
      usedToday: 20,
      freeWeeklyCredit: null,
      freeWeeklyCap: 0,
    })
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('gói Free → cap = hạn mức Free (30), còn lại = 30 − đã dùng', async () => {
    lookupPlanMock.mockResolvedValue('free')
    query.mockResolvedValue({ rows: [{ used: '5' }] })
    const res = await handler(new Request('http://localhost/api/usage-summary'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ plan: 'free', freeWeeklyCredit: 25, freeWeeklyCap: 30 })
  })

  it('đã dùng vượt hạn mức (admin vừa hạ limit) → kẹp về 0, không hiện số âm', async () => {
    lookupPlanMock.mockResolvedValue('free')
    query.mockResolvedValue({ rows: [{ used: '99' }] })
    const res = await handler(new Request('http://localhost/api/usage-summary'))
    expect(await res.json()).toEqual({ plan: 'free', freeWeeklyCredit: 0, freeWeeklyCap: 30 })
  })

  // Hồi quy (audit 2026-08-12): truy vấn HIỂN THỊ phải lọc `subject` GIỐNG hàm SQL enforce
  // (consume_usage_total lọc `subject = p_subject`, migration 0029). Thiếu bộ lọc này thì khi
  // có môn thứ 2 (ADR-0001), UI cộng lượt của MỌI môn → hiện ít hơn số server thật sự cho phép.
  it('truy vấn LỌC theo ngày + subject, khớp hàm SQL enforce', async () => {
    lookupPlanMock.mockResolvedValue('free')
    query.mockResolvedValue({ rows: [{ used: '1' }] })
    await handler(new Request('http://localhost/api/usage-summary'))
    const [sql, params] = query.mock.calls[0] as [string, unknown[]]
    expect(sql).toMatch(/subject\s*=\s*\$3/)
    expect(sql).not.toContain('$2::date') // daily_usage.day là TEXT trong schema/migration thật
    expect(params).toEqual(['user-1', expect.any(String), 'english'])
  })

  it('lỗi DB → fail-open, vẫn 200 và KHÔNG bịa con số (credit = null)', async () => {
    lookupPlanMock.mockResolvedValue('free')
    query.mockRejectedValue(new Error('db down'))
    const res = await handler(new Request('http://localhost/api/usage-summary'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ plan: 'free', freeWeeklyCredit: null, freeWeeklyCap: 0 })
  })
})

it('VIP đã dùng vượt hạn mức cũ vẫn là unlimited, không bịa số còn lại', async () => {
  lookupPlanMock.mockResolvedValue('vip')
  query.mockResolvedValue({ rows: [{ used: '9999' }] })
  const res = await handler(new Request('http://localhost/api/usage-summary'))
  expect(await res.json()).toEqual({
    plan: 'vip',
    unlimited: true,
    usedToday: 9999,
    freeWeeklyCredit: null,
    freeWeeklyCap: 0,
  })
})

it.each(['NaN', '-1', '1.5', '9007199254740992'])(
  'thống kê hỏng %s không biến thành quyền unlimited',
  async (used) => {
    lookupPlanMock.mockResolvedValue('vip')
    query.mockResolvedValue({ rows: [{ used }] })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const res = await handler(new Request('http://localhost/api/usage-summary'))
    expect(await res.json()).toEqual({ plan: 'free', freeWeeklyCredit: null, freeWeeklyCap: 0 })
    warn.mockRestore()
  },
)
