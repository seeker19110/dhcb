// api/healthDeep.test.ts — Unit test cho /api/health/deep endpoint

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// pingRedis được mock để test KHÔNG mở kết nối Redis thật (CI không có Redis, và chờ
// connectTimeout thật sẽ làm test chậm + để hở handle).
const pingRedisMock = vi.fn()
const validateAuthMock = vi.fn()
vi.mock('@dhcb/core-auth/security', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dhcb/core-auth/security')>()),
  pingRedis: () => pingRedisMock(),
  validateAuth: () => validateAuthMock(),
}))

import handler, { checkSystemHealth } from './healthDeep.js'
import * as pgPoolModule from '@dhcb/core-db/pgPool'

describe('Deep Health Check API (/api/health/deep)', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
    pingRedisMock.mockReset()
    pingRedisMock.mockResolvedValue({ ok: true, latencyMs: 3 })
    validateAuthMock.mockReset()
    validateAuthMock.mockResolvedValue(null)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('trả về 200 và healthy khi database query SELECT 1 thành công', async () => {
    process.env.STORAGE_DRIVER = 'r2'
    process.env.REDIS_URL = 'redis://localhost:6379'

    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue({
      query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
      totalCount: 5,
      idleCount: 4,
      waitingCount: 0,
    } as unknown as ReturnType<typeof pgPoolModule.getPgPool>)

    const { statusCode, result } = await checkSystemHealth()

    expect(statusCode).toBe(200)
    expect(result.status).toBe('healthy')
    expect(result.checks.database.status).toBe('up')
    expect(result.checks.database.pool?.total).toBe(5)
    expect(result.checks.storage.status).toBe('up')
    expect(result.checks.storage.driver).toBe('r2')
    expect(result.checks.cache.type).toBe('redis')
    expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0)
    expect(result.memory.rssMb).toBeGreaterThan(0)
  })

  it('xử lý cấu hình mặc định storage local và cache in-memory khi không có env', async () => {
    delete process.env.STORAGE_DRIVER
    delete process.env.REDIS_URL

    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue({
      query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
      totalCount: 1,
      idleCount: 1,
      waitingCount: 0,
    } as unknown as ReturnType<typeof pgPoolModule.getPgPool>)

    const { statusCode, result } = await checkSystemHealth()

    expect(statusCode).toBe(200)
    expect(result.checks.storage.status).toBe('unconfigured')
    expect(result.checks.storage.driver).toBe('local')
    expect(result.checks.cache.type).toBe('in-memory')
  })

  it('trả về 503 và unhealthy khi database query bị lỗi Error instance', async () => {
    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue({
      query: vi.fn().mockRejectedValue(new Error('Connection terminated unexpectedly')),
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0,
    } as unknown as ReturnType<typeof pgPoolModule.getPgPool>)

    const { statusCode, result } = await checkSystemHealth()

    expect(statusCode).toBe(503)
    expect(result.status).toBe('unhealthy')
    expect(result.checks.database.status).toBe('down')
    expect(result.checks.database.error).toContain('Connection terminated')
  })

  it('trả về 503 và unhealthy khi database throw chuỗi không phải Error', async () => {
    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue({
      query: vi.fn().mockRejectedValue('Fatal string error'),
      totalCount: 0,
      idleCount: 0,
      waitingCount: 0,
    } as unknown as ReturnType<typeof pgPoolModule.getPgPool>)

    const { statusCode, result } = await checkSystemHealth()

    expect(statusCode).toBe(503)
    expect(result.status).toBe('unhealthy')
    expect(result.checks.database.error).toBe('Fatal string error')
  })

  it('handler phản hồi request OPTIONS bằng 204 No Content', async () => {
    const req = new Request('http://localhost/api/health/deep', { method: 'OPTIONS' })
    const res = await handler(req)

    expect(res.status).toBe(204)
  })

  it('handler phản hồi request GET đúng định dạng JSON', async () => {
    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue({
      query: vi.fn().mockResolvedValue({ rows: [] }),
      totalCount: 2,
      idleCount: 2,
      waitingCount: 0,
    } as unknown as ReturnType<typeof pgPoolModule.getPgPool>)

    const req = new Request('http://localhost/api/health/deep', { method: 'GET' })
    const res = await handler(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(res.headers.get('Cache-Control')).toContain('no-store')

    const body = (await res.json()) as { status: string }
    expect(body.status).toBe('healthy')
  })

  it('handler từ chối method không phải GET bằng 405 Method Not Allowed', async () => {
    const req = new Request('http://localhost/api/health/deep', { method: 'POST' })
    const res = await handler(req)

    expect(res.status).toBe(405)
  })

  it('chỉ ID admin được xem nội tình hệ thống, ADMIN_EMAILS không cấp quyền', async () => {
    process.env.ADMIN_USER_IDS = 'trusted-admin'
    process.env.ADMIN_EMAILS = 'admin@example.com'
    mockDbOk()
    validateAuthMock.mockResolvedValue({ userId: 'other-user' })
    const request = () => new Request('http://localhost/api/health/deep')
    const denied = await handler(request())
    const publicBody = await denied.json()
    expect(publicBody).toEqual({ status: 'healthy', timestamp: expect.any(String) })

    validateAuthMock.mockResolvedValue({ userId: 'trusted-admin' })
    const allowed = await handler(request())
    const adminBody = await allowed.json()
    expect(adminBody.checks.database.status).toBe('up')
    expect(adminBody.memory.rssMb).toBeGreaterThan(0)
  })

  // ── Cache/Redis: ghim đúng lỗi ĐÃ TỪNG CÓ ────────────────────────────────
  // [2026-08-23] Trước bản vá, trường này ghi CỨNG `status: 'up'` và chỉ đọc REDIS_URL để đoán
  // loại cache. Redis chết hoàn toàn mà health check vẫn báo "up" — log production đầy dòng
  // "[Security] Redis lỗi (Stream isn't writeable…)" trong khi mọi cổng giám sát đều xanh.
  it('cache: PING được → up kèm độ trễ', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379'
    pingRedisMock.mockResolvedValue({ ok: true, latencyMs: 7 })
    mockDbOk()

    const { result } = await checkSystemHealth()
    expect(result.checks.cache.status).toBe('up')
    expect(result.checks.cache.latencyMs).toBe(7)
  })

  it('cache: Redis CHẾT → báo down kèm lý do (KHÔNG được báo up như bản cũ)', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379'
    pingRedisMock.mockResolvedValue({ ok: false, error: "Stream isn't writeable" })
    mockDbOk()

    const { statusCode, result } = await checkSystemHealth()
    expect(result.checks.cache.status).toBe('down')
    expect(result.checks.cache.error).toContain('Stream')
    // Redis hỏng KHÔNG kéo cả hệ thống xuống: rate limit tự rơi về Map, app vẫn phục vụ.
    expect(result.status).toBe('healthy')
    expect(statusCode).toBe(200)
  })

  it('cache: chưa đặt REDIS_URL → unconfigured, KHÔNG ping', async () => {
    delete process.env.REDIS_URL
    mockDbOk()

    const { result } = await checkSystemHealth()
    expect(result.checks.cache.status).toBe('unconfigured')
    expect(result.checks.cache.type).toBe('in-memory')
    expect(pingRedisMock).not.toHaveBeenCalled()
  })

  function mockDbOk() {
    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue({
      query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
      totalCount: 1,
      idleCount: 1,
      waitingCount: 0,
    } as unknown as ReturnType<typeof pgPoolModule.getPgPool>)
  }
})

describe('/api/health/deep — sổ chống lạm dụng (0545)', () => {
  const originalEnv = { ...process.env }
  const okPool = {
    query: vi.fn().mockResolvedValue({ rows: [] }),
    totalCount: 1,
    idleCount: 1,
    waitingCount: 0,
  } as unknown as ReturnType<typeof pgPoolModule.getPgPool>

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env = { ...originalEnv }
    delete process.env.REDIS_URL
    vi.spyOn(pgPoolModule, 'getPgPool').mockReturnValue(okPool)
    validateAuthMock.mockReset()
    validateAuthMock.mockResolvedValue(null)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it.each([
    [undefined, { status: 'disabled', reason: 'missing' }],
    ['ngan', { status: 'disabled', reason: 'invalid' }],
    [Buffer.alloc(32, 1).toString('base64'), { status: 'enabled' }],
  ])('khoá %s ⇒ %j, KHÔNG đổi trạng thái tổng (vẫn 200 healthy)', async (key, expected) => {
    if (key === undefined) delete process.env.ERASED_BENEFIT_LEDGER_KEY
    else process.env.ERASED_BENEFIT_LEDGER_KEY = key
    const { statusCode, result } = await checkSystemHealth()
    expect(result.checks.erasedBenefitLedger).toEqual(expected)
    expect(statusCode).toBe(200)
    expect(result.status).toBe('healthy')
  })

  it('người KHÔNG phải admin không thấy trạng thái sổ (không công bố "chống lạm dụng đang tắt")', async () => {
    delete process.env.ERASED_BENEFIT_LEDGER_KEY
    const res = await handler(new Request('http://localhost/api/health/deep'))
    const body = (await res.json()) as Record<string, unknown>
    expect(JSON.stringify(body)).not.toContain('erasedBenefitLedger')
  })
})
