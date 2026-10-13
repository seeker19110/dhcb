// companionBreakReminder — đồng hồ "nhắc nghỉ" cho trẻ khi trò chuyện lâu với Bạn Đồng Hành.
//
// Đặc tả: docs/specs/2026-10-13-ban-dong-hanh-gd4b-nhac-nghi.md (changelog 0631).
//
// Vì sao đếm bằng MÃ: prompt Companion có dặn "học lâu thì nhắc nghỉ", nhưng mô hình KHÔNG biết
// phiên đã kéo dài bao lâu — lời nhắc hoặc không đến, hoặc đến ngẫu nhiên. Ở đây thời gian do
// client đếm, câu nhắc do người viết sẵn. Đây là cú hích nhẹ (không khoá, không chặn), nên đặt ở
// client là hợp lý — luật "không tin client" dành cho kiểm quyền/đếm lượt AI.
//
// File này có: hàm THUẦN (nhận `nowMs`, trả trạng thái mới), câu nhắc viết sẵn, đọc/ghi
// localStorage an toàn.
import { z } from 'zod'
import type { AgeGroup } from '../types'

const MINUTE_MS = 60_000

export type BreakAgeGroup = 'nhi_dong' | 'thieu_nien'

export interface BreakPolicy {
  /** Nhắc lần đầu sau ngần này phút trò chuyện liên tục. */
  firstReminderMinutes: number
  /** Bấm "Thêm một chút" thì nhắc lại sau ngần này phút. */
  snoozeMinutes: number
  /** Không gửi lượt nào ngần này phút ⇒ coi như đã nghỉ thật, lượt sau mở phiên mới. */
  idleResetMinutes: number
}

// Ngưỡng 20 phút cho Nhi đồng bám quy tắc nghỉ mắt 20-20-20; mọi ngưỡng đều chặt hơn nhiều so
// với trần 3 giờ của California SB 243 (nghiên cứu mục 2.4).
export const BREAK_POLICIES: Record<BreakAgeGroup, BreakPolicy> = {
  nhi_dong: { firstReminderMinutes: 20, snoozeMinutes: 10, idleResetMinutes: 15 },
  thieu_nien: { firstReminderMinutes: 40, snoozeMinutes: 15, idleResetMinutes: 15 },
}

export function isBreakAgeGroup(ageGroup: AgeGroup | null | undefined): ageGroup is BreakAgeGroup {
  return ageGroup === 'nhi_dong' || ageGroup === 'thieu_nien'
}

/** Chính sách theo nhóm tuổi; `null` = nhóm này không có lời nhắc (thanh niên, người lớn). */
export function breakPolicyFor(ageGroup: AgeGroup | null | undefined): BreakPolicy | null {
  return isBreakAgeGroup(ageGroup) ? BREAK_POLICIES[ageGroup] : null
}

export const BreakStateSchema = z
  .object({
    sessionStartMs: z.number().int().nonnegative(),
    lastActivityMs: z.number().int().nonnegative(),
    nextReminderAtMs: z.number().int().nonnegative(),
  })
  .refine((s) => s.lastActivityMs >= s.sessionStartMs, {
    message: 'lastActivity trước sessionStart',
  })

export type BreakState = z.infer<typeof BreakStateSchema>

function isIdle(state: BreakState, nowMs: number, policy: BreakPolicy): boolean {
  return nowMs - state.lastActivityMs > policy.idleResetMinutes * MINUTE_MS
}

/** Ghi một lượt gửi. Chưa có phiên, hoặc đã nghỉ thật ⇒ mở phiên mới. */
export function recordActivity(
  state: BreakState | null,
  nowMs: number,
  policy: BreakPolicy,
): BreakState {
  if (!state || isIdle(state, nowMs, policy) || nowMs < state.sessionStartMs) {
    return {
      sessionStartMs: nowMs,
      lastActivityMs: nowMs,
      nextReminderAtMs: nowMs + policy.firstReminderMinutes * MINUTE_MS,
    }
  }
  return { ...state, lastActivityMs: Math.max(state.lastActivityMs, nowMs) }
}

/** Đã tới mốc nhắc VÀ phiên vẫn đang diễn ra (rời đi rồi quay lại thì không bật lên). */
export function shouldRemind(
  state: BreakState | null,
  nowMs: number,
  policy: BreakPolicy,
): boolean {
  if (!state) return false
  return nowMs >= state.nextReminderAtMs && !isIdle(state, nowMs, policy)
}

/** "Thêm một chút": dời mốc nhắc. */
export function snooze(state: BreakState, nowMs: number, policy: BreakPolicy): BreakState {
  return { ...state, nextReminderAtMs: nowMs + policy.snoozeMinutes * MINUTE_MS }
}

/** Số phút đã trò chuyện trong phiên (làm tròn xuống, tối thiểu 1) — để hiện trong câu nhắc. */
export function sessionMinutes(state: BreakState, nowMs: number): number {
  return Math.max(1, Math.floor((nowMs - state.sessionStartMs) / MINUTE_MS))
}

// ── Câu nhắc ──────────────────────────────────────────────────────────────────────────────
// Do NGƯỜI viết sẵn (không gọi AI): nói rõ "mình là bạn đồng hành AI" (California SB 243), gợi ý
// việc cụ thể, KHÔNG câu tội lỗi, KHÔNG nhắc chuỗi ngày.

export interface ReminderCopy {
  title: string
  body: (minutes: number) => string
}

export const BREAK_REMINDER_COPY: Record<BreakAgeGroup, ReminderCopy> = {
  nhi_dong: {
    title: 'Mình nghỉ một chút nhé!',
    body: (m) =>
      `Bạn đã trò chuyện với mình khoảng ${m} phút rồi. Mình là bạn đồng hành AI nên không thấy ` +
      'mệt, nhưng mắt và người của bạn thì cần nghỉ đó. Đứng dậy vươn vai, uống một ngụm nước và ' +
      'nhìn ra thật xa một lúc nhé.',
  },
  thieu_nien: {
    title: 'Nghỉ giải lao chút không?',
    body: (m) =>
      `Bạn đã trò chuyện khoảng ${m} phút. Mình là bạn đồng hành AI, mình đợi được. Đứng dậy ` +
      'vươn vai, uống nước, cho mắt nhìn xa vài phút rồi quay lại cũng chưa muộn.',
  },
}

// ── Lưu trữ ────────────────────────────────────────────────────────────────────────────────
// localStorage có thể vắng/ném lỗi (chế độ riêng tư, chặn dữ liệu trang) ⇒ mọi thao tác bọc
// try/catch; khi đó đồng hồ chỉ sống trong bộ nhớ của trang, trang vẫn chạy bình thường.

export function breakStorageKey(userId: string): string {
  return `dhcb:companion-break:${userId}`
}

export function loadBreakState(userId: string): BreakState | null {
  try {
    const raw = localStorage.getItem(breakStorageKey(userId))
    if (!raw) return null
    const parsed = BreakStateSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function saveBreakState(userId: string, state: BreakState | null): void {
  try {
    if (state) localStorage.setItem(breakStorageKey(userId), JSON.stringify(state))
    else localStorage.removeItem(breakStorageKey(userId))
  } catch {
    // Không lưu được thì thôi — trạng thái trong bộ nhớ vẫn đúng cho lần mở trang này.
  }
}
