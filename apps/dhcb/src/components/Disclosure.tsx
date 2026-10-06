// Disclosure — khối gập/mở dùng `<details>`/`<summary>` gốc của HTML.
//
// VÌ SAO (audit 2026-09-30 M22, changelog 0500): trang chi tiết hướng Lập trình dài 12.118px ở
// 390px (14 màn) — phần lớn là danh sách module của từng chặng và bốn khối kiến trúc, đọc khi CẦN
// chứ không phải đọc lướt. Gập lại giữ nội dung nhưng trả lại nhịp trang: người học thấy ngay
// bốn chặng và nút vào học.
//
// Dùng `<details>` gốc thay vì tự dựng nút + state: bàn phím (Enter/Space), trạng thái mở/đóng
// đọc cho trình đọc màn hình, tìm trong trang (Ctrl+F tự mở khối chứa từ khoá ở Chromium) đều có
// sẵn, không có JS nào để hỏng. Viền lấy nét lấy từ luật chung `summary:focus-visible` của
// `index.css`.
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface DisclosureProps {
  /** Dòng tóm tắt luôn hiện — nói rõ bên trong có gì và bao nhiêu ("Xem 5 module của chặng"). */
  summary: ReactNode
  children: ReactNode
  /** Mở sẵn khi tải trang. Mặc định đóng. */
  defaultOpen?: boolean
  /** Class cho khung ngoài (nền/viền theo bề mặt nơi đặt khối). */
  className?: string
}

export default function Disclosure({
  summary,
  children,
  defaultOpen = false,
  className = 'rounded-2xl border border-zinc-800 bg-zinc-950',
}: DisclosureProps) {
  return (
    <details className={`group ${className}`} open={defaultOpen || undefined}>
      {/* `list-none` + ẩn marker: thay tam giác mặc định bằng mũi tên xoay, cùng hình ở mọi
          trình duyệt. `tap-44-y`: cả dòng tóm tắt là vùng chạm ≥ 44px. */}
      <summary className="tap-44-y flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-content [&::-webkit-details-marker]:hidden">
        <span>{summary}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-content-secondary transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <div className="space-y-3 px-4 pb-4">{children}</div>
    </details>
  )
}
