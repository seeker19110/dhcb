// cefrDialogueKey.ts — Phần THUẦN (không zod) của `cefrDialogueCheck.ts`: khoá hội thoại CEFR.
// Tách riêng (audit 2026-10-10, đợt E4.1b) để `lib/cefrProgress.ts` trên route `/` không kéo zod
// bản đầy đủ. File này cố ý không import gì.

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
