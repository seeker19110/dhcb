// Test handler /api/history (Giai đoạn C phần còn lại) — tập trung các bất biến quan trọng:
//  1. Chưa đăng nhập → 401, không query DB.
//  2. POST learn-day CHỈ ghi cột learn_count (không có đường ghi cột đếm lượt tốn API).
//  3. Upsert session có mệnh đề WHERE user_id (thay RLS — không chiếm được bản ghi user khác).
//  4. GET trả camelCase đúng shape client (cloud.ts ghi thẳng vào localStorage).
// Mock pgPool + security để chạy OFFLINE.

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))

// Thưởng "mời bạn" — mock để kiểm chính xác NGƯỠNG nào kích hoạt thưởng, không chạy logic thật.
vi.mock('../_lib/referral.js', () => ({ rewardReferralIfEligible: vi.fn(async () => {}) }))

import handler, { HISTORY_PULL_LIMIT, LEARN_COUNT_DAILY_CAP } from './history.js'
import { addDays, vnDateStr } from '@dhcb/core-db/date'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { rewardReferralIfEligible } from '../_lib/referral'

const mockedGetPool = vi.mocked(getPgPool)
const query = vi.fn()

beforeEach(() => {
  query.mockReset()
  query.mockResolvedValue({ rows: [] })
  mockedGetPool.mockReturnValue({ query } as unknown as ReturnType<typeof getPgPool>)
  authState.user = { userId: 'user-1' }
  vi.mocked(rewardReferralIfEligible).mockClear()
})

function makeRequest(method: string, body?: unknown): Request {
  return new Request('http://localhost/api/history', {
    method,
    headers: { 'content-type': 'application/json', Authorization: 'Bearer x' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

const CHAT_SESSION = {
  id: '123e4567-e89b-42d3-a456-426614174000',
  situation: 'restaurant',
  level: 'beginner',
  messages: [{ role: 'user', content: 'hi' }],
  createdAt: 1700000000000,
}

describe('/api/history', () => {
  it('chưa đăng nhập → 401, không query DB', async () => {
    authState.user = null
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(401)
    expect(query).not.toHaveBeenCalled()
  })

  it('GET trả về camelCase đúng shape client', async () => {
    query
      .mockResolvedValueOnce({
        rows: [
          {
            id: 'c1',
            user_id: 'user-1',
            situation: 's',
            level: 'beginner',
            messages: [1],
            created_at: '1700000000000', // bigint về dạng chuỗi
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            day: '2026-07-19',
            chat_count: 2,
            writing_count: 0,
            speaking_count: 1,
            stt_count: 0,
            pronounce_count: 0,
            learn_count: 10,
          },
        ],
      })
    const resp = await handler(makeRequest('GET'))
    expect(resp.status).toBe(200)
    const data = (await resp.json()) as {
      chat: { createdAt: number; userId: string }[]
      usage: { date: string; learnCount: number }[]
    }
    expect(data.chat[0]?.createdAt).toBe(1700000000000)
    expect(data.chat[0]?.userId).toBe('user-1')
    expect(data.usage[0]).toMatchObject({ date: '2026-07-19', learnCount: 10, chatCount: 2 })
  })

  it('POST chat upsert kèm WHERE user_id (không chiếm bản ghi user khác)', async () => {
    const resp = await handler(makeRequest('POST', { action: 'chat', session: CHAT_SESSION }))
    expect(resp.status).toBe(200)
    const [sql, params] = query.mock.calls[0] as [string, unknown[]]
    expect(sql).toContain('chat_sessions')
    expect(sql).toContain('where chat_sessions.user_id = excluded.user_id')
    expect(params[1]).toBe('user-1') // user_id lấy từ token, KHÔNG từ body
  })

  it('POST learn-day chỉ ghi learn_count', async () => {
    const resp = await handler(
      makeRequest('POST', { action: 'learn-day', day: vnDateStr(), learnCount: 5 }),
    )
    expect(resp.status).toBe(200)
    const [sql] = query.mock.calls[0] as [string]
    expect(sql).toContain('learn_count')
    expect(sql).not.toMatch(/chat_count|writing_count|speaking_count|stt_count|pronounce_count/)
  })

  // Chống gian lận điểm giải đấu (audit 2026-10-10, E2.1).
  describe('learn-day chống gian lận', () => {
    it('kẹp trần mỗi ngày — client khai 10.000 chỉ ghi được trần', async () => {
      const resp = await handler(
        makeRequest('POST', { action: 'learn-day', day: vnDateStr(), learnCount: 10_000 }),
      )
      expect(resp.status).toBe(200)
      const [, params] = query.mock.calls[0] as [string, unknown[]]
      expect(params).toEqual(['user-1', vnDateStr(), LEARN_COUNT_DAILY_CAP])
      expect(LEARN_COUNT_DAILY_CAP).toBe(300)
    })

    it('chỉ TĂNG trong ngày (greatest) — request cũ đến muộn không kéo số xuống', async () => {
      await handler(makeRequest('POST', { action: 'learn-day', day: vnDateStr(), learnCount: 3 }))
      const [sql] = query.mock.calls[0] as [string]
      expect(sql).toContain('greatest(coalesce(daily_usage.learn_count, 0), excluded.learn_count)')
    })

    it('hôm qua (giờ VN) vẫn nhận — máy offline qua nửa đêm', async () => {
      const day = addDays(vnDateStr(), -1)
      const resp = await handler(makeRequest('POST', { action: 'learn-day', day, learnCount: 7 }))
      expect(resp.status).toBe(200)
    })

    it.each([
      ['hai ngày trước', -2],
      ['ngày mai', 1],
      ['một năm trước', -365],
    ])('%s → 400, không ghi', async (_label, offset) => {
      const day = addDays(vnDateStr(), offset)
      const resp = await handler(makeRequest('POST', { action: 'learn-day', day, learnCount: 7 }))
      expect(resp.status).toBe(400)
      expect(query).not.toHaveBeenCalled()
    })
  })

  it('GET giới hạn số phiên mỗi loại (không trả toàn bộ lịch sử kèm nội dung)', async () => {
    await handler(makeRequest('GET'))
    const sessionQueries = query.mock.calls.filter(([sql]) =>
      /chat_sessions|writing_submissions|speaking_sessions/.test(sql as string),
    ) as [string, unknown[]][]
    expect(sessionQueries).toHaveLength(3)
    for (const [sql, params] of sessionQueries) {
      expect(sql).toMatch(/limit \$2/)
      expect(params[1]).toBe(HISTORY_PULL_LIMIT)
    }
    expect(HISTORY_PULL_LIMIT).toBe(200)
  })

  it('POST body sai (mode lạ / thiếu field) → 400, không query', async () => {
    const resp = await handler(
      makeRequest('POST', { action: 'stt', day: '2026-07-19', learnCount: 5 }),
    )
    expect(resp.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('POST session id không phải uuid → 400', async () => {
    const resp = await handler(
      makeRequest('POST', { action: 'chat', session: { ...CHAT_SESSION, id: 'abc' } }),
    )
    expect(resp.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('POST speaking ghi vào bảng speaking_sessions (không phải chat_sessions)', async () => {
    const resp = await handler(makeRequest('POST', { action: 'speaking', session: CHAT_SESSION }))
    expect(resp.status).toBe(200)
    const [sql] = query.mock.calls[0] as [string]
    expect(sql).toContain('speaking_sessions')
    expect(sql).not.toContain('chat_sessions')
  })

  // Chống cày thưởng: tạo tài khoản ảo rồi gọi API 1 lần không được ăn thưởng mời bạn.
  it('phiên 1 tin nhắn → KHÔNG trao thưởng mời bạn', async () => {
    await handler(makeRequest('POST', { action: 'chat', session: CHAT_SESSION }))
    expect(rewardReferralIfEligible).not.toHaveBeenCalled()
  })

  it('phiên do client tự khai đủ user + AI vẫn KHÔNG cấp thưởng mời bạn', async () => {
    await handler(
      makeRequest('POST', {
        action: 'chat',
        session: {
          ...CHAT_SESSION,
          messages: [
            { role: 'user', content: 'hi' },
            { role: 'assistant', content: 'hello' },
          ],
        },
      }),
    )
    expect(rewardReferralIfEligible).not.toHaveBeenCalled()
  })

  const WRITING = {
    id: '223e4567-e89b-42d3-a456-426614174000',
    essayPrompt: 'Describe your hometown',
    essay: 'x',
    feedback: 'ok',
    submittedAt: 1700000000000,
  }

  it('POST writing upsert kèm WHERE user_id', async () => {
    const resp = await handler(makeRequest('POST', { action: 'writing', submission: WRITING }))
    expect(resp.status).toBe(200)
    const [sql, params] = query.mock.calls[0] as [string, unknown[]]
    expect(sql).toContain('writing_submissions')
    expect(sql).toContain('where writing_submissions.user_id = excluded.user_id')
    expect(params[1]).toBe('user-1')
  })

  it('bài viết quá ngắn (< 40 ký tự) → KHÔNG trao thưởng', async () => {
    await handler(makeRequest('POST', { action: 'writing', submission: WRITING }))
    expect(rewardReferralIfEligible).not.toHaveBeenCalled()
  })

  it('bài viết do client tự khai dù đủ dài vẫn KHÔNG cấp thưởng', async () => {
    // 40 ký tự thật nhưng bọc toàn khoảng trắng — phải trim trước khi đo.
    await handler(
      makeRequest('POST', {
        action: 'writing',
        submission: { ...WRITING, essay: '   ' + 'a'.repeat(39) + '   ' },
      }),
    )
    expect(rewardReferralIfEligible).not.toHaveBeenCalled()

    vi.mocked(rewardReferralIfEligible).mockClear()
    await handler(
      makeRequest('POST', {
        action: 'writing',
        submission: { ...WRITING, essay: 'a'.repeat(40) },
      }),
    )
    expect(rewardReferralIfEligible).not.toHaveBeenCalled()
  })

  it('method lạ (DELETE) → 405', async () => {
    const resp = await handler(makeRequest('DELETE'))
    expect(resp.status).toBe(405)
  })

  it('OPTIONS → 204 (preflight CORS)', async () => {
    const resp = await handler(makeRequest('OPTIONS'))
    expect(resp.status).toBe(204)
  })

  it('POST body không phải JSON hợp lệ → 400, không query', async () => {
    const resp = await handler(
      new Request('http://localhost/api/history', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: 'Bearer x' },
        body: '{khong-phai-json',
      }),
    )
    expect(resp.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })
})
