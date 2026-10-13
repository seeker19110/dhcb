// api/personal/companion-cards.ts — "Thẻ hôm nay" của Bạn Đồng Hành (GĐ4a, changelog 0629).
//
// Đặc tả: docs/specs/2026-10-12-ban-dong-hanh-gd4a-the-hom-nay.md §③
//
//   GET  /api/companion-cards                    → { day, cards }  (≤ 3 thẻ của CHÍNH mình)
//   POST /api/companion-cards?action=feedback    { cardId, feedback: 'up'|'down' } → { cardId, feedback }
//
// Thay `/api/proactive-agent` (đã gỡ): bản cũ trả nhắc nhở bịa ("năng lượng 85%") và đọc nhầm
// `personId = auth.userId`. Ở đây `personId` (personal.persons.id) lấy qua `getOrCreatePerson`,
// `userId` (profiles.id) lấy từ token — không id nào đến từ body.
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { DailyCardFeedbackRequestSchema } from '@dhcb/core-contracts/companionDailyCards'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { getClientIp, internalErrorResponse, jsonResponse } from '@dhcb/core-http/http'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { getOrCreatePerson } from '@dhcb/core-personal/personService'
import { getTodayCards, recordCardFeedback } from '@dhcb/core-personal/companionDailyCards'

const RATE_LIMIT_PER_MINUTE = 60

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, RATE_LIMIT_PER_MINUTE, 'companion_cards'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/companion-cards' })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, headers)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, headers)

  if (req.method !== 'GET' && req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  }

  try {
    const pool = getPgPool()

    if (req.method === 'GET') {
      const person = await getOrCreatePerson(pool, auth.userId)
      const result = await getTodayCards(pool, { personId: person.id, userId: auth.userId })
      return jsonResponse(result, 200, headers)
    }

    const action = new URL(req.url).searchParams.get('action')
    if (action !== 'feedback') {
      return jsonResponse({ error: 'Hành động không hợp lệ' }, 400, headers)
    }
    const body = await readJsonBody(req)
    if (!body.ok) return jsonResponse({ error: body.error.message }, body.error.status, headers)
    const parsed = validateBody(DailyCardFeedbackRequestSchema, body.raw)
    if (!parsed.ok) {
      return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
    }

    const person = await getOrCreatePerson(pool, auth.userId)
    const result = await recordCardFeedback(
      pool,
      person.id,
      parsed.data.cardId,
      parsed.data.feedback,
    )
    return jsonResponse(result, 200, headers)
  } catch (err: unknown) {
    if (isAppError(err)) return jsonResponse(toErrorBody(err), err.status, headers)
    return internalErrorResponse(err, headers, 'companion-cards')
  }
}
