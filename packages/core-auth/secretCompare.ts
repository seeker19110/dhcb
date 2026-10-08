// secretCompare — so khoá bí mật (khoá cron, API key…) theo thời gian HẰNG.
// So bằng `===` rò độ dài tiền tố trùng qua thời gian phản hồi; ở đây băm SHA-256 trước để hai
// buffer luôn cùng độ dài (timingSafeEqual yêu cầu) rồi mới so.
import { createHash, timingSafeEqual } from 'node:crypto'

const digest = (value: string): Buffer => createHash('sha256').update(value).digest()

/**
 * `provided` (client gửi) có khớp `expected` (cấu hình server) không.
 * Thiếu `expected` (chưa cấu hình), `provided` không phải chuỗi hoặc rỗng → luôn false.
 */
export function secretMatches(provided: unknown, expected: string | undefined): boolean {
  if (!expected || typeof provided !== 'string' || !provided) return false
  return timingSafeEqual(digest(provided), digest(expected))
}
