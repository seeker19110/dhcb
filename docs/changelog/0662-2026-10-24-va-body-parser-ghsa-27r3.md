# 0662 — 2026-10-24 — Vá lỗ hổng high của body-parser (GHSA-27r3-jxmh-p828)

PR (điền khi mở). Chủ dự án gõ `/autopilot` không kèm mô tả; theo luật `CLAUDE.md` mục 12 (đợt #1434)
agent tự chọn việc. `npm run maintain` mục 2 báo `npm audit --omit=dev` exit 1: `body-parser`
2.0.0–2.3.0 dính DoS qua dữ liệu thừa sau thân request nén. `npm audit` xác nhận có bản vá.

## Đã làm

- `npm audit fix`: `body-parser` 2.3.0 → 2.4.0, kèm phụ thuộc gián tiếp `content-type` ^2.1.0,
  `iconv-lite` ^0.7.3, `qs` ^6.16.1, `fast-uri` 3.1.8 → 3.1.9. Chỉ `package-lock.json`; `package.json`
  không đổi (2.4.0 nằm trong dải `^2` mà `express@5.3.0` cho phép).

## Quyết định

- D-006: `npm audit fix` thay vì thêm `overrides` (thêm nợ cấu hình) hoặc chờ Express nâng (để hở lỗ hổng
  production). Đường lùi: revert lockfile.
- **Không làm trong đợt này:** `happy-dom` 17.0.0–21.0.3 còn 1 lỗ hổng high (GHSA-834v-8h66-3h79, thực thi
  mã qua import alias). Chỉ là phụ thuộc DEV của test (`vitest`), ngoài cổng CI `--omit=dev`; cách vá là
  nâng `happy-dom` 20 → 21 (breaking). Đề xuất làm một đợt riêng, có chạy lại toàn bộ test giao diện.

## Đính chính

- Changelog `0660` và PR #1433 ghi "PLAN lưu trong repo": sai. `docs/autopilot/PLAN.md` nằm trong
  `.gitignore` (dòng 76), chỉ `docs/autopilot/DECISIONS.md` được theo dõi. Bằng chứng kế hoạch vẫn có
  trong `DECISIONS.md` (D-001…D-006) và mô tả PR.

## Kiểm chứng

- `npm audit --omit=dev`: 0 lỗ hổng (trước: 1 high). `npm ci --dry-run` exit 0 (lockfile khớp).
- Gate qua `xt.py loop record`: `npm audit --omit=dev && npm ls body-parser && npm run typecheck &&
npx vitest run apps/server` exit 0.
- Thử trực tiếp Express với `express.json`: JSON thường 200, gzip 200, JSON sai 400.
