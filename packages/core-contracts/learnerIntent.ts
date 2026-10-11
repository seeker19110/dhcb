// packages/core-contracts/learnerIntent.ts — HỢP ĐỒNG "Ý ĐỊNH HỌC" của người mới.
// Đặc tả: docs/specs/2026-09-15-learning-ux-s05-bat-dau-theo-y-dinh.md §③.1.
//
// Người mới nói trong ≤ 5 câu: học MÔN gì · để làm gì · mỗi ngày bao lâu · đã quen chưa · lớp mấy.
// Từ đó hệ thống chọn ĐÚNG MỘT việc để bắt đầu.
//
// LUẬT SỐ 1 CỦA SẢN PHẨM: đây là ĐẦU VÀO để chọn việc, KHÔNG BAO GIỜ là đầu ra hiển thị. Vì vậy
// hợp đồng này cố ý KHÔNG có trường điểm/bậc/xếp hạng, và `.strict()` (qua `versionedObject`)
// khiến mọi trường lạ — kể cả `score` ai đó "tiện tay" thêm về sau — bị Zod từ chối ngay.

import { z } from 'zod'
import { versionedObject } from './version.js'

export const LEARNER_INTENT_SCHEMA_VERSION = 1

/** Id môn — đúng tập `SUPPORTED_SUBJECTS[].id` của `@dhcb/core-learner/subjectRegistry`. */
export const IntentSubjectIdSchema = z.enum([
  'english',
  'programming',
  'mathematics',
  'physics',
  'chemistry',
  'biology',
])
export type IntentSubjectId = z.infer<typeof IntentSubjectIdSchema>

/** Bốn môn STEM — chỉ nhóm này mới có câu hỏi "lớp mấy". */
export const STEM_INTENT_SUBJECT_IDS = [
  'mathematics',
  'physics',
  'chemistry',
  'biology',
] as const satisfies readonly IntentSubjectId[]
const STEM_IDS: ReadonlySet<string> = new Set<string>(STEM_INTENT_SUBJECT_IDS)

/** Môn này có phải môn STEM (theo khuôn bài học lớp 10–12) không. */
export function isStemIntentSubject(id: string): boolean {
  return STEM_IDS.has(id)
}

/** Câu 2 — "Bạn học để làm gì?" */
export const IntentPurposeSchema = z.enum(['thi_cu', 'cong_viec', 'so_thich', 'chua_ro'])
export type IntentPurpose = z.infer<typeof IntentPurposeSchema>

/** Câu 3 — phút mỗi ngày; trùng MINUTES của Onboarding (5/10/20/30) để S06 tái dùng. */
export const IntentTimeBudgetSchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(20),
  z.literal(30),
])
export type IntentTimeBudget = z.infer<typeof IntentTimeBudgetSchema>

/**
 * Câu 4 — tự khai, CHỈ để chọn việc, KHÔNG BAO GIỜ hiển thị (§③.5 T6).
 * Token cố ý KHÔNG phải chữ tiếng Việt: nếu nó lọt lên giao diện, test rò rỉ bắt được ngay.
 */
export const IntentLevelSchema = z.enum(['lv_new', 'lv_some', 'lv_solid'])
export type IntentLevel = z.infer<typeof IntentLevelSchema>

/** Câu 5 — chỉ khi có môn STEM. Khớp `grade` của `StemLessonSummary`.
 *  [2026-10-10] Thêm lớp THCS '6'–'9' (BỔ SUNG, dữ liệu cũ '10'–'12' vẫn hợp lệ) — chỉ đi cùng
 *  môn Toán, môn duy nhất có bài THCS (đặc tả `docs/specs/2026-10-10-menu-lop-thcs-va-bat-dau-6-9.md`). */
export const IntentGradeSchema = z.enum(['6', '7', '8', '9', '10', '11', '12'])
export type IntentGrade = z.infer<typeof IntentGradeSchema>

/** Lớp THCS — chỉ môn Toán có bài ở các lớp này. */
export const THCS_INTENT_GRADES: readonly IntentGrade[] = ['6', '7', '8', '9']

/** Lớp này có phải lớp THCS (6–9) không. */
export function isThcsIntentGrade(grade: string | undefined): boolean {
  return grade !== undefined && (THCS_INTENT_GRADES as readonly string[]).includes(grade)
}

/** Lớp có đi được cùng bộ môn này không — MỘT luật cho cả hợp đồng lẫn màn hỏi: cần ít nhất
 *  một môn STEM; lớp THCS còn cần môn Toán. */
export function isGradeAllowedFor(
  subjectIds: readonly string[],
  grade: string | undefined,
): boolean {
  if (grade === undefined) return true
  if (!subjectIds.some((s) => STEM_IDS.has(s))) return false
  return !isThcsIntentGrade(grade) || subjectIds.includes('mathematics')
}

export const LearnerIntentSchema = versionedObject(
  {
    /** Giữ ĐÚNG thứ tự người dùng bấm: môn bấm trước là môn được chọn việc chính. */
    subjectIds: z
      .array(IntentSubjectIdSchema)
      .min(1)
      .max(6)
      .refine((a) => new Set(a).size === a.length, 'Môn bị trùng'),
    purpose: IntentPurposeSchema.optional(),
    timeBudget: IntentTimeBudgetSchema.optional(),
    level: IntentLevelSchema.optional(),
    grade: IntentGradeSchema.optional(),
    createdAt: z.number().int().positive(),
    updatedAt: z.number().int().positive(),
  },
  LEARNER_INTENT_SCHEMA_VERSION,
)
  .refine(
    (v) => v.grade === undefined || v.subjectIds.some((s) => STEM_IDS.has(s)),
    'Lớp chỉ đi cùng môn Toán/Lý/Hoá/Sinh',
  )
  .refine((v) => isGradeAllowedFor(v.subjectIds, v.grade), 'Lớp 6–9 chỉ đi cùng môn Toán')
export type LearnerIntent = z.infer<typeof LearnerIntentSchema>

// Bỏ hết 5 câu ⇒ KHÔNG có LearnerIntent (không lưu bản rỗng); gợi ý mặc định là `/goc-hoc-tap`.
