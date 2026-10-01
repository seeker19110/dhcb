// OutlinePrevNext — hai nút "← Bài trước / Bài sau →" tính TỪ cây mục lục đang mở.
//
// Đặc tả S07-2 AC-14. Vì sao không để mỗi trang tự tính: thứ tự bài là thuộc tính của CÂY
// (đã sắp pre-order, đã biết bài nào khoá), nên tính ở `prevNext` của `@dhcb/core-learner` là
// đúng một chỗ cho mọi môn. Bài khoá bị bỏ qua — nút "Bài sau" không bao giờ dẫn vào ổ khoá.
//
// Bài đầu/cuối thì ẩn hẳn nút tương ứng, KHÔNG để nút xám `disabled`: một nút bấm không ăn là
// lời hứa suông, người dùng bấm rồi tự hỏi mình làm sai gì.
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Outline } from '@dhcb/core-contracts/outline'
import { prevNext } from '@dhcb/core-learner/outline/outlineNav'

export interface OutlinePrevNextProps {
  outline: Outline | undefined
  /** Mã bài đang mở. Không nằm trong cây → không vẽ gì. */
  contentId: string | undefined
  /**
   * Chữ trên nút — mặc định tiếng Việt. Bài hội thoại tiếng Anh truyền bản tiếng Anh khi học
   * viên học chiều B (giao diện tiếng Anh), giữ nguyên MỘT khuôn nút cho mọi môn.
   */
  labels?: { nav: string; prev: string; next: string }
}

const NHAN_MAC_DINH = { nav: 'Bài trước và bài sau', prev: 'Bài trước', next: 'Bài sau' }

export default function OutlinePrevNext({
  outline,
  contentId,
  labels = NHAN_MAC_DINH,
}: OutlinePrevNextProps) {
  if (!outline || contentId === undefined) return null
  const { prev, next } = prevNext(outline, contentId)
  if (!prev && !next) return null

  const lop =
    'tap-44 inline-flex min-h-[44px] max-w-[48%] items-center gap-1.5 rounded-2xl border border-line-strong bg-surface-card px-4 py-2.5 font-semibold text-content transition'

  return (
    <nav aria-label={labels.nav} className="flex items-center justify-between gap-3 pt-2">
      {prev?.href ? (
        <Link to={prev.href} className={lop}>
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2 break-words text-left">
            {labels.prev}: {prev.title}
          </span>
        </Link>
      ) : (
        // Ô giữ chỗ rỗng để nút "Bài sau" vẫn nằm sát mép phải khi không có bài trước.
        <span />
      )}
      {next?.href && (
        <Link to={next.href} className={lop}>
          <span className="line-clamp-2 break-words text-right">
            {labels.next}: {next.title}
          </span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </Link>
      )}
    </nav>
  )
}
