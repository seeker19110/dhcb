// ambient-vision.test.ts — hợp đồng đọc body với PARSER THẬT (audit 2026-10-26, AUD-CODE-001):
// handler từng đưa nguyên `{ ok, raw }` của readJsonBody vào schema ⇒ mọi POST hợp lệ thành 500.
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: async () => ({ userId: 'u-1' }),
  logSecurityEvent: () => undefined,
}))
const usage = vi.hoisted(() => ({ consume: vi.fn(), refund: vi.fn() }))
vi.mock('@dhcb/core-billing/usage', () => ({
  checkAndConsumeUsage: (...a: unknown[]) => usage.consume(...a),
  refundUsage: (...a: unknown[]) => usage.refund(...a),
}))
const vision = vi.hoisted(() => ({ analyze: vi.fn() }))
vi.mock('@dhcb/core-ai/ambientVisionService', () => ({
  analyzeAmbientScreenFrame: (...a: unknown[]) => vision.analyze(...a),
}))

const { default: handler } = await import('./ambient-vision.js')

const post = (body: string) =>
  handler(
    new Request('http://local.test/api/ambient-vision', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    }),
  )

beforeEach(() => {
  vi.clearAllMocks()
  usage.consume.mockResolvedValue({ ok: true, day: '2026-10-26' })
  usage.refund.mockResolvedValue(undefined)
  vision.analyze.mockResolvedValue({ summary: 'ok' })
})

describe('POST /api/ambient-vision', () => {
  it('payload hợp lệ ⇒ 200, gọi service với đúng ảnh + gợi ý', async () => {
    const res = await post(
      JSON.stringify({ imageBase64: 'data:image/jpeg;base64,AAAA', focusHint: 'x' }),
    )
    expect(res.status).toBe(200)
    expect(vision.analyze).toHaveBeenCalledWith('data:image/jpeg;base64,AAAA', 'x')
  })

  it('JSON hỏng ⇒ 400, KHÔNG trừ lượt AI', async () => {
    const res = await post('{không phải json')
    expect(res.status).toBe(400)
    expect(usage.consume).not.toHaveBeenCalled()
    expect(vision.analyze).not.toHaveBeenCalled()
  })

  it('thiếu ảnh / trường lạ ⇒ 400, KHÔNG trừ lượt AI', async () => {
    expect((await post(JSON.stringify({ focusHint: 'x' }))).status).toBe(400)
    expect((await post(JSON.stringify({ imageBase64: 'data:abcdefgh', extra: 1 }))).status).toBe(
      400,
    )
    expect(usage.consume).not.toHaveBeenCalled()
  })
})
