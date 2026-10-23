# 0660 — 2026-10-23 — Thu gọn PROGRESS.md 224 KB → 158 KB (autopilot)

PR (điền khi mở). Chủ dự án gõ `/autopilot` không kèm mô tả; mục tiêu lấy từ cảnh báo
`xt.py doctor` ("PROGRESS.md 224044 byte") và luật CLAUDE.md mục 3 (`PROGRESS.md` chỉ giữ trạng thái
hiện tại, phần đã xong dời sang `docs/legacy/`). Kế hoạch + bằng chứng: `docs/autopilot/PLAN.md`,
quyết định `docs/autopilot/DECISIONS.md` (D-001…D-005).

## Đã làm

- T-001: 19 mục nợ ✅ đã đóng → đầu `docs/legacy/no-ky-thuat-da-dong.md` (theo quy ước sẵn của kho).
- T-002: "Đã xong — tóm tắt theo mảng", "Cần làm tay › B. ĐÃ XONG", "Sự cố hạ tầng đã xử lý" → kho
  mới `docs/legacy/progress-luu-tru-den-2026-10-23.md`.
- T-003: 19 mục "Tiếp theo" đã xong trọn vẹn (audit UI/UX 2026-09-30 U1–U10, audit 2026-10-10 E1–E5,
  9 lệnh redesign đã merge, S05-1, phễu, các mục ✅/gạch ngang ở Ưu tiên 2–3) + phần đã thi hành của
  Ưu tiên 1c (0S–S12; xác minh #981/#983 đã merge — ghi "ĐANG MỞ PR" cũ là lỗi thời) → cùng kho.
- `PROGRESS.md`: 224.044 → 157.734 byte (−30 %); thêm câu trỏ tới kho mới.

## Quyết định

- D-001: giữ tên mục của DHCB, KHÔNG đổi sang khuôn 4 mục / 8 KB của khung — `report-status.sh` + test
  bóc tách theo tên mục hiện tại.
- D-003, D-005: hai ngưỡng byte ước lượng trước khi đo (185 000, 150 000) bị lệch, sửa theo số đo
  (190 000, 160 000). Phần còn lại là việc mở / quyết định còn hiệu lực / nợ mở; dời thêm cần chủ dự
  án xác nhận mục nào hết hiệu lực.
- D-004: bỏ audit delta giữa hai lát — diff chỉ dời Markdown.
- Giữ lại: mục 2026-10-06 (chờ chủ dự án), kế hoạch 2026-09-23 (S10/S11 chờ chuyên gia), Bạn Đồng
  Hành (việc tay với key thật), T2/T3 (chờ duyệt sư phạm), UX-R4 + 6/15 lệnh redesign chưa làm.

## Kiểm chứng

- Mỗi lát: so tập dòng (bỏ dòng trống) trước/sau của `PROGRESS.md` + kho đích — **mất 0 dòng**;
  dòng thêm chỉ là đầu đề kho, nhãn nguồn, câu trỏ.
- Gate từng task qua `xt.py loop record` (exit 0): `scripts/report-status.test.ts` +
  `scripts/changelog.test.ts` xanh, `prettier --check PROGRESS.md docs/legacy`, ngưỡng byte.
- Hook đầu phiên vẫn đọc đúng 19 mục nợ mở; `scripts/check-progress-freshness.sh` sạch.
- Thay đổi duy nhất khác nguyên văn: 3 link `](docs/audit/…)` trong kho đổi thành `](../audit/…)` để
  không gãy khi nằm trong `docs/legacy/`.
