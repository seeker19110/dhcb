// api/_lib/reauthGate.ts — CỔNG XÁC MINH LẠI danh tính dùng chung cho mọi thao tác không hoàn tác
// hoặc rút toàn bộ dữ liệu ra ngoài.
//
// Tách ra từ `account.ts` (changelog 0533) ở changelog 0541 để `/api/persons?action=full_erase`
// đi ĐÚNG cùng một luồng — không sao chép logic bảo mật sang handler thứ hai (sao chép là chỗ
// hai bản lệch nhau theo thời gian). Nơi dùng:
//   - `apps/server/src/api/core/account.ts`     (xoá tài khoản / xuất dữ liệu)
//   - `apps/server/src/api/personal/persons.ts` (xoá toàn bộ dữ liệu cá nhân Personal OS)
//
// Ba lớp, đúng thứ tự:
//   1. Bộ đếm lượt thử THEO NGƯỜI DÙNG (5 lần / 15 phút). Khoá DÙNG CHUNG giữa các route: kẻ cầm
//      cookie bị đánh cắp không được nhân đôi số lần dò mật khẩu bằng cách xoay qua route khác.
//   2. Bằng chứng xác minh lại (mật khẩu hoặc token Google còn mới) — `verifyAccountReauth`.
//   3. Nếu người dùng bật 2FA và phiên chưa trong cửa sổ nâng quyền: đòi mã 2FA, tái dùng bộ đếm
//      sai mã của `/api/two-factor`.
//
// Hàm trả `null` khi qua cổng, hoặc một `Response` lỗi (mã máy đọc được) để handler trả thẳng.

import type { Pool } from 'pg'
import { consumeWindowCounter, resetCounter, logSecurityEvent } from '@dhcb/core-auth/security'
import { readSessionCookie } from '@dhcb/core-auth/sessionCookie'
import { getTwoFactorStatus, hasStepUp, verifyTwoFactor } from '@dhcb/core-auth/twoFactor'
import { verifyAccountReauth } from '@dhcb/core-auth/accountReauth'
import type { Reauth, ReauthErrorCode } from '@dhcb/core-contracts/account'
import { jsonResponse } from '@dhcb/core-http/http'
import {
  TWO_FACTOR_USER_MAX_ATTEMPTS,
  TWO_FACTOR_USER_WINDOW_MS,
  twoFactorUserKey,
} from '../core/two-factor.js'

/** Theo NGƯỜI DÙNG — số lần thử xác minh lại (mật khẩu/Google) trong cửa sổ. */
export const ACCOUNT_REAUTH_MAX_ATTEMPTS = 5
export const ACCOUNT_REAUTH_WINDOW_MS = 15 * 60_000

/** Khoá bộ đếm — giữ tên `account-reauth:` cho mọi route để dùng chung một hạn mức. */
export function accountReauthKey(userId: string): string {
  return `account-reauth:${userId}`
}

export function reauthErrorBody<C extends string>(
  error: string,
  code: C,
): { error: string; code: C } {
  return { error, code }
}

export interface ReauthGateInput {
  req: Request
  pool: Pool
  /** LUÔN lấy từ phiên (`validateAuth`), không bao giờ từ client. */
  userId: string
  clientIp: string
  headers: Record<string, string>
  reauth: Reauth
  twoFactorCode?: string
  /** Mã băm một chiều của userId để ghi log (không ghi userId trần). */
  subject: string
  /** Tên thao tác ghi vào log bảo mật (vd `delete`, `export`, `person_full_erase`). */
  action: string
  /** Đường dẫn API ghi vào log khi sai mã 2FA. */
  path: string
}

function errorResponse(
  message: string,
  code: ReauthErrorCode,
  status: number,
  headers: Record<string, string>,
): Response {
  return jsonResponse(reauthErrorBody(message, code), status, headers)
}

/**
 * Chạy đủ ba lớp xác minh lại. `null` ⇒ được phép làm tiếp; `Response` ⇒ trả thẳng cho client.
 * Lỗi hạ tầng (CSDL, Redis) được NÉM lên để wrapEdge trả 500 — không bao giờ "cho qua" khi lỗi.
 */
export async function requireReauth(input: ReauthGateInput): Promise<Response | null> {
  const { req, pool, userId, clientIp, headers, subject, action } = input

  // ── 1. Hạn mức lượt thử theo người dùng ────────────────────────────────────
  if (
    !(await consumeWindowCounter(
      accountReauthKey(userId),
      ACCOUNT_REAUTH_MAX_ATTEMPTS,
      ACCOUNT_REAUTH_WINDOW_MS,
    ))
  ) {
    logSecurityEvent('ACCOUNT_REAUTH_THROTTLED', clientIp, { subject, action })
    return errorResponse(
      'Thử xác minh quá nhiều lần — chờ 15 phút rồi thử lại.',
      'RATE_LIMITED',
      429,
      {
        ...headers,
        'Retry-After': String(ACCOUNT_REAUTH_WINDOW_MS / 1000),
      },
    )
  }

  // ── 2. Bằng chứng xác minh lại ─────────────────────────────────────────────
  const outcome = await verifyAccountReauth(pool, userId, input.reauth)
  if (!outcome.ok) {
    logSecurityEvent('ACCOUNT_REAUTH_FAILED', clientIp, {
      subject,
      action,
      method: input.reauth.method,
      reason: outcome.reason,
    })
    if (outcome.reason === 'unavailable') {
      return errorResponse(
        'Tài khoản của bạn không dùng được cách xác minh này. Hãy chọn cách khác hoặc liên hệ hỗ trợ.',
        'REAUTH_UNAVAILABLE',
        409,
        headers,
      )
    }
    return errorResponse(
      outcome.reason === 'stale'
        ? 'Phiên Google đã cũ — bấm "Xác minh bằng Google" lại rồi thử ngay.'
        : input.reauth.method === 'password'
          ? 'Mật khẩu không đúng.'
          : 'Không xác minh được tài khoản Google này.',
      'REAUTH_FAILED',
      401,
      headers,
    )
  }

  // ── 3. Lớp 2FA (nếu bật): TÁI DÙNG cửa sổ nâng quyền + bộ đếm sai mã của /api/two-factor ───
  const twoFactor = await getTwoFactorStatus(pool, userId)
  if (!twoFactor.enabled || (await hasStepUp(pool, userId, readSessionCookie(req)))) return null

  if (!input.twoFactorCode) {
    return errorResponse('Nhập mã xác thực hai bước để tiếp tục.', 'STEP_UP_REQUIRED', 403, headers)
  }
  const attemptKey = twoFactorUserKey(userId)
  if (
    !(await consumeWindowCounter(
      attemptKey,
      TWO_FACTOR_USER_MAX_ATTEMPTS,
      TWO_FACTOR_USER_WINDOW_MS,
    ))
  ) {
    logSecurityEvent('TWO_FACTOR_USER_THROTTLED', clientIp, { subject })
    return errorResponse(
      'Nhập sai mã quá nhiều lần — chờ 15 phút rồi thử lại.',
      'RATE_LIMITED',
      429,
      {
        ...headers,
        'Retry-After': String(TWO_FACTOR_USER_WINDOW_MS / 1000),
      },
    )
  }
  const verified = await verifyTwoFactor(pool, userId, input.twoFactorCode)
  if (!verified.ok) {
    logSecurityEvent('AUTH_FAILURE', clientIp, { path: input.path, action })
    return errorResponse('Mã xác thực hai bước không đúng.', 'TWO_FACTOR_INVALID', 401, headers)
  }
  await resetCounter(attemptKey)
  return null
}
