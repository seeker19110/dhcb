# 0684 — 2026-10-28 — Nâng TypeScript 5.9.3 → 6.0.3

Mục 6 của `docs/research/2026-10-13-goi-y-nang-cap.md` ("thống nhất TypeScript với các repo anh em khi có đợt
nâng phụ thuộc"). Chủ dự án yêu cầu "làm tiếp mục tiếp theo trong PROGRESS"; các mục khác trong "Tiếp theo" đều
đang chờ người (chuyên gia, thiết bị thật, khoá trả phí), đây là mục AI làm trọn được.

## Nghiên cứu (2026-10-28, nguồn sống: npm registry)

- `typescript@6.0.3` phát hành 2026-04-16 (bản vá thứ hai của 6.0, đã hơn 6 tháng). `latest` hiện là 7.0.2.
- `@typescript-eslint/parser@8.72.1` khai `typescript: >=4.8.4 <6.1.0` ⇒ 6.0.x được hỗ trợ, 6.1/7.x thì chưa
  (đúng ràng buộc ghi ở CLAUDE.md §6).

## Đã làm

- `package.json`: `typescript` `^5.2.2` → **`~6.0.3`**. Dấu `~` (chỉ nhận 6.0.x) có chủ đích: `^6.0.3` sẽ tự nhảy
  lên 6.1 khi phát hành, mà parser của typescript-eslint chưa hỗ trợ.
- `package-lock.json`: sinh bằng npm 11 (`--package-lock-only`) để chỉ đổi đúng mục `typescript`. npm 10 ở máy
  làm rơi các trường `libc` của gói native, đã bỏ bản đó.
- TS 6 báo lỗi `TS5101: baseUrl is deprecated` (sẽ ngừng chạy ở TS 7). Không tắt bằng `ignoreDeprecations` mà
  **gỡ hẳn `baseUrl`** ở `tsconfig.base.json`, `tsconfig.api.json`, `tsconfig.package.base.json`,
  `apps/hub/tsconfig.json`; `paths` từ nay phân giải tương đối theo file tsconfig khai báo nó (đổi
  `packages/*` → `./packages/*` ở hai file gốc). Không có import nào dựa vào `baseUrl` để phân giải đường dẫn
  trần — typecheck xanh chứng minh.
- `CLAUDE.md` §6 và `docs/claude-md-chi-tiet.md` §6: ghi TypeScript 6.0 và lý do ghim.

## Bằng chứng

`rm -rf packages/*/dist dist dist-server` rồi `npm ci` (npm 10, exit 0) → `npx tsc -v` = 6.0.3 →
`npm run typecheck` ✅ · `npm run lint` ✅ (0 cảnh báo) · `npm run format:check` ✅ · `npm run build` ✅ (gồm
`build:packages` + `tsconfig.server.json` + hub) · `npm run size` / `size:chunks` / `budget` ✅ · boot
`dist-server/server.js` như job CI → `/api/health` OK sau 5 giây · `npm run test:coverage`: xem mô tả PR.

## Đường lùi

Revert PR (trả `typescript` về `^5.2.2` và `baseUrl`). Không đổi mã nguồn, không đổi output runtime.
