// Test /api/admin-settings — chặn quyền admin, đọc/sửa hạn mức lượt dùng + cầu dao khẩn cấp.
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
const settingsResult = {
  limits: { free: 30, vip: 300 },
  promoUntil: null,
  aiCircuitBreaker: false,
  leaderboardEnabled: false,
  updatedAt: '2026-01-01T00:00:00.000Z',
}
const getAppSettings = vi.fn(async () => settingsResult)
const invalidateSettingsCache = vi.fn()
vi.mock('@dhcb/core-db/settings', () => ({
  getAppSettings: () => getAppSettings(),
  invalidateSettingsCache: (...args: unknown[]) => invalidateSettingsCache(...args),
}))

import handler from './admin-settings.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

function makeRequest(method: string, body?: unknown): Request {
  return new Request('http://localhost/api/admin-settings', {
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
  getAppSettings.mockClear()
  getAppSettings.mockImplementation(async () => settingsResult)
  invalidateSettingsCache.mockClear()
})

describe('/api/admin-settings', () => {
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

  it('GET → trả cấu hình hiện tại', async () => {
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(200)
    expect(await resp.json()).toEqual(settingsResult)
  })

  it('POST body sai (limits.free âm) → 400', async () => {
    const resp = await handler(
      makeRequest('POST', { limits: { free: -1, vip: 300 }, promoUntil: null }),
    )
    expect(resp.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('POST promoUntil không hợp lệ → 400', async () => {
    const resp = await handler(
      makeRequest('POST', { limits: { free: 30, vip: 300 }, promoUntil: 'khong-phai-ngay' }),
    )
    expect(resp.status).toBe(400)
  })

  it('POST không gửi aiCircuitBreaker/leaderboardEnabled → giữ nguyên giá trị cũ', async () => {
    getAppSettings.mockImplementation(async () => ({
      ...settingsResult,
      aiCircuitBreaker: true,
      leaderboardEnabled: true,
    }))
    query.mockResolvedValueOnce({})
    const resp = await handler(
      makeRequest('POST', { limits: { free: 40, vip: 400 }, promoUntil: null }),
    )
    expect(resp.status).toBe(200)
    const [, params] = query.mock.calls[0] as [string, unknown[]]
    // params: [pro, vip, promoUntil, aiCircuitBreaker, leaderboardEnabled]
    expect(params).toEqual([40, 400, null, true, true])
  })

  it('POST thành công → cập nhật hạn mức + cầu dao khẩn cấp, trả cấu hình mới', async () => {
    query.mockResolvedValueOnce({})
    const resp = await handler(
      makeRequest('POST', {
        limits: { free: 50, vip: 500 },
        promoUntil: '2026-02-01T00:00:00Z',
        aiCircuitBreaker: true,
        leaderboardEnabled: true,
      }),
    )
    expect(resp.status).toBe(200)
    const [, params] = query.mock.calls[0] as [string, unknown[]]
    expect(params).toEqual([50, 500, '2026-02-01T00:00:00Z', true, true])
    expect(await resp.json()).toEqual(settingsResult)
  })

  it('lỗi DB khi ghi → ném lỗi', async () => {
    query.mockRejectedValueOnce(new Error('db down'))
    await expect(
      handler(makeRequest('POST', { limits: { free: 30, vip: 300 }, promoUntil: null })),
    ).rejects.toThrow('db down')
  })
})
