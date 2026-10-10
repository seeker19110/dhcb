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
import { readJsonBody } from '@dhcb/core-http/validation'

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
      const rawBody = (await readJsonBody(req)) as {
        action?: string
        shield?: string
        enabled?: boolean
        stressOverride?: number
      }

      if (rawBody.action === 'toggle_shield' && rawBody.shield) {
        const validatedShield = ActiveShieldSchema.parse(rawBody.shield)
        const updated = toggleNeuroShield(person.id, validatedShield, Boolean(rawBody.enabled))
        return jsonResponse({ state: updated }, 200, headers)
      }

      const evaluated = await assessNeuroAffectiveState(pool, person.id, {
        manualStressOverride: rawBody.stressOverride,
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
