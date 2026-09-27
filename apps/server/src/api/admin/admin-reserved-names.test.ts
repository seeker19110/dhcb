import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './admin-reserved-names.js'

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

vi.mock('@dhcb/core-auth/adminAuth', () => ({
  isAdminUser: (userId?: string) => userId === 'a1',
}))

import { getPgPool } from '@dhcb/core-db/pgPool'
import { validateAuth, checkRateLimit } from '@dhcb/core-auth/security'

describe('/api/admin-reserved-names', () => {
  const queryMock = getPgPool().query as unknown as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('từ chối người dùng chưa đăng nhập (401)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/admin-reserved-names')
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('lấy danh sách từ cấm (GET 200)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    queryMock.mockResolvedValueOnce({ rows: [{ id: '1', phrase: 'admin' }] })

    const req = new Request('http://localhost/api/admin-reserved-names')
    const res = await handler(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.reservedNames).toHaveLength(1)
  })

  it('thêm từ cấm mới (POST 200)', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })

    queryMock.mockResolvedValueOnce({ rows: [] })

    const req = new Request('http://localhost/api/admin-reserved-names', {
      method: 'POST',
      body: JSON.stringify({ action: 'add', phrase: 'tester' }),
    })
    const res = await handler(req)
    expect(res.status).toBe(200)
  })

  function asAdmin() {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })
  }

  it('OPTIONS → 204 (preflight CORS), không cần đăng nhập', async () => {
    const res = await handler(
      new Request('http://localhost/api/admin-reserved-names', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
    expect(validateAuth).not.toHaveBeenCalled()
  })

  it('vượt rate limit → 429, chặn TRƯỚC khi xác thực', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce(false)
    const res = await handler(new Request('http://localhost/api/admin-reserved-names'))
    expect(res.status).toBe(429)
    expect(validateAuth).not.toHaveBeenCalled()
  })

  it('đăng nhập nhưng KHÔNG phải admin → 403', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'u9' })

    const res = await handler(new Request('http://localhost/api/admin-reserved-names'))
    expect(res.status).toBe(403)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('thêm từ cấm: chuẩn hoá về chữ thường và cắt khoảng trắng', async () => {
    asAdmin()
    queryMock.mockResolvedValueOnce({ rows: [] })
    const res = await handler(
      new Request('http://localhost/api/admin-reserved-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', phrase: '  ADMIN  ' }),
      }),
    )
    expect(res.status).toBe(200)
    // Nếu không chuẩn hoá, "ADMIN" và "admin" thành 2 dòng khác nhau → lọc tên hụt.
    expect(queryMock.mock.calls[0]?.[1]).toEqual(['admin'])
  })

  it('xoá từ cấm theo id (POST remove)', async () => {
    asAdmin()
    queryMock.mockResolvedValueOnce({ rows: [] })
    const res = await handler(
      new Request('http://localhost/api/admin-reserved-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', id: '123e4567-e89b-42d3-a456-426614174000' }),
      }),
    )
    expect(res.status).toBe(200)
    expect(String(queryMock.mock.calls[0]?.[0])).toContain('delete from public.reserved_names')
  })

  it('action lạ → từ chối, không đụng DB', async () => {
    asAdmin()
    const res = await handler(
      new Request('http://localhost/api/admin-reserved-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'xoa-sach' }),
      }),
    )
    expect(res.status).toBe(400)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('body không phải JSON hợp lệ → 400', async () => {
    asAdmin()
    const res = await handler(
      new Request('http://localhost/api/admin-reserved-names', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{hong',
      }),
    )
    expect(res.status).toBe(400)
  })

  it('method lạ (DELETE) → 405', async () => {
    asAdmin()
    const res = await handler(
      new Request('http://localhost/api/admin-reserved-names', { method: 'DELETE' }),
    )
    expect(res.status).toBe(405)
  })
})
