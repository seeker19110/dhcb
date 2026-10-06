// ContinueCard · ContinueRow — khối "Học tiếp" DÙNG CHUNG cho mọi môn.
//
// VÌ SAO (audit đồng nhất bố cục 2026-10-01, mục #9): mỗi trang tự dựng khối "học tiếp" của
// riêng mình nên cùng một việc mà mỗi nơi một kiểu:
//   - trang môn Tiếng Anh: nhãn nhỏ xám, tên bài xanh lá cắt cụt một dòng, nút nằm bên phải;
//   - trang môn Lập trình: tên bài là tiêu đề lớn, nút giãn hết dòng ở MỌI bề rộng (1.100px
//     ở màn 1440px);
//   - danh sách bài hội thoại · câu thông dụng · luyện nghe: ba bản chép tay giống hệt nhau
//     của cùng một dòng gợi ý "Tiếp tục".
// Người học chuyển môn là phải đọc lại bố cục. Nay một nguồn: sửa ở đây là mọi môn đổi theo.
//
// Hai kích cỡ, hai vai:
//   - `ContinueCard`: khối chính của TRANG MÔN — tên bài + một nút chính. Điện thoại: nút giãn
//     hết dòng (dễ bấm bằng ngón cái); từ 640px: nút nằm bên phải tên bài.
//   - `ContinueRow`: dòng gợi ý đầu một DANH SÁCH — cả dòng là một nút.
import type { ReactNode } from 'react'
import { Play, type LucideIcon } from 'lucide-react'
import { buttonClass } from '@core/buttonStyles'

export interface ContinueCardProps {
  /** Dòng nhỏ phía trên: "Học tiếp", "Đang học dở", "Bài tiếp theo theo lộ trình"… */
  eyebrow: string
  /** Tên bài sẽ mở. Bỏ trống khi chưa biết (đang tải) — khối vẫn giữ chỗ cho nút. */
  title?: ReactNode
  /** Dòng phụ dưới tên bài (huy hiệu ngôn ngữ, bậc học…). */
  meta?: ReactNode
  actionLabel: string
  onAction: () => void
  disabled?: boolean
  /** Biểu tượng của nút chính. Mặc định ▷ (hợp với "bắt đầu/học tiếp"); đổi khi nút làm việc khác. */
  icon?: LucideIcon
  /**
   * - `card` (mặc định): thẻ đứng riêng, viền accent.
   * - `inset`: nằm TRONG một thẻ khác (vd thẻ đầu trang môn Tiếng Anh) — chỉ có vạch ngăn phía
   *   trên, không dựng thêm khung (luật "không lồng thẻ trong thẻ", skill ui-ux §9.A.4).
   */
  frame?: 'card' | 'inset'
  /** Cấp tiêu đề của tên bài: 2 khi khối đứng riêng, 3 khi nằm dưới một tiêu đề h2 khác. */
  headingLevel?: 2 | 3
  /** Lối phụ dưới nút (vd "Khoá học này là gì?"). */
  children?: ReactNode
}

const KHUNG: Record<NonNullable<ContinueCardProps['frame']>, string> = {
  card: 'rounded-3xl border border-accent-500/40 bg-zinc-900 p-5 shadow-md',
  inset: 'border-t border-zinc-800/80 pt-4',
}

export function ContinueCard({
  eyebrow,
  title,
  meta,
  actionLabel,
  onAction,
  disabled = false,
  icon: Icon = Play,
  frame = 'card',
  headingLevel = 2,
  children,
}: ContinueCardProps) {
  const TieuDe = headingLevel === 2 ? 'h2' : 'h3'
  const Khung = frame === 'card' ? 'section' : 'div'
  return (
    <Khung className={KHUNG[frame]}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-xs font-semibold text-zinc-300">{eyebrow}</p>
          {title && <TieuDe className="text-lg font-bold leading-snug text-white">{title}</TieuDe>}
          {meta && <div className="flex flex-wrap items-center gap-2">{meta}</div>}
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className={buttonClass({
            variant: 'primary',
            size: 'lg',
            className: 'w-full shrink-0 sm:w-auto',
          })}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span>{actionLabel}</span>
        </button>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </Khung>
  )
}

export interface ContinueRowProps {
  /** Nhãn nhỏ: "Tiếp tục". */
  label: string
  /** Tên mục sẽ mở — một dòng, cắt bớt nếu dài. */
  title: string
  onClick: () => void
  className?: string
}

/** Dòng gợi ý "Tiếp tục" đầu danh sách: mục đầu tiên chưa xem. Cả dòng là một nút. */
export function ContinueRow({ label, title, onClick, className = '' }: ContinueRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 bg-accent-500/10 hover:bg-accent-500/15 border border-accent-500/30 rounded-2xl px-4 py-3 transition text-left ${className}`}
    >
      <span className="w-9 h-9 rounded-xl bg-accent-500/20 flex items-center justify-center shrink-0">
        <Play className="w-4 h-4 text-accent-400 theme-light:text-accent-800" aria-hidden="true" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-xs text-accent-400 theme-light:text-accent-800 font-medium">
          {label}
        </span>
        <span className="block text-sm font-semibold text-white truncate">{title}</span>
      </span>
    </button>
  )
}
