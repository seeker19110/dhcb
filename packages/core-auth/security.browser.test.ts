// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./authService.js', () => ({ validateSessionToken: vi.fn() }))
import { getCorsHeaders, isAllowedOrigin, isTrustedMutation, validateAuth } from './security'

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('ALLOWED_ORIGINS', 'https://donghanhcungban.org')
})
afterEach(() => vi.unstubAllEnvs())

function request(headers: Record<string, string> = {}, method = 'POST') {
  return new Request('https://donghanhcungban.org/api/profile', { method, headers })
}

describe('nguồn yêu cầu và cookie', () => {
  it('cấu hình thu hẹp không tự thêm tên miền mặc định', () => {
    expect(isAllowedOrigin('https://donghanhcungban.org')).toBe(true)
    expect(isAllowedOrigin('https://en-vi.donghanhcungban.org')).toBe(false)
    expect(
      getCorsHeaders(request({ Origin: 'https://en-vi.donghanhcungban.org' }))[
        'Access-Control-Allow-Credentials'
      ],
    ).toBeUndefined()
  })
  it.each([
    'null',
    'https://other.example',
    'https://donghanhcungban.org.evil.example',
    'https://donghanhcungban.org:444',
  ])('từ chối Origin %s trước tác dụng phụ', (Origin) => {
    expect(isTrustedMutation(request({ Origin, Cookie: 'session_token=opaque' }))).toBe(false)
  })
  it('cho phép POST từ đúng origin và cookie', () => {
    expect(
      isTrustedMutation(
        request({ Origin: 'https://donghanhcungban.org', Cookie: 'session_token=opaque' }),
      ),
    ).toBe(true)
  })
  it('thiếu Origin không được dùng cookie để sửa dữ liệu', () => {
    expect(isTrustedMutation(request({ Cookie: 'session_token=opaque' }))).toBe(false)
    expect(isTrustedMutation(request({ 'Sec-Fetch-Site': 'same-site' }))).toBe(false)
    expect(isTrustedMutation(request({ 'Sec-Fetch-Site': 'cross-site' }))).toBe(false)
  })
  it('webhook độc lập và GET vẫn đến handler để kiểm tra quyền riêng', () => {
    expect(isTrustedMutation(request({ Authorization: 'Apikey test' }))).toBe(true)
    expect(isTrustedMutation(request({ Cookie: 'session_token=opaque' }, 'GET'))).toBe(true)
  })
  it('cookie mã hóa lỗi trả unauthenticated thay vì ném lỗi 500', async () => {
    await expect(validateAuth(request({ Cookie: 'session_token=%zz' }))).resolves.toBeNull()
  })
})
