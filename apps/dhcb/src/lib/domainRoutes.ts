// domainRoutes — dựng URL của trụ "Ghi chú" (trước đây là trụ Công việc) ở MỘT chỗ duy nhất.
//
// VÌ SAO: trước đợt "Gom URL trùng" (App.tsx, docs/research/nang-tam-du-an-2026-08-24.md §4)
// mỗi trụ có tới 4 URL cùng render một trang. File này là một nguồn duy nhất cho các URL đó,
// tương đương `programmingRoutes.ts` của môn Lập trình.
//
// [2026-09-20] Trụ Sự nghiệp, Khởi nghiệp và nửa "Đời sống" đã bị GỠ HẲN khỏi giao diện theo
// quyết định của chủ dự án, nên mọi hàm dựng URL của chúng (`duongDanSuNghiep`,
// `duongDanKhoiNghiep`, `duongDanDoiSong`, `duongDanCareerInterview`, `duongDanStartupCanvas`,
// `duongDanLifeWheel`, `CAREER_STUDIO_PATH`) đã bị xoá cùng với trang của chúng. Nửa "Công việc"
// giữ lại, đổi tên hiển thị thành "Ghi chú" và đứng riêng ở `/ghi-chu` — KHÔNG còn tham số
// `?muc=` vì không còn tab nào để chọn.
//
// Base path lấy từ `STUDIOS` — KHÔNG lặp lại chuỗi ở đây — để đổi URL gốc chỉ cần sửa một chỗ
// (`lib/studios.ts`).
import { STUDIOS } from './studios'

function studioPath(id: string): string {
  const st = STUDIOS.find((s) => s.id === id)
  if (!st) throw new Error(`Không tìm thấy studio "${id}" trong lib/studios.ts`)
  return st.to
}

/** Trang "Ghi chú" (việc cần làm, dự án, cuộc họp, tài liệu). */
export const NOTES_STUDIO_PATH = studioPath('notes')

/** Trang "Ghi chú" — điểm vào chính. */
export function duongDanGhiChu(): string {
  return NOTES_STUDIO_PATH
}

/** Bảng Kanban việc cần làm (công cụ của trang Ghi chú). */
export function duongDanGhiChuKanban(): string {
  return '/ghi-chu/kanban'
}
