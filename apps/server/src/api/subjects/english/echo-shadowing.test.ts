import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState: { user: { userId: string } | null } = {
  user: { userId: 'user-1' },
}
let rateLimitOk = true

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))

import handler from './echo-shadowing.js'

function req(method: string, body?: unknown, searchParams?: string) {
  const url = searchParams
    ? `http://localhost/api/echo-shadowing?${searchParams}`
    : 'http://localhost/api/echo-shadowing'
  return new Request(url, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

describe('api/echo-shadowing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = { userId: 'user-1' }
    rateLimitOk = true
  })

  it('handles GET list of passages and single passage', async () => {
    const listRes = await handler(req('GET'))
    expect(listRes.status).toBe(200)
    const listData = await listRes.json()
    expect(listData.passages.length).toBeGreaterThan(0)

    const singleRes = await handler(req('GET', undefined, 'passageId=jobs_stanford_commencement'))
    expect(singleRes.status).toBe(200)
    const singleData = await singleRes.json()
    expect(singleData.passage.title).toContain('Steve Jobs')
  })

  // Changelog 0484: POST từng trả "Band" tính từ số ngẫu nhiên client gửi lên. Nay 501, không trả
  // bất kỳ con số nào — kể cả khi gửi đủ trường.
  it('POST trả 501 kèm lời giải thích, KHÔNG trả kết quả chấm', async () => {
    const res = await handler(
      req('POST', {
        passageId: 'jobs_stanford_commencement',
        measuredLatencyMs: 400,
        phonemeAccuracy: 93,
      }),
    )
    expect(res.status).toBe(501)
    const data = await res.json()
    expect(data.error).toBe('ECHO_SHADOWING_SCORING_UNAVAILABLE')
    expect(data.message).toContain('ngẫu nhiên')
    expect(data.session).toBeUndefined()
  })

  it('returns 401 when unauthorized', async () => {
    authState.user = null
    const res = await handler(req('GET'))
    expect(res.status).toBe(401)
  })

  it('handles OPTIONS request with 204', async () => {
    const res = await handler(req('OPTIONS'))
    expect(res.status).toBe(204)
  })

  it('returns 429 when rate limit exceeded', async () => {
    rateLimitOk = false
    const res = await handler(req('GET'))
    expect(res.status).toBe(429)
  })

  it('returns 404 when passageId not found in GET', async () => {
    const res = await handler(req('GET', undefined, 'passageId=nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 405 for unsupported method like PUT', async () => {
    const res = await handler(req('PUT'))
    expect(res.status).toBe(405)
  })
})
