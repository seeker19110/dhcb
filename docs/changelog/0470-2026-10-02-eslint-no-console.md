# 0470 — Luật ESLint `no-console` cho mã chạy trong trình duyệt (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** (điền khi tạo PR) · **Loại:** `chore(lint)`.
- **Nền:** đề xuất 3 ở mục 6 của
  [`docs/research/ecc-everything-claude-code.md`](../research/ecc-everything-claude-code.md)
  (ADR-0013) — thay cho hook "cảnh báo console.log" của ECC bằng một cổng lint chặn CI. PR RIÊNG
  vì đổi luật lint (luật ghi ở đầu `eslint.config.js`).

## Việc đã làm

- `eslint.config.js`: khối mới cho `apps/dhcb/src/**/*.{ts,tsx}` + `apps/hub/src/**/*.{ts,tsx}`
  (trừ `*.test.ts(x)`): `no-console: ['error', { allow: ['warn', 'error'] }]`. Server, `packages/`,
  `scripts/` không áp — log ở đó vào PM2/stdout là có chủ đích.
- CLAUDE.md mục 8: câu "xóa `console.log` debug" nay ghi rõ đã có lint chặn ở frontend.

## Phát hiện kèm theo (ghi nợ 🔴 trong `PROGRESS.md`)

Khi rà skill `stem-science-reasoning-master` để chuẩn bị đề xuất 1: STEM Scratchpad (Companion ›
Labs) chấm MỌI bước giải là "đúng" — `StemScratchpadService.validateStep` chỉ nhận ra hai câu gán
cứng và lỗi lệch ngoặc, còn lại luôn `isValid: true`. Chờ chủ dự án chọn ẩn tính năng hay làm
bộ kiểm thật. Cùng `PROGRESS.md`: đánh dấu đề xuất 3 của đợt 2 đã xong.

## Bằng chứng

- Frontend hiện KHÔNG còn `console.log/info/debug…` nào (chỉ `console.warn` 27 + `console.error` 27) → luật khoá trạng thái tốt lại, không phải sửa code nào.
- File thử `apps/dhcb/src/lib/__noconsole_probe.ts` có `console.log` + `warn` + `error` → lint đỏ
  đúng một lỗi ở dòng `console.log` (đã xoá file thử).
- `eslint --print-config`: `apps/dhcb/src/lib/storage.ts` có luật; `apps/server/src/server.ts` và
  file `*.test.ts` không có.
- `npm run lint` toàn repo: exit 0.
- `eslint.config.js` là file cổng: hook `config-protection.sh` từ chối lần đầu, thử lại sau khi nêu
  lý do (thêm luật siết, không nới) thì qua.
