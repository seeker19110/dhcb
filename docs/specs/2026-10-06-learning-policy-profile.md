# Học hỏi cho mọi người, quyền lợi VIP và bảo mật hồ sơ

Trạng thái: **Approved for implementation**.
Ngày: 2026-10-06. Chủ dự án đã yêu cầu triển khai trong hội thoại và bổ sung đổi mật khẩu trong Hồ sơ, ẩn Microsoft/Apple/Facebook, giữ Google.

## 0. Một câu

Giới thiệu Đồng Hành Cùng Bạn là nền tảng hỗ trợ khả năng học hỏi, đồng bộ quyền dùng thử/VIP và bổ sung đổi mật khẩu an toàn trong Hồ sơ.

## ① Phạm vi

**LÀM:**

- Nội dung: học điều muốn học, hiểu và thực hành, ôn tập, nâng cao khả năng tự học; Ghi chú phục vụ việc học, không khôi phục các trụ đã gỡ.
- Khách được bắt đầu không đăng nhập; thử AI có hạn mức được kiểm soát ở máy chủ. Không nhầm mở trang với gọi AI thành công.
- VIP được tự chọn bài trong nội dung đã mở; không giới hạn lượt AI theo ngày trong thời gian gói hiệu lực. Quyết định mới này thay chính sách hạn mức VIP trước đó, nhưng không bỏ giới hạn an toàn, kiểm soát lạm dụng, thống kê chi phí và cầu dao khẩn cấp.
- Trong Hồ sơ, tài khoản có mật khẩu được đổi bằng mật khẩu hiện tại, mật khẩu mới và xác nhận. Thành công thu hồi phiên cũ, yêu cầu đăng nhập lại. Tài khoản chỉ OAuth không được đặt mật khẩu bằng một phiên đăng nhập đơn thuần.
- Chỉ hiển thị Google và email/mật khẩu ở cả app và hub. Không xóa tài khoản, liên kết OAuth hay cơ chế khôi phục đang có.

**KHÔNG LÀM:**

- Không đổi giá, gọi AI trả phí trong test, đọc dữ liệu người dùng thật hoặc thay secret.
- Không tự công bố tính năng chưa có, không bỏ auth/CSRF/rate limit để mở dùng thử.
- Không mở lại grader chưa có cách ly, không sửa framework hay hạ cổng CI.

## ② Điểm chạm

- Giao diện app: `apps/dhcb/src/pages/core`, `apps/dhcb/src/components`, `apps/dhcb/index.html`.
- Hub: `apps/hub/src`, `apps/hub/index.html`.
- Xác thực và mật khẩu: `packages/core-auth`, `apps/server/src/api/core/profile.ts`.
- Quyền lợi: `packages/core-billing`, `packages/core-contracts/appSettings.ts`, `packages/core-learner`.
- Test: unit test cạnh module và E2E trong `e2e`.

Phải rà đường gọi thực tế trước từng lát triển khai. Thay đổi liên quan quyền lợi/auth làm tuần tự; không chỉnh chồng file giữa các luồng.

## ③ Hợp đồng dữ liệu

Đổi mật khẩu nhận từ một phiên đã xác thực: action change-password, currentPassword và newPassword. userId chỉ lấy từ cookie đã xác thực, không lấy từ body. Mật khẩu mới dùng cùng chính sách đang áp dụng khi đăng ký/reset: ít nhất 15 ký tự Unicode, tối đa 72 byte UTF-8; không trim mật khẩu.

Kết quả: thành công không trả mật khẩu/hash/token; cookie cũ bị xóa và các phiên bị thu hồi trong cùng giao dịch đổi mật khẩu. Sai mật khẩu, không có mật khẩu cục bộ, body không hợp lệ, lỗi DB và quá nhiều lần thử phải có kết quả rõ, không đổi dữ liệu khi lỗi.

VIP không giới hạn phải có biểu diễn rõ trong contract; không giả bằng một hạn mức lớn rồi quảng cáo vô hạn. Chính sách Free và guest vẫn kiểm soát phía máy chủ; số liệu AI vẫn ghi nhận theo tính năng.

## ④ Tiêu chí chấp nhận

- [ ] Nội dung public, metadata và quyền lợi thực tế không mâu thuẫn.
- [ ] Khách hoàn thành hoạt động mẫu và thử AI trong hạn mức; từ chối đúng khi hết lượt.
- [ ] VIP đang hiệu lực không bị chặn tổng lượt/ngày; hết hạn quay về Free; vẫn ghi thống kê và giữ cầu dao an toàn.
- [ ] VIP mở bài không tự cấp kết quả thi/mastery.
- [ ] Hồ sơ có form đổi mật khẩu; sai mật khẩu/cookie hết hạn/body lỗi không sửa dữ liệu.
- [ ] Đổi mật khẩu thu hồi phiên; hai yêu cầu cạnh tranh không cho mật khẩu cũ ghi đè thay đổi mới.
- [ ] Google-only có hướng dẫn phù hợp, không thể bỏ qua xác minh để gắn mật khẩu.
- [ ] App và hub không hiện Microsoft, Apple, Facebook; Google và email vẫn dùng được.
- [ ] Build, typecheck, lint, format, unit và E2E đạt trên chính commit định merge; kiểm tra mobile/desktop và deploy thực tế trước khi gọi là hoàn tất.

## ⑤ Bất biến không được phá

Không lưu mật khẩu ở localStorage/log/analytics. Không lấy userId từ client để đổi mật khẩu. Không thay dữ liệu tài khoản khác. Không trả secret phiên ra JavaScript. Không cho AI sửa billing/mastery. Không dùng số test hay bằng chứng deploy của commit cũ.

## ⑥ Quy ước dự án liên quan

Tuân thủ AGENTS.md và CLAUDE.md; thay đổi nhỏ, PR có rủi ro/rollback/bằng chứng; không merge khi quality hoặc e2e chưa đạt. Nội dung tiếng Việt dễ hiểu, giữ khả năng tiếp cận và ngôn ngữ tiếng Anh hiện có. Kiểm thử dùng mock hoặc DB disposable, không dùng production.

Tham chiếu bảo mật: OWASP Authentication Cheat Sheet, mục Change Password Feature và Require Re-authentication for Sensitive Features, đối chiếu ngày 2026-10-06.

## Nghiệm thu

Chưa triển khai source trong commit đặc tả. Chưa chạy test, chưa merge, chưa deploy. Mỗi PR triển khai phải báo riêng phần đã xác minh và phần còn mở.
