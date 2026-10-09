// packages/core-billing/erasedBenefitLedger.ts — Sổ chống lạm dụng quyền lợi một-lần sau khi xoá
// tài khoản (đặc tả docs/specs/2026-10-09-so-chong-lam-dung-sau-xoa-tai-khoan.md, changelog 0545).
//
// Vấn đề: xoá tài khoản (0533) xoá luôn dấu "đã nhận dùng thử" và dòng giới thiệu ⇒ ai cũng có thể
// "dùng thử → xoá → đăng ký lại → dùng thử lại". Sổ này ghi lại, KHÔNG định danh, rằng một email /
// thiết bị đã từng hưởng quyền lợi X, để lần đăng ký sau không hưởng lại trong 12 tháng.
//
// BẤT BIẾN:
//   - Chỉ lưu HMAC-SHA256(khoá bí mật, giá trị đã chuẩn hoá). Không user_id, không plaintext.
//     KHÔNG dùng SHA-256 trần: email entropy thấp, ai có bản dump CSDL dò từ điển là ra.
//   - Thiếu/hỏng khoá ⇒ sổ TẮT: không ghi (tuyệt đối không ghi mã băm yếu thay thế), tra luôn "không
//     khớp". Xoá tài khoản KHÔNG bao giờ bị chặn vì sổ tắt — quyền được xoá quan trọng hơn một
//     ưu đãi 14 ngày; server.ts báo lỗi cấu hình ngay lúc khởi động để vận hành sửa.
//   - Mọi câu tra tự lọc `created_at` trong hạn giữ ⇒ job dọn có chạy trễ cũng không làm bản ghi
//     quá hạn còn hiệu lực.

import { createHmac } from 'node:crypto'
import type { Pool, PoolClient } from 'pg'

/** Biến môi trường chứa khoá HMAC (≥ 32 byte, base64). */
export const ERASED_BENEFIT_LEDGER_KEY_ENV = 'ERASED_BENEFIT_LEDGER_KEY'

/** Hạn giữ bản ghi (tháng). Đổi ở ĐÚNG một chỗ này. */
export const ERASED_BENEFIT_RETENTION_MONTHS = 12

const MIN_KEY_BYTES = 32
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/
/** Tiền tố miền: cùng một giá trị băm cho mục đích khác sẽ ra mã khác, không nối chéo được. */
const HASH_DOMAIN = 'dhcb:erased-benefit:v1:'
/** Đúng định dạng `referrals.device_hash` (SHA-256 hex do client gửi, xem api/platform/referral.ts). */
const DEVICE_HASH_RE = /^[a-f0-9]{64}$/
/** Miền Gmail: bỏ dấu chấm ở phần tên + gộp googlemail.com (Google coi là cùng hộp thư). */
const GMAIL_DOMAINS = new Set(['gmail.com', 'googlemail.com'])

export const ERASED_BENEFITS = ['signup_trial', 'referral_referee', 'referral_referrer'] as const
export type ErasedBenefit = (typeof ERASED_BENEFITS)[number]
export type LedgerSubjectKind = 'email' | 'device'

type Queryable = Pool | PoolClient

export type LedgerKeyState =
  | { readonly status: 'ok'; readonly key: Buffer }
  | { readonly status: 'missing' }
  | { readonly status: 'invalid' }

/** Đọc + kiểm khoá. Không bao giờ ném — nơi gọi quyết định theo `status`. */
export function readLedgerKey(env: NodeJS.ProcessEnv = process.env): LedgerKeyState {
  const raw = env[ERASED_BENEFIT_LEDGER_KEY_ENV]?.trim()
  if (!raw) return { status: 'missing' }
  if (!BASE64_RE.test(raw)) return { status: 'invalid' }
  const key = Buffer.from(raw, 'base64')
  if (key.length < MIN_KEY_BYTES) return { status: 'invalid' }
  return { status: 'ok', key }
}

/**
 * Câu báo lỗi cấu hình cho log khởi động — `null` nếu ổn. Thiếu khoá ngoài production là bình
 * thường (dev/test), nên chỉ báo ở production; khoá sai định dạng thì báo ở mọi môi trường.
 */
export function ledgerConfigProblem(env: NodeJS.ProcessEnv = process.env): string | null {
  const state = readLedgerKey(env)
  if (state.status === 'invalid')
    return `${ERASED_BENEFIT_LEDGER_KEY_ENV} sai định dạng (cần ≥ ${MIN_KEY_BYTES} byte base64) — sổ chống lạm dụng ĐANG TẮT.`
  if (state.status === 'missing' && env.NODE_ENV === 'production')
    return `${ERASED_BENEFIT_LEDGER_KEY_ENV} chưa cấu hình — sổ chống lạm dụng ĐANG TẮT: xoá tài khoản rồi đăng ký lại sẽ nhận lại dùng thử/thưởng giới thiệu. Xem .env.example.`
  return null
}

/**
 * Chuẩn hoá email trước khi băm, để biến thể của CÙNG một hộp thư ra cùng mã:
 *   - bỏ khoảng trắng, chữ thường, NFC;
 *   - bỏ "+nhãn" ở phần tên (plus addressing — Gmail, Outlook, iCloud, Fastmail, Proton… đều giao
 *     `ten+abc@` vào `ten@`). Áp cho MỌI miền: nhà cung cấp coi "+" là ký tự thường rất hiếm, và
 *     cái giá của dương tính giả chỉ là mất một ưu đãi dùng thử — không chặn đăng ký;
 *   - riêng Gmail: bỏ mọi dấu chấm ở phần tên và gộp `googlemail.com` về `gmail.com`. KHÔNG bỏ dấu
 *     chấm ở miền khác (ở đó `a.b@` và `ab@` là hai hộp thư khác nhau).
 */
export function normalizeEmailForLedger(email: string): string {
  const lowered = email.normalize('NFC').trim().toLowerCase()
  const at = lowered.lastIndexOf('@')
  if (at <= 0 || at === lowered.length - 1) return lowered
  let local = lowered.slice(0, at)
  let domain = lowered.slice(at + 1)
  const plus = local.indexOf('+')
  if (plus > 0) local = local.slice(0, plus)
  if (GMAIL_DOMAINS.has(domain)) {
    domain = 'gmail.com'
    const dotless = local.replace(/\./g, '')
    if (dotless) local = dotless
  }
  return `${local}@${domain}`
}

/** `null` nếu không phải mã thiết bị hợp lệ (bỏ qua, không băm rác). */
function normalizeDeviceHash(value: string): string | null {
  const v = value.trim().toLowerCase()
  return DEVICE_HASH_RE.test(v) ? v : null
}

/** HMAC-SHA256 hex của một giá trị ĐÃ chuẩn hoá. */
export function ledgerSubjectHash(
  key: Buffer,
  kind: LedgerSubjectKind,
  normalized: string,
): string {
  return createHmac('sha256', key).update(`${HASH_DOMAIN}${kind}:${normalized}`).digest('hex')
}

/** Băm danh sách email + mã thiết bị (đã chuẩn hoá, bỏ trùng, bỏ giá trị rỗng/không hợp lệ). */
export function hashSubjects(
  key: Buffer,
  emails: readonly string[],
  deviceHashes: readonly string[] = [],
): { kind: LedgerSubjectKind; hash: string }[] {
  const out = new Map<string, LedgerSubjectKind>()
  for (const e of emails) {
    if (!e || !e.trim()) continue
    out.set(ledgerSubjectHash(key, 'email', normalizeEmailForLedger(e)), 'email')
  }
  for (const d of deviceHashes) {
    const n = normalizeDeviceHash(d)
    if (n) out.set(ledgerSubjectHash(key, 'device', n), 'device')
  }
  return [...out].map(([hash, kind]) => ({ kind, hash }))
}

// ─── Ghi (gọi trong transaction xoá tài khoản) ────────────────────────────────

/** Sự thật về tài khoản sắp xoá — do nơi gọi đọc trong CÙNG transaction, trước khi xoá. */
export interface ErasedAccountFacts {
  /** Email đăng nhập + email của các liên kết OAuth. */
  readonly emails: readonly string[]
  /** Mã thiết bị của lượt được mời ĐÃ được thưởng (thiết bị của chính người này). */
  readonly refereeDeviceHashes: readonly string[]
  readonly signupTrialTaken: boolean
  readonly refereeRewarded: boolean
  /** Số lượt mời người khác đã được thưởng (giữ trần MAX_REWARDED_REFERRALS qua lần xoá). */
  readonly referrerRewardedCount: number
  /**
   * Email (đăng nhập + OAuth) của NGƯỜI MỜI đã được thưởng nhờ chính tài khoản sắp xoá. Dòng
   * `referrals` theo `referee_id` bị xoá cùng tài khoản ⇒ trần thưởng của người mời sẽ tụt 1; ghi
   * `referral_referrer` units=1 cho email người mời để `erasedBenefitUnits` bù lại (rà soát 0545).
   */
  readonly rewardedReferrerEmails: readonly string[]
}

export interface LedgerEntry {
  readonly subjectKind: LedgerSubjectKind
  readonly subjectHash: string
  readonly benefit: ErasedBenefit
  readonly units: number
}

/**
 * Dựng các dòng cần ghi — hàm THUẦN. Chỉ ghi thứ CÓ đường tra: dùng thử chỉ tra theo email (lúc
 * cấp chưa có mã thiết bị) nên không ghi thiết bị cho dùng thử — tối thiểu hoá dữ liệu.
 */
export function buildLedgerEntries(key: Buffer, facts: ErasedAccountFacts): LedgerEntry[] {
  const entries: LedgerEntry[] = []
  const emails = hashSubjects(key, facts.emails)
  const push = (
    subjects: { kind: LedgerSubjectKind; hash: string }[],
    benefit: ErasedBenefit,
    units: number,
  ) => {
    for (const s of subjects)
      entries.push({ subjectKind: s.kind, subjectHash: s.hash, benefit, units })
  }
  if (facts.signupTrialTaken) push(emails, 'signup_trial', 1)
  if (facts.refereeRewarded)
    push(hashSubjects(key, facts.emails, facts.refereeDeviceHashes), 'referral_referee', 1)
  if (facts.referrerRewardedCount > 0)
    push(emails, 'referral_referrer', Math.floor(facts.referrerRewardedCount))
  // Một tài khoản chỉ được mời đúng một lần (unique referee_id) ⇒ đúng 1 đơn vị.
  push(hashSubjects(key, facts.rewardedReferrerEmails), 'referral_referrer', 1)
  return entries
}

export type RecordResult =
  | { readonly status: 'recorded'; readonly entries: number }
  | {
      readonly status: 'disabled'
    }

/**
 * Ghi sổ cho một tài khoản sắp xoá. Chạy bằng `client` của transaction xoá ⇒ xoá rollback thì sổ
 * cũng rollback; câu ghi lỗi thì NÉM (xoá rollback theo) — không nuốt lỗi.
 */
export async function recordErasedBenefits(
  client: PoolClient,
  facts: ErasedAccountFacts,
  env: NodeJS.ProcessEnv = process.env,
): Promise<RecordResult> {
  const state = readLedgerKey(env)
  if (state.status !== 'ok') {
    console.error(
      `[erased-benefit-ledger] Sổ đang tắt (${state.status}) — không ghi cho lần xoá này.`,
    )
    return { status: 'disabled' }
  }
  const entries = buildLedgerEntries(state.key, facts)
  if (entries.length === 0) return { status: 'recorded', entries: 0 }
  await client.query(
    `insert into platform.erased_benefit_ledger (subject_kind, subject_hash, benefit, units)
     select k, h, b, u from unnest($1::text[], $2::text[], $3::text[], $4::int[]) as t(k, h, b, u)`,
    [
      entries.map((e) => e.subjectKind),
      entries.map((e) => e.subjectHash),
      entries.map((e) => e.benefit),
      entries.map((e) => e.units),
    ],
  )
  return { status: 'recorded', entries: entries.length }
}

// ─── Tra (lúc cấp quyền lợi) ──────────────────────────────────────────────────

let warnedDisabled = false

function keyForLookup(env: NodeJS.ProcessEnv): Buffer | null {
  const state = readLedgerKey(env)
  if (state.status === 'ok') return state.key
  if (!warnedDisabled) {
    warnedDisabled = true
    console.warn(`[erased-benefit-ledger] Sổ đang tắt (${state.status}) — tra luôn "không khớp".`)
  }
  return null
}

/** Mọi email gắn với tài khoản: email đăng nhập + email các liên kết OAuth. */
async function accountEmails(db: Queryable, userId: string): Promise<string[]> {
  const { rows } = await db.query<{ email: string }>(
    `select email from public.users where id = $1
     union
     select email from public.identities where user_id = $1 and email is not null`,
    [userId],
  )
  return rows.map((r) => r.email)
}

/**
 * Tài khoản `userId` (qua email của nó, và các mã thiết bị đi kèm) có trùng một tài khoản ĐÃ XOÁ
 * từng hưởng `benefit` trong hạn giữ không. Sổ tắt ⇒ `false` (không chặn quyền lợi).
 */
export async function isBenefitBlocked(
  db: Queryable,
  userId: string,
  benefit: ErasedBenefit,
  deviceHashes: readonly string[] = [],
  env: NodeJS.ProcessEnv = process.env,
): Promise<boolean> {
  const key = keyForLookup(env)
  if (!key) return false
  const subjects = hashSubjects(key, await accountEmails(db, userId), deviceHashes)
  if (subjects.length === 0) return false
  const { rows } = await db.query<{ blocked: boolean }>(
    `select exists (
       select 1 from platform.erased_benefit_ledger
        where benefit = $1 and subject_hash = any($2::text[])
          and created_at > now() - make_interval(months => $3::int)
     ) as blocked`,
    [benefit, subjects.map((s) => s.hash), ERASED_BENEFIT_RETENTION_MONTHS],
  )
  return rows[0]?.blocked === true
}

/**
 * Số đơn vị `benefit` đã ghi sổ cho các email của `userId` (trong hạn giữ): lượt thưởng của tài
 * khoản cũ cùng email đã xoá, CỘNG lượt thưởng mà người được mời của chính `userId` mang theo khi
 * họ xoá tài khoản. Cùng một mã băm thì cộng dồn (mỗi lần xoá là một sự kiện riêng); nhiều email của
 * cùng một người mang cùng số ⇒ lấy MAX giữa các mã băm, không cộng chéo (tránh đếm đôi).
 */
export async function erasedBenefitUnits(
  db: Queryable,
  userId: string,
  benefit: ErasedBenefit,
  env: NodeJS.ProcessEnv = process.env,
): Promise<number> {
  const key = keyForLookup(env)
  if (!key) return 0
  const subjects = hashSubjects(key, await accountEmails(db, userId))
  if (subjects.length === 0) return 0
  const { rows } = await db.query<{ units: number | string | null }>(
    `select coalesce(max(total), 0)::int as units from (
       select sum(units) as total from platform.erased_benefit_ledger
        where benefit = $1 and subject_hash = any($2::text[])
          and created_at > now() - make_interval(months => $3::int)
        group by subject_hash
     ) t`,
    [benefit, subjects.map((s) => s.hash), ERASED_BENEFIT_RETENTION_MONTHS],
  )
  return Number(rows[0]?.units ?? 0)
}

// ─── Dọn theo hạn giữ (job hằng ngày ở server.ts) ─────────────────────────────

export async function purgeExpiredErasedBenefits(
  db: Queryable,
  retentionMonths: number = ERASED_BENEFIT_RETENTION_MONTHS,
): Promise<{ deleted: number }> {
  const { rowCount } = await db.query(
    `delete from platform.erased_benefit_ledger
      where created_at <= now() - make_interval(months => $1::int)`,
    [retentionMonths],
  )
  return { deleted: rowCount ?? 0 }
}

/** Chỉ cho test: bật lại cảnh báo "sổ tắt" một-lần. */
export function resetLedgerWarningForTest(): void {
  warnedDisabled = false
}
