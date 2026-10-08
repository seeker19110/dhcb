// Thông báo NHẸ khi không tải được các tin nhắn trước của Companion (quyết định 2026-10-08).
// Khác `LoadError` (khối to, dành cho dữ liệu chính): đây là dữ liệu phụ nên chỉ một dòng nhỏ +
// nút "Thử lại"; trò chuyện mới vẫn dùng bình thường. Companion chỉ có giao diện tiếng Việt.
import { buttonClass } from '@core/buttonStyles'

export const HISTORY_LOAD_NOTICE_TEXT =
  'Không tải được các tin nhắn trước. Bạn vẫn trò chuyện bình thường.'

export default function HistoryLoadNotice({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="status"
      className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300"
    >
      <span className="min-w-0 flex-1">{HISTORY_LOAD_NOTICE_TEXT}</span>
      <button
        type="button"
        onClick={onRetry}
        className={buttonClass({ variant: 'outline', size: 'sm', className: 'tap-44' })}
      >
        Thử lại
      </button>
    </div>
  )
}
