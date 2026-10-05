// Danh sách 4 "Studio" (không gian nền tảng) dùng CHUNG cho mọi thanh điều hướng.
//
// [2026-09-20] KHÔNG còn studio `career` ("Sự Nghiệp & Khởi Nghiệp") và `worklife`
// ("Công Việc & Đời Sống"): hai trụ Sự nghiệp/Khởi nghiệp và nửa "Đời sống" đã bị GỠ HẲN khỏi
// giao diện theo quyết định của chủ dự án. Nửa "Công việc" được giữ lại, đổi tên hiển thị thành
// "Ghi chú" và đứng riêng thành MỘT studio cấp 1 ở `/ghi-chu` (không còn là tab con của ai).
//
// [Slice 02 Góc học tập, 2026-09-15] KHÔNG còn studio `english`: Tiếng Anh là MỘT MÔN ngang hàng
// trong Góc học tập (`navTree.ts` → SUBJECT_CHILDREN), trang tổng quan ở `/goc-hoc-tap/english`.
// Thêm lại một mục `english` ở đây là dựng lại đúng thứ đặc tả bỏ đi — `studios.test.ts` canh.
//
// dropdown "Studio" ở header (components/Layout.tsx) và sidebar desktop
// (components/DesktopSidebar.tsx). Trước đây danh sách này nằm riêng trong Layout.tsx;
// tách ra đây để hai nơi không bao giờ lệch nhau khi thêm/bớt studio.
import { Sparkles, Dumbbell, Calculator, StickyNote, type LucideIcon } from 'lucide-react'

export interface Studio {
  id: string
  title: string
  subtitle: string
  to: string
  icon: LucideIcon
  badge: string
  /** Lớp màu cho ô biểu tượng — nền + viền + màu chữ của riêng studio đó.
   *  BẮT BUỘC kèm biến thể `theme-light:` cho màu CHỮ: sắc độ -400 đọc tốt trên nền tối
   *  nhưng rớt AA hẳn ở 3 theme nền sáng (trình duyệt thật cho thấy biểu tượng studio
   *  trông như bị vô hiệu hoá ở Blue sky — audit 2026-08-31 mục B17). Nền/viền dùng độ
   *  mờ thấp nên không cần đổi. */
  color: string
}

export const STUDIOS: Studio[] = [
  {
    id: 'companion',
    title: 'Bạn Đồng Hành',
    subtitle: 'Trò chuyện, gợi ý việc học, nhớ ngữ cảnh của bạn',
    to: '/ban-dong-hanh',
    icon: Sparkles,
    badge: 'AI',
    color:
      'text-amber-400 theme-light:text-amber-800 bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60',
  },
  {
    id: 'practice',
    title: 'Phòng luyện tập',
    subtitle: 'Đa môn · bài tập · sửa lỗi · 4 kỹ năng',
    to: '/luyen-tap',
    icon: Dumbbell,
    badge: 'Đa Môn AI',
    color:
      'text-sky-400 theme-light:text-sky-800 bg-sky-500/10 border-sky-500/30 hover:border-sky-500/60',
  },
  {
    id: 'subjects',
    title: 'Góc học tập',
    subtitle: 'Toán, Lý, Hóa, Sinh & thí nghiệm mô phỏng',
    to: '/goc-hoc-tap',
    icon: Calculator,
    badge: 'Bài tập',
    color:
      'text-blue-400 theme-light:text-blue-800 bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60',
  },
  {
    id: 'notes',
    title: 'Ghi chú',
    subtitle: 'Việc cần làm, dự án, tài liệu — bảng Kanban',
    to: '/ghi-chu',
    icon: StickyNote,
    badge: 'Ghi chú',
    color:
      'text-rose-400 theme-light:text-rose-800 bg-rose-500/10 border-rose-500/30 hover:border-rose-500/60',
  },
]

/** Trang KHÔNG có thanh điều hướng nào (đăng nhập, onboarding) — dùng chung cho
 *  BottomNav (mobile) và DesktopSidebar (desktop) để hai bên ẩn/hiện y hệt nhau. */
export const NAV_HIDDEN_PATHS = ['/login', '/onboarding']
