// apps/dhcb/src/components/location/TripActions.tsx — Các hành động trong chuyến, XẾP THEO MỨC
// HẬU QUẢ chứ không đổ thành một đống nút giống nhau như trước:
//   • Nhóm "Cài đặt" — đổi được, đổi lại được, hậu quả nhỏ.
//   • Nhóm "Kết thúc" — mất dữ liệu của người khác, KHÔNG hoàn tác được → viền cảnh báo và bắt
//     xác nhận hai bước. Trước đây "Kết thúc chuyến cho cả nhóm" xoá vị trí của TẤT CẢ mọi
//     người chỉ bằng một chạm, trông y hệt nút "Chép link mời" bên cạnh — quá dễ bấm nhầm khi
//     đang đi đường.

import { useState } from 'react'
import { Flag, LogOut, Timer, XCircle } from 'lucide-react'
import { buttonClass } from '@core/buttonStyles'

interface Props {
  isOwner: boolean
  precisionMode: 'exact' | 'approx'
  /** Chưa bật chia sẻ thì không lấy được chỗ đang đứng để đặt điểm hẹn. */
  canSetMeetPoint: boolean
  hasMeetPoint: boolean
  onTogglePrecision: () => void
  onSetMeetPoint: () => void
  onClearMeetPoint: () => void
  onExtend: () => void
  onEnd: () => void
  onLeave: () => void
}

/** Nút cần xác nhận hai bước — bấm lần đầu chỉ MỞ RA câu hỏi, không làm gì cả. */
function ConfirmButton({
  label,
  question,
  confirmLabel,
  icon,
  onConfirm,
}: {
  label: string
  question: string
  confirmLabel: string
  icon: React.ReactNode
  onConfirm: () => void
}) {
  const [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="tap-44 flex w-full items-center gap-2 rounded-xl border border-rose-400/40 hover:bg-rose-500/10 transition-colors px-4 text-rose-200 theme-light:text-rose-800"
      >
        {icon}
        {label}
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 p-3">
      <p className="mb-2 text-sm text-zinc-100">{question}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAsking(false)}
          className={buttonClass({ variant: 'outline', className: 'flex-1' })}
        >
          Không
        </button>
        <button
          type="button"
          onClick={() => {
            setAsking(false)
            onConfirm()
          }}
          className={buttonClass({ variant: 'danger', className: 'flex-1' })}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}

export default function TripActions({
  isOwner,
  precisionMode,
  canSetMeetPoint,
  hasMeetPoint,
  onTogglePrecision,
  onSetMeetPoint,
  onClearMeetPoint,
  onExtend,
  onEnd,
  onLeave,
}: Props) {
  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4">
        <h2 className="mb-1 text-lg font-bold text-zinc-100">Cài đặt chuyến</h2>
        <p className="mb-3 text-sm text-zinc-200">
          {precisionMode === 'approx'
            ? 'Mọi người đang thấy vị trí gần đúng của bạn (làm tròn về ô lưới ~500m).'
            : 'Mọi người đang thấy vị trí chính xác của bạn.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onTogglePrecision}
            className="tap-44 rounded-xl border border-zinc-700 hover:bg-zinc-800/60 hover:border-zinc-600 transition-colors px-4 font-semibold text-zinc-100"
          >
            {precisionMode === 'approx' ? 'Chuyển sang chính xác' : 'Chỉ hiện gần đúng (~500m)'}
          </button>

          {isOwner && (
            <>
              <button
                type="button"
                onClick={onSetMeetPoint}
                disabled={!canSetMeetPoint}
                className="tap-44 flex items-center gap-2 rounded-xl border border-zinc-700 hover:bg-zinc-800/60 hover:border-zinc-600 transition-colors px-4 font-semibold text-zinc-100 disabled:opacity-50"
              >
                <Flag className="h-4 w-4" aria-hidden="true" />
                {hasMeetPoint ? 'Dời điểm hẹn về đây' : 'Đặt điểm hẹn tại đây'}
              </button>
              {hasMeetPoint && (
                <button
                  type="button"
                  onClick={onClearMeetPoint}
                  className="tap-44 rounded-xl border border-zinc-700 hover:bg-zinc-800/60 hover:border-zinc-600 transition-colors px-4 font-semibold text-zinc-100"
                >
                  Bỏ điểm hẹn
                </button>
              )}
              <button
                type="button"
                onClick={onExtend}
                className="tap-44 flex items-center gap-2 rounded-xl border border-zinc-700 hover:bg-zinc-800/60 hover:border-zinc-600 transition-colors px-4 font-semibold text-zinc-100"
              >
                <Timer className="h-4 w-4" aria-hidden="true" />
                Gia hạn thêm 1 giờ
              </button>
            </>
          )}
        </div>
        {isOwner && !canSetMeetPoint && (
          <p className="mt-2 text-sm text-zinc-200">
            Bật chia sẻ vị trí trước thì mới lấy được chỗ bạn đang đứng làm điểm hẹn.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <ConfirmButton
          label="Rời chuyến"
          question="Rời chuyến này? Vị trí của bạn sẽ bị xoá và bạn không còn thấy mọi người nữa."
          confirmLabel="Rời chuyến"
          icon={<LogOut className="h-4 w-4" aria-hidden="true" />}
          onConfirm={onLeave}
        />
        {isOwner && (
          <ConfirmButton
            label="Kết thúc chuyến cho cả nhóm"
            question="Kết thúc chuyến cho TẤT CẢ mọi người? Vị trí của mọi thành viên sẽ bị xoá ngay và không khôi phục được."
            confirmLabel="Kết thúc"
            icon={<XCircle className="h-4 w-4" aria-hidden="true" />}
            onConfirm={onEnd}
          />
        )}
      </section>
    </div>
  )
}
