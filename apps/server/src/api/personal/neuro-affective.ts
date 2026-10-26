// api/neuro-affective.ts — V3 Neuro-Affective Flow & Bio-Adaptive Endpoint.
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { getOrCreatePerson } from '@dhcb/core-personal/personService'
import {
  assessNeuroAffectiveState,
  getLatestNeuroState,
  toggleNeuroShield,
} from '@dhcb/core-personal/neuroAffectiveService'
import { ActiveShieldSchema } from '@dhcb/core-contracts/neuroAffective'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { jsonResponse, getClientIp, logInternalError } from '@dhcb/core-http/http'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { z } from 'zod'

// Thân POST: bật/tắt một khiên, HOẶC đánh giá lại (tuỳ chọn tự đặt mức stress 0–100).
const NeuroPostSchema = z.union([
  z
    .object({
      action: z.literal('toggle_shield'),
      shield: ActiveShieldSchema,
      enabled: z.boolean(),
    })
    .strict(),
  z.object({ stressOverride: z.number().min(0).max(100).optional() }).strict(),
])

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'neuro_affective_api'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/neuro-affective' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  }

  try {
    const pool = getPgPool()
    const person = await getOrCreatePerson(pool, auth.userId)

    if (req.method === 'GET') {
      const state = getLatestNeuroState(person.id)
      return jsonResponse({ state }, 200, headers)
    }

    if (req.method === 'POST') {
      // AUD-CODE-001: trước đây đọc trường trên vỏ `{ ok, raw }` ⇒ luôn undefined, JSON hỏng vẫn 200.
      const body = await readJsonBody(req)
      if (!body.ok) return jsonResponse({ error: body.error.message }, body.error.status, headers)
      const parsed = validateBody(NeuroPostSchema, body.raw)
      if (!parsed.ok) {
        return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
      }
      const input = parsed.data

      if ('action' in input) {
        const updated = toggleNeuroShield(person.id, input.shield, input.enabled)
        return jsonResponse({ state: updated }, 200, headers)
      }

      const evaluated = await assessNeuroAffectiveState(pool, person.id, {
        manualStressOverride: input.stressOverride,
      })
      return jsonResponse({ state: evaluated }, 200, headers)
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  } catch (err) {
    if (isAppError(err)) {
      return jsonResponse(toErrorBody(err), err.status, headers)
    }
    logInternalError(err, 'neuro-affective')
    return jsonResponse({ error: 'Lỗi xử lý trạng thái nhịp sinh học' }, 500, headers)
  }
}
