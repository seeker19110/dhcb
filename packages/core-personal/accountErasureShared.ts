// accountErasureShared.ts — Phần THUẦN (không đụng CSDL) của luồng xoá tài khoản, dùng chung giữa
// service và handler `/api/account` (changelog 0533, mục "Sau rà soát"): lỗi nghiệp vụ + mã băm
// đại diện người dùng. Tách khỏi accountErasureService.ts để handler dùng được kể cả khi test mock
// service (kiểm `instanceof`, băm id trong log).

import { createHash } from 'node:crypto'
import { ConflictError } from '@dhcb/core-errors/appError'

/** Tiền tố miền: cùng một user_id băm cho mục đích khác sẽ ra giá trị khác, không nối chéo được. */
const SUBJECT_HASH_DOMAIN = 'dhcb:account-erasure:v1:'

/**
 * Mã băm một chiều đại diện người dùng trong nhật ký xoá VÀ trong log bảo mật của `/api/account`
 * (không ghi `userId` trần vào log). `user_id` là UUID ngẫu nhiên (122 bit) nên không dò ngược
 * được; KHÔNG băm email (entropy thấp, dò từ điển được).
 */
export function accountSubjectHash(userId: string): string {
  return createHash('sha256')
    .update(SUBJECT_HASH_DOMAIN + userId)
    .digest('hex')
}

/** Thông điệp hiển thị thẳng cho người dùng (tiếng Việt — server trả, giao diện có bản tiếng Anh riêng). */
export const PENDING_PAYMENT_MESSAGE =
  'Bạn còn đơn thanh toán đang chờ xử lý. Nếu bạn CHƯA chuyển khoản, hãy huỷ đơn ở mục "Đơn thanh toán đang chờ" rồi xoá lại; nếu đã chuyển, đợi đơn hoàn tất (tối đa 24 giờ sau hạn thanh toán).'

/**
 * Người dùng còn đơn `pending` mà webhook SePay VẪN có thể tự cấp gói (chưa quá `expires_at` +
 * ân hạn). Xoá lúc này sẽ ẩn danh đơn ⇒ tiền chuyển vào sau đó không còn ai nhận ⇒ phải từ chối.
 */
export class PendingPaymentError extends ConflictError {
  constructor() {
    super(PENDING_PAYMENT_MESSAGE)
    this.name = 'PendingPaymentError'
  }
}
