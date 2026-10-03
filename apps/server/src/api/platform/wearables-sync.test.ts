// api/wearables-sync.test.ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from './wearables-sync.js'
import * as security from '@dhcb/core-auth/security'

const USER = { userId: '11111111-1111-4111-8111-111111111111' }

describe('Wearables Sync API Handler (/api/wearables-sync)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('OPTIONS trả 204', async () => {
    const res = await handler(
      new Request('http://localhost/api/wearables-sync', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
  })

  it('từ chối khi chưa đăng nhập (401)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const res = await handler(new Request('http://localhost/api/wearables-sync', { method: 'GET' }))
    expect(res.status).toBe(401)
  })

  // Changelog 0484: API từng nhận số sinh trắc NGẪU NHIÊN từ client và trả "khung giờ học" tính từ
  // đó. Nay gỡ và nói rõ — không còn ca nào trả số liệu sinh trắc.
  it('GET trả 501 kèm lời giải thích, KHÔNG trả số sinh trắc', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(USER)
    const res = await handler(new Request('http://localhost/api/wearables-sync', { method: 'GET' }))
    expect(res.status).toBe(501)
    const data = await res.json()
    expect(data.error).toBe('WEARABLES_UNAVAILABLE')
    expect(data.message).toContain('ngẫu nhiên')
    expect(data.bio).toBeUndefined()
    expect(data.window).toBeUndefined()
  })

  it('POST cũng trả 501, kể cả khi gửi đủ trường hợp lệ', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(USER)
    const res = await handler(
      new Request('http://localhost/api/wearables-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'oura', hrvMs: 70, restingHeartRateBpm: 55 }),
      }),
    )
    expect(res.status).toBe(501)
    expect((await res.json()).bio).toBeUndefined()
  })

  it('phương thức khác trả 405', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(USER)
    const res = await handler(new Request('http://localhost/api/wearables-sync', { method: 'PUT' }))
    expect(res.status).toBe(405)
  })
})
