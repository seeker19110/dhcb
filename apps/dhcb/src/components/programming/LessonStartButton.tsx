// LessonStartButton — nút "Học bài: <tên bài>" dùng chung cho trang bậc, trang khoá và trang chặng
// lộ trình môn Lập trình (changelog 0501, audit 2026-09-30 M17).
//
// VÌ SAO: ba trang từng chép tay cùng một chuỗi class nút accent đặc kéo hết bề ngang — trang bậc
// P1 có 10 nút chính giống hệt nhau xếp chồng (luật "một nút chính mỗi màn hình" của
// `buttonStyles.ts`), mỗi nút dài ~660px ở 1440px. Nay là biến thể `secondary` (màu thương hiệu
// nền nhạt), từ `sm` theo bề ngang nội dung. Tên bài dài vẫn xuống dòng được (không dùng chiều
// cao cố định của `buttonClass`, xem `buttonVariantClass`).
import { CheckCircle2, Play } from 'lucide-react'
import { buttonVariantClass } from '@core/buttonStyles'

interface LessonStartButtonProps {
  title: string
  done: boolean
  onClick: () => void
}

export default function LessonStartButton({ title, done, onClick }: LessonStartButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap-44 flex w-full max-w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-semibold transition-colors sm:w-auto ${buttonVariantClass('secondary')}`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <Play className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 break-words">Học bài: {title}</span>
      </span>
      {done && <CheckCircle2 className="h-4 w-4 shrink-0" role="img" aria-label="Đã học xong" />}
    </button>
  )
}
