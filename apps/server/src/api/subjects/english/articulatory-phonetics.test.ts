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

import handler from './articulatory-phonetics.js'

function req(method: string, body?: unknown, searchParams?: string) {
  const url = searchParams
    ? `http://localhost/api/articulatory-phonetics?${searchParams}`
    : 'http://localhost/api/articulatory-phonetics'
  return new Request(url, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

describe('api/articulatory-phonetics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = { userId: 'user-1' }
    rateLimitOk = true
  })

  it('handles GET guides list and specific phoneme guide', async () => {
    const listRes = await handler(req('GET'))
    expect(listRes.status).toBe(200)
    const listData = await listRes.json()
    expect(listData.guides.length).toBeGreaterThan(0)

    const singleRes = await handler(req('GET', undefined, 'phoneme=TH_VOICELESS'))
    expect(singleRes.status).toBe(200)
    const singleData = await singleRes.json()
    expect(singleData.guide.ipaSymbol).toBe('/θ/')
  })

  it('POST trả 501 PITCH_ANALYSIS_UNAVAILABLE, không có điểm/đường pitch (changelog 0563)', async () => {
    const res = await handler(
      req('POST', { targetWord: 'think', targetPhoneme: 'TH_VOICELESS', scoreEstimate: 91 }),
    )
    expect(res.status).toBe(501)
    const data = await res.json()
    expect(data.error).toBe('PITCH_ANALYSIS_UNAVAILABLE')
    expect(data.report).toBeUndefined()
    expect(JSON.stringify(data)).not.toMatch(/alignmentScore|pitchContour|overallPhoneticScore/)
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

  it('POST body hỏng vẫn 501 (không còn đọc body)', async () => {
    const badReq = new Request('http://localhost/api/articulatory-phonetics', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: 'bad-json{',
    })
    const res = await handler(badReq)
    expect(res.status).toBe(501)
  })

  it('returns 405 for unsupported method like PUT', async () => {
    const res = await handler(req('PUT'))
    expect(res.status).toBe(405)
  })

  it('GET với phoneme không hợp lệ ⇒ 400', async () => {
    const res = await handler(req('GET', undefined, 'phoneme=KHONG_CO'))
    expect(res.status).toBe(400)
  })
})
