# 0669 — 2026-10-26 — Cầu dao AI chặn cả khách (chat/STT)

PR (điền khi mở). Đợt sửa audit thứ hai: đóng `AUD-CFG-001` (🔴) trong `docs/ops/AUDIT-STATUS.md`.

## Vấn đề

Cầu dao AI (admin bật ở `/admin` khi chi phí bất thường) chỉ được kiểm trong
`checkAndConsumeUsage` — tức nhánh TÀI KHOẢN. Khách vãng lai đi qua `checkAndConsumeActorUsage` →
`checkAndConsumeGuestTrial`, không kiểm cầu dao, nên `/api/agent` (chat) và `/api/stt` của khách vẫn
gọi provider khi cầu dao đã bật. (TTS của khách đã có kiểm riêng.)

## Đã làm

- `packages/core-billing/usage.ts`: tách `checkAiCircuitBreaker()` (export) — FAIL-CLOSED khi không đọc
  được cấu hình, dùng chung lời nhắn bảo trì.
- `packages/core-auth/actorUsage.ts`: nhánh khách gọi `checkAiCircuitBreaker()` TRƯỚC khi trừ lượt dùng
  thử (không đốt lượt oan); bị chặn vì bảo trì trả `guestTrialExhausted: false` (không mời đăng ký).
- Rà mọi điểm gọi provider: các đường còn lại chỉ dành cho tài khoản (đi qua `checkAndConsumeUsage`, đã
  kiểm cầu dao); TTS khách giữ kiểm riêng (đổi sang helper sẽ đổi mã 503 mà client đang dựa vào — không
  đáng trong PR này).

## Kiểm chứng

- Đỏ-trước: 2 ca mới ở `packages/core-auth/actorUsage.test.ts` đỏ trên mã cũ, xanh sau sửa; 3 ca
  `checkAiCircuitBreaker` ở `packages/core-billing/usage.test.ts` (tắt / bật / lỗi cấu hình → chặn).
- Bộ tái hiện audit `breaker.mts.txt` (pool + fetch giả, không I/O thật): `main` exit 1 (khách STT/chat
  200, 2 lần gọi provider giả); bản sửa exit 0 (khách 429/429, 0 lần gọi provider); đối chứng giữ nguyên
  (401 thiếu danh tính, 429 tài khoản, 200 khách khi cầu dao tắt).
- `vitest packages/core-ai apps/server/src`: 2.781 đạt / 15 bỏ qua sẵn có.

## Rủi ro và đường lùi

Khi cầu dao bật, khách nhận 429 kèm lời nhắn bảo trì thay vì dùng được — đúng ý đồ. Thêm một lần đọc
`app_settings` cho khách (đã cache 30 s). Đường lùi: revert PR.
