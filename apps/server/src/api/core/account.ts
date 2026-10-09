// api/core/account.ts — Xoá tài khoản + Xuất toàn bộ dữ liệu của tôi.
// Đặc tả: docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md (changelog 0533).
//
// GET  /api/account?action=options  → cách xác minh lại khả dụng, có cần mã 2FA không, VIP còn hạn?
// POST /api/account { action: 'export', reauth, twoFactorCode? }                → tệp JSON
// POST /api/account { action: 'delete', reauth, twoFactorCode?, confirmation,
//                     acknowledgeNoRefund? }                                    → { ok, erasedAt }
//
// Kiểm quyền: `userId` CHỈ lấy từ phiên (`validateAuth`); mọi trường `userId`/`personId` client gửi
// đều bị Zod bỏ qua (schema không có trường đó). POST đi qua `isTrustedMutation` ở `wrapEdge`.
//
// Thứ tự kiểm có chủ ý: lỗi do người dùng gõ (câu xác nhận, chưa đánh dấu không hoàn tiền) trả về
// TRƯỚC khi trừ lượt xác minh — gõ sai câu xác nhận không được làm người dùng bị khoá 15 phút.

import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { buildClearSessionCookie, readSessionCookie } from '@dhcb/core-auth/sessionCookie'
import { getTwoFactorStatus, hasStepUp } from '@dhcb/core-auth/twoFactor'
import { getReauthMethods } from '@dhcb/core-auth/accountReauth'
import { resolvePlan } from '@dhcb/core-billing/plan'
import { listLivePendingPayments } from '@dhcb/core-billing/paymentCancel'
import { NotFoundError } from '@dhcb/core-errors/appError'
import {
  AccountBodySchema,
  isDeleteConfirmationValid,
  type AccountErrorCode,
  type AccountOptions,
} from '@dhcb/core-contracts/account'
import {
  deleteAccount,
  exportAccountData,
  hasLivePendingPayment,
} from '@dhcb/core-personal/accountErasureService'
import {
  accountSubjectHash,
  PENDING_PAYMENT_MESSAGE,
  PendingPaymentError,
} from '@dhcb/core-personal/accountErasureShared'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
import { requireReauth } from '../_lib/reauthGate.js'

// Giữ export cũ cho nơi đang import từ account.ts (test, tài liệu) — nguồn thật ở reauthGate.ts.
export {
  ACCOUNT_REAUTH_MAX_ATTEMPTS,
  ACCOUNT_REAUTH_WINDOW_MS,
  accountReauthKey,
} from '../_lib/reauthGate.js'

/** Theo IP — mọi request vào route (kể cả GET options). */
export const ACCOUNT_IP_LIMIT_PER_MIN = 10

function errorBody(
  error: string,
  code: AccountErrorCode,
): { error: string; code: AccountErrorCode } {
  return { error, code }
}

/** VIP đang có hiệu lực (kể cả VIP vĩnh viễn). */
async function readVipStatus(
  userId: string,
): Promise<{ vipActive: boolean; planExpiresAt: string | null }> {
  const { rows } = await getPgPool().query<{ plan: string | null; plan_expires_at: Date | null }>(
    'select plan, plan_expires_at from public.profiles where id = $1',
    [userId],
  )
  const row = rows[0]
  const vipActive = resolvePlan(row?.plan, row?.plan_expires_at) === 'vip'
  return {
    vipActive,
    planExpiresAt:
      vipActive && row?.plan_expires_at ? new Date(row.plan_expires_at).toISOString() : null,
  }
}

/**
 * Mô tả lỗi AN TOÀN để ghi log: chỉ mã lỗi Postgres (`23503`…) hoặc tên lớp lỗi. KHÔNG ghi
 * `err.message` — thông điệp lỗi Postgres có thể chứa giá trị khoá/email (`Key (email)=(…)`).
 */
export function safeErrorTag(err: unknown): string {
  if (err && typeof err === 'object') {
    const code = (err as { code?: unknown }).code
    if (typeof code === 'string' && code) return code
    if (err instanceof Error) return err.name
  }
  return typeof err
}

function pendingPaymentResponse(headers: Record<string, string>): Response {
  return jsonResponse(errorBody(PENDING_PAYMENT_MESSAGE, 'PAYMENT_PENDING'), 409, headers)
}

function exportFilename(now: Date): string {
  return `dhcb-du-lieu-cua-toi-${now.toISOString().slice(0, 10)}.json`
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS, 'Cache-Control': 'no-store' }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, ACCOUNT_IP_LIMIT_PER_MIN, 'account'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/account' })
    return jsonResponse(errorBody('Quá nhiều yêu cầu — thử lại sau 1 phút', 'RATE_LIMITED'), 429, {
      ...allHeaders,
      'Retry-After': '60',
    })
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)
  const userId = auth.userId
  // Log bảo mật KHÔNG ghi userId trần (rà soát 0533): dùng mã băm một chiều — cùng giá trị với
  // `subject_hash` của nhật ký xoá nên vẫn đối chiếu được khi điều tra.
  const subject = accountSubjectHash(userId)
  const pool = getPgPool()

  // ── GET options ───────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    if (new URL(req.url).searchParams.get('action') !== 'options') {
      return jsonResponse({ error: 'Thiếu action=options' }, 400, allHeaders)
    }
    const [methods, twoFactor, vip, pendingPayments] = await Promise.all([
      getReauthMethods(pool, userId),
      getTwoFactorStatus(pool, userId),
      readVipStatus(userId),
      // Đơn chờ chặn xoá — giao diện hiện rõ từng đơn + nút tự huỷ (changelog 0546).
      listLivePendingPayments(pool, userId),
    ])
    const twoFactorRequired =
      twoFactor.enabled && !(await hasStepUp(pool, userId, readSessionCookie(req)))
    const body: AccountOptions = { methods, twoFactorRequired, ...vip, pendingPayments }
    return jsonResponse(body, 200, allHeaders)
  }

  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)

  const parsedBody = await readJsonBody(req)
  if (!parsedBody.ok)
    return jsonResponse({ error: parsedBody.error.message }, parsedBody.error.status, allHeaders)
  const parsed = validateBody(AccountBodySchema, parsedBody.raw)
  if (!parsed.ok)
    return jsonResponse({ error: parsed.error.message }, parsed.error.status, allHeaders)
  const body = parsed.data

  // ── Lỗi do gõ/chưa xác nhận: trả TRƯỚC khi trừ lượt xác minh ────────────────
  if (body.action === 'delete') {
    if (!isDeleteConfirmationValid(body.confirmation)) {
      return jsonResponse(
        errorBody(
          'Câu xác nhận chưa đúng — gõ lại đúng câu được yêu cầu.',
          'CONFIRMATION_MISMATCH',
        ),
        400,
        allHeaders,
      )
    }
    const vip = await readVipStatus(userId)
    if (vip.vipActive && body.acknowledgeNoRefund !== true) {
      return jsonResponse(
        errorBody(
          'Gói VIP của bạn còn hạn và sẽ mất khi xoá tài khoản, không hoàn tiền. Hãy đánh dấu xác nhận trước.',
          'VIP_ACK_REQUIRED',
        ),
        409,
        allHeaders,
      )
    }
    // Báo SỚM (trước khi trừ lượt xác minh) nếu còn đơn chờ trả. Chỉ là UX — chốt thật nằm trong
    // transaction của `deleteAccount` (kiểm lại sau khi khoá dòng users).
    if (await hasLivePendingPayment(pool, userId)) return pendingPaymentResponse(allHeaders)
  }

  // ── Xác minh lại danh tính + 2FA: cổng dùng chung (reauthGate.ts, changelog 0541) ────
  const denied = await requireReauth({
    req,
    pool,
    userId,
    clientIp,
    headers: allHeaders,
    reauth: body.reauth,
    twoFactorCode: body.twoFactorCode,
    subject,
    action: body.action,
    path: '/api/account',
  })
  if (denied) return denied

  // ── Xuất ───────────────────────────────────────────────────────────────────
  if (body.action === 'export') {
    // Lỗi CSDL ⇒ ném ⇒ wrapEdge trả 500 + Sentry; KHÔNG trả bản xuất thiếu.
    const data = await exportAccountData(pool, userId)
    logSecurityEvent('ACCOUNT_EXPORTED', clientIp, { subject })
    return new Response(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        ...allHeaders,
        'content-type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${exportFilename(new Date())}"`,
      },
    })
  }

  // ── Xoá ────────────────────────────────────────────────────────────────────
  let result: Awaited<ReturnType<typeof deleteAccount>>
  try {
    result = await deleteAccount(pool, userId)
  } catch (err) {
    if (err instanceof NotFoundError) {
      // Request song song đã xoá xong trước — không phải lỗi hệ thống.
      return jsonResponse({ error: 'Tài khoản không còn tồn tại' }, 404, {
        ...allHeaders,
        'Set-Cookie': buildClearSessionCookie(req.headers.get('host') ?? ''),
      })
    }
    // Đơn chờ trả xuất hiện giữa lần kiểm sớm và transaction (đã rollback) ⇒ 409, không phải sự cố.
    if (err instanceof PendingPaymentError) return pendingPaymentResponse(allHeaders)
    // Ghi dấu vết thất bại (đã rollback toàn bộ) rồi NÉM tiếp: wrapEdge trả 500 + Sentry.
    logSecurityEvent('ACCOUNT_DELETE_FAILED', clientIp, { subject, error: safeErrorTag(err) })
    throw err
  }

  // Không ghi userId vào log thành công: nhật ký xoá đã có mã băm; log ứng dụng chỉ cần id nhật ký.
  logSecurityEvent('ACCOUNT_DELETED', clientIp, { erasureLogId: result.erasureLogId })
  return jsonResponse({ ok: true, erasedAt: result.erasedAt }, 200, {
    ...allHeaders,
    // Phiên trong CSDL đã bị xoá cùng transaction; xoá luôn cookie trên trình duyệt.
    'Set-Cookie': buildClearSessionCookie(req.headers.get('host') ?? ''),
  })
}
