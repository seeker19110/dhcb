// Test /api/app-settings — endpoint CÔNG KHAI (không cần đăng nhập) đọc hạn mức/khuyến mãi.
// Kiểm: OPTIONS, method sai, rate limit, trả 200 kèm ETag, và 304 khi If-None-Match khớp.
import { describe, it, expect, beforeEach, vi } from 'vitest'

let rateLimitOk = true
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => rateLimitOk,
  logSecurityEvent: () => {},
}))

const getAppSettingsMock = vi.fn()
vi.mock('@dhcb/core-db/settings', () => ({
  getAppSettings: () => getAppSettingsMock(),
}))

import handler from './app-settings.js'
import { PublicAppSettingsSchema } from '@dhcb/core-contracts/appSettings'

// Hình dạng THẬT của packages/core-db/settings.ts sau GĐ1: một con số tổng/ngày mỗi gói.
const SETTINGS = {
  limits: { free: 30, vip: 300 },
  promoUntil: null,
  aiCircuitBreaker: false,
  leaderboardEnabled: false,
  updatedAt: '2026-08-01T00:00:00.000Z',
}

beforeEach(() => {
  rateLimitOk = true
  getAppSettingsMock.mockReset()
  getAppSettingsMock.mockResolvedValue(SETTINGS)
})

describe('GET /api/app-settings', () => {
  it('OPTIONS → 204', async () => {
    const res = await handler(
      new Request('http://localhost/api/app-settings', { method: 'OPTIONS' }),
    )
    expect(res.status).toBe(204)
  })

  it('method khác GET → 405', async () => {
    const res = await handler(new Request('http://localhost/api/app-settings', { method: 'POST' }))
    expect(res.status).toBe(405)
  })

  it('vượt rate limit → 429', async () => {
    rateLimitOk = false
    const res = await handler(new Request('http://localhost/api/app-settings'))
    expect(res.status).toBe(429)
  })

  it('thành công → 200, trả đúng dữ liệu + ETag', async () => {
    const res = await handler(new Request('http://localhost/api/app-settings'))
    expect(res.status).toBe(200)
    expect(res.headers.get('ETag')).toBe(`"${SETTINGS.updatedAt}"`)
    expect(await res.json()).toEqual(SETTINGS)
  })

  // [audit M9] Hợp đồng dùng chung với client + mock E2E: body thật PHẢI parse được qua schema.
  it('body khớp hợp đồng PublicAppSettingsSchema (client đọc được hạn mức tổng/ngày)', async () => {
    const res = await handler(new Request('http://localhost/api/app-settings'))
    const parsed = PublicAppSettingsSchema.safeParse(await res.json())
    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.limits).toEqual({ free: 30, vip: 300 })
  })

  it('If-None-Match khớp ETag hiện tại → 304 rỗng', async () => {
    const res = await handler(
      new Request('http://localhost/api/app-settings', {
        headers: { 'if-none-match': `"${SETTINGS.updatedAt}"` },
      }),
    )
    expect(res.status).toBe(304)
  })
})
