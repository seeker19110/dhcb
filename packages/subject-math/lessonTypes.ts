// lessonTypes.ts — Kiểu + Zod schema cho BÀI HỌC môn Toán.
//
// Giữ CÙNG khuôn với 3 môn STEM còn lại (Lí · Hoá · Sinh) để một trang học dùng chung được
// cho cả 4 môn: cùng nhịp hook → theory → animation → workedExample → checkQuestions → srsCards,
// cùng bộ AnswerSpec ánh xạ thẳng sang @dhcb/core-grading (chấm tất định, không nhờ AI).
// Xem docs/specs/2026-09-13-hoan-thien-4-mon-stem.md.
import { z } from 'zod'
import { LessonReviewSchema } from '@dhcb/core-contracts/lessonReview'
import {
  AdvancedTierSchema,
  LessonAnimationSchema,
  LessonTrackSchema,
} from '@dhcb/core-contracts/lessonAnimation'

// Lớp 6–9 (THCS) mở từ 2026-10-10 — docs/specs/2026-10-10-toan-thcs-6-9.md. Thứ tự là thứ tự
// HIỂN THỊ (tăng dần theo số), không phải thứ tự chuỗi ('10' < '6' nếu so chuỗi).
export const MATH_GRADES = ['6', '7', '8', '9', '10', '11', '12'] as const
export type MathGrade = (typeof MATH_GRADES)[number]

export const MathAnswerSpecSchema = z.union([
  z
    .object({
      kind: z.literal('numeric'),
      value: z.number(),
      unit: z.string().optional(),
      unitRequired: z.boolean().optional(),
      tolerance: z
        .union([
          z.object({ mode: z.literal('exact') }).strict(),
          z.object({ mode: z.literal('absolute'), eps: z.number() }).strict(),
          z.object({ mode: z.literal('relative'), pct: z.number() }).strict(),
          z.object({ mode: z.literal('sigfig'), digits: z.number() }).strict(),
        ])
        .optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('choice'),
      correctIds: z.array(z.string().min(1)).min(1),
    })
    .strict(),
  z
    .object({
      kind: z.literal('fraction'),
      num: z.number(),
      den: z.number(),
      requireSimplified: z.boolean().optional(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('expression'),
      expr: z.string().min(1),
    })
    .strict(),
])
export type MathAnswerSpec = z.infer<typeof MathAnswerSpecSchema>

export const MathCheckQuestionSchema = z
  .object({
    prompt: z.string().min(1).max(800),
    choices: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).optional(),
    answer: MathAnswerSpecSchema,
    explain: z.string().min(1).max(1000),
  })
  .strict()
  .refine((q) => (q.answer.kind === 'choice') === (q.choices !== undefined), {
    message: "câu 'choice' phải có choices; đáp án khác thì không được có choices",
  })

export const MathLessonSchema = z
  .object({
    id: z.string().regex(/^toan([6-9]|1[0-2])-c\d+-b\d+$/),
    grade: z.enum(MATH_GRADES),
    chapterNumber: z.number().int().positive(),
    chapterTitle: z.string().min(1).max(200),
    lessonNumber: z.number().int().positive(),
    title: z.string().min(1).max(200),
    hook: z.string().min(1).max(600),
    theory: z.string().min(1).max(6000),
    workedExample: z
      .object({
        problem: z.string().min(1).max(1000),
        steps: z.array(z.string().min(1).max(1000)).min(1).max(10),
        answer: z.string().min(1).max(300),
      })
      .strict(),
    checkQuestions: z.array(MathCheckQuestionSchema).min(2).max(10),
    srsCards: z
      .array(
        z
          .object({
            hoi: z.string().min(1).max(200),
            dap: z.string().min(1).max(400),
          })
          .strict(),
      )
      .min(2)
      .max(4),
    /** Hoạt ảnh minh hoạ — với Toán thường là đồ thị biến thiên, phép dựng hình, vòng tròn
     *  lượng giác quay, hoặc quá trình lặp hội tụ. */
    animation: LessonAnimationSchema.optional(),
    /** 'core' = chương trình chuẩn; 'advanced' = chuyên đề bồi dưỡng học sinh giỏi. */
    track: LessonTrackSchema,
    /** Cấp của chuyên đề nâng cao — chỉ có mặt khi track === 'advanced'. */
    advancedTier: AdvancedTierSchema.optional(),
    reviewStatus: z.enum(['draft', 'reviewed']),
    /** Chi tiết lượt duyệt chuyên môn (ai · ngày · 7 tiêu chí · băm nội dung). Vắng mặt = chưa
     *  ai đọc. Trường CŨ `reviewStatus` giữ nguyên vì giao diện đang đọc nó; luật ăn khớp giữa
     *  hai trường do `lessons.test.ts` canh. Xem `packages/core-contracts/lessonReview.ts`. */
    review: LessonReviewSchema.optional(),
  })
  .strict()
  .refine((l) => (l.track === 'advanced') === (l.advancedTier !== undefined), {
    message: "bài 'advanced' phải khai báo advancedTier; bài 'core' thì không được có",
  })
  .refine((l) => l.id === `toan${l.grade}-c${l.chapterNumber}-b${l.lessonNumber}`, {
    message: 'id phải khớp đúng toan<lớp>-c<chương>-b<bài>',
  })

export type MathCheckQuestion = z.infer<typeof MathCheckQuestionSchema>
export type MathLesson = z.infer<typeof MathLessonSchema>
