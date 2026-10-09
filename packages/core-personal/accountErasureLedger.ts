// accountErasureLedger.ts — Bước "ghi sổ chống lạm dụng" của luồng xoá tài khoản (changelog 0545,
// đặc tả docs/specs/2026-10-09-so-chong-lam-dung-sau-xoa-tai-khoan.md).
//
// Tách khỏi accountErasureService.ts để service chỉ thêm MỘT lời gọi. Chạy trong CÙNG transaction,
// SAU khi đã khoá dòng `public.users` và TRƯỚC mọi câu xoá (phải đọc dấu dùng thử/giới thiệu khi
// chúng còn). Sổ tắt (thiếu khoá) ⇒ không đọc, không ghi; xoá vẫn tiếp tục.

import type { PoolClient } from 'pg'
import {
  readLedgerKey,
  recordErasedBenefits,
  type ErasedAccountFacts,
  type RecordResult,
} from '@dhcb/core-billing/erasedBenefitLedger'

/** Một câu đọc mọi sự thật cần ghi sổ (hằng — không ghép chuỗi). */
const ERASED_FACTS_SQL = `select
   array(
     select email from public.users where id = $1
     union
     select email from public.identities where user_id = $1 and email is not null
   ) as emails,
   exists (
     select 1 from public.profiles
      where id = $1 and (signup_trial_granted_at is not null or trial_granted_at is not null)
   ) as signup_trial_taken,
   array(
     select device_hash from public.referrals
      where referee_id = $1 and rewarded_at is not null and device_hash is not null
   ) as referee_device_hashes,
   exists (
     select 1 from public.referrals where referee_id = $1 and rewarded_at is not null
   ) as referee_rewarded,
   (select count(*)::int from public.referrals
     where referrer_id = $1 and rewarded_at is not null) as referrer_rewarded_count`

interface FactsRow {
  emails: string[] | null
  signup_trial_taken: boolean
  referee_device_hashes: string[] | null
  referee_rewarded: boolean
  referrer_rewarded_count: number | string | null
}

export async function readErasedAccountFacts(
  client: PoolClient,
  userId: string,
): Promise<ErasedAccountFacts> {
  const { rows } = await client.query<FactsRow>(ERASED_FACTS_SQL, [userId])
  const row = rows[0]
  return {
    emails: row?.emails ?? [],
    refereeDeviceHashes: row?.referee_device_hashes ?? [],
    signupTrialTaken: row?.signup_trial_taken === true,
    refereeRewarded: row?.referee_rewarded === true,
    referrerRewardedCount: Number(row?.referrer_rewarded_count ?? 0),
  }
}

/** Đọc sự thật + ghi sổ. Sổ tắt ⇒ bỏ qua cả câu đọc. Lỗi CSDL ⇒ NÉM (transaction xoá rollback). */
export async function recordErasedBenefitsForAccount(
  client: PoolClient,
  userId: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<RecordResult> {
  if (readLedgerKey(env).status !== 'ok') return recordErasedBenefits(client, emptyFacts, env)
  return recordErasedBenefits(client, await readErasedAccountFacts(client, userId), env)
}

const emptyFacts: ErasedAccountFacts = {
  emails: [],
  refereeDeviceHashes: [],
  signupTrialTaken: false,
  refereeRewarded: false,
  referrerRewardedCount: 0,
}
