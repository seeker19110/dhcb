// stemLessonPaths.ts — đường dẫn TRANG DANH SÁCH BÀI của bốn môn STEM, tách khỏi
// `stemLessonRoutes.ts` vì file đó nạp chỉ mục bài của cả bốn môn: thanh điều hướng (có mặt ở MỌI
// trang) chỉ cần dựng link, không được kéo theo chỉ mục bài vào gói khởi động.
// `stemLessonRoutes.ts` re-export hàm này — vẫn đúng MỘT nơi dựng URL (CLAUDE.md mục 7).
import type { StemSubjectId } from '@dhcb/core-contracts/stemLesson'

/** Tham số URL chọn sẵn tab lớp ở trang danh sách bài (`?lop=9`). */
export const THAM_SO_LOP = 'lop'

/** Đường dẫn danh sách bài học của một môn; có `lop` thì trang mở sẵn đúng tab lớp đó. */
export function duongDanDanhSachBai(subjectId: StemSubjectId, lop?: string): string {
  const base = `/goc-hoc-tap/${subjectId}/bai-hoc`
  return lop ? `${base}?${THAM_SO_LOP}=${encodeURIComponent(lop)}` : base
}
