import { describe, it, expect, vi, beforeEach } from 'vitest'

// Pool giả trả dữ liệu theo câu SQL. Bản cũ dùng `{}` (không có `query`) — test vẫn xanh vì
// service NUỐT lỗi rồi bịa `srsDueCount = 5` (audit M10). Nay lỗi CSDL phải thành 500.
const db = vi.hoisted(() => ({ fail: false }))
vi.mock('@dhcb/core-db/pgPool', () => ({
  getPgPool: () => ({
    query: async (sql: string) => {
      if (db.fail) throw new Error('db down')
      if (sql.includes('public.profiles')) {
        return { rows: [{ onboarded: true, goal: null, daily_minutes: 15 }] }
      }
      if (sql.includes('english.learning_progress')) {
        return {
          rows: [{ learned: [], srs: { a: { due: 0 } }, placement: null, updated_at: new Date() }],
        }
      }
      if (sql.includes('worklife.tasks')) return { rows: [{ open_count: 2, due_count: 1 }] }
      throw new Error(`SQL ngoài dự kiến: ${sql}`)
    },
  }),
}))

import handler from './proactive-briefing.js'
import * as security from '@dhcb/core-auth/security'
import * as personService from '@dhcb/core-personal/personService'

describe('GET/POST /api/proactive-briefing', () => {
  beforeEach(() => {
    db.fail = false
    vi.restoreAllMocks()
    vi.spyOn(security, 'checkRateLimit').mockResolvedValue(true)
  })

  it('handles OPTIONS request with CORS', async () => {
    const req = new Request('http://localhost/api/proactive-briefing', { method: 'OPTIONS' })
    const res = await handler(req)
    expect(res.status).toBe(204)
  })

  it('rejects unauthorized request', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue(null)
    const req = new Request('http://localhost/api/proactive-briefing', { method: 'GET' })
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('returns proactive briefing for authorized user', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: 'user-1',
    })
    vi.spyOn(personService, 'getOrCreatePerson').mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      userId: 'user-1',
      displayName: 'Test User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    })

    const req = new Request('http://localhost/api/proactive-briefing?type=morning', {
      method: 'GET',
    })
    const res = await handler(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.briefing).toBeTruthy()
    expect(data.briefing.type).toBe('morning')
    // Đúng số liệu từ CSDL: 1 thẻ đến hạn + 1 việc Ghi chú đến hạn — không mục trụ đã xoá.
    expect(data.briefing.summary).toBe(
      'Hôm nay có 1 thẻ từ vựng cần ôn và 1 việc đến hạn trong Ghi chú.',
    )
    expect(data.briefing.actionItems.map((i: { domain: string }) => i.domain)).toEqual([
      'learning',
      'work',
    ])
  })

  it('CSDL lỗi → 500, không trả bản tin với số bịa', async () => {
    db.fail = true
    vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: 'user-1' })
    vi.spyOn(personService, 'getOrCreatePerson').mockResolvedValue({
      id: '11111111-1111-4111-8111-111111111111',
      userId: 'user-1',
      displayName: 'Test User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      schemaVersion: 1,
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const res = await handler(new Request('http://localhost/api/proactive-briefing'))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.briefing).toBeUndefined()
  })

  it('rejects unsupported HTTP methods', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: 'user-1',
    })
    const req = new Request('http://localhost/api/proactive-briefing', { method: 'DELETE' })
    const res = await handler(req)
    expect(res.status).toBe(405)
  })
})
