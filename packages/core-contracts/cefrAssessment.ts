// Hợp đồng bài thi CEFR: trình duyệt gửi lựa chọn, máy chủ giữ đáp án và chấm điểm.
import { z } from 'zod'

export const CefrAssessmentLevel = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
export const CefrAssessmentRequest = z.discriminatedUnion('action', [
  z.object({ action: z.literal('start'), level: CefrAssessmentLevel, isA: z.boolean() }).strict(),
  z
    .object({
      action: z.literal('submit'),
      attemptId: z.string().uuid(),
      answers: z.array(z.string().max(2000)).min(1).max(24),
    })
    .strict(),
])
export const CefrAssessmentQuestion = z.object({
  key: z.string(),
  part: z.enum(['vocab', 'grammar', 'listening', 'reading']),
  promptKind: z.enum(['text', 'audio']),
  prompt: z.string(),
  options: z.array(z.string()).min(2).max(4),
  audioText: z.string().optional(),
  audioLang: z.enum(['en-US', 'vi-VN']).optional(),
  lessonId: z.string().optional(),
  passage: z
    .object({
      titleVi: z.string(),
      titleEn: z.string(),
      lines: z.array(z.object({ who: z.enum(['A', 'B']), text: z.string() })),
    })
    .optional(),
})
export type PublicCefrQuestion = z.infer<typeof CefrAssessmentQuestion>
export const CefrExamResult = z.object({
  passed: z.boolean(),
  bestPct: z.number().min(0).max(100),
  attempts: z.number().int().nonnegative(),
  lastAt: z.string(),
})
export const CefrAssessmentStart = z.object({
  attemptId: z.string().uuid(),
  expiresAt: z.number(),
  questions: z.array(CefrAssessmentQuestion).min(1).max(24),
})
export const CefrAssessmentGrade = z.object({
  pct: z.number(),
  passed: z.boolean(),
  correct: z.number(),
  total: z.number(),
  correctAnswers: z.array(z.string()),
  result: CefrExamResult,
  cefrUnlocked: z.array(CefrAssessmentLevel),
})
