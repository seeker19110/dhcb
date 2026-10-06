# 0502 — Đổi mật khẩu trong Hồ sơ, chỉ hiển thị Google

Ngày: 2026-10-06. Đặc tả: `docs/specs/2026-10-06-learning-policy-profile.md` (đã merge ở PR #1251).

## Thay đổi

- Thêm khối Đổi mật khẩu trong Hồ sơ: mật khẩu hiện tại, mật khẩu mới, xác nhận; có nhãn, autocomplete, ẩn/hiện và xử lý lỗi/thử lại.
- API chỉ dùng ID từ phiên đã xác thực, kiểm tra Origin và hạn mức thử theo tài khoản. Chính sách mật khẩu mới giữ nguyên 15 ký tự Unicode / 72 byte UTF-8.
- Kiểm mật khẩu cũ, đổi hash với compare-and-swap, vô hiệu hóa link reset và thu hồi mọi phiên trong cùng transaction. Thành công yêu cầu đăng nhập lại; tài khoản OAuth-only chỉ nhận hướng dẫn, không tự gắn mật khẩu.
- App và hub chỉ hiển thị Google cùng email/mật khẩu. Dừng preload SDK Microsoft/Apple/Facebook, giữ adapter và dữ liệu liên kết cũ.

## Kiểm chứng

- Node 22.23.3, dependencies đúng lockfile của main bfec265.
- 8 file / 215 kiểm thử liên quan: đạt. Bao gồm 33 kiểm thử API/service mới, 10 kiểm thử form mới, 7 kiểm thử client API; các ca đăng nhập/OAuth cũ vẫn chạy.
- Kiểm thử service dùng SQL double và transaction helper thật; không coi là chứng minh concurrency trên Postgres production.
- Kiểm thử trình duyệt cục bộ bị môi trường chặn (ERR_BLOCKED_BY_ADMINISTRATOR), chưa phải lỗi sản phẩm; thêm E2E 390/1440px + kiểm tra axe để chạy trên CI.
- Gate đầy đủ của đúng PR và kiểm chứng triển khai phải được đọc trước khi merge/kết luận hoàn tất.

## Rủi ro / rollback

Không migration, không đổi secret/giá/quyền VIP ở lát này. Revert source để rollback; không phục hồi phiên đã thu hồi hoặc mật khẩu cũ. Không xóa tài khoản liên kết cũ.

## Còn mở của mục tiêu tổng

Nội dung giới thiệu, đối chiếu dùng thử AI và chính sách VIP không giới hạn lượt thuộc lát kế tiếp; không đánh dấu đã triển khai chỉ vì có PR đặc tả.
