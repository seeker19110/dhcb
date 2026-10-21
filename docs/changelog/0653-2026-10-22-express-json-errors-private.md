# 0653 — 2026-10-22 — Giữ riêng tư nội dung request khi parser Express báo lỗi

Khi rà PR nâng Express 5.2.1 → 5.3.0, phát hiện bộ xử lý lỗi mặc định đổi từ in stack sang
in nguyên object lỗi. `body-parser` gắn body thô vào lỗi JSON; request đăng nhập bị cắt dở
có thể đưa mật khẩu/token vào log dù chưa chạy handler xác thực.

## Thay đổi

- Thêm `requestBodyErrors.ts`, gắn cuối `registerApiRoutes` để phủ parser JSON 64kb cùng ba
  parser riêng của STT, chấm phát âm và giải bài bằng ảnh.
- Chỉ nhận các cặp `type`/`status` lỗi parser đã biết; giữ HTTP 400/413/415 và trả thông báo
  JSON chung bằng tiếng Việt. Không log, gửi Sentry hoặc trả body/message/stack thô.
- Dùng lại security headers và chính sách CORS hiện có; chỉ đọc `Origin`, không tin `Host`,
  không cấp credentials cho nguồn ngoài danh sách cho phép. Response lỗi có `no-store`.
- Lỗi ngoài parser, kể cả lỗi 500 có `type` giống parser, tiếp tục sang error middleware sau.

## Kiểm chứng

- Tái hiện cục bộ với mật khẩu giả: thay đúng dòng `logerror` theo upstream 5.3.0 trong bộ nhớ,
  gửi JSON bị cắt → HTTP 400 và default handler ghi fake password trong `err.body`; phiên bản
  in stack trước đó không có marker này. Không dùng bí mật hoặc dịch vụ thật.
- Trước bản sửa: 9/10 ca HTTP integration mới đỏ do parser lỗi rơi vào response HTML mặc định;
  ca JSON hợp lệ xanh. Sau bản sửa và thêm ca chuyển tiếp lỗi ngoài parser: 15/15 ca mới xanh.
- Chạy file mới cùng `routes.csrf.test.ts`, `routes.csp.test.ts`,
  `api/routes-registered.test.ts`: **4 file, 251 test xanh**. Test dùng HTTP loopback, parser và
  bảng đăng ký route thật; spy console/Sentry để chặn hồi quy rò dữ liệu, không gọi provider.
- Không migration hoặc thao tác dữ liệu. Hoàn tác bằng cách gỡ middleware và module; cần giữ
  Express ở bản trước 5.3.0 nếu bỏ lớp bảo vệ này.
- Cổng tích hợp với dependency mới nhất: build/typecheck/lint/format xanh;
  1.009 file và 22.521 test xanh (5 file/35 test được bỏ qua theo cấu hình hiện có).
  Coverage statements/branches/functions/lines: 96,08/92,05/96,97/96,79%, đạt mọi ngưỡng.
  Kết quả E2E và CI của head cuối được ghi trong PR #1417.
