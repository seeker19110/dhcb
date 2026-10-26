// Tiện ích an toàn dùng chung cho các script restore:* (audit 2026-10-26: AUD-SEC-003, AUD-SEC-004).
import * as fs from 'node:fs'

/** Quyền file giải mã: chỉ chủ sở hữu đọc/ghi — nội dung là .env/cấu hình hệ thống thật. */
const PRIVATE_FILE_MODE = 0o600

/**
 * Che mật khẩu trong connection string trước khi in ra log/terminal (log SSH, CI, màn hình chia
 * sẻ lúc xử lý sự cố đều có thể bị lưu lại). Chuỗi không phân tích được như URL thì KHÔNG trả lại
 * nguyên văn — có thể là dạng `key=value` chứa `password=...`.
 */
export function redactConnectionUrl(raw: string): string {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return '<connection string ẩn>'
  }
  if (url.password) url.password = '***'
  return url.toString()
}

/**
 * Ghi file chỉ chủ sở hữu đọc được. `mode` của writeFileSync chỉ áp khi TẠO file mới (và còn bị
 * umask cắt), nên luôn chmod lại sau khi ghi — file cũ 0644 từ lần chạy trước cũng bị siết.
 */
export function writePrivateFile(filePath: string, data: Buffer): void {
  fs.writeFileSync(filePath, data, { mode: PRIVATE_FILE_MODE })
  fs.chmodSync(filePath, PRIVATE_FILE_MODE)
}
