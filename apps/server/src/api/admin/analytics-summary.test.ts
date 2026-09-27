// Test /api/analytics-summary — chỉ admin xem được, ai khác bị chặn.
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
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

import handler from './analytics-summary.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

beforeEach(() => {
  query.mockReset()
  query.mockResolvedValue({ rows: [] })
  mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  authState.user = { userId: 'user-1' }
})

function makeRequest(qs = ''): Request {
  return new Request(`http://localhost/api/analytics-summary${qs}`, { method: 'GET' })
}

describe('GET /api/analytics-summary', () => {
  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    const res = await handler(makeRequest())
    expect(res.status).toBe(401)
  })

  it('đăng nhập nhưng KHÔNG phải admin → 403', async () => {
    authState.user = { userId: 'non-admin' }
    const res = await handler(makeRequest())
    expect(res.status).toBe(403)
  })

  it('admin → 200, gộp sự kiện client + ba bước phễu suy từ users/daily_usage, sắp theo ngày', async () => {
    // Truy vấn 1: bảng analytics_events (client bắn). Truy vấn 2: phễu suy ra.
    query.mockResolvedValueOnce({
      rows: [
        { day: '2026-07-20', event: 'landing_view', count: 5 },
        { day: '2026-07-21', event: 'cta_click', count: 2 },
      ],
    })
    query.mockResolvedValueOnce({
      rows: [
        { day: '2026-07-19', event: 'signup', count: 2 },
        { day: '2026-07-21', event: 'signup', count: 1 },
        { day: '2026-07-20', event: 'first_session_done', count: 2 },
        { day: '2026-07-22', event: 'day2_return', count: 1 },
      ],
    })
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      totalsByEvent: Record<string, number>
      daily: { day: string; event: string; count: number }[]
    }
    expect(body.totalsByEvent).toEqual({
      landing_view: 5,
      cta_click: 2,
      signup: 3,
      first_session_done: 2,
      day2_return: 1,
    })
    expect(body.daily).toHaveLength(6)
    expect(body.daily.map((r) => r.day)).toEqual([...body.daily.map((r) => r.day)].sort())
  })

  it('phễu suy ra: cùng cửa sổ N ngày, so ngày theo giờ VN, không tin client', async () => {
    await handler(makeRequest('?days=30'))
    const funnelSql = String(query.mock.calls[1]?.[0])
    expect(query.mock.calls[1]?.[1]).toEqual([30])
    expect(funnelSql).toContain('public.users')
    expect(funnelSql).toContain('public.daily_usage')
    expect(funnelSql).toContain('Asia/Ho_Chi_Minh')
    expect(funnelSql).toContain('a.day > c.signup_day') // day2 = có lượt dùng SAU ngày đăng ký
    expect(funnelSql).toContain('code_feedback_count') // không bỏ sót cột đếm nào
    expect(funnelSql).not.toContain('analytics_events')
  })

  it('mặc định 14 ngày, chấp nhận query days hợp lệ', async () => {
    await handler(makeRequest('?days=30'))
    expect(String(query.mock.calls[0]?.[0])).toContain('interval')
    expect(query.mock.calls[0]?.[1]).toEqual([30])
  })

  it('days không hợp lệ (chữ, âm) → dùng mặc định 14, không NaN xuống SQL', async () => {
    await handler(makeRequest('?days=abc'))
    expect(query.mock.calls[0]?.[1]).toEqual([14])
  })

  it('completion Daily Plan chỉ đọc receipt server-owned, nhóm ngày VN + action + version', async () => {
    query.mockResolvedValueOnce({ rows: [] })
    query.mockResolvedValueOnce({ rows: [] })
    query.mockResolvedValueOnce({
      rows: [{ day: '2026-09-08', actionKind: 'srs_review', plannerVersion: 'p1.1', count: 2 }],
    })
    query.mockResolvedValueOnce({
      rows: [
        {
          actionKind: 'srs_review',
          plannerVersion: 'p1.1',
          impressionCount: 10,
          clickCount: 5,
          completionCount: 2,
        },
      ],
    })

    const res = await handler(makeRequest('?days=7'))
    const body = (await res.json()) as {
      totalsByEvent: Record<string, number>
      dailyPlanActions: {
        actionKind: string
        completionCount: number | null
        completionRate: number | null
      }[]
    }
    expect(body.totalsByEvent.daily_plan_completion).toBe(2)
    expect(body.dailyPlanActions).toEqual([
      expect.objectContaining({
        actionKind: 'srs_review',
        completionCount: 2,
        completionRate: 0.2,
      }),
      expect.objectContaining({
        actionKind: 'continue_learning',
        completionCount: null,
        completionRate: null,
      }),
      expect.objectContaining({
        actionKind: 'discover_path',
        completionCount: null,
        completionRate: null,
      }),
    ])

    const completionSql = String(query.mock.calls[2]?.[0])
    expect(completionSql).toContain('public.daily_plan_completions')
    expect(completionSql).toContain('Asia/Ho_Chi_Minh')
    expect(completionSql).toContain('action_kind')
    expect(completionSql).toContain('planner_version')
    expect(completionSql).not.toContain('analytics_events')
  })
})
