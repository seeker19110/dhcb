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
const transactionState = vi.hoisted(() => ({ committed: false, failCommit: false }))
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({ query }) }))
// withTransaction thật cần pool.connect(); ở đây chạy thẳng fn với cùng `query` để test đọc được
// TRÌNH TỰ SQL mà handler phát ra.
vi.mock('@dhcb/core-db/transaction', () => ({
  withTransaction: async (_pool: unknown, fn: (c: unknown) => Promise<unknown>) => {
    const result = await fn({ query })
    if (transactionState.failCommit) throw new Error('commit failed')
    transactionState.committed = true
    return result
  },
}))

vi.mock('../_lib/referral.js', () => ({ rewardReferralIfEligible: vi.fn(async () => {}) }))
import { rewardReferralIfEligible } from '../_lib/referral.js'
import handler from './evidence.js'
import { PHYSICS_LESSONS } from '@dhcb/subject-physics/lessons'
import { gradeStemEvidence } from '@dhcb/core-learner/stemEvidenceGrader'

/** Bài Lí thật trong registry — test chấm bằng chính dữ liệu server sẽ tra lúc chạy. */
const bai = PHYSICS_LESSONS[0]!
const LESSON_ID = bai.id

function body(over: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    subjectId: 'physics',
    contentId: LESSON_ID,
    activityKind: 'stem_lesson_check',
    attemptId: '0123456789abcdef',
    clientAt: '2026-09-15T08:00:00.000Z',
    answers: bai.checkQuestions.map((_q, questionIndex) => ({ questionIndex, raw: 'x' })),
    ...over,
  }
}

/** Trả lời ĐÚNG mọi câu, lấy từ đáp án thật của bài (choice → id đầu tiên đúng). */
function traLoiDung() {
  return bai.checkQuestions.map((q, questionIndex) => {
    const a = q.answer
    let raw = 'x'
    if (a.kind === 'choice') raw = [...a.correctIds].join(',')
    else if (a.kind === 'numeric') raw = a.unit ? `${a.value} ${a.unit}` : `${a.value}`
    else if (a.kind === 'fraction') raw = `${a.num}/${a.den}`
    else if (a.kind === 'expression') raw = a.expr
    return { questionIndex, raw }
  })
}

function req(method: string, payload?: unknown, url = 'http://localhost/api/learning/evidence') {
  return new Request(url, {
    method,
    ...(payload === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
  query.mockResolvedValue({ rows: [] })
  transactionState.committed = false
  transactionState.failCommit = false
  vi.mocked(rewardReferralIfEligible).mockImplementation(async () => {
    expect(transactionState.committed).toBe(true)
  })
})

describe('/api/learning/evidence — cửa an ninh', () => {
  it('chưa đăng nhập → 401; quá rate limit → 429 (kiểm TRƯỚC auth)', async () => {
    authState.user = null
    expect((await handler(req('POST', body()))).status).toBe(401)
    authState.user = { userId: 'user-1' }
    rateLimitOk = false
    expect((await handler(req('POST', body()))).status).toBe(429)
    expect(query).not.toHaveBeenCalled()
  })

  it('method khác GET/POST → 405; OPTIONS → 204', async () => {
    expect((await handler(req('PUT', body()))).status).toBe(405)
    expect((await handler(req('OPTIONS'))).status).toBe(204)
  })
})

describe('/api/learning/evidence — POST hợp đồng vào', () => {
  it('body có clientCorrect/correct/passed do client tính → 400 (.strict()), không ghi gì', async () => {
    for (const la of [{ clientCorrect: 5 }, { correct: 5 }, { passed: true }]) {
      const res = await handler(req('POST', body(la)))
      expect(res.status).toBe(400)
    }
    expect(query).not.toHaveBeenCalled()
  })

  it('schemaVersion ≠ 1 → 400; attemptId sai khuôn → 400', async () => {
    expect((await handler(req('POST', body({ schemaVersion: 2 })))).status).toBe(400)
    expect((await handler(req('POST', body({ attemptId: 'ngan' })))).status).toBe(400)
  })

  it('activityKind đã có nguồn riêng → 400 UNSUPPORTED_ACTIVITY', async () => {
    const res = await handler(req('POST', body({ activityKind: 'programming_lesson' })))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'UNSUPPORTED_ACTIVITY' })
    expect(query).not.toHaveBeenCalled()
  })

  it('bài không tồn tại → 400 CONTENT_NOT_FOUND, không ghi gì', async () => {
    const res = await handler(req('POST', body({ contentId: 'ly10-c99-b99' })))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'CONTENT_NOT_FOUND' })
    expect(query).not.toHaveBeenCalled()
  })

  it('questionIndex vượt số câu của bài → 400 BAD_QUESTION_INDEX', async () => {
    const res = await handler(req('POST', body({ answers: [{ questionIndex: 49, raw: 'x' }] })))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ code: 'BAD_QUESTION_INDEX' })
  })
})

describe('/api/learning/evidence — POST server CHẤM LẠI', () => {
  it('trả lời sai hết → correct = 0, passed false, status in_progress', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'ev-1' }] }).mockResolvedValueOnce({ rows: [] })
    const res = await handler(req('POST', body()))
    expect(res.status).toBe(200)
    const json = (await res.json()) as Record<string, unknown>
    expect(json).toMatchObject({
      correct: 0,
      total: bai.checkQuestions.length,
      passed: false,
      evidenceKind: 'server_graded',
      ownerId: 'user-1',
    })
    expect(json.duplicate).toBeUndefined()
    expect(typeof json.contentVersion).toBe('string')
    expect((json.contentVersion as string).length).toBe(64)
    // Câu upsert state ghi 'in_progress'.
    expect(query.mock.calls[1]?.[1]).toContain('in_progress')
    expect(rewardReferralIfEligible).not.toHaveBeenCalled()
  })

  it('trả lời đúng hết → passed true, status completed, ratio 1', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'ev-1' }] }).mockResolvedValueOnce({ rows: [] })
    const res = await handler(req('POST', body({ answers: traLoiDung() })))
    const json = (await res.json()) as Record<string, unknown>
    expect(json).toMatchObject({ passed: true, ratio: 1, correct: bai.checkQuestions.length })
    expect(query.mock.calls[1]?.[1]).toContain('completed')
    expect(rewardReferralIfEligible).toHaveBeenCalledWith('user-1')
  })

  it('commit bằng chứng lỗi không được kích hoạt thưởng', async () => {
    transactionState.failCommit = true
    query.mockResolvedValueOnce({ rows: [{ id: 'ev-1' }] }).mockResolvedValueOnce({ rows: [] })
    expect((await handler(req('POST', body({ answers: traLoiDung() })))).status).toBe(500)
    expect(rewardReferralIfEligible).not.toHaveBeenCalled()
  })

  it('kết quả server khớp ĐÚNG engine chấm dùng chung (không có đường thứ hai)', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'ev-1' }] }).mockResolvedValueOnce({ rows: [] })
    const answers = traLoiDung().map((a, i) => (i === 0 ? { ...a, raw: 'sai-bet' } : a))
    const res = await handler(req('POST', body({ answers })))
    const json = (await res.json()) as { correct: number; items: unknown[] }
    const mong = gradeStemEvidence(bai, answers)
    expect(json.correct).toBe(mong.correct)
    expect(json.items).toEqual(mong.items)
  })

  it('nhật ký lưu cả trả lời THÔ lẫn kết quả chấm của server (S12 đọc để lập sổ lỗi)', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'ev-1' }] }).mockResolvedValueOnce({ rows: [] })
    await handler(req('POST', body()))
    const params = query.mock.calls[0]?.[1] as unknown[]
    const answersJson = JSON.parse(params[11] as string) as Record<string, unknown>[]
    expect(answersJson[0]).toMatchObject({ questionIndex: 0, raw: 'x', correct: false })
  })
})

describe('/api/learning/evidence — idempotency và "không kéo lùi"', () => {
  it('SQL nhật ký dùng on conflict ... do nothing theo attemptId', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'ev-1' }] }).mockResolvedValueOnce({ rows: [] })
    await handler(req('POST', body()))
    const sql = query.mock.calls[0]?.[0] as string
    expect(sql).toContain('on conflict on constraint completion_evidence_attempt_uq do nothing')
  })

  it('gửi trùng attemptId → 200 duplicate:true, trả kết quả lần đầu, KHÔNG upsert state', async () => {
    query
      .mockResolvedValueOnce({ rows: [] }) // insert bị on-conflict nuốt
      .mockResolvedValueOnce({
        rows: [
          {
            correct: 4,
            total: 5,
            ratio: '0.800',
            passed: true,
            content_version: 'a'.repeat(64),
            client_at: new Date('2026-09-15T08:00:00.000Z'),
            server_at: new Date('2026-09-15T08:00:01.000Z'),
            answers: [{ questionIndex: 0, correct: true, reason: 'CORRECT', raw: 'x' }],
          },
        ],
      })
    const res = await handler(req('POST', body()))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      duplicate: true,
      correct: 4,
      total: 5,
      ratio: 0.8,
      passed: true,
      serverAt: '2026-09-15T08:00:01.000Z',
    })
    expect(query).toHaveBeenCalledTimes(2) // insert + đọc lại; KHÔNG có câu upsert state
    expect(rewardReferralIfEligible).toHaveBeenCalledWith('user-1')
    expect(query.mock.calls.every((c) => !(c[0] as string).includes('completion_state'))).toBe(true)
  })

  it('upsert state cưỡng chế không kéo lùi ở tầng DB (greatest / coalesce / giữ completed)', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'ev-1' }] }).mockResolvedValueOnce({ rows: [] })
    await handler(req('POST', body()))
    const sql = query.mock.calls[1]?.[0] as string
    expect(sql).toContain('greatest(platform.completion_state.best_ratio, excluded.best_ratio)')
    expect(sql).toContain('coalesce(platform.completion_state.completed_at, excluded.completed_at)')
    expect(sql).toContain("then 'completed' else excluded.status end")
    expect(sql).toContain('attempts     = platform.completion_state.attempts + 1')
  })

  it('lỗi DB → 500, không lộ stack', async () => {
    query.mockRejectedValueOnce(new Error('pool chết ở dòng 42'))
    const res = await handler(req('POST', body()))
    expect(res.status).toBe(500)
    expect(JSON.stringify(await res.json())).not.toContain('dòng 42')
  })
})

describe('/api/learning/evidence — GET', () => {
  it('trả state của ĐÚNG người đăng nhập, không nhận userId từ query', async () => {
    query.mockResolvedValueOnce({
      rows: [
        {
          subject_id: 'physics',
          content_id: LESSON_ID,
          status: 'completed',
          best_ratio: '1.000',
          last_ratio: '0.400',
          attempts: 2,
          completed_at: new Date('2026-09-15T08:00:01.000Z'),
          updated_at: new Date('2026-09-15T09:00:01.000Z'),
        },
      ],
    })
    const res = await handler(
      req(
        'GET',
        undefined,
        'http://localhost/api/learning/evidence?subjectId=physics&userId=kẻ-khác',
      ),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      state: [
        {
          subjectId: 'physics',
          contentId: LESSON_ID,
          status: 'completed',
          bestRatio: 1,
          lastRatio: 0.4,
          attempts: 2,
          completedAt: '2026-09-15T08:00:01.000Z',
          updatedAt: '2026-09-15T09:00:01.000Z',
          source: 'server',
        },
      ],
    })
    expect(query.mock.calls[0]?.[1]).toEqual(['user-1', 'physics'])
  })

  // ── ĐỌC nhật ký lượt nộp cho sổ lỗi (S12-2, §7 Q2) ───────────────────────────────────────
  it('include=attempts trả nhật ký lượt nộp của CHÍNH người đăng nhập, kèm items', async () => {
    query.mockResolvedValueOnce({ rows: [] }) // state
    query.mockResolvedValueOnce({
      rows: [
        {
          subject_id: 'physics',
          content_id: LESSON_ID,
          course_id: null,
          activity_kind: 'stem_lesson_check',
          attempt_id: '0123456789abcdef',
          evidence_kind: 'server_graded',
          correct: 1,
          total: 2,
          ratio: '0.500',
          passed: false,
          content_version: null,
          client_at: new Date('2026-09-15T08:00:00.000Z'),
          server_at: new Date('2026-09-15T08:00:01.000Z'),
          answers: [
            { questionIndex: 0, correct: true, reason: 'CORRECT', raw: 'bí mật của người học' },
            { questionIndex: 1, correct: false, reason: 'WRONG_VALUE', raw: 'sai' },
          ],
        },
      ],
    })
    const res = await handler(
      req(
        'GET',
        undefined,
        'http://localhost/api/learning/evidence?subjectId=physics&include=attempts',
      ),
    )
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.attempts).toHaveLength(1)
    expect(j.attempts[0]).toMatchObject({
      subjectId: 'physics',
      contentId: LESSON_ID,
      attemptId: '0123456789abcdef',
      ownerId: 'user-1',
      evidenceKind: 'server_graded',
      ratio: 0.5,
      items: [
        { questionIndex: 0, correct: true, reason: 'CORRECT' },
        { questionIndex: 1, correct: false, reason: 'WRONG_VALUE' },
      ],
    })
    // `raw` (chữ người học gõ) ở lại trong DB — sổ lỗi không cần, nên không phát tán.
    expect(JSON.stringify(j.attempts)).not.toContain('bí mật của người học')
    // Nhật ký LUÔN lọc theo user_id của token, không bao giờ theo tham số client.
    expect(query.mock.calls[1]?.[1]).toEqual(['user-1', 'physics'])
    expect(query.mock.calls[1]?.[0]).toContain('where user_id = $1 and subject_id = $2')
  })

  it('không có include → KHÔNG đọc nhật ký (giữ nguyên hành vi trước S12-2)', async () => {
    query.mockResolvedValue({ rows: [] })
    const res = await handler(
      req('GET', undefined, 'http://localhost/api/learning/evidence?subjectId=physics'),
    )
    const j = await res.json()
    expect('attempts' in j).toBe(false)
    expect(query).toHaveBeenCalledTimes(1)
  })

  it('include lạ → 400, không query (tham số client luôn được validate)', async () => {
    const res = await handler(
      req(
        'GET',
        undefined,
        'http://localhost/api/learning/evidence?subjectId=physics&include=tat-ca',
      ),
    )
    expect(res.status).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })

  it('chưa đăng nhập thì include=attempts cũng 401 — không có đường đọc nhật ký ẩn danh', async () => {
    authState.user = null
    const res = await handler(
      req(
        'GET',
        undefined,
        'http://localhost/api/learning/evidence?subjectId=physics&include=attempts',
      ),
    )
    expect(res.status).toBe(401)
    expect(query).not.toHaveBeenCalled()
  })

  it('thiếu / sai subjectId → 400, không query', async () => {
    expect((await handler(req('GET'))).status).toBe(400)
    expect(
      (
        await handler(
          req('GET', undefined, 'http://localhost/api/learning/evidence?subjectId=english'),
        )
      ).status,
    ).toBe(400)
    expect(query).not.toHaveBeenCalled()
  })
})
