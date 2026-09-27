// api/_lib/quests.ts — Nhiệm vụ (quest) cho user, thưởng thêm hạn mức/gói khi hoàn thành.
// Hạ tầng generic (bảng quest_claims + hàm claim_quest_if_ready, migration 0021) — mở thêm
// nhiệm vụ mới chỉ cần thêm 1 hằng số + 1 hàm claim ở file này, không cần migration mới.
//
// 4 nhiệm vụ hiện có, xếp theo ĐỘ TIN CẬY xác minh (server tự tính, không phụ thuộc lời khai
// client) từ THẤP → CAO:
//   1. "Chia sẻ công khai" — chưa có bằng chứng tin cậy, tắt thưởng VIP.
//   2. "Học liên tiếp N ngày" — server tự đếm từ `free_daily_credit` (ghi bởi
//      grant_daily_bonus_rolling từ tiến độ client) chỉ để hiển thị, tắt thưởng VIP.
//   3. "Thi đạt cấp CEFR" — chỉ đọc kết quả từ kho chấm thi của server; kết quả tự khai
//      qua /api/progress không đủ thẩm quyền để cấp thưởng VIP.
//   4. "Mời bạn xác thực email" — đã có sẵn từ trước (api/_lib/referral.ts), CHỈ gộp số liệu
//      vào GET /api/quests để hiện chung 1 nơi, không đổi logic thưởng đã có.

import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import { grantPlanDays } from '@dhcb/core-billing/planGrant'
import { vnDateStr, addDays } from '@dhcb/core-db/date'
import { getReferralStats, type ReferralStats } from './referral.js'

export type ClaimQuestResult = { ok: true; rewardDays: number } | { ok: false; message: string }

// ── 1. Chia sẻ công khai ─────────────────────────────────────────────────────────────────
// Web Share API không chứng minh bài đã đăng; không cấp entitlement từ client click.
export const SHARE_QUEST_KEY = 'share_public'
export const SHARE_QUEST_REWARD_DAYS = 0
export const SHARE_QUEST_COOLDOWN_DAYS = 7

export async function claimShareQuest(userId: string): Promise<ClaimQuestResult> {
  void userId // Giữ hợp đồng API cho các client hiện hành; không đọc/ghi quyền lợi.
  return { ok: false, message: 'Chia sẻ hiện không có thưởng VIP vì chưa xác minh được bài đăng.' }
}

// ── 2. Học liên tiếp N ngày ──────────────────────────────────────────────────────────────
// Đếm streak NGAY TỪ SERVER dựa trên `free_daily_credit.bonus_earned` — bảng này được ghi
// bởi api/progress.ts MỖI KHI phát hiện tiến độ học THẬT SỰ tăng lên (learned/hard/cefrGrammar/
// cefrDialogues dài ra so với bản lưu trước), áp dụng cho MỌI gói (không riêng Free) — nên
// giữ làm tín hiệu hiển thị thói quen, KHÔNG có thẩm quyền cấp VIP.
export const STREAK_QUEST_KEY = 'streak_5'
export const STREAK_QUEST_REQUIRED_DAYS = 5
export const STREAK_QUEST_REWARD_DAYS = 0
export const STREAK_QUEST_COOLDOWN_DAYS = 7

export async function getCurrentStreak(userId: string, lookbackDays = 30): Promise<number> {
  const pool = getPgPool()
  const today = vnDateStr()
  const { rows } = await pool.query<{ day: string }>(
    `select to_char(day, 'YYYY-MM-DD') as day
     from public.free_daily_credit
     where user_id = $1 and bonus_earned > 0 and day > $2::date - $3::int and day <= $2::date`,
    [userId, today, lookbackDays],
  )
  const activeDays = new Set(rows.map((r) => r.day))
  let streak = 0
  let cursor = today
  while (activeDays.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

export async function claimStreakQuest(userId: string): Promise<ClaimQuestResult> {
  void userId // Giữ hợp đồng API cho các client hiện hành; chỉ còn hiển thị streak.
  return {
    ok: false,
    message: 'Chuỗi ngày học vẫn được ghi nhận; thưởng VIP đang chờ bằng chứng học đã xác minh.',
  }
}

// ── 3. Thi đạt cấp CEFR ──────────────────────────────────────────────────────────────────
// Danh sách cấp CỐ ĐỊNH khớp id trong src/data/cefr.ts/cefrAdvanced.ts (không import trực
// tiếp module frontend vào backend — chỉ cần đúng 6 chuỗi id, khai lại ở đây cho gọn nhẹ).
export const CEFR_EXAM_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type CefrExamLevel = (typeof CEFR_EXAM_LEVELS)[number]
export const CEFR_EXAM_QUEST_REWARD_DAYS = 3
// Nhiệm vụ "1 lần duy nhất mãi mãi mỗi cấp" — mô phỏng bằng cooldown cực lớn thay vì thêm
// bảng/cột riêng, tái dùng đúng 1 cơ chế claim_quest_if_ready cho mọi loại nhiệm vụ.
const CEFR_EXAM_QUEST_COOLDOWN_DAYS = 36_500 // ~100 năm

function cefrExamQuestKey(level: CefrExamLevel): string {
  return `cefr_exam_${level}`
}

async function readCefrExamsPassed(userId: string): Promise<Set<string>> {
  const pool = getPgPool()
  const { rows } = await pool.query<{
    cefr_exams: Record<string, { passed?: boolean }> | null
  }>(
    `select state->'exams' as cefr_exams from platform.feature_state
     where user_id = $1 and feature = 'cefr_assessment_v1'`,
    [userId],
  )
  const exams = rows[0]?.cefr_exams ?? {}
  return new Set(Object.keys(exams).filter((level) => exams[level]?.passed === true))
}

export async function claimCefrExamQuest(
  userId: string,
  level: CefrExamLevel,
): Promise<ClaimQuestResult> {
  try {
    const passed = await readCefrExamsPassed(userId)
    if (!passed.has(level)) {
      return { ok: false, message: `Bạn chưa thi đạt cấp ${level}.` }
    }
    return claimGeneric(
      userId,
      cefrExamQuestKey(level),
      CEFR_EXAM_QUEST_COOLDOWN_DAYS,
      CEFR_EXAM_QUEST_REWARD_DAYS,
    )
  } catch (err) {
    console.error('[quests] claimCefrExamQuest lỗi:', err)
    return { ok: false, message: 'Có lỗi xảy ra, thử lại sau nhé.' }
  }
}

// ── Cơ chế nhận thưởng dùng CHUNG cho mọi nhiệm vụ trên (bảng quest_claims) ──────────────
// KHÔNG throw ra ngoài — lỗi hạ tầng trả về { ok: false } với thông điệp chung, không làm vỡ
// luồng phía trước (chia sẻ/lưu tiến độ đã xong trước khi gọi hàm này).
async function claimGeneric(
  userId: string,
  questKey: string,
  cooldownDays: number,
  rewardDays: number,
): Promise<ClaimQuestResult> {
  try {
    const pool = getPgPool()
    return await withTransaction(pool, async (client): Promise<ClaimQuestResult> => {
      const { rows } = await client.query<{ claim_quest_if_ready: boolean }>(
        'select public.claim_quest_if_ready($1, $2, $3) as claim_quest_if_ready',
        [userId, questKey, cooldownDays],
      )
      if (!rows[0]?.claim_quest_if_ready) {
        return {
          ok: false,
          message:
            cooldownDays >= 3650
              ? 'Bạn đã nhận thưởng nhiệm vụ này rồi.'
              : `Bạn đã nhận thưởng rồi — quay lại sau ${cooldownDays} ngày kể từ lần trước nhé.`,
        }
      }
      await grantPlanDays(userId, 'vip', rewardDays, new Date(), client)
      return { ok: true, rewardDays }
    })
  } catch (err) {
    console.error('[quests] claimGeneric lỗi:', err)
    return { ok: false, message: 'Có lỗi xảy ra, thử lại sau nhé.' }
  }
}

// ── Trạng thái tổng hợp cho UI (GET /api/quests) ─────────────────────────────────────────
export interface QuestsStatus {
  share: { cooldownDays: number; rewardDays: number; canClaim: boolean }
  streak: {
    current: number
    required: number
    rewardDays: number
    cooldownDays: number
    canClaim: boolean
  }
  cefrExams: { level: CefrExamLevel; passed: boolean; claimed: boolean; rewardDays: number }[]
  referral: ReferralStats
}

export async function getQuestsStatus(userId: string): Promise<QuestsStatus> {
  const pool = getPgPool()

  const [lastClaimsRes, streak, passedExams, referral] = await Promise.all([
    pool.query<{ quest_key: string; last_claimed_at: string | null }>(
      'select quest_key, last_claimed_at from public.quest_claims where user_id = $1',
      [userId],
    ),
    getCurrentStreak(userId),
    readCefrExamsPassed(userId),
    getReferralStats(userId),
  ])

  const lastClaimedAt = new Map(
    lastClaimsRes.rows.map((r) => [r.quest_key, r.last_claimed_at] as const),
  )
  const now = Date.now()
  const canClaim = (key: string, cooldownDays: number) => {
    const last = lastClaimedAt.get(key)
    if (!last) return true
    return now - new Date(last).getTime() > cooldownDays * 86_400_000
  }

  return {
    share: {
      cooldownDays: SHARE_QUEST_COOLDOWN_DAYS,
      rewardDays: SHARE_QUEST_REWARD_DAYS,
      canClaim: false,
    },
    streak: {
      current: streak,
      required: STREAK_QUEST_REQUIRED_DAYS,
      rewardDays: STREAK_QUEST_REWARD_DAYS,
      cooldownDays: STREAK_QUEST_COOLDOWN_DAYS,
      canClaim: false,
    },
    cefrExams: CEFR_EXAM_LEVELS.map((level) => ({
      level,
      passed: passedExams.has(level),
      claimed: !canClaim(cefrExamQuestKey(level), CEFR_EXAM_QUEST_COOLDOWN_DAYS),
      rewardDays: CEFR_EXAM_QUEST_REWARD_DAYS,
    })),
    referral,
  }
}
