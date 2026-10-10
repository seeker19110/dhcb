// todayPlan.ts — HỢP ĐỒNG "Hôm nay" và "điểm học tiếp" dùng chung cho mọi môn (slice S06).
//
// Đặc tả: docs/specs/2026-09-15-learning-ux-s06-hom-nay-hoc-tiep.md §③.1.
//
// VÌ SAO CÓ FILE NÀY: mỗi màn hiện đang tự nghĩ ra "học tiếp bài nào" theo dữ liệu của riêng nó
// (Trang chủ và trang môn Anh có hai bản chép cùng một vòng lặp; trang Lập trình tự ghép URL).
// Bao nhiêu bản là bấy nhiêu cách trả lời khác nhau cho cùng một câu hỏi, và mỗi bản lại lỡ một
// luật khác nhau. Khai MỘT hình dạng dữ liệu ở đây; mỗi môn viết một adapter thuần, resolver xếp
// thứ tự, giao diện chỉ còn việc vẽ.
//
// HAI LUẬT SẢN PHẨM chi phối hợp đồng này:
//  1. "Hôm nay" là công cụ chọn MỘT việc, KHÔNG phải bảng điểm — `title` là tên nội dung, không
//     bao giờ là band/CEFR/phần trăm thành thạo.
//  2. Nền tảng KHÔNG mặc định tiếng Anh — thiếu bằng chứng thì trả `kind:'pick'` về góc học tập,
//     tuyệt đối không đẩy người học vào lộ trình của một môn nào.
import { z } from 'zod'
import { TODAY_ITEM_KINDS } from './todayItemId.js'

export { todayItemId, TODAY_ITEM_KINDS, type TodayItemKind } from './todayItemId.js'

/** Nguồn bằng chứng của một mục — chữ hiển thị lấy từ bảng §③.3 của đặc tả, không tự bịa. */
export const TodaySourceSchema = z.enum([
  'session.resume', // phiên dở S08 (LearningSession)
  'outline.next', // lá kế tiếp trong Outline S07 (prevNext)
  'programming.progress', // pickNextLesson trên /api/programming/progress hoặc cache khách
  'english.vocab', // vòng từ vựng chưa đủ (findNextStep kind:'vocab')
  'english.cefrGrammar', // bài ngữ pháp chưa xong (findNextStep kind:'grammar')
  'english.srs', // getSRSStats(uid).due > 0
  'none', // kind:'pick' — chưa có bằng chứng nào
])
export type TodaySource = z.infer<typeof TodaySourceSchema>

/** Điểm quay lại — chép từ `LearningSession` (S08), KHÔNG tự suy ra. */
export const ResumePointSchema = z.object({
  sessionId: z.string().min(1),
  subjectId: z.string().min(1),
  /** Khoá ngắn Lập trình → `href` phải giữ `?khoa=`. */
  courseId: z.string().min(1).optional(),
  /** lessonId · circleId · grammarId. */
  contentId: z.string().min(1),
  /** Hoạt động trong bài, khi màn học có nhiều hoạt động. */
  activityId: z.string().min(1).optional(),
  /** `stepIndex` của phiên S08. */
  step: z.number().int().nonnegative().optional(),
  hasDraft: z.boolean(),
  /** epoch ms — tiêu chí chọn giữa nhiều môn (§7 Q1). */
  updatedAt: z.number().int().positive(),
})
export type ResumePoint = z.infer<typeof ResumePointSchema>

export const TodayItemSchema = z.object({
  /** `${kind}:${subjectId ?? '-'}:${contentId ?? '-'}` — dựng bằng `todayItemId`. */
  id: z.string().min(1),
  kind: z.enum(TODAY_ITEM_KINDS),
  /** undefined CHỈ khi `kind:'pick'` toàn cục (chưa biết người học quan tâm môn nào). */
  subjectId: z.string().min(1).optional(),
  courseId: z.string().min(1).optional(),
  contentId: z.string().min(1).optional(),
  /** "Sự rơi tự do" · "Ôn 12 thẻ đến hạn" · "Chọn môn để bắt đầu". */
  title: z.string().min(1).max(160),
  /** "Đang học dở" · "Bài kế tiếp trong khoá Git". */
  hint: z.string().min(1).max(120).optional(),
  /** Route NỘI BỘ; giữ `?khoa=` khi có `courseId`. Chỗ DUY NHẤT giao diện dùng để điều hướng. */
  href: z.string().regex(/^\/(?!\/)/),
  evidenceSource: TodaySourceSchema,
  estimatedMinutes: z.number().int().positive().max(60).optional(),
  /** Bắt buộc khi `kind:'resume'` — xem `TodayItemChecked`. */
  resume: ResumePointSchema.optional(),
})
export type TodayItem = z.infer<typeof TodayItemSchema>

/** Mục `resume` mà không mang `ResumePoint` thì giao diện không biết mở lại ở đâu. */
const TodayItemChecked = TodayItemSchema.refine((item) => item.kind !== 'resume' || !!item.resume, {
  message: "kind:'resume' phải có resume",
})

export const TodayPlanSchema = z
  .object({
    /** `null` CHỈ để giao diện phòng thủ — resolver luôn trả ít nhất một mục `pick`. */
    primary: TodayItemChecked.nullable(),
    secondary: z.array(TodayItemChecked).max(2),
    /** Môn có ít nhất một tín hiệu — để giao diện đổi chữ ("môn thứ hai"). */
    subjectsSeen: z.array(z.string().min(1)),
    builtAt: z.number().int().positive(),
  })
  .refine((p) => !p.primary || p.primary.kind !== 'pick' || p.primary.evidenceSource === 'none', {
    message: "primary kind:'pick' phải có evidenceSource 'none'",
  })
  .refine((p) => !p.primary || p.secondary.every((s) => s.id !== p.primary?.id), {
    message: 'secondary không được trùng id với primary',
  })
  .refine((p) => p.secondary.every((s) => s.kind !== 'pick'), {
    message: "'pick' không bao giờ là mục phụ",
  })
export type TodayPlan = z.infer<typeof TodayPlanSchema>
