# Học hỏi cho mọi người và bảo mật Hồ sơ

Chủ dự án phê duyệt 2026-10-06. Đặc tả: `docs/specs/2026-10-06-learning-policy-profile.md`.

## Outcome

Khách hiểu sản phẩm và bắt đầu không đăng nhập với AI giới hạn; VIP chủ động chọn bài và không bị cap lượt AI/ngày; người dùng đổi mật khẩu an toàn trong Hồ sơ; giao diện chỉ giữ Google + email/mật khẩu.

## Trạng thái có bằng chứng

- Đặc tả đã merge: PR #1251.
- Phần mật khẩu và Google: PR #1252, có unit/typecheck và E2E 390/1440px; kiểm thử a11y cũ được đổi selector từ Microsoft sang Google, không bỏ quy tắc axe.
- Nội dung/quota: source và kiểm thử trong đợt 0503; 159 ca trọng tâm đã qua. Các cổng đầy đủ và PostgreSQL thật được ghi ở PR/Actions, không suy từ checklist.
- Chưa đánh dấu production hoàn tất trong tài liệu khi chưa đọc kết quả deploy của chính commit.

## Definition of Done

- Nội dung giới thiệu và chính sách quyền lợi không mâu thuẫn.
- Guest trial giới hạn và lưu tiến độ hoạt động; đăng nhập/đăng ký vẫn dùng được.
- VIP không giới hạn lượt/ngày, hết hạn trở lại Free, giữ thống kê/cầu dao/rate limit; mở khóa bài không tự cấp mastery.
- Đổi mật khẩu cần mật khẩu hiện tại, thu hồi phiên atomic; OAuth-only không tự gắn mật khẩu.
- App/hub chỉ hiện Google + email, không xóa dữ liệu liên kết cũ.
- quality/e2e, ảnh mobile/desktop và Postgres disposable đạt; merge/deploy có bằng chứng.

## Rủi ro và nợ còn lại

Giọng nói trực tiếp đang thử nghiệm và các phần STEM xem trước vẫn giữ trạng thái thật. Không tăng quyền riêng tư của AI, không thay giá, không xử lý nợ hạ tầng/secrets hoặc mở lại grader. Kiểm thử dùng mock/DB riêng không thay thế việc theo dõi production sau phát hành.
