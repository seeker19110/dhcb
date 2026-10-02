// Nút "Đóng vai" trên thanh điều khiển: popover chọn vai (VIP) hoặc lời mời nâng cấp
// (Free), và nút "Dừng đóng vai" khi đang chạy. Tách từ LessonView.tsx (2026-09-06), JSX giữ nguyên.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Square, Drama, Lock } from 'lucide-react'
import { shouldAlignPopoverRightFor } from '../../../../lib/popoverAlign'

type Props = {
  isA: boolean
  isPro: boolean
  canRecord: boolean
  rolePlay: { role: 'A' | 'B' } | null
  rolePicker: boolean
  setRolePicker: (fn: (open: boolean) => boolean) => void
  speakerName: (role: 'A' | 'B') => string
  startRolePlay: (role: 'A' | 'B') => Promise<void>
  stopRolePlay: () => void
}

export function RolePlayToolbar({
  isA,
  isPro,
  canRecord,
  rolePlay,
  rolePicker,
  setRolePicker,
  speakerName,
  startRolePlay,
  stopRolePlay,
}: Props) {
  // Phía neo popover, quyết lúc bấm theo vị trí thật của nút (xem lib/popoverAlign.ts).
  const [alignRight, setAlignRight] = useState(false)
  return (
    <>
      {/* Đóng vai — chỉ VIP. Free thấy nút khoá + link nâng cấp. */}
      {!rolePlay && (
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              setAlignRight(shouldAlignPopoverRightFor(e.currentTarget))
              setRolePicker((o) => !o)
            }}
            aria-expanded={rolePicker}
            className={`tap-44-y flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              rolePicker
                ? 'bg-violet-500/20 text-violet-300 theme-light:text-violet-800'
                : 'bg-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            {isPro ? <Drama className="w-3 h-3" /> : <Lock className="w-3 h-3 text-zinc-500" />}
            {isA ? 'Đóng vai' : 'Role-play'}
          </button>
          {rolePicker && (
            <div
              className={`absolute ${alignRight ? 'right-0' : 'left-0'} z-20 mt-1.5 w-64 glass rounded-xl p-3 animate-fade-in shadow-xl`}
            >
              {isPro ? (
                <>
                  <p className="text-xs text-zinc-400 mb-2">
                    {isA
                      ? 'Chọn vai bạn muốn đọc — AI sẽ đọc vai còn lại, bạn nói vai của mình.'
                      : 'Pick the role you want to read — AI reads the other role, you speak yours.'}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => void startRolePlay('A')}
                      className="text-left px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-accent-500/50 text-sm text-zinc-100 transition"
                    >
                      {speakerName('A')}
                    </button>
                    <button
                      onClick={() => void startRolePlay('B')}
                      className="text-left px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800 hover:border-accent-500/50 text-sm text-zinc-100 transition"
                    >
                      {speakerName('B')}
                    </button>
                  </div>
                  {!canRecord && (
                    <p className="text-[11px] text-amber-400 theme-light:text-amber-900 mt-2">
                      {isA
                        ? 'Trình duyệt này không hỗ trợ ghi âm.'
                        : 'This browser does not support recording.'}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-zinc-300 mb-2">
                    {isA
                      ? 'Đóng vai đọc hội thoại + AI chấm điểm là tính năng dành cho gói VIP.'
                      : 'Dialogue role-play + AI grading is a VIP feature.'}
                  </p>
                  <Link
                    to="/profile"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-accent-400 theme-light:text-accent-700 hover:underline"
                  >
                    {isA ? 'Nâng cấp VIP →' : 'Upgrade to VIP →'}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {rolePlay && (
        <button
          onClick={stopRolePlay}
          className="tap-44-y flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 theme-light:text-red-700 text-xs font-medium transition"
        >
          <Square className="w-3 h-3 fill-current" />
          {isA ? 'Dừng đóng vai' : 'Stop role-play'}
        </button>
      )}
    </>
  )
}
