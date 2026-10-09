// dialogueCheckClient.ts — Phía CLIENT của kiểm tra hiểu hội thoại CEFR do server cấp lượt và chấm
// (đợt 0555 chấm lại; đợt 0558 seed do server cấp; đợt 0559 trần lượt nộp sai).
//
// Đặc tả: docs/specs/2026-10-09-hoi-thoai-cefr-server-cham-lai.md §③ (bảng ca lỗi) +
// docs/specs/2026-10-09-hoi-thoai-cefr-seed-server-cap.md §③.
//
// Hai bước: MỞ LƯỢT (`startDialogueCheck`) nhận token mờ + đề đã bỏ đáp án; NỘP (`submitDialogueCheck`)
// gửi token + lựa chọn thô. Máy KHÔNG có đáp án, không chấm được tại chỗ — server là nguồn sự thật
// duy nhất. Mọi kết cục trả về dưới dạng union có tên để giao diện NÓI THẬT điều gì đã xảy ra. File
// này KHÔNG ném: lỗi mạng hay JSON hỏng đều thành một nhánh.
import { getAuthHeader } from '@core/authHeader'
import {
  AttemptUsedBodySchema,
  CEFR_DIALOGUE_ACTION,
  CEFR_DIALOGUE_START_ACTION,
  DialogueCheckErrorCodeSchema,
  DialogueCheckInputSchema,
  DialogueCheckResultSchema,
  DialogueStartInputSchema,
  DialogueStartResultSchema,
  type DialogueCheckErrorCode,
  type DialogueCheckInput,
  type DialogueCheckResult,
  type DialogueStartInput,
  type DialogueStartResult,
} from '@dhcb/core-contracts/cefrDialogueCheck'

export const DIALOGUE_CHECK_URL = `/api/learning/evidence?action=${CEFR_DIALOGUE_ACTION}`
export const DIALOGUE_START_URL = `/api/learning/evidence?action=${CEFR_DIALOGUE_START_ACTION}`

/** Kết cục chung của cả hai bước khi KHÔNG nhận được kết quả. */
export type DialogueCheckFailure =
  /** Không tới được server (mất mạng) — gửi lại được. */
  | { kind: 'offline' }
  /** 401/403 — hết phiên đăng nhập. */
  | { kind: 'auth' }
  /** 429 — quá nhanh, đợi rồi gửi lại. */
  | { kind: 'rate-limited' }
  /** 503 SERVICE_UNAVAILABLE — máy chủ tạm bận, CHƯA làm gì; gửi lại sau ít phút. */
  | { kind: 'unavailable' }
  /** Còn lại (400 khác, 5xx, phản hồi sai hợp đồng) — gửi lại được. */
  | { kind: 'error' }

export type DialogueStartOutcome =
  /** Server đã cấp lượt: token + đề công khai. */
  | { kind: 'started'; result: DialogueStartResult }
  /** 400 NO_QUIZ — hội thoại quá ngắn, không kiểm tra được. */
  | { kind: 'no-quiz' }
  /** 409 ATTEMPT_CAP — đã nộp sai đủ trần trong 24 giờ; đọc lại hội thoại, mai làm tiếp. */
  | { kind: 'attempt-cap' }
  | DialogueCheckFailure

export type DialogueCheckOutcome =
  /** Server đã chấm (đạt hay chưa đạt đều ở đây). */
  | { kind: 'graded'; result: DialogueCheckResult }
  /**
   * 409 ATTEMPT_USED — lượt này đã được chấm; phải Làm lại (đề mới). `saved` = server đang giữ "đã
   * học" (lượt trước đã đạt nhưng phản hồi rơi trên đường về) → màn phản chiếu, không bắt làm lại.
   */
  | { kind: 'attempt-used'; saved: boolean }
  /** 409 ATTEMPT_EXPIRED — token hết hạn/không hợp lệ; Làm lại (đề mới). */
  | { kind: 'attempt-expired' }
  /** 409 QUIZ_MISMATCH — dữ liệu hội thoại ở máy lệch server; tải lại trang. */
  | { kind: 'outdated' }
  /** 409 ATTEMPT_CAP — hết trần lượt nộp sai trong 24 giờ; lượt này KHÔNG được chấm. */
  | { kind: 'attempt-cap' }
  | DialogueCheckFailure

async function readCode(res: Response): Promise<DialogueCheckErrorCode | undefined> {
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

/** Gửi POST JSON kèm header đăng nhập; `null` = không tới được server. */
async function postJson(url: string, body: unknown): Promise<Response | null> {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(body),
    })
  } catch {
    return null
  }
}

/** Ca lỗi chung của hai bước (sau khi đã loại các mã riêng của từng bước). */
async function commonFailure(res: Response): Promise<DialogueCheckFailure> {
  if (res.status === 401 || res.status === 403) return { kind: 'auth' }
  if (res.status === 429) return { kind: 'rate-limited' }
  if (res.status === 503 && (await readCode(res)) === 'SERVICE_UNAVAILABLE') {
    return { kind: 'unavailable' }
  }
  return { kind: 'error' }
}

/** MỞ một lượt kiểm tra hiểu: server cấp token + đề (không đáp án). Không bao giờ ném. */
export async function startDialogueCheck(input: DialogueStartInput): Promise<DialogueStartOutcome> {
  const body = DialogueStartInputSchema.safeParse(input)
  if (!body.success) return { kind: 'error' }
  const res = await postJson(DIALOGUE_START_URL, body.data)
  if (!res) return { kind: 'offline' }
  if (res.ok) {
    try {
      const parsed = DialogueStartResultSchema.safeParse(await res.json())
      if (parsed.success) return { kind: 'started', result: parsed.data }
    } catch {
      /* rơi xuống nhánh lỗi */
    }
    console.warn('[dialogue-check] phản hồi mở lượt 200 không khớp hợp đồng')
    return { kind: 'error' }
  }
  if (res.status === 400 && (await readCode(res)) === 'NO_QUIZ') return { kind: 'no-quiz' }
  if (res.status === 409 && (await readCode(res)) === 'ATTEMPT_CAP') return { kind: 'attempt-cap' }
  return commonFailure(res)
}

/** Nộp MỘT lượt kiểm tra hiểu cho server chấm. Không bao giờ ném. */
export async function submitDialogueCheck(
  input: DialogueCheckInput,
): Promise<DialogueCheckOutcome> {
  // Validate trước khi gửi: lỗi lập trình ở client lộ ngay ở đây, không thành 400 khó hiểu.
  const body = DialogueCheckInputSchema.safeParse(input)
  if (!body.success) return { kind: 'error' }
  const res = await postJson(DIALOGUE_CHECK_URL, body.data)
  if (!res) return { kind: 'offline' }
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
  if (res.status === 409) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      return { kind: 'error' }
    }
    const used = AttemptUsedBodySchema.safeParse(body)
    if (used.success) return { kind: 'attempt-used', saved: used.data.saved }
    const parsed = DialogueCheckErrorCodeSchema.safeParse((body as { code?: unknown })?.code)
    const code = parsed.success ? parsed.data : undefined
    if (code === 'ATTEMPT_USED') return { kind: 'attempt-used', saved: false }
    if (code === 'ATTEMPT_EXPIRED') return { kind: 'attempt-expired' }
    if (code === 'QUIZ_MISMATCH') return { kind: 'outdated' }
    if (code === 'ATTEMPT_CAP') return { kind: 'attempt-cap' }
    return { kind: 'error' }
  }
  return commonFailure(res)
}
