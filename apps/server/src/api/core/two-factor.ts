// api/core/two-factor.ts — Bật/tắt và xác minh xác thực hai bước (TOTP).
// Đặc tả: docs/research/dac-ta-ma-hoa-du-lieu-va-2fa-2026-08-23.md mục 4.
//
// GET  /api/two-factor                                   → trạng thái (đã bật? còn mấy mã khôi phục?)
// POST /api/two-factor { action: 'setup' }               → sinh secret + chuỗi otpauth:// dựng QR
// POST /api/two-factor { action: 'confirm', code }       → xác nhận mã đầu tiên, BẬT + trả mã khôi phục
// POST /api/two-factor { action: 'verify', code }        → nâng quyền phiên hiện tại 15 phút
// POST /api/two-factor { action: 'disable', code, password } → tắt (đòi CẢ mã 2FA lẫn mật khẩu)
// POST /api/two-factor { action: 'regenerate-recovery', code } → phát bộ mã khôi phục mới
//
// 2FA là TUỲ CHỌN — xem ghi chú đầu migration 0060. Route này chỉ quản lý lớp bảo vệ; việc CHẶN
// thao tác nhạy cảm do nơi tiêu thụ gọi `hasStepUp()` quyết định.

import { z } from 'zod'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  consumeWindowCounter,
  resetCounter,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { readSessionCookie } from '@dhcb/core-auth/sessionCookie'
import { verifyPassword } from '@dhcb/core-auth/authService'
import {
  getTwoFactorStatus,
  startTwoFactorSetup,
  confirmTwoFactorSetup,
  verifyTwoFactor,
  disableTwoFactor,
  regenerateRecoveryCodes,
  grantStepUp,
} from '@dhcb/core-auth/twoFactor'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'

// Mã 2FA (6 số) và mã khôi phục (10 ký tự hex) đi chung một ô nhập — người mất điện thoại đang
// hoảng không nên phải tìm đúng ô riêng. Ràng buộc rộng ở đây, việc phân biệt để service lo.
const CodeSchema = z.string().min(6).max(32)

const BodySchema = z.union([
  z.object({ action: z.literal('setup') }),
  z.object({ action: z.literal('confirm'), code: CodeSchema }),
  z.object({ action: z.literal('verify'), code: CodeSchema }),
  z.object({
    action: z.literal('disable'),
    code: CodeSchema,
    password: z.string().min(1).max(200),
  }),
  z.object({ action: z.literal('regenerate-recovery'), code: CodeSchema }),
])

// ── Giới hạn thử mã theo NGƯỜI DÙNG (vá 2026-09-27) ─────────────────────────────────────
// Rate limit theo IP ở trên không đủ: 2FA bảo vệ đúng tình huống kẻ khác đã có PHIÊN của nạn
// nhân (cookie bị đánh cắp), và kẻ đó thừa sức xoay nhiều IP để dò 10^6 mã. Đếm theo userId:
// tối đa 10 lần nhập mã / 15 phút (~1.000 lần/ngày → xác suất trúng ~0,3%/ngày thay vì chắc
// chắn trúng). Nhập đúng thì xoá bộ đếm.
export const TWO_FACTOR_USER_MAX_ATTEMPTS = 10
export const TWO_FACTOR_USER_WINDOW_MS = 15 * 60_000

export function twoFactorUserKey(userId: string): string {
  return `2fa-user:${userId}`
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  // Ngưỡng CHẶT hơn hẳn các route khác (30/phút): đây là đường dò mã 6 chữ số. Không có nó,
  // 10^6 tổ hợp là dò được trong thời gian thực tế.
  if (!(await checkRateLimit(clientIp, 10, '2fa'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/two-factor' })
    return jsonResponse({ error: 'Quá nhiều lần thử — chờ ít phút rồi thử lại' }, 429, allHeaders)
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  const pool = getPgPool()

  if (req.method === 'GET') {
    return jsonResponse(await getTwoFactorStatus(pool, auth.userId), 200, allHeaders)
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
  }

  const parsedBody = await readJsonBody(req)
  if (!parsedBody.ok)
    return jsonResponse({ error: parsedBody.error.message }, parsedBody.error.status, allHeaders)
  const result = validateBody(BodySchema, parsedBody.raw)
  if (!result.ok)
    return jsonResponse({ error: result.error.message }, result.error.status, allHeaders)

  const body = result.data

  // Mọi hành động trừ 'setup' đều nhận một mã → trừ lượt thử TRƯỚC khi kiểm mã.
  const attemptKey = twoFactorUserKey(auth.userId)
  if (
    body.action !== 'setup' &&
    !(await consumeWindowCounter(
      attemptKey,
      TWO_FACTOR_USER_MAX_ATTEMPTS,
      TWO_FACTOR_USER_WINDOW_MS,
    ))
  ) {
    logSecurityEvent('TWO_FACTOR_USER_THROTTLED', clientIp, { userId: auth.userId })
    return jsonResponse({ error: 'Nhập sai mã quá nhiều lần — chờ 15 phút rồi thử lại' }, 429, {
      ...allHeaders,
      'Retry-After': String(TWO_FACTOR_USER_WINDOW_MS / 1000),
    })
  }

  if (body.action === 'setup') {
    // Nhãn hiện trong app xác thực. Dùng email cho người dùng nhận ra tài khoản nào khi họ có
    // nhiều tài khoản; không có email thì rơi về id.
    const { rows } = await pool.query<{ email: string | null }>(
      'select email from public.users where id = $1',
      [auth.userId],
    )
    const label = rows[0]?.email || auth.userId
    try {
      return jsonResponse(await startTwoFactorSetup(pool, auth.userId, label), 200, allHeaders)
    } catch (err) {
      return jsonResponse(
        { error: err instanceof Error ? err.message : 'Không thiết lập được 2FA' },
        409,
        allHeaders,
      )
    }
  }

  if (body.action === 'confirm') {
    const res = await confirmTwoFactorSetup(pool, auth.userId, body.code)
    if (!res.ok) {
      logSecurityEvent('AUTH_FAILURE', clientIp, { path: '/api/two-factor', action: 'confirm' })
      return jsonResponse({ error: res.reason }, 400, allHeaders)
    }
    await resetCounter(attemptKey)
    // Bật xong thì mở luôn cửa sổ nâng quyền — người vừa chứng minh có thiết bị, bắt nhập lại
    // ngay là phiền vô ích.
    const raw = readSessionCookie(req)
    if (raw) await grantStepUp(pool, raw)
    return jsonResponse({ ok: true, recoveryCodes: res.recoveryCodes }, 200, allHeaders)
  }

  // Ba hành động còn lại đều đòi mã hợp lệ trước.
  const verified = await verifyTwoFactor(pool, auth.userId, body.code)
  if (!verified.ok) {
    logSecurityEvent('AUTH_FAILURE', clientIp, { path: '/api/two-factor', action: body.action })
    return jsonResponse(
      { error: verified.reason === 'not_enabled' ? 'Chưa bật 2FA' : 'Mã không đúng' },
      verified.reason === 'not_enabled' ? 409 : 401,
      allHeaders,
    )
  }
  await resetCounter(attemptKey)

  if (body.action === 'verify') {
    const raw = readSessionCookie(req)
    if (!raw) return jsonResponse({ error: 'Không đọc được phiên đăng nhập' }, 401, allHeaders)
    const until = await grantStepUp(pool, raw)
    return jsonResponse(
      { ok: true, stepUpUntil: until.toISOString(), usedRecoveryCode: verified.usedRecoveryCode },
      200,
      allHeaders,
    )
  }

  if (body.action === 'disable') {
    // Đòi THÊM mật khẩu: chỉ có mã 2FA thì ai mượn được điện thoại đang mở khoá là gỡ được lớp
    // bảo vệ. Tài khoản chỉ đăng nhập bằng Google (không có mật khẩu) không tự tắt được ở đây —
    // chủ ý, để không có đường tắt.
    const { rows } = await pool.query<{ password_hash: string | null }>(
      'select password_hash from public.users where id = $1',
      [auth.userId],
    )
    const hash = rows[0]?.password_hash
    if (!hash || !(await verifyPassword(body.password, hash))) {
      logSecurityEvent('AUTH_FAILURE', clientIp, { path: '/api/two-factor', action: 'disable' })
      return jsonResponse({ error: 'Mật khẩu không đúng' }, 401, allHeaders)
    }
    await disableTwoFactor(pool, auth.userId)
    return jsonResponse({ ok: true }, 200, allHeaders)
  }

  const codes = await regenerateRecoveryCodes(pool, auth.userId)
  return jsonResponse({ ok: true, recoveryCodes: codes }, 200, allHeaders)
}
