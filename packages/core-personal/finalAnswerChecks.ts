// packages/core-personal/finalAnswerChecks.ts — Kiểm câu trả lời CUỐI của Bạn Đồng Hành (GĐ3).
//
// Ý tưởng `final_answer_checks` của smolagents (nghiên cứu mục 2.2): trước khi câu trả lời tới
// người dùng và được lưu vào lịch sử, chạy vài phép kiểm. Ở đây CHỈ dùng phép kiểm TẤT ĐỊNH (0 lời
// gọi AI, test được) cho bốn lỗi có thật:
//   1. `markup`            — model chép lại thẻ bọc dữ liệu `<du_lieu_…>` hoặc thẻ dạng gọi công cụ.
//   2. `internal_id`       — uuid nội bộ lọt vào câu chữ (người dùng không cần, và là dữ liệu hệ thống).
//   3. `false_save_claim`  — "mình đã lưu/ghi nhớ…" trong khi lượt này KHÔNG có gì được lưu thật:
//      đúng lỗi persona cấm ("Không nói 'tôi đã lưu' khi không có tác vụ nào") nhưng prompt không
//      chặn được 100%. Sửa bằng một câu đính chính nối vào cuối — không xoá lời model.
//   4. `language_mismatch` — người dùng viết tiếng Việt mà câu trả lời dài không có chữ Việt có dấu:
//      CHỈ ghi nhận (đổi ngôn ngữ có thể là chủ ý khi luyện tiếng Anh).
// Cố ý KHÔNG kiểm "lộ lời giải" bằng mã — không có phép kiểm tất định đáng tin cho văn bản tự do.
import type { ProposedAction } from '@dhcb/core-contracts/proposedAction'
import { sanitizeCompanionVisibleText, type VisibleTextIssue } from './companionVisibleText.js'

export type FinalCheckIssue = VisibleTextIssue | 'false_save_claim' | 'language_mismatch'

export interface FinalCheckResult {
  text: string
  issues: FinalCheckIssue[]
}

export interface FinalCheckInput {
  reply: string
  userMessage: string
  proposedActions: ProposedAction[]
}

/** "(mình|tôi|Bạn Đồng Hành) đã lưu/ghi nhớ/ghi lại/cập nhật/thêm vào…" — khẳng định đã GHI ("lưu ý" không tính). */
const SAVE_CLAIM =
  /\b(mình|tôi|bạn đồng hành|em)\s+(đã|vừa)\s+(lưu(?! ý)|ghi nhớ|ghi lại|ghi vào|cập nhật|thêm vào|đặt mục tiêu)/i

const VI_DIACRITIC = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i

export const NOTHING_SAVED_NOTE = '(Lưu ý: Bạn Đồng Hành chưa lưu gì trong lượt này.)'
export const PENDING_SAVE_NOTE =
  '(Lưu ý: chưa có gì được lưu — đề xuất đang chờ bạn bấm "Xác nhận" bên dưới.)'

const LANGUAGE_CHECK_MIN_CHARS = 80

export function runFinalAnswerChecks(input: FinalCheckInput): FinalCheckResult {
  const surface = sanitizeCompanionVisibleText(input.reply)
  const issues: FinalCheckIssue[] = [...surface.issues]
  let text = surface.text

  // Gỡ thẻ/id có thể để lại khoảng trắng thừa — gọn lại nhưng giữ xuống dòng của markdown.
  if (issues.length > 0) {
    text = text
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  }

  const committed = input.proposedActions.some((a) => a.status === 'committed')
  if (!committed && SAVE_CLAIM.test(text)) {
    issues.push('false_save_claim')
    const pending = input.proposedActions.some((a) => a.status === 'pending')
    text = `${text}\n\n${pending ? PENDING_SAVE_NOTE : NOTHING_SAVED_NOTE}`
  }

  if (
    VI_DIACRITIC.test(input.userMessage) &&
    text.length > LANGUAGE_CHECK_MIN_CHARS &&
    !VI_DIACRITIC.test(text)
  ) {
    issues.push('language_mismatch')
  }

  return { text, issues }
}
