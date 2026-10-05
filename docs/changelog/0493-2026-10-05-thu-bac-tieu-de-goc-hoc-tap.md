# 0493 — Thứ bậc tiêu đề ở Góc học tập và trang môn STEM (2026-10-05)

- **Ngày:** 2026-10-05 · **PR:** (điền khi tạo) · **Loại:** `fix(a11y)`.
- **Nguồn:** chuyển từ PR #1230 của chủ dự án. Nhánh gốc dựng trên lịch sử cũ (trước #871), không
  có gốc chung với `main` nên không gộp được. Dựng lại đúng thay đổi trên `main` và làm trọn phần
  còn sót.

## Vấn đề (WCAG 1.3.1)

Tiêu đề nhảy cóc bậc: sau `<h1>` của trang là `<h3>` (Góc học tập) hoặc `<h4>` (tab Chương trình,
tab Bài tập ở trang môn STEM), không có `<h2>` ở giữa. Trình đọc màn hình duyệt theo tiêu đề sẽ thấy
cấu trúc trang thiếu bậc.

## Đã làm

- `Subjects.tsx`: hai khối "Bắt đầu từ đâu hôm nay" và "Phòng thí nghiệm mô phỏng" đổi h3 → h2.
  Thêm `<h2 className="sr-only">Danh sách môn học</h2>` trên lưới thẻ môn (thẻ môn giữ `<h3>`).
- `SubjectDetail.tsx`:
  - "Nhập đề bài…" và "Lời giải chi tiết từng bước" đổi h3 → h2; tên từng bước trong lời giải
    h4 → h3;
  - tên chương (tab Chương trình) và tên bài tập (tab Bài tập) đổi h4 → h2. PR #1230 chưa sửa
    phần này.
- Chỉ đổi thẻ, giữ nguyên class nên giao diện không đổi.

## Bằng chứng

- Lint + Prettier hai file ✅; typecheck, `test:coverage`, build ✅ (chạy ở cổng commit/CI).
- Không test nào bám theo bậc tiêu đề của các chuỗi này (đã grep `e2e/` và `apps/`).
