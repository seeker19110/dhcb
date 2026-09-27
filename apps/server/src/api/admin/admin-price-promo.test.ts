// Test /api/admin-price-promo — chặn quyền admin, đọc/sửa khuyến mãi % toàn bộ gói.
import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
const rateLimitState: { ok: boolean } = { ok: true }
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitState.ok,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))
vi.mock('@dhcb/core-auth/adminAuth', () => ({
  isAdminUser: (userId: string | null | undefined) => userId === 'user-1',
}))
const promoResult: {
  percent: number
  startsAt: string | null
  endsAt: string | null
  updatedAt: string
} = {
  percent: 0,
  startsAt: null,
  endsAt: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
}
const getPricePromo = vi.fn(async () => promoResult)
const invalidatePricePromoCache = vi.fn()
vi.mock('@dhcb/core-billing/pricePromo', () => ({
  getPricePromo: () => getPricePromo(),
  invalidatePricePromoCache: (...args: unknown[]) => invalidatePricePromoCache(...args),
}))

import handler from './admin-price-promo.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

function makeRequest(method: string, body?: unknown): Request {
  return new Request('http://localhost/api/admin-price-promo', {
    method,
    headers: {
      authorization: 'Bearer test',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  query.mockReset()
  mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  authState.user = { userId: 'user-1' }
  rateLimitState.ok = true
  getPricePromo.mockClear()
  getPricePromo.mockImplementation(async () => promoResult)
  invalidatePricePromoCache.mockClear()
})

describe('/api/admin-price-promo', () => {
  it('OPTIONS → 204', async () => {
    const resp = await handler(makeRequest('OPTIONS'))
    expect(resp.status).toBe(204)
  })

  it('method sai (DELETE) → 405', async () => {
    const resp = await handler(makeRequest('DELETE'))
    expect(resp.status).toBe(405)
  })

  it('rate limit vượt ngưỡng → 429', async () => {
    rateLimitState.ok = false
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(429)
  })

  it('chưa đăng nhập → 401', async () => {
    authState.user = null
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(401)
  })

  it('không phải admin → 403', async () => {
    authState.user = { userId: 'non-admin' }
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(403)
  })

  it('GET → trả khuyến mãi hiện tại', async () => {
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual(promoResult)
  })

  it('POST body sai (percent > 100) → 400', async () => {
    const resp = await handler(makeRequest('POST', { percent: 200, startsAt: null, endsAt: null }))
    expect(resp.status).toBe(400)
  })

  it('POST percent > 0 nhưng thiếu startsAt/endsAt → 400 (refine)', async () => {
    const resp = await handler(makeRequest('POST', { percent: 20, startsAt: null, endsAt: null }))
    expect(resp.status).toBe(400)
  })

  it('POST startsAt sau endsAt → 400 (refine)', async () => {
    const resp = await handler(
      makeRequest('POST', {
        percent: 20,
        startsAt: '2026-02-01T00:00:00Z',
        endsAt: '2026-01-01T00:00:00Z',
      }),
    )
    expect(resp.status).toBe(400)
  })

  it('POST percent=0 → tắt khuyến mãi, không cần ngày', async () => {
    query.mockResolvedValueOnce({})
    const resp = await handler(makeRequest('POST', { percent: 0, startsAt: null, endsAt: null }))
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual(promoResult)
    const [, params] = query.mock.calls[0] as [string, unknown[]]
    expect(params).toEqual([0, null, null])
    expect(invalidatePricePromoCache).toHaveBeenCalledTimes(1)
  })

  it('POST thành công → cập nhật % và ngày, trả lại giá trị mới nhất', async () => {
    query.mockResolvedValueOnce({})
    getPricePromo.mockImplementation(async () => ({
      percent: 20,
      startsAt: '2026-01-01T00:00:00.000Z',
      endsAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-01-05T00:00:00.000Z',
    }))
    const resp = await handler(
      makeRequest('POST', {
        percent: 20,
        startsAt: '2026-01-01T00:00:00Z',
        endsAt: '2026-02-01T00:00:00Z',
      }),
    )
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as { percent: number }
    expect(data.percent).toBe(20)
    const [, params] = query.mock.calls[0] as [string, unknown[]]
    expect(params[0]).toBe(20)
  })

  it('lỗi DB khi ghi → ném lỗi', async () => {
    query.mockRejectedValueOnce(new Error('db down'))
    await expect(
      handler(
        makeRequest('POST', {
          percent: 20,
          startsAt: '2026-01-01T00:00:00Z',
          endsAt: '2026-02-01T00:00:00Z',
        }),
      ),
    ).rejects.toThrow('db down')
  })
})
