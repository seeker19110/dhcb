// packages/core-contracts/cefrDialogueCheck.ts — Hợp đồng "server CHẤM LẠI kiểm tra hiểu hội
// thoại CEFR" (đợt 0555) + "seed do SERVER cấp, không trả đáp án câu sai" (đợt 0558).
//
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §③ và
// docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md §③
//
// NGUYÊN TẮC (giống S11 `completionEvidence.ts`): client MỞ LƯỢT (`cefr-dialogue-start`) để nhận
// token mờ + đề ĐÃ BỎ ĐÁP ÁN; khi nộp chỉ gửi token + LỰA CHỌN THÔ (id câu → id phương án). Server
// suy seed ẩn từ token, dựng LẠI đề bằng cùng `buildComprehensionQuiz`, tự chấm, rồi mới ghi "đã
// học". Schema `.strict()` không có chỗ cho `correct`/`passed`/`score` do client tự tính, và thân
// phản hồi KHÔNG BAO GIỜ chứa `correctId`/seed.

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

/** Giá trị `?action=` của `POST /api/learning/evidence`: nộp lượt (chấm). */
export const CEFR_DIALOGUE_ACTION = 'cefr-dialogue'
/** Giá trị `?action=`: MỞ lượt — server cấp token + đề đã bỏ đáp án (đợt 0558). */
export const CEFR_DIALOGUE_START_ACTION = 'cefr-dialogue-start'

/** Trần độ dài token lượt làm client gửi lại (khớp `MAX_ATTEMPT_TOKEN_LENGTH` phía server). */
export const MAX_DIALOGUE_TOKEN_LENGTH = 2048

// ── Dùng chung ────────────────────────────────────────────────────────────────────────────────

const OwnerIdSchema = z.string().regex(/^[a-z0-9-]{2,64}$/)
// KHÔNG trim: tên là một nửa khoá tra cứu, phải khớp từng ký tự với dữ liệu.
const TitleEnSchema = z.string().min(1).max(200)
const DirectionSchema = z.enum(['A', 'B'])
const TextLangSchema = z.enum(['en', 'vi'])

/** Id câu hỏi do `buildComprehensionQuiz` sinh: `<loại>-<chỉ số dòng>`. */
export const DialogueQuestionIdSchema = z.string().regex(/^(meaning|next-line|speaker)-\d{1,3}$/)
/** Id phương án: vị trí `o0..o3` (câu nghĩa / câu tiếp theo) hoặc `A`/`B` (câu "ai nói"). */
export const DialogueOptionIdSchema = z.string().regex(/^(o[0-3]|A|B)$/)

export const DialogueCheckAnswerSchema = z
  .object({ questionId: DialogueQuestionIdSchema, optionId: DialogueOptionIdSchema })
  .strict()

// ── MỞ LƯỢT (đợt 0558) ────────────────────────────────────────────────────────────────────────

export const DialogueStartInputSchema = z
  .object({
    /** Id unit/vòng sở hữu hội thoại (khoá của `dialogues.json`). */
    ownerId: OwnerIdSchema,
    titleEn: TitleEnSchema,
    direction: DirectionSchema,
  })
  .strict()
export type DialogueStartInput = z.infer<typeof DialogueStartInputSchema>

/** Một phương án hiện cho người học (chữ + ngôn ngữ để gắn `lang`). */
export const PublicDialogueOptionSchema = z
  .object({ id: DialogueOptionIdSchema, text: z.string(), lang: TextLangSchema.optional() })
  .strict()

/**
 * Câu hỏi BẢN CÔNG KHAI — đúng những gì giao diện cần để hiện đề, KHÔNG có `correctId` lẫn
 * `explanation` (giải thích trích nguyên văn đáp án nên cũng là đáp án).
 */
export const PublicDialogueQuestionSchema = z
  .object({
    id: DialogueQuestionIdSchema,
    kind: z.enum(['meaning', 'next-line', 'speaker']),
    prompt: z.string(),
    stem: z.string(),
    stemLang: TextLangSchema,
    stemSpeaker: z.string().optional(),
    options: z.array(PublicDialogueOptionSchema).min(2).max(4),
  })
  .strict()
export type PublicDialogueQuestion = z.infer<typeof PublicDialogueQuestionSchema>

export const DialogueStartResultSchema = z
  .object({
    /** Token mờ — gửi lại nguyên văn khi nộp. Seed KHÔNG nằm trong đây. */
    token: z.string().min(1).max(MAX_DIALOGUE_TOKEN_LENGTH),
    /** Epoch ms — quá mốc này server trả `ATTEMPT_EXPIRED`. */
    expiresAt: z.number().int().positive(),
    /** 2..3 câu (MIN_QUESTIONS..QUIZ_SIZE). */
    questions: z.array(PublicDialogueQuestionSchema).min(2).max(3),
  })
  .strict()
export type DialogueStartResult = z.infer<typeof DialogueStartResultSchema>

// ── NỘP LƯỢT ──────────────────────────────────────────────────────────────────────────────────

export const DialogueCheckInputSchema = z
  .object({
    token: z.string().min(1).max(MAX_DIALOGUE_TOKEN_LENGTH),
    /** Đề tối đa 3 câu (QUIZ_SIZE) — gửi thừa là dữ liệu bất thường, từ chối thẳng. */
    answers: z.array(DialogueCheckAnswerSchema).min(1).max(3),
  })
  .strict()
export type DialogueCheckInput = z.infer<typeof DialogueCheckInputSchema>

// ── Đầu ra ────────────────────────────────────────────────────────────────────────────────────

/** Lời giải thích — CHỈ đi kèm câu ĐÚNG (câu sai mà giải thích là lộ đáp án). */
export const DialogueExplanationSchema = z
  .object({ lead: z.string(), quote: z.string().optional(), quoteLang: TextLangSchema.optional() })
  .strict()

export const DialogueCheckItemSchema = z
  .object({
    questionId: DialogueQuestionIdSchema,
    /** `null` = bỏ trống (tính là sai). */
    chosenId: DialogueOptionIdSchema.nullable(),
    correct: z.boolean(),
    /** Có khi và chỉ khi `correct === true`. KHÔNG có `correctId` — câu sai không lộ đáp án. */
    explanation: DialogueExplanationSchema.optional(),
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

/**
 * Thân 409 `ATTEMPT_USED`: `saved` = server ĐANG giữ bản "đã học" của hội thoại này (lượt trước có
 * thể đã chấm xong nhưng phản hồi rơi trên đường về) — client phản chiếu thay vì bắt làm lại.
 */
export const AttemptUsedBodySchema = z
  .object({ code: z.literal('ATTEMPT_USED'), saved: z.boolean() })
  .passthrough()

/** Mã lỗi máy-đọc được — client dịch sang lời nhắn cho người học. */
export const DialogueCheckErrorCodeSchema = z.enum([
  'CONTENT_NOT_FOUND', // không có hội thoại (owner, titleEn) này
  'NO_QUIZ', // hội thoại quá ngắn, không dựng được đề
  'QUIZ_MISMATCH', // id câu client gửi không thuộc đề server dựng (dữ liệu hai bên lệch phiên bản)
  'ATTEMPT_USED', // lượt (token) này đã nộp rồi — mỗi lượt chỉ chấm MỘT lần, chống dò đáp án
  'ATTEMPT_EXPIRED', // token quá hạn / sai chữ ký / không thuộc tài khoản này — mở lượt mới
  'SERVICE_UNAVAILABLE', // 503: bộ đếm dùng chung (Redis) không sẵn sàng — chưa chấm, gửi lại sau
])
export type DialogueCheckErrorCode = z.infer<typeof DialogueCheckErrorCodeSchema>
