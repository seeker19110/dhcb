# 0588 — Rà 11 cảnh báo header bảo mật + SSL/TLS từ máy quét

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `fix(server)`
- **Nguồn:** chủ dự án gửi danh sách cảnh báo của một máy quét bảo mật (X-XSS-Protection,
  Set-Cookie, CORP, COEP, COOP, 5 mục SSL/TLS, Content-Security-Policy) và yêu cầu "điều tra và
  fix".

## Điều tra

Đọc header THẬT của production (`curl -D -` trên `/` và `/api/health`): đi qua **Cloudflare**
(`server: cloudflare`), có sẵn CSP · HSTS 2 năm · X-Frame-Options · Referrer-Policy ·
Permissions-Policy · nosniff; **thiếu** X-XSS-Protection, COOP, CORP, COEP. Nguồn header duy nhất
là Express: `applyCommonSecurityHeaders` (`apps/server/src/routes.ts`) cho mọi response +
`SECURITY_HEADERS` (`packages/core-auth/security.ts`) cho handler API. Nginx cố ý không đặt header
bảo mật (một nguồn, không trôi lệch — audit 2026-08-25 F5).

## Đã sửa (code)

| Header                         | Giá trị                    | Vì sao chọn giá trị này                                                                                                                                                            |
| ------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `X-XSS-Protection`             | `0`                        | Khuyến nghị OWASP: tắt bộ lọc XSS cũ (đã bị gỡ khỏi trình duyệt hiện đại, ở bản cũ lại là lỗ rò XS-Leak). Trước đây bỏ hẳn header nên máy quét báo thiếu. Chặn XSS là việc của CSP |
| `Cross-Origin-Resource-Policy` | `same-site`                | Chỉ trang cùng site nhúng được response no-cors. Không `same-origin` vì hub (`www`) và app (`en-vi`) là hai origin cùng site. Không ảnh hưởng fetch CORS                           |
| `Cross-Origin-Opener-Policy`   | `same-origin-allow-popups` | Tách cửa sổ khỏi trang lạ. Không `same-origin` vì đăng nhập Google mở POPUP (GIS) — Google khuyến nghị đúng giá trị này                                                            |

Đặt ở CẢ `applyCommonSecurityHeaders` lẫn `SECURITY_HEADERS` (test `security.test.ts` canh giá
trị). Đã chạy server thật ở máy, `curl` thấy đủ 3 header trên `/api/health` và trang 404.

## KHÔNG sửa — kèm lý do

- **COEP (`Cross-Origin-Embedder-Policy`)**: chỉ cần khi muốn "cô lập cross-origin" (dùng
  `SharedArrayBuffer`) — app không cần. Bật `require-corp`/`credentialless` sẽ chặn khung đăng
  nhập Google (iframe `accounts.google.com` không gửi COEP) và ảnh ngoài không có CORP. Máy quét
  xếp mục này mức thông tin. Muốn bật thì phải tách runtime chạy code + đăng nhập ra origin riêng.
- **CSP còn `'unsafe-inline'` + `'unsafe-eval'` trong `script-src`**: không gỡ được trong PR này.
  Bài HTML/JS của môn Lập trình chạy trong `<iframe srcdoc sandbox>` (`HtmlPreview.tsx`) — iframe
  `srcdoc` THỪA KẾ CSP của trang cha, nên gỡ `'unsafe-inline'` là mọi `<script>`/`onclick` của học
  viên chết; `jsWorker.ts` chạy code học viên bằng `new Function`. Hướng đúng (đã ghi ở
  `docs/security-rollout-2026-09-27.md`): chuyển runtime luyện code sang origin cách ly, rồi siết
  CSP trang chính (khi đó script inline duy nhất — chống nháy theme ở `apps/dhcb/index.html` — đổi
  sang băm `sha256-…`). Là việc lớn, cần chủ dự án duyệt.
- **Set-Cookie**: cookie phiên `session_token` (`packages/core-auth/sessionCookie.ts`) đã đủ
  `HttpOnly` · `Secure` (production) · `SameSite=Lax` · `Path=/`. Không dùng tiền tố `__Host-` được
  vì cần `Domain=.donghanhcungban.org` để hub và app dùng chung phiên. Response `/` và
  `/api/health` không đặt cookie nào. Cần chi tiết của máy quét (tên cookie bị báo) — nếu là cookie
  của Cloudflare (`__cf_bm`…) thì do Cloudflare đặt, không nằm trong code.
- **5 mục SSL/TLS** (Protocols, Protocol Details, DROWN hint, BEAST, Lucky 13): máy quét đo ở
  **biên Cloudflare**, không phải Nginx; sửa bằng dashboard Cloudflare — các bước + lệnh kiểm đã ghi
  vào `docs/cloudflare-setup.md` **Bước 6** (Minimum TLS 1.2, bật TLS 1.3, cipher suites Modern).
  Không đo trực tiếp được từ container phiên làm việc (HTTPS đi qua proxy giải mã lại).
