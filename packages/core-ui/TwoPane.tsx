// packages/core-ui/TwoPane.tsx — Bố cục hai cột "nội dung + cột ngữ cảnh" cho desktop.
//
// VÌ SAO CẦN (đo 2026-09-02): đúng công thức này đang được CHÉP TAY ở 6 trang (Home, Dashboard,
// CefrLevelPage, Chat, Speaking, Writing), với bề rộng cột phải lệch nhau giữa các bản sao
// (`w-72 xl:w-80` ở chỗ này, `w-80 xl:w-96` ở chỗ kia). Sáu bản sao nghĩa là mọi cải tiến về
// sau phải sửa sáu lần và chắc chắn sẽ có chỗ bị bỏ sót.
//
// TƯ TƯỞNG THIẾT KẾ: trên desktop, chỗ thừa KHÔNG dùng để kéo dài dòng chữ (dòng dài quá làm
// mắt mất dấu khi xuống hàng) mà dùng để đặt thứ đang hỗ trợ việc chính — mục lục, tiến độ,
// phần sửa lỗi. Đó là "chiều sâu thay vì chiều rộng".
//
// BẤT BIẾN QUAN TRỌNG — vì sao nhận `isDesktop` từ ngoài thay vì tự dùng `lg:hidden`:
// ẩn bằng CSS vẫn để NGUYÊN nội dung trong DOM ở cả hai nhánh. Bài học đã trả giá thật ở
// changelog `0199`: trình đọc màn hình đọc nội dung hai lần, và Playwright báo strict-mode
// violation vì tìm thấy hai phần tử trùng. Vì vậy nhánh desktop phải được quyết ở JS
// (`useIsDesktopViewport()` phía app) và chỉ MỘT nhánh được dựng.
import { useId, useRef, type ReactNode } from 'react'

export interface TwoPaneProps {
  /** Cột chính. */
  children: ReactNode
  /** Cột phụ — chỉ dựng khi `isDesktop` là true. Bỏ trống thì không có cột nào. */
  rail?: ReactNode
  /**
   * Có đang ở desktop không. Truyền từ `useIsDesktopViewport()` của app.
   * Cố ý KHÔNG tự đo bên trong: `packages/` không được phụ thuộc hook của `apps/`, và để
   * app giữ một nguồn sự thật duy nhất về ngưỡng 1024px.
   */
  isDesktop: boolean
  /** Bề rộng cột phụ. `normal` cho mục lục/tiến độ, `wide` cho bảng sửa lỗi nhiều chữ. */
  railWidth?: 'normal' | 'wide'
  /** Nhãn cho vùng cột phụ (đọc bởi trình đọc màn hình). */
  railLabel?: string
  /**
   * Cột phụ đứng bên nào. Mặc định `right` — dùng cho cột NGỮ CẢNH (hỗ trợ việc đang làm).
   *
   * `left` dành cho bố cục master–detail, nơi cột phụ là DANH SÁCH ĐỂ CHỌN: mắt người đọc từ
   * trái sang, nên thứ "chọn trước rồi mới xem" phải đứng trước thứ được chọn. Đặt danh sách
   * bên phải sẽ buộc người dùng đọc ngược.
   */
  railSide?: 'left' | 'right'
  /**
   * Nhãn liên kết ẩn "bỏ qua cột trái" — chỉ dùng khi `railSide="left"`. Mặc định tiếng Việt;
   * truyền vào để đổi theo ngôn ngữ giao diện.
   */
  skipRailLabel?: string
}

const RAIL_CLASS = {
  normal: 'w-72 xl:w-80',
  wide: 'w-80 xl:w-96',
} as const

export function TwoPane({
  children,
  rail,
  isDesktop,
  railWidth = 'normal',
  railLabel = 'Thông tin hỗ trợ',
  railSide = 'right',
  skipRailLabel = 'Bỏ qua mục lục, tới nội dung',
}: TwoPaneProps) {
  const mainId = useId()
  const mainRef = useRef<HTMLDivElement>(null)
  if (!isDesktop || !rail) return <>{children}</>

  // `sticky` + `max-h` + cuộn riêng: cột phụ bám theo khi đọc nội dung dài, nhưng không bao giờ
  // cao hơn khung nhìn nên không tự sinh thêm thanh cuộn cho cả trang. `top-20` chừa đúng chiều
  // cao header sticky (h-14) cộng khoảng thở.
  const asideEl = (
    <aside
      aria-label={railLabel}
      className={`sticky top-20 max-h-[calc(100dvh-6rem)] shrink-0 overflow-y-auto ${RAIL_CLASS[railWidth]}`}
    >
      {rail}
    </aside>
  )
  // `tabIndex={-1}`: nhận tiêu điểm bằng mã lệnh (đích của liên kết bỏ qua), không thêm điểm dừng Tab.
  const mainEl = (
    <div id={mainId} ref={mainRef} tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
      {children}
    </div>
  )

  // [2026-09-25] Cột trái (mục lục môn/khoá) đứng TRƯỚC nội dung trong DOM, và nằm TRONG `<main>`
  // nên liên kết "Bỏ qua tới nội dung chính" không qua được nó. Đo thật ở 1440px: bài Vật lí mất
  // ~20 điểm dừng Tab trong cây mục lục mới tới "Trong bài". Liên kết này vô hình cho tới khi
  // nhận tiêu điểm (cùng khuôn `SkipLink`, WCAG 2.4.1). Xử lý bằng mã thay vì để trình duyệt
  // theo `href`: trang bài đọc `location.hash` làm đích điều hướng trong bài, một hash lạ sẽ bị
  // coi là đích sai và đẩy tiêu điểm về đầu bài, lại còn làm bẩn URL chia sẻ.
  const skipEl =
    railSide === 'left' ? (
      <a
        href={`#${mainId}`}
        onClick={(e) => {
          e.preventDefault()
          // `preventScroll`: cột nội dung vốn đã trong khung nhìn; để trình duyệt tự cuộn thì
          // phần tử đầu cột bị đẩy lên DƯỚI header sticky (đo ở ảnh 1440px — liên kết quay lại
          // bị che, WCAG 2.4.11).
          mainRef.current?.focus({ preventScroll: true })
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-accent-500 focus:text-[#09090b] focus:font-semibold focus:text-sm focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-focus-ring"
      >
        {skipRailLabel}
      </a>
    ) : null

  // Thứ tự trong DOM đi theo thứ tự thị giác (không dùng `order-*` của CSS để đảo): trình đọc
  // màn hình và phím Tab đi theo DOM, nên đảo bằng CSS sẽ làm hai luồng đó lệch nhau.
  return (
    <div className="relative flex items-start gap-6">
      {skipEl}
      {railSide === 'left' ? asideEl : mainEl}
      {railSide === 'left' ? mainEl : asideEl}
    </div>
  )
}
