// packages/core-contracts/visionSolver.ts — V2 Flagship Multimodal Vision Solver Contracts.
import { z } from 'zod'

export const VisionSolvedStepSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().min(1).max(2000),
  formula: z.string().max(1000).optional(),
})
export type VisionSolvedStep = z.infer<typeof VisionSolvedStepSchema>

export const VisionSolveRequestSchema = z.object({
  imageBase64: z.string().min(10),
  mimeType: z.string().default('image/jpeg').optional(),
  subjectId: z.string().min(1).default('mathematics'),
  gradeLevel: z.string().optional(),
  userPrompt: z.string().max(1000).optional(),
})
export type VisionSolveRequest = z.infer<typeof VisionSolveRequestSchema>

export const VisionSolveResponseSchema = z.object({
  problemText: z.string().min(1),
  steps: z.array(VisionSolvedStepSchema).min(1),
  finalAnswer: z.string().min(1),
  // Không có mặc định: model không trả độ tin cậy đo được, nên KHÔNG bịa số (changelog 0567).
  confidence: z.number().min(0).max(1).optional(),
  tokenUsed: z.number().int().nonnegative().optional(),
})
export type VisionSolveResponse = z.infer<typeof VisionSolveResponseSchema>
