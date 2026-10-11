# 0607 — Gỡ hai hàm SQL chết của kho lượt cửa sổ trượt 7 ngày (migration 0093)

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `chore(db)`
- **Nguồn việc:** nợ "Kho lượt cửa sổ trượt 7 ngày" trong `PROGRESS.md`. Hai hàm
  `consume_rolling_credit` / `refund_rolling_credit` không còn lời gọi nào từ GĐ1 (2026-09-12), và
  nợ ghi "có thể drop ở đợt dọn dẹp sau". Chủ dự án đồng ý gỡ ngày 2026-10-11.

## Đã làm

- `postgres/migrations/0093_drop_rolling_credit_functions.sql` gỡ **bốn** bản hàm:
  - 0017 tạo chữ ký gốc;
  - 0029 thêm bản có `p_subject` bằng `create or replace` với danh sách tham số KHÁC. Postgres coi
    đó là overload mới, nên bản cũ vẫn nằm lại.
- **Giữ nguyên** bảng `free_daily_credit` và hàm `grant_daily_bonus_rolling`: hai thứ này vẫn đang
  được dùng.
  - `progress.ts` và `cefrDialogueCheck.ts` ghi vào bảng;
  - nhiệm vụ `streak_5` ở `quests.ts` đọc bảng.
- Thêm dòng cho `0093` trong `postgres/migrations/README.md`.

## Bằng chứng

- **Không còn lời gọi:** `git grep` toàn repo chỉ thấy định nghĩa trong 0017/0029, chú thích lịch
  sử, và hai test khẳng định "KHÔNG còn dùng" (`packages/core-billing/usage.test.ts`).
- **Chạy trên Postgres 16 thật** (cụm tạm trong container, cùng `npm run migrate:pg` như job CI
  `sql-prepare`):
  - Rút `0093` ra rồi áp 95 migration → có đủ **4** bản `consume_/refund_rolling_credit` (và 2
    bản `grant_daily_bonus_rolling`).
  - Trả `0093` về, áp tiếp → còn **0** bản; `grant_daily_bonus_rolling` giữ nguyên 2 bản.
  - `migrate:pg` chạy lại → exit 0. Chạy tay lại file `0093` → chỉ có NOTICE "không tồn tại".
  - `npm run check:sql` trên CSDL đã gỡ hàm → PREPARE 626 câu, không câu nào hỏng.
  - **Rollback** (áp lại 0017 + 0029, như chú thích trong file) → trả về đủ 4 bản.
- Unit: `migrations-readme-coverage` + `verify-v2-migration-safety` + `usage.test.ts` 46/46 xanh.
