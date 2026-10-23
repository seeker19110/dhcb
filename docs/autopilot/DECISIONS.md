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
