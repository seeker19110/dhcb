# 0612 — Bảng nháp STEM: mốc phương trình cho câu Toán của ngân hàng đề

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `feat(stem)`
- **Đặc tả:** `docs/specs/2026-10-11-moc-de-ngan-hang-toan.md` (Approved for implementation — chủ
  dự án chọn "Làm bản nhỏ + đóng nợ" sau khi xem số đo).
- **Nguồn việc:** nợ "Bảng nháp STEM" trong `PROGRESS.md`, mục (3).

## Vấn đề

Đề ngân hàng là lời văn, phiên mở bằng `questionId` không có `problemLatex`, nên bước 1 của người
học tự làm mốc và không được so với đề.

## Số đo trước khi làm

Đọc cả 168 câu Toán lớp 10–12 của ngân hàng: chỉ **1 câu** có phương trình/bất phương trình một ẩn
nằm nguyên văn trong đề mà việc giải nó là yêu cầu của đề (`toan10-c6-b2-q3`, `x² + 1 < 0`). Còn
lại: thống kê, xác suất, hình học, toạ độ, lượng giác, mũ/log, hoặc phải tự lập phương trình (tham
số `m`, đỉnh parabol, `f″(x) = 0`) — khai sẵn những phương trình đó là làm hộ bước 1. Câu "Giải
phương trình…" thật nằm ở lớp 8–9 (~10 câu), ngoài ngân hàng. Chủ dự án chọn làm bản nhỏ và đóng
mục nợ.

## Đã làm

- `MathCheckQuestionSchema` thêm `equation` tuỳ chọn (1–200 ký tự) + luật soạn trong chú thích;
  câu `choice` không được có.
- `toan10c6.ts`: khai `equation: 'x^2 + 1 < 0'` cho câu duy nhất đủ điều kiện.
- `stemQuestionBank.ts`: mang sang `StemQuestion.problemLatex` (chỉ ở server; bản công khai
  danh sách đề vẫn là danh sách trắng, không có trường này).
- `stem-scratchpad.ts`: `create_problem { questionId }` gắn `problemLatex` của câu vào phiên;
  `problemLatex` client gửi kèm `questionId` bị bỏ qua.

## Bằng chứng

- Test mới `packages/core-ai/stemQuestionBank.mathEquation.test.ts`: với MỌI câu có mốc, bộ kiểm
  đọc được và mốc có nguyên văn trong đề (chuẩn hoá `²`, `−`, khoảng trắng); mốc không ra bản công
  khai; schema từ chối mốc trên câu `choice`. Đổi tạm mốc thành `x^2 + 2 < 0` → test đỏ đúng ca
  `toan10-c6-b2-q3`; trả lại → xanh.
- `stem-scratchpad.test.ts`: mở `toan10-c6-b2-q3` → phiên có mốc dù client gửi mốc khác; bước 1
  `x^2 < -1` → `valid` (không còn câu "MỐC"), `x^2 > -1` → `invalid · changed_solutions`; câu không
  khai mốc vẫn như cũ.
- Không đổi giao diện (không cần ảnh Tầng 8b), không đổi API/CSDL.
