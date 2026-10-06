// src/lib/appSettings.ts — Đọc hạn mức/khuyến mãi hiện hành từ server (bảng app_settings,
// admin chỉnh qua /api/admin-settings) NGAY LÚC MỞ APP, thay vì dùng số tĩnh hard-code mãi
// mãi. Hydrate NGAY (đồng bộ) từ localStorage để có giá trị dùng được tức thì (tránh UI
// nhấp nháy "5 lượt" rồi nhảy lên "100 lượt"), sau đó refreshAppSettings() ở App.tsx gọi
// /api/app-settings (public, không cần đăng nhập) để cập nhật lại cho đúng.
//
// [2026-10-05, audit M9] Hình dạng dữ liệu = hợp đồng Zod dùng chung
// `@dhcb/core-contracts/appSettings` (cùng schema server và mock E2E dùng). Hạn mức là MỘT con
// số TỔNG lượt AI/ngày cho mỗi gói (`limits.free`/`limits.vip`), KHÔNG còn chia theo chế độ.
// Cả body mạng lẫn cache localStorage đều qua `safeParse`: cache cũ hình dạng theo chế độ (bản
// phát hành trước) bị bỏ qua thay vì ép kiểu rồi rò `undefined` ra giao diện.
import {
  DEFAULT_PLAN_DAILY_LIMITS,
  PublicAppSettingsSchema,
  type PlanDailyLimits,
  type PublicAppSettings,
} from '@dhcb/core-contracts/appSettings'
import type { DailyUsage, Plan } from '../types'

export type AppSettings = PublicAppSettings

// promoUntil = null CÓ CHỦ Ý — khớp mặc định của api/_lib/settings.ts: chưa gọi được
// /api/app-settings thì coi như KHÔNG có khuyến mãi, để UI không mở khoá nhầm giọng/hạn mức
// mà server sẽ chặn. Có giá trị thật ngay sau refreshAppSettings().
const DEFAULT_SETTINGS: AppSettings = {
  limits: DEFAULT_PLAN_DAILY_LIMITS,
  promoUntil: null,
  leaderboardEnabled: false,
  updatedAt: '1970-01-01T00:00:00.000Z',
}

const CACHE_KEY = 'app_settings_cache'

function loadFromLocalStorage(): AppSettings | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = PublicAppSettingsSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

let current: AppSettings = loadFromLocalStorage() ?? DEFAULT_SETTINGS
const listeners = new Set<() => void>()

export function subscribeAppSettings(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAppSettings(): AppSettings {
  return current
}

export function getLimits(): PlanDailyLimits {
  return current.limits
}

/** Hạn mức lượt AI/ngày (TỔNG mọi tính năng) của gói đang có hiệu lực. */
export function getDailyLimit(plan: Plan): number {
  return hasUnlimitedAi(plan) ? Number.POSITIVE_INFINITY : current.limits[plan]
}

/** Chỉ gói VIP được máy chủ xác nhận mới bỏ chặn sớm ở UI; đây không phải quyền server. */
export function hasUnlimitedAi(plan: Plan): boolean {
  return plan === 'vip' && current.vipUnlimited === true
}

/**
 * Tổng lượt AI đã dùng hôm nay theo bộ đếm LOCAL (Chat · Viết · Nói · Nghe · Phát âm). Chỉ là
 * cận dưới để chặn sớm ở giao diện — số thật do server đếm (packages/core-billing/usage.ts).
 */
export function totalAiUsage(usage: DailyUsage): number {
  return (
    usage.chatCount +
    usage.writingCount +
    usage.speakingCount +
    usage.sttCount +
    (usage.pronounceCount ?? 0)
  )
}

/** Đã chạm hạn mức TỔNG/ngày theo bộ đếm local chưa (server vẫn là nơi chặn thật). */
export function hasReachedDailyLimit(usage: DailyUsage, plan: Plan): boolean {
  return totalAiUsage(usage) >= getDailyLimit(plan)
}

export function isLeaderboardEnabled(): boolean {
  return current.leaderboardEnabled
}

// Gọi 1 lần lúc app khởi động (App.tsx) — public, không cần header đăng nhập.
//
// Gửi kèm If-None-Match: token (updatedAt) đang có trong cache — admin CHƯA đổi gì thì
// server trả 304 (rỗng), ta GIỮ NGUYÊN cache hiện có, không cần parse/ghi lại gì cả. Chỉ khi
// admin đã đổi (token khác) server mới trả body mới + token mới, lúc đó mới cập nhật cache.
// Lỗi mạng/server, hoặc body lệch hợp đồng, thì giữ nguyên giá trị cache/mặc định đang có —
// đây là số HIỂN THỊ, server luôn tự chặn theo cấu hình thật của nó.
export async function refreshAppSettings(): Promise<void> {
  try {
    const res = await fetch('/api/app-settings', {
      headers: { 'If-None-Match': `"${current.updatedAt}"` },
    })
    if (res.status === 304) return // Không đổi gì — cache hiện tại vẫn đúng, khỏi làm gì thêm
    if (!res.ok) return
    const parsed = PublicAppSettingsSchema.safeParse(await res.json())
    if (!parsed.success) {
      console.warn('[appSettings] /api/app-settings lệch hợp đồng → giữ giá trị cũ', parsed.error)
      return
    }
    current = parsed.data
    for (const listener of listeners) listener()
    localStorage.setItem(CACHE_KEY, JSON.stringify(parsed.data))
  } catch {
    /* giữ nguyên cache/mặc định hiện có */
  }
}
