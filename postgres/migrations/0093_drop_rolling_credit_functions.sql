-- 0093_drop_rolling_credit_functions.sql — Gỡ hai hàm SQL chết của kho lượt cửa sổ trượt 7 ngày.
-- Changelog 0607; chủ dự án đồng ý 2026-10-11.
--
-- GĐ1 (2026-09-12, đặc tả docs/specs/2026-09-12-gd1-xoa-goi-pro.md) đổi gói Free sang hạn mức
-- TỔNG/ngày (`consume_usage_total`). Từ đó `consume_rolling_credit` + `refund_rolling_credit`
-- không còn lời gọi nào — cả mã TS (`packages/core-billing/usage.test.ts` canh "KHÔNG còn
-- dùng") lẫn hàm SQL khác. Xác minh lại 2026-10-11 bằng `git grep` trên toàn repo.
--
-- Có tới BỐN bản cần gỡ: 0017 tạo chữ ký gốc, 0029 thêm bản có `p_subject` bằng
-- `create or replace` với danh sách tham số KHÁC — Postgres coi đó là overload mới, bản cũ
-- vẫn nằm lại.
--
-- KHÔNG đụng: bảng `free_daily_credit` + hàm `grant_daily_bonus_rolling` — vẫn đang dùng
-- (`progress.ts`, `cefrDialogueCheck.ts` ghi; nhiệm vụ `streak_5` ở `quests.ts` đọc).
--
-- Lũy đẳng: `drop function if exists` — chạy lại không lỗi. Không mang dữ liệu.
--
-- ROLLBACK (chạy tay): áp lại phần định nghĩa hai hàm trong
--   postgres/migrations/0017_free_rolling_credit.sql (chữ ký không có p_subject) và
--   postgres/migrations/0029_platform_subject.sql (chữ ký có p_subject) — cả hai dùng
--   `create or replace`, chạy lại an toàn.

drop function if exists public.consume_rolling_credit(uuid, date, integer, text);
drop function if exists public.consume_rolling_credit(uuid, date, integer);
drop function if exists public.refund_rolling_credit(uuid, date, text);
drop function if exists public.refund_rolling_credit(uuid, date);
