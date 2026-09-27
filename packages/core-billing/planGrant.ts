// packages/core-billing/planGrant.ts — Cấp/gia hạn gói VIP cho 1 user, DÙNG CHUNG cho mọi nguồn cấp:
// thưởng mời bạn (api/referral.ts), cấp tay của admin (api/admin-grant-plan.ts), và sau này là
// thanh toán thật. Tách riêng vì đây là chỗ đụng "tiền thật" — mỗi nơi tự viết lại logic cộng
// ngày là cách chắc chắn nhất để sinh lỗi lệch nhau (cấp trùng, hạ nhầm gói, mất hạn còn lại).
//
// NGUYÊN TẮC BẤT BIẾN của hàm này:
//   1. KHÔNG BAO GIỜ hạ cấp người dùng (giữ gói cao hơn trong 2 gói được so sánh).
//   2. KHÔNG BAO GIỜ làm mất thời hạn đang còn. Cộng dồn từ mốc hết hạn hiện tại nếu còn hiệu
//      lực, chỉ tính từ "bây giờ" khi gói cũ đã hết hạn.
//   3. Gói vĩnh viễn (plan vip + plan_expires_at = null) là cao nhất — không đụng vào.

import type { Pool, PoolClient } from 'pg'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { withTransaction } from '@dhcb/core-db/transaction'
import { resolvePlan, type Plan } from './plan.js'
import { getAppSettings } from '@dhcb/core-db/settings'

// Thứ hạng gói để so sánh cao/thấp — free < vip (GĐ1 2026-09-12 xoá 2 bậc trung gian
// plus/pro; giữ bảng hạng vì luật "không bao giờ hạ cấp" vẫn cần so sánh).
const PLAN_RANK: Record<Plan, number> = { free: 0, vip: 1 }

const MS_DAY = 86_400_000

export interface PlanGrantResult {
  plan: Plan
  planExpiresAt: Date | null
}

/**
 * Tính gói + hạn mới sau khi cộng `days` ngày gói `grantPlan` vào trạng thái hiện tại.
 * Hàm THUẦN (không đụng DB) để test được mọi ca biên — phần ghi DB nằm ở `grantPlanDays()`.
 *
 * @param currentPlanRaw  giá trị cột profiles.plan hiện tại (chuỗi tự do, có thể null)
 * @param currentExpiresAt giá trị cột profiles.plan_expires_at hiện tại
 * @param grantPlan   gói muốn cấp ('vip')
 * @param days        số ngày cấp thêm (> 0)
 * @param now         mốc thời gian tham chiếu (cho test)
 * @param promoUntil  hạn khuyến mãi hiện hành (null = không có). Quyết định 2026-07-26: cấp
 *                    gói trả phí TRONG lúc khuyến mãi thì hạn dùng KHÔNG bị đếm lùi ngay —
 *                    chỉ thực sự bắt đầu tính từ lúc khuyến mãi kết thúc (không thiệt thời
 *                    gian vì khuyến mãi Free/Pro lúc đó vốn đã gần như đủ dùng).
 */
export function computePlanGrant(
  currentPlanRaw: string | null | undefined,
  currentExpiresAt: Date | string | null | undefined,
  grantPlan: Exclude<Plan, 'free'>,
  days: number,
  now: Date = new Date(),
  promoUntil: Date | string | null = null,
): PlanGrantResult {
  // Gói ĐANG CÒN HIỆU LỰC (VIP hết hạn đã tự coi như free — xem plan.ts).
  const activePlan = resolvePlan(currentPlanRaw, currentExpiresAt, now)

  // Ca 3: đang có gói trả phí VĨNH VIỄN (không hạn) → đã là cao nhất về thời hạn, không đụng.
  // Chỉ nâng gói nếu gói cấp mới cao hơn.
  if (activePlan !== 'free' && currentExpiresAt == null) {
    const keepPlan = PLAN_RANK[grantPlan] > PLAN_RANK[activePlan] ? grantPlan : activePlan
    return { plan: keepPlan, planExpiresAt: null }
  }

  // Số ngày âm/0 không hợp lệ — không làm gì (phòng lỗi gọi sai, không tự ý trừ hạn của user).
  const safeDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 0

  // Mốc bắt đầu cộng: nối tiếp từ hạn cũ nếu còn hiệu lực (không mất phần còn lại), từ bây giờ
  // nếu đã hết hạn/chưa có gì — NHƯNG không sớm hơn lúc khuyến mãi kết thúc (nếu đang trong lúc
  // khuyến mãi): hạn mới luôn tính từ promoUntil trở đi, không đếm lùi trong lúc khuyến mãi.
  const currentExpiryMs =
    activePlan !== 'free' && currentExpiresAt != null ? new Date(currentExpiresAt).getTime() : 0
  const promoUntilMs =
    promoUntil && now.getTime() < new Date(promoUntil).getTime()
      ? new Date(promoUntil).getTime()
      : 0
  const base = Math.max(now.getTime(), currentExpiryMs, promoUntilMs)
  const newExpiry = new Date(base + safeDays * MS_DAY)

  // Ca 1: không bao giờ hạ cấp — giữ gói cao hơn trong 2 gói.
  const finalPlan = PLAN_RANK[grantPlan] >= PLAN_RANK[activePlan] ? grantPlan : activePlan

  return { plan: finalPlan, planExpiresAt: newExpiry }
}

/**
 * Ghi kết quả cấp gói xuống DB (đọc trạng thái hiện tại → tính → ghi).
 * Trả về gói/hạn SAU KHI cấp.
 *
 * Khi nhận pool, hàm tự mở transaction và khóa dòng profile trước khi cộng ngày.
 * Truyền vào một `PoolClient` đang ở giữa
 * transaction (từ `withTransaction()`, `packages/core-db/transaction.ts`) khi việc cấp gói này
 * PHẢI atomic cùng một thao tác ghi DB khác — ví dụ `payment-webhook.ts` cần cập nhật
 * `payments.status='paid'` và cấp gói cùng thành công/thất bại, không được để lệch nhau.
 */
export async function grantPlanDays(
  userId: string,
  grantPlan: Exclude<Plan, 'free'>,
  days: number,
  now: Date = new Date(),
  runner: Pool | PoolClient = getPgPool(),
): Promise<PlanGrantResult> {
  const { promoUntil } = await getAppSettings({
    requireAvailable: true,
    ...('release' in runner ? { runner } : {}),
  })
  const grant = async (client: PoolClient): Promise<PlanGrantResult> => {
    // Tạo hàng trước khi khóa: hai lần cấp đồng thời vẫn tuần tự khi user chưa có profile.
    await client.query(
      `insert into public.profiles (id, plan) values ($1, 'free')
       on conflict (id) do nothing`,
      [userId],
    )
    const { rows } = await client.query<{ plan: string | null; plan_expires_at: Date | null }>(
      'select plan, plan_expires_at from public.profiles where id = $1 for update',
      [userId],
    )
    const next = computePlanGrant(
      rows[0]?.plan,
      rows[0]?.plan_expires_at,
      grantPlan,
      days,
      now,
      promoUntil,
    )

    await client.query(
      `insert into public.profiles (id, plan, plan_expires_at)
     values ($1, $2, $3)
     on conflict (id) do update set plan = excluded.plan, plan_expires_at = excluded.plan_expires_at`,
      [userId, next.plan, next.planExpiresAt],
    )
    return next
  }
  return 'release' in runner ? grant(runner) : withTransaction(runner, grant)
}
