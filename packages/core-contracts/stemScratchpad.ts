// packages/core-contracts/stemScratchpad.ts — V5 Flagship STEM Interactive Scratchpad Contracts.
import { z } from 'zod'
import { IsoDateTimeSchema, UuidSchema } from './shared.js'

export const StemSubjectTypeSchema = z.enum(['math', 'physics', 'chemistry', 'biology'])
export type StemSubjectType = z.infer<typeof StemSubjectTypeSchema>

/**
 * Kết luận của bộ kiểm cho một bước giải:
 * - `invalid`    — phát hiện lỗi cụ thể (lệch ngoặc, chuyển vế sai dấu…).
 * - `valid`      — bộ kiểm ĐÃ CHỨNG MINH bước đúng: phương trình một ẩn giữ nguyên tập nghiệm của
 *                  đề, phương trình hoá cân bằng nguyên tử + điện tích, hoặc đáp số khớp đề mẫu
 *                  (`@dhcb/core-grading/stepCheckMath`, `stepCheckChem` — changelog 0547).
 * - `unverified` — không phát hiện lỗi nhưng cũng KHÔNG kiểm được → tuyệt đối không được báo "đúng".
 */
export const StepVerdictSchema = z.enum(['valid', 'invalid', 'unverified'])
export type StepVerdict = z.infer<typeof StepVerdictSchema>

export const ScratchpadStepValidationSchema = z.object({
  /** `true` = KHÔNG phát hiện lỗi — không có nghĩa là bước đúng; xem `status`. */
  isValid: z.boolean(),
  /** Thêm 2026-10-02 (changelog 0473). Bước lưu trước ngày đó không có trường này. */
  status: StepVerdictSchema.optional(),
  /**
   * Loại lỗi. Bốn giá trị `changed_solutions` … `substance_changed` thêm 2026-10-09 (changelog
   * 0547) cho bộ kiểm bước thật: `changed_solutions` (biến đổi làm đổi tập nghiệm),
   * `division_by_zero`, `unbalanced_charge` (lệch điện tích), `substance_changed` (sửa chỉ số = đổi
   * chất thay vì thêm hệ số). `dimension_mismatch` thêm cùng ngày (changelog 0552): bước Vật lí
   * cộng/trừ hoặc cho bằng nhau hai đại lượng khác thứ nguyên — CHỨNG MINH được, không đoán.
   */
  errorType: z
    .enum([
      'none',
      'sign_error',
      'arithmetic_error',
      'unbalanced_equation',
      'logic_gap',
      'changed_solutions',
      'division_by_zero',
      'unbalanced_charge',
      'substance_changed',
      'dimension_mismatch',
    ])
    .default('none'),
  feedback: z.string().min(1).max(500),
  suggestedCorrection: z.string().max(500).optional(),
  confidence: z.number().min(0).max(1),
  /**
   * Thêm 2026-10-09 (changelog 0547): bước ĐÃ CHỨNG MINH đúng VÀ ở dạng đáp số cuối (vd `x = 5`
   * tương đương đề; phương trình hoá cân bằng tối giản, đúng các chất của đề). Chỉ khi có cờ này
   * bài mới được đánh "đã giải xong" — một bước giữa hợp lệ (vd `2x = 10`) thì chưa.
   */
  isFinalAnswer: z.boolean().optional(),
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

/** Nhãn ✗ cụ thể theo loại lỗi — người học thấy NGAY lỗi thuộc loại gì, không chỉ "sai". */
const NHAN_LOI: Partial<Record<ScratchpadStepValidation['errorType'], string>> = {
  changed_solutions: '✗ Đổi nghiệm',
  division_by_zero: '✗ Chia cho 0',
  unbalanced_equation: '✗ Lệch nguyên tử',
  unbalanced_charge: '✗ Lệch điện tích',
  substance_changed: '✗ Đổi chất',
  dimension_mismatch: '✗ Lệch thứ nguyên',
}

/**
 * Nhãn chữ của một bước (luôn có KÝ HIỆU + CHỮ, không chỉ dựa vào màu — WCAG 1.4.1):
 * `✓ Hợp lệ` · `✗ <loại lỗi>` · `? Chưa tự kiểm được`.
 */
export function nhanKetQuaBuoc(validation: ScratchpadStepValidation | undefined): string {
  const verdict = ketQuaBuoc(validation)
  if (verdict === 'valid') return '✓ Hợp lệ'
  if (verdict === 'unverified') return '? Chưa tự kiểm được'
  return (validation && NHAN_LOI[validation.errorType]) ?? '✗ Cần chỉnh sửa'
}

export const ScratchpadStepSchema = z.object({
  stepNumber: z.number().int().min(1),
  latexInput: z.string().min(1).max(1000),
  explanation: z.string().max(1000).optional(),
  validation: ScratchpadStepValidationSchema.optional(),
  createdAt: IsoDateTimeSchema,
})
export type ScratchpadStep = z.infer<typeof ScratchpadStepSchema>

/**
 * Bảng THỨ NGUYÊN biến của một đề Vật lí: ký hiệu → đơn vị SI, vd `{ v: 'm/s', a: 'm/s^2', t: 's' }`
 * (`''` = không thứ nguyên). Thêm 2026-10-09 (changelog 0552,
 * `docs/specs/2026-10-09-kiem-thu-nguyen-vat-li.md`). Tuỳ chọn để tương thích ngược: đề không khai
 * thì bộ kiểm thứ nguyên trả "chưa tự kiểm được" — KHÔNG đoán thứ nguyên từ tên biến.
 */
export const StemVariableTableSchema = z
  .record(z.string().min(1).max(32), z.string().max(64))
  .refine((t) => Object.keys(t).length <= 64, { message: 'tối đa 64 biến' })
export type StemVariableTable = z.infer<typeof StemVariableTableSchema>

export const StemProblemStateSchema = z.object({
  id: z.string().min(1),
  personId: UuidSchema,
  subject: StemSubjectTypeSchema,
  title: z.string().min(1).max(200),
  problemStatement: z.string().min(1).max(2000),
  problemLatex: z.string().max(1000).optional(),
  /** Bảng thứ nguyên biến (chỉ đề Vật lí dùng) — xem `StemVariableTableSchema`. */
  variables: StemVariableTableSchema.optional(),
  steps: z.array(ScratchpadStepSchema),
  isSolved: z.boolean(),
  hintsUsed: z.number().int().min(0).default(0),
  createdAt: IsoDateTimeSchema,
  updatedAt: IsoDateTimeSchema,
})
export type StemProblemState = z.infer<typeof StemProblemStateSchema>
