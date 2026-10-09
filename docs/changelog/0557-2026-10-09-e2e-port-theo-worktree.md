# 0557 — Playwright đọc cổng từ `E2E_PORT` để mỗi worktree tự chọn cổng (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** #1300 · **Loại:** `chore(e2e)`
- **Nguồn:** nợ ghi ở `TRAPS.md` mục 19 (nhiều tác nhân chạy Playwright song song dùng chung cổng
  5179 ⇒ server của worktree khác phục vụ, ảnh/test chụp nhầm mã).

## Đã làm

1. **`scripts/lib/e2ePort.ts`** — hàm thuần `resolveE2ePort(raw, isCi)`: không đặt → `5179` +
   `reuseExistingServer = !CI` (y hệt trước); đặt `E2E_PORT` khác 5179 → cổng đó +
   `reuseExistingServer = false`. Giá trị phải là số nguyên 1024–65535, sai thì ném lỗi tiếng Việt
   (không im lặng về mặc định). Đặt trong `scripts/lib/` vì vitest quét `scripts/**/*.test.ts`.
2. **`playwright.config.ts`** dùng hàm trên cho cổng, `baseURL` và `reuseExistingServer`.
3. **`e2e/home-clarity-evidence.spec.ts`**: `BASE_ORIGIN` từng hard-code `localhost:5179` (sẽ lệch
   khi đặt `E2E_PORT`) → lấy cùng hàm.
4. **`TRAPS.md` mục 19**: "Cổng chốt chặn" từ "CHƯA có" thành đã có `E2E_PORT`; giữ nguyên phần
   "Cách rà".

## Không đổi (cố ý)

- `.github/workflows/*` (cổng được bảo vệ; CI không đặt `E2E_PORT` nên hành vi y hệt).
- `scripts/shots-learning-ux.ts` đã đọc `PORT`/`BASE_URL` riêng; `docs/CODEX_CLOUD_SETUP.md` chỉ
  nhắc `ALLOWED_ORIGINS` cho 5179 (mặc định vẫn đúng).

## Bằng chứng

Xem báo cáo commit: unit `e2ePort.test.ts`, typecheck, eslint, và chạy thật Playwright với
`E2E_PORT=5183`.
