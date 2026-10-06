// navTree — CÂY điều hướng dùng chung: mỗi mục điều hướng có thể có mục con ĐÓNG/MỞ được.
//
// Vì sao có file này: trước đây sidebar là danh sách PHẲNG, nên muốn vào môn Toán phải đi
// hai chặng (bấm "Góc học tập" → chờ trang danh sách tải → bấm thẻ môn). Các môn học là nơi
// người dùng ở lâu nhất, mà lại nằm sâu nhất. Nay mục cha mở ra ngay trong thanh điều hướng.
//
// Dữ liệu để RIÊNG khỏi component (DesktopSidebar.tsx) vì hai lý do: cây này còn dùng cho
// thanh điều hướng khác khi cần, và phần logic đóng/mở là hàm thuần nên test được mà không
// phải dựng React.
import {
  Atom,
  BookMarked,
  BookOpen,
  BookText,
  Calculator,
  Code2,
  Dumbbell,
  FlaskConical,
  Headphones,
  Languages,
  Leaf,
  Mic,
  MessagesSquare,
  NotebookPen,
  PenLine,
  Quote,
  Route as RouteIcon,
  Swords,
  type LucideIcon,
} from 'lucide-react'
import { ENGLISH_PATHS, underPrefix } from './navPaths'
import { PROGRAMMING_PREFIX } from './programmingRoutes'
import {
  duongDanBaiHocAnh,
  duongDanCauThongDung,
  duongDanLuyenNghe,
  duongDanLuyenNoi,
  duongDanLuyenViet,
  duongDanLoTrinh,
  duongDanOnThi,
  duongDanSoTayLoiSai,
  duongDanThuThach,
  duongDanTroTruyen,
  duongDanTruyen,
  duongDanTuDien,
} from './englishRoutes'

/** Một mục CON trong nhóm đóng/mở được. */
export interface NavChild {
  /** Nhãn hiển thị. */
  label: string
  icon: LucideIcon
  /** Đường dẫn trong app. Bỏ trống khi dùng `subjectId` (trụ Học tập có thể ở origin khác). */
  to?: string
  /** Id môn học — render bằng <SubjectsLink>, xem lib/subjectsHost.ts. */
  subjectId?: string
  /** Tiền tố đường dẫn làm mục con này sáng. */
  paths: readonly string[]
  /**
   * Mục con CẤP 2 (mở/đóng được). [Slice 02] Công cụ của môn Tiếng Anh nằm dưới mục "Tiếng Anh"
   * trong nhóm Góc học tập — quyết định chủ dự án 2026-09-15: "di chuyển, không xoá".
   */
  children?: readonly NavChild[]
}

/**
 * Công cụ của môn Tiếng Anh — cấp 2 dưới mục "Tiếng Anh" trong nhóm Góc học tập.
 *
 * [Slice 03] Đủ 12 công cụ có trang riêng, theo THỨ TỰ LUỒNG HỌC (lộ trình → bài → 4 kỹ năng →
 * tra cứu → ôn → thử thách). Trước đây 6 công cụ trong số này nằm dưới "Luyện tập" (đa môn) —
 * sai ngữ nghĩa và làm đứng ở /tro-truyen sáng nhầm "Luyện tập". Không đưa /placement (một lần),
 * /cai-dat (cài đặt môn) và /tu-vung/:word (trang con Từ điển) lên sidebar — chúng ở trang tổng
 * quan/breadcrumb. Xem docs/specs/2026-09-15-goc-hoc-tap-03-04-*.md §2.1.
 */
export const ENGLISH_CHILDREN: NavChild[] = [
  { label: 'Lộ trình CEFR', icon: RouteIcon, to: duongDanLoTrinh(), paths: [duongDanLoTrinh()] },
  {
    label: 'Bài hội thoại mẫu',
    icon: BookOpen,
    to: duongDanBaiHocAnh(),
    paths: [duongDanBaiHocAnh()],
  },
  {
    label: 'Trò chuyện',
    icon: MessagesSquare,
    to: duongDanTroTruyen(),
    paths: [duongDanTroTruyen()],
  },
  { label: 'Luyện nói', icon: Mic, to: duongDanLuyenNoi(), paths: [duongDanLuyenNoi()] },
  { label: 'Luyện viết', icon: PenLine, to: duongDanLuyenViet(), paths: [duongDanLuyenViet()] },
  { label: 'Luyện nghe', icon: Headphones, to: duongDanLuyenNghe(), paths: [duongDanLuyenNghe()] },
  { label: 'Từ điển', icon: BookMarked, to: duongDanTuDien(), paths: [duongDanTuDien()] },
  {
    label: 'Câu thông dụng',
    icon: Quote,
    to: duongDanCauThongDung(),
    paths: [duongDanCauThongDung()],
  },
  {
    label: 'Truyện song ngữ',
    icon: BookText,
    to: duongDanTruyen(),
    paths: [duongDanTruyen()],
  },
  {
    label: 'Sổ tay lỗi sai',
    icon: NotebookPen,
    to: duongDanSoTayLoiSai(),
    paths: [duongDanSoTayLoiSai()],
  },
  { label: 'Ôn thi', icon: Dumbbell, to: duongDanOnThi(), paths: [duongDanOnThi()] },
  { label: 'Thử thách', icon: Swords, to: duongDanThuThach(), paths: [duongDanThuThach()] },
]

/**
 * Mục con CẤP 3 "theo lớp" cho 4 môn STEM (Toán/Lý/Hoá/Sinh) — trỏ tới đúng trang môn kèm
 * `?grade=`, `SubjectDetail.tsx` đã đọc query này để chọn sẵn đúng lớp (dòng ~164), nên đây là
 * LINK SÂU thật, không phải danh sách trang trí. 4 mốc khớp đúng khoá `StemGradeCurriculum.grade`
 * ở `data/stemCurriculum.ts` (`grade_10`/`grade_11`/`grade_12`/`university`).
 */
export function stemGradeChildren(subjectPath: string): NavChild[] {
  const grades: Array<[string, string]> = [
    ['grade_10', 'Lớp 10'],
    ['grade_11', 'Lớp 11'],
    ['grade_12', 'Lớp 12'],
    ['university', 'Đại học'],
  ]
  return grades.map(([grade, label]) => ({
    label,
    icon: BookOpen,
    to: `${subjectPath}?grade=${grade}`,
    // So khớp active theo TIỀN TỐ ĐƯỜNG DẪN (không gồm query) — dùng chung `subjectPath`
    // nên cả 4 lớp cùng "sáng" khi đứng ở trang môn; đó là đánh đổi chấp nhận được vì trang
    // không đổi URL khi người dùng tự bấm tab lớp khác (chỉ đổi state nội bộ).
    paths: [subjectPath],
  }))
}

/** Mục con của "Góc học tập" — 6 môn trong `packages/core-learner/subjectRegistry.ts`. */
export const SUBJECT_CHILDREN: NavChild[] = [
  {
    label: 'Tiếng Anh',
    icon: Languages,
    subjectId: 'english',
    paths: ENGLISH_PATHS,
    children: ENGLISH_CHILDREN,
  },
  {
    label: 'Toán học',
    icon: Calculator,
    subjectId: 'mathematics',
    paths: ['/goc-hoc-tap/mathematics', '/mathematics'],
    children: stemGradeChildren('/goc-hoc-tap/mathematics'),
  },
  {
    label: 'Vật lí',
    icon: Atom,
    subjectId: 'physics',
    paths: ['/goc-hoc-tap/physics', '/physics'],
    children: stemGradeChildren('/goc-hoc-tap/physics'),
  },
  {
    label: 'Hóa học',
    icon: FlaskConical,
    subjectId: 'chemistry',
    paths: ['/goc-hoc-tap/chemistry', '/chemistry'],
    children: stemGradeChildren('/goc-hoc-tap/chemistry'),
  },
  {
    label: 'Sinh học',
    icon: Leaf,
    subjectId: 'biology',
    paths: ['/goc-hoc-tap/biology', '/biology'],
    children: stemGradeChildren('/goc-hoc-tap/biology'),
  },
  {
    label: 'Lập trình',
    icon: Code2,
    subjectId: 'programming',
    paths: [PROGRAMMING_PREFIX, '/lap-trinh'],
  },
]

const STORAGE_KEY = 'ui_sidebar_groups'

/** Nhóm nào đang MỞ (đọc từ localStorage). Hỏng/không đọc được → coi như chưa có nhóm nào. */
export function readOpenGroups(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    // localStorage bị chặn hoặc JSON hỏng: mở mặc định, không làm vỡ trang.
    return []
  }
}

export function writeOpenGroups(ids: readonly string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // Không lưu được thì vẫn đóng/mở được trong phiên hiện tại — chỉ mất tính ghi nhớ.
  }
}

/** Bật/tắt một nhóm trong danh sách đang mở (hàm THUẦN — dễ test, không đụng storage). */
export function toggleGroup(open: readonly string[], id: string): string[] {
  return open.includes(id) ? open.filter((x) => x !== id) : [...open, id]
}

/**
 * Nhóm có mục con nào khớp đường dẫn hiện tại không.
 *
 * Dùng để TỰ MỞ nhóm chứa trang đang xem: người dùng phải thấy mình đang đứng ở đâu trong
 * cây, kể cả khi vào thẳng bằng URL.
 */
export function groupContainsPath(children: readonly NavChild[], pathname: string): boolean {
  return children.some(
    (c) =>
      c.paths.some((p) => underPrefix(pathname, p)) ||
      (c.children ? groupContainsPath(c.children, pathname) : false),
  )
}

/** Mục con này (hoặc một mục cấp 2 của nó) có khớp đường dẫn hiện tại không. */
export function childIsActive(child: NavChild, pathname: string): boolean {
  return child.paths.some((p) => underPrefix(pathname, p))
}
