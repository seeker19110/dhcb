// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import handler from './cefr-assessment.js'
import { assessCefr, AssessmentError } from '../../_lib/cefrAssessment.js'
import { validateAuth, checkRateLimit } from '@dhcb/core-auth/security'
import { getPgPool } from '@dhcb/core-db/pgPool'

vi.mock('@dhcb/core-auth/security', () => ({
  validateAuth: vi.fn(),
  checkRateLimit: vi.fn(),
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
}))
vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
vi.mock('../../_lib/cefrAssessment.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../_lib/cefrAssessment.js')>()),
  assessCefr: vi.fn(),
}))
vi.mock('../../_lib/referral.js', () => ({ rewardReferralIfEligible: vi.fn(async () => {}) }))
import { rewardReferralIfEligible } from '../../_lib/referral.js'
const pool = new Pool()
const startRequest = { action: 'start', level: 'A1', isA: true }
const grade = {
  pct: 100,
  passed: true,
  correct: 24,
  total: 24,
  correctAnswers: ['answer'],
  result: { passed: true, bestPct: 100, attempts: 1, lastAt: '2026-09-27T12:00:00Z' },
  cefrUnlocked: ['A1', 'A2'] as ('A1' | 'A2')[],
}
function request(body: unknown = startRequest, method = 'POST') {
  return new Request('http://localhost/api/cefr-assessment', {
    method,
    ...(method === 'POST'
      ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      : {}),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(validateAuth).mockResolvedValue({ userId: 'authenticated-user' })
  vi.mocked(checkRateLimit).mockResolvedValue(true)
  vi.mocked(getPgPool).mockReturnValue(pool)
  vi.mocked(assessCefr).mockResolvedValue(grade)
})

describe('POST /api/cefr-assessment', () => {
  it('OPTIONS cho preflight, không thực thi bài thi', async () => {
    expect((await handler(request(undefined, 'OPTIONS'))).status).toBe(204)
    expect(assessCefr).not.toHaveBeenCalled()
  })

  it('yêu cầu đăng nhập và chỉ nhận POST', async () => {
    vi.mocked(validateAuth).mockResolvedValueOnce(null)
    expect((await handler(request())).status).toBe(401)
    expect((await handler(request(undefined, 'GET'))).status).toBe(405)
    expect(assessCefr).not.toHaveBeenCalled()
  })

  it('rate limit theo user trước DB', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue(false)
    expect((await handler(request())).status).toBe(429)
    expect(checkRateLimit).toHaveBeenCalledWith('authenticated-user', 10, 'cefr-assessment')
    expect(getPgPool).not.toHaveBeenCalled()
  })

  it.each([
    { ...startRequest, userId: 'victim' },
    { ...startRequest, passed: true },
    { ...startRequest, level: 'D1' },
    { ...startRequest, isA: 'true' },
    { action: 'submit', attemptId: 'not-a-uuid', answers: ['x'] },
    { action: 'submit', attemptId: randomUUID(), answers: [] },
    { action: 'submit', attemptId: randomUUID(), answers: Array(25).fill('x') },
    { action: 'submit', attemptId: randomUUID(), answers: ['x'], bestPct: 100 },
    null,
  ])('từ chối payload không hợp lệ hoặc tự khai quyền %#', async (body) => {
    expect((await handler(request(body))).status).toBe(400)
    expect(assessCefr).not.toHaveBeenCalled()
  })

  it('JSON hỏng → 400', async () => {
    const req = new Request('http://localhost/api/cefr-assessment', {
      method: 'POST',
      body: '{broken',
    })
    expect((await handler(req)).status).toBe(400)
    expect(assessCefr).not.toHaveBeenCalled()
  })

  it('dùng userId từ auth khi tạo đề và nộp bài', async () => {
    const submission = { action: 'submit', attemptId: randomUUID(), answers: ['x'] }
    expect((await handler(request(startRequest))).status).toBe(200)
    expect(assessCefr).toHaveBeenLastCalledWith(pool, 'authenticated-user', startRequest)
    expect(rewardReferralIfEligible).not.toHaveBeenCalled()
    const res = await handler(request(submission))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(grade)
    expect(assessCefr).toHaveBeenLastCalledWith(pool, 'authenticated-user', submission)
    expect(rewardReferralIfEligible).toHaveBeenCalledWith('authenticated-user')
    expect(vi.mocked(assessCefr).mock.invocationCallOrder[1]).toBeLessThan(
      vi.mocked(rewardReferralIfEligible).mock.invocationCallOrder[0]!,
    )
  })

  it('bài chưa đạt không kích hoạt thưởng', async () => {
    vi.mocked(assessCefr).mockResolvedValue({ ...grade, passed: false })
    const res = await handler(
      request({ action: 'submit', attemptId: randomUUID(), answers: ['x'] }),
    )
    expect(res.status).toBe(200)
    expect(rewardReferralIfEligible).not.toHaveBeenCalled()
  })

  it.each([400, 403, 409, 410])('lỗi nghiệp vụ %s giữ đúng status', async (status) => {
    vi.mocked(assessCefr).mockRejectedValue(new AssessmentError(status, 'Bài thi không hợp lệ'))
    const res = await handler(request())
    expect(res.status).toBe(status)
    expect(await res.json()).toEqual({ error: 'Bài thi không hợp lệ' })
  })

  it('lỗi DB → 503, không lộ chi tiết hạ tầng hoặc xác nhận điểm', async () => {
    vi.mocked(assessCefr).mockRejectedValue(new Error('internal sensitive connection details'))
    const res = await handler(request())
    expect(res.status).toBe(503)
    expect(await res.text()).not.toContain('sensitive')
    expect(rewardReferralIfEligible).not.toHaveBeenCalled()
  })
})
