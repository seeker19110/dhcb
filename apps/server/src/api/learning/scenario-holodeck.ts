// api/scenario-holodeck.ts — V3 Scenario Holodeck & Multi-Persona Simulation Endpoint.
//
// Phiên giữ trong RAM có hạn (TTL trượt 30 phút, trần 5 phiên/người, trần toàn tiến trình) —
// xem `packages/core-personal/ttlSessionStore.ts`, changelog 0538. Phiên hết hạn / không còn /
// của người khác → 404 `{error:{code:'session_not_found'}}`; client hiện lỗi + "Bắt đầu lại".
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
import {
  listPredefinedScenarios,
  startHolodeckSession,
  getHolodeckSession,
  processHolodeckTurn,
  finalizeHolodeckSession,
} from '@dhcb/core-personal/scenarioHolodeckService'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'
import { SessionGoneError } from '@dhcb/core-personal/ttlSessionStore'

/** Trần độ dài một câu trả lời — chặn một lượt nhét hàng MB vào phiên trong RAM. */
const MAX_UTTERANCE_CHARS = 2000
const MAX_ID_CHARS = 100

const id = (field: string) =>
  z
    .string({ error: `Thiếu ${field}` })
    .min(1, { error: `Thiếu ${field}` })
    .max(MAX_ID_CHARS, { error: `${field} không hợp lệ` })

// Body POST — kiểm bằng Zod thay vì ép kiểu tay (dữ liệu ngoài, CLAUDE.md mục 4.1).
const HolodeckBodySchema = z.discriminatedUnion(
  'action',
  [
    z.object({ action: z.literal('start'), scenarioId: id('scenarioId') }),
    z.object({
      action: z.literal('turn'),
      sessionId: id('sessionId'),
      utterance: z
        .string({ error: 'Thiếu utterance' })
        .trim()
        .min(1, { error: 'Thiếu utterance' })
        // `refine` (không phải `.max`) để `params.status` tới được `validateBody` → 413.
        .refine((v) => v.length <= MAX_UTTERANCE_CHARS, {
          error: `Câu trả lời quá dài (tối đa ${MAX_UTTERANCE_CHARS} ký tự)`,
          params: { status: 413 },
        }),
    }),
    z.object({ action: z.literal('finalize'), sessionId: id('sessionId') }),
  ],
  { error: 'Action không hợp lệ' },
)

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'scenario_holodeck_api'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/scenario-holodeck' })
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
      const sessionId = url.searchParams.get('sessionId')

      if (sessionId) {
        // Phiên chỉ thuộc về người đã tạo nó (service kiểm chủ) — không có/hết hạn/của người
        // khác đều 404 giống hệt nhau, không lộ id nào có thật (audit 0526).
        const session = getHolodeckSession(sessionId, person.id)
        if (!session) throw new SessionGoneError()
        return jsonResponse({ session }, 200, headers)
      }

      const scenarios = listPredefinedScenarios()
      return jsonResponse({ scenarios }, 200, headers)
    }

    if (req.method === 'POST') {
      const bodyResult = await readJsonBody(req)
      if (!bodyResult.ok) {
        return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, headers)
      }
      const parsed = validateBody(HolodeckBodySchema, bodyResult.raw)
      if (!parsed.ok) {
        return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
      }
      const body = parsed.data

      if (body.action === 'start') {
        const session = startHolodeckSession(person.id, body.scenarioId)
        return jsonResponse({ session }, 201, headers)
      }
      if (body.action === 'turn') {
        // Service tự kiểm chủ phiên + hạn: không có/hết hạn/của người khác → 404.
        const result = processHolodeckTurn(body.sessionId, person.id, body.utterance)
        return jsonResponse(result, 200, headers)
      }
      const session = finalizeHolodeckSession(body.sessionId, person.id)
      return jsonResponse({ session }, 200, headers)
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  } catch (err) {
    if (isAppError(err)) {
      return jsonResponse(toErrorBody(err), err.status, headers)
    }
    return jsonResponse({ error: 'Lỗi xử lý phòng giả lập Scenario Holodeck' }, 500, headers)
  }
}
