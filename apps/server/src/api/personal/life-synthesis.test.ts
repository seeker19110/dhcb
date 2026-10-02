// api/life-synthesis.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './life-synthesis.js'
import * as security from '@dhcb/core-auth/security'

describe('Life Synthesis API Handler (/api/life-synthesis)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects unauthorized requests with 401', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const req = new Request('http://localhost/api/life-synthesis', {
      method: 'GET',
    })

    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  // Changelog 0475: API từng trả báo cáo dựng từ số GÁN CỨNG cho mọi người dùng. Nay tạm ngừng
  // và nói rõ — không còn ca nào được trả số liệu.
  it('GET trả 501 kèm lời giải thích, KHÔNG trả báo cáo', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request('http://localhost/api/life-synthesis?timeframe=weekly', { method: 'GET' }),
    )
    expect(res.status).toBe(501)
    const data = await res.json()
    expect(data.error).toBe('LIFE_SYNTHESIS_UNAVAILABLE')
    expect(data.message).toContain('chưa có dữ liệu hoạt động thật')
    expect(data.report).toBeUndefined()
  })

  it('POST cũng trả 501, kể cả khi gửi kèm số liệu', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const res = await handler(
      new Request('http://localhost/api/life-synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainActivityCounts: { learning: 25 } }),
      }),
    )
    expect(res.status).toBe(501)
    expect((await res.json()).report).toBeUndefined()
  })

  it('handles OPTIONS preflight', async () => {
    const req = new Request('http://localhost/api/life-synthesis', { method: 'OPTIONS' })
    const res = await handler(req)
    expect(res.status).toBe(204)
  })

  it('rejects unsupported method', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce({
      userId: '11111111-1111-4111-8111-111111111111',
    })
    const req = new Request('http://localhost/api/life-synthesis', { method: 'DELETE' })
    const res = await handler(req)
    expect(res.status).toBe(405)
  })
})
