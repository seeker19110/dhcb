# 0486 — Gộp 5 bản nâng phụ thuộc của Dependabot vào một PR, dựng lại lockfile trên `main` (2026-10-03)

- **Ngày:** 2026-10-03 · **PR:** (điền khi tạo) · **Loại:** `chore(deps)`.
- **Phạm vi:** dọn các PR Dependabot đang treo. Chủ dự án giao "làm tất cả" (2026-10-02).

## Vấn đề

Sáu PR Dependabot mở từ 27/09 đến 01/10.

- Lockfile của chúng dựng trên `main` cũ: `main` đã đi thêm hàng chục commit.
- #1192 đỏ ở bước "Type + Lint + Format".
- #1194 nâng `@eslint/js` lên 10, kéo theo ESLint 10. CLAUDE.md mục 6 đã ghi rõ chưa nâng được, vì
  `eslint-plugin-jsx-a11y` (cổng a11y) mới khai peer tới ESLint 9.

## Đã làm

- **#1198** (`actions/cache` 4 → 6): chỉ sửa `ci.yml`, CI xanh, không xung đột → merge thẳng.
- **#1194** (ESLint 10): đóng, kèm bình luận nêu ràng buộc.
- **#1192 · #1193 · #1195 · #1196**: gộp vào PR này. Cài lại bằng `npm install` trên `main` mới
  (không chép lockfile cũ), lấy bản vá mới nhất trong cùng dải:

| Gói                              | Cũ        | Mới       | Ghi chú                                          |
| -------------------------------- | --------- | --------- | ------------------------------------------------ |
| `dotenv` (dev)                   | ^18.0.2   | ^18.0.5   | vá                                               |
| `prettier` (dev)                 | ^3.9.8    | ^3.9.9    | vá — `format:check` vẫn sạch, không file nào đổi |
| `vite` (dev)                     | ^8.3.0    | ^8.3.2    | vá                                               |
| `@lezer/highlight` (`@dhcb/app`) | ^1.2.3    | ^1.2.5    | vá                                               |
| `@aws-sdk/client-s3`             | ^3.1137.0 | ^3.1146.0 | vá (lưu trữ R2)                                  |
| `@sentry/react`                  | ^10.75.1  | ^11.4.0   | **bản lớn**                                      |

- Về **Sentry 11**: app chỉ gọi `Sentry.init({ dsn, environment, tracesSampleRate })` và
  `captureException` (`apps/dhcb/src/lib/errorTracking.ts`), đều không đổi ở bản lớn. SDK được nạp
  lười (`import()` động), nên bundle đầu không đổi. `@sentry/node` phía server giữ 10.x; hai SDK chạy
  ở hai bundle riêng nên lệch bản lớn không ảnh hưởng nhau.

## Bằng chứng

- `npm ci` khớp lockfile: exit 0.
- Typecheck (đã xoá `dist`) ✅ · Lint ✅ · `prettier --check .` ✅
- Build ✅ · `build:server` ✅
- `size-limit`: JS đầu 152,76/160 kB, CSS 23,68/26 kB.
- `test:coverage` 782 file / 18412 test ✅
