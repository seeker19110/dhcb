# 0503 — Hỗ trợ học hỏi, dùng thử và VIP học tự do

Ngày: 2026-10-06. Đặc tả Approved: `docs/specs/2026-10-06-learning-policy-profile.md`, PR #1251. Tiếp nối phần Hồ sơ/Google của PR #1252.

## Nội dung và hành trình

- Trang khách, Giới thiệu song ngữ, hub, metadata và README cùng định vị hỗ trợ khả năng học hỏi/tự học. Ghi chú phục vụ quá trình học; không quảng bá các trụ đã gỡ. STEM ghi rõ xem trước.
- CTA landing tiếng Anh đi thẳng `/bat-dau?mon=english`, không ép đăng nhập trước trải nghiệm.
- Phân biệt khách lưu tiến độ trên trình duyệt với tài khoản Free; không nói Ghi chú/Companion cá nhân dùng được khi chưa đăng nhập.
- VIP tự chọn cấp tiếng Anh và bậc lập trình dựa trên luật mở khóa hiện có, không cấp kết quả thi hay chứng nhận thành thạo.

## Chính sách lượt AI

- VIP đang hiệu lực không chặn tổng lượt AI/ngày. Ghi thống kê bằng UPSERT atomic, không dùng một số cap lớn giả vô hạn. Thống kê lỗi thì không gọi provider; giữ hoàn lượt khi provider lỗi, quota Free, khách, rate limit và cầu dao khẩn cấp.
- Public settings có `vipUnlimited` và ETag gắn phiên bản chính sách, tránh giữ cache cũ khi DB chưa thay đổi. `limits.vip` còn để tương thích/rollback, không dùng làm cap VIP mới.
- Usage summary có nhánh unlimited/usedToday rõ ràng, không gửi Infinity qua JSON. Sửa phép so sánh ngày cho đúng cột TEXT trong schema/migration thật.
- UI bảng gói, hồ sơ VIP và tiến độ hiển thị thống kê thật, không dựng số lượt còn lại. Nội dung hạn mức cũ trong marketing DB không ghi đè chính sách runtime.
- Nội dung app phản ứng khi settings tải xong; server cũ chưa có flag vẫn hiển thị quyền lợi theo contract cũ thay vì tự tuyên bố unlimited.

## Kiểm chứng

- 11 file / 159 kiểm thử trọng tâm đạt trên Node 22.23.3 (quota, expiry, breaker, guest trial, mở khóa, contract/cache và UI). Typecheck toàn bộ đạt trước khi bổ sung kịch bản E2E/integration.
- Thêm `e2e/learning-policy.spec.ts`: Giới thiệu 390/1440px, CTA theo môn, quyền lợi VIP, axe và ảnh.
- Thêm `scripts/check-delivery-20261006.ts`: chỉ chấp nhận DB loopback, tên riêng và schema rỗng; kiểm PostgreSQL thật với 50 yêu cầu VIP đồng thời, 20 Free, expiry/breaker/refund, CAS đổi mật khẩu và rollback khi thu hồi phiên lỗi. Không tự chạy trên production.
- Kết quả gate đầy đủ/E2E/Postgres/deploy phải đọc từ chính commit PR, không coi tài liệu này là chứng nhận đã deploy.

## Rollout và rollback

Không đổi giá hay secret, không migration dữ liệu. Deploy đồng bộ client/server để metadata, quota và UI khớp nhau. Khi rollback source, ETag cũ khác phiên bản mới nên settings được nạp lại. Không khôi phục mật khẩu hoặc phiên đã thu hồi ở PR trước. Không mở lại grader thiếu cách ly. Chỉ công nhận hoàn tất sau quality/e2e và kiểm chứng deploy.
