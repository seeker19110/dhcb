// apps/dhcb/src/components/CompanionVoice/PracticeSessionAlert.tsx — khung báo lỗi dùng chung cho
// các phòng luyện có phiên (Holodeck, Socratic). Phiên hết hạn/không còn thì kèm nút
// "Bắt đầu lại" mở phiên mới cùng kịch bản/chủ đề (changelog 0538) — không để người học kẹt ở
// một phiên đã chết mà bấm "Gửi" mãi không được.
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { buttonClass } from '@core/buttonStyles'

export interface PracticeSessionAlertProps {
  message: string
  /** Có thì hiện nút "Bắt đầu lại". */
  onRestart?: () => void
  restarting?: boolean
}

export default function PracticeSessionAlert({
  message,
  onRestart,
  restarting = false,
}: PracticeSessionAlertProps) {
  return (
    <div
      role="alert"
      className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 theme-light:text-red-900 flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <div className="flex items-center gap-2 flex-1">
        <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span>{message}</span>
      </div>
      {onRestart && (
        <button
          type="button"
          onClick={onRestart}
          disabled={restarting}
          className={buttonClass({ variant: 'outline' })}
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Bắt đầu lại</span>
        </button>
      )}
    </div>
  )
}
