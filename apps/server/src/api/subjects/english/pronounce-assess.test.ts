// Test handler /api/pronounce-assess — tập trung 2 điều quan trọng nhất:
//  1. Chưa cấu hình Azure → 503 + fallback:true NGAY, KHÔNG trừ lượt (đỡ query oan).
//  2. Đã trừ lượt mà Azure lỗi → PHẢI hoàn lượt (refundUsage), giống nguyên tắc api/stt.ts.
// Mock toàn bộ lớp ngoài (security/usage/azurePronounce) để chạy OFFLINE.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: async () => ({ userId: 'user-test' }),
  validateContentType: () => true,
  logSecurityEvent: () => {},
}))
vi.mock('@dhcb/core-billing/usage', () => ({
  checkAndConsumeUsage: vi.fn(async () => ({ ok: true as const, day: '2026-08-12' })),
  refundUsage: vi.fn(async () => {}),
}))
vi.mock('@dhcb/core-ai/azurePronounce', () => ({
  resolveAzurePronounceConfig: vi.fn(),
  assessPronunciation: vi.fn(),
}))

import handler from './pronounce-assess.js'
import { checkAndConsumeUsage, refundUsage } from '@dhcb/core-billing/usage'
import { resolveAzurePronounceConfig, assessPronunciation } from '@dhcb/core-ai/azurePronounce'

const mockedConsume = vi.mocked(checkAndConsumeUsage)
const mockedRefund = vi.mocked(refundUsage)
const mockedResolveConfig = vi.mocked(resolveAzurePronounceConfig)
const mockedAssess = vi.mocked(assessPronunciation)

const GOOD_RESULT = {
  overall: 88,
  accuracy: 85,
  fluency: 90,
  completeness: 100,
  words: [{ word: 'three', score: 60, errorType: 'Mispronunciation', phonemes: [] }],
}

function makeRequest(body?: object): Request {
  return new Request('http://localhost/api/pronounce-assess', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: 'Bearer x' },
    body: JSON.stringify(body ?? { audio_b64: 'aGVsbG8=', referenceText: 'three books' }),
  })
}

beforeEach(() => {
  mockedConsume.mockClear()
  mockedConsume.mockResolvedValue({ ok: true, day: '2026-08-12' })
  mockedRefund.mockClear()
  mockedResolveConfig.mockReset()
  mockedResolveConfig.mockReturnValue({ key: 'test-key', region: 'eastus' })
  mockedAssess.mockReset()
  mockedAssess.mockResolvedValue(GOOD_RESULT)
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('handler /api/pronounce-assess', () => {
  it('chưa cấu hình Azure → 503 + fallback:true, KHÔNG gọi checkAndConsumeUsage', async () => {
    mockedResolveConfig.mockReturnValue(null)
    const res = await handler(makeRequest())
    expect(res.status).toBe(503)
    const body = (await res.json()) as { fallback?: boolean }
    expect(body.fallback).toBe(true)
    expect(mockedConsume).not.toHaveBeenCalled()
  })

  it('đường thành công: trừ lượt, trả kết quả Azure nguyên vẹn', async () => {
    const res = await handler(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(GOOD_RESULT)
    expect(mockedConsume).toHaveBeenCalledWith('user-test', 'pronounce')
    expect(mockedRefund).not.toHaveBeenCalled()
  })

  it('hết lượt → 429 + fallback:true, KHÔNG gọi Azure', async () => {
    mockedConsume.mockResolvedValue({ ok: false, message: 'Hết lượt hôm nay' })
    const res = await handler(makeRequest())
    expect(res.status).toBe(429)
    const body = (await res.json()) as { fallback?: boolean }
    expect(body.fallback).toBe(true)
    expect(mockedAssess).not.toHaveBeenCalled()
  })

  it('Azure lỗi SAU KHI đã trừ lượt → phải HOÀN lượt (refundUsage)', async () => {
    mockedAssess.mockRejectedValue(new Error('Azure Speech lỗi (500): oops'))
    const res = await handler(makeRequest())
    expect(res.status).toBe(500)
    expect(mockedRefund).toHaveBeenCalledWith('user-test', 'pronounce', '2026-08-12')
    // Lỗi Azure chỉ ở log server; client vẫn nhận `fallback` để chuyển sang chấm cục bộ.
    const body = (await res.json()) as { error: string; fallback: boolean }
    expect(body.fallback).toBe(true)
    expect(body.error).not.toContain('oops')
  })

  it('thiếu referenceText → 400, không trừ lượt', async () => {
    const res = await handler(makeRequest({ audio_b64: 'aGVsbG8=' }))
    expect(res.status).toBe(400)
    expect(mockedConsume).not.toHaveBeenCalled()
  })

  it('thiếu audio_b64 → 400, không trừ lượt', async () => {
    const res = await handler(makeRequest({ referenceText: 'hello' }))
    expect(res.status).toBe(400)
    expect(mockedConsume).not.toHaveBeenCalled()
  })

  it('audio_b64 không phải base64 hợp lệ → 400', async () => {
    const res = await handler(makeRequest({ audio_b64: '***không hợp lệ***', referenceText: 'hi' }))
    expect(res.status).toBe(400)
  })

  it('OPTIONS (preflight CORS) → 204', async () => {
    const res = await handler(
      new Request('http://localhost/api/pronounce-assess', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
  })

  it('method không phải POST → 405', async () => {
    const res = await handler(
      new Request('http://localhost/api/pronounce-assess', { method: 'GET' }),
    )
    expect(res.status).toBe(405)
  })
})
