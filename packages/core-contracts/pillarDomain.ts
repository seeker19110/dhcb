// packages/core-contracts/pillarDomain.ts — Miền (trụ) dùng chung cho các tính năng Companion.
//
// Hai trụ còn thật: Learning (`learning`) và Ghi chú (`work`, tên cũ "Công việc"), cộng `general`
// cho việc không thuộc trụ nào. Ba trụ Career · Startup · Life đã gỡ hẳn 2026-09-20 (CLAUDE.md
// mục 1) — nhưng dữ liệu LƯU từ trước (module Neural Curriculum trong `platform.feature_state`,
// canvas…) vẫn có thể mang ba giá trị đó. Thay vì từ chối (đọc lại state cũ ra 500), schema đổi
// chúng về `general` khi parse. Tách từ `actionCanvas.ts` (changelog 0485) thành chỗ dùng chung —
// changelog 0628.
import { z } from 'zod'

export const PILLAR_DOMAINS = ['learning', 'work', 'general'] as const

/** Giá trị của ba trụ đã xoá — chỉ còn để đọc dữ liệu cũ, không bao giờ được sinh mới. */
export const LEGACY_PILLAR_DOMAINS: ReadonlySet<string> = new Set(['career', 'startup', 'life'])

export const PillarDomainSchema = z.preprocess(
  (value) => (typeof value === 'string' && LEGACY_PILLAR_DOMAINS.has(value) ? 'general' : value),
  z.enum(PILLAR_DOMAINS),
)

export type PillarDomain = z.infer<typeof PillarDomainSchema>

/** Chuẩn hoá giá trị đọc từ dữ liệu lưu cũ (không qua schema lúc ghi): trụ đã xoá → `general`,
 *  giá trị lạ/thiếu → `fallback`. Không bao giờ ném lỗi — dùng ở đường ĐỌC dữ liệu người dùng. */
export function normalizePillarDomain(
  value: unknown,
  fallback: PillarDomain = 'general',
): PillarDomain {
  const parsed = PillarDomainSchema.safeParse(value)
  return parsed.success ? parsed.data : fallback
}

/** Nhãn hiển thị tiếng Việt — người dùng không thấy mã thô. */
export const PILLAR_DOMAIN_LABELS: Record<PillarDomain, string> = {
  learning: 'Học tập',
  work: 'Ghi chú',
  general: 'Chung',
}
