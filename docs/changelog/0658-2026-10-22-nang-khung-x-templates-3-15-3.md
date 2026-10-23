# 0658 — 2026-10-22 — Nâng khung X-Templates 2.0.0 → 3.15.3 (không cài harness)

PR (điền khi mở). Chạy `install.py --no-harness .` từ `seeker19110/x-templates` main `1023a46`
(bản 3.15.3) theo yêu cầu chủ dự án ("không cài đè", chọn phương án A).

## Đã làm

- `.xtemplates/` thay toàn bộ bằng bản 3.15.3 (bản sao chỉ-đọc của khung, ~4 MB).
- `xt.yaml`: trình cài nối khoá mới dạng chú thích; bật `format_check: npm run format:check` và
  `coverage: npm run test:coverage` (changelog khung 3.0.0: dự án M/L phải khai trước `loop verify`).
- `eslint.config.js`: thêm `.xtemplates/**` vào `ignores` — hai file JS vendor của khung
  (`verify-render.mjs`, `scripts/app/app.js`) có biến không dùng; không sửa mã vendor vì lần cài
  sau sẽ bị thay; `.prettierignore` đã bỏ qua thư mục này từ trước. Không nới luật nào cho mã DHCB.
- Bỏ ba file `*.xtemplates-new` (`AGENTS.md`, `CLAUDE.md`, `xt.yaml`): mẫu AGENTS/CLAUDE mô tả
  harness `guard.py` + `allow: Bash` không được cài, gộp vào sẽ mâu thuẫn luật riêng của DHCB;
  manifest đã ghi hash mẫu nên lần cài sau không tạo lại khi mẫu không đổi.

## Quyết định

- **Không cài harness** (`.claude/` không đổi): bản mặc định sẽ gộp vào `settings.json` hook mới
  và quyền `allow: Bash` — nới quyền và đổi cổng, chủ dự án chọn không làm.
- `xt.py doctor` sau cài báo 1 ✗ + 4 ⚠ đúng như hệ quả của lựa chọn trên: guard khung chưa có,
  thiếu hook `TaskCompleted`/`SubagentStop`, thiếu skill `autopilot`/`audit`/`blueprint`/
  `research`/`handover` (vì vậy `/autopilot` không có trong phiên), `PROGRESS.md` 224 KB > 8 KB.
  Ghi nhận, không sửa trong đợt này.

## Kiểm chứng

- `npm run lint` 0 · `npm run typecheck` 0 · `npm run format:check` 0 · `npm run check:docs` 0 ·
  `scripts/agent-config-security.test.ts` 42/42 · `git diff --check` sạch.
- Không đường dẫn `.xtemplates/…` nào được nhắc ngoài thư mục bị gãy (quét md/sh/ts/json/yml).
