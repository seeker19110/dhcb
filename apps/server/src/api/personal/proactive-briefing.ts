// api/proactive-briefing.ts — V2 Flagship Proactive Briefing API Endpoint.
import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { getOrCreatePerson } from '@dhcb/core-personal/personService'
import { generateProactiveBriefing } from '@dhcb/core-personal/proactiveBriefingService'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { jsonResponse, getClientIp, internalErrorResponse } from '@dhcb/core-http/http'

const BriefingQuerySchema = z.object({
  type: z.enum(['morning', 'evening']).optional(),
  force: z.enum(['true', 'false']).optional(),
})

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'proactive_briefing'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/proactive-briefing' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  }

  try {
    const pool = getPgPool()
    const person = await getOrCreatePerson(pool, auth.userId)

    const url = new URL(req.url)
    const query = BriefingQuerySchema.safeParse({
      type: url.searchParams.get('type') || undefined,
      force: url.searchParams.get('force') || undefined,
    })

    const type = query.success ? query.data.type : undefined
    // personId (personal.persons) và userId (profiles, từ token) là HAI id khác nhau — bản cũ
    // truyền nhầm personId làm userId nên luôn đọc ra 0 thẻ ôn (audit M10, đợt U5).
    const briefing = await generateProactiveBriefing(
      pool,
      { personId: person.id, userId: auth.userId },
      { type },
    )

    return jsonResponse({ briefing }, 200, headers)
  } catch (err: unknown) {
    if (isAppError(err)) {
      return jsonResponse(toErrorBody(err), err.status, headers)
    }
    return internalErrorResponse(err, headers, 'proactive-briefing')
  }
}
