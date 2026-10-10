# 0575 — gitleaks: đánh dấu khoá giả trong đề P5 s4 của dự án T3

- **Ngày:** 2026-10-09 · **PR:** (xem mô tả PR) · **Loại:** `fix(programming)`
- **Nối tiếp:** changelog `0573` (PR #1323).

## Vấn đề

Check `gitleaks` trên PR #1323 báo 5 "rò rỉ" (rule `generic-api-key`) ở
`packages/subject-programming/projectStepsT3P5.ts`. Cả 5 là ca kiểm của đề P5 s4 ("cấu hình qua
biến môi trường") với chuỗi `SECRET_KEY=so-hoc-tap-bi-mat-2026` — khoá GIẢ viết cho bài học.
Bản sửa được đẩy lên nhánh PR, nhưng auto-merge đã gộp #1323 vài chục giây trước đó, nên `main`
vẫn mang 5 dòng chưa đánh dấu và lần quét `push` lên `main` sẽ đỏ.

## Đã làm

- Thêm `// gitleaks:allow` trên đúng 5 dòng, kèm một chú thích giải thích — tiền lệ
  `packages/core-ui/guestId.ts`. Không thêm `.gitleaks.toml`/allowlist regex (không nới bộ quét
  của cả dự án).
- Ghi số PR vào changelog `0573` (#1323) và `0574` (#1322).

## Kiểm chứng

- gitleaks 8.24.3 (đúng bản CI) chạy `gitleaks dir` trên file: bản cũ `leaks found: 5`, bản mới
  `no leaks found`.
- `projectStepsT3.test.ts` + `lessonsPython.test.ts`: 1556/1556 xanh (chỉ đổi chú thích).

## Bài học

Đẩy bản sửa lên nhánh của một PR đã bật auto-merge có thể đến SAU lúc merge — sau khi push
phải kiểm lại nội dung trên `main` (`git show origin/main:<file>`), đừng tin rằng commit đã kịp
vào.
