// api/_lib/settings.ts — Đọc cấu hình hạn mức/khuyến mãi do ADMIN chỉnh qua
// /api/admin-settings (bảng public.app_settings, 1 dòng duy nhất id=1). Cache trong bộ
// nhớ tiến trình (TTL ngắn) để không tra DB ở MỌI request tính lượt/giọng — usage.ts và
// promo.ts nằm trên đường nóng nhất của app (gọi ở mọi request Chat/Speaking/TTS...).
import { z } from 'zod'
import type { PoolClient } from 'pg'
import { getPgPool } from './pgPool.js'

export interface AppSettings {
  // Quyết định 2026-07-27: hạn mức là MỘT con số TỔNG lượt/ngày cho MỌI tính năng AI cộng lại
  // (không còn chia riêng chat/writing/speaking/stt/pronounce).
  //
  // GĐ1 2026-09-12 (docs/specs/2026-09-12-gd1-xoa-goi-pro.md): gói Pro/Plus bị xoá, chỉ còn
  // Free + VIP. `limits.free` ĐỌC TỪ ĐÚNG CỘT DB CŨ `pro_daily_limit` — cột giữ nguyên tên để
  // KHÔNG phải migration đổi tên cột (rủi ro cao, phải sửa cả admin-settings + panel), nhưng Ý
  // NGHĨA nay là "hạn mức người dùng miễn phí". Mặc định 30 = đúng hạn mức Plus cũ, và vẫn
  // chỉnh được qua /api/admin-settings nên đổi hạn mức toàn hệ thống không cần deploy lại.
  limits: { free: number; vip: number }
  // null = không có khuyến mãi đang chạy (áp hạn mức thật ngay)
  promoUntil: string | null
  // Cầu dao khẩn cấp chặn TOÀN BỘ lượt gọi AI (chat/writing/speaking/stt/pronounce) — admin bật
  // qua /api/admin-settings khi phát hiện chi phí bất thường. Xem api/_lib/usage.ts +
  // postgres/migrations/0005_ai_circuit_breaker.sql.
  aiCircuitBreaker: boolean
  // Bật/tắt bảng xếp hạng (Challenge.tsx → LeagueSection) — TẮT MẶC ĐỊNH (quyết định
  // 2026-07-27): ở quy mô ít người dùng, bảng gần trống khiến người mới thấy app "vắng vẻ".
  // Xem postgres/migrations/0018_leaderboard_toggle.sql.
  leaderboardEnabled: boolean
  // "Token" để client so sánh — chính là updated_at của dòng cấu hình (ISO string). Client
  // gửi lại qua header If-None-Match (xem api/app-settings.ts); server trả 304 nếu trùng,
  // client bỏ qua parse/ghi cache — KHÔNG cần tự viết cơ chế so token riêng, tận dụng đúng
  // ngữ nghĩa ETag/If-None-Match chuẩn HTTP.
  updatedAt: string
}

// Mặc định CHỈ để hiển thị khi không đọc được cấu hình. Cổng chi phí dùng
// requireAvailable và từ chối khi thiếu cấu hình. Các giá trị PHẢI khớp seed trong
// postgres/migrations/0016_daily_total_limit.sql (cột pro_daily_limit 30/ngày — nay là hạn mức
// Free, VIP 300/ngày, đều là TỔNG).
// promoUntil = null CÓ CHỦ Ý: nếu DB lỗi/mất dòng cấu hình mà mặc định vẫn bật khuyến mãi
// thì hệ thống tự nâng gói cho toàn bộ user → phát sinh chi phí AI/TTS ngoài kiểm soát.
// Không dùng fallback hiển thị này để cho phép gọi provider.
const DEFAULT_SETTINGS: AppSettings = {
  limits: { free: 30, vip: 300 },
  promoUntil: null,
  aiCircuitBreaker: false,
  leaderboardEnabled: false,
  updatedAt: '1970-01-01T00:00:00.000Z',
}

const AppSettingsRowSchema = z.object({
  pro_daily_limit: z.number().int().nonnegative(),
  vip_daily_limit: z.number().int().nonnegative(),
  promo_until: z.coerce.date().nullable(),
  ai_circuit_breaker: z.boolean(),
  leaderboard_enabled: z.boolean().default(false),
  updated_at: z.coerce.date(),
})
type AppSettingsRow = z.infer<typeof AppSettingsRowSchema>

function rowToSettings(row: AppSettingsRow): AppSettings {
  return {
    // `pro_daily_limit` = tên cột DB cũ, ý nghĩa mới là hạn mức Free (xem AppSettings ở trên).
    limits: { free: row.pro_daily_limit, vip: row.vip_daily_limit },
    promoUntil: row.promo_until ? new Date(row.promo_until).toISOString() : null,
    aiCircuitBreaker: Boolean(row.ai_circuit_breaker),
    leaderboardEnabled: Boolean(row.leaderboard_enabled),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

const CACHE_TTL_MS = 30_000 // 30s — admin đổi cấu hình có hiệu lực gần như ngay, không cần restart
let cache: { value: AppSettings; fetchedAt: number } | null = null

export async function getAppSettings(
  options: { requireAvailable?: boolean; runner?: Pick<PoolClient, 'query'> } = {},
): Promise<AppSettings> {
  if (!options.runner && cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.value

  try {
    const pool = options.runner ?? getPgPool()
    const { rows } = await pool.query<AppSettingsRow>(
      'select * from public.app_settings where id = 1',
    )
    if (!rows[0]) throw new Error('app_settings chưa được cấu hình')
    const value = rowToSettings(AppSettingsRowSchema.parse(rows[0]))
    // Không chia sẻ cấu hình chưa commit với request ngoài transaction.
    if (!options.runner) cache = { value, fetchedAt: Date.now() }
    return value
  } catch (err) {
    if (options.requireAvailable) throw err
    console.warn('[settings] Không đọc được app_settings → dùng mặc định hiển thị:', err)
    return DEFAULT_SETTINGS
  }
}

// Gọi sau khi admin POST cập nhật thành công — để lần đọc TIẾP THEO thấy giá trị mới ngay,
// không phải đợi hết TTL.
export function invalidateSettingsCache(): void {
  cache = null
  subjectCache.clear()
}

// ── Phanh tay theo MÔN: bảng public.subject_limits (migration 0029) ──────────────────────
// Audit 2026-08-12 phát hiện bảng này được tạo kèm cờ `enforced` và mô tả là phanh tay cho
// admin tắt enforce hạn mức theo môn, NHƯNG không dòng code nào đọc — tức tính năng chỉ có
// trên giấy. Hàm dưới đây nối nó vào đường enforce thật (usage.ts).
//
// MẶC ĐỊNH LÀ ENFORCE (true) ở mọi nhánh không chắc chắn — môn chưa có dòng cấu hình, DB lỗi,
// giá trị null. Đây là hướng an toàn về CHI PHÍ: đoán nhầm thành "enforce" thì cùng lắm người
// dùng bị chặn đúng như hôm nay; đoán nhầm thành "không enforce" là mở toang lượt gọi AI cho
// toàn bộ người dùng của môn đó. KHÁC với fail-open của hạn mức thường — ở đây rủi ro ngược lại.
const subjectCache = new Map<string, { enforced: boolean; fetchedAt: number }>()

export async function isSubjectEnforced(subject: string): Promise<boolean> {
  const hit = subjectCache.get(subject)
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) return hit.enforced

  try {
    const { rows } = await getPgPool().query<{ enforced: boolean | null }>(
      'select enforced from public.subject_limits where subject = $1',
      [subject],
    )
    // Không có dòng nào = môn chưa được khai báo → enforce (xem giải thích trên).
    const enforced = rows.length === 0 ? true : rows[0]?.enforced !== false
    subjectCache.set(subject, { enforced, fetchedAt: Date.now() })
    return enforced
  } catch (err) {
    console.warn('[settings] Đọc subject_limits lỗi → mặc định ENFORCE (an toàn chi phí):', err)
    return true
  }
}
