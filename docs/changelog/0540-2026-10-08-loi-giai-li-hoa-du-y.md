# 0540 — Nâng cổng lời giải Lí/Hoá từ 40 lên 60 ký tự (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(content)`
- **Nguồn:** nợ ghi ở changelog 0300 mục F9 ("25 câu Lí + 5 câu Hoá có `explain` 41–59 ký tự").

## Phát hiện

Nợ này **đã được trả từ trước**: changelog 0304 mục 2 viết lại đủ 30 câu (25 Lí + 5 Hoá) và `PROGRESS.md`
đã đánh dấu "ĐÃ TRẢ". Chỉ còn sót ngưỡng test vẫn ở 40 và chú thích test nói dải 41–59 "chưa sửa".

Đo lại bằng script (nạp `PHYSICS_LESSONS` + `CHEM_LESSONS`, đếm `explain.trim().length`):

- Câu có `explain` 41–59 ký tự: **Lí 0 · Hoá 0** (không phải 25 + 5 — con số đó là của trước 0304).
- Câu ngắn nhất hiện tại: 61 ký tự (`ly12-c4-b25#q2`). Không còn câu nào dưới 60.

Vì vậy **không viết lại lời giải nào, không đổi đáp án nào, không có dữ liệu sinh cần sinh lại**.

## Đã làm

- `packages/subject-physics/lessons.test.ts` và `packages/subject-chemistry/lessons.test.ts`: ngưỡng
  `explain` cụt nâng 40 → 60, sửa tên ca test và chú thích cho đúng thực trạng.
- Toán/Sinh giữ ngưỡng 40 (ngoài phạm vi việc này).

## Kiểm chứng

- `npx vitest run` hai file test trên + `scripts/changelog.test.ts`; `typecheck`, `lint`, `prettier --check`.
