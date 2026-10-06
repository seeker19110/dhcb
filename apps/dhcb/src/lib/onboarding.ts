// Đọc LẠI kết quả onboarding (trình độ / mục tiêu / phút mỗi ngày).
// Trước đây saveOnboarding() (lib/cloud.ts) chỉ GHI lên Supabase mà không nơi
// nào đọc lại — file này bổ sung chiều đọc (U-3, docs/research/cai-tien-ui-ux.md).
// Chiến lược 2 tầng giống profile (lib/auth.ts): cache localStorage (~1ms, ghi
// ngay lúc onboarding xong) → Supabase (chạy nền, cho thiết bị mới chưa có cache).
import { useEffect, useState } from 'react'
import { getAuthHeader, getStoredToken } from '@core/authHeader'
import type { Level, AgeGroup } from '../types'
import type { DailySpeed } from './curriculum'

export type OnboardingData = {
  level: Level
  goal: string
  dailyMinutes: number
  ageGroup: AgeGroup
}

const KEY = (uid: string) => `et_onboarding_${uid}`

function isValidLevel(v: unknown): v is Level {
  return v === 'beginner' || v === 'intermediate' || v === 'advanced'
}

export function isValidAgeGroup(v: unknown): v is AgeGroup {
  return v === 'nhi_dong' || v === 'thieu_nien' || v === 'thanh_nien' || v === 'nguoi_lon'
}

// Đọc cache (sync). Trả null khi chưa có / dữ liệu hỏng — người gọi giữ mặc định cũ.
export function getCachedOnboarding(uid: string): OnboardingData | null {
  try {
    const raw = localStorage.getItem(KEY(uid))
    if (!raw) return null
    const d = JSON.parse(raw) as Partial<OnboardingData>
    if (!isValidLevel(d.level)) return null
    return {
      level: d.level,
      goal: typeof d.goal === 'string' ? d.goal : 'daily',
      dailyMinutes: typeof d.dailyMinutes === 'number' ? d.dailyMinutes : 10,
      ageGroup: isValidAgeGroup(d.ageGroup) ? d.ageGroup : 'nguoi_lon',
    }
  } catch {
    return null
  }
}

export function cacheOnboarding(uid: string, data: OnboardingData): void {
  try {
    localStorage.setItem(KEY(uid), JSON.stringify(data))
  } catch {
    /* localStorage đầy/bị chặn — bỏ qua, chỉ là cache */
  }
}

// Đọc từ GET /api/profile (Giai đoạn C — trước đây gọi thẳng Supabase `profiles` qua RLS).
// Trả null khi chưa onboarded / lỗi mạng / dữ liệu lạ. Thành công thì tự ghi cache.
export async function fetchOnboarding(uid: string): Promise<OnboardingData | null> {
  // [audit 2026-09-30 minor 7] Khách (chưa có cờ phiên) không có hồ sơ trên server — gọi
  // /api/profile chỉ để nhận 401 đỏ trong console mỗi lần tải trang.
  if (!getStoredToken()) return null
  try {
    const resp = await fetch('/api/profile', { headers: getAuthHeader() })
    if (!resp.ok) return null
    const data = (await resp.json()) as {
      onboarded: boolean
      userLevel: string
      goal: string
      dailyMinutes: number
      ageGroup?: string
    }
    if (!data.onboarded || !isValidLevel(data.userLevel)) return null
    const result: OnboardingData = {
      level: data.userLevel,
      goal: data.goal,
      dailyMinutes: data.dailyMinutes,
      ageGroup: isValidAgeGroup(data.ageGroup) ? data.ageGroup : 'nguoi_lon',
    }
    cacheOnboarding(uid, result)
    return result
  } catch {
    return null
  }
}

// Đổi riêng nhóm tuổi (Profile.tsx, sau khi đã onboarded) — cập nhật cache local NGAY
// (đọc lại mượt) rồi bắn lên server kiểu "bắn rồi quên" (như mọi hàm push khác trong
// lib/cloud.ts) — lỗi mạng chỉ warn, không làm vỡ UI.
export async function pushAgeGroup(uid: string, ageGroup: AgeGroup): Promise<void> {
  const cached = getCachedOnboarding(uid)
  if (cached) cacheOnboarding(uid, { ...cached, ageGroup })
  try {
    const resp = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ action: 'set-age-group', ageGroup }),
    })
    if (!resp.ok) console.warn('[onboarding] lưu nhóm tuổi lỗi: HTTP', resp.status)
  } catch (err) {
    console.warn('[onboarding] lưu nhóm tuổi lỗi:', err instanceof Error ? err.message : err)
  }
}

// Map "phút mỗi ngày" chọn lúc onboarding (5/10/20/30) → tốc độ học từ vựng
// 5/10/20 từ/ngày (lib/curriculum.ts). 30 phút cũng về 20 — tốc độ tối đa hiện có.
export function minutesToSpeed(minutes: number): DailySpeed {
  if (minutes <= 5) return 5
  if (minutes <= 10) return 10
  return 20
}

// Hook cho component: trả cache NGAY nếu có (state ổn định — chỉ ghi 1 lần lúc
// onboarding), thiết bị mới chưa có cache thì fetch nền rồi cập nhật.
// null = chưa biết (đang tải, chưa onboarded, hoặc chưa đăng nhập).
export function useOnboarding(uid: string | undefined): OnboardingData | null {
  const [data, setData] = useState<OnboardingData | null>(() =>
    uid ? getCachedOnboarding(uid) : null,
  )
  useEffect(() => {
    if (!uid) return
    let alive = true
    // setState phải nằm trong callback bất đồng bộ (luật react-hooks/set-state-in-effect):
    // có cache thì dùng ngay, chưa có mới fetch nền như trước.
    void Promise.resolve().then(async () => {
      const d = getCachedOnboarding(uid) ?? (await fetchOnboarding(uid))
      if (alive && d) setData(d)
    })
    return () => {
      alive = false
    }
  }, [uid])
  return data
}

// ── [U9b, 2026-10-05] Môn đã chọn lúc onboarding ─────────────────────────────────────────────
// Trước đây Onboarding chỉ dùng môn vừa chọn để ĐIỀU HƯỚNG rồi quên luôn, nên Trang chủ của
// người vừa chọn "Tiếng Anh" vẫn hỏi lại "Bắt đầu: Chọn môn" (audit 2026-09-30 M19). Lưu cục
// bộ theo từng tài khoản — đây là LỰA CHỌN của người học, không phải tiến độ: thiết bị mới
// chưa có khoá này thì Trang chủ về đúng hành vi cũ (mời chọn môn), không bịa gì thêm.
const CHOSEN_SUBJECT_KEY = (uid: string) => `dhcb_onboarding_subject_${uid}`

export function setChosenSubject(uid: string, subjectId: string): void {
  try {
    localStorage.setItem(CHOSEN_SUBJECT_KEY(uid), subjectId)
  } catch {
    /* localStorage đầy/bị chặn — chỉ mất gợi ý ở Trang chủ, không vỡ luồng */
  }
}

/** Môn đã chọn lúc onboarding; `undefined` khi chưa chọn / bỏ qua bước chọn môn / lỗi đọc. */
export function getChosenSubject(uid: string): string | undefined {
  try {
    const v = localStorage.getItem(CHOSEN_SUBJECT_KEY(uid))
    return v ? v : undefined
  } catch {
    return undefined
  }
}

// Mục tiêu onboarding → tình huống mặc định của màn Trò chuyện (`SITUATIONS` ở types.ts).
// Trước đây Trò chuyện luôn mở "Phỏng vấn xin việc" kể cả với người vừa chọn "Giao tiếp hàng
// ngày" (audit M19). Mục tiêu lạ / chưa onboarding → tán gẫu xã giao: tình huống nhẹ nhất,
// hợp với người mới hơn một buổi phỏng vấn.
const SITUATION_BY_GOAL: Readonly<Record<string, string>> = {
  daily: 'small_talk',
  travel: 'hotel_travel',
  work: 'office_meeting',
  ielts: 'free',
}
export const DEFAULT_CHAT_SITUATION = 'small_talk'

export function situationForGoal(goal: string | undefined): string {
  if (!goal || !Object.prototype.hasOwnProperty.call(SITUATION_BY_GOAL, goal)) {
    return DEFAULT_CHAT_SITUATION
  }
  return SITUATION_BY_GOAL[goal]!
}
