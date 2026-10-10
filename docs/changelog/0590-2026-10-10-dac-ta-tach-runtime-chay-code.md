# 0590 — Đặc tả tách runtime chạy code sang tên miền con (gỡ `unsafe-inline`/`unsafe-eval` khỏi CSP)

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `docs(security)`
- **Nguồn:** chủ dự án yêu cầu "viết đặc tả tách runtime chạy code ra tên miền con" sau khi
  changelog `0588` để lại cảnh báo `content-security-policy` của máy quét.

## Đã làm

- Viết `docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md` theo khuôn 6 ô
  (`docs/templates/dac-ta-tinh-nang.md`). **Trạng thái Draft** — chờ chủ dự án chốt 4 câu hỏi
  (tên miền con, tên miền con hay domain riêng, thời gian Report-Only, gỡ SDK đăng nhập chưa dùng).

## Phát hiện khi khảo sát (đo trên mã + bản build thật)

- `new Function`/`eval` trong 723 file JS của `dist/`: chỉ ở 3 worker chạy JS học viên, Pyodide
  (`EM_ASM` dùng `eval` — Pyodide cần cả `'unsafe-eval'`, không chỉ `'wasm-unsafe-eval'`) và một
  phép thử JIT có `try/catch` của zod. Trang chính tự nó KHÔNG cần `'unsafe-eval'`.
- `'unsafe-inline'` còn cần vì đúng 2 chỗ: iframe `srcdoc` của `HtmlPreview` (thừa kế CSP trang
  cha) và một script chống nháy theme ở `apps/dhcb/index.html` (thay bằng băm `sha256`).
- Mọi lượt chạy code đi qua một điểm vào `runLessonCode()` — tách runner không phải sửa 3 trang
  Lập trình. 8 bộ chạy giả lập (git, bash, swift, kotlin…) không dùng `eval`, không cần chuyển.
- Hiện không có tính năng chia sẻ code giữa người dùng → rủi ro trực tiếp thấp; giá trị chính là
  khôi phục CSP làm lớp phòng thủ chống XSS.
- Đã cân nhắc phương án cùng origin (iframe `/runner.html` có sandbox): rẻ hơn nhưng một lỗi cấu
  hình là XSS trên origin chính — loại, lý do ở mục 2.2 đặc tả.
