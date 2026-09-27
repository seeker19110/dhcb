import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './admin-tts-cache.js'

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
vi.mock('@dhcb/core-ai/fileStorage', () => ({
  getR2PublicBaseUrl: vi.fn(() => 'https://pub-abc.r2.dev'),
}))
vi.mock('@dhcb/core-ai/ttsCacheAudit', () => ({ runTtsCacheAudit: vi.fn() }))

import { getPgPool } from '@dhcb/core-db/pgPool'
import { validateAuth, checkRateLimit } from '@dhcb/core-auth/security'
import { getR2PublicBaseUrl } from '@dhcb/core-ai/fileStorage'
import { runTtsCacheAudit } from '@dhcb/core-ai/ttsCacheAudit'

const queryMock = getPgPool().query as unknown as ReturnType<typeof vi.fn>

function asAdmin() {
  vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'a1' })
}

describe('/api/admin-tts-cache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('chưa đăng nhập → 401', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce(null)
    const res = await handler(new Request('http://localhost/api/admin-tts-cache'))
    expect(res.status).toBe(401)
  })

  it('đăng nhập nhưng KHÔNG phải admin → 403', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce({ userId: 'u9' })

    const res = await handler(new Request('http://localhost/api/admin-tts-cache'))
    expect(res.status).toBe(403)
  })

  it('GET trả tỉ lệ hit tính đúng', async () => {
    asAdmin()
    queryMock
      .mockResolvedValueOnce({
        rows: [
          { day: '2026-08-12', hits: 80, misses: 20 },
          { day: '2026-08-13', hits: 20, misses: 0 },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ lang: 'en-US', voice: 'Algieba', hits: 100, misses: 20 }] })
      .mockResolvedValueOnce({ rows: [{ total: 500, on_r2: 480 }] })
      .mockResolvedValueOnce({ rows: [{ total: 300, on_r2: 300 }] })
      .mockResolvedValueOnce({ rows: [] })

    const res = await handler(new Request('http://localhost/api/admin-tts-cache?days=30'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.stats.totalHits).toBe(100)
    expect(body.stats.totalMisses).toBe(20)
    expect(body.stats.hitRate).toBeCloseTo(100 / 120)
    expect(body.quick.ttsCache).toEqual({ total: 500, on_r2: 480 })
  })

  it('chưa có lượt gọi nào → hitRate là null, KHÔNG phải 0', async () => {
    asAdmin()
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: 0, on_r2: 0 }] })
      .mockResolvedValueOnce({ rows: [{ total: 0, on_r2: 0 }] })
      .mockResolvedValueOnce({ rows: [] })

    const res = await handler(new Request('http://localhost/api/admin-tts-cache'))
    const body = await res.json()
    // Phân biệt "chưa có dữ liệu" với "hit rate thật sự bằng 0" — UI hiển thị khác nhau.
    expect(body.stats.hitRate).toBeNull()
  })

  it('days vượt trần → kẹp về tối đa 180', async () => {
    asAdmin()
    queryMock.mockResolvedValue({ rows: [] })
    const res = await handler(new Request('http://localhost/api/admin-tts-cache?days=9999'))
    const body = await res.json()
    expect(body.days).toBe(180)
  })

  it('days rác (không phải số) → về mặc định 30', async () => {
    asAdmin()
    queryMock.mockResolvedValue({ rows: [] })
    const res = await handler(new Request('http://localhost/api/admin-tts-cache?days=abc'))
    expect((await res.json()).days).toBe(30)
  })

  it('POST scan → 202 và tạo bản ghi quét', async () => {
    asAdmin()
    queryMock
      .mockResolvedValueOnce({ rows: [] }) // không có lượt nào đang chạy
      .mockResolvedValueOnce({ rows: [{ id: 'audit-1' }] }) // insert
      .mockResolvedValue({ rows: [] }) // các update chạy nền

    const res = await handler(
      new Request('http://localhost/api/admin-tts-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' }),
      }),
    )
    expect(res.status).toBe(202)
    expect((await res.json()).auditId).toBe('audit-1')
  })

  it('POST scan khi ĐANG có lượt quét chạy dở → 409, không tạo thêm', async () => {
    asAdmin()
    queryMock.mockResolvedValueOnce({ rows: [{ id: 'dang-chay' }] })

    const res = await handler(
      new Request('http://localhost/api/admin-tts-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' }),
      }),
    )
    expect(res.status).toBe(409)
    // Chỉ đúng 1 truy vấn (kiểm tra), KHÔNG có insert.
    expect(queryMock).toHaveBeenCalledTimes(1)
  })

  it('POST action lạ → từ chối (không chạy quét)', async () => {
    asAdmin()
    const res = await handler(
      new Request('http://localhost/api/admin-tts-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'xoa-het' }),
      }),
    )
    expect(res.status).toBe(400)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('method lạ → 405', async () => {
    asAdmin()
    const res = await handler(
      new Request('http://localhost/api/admin-tts-cache', { method: 'DELETE' }),
    )
    expect(res.status).toBe(405)
  })

  it('OPTIONS → 204 (preflight CORS), không cần đăng nhập', async () => {
    const res = await handler(
      new Request('http://localhost/api/admin-tts-cache', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
    expect(validateAuth).not.toHaveBeenCalled()
  })

  it('vượt rate limit → 429, chặn TRƯỚC cả khi xác thực', async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce(false)
    const res = await handler(new Request('http://localhost/api/admin-tts-cache'))
    expect(res.status).toBe(429)
    expect(validateAuth).not.toHaveBeenCalled()
  })

  it('chưa cấu hình R2_PUBLIC_BASE_URL → quick là null, không nổ', async () => {
    asAdmin()
    vi.mocked(getR2PublicBaseUrl).mockReturnValueOnce(undefined)
    queryMock.mockResolvedValue({ rows: [] })
    const res = await handler(new Request('http://localhost/api/admin-tts-cache'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.quick).toBeNull()
    expect(body.r2PublicBaseUrl).toBeNull()
  })

  it('quét nền XONG → ghi status done kèm kết quả', async () => {
    asAdmin()
    const fakeResult = { ttsCache: { total: 1 }, pronunciations: { total: 0 } }
    vi.mocked(runTtsCacheAudit).mockResolvedValueOnce(
      fakeResult as unknown as Awaited<ReturnType<typeof runTtsCacheAudit>>,
    )
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'audit-ok' }] })
      .mockResolvedValue({ rows: [] })

    await handler(
      new Request('http://localhost/api/admin-tts-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' }),
      }),
    )
    // Quét chạy nền — chờ microtask cho nó kịp ghi kết quả.
    await new Promise((r) => setTimeout(r, 0))
    const update = queryMock.mock.calls.find((c) => String(c[0]).includes("status = 'done'"))
    expect(update).toBeTruthy()
    expect(update?.[1]).toEqual(['audit-ok', JSON.stringify(fakeResult)])
  })

  it('quét nền LỖI → ghi status error kèm message, không để promise reject trôi nổi', async () => {
    asAdmin()
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(runTtsCacheAudit).mockRejectedValueOnce(new Error('R2 sập'))
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'audit-err' }] })
      .mockResolvedValue({ rows: [] })

    await handler(
      new Request('http://localhost/api/admin-tts-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' }),
      }),
    )
    await new Promise((r) => setTimeout(r, 0))
    const update = queryMock.mock.calls.find((c) => String(c[0]).includes("status = 'error'"))
    expect(update?.[1]).toEqual(['audit-err', 'R2 sập'])
    errSpy.mockRestore()
  })

  it('insert bản ghi quét không trả id → báo lỗi, không chạy quét', async () => {
    asAdmin()
    queryMock.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] })
    const res = await handler(
      new Request('http://localhost/api/admin-tts-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' }),
      }),
    )
    expect(res.status).toBe(409)
    expect(runTtsCacheAudit).not.toHaveBeenCalled()
  })
})
