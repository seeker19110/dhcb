// Test /api/learner-intent — ý định học của tài khoản (slice S05-1, AC-7).
import { describe, it, expect, beforeEach, vi } from 'vitest'

const authState: { user: { userId: string } | null } = { user: { userId: 'user-1' } }
let rateLimitOk = true
const logSecurityEvent = vi.fn()
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
  validateAuth: async () => authState.user,
  logSecurityEvent: (...a: unknown[]) => logSecurityEvent(...a),
}))

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: () => ({}) }))

const getLearnerIntent = vi.fn()
const saveLearnerIntent = vi.fn()
vi.mock('@dhcb/core-personal/learnerIntentService', () => ({
  getLearnerIntent: (...a: unknown[]) => getLearnerIntent(...a),
  saveLearnerIntent: (...a: unknown[]) => saveLearnerIntent(...a),
}))

import handler from './learner-intent.js'

const INTENT = {
  schemaVersion: 1,
  subjectIds: ['programming', 'mathematics'],
  purpose: 'cong_viec',
  timeBudget: 20,
  level: 'lv_new',
  grade: '11',
  createdAt: 1_700_000_000_000,
  updatedAt: 1_700_000_000_000,
}

function req(method: string, body?: unknown): Request {
  return new Request('https://x.test/api/learner-intent', {
    method,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    headers: { 'content-type': 'application/json' },
  })
}

beforeEach(() => {
  authState.user = { userId: 'user-1' }
  rateLimitOk = true
  getLearnerIntent.mockReset()
  saveLearnerIntent.mockReset()
  logSecurityEvent.mockReset()
})

describe('/api/learner-intent', () => {
  it('OPTIONS → 204', async () => {
    expect((await handler(req('OPTIONS'))).status).toBe(204)
  })

  it('quá hạn mức → 429 và có ghi nhật ký bảo mật', async () => {
    rateLimitOk = false
    const res = await handler(req('GET'))
    expect(res.status).toBe(429)
    expect(logSecurityEvent).toHaveBeenCalled()
    // Chặn TRƯỚC khi đụng CSDL.
    expect(getLearnerIntent).not.toHaveBeenCalled()
  })

  it('không token → 401 ở cả GET lẫn PUT', async () => {
    authState.user = null
    expect((await handler(req('GET'))).status).toBe(401)
    expect((await handler(req('PUT', { intent: INTENT }))).status).toBe(401)
    expect(saveLearnerIntent).not.toHaveBeenCalled()
  })

  it('GET khi chưa có ý định → 200 { intent: null }, KHÔNG 404', async () => {
    getLearnerIntent.mockResolvedValue(null)
    const res = await handler(req('GET'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ intent: null })
  })

  it('GET đọc đúng userId của token', async () => {
    getLearnerIntent.mockResolvedValue(INTENT)
    const res = await handler(req('GET'))
    expect(getLearnerIntent).toHaveBeenCalledWith(expect.anything(), 'user-1')
    expect(await res.json()).toEqual({ intent: INTENT })
  })

  it('PUT hợp lệ → 200 { ok, intent } và ghi theo userId của token', async () => {
    saveLearnerIntent.mockResolvedValue(INTENT)
    const res = await handler(req('PUT', { intent: INTENT }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, intent: INTENT })
    expect(saveLearnerIntent).toHaveBeenCalledWith(expect.anything(), 'user-1', INTENT)
  })

  it('PUT hai lần chỉ là upsert của MỘT người (không có nhánh ghi user khác)', async () => {
    saveLearnerIntent.mockResolvedValue(INTENT)
    await handler(req('PUT', { intent: INTENT }))
    await handler(req('PUT', { intent: { ...INTENT, updatedAt: INTENT.updatedAt + 1 } }))
    for (const call of saveLearnerIntent.mock.calls) expect(call[1]).toBe('user-1')
  })

  it('PUT body lạ / môn lạ / grade không kèm STEM → 400 tiếng Việt', async () => {
    for (const body of [
      {},
      { intent: { ...INTENT, subjectIds: [] } },
      { intent: { ...INTENT, subjectIds: ['music'] } },
      { intent: { ...INTENT, subjectIds: ['english'], grade: '10' } },
      // Lớp THCS chỉ đi cùng Toán (2026-10-10) — Lí/Hoá/Sinh chưa có bài lớp 6–9.
      { intent: { ...INTENT, subjectIds: ['physics'], grade: '9' } },
      { intent: { ...INTENT, grade: '5' } },
      { intent: { ...INTENT, score: 72 } },
    ]) {
      const res = await handler(req('PUT', body))
      expect(res.status, JSON.stringify(body)).toBe(400)
      const data = (await res.json()) as { error?: string }
      expect(typeof data.error).toBe('string')
    }
    expect(saveLearnerIntent).not.toHaveBeenCalled()
  })

  it('PUT lớp THCS kèm Toán → ghi được (khớp CHECK mới của migration 0092)', async () => {
    const thcs = { ...INTENT, grade: '9' }
    saveLearnerIntent.mockResolvedValue(thcs)
    const res = await handler(req('PUT', { intent: thcs }))
    expect(res.status).toBe(200)
    expect(saveLearnerIntent.mock.calls[0]?.[2]).toMatchObject({ grade: '9' })
  })

  it('method khác → 405', async () => {
    for (const m of ['POST', 'DELETE', 'PATCH']) {
      expect((await handler(req(m, { intent: INTENT }))).status).toBe(405)
    }
  })

  it('không bao giờ trả trường ngoài hợp đồng (không score/rank)', async () => {
    saveLearnerIntent.mockResolvedValue(INTENT)
    const res = await handler(req('PUT', { intent: INTENT }))
    const text = await res.text()
    expect(text).not.toContain('score')
    expect(text).not.toContain('rank')
  })
})
