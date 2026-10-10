// api/socratic-diagnostics.ts — V3 Socratic Cognitive Diagnostic Endpoint.
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
  listMisconceptions,
  startSocraticSession,
  submitSocraticReflection,
} from '@dhcb/core-personal/socraticDiagnosticsService'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { jsonResponse, getClientIp, logInternalError } from '@dhcb/core-http/http'
import { readJsonBody, validateBody } from '@dhcb/core-http/validation'

/** Trần độ dài một câu trả lời — chặn một lượt nhét hàng MB vào phiên trong RAM. */
const MAX_ANSWER_CHARS = 2000
const MAX_ID_CHARS = 100

// Body POST — kiểm bằng Zod thay vì ép kiểu tay (dữ liệu ngoài, CLAUDE.md mục 4.1).
const SocraticBodySchema = z.discriminatedUnion(
  'action',
  [
    z.object({
      action: z.literal('start'),
      misconceptionId: z
        .string({ error: 'Thiếu misconceptionId' })
        .min(1, { error: 'Thiếu misconceptionId' })
        .max(MAX_ID_CHARS, { error: 'misconceptionId không hợp lệ' }),
    }),
    z.object({
      action: z.literal('reflect'),
      sessionId: z
        .string({ error: 'Thiếu sessionId hoặc answer' })
        .min(1, { error: 'Thiếu sessionId hoặc answer' })
        .max(MAX_ID_CHARS, { error: 'sessionId không hợp lệ' }),
      answer: z
        .string({ error: 'Thiếu sessionId hoặc answer' })
        .trim()
        .min(1, { error: 'Thiếu sessionId hoặc answer' })
        // `refine` (không phải `.max`) để `params.status` tới được `validateBody` → 413.
        .refine((v) => v.length <= MAX_ANSWER_CHARS, {
          error: `Câu trả lời quá dài (tối đa ${MAX_ANSWER_CHARS} ký tự)`,
          params: { status: 413 },
        }),
    }),
  ],
  { error: 'Action không hợp lệ' },
)

export default async function handler(req: Request): Promise<Response> {
  const headers = { ...getCorsHeaders(req), ...SECURITY_HEADERS }

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 60, 'socratic_diagnostics_api'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/socratic-diagnostics' })
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
      const misconceptions = listMisconceptions()
      return jsonResponse({ misconceptions }, 200, headers)
    }

    if (req.method === 'POST') {
      const bodyResult = await readJsonBody(req)
      if (!bodyResult.ok) {
        return jsonResponse({ error: bodyResult.error.message }, bodyResult.error.status, headers)
      }

      const parsed = validateBody(SocraticBodySchema, bodyResult.raw)
      if (!parsed.ok) {
        return jsonResponse({ error: parsed.error.message }, parsed.error.status, headers)
      }
      const body = parsed.data

      if (body.action === 'start') {
        const session = startSocraticSession(person.id, body.misconceptionId)
        return jsonResponse({ session }, 201, headers)
      }
      // Chỉ chủ phiên mới trả lời được — service kiểm chủ + hạn. Phiên không có/hết hạn/của
      // người khác trả CÙNG 404: không lộ id nào có thật, user B không đọc/ghi được phiên user A.
      const result = submitSocraticReflection(body.sessionId, person.id, body.answer)
      return jsonResponse(result, 200, headers)
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  } catch (err) {
    if (isAppError(err)) {
      return jsonResponse(toErrorBody(err), err.status, headers)
    }
    logInternalError(err, 'socratic-diagnostics')
    return jsonResponse({ error: 'Lỗi xử lý chẩn đoán nhận thức Socratic' }, 500, headers)
  }
}
