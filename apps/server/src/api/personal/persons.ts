// api/persons.ts — Danh tính Personal OS của người đang đăng nhập (V2-03 slice 1).
//
// GET /api/persons                   → Person của chính user trong token (tự tạo nếu chưa có).
// GET /api/persons?action=export     → Xuất toàn bộ dữ liệu cá nhân (V2-19 Privacy Drill).
// DELETE /api/persons?action=full_erase → Xoá toàn bộ dữ liệu cascade (V2-19 Privacy Drill).
//   Body BẮT BUỘC: { reauth, twoFactorCode? } — xác minh lại danh tính qua cổng dùng chung với
//   `/api/account` (`../_lib/reauthGate.ts`, changelog 0541): cùng hạn mức lượt thử theo người
//   dùng, cùng lớp 2FA. Thiếu/sai dạng bằng chứng ⇒ 403 `REAUTH_REQUIRED`.
//
// KHÔNG có endpoint đọc Person của người khác — `personId` luôn suy ra từ token, không nhận từ
// client (CLAUDE.md mục 4.2).

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
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
import { validateBody } from '@dhcb/core-http/validation'
import { PersonFullEraseBodySchema, type PersonFullEraseBody } from '@dhcb/core-contracts/account'
import { accountSubjectHash } from '@dhcb/core-personal/accountErasureShared'
import { getOrCreatePerson } from '@dhcb/core-personal/personService'
import { exportPersonData, erasePersonData } from '@dhcb/core-personal/personErasureService'
import { reauthErrorBody, requireReauth } from '../_lib/reauthGate.js'

type FullEraseBodyResult =
  | { ok: true; body: PersonFullEraseBody }
  | { ok: false; status: 400 | 403; error: string; code?: 'REAUTH_REQUIRED' }

/**
 * Đọc body của full_erase. Body rỗng (client cũ không gửi gì) và body thiếu `reauth` đều là
 * "chưa xác minh lại" ⇒ 403 `REAUTH_REQUIRED`; chỉ JSON hỏng mới là 400.
 */
async function readFullEraseBody(req: Request): Promise<FullEraseBodyResult> {
  const text = await req.text()
  let raw: unknown = {}
  if (text.trim() !== '') {
    try {
      raw = JSON.parse(text)
    } catch {
      return { ok: false, status: 400, error: 'Body không hợp lệ (cần JSON)' }
    }
  }
  const parsed = validateBody(PersonFullEraseBodySchema, raw)
  if (parsed.ok) return { ok: true, body: parsed.data }
  return {
    ok: false,
    status: 403,
    error: 'Xác minh lại danh tính (mật khẩu hoặc Google) trước khi xoá toàn bộ dữ liệu cá nhân.',
    code: 'REAUTH_REQUIRED',
  }
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)

  // Rate limiting — stricter for export (heavy query)
  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  // Tên bucket KHÔNG chứa IP: IP là chủ thể đếm, checkRateLimit tự gom IPv6 theo /64.
  const rateLimitKey = action === 'export' ? 'persons-export' : 'persons'
  const rateLimitMax = action === 'export' ? 2 : 30 // export: 2/min, normal: 30/min

  if (!(await checkRateLimit(clientIp, rateLimitMax, rateLimitKey))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/persons', action })
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  const pool = getPgPool()
  const userId = auth.userId

  // Hồ sơ ẩn cần bật 2FA và xác minh lại đúng phiên hiện tại; đọc/xoá dữ liệu thường vẫn mở.
  async function requirePrivateRead(): Promise<Response | null> {
    const status = await getTwoFactorStatus(pool, userId)
    if (!status.enabled) {
      return jsonResponse(
        {
          error: 'Bật xác thực hai bước để xem dữ liệu riêng tư.',
          code: 'TWO_FACTOR_SETUP_REQUIRED',
        },
        403,
        allHeaders,
      )
    }
    if (!(await hasStepUp(pool, userId, readSessionCookie(req)))) {
      return jsonResponse(
        {
          error: 'Xác minh lại bằng mã hai bước để xem dữ liệu riêng tư.',
          code: 'STEP_UP_REQUIRED',
        },
        403,
        allHeaders,
      )
    }
    return null
  }

  // ── GET /api/persons ──────────────────────────────────────────────────────
  if (req.method === 'GET' && !action) {
    const person = await getOrCreatePerson(pool, auth.userId)
    return jsonResponse(person, 200, allHeaders)
  }

  // ── GET /api/persons?action=export ────────────────────────────────────────
  if (req.method === 'GET' && action === 'export') {
    const person = await getOrCreatePerson(pool, auth.userId)
    const denied = await requirePrivateRead()
    if (denied) return denied
    const exportData = await exportPersonData(pool, person.id)
    return jsonResponse(exportData, 200, allHeaders)
  }

  // ── DELETE /api/persons?action=full_erase ─────────────────────────────────
  if (req.method === 'DELETE' && action === 'full_erase') {
    // Xác minh lại TRƯỚC mọi thao tác CSDL — cookie phiên bị đánh cắp không đủ để xoá sạch.
    const parsed = await readFullEraseBody(req)
    if (!parsed.ok) {
      return jsonResponse(
        parsed.code ? reauthErrorBody(parsed.error, parsed.code) : { error: parsed.error },
        parsed.status,
        allHeaders,
      )
    }
    const denied = await requireReauth({
      req,
      pool,
      userId,
      clientIp,
      headers: allHeaders,
      reauth: parsed.body.reauth,
      twoFactorCode: parsed.body.twoFactorCode,
      subject: accountSubjectHash(userId),
      action: 'person_full_erase',
      path: '/api/persons',
    })
    if (denied) return denied

    const person = await getOrCreatePerson(pool, auth.userId)
    logSecurityEvent('PERSON_FULL_ERASE_INITIATED', clientIp, { personId: person.id })
    let result: Awaited<ReturnType<typeof erasePersonData>>
    try {
      result = await erasePersonData(pool, person.id, 'self')
    } catch (err) {
      // Xoá đã rollback toàn bộ (một transaction). Ghi vết rồi ném tiếp để routes.ts trả 500 +
      // báo Sentry — KHÔNG trả "thành công" khi dữ liệu còn nguyên (changelog 0527).
      logSecurityEvent('PERSON_FULL_ERASE_FAILED', clientIp, { personId: person.id })
      throw err
    }
    logSecurityEvent('PERSON_FULL_ERASE_COMPLETED', clientIp, {
      personId: person.id,
      schemasCleared: result.schemasCleared.length,
      recordsDeleted: result.recordsDeletedCount,
    })
    return jsonResponse(result, 200, allHeaders)
  }

  return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
}
