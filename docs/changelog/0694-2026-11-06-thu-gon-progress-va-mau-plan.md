# 0694 — 2026-11-06 — Thu gọn `PROGRESS.md` + đưa mẫu `PLAN.md` của khung vào git

## Phạm vi

- **(a) Mẫu `PLAN.md` của khung:** `.gitignore` bỏ qua mọi `PLAN.md` (artifact tạm của một đợt
  việc), nên `.xtemplates/framework/templates/PLAN.md` không bao giờ vào git. Ở clone sạch,
  `xt.py validate` báo 4 liên kết hỏng và `doctor` báo lỗi khung. Sửa: thêm ngoại lệ
  `!.xtemplates/framework/templates/PLAN.md` và commit đúng file của khung tag `v3.30.1`
  (bản đang cài), tải nguyên văn từ `raw.githubusercontent.com/seeker19110/X-Templates/v3.30.1/…`.
- **(b) Thu gọn `PROGRESS.md`:** 146.963 byte (≈1.400 dòng) → 8.179 byte, dưới ngân sách 8 KB
  của khung (`xt.py progress-check`). Bản cũ chép NGUYÊN VĂN sang
  `docs/legacy/progress-luu-tru-den-2026-11-06.md` (thêm 7 dòng đầu giải thích). Bản mới giữ đúng
  5 mục cũ, mỗi việc/nợ còn mở một dòng kèm `Lxxx` = số dòng chi tiết trong bản lưu trữ.
  - Bỏ khỏi bản mới (vẫn còn trong bản lưu trữ): các mục đã xong hết (P6 56/56 chặng, tiêu chí kích
    thước chương, Zod, tối ưu seed-all, export CSV GĐ1) và các quyết định đã lỗi thời (giữ
    Tailwind 3/React 18/TS 5, "Thanh toán Pro: KHÔNG làm").
  - Tóm tắt từng mục do một subagent đọc toàn file soạn; phiên chính đối chiếu lại với bản gốc
    (mục xuất/xoá dữ liệu, mục `hoc-tap.`, mục nhiễu eval) và kiểm mọi `Lxxx` trỏ đúng dòng.

## Quyết định

- **Giữ tên và thứ tự 5 mục của dhcb**, không theo thứ tự khung (Đang làm · Tiếp theo · Quyết
  định · Bàn giao phiên). Lý do: `scripts/changelog.test.ts` đọc `## Giai đoạn hiện tại`,
  `.claude/report-status.sh` đọc `## Nợ kỹ thuật còn mở`, CLAUDE.md mục 3/13 mô tả cấu trúc này.
  `progress-check` vì vậy còn báo 1 lỗi thứ tự — chỉ là cảnh báo của `doctor`, không chặn. Đường
  lùi: đổi tên mục cần sửa đồng thời hai script trên + test.

## Kiểm chứng

- `xt.py validate`: "Khung hợp lệ: 195 file, 2854 mục checklist"; `xt.py doctor`: 0 lỗi.
- `xt.py progress-check`: hết lỗi kích thước; còn lỗi thứ tự mục (cố ý, xem trên).
- `scripts/report-status.test.ts` + `scripts/changelog.test.ts`: 13/13 xanh. `report-status.sh`
  in đủ 19 mục nợ 🟡.
- `scripts/check-progress-freshness.sh`: OK. Prettier `--check` các file đổi: đạt.

## Còn mở / góp ý

- `report-status.sh` chỉ nhận mục nợ mở đầu bằng 🟡/🔴 — mục 🟠 (AUD-SEC-005) không hiện ở hook
  đầu phiên. Đã như vậy trước đợt này; sửa cần đụng hook (cổng), nên để PR riêng nếu chủ dự án muốn.
