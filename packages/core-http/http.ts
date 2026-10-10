// api/_lib/http.ts — Tiện ích HTTP dùng chung cho các API handler (Edge/Node Response).

// Trả JSON response chuẩn — gộp lại vì trước đây mỗi handler tự định nghĩa riêng.
export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

// Trả 500 AN TOÀN: log chi tiết lỗi ở server (console.error → PM2/Sentry bắt được),
// nhưng response cho client KHÔNG kèm err.message — message của pg/fetch có thể lộ
// tên bảng, host DB, cấu hình hạ tầng (phát hiện audit 2026-08-24).
export function internalErrorResponse(
  err: unknown,
  headers: Record<string, string> = {},
  context = '',
): Response {
  logInternalError(err, context)
  return jsonResponse({ error: 'Internal server error' }, 500, headers)
}

// Chỉ phần LOG của internalErrorResponse — cho handler muốn giữ câu báo lỗi tiếng Việt / mã 503
// riêng của mình nhưng vẫn phải để lại dấu vết ở server (audit 2026-10-10, E1.4: tám handler
// bắt lỗi rồi trả 500/503 mà không ghi một dòng log nào, Sentry/PM2 không thấy gì).
export function logInternalError(err: unknown, context = '', status = 500): void {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`[${status}]${context ? ` ${context}` : ''} ${message}`)
}

// Dùng cho khối `try` bọc CẢ `await req.json()` LẪN phần xử lý (CSDL, AI…). Trước 2026-10-08
// nhiều handler trả MỌI lỗi trong khối đó thành 400 "Invalid JSON payload" kèm `String(err)`:
// CSDL rớt thì client nhận "lỗi của bạn" kèm thông điệp nội bộ của pg, còn server không ghi
// một dòng log nào (catch đã nuốt, lỗi không tới được tầng routes.ts/Sentry).
// Nay: chỉ SyntaxError (body không phải JSON — đúng thứ `req.json()` ném) mới là 400, giữ
// nguyên hình dạng phản hồi cũ; mọi lỗi khác là lỗi máy chủ → 500 an toàn, có log.
export function badJsonOrInternalError(
  err: unknown,
  context: string,
  badJsonMessage = 'Invalid JSON payload',
  headers: Record<string, string> = {},
): Response {
  if (err instanceof SyntaxError) {
    return jsonResponse({ error: badJsonMessage, details: String(err) }, 400, headers)
  }
  return internalErrorResponse(err, headers, context)
}

// Lấy IP client — dùng cho rate limit + log bảo mật.
//
// [2026-08-26] SỬA LỖ HỔNG THẬT, đã xác minh trên production: bản cũ đọc PHẦN TỬ ĐẦU của
// `X-Forwarded-For`. Nginx dùng `$proxy_add_x_forwarded_for`, tức NỐI ip thật vào CUỐI chuỗi
// client gửi lên:
//
//     Client gửi:  X-Forwarded-For: 1.2.3.4
//     Nginx thành: X-Forwarded-For: 1.2.3.4, <ip thật>
//     Bản cũ đọc:  1.2.3.4          ← giá trị CLIENT TỰ KHAI
//
// Hệ quả: đổi header mỗi request là né sạch rate limit. Bằng chứng đo được: 40 request liên
// tiếp vào `/api/app-settings` (giới hạn 30/phút) với `X-Forwarded-For` ngẫu nhiên → 40 lần
// 200, KHÔNG một 429 nào.
//
// Thứ tự đọc, từ đáng tin nhất xuống:
//   1. `X-Real-IP` — nginx GHI ĐÈ bằng `$remote_addr` ở mọi `location` proxy. Với
//      `cloudflare-realip.conf` đã áp trên VPS (2026-08-26), `$remote_addr` CHÍNH LÀ ip thật của
//      trình duyệt: request đến từ dải IP Cloudflare thì nginx lấy `CF-Connecting-IP`, còn request
//      gọi thẳng vào IP VPS thì giữ nguyên ip TCP của kẻ gọi. Client không tự khai được.
//   2. `CF-Connecting-IP` — chỉ dùng khi thiếu `X-Real-IP` (chạy không có nginx phía trước).
//   3. `X-Forwarded-For` phần tử **CUỐI** — phần do proxy gần nhất nối vào, không phải phần
//      client khai. Chỉ dùng khi hai header trên vắng mặt.
//
// [2026-09-27] SỬA LỖ HỔNG THẬT: bản trước đọc `CF-Connecting-IP` TRƯỚC `X-Real-IP`, với niềm tin
// rằng `cloudflare-realip.conf` "chỉ nhận header đó từ đúng dải IP Cloudflare". Sai: module
// `real_ip` của nginx chỉ đổi biến `$remote_addr`, KHÔNG xoá/ghi đè header `CF-Connecting-IP`
// client gửi lên — nginx vẫn chuyển nguyên header đó cho Express. Ai gọi thẳng vào IP VPS (bỏ
// qua Cloudflare) kèm `CF-Connecting-IP: <ngẫu nhiên>` là có bộ đếm rate limit mới mỗi request:
// dò mật khẩu/mã 2FA không giới hạn, dùng AI của khách không giới hạn. Bài thử A/B ngày
// 2026-08-26 đi QUA Cloudflare (CF tự ghi đè header) nên không bắt được đường này.
// `nginx/en-vi.conf` nay cũng ghi đè `CF-Connecting-IP` + `X-Forwarded-For` (lớp thứ hai).
export function getClientIp(req: Request): string {
  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  const cfIp = req.headers.get('cf-connecting-ip')?.trim()
  if (cfIp) return cfIp

  // Phần tử CUỐI, không phải đầu — xem giải thích ở trên.
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const parts = forwarded
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
    const last = parts[parts.length - 1]
    if (last) return last
  }

  return 'unknown'
}
