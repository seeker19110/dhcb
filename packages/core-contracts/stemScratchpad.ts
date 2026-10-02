// packages/core-contracts/stemScratchpad.ts — V5 Flagship STEM Interactive Scratchpad Contracts.
import { z } from 'zod'
import { IsoDateTimeSchema, UuidSchema } from './shared.js'

export const StemSubjectTypeSchema = z.enum(['math', 'physics', 'chemistry', 'biology'])
export type StemSubjectType = z.infer<typeof StemSubjectTypeSchema>

/**
 * Kết luận của bộ kiểm cho một bước giải:
 * - `invalid`    — phát hiện lỗi cụ thể (lệch ngoặc, chuyển vế sai dấu…).
 * - `valid`      — bộ kiểm ĐÃ CHỨNG MINH bước đúng (hiện chỉ làm được một việc: đáp số cuối khớp
 *                  nguyên vẹn đáp số đã biết của đề mẫu).
 * - `unverified` — không phát hiện lỗi nhưng cũng KHÔNG kiểm được → tuyệt đối không được báo "đúng".
 */
export const StepVerdictSchema = z.enum(['valid', 'invalid', 'unverified'])
export type StepVerdict = z.infer<typeof StepVerdictSchema>

export const ScratchpadStepValidationSchema = z.object({
  /** `true` = KHÔNG phát hiện lỗi — không có nghĩa là bước đúng; xem `status`. */
  isValid: z.boolean(),
  /** Thêm 2026-10-02 (changelog 0473). Bước lưu trước ngày đó không có trường này. */
  status: StepVerdictSchema.optional(),
  errorType: z
    .enum(['none', 'sign_error', 'arithmetic_error', 'unbalanced_equation', 'logic_gap'])
    .default('none'),
  feedback: z.string().min(1).max(500),
  suggestedCorrection: z.string().max(500).optional(),
  confidence: z.number().min(0).max(1),
})
export type ScratchpadStepValidation = z.infer<typeof ScratchpadStepValidationSchema>

/**
 * Kết luận để HIỂN THỊ cho người học. Chỉ coi là `valid` khi bộ kiểm khẳng định rõ ràng; bước cũ
 * (không có `status`) từng được bộ kiểm giả chấm "hợp lệ" cho mọi thứ, nên coi là `unverified`.
 */
export function ketQuaBuoc(validation: ScratchpadStepValidation | undefined): StepVerdict {
  if (!validation) return 'unverified'
  if (!validation.isValid || validation.status === 'invalid') return 'invalid'
  return validation.status === 'valid' ? 'valid' : 'unverified'
}

export const ScratchpadStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  latexInput: z.string().min(1).max(1000),
  explanation: z.string().max(1000).optional(),
  validation: ScratchpadStepValidationSchema.optional(),
  createdAt: IsoDateTimeSchema,
})
export type ScratchpadStep = z.infer<typeof ScratchpadStepSchema>

export const StemProblemStateSchema = z.object({
  id: z.string().min(1),
  personId: UuidSchema,
  subject: StemSubjectTypeSchema,
  title: z.string().min(1).max(200),
  problemStatement: z.string().min(1).max(2000),
  problemLatex: z.string().max(1000).optional(),
  steps: z.array(ScratchpadStepSchema),
  isSolved: z.boolean(),
  hintsUsed: z.number().int().min(0).default(0),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
})
export type StemProblemState = z.infer<typeof StemProblemStateSchema>
