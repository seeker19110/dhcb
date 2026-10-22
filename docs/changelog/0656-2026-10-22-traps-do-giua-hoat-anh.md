# 0656 — 2026-10-22 — TRAPS mục 32: đo kích thước giữa hoạt ảnh

PR #1427. Ghi bài học từ issue #1409 (changelog `0655`, PR #1426) vào `TRAPS.md` mục 32: đo
`getBoundingClientRect` khi tổ tiên còn chạy hoạt ảnh transform cho số hụt ngưỡng cực nhỏ do
Chromium làm tròn float32; cách rà và cổng chốt (chờ hoạt ảnh hữu hạn xong, không hạ ngưỡng).

## Quyết định

- Không bỏ `animate-fade-in` của thẻ lịch ở chế độ `embedded` dù nó chồng với hoạt ảnh của khối
  "Tuần này" lúc tải trang: hoạt ảnh lớp trong là hiệu ứng mở khi bấm "Xem lịch hoạt động";
  bỏ đi mất hiệu ứng đó, còn phần chồng chỉ xảy ra một lần lúc tải.
- Chủ dự án chốt (2026-10-22): agent tự merge khi CI xanh, không hỏi lại — đúng CLAUDE.md mục 11.

## Kiểm chứng

- `npx prettier --check TRAPS.md` sạch, `git diff --check` sạch, `scripts/changelog.test.ts` xanh.
