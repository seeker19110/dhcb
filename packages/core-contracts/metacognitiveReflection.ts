// packages/core-contracts/metacognitiveReflection.ts — hợp đồng Nhật ký phản tỉnh Socratic.
//
// LUẬT SỐ 1 (changelog 0539): hợp đồng trả cho client KHÔNG có con số "năng lực" nào. Hai trường
// cũ `metacognitiveIndex` ("MAI") và `growthMindsetScore` là số GIẢ — tính từ số từ của bài viết
// (`wordCount * 1.5 + 40`) cộng thưởng theo số bẫy dò được, không phải thang MAI chuẩn — nên đã
// bỏ khỏi hợp đồng. Bản ghi cũ trong `platform.feature_state` vẫn còn hai trường đó (KHÔNG xoá dữ
// liệu thật): server chỉ thôi đọc/ghi, và lọc chúng ra qua `toPublicReflection` trước khi trả về.
import { z } from 'zod'
import { IsoDateTimeSchema } from './shared.js'

export const CognitiveBiasTypeSchema = z.enum([
  'dunning_kruger',
  'confirmation_bias',
  'sunk_cost',
  'imposter_syndrome',
  'overconfidence',
  'analysis_paralysis',
  'status_quo_bias',
  'none',
])
export type CognitiveBiasType = z.infer<typeof CognitiveBiasTypeSchema>

/**
 * Tên hiển thị của từng bẫy tư duy — MỘT nguồn cho cả service (khi dò) lẫn giao diện (khi liệt kê
 * bẫy hay gặp trong lịch sử). `none` chỉ còn để đọc được bản ghi cũ; bản ghi mới không dùng nó.
 */
export const COGNITIVE_BIAS_LABELS: Record<CognitiveBiasType, string> = {
  dunning_kruger: 'Hiệu ứng Dunning–Kruger',
  confirmation_bias: 'Thiên kiến xác nhận',
  sunk_cost: 'Bẫy chi phí chìm',
  imposter_syndrome: 'Hội chứng kẻ giả mạo',
  overconfidence: 'Tự tin thái quá',
  analysis_paralysis: 'Tê liệt phân tích',
  status_quo_bias: 'Thiên kiến giữ nguyên trạng',
  none: 'Chưa thấy dấu hiệu bẫy tư duy',
}

export const IdentifiedBiasSchema = z.object({
  biasType: CognitiveBiasTypeSchema,
  biasName: z.string().min(1),
  explanation: z.string().min(1),
  antidotePrompt: z.string().min(1),
  severity: z.enum(['low', 'moderate', 'high']),
  /**
   * Nguyên văn những cụm từ trong bài viết đã khiến bộ dò nghĩ tới bẫy này — để người viết thấy
   * VÌ SAO có gợi ý (bộ dò chỉ dựa trên từ khoá, không phải chẩn đoán). Bản ghi cũ không có → [].
   */
  triggerPhrases: z.array(z.string()).default([]),
})
export type IdentifiedBias = z.infer<typeof IdentifiedBiasSchema>

export const MetacognitiveReflectionSchema = z.object({
  id: z.string().min(1),
  personId: z.string().min(1),
  title: z.string().min(1).max(200),
  domain: z.enum(['learning', 'career', 'work', 'startup', 'life']),
  reflectionPrompt: z.string().min(1).max(500),
  userReflection: z.string().min(1).max(4000),
  ahaMoments: z.array(z.string()).default([]),
  identifiedBiases: z.array(IdentifiedBiasSchema).default([]),
  socraticFollowUps: z.array(z.string()).default([]),
  actionCommitment: z.string().max(500).optional(),
  createdAt: IsoDateTimeSchema,
})
export type MetacognitiveReflection = z.infer<typeof MetacognitiveReflectionSchema>

/**
 * Hình dạng bản ghi ĐANG NẰM trong CSDL: bản ghi trước changelog 0539 còn hai trường điểm giả và
 * bẫy "none" giữ chỗ; bẫy cũ chưa có `triggerPhrases`. Chỉ dùng ở server để đọc rồi chiếu sang
 * `MetacognitiveReflection` — không bao giờ trả thẳng kiểu này cho client.
 */
export type StoredMetacognitiveReflection = Omit<MetacognitiveReflection, 'identifiedBiases'> & {
  identifiedBiases?: Array<Omit<IdentifiedBias, 'triggerPhrases'> & { triggerPhrases?: string[] }>
  /** @deprecated số giả (changelog 0539) — chỉ còn trong bản ghi cũ, KHÔNG đọc. */
  metacognitiveIndex?: number
  /** @deprecated số giả (changelog 0539) — chỉ còn trong bản ghi cũ, KHÔNG đọc. */
  growthMindsetScore?: number
}

/**
 * Chiếu một bản ghi lưu trữ sang hình dạng trả cho client theo DANH SÁCH TRẮNG từng trường — trường
 * lạ (kể cả hai số giả cũ) không bao giờ lọt ra, kể cả khi sau này ai đó ghi thêm trường vào CSDL.
 * Bẫy "none" giữ chỗ của bản ghi cũ bị bỏ: "không thấy bẫy" là danh sách rỗng, không phải một bẫy.
 */
export function toPublicReflection(stored: StoredMetacognitiveReflection): MetacognitiveReflection {
  return {
    id: stored.id,
    personId: stored.personId,
    title: stored.title,
    domain: stored.domain,
    reflectionPrompt: stored.reflectionPrompt,
    userReflection: stored.userReflection,
    ahaMoments: stored.ahaMoments ?? [],
    identifiedBiases: (stored.identifiedBiases ?? [])
      .filter((b) => b.biasType !== 'none')
      .map((b) => ({
        biasType: b.biasType,
        biasName: b.biasName,
        explanation: b.explanation,
        antidotePrompt: b.antidotePrompt,
        severity: b.severity,
        triggerPhrases: b.triggerPhrases ?? [],
      })),
    socraticFollowUps: stored.socraticFollowUps ?? [],
    ...(stored.actionCommitment !== undefined ? { actionCommitment: stored.actionCommitment } : {}),
    createdAt: stored.createdAt,
  }
}

/** Thân yêu cầu `POST ?action=submit_reflection` — validate ở server trước khi phân tích. */
export const SubmitReflectionRequestSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  domain: z.enum(['learning', 'career', 'work', 'startup', 'life']).default('learning'),
  reflectionPrompt: z.string().trim().min(1).max(500),
  userReflection: z.string().trim().min(1).max(4000),
})
export type SubmitReflectionRequest = z.infer<typeof SubmitReflectionRequestSchema>

export const SocraticDailyPromptSchema = z.object({
  id: z.string().min(1),
  domain: z.enum(['learning', 'career', 'work', 'startup', 'life']),
  theme: z.string().min(1),
  promptText: z.string().min(1),
  deepDivingQuestion: z.string().min(1),
  contextAnchor: z.string().optional(),
})
export type SocraticDailyPrompt = z.infer<typeof SocraticDailyPromptSchema>

/**
 * Tóm tắt lịch sử phản tỉnh — CHỈ định tính: số phiên đã viết, những bẫy hay gặp lại (để người viết
 * tự để ý), và các khoảnh khắc "Aha" trích từ lời họ. Không chỉ số trung bình, không "xu hướng tư
 * duy" (hai trường đó suy ra từ số giả, đã bỏ ở changelog 0539).
 */
export const MetacognitiveSummarySchema = z.object({
  totalReflectionsCount: z.number().int().min(0),
  topDetectedBiases: z.array(CognitiveBiasTypeSchema),
  recentAhaMoments: z.array(z.string()),
})
export type MetacognitiveSummary = z.infer<typeof MetacognitiveSummarySchema>
