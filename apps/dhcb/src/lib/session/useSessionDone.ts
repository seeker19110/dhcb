// apps/dhcb/src/lib/session/useSessionDone.ts — Trạng thái màn kết `SessionDone` (P1-6) cho các
// trang có MỘT hoạt động kết thúc rõ ràng (bài Lập trình, bài STEM, Challenge).
//
// Vì sao cần nhớ `outcome`: `?xong=1` (sessionDoneUrl.ts) giữ overlay qua F5/Back, nhưng sau khi
// tải lại trang thì kết quả chấm (số câu đúng, số bước) đã mất khỏi bộ nhớ. Ăn mừng lại mà không
// có số liệu là trái luật "chỉ ăn mừng thành tựu THẬT" — nên kết quả được chép vào sessionStorage
// (riêng tab, tự mất khi đóng tab) theo đúng nội dung. `?xong=1` mà không có kết quả nhớ của ĐÚNG
// nội dung này (link chia sẻ, tab khác) → không mở gì, chỉ dọn query.
import { useCallback, useEffect, useState } from 'react'
import type { SessionOutcome } from './sessionFact'
import {
  clearSessionDoneOpenInUrl,
  isSessionDoneOpenInUrl,
  markSessionDoneOpenInUrl,
} from './sessionDoneUrl'

const KEY = (contentKey: string) => `dhcb_session_done:${contentKey}`

function nho(contentKey: string, outcome: SessionOutcome): void {
  try {
    sessionStorage.setItem(KEY(contentKey), JSON.stringify(outcome))
  } catch {
    // Trình duyệt chặn lưu: overlay vẫn mở trong lần này, chỉ không sống qua F5.
  }
}

function quen(contentKey: string): void {
  try {
    sessionStorage.removeItem(KEY(contentKey))
  } catch {
    // Không xoá được thì thôi — khoá chỉ được đọc lại khi URL còn `?xong=1`.
  }
}

/** Đọc kết quả đã nhớ; dữ liệu hỏng/thiếu trường → `null` (không mở overlay rỗng). */
export function docKetQuaDaNho(contentKey: string): SessionOutcome | null {
  try {
    const raw = sessionStorage.getItem(KEY(contentKey))
    if (!raw) return null
    const o = JSON.parse(raw) as Partial<SessionOutcome>
    if (typeof o.steps !== 'number' || o.steps <= 0 || typeof o.kind !== 'string') return null
    return o as SessionOutcome
  } catch {
    return null
  }
}

export function useSessionDone(contentKey: string) {
  const [state, setState] = useState<{ key: string; outcome: SessionOutcome | null }>(() => ({
    key: contentKey,
    outcome: isSessionDoneOpenInUrl() ? docKetQuaDaNho(contentKey) : null,
  }))
  // Đổi sang nội dung khác trong cùng component → overlay của nội dung cũ không mang theo.
  const outcome = state.key === contentKey ? state.outcome : null

  // `?xong=1` mồ côi (không có kết quả nhớ của nội dung này) → dọn query, không mở overlay.
  useEffect(() => {
    if (isSessionDoneOpenInUrl() && !docKetQuaDaNho(contentKey)) clearSessionDoneOpenInUrl()
  }, [contentKey])

  const open = useCallback(
    (o: SessionOutcome) => {
      if (o.steps <= 0) return
      nho(contentKey, o)
      markSessionDoneOpenInUrl()
      setState({ key: contentKey, outcome: o })
    },
    [contentKey],
  )

  const close = useCallback(() => {
    quen(contentKey)
    clearSessionDoneOpenInUrl()
    setState({ key: contentKey, outcome: null })
  }, [contentKey])

  return { outcome, open, close }
}
