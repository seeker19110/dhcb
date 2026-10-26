# 0672 — 2026-10-26 — Ba API đọc body đúng hợp đồng `readJsonBody`

PR #1451. Đợt sửa audit thứ năm: đóng `AUD-CODE-001` (🟠).

## Vấn đề

`readJsonBody` trả `{ ok: true, raw } | { ok: false, error }`, nhưng `personal/ambient-vision.ts`,
`personal/neuro-affective.ts` và `platform/a2a.ts` đọc thẳng các trường nghiệp vụ trên chính kết quả
đó (như thể nó là body). Hậu quả: Ambient luôn báo thiếu ảnh (và còn trừ lượt AI TRƯỚC khi đọc body),
Neuro bỏ qua `stressOverride`/`toggle_shield`, A2A luôn báo thiếu `message` — payload hợp lệ không
bao giờ tới service.

## Đã làm

- Cả ba handler theo đúng khuôn chung: `readJsonBody` → nhánh lỗi → `validateBody(<Zod schema>, raw)`
  → dùng `parsed.data`.
- Ambient: đọc + validate body (`AmbientVisionRequestSchema`) TRƯỚC `checkAndConsumeUsage` — body
  sai không còn tốn lượt.
- Neuro: schema `z.union` hai dạng `.strict()` — bật/tắt khiên (`toggle_shield`) hoặc đánh giá với
  `stressOverride` 0–100 tuỳ chọn.
- A2A: `z.object({ message: A2AMessageSchema }).strict()`.

## Kiểm chứng

- Đỏ-trước: 3 file test mới (parser thật, auth/service giả) — 8 ca ĐỎ trên mã cũ, 9/9 XANH sau sửa.
- `tsc -p tsconfig.api.json` và ESLint sạch; cổng pre-commit (build/typecheck/lint/format/test) đạt.

## Rủi ro và đường lùi

Body sai dạng nay nhận 400 thay vì lỗi nghiệp vụ mơ hồ; client hiện gửi đúng dạng nên không đổi hành
vi đúng. Không đổi schema CSDL. Đường lùi: revert PR.
