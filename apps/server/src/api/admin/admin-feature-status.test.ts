import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './admin-feature-status.js'

vi.mock('@dhcb/core-db/pgPool', () => {
  const query = vi.fn()
  return { getPgPool: () => ({ query }) }
})

vi.mock('@dhcb/core-auth/security', () => ({
  validateAuth: vi.fn(),
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: vi.fn(() => Promise.resolve(true)),
  logSecurityEvent: vi.fn(),
}))

vi.mock('@dhcb/core-auth/authService', () => ({
  getUserById: vi.fn(),
}))

vi.mock('@dhcb/core-auth/adminAuth', () => ({
  isAdminUser: (userId?: string) => userId === 'a1',
}))

vi.mock('../_lib/featureStatusChecks.js', () => ({
  runAllFeatureChecks: vi.fn(() =>
    Promise.resolve([
      { key: 'database', label: 'PostgreSQL', usesApi: false, status: 'up', latencyMs: 3 },
    ]),
  ),
  summarizeOverallStatus: vi.fn(() => 'up'),
}))

import { getPgPool } from '@dhcb/core-db/pgPool'
import { validateAuth, logSecurityEvent, checkRateLimit } from '@dhcb/core-auth/security'
import { getUserById } from '@dhcb/core-auth/authService'
import { runAllFeatureChecks, summarizeOverallStatus } from '../_lib/featureStatusChecks.js'

type UserInfo = Awaited<ReturnType<typeof getUserById>>

describe('/api/admin-feature-status', () => {
  const queryMock = getPgPool().query as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUserById).mockReset()
    delete process.env.FEATURE_STATUS_CRON_KEY
  })

  it('OPTIONS trả 204 (preflight CORS)', async () => {
    const req = new Request('http://localhost/api/admin-feature-status', { method: 'OPTIONS' })
    const res = await handler(req)
    expect(res.status).toBe(204)
  })

  it('GET trả latest=null khi chưa có lượt kiểm tra nào', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 'a1',
      email: 'admin@example.com',
    } as UserInfo)
    queryMock.mockResolvedValueOnce({ rows: [] })
    const req = new Request('http://localhost/api/admin-feature-status')
    const res = await handler(req)
    const json = await res.json()
    expect(json.latest).toBeNull()
    expect(json.history).toEqual([])
  })

  it('từ chối khi vượt hạn mức lượt gọi (429)', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce(false)
    const req = new Request('http://localhost/api/admin-feature-status')
    const res = await handler(req)
    expect(res.status).toBe(429)
  })

  it('GET từ chối người dùng chưa đăng nhập (401)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/admin-feature-status')
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('GET từ chối người dùng không phải admin (403)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'u1' })
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 'a1',
      email: 'user@example.com',
    } as UserInfo)
    const req = new Request('http://localhost/api/admin-feature-status')
    const res = await handler(req)
    expect(res.status).toBe(403)
  })

  it('GET trả về lượt gần nhất + lịch sử cho admin (200)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 'a1',
      email: 'admin@example.com',
    } as UserInfo)
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 1, overall_status: 'up', results: [] }],
    })
    const req = new Request('http://localhost/api/admin-feature-status')
    const res = await handler(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.latest.id).toBe(1)
    expect(json.history).toHaveLength(1)
  })

  it('POST từ chối khi không có cron key hợp lệ và chưa đăng nhập (401)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/admin-feature-status', { method: 'POST' })
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('POST chạy kiểm tra khi admin bấm thủ công (200, triggered_by=manual)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 'a1',
      email: 'admin@example.com',
    } as UserInfo)
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 2, triggered_by: 'manual', overall_status: 'up', results: [] }],
    })
    const req = new Request('http://localhost/api/admin-feature-status', { method: 'POST' })
    const res = await handler(req)
    expect(res.status).toBe(200)
    expect(runAllFeatureChecks).toHaveBeenCalledOnce()
    const insertCall = queryMock.mock.calls[0]!
    expect(insertCall[1][0]).toBe('manual')
  })

  it('POST chạy kiểm tra khi cron VPS gọi bằng x-cron-key hợp lệ (200, không cần đăng nhập)', async () => {
    process.env.FEATURE_STATUS_CRON_KEY = 'secret-key'
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 3, triggered_by: 'cron', overall_status: 'up', results: [] }],
    })
    const req = new Request('http://localhost/api/admin-feature-status', {
      method: 'POST',
      headers: { 'x-cron-key': 'secret-key' },
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    expect(validateAuth).not.toHaveBeenCalled()
    const insertCall = queryMock.mock.calls[0]!
    expect(insertCall[1][0]).toBe('cron')
  })

  it('POST từ chối cron key sai (401, không lộ cho người chưa đăng nhập)', async () => {
    process.env.FEATURE_STATUS_CRON_KEY = 'secret-key'
    vi.mocked(validateAuth).mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/admin-feature-status', {
      method: 'POST',
      headers: { 'x-cron-key': 'wrong-key' },
    })
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('POST từ chối người đăng nhập nhưng không phải admin (403)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'u1' })
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 'a1',
      email: 'user@example.com',
    } as UserInfo)
    const req = new Request('http://localhost/api/admin-feature-status', { method: 'POST' })
    const res = await handler(req)
    expect(res.status).toBe(403)
  })

  it('POST ghi log bảo mật khi overall_status không phải up (degraded)', async () => {
    vi.mocked(summarizeOverallStatus).mockReturnValueOnce('degraded')
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })
    vi.mocked(getUserById).mockResolvedValueOnce({
      id: 'a1',
      email: 'admin@example.com',
    } as UserInfo)
    queryMock.mockResolvedValueOnce({
      rows: [{ id: 4, triggered_by: 'manual', overall_status: 'degraded', results: [] }],
    })
    const req = new Request('http://localhost/api/admin-feature-status', { method: 'POST' })
    const res = await handler(req)
    expect(res.status).toBe(200)
    expect(logSecurityEvent).toHaveBeenCalledWith(
      'FEATURE_STATUS_DEGRADED',
      expect.any(String),
      expect.objectContaining({ overallStatus: 'degraded' }),
    )
  })

  it('từ chối phương thức không hỗ trợ (405)', async () => {
    const req = new Request('http://localhost/api/admin-feature-status', { method: 'DELETE' })
    const res = await handler(req)
    expect(res.status).toBe(405)
  })
})
