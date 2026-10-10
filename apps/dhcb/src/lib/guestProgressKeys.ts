// guestProgressKeys.ts — DANH SÁCH khoá localStorage thuộc về một uid + phép kiểm "khách đã học
// gì chưa". Tách khỏi `guestProgress.ts` (2026-10-10, changelog đợt này) vì `AuthProvider` gọi
// `hasGuestProgress()` ở MỖI lần nạp phiên lúc mở trang: import cả `guestProgress.ts` là kéo
// `learningSession`/`stemEvidence`/`learnerIntentStore` và cả zod (~24 kB brotli) vào bundle
// khởi động. File này chỉ được import thứ NHẸ; phần hợp nhất nặng nạp động khi thật sự cần.
// Ý nghĩa từng khoá: xem chú thích đầu `guestProgress.ts`.
import { getGuestId, isGuestId } from '@core/guestId'
import {
  EVIDENCE_LOG_PREFIX,
  EVIDENCE_PENDING_PREFIX,
  EVIDENCE_STATE_PREFIX,
  INTENT_KEY_PREFIX,
} from './storageKeyPrefixes'

/**
 * Khoá localStorage dạng MẢNG CHUỖI, hợp nhất bằng union.
 * Phải khớp đúng khoá thật ở các module tương ứng — xem chú thích ở `progressSync.ts`.
 */
export const ARRAY_KEYS = [
  'et_learned_', // lib/vocab.ts
  'et_hard_', // lib/vocab.ts
  'et_cefr_grammar_', // lib/cefrProgress.ts
  'et_cefr_dialogue_', // lib/cefrProgress.ts
  'et_achievements_', // lib/achievements.ts
  'dhcb_prog_levels_entered_', // lib/programmingLevelLock.ts (tập bậc đã vào)
] as const

/** Khoá dạng OBJECT map — hợp nhất nông: khoá con của khách chỉ ĐIỀN VÀO chỗ còn trống. */
export const MAP_KEYS = [
  'srs_', // lib/srs.ts
  'et_cefr_exams_', // lib/cefrExam.ts
] as const

/** Tiến độ bài học môn Lập trình — mảng object có `lessonId`, hợp nhất theo `lessonId`. */
export const PROGRAMMING_PROGRESS_PREFIX = 'dhcb_prog_progress_'

/**
 * Mọi tiền tố khoá thuộc về một uid — dùng để DỌN SẠCH dấu vết khách sau khi đã hợp nhất.
 * `et_usage_` có hậu tố ngày nên xử lý riêng ở `clearGuestKeys`.
 */
export const ALL_PREFIXES: readonly string[] = [
  ...ARRAY_KEYS,
  ...MAP_KEYS,
  PROGRAMMING_PROGRESS_PREFIX,
  'et_placement_',
  'et_weekly_goal_',
  'et_cefr_unlocked_',
  'et_chat_',
  'et_writing_',
  'et_speaking_',
  // Bằng chứng hoàn thành bài STEM của khách (slice S11-2): nhật ký, trạng thái suy ra và hàng
  // đợi chờ gửi lại. Đăng ký đủ CẢ BA ở đây vì `clearGuestKeys` chỉ xoá những tiền tố có trong
  // danh sách này — bỏ sót một cái là khách SAU kế thừa kết quả của khách TRƯỚC trên cùng máy.
  EVIDENCE_LOG_PREFIX,
  EVIDENCE_STATE_PREFIX,
  EVIDENCE_PENDING_PREFIX,
  // Ý định học của khách (slice S05). Đăng ký ở đây để nó vừa được DỌN sau khi hợp nhất, vừa
  // tính là "khách đã có gì đó" — nếu không, ý định sẽ mất đúng lúc người ta đăng ký tài khoản
  // (quyết định Q4 của đặc tả S05).
  INTENT_KEY_PREFIX,
]

/** Khách này đã học được gì chưa? Dùng để khỏi gọi hợp nhất/đẩy mạng vô ích. */
export function hasGuestProgress(guestId: string = getGuestId()): boolean {
  if (!isGuestId(guestId)) return false
  for (const prefix of ALL_PREFIXES) {
    const raw = (() => {
      try {
        return localStorage.getItem(prefix + guestId)
      } catch {
        return null
      }
    })()
    if (!raw) continue
    // '[]' / '{}' là "có khoá nhưng rỗng" — không tính là đã học.
    if (raw !== '[]' && raw !== '{}') return true
  }
  return false
}
