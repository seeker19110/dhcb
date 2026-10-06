// src/lib/planLabel.ts — Nhãn gói HIỂN THỊ cho người dùng, đọc từ gói THẬT của phiên (`user.plan`
// + `user.planExpiresAt`, server đã xét hạn qua `resolvePlan`). Dùng chung cho thanh bên và trang
// /nang-cap để hai nơi không bao giờ nói khác nhau.
//
// [2026-10-05, audit M8] VIP không có `planExpiresAt` = VIP vĩnh viễn (người dùng hiện có được
// nâng VIP vĩnh viễn ở migration 0080; "Người tiên phong" cũng vậy) → nói rõ "VIP vĩnh viễn"
// thay vì chỉ "Gói VIP".
import type { Plan } from '../types'

const VN_TIME_ZONE = 'Asia/Ho_Chi_Minh'

/** Ngày hết hạn theo giờ Việt Nam, dạng dd/mm/yyyy; `null` nếu chuỗi ngày không hợp lệ. */
export function formatPlanExpiry(planExpiresAt: string, lang: 'vi' | 'en' = 'vi'): string | null {
  const date = new Date(planExpiresAt)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    timeZone: VN_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/**
 * VIP vĩnh viễn = server trả `planExpiresAt: null` TƯỜNG MINH. `undefined` (phiên cũ trong cache
 * chưa có trường này) là "chưa biết" — không được hứa "vĩnh viễn" với người có thể có hạn.
 */
export function isLifetimeVip(
  plan: Plan | undefined,
  planExpiresAt: string | null | undefined,
): boolean {
  return plan === 'vip' && planExpiresAt === null
}

/** Nhãn lối vào trang gói ở chân thanh bên — theo gói THẬT, gọn hơn khi thu gọn. */
export function sidebarPlanLabel(
  plan: Plan | undefined,
  planExpiresAt: string | null | undefined,
  collapsed: boolean,
): string {
  if (plan !== 'vip') return collapsed ? 'Nâng cấp' : 'Free · Nâng cấp'
  if (collapsed) return 'VIP'
  if (isLifetimeVip(plan, planExpiresAt)) return 'VIP vĩnh viễn'
  if (!planExpiresAt) return 'Gói VIP'
  const until = formatPlanExpiry(planExpiresAt)
  return until ? `VIP đến ${until}` : 'Gói VIP'
}
