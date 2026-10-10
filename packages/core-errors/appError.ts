// packages/core-errors/appError.ts — Lỗi nghiệp vụ có kiểu, dùng chung cho handler API.
//
// Phase 01 "Foundation OS" mục 4 (docs/phases/01-foundation-os.md): "Normalize application/domain
// errors". Hiện trạng: **257 chỗ** trong `api/`/`packages/` tự viết tay
// `jsonResponse({ error: '...' }, status, headers)`, mỗi handler tự chọn message/status/hình dạng
// JSON (`{error: 'chuỗi'}` ở đa số handler cũ, `{error: {message}}` ở `ai.ts`/handler mới hơn).
//
// ─── CỐ Ý CHỈ THÊM, KHÔNG MIGRATE 257 CHỖ CŨ ─────────────────────────────────────────────────
// Retrofit toàn bộ handler đang chạy thật cùng lúc là thay đổi phạm vi rất rộng, rủi ro cao (đúng
// tinh thần CLAUDE.md mục 12 — "breaking change ảnh hưởng nhiều nơi" phải dừng hỏi trước). Module
// này chỉ ĐỊNH NGHĨA một khuôn lỗi chung để code MỚI (đặc biệt các engine của phase OS sau —
// Evidence/Mastery/Diagnostic... nơi domain error là khái niệm cốt lõi) dùng ngay từ đầu, thay vì
// mỗi phase lại tự nghĩ ra một kiểu throw/catch riêng. Handler cũ giữ nguyên, chuyển dần khi có
// PR đụng tới, giống cách đã làm với `packages/core-config/env.ts` (thêm lối đi mới, không ép
// migrate lối cũ).

/**
 * Lỗi nghiệp vụ đã BIẾT TRƯỚC (khác lỗi hạ tầng bất ngờ — DB sập, provider AI lỗi mạng...).
 * Luôn có `status` HTTP tương ứng để handler trả thẳng cho client mà không cần đoán.
 */
export class AppError extends Error {
  readonly status: number
  /** Mã ổn định cho client/log phân biệt loại lỗi (không đổi khi đổi câu chữ message). */
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'validation_error')
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Chưa đăng nhập hoặc phiên hết hạn') {
    super(message, 401, 'unauthorized')
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Không có quyền thực hiện thao tác này') {
    super(message, 403, 'forbidden')
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy') {
    super(message, 404, 'not_found')
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'conflict')
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Quá nhiều yêu cầu — thử lại sau 1 phút') {
    super(message, 429, 'rate_limited')
    this.name = 'RateLimitError'
  }
}

/** Hạ tầng phía sau (CSDL, Redis…) tạm thời không trả lời — KHÁC lỗi của người dùng. Dùng khi
 * phải phân biệt "không đăng nhập" (401) với "không KIỂM được đăng nhập" (503): client chỉ xoá
 * phiên khi gặp 401, nên trả 401 lúc CSDL chập chờn là đá văng mọi người dùng (audit 2026-10-10). */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Hệ thống đang tạm gián đoạn — thử lại sau ít phút') {
    super(message, 503, 'service_unavailable')
    this.name = 'ServiceUnavailableError'
  }
}

/** `err` có phải `AppError` (hoặc lớp con) không — dùng type guard thay vì `instanceof` trực tiếp
 * ở nơi gọi để rõ ý định, và để đứng vững nếu sau này đổi cách kiểm tra (vd nhiều bản `Error` từ
 * các bundle khác nhau). */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}

/** Hình dạng JSON trả cho client khi có lỗi — khớp quy ước `{error:{message,code}}` đã dùng ở
 * `packages/core-ai/ai.ts` (quy ước MỚI hơn, có cấu trúc, khác `{error:'chuỗi'}` ở handler cũ). */
export interface AppErrorBody {
  error: { message: string; code: string }
}

/** Chuyển `AppError` (hoặc lớp con) thành body JSON để trả cho client. */
export function toErrorBody(err: AppError): AppErrorBody {
  return { error: { message: err.message, code: err.code } }
}
