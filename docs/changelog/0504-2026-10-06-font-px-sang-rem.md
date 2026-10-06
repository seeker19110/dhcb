# 0504 — Chuyển đổi font-size từ px sang rem để hỗ trợ người dùng thay đổi cỡ chữ

Ngày: 2026-10-06. Không có đặc tả riêng (việc cơ học dựa trên quy trình `FontSizeRem.design.test.ts`).

## Nội dung và hành trình

- Chuyển đổi ~498 chỗ `text-[Npx]` (Tailwind) và `fontSize: 'Npx'`/`fontSize: N` (React style) sang rem trong các file TS/TSX ở `apps/dhcb/src`, `apps/hub/src` và `packages`.
- Công thức chuyển đổi: px ÷ 16 (ví dụ: 11px → 0.6875rem, 12px → 0.75rem, 14px → 0.875rem).
- Giữ nguyên hiển thị ở cỡ chữ mặc định 16px của trình duyệt.
- Loại bỏ hoàn toàn danh sách nợ cũ (`LEGACY_PX_FONT_SIZE`), chỉnh `LEGACY_TOTAL = 0` trong `apps/dhcb/src/pages/core/FontSizeRem.design.test.ts`.

## Lý do

Người dùng đổi cỡ chữ mặc định của trình duyệt (16px → 24px) thì chữ viết bằng px **khoá cỡ lại**, không theo cỡ người dùng (WCAG 1.4.4 · EN 301 549 v4.1.1 §9.7). Viết bằng rem thì chữ tự động lớn theo.

## Kiểm chứng

- Chạy script `scripts/convert-font-size-px-to-rem.ts`: 498 chỗ được chuyển đổi trong 126 file.
- typecheck ✅ (tsc -p apps/dhcb/tsconfig.json · tsconfig.api.json · tsconfig.e2e.json · apps/hub/tsconfig.json)
- lint ✅ (eslint . --max-warnings 0)
- format ✅ (Prettier, không có thay đổi đáng kể)
- test FontSizeRem ✅ (4/4 passed)
- test suite chạy nền (vitest run)

## Rollout và rollback

Không có migration dữ liệu, không đổi schema. Chỉ thay đổi UI. Nếu rollback, source cũ vẫn chạy được bình thường (rem không gây lỗi reverse compatibility).
