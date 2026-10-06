// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
const mocks = vi.hoisted(() => ({
  change: vi.fn(),
  status: vi.fn(),
  count: vi.fn(),
  auth: vi.fn(),
  rate: vi.fn(),
}))
vi.mock('./changePassword.js', () => ({
  changePassword: mocks.change,
  getPasswordStatus: mocks.status,
}))
vi.mock('./security.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./security.js')>()
  return {
    ...actual,
    validateAuth: mocks.auth,
    consumeWindowCounter: mocks.count,
    checkRateLimit: mocks.rate,
    logSecurityEvent: vi.fn(),
  }
})
import handler from './auth.js'
beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ userId: 'authenticated-user' })
  mocks.count.mockResolvedValue(true)
  mocks.rate.mockResolvedValue(true)
  mocks.change.mockResolvedValue({ ok: true })
  mocks.status.mockResolvedValue(true)
})
function request(body: unknown, origin = 'http://localhost:5173') {
  return new Request('http://localhost:5173/api/auth', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
      host: 'localhost:5173',
      cookie: 'session_token=example-session',
    },
    body: JSON.stringify(body),
  })
}
const valid = {
  action: 'change-password',
  currentPassword: 'old password here',
  newPassword: 'new password here',
}
describe('password change API', () => {
  it('requires an authenticated cookie session', async () => {
    mocks.auth.mockResolvedValue(null)
    expect((await handler(request(valid))).status).toBe(401)
    expect(mocks.change).not.toHaveBeenCalled()
  })
  it('rejects cross-origin mutation', async () => {
    expect((await handler(request(valid, 'https://evil.invalid'))).status).toBe(403)
    expect(mocks.change).not.toHaveBeenCalled()
  })
  it('throttles by account before invoking password hash work', async () => {
    mocks.count.mockResolvedValue(false)
    const res = await handler(request(valid))
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('900')
    expect(mocks.count).toHaveBeenCalledWith('change-password:authenticated-user', 5, 900000)
    expect(mocks.change).not.toHaveBeenCalled()
  })
  it.each([
    { ...valid, userId: 'victim' },
    { ...valid, currentPassword: '' },
    { ...valid, newPassword: 'short' },
    { ...valid, newPassword: '😀'.repeat(19) },
    { ...valid, newPassword: '😀'.repeat(8) },
  ])('rejects invalid request %# without writes', async (body) => {
    expect((await handler(request(body))).status).toBe(400)
    expect(mocks.change).not.toHaveBeenCalled()
  })
  it('returns only success, uses authenticated ID and clears the cookie', async () => {
    const res = await handler(request(valid))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(mocks.change).toHaveBeenCalledWith(
      'authenticated-user',
      valid.currentPassword,
      valid.newPassword,
    )
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0')
    expect(res.headers.get('cache-control')).toBe('no-store')
  })
  it('preserves password spaces', async () => {
    await handler(request({ ...valid, newPassword: '  new password here  ' }))
    expect(mocks.change).toHaveBeenCalledWith(
      'authenticated-user',
      valid.currentPassword,
      '  new password here  ',
    )
  })
  it.each(['wrong_password', 'same_password', 'no_password', 'changed_concurrently'])(
    'returns typed failure %s and does not clear the cookie',
    async (reason) => {
      mocks.change.mockResolvedValue({ ok: false, reason })
      const res = await handler(request(valid))
      expect(res.status).toBe(reason === 'changed_concurrently' ? 409 : 400)
      expect((await res.json()).code).toBe(reason)
      expect(res.headers.get('set-cookie')).toBeNull()
    },
  )
  it('DB error fails closed without exposing error or password', async () => {
    mocks.change.mockRejectedValue(new Error('private database detail'))
    const res = await handler(request(valid))
    expect(res.status).toBe(503)
    const text = await res.text()
    expect(text).not.toContain('private database detail')
    expect(text).not.toContain(valid.newPassword)
  })
  it.each([true, false, null])(
    'status is authenticated and returns no hash (%s)',
    async (hasPassword) => {
      mocks.status.mockResolvedValue(hasPassword)
      const res = await handler(
        new Request('http://localhost:5173/api/auth?action=password-status'),
      )
      expect(res.status).toBe(hasPassword === null ? 401 : 200)
      if (hasPassword !== null) expect(await res.json()).toEqual({ hasPassword })
      expect(mocks.status).toHaveBeenCalledWith('authenticated-user')
    },
  )
  it('status cannot be queried without auth', async () => {
    mocks.auth.mockResolvedValue(null)
    expect(
      (await handler(new Request('http://localhost:5173/api/auth?action=password-status'))).status,
    ).toBe(401)
    expect(mocks.status).not.toHaveBeenCalled()
  })
  it('status fails safely when database is down', async () => {
    mocks.status.mockRejectedValue(new Error('secret'))
    expect(
      (await handler(new Request('http://localhost:5173/api/auth?action=password-status'))).status,
    ).toBe(503)
  })
})
