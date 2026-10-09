# 0562 — Bộ kiểm bước Toán đọc dấu chia `:` theo lối SGK (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** #1304 · **Loại:** `feat(stem)`
- **Nguồn:** nợ 🟡 `PROGRESS.md` "Bảng nháp STEM" mục (2) — "Toán ngoài phạm vi: … dấu chia `:`".
  Đặc tả `docs/specs/2026-10-09-kiem-buoc-giai-stem.md` (Approved for implementation, giữ nguyên).

## Xác minh trước khi sửa

Test cũ `stepCheckMath.test.ts` ghi rõ `x = 10 : 2` → `unsupported/unknown_notation` ("chưa nhận —
nói thật"). Tức `:` CHƯA được hỗ trợ; mới sửa mã.

## Đã làm

1. `packages/core-grading/stepCheckMath.ts` (`latexToPlain`): đổi `:` thành `/` sau bước đổi `\:`
   (khoảng trắng LaTeX). Cùng độ ưu tiên, kết hợp trái; `x : 0` → `division_by_zero`; `::`, `:`
   đầu/cuối thành `//`, `/` thừa → bộ phân tích báo không đọc được ("?").
2. Test: ca `x : 2 = 3`, `(x+1) : 3 = 2`, `6 : 2 : 3`, `6 : (2 : 3)`, `:` trong tử `\frac{6:2}{3}`,
   `\:` vẫn là khoảng trắng, chia cho 0, `::` và `:` thiếu toán hạng. Ca cũ "`:` chưa nhận" đổi
   thành `::`/thiếu toán hạng.
3. Đặc tả: một dòng bổ sung ở phần phạm vi. `PROGRESS.md` mục (2) sửa tại chỗ.

## Quyết định

- Tỉ lệ `a:b` trong một bước giải phương trình một ẩn đọc là `a/b` — cùng giá trị nên không sai nghĩa.
- KHÔNG đổi `packages/core-grading/number.ts` (chấm đáp số): môn Sinh dùng `3:1`, `9:3:3:1` làm
  tỉ lệ, đổi thành chia sẽ chấm sai. Chỉ bộ kiểm BƯỚC Toán nhận `:`.

## Bằng chứng

Xem commit/mô tả PR: typecheck · eslint · prettier · vitest `core-grading` `core-ai` `changelog` ·
`check:specs`.
