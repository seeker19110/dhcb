import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({}) }))

const getOrCreatePerson = vi.fn()
vi.mock('@dhcb/core-personal/personService', () => ({
  getOrCreatePerson: (...a: unknown[]) => getOrCreatePerson(...a),
}))

import handler from './socratic-diagnostics.js'
import { resetSocraticSessionsForTest } from '@dhcb/core-personal/socraticDiagnosticsService'
import { PRACTICE_SESSION_IDLE_TTL_MS } from '@dhcb/core-personal/ttlSessionStore'

const PERSON = '11111111-1111-4111-8111-111111111111'

function req(method: string, body?: unknown) {
  return new Request('http://localhost/api/socratic-diagnostics', {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  })
}

describe('api/socratic-diagnostics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState.user = { userId: 'user-1' }
    rateLimitOk = true
    getOrCreatePerson.mockResolvedValue({ id: PERSON })
  })

  afterEach(() => {
    resetSocraticSessionsForTest()
    vi.useRealTimers()
  })

  it('handles GET list of misconceptions', async () => {
    const res = await handler(req('GET'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.misconceptions.length).toBeGreaterThan(0)
  })

  it('handles POST start session and submit reflection', async () => {
    const startRes = await handler(
      req('POST', {
        action: 'start',
        misconceptionId: 'present_perfect_past_confusion',
      }),
    )
    expect(startRes.status).toBe(201)
    const startData = await startRes.json()
    const sessionId = startData.session.id

    const reflectRes = await handler(
      req('POST', {
        action: 'reflect',
        sessionId,
        answer: 'Khoảng thời gian đã kết thúc trong quá khứ.',
      }),
    )
    expect(reflectRes.status).toBe(200)
    const reflectData = await reflectRes.json()
    expect(reflectData.feedback).toBeDefined()
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

  it('trả 429 khi vượt rate limit', async () => {
    rateLimitOk = false
    const res = await handler(req('GET'))
    expect(res.status).toBe(429)
  })

  it('POST start: thiếu misconceptionId trả 400', async () => {
    const res = await handler(req('POST', { action: 'start' }))
    expect(res.status).toBe(400)
  })

  it('POST reflect: thiếu sessionId hoặc answer trả 400', async () => {
    const res = await handler(req('POST', { action: 'reflect', sessionId: 's1' }))
    expect(res.status).toBe(400)
  })

  it('POST action không hợp lệ trả 400', async () => {
    const res = await handler(req('POST', { action: 'unknown' }))
    expect(res.status).toBe(400)
  })

  it('method không được hỗ trợ trả 405', async () => {
    const res = await handler(req('DELETE'))
    expect(res.status).toBe(405)
  })

  it('trả 400 khi body không phải JSON hợp lệ (readJsonBody lỗi)', async () => {
    const res = await handler(
      new Request('http://localhost/api/socratic-diagnostics', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{invalid-json',
      }),
    )
    expect(res.status).toBe(400)
  })

  it('lỗi hạ tầng bất kỳ (không phải AppError) trả 500 với thông báo chung', async () => {
    getOrCreatePerson.mockRejectedValueOnce(new Error('db down'))
    const res = await handler(
      req('POST', { action: 'reflect', sessionId: 'phien-bat-ky', answer: 'abc' }),
    )
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('Lỗi xử lý chẩn đoán nhận thức Socratic')
  })

  it('POST reflect với sessionId không tồn tại → 404', async () => {
    const res = await handler(
      req('POST', { action: 'reflect', sessionId: 'phien-khong-ton-tai', answer: 'abc' }),
    )
    expect(res.status).toBe(404)
  })

  // ── Kiểm soát truy cập (audit 2026-10-08): phiên Socratic chỉ thuộc về người tạo ──
  it('user B gửi reflect vào phiên của user A → 404, không lộ câu trả lời của A', async () => {
    const PERSON_B = '22222222-2222-4222-8222-222222222222'
    const startRes = await handler(
      req('POST', { action: 'start', misconceptionId: 'present_perfect_past_confusion' }),
    )
    const sessionId = ((await startRes.json()) as { session: { id: string } }).session.id

    getOrCreatePerson.mockResolvedValueOnce({ id: PERSON_B })
    const res = await handler(
      req('POST', { action: 'reflect', sessionId, answer: 'Chen vào phiên người khác' }),
    )
    expect(res.status).toBe(404)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.updatedRecord).toBeUndefined()

    // Chủ phiên vẫn trả lời tiếp được — phiên không bị B làm bẩn.
    const own = await handler(
      req('POST', { action: 'reflect', sessionId, answer: 'Khoảng thời gian đã kết thúc.' }),
    )
    expect(own.status).toBe(200)
    const ownData = (await own.json()) as { updatedRecord: { turns: { learnerAnswer: string }[] } }
    expect(ownData.updatedRecord.turns.map((t) => t.learnerAnswer)).not.toContain(
      'Chen vào phiên người khác',
    )
  })

  it('GET: getOrCreatePerson ném AppError → trả đúng status/body của AppError', async () => {
    const { AppError } = await import('@dhcb/core-errors/appError')
    getOrCreatePerson.mockRejectedValueOnce(
      new AppError('Người dùng không hợp lệ', 422, 'bad_person'),
    )
    const res = await handler(req('GET'))
    expect(res.status).toBe(422)
    const data = await res.json()
    expect(data.error.code).toBe('bad_person')
  })

  // ── Phiên có hạn (changelog 0538) ──
  it('phiên hết hạn sau 30 phút không hoạt động → 404 kèm mã session_not_found + lời dặn', async () => {
    vi.useFakeTimers()
    const startRes = await handler(
      req('POST', { action: 'start', misconceptionId: 'present_perfect_past_confusion' }),
    )
    const sessionId = ((await startRes.json()) as { session: { id: string } }).session.id
    vi.advanceTimersByTime(PRACTICE_SESSION_IDLE_TTL_MS)
    const res = await handler(req('POST', { action: 'reflect', sessionId, answer: 'quá khứ đơn' }))
    expect(res.status).toBe(404)
    const body = (await res.json()) as { error: { code: string; message: string } }
    expect(body.error.code).toBe('session_not_found')
    expect(body.error.message).toMatch(/Bắt đầu lại/)
  })

  it('câu trả lời quá dài → 413, không ghi vào phiên', async () => {
    const res = await handler(
      req('POST', { action: 'reflect', sessionId: 's1', answer: 'a'.repeat(2001) }),
    )
    expect(res.status).toBe(413)
  })
})
