import { salesHunterLaunchUrl, showSalesHunterEntry } from '../lib/salesHunter'

interface Props {
  hostname?: string
  enabled?: unknown
}

/** A separate product entry, not an additional Learning studio or a shared session. */
export default function SalesHunterEntry({
  hostname = window.location.hostname,
  enabled = import.meta.env.VITE_SALES_HUNTER_PILOT_ENABLED,
}: Props) {
  if (!showSalesHunterEntry(hostname)) return null
  const launchUrl = salesHunterLaunchUrl(enabled)

  // Màu dùng thang `zinc`/`white` đã map sang token theme (--z-*, --c-white) nên đổi đúng theo
  // 3 theme; khối đặt ở trang chủ, cùng kiểu thẻ với "Bộ môn & không gian" (PR #1183).
  return (
    <section id="sales-hunter-entry" aria-label="Sales-Hunter trong hệ sinh thái Đồng Hành">
      <details className="rounded-3xl border border-zinc-800 bg-zinc-900/90 px-4 py-2">
        <summary className="flex min-h-11 cursor-pointer items-center text-base font-semibold text-white">
          Sales-Hunter · Ứng dụng riêng của Đồng Hành
        </summary>
        <div className="pb-2">
          <p className="mt-2 text-sm leading-relaxed text-zinc-200 read-measure">
            Theo dõi ưu đãi và bản nháp affiliate. Bản thử nghiệm đầu chỉ đọc, dành cho người vận
            hành được cấp quyền riêng; chưa mở tự động đăng bài.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-200 read-measure">
            Không dùng dữ liệu học tập, phiên đăng nhập hoặc gói thanh toán Learning.
          </p>
          {launchUrl ? (
            <a
              href={launchUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-zinc-700 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              Mở Sales-Hunter — tab mới
            </a>
          ) : (
            <p className="mt-3 text-sm font-semibold text-white read-measure">
              Chưa mở truy cập — đang chuẩn bị thử nghiệm có kiểm soát.
            </p>
          )}
        </div>
      </details>
    </section>
  )
}
