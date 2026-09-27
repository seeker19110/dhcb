// Hồi quy leo thang quyền: dùng adminAuth thật, chỉ giả phiên và các ranh giới DB/provider.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Pool } from 'pg'

vi.mock('@dhcb/core-db/pgPool', () => ({ getPgPool: vi.fn() }))
vi.mock('@dhcb/core-auth/security', () => ({
  getCorsHeaders: () => ({}),
  SECURITY_HEADERS: {},
  checkRateLimit: async () => true,
  validateAuth: vi.fn(),
  logSecurityEvent: vi.fn(),
}))
vi.mock('@dhcb/core-auth/authService', () => ({ getUserById: vi.fn() }))
vi.mock('../_lib/featureStatusChecks.js', () => ({
  runAllFeatureChecks: vi.fn(),
  summarizeOverallStatus: vi.fn(),
}))
vi.mock('@dhcb/core-ai/ttsCacheAudit', () => ({ runTtsCacheAudit: vi.fn() }))

import { getPgPool } from '@dhcb/core-db/pgPool'
import { getUserById } from '@dhcb/core-auth/authService'
import { validateAuth } from '@dhcb/core-auth/security'
import { runAllFeatureChecks } from '../_lib/featureStatusChecks.js'
import { runTtsCacheAudit } from '@dhcb/core-ai/ttsCacheAudit'
import achievementRewards from './admin-achievement-rewards.js'
import featureStatus from './admin-feature-status.js'
import feedback from './admin-feedback.js'
import grantPlan from './admin-grant-plan.js'
import intakeStats from './admin-intake-stats.js'
import payments from './admin-payments.js'
import planFeatures from './admin-plan-features.js'
import planMarketing from './admin-plan-marketing.js'
import pricePromo from './admin-price-promo.js'
import reservedNames from './admin-reserved-names.js'
import settings from './admin-settings.js'
import stemReview from './admin-stem-review.js'
import systemControl from './admin-system-control.js'
import ttsCache from './admin-tts-cache.js'
import usageStats from './admin-usage-stats.js'
import users from './admin-users.js'
import vipWhitelist from './admin-vip-whitelist.js'
import analyticsSummary from './analytics-summary.js'

type Handler = (req: Request) => Promise<Response>
const endpoints: [string, Handler, string[]][] = [
  ['admin-achievement-rewards', achievementRewards, ['GET', 'PUT']],
  ['admin-feature-status', featureStatus, ['GET', 'POST']],
  ['admin-feedback', feedback, ['GET', 'PATCH']],
  ['admin-grant-plan', grantPlan, ['GET', 'POST']],
  ['admin-intake-stats', intakeStats, ['GET']],
  ['admin-payments', payments, ['GET', 'POST']],
  ['admin-plan-features', planFeatures, ['GET', 'POST', 'PUT', 'DELETE']],
  ['admin-plan-marketing', planMarketing, ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']],
  ['admin-price-promo', pricePromo, ['GET', 'POST']],
  ['admin-reserved-names', reservedNames, ['GET', 'POST']],
  ['admin-settings', settings, ['GET', 'POST']],
  ['admin-stem-review', stemReview, ['GET', 'POST']],
  ['admin-system-control', systemControl, ['GET', 'POST']],
  ['admin-tts-cache', ttsCache, ['GET', 'POST']],
  ['admin-usage-stats', usageStats, ['GET']],
  ['admin-users', users, ['GET']],
  ['admin-vip-whitelist', vipWhitelist, ['GET', 'POST', 'DELETE']],
  ['analytics-summary', analyticsSummary, ['GET']],
]
const routes = endpoints.flatMap(([path, handler, methods]) =>
  methods.map((method) => ({ path, handler, method })),
)
const query = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('ADMIN_USER_IDS', 'trusted-admin-id')
  vi.stubEnv('ADMIN_EMAILS', 'admin@example.com')
  vi.stubEnv('FEATURE_STATUS_CRON_KEY', undefined)
  vi.mocked(validateAuth).mockResolvedValue({ userId: 'attacker-id' })
  const unverifiedUser = {
    id: 'attacker-id',
    email: 'admin@example.com',
    email_verified: null,
  }
  vi.mocked(getUserById).mockResolvedValue(unverifiedUser)
  vi.mocked(getPgPool).mockReturnValue(Object.assign(new Pool(), { query }))
})

afterEach(() => vi.unstubAllEnvs())

describe('email trong allowlist cũ không cấp quyền trên mọi API admin', () => {
  it.each(routes)(
    '$method /api/$path từ chối tài khoản có email admin chưa xác minh',
    async ({ path, handler, method }) => {
      const response = await handler(new Request(`http://localhost/api/${path}`, { method }))
      expect(response.status).toBe(403)
      expect(query).not.toHaveBeenCalled()
      expect(getUserById).not.toHaveBeenCalled()
      expect(runAllFeatureChecks).not.toHaveBeenCalled()
      expect(runTtsCacheAudit).not.toHaveBeenCalled()
    },
  )

  it('đổi email thành email admin không đổi quyền của phiên hiện tại', async () => {
    vi.mocked(getUserById).mockResolvedValue({ id: 'attacker-id', email: 'student@example.com' })
    expect((await users(new Request('http://localhost/api/admin-users'))).status).toBe(403)
    vi.mocked(getUserById).mockResolvedValue({ id: 'attacker-id', email: 'admin@example.com' })
    expect((await users(new Request('http://localhost/api/admin-users'))).status).toBe(403)
    expect(query).not.toHaveBeenCalled()
  })

  it('ID được cấp quyền vẫn truy cập được khi email thay đổi', async () => {
    vi.mocked(validateAuth).mockResolvedValue({ userId: 'trusted-admin-id' })
    vi.mocked(getUserById).mockResolvedValue({ id: 'trusted-admin-id', email: 'new@example.com' })
    query.mockResolvedValueOnce({ rows: [{ count: '0' }] }).mockResolvedValueOnce({ rows: [] })
    const response = await users(new Request('http://localhost/api/admin-users'))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ total: 0, users: [] })
    expect(getUserById).not.toHaveBeenCalled()
  })

  it('chưa cấu hình ADMIN_USER_IDS luôn từ chối dù phiên và ADMIN_EMAILS hợp lệ', async () => {
    vi.stubEnv('ADMIN_USER_IDS', undefined)
    vi.mocked(validateAuth).mockResolvedValue({ userId: 'trusted-admin-id' })
    const response = await users(new Request('http://localhost/api/admin-users'))
    expect(response.status).toBe(403)
    expect(query).not.toHaveBeenCalled()
  })
})
