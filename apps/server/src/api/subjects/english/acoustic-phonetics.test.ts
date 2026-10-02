import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './acoustic-phonetics.js'
import * as security from '@dhcb/core-auth/security'

describe('api/acoustic-phonetics', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/acoustic-phonetics', {
      method: 'POST',
      body: JSON.stringify({ targetSentence: 'Hello world' }),
    })

    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  // Changelog 0484: endpoint từng trả "Điểm GOP" gán bằng công thức cứng. Nay 501, không con số.
  it('POST đã đăng nhập trả 501 kèm lời giải thích, KHÔNG trả điểm', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })

    const req = new Request('http://localhost/api/acoustic-phonetics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetSentence: 'Think outside the box',
        spokenTranscript: 'Tink outside the box',
        pcmAudioLengthMs: 2200,
      }),
    })

    const res = await handler(req)
    expect(res.status).toBe(501)
    const data = await res.json()
    expect(data.error).toBe('ACOUSTIC_SCORING_UNAVAILABLE')
    expect(data.overallGopScore).toBeUndefined()
    expect(data.phonemes).toBeUndefined()
  })

  it('handles OPTIONS preflight', async () => {
    const req = new Request('http://localhost/api/acoustic-phonetics', { method: 'OPTIONS' })
    const res = await handler(req)
    expect(res.status).toBe(204)
  })

  it('rejects unsupported method', async () => {
    const req = new Request('http://localhost/api/acoustic-phonetics', { method: 'GET' })
    const res = await handler(req)
    expect(res.status).toBe(405)
  })
})
