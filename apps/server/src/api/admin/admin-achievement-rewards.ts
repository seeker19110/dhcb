// api/admin-achievement-rewards.ts — Cho ADMIN cấu hình phần thưởng (ngày VIP) của TỪNG
// huy hiệu & mốc (migration 0026). Áp dụng NGAY cho toàn bộ người dùng (không cần deploy lại) —
// cùng mô hình api/admin-plan-marketing.ts (bảng cấu hình + cache TTL ngắn ở
// api/_lib/achievementRewards.ts).
//
// GET /api/admin-achievement-rewards                                          (toàn bộ cấu hình)
// PUT /api/admin-achievement-rewards  body: { achievementId, enabled?, rewardPlan?, rewardDays? }

import { z } from 'zod'
import {
  validateAuth,
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { isAdminUser } from '@dhcb/core-auth/adminAuth'
import {
  getAllRewardConfigs,
  upsertRewardConfig,
  supportsPaidReward,
  ACHIEVEMENT_IDS,
} from '../_lib/achievementRewards.js'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const UpdateSchema = z.object({
  achievementId: z.enum(ACHIEVEMENT_IDS),
  enabled: z.boolean().optional(),
  rewardPlan: z.enum(['vip']).optional(),
  rewardDays: z.number().int().min(0).max(3650).optional(),
})

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'admin-achievement-rewards'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/admin-achievement-rewards' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  if (!isAdminUser(auth.userId)) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', clientIp, { path: '/api/admin-achievement-rewards' })
    return jsonResponse({ error: 'Chỉ admin mới truy cập được' }, 403, allHeaders)
  }

  if (req.method === 'GET') {
    const rewards = await getAllRewardConfigs()
    return jsonResponse({ rewards }, 200, allHeaders)
  }

  if (req.method === 'PUT') {
    const bodyResult = await readJsonBody(req)
    if (!bodyResult.ok)
      return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, allHeaders)
    const parsed = validateBody(UpdateSchema, bodyResult.raw)
    if (!parsed.ok)
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
    const { achievementId, enabled, rewardPlan, rewardDays } = parsed.data
    if (!supportsPaidReward(achievementId) && (enabled === true || (rewardDays ?? 0) > 0)) {
      return jsonResponse(
        { error: 'Chỉ huy hiệu CEFR đã xác minh được hỗ trợ thưởng VIP.' },
        400,
        allHeaders,
      )
    }

    await upsertRewardConfig(achievementId, { enabled, rewardPlan, rewardDays })
    logSecurityEvent('ADMIN_ACHIEVEMENT_REWARD_UPDATE', clientIp, { achievementId })
    return jsonResponse({ ok: true }, 200, allHeaders)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}

export const config = { runtime: 'edge' }
