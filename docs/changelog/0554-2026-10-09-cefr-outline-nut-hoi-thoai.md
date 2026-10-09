# 0554 — Mục lục CEFR: unit không có hội thoại thì không sinh nút "Hội thoại" (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(english)`
- **Nguồn:** phần "Kèm" của nợ `PROGRESS.md` "[S11-1 … 0548] Hội thoại CEFR" (đã xoá khỏi nợ).

## Vấn đề

Cây mục lục CEFR (`buildCefrOutline`) luôn sinh một nút "Hội thoại" cho MỌI unit. Số liệu thật
(đếm từ `apps/dhcb/public/data/dialogues.json` × `cefr.json`): **197 unit, 35 có hội thoại
(A1 6 · A2 5 · B1 6 · B2 6 · C1 6 · C2 6; tổng 79 hội thoại), 162 KHÔNG có**. 162 nút bấm vào
không có gì, lại làm mẫu số "N hoạt động" và tiến độ unit/cấp/môn (thẻ "Tiến độ theo môn", cây ý
định) có thêm một hoạt động ảo không bao giờ làm được.

## Đã làm

- `apps/dhcb/src/lib/outline/cefrOutline.ts`: `tienDoHoiThoaiCuaUnit` trả `undefined` khi unit
  không có hội thoại; `hoatDongCuaUnit` chỉ đẩy nút khi có kết quả. "N hoạt động" của unit và
  mọi phép đếm tiến độ (vốn tính trên nút thật) tự đúng, không cần sửa nơi gọi.
- **Dữ liệu hội thoại CHƯA tải / tải lỗi** (`dialogueTitlesByUnit` vắng hoặc thiếu unit): cũng
  KHÔNG sinh nút. Lý do chọn "ẩn tới khi biết" thay vì "hiện tạm rồi rút": hiện tạm làm mẫu số
  và % tiến độ nhảy XUỐNG ở 162 unit khi tải xong (và nháy bố cục ở 162 chỗ); ẩn thì chỉ có 35
  unit hiện thêm nút khi dữ liệu về — mẫu số chỉ tăng đúng sự thật, không bao giờ "completed"
  khi chưa biết tổng.
- Nơi gọi (`CefrLevelPage`, `subjectProgressBoard`, `buildIntentOutlines`) KHÔNG phải sửa: đã
  truyền `dialogueTitlesByUnit` từ đợt 0548 (codemap impact chỉ ra đúng 3 nơi + test).

## Kiểm chứng

- Test: `cefrOutline.test.ts` — unit không hội thoại → không nút, số con = vòng + ngữ pháp, chữ
  "N hoạt động" khớp; unit có hội thoại → nút như cũ (3 trạng thái); chưa biết tổng → không nút,
  không `completed`.
- Tầng 8b: ảnh trước/sau 1440 + 390 × blue-sky + dark-blue, unit "Danh từ (1)" (không hội thoại:
  6 → 5 hoạt động, nút biến mất) và "Chào hỏi & giới thiệu bản thân" (có: 7 hoạt động, nút
  "Hội thoại · Chưa xem" giữ nguyên). Ảnh ở ngoài repo (scratchpad `shots-0554/`).

## Rủi ro

- % tiến độ môn Anh của người dùng đang ở giữa cấp có thể TĂNG nhẹ (mẫu số giảm) — đúng ý đồ.
- Link sâu `?hd=dialogue:<unit không có hội thoại>` không còn nút tương ứng trong cây (trang vẫn
  hiển thị như bình thường, không lỗi).
