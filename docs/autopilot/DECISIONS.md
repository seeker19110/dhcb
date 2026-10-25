# Nhật ký quyết định tự duyệt

> Ghi bởi `xt.py loop decide`. Phiên chính tự duyệt điểm quyết định theo tiêu chí chất lượng cuối (`LOOP-STOP-018`, ADR-0008 của khung). Người xem lại bất cứ lúc nào; đổi ý → quyết định mới ghi "thay D-NNN", không sửa mục cũ.

### D-001 · 2026-10-23T12:33:02+00:00 · Thu gọn PROGRESS.md theo khuôn nào?

- Phương án: (1) Đổi sang khuôn khung 4 mục, ≤ 8 KB · (2) Giữ tên mục của DHCB, dời nguyên văn phần đã xong sang docs/legacy
- Chọn: Giữ tên mục của DHCB, dời nguyên văn phần đã xong sang docs/legacy
- Lý do (tiêu chí chất lượng cuối): Đúng & an toàn: report-status.sh + test bóc tách theo tên mục hiện tại và CLAUDE.md mục 3 định nghĩa khuôn này; đổi khuôn làm vỡ hook đầu phiên. Giữ đường lùi: dời nguyên văn, revert được.
- Đường lùi: Revert PR; nội dung còn nguyên trong docs/legacy

### D-002 · 2026-10-23T12:33:02+00:00 · Duyệt PLAN thu gọn PROGRESS.md (T-001..T-003)

- Phương án: (1) Duyệt · (2) Không duyệt
- Chọn: Duyệt
- Lý do (tiêu chí chất lượng cuối): Chỉ tài liệu, lát nhỏ, mỗi task có Gate máy kiểm, không mất dữ liệu
- Đường lùi: Revert từng PR

### D-003 · 2026-10-23T12:44:11+00:00 · Ngưỡng byte Gate T-002 (185000) thấp hơn số đo thật

- Phương án: (1) Giữ 185000, dời thêm phần ngoài phạm vi T-002 · (2) Sửa ngưỡng thành 190000 theo số đo, phạm vi T-002 giữ nguyên
- Chọn: Sửa ngưỡng thành 190000 theo số đo, phạm vi T-002 giữ nguyên
- Lý do (tiêu chí chất lượng cuối): Ngưỡng là ước lượng lập kế hoạch trước khi đo, không phải cổng chất lượng; dời thêm sẽ lấn phạm vi T-003 cần đọc từng mục. Cổng thật (test report-status/changelog, prettier, kiểm không mất dòng) giữ nguyên.
- Đường lùi: Đặt lại ngưỡng cũ trong PLAN

### D-004 · 2026-10-23T12:54:38+00:00 · Audit delta giữa Lát 1 và Lát 2?

- Phương án: (1) Chạy audit 13 nhóm · (2) Bỏ qua: diff chỉ dời Markdown nguyên văn, không mã/cấu hình
- Chọn: Bỏ qua: diff chỉ dời Markdown nguyên văn, không mã/cấu hình
- Lý do (tiêu chí chất lượng cuối): Phạm vi audit delta theo diff = rỗng về mã; cổng thật (test report-status/changelog, prettier, kiểm không mất dòng) đã chạy
- Đường lùi: Chạy xt.py audit plan khi có diff mã

### D-005 · 2026-10-23T12:56:24+00:00 · Ngưỡng byte Gate T-003 (150000) thấp hơn số đo sau khi dời hết mục đã xong

- Phương án: (1) Dời thêm mục còn mở/quyết định còn hiệu lực để đạt 150000 · (2) Sửa ngưỡng thành 160000 theo số đo; phần còn lại là trạng thái thật
- Chọn: Sửa ngưỡng thành 160000 theo số đo; phần còn lại là trạng thái thật
- Lý do (tiêu chí chất lượng cuối): Lần thứ hai ngưỡng ước lượng trước khi đo bị lệch (ghi nhận). Đúng & an toàn: phần còn lại đều là việc mở/quyết định/nợ mở — dời đi sẽ làm PROGRESS sai trạng thái. Cổng thật (test, prettier, kiểm không mất dòng) giữ nguyên.
- Đường lùi: Đặt lại ngưỡng; dời thêm khi chủ dự án xác nhận mục nào hết hiệu lực

### D-006 · 2026-10-24T08:38:52+00:00 · Vá lỗ hổng high của body-parser bằng cách nào?

- Phương án: (1) npm audit fix — chỉ cập nhật lockfile lên body-parser 2.4.0 · (2) Thêm overrides trong package.json · (3) Bỏ qua, chờ Express nâng
- Chọn: npm audit fix — chỉ cập nhật lockfile lên body-parser 2.4.0
- Lý do (tiêu chí chất lượng cuối): Đúng & an toàn: lỗ hổng DoS ở phụ thuộc production, bản vá nằm trong dải ^2 của Express 5.3 nên không đổi API. Giữ đường lùi: chỉ lockfile, revert được. Overrides thêm nợ cấu hình; chờ Express để hở lỗ hổng.
- Đường lùi: git revert PR; lockfile về body-parser 2.3.0

### D-007 · 2026-10-24T10:14:26+00:00 · Hiểu 'hoàn thiện dự án' thế nào cho một phiên?

- Phương án: (1) Audit đầy đủ 11 tầng lại từ đầu · (2) Audit delta sau 2026-10-20 + đóng lỗ hổng phụ thuộc còn lại · (3) Làm tính năng mới trong PROGRESS
- Chọn: Audit delta sau 2026-10-20 + đóng lỗ hổng phụ thuộc còn lại
- Lý do (tiêu chí chất lượng cuối): Đúng: audit đủ 11 tầng mới làm 4 ngày trước và đã sửa hết; delta chỉ 19 commit chủ yếu phụ thuộc. Giữ đường lùi + bền: kiểm bằng máy, sửa lỗ hổng có bằng chứng. Tính năng mới cần đặc tả Approved — không tự mở.
- Đường lùi: Chạy /audit đầy đủ khi chủ dự án muốn
