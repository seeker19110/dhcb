// api/workplace-insights.ts — V3 Workplace Error Harvester & Auto-SRS Endpoint.
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
  harvestMistakesFromText,
  listHarvestedMistakes,
  convertMistakeToSrsCard,
  listAutoSrsCards,
} from '@dhcb/core-personal/workplaceErrorHarvesterService'
import { type HarvestedSourceType } from '@dhcb/core-contracts/workplaceErrorHarvester'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { jsonResponse, getClientIp, logInternalError } from '@dhcb/core-http/http'
import { readJsonBody } from '@dhcb/core-http/validation'

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'workplace_insights_api'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/workplace-insights' })
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
      const url = new URL(req.url)
      const kind = url.searchParams.get('kind')

      if (kind === 'srs_cards') {
        const cards = listAutoSrsCards(person.id)
        return jsonResponse({ cards }, 200, headers)
      }

      const mistakes = listHarvestedMistakes(person.id)
      return jsonResponse({ mistakes }, 200, headers)
    }

    if (req.method === 'POST') {
      const bodyResult = await readJsonBody(req)
      if (!bodyResult.ok) {
        return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, headers)
      }
      const body = bodyResult.raw as {
        action: 'harvest' | 'convert_to_srs'
        rawText?: string
        sourceType?: HarvestedSourceType
        mistakeId?: string
      }

      if (body.action === 'harvest') {
        if (!body.rawText) {
          return jsonResponse({ error: 'Thiếu rawText để thu hoạch' }, 400, headers)
        }
        const newHarvested = harvestMistakesFromText(
          person.id,
          body.rawText,
          body.sourceType ?? 'email',
        )
        return jsonResponse({ harvested: newHarvested }, 201, headers)
      }

      if (body.action === 'convert_to_srs') {
        if (!body.mistakeId) {
          return jsonResponse({ error: 'Thiếu mistakeId' }, 400, headers)
        }
        const card = convertMistakeToSrsCard(person.id, body.mistakeId)
        return jsonResponse({ card }, 201, headers)
      }

      return jsonResponse({ error: 'Action không hợp lệ' }, 400, headers)
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  } catch (err) {
    if (isAppError(err)) {
      return jsonResponse(toErrorBody(err), err.status, headers)
    }
    logInternalError(err, 'workplace-insights')
    return jsonResponse({ error: 'Lỗi thu hoạch lỗi công sở Workplace Harvester' }, 500, headers)
  }
}
