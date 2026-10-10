import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './admin-system-control.js'

vi.mock('@dhcb/core-db/pgPool', () => {
  const query = vi.fn()
  return { getPgPool: () => ({ query }) }
})

vi.mock('@dhcb/core-auth/security', () => ({
  validateAuth: vi.fn(),
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: () => Promise.resolve(true),
  logSecurityEvent: vi.fn(),
}))

const invalidateSettingsCache = vi.fn()
vi.mock('@dhcb/core-db/settings', () => ({
  invalidateSettingsCache: () => invalidateSettingsCache(),
}))

vi.mock('@dhcb/core-auth/adminAuth', () => ({
  isAdminUser: (userId?: string) => userId === 'a1',
}))

import { getPgPool } from '@dhcb/core-db/pgPool'
import { validateAuth } from '@dhcb/core-auth/security'

describe('/api/admin-system-control', () => {
  const queryMock = getPgPool().query as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('từ chối người dùng chưa đăng nhập (401)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/admin-system-control')
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('đọc trạng thái circuit breaker (GET 200)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    queryMock.mockResolvedValueOnce({ rows: [{ ai_circuit_breaker: true }] })

    const req = new Request('http://localhost/api/admin-system-control')
    const res = await handler(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.circuitBreakerEnabled).toBe(true)
  })

  it('bật/tắt circuit breaker (POST 200)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const req = new Request('http://localhost/api/admin-system-control', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle-circuit-breaker', enabled: true }),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.circuitBreakerEnabled).toBe(true)
    // Cầu dao có hiệu lực ngay ở tiến trình này, không đợi hết TTL cache 30s.
    expect(invalidateSettingsCache).toHaveBeenCalledTimes(1)
  })

  it('POST khi không có hàng app_settings id=1 → 500, không báo đã đổi, không xoá cache', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })
    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const req = new Request('http://localhost/api/admin-system-control', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle-circuit-breaker', enabled: true }),
    })
    const res = await handler(req)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.circuitBreakerEnabled).toBeUndefined()
    expect(invalidateSettingsCache).not.toHaveBeenCalled()
    expect(errSpy).toHaveBeenCalledTimes(1)
    errSpy.mockRestore()
  })

  it('từ chối người dùng không phải admin (403)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'u1' })

    const req = new Request('http://localhost/api/admin-system-control')
    const res = await handler(req)
    expect(res.status).toBe(403)
  })

  it('tắt circuit breaker trả message "Đã tắt" (POST enabled=false)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    queryMock.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const req = new Request('http://localhost/api/admin-system-control', {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle-circuit-breaker', enabled: false }),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.circuitBreakerEnabled).toBe(false)
    expect(json.message).toContain('Đã tắt')
  })

  it('từ chối HTTP method không hỗ trợ (405)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    const req = new Request('http://localhost/api/admin-system-control', {
      method: 'PUT',
    })
    const res = await handler(req)
    expect(res.status).toBe(405)
  })
})
