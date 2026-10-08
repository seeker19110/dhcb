# 0531 — So khoá cron theo thời gian hằng + gộp hai hàm đọc tiến độ Lập trình (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(security)` + `refactor(programming)`
- **Nguồn:** đề xuất 3 của 0526 + đề xuất DRY của 0522, chủ dự án đồng ý.

## Đã làm

1. **`/api/admin-feature-status` so `x-cron-key` bằng `===` → so theo thời gian hằng.**
   - Thêm `packages/core-auth/secretCompare.ts` (`secretMatches(provided, expected)`: băm SHA-256 rồi
     `timingSafeEqual`; thiếu khoá cấu hình / rỗng / không phải chuỗi → luôn `false`).
   - `cronSecretMatches()` ở `apps/server/src/api/core/push.ts` giữ nguyên chữ ký (vẫn export, test cũ
     dùng) nhưng nay gọi `secretMatches` — không còn bản sao logic.
   - `admin-feature-status.ts` dùng `secretMatches(cronKey, process.env.FEATURE_STATUS_CRON_KEY)`.
     **Sai khác so với gợi ý "dùng lại `cronSecretMatches()`":** hàm đó đọc biến `CRON_SECRET`, còn
     endpoint này dùng biến riêng `FEATURE_STATUS_CRON_KEY` (crontab VPS đang cấu hình theo biến này,
     đổi sẽ làm hỏng cron) — nên tách phần so sánh ra hàm chung nhận khoá làm tham số.
   - Rà `CRON_SECRET` / `x-cron-key` / `cronSecret` và các phép so `=== / !==` với biến môi trường
     dạng SECRET/KEY/TOKEN trong `apps/` + `packages/`: chỉ còn đúng chỗ này; SePay webhook đã dùng
     `timingSafeEqual` từ trước.
   - Hành vi/mã trạng thái giữ nguyên: khoá đúng → chạy kiểm tra (200, không cần đăng nhập); sai/thiếu
     → rơi về luồng đăng nhập admin (401/403).
2. **`apps/dhcb/src/lib/programmingProgress.ts`:** `fetchProgressWithStatus` và
   `fetchProgressWithState` trùng nhau → gộp thành hàm nội bộ `readProgress`; hai hàm công khai giữ
   nguyên chữ ký và hành vi (`state` = `fromCache ? 'error' : 'ready'`).

## Bằng chứng

- Test mới: `packages/core-auth/secretCompare.test.ts` (4 ca) + 1 ca trong
  `admin-feature-status.test.ts` (khoá khác độ dài / thiếu header / server chưa cấu hình → 401).
  `programmingProgress.test.ts` giữ nguyên kỳ vọng.
- Kết quả cổng: xem báo cáo của đợt (typecheck · lint · prettier · build · vitest).
