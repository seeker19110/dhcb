# 0674 — 2026-10-27 — Server dev Vite giữ cookie/Origin như Express và có route `/api/subjects`

PR #1453. Đợt sửa audit thứ bảy: đóng `AUD-XFEAT-002` và `AUD-XFEAT-003` (🟠).

## Vấn đề

- `scripts/lib/apiEdgeDevMiddleware.ts` (middleware API của `npm run dev`, cũng là server E2E chạy)
  chỉ chuyển `content-type` + `authorization`. Đăng nhập chỉ đọc cookie `session_token` ⇒ ở dev mọi
  API cần đăng nhập trả 401 dù có phiên thật (Express trả 200).
- Bảng route dev (`apps/dhcb/vite.config.ts#API_ROUTES`) thiếu `/api/subjects` ⇒ Góc học tập ở dev
  nhận HTML SPA thay JSON, hiện "Không tải được dữ liệu".

## Đã làm

- Middleware chuyển đủ header như `wrapEdge` (bỏ hop-by-hop + `content-length`), dựng URL theo host
  thật, và nhận dependency `isTrustedMutation` — Vite nạp đúng `packages/core-auth/security.ts` nên
  request ghi dữ liệu từ Origin lạ trả 403 `UNTRUSTED_ORIGIN` như production.
- Thêm `/api/subjects` vào bảng route dev.
- `scripts/devApiRoutes.test.ts` (mới): mọi route dev phải có ở Express; `/api/subjects` phải có ở dev.

## Kiểm chứng

- Đỏ-trước: 2 ca mới ở `apiEdgeDevMiddleware.test.ts` ĐỎ trên mã cũ, 7/7 XANH sau sửa; ca
  `/api/subjects` của test parity ĐỎ khi bỏ phần sửa `vite.config.ts`.
- Smoke Vite dev thật: `/api/subjects` 200 JSON; POST có cookie từ Origin lạ 403; POST cùng origin qua
  cổng (401 chưa đăng nhập).
- Smoke cookie thật trên Postgres 16 tạm (`dhcb_audit_devauth`, đủ migration, đã xoá):
  `/api/auth?action=me` với phiên hợp lệ → 200 đúng user; cookie sai → 401.
- `scripts/` 1.365/1.365 đạt; `npm run typecheck`, `npm run lint` đạt.

## Rủi ro và đường lùi

Chỉ đổi đường dev/E2E; production Express không đổi. Còn lại (ghi nhận, chưa làm): route `/api/*`
không có trong bảng dev vẫn rơi về SPA HTML — test parity chỉ chặn route dev lệch Express, chưa ép
dev phủ mọi route Express. Đường lùi: revert PR.
