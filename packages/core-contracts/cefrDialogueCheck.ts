// packages/core-contracts/cefrDialogueCheck.ts — Hợp đồng "server CHẤM LẠI kiểm tra hiểu hội
// thoại CEFR" (đợt 0555).
//
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §③
//
// NGUYÊN TẮC (giống S11 `completionEvidence.ts`): client chỉ gửi LỰA CHỌN THÔ (id câu → id phương
// án) kèm seed; server dựng LẠI đề từ dữ liệu hội thoại + seed bằng cùng hàm
// `buildComprehensionQuiz`, tự chấm, rồi mới ghi "đã học". Schema `.strict()` không có chỗ cho
// `correct`/`passed`/`score` do client tự tính.

import { z } from 'zod'

// ── Khoá lưu trong mảng `cefr_dialogues` (cột `english.learning_progress`) ────────────────────
// "đã xem": "<ownerId>:<titleEn>" · "đã học": "learned|<ownerId>:<titleEn>" — CHUNG một mảng, phân
// biệt bằng tiền tố (đặc tả 0548 §③). Khai ở gói hợp đồng vì CẢ client lẫn server cần đúng một
// định nghĩa: server ghi bản "đã học" sau khi chấm, và `/api/progress` lọc bỏ bản "đã học" do
// client tự đẩy lên.
export const DIALOGUE_LEARNED_PREFIX = 'learned|'

/** Khoá "đã xem" của một hội thoại — hội thoại không có id riêng nên ghép id unit/vòng + tên. */
export const dialogueKey = (ownerId: string, titleEn: string): string => `${ownerId}:${titleEn}`

/** Khoá "đã học" — CHỈ server được ghi khoá này lên cột `cefr_dialogues`. */
export const learnedDialogueEntry = (ownerId: string, titleEn: string): string =>
  `${DIALOGUE_LEARNED_PREFIX}${dialogueKey(ownerId, titleEn)}`

/** Bản ghi này có phải "đã học" không (để `/api/progress` lọc bản client tự khai). */
export const isLearnedDialogueEntry = (entry: string): boolean =>
  entry.startsWith(DIALOGUE_LEARNED_PREFIX)

/** Giá trị `?action=` của `POST /api/learning/evidence` cho việc này. */
export const CEFR_DIALOGUE_ACTION = 'cefr-dialogue'

// ── Đầu vào ───────────────────────────────────────────────────────────────────────────────────

/** Trần số lần làm: số nguyên dương 31 bit (client chọn ngẫu nhiên điểm bắt đầu). */
export const MAX_DIALOGUE_ATTEMPT = 2_147_483_647

/** Id câu hỏi do `buildComprehensionQuiz` sinh: `<loại>-<chỉ số dòng>`. */
export const DialogueQuestionIdSchema = z.string().regex(/^(meaning|next-line|speaker)-\d{1,3}$/)
/** Id phương án: vị trí `o0..o3` (câu nghĩa / câu tiếp theo) hoặc `A`/`B` (câu "ai nói"). */
export const DialogueOptionIdSchema = z.string().regex(/^(o[0-3]|A|B)$/)

export const DialogueCheckAnswerSchema = z
  .object({ questionId: DialogueQuestionIdSchema, optionId: DialogueOptionIdSchema })
  .strict()

export const DialogueCheckInputSchema = z
  .object({
    /** Id unit/vòng sở hữu hội thoại (khoá của `dialogues.json`). */
    ownerId: z.string().regex(/^[a-z0-9-]{2,64}$/),
    // KHÔNG trim: tên là một nửa khoá tra cứu, phải khớp từng ký tự với dữ liệu.
    titleEn: z.string().min(1).max(200),
    direction: z.enum(['A', 'B']),
    attempt: z.number().int().min(0).max(MAX_DIALOGUE_ATTEMPT),
    /** Đề tối đa 3 câu (QUIZ_SIZE) — gửi thừa là dữ liệu bất thường, từ chối thẳng. */
    answers: z.array(DialogueCheckAnswerSchema).min(1).max(3),
  })
  .strict()
export type DialogueCheckInput = z.infer<typeof DialogueCheckInputSchema>

// ── Đầu ra ────────────────────────────────────────────────────────────────────────────────────

export const DialogueCheckItemSchema = z
  .object({
    questionId: DialogueQuestionIdSchema,
    /** `null` = bỏ trống (tính là sai). */
    chosenId: DialogueOptionIdSchema.nullable(),
    /** Đáp án đúng — CHỈ trả về SAU khi lượt đã nộp và đã chấm (không có đường hỏi trước). */
    correctId: DialogueOptionIdSchema,
    correct: z.boolean(),
  })
  .strict()

export const DialogueCheckResultSchema = z
  .object({
    correct: z.number().int().min(0),
    total: z.number().int().min(0),
    required: z.number().int().min(0),
    passed: z.boolean(),
    /** `true` = sau request này server ĐANG giữ bản ghi "đã học" (mới ghi, hoặc đã có từ trước). */
    saved: z.boolean(),
    items: z.array(DialogueCheckItemSchema),
  })
  .strict()
export type DialogueCheckResult = z.infer<typeof DialogueCheckResultSchema>

/** Mã lỗi máy-đọc được — client dịch sang lời nhắn cho người học. */
export const DialogueCheckErrorCodeSchema = z.enum([
  'CONTENT_NOT_FOUND', // không có hội thoại (owner, titleEn) này
  'NO_QUIZ', // hội thoại quá ngắn, không dựng được đề
  'QUIZ_MISMATCH', // id câu client gửi không thuộc đề server dựng (dữ liệu hai bên lệch phiên bản)
  'ATTEMPT_USED', // lượt (seed) này đã nộp rồi — mỗi lượt chỉ chấm MỘT lần, chống dò đáp án
])
export type DialogueCheckErrorCode = z.infer<typeof DialogueCheckErrorCodeSchema>
