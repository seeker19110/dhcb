// lib/intent/learnerIntentStore.ts — Đọc/ghi Ý ĐỊNH HỌC.
// Đặc tả: docs/specs/2026-09-15-learning-ux-s05-bat-dau-theo-y-dinh.md §③.4.
//
// Hai nơi chứa, một khuôn khoá:
//   · KHÁCH  → chỉ `localStorage` khoá `dhcb_intent_<guestId>`; TUYỆT ĐỐI không gọi
//     `/api/learner-intent` (endpoint đó cần token, khách gọi chỉ nhận 401 — đúng ngõ cụt mà
//     luồng Intake cũ đang mắc).
//   · TÀI KHOẢN → server là nguồn sự thật, `localStorage` cùng khuôn khoá chỉ là BỘ ĐỆM để màn
//     gợi ý hiện được ngay cả khi mạng lỗi.
//
// Mọi truy cập storage bọc try/catch: chế độ riêng tư của trình duyệt ném ngay ở `getItem`.

import { getAuthHeader } from '@core/authHeader'
import { LearnerIntentSchema, type LearnerIntent } from '@dhcb/core-contracts/learnerIntent'
import { INTENT_KEY_PREFIX } from '../storageKeyPrefixes'

/** Tiền tố khoá — PHẢI trùng với dòng đã đăng ký trong `ALL_PREFIXES` của `guestProgress.ts`. */
export { INTENT_KEY_PREFIX }

export const intentKey = (uid: string): string => `${INTENT_KEY_PREFIX}${uid}`

/** Đọc bộ đệm. Khoá hỏng/lệch hợp đồng ⇒ coi như KHÔNG có, không ném. */
export function readLocalIntent(uid: string): LearnerIntent | null {
  try {
    const raw = localStorage.getItem(intentKey(uid))
    if (!raw) return null
    const parsed = LearnerIntentSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Ghi bộ đệm. `false` nghĩa là máy này không lưu được (giao diện phải nói ra điều đó). */
export function writeLocalIntent(uid: string, intent: LearnerIntent): boolean {
  try {
    localStorage.setItem(intentKey(uid), JSON.stringify(intent))
    return true
  } catch {
    return false
  }
}

export function clearLocalIntent(uid: string): void {
  try {
    localStorage.removeItem(intentKey(uid))
  } catch {
    /* ignore */
  }
}

// ── Server (chỉ dùng cho TÀI KHOẢN) ─────────────────────────────────────────

/** Lấy ý định trên tài khoản. `null` = chưa có; lỗi mạng/401 cũng trả `null` (không chặn luồng). */
export async function fetchServerIntent(): Promise<LearnerIntent | null> {
  try {
    const res = await fetch('/api/learner-intent', {
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
    })
    if (!res.ok) return null
    const data: unknown = await res.json()
    const box = data as { intent?: unknown }
    if (box.intent == null) return null
    const parsed = LearnerIntentSchema.safeParse(box.intent)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Lưu ý định lên tài khoản. `false` = chưa lưu được (bản local vẫn giữ, không mất dữ liệu). */
export async function saveServerIntent(intent: LearnerIntent): Promise<boolean> {
  try {
    const res = await fetch('/api/learner-intent', {
      method: 'PUT',
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ intent }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Dựng một ý định mới hợp lệ từ các câu đã trả lời (bỏ trống thì vắng trường, không rỗng giả). */
export function buildIntent(
  input: Omit<LearnerIntent, 'schemaVersion' | 'createdAt' | 'updatedAt'>,
  now: number,
  createdAt = now,
): LearnerIntent {
  return LearnerIntentSchema.parse({
    ...input,
    schemaVersion: 1,
    createdAt,
    updatedAt: now,
  })
}
