// api/_lib/referral.ts — Logic mời bạn dùng chung: sinh mã, ghi nhận lời mời, và TRAO THƯỞNG
// khi có bằng chứng đạt bài do SERVER chấm và email đã xác minh. Lịch sử do client
// tự gửi lên không có thẩm quyền cấp VIP.

import { randomInt } from 'node:crypto'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import { readVerifiedCefrExams } from './cefrAssessment.js'
import { grantPlanDays } from '@dhcb/core-billing/planGrant'
import { logSecurityEvent } from '@dhcb/core-auth/security'
import { erasedBenefitUnits, isBenefitBlocked } from '@dhcb/core-billing/erasedBenefitLedger'

// Số ngày Pro thưởng cho MỖI BÊN khi 1 lượt mời thành công (Bạn A và Bạn B đều nhận 7 ngày).
export const REFERRAL_REWARD_DAYS = 7

// Trần số lượt mời ĐƯỢC THƯỞNG trên mỗi tài khoản — chống cày tài khoản ảo hàng loạt.
// Vượt trần: người được mời VẪN dùng app bình thường, chỉ là người mời không được thưởng thêm.
export const MAX_REWARDED_REFERRALS = 10

// Bộ ký tự sinh mã: bỏ 0/O/1/I/L để người dùng đọc/gõ lại không nhầm.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6
const MAX_CODE_ATTEMPTS = 8

// randomInt của node:crypto — ngẫu nhiên an toàn, KHÔNG dùng Math.random. Mã mời gắn với
// phần thưởng thật (7 ngày Pro cho cả hai bên) nên phải đoán không ra; hai chỗ sinh mã khác
// trong dự án (emailVerification.ts, sepay.ts) đã dùng crypto từ trước — thống nhất nốt chỗ
// này (audit 2026-08-25, F7). randomInt còn tránh luôn lệch phân bố do modulo.
function randomCode(): string {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  }
  return out
}

/**
 * Lấy mã mời của user, sinh mới nếu chưa có (sinh lười). Retry khi đụng unique constraint.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const pool = getPgPool()

  const { rows } = await pool.query<{ referral_code: string | null }>(
    'select referral_code from public.profiles where id = $1',
    [userId],
  )
  const existing = rows[0]?.referral_code
  if (existing) return existing

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = randomCode()
    try {
      // Chỉ ghi khi CHƯA có mã (where referral_code is null) — tránh 2 request song song của
      // cùng 1 user ghi đè lẫn nhau thành 2 mã khác nhau.
      const { rows: updated } = await pool.query<{ referral_code: string }>(
        `insert into public.profiles (id, referral_code) values ($1, $2)
         on conflict (id) do update set referral_code = excluded.referral_code
         where public.profiles.referral_code is null
         returning referral_code`,
        [userId, code],
      )
      if (updated[0]?.referral_code) return updated[0].referral_code

      // Không trả về dòng nào = user đã có mã (do request song song vừa ghi) → đọc lại.
      const { rows: reread } = await pool.query<{ referral_code: string | null }>(
        'select referral_code from public.profiles where id = $1',
        [userId],
      )
      if (reread[0]?.referral_code) return reread[0].referral_code
    } catch (err) {
      // 23505 = unique_violation: mã trùng người khác → thử mã khác.
      if ((err as { code?: string }).code !== '23505') throw err
    }
  }

  throw new Error('Không sinh được mã mời sau nhiều lần thử')
}

export type ClaimResult =
  { ok: true } | { ok: false; reason: 'code_not_found' | 'self_invite' | 'already_referred' }

/**
 * Ghi nhận "user này được mời bởi mã X" — CHƯA thưởng (chờ họ học phiên đầu tiên).
 * Gọi ngay sau khi đăng ký thành công.
 */
export async function claimReferral(
  refereeId: string,
  rawCode: string,
  deviceHash: string | null = null,
): Promise<ClaimResult> {
  const pool = getPgPool()
  const code = rawCode.trim().toUpperCase()

  const { rows } = await pool.query<{ id: string }>(
    'select id from public.profiles where referral_code = $1',
    [code],
  )
  const referrerId = rows[0]?.id
  if (!referrerId) return { ok: false, reason: 'code_not_found' }
  if (referrerId === refereeId) return { ok: false, reason: 'self_invite' }

  try {
    const { rowCount } = await pool.query(
      `insert into public.referrals (referrer_id, referee_id, device_hash) values ($1, $2, $3)
       on conflict (referee_id) do nothing`,
      [referrerId, refereeId, deviceHash],
    )
    // rowCount = 0 → đã có người mời trước đó, không ghi đè (1 người chỉ được mời 1 lần).
    if (rowCount === 0) return { ok: false, reason: 'already_referred' }
    return { ok: true }
  } catch (err) {
    // 23514 = check_violation (referrals_no_self_invite) — hàng rào cuối ở tầng DB.
    if ((err as { code?: string }).code === '23514') return { ok: false, reason: 'self_invite' }
    throw err
  }
}

/**
 * Chỉ xét thưởng SAU khi giao dịch bằng chứng chấm bài đã commit. Tự kiểm lại bằng chứng
 * trong DB để không phụ thuộc nơi gọi. Lỗi thưởng không làm mất bài đã lưu; retry an toàn.
 */
export async function rewardReferralIfEligible(refereeId: string): Promise<void> {
  try {
    await withTransaction(getPgPool(), async (client) => {
      const { rows: verifiedRows } = await client.query<{ email_verified: Date | null }>(
        'select email_verified from public.users where id = $1 for share',
        [refereeId],
      )
      if (verifiedRows[0]?.email_verified == null) return

      const { rows: evidenceRows } = await client.query<{ eligible: boolean }>(
        `select exists (
           select 1 from platform.completion_evidence
           where user_id = $1 and evidence_kind = 'server_graded'
             and activity_kind = 'stem_lesson_check' and passed = true and total > 0
         ) as eligible`,
        [refereeId],
      )
      if (evidenceRows[0]?.eligible !== true) {
        const exams = await readVerifiedCefrExams(client, refereeId)
        if (!Object.values(exams).some((exam) => exam.passed)) return
      }

      // Khoá lượt mời trước khi kiểm rewarded_at: retry/song song chỉ một giao dịch được cấp.
      const { rows } = await client.query<{
        // null = người mời đã xoá tài khoản (0545: chỉ gỡ danh tính, giữ dòng của người được mời).
        referrer_id: string | null
        device_hash: string | null
        rewarded_at: Date | null
      }>(
        `select referrer_id, device_hash, rewarded_at from public.referrals
         where referee_id = $1 for update`,
        [refereeId],
      )
      const referral = rows[0]
      if (!referral || referral.rewarded_at != null) return
      const referrerId = referral.referrer_id

      // Cùng thiết bị ở các referrer khác nhau vẫn phải tuần tự. Mọi giao dịch lấy khoá
      // theo cùng thứ tự: lượt mời → thiết bị → người mời → các profile sắp theo ID.
      if (referral.device_hash) {
        await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [
          `referral:device:${referral.device_hash}`,
        ])
        const { rows: deviceRows } = await client.query<{ count: string }>(
          `select count(*) as count from public.referrals
           where device_hash = $1 and rewarded_at is not null and referee_id <> $2`,
          [referral.device_hash, refereeId],
        )
        if (Number(deviceRows[0]?.count ?? 0) > 0) {
          logSecurityEvent('REFERRAL_DEVICE_REUSED', 'system', { referrerId, refereeId })
          return // Chưa cấp quyền thì KHÔNG đánh dấu rewarded_at.
        }
      }

      // Sổ chống lạm dụng (0545): người được mời trùng email/thiết bị với một tài khoản ĐÃ XOÁ
      // từng được thưởng giới thiệu ⇒ không thưởng ai (cùng cách xử lý thiết bị dùng lại ở trên).
      // Log không chứa PII (không id, không email).
      const refereeDevices = referral.device_hash ? [referral.device_hash] : []
      if (await isBenefitBlocked(client, refereeId, 'referral_referee', refereeDevices)) {
        logSecurityEvent('REFERRAL_REPEAT_AFTER_ERASURE', 'system', { benefit: 'referral_referee' })
        return
      }

      // Giữ chính sách: vượt trần người mời (hoặc người mời đã xoá tài khoản) thì người được mời
      // vẫn nhận phần của mình.
      const recipients = [refereeId]
      let rewardedCount = 0
      if (referrerId) {
        await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [
          `referral:referrer:${referrerId}`,
        ])
        const { rows: countRows } = await client.query<{ count: string }>(
          `select count(*) as count from public.referrals
           where referrer_id = $1 and rewarded_at is not null`,
          [referrerId],
        )
        // Cộng số lượt đã được thưởng của tài khoản cũ cùng email (đã xoá trong 12 tháng) ⇒ xoá rồi
        // đăng ký lại không làm mới trần MAX_REWARDED_REFERRALS.
        rewardedCount =
          Number(countRows[0]?.count ?? 0) +
          (await erasedBenefitUnits(client, referrerId, 'referral_referrer'))
        if (rewardedCount < MAX_REWARDED_REFERRALS) recipients.push(referrerId)
      }
      const now = new Date()
      // grantPlanDays giữ khoá profile tới cuối transaction; thứ tự ổn định tránh deadlock
      // khi hai người mời chéo nhau. Cả hai lần cấp đều dùng CHÍNH PoolClient này.
      for (const userId of recipients.sort()) {
        await grantPlanDays(userId, 'vip', REFERRAL_REWARD_DAYS, now, client)
      }
      await client.query(
        'update public.referrals set rewarded_at = now() where referee_id = $1 and rewarded_at is null',
        [refereeId],
      )
      if (referrerId && rewardedCount >= MAX_REWARDED_REFERRALS) {
        logSecurityEvent('REFERRAL_CAP_REACHED', 'system', { referrerId, rewardedCount })
      }
    })
  } catch (err) {
    console.error('[referral] Lỗi khi trao thưởng:', err)
  }
}

export interface ReferralStats {
  code: string
  rewardedCount: number
  pendingCount: number
  maxRewarded: number
  rewardDays: number
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const pool = getPgPool()
  const code = await ensureReferralCode(userId)

  const { rows } = await pool.query<{ rewarded: string; pending: string }>(
    `select
       count(*) filter (where rewarded_at is not null) as rewarded,
       count(*) filter (where rewarded_at is null)     as pending
     from public.referrals where referrer_id = $1`,
    [userId],
  )

  return {
    code,
    rewardedCount: Number(rows[0]?.rewarded ?? 0),
    pendingCount: Number(rows[0]?.pending ?? 0),
    maxRewarded: MAX_REWARDED_REFERRALS,
    rewardDays: REFERRAL_REWARD_DAYS,
  }
}
