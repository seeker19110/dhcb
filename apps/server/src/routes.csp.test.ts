// @vitest-environment node
// CSP của app: frame-src phải cho iframe runner chạy code (`run.…`) — thiếu là mọi bài code chết
// ngay khi bật VITE_CODE_RUNNER_ORIGIN (đặc tả docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md).
import { describe, expect, it } from 'vitest'
import { buildAppCsp, CSP_HEADER } from './routes'

const frameSrc = (csp: string) => csp.split('; ').find((d) => d.startsWith('frame-src '))

describe('CSP của app', () => {
  it('mặc định cho phép Google và runner run.donghanhcungban.org nhúng làm iframe', () => {
    expect(frameSrc(CSP_HEADER)).toBe(
      'frame-src https://accounts.google.com https://run.donghanhcungban.org',
    )
  })

  it('nhận nhiều origin runner; các directive khác giữ nguyên', () => {
    const csp = buildAppCsp(['https://run.a.org', 'https://run.b.org'])
    expect(frameSrc(csp)).toBe(
      'frame-src https://accounts.google.com https://run.a.org https://run.b.org',
    )
    expect(csp).toContain("frame-ancestors 'self'")
    expect(csp).toContain("object-src 'none'")
  })

  it('không còn tin 3 SDK đăng nhập không dùng (Q4 đặc tả)', () => {
    for (const host of ['connect.facebook.net', 'appleid.cdn-apple.com', 'alcdn.msauth.net']) {
      expect(CSP_HEADER).not.toContain(host)
    }
  })
})
