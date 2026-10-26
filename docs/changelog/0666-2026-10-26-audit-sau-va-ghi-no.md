# 0666 — 2026-10-26 — Báo cáo audit sâu và ghi nợ cần xử lý

Nhánh: `docs/audit-debt-20261026`. Audit dựa trên commit
`c561b67b72a697f41035f489bb7bf5967e5c6b40`; thay đổi trong đợt này chỉ là tài liệu.

## Đã ghi nhận

- Lưu [báo cáo audit](../ops/AUDIT-REPORT-2026-10-26.md) và
  [sổ theo dõi](../ops/AUDIT-STATUS.md): **4 phát hiện Cao, 12 Trung**, tất cả còn mở.
- Ghi đủ 16 ID vào mục "Nợ kỹ thuật còn mở" của `PROGRESS.md`, nêu người xử lý,
  thứ tự ưu tiên và điều kiện đóng; liên kết việc xoay VAPID đã có để tránh ghi trùng.
- Lưu [bộ bằng chứng tái hiện bốn mục Cao](../ops/audit-evidence/2026-10-26/README.md)
  để reviewer có thể chuẩn bị lại trong checkout khác, không phụ thuộc file tạm của máy audit.
- Tách kết quả đo được khỏi giới hạn: không kiểm production, không gọi provider trả phí,
  không khẳng định credential lịch sử còn hiệu lực và không chạy restore phá hủy.

## Kiểm chứng

- Audit trên commit nguồn: 22.537 unit test đạt, 35 bỏ qua; coverage statements 96,08%,
  branches 92,05%, functions 96,97%, lines 96,78%. Số liệu và log được mô tả trong báo cáo.
- PR tài liệu được kiểm bằng Prettier, `git diff --check`, đối chiếu đủ 16 ID và
  `xt.py audit check docs/ops/AUDIT-STATUS.md`.
- `audit check --strict` còn đỏ do các phát hiện chưa sửa; không đánh dấu đóng nợ bằng việc
  cổng build/unit xanh. Bốn bộ tái hiện có đối chứng và được reviewer độc lập xác minh.

## Rủi ro và đường lùi

Không thay đổi mã chạy, dependency, lockfile hoặc schema. Chưa sửa các lỗi được báo cáo,
chưa chấp nhận rủi ro thay chủ dự án. Muốn bỏ thay đổi tài liệu thì revert commit này;
giữ nguyên bằng chứng và trạng thái mở cho đến khi có PR sửa cùng kiểm chứng tương ứng.
