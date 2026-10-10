// api/a2a.ts — V3 Multi-Agent Agent-to-Agent (A2A) Protocol Endpoint.
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
  processIncomingA2AMessage,
  discoverPeerStudyMatches,
  listActiveA2ANegotiations,
} from '@dhcb/core-personal/a2aNegotiationService'
import { A2AMessageSchema } from '@dhcb/core-contracts/a2aProtocol'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { jsonResponse, getClientIp, logInternalError } from '@dhcb/core-http/http'
import { readJsonBody } from '@dhcb/core-http/validation'

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'a2a_api'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/a2a' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) {
    return jsonResponse({ error: 'Unauthorized' }, 401, headers)
  }

  try {
    const pool = getPgPool()
    const person = await getOrCreatePerson(pool, auth.userId)
    const url = new URL(req.url)
    const kind = url.searchParams.get('kind') || 'active'

    if (req.method === 'GET') {
      if (kind === 'matches') {
        const matches = await discoverPeerStudyMatches(pool, person.id)
        return jsonResponse({ matches }, 200, headers)
      }

      const activeNegotiations = listActiveA2ANegotiations(person.id)
      return jsonResponse({ negotiations: activeNegotiations }, 200, headers)
    }

    if (req.method === 'POST') {
      const rawBody = (await readJsonBody(req)) as { message?: unknown }
      if (!rawBody.message) {
        return jsonResponse({ error: 'Thiếu thông điệp A2A (message)' }, 400, headers)
      }

      const validatedMsg = A2AMessageSchema.parse(rawBody.message)
      const result = await processIncomingA2AMessage(pool, person.id, validatedMsg)
      return jsonResponse({ result }, 200, headers)
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  } catch (err) {
    if (isAppError(err)) {
      return jsonResponse(toErrorBody(err), err.status, headers)
    }
    logInternalError(err, 'a2a')
    return jsonResponse({ error: 'Lỗi xử lý giao thức A2A' }, 500, headers)
  }
}
