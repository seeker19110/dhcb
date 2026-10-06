// packages/core-ui/cardStyles.ts — Phân cấp chữ của MỤC và THẺ, dùng chung cho các trang.
//
// VÌ SAO CẦN (audit 2026-09-30 M17 + mục 7, changelog 0500): ở trang Luyện tập, tiêu đề MỤC
// (`h2`, 12px, ba màu khác nhau: xám + chấm xanh, accent, blue-300) NHỎ HƠN tiêu đề THẺ nằm bên
// trong nó (`h3`, 14px) — thứ bậc thị giác ngược thứ bậc tài liệu; hai thẻ nổi bật đứng liền nhau
// (Sổ tay lỗi · Đấu trường) thì một thẻ tiêu đề 16px, thẻ kia 18px, mô tả 12px và 14px. Mỗi trang
// tự ghép cỡ chữ nên lệch nhau ngay cả khi đứng cạnh nhau.
//
// Ba hằng dưới đây là thang DUY NHẤT cho ba cấp đó. Màu lấy token ngữ nghĩa `content*` (đã đo
// AAA ≥ 7:1 ở cả 3 theme — CLAUDE.md mục 4.5), không lấy bậc màu `zinc-*`/`blue-*`.
// Không phải component: tiêu đề cần đúng thẻ `h2`/`h3` theo ngữ cảnh trang, nên trang tự chọn
// thẻ và chỉ lấy class ở đây (cùng lý do `buttonClass` tách khỏi `Button`).

/** Tiêu đề một MỤC trong trang (`h2`). Lớn hơn tiêu đề thẻ thường nằm trong mục. */
export const SECTION_TITLE_CLASS = 'text-base font-semibold text-content'

/** Tiêu đề thẻ NỔI BẬT đứng riêng ở cấp mục (banner có nút hành động). */
export const FEATURE_TITLE_CLASS = 'text-base font-bold text-content'

/** Mô tả của thẻ nổi bật: chữ phụ AAA, giới hạn bề ngang để dòng không kéo dài hết thẻ. */
export const FEATURE_DESC_CLASS =
  'mt-0.5 max-w-xl text-xs leading-relaxed text-content-secondary sm:text-sm'
