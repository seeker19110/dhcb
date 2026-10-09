// dialogueCheckClient.ts — Phía CLIENT của "server CHẤM LẠI kiểm tra hiểu hội thoại CEFR" (đợt 0555).
//
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §③ (bảng ca lỗi).
//
// Client chỉ gửi LỰA CHỌN THÔ + seed (owner, titleEn, chiều, số lượt). Server dựng lại đề, chấm và
// tự ghi "đã học". Mọi kết cục được trả về dưới dạng một union có tên để giao diện NÓI THẬT điều gì
// đã xảy ra (đã lưu / mất mạng / hết phiên / nộp quá nhanh / lượt đã dùng / dữ liệu đã đổi / lỗi).
// File này KHÔNG ném: lỗi mạng hay JSON hỏng đều thành một nhánh.
import { getAuthHeader } from '@core/authHeader'
import {
  CEFR_DIALOGUE_ACTION,
  DialogueCheckErrorCodeSchema,
  DialogueCheckInputSchema,
  DialogueCheckResultSchema,
  type DialogueCheckInput,
  type DialogueCheckResult,
} from '@dhcb/core-contracts/cefrDialogueCheck'

export const DIALOGUE_CHECK_URL = `/api/learning/evidence?action=${CEFR_DIALOGUE_ACTION}`

export type DialogueCheckOutcome =
  /** Server đã chấm (đạt hay chưa đạt đều ở đây). */
  | { kind: 'graded'; result: DialogueCheckResult }
  /** Không tới được server (mất mạng) — gửi lại được. */
  | { kind: 'offline' }
  /** 401/403 — hết phiên đăng nhập. */
  | { kind: 'auth' }
  /** 429 — nộp quá nhanh, đợi rồi gửi lại. */
  | { kind: 'rate-limited' }
  /** 409 ATTEMPT_USED — lượt này đã được chấm; phải Làm lại (đề mới). */
  | { kind: 'attempt-used' }
  /** 409 QUIZ_MISMATCH — dữ liệu hội thoại ở máy cũ hơn server; tải lại trang. */
  | { kind: 'outdated' }
  /** Còn lại (400 khác, 5xx, phản hồi sai hợp đồng) — gửi lại được. */
  | { kind: 'error' }

async function readCode(res: Response): Promise<string | undefined> {
  try {
    const body: unknown = await res.json()
    if (typeof body === 'object' && body !== null && 'code' in body) {
      const parsed = DialogueCheckErrorCodeSchema.safeParse((body as { code: unknown }).code)
      return parsed.success ? parsed.data : undefined
    }
  } catch {
    /* thân không phải JSON */
  }
  return undefined
}

/** Nộp MỘT lượt kiểm tra hiểu cho server chấm. Không bao giờ ném. */
export async function submitDialogueCheck(
  input: DialogueCheckInput,
): Promise<DialogueCheckOutcome> {
  // Validate trước khi gửi: lỗi lập trình ở client lộ ngay ở đây, không thành 400 khó hiểu.
  const body = DialogueCheckInputSchema.safeParse(input)
  if (!body.success) return { kind: 'error' }

  let res: Response
  try {
    res = await fetch(DIALOGUE_CHECK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(body.data),
    })
  } catch {
    return { kind: 'offline' }
  }

  if (res.ok) {
    try {
      const parsed = DialogueCheckResultSchema.safeParse(await res.json())
      if (parsed.success) return { kind: 'graded', result: parsed.data }
    } catch {
      /* rơi xuống nhánh lỗi */
    }
    console.warn('[dialogue-check] phản hồi 200 không khớp hợp đồng')
    return { kind: 'error' }
  }
  if (res.status === 401 || res.status === 403) return { kind: 'auth' }
  if (res.status === 429) return { kind: 'rate-limited' }
  if (res.status === 409) {
    const code = await readCode(res)
    if (code === 'ATTEMPT_USED') return { kind: 'attempt-used' }
    if (code === 'QUIZ_MISMATCH') return { kind: 'outdated' }
  }
  return { kind: 'error' }
}
