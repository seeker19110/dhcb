// useCompanionBreakReminder — nối đồng hồ nhắc nghỉ (companionBreakReminder.ts) vào trang Bạn
// Đồng Hành: nạp/lưu trạng thái theo người dùng, kiểm định kỳ mỗi 30 giây, ghi lượt gửi.
//
// Đặc tả: docs/specs/2026-10-13-ban-dong-hanh-gd4b-nhac-nghi.md (changelog 0631).
// Nhóm tuổi không có chính sách (thanh niên, người lớn) ⇒ hook không đặt đồng hồ, không ghi gì.
import { useCallback, useEffect, useState } from 'react'
import type { AgeGroup } from '../types'
import {
  breakPolicyFor,
  isBreakAgeGroup,
  loadBreakState,
  recordActivity,
  saveBreakState,
  sessionMinutes,
  shouldRemind,
  snooze,
  type BreakAgeGroup,
  type BreakState,
} from './companionBreakReminder'

/** Kiểm lại mốc nhắc mỗi 30 giây khi trang đang mở. */
export const BREAK_CHECK_INTERVAL_MS = 30_000

export interface CompanionBreakReminder {
  /** Nhóm tuổi có lời nhắc và đã tới lúc nhắc ⇒ nhóm đó; còn lại `null`. */
  remindFor: BreakAgeGroup | null
  /** Số phút đã trò chuyện trong phiên (chỉ có nghĩa khi `remindFor` khác null). */
  minutes: number
  /** Gọi ở MỖI lượt gửi (gõ chữ hoặc nói). */
  recordTurn: () => void
  /** "Thêm một chút". */
  snoozeReminder: () => void
  /** "Mình nghỉ đây" — xoá phiên (người gọi tự điều hướng). */
  endSession: () => void
}

export function useCompanionBreakReminder(
  userId: string | undefined,
  ageGroup: AgeGroup | null | undefined,
): CompanionBreakReminder {
  const policy = breakPolicyFor(ageGroup)
  const [state, setState] = useState<BreakState | null>(() =>
    userId ? loadBreakState(userId) : null,
  )
  const [now, setNow] = useState(() => Date.now())

  // Đổi người dùng (đăng nhập xong, đổi tài khoản) ⇒ nạp lại trạng thái của ĐÚNG người đó.
  // Chỉnh state ngay lúc render thay vì trong effect (luật react-hooks/set-state-in-effect).
  const [loadedFor, setLoadedFor] = useState(userId)
  if (loadedFor !== userId) {
    setLoadedFor(userId)
    setState(userId ? loadBreakState(userId) : null)
  }

  // Lưu mỗi khi trạng thái đổi — chỉ với nhóm có chính sách.
  useEffect(() => {
    if (userId && policy) saveBreakState(userId, state)
  }, [userId, policy, state])

  useEffect(() => {
    if (!policy) return
    const id = setInterval(() => setNow(Date.now()), BREAK_CHECK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [policy])

  const recordTurn = useCallback(() => {
    if (!policy) return
    const t = Date.now()
    setState((prev) => recordActivity(prev, t, policy))
    setNow(t)
  }, [policy])

  const snoozeReminder = useCallback(() => {
    if (!policy) return
    const t = Date.now()
    setState((prev) => (prev ? snooze(prev, t, policy) : prev))
    setNow(t)
  }, [policy])

  // Xoá NGAY trong localStorage, không chờ effect lưu: người gọi điều hướng đi ngay sau đó, trang
  // bị gỡ trước khi effect kịp chạy ⇒ quay lại trong 15 phút sẽ bị nhắc lại tức thì.
  const endSession = useCallback(() => {
    if (userId) saveBreakState(userId, null)
    setState(null)
  }, [userId])

  const visible = policy !== null && isBreakAgeGroup(ageGroup) && shouldRemind(state, now, policy)
  return {
    remindFor: visible ? ageGroup : null,
    minutes: visible && state ? sessionMinutes(state, now) : 0,
    recordTurn,
    snoozeReminder,
    endSession,
  }
}
