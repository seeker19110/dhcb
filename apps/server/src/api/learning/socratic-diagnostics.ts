// api/socratic-diagnostics.ts — V3 Socratic Cognitive Diagnostic Endpoint.
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
  getSocraticSession,
} from '@dhcb/core-personal/socraticDiagnosticsService'
import { isAppError, toErrorBody } from '@dhcb/core-errors/appError'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
import { readJsonBody } from '@dhcb/core-http/validation'

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

      const body = bodyResult.raw as {
        action: 'start' | 'reflect'
        misconceptionId?: string
        sessionId?: string
        answer?: string
      }

      if (body.action === 'start') {
        if (!body.misconceptionId) {
          return jsonResponse({ error: 'Thiếu misconceptionId' }, 400, headers)
        }
        const session = startSocraticSession(person.id, body.misconceptionId)
        return jsonResponse({ session }, 201, headers)
      }

      if (body.action === 'reflect') {
        if (!body.sessionId || !body.answer) {
          return jsonResponse({ error: 'Thiếu sessionId hoặc answer' }, 400, headers)
        }
        // Chỉ chủ phiên mới trả lời được. Phiên không tồn tại và phiên của người khác trả CÙNG
        // 404 — không để lộ id nào có thật, không để user B đọc/ghi câu trả lời của user A.
        const owned = getSocraticSession(body.sessionId)
        if (!owned || owned.personId !== person.id) {
          return jsonResponse({ error: 'Phiên không tồn tại' }, 404, headers)
        }
        const result = submitSocraticReflection(body.sessionId, body.answer)
        return jsonResponse(result, 200, headers)
      }

      return jsonResponse({ error: 'Action không hợp lệ' }, 400, headers)
    }

    return jsonResponse({ error: 'Method not allowed' }, 405, headers)
  } catch (err) {
    if (isAppError(err)) {
      return jsonResponse(toErrorBody(err), err.status, headers)
    }
    return jsonResponse({ error: 'Lỗi xử lý chẩn đoán nhận thức Socratic' }, 500, headers)
  }
}
