// apps/dhcb/src/components/SessionDone.tsx — Màn KẾT gộp ba celebration thành MỘT overlay
// (P1-6, lệnh 8). Đặc tả: docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md §P1-6.
//
// 3 tầng có điều kiện:
//   (1) CompanionAvatar mood="cheer" + CompanionBubble variant="done" — "một sự thật" của phiên.
//   (2) StreakCelebrationContent/WeeklyGoalCelebrationContent (0, 1 hoặc CẢ HAI nếu trùng ngày —
//       vẫn chỉ MỘT dialog, xem AC-3) khi gate ở nơi gọi báo vừa đổi.
//   (3) CTA phụ "Ôn k thẻ" (khi `srsDue > 0`) + link chữ "Về trang chủ".
//
// Nguyên tắc chỉ ăn mừng thành tựu THẬT: `outcome.steps === 0` → KHÔNG render gì (không mở
// overlay cho việc chưa làm).
//
// Query `?xong=1` gắn vào URL khi mở (history.replaceState, không điều hướng) để F5/Back giữ
// overlay đang mở; đóng thì xoá query — xem `useEffect` bên dưới + nơi gọi đọc `xong=1` lúc mount.
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDialogBehavior } from './useDialogBehavior'
import { CompanionAvatar } from '@dhcb/core-ui/CompanionAvatar'
import { CompanionBubble } from '@dhcb/core-ui/CompanionBubble'
import { StreakCelebrationContent } from './StreakCelebration'
import { WeeklyGoalCelebrationContent } from './WeeklyGoalCelebration'
import { buildSessionFact, type SessionOutcome } from '../lib/session/sessionFact'
import { haptics } from '../lib/haptics'
import { sound } from '../lib/sound'
import { track } from '../lib/analytics'
import { buttonClass } from '@core/buttonStyles'

export interface SessionDoneProps {
  outcome: SessionOutcome
  uid: string
  isA: boolean
  /** 0 = ẩn CTA phụ. Giá trị âm coi như 0 (dữ liệu bẩn không nên bật CTA). */
  srsDue: number
  /** true = vừa đổi streak trong lần hoàn thành này (nơi gọi tự gate + mark). */
  streakJustChanged?: boolean
  /** true = vừa đạt mục tiêu tuần trong lần hoàn thành này (nơi gọi tự gate + mark). */
  weeklyGoalJustReached?: boolean
  onClose: () => void // về trang chủ hoặc đóng
  onMore?: () => void // CTA phụ "Ôn k thẻ"
}

export default function SessionDone({
  outcome,
  uid,
  isA,
  srsDue,
  streakJustChanged = false,
  weeklyGoalJustReached = false,
  onClose,
  onMore,
}: SessionDoneProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const open = outcome.steps > 0
  const { dialogProps, titleId } = useDialogBehavior(onClose, open)
  const dueCount = Math.max(0, srsDue)

  useEffect(() => {
    if (!open) return
    track('session_done_view')
  }, [open])

  useEffect(() => {
    if (!open) return
    haptics.success()
    sound.milestone()
    let alive = true
    import('../lib/confetti')
      .then((m) => {
        if (alive && overlayRef.current) m.burst(overlayRef.current)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [open])

  // Nguyên tắc: chỉ ăn mừng thành tựu THẬT — chưa làm bước nào thì không mở overlay.
  if (!open) return null

  const fact = buildSessionFact(outcome)

  function handleMore() {
    track('session_done_more')
    onMore?.()
  }

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 overflow-hidden bg-zinc-950/95 flex items-center justify-center px-6 pb-safe pt-safe"
    >
      <div {...dialogProps} className="w-full max-w-sm text-center animate-scale-in outline-none">
        {/* h2 ẩn cho aria-labelledby — nội dung thấy được đã ở CompanionBubble bên dưới */}
        <h2 id={titleId} className="sr-only">
          {isA ? 'Đã xong phiên học' : 'Session done'}
        </h2>

        {/* Tầng (1): companion + một sự thật của phiên */}
        <div className="flex flex-col items-center gap-3" aria-live="polite">
          <CompanionAvatar mood="cheer" size={64} />
          <div className="w-full text-left">
            <CompanionBubble variant="done" lead={fact.lead} detail={fact.detail} />
          </div>
        </div>

        {/* Tầng (2): streak/tuần nếu vừa đổi — có thể hiện cả hai (AC-3 vẫn 1 dialog) */}
        {(streakJustChanged || weeklyGoalJustReached) && (
          <div className="mt-4 space-y-4">
            {streakJustChanged && <StreakCelebrationContent uid={uid} isA={isA} />}
            {weeklyGoalJustReached && <WeeklyGoalCelebrationContent uid={uid} isA={isA} />}
          </div>
        )}

        {/* Tầng (3): CTA phụ + nút chính */}
        <div className="mt-6 space-y-3">
          {dueCount > 0 && onMore && (
            <button
              type="button"
              onClick={handleMore}
              className="w-full py-3 rounded-2xl border border-line-strong text-content font-medium transition hover:border-accent-500/40"
            >
              {isA ? `Thêm 3 phút? Ôn ${dueCount} thẻ` : `3 more minutes? Review ${dueCount} cards`}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={buttonClass({ size: 'lg', fullWidth: true })}
          >
            {isA ? 'Về trang chủ' : 'Home'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
