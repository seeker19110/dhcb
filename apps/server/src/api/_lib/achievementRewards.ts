import { readVerifiedCefrExams } from './cefrAssessment.js'
// api/_lib/achievementRewards.ts — Phần thưởng (ngày VIP) cho HUY HIỆU & MỐC, migration
// 0026. Admin cấu hình từng huy hiệu qua api/admin-achievement-rewards.ts (bảng
// achievement_rewards); người dùng nhận thưởng qua api/achievements.ts (bảng
// achievement_claims, mỗi huy hiệu CHỈ nhận 1 LẦN/tài khoản — khác nhiệm vụ lặp lại theo
// cooldown ở quests.ts).
//
// Lịch sử học đồng bộ từ client chỉ đủ để HIỂN THỊ huy hiệu; dữ liệu đã nằm trong DB
// không đồng nghĩa đã được server xác thực. Chỉ kết quả CEFR do server chấm được cấp VIP.

import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import { grantPlanDays } from '@dhcb/core-billing/planGrant'
import { getCurrentStreak } from './quests.js'
import type { Plan } from '@dhcb/core-billing/plan'

export const ACHIEVEMENT_IDS = [
  'streak_7',
  'streak_30',
  'streak_100',
  'streak_365',
  'vocab_100',
  'vocab_500',
  'vocab_1000',
  'cefr_a1',
  'cefr_a2',
  'cefr_b1',
  'cefr_b2',
  'cefr_c1',
  'cefr_c2',
  'speak_10',
  'write_10',
  'challenge_10',
  'challenge_30',
  'challenge_100',
  'challenge_perfect_week',
] as const
export type AchievementId = (typeof ACHIEVEMENT_IDS)[number]

export interface AchievementRewardConfig {
  enabled: boolean
  rewardPlan: Exclude<Plan, 'free'>
  rewardDays: number
}

export interface AchievementStatusItem {
  id: AchievementId
  earned: boolean
  claimed: boolean
  reward: AchievementRewardConfig
}

export type ClaimAchievementResult =
  | { ok: true; rewardDays: number; rewardPlan: Exclude<Plan, 'free'> }
  | { ok: false; message: string }

// ── Cache cấu hình thưởng trong bộ nhớ tiến trình (TTL ngắn) — cùng mô hình
// api/_lib/planMarketing.ts, tránh tra DB ở mọi request GET/claim. ──────────────────────────
let cache: { data: Map<AchievementId, AchievementRewardConfig>; expiresAt: number } | null = null
const CACHE_TTL_MS = 30_000

export function invalidateAchievementRewardsCache(): void {
  cache = null
}

// Mọi phần thưởng "N ngày gói" nay chỉ còn VIP (GĐ1 2026-09-12 xoá Pro/Plus) — giá trị cũ
// 'pro'/'plus' trong bảng achievement_rewards được đọc thành 'vip' để người dùng KHÔNG mất
// quyền lợi đã cấu hình, và dữ liệu lịch sử trong DB không phải xoá.
function normalizeRewardPlan(): 'vip' {
  return 'vip'
}

async function loadRewardConfig(): Promise<Map<AchievementId, AchievementRewardConfig>> {
  if (cache && cache.expiresAt > Date.now()) return cache.data

  const pool = getPgPool()
  const { rows } = await pool.query<{
    achievement_id: string
    enabled: boolean
    // `string` chứ không phải kiểu gói: dòng cũ trong DB có thể còn giá trị 'pro'/'plus' đã bị
    // xoá ở GĐ1 (2026-09-12) — chuẩn hoá về 'vip' ngay khi đọc thay vì tin kiểu dữ liệu.
    reward_plan: string
    reward_days: number
  }>('select achievement_id, enabled, reward_plan, reward_days from public.achievement_rewards')

  const map = new Map<AchievementId, AchievementRewardConfig>()
  for (const id of ACHIEVEMENT_IDS) {
    // Mặc định an toàn nếu admin chưa từng tạo hàng cho huy hiệu này: tắt, 0 ngày — không
    // tự ý phát thưởng khi thiếu cấu hình.
    map.set(id, { enabled: false, rewardPlan: 'vip', rewardDays: 0 })
  }
  for (const r of rows) {
    if ((ACHIEVEMENT_IDS as readonly string[]).includes(r.achievement_id)) {
      map.set(r.achievement_id as AchievementId, {
        enabled: r.enabled,
        rewardPlan: normalizeRewardPlan(),
        rewardDays: r.reward_days,
      })
    }
  }
  cache = { data: map, expiresAt: Date.now() + CACHE_TTL_MS }
  return map
}

// ── Tính điều kiện HIỂN THỊ huy hiệu từ dữ liệu đã lưu ──────────────────────────────────────
interface ServerStats {
  streak: number
  vocab: number
  cefrPassed: Set<string>
  speakingSessions: number
  gradedEssays: number
  challengeSubmitted: number
  challengePerfectWeek: boolean
}

async function computeServerStats(userId: string): Promise<ServerStats> {
  const pool = getPgPool()

  const [streak, progressRes, speakingRes, writingRes, challengeCountRes, perfectWeekRes] =
    await Promise.all([
      getCurrentStreak(userId),
      pool.query<{ learned: string[] | null; cefr_exams: Record<string, { passed?: boolean }> }>(
        'select learned, cefr_exams from public.learning_progress where user_id = $1',
        [userId],
      ),
      pool.query<{ count: string }>(
        'select count(*) from public.speaking_sessions where user_id = $1',
        [userId],
      ),
      pool.query<{ count: string }>(
        'select count(*) from public.writing_submissions where user_id = $1',
        [userId],
      ),
      pool.query<{ count: string }>(
        'select count(*) from public.challenge_entries where user_id = $1',
        [userId],
      ),
      // 1 tuần (Thứ 2 → CN, date_trunc('week', ...) của Postgres mặc định bắt đầu Thứ 2 — khớp
      // lib/date.ts weekStartOf()) có đủ 7 ngày nộp — dùng cho huy hiệu "Tuần trọn vẹn".
      pool.query<{ has_perfect: boolean }>(
        `select exists(
           select 1 from public.challenge_entries
           where user_id = $1
           group by date_trunc('week', day)
           having count(*) >= 7
         ) as has_perfect`,
        [userId],
      ),
    ])

  const learned = progressRes.rows[0]?.learned ?? []
  const cefrExams = await readVerifiedCefrExams(pool, userId)

  return {
    streak,
    vocab: Array.isArray(learned) ? learned.length : 0,
    cefrPassed: new Set(Object.keys(cefrExams).filter((lv) => cefrExams[lv]?.passed === true)),
    speakingSessions: Number(speakingRes.rows[0]?.count ?? 0),
    gradedEssays: Number(writingRes.rows[0]?.count ?? 0),
    challengeSubmitted: Number(challengeCountRes.rows[0]?.count ?? 0),
    challengePerfectWeek: perfectWeekRes.rows[0]?.has_perfect === true,
  }
}

// Điều kiện đạt của từng huy hiệu — PHẢI khớp isEarned() ở apps/dhcb/src/lib/achievements.ts
// Đây là điều kiện hiển thị; quyền nhận thưởng còn phải qua cổng bằng chứng tin cậy.
function isEarned(id: AchievementId, s: ServerStats): boolean {
  switch (id) {
    case 'streak_7':
      return s.streak >= 7
    case 'streak_30':
      return s.streak >= 30
    case 'streak_100':
      return s.streak >= 100
    case 'streak_365':
      return s.streak >= 365
    case 'vocab_100':
      return s.vocab >= 100
    case 'vocab_500':
      return s.vocab >= 500
    case 'vocab_1000':
      return s.vocab >= 1000
    case 'cefr_a1':
      return s.cefrPassed.has('A1')
    case 'cefr_a2':
      return s.cefrPassed.has('A2')
    case 'cefr_b1':
      return s.cefrPassed.has('B1')
    case 'cefr_b2':
      return s.cefrPassed.has('B2')
    case 'cefr_c1':
      return s.cefrPassed.has('C1')
    case 'cefr_c2':
      return s.cefrPassed.has('C2')
    case 'speak_10':
      return s.speakingSessions >= 10
    case 'write_10':
      return s.gradedEssays >= 10
    case 'challenge_10':
      return s.challengeSubmitted >= 10
    case 'challenge_30':
      return s.challengeSubmitted >= 30
    case 'challenge_100':
      return s.challengeSubmitted >= 100
    case 'challenge_perfect_week':
      return s.challengePerfectWeek
  }
}

/** Những huy hiệu có bằng chứng do server chấm, không do client tự báo cáo. */
export function supportsPaidReward(id: AchievementId): boolean {
  return id.startsWith('cefr_')
}

function effectiveReward(
  id: AchievementId,
  config?: AchievementRewardConfig,
): AchievementRewardConfig {
  return supportsPaidReward(id) && config
    ? config
    : { enabled: false, rewardPlan: 'vip', rewardDays: 0 }
}

// ── Trạng thái tổng hợp cho UI (GET /api/achievements) ──────────────────────────────────────
export async function getAchievementsStatus(userId: string): Promise<AchievementStatusItem[]> {
  const [rewardConfig, stats, claimsRes] = await Promise.all([
    loadRewardConfig(),
    computeServerStats(userId),
    getPgPool().query<{ achievement_id: string }>(
      'select achievement_id from public.achievement_claims where user_id = $1',
      [userId],
    ),
  ])
  const claimed = new Set(claimsRes.rows.map((r) => r.achievement_id))

  return ACHIEVEMENT_IDS.map((id) => ({
    id,
    earned: isEarned(id, stats),
    claimed: claimed.has(id),
    reward: effectiveReward(id, rewardConfig.get(id)),
  }))
}

// ── Nhận thưởng 1 huy hiệu — KHÔNG throw ra ngoài, lỗi hạ tầng trả { ok: false } chung. ─────
export async function claimAchievementReward(
  userId: string,
  achievementId: string,
): Promise<ClaimAchievementResult> {
  if (!(ACHIEVEMENT_IDS as readonly string[]).includes(achievementId)) {
    return { ok: false, message: 'Huy hiệu không hợp lệ.' }
  }
  const id = achievementId as AchievementId
  if (!supportsPaidReward(id)) {
    return {
      ok: false,
      message:
        'Huy hiệu này được ghi nhận nhưng chưa hỗ trợ thưởng VIP từ bằng chứng học đã xác minh.',
    }
  }

  try {
    const rewardConfig = (await loadRewardConfig()).get(id)
    if (!rewardConfig || !rewardConfig.enabled || rewardConfig.rewardDays <= 0) {
      return { ok: false, message: 'Huy hiệu này hiện chưa có phần thưởng.' }
    }

    const stats = await computeServerStats(userId)
    if (!isEarned(id, stats)) {
      return { ok: false, message: 'Bạn chưa đạt được huy hiệu này.' }
    }

    const pool = getPgPool()
    return await withTransaction(pool, async (client): Promise<ClaimAchievementResult> => {
      const { rowCount } = await client.query(
        `insert into public.achievement_claims (user_id, achievement_id)
         values ($1, $2)
         on conflict (user_id, achievement_id) do nothing`,
        [userId, id],
      )
      if (rowCount === 0) {
        return { ok: false, message: 'Bạn đã nhận thưởng huy hiệu này rồi.' }
      }

      // Claim chỉ có hiệu lực khi quyền lợi đã được cấp trong cùng transaction.
      await grantPlanDays(
        userId,
        rewardConfig.rewardPlan,
        rewardConfig.rewardDays,
        new Date(),
        client,
      )
      return { ok: true, rewardDays: rewardConfig.rewardDays, rewardPlan: rewardConfig.rewardPlan }
    })
  } catch (err) {
    console.error('[achievementRewards] claimAchievementReward lỗi:', err)
    return { ok: false, message: 'Có lỗi xảy ra, thử lại sau nhé.' }
  }
}

// ── Admin: đọc/sửa cấu hình thưởng từng huy hiệu ────────────────────────────────────────────
export async function getAllRewardConfigs(): Promise<
  { achievementId: AchievementId; config: AchievementRewardConfig }[]
> {
  const map = await loadRewardConfig()
  return ACHIEVEMENT_IDS.map((achievementId) => ({
    achievementId,
    config: effectiveReward(achievementId, map.get(achievementId)),
  }))
}

export async function upsertRewardConfig(
  achievementId: string,
  patch: Partial<AchievementRewardConfig>,
): Promise<void> {
  if (!(ACHIEVEMENT_IDS as readonly string[]).includes(achievementId)) {
    throw new Error('Huy hiệu không hợp lệ.')
  }
  if (
    !supportsPaidReward(achievementId as AchievementId) &&
    (patch.enabled === true || (patch.rewardDays ?? 0) > 0)
  ) {
    throw new Error('Chỉ huy hiệu CEFR đã xác minh được hỗ trợ thưởng VIP.')
  }
  const safeDays =
    patch.rewardDays !== undefined ? Math.min(7, Math.max(0, patch.rewardDays)) : undefined

  const pool = getPgPool()
  await pool.query(
    `insert into public.achievement_rewards (achievement_id, enabled, reward_plan, reward_days, updated_at)
     values ($1, coalesce($2, true), coalesce($3, 'vip'), coalesce($4, 0), now())
     on conflict (achievement_id) do update set
       enabled = coalesce($2, achievement_rewards.enabled),
       reward_plan = coalesce($3, achievement_rewards.reward_plan),
       reward_days = coalesce($4, achievement_rewards.reward_days),
       updated_at = now()`,
    [achievementId, patch.enabled, patch.rewardPlan, safeDays],
  )
  invalidateAchievementRewardsCache()
}
