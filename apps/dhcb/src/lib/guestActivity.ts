// apps/dhcb/src/lib/guestActivity.ts — Khách (chưa đăng nhập) đã làm được VIỆC THẬT nào chưa.
//
// Đặc tả: docs/specs/2026-09-17-redesign-trang-chu-thi-hanh.md §P0-3 ③.
//
// Dùng để quyết định `GuestBanner` (nhắc "đăng ký để giữ tiến độ") có nên hiện hay không: khách
// vừa mở trang lần đầu, CHƯA làm gì thì banner chỉ gây phiền — chỉ hiện SAU KHI họ đã có ít nhất
// một dấu vết học thật trên máy này.
//
// Hai bằng chứng đủ để coi là "đã có phiên":
//  1. Có ít nhất một khoá `LEARNING_SESSION_PREFIX` trong localStorage — khách đang dở/đã dở một
//     bài học thật (xem `lib/learningSession.ts`).
//  2. Có bản ghi ý định học của khách (`dhcb_intent_<guestId>`) đã chọn ít nhất một môn — khách
//     đã trả lời xong luồng "Bắt đầu theo ý định" ở `/bat-dau` (`LearnerIntent.subjectIds`).
//
// KHÔNG dùng `readLocalIntent` (kiểm đủ hợp đồng bằng zod): file này chạy lúc MỞ TRANG qua
// `GuestBanner`, import nó là kéo cả zod (~24 kB brotli) vào bundle khởi động. Ở đây chỉ cần
// biết "khách đã chọn môn chưa" để quyết định hiện một banner — kiểm nhẹ `subjectIds` là đủ;
// chỗ nào THẬT SỰ dùng ý định vẫn đọc qua `readLocalIntent` (đo 2026-10-10, changelog đợt này).
//
// Mọi truy cập localStorage bọc try/catch: chế độ riêng tư của trình duyệt có thể ném ngay ở
// `localStorage.length`/`getItem` — ném thì coi như CHƯA có phiên nào (an toàn hơn: banner ẩn
// nhầm còn hơn hiện nhầm lúc khách chưa làm gì).
import { getGuestId } from '@core/guestId'
import { INTENT_KEY_PREFIX, LEARNING_SESSION_PREFIX } from './storageKeyPrefixes'

function hasLearningSessionKey(): boolean {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(LEARNING_SESSION_PREFIX)) return true
  }
  return false
}

/** Bản ghi ý định có chọn ít nhất một môn. JSON hỏng/lệch khuôn ⇒ `false`, không ném. */
function hasChosenSubject(raw: string | null): boolean {
  if (!raw) return false
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return false
    const subjectIds = (parsed as { subjectIds?: unknown }).subjectIds
    return Array.isArray(subjectIds) && subjectIds.length > 0
  } catch {
    return false
  }
}

/** Khách đã làm ít nhất một việc thật trên máy này chưa (phiên học hoặc đã chọn việc ở /bat-dau). */
export function hasAnyGuestSession(): boolean {
  try {
    if (hasLearningSessionKey()) return true
    return hasChosenSubject(localStorage.getItem(INTENT_KEY_PREFIX + getGuestId()))
  } catch {
    return false
  }
}
