// packages/core-contracts/account.ts — Hợp đồng "Xoá tài khoản + Xuất dữ liệu của tôi".
//
// Đặc tả: docs/specs/2026-10-08-xoa-tai-khoan-va-xuat-du-lieu.md §③.
// Dùng CHUNG cho server (`apps/server/src/api/core/account.ts` validate body) và giao diện
// (`apps/dhcb/src/components/AccountDataSection.tsx` bật nút xoá) — một nguồn sự thật cho câu xác
// nhận, để client và server không bao giờ lệch nhau về "gõ thế nào thì được".

import { z } from 'zod'

// ── Xác minh lại danh tính (step-up) ────────────────────────────────────────────

/** Cách xác minh lại mà server hỗ trợ. Facebook/Apple/Microsoft: KHÔNG (xem đặc tả ①). */
export const ReauthMethodSchema = z.enum(['password', 'google'])
export type ReauthMethod = z.infer<typeof ReauthMethodSchema>

export const ReauthSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('password'), password: z.string().min(1).max(200) }),
  // Access token lấy từ popup Google Identity Services (`initTokenClient`) — đúng cơ chế đăng
  // nhập Google thật của app (packages/core-ui/clientAuth.ts), không phải One Tap.
  z.object({ method: z.literal('google'), accessToken: z.string().min(10).max(4096) }),
])
export type Reauth = z.infer<typeof ReauthSchema>

/** Mã 2FA (6 số) hoặc mã khôi phục — cùng ràng buộc với `/api/two-factor`. */
const TwoFactorCodeSchema = z.string().min(6).max(32)

/**
 * Bằng chứng xác minh lại đi kèm một thao tác nguy hiểm — dùng chung cho `/api/account` và
 * `DELETE /api/persons?action=full_erase` (changelog 0541).
 */
export const ReauthProofSchema = z.object({
  reauth: ReauthSchema,
  twoFactorCode: TwoFactorCodeSchema.optional(),
})
export type ReauthProof = z.infer<typeof ReauthProofSchema>

// ── Body DELETE /api/persons?action=full_erase ─────────────────────────────────

/** Xoá toàn bộ dữ liệu cá nhân Personal OS — bắt buộc xác minh lại như xoá tài khoản. */
export const PersonFullEraseBodySchema = ReauthProofSchema
export type PersonFullEraseBody = ReauthProof

/** Mã lỗi của cổng xác minh lại (`apps/server/src/api/_lib/reauthGate.ts`). */
export const REAUTH_ERROR_CODES = [
  // Request thao tác nguy hiểm mà KHÔNG kèm bằng chứng xác minh lại hợp lệ.
  'REAUTH_REQUIRED',
  'REAUTH_UNAVAILABLE',
  'REAUTH_FAILED',
  'STEP_UP_REQUIRED',
  'RATE_LIMITED',
] as const
export type ReauthErrorCode = (typeof REAUTH_ERROR_CODES)[number]

// ── Câu xác nhận gõ tay ─────────────────────────────────────────────────────────

/** Câu hiển thị cho người dùng gõ lại, theo ngôn ngữ GIAO DIỆN. */
export const DELETE_CONFIRMATION_PHRASES = {
  vi: 'XOÁ TÀI KHOẢN',
  en: 'DELETE MY ACCOUNT',
} as const

/**
 * Chuẩn hoá trước khi so: bỏ dấu, viết hoa, gộp khoảng trắng.
 *
 * Vì sao bỏ dấu: bàn phím tiếng Việt đặt dấu khác nhau ("XÓA" kiểu cũ vs "XOÁ" kiểu mới, Telex
 * vs VNI, NFC vs NFD trên iOS). Bắt người dùng gõ khớp từng điểm mã là bắt họ đoán — câu xác
 * nhận chỉ cần chứng minh họ CỐ Ý, không phải thử khả năng gõ dấu.
 */
export function normalizeConfirmation(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{M}/gu, '') // bỏ dấu thanh + dấu mũ/móc
    .replace(/[đĐ]/g, 'D')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim()
}

const ACCEPTED_CONFIRMATIONS: ReadonlySet<string> = new Set(
  Object.values(DELETE_CONFIRMATION_PHRASES).map(normalizeConfirmation),
)

/** Người dùng gõ đúng một trong các câu xác nhận (sau chuẩn hoá) chưa. */
export function isDeleteConfirmationValid(input: string): boolean {
  return ACCEPTED_CONFIRMATIONS.has(normalizeConfirmation(input))
}

// ── Body POST /api/account ─────────────────────────────────────────────────────

export const AccountExportBodySchema = ReauthProofSchema.extend({
  action: z.literal('export'),
})

export const AccountDeleteBodySchema = ReauthProofSchema.extend({
  action: z.literal('delete'),
  // Chỉ giới hạn độ dài ở đây; khớp câu thì kiểm riêng để trả mã lỗi rõ (CONFIRMATION_MISMATCH).
  confirmation: z.string().min(1).max(100),
  // Bắt buộc `true` khi gói VIP còn hạn — server kiểm (VIP_ACK_REQUIRED).
  acknowledgeNoRefund: z.boolean().optional(),
})

export const AccountBodySchema = z.discriminatedUnion('action', [
  AccountExportBodySchema,
  AccountDeleteBodySchema,
])
export type AccountBody = z.infer<typeof AccountBodySchema>

// ── GET /api/account?action=options ────────────────────────────────────────────

export const AccountOptionsSchema = z.object({
  methods: z.array(ReauthMethodSchema),
  /** 2FA đang bật VÀ phiên hiện tại chưa trong cửa sổ nâng quyền ⇒ phải nhập mã. */
  twoFactorRequired: z.boolean(),
  vipActive: z.boolean(),
  /** ISO 8601; null khi Free hoặc VIP vĩnh viễn (phân biệt bằng `vipActive`). */
  planExpiresAt: z.string().nullable(),
})
export type AccountOptions = z.infer<typeof AccountOptionsSchema>

export const AccountDeleteResultSchema = z.object({
  ok: z.literal(true),
  erasedAt: z.string(),
})

/** Mã lỗi máy đọc được — giao diện rẽ nhánh theo đây, không theo chuỗi thông báo. */
export const ACCOUNT_ERROR_CODES = [
  'CONFIRMATION_MISMATCH',
  ...REAUTH_ERROR_CODES,
  'VIP_ACK_REQUIRED',
  // Còn đơn thanh toán chờ trả — xoá lúc này sẽ làm mất tiền chuyển vào sau (rà soát 0533).
  'PAYMENT_PENDING',
] as const
export type AccountErrorCode = (typeof ACCOUNT_ERROR_CODES)[number]
