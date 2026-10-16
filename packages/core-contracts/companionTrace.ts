// Metadata nội bộ v1, không phải transcript hoặc hợp đồng thu tiền.
import { z } from 'zod'

export const CompanionTraceStageSchema = z.enum([
  'turn',
  'prepare',
  'intent',
  'context',
  'safety',
  'synthesis',
  'model_call',
  'http_attempt',
  'tool',
  'fallback',
  'finalize',
])
export const CompanionTraceModelSchema = z.enum([
  'claude-haiku-5-5',
  'claude-sonnet-5-5',
  'claude-opus-5-5',
  'claude-haiku-4-5-20251001',
  'gemini-2.0-flash',
  'gemini-3.6-flash',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-120b',
  'gpt-4o-mini',
  'unknown',
])
export const CompanionTraceProviderSchema = z.enum(['anthropic', 'groq', 'gemini'])
const Count = z.number().int().nonnegative().safe()
const Amount = z.number().finite().nonnegative()

export const CompanionTraceUsageSchema = z
  .object({
    state: z.enum(['unknown', 'partial', 'complete']),
    promptTokens: Count.nullable(),
    completionTokens: Count.nullable(),
    cacheReadTokens: Count.nullable(),
    cacheWriteTokens: Count.nullable(),
  })
  .strict()
  .superRefine((usage, ctx) => {
    const counts = [
      usage.promptTokens,
      usage.completionTokens,
      usage.cacheReadTokens,
      usage.cacheWriteTokens,
    ]
    if (usage.state === 'complete' && counts.some((c) => c === null)) {
      ctx.addIssue({ code: 'custom', message: 'Usage complete phải có đủ counter đã đo' })
    }
    if (usage.state === 'unknown' && counts.some((c) => c !== null)) {
      ctx.addIssue({ code: 'custom', message: 'Usage unknown không được mang counter đã đo' })
    }
    if (usage.state === 'partial' && counts.every((c) => c === null)) {
      ctx.addIssue({ code: 'custom', message: 'Usage partial phải có ít nhất một counter' })
    }
    if (
      usage.promptTokens !== null &&
      usage.cacheReadTokens !== null &&
      usage.cacheWriteTokens !== null &&
      usage.promptTokens < usage.cacheReadTokens + usage.cacheWriteTokens
    ) {
      ctx.addIssue({ code: 'custom', message: 'Tổng prompt phải bao gồm hai nhóm cache' })
    }
  })

export const CompanionTraceSummarySchema = z
  .object({
    // Chỉ đếm attempt đã ghi nhận; droppedSpans báo rõ khi trace không còn đầy đủ.
    callCount: Count,
    openCallCount: Count,
    // SDK call còn mở có thể chưa đi tới HTTP attempt đầu tiên.
    openModelCallCount: Count,
    unknownCallCount: Count,
    droppedSpans: Count,
    observedCostUsd: Amount,
    totalCostUsd: Amount.nullable(),
  })
  .strict()
  .superRefine((s, ctx) => {
    if (s.openCallCount > s.unknownCallCount || s.unknownCallCount > s.callCount) {
      ctx.addIssue({ code: 'custom', message: 'Mẫu số attempt không nhất quán' })
    }
    if (
      (s.unknownCallCount > 0 || s.openModelCallCount > 0 || s.droppedSpans > 0) !==
      (s.totalCostUsd === null)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'Tổng đầy đủ phải unknown khi còn call thiếu hoặc span mất',
      })
    }
    if (s.totalCostUsd !== null && s.totalCostUsd !== s.observedCostUsd) {
      ctx.addIssue({ code: 'custom', message: 'Tổng cost không khớp phần quan sát' })
    }
  })

export const CompanionTraceSpanSchema = z
  .object({
    schemaVersion: z.literal(1),
    traceId: z.uuid(),
    requestId: z.string().regex(/^[a-f0-9]{8}$/),
    spanId: z.uuid(),
    parentSpanId: z.uuid().nullable(),
    stage: CompanionTraceStageSchema,
    status: z.enum(['success', 'error', 'consumer_cancelled', 'skipped']),
    startOffsetMs: Amount,
    durationMs: Amount,
    provider: CompanionTraceProviderSchema.nullable(),
    model: CompanionTraceModelSchema.nullable(),
    attempt: Count.positive().nullable(),
    httpStatus: z.number().int().min(100).max(599).nullable(),
    toolKind: z.enum(['read', 'proposal', 'unknown']).nullable(),
    usage: CompanionTraceUsageSchema.nullable(),
    // Ước tính theo registry, chỉ attempt sở hữu; không cộng lại ở span cha.
    costUsd: Amount.nullable(),
    summary: CompanionTraceSummarySchema.nullable(),
  })
  .strict()
  .superRefine((s, ctx) => {
    const invalid = (message: string) => ctx.addIssue({ code: 'custom', message })
    if ((s.stage === 'turn') !== (s.parentSpanId === null)) invalid('Chỉ root không có parent')
    if ((s.stage === 'turn') !== (s.summary !== null)) invalid('Chỉ root có summary')
    if (s.spanId === s.parentSpanId) invalid('Span không thể tự làm parent')
    if (s.status === 'consumer_cancelled' && s.stage !== 'turn')
      invalid('Consumer cancel chỉ mô tả root')
    if (s.model === 'unknown' && s.costUsd !== null)
      invalid('Model chưa biết không có giá đã xác minh')
    if (s.stage === 'http_attempt') {
      if (s.provider === null || s.model === null || s.attempt === null || s.usage === null) {
        invalid('Attempt cần provider/model/ordinal và trạng thái usage')
      }
      if (s.costUsd !== null && s.usage?.state !== 'complete')
        invalid('Không quy giá usage chưa đầy đủ')
    } else if (
      s.usage !== null ||
      s.costUsd !== null ||
      s.attempt !== null ||
      s.httpStatus !== null
    ) {
      invalid('Chỉ attempt sở hữu usage/cost/HTTP metadata')
    }
  })

export type CompanionTraceStage = z.infer<typeof CompanionTraceStageSchema>
export type CompanionTraceModel = z.infer<typeof CompanionTraceModelSchema>
export type CompanionTraceProvider = z.infer<typeof CompanionTraceProviderSchema>
export type CompanionTraceUsage = z.infer<typeof CompanionTraceUsageSchema>
export type CompanionTraceSpan = z.infer<typeof CompanionTraceSpanSchema>
export type CompanionTraceStatus = CompanionTraceSpan['status']

export function unknownTraceUsage(): CompanionTraceUsage {
  return {
    state: 'unknown',
    promptTokens: null,
    completionTokens: null,
    cacheReadTokens: null,
    cacheWriteTokens: null,
  }
}
