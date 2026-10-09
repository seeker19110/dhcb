// api/vision-solve.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from './vision-solve.js'
import * as security from '@dhcb/core-auth/security'
import * as usage from '@dhcb/core-billing/usage'
import * as visionSolverService from '@dhcb/core-ai/visionSolverService'
import { AppError } from '@dhcb/core-errors/appError'

const VALID_BODY = JSON.stringify({
  imageBase64:
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  subjectId: 'mathematics',
  gradeLevel: 'grade_12',
})

describe('POST /api/vision-solve', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.spyOn(security, 'checkRateLimit').mockResolvedValue(true)
    // Mặc định cho qua đếm lượt — test riêng ở dưới sẽ ghi đè khi cần kiểm nhánh 429/lỗi.
    vi.spyOn(usage, 'checkAndConsumeUsage').mockResolvedValue({
      ok: true,
      day: '2026-09-05',
    } as never)
    vi.spyOn(usage, 'refundUsage').mockResolvedValue(undefined)
  })

  it('handles OPTIONS request with CORS', async () => {
    const req = new Request('http://localhost/api/vision-solve', { method: 'OPTIONS' })
    const res = await handler(req)
    expect(res.status).toBe(204)
  })

  it('rejects unauthorized request', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue(null)
    const req = new Request('http://localhost/api/vision-solve', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: 'iVBORw0KGgoAAAANSUhEUg==' }),
    })
    const res = await handler(req)
    expect(res.status).toBe(401)
  })

  it('rejects invalid request body missing imageBase64', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: 'user-1',
    })
    const req = new Request('http://localhost/api/vision-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subjectId: 'math' }),
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('trả lời giải khi service giải được', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({
      userId: 'user-1',
    })
    vi.spyOn(visionSolverService, 'solveProblemWithVision').mockResolvedValueOnce({
      problemText: 'Giải 2x + 4 = 0',
      steps: [{ title: 'Bước 1', detail: '2x = -4' }],
      finalAnswer: 'x = -2',
      confidence: 0.98,
      tokenUsed: 300,
    })
    const req = new Request('http://localhost/api/vision-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: VALID_BODY,
    })
    const res = await handler(req)
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.finalAnswer).toBe('x = -2')
    expect(usage.refundUsage).not.toHaveBeenCalled()
  })

  it('thiếu GEMINI_API_KEY ⇒ 503 + HOÀN lượt, không trả lời giải giả (changelog 0563)', async () => {
    vi.stubEnv('GEMINI_API_KEY', '')
    vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: 'user-1' })
    const req = new Request('http://localhost/api/vision-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: VALID_BODY,
    })
    const res = await handler(req)
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data.error.code).toBe('vision_unavailable')
    expect(data.finalAnswer).toBeUndefined()
    expect(usage.refundUsage).toHaveBeenCalledWith('user-1', 'chat', '2026-09-05')
  })

  it('trả 429 khi vượt rate limit', async () => {
    vi.spyOn(security, 'checkRateLimit').mockResolvedValueOnce(false)
    const res = await handler(new Request('http://localhost/api/vision-solve', { method: 'GET' }))
    expect(res.status).toBe(429)
  })

  it('rejects non-JSON body with 400 (nhánh readJsonBody lỗi)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: 'user-1' })
    const req = new Request('http://localhost/api/vision-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    })
    const res = await handler(req)
    expect(res.status).toBe(400)
  })

  it('rejects GET/other method with 405', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: 'user-1' })
    const res = await handler(new Request('http://localhost/api/vision-solve', { method: 'GET' }))
    expect(res.status).toBe(405)
  })

  it('trả 429 khi đã hết lượt dùng (usage gate)', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: 'user-1' })
    vi.spyOn(usage, 'checkAndConsumeUsage').mockResolvedValue({
      ok: false,
      message: 'Hết lượt hôm nay',
    } as never)
    const req = new Request('http://localhost/api/vision-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        subjectId: 'mathematics',
        gradeLevel: 'grade_12',
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(429)
  })

  it('hoàn lượt và trả lỗi AppError khi solveProblemWithVision ném AppError', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: 'user-1' })
    vi.spyOn(visionSolverService, 'solveProblemWithVision').mockRejectedValueOnce(
      new AppError('Ảnh không hợp lệ', 422, 'invalid_image'),
    )
    const req = new Request('http://localhost/api/vision-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        subjectId: 'mathematics',
        gradeLevel: 'grade_12',
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(422)
    expect(usage.refundUsage).toHaveBeenCalled()
  })

  it('hoàn lượt và trả lỗi 500 chung khi solveProblemWithVision ném lỗi hạ tầng bất kỳ', async () => {
    vi.spyOn(security, 'validateAuth').mockResolvedValue({ userId: 'user-1' })
    vi.spyOn(visionSolverService, 'solveProblemWithVision').mockRejectedValueOnce(
      new Error('Provider bị gián đoạn'),
    )
    const req = new Request('http://localhost/api/vision-solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        subjectId: 'mathematics',
        gradeLevel: 'grade_12',
      }),
    })
    const res = await handler(req)
    expect(res.status).toBe(500)
    expect(usage.refundUsage).toHaveBeenCalled()
  })
})
