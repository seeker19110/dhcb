# 0204 — Vá lỗ hổng lint-staged: thư mục `e2e/` không được format/lint lúc commit

## Vấn đề thật

`.lintstagedrc.json` chỉ chạy `eslint` + `prettier` cho glob
`{apps/dhcb/src,apps/hub/src,api,packages}/**/*.{ts,tsx}`, và `prettier`-only cho
`*.{js,cjs,mjs,json,css,md,html,yml,yaml}`. Thư mục `e2e/**/*.ts` không khớp glob nào cả — file
Playwright mới/sửa có thể lọt qua cả eslint lẫn prettier lúc commit.

Bằng chứng thật: PR seeker19110/dhcb#742 (khoá học Git & GitHub thực hành, PR 3/4) thêm
`e2e/programming-course.spec.ts`, lint-staged không báo gì lúc commit, nhưng CI job
"Type + Lint + Format" đỏ vì `prettier --check .` phát hiện file chưa format đúng — phải sửa và
push lại riêng ở một commit sau.

## Đã làm

- `.lintstagedrc.json`: thêm `e2e` vào glob đầu tiên — giờ là
  `{apps/dhcb/src,apps/hub/src,api,packages,e2e}/**/*.{ts,tsx}`, chạy cả `eslint --max-warnings 0`
  lẫn `prettier --write` cho file trong `e2e/`. Đúng quy ước: `e2e/` KHÔNG nằm trong
  `ignorePatterns` của `.eslintrc.cjs` (khác `scripts/`, vốn bị ESLint bỏ qua hẳn nên chỉ có
  `prettier` trong lint-staged) — `npm run lint` toàn repo vẫn luôn phủ `e2e/`, chỉ riêng
  lint-staged (chạy lúc commit) là thiếu.

## Bằng chứng kiểm chứng

- Tái hiện đúng lỗi cũ: tạo file `e2e/__lintstaged-probe.spec.ts` cố tình sai format
  (`{test}` thay vì `{ test }`, thân hàm có khoảng trắng thừa), `git add` rồi chạy
  `npx lint-staged` — **trước khi sửa** lint-staged bỏ qua file này hoàn toàn (không nằm trong
  glob nào); **sau khi sửa**, `npx lint-staged` chạy cả `eslint --max-warnings 0` lẫn
  `prettier --write` trên file đó và tự động format lại đúng chuẩn. File probe đã xoá, không
  còn trong repo.
- `npx eslint e2e --ext ts --max-warnings 0` ✅ 0 cảnh báo (toàn bộ `e2e/` đã sạch sẵn từ
  trước, không có nợ ẩn nào bị lộ ra khi mở rộng phạm vi).
- `npx prettier --check e2e` ✅ toàn bộ file `e2e/` đã đúng chuẩn Prettier.
