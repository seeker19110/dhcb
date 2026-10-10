import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: vi.fn(async () => true),
  validateAuth: vi.fn(),
  logSecurityEvent: () => {},
}))
vi.mock('@dhcb/core-auth/authService', () => ({
  getUserById: vi.fn(),
}))

const query = vi.fn()

async function importHandler() {
  vi.resetModules()
  const { getPgPool } = await import('@dhcb/core-db/pgPool')
  vi.mocked(getPgPool).mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  const mod = await import('./hub-stats.js')
  return mod.default
}

beforeEach(() => {
  query.mockReset()
  vi.clearAllMocks()
  vi.stubEnv('ADMIN_USER_IDS', 'admin-123')
  vi.stubEnv('ADMIN_EMAILS', 'admin@donghanhcungban.org')
})

afterEach(() => vi.unstubAllEnvs())

describe('/api/hub-stats', () => {
  it('người dùng chưa đăng nhập → trả { isAdmin: false, loggedIn: false }, KHÔNG trả totalUsers hay totalEnglishSessions', async () => {
    const { validateAuth } = await import('@dhcb/core-auth/security')
    vi.mocked(validateAuth).mockResolvedValue(null)

    const handler = await importHandler()
    const resp = await handler(new Request('http://localhost/api/hub-stats'))
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as Record<string, unknown>
    expect(data.isAdmin).toBe(false)
    expect(data.loggedIn).toBe(false)
    expect(data.totalUsers).toBeUndefined()
    expect(data.totalEnglishSessions).toBeUndefined()
    expect(query).not.toHaveBeenCalled()
  })

  it('người dùng thông thường đã đăng nhập → trả { isAdmin: false, loggedIn: true, userName }, KHÔNG trả totalUsers hay totalEnglishSessions', async () => {
    const { validateAuth } = await import('@dhcb/core-auth/security')
    const { getUserById } = await import('@dhcb/core-auth/authService')

    vi.mocked(validateAuth).mockResolvedValue({ userId: 'user-123' })
    vi.mocked(getUserById).mockResolvedValue({ id: 'user-123', email: 'student@example.com' })
    query.mockResolvedValueOnce({ rows: [{ name: 'Nguyễn Văn A' }] }) // public.profiles

    const handler = await importHandler()
    const resp = await handler(new Request('http://localhost/api/hub-stats'))
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as Record<string, unknown>
    expect(data.isAdmin).toBe(false)
    expect(data.loggedIn).toBe(true)
    expect(data.userName).toBe('Nguyễn Văn A')
    expect(data.totalUsers).toBeUndefined()
    expect(data.totalEnglishSessions).toBeUndefined()
  })

  it('admin đã đăng nhập → trả { isAdmin: true, loggedIn: true, totalUsers, totalEnglishSessions }', async () => {
    const { validateAuth } = await import('@dhcb/core-auth/security')
    const { getUserById } = await import('@dhcb/core-auth/authService')

    vi.mocked(validateAuth).mockResolvedValue({ userId: 'admin-123' })
    vi.mocked(getUserById).mockResolvedValue({
      id: 'admin-123',
      email: 'admin@donghanhcungban.org',
    })
    query
      .mockResolvedValueOnce({ rows: [{ name: 'Admin Master' }] }) // public.profiles
      .mockResolvedValueOnce({ rows: [{ count: '1234' }] }) // public.users
      .mockResolvedValueOnce({ rows: [{ count: '5678' }] }) // english.*_sessions

    const handler = await importHandler()
    const resp = await handler(new Request('http://localhost/api/hub-stats'))
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as Record<string, unknown>
    expect(data.isAdmin).toBe(true)
    expect(data.loggedIn).toBe(true)
    expect(data.userName).toBe('Admin Master')
    expect(data.totalUsers).toBe(1234)
    expect(data.totalEnglishSessions).toBe(5678)
  })

  it('email admin trên tài khoản khác không làm lộ thống kê', async () => {
    const { validateAuth } = await import('@dhcb/core-auth/security')
    const { getUserById } = await import('@dhcb/core-auth/authService')
    vi.mocked(validateAuth).mockResolvedValue({ userId: 'attacker-123' })
    vi.mocked(getUserById).mockResolvedValue({
      id: 'attacker-123',
      email: 'admin@donghanhcungban.org',
    })
    query.mockResolvedValueOnce({ rows: [{ name: 'Admin' }] })
    const handler = await importHandler()
    const response = await handler(new Request('http://localhost/api/hub-stats'))
    const body = await response.json()
    expect(body.isAdmin).toBe(false)
    expect(body.totalUsers).toBeUndefined()
    expect(body.totalEnglishSessions).toBeUndefined()
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('method khác GET → 405, không đụng DB', async () => {
    const handler = await importHandler()
    const resp = await handler(new Request('http://localhost/api/hub-stats', { method: 'POST' }))
    expect(resp.status).toBe(405)
  })

  it('OPTIONS trả 204 và rate limit trả 429', async () => {
    const { checkRateLimit } = await import('@dhcb/core-auth/security')
    const handler = await importHandler()

    const resOpt = await handler(
      new Request('http://localhost/api/hub-stats', { method: 'OPTIONS' }),
    )
    expect(resOpt.status).toBe(204)

    vi.mocked(checkRateLimit).mockResolvedValueOnce(false)
    const resRate = await handler(new Request('http://localhost/api/hub-stats'))
    expect(resRate.status).toBe(429)
  })

  it('fallback tên từ email khi profile name null, và fail-open khi DB lỗi', async () => {
    const { validateAuth } = await import('@dhcb/core-auth/security')
    const { getUserById } = await import('@dhcb/core-auth/authService')

    vi.mocked(validateAuth).mockResolvedValue({ userId: 'u1' })
    vi.mocked(getUserById).mockResolvedValue({ id: 'u1', email: 'john.doe@example.com' })
    query.mockResolvedValueOnce({ rows: [{ name: null }] })

    const handler = await importHandler()
    const resp = await handler(new Request('http://localhost/api/hub-stats'))
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as Record<string, unknown>
    expect(data.userName).toBe('john.doe')

    // DB throw error in try block
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.mocked(getUserById).mockRejectedValueOnce(new Error('DB failure'))
    const respFail = await handler(new Request('http://localhost/api/hub-stats'))
    // Lỗi phải được ghi log, không nuốt im lặng.
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('[hub-stats]'), expect.any(Error))
    warn.mockRestore()
    expect(respFail.status).toBe(200)
    const dataFail = (await respFail.json()) as Record<string, unknown>
    expect(dataFail.loggedIn).toBe(true)
    expect(dataFail.isAdmin).toBe(false)
  })
})
