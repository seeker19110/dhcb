# Khắc phục audit bảo mật 2026-09-27 — hướng dẫn triển khai

Bản vá từ main `896626a58b8f6f9640d5af875c7cb19cbe036c98`; không có migration, không thay đổi
production trong lượt sửa này. Goal: [GOAL-2026-SEC-0927](goals/security-audit-20260927.md).

## Thay đổi hành vi

| Nhóm    | Hành vi sau bản vá                                                                                             | Tác động tương thích                                                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| F01/F02 | Chặn chạy server Python/JS/TS/HTML/DOM/fetch/SQL/Kotlin/Swift/bash; gate quyền và hạn mức trước compute        | 606/685 bài registry tạm dừng chấm server; 79 mô phỏng git/hermes/vibe/openclaw còn chấm; browser practice vẫn dùng |
| F03     | Quyền admin theo ADMIN_USER_IDS                                                                                | ADMIN_EMAILS không còn cấp quyền; thiếu ID thì từ chối                                                              |
| F04     | Identity OAuth mới không tự ghép vào tài khoản trùng email                                                     | Đăng nhập bằng kênh đã liên kết hoặc mật khẩu; chưa bổ sung UI liên kết mới                                         |
| F05/F06 | Session chỉ ở cookie HttpOnly; JSON và localStorage không giữ token; redirect origin chính xác                 | Phải cập nhật frontend/backend cùng đợt; client cũ cần reload                                                       |
| F07/F08 | Gemini kiểm chủ sở hữu, ID do server cấp, quota REST/WS; TTS miss trả phí qua quota và breaker                 | TTS tạo audio mới dùng chung hạn mức speaking; cache hit vẫn rẻ và không trừ quota mới                              |
| F09/F12 | Webhook không xác minh email; mã email gắn user/email; lock giao dịch; TOTP CAS                                | Mã email còn chờ trước rollout phải gửi lại; mã TOTP chỉ tiêu một lần                                               |
| F10/F11 | Dữ liệu đồng bộ và click không tự cấp VIP; referral marker và quyền lợi cùng transaction                       | Một số phần thưởng tạm không claim được khi chưa có bằng chứng tin cậy                                              |
| F13     | Kiểm Origin trước handler mutation; Redis production đóng khi lỗi; mật khẩu mới 15 ký tự, tối đa 72 byte UTF-8 | Server client dùng cookie phải gửi Origin tin cậy; mật khẩu đăng nhập cũ vẫn dùng được                              |

## Trước khi triển khai

1. Xác nhận danh tính admin hiện có qua nguồn quản trị tin cậy, lấy UUID bất biến trong `public.users`.
   Cấu hình `ADMIN_USER_IDS` bằng danh sách UUID, không lấy chỉ từ email người dùng tự nhập.
2. Đảm bảo origin server chỉ nhận lưu lượng từ proxy tin cậy; Nginx/Cloudflare ghi đè
   `CF-Connecting-IP`/`X-Real-IP`, firewall chặn truy cập thẳng để rate limit HTTP/WS không
   tin IP tự khai. Xem `docs/cloudflare-setup.md`. Đảm bảo `REDIS_URL` đúng và PING thành công. Khi Redis thiếu/đang kết nối/lỗi, mọi endpoint dùng
   rate limit từ chối request (thường 429 theo contract cũ); health/static vẫn phục vụ. Cảnh báo Redis
   phải được theo dõi; không bật fallback production.
3. Đặt `ALLOWED_ORIGINS` bằng chính xác các origin đang phục vụ frontend (scheme, host, port), gồm
   Hub/app/subdomain cần dùng. Cấu hình tường minh thay thế hoàn toàn mặc định; không wildcard.
4. Build/release frontend và API cùng phiên bản. Kiểm tra cookie `Secure`, `HttpOnly`, Domain/Path
   phù hợp staging. Xóa cache frontend cũ khi cần. Mã email cũ sẽ hết tương thích, yêu cầu gửi lại.
5. Chạy E2E trên runner có Chromium, rồi smoke staging: đăng nhập mật khẩu/OAuth hiện hữu,
   OAuth trùng email trả409, SSO, logout, admin hợp lệ/không hợp lệ, CSRF403, WS khác user404,
   quota TTS/WS, grader503 giữ outbox và batch chia nhỏ. Không gọi provider thật trong unit test.
6. Trên PostgreSQL staging kiểm tra request đồng thời: referral chỉ cộng một lần, grant lỗi rollback
   cả marker, email verify/change không lệch địa chỉ, TOTP cùng bước chỉ một request thành công.

## Sau phát hành

- Theo dõi 403 `UNTRUSTED_ORIGIN`, 429/Redis health, lỗi503 grader và tỷ lệ đăng nhập/SSO.
- Kiểm tra owner Gemini, session đóng/timeout và usage; quota ngày dùng DB chung. Giới hạn số phiên
  đồng thời hiện theo process, chưa phải semaphore Redis toàn cụm.
- Đối soát riêng tài khoản/quyền lợi lịch sử có thể bị ảnh hưởng bởi các lỗi trước bản vá. Không tự
  thu hồi session, xoay secret hay sửa entitlement lịch sử nếu chưa có kế hoạch và quyền vận hành.

## Rollback

Không có schema đổi nên rollback code không cần rollback migration. Tuy nhiên rollback toàn bộ
sẽ mở lại lỗ hổng: ưu tiên sửa tiến tới hoặc tắt riêng tính năng lỗi tại lớp routing. Không mở lại
native grader, email admin hay auto-link để khắc phục sự cố giao diện. Khi cần quay phiên bản
frontend/API phải quay đồng bộ, vẫn giữ các đường nhạy cảm đóng ở edge. Mã email đã gửi dưới
bản vá không được mã cũ xác minh; yêu cầu gửi lại sau khi ổn định phiên bản.

## Giới hạn còn lại

- Chưa có sandbox chạy mã riêng với giới hạn CPU/RAM/network/process; F01 được ngăn bằng đóng
  đường thực thi, chưa khôi phục đầy đủ chức năng chấm server.
- CSP thêm `object-src 'none'`, `base-uri 'self'`, `form-action 'self'` nhưng còn inline/eval và
  `connect-src https:`. Cần tách origin runtime trình duyệt, thu hẹp kết nối và kiểm OAuth trước
  khi siết toàn bộ. Vite tự thân không cần `unsafe-eval`.
- Chưa bắt buộc MFA/step-up cho mọi admin; đây là hạng mục hardening tiếp theo.
- `email_verified` đã được webhook cũ đánh dấu chưa được tự thu hồi: schema thiếu nguồn
  xác minh để phân biệt với người đã xác minh thật. Cần đối soát riêng.
- Email thay đổi vẫn cập nhật địa chỉ hiện tại rồi xác minh; chưa có mô hình pending-email.
- Phân trang lịch sử, hạn mức lưu dữ liệu và đối soát thưởng cũ là công việc tiếp theo.
- Test dùng fake DB/provider cho race/rollback, không thay thế thử nghiệm PostgreSQL/Redis thật.

## Kết quả kiểm chứng

- `npm run build`: PASS (app, packages, server, Hub).
- `npm run typecheck`: PASS (app, API, E2E TypeScript, Hub).
- `npm run lint`: PASS, không warning ESLint.
- `npm test`: PASS — **773 file đạt, 1 file skip; 18.154 test đạt, 2 test skip**; 126,19 giây.
- `npm run format:check`: PASS sau khi format hai test facade.
- `git diff --check`: PASS.
- `npm run test:e2e`: BLOCKED tại global setup vì thiếu Chromium headless binary; chưa chạy
  assertions, chưa có ảnh kiểm tra giao diện 390/1440 px. Không cài browser trái hướng dẫn repo.

Runtime kiểm chứng Node24/npm11; production nên dùng Node22 theo hướng dẫn repo. Unit có vài
log `ECONNREFUSED localhost:3000` từ fixture frontend; Vitest không có test lỗi và exit0. Không
kết nối PostgreSQL/Redis/provider production. Kiểm thử WS có socket localhost và provider giả.

Lượt test tổng thể đầu phát hiện 8 assertion legacy (token/Bearer, thông báo Redis); đã cập nhật
contract mới và chạy lại toàn bộ thành công. Kiểm tra race/rollback dùng fake có trạng thái,
không phải bằng chứng thử trên DB thật. Không thay ngưỡng test hoặc bỏ test lỗi để đạt gate.
