// packages/core-contracts/lifeSynthesis.ts — hợp đồng "Tổng hợp 30 ngày" (Life Synthesis v2).
//
// Đặc tả: docs/specs/2026-10-09-tong-hop-da-mien-du-lieu-that.md (changelog 0550).
//
// Bản v5.4 cũ (gỡ ở changelog 0475) chứa điểm "Đồng bộ toàn diện / Cộng hưởng đa miền / Bền bỉ
// nhận thức" 0–100, xác suất về đích và 5 miền (3 miền đã xoá). Bản này CỐ Ý không có trường điểm
// nào: mọi con số là phép ĐẾM trên bản ghi thật (số ngày có học, số bài hoàn thành, số việc), mỗi
// câu chữ mang `ruleId` để truy được luật nào sinh ra nó. `.strict()` chặn trường lạ (điểm số, thang
// bậc…) lọt qua — cùng tinh thần bất biến T3 của luồng hồ sơ năng lực ẩn.
import { z } from 'zod'
import { IsoDateTimeSchema } from './shared.js'

export const LIFE_SYNTHESIS_SCHEMA_VERSION = 2 as const

/** Cửa sổ tổng hợp: 30 ngày theo giờ Việt Nam, tính cả hôm nay. */
export const LIFE_SYNTHESIS_WINDOW_DAYS = 30 as const

/** Ngày lịch theo giờ Việt Nam, dạng `YYYY-MM-DD`. */
export const VnDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/** Đúng sáu môn đang có (`@dhcb/core-learner/subjectRegistry`). */
export const SynthesisSubjectIdSchema = z.enum([
  'english',
  'programming',
  'mathematics',
  'physics',
  'chemistry',
  'biology',
])
export type SynthesisSubjectId = z.infer<typeof SynthesisSubjectIdSchema>

const Count = z.number().int().min(0)

export const SubjectActivitySchema = z
  .object({
    subjectId: SynthesisSubjectIdSchema,
    label: z.string().min(1),
    /** Số ngày (trong cửa sổ) có ít nhất một bản ghi học của môn này. ≥ 1 — môn 0 ngày không có mặt. */
    activeDays: z.number().int().min(1).max(LIFE_SYNTHESIS_WINDOW_DAYS),
    lastActiveDate: VnDateSchema,
    /** Chuỗi ngày liên tiếp có học, kết thúc hôm nay hoặc hôm qua; 0 khi đã đứt. */
    streakDays: z.number().int().min(0).max(LIFE_SYNTHESIS_WINDOW_DAYS),
    /**
     * Số bài hoàn thành LẦN ĐẦU trong cửa sổ. `null` = môn không ghi "hoàn thành bài" ở server
     * (Tiếng Anh) — khác với 0 ("có khái niệm, chưa hoàn thành bài nào").
     */
    completions: Count.nullable(),
  })
  .strict()
export type SubjectActivity = z.infer<typeof SubjectActivitySchema>

export const LearningSummarySchema = z
  .object({
    /** Số ngày có học ít nhất một môn. */
    activeDays: z.number().int().min(0).max(LIFE_SYNTHESIS_WINDOW_DAYS),
    streakDays: z.number().int().min(0).max(LIFE_SYNTHESIS_WINDOW_DAYS),
    lastActiveDate: VnDateSchema.nullable(),
    /** Chỉ các môn có hoạt động, xếp theo ngày gần nhất rồi số ngày có học. */
    subjects: z.array(SubjectActivitySchema).max(SynthesisSubjectIdSchema.options.length),
  })
  .strict()
export type LearningSummary = z.infer<typeof LearningSummarySchema>

export const NotesSummarySchema = z
  .object({
    /** Tổng số việc (mọi trạng thái) — để tách "chưa dùng Ghi chú" khỏi "đã xong hết". */
    totalTasks: Count,
    openTasks: Count,
    /** Việc chưa xong có hạn TRƯỚC ngày hôm nay (giờ VN). */
    overdueTasks: Count,
    /** Việc chưa xong có hạn trong 7 ngày tới, tính cả hôm nay. */
    dueSoonTasks: Count,
    undatedOpenTasks: Count,
    blockedTasks: Count,
    totalNotes: Count,
    /** Ghi chú tạo trong cửa sổ 30 ngày. */
    notesCreated: Count,
  })
  .strict()
export type NotesSummary = z.infer<typeof NotesSummarySchema>

export const SynthesisDomainSchema = z.enum(['learning', 'notes'])
export type SynthesisDomain = z.infer<typeof SynthesisDomainSchema>

/** Mã luật sinh câu nhận xét — mỗi câu truy được về đúng một luật trong service. */
export const ObservationRuleSchema = z.enum([
  'learning.none',
  'learning.streak',
  'learning.subject_streak',
  'learning.completions',
  'learning.lapsed',
  'notes.none',
  'notes.overdue',
  'notes.due_soon',
  'notes.undated',
  'notes.blocked',
  'notes.all_closed',
  'notes.created',
])
export type ObservationRule = z.infer<typeof ObservationRuleSchema>

export const RecommendationRuleSchema = z.enum([
  'rec.notes_overdue',
  'rec.learning_resume',
  'rec.learning_start',
  'rec.learning_continue',
  'rec.notes_undated',
])
export type RecommendationRule = z.infer<typeof RecommendationRuleSchema>

/** Đích của một khuyến nghị — client tự dựng URL qua hàm route dùng chung (CLAUDE.md §7). */
export const SynthesisTargetSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('subject'), subjectId: SynthesisSubjectIdSchema }).strict(),
  z.object({ kind: z.literal('learning-hub') }).strict(),
  z.object({ kind: z.literal('notes') }).strict(),
])
export type SynthesisTarget = z.infer<typeof SynthesisTargetSchema>

export const SynthesisObservationSchema = z
  .object({
    ruleId: ObservationRuleSchema,
    domain: SynthesisDomainSchema,
    text: z.string().min(1),
  })
  .strict()
export type SynthesisObservation = z.infer<typeof SynthesisObservationSchema>

/** Tối đa 3 khuyến nghị — nhiều hơn là danh sách việc, không còn là gợi ý. */
export const MAX_RECOMMENDATIONS = 3

export const SynthesisRecommendationSchema = z
  .object({
    ruleId: RecommendationRuleSchema,
    domain: SynthesisDomainSchema,
    text: z.string().min(1),
    actionLabel: z.string().min(1),
    target: SynthesisTargetSchema,
  })
  .strict()
export type SynthesisRecommendation = z.infer<typeof SynthesisRecommendationSchema>

export const LifeSynthesisReportSchema = z
  .object({
    schemaVersion: z.literal(LIFE_SYNTHESIS_SCHEMA_VERSION),
    generatedAt: IsoDateTimeSchema,
    windowDays: z.literal(LIFE_SYNTHESIS_WINDOW_DAYS),
    windowStart: VnDateSchema,
    /** Hôm nay (giờ VN) — ngày cuối của cửa sổ. */
    windowEnd: VnDateSchema,
    learning: LearningSummarySchema,
    notes: NotesSummarySchema,
    observations: z.array(SynthesisObservationSchema),
    recommendations: z.array(SynthesisRecommendationSchema).max(MAX_RECOMMENDATIONS),
  })
  .strict()
export type LifeSynthesisReport = z.infer<typeof LifeSynthesisReportSchema>

/** Thân phản hồi của `GET /api/life-synthesis`. */
export const LifeSynthesisResponseSchema = z.object({ report: LifeSynthesisReportSchema }).strict()
export type LifeSynthesisResponse = z.infer<typeof LifeSynthesisResponseSchema>
