# 0677 — 2026-10-27 — Nâng `@anthropic-ai/sdk` 0.137 → 1.3.0 (kèm eval thật trên VPS)

PR #1457. Trả nợ ghi ở `0665`.

## Bối cảnh: sự cố key Anthropic (2026-10-27)

Khi chủ dự án chạy eval trên VPS, MỌI lời gọi Claude (cả SDK 0.137 đang chạy production lẫn SDK 1.3.0)
trả `403 permission_error: "The account linked to this API key does not have permission for this
endpoint."` — kể cả `GET /v1/models` bằng `curl`, nên lỗi ở key/tài khoản, không phải code. Production đọc key
từ `.env` (PM2 không giữ bản riêng). Hệ quả trong lúc hỏng (đo bằng eval): Bạn Đồng Hành `api_error`
16/16; bộ phân loại khủng hoảng chỉ còn tầng từ khoá (bỏ sót 4/4 ca tăng dần); chat gia sư + phản hồi code
tự chuyển Groq/Gemini. Chủ dự án thay key trong `.env` + `pm2 reload all --update-env` ⇒ `/v1/models` trả
danh sách model. Một đoạn đầu của key mới lỡ dán vào shell/chat — đã khuyên thu hồi và tạo key khác.

## Đã làm

- `package.json`/lockfile: `@anthropic-ai/sdk` `^1.3.0`.
- Dò bằng fetch giả: SDK 1.3.0 luôn gửi `Authorization: Bearer`, `anthropic-version: 2026-10-21`, path
  `/v1/messages` (bỏ `?beta=true`).
- Bộ replay: `companionRuntimeConsent.ts` đòi đúng một kênh `Bearer <khoá tổng hợp>` (có `x-api-key` hay sai
  khoá vẫn đỏ); `providerReplay.ts` + `eval-companion-replay-fixtures.json` +
  `companionRuntimeConsentFixture.ts` đổi path/version; mã băm request tính lại SAU KHI xác minh body không
  đổi (mã băm theo path/version cũ khớp từng byte fixture cũ, 8/8 exchange gồm lượt 2 của ca công cụ).
- `anthropicClient.test.ts`: kiểm header `authorization: Bearer`, không có `x-api-key`.
- `.github/dependabot.yml`: bỏ mục chặn bản major SDK.

## Kiểm chứng

- API thật trên VPS (thư mục tạm, SDK 1.3.0): `eval:companion` 16/16, `eval:code-feedback` 8/8,
  `eval:tutor --limit 20` chấm đủ 20 câu.
- Đỏ-trước: 17 test replay đỏ sau khi nâng; sau sửa `scripts/` + `packages/core-ai` 2.031/2.031;
  `eval:companion:replay` 7/7; typecheck đạt.
- CHƯA chạy: `eval:action-canvas` với SDK mới — chạy trên VPS sau deploy.

## F-011 đo lại (cùng phiên, SDK 0.137, Haiku 5.5 effort low)

Bộ 62 câu × 3 lượt: Recall 99,2 % ± 1,3 · Precision 84,5 % ± 1,8 · **FP-rate 44,4 % ± 5,6** (correct 36,1 %,
edge 61,1 %). Bộ 180 câu: Recall 97,5 % · Precision 76,5 % · **FP-rate 60,0 %**. F-011 vẫn mở — cần sửa prompt
chấm; nguyên văn câu trả lời ở `/tmp/eval-tutor-62.jsonl` / `-180.jsonl` trên VPS.

## Rủi ro và đường lùi

Mọi lời gọi Claude production đi qua SDK mới; Groq/Gemini vẫn dự phòng cho chat. Đường lùi: revert PR.
