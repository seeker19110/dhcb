import { beforeEach, describe, expect, it, vi } from 'vitest'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
let rateLimitOk = true

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
  validateAuth: async () => authState.user,
  logSecurityEvent: () => {},
}))

const query = vi.hoisted(() => vi.fn())
// Transaction (E2.3): begin/commit/rollback đi qua client riêng, mọi câu nghiệp vụ vẫn ghi vào
// `query` để chỉ số calls[...] của các test giữ nguyên.
const txControl = vi.hoisted(() => vi.fn())
vi.mock('@dhcb/core-db/pgPool', () => ({
  getPgPool: () => ({
    query,
    connect: async () => ({
      query: (sql: string, params?: unknown[]) =>
        /^(begin|commit|rollback)$/.test(sql) ? txControl(sql) : query(sql, params),
      release: () => {},
    }),
  }),
}))

import handler from './mistakes.js'

const ID_1 = '22222222-2222-4222-8222-222222222222'

const SAMPLE = {
  id: ID_1,
  wrong: 'I go to school yesterday',
  corrected: 'I went to school yesterday',
  explanation: 'Quá khứ đơn dùng "went"',
  source: 'writing' as const,
  dir: 'A' as const,
  createdAt: 1_756_000_000_000,
  count: 2,
  lastReviewedAt: null,
  reviewCount: 0,
}

// Hàng DB tương ứng SAMPLE (thời gian là Date, khoá snake_case).
const ROW = {
  id: ID_1,
  wrong: SAMPLE.wrong,
  corrected: SAMPLE.corrected,
  explanation: SAMPLE.explanation,
  source: SAMPLE.source,
  dir: SAMPLE.dir,
  created_at: new Date(SAMPLE.createdAt),
  count: 2,
  last_reviewed_at: null,
  review_count: 0,
}

function req(method: string, query = '', body?: unknown) {
  return new Request(`http://localhost/api/mistakes${query}`, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
  query.mockResolvedValue({ rows: [] })
})

describe('api/mistakes', () => {
  it('handles OPTIONS', async () => {
    expect((await handler(req('OPTIONS'))).status).toBe(204)
  })

  it('429 when rate limit exceeded', async () => {
    rateLimitOk = false
    expect((await handler(req('GET'))).status).toBe(429)
  })

  it('401 when unauthenticated', async () => {
    authState.user = null
    expect((await handler(req('GET'))).status).toBe(401)
  })

  it('GET returns the user own mistakes as camelCase with epoch millis', async () => {
    query.mockResolvedValueOnce({ rows: [ROW] })
    const res = await handler(req('GET'))
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.mistakes).toEqual([SAMPLE])
    // Luôn lọc theo user_id của token — không tin tham số client.
    expect(query.mock.calls[0]![1]).toEqual(['user-1'])
  })

  it('GET maps lastReviewedAt from Date to epoch millis', async () => {
    const reviewedAt = 1_756_100_000_000
    query.mockResolvedValueOnce({
      rows: [{ ...ROW, last_reviewed_at: new Date(reviewedAt), review_count: 3 }],
    })
    const j = await (await handler(req('GET'))).json()
    expect(j.mistakes[0].lastReviewedAt).toBe(reviewedAt)
    expect(j.mistakes[0].reviewCount).toBe(3)
  })

  it('POST upserts each mistake, prunes overflow, then returns merged book', async () => {
    query.mockResolvedValue({ rows: [] })
    query.mockResolvedValueOnce({ rows: [] }) // upsert
    query.mockResolvedValueOnce({ rows: [] }) // prune
    query.mockResolvedValueOnce({ rows: [ROW] }) // select lại
    const res = await handler(req('POST', '', { mistakes: [SAMPLE] }))
    expect(res.status).toBe(200)
    expect((await res.json()).mistakes).toEqual([SAMPLE])

    const upsert = query.mock.calls[0]!
    expect(upsert[0]).toContain('insert into english.mistakes')
    expect(upsert[0]).toContain('on conflict (user_id, dedupe_key)')
    // dedupe_key phải khớp luật norm() của client: thường hoá + gộp khoảng trắng.
    expect(upsert[1]![2]).toBe('i go to school yesterday→i went to school yesterday')
    expect(upsert[1]![1]).toBe('user-1')
  })

  it('POST chạy cả lô trong MỘT transaction; một dòng lỗi → rollback, không cắt tỉa (E2.3)', async () => {
    query.mockResolvedValueOnce({ rows: [] }) // dòng 1 ok
    query.mockRejectedValueOnce(new Error('db down')) // dòng 2 lỗi
    await expect(
      handler(req('POST', '', { mistakes: [SAMPLE, { ...SAMPLE, wrong: 'khác' }] })),
    ).rejects.toThrow('db down')
    expect(txControl.mock.calls.map(([sql]) => sql)).toEqual(['begin', 'rollback'])
    expect(query.mock.calls.some(([sql]) => String(sql).includes('delete from'))).toBe(false)
  })

  it('POST thành công → begin … commit', async () => {
    await handler(req('POST', '', { mistakes: [SAMPLE] }))
    expect(txControl.mock.calls.map(([sql]) => sql)).toEqual(['begin', 'commit'])
  })

  it('POST merge keeps the larger count instead of adding them up', async () => {
    // Cộng dồn sẽ thổi phồng số lần mắc lỗi mỗi lần đồng bộ — phải là greatest().
    await handler(req('POST', '', { mistakes: [SAMPLE] }))
    expect(query.mock.calls[0]![0]).toContain(
      'count            = greatest(english.mistakes.count, excluded.count)',
    )
  })

  it('POST accepts an empty book (nothing to sync yet)', async () => {
    const res = await handler(req('POST', '', { mistakes: [] }))
    expect(res.status).toBe(200)
    // Không có upsert nào, chỉ prune + select.
    expect(query.mock.calls[0]![0]).toContain('delete from english.mistakes')
  })

  it('POST rejects invalid payloads', async () => {
    expect((await handler(req('POST', '', { mistakes: 'nope' }))).status).toBe(400)
    expect(
      (await handler(req('POST', '', { mistakes: [{ ...SAMPLE, source: 'reading' }] }))).status,
    ).toBe(400)
    expect((await handler(req('POST', '', { mistakes: [{ ...SAMPLE, dir: 'C' }] }))).status).toBe(
      400,
    )
    expect((await handler(req('POST', '', { mistakes: [{ ...SAMPLE, count: 0 }] }))).status).toBe(
      400,
    )
    expect((await handler(req('POST', '', { mistakes: [{ ...SAMPLE, id: 'x' }] }))).status).toBe(
      400,
    )
    expect(query).not.toHaveBeenCalled()
  })

  it('POST rejects a batch beyond the sync cap', async () => {
    const big = Array.from({ length: 501 }, () => SAMPLE)
    expect((await handler(req('POST', '', { mistakes: big }))).status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('DELETE removes one card scoped to the caller', async () => {
    const res = await handler(req('DELETE', `?id=${ID_1}`))
    expect(res.status).toBe(200)
    expect(query.mock.calls[0]![0]).toContain('where user_id = $1 and id = $2')
    expect(query.mock.calls[0]![1]).toEqual(['user-1', ID_1])
  })

  it('DELETE without a valid id returns 400 and touches nothing', async () => {
    expect((await handler(req('DELETE'))).status).toBe(400)
    expect((await handler(req('DELETE', '?id=not-a-uuid'))).status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  // ── Bằng chứng (S12-2, migration 0084) ──────────────────────────────────────────────────
  it('GET trả attemptId/contentId khi hàng DB có, và vắng hẳn khi không có', async () => {
    query.mockResolvedValueOnce({
      rows: [
        {
          ...ROW,
          attempt_id: '33333333-3333-4333-8333-333333333333',
          content_id: 'ly10-c2-b10',
          subject_id: 'english',
        },
      ],
    })
    const j = await (await handler(req('GET'))).json()
    expect(j.mistakes[0].attemptId).toBe('33333333-3333-4333-8333-333333333333')
    expect(j.mistakes[0].contentId).toBe('ly10-c2-b10')

    query.mockResolvedValueOnce({ rows: [{ ...ROW, attempt_id: null, content_id: null }] })
    const k = await (await handler(req('GET'))).json()
    expect('attemptId' in k.mistakes[0]).toBe(false)
    expect('contentId' in k.mistakes[0]).toBe(false)
  })

  it('POST ghi bằng chứng vào 3 cột mới; thiếu thì là null', async () => {
    await handler(
      req('POST', '', {
        mistakes: [
          {
            ...SAMPLE,
            attemptId: '33333333-3333-4333-8333-333333333333',
            contentId: 'ly10-c2-b10',
          },
        ],
      }),
    )
    const params = query.mock.calls[0]![1]!
    expect(params[12]).toBe('33333333-3333-4333-8333-333333333333')
    expect(params[13]).toBe('ly10-c2-b10')

    vi.clearAllMocks()
    query.mockResolvedValue({ rows: [] })
    await handler(req('POST', '', { mistakes: [SAMPLE] }))
    expect(query.mock.calls[0]![1]![12]).toBeNull()
    expect(query.mock.calls[0]![1]![13]).toBeNull()
  })

  it('attemptId KHÔNG phải uuid (nhánh dự phòng của WebView cũ) → null, KHÔNG làm đổ cả mẻ', async () => {
    const res = await handler(
      req('POST', '', { mistakes: [{ ...SAMPLE, attemptId: 'khong-phai-uuid-nhung-dung-khuon' }] }),
    )
    expect(res.status).toBe(200)
    expect(query.mock.calls[0]![1]![12]).toBeNull()
  })

  it('bằng chứng MỚI thắng nhưng NULL không xoá bằng chứng cũ (coalesce)', async () => {
    await handler(req('POST', '', { mistakes: [SAMPLE] }))
    const sql = query.mock.calls[0]![0] as string
    expect(sql).toContain(
      'attempt_id       = coalesce(excluded.attempt_id, english.mistakes.attempt_id)',
    )
    expect(sql).toContain(
      'content_id       = coalesce(excluded.content_id, english.mistakes.content_id)',
    )
  })

  it('field bằng chứng lạ vẫn bị .strict() chặn (client không tự thêm cột)', async () => {
    const res = await handler(
      req('POST', '', { mistakes: [{ ...SAMPLE, evidenceKind: 'server_graded' }] }),
    )
    expect(res.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('405 for PUT', async () => {
    expect((await handler(req('PUT'))).status).toBe(405)
  })
})
