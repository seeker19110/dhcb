// apps/dhcb/src/lib/practiceSessionError.ts — đọc lỗi từ API phòng luyện có phiên trong RAM
// (`/api/scenario-holodeck`, `/api/socratic-diagnostics`).
//
// Vì sao (changelog 0538): server nay cho phiên HẾT HẠN sau 30 phút không hoạt động và đóng phiên
// cũ khi một người mở quá nhiều. Khi đó server trả 404 `{error:{code:'session_not_found'}}`.
// Thẻ phải nhận ra ca này để hiện "Bắt đầu lại" — trước đây thẻ Socratic nuốt lỗi bằng
// `console.error` nên người học bấm "Gửi" mà không có gì xảy ra.

import { z } from 'zod'

/** Mã server trả khi phiên không còn — PHẢI khớp `SESSION_GONE_CODE` ở
 * `packages/core-personal/ttlSessionStore.ts` (test hợp đồng canh). */
export const SESSION_GONE_CODE = 'session_not_found'

const DEFAULT_GONE_MESSAGE = 'Phiên luyện đã hết hạn hoặc không còn — hãy bấm "Bắt đầu lại".'

// Hai khuôn body lỗi đang có ở server: `{error:'chuỗi'}` (handler cũ, lỗi Zod) và
// `{error:{message,code}}` (AppError). Dữ liệu ngoài → kiểm bằng Zod, không ép kiểu.
const ErrorBodySchema = z.object({
  error: z.union([z.string(), z.object({ message: z.string(), code: z.string().optional() })]),
})

/** Lỗi gọi API phòng luyện; `sessionGone` = phiên không còn, cần mở phiên mới. */
export class PracticeSessionError extends Error {
  readonly status: number
  readonly sessionGone: boolean

  constructor(message: string, status: number, sessionGone: boolean) {
    super(message)
    this.name = 'PracticeSessionError'
    this.status = status
    this.sessionGone = sessionGone
  }
}

/** Dựng `PracticeSessionError` từ một phản hồi KHÔNG ok. Body hỏng → dùng `fallback`. */
export async function practiceErrorFromResponse(
  res: Response,
  fallback: string,
): Promise<PracticeSessionError> {
  let message: string | undefined
  let code: string | undefined
  try {
    const parsed = ErrorBodySchema.safeParse(await res.json())
    if (parsed.success) {
      const { error } = parsed.data
      if (typeof error === 'string') message = error
      else ({ message, code } = error)
    }
  } catch {
    // Body không phải JSON (proxy trả HTML…) — giữ thông điệp mặc định.
  }
  // 410 Gone cũng coi là phiên không còn (phòng khi server đổi sang mã này).
  const sessionGone = code === SESSION_GONE_CODE || res.status === 410
  const text = message?.trim() || (sessionGone ? DEFAULT_GONE_MESSAGE : fallback)
  return new PracticeSessionError(text, res.status, sessionGone)
}

/** `err` có phải lỗi "phiên không còn" không. */
export function isSessionGone(err: unknown): boolean {
  return err instanceof PracticeSessionError && err.sessionGone
}
