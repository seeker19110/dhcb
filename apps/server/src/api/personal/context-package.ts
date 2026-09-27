// api/context-package.ts — V2-07 Context Engine API.
// personId luôn suy từ token xác thực, không nhận từ client.
import { z } from 'zod'
import { randomUUID } from 'node:crypto'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { getTwoFactorStatus, hasStepUp } from '@dhcb/core-auth/twoFactor'
import { readSessionCookie } from '@dhcb/core-auth/sessionCookie'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { getOrCreatePerson } from '@dhcb/core-personal/personService'
import { buildContextPackage } from '@dhcb/core-personal/contextEngine'
import { SensitivitySchema } from '@dhcb/core-contracts/personalFact'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

const BuildContextSchema = z
  .object({
    requestId: z.string().min(1).max(100).optional(),
    requestText: z.string().min(1).max(4000),
    domain: z.string().min(1).max(50).optional(),
    purpose: z.string().min(1).max(50),
    tokenBudget: z.number().int().positive().max(32000).optional(),
    maxSensitivity: SensitivitySchema.optional(),
    domainState: z
      .object({
        sourceId: z.string().uuid(),
        content: z.string().min(1).max(4000),
        provenance: z.string().min(1).max(200),
      })
      .optional(),
  })
  .strict()

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'context-package'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/context-package' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  }

  const pool = getPgPool()
  const person = await getOrCreatePerson(pool, auth.userId)

  try {
    const parsedBody = await readJsonBody(req)
    if (!parsedBody.ok) {
      return jsonResponse({ error: parsedBody.error.message }, parsedBody.error.status, headers)
    }
    const validated = validateBody(BuildContextSchema, parsedBody.raw)
    if (!validated.ok) {
      return jsonResponse({ error: validated.error.message }, validated.error.status, headers)
    }

    const contextPackage = await buildContextPackage(pool, {
      personId: person.id,
      requestId: validated.data.requestId ?? randomUUID(),
      requestText: validated.data.requestText,
      domain: validated.data.domain,
      purpose: validated.data.purpose,
      tokenBudget: validated.data.tokenBudget,
      maxSensitivity: validated.data.maxSensitivity,
      domainState: validated.data.domainState,
    })

    if (
      contextPackage.items.some(
        (item) => item.sensitivity === 'sensitive' || item.sensitivity === 'restricted',
      )
    ) {
      const status = await getTwoFactorStatus(pool, auth.userId)
      if (!status.enabled) {
        return jsonResponse(
          {
            error: 'Bật xác thực hai bước để xem dữ liệu riêng tư.',
            code: 'TWO_FACTOR_SETUP_REQUIRED',
          },
          403,
          headers,
        )
      }
      if (!(await hasStepUp(pool, auth.userId, readSessionCookie(req)))) {
        return jsonResponse(
          {
            error: 'Xác minh lại bằng mã hai bước để xem dữ liệu riêng tư.',
            code: 'STEP_UP_REQUIRED',
          },
          403,
          headers,
        )
      }
    }
    return jsonResponse({ contextPackage }, 200, headers)
  } catch (err) {
    if (isAppError(err)) {
      return jsonResponse(toErrorBody(err), err.status, headers)
    }
    throw err
  }
}
