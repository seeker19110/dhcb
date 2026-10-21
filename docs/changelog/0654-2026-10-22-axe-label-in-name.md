# 0654 — 2026-10-22 — Sửa tên truy cập khi nâng axe-core 4.14

PR #1415 (được Dependabot thay bằng #1425 trong đợt tích hợp) nâng công cụ kiểm thử và bị chặn
ở E2E: axe-core 4.14 đưa quy tắc
`label-content-name-mismatch` vào bộ quét mặc định. Các nhãn tự đặt đã bỏ sót chữ đang
hiển thị hoặc dùng ngôn ngữ khác với giao diện.

## Thay đổi

- Dùng tên từ nội dung cho nút hồ sơ, thẻ môn học/Ghi chú, liên kết nhịp học tuần,
  thương hiệu Hub và nút sao chép mã mời; giữ tên hồ sơ/thương hiệu trên màn hình nhỏ
  bằng chữ dành cho trình đọc màn hình.
- Nhãn lộ trình, nhắc học, tiến độ/lịch sử khớp đúng chữ hiển thị và ngôn ngữ đang dùng.
- Giữ mô tả số ngày học trên hình cụm chấm; đồng bộ AC-2 của đặc tả trang chủ và các
  test hiện có. Giữ nguyên đường dẫn, thao tác và chữ hiển thị.
- Thẻ bậc lập trình dùng tên từ toàn bộ nội dung; nút nghe ở thẻ từ và câu ví dụ giữ
  cả giọng đọc/văn bản đang hiện trong tên trợ năng. Giữ thao tác và cơ chế audio cũ.
- Selector kiểm tra từ cấm của trang quản trị khớp chính xác `admin`/`hotro`, tránh
  bắt nhầm tên tài khoản trong phần hồ sơ dành cho màn hình nhỏ.
- Thẻ điều hướng trang cá nhân và nút giới thiệu bạn bè dùng chữ đang hiện làm tên.
  Nhãn nút gửi/ghi âm giữ cả thời gian chờ khi có countdown; nút chấm bài, xem mẫu
  và viết lại tự theo nội dung/trạng thái đang hiển thị.
- Hai lối sang tiến độ/lịch sử ở trang môn tiếng Anh dùng chữ hiển thị làm tên;
  lựa chọn đáp án bài thi giữ cả số phím tắt hiện trên desktop trong tên trợ năng,
  với khoảng trắng thật trong DOM để số và đáp án là hai token riêng.
- Selector CTA lộ trình trên trang chủ khớp chính xác tên nút; selector bài thi khớp
  cả thứ tự và đáp án của fixture, giữ toàn bộ kiểm tra chấm điểm/thử lại từ máy chủ.

## Kiểm chứng

- Phân tích log CI ban đầu: 275 test thất bại đều liên quan quy tắc trên; các cổng
  build/type/lint/format/unit đã xanh.
- Kiểm thử tập trung sau sửa: 8 file, 95 test xanh; Prettier và `git diff --check` sạch.
- Kiểm thử tập trung bổ sung cho thẻ bậc/nút nghe: 4 file, 16 test xanh.
- E2E tập trung sau sửa bổ sung: 12/12 ca xanh, gồm axe ba theme cho Lập trình/Từ
  điển Hôm nay, hai từ cấm quản trị và bốn luồng trang chủ môn Lập trình.
- Profile/referral: 2 file, 9 test xanh. Năm suite voice hiện có: 64 test xanh;
  hai assertion sau phản hồi AI kiểm cả tên mic có countdown và trạng thái bị khoá.
- Trang môn tiếng Anh: 2 file, 6 test xanh. Bốn suite bài thi/luyện nghe/xếp lớp:
  14 test xanh, giữ chặn click lặp, focus, công bố kết quả và phím tắt.
- E2E thật ở lượt cuối: 21 ca trang cá nhân/nhiệm vụ/kết quả AI xanh; 13 ca xác nhận
  gồm Chọn nghĩa ba theme, bài thi máy chủ chấm ở sáu tổ hợp theme/kích thước và
  bốn kiểm tra shortcut/focus trang chủ đều xanh.
- Sinh lại source snapshot `guestHome.prerender.html` theo quy trình của repo; kiểm tra
  với bộ dependency mới nhất: 3 test snapshot và 15 test parser HTTP đều xanh.
- Đối chiếu 8 ảnh GuestHome/Home đăng nhập trước/sau ở 1440 × 900 và 390 × 844, theme
  blue-sky: cả 4 cặp khác biệt 0 pixel, hình học điều khiển và chiều cao trang khớp;
  không tràn ngang hoặc lỗi runtime. Dùng dữ liệu giả, chặn API/remote, cache Vite riêng.
- Đối chiếu thêm 8 ảnh Lập trình/Từ điển tab Hôm nay ở hai kích thước trên: cả 4 cặp
  khác biệt 0 pixel, không tràn ngang/lỗi runtime. Quét axe A/AA cả 4 trường hợp sau
  sửa không có vi phạm; tên tiến độ và trạng thái khoá bậc vẫn khớp E2E hiện có.
- Cổng đầy đủ và quét axe với phiên bản mới được chạy trong đợt tích hợp; kết quả cuối
  được ghi trong PR #1425.

## Rủi ro và hoàn tác

Tên đọc của thẻ có thể dài hơn vì giữ cả mô tả/trạng thái đang hiện. Kiểm tra bằng cổng
a11y và các luồng điều hướng hiện có. Không migration; hoàn tác cùng phiên bản công cụ
nếu cần, không tắt quy tắc hoặc thêm ngoại lệ a11y.
