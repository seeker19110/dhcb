# Audit delta — 2026-10-24 (sau audit toàn diện 2026-10-20)

> Yêu cầu: `/autopilot hoàn thiện dự án`. Audit đầy đủ 11 tầng gần nhất:
> `docs/audit/2026-10-20-audit-toan-dien.md` @ `17ce6b0f` — mọi phát hiện đã sửa (W-001…W-004) trừ F-007
> (chỉ ghi nhận) và F-008 (việc tay). Lượt này chỉ kiểm phần đã đổi: 19 commit `17ce6b0f..570c230e`, ngoài
> tài liệu chủ yếu là nâng phụ thuộc (#1417 Express 5.3, #1425, #1429, #1435 body-parser) và cấu hình khung
> X-Templates (#1430, #1432). Quyết định phạm vi: D-007 (`docs/autopilot/DECISIONS.md`).

## Kết quả (đo trên cây của PR này, sau khi nâng `happy-dom`)

| Tầng                                   | Kết quả                                              | So với 2026-10-20             |
| -------------------------------------- | ---------------------------------------------------- | ----------------------------- |
| 1 — Build / Type / Lint / Format       | ✅ cả bốn exit 0, lint 0 cảnh báo                    | giữ nguyên                    |
| 1 — Size                               | ✅ JS 136,87 / 160 kB · CSS 23,76 / 26 kB (brotli)   | +0,21 kB · +0,02 kB           |
| 2 — `npm audit --omit=dev`             | ✅ 0 lỗ hổng (đã vá `body-parser` ở #1435)           | giữ 0                         |
| 2 — `npm audit` (cả dev)               | ✅ 0 lỗ hổng sau khi nâng `happy-dom` 20 → 21.0.4    | trước lượt này: 1 high        |
| 5 — Coverage (`npm run test:coverage`) | ✅ 96,08 / 92,05 / 96,97 / 96,79 % (sàn 94/90/94/94) | +0,07 / +0,16 / +0,05 / +0,06 |
| 3 — Chu trình import                   | ✅ 0 (`npm run maintain`)                            | giữ 0                         |

Bằng chứng máy: `.autopilot/evidence/T-001.json`, `T-002.json` (cục bộ), CI của PR.

## Phát hiện và xử lý

- **F-010 (đã sửa trong PR này):** `happy-dom` 17.0.0–21.0.3 dính GHSA-834v-8h66-3h79 (high — thực thi mã qua
  import alias chưa làm sạch). Chỉ là môi trường test của Vitest, không vào bản build production; vẫn sửa vì
  cây phụ thuộc phải sạch và bản vá có sẵn. Nâng lên `^21.0.4`; toàn bộ test unit xanh trên bản mới.

## Chưa kiểm được ở lượt này (giữ nguyên như 2026-10-20)

- Tầng 4 (eval AI) cần key thật; Tầng 8/9 (Lighthouse production, Sentry/PM2) cần quyền VPS — việc tay chủ
  dự án (F-008 vẫn mở).
- Tầng 8b (ảnh 1440/390): không có thay đổi giao diện trong 19 commit — không chụp.
- E2E chạy trên CI của PR (6 mảnh), không chạy lặp ở máy.

## Ghi nhận từ `npm run maintain` (không phải lỗi, không sửa)

- 3 file > 2 MB được theo dõi (`curriculum.json`, `sitemap-words.xml`, `cefrA1B2ExtraVocab.json`) — dữ liệu học, có chủ đích.
- 4 file trong `docs/goals/` nhắc BLOCKED — trạng thái goal chờ người, đã ghi trong từng goal.
- `.xtemplates/scripts/xt.py:199` bị bộ quét bí mật đánh dấu: dương tính giả (chuỗi thay thế của hàm che khoá, changelog `0658`).
