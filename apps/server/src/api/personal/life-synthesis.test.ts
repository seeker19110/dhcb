// api/personal/life-synthesis.test.ts — GET /api/life-synthesis (changelog 0550).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Pool giả: trả theo câu SQL. Câu ngoài dự kiến ném lỗi để test lộ ra ngay.
const db = vi.hoisted(() => ({
  fail: false,
  calls: [] as { sql: string; params: unknown[] }[],
}))
vi.mock('@dhcb/core-db/pgPool', () => ({
  getPgPool: () => ({
    query: async (sql: string, params: unknown[]) => {
      db.calls.push({ sql, params })
      if (db.fail) throw new Error('db down')
      if (sql.includes('english.chat_sessions')) {
        return { rows: [{ subject_id: 'english', vn_day: '2026-10-09', completions: 0 }] }
      }
      if (sql.includes('worklife.tasks')) {
        return {
          rows: [
            {
              total_tasks: 1,
              open_tasks: 1,
              overdue_tasks: 1,
              due_soon_tasks: 0,
              undated_open_tasks: 0,
              blocked_tasks: 0,
              total_notes: 0,
              notes_created: 0,
            },
          ],
        }
      }
      throw new Error(`SQL ngoài dự kiến: ${sql}`)
    },
  }),
}))

import handler from './life-synthesis.js'
import * as security from '@dhcb/core-auth/security'
import { LifeSynthesisResponseSchema } from '@dhcb/core-contracts/lifeSynthesis'

const USER = '11111111-1111-4111-8111-111111111111'

describe('/api/life-synthesis', () => {
  beforeEach(() => {
    db.fail = false
    db.calls = []
    vi.restoreAllMocks()
    vi.spyOn(security, 'checkRateLimit').mockResolvedValue(true)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-09T03:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('OPTIONS → 204', async () => {
    const res = await handler(
      new Request('http://localhost/api/life-synthesis', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
  })

  it('chưa đăng nhập → 401, không chạm CSDL', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValueOnce(null)
    const res = await handler(new Request('http://localhost/api/life-synthesis'))
    expect(res.status).toBe(401)
    expect(db.calls).toEqual([])
  })

  it('POST (bản cũ nhận số liệu client tự khai) → 405', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: USER })
    const res = await handler(
      new Request('http://localhost/api/life-synthesis', {
        method: 'POST',
        body: JSON.stringify({ domainActivityCounts: { learning: 99 } }),
      }),
    )
    expect(res.status).toBe(405)
    expect(db.calls).toEqual([])
  })

  it('quá giới hạn tần suất → 429', async () => {
    vi.spyOn(security, 'checkRateLimit').mockResolvedValue(false)
    const res = await handler(new Request('http://localhost/api/life-synthesis'))
    expect(res.status).toBe(429)
  })

  it('GET → 200, báo cáo hợp lệ theo hợp đồng, mọi câu SQL lọc theo userId của token', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: USER })
    const res = await handler(new Request('http://localhost/api/life-synthesis?userId=other'))
    expect(res.status).toBe(200)
    const body = LifeSynthesisResponseSchema.parse(await res.json())
    expect(body.report.learning.subjects.map((s) => s.subjectId)).toEqual(['english'])
    expect(body.report.notes.overdueTasks).toBe(1)
    expect(body.report.recommendations[0]?.ruleId).toBe('rec.notes_overdue')
    expect(db.calls).toHaveLength(2)
    for (const c of db.calls) expect(c.params[0]).toBe(USER)
  })

  it('CSDL lỗi → 500 an toàn, không có báo cáo', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: USER })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    db.fail = true
    const res = await handler(new Request('http://localhost/api/life-synthesis'))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.report).toBeUndefined()
    expect(JSON.stringify(data)).not.toContain('db down')
  })
})
