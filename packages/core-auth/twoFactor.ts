// packages/core-auth/twoFactor.ts — Nghiệp vụ xác thực hai bước (TOTP).
//
// Lõi thuật toán ở `totp.ts` (thuần, không đụng CSDL). File này lo phần trạng thái: bật/tắt, mã
// khôi phục, chống dùng lại mã, và cửa sổ nâng quyền.
//
// Ba quyết định thiết kế đáng nhớ:
//  1. **Bật 2FA là HAI bước** (sinh secret → nhập mã xác nhận). Bật ngay lúc sinh secret sẽ khiến
//     người quét QR hỏng tự khoá mình ra khỏi tài khoản mà không biết.
//  2. **Mã khôi phục bắt buộc**, băm bcrypt, dùng một lần. Không có nó, mất điện thoại = mất tài
//     khoản vĩnh viễn.
//  3. **Cửa sổ nâng quyền gắn theo SESSION**, không theo người dùng — xác thực trên điện thoại
//     không được phép mở khoá cho phiên đang mở ở máy khác.

import { randomBytes, createHash } from 'node:crypto'
import type { Pool } from 'pg'
import { withTransaction } from '@dhcb/core-db/transaction'
import { encryptUserField, decryptUserField } from '@dhcb/core-config/userDataCrypto'
import { generateTotpSecret, buildOtpAuthUri, verifyTotpCode, base32Encode } from './totp.js'
import { hashSessionToken } from './authService.js'

const RECOVERY_CODE_COUNT = 10
const RECOVERY_CODE_BYTES = 10 // 80 bit ngẫu nhiên → đúng 16 ký tự Base32 = 4 nhóm 4 đều nhau
export const STEPUP_WINDOW_MS = 15 * 60 * 1000

/**
 * Sinh một mã khôi phục: 80 bit ngẫu nhiên, hiện dạng `XXXX-XXXX-XXXX-XXXX`.
 *
 * Hai chi tiết nhỏ nhưng đúng ca dùng thật (người chép mã từ tờ giấy in ra):
 *   • Base32 không có 0/1/8/9 ⇒ không nhầm 0 với O, 1 với I.
 *   • Chọn 10 byte để ra ĐÚNG 16 ký tự, chia hết cho 4. Bản đầu dùng 8 byte ra 13 ký tự, nhóm
 *     cuối lẻ đúng một ký tự (`...-SIAY-W`) — nhìn như bị cắt mất, dễ khiến người ta chép thiếu.
 */
function generateRecoveryCode(): string {
  const raw = base32Encode(randomBytes(RECOVERY_CODE_BYTES))
  return (raw.match(/.{1,4}/g) ?? [raw]).join('-')
}

/** Chuẩn hoá trước khi băm/so: bỏ gạch nối và khoảng trắng, viết hoa. */
function normalizeRecoveryCode(code: string): string {
  return code.replace(/[\s-]/g, '').toUpperCase()
}

/**
 * Băm mã khôi phục bằng SHA-256, KHÔNG phải bcrypt.
 *
 * Bcrypt sinh ra để chống dò MẬT KHẨU do người tự nghĩ (entropy thấp) — nó cố tình chậm. Mã khôi
 * phục thì ngược lại: 64 bit HOÀN TOÀN ngẫu nhiên, không có gì để "đoán", nên làm chậm hàm băm
 * chẳng thêm an toàn (2^64 phép thử là bất khả thi dù hàm băm nhanh cỡ nào).
 *
 * Đổi lại được ba thứ đáng giá:
 *   1. Phát 10 mã tốn ~0ms thay vì ~3 giây (bcrypt 12 vòng × 10, đo thật khi viết bản đầu).
 *   2. Băm TẤT ĐỊNH ⇒ tra thẳng theo `code_hash`, không phải duyệt so từng mã (bcrypt có salt
 *      riêng mỗi bản ghi nên buộc phải duyệt).
 *   3. Cùng cách repo đang băm session token (`authService.hashToken`) — cũng là chuỗi ngẫu
 *      nhiên, cùng lý do.
 */
function hashRecoveryCode(code: string): string {
  return createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex')
}

export interface TwoFactorStatus {
  /** Đã bật và có hiệu lực chưa. */
  enabled: boolean
  /** Đã sinh secret nhưng chưa xác nhận bằng mã đầu tiên. */
  pending: boolean
  /** Số mã khôi phục CHƯA dùng — cảnh báo người dùng khi sắp hết. */
  recoveryCodesLeft: number
}

interface TwoFactorRow {
  secret: string
  enabled_at: Date | null
  last_used_step: string | null // bigint về JS là string qua node-pg
}

/**
 * Đọc thiết lập 2FA và GIẢI MÃ secret.
 *
 * Secret TOTP là thứ nhạy cảm nhất trong bảng này: ai đọc được nó thì sinh mã 2FA hợp lệ vô hạn,
 * tức lớp bảo vệ coi như không tồn tại. Vì vậy nó được mã hoá trong DB (và do đó trong mọi bản
 * backup) — xem `packages/core-config/userDataCrypto.ts`.
 *
 * `decryptUserField` trả nguyên văn khi giá trị CHƯA mã hoá, nên bản ghi tạo trước khi bật mã hoá
 * vẫn dùng được bình thường và không cần dừng dịch vụ để viết lại dữ liệu.
 */
async function readRow(
  pool: Pool,
  userId: string,
): Promise<(TwoFactorRow & { storedSecret: string }) | null> {
  const { rows } = await pool.query<TwoFactorRow>(
    'select secret, enabled_at, last_used_step from public.user_2fa where user_id = $1',
    [userId],
  )
  const row = rows[0]
  if (!row) return null
  return { ...row, storedSecret: row.secret, secret: await decryptUserField(userId, row.secret) }
}

export async function getTwoFactorStatus(pool: Pool, userId: string): Promise<TwoFactorStatus> {
  const row = await readRow(pool, userId)
  if (!row) return { enabled: false, pending: false, recoveryCodesLeft: 0 }
  const { rows } = await pool.query<{ n: string }>(
    'select count(*)::text as n from public.user_2fa_recovery_codes where user_id = $1 and used_at is null',
    [userId],
  )
  return {
    enabled: row.enabled_at != null,
    pending: row.enabled_at == null,
    recoveryCodesLeft: Number(rows[0]?.n ?? '0'),
  }
}

/**
 * Bước 1 — sinh secret mới và trả chuỗi để dựng mã QR.
 *
 * Gọi lại khi đang ở trạng thái chờ xác nhận sẽ THAY secret cũ (người dùng quét hỏng, làm lại).
 * Nhưng nếu 2FA đã BẬT thì từ chối: đổi secret lúc đó phải đi qua luồng tắt-rồi-bật, vốn đòi mã
 * hiện tại — nếu không, ai chiếm được phiên đăng nhập sẽ tự gắn thiết bị của họ vào tài khoản.
 */
export async function startTwoFactorSetup(
  pool: Pool,
  userId: string,
  accountLabel: string,
): Promise<{ secret: string; otpauthUri: string }> {
  const existing = await readRow(pool, userId)
  if (existing?.enabled_at != null) {
    throw new Error('2FA đã bật — hãy tắt trước khi thiết lập lại')
  }

  const secret = generateTotpSecret()
  // Mã hoá TRƯỚC khi chạm CSDL — secret không bao giờ nằm plaintext trong bảng hay trong backup.
  const stored = await encryptUserField(userId, secret)
  await pool.query(
    `insert into public.user_2fa (user_id, secret, enabled_at, last_used_step)
     values ($1, $2, null, null)
     on conflict (user_id) do update
       set secret = excluded.secret, enabled_at = null, last_used_step = null`,
    [userId, stored],
  )
  return { secret, otpauthUri: buildOtpAuthUri(secret, accountLabel) }
}

/**
 * Bước 2 — xác nhận bằng mã đầu tiên, bật 2FA và phát mã khôi phục.
 *
 * Mã khôi phục chỉ trả về ĐÚNG MỘT LẦN ở đây (DB chỉ giữ bản băm). Người dùng không lưu lại thì
 * phải sinh bộ mới — không có cách nào đọc lại.
 */
export async function confirmTwoFactorSetup(
  pool: Pool,
  userId: string,
  code: string,
): Promise<{ ok: true; recoveryCodes: string[] } | { ok: false; reason: string }> {
  const row = await readRow(pool, userId)
  if (!row) return { ok: false, reason: 'Chưa bắt đầu thiết lập 2FA' }
  if (row.enabled_at != null) return { ok: false, reason: '2FA đã bật rồi' }

  const res = await verifyTotpCode(row.secret, code)
  if (!res.valid) return { ok: false, reason: 'Mã không đúng' }

  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode)

  // Bật 2FA và phát mã khôi phục phải cùng một transaction: bật mà chưa có mã khôi phục là đẩy
  // người dùng vào trạng thái mất thiết bị = mất tài khoản.
  await withTransaction(pool, async (client) => {
    await client.query(
      'update public.user_2fa set enabled_at = now(), last_used_step = $2 where user_id = $1',
      [userId, res.timeStep],
    )
    await client.query('delete from public.user_2fa_recovery_codes where user_id = $1', [userId])
    for (const code of codes) {
      await client.query(
        'insert into public.user_2fa_recovery_codes (user_id, code_hash) values ($1, $2)',
        [userId, hashRecoveryCode(code)],
      )
    }
  })
  return { ok: true, recoveryCodes: codes }
}

export type VerifyOutcome =
  { ok: true; usedRecoveryCode: boolean } | { ok: false; reason: 'not_enabled' | 'invalid' }

/**
 * Kiểm mã người dùng nhập — chấp nhận CẢ mã TOTP lẫn mã khôi phục.
 *
 * Gộp hai loại vào một hàm là chủ ý: người mất điện thoại đang hoảng không nên phải tìm đúng ô
 * nhập riêng. Nhập gì đúng thì qua.
 */
export async function verifyTwoFactor(
  pool: Pool,
  userId: string,
  code: string,
): Promise<VerifyOutcome> {
  const row = await readRow(pool, userId)
  if (!row || row.enabled_at == null) return { ok: false, reason: 'not_enabled' }

  const lastStep = row.last_used_step == null ? null : Number(row.last_used_step)
  const totp = await verifyTotpCode(row.secret, code, { lastUsedStep: lastStep })
  if (totp.valid) {
    // CAS tại DB: hai request đọc cùng last_used_step chỉ một request được tiêu mã.
    const consumed = await pool.query(
      `update public.user_2fa set last_used_step = $2
       where user_id = $1 and enabled_at is not null and secret = $3
         and (last_used_step is null or last_used_step < $2)`,
      [userId, totp.timeStep, row.storedSecret],
    )
    return consumed.rowCount === 1
      ? { ok: true, usedRecoveryCode: false }
      : { ok: false, reason: 'invalid' }
  }

  return consumeRecoveryCode(pool, userId, code)
}

/**
 * Thử tiêu một mã khôi phục.
 *
 * Tìm và đánh dấu đã dùng bằng ĐÚNG MỘT câu UPDATE có điều kiện `used_at is null`: hai request
 * đồng thời cùng gửi một mã thì chỉ một câu chạm được hàng (`rowCount === 1`), câu kia thấy 0.
 * Nếu tách thành "kiểm rồi mới ghi" thì cả hai đều lọt — lỗi đua kinh điển ở luồng này.
 */
async function consumeRecoveryCode(
  pool: Pool,
  userId: string,
  code: string,
): Promise<VerifyOutcome> {
  const res = await pool.query(
    `update public.user_2fa_recovery_codes
        set used_at = now()
      where user_id = $1 and code_hash = $2 and used_at is null`,
    [userId, hashRecoveryCode(code)],
  )
  return res.rowCount === 1
    ? { ok: true, usedRecoveryCode: true }
    : { ok: false, reason: 'invalid' }
}

/**
 * Tắt 2FA. Nơi gọi PHẢI xác minh mã 2FA hiện tại VÀ mật khẩu trước khi gọi hàm này — nếu không,
 * ai chiếm được phiên đăng nhập chỉ cần gọi một request là gỡ sạch lớp bảo vệ.
 */
export async function disableTwoFactor(pool: Pool, userId: string): Promise<void> {
  await withTransaction(pool, async (client) => {
    await client.query('delete from public.user_2fa_recovery_codes where user_id = $1', [userId])
    await client.query('delete from public.user_2fa where user_id = $1', [userId])
  })
}

/** Phát bộ mã khôi phục mới, huỷ toàn bộ bộ cũ. Trả về đúng một lần. */
export async function regenerateRecoveryCodes(pool: Pool, userId: string): Promise<string[]> {
  const codes = Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode)
  await withTransaction(pool, async (client) => {
    await client.query('delete from public.user_2fa_recovery_codes where user_id = $1', [userId])
    for (const code of codes) {
      await client.query(
        'insert into public.user_2fa_recovery_codes (user_id, code_hash) values ($1, $2)',
        [userId, hashRecoveryCode(code)],
      )
    }
  })
  return codes
}

// ── Cửa sổ nâng quyền (step-up) ─────────────────────────────────────────────

/** Mở cửa sổ nâng quyền cho ĐÚNG session đang gọi (không phải cho mọi phiên của người dùng). */
export async function grantStepUp(pool: Pool, rawSessionToken: string): Promise<Date> {
  const until = new Date(Date.now() + STEPUP_WINDOW_MS)
  await pool.query('update public.sessions set stepup_until = $2 where session_token = $1', [
    hashSessionToken(rawSessionToken),
    until,
  ])
  return until
}

/**
 * Session này có đang trong cửa sổ nâng quyền không.
 *
 * Người CHƯA bật 2FA thì trả `true`: 2FA là tuỳ chọn, nên không thể lấy nó làm điều kiện chặn
 * người dùng chạm vào dữ liệu của chính họ. Ai muốn khoá thì bật 2FA.
 */
export async function hasStepUp(
  pool: Pool,
  userId: string,
  rawSessionToken: string | null,
): Promise<boolean> {
  const status = await getTwoFactorStatus(pool, userId)
  if (!status.enabled) return true
  if (!rawSessionToken) return false

  const { rows } = await pool.query<{ stepup_until: Date | null }>(
    'select stepup_until from public.sessions where session_token = $1',
    [hashSessionToken(rawSessionToken)],
  )
  const until = rows[0]?.stepup_until
  return until != null && new Date(until).getTime() > Date.now()
}
