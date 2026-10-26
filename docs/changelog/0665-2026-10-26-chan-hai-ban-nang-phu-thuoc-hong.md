# 0665 — 2026-10-26 — Chặn hai bản nâng phụ thuộc làm hỏng build/AI (Dependabot #1438, #1439)

PR (điền khi mở). Rà các commit chưa merge: hai PR Dependabot đang mở đều đỏ. Tái hiện cả hai ở máy, tìm
ra gốc rễ, quyết định **chưa nhận** và chặn đúng hai bản đó ở `.github/dependabot.yml`.

## Phát hiện

| PR    | Bản nâng                                    | Cổng đỏ                                                                  | Gốc rễ (đã tái hiện)                                                                                                                                                                                                    |
| ----- | ------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #1438 | `linkedom` 0.18.13 → 0.18.14 (patch)        | Build + budget + boot, E2E shard 5/6                                     | 0.18.14 thay `cssom` bằng `@acemir/cssom@0.9.32`; trường `browser` của gói đó trỏ `build/CSSOM.js` (script gán biến toàn cục, không có export) ⇒ rolldown báo `MISSING_EXPORT "parse"` khi build worker `domRunner.ts`. |
| #1439 | `@anthropic-ai/sdk` 0.128.0 → 1.1.0 (major) | Unit (`companionRuntimeConsent.test.ts` 9 ca), `eval:companion:boundary` | SDK 1.0 chuyển **API version `2023-06-01` → `2026-10-21`** và gửi khoá qua `Authorization: Bearer` thay `x-api-key`. Harness replay cố ý từ chối `authorization` ⇒ bộ phân loại an toàn nhận "Connection error".        |

Lỗi job "SQL PREPARE trên Postgres thật" của #1439 không phải SQL: bước `eval:companion:boundary` chạy chung job
đỏ vì cùng gốc rễ Bearer.

## Quyết định (CLAUDE.md §12, tự duyệt)

- **linkedom:** giữ 0.18.13. Bản 0.18.14 chỉ đổi thư viện CSS, không vá bảo mật; alias bản CJS của
  `@acemir/cssom` là vá vòng lỗi thượng nguồn, thêm rủi ro bundle. Chặn **đúng** `0.18.14`; bản kế tiếp vẫn
  được Dependabot đề xuất và CI sẽ thử lại.
- **SDK 1.x:** chưa nâng. Đổi API version + cách xác thực là thay đổi hành vi tại biên provider, chỉ kiểm được
  bằng gọi API thật (eval có phí, CLAUDE.md §8/§12) — merge là tự deploy production. Chặn bản major; ghi nợ
  có kế hoạch ở `PROGRESS.md`.
- Đường lùi: xoá hai mục `ignore` trong `.github/dependabot.yml`.

## Kiểm chứng

- Tái hiện ở máy (sau `npm ci`): linkedom 0.18.14 ⇒ `npm run build` đỏ `MISSING_EXPORT`; SDK 1.1.0 ⇒
  `vitest run scripts/lib/companionRuntimeConsent.test.ts` 9 ca đỏ `REPLAY_INCOMPLETE`; dò request thật của
  SDK 1.1.0 thấy `anthropic-version: 2026-10-21` + `authorization: Bearer …`, không có `x-api-key`.
- Sửa kèm: changelog `0664` điền số PR #1437.
