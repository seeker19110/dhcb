// Test /api/admin-plan-features — chặn quyền admin, bật/tắt/thêm/xoá tính năng theo gói.
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
const matrixResult = { catalog: [], flags: {}, updatedAt: '2026-01-01T00:00:00.000Z' }
const getPlanFeatureMatrix = vi.fn(async () => matrixResult)
const invalidatePlanFeatureCache = vi.fn()
vi.mock('@dhcb/core-billing/planFeatures', () => ({
  getPlanFeatureMatrix: () => getPlanFeatureMatrix(),
  invalidatePlanFeatureCache: (...args: unknown[]) => invalidatePlanFeatureCache(...args),
}))

import handler from './admin-plan-features.js'
import { getPgPool } from '@dhcb/core-db/pgPool'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()
const connectClient = { query: vi.fn(), release: vi.fn() }
const connect = vi.fn(async () => connectClient)

function makeRequest(method: string, body?: unknown): Request {
  return new Request('http://localhost/api/admin-plan-features', {
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
  connect.mockClear()
  connectClient.query.mockReset()
  connectClient.release.mockClear()
  mockedGetPool.mockReturnValue({ query, connect } as unknown as ReturnType<typeof getPgPool>)
  authState.user = { userId: 'user-1' }
  rateLimitState.ok = true
  getPlanFeatureMatrix.mockClear()
  invalidatePlanFeatureCache.mockClear()
})

describe('/api/admin-plan-features', () => {
  it('OPTIONS → 204', async () => {
    const resp = await handler(makeRequest('OPTIONS'))
    expect(resp.status).toBe(204)
  })

  it('method sai (PATCH) → 405', async () => {
    const resp = await handler(makeRequest('PATCH'))
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

  it('GET → trả ma trận', async () => {
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(200)
    const data = await resp.json()
    expect(data).toEqual(matrixResult)
  })

  it('POST body sai (thiếu featureKey) → 400', async () => {
    const resp = await handler(makeRequest('POST', { plan: 'vip', enabled: true }))
    expect(resp.status).toBe(400)
  })

  it('POST không tìm thấy tính năng → 404', async () => {
    query.mockResolvedValueOnce({ rowCount: 0 })
    const resp = await handler(
      makeRequest('POST', { featureKey: 'nope', plan: 'vip', enabled: true }),
    )
    expect(resp.status).toBe(404)
  })

  it('POST thành công → bật/tắt 1 ô, invalidate cache', async () => {
    query.mockResolvedValueOnce({ rowCount: 1 })
    const resp = await handler(
      makeRequest('POST', { featureKey: 'speaking', plan: 'vip', enabled: false }),
    )
    expect(resp.status).toBe(200)
    const data = await resp.json()
    expect(data).toEqual({ featureKey: 'speaking', plan: 'vip', enabled: false })
    expect(invalidatePlanFeatureCache).toHaveBeenCalledTimes(1)
  })

  it('PUT body sai (key chứa hoa) → 400', async () => {
    const resp = await handler(makeRequest('PUT', { key: 'Bad-Key', label: 'x' }))
    expect(resp.status).toBe(400)
  })

  it('PUT key đã tồn tại → 409, không gán quyền cho gói nào', async () => {
    connectClient.query.mockImplementation(async (sql: string) => {
      if (sql === 'begin' || sql === 'commit') return {}
      if (sql.startsWith('insert into public.feature_catalog')) return { rowCount: 0 }
      return {}
    })
    const resp = await handler(makeRequest('PUT', { key: 'newkey', label: 'Nhãn' }))
    expect(resp.status).toBe(409)
    // withTransaction() commit bình thường ở đây (không throw) — ON CONFLICT DO NOTHING đã tự
    // đảm bảo 0 dòng bị đổi, nên commit một transaction rỗng và rollback nó tương đương nhau.
    // Bất biến thật sự cần giữ: KHÔNG có câu insert nào vào plan_feature_flags chạy.
    expect(connectClient.query).not.toHaveBeenCalledWith(
      expect.stringContaining('insert into public.plan_feature_flags'),
    )
    expect(connectClient.release).toHaveBeenCalled()
  })

  it('PUT thành công → thêm tính năng mới, mặc định bật 3 gói', async () => {
    connectClient.query.mockImplementation(async (sql: string) => {
      if (sql === 'begin' || sql === 'commit') return {}
      if (sql.startsWith('insert into public.feature_catalog')) return { rowCount: 1 }
      return {}
    })
    const resp = await handler(
      makeRequest('PUT', { key: 'newkey', label: 'Nhãn', description: 'Mô tả' }),
    )
    expect(resp.status).toBe(200)
    const data = await resp.json()
    expect(data).toEqual({ key: 'newkey', label: 'Nhãn', description: 'Mô tả' })
    expect(connectClient.query).toHaveBeenCalledWith('commit')
    expect(invalidatePlanFeatureCache).toHaveBeenCalledTimes(1)
  })

  it('PUT lỗi giữa transaction → rollback rồi ném lỗi', async () => {
    connectClient.query.mockImplementation(async (sql: string) => {
      if (sql === 'begin') return {}
      if (sql.startsWith('insert into public.feature_catalog')) return { rowCount: 1 }
      if (sql.startsWith('insert into public.plan_feature_flags')) throw new Error('boom')
      return {}
    })
    await expect(handler(makeRequest('PUT', { key: 'newkey', label: 'Nhãn' }))).rejects.toThrow(
      'boom',
    )
    expect(connectClient.query).toHaveBeenCalledWith('rollback')
    expect(connectClient.release).toHaveBeenCalled()
  })

  it('DELETE body sai (thiếu key) → 400', async () => {
    const resp = await handler(makeRequest('DELETE', {}))
    expect(resp.status).toBe(400)
  })

  it('DELETE thành công → xoá tính năng', async () => {
    query.mockResolvedValueOnce({ rowCount: 1 })
    const resp = await handler(makeRequest('DELETE', { key: 'oldkey' }))
    expect(resp.status).toBe(200)
    const data = await resp.json()
    expect(data).toEqual({ key: 'oldkey', removed: true })
  })

  it('GET lỗi DB (qua getPlanFeatureMatrix) → ném lỗi', async () => {
    getPlanFeatureMatrix.mockRejectedValueOnce(new Error('db down'))
    await expect(handler(makeRequest('GET'))).rejects.toThrow('db down')
  })
})
