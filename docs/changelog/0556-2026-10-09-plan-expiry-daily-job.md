# 0556 — Job hạ gói hết hạn chuyển sang khuôn `startDailyJob` (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** #1299 · **Loại:** `refactor(server)`
- **Nguồn:** mục "Sau rà soát" của `0545` — `startPlanExpiryScheduler` cùng khuôn cũ với hai job
  dọn đã chuyển, để đợt riêng vì chạm billing.

## Đã làm

1. `apps/server/src/server.ts`: `startPlanExpiryScheduler` dùng `startDailyJob({ run, onError })`
   (`apps/server/src/dailyJob.ts`) thay cho `lastDaySent = ngày trong tháng` + `setInterval`.
   `run` gọi `downgradeExpiredPlans()` và log `[plan-expiry] Đã hạ N gói hết hạn về free` khi N > 0;
   `onError` giữ `console.error` + `captureServerException(err, { context: 'plan-expiry-scheduler' })`.

## Vì sao

Khuôn cũ chỉ chạy khi SANG ngày mới nên bỏ lỡ job nếu không tiến trình nào sống qua nửa đêm UTC
(PM2 restart sát nửa đêm), và so sai khi hai tháng có cùng ngày trong tháng. Khuôn chung chạy một
lần ~60 giây sau khởi động rồi mỗi lần đổi ngày UTC (so cả năm-tháng-ngày).

## Quyết định

- Chạy thêm một lần lúc khởi động là vô hại: `downgradeExpiredPlans` lũy đẳng (chỉ hạ gói có
  `plan_expires_at < now()`), còn việc CHẶN quyền hết hạn đã tự áp lúc đọc plan.
- Không đổi hành vi nào khác; không có test riêng cho scheduler cũ nên không phải sửa test.

## Kiểm chứng

Xem phần báo cáo của commit (eslint, `vitest run apps/server/src`, typecheck).
