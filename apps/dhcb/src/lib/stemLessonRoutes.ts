// stemLessonRoutes.ts — MỘT chỗ duy nhất biết bốn môn STEM có những gì và URL của chúng ra sao.
//
// Quy ước URL mang tiêu đề (CLAUDE.md mục 7): đường dẫn tới một bài học phải là
// `<mã>--<tiêu đề đã slug hoá>`, và không được tự ghép chuỗi URL rải rác nhiều nơi — mọi nơi
// tạo liên kết đều gọi hàm ở đây, theo đúng khuôn `lib/programmingRoutes.ts` của môn Lập trình.
import { buildSlugSegment, idFromSlugSegment } from '@core/slug'
import type { StemLessonLoader } from '@dhcb/core-learner/stemLessonLoader'
import type { StemLessonLike, StemSubjectId } from '@dhcb/core-contracts/stemLesson'
import { MATH_LOADER } from '@dhcb/subject-math/lessonsLoader'
import { PHYSICS_LOADER } from '@dhcb/subject-physics/lessonsLoader'
import { CHEM_LOADER } from '@dhcb/subject-chemistry/lessonsLoader'
import { BIOLOGY_LOADER } from '@dhcb/subject-biology/lessonsLoader'
import { sapLop } from './stemContinue'

export interface StemSubject {
  id: StemSubjectId
  /** Tên môn hiển thị cho người học. */
  label: string
  loader: StemLessonLoader<StemLessonLike>
  /** Các lớp môn này có bài, theo thứ tự hiển thị. */
  grades: string[]
  /** Lớp chọn sẵn khi mở danh sách bài, và lớp bắt đầu của người chưa học bài nào. Luôn nằm
   *  trong `grades`. */
  defaultGrade: string
}

/** Lớp mặc định của bốn môn: cấp 3 là nơi bốn môn cùng có bài. */
const LOP_MAC_DINH = '10'

/** Các lớp đã có ít nhất một bài chương trình chuẩn, tăng dần theo SỐ ("6" < "10"). Suy từ
 *  chỉ mục bài chứ không ghi cứng: Toán mở lớp 6–9 theo từng PR nội dung, và mỗi lớp chỉ hiện ra
 *  khi đã có bài — không bao giờ có nút "Lớp 7" dẫn tới danh sách trống. */
export function lopCoBai(index: readonly { grade: string; track: string }[]): string[] {
  return sapLop([...new Set(index.filter((s) => s.track === 'core').map((s) => s.grade))])
}

/** Lớp mặc định nếu môn có bài ở lớp đó, ngược lại là lớp đầu tiên có bài. */
export function chonLopMacDinh(grades: readonly string[]): string {
  return grades.includes(LOP_MAC_DINH) ? LOP_MAC_DINH : (grades[0] ?? LOP_MAC_DINH)
}

function monStem(
  id: StemSubjectId,
  label: string,
  loader: StemLessonLoader<StemLessonLike>,
): StemSubject {
  const grades = lopCoBai(loader.index)
  return { id, label, loader, grades, defaultGrade: chonLopMacDinh(grades) }
}

export const STEM_SUBJECTS: Record<StemSubjectId, StemSubject> = {
  mathematics: monStem('mathematics', 'Toán', MATH_LOADER as StemLessonLoader<StemLessonLike>),
  physics: monStem('physics', 'Vật lí', PHYSICS_LOADER as StemLessonLoader<StemLessonLike>),
  chemistry: monStem('chemistry', 'Hoá học', CHEM_LOADER as StemLessonLoader<StemLessonLike>),
  biology: monStem('biology', 'Sinh học', BIOLOGY_LOADER as StemLessonLoader<StemLessonLike>),
}

/** Môn này có bài học theo khuôn STEM không (dùng để quyết định có hiện nút "Bài học"). */
export function getStemSubject(subjectId: string | undefined): StemSubject | undefined {
  if (!subjectId) return undefined
  return STEM_SUBJECTS[subjectId as StemSubjectId]
}

/** Đường dẫn danh sách bài học của một môn. */
export function duongDanDanhSachBai(subjectId: StemSubjectId): string {
  return `/goc-hoc-tap/${subjectId}/bai-hoc`
}

/** Đường dẫn một bài học — mã giữ nguyên, phần slug chỉ để người đọc và máy tìm kiếm hiểu. */
export function duongDanBaiHoc(subjectId: StemSubjectId, lessonId: string, title: string): string {
  return `/goc-hoc-tap/${subjectId}/bai-hoc/${buildSlugSegment(lessonId, title)}`
}

/** Lấy lại mã bài từ đoạn URL, bỏ qua phần mô tả phía sau `--`. */
export function maBaiTuUrl(segment: string | undefined): string {
  return segment ? idFromSlugSegment(segment) : ''
}

const NHAN_CAP: Record<string, string> = {
  'hsg-truong': 'Cấp trường',
  'hsg-tinh': 'Cấp tỉnh',
  'hsg-quoc-gia': 'Cấp quốc gia',
}

/** Tên tiếng Việt của một cấp chuyên đề bồi dưỡng học sinh giỏi. */
export function nhanCapHsg(tier: string | undefined): string {
  return tier ? (NHAN_CAP[tier] ?? tier) : ''
}
