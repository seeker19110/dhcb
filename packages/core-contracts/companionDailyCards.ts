// packages/core-contracts/companionDailyCards.ts — hợp đồng "Thẻ hôm nay" của Bạn Đồng Hành (GĐ4a).
//
// Tối đa 3 thẻ/người/ngày (giờ VN), dựng TẤT ĐỊNH từ dữ liệu thật (thẻ ôn đến hạn, việc đến hạn
// trong Ghi chú, mục tiêu học, lời mời phản tỉnh) — không gọi AI. Chữ trên thẻ tính lại từ số liệu
// sống mỗi lần mở; `status = 'done'` khi việc của thẻ đã làm xong. Đặc tả:
// docs/specs/2026-10-12-ban-dong-hanh-gd4a-the-hom-nay.md §③. Thay "tác tử chủ động" giả lập cũ
// (`proactiveAgent.ts`, đã gỡ ở changelog 0629).
import { z } from 'zod'
import { UuidSchema } from './shared.js'

/** Thứ tự trong mảng = thứ tự ưu tiên gốc khi chọn thẻ của ngày. */
export const DAILY_CARD_KINDS = ['review_due', 'due_tasks', 'learning_goal', 'reflection'] as const
export const DailyCardKindSchema = z.enum(DAILY_CARD_KINDS)
export type DailyCardKind = z.infer<typeof DailyCardKindSchema>

/** Trần số thẻ một ngày — CSDL giữ bằng `position between 1 and 3` (migration 0097). */
export const MAX_DAILY_CARDS = 3

export const DailyCardFeedbackSchema = z.enum(['up', 'down'])
export type DailyCardFeedback = z.infer<typeof DailyCardFeedbackSchema>

export const DailyCardStatusSchema = z.enum(['open', 'done'])
export type DailyCardStatus = z.infer<typeof DailyCardStatusSchema>

export const CompanionDailyCardSchema = z.object({
  id: UuidSchema,
  kind: DailyCardKindSchema,
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(400),
  /** Route nội bộ của app (bắt đầu bằng `/`) — không bao giờ là URL ngoài. */
  route: z
    .string()
    .regex(/^\/[^/]/)
    .max(200),
  actionLabel: z.string().min(1).max(40),
  status: DailyCardStatusSchema,
  feedback: DailyCardFeedbackSchema.nullable(),
})
export type CompanionDailyCard = z.infer<typeof CompanionDailyCardSchema>

export const CompanionDailyCardsResponseSchema = z.object({
  /** Ngày giờ VN `YYYY-MM-DD` của bộ thẻ. */
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cards: z.array(CompanionDailyCardSchema).max(MAX_DAILY_CARDS),
})
export type CompanionDailyCardsResponse = z.infer<typeof CompanionDailyCardsResponseSchema>

/** Thân `POST /api/companion-cards?action=feedback` — strict: trường lạ (vd `personId`) bị từ chối. */
export const DailyCardFeedbackRequestSchema = z
  .object({
    cardId: UuidSchema,
    feedback: DailyCardFeedbackSchema,
  })
  .strict()
export type DailyCardFeedbackRequest = z.infer<typeof DailyCardFeedbackRequestSchema>

/** Trả lại đúng phản hồi đã ghi — giao diện tự cập nhật thẻ, không cần dựng lại cả bộ. */
export const DailyCardFeedbackResponseSchema = z.object({
  cardId: UuidSchema,
  feedback: DailyCardFeedbackSchema,
})
export type DailyCardFeedbackResponse = z.infer<typeof DailyCardFeedbackResponseSchema>
