# 0658 — 2026-10-22 — Nâng phụ thuộc trong cùng nhánh phiên bản (trừ linkedom)

PR #1429. Từ `npm run maintain` (🔴 0 · 🟡 3): mục "có gói lỗi thời". Chỉ cập nhật
`package-lock.json` lên bản "Wanted" (vá/phụ, đúng khoảng `^` trong `package.json`), không nâng
bản chính.

## Thay đổi

- Lên bản mới: `@aws-sdk/client-s3` 3.1156.0 · `@google/genai` 2.30.0 · `@sentry/node`/`@sentry/react`
  11.8.0 · `size-limit`/`@size-limit/file` 14.3.0 · `typescript-eslint` + parser/plugin 8.72.0 ·
  `dotenv` 18.0.9 · `google-auth-library` 11.3.1 · `jose` 6.2.13 · `lucide-react` 1.61.0 ·
  `nodemailer` 10.2.1 · `sql.js` 1.15.1 · `vite` 8.3.5 (kèm phụ thuộc gián tiếp).
- `lucide-react` 1.61 vẽ lại đường nét icon → chạy `npm run gen:prerender-home`, cập nhật
  `apps/dhcb/src/prerender/guestHome.prerender.html`.

## Quyết định

- **Giữ `linkedom` 0.18.13.** Bản 0.18.14 chuyển sang `@acemir/cssom`, bản ESM của gói đó không
  xuất `parse` → rolldown báo `MISSING_EXPORT` ở `apps/dhcb/src/lib/domRunner.ts`, `npm run
build` đỏ. Dependabot sẽ mở lại bản này; chỉ nâng khi linkedom/@acemir/cssom sửa export.
- Không đụng bản chính: `@anthropic-ai/sdk` 1.x, `happy-dom` 21 (cần đọc thay đổi riêng), và ba
  thứ đang có ràng buộc thật ở CLAUDE.md mục 6 (TypeScript 7, ESLint 10).

## Kiểm chứng

- `npm ci` exit 0 (cảnh báo `lint-staged` đòi Node ≥ 22.22.1 có từ trước).
- Sau `rm -rf packages/*/dist dist dist-server`: build 0 · typecheck 0 · lint 0 · format:check 0 ·
  budget 0 (JS khởi động 136,87/160 kB, CSS 23,76/26 kB).
- `npm run test:coverage`: 1.009 file / 22.521 test xanh, 35 skip có sẵn; coverage
  96,08/92,05/96,97/96,79%. Trước khi chạy `gen:prerender-home`: 1 đỏ (snapshot trang chủ khách).
- Tầng 8b: ảnh trang chủ khách + trang chủ đã đăng nhập ở 1440×1000 và 390×844, trước (lockfile
  cũ) và sau. Khác biệt chỉ trong khung icon não "Ôn tập" (≈ 12×9 px), không điểm ảnh nào lệch quá
  40/255, bố cục không đổi.
