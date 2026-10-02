// TrongBaiHoiThoai — mục "Trong bài" của một bài hội thoại mẫu (S09c, spec §2.7 mục 4).
//
// Các PHẦN của bài đang mở (Đầu bài · Hội thoại · từng lượt · Kết quả), KHÔNG phải danh sách
// bài. Mẫu disclosure của WAI-ARIA APG, giống bản STEM (S09b) nhưng dựng riêng cho English vì
// bản STEM chưa vào `main` lúc làm việc này và có thêm lưới lượt thoại:
//  · Nút gọn nằm trên thanh điều khiển (luôn trong tầm tay: sticky ở desktop, cố định ở mobile)
//    → mở danh sách = kích hoạt 1, chọn đích = kích hoạt 2 (AC01: ≤2 kích hoạt).
//  · Chọn đích: đóng danh sách rồi TRANG focus đích — component không trả focus về nút mở.
//  · Escape / nút Đóng khi chưa chọn: trả focus về nút mở.
//  · Đóng = không render, nên nội dung bị đóng không bao giờ nhận focus.
// Component chỉ trình bày + báo lựa chọn qua `onChon`; đổi URL/focus/cuộn là việc của trang.
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import { ListOrdered } from 'lucide-react'
import { NEO_BAI_ANH, neoLuot } from '../../../../lib/englishLessonAnchors'

export interface LuotTrongBai {
  /** Số thứ tự lượt theo nguồn, bắt đầu 1. */
  soThuTu: number
  /** Nhãn đầy đủ cho trình đọc màn hình: "Lượt N — người nói". */
  nhan: string
}

export function TrongBaiHoiThoai({
  isA,
  luot,
  onChon,
}: {
  isA: boolean
  luot: readonly LuotTrongBai[]
  /** Id đích (không kèm `#`). */
  onChon: (id: string) => void
}) {
  const idDanhSach = `${useId()}-trong-bai`
  const [mo, setMo] = useState(false)
  const nutRef = useRef<HTMLButtonElement>(null)
  const dauTienRef = useRef<HTMLAnchorElement>(null)
  const nhanKhoi = isA ? 'Trong bài' : 'In this lesson'

  // Mở ra thì đưa focus vào mục đầu để Tab đi tiếp trong danh sách, không phải Tab qua cả trang.
  useEffect(() => {
    if (mo) dauTienRef.current?.focus()
  }, [mo])

  const dongVeNut = useCallback(() => {
    setMo(false)
    nutRef.current?.focus()
  }, [])

  // Escape trên BẤT KỲ phần tử tương tác nào của khối → đóng + về nút mở.
  const phim = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !mo) return
      e.stopPropagation()
      dongVeNut()
    },
    [mo, dongVeNut],
  )

  const bam = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, id: string) => {
      // Giữ hành vi trình duyệt cho Ctrl/⌘/Shift/chuột giữa (mở tab mới, chép link…).
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      // Đóng TRƯỚC, trang focus đích SAU (effect của trang chạy sau lượt render này).
      setMo(false)
      onChon(id)
    },
    [onChon],
  )

  const phan = [
    { id: NEO_BAI_ANH.dauBai, nhan: isA ? 'Đầu bài' : 'Lesson start' },
    { id: NEO_BAI_ANH.hoiThoai, nhan: isA ? 'Hội thoại' : 'Dialogue' },
    { id: NEO_BAI_ANH.ketQua, nhan: isA ? 'Kết quả' : 'Result' },
  ]
  const lopLink =
    'tap-44 inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 underline-offset-4 hover:underline'

  // Trả về fragment: nút là một mục của hàng flex-wrap trên thanh điều khiển (không chiếm cả
  // một dòng riêng), còn danh sách khi mở là `basis-full order-last` → xuống dòng riêng ở CUỐI
  // thanh, không chen giữa các nút phát/tốc độ.
  return (
    <>
      <button
        ref={nutRef}
        type="button"
        aria-expanded={mo}
        aria-controls={idDanhSach}
        onClick={() => setMo((v) => !v)}
        onKeyDown={phim}
        className="tap-44 flex items-center justify-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition"
      >
        <ListOrdered className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {/* Màn hẹp hơn 390px (2026-10-02): chỉ còn biểu tượng để cả thanh điều khiển vừa MỘT hàng;
            chữ vẫn là tên của nút cho trình đọc màn hình (`sr-only`), `tap-44` giữ vùng chạm 44px. */}
        <span className="sr-only min-[390px]:not-sr-only">{nhanKhoi}</span>
      </button>
      {mo && (
        <nav
          id={idDanhSach}
          aria-label={nhanKhoi}
          className="order-last basis-full rounded-xl border border-zinc-800 bg-zinc-950 p-3"
        >
          <ul className="flex flex-wrap gap-2">
            {phan.map((p, i) => (
              <li key={p.id}>
                <a
                  href={`#${p.id}`}
                  ref={i === 0 ? dauTienRef : undefined}
                  onClick={(e) => bam(e, p.id)}
                  onKeyDown={phim}
                  className={lopLink}
                >
                  {p.nhan}
                </a>
              </li>
            ))}
          </ul>
          {luot.length > 0 && (
            <>
              <p aria-hidden="true" className="mt-3 text-xs font-medium text-zinc-400">
                {isA ? 'Tới lượt' : 'Go to turn'}
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-2">
                {luot.map((l) => (
                  <li key={l.soThuTu}>
                    <a
                      href={`#${neoLuot(l.soThuTu)}`}
                      aria-label={l.nhan}
                      onClick={(e) => bam(e, neoLuot(l.soThuTu))}
                      onKeyDown={phim}
                      className={`${lopLink} min-w-[2.75rem] tabular-nums`}
                    >
                      {l.soThuTu}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          <button
            type="button"
            onClick={dongVeNut}
            onKeyDown={phim}
            className="tap-44 mt-3 inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-300 underline underline-offset-4"
          >
            {isA ? 'Đóng' : 'Close'}
          </button>
        </nav>
      )}
    </>
  )
}
