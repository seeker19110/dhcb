// packages/core-contracts/appSettings.ts — Hợp đồng CÔNG KHAI của `GET /api/app-settings`.
//
// [2026-10-05, audit M9] MỘT nguồn sự thật cho hình dạng dữ liệu này, dùng chung ở ba nơi:
//   - server (`apps/server/src/api/platform/app-settings.ts`, test đối chiếu kết quả thật);
//   - client (`apps/dhcb/src/lib/appSettings.ts`, validate cả body mạng lẫn cache localStorage);
//   - mock E2E (`e2e/helpers/auth.ts`, parse qua schema này nên mock lệch hợp đồng là đỏ ngay).
// Trước đây client tự khai kiểu `Record<Plan, Record<UsageMode, number>>` (hạn mức THEO CHẾ ĐỘ, từ
// trước GĐ1) rồi ép kiểu không kiểm, trong khi server đã trả MỘT con số tổng/ngày cho mỗi gói —
// mọi chỗ đọc `limit.chat`/`limit.speaking` nhận `undefined`, trang Tiến độ hiện "0/".
// `zod/mini` (không phải `zod`): hợp đồng này được client đọc NGAY LÚC MỞ TRANG
// (`apps/dhcb/src/lib/appSettings.ts`, chunk modulepreload). Import zod bản đầy đủ ở đây là kéo
// ~17 kB brotli vào đường khởi động (đo 2026-10-10, changelog 0580). Server chỉ `safeParse`.
import * as z from 'zod/mini'

// Hạn mức lượt AI mỗi ngày, TỔNG mọi tính năng cộng lại (GĐ1 2026-09-12). Admin chỉnh ở /admin.
export const PlanDailyLimitsSchema = z.strictObject({
  free: z.int().check(z.nonnegative()),
  vip: z.int().check(z.nonnegative()),
})
export type PlanDailyLimits = z.infer<typeof PlanDailyLimitsSchema>

// Số mặc định CHỈ để hiển thị trước khi đọc được server — khớp `DEFAULT_SETTINGS` ở
// packages/core-db/settings.ts (seed migration 0016/0076: Free 30, VIP 300). Chặn thật luôn ở server.
export const DEFAULT_PLAN_DAILY_LIMITS: PlanDailyLimits = { free: 30, vip: 300 }

// Không `.strict()` ở cấp ngoài: server được phép thêm trường mới (vd `aiCircuitBreaker` đã có)
// mà client cũ không vỡ — Zod bỏ trường lạ khi parse.
export const PublicAppSettingsSchema = z.object({
  limits: PlanDailyLimitsSchema,
  // Additive: máy chủ cũ/rollback không có cờ này thì client vẫn giữ hạn mức cũ.
  vipUnlimited: z.optional(z.boolean()),
  // null = không có khuyến mãi đang chạy.
  promoUntil: z.nullable(z.string()),
  leaderboardEnabled: z.boolean(),
  // Token so sánh ETag (= updated_at dòng cấu hình).
  updatedAt: z.string().check(z.minLength(1)),
})
export type PublicAppSettings = z.infer<typeof PublicAppSettingsSchema>
