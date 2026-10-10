# 0581 — Đợt E1 audit: server hết nuốt lỗi im lặng, thêm timeout Postgres

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `fix(server)`
- **Nguồn:** báo cáo `docs/audit/2026-10-10-audit-toan-dien-va-toi-uu.md` mục E1 (mục 1–8). Người
  dùng yêu cầu "làm tiếp đợt E1". Không có migration.

## Vấn đề

Rà sâu ở đợt 0580 thấy nhiều nhánh lỗi phía server **không để lại dấu vết** hoặc **báo sai cho
người dùng**: Companion nuốt lỗi cả ba nhà cung cấp AI rồi trả câu mẫu với HTTP 200 mà vẫn trừ
lượt; pool Postgres không có timeout nào; CSDL chập chờn làm mọi người bị đăng xuất (401); cầu dao
AI khẩn cấp không có hiệu lực ngay; trang admin có thể ghi đè cầu dao đang BẬT thành TẮT khi CSDL
lỗi; lỗi gửi push và lỗi của tám handler biến mất; bốn chỗ trả nguyên thông điệp lỗi nội bộ cho client.

## Đã làm

1. **Companion** (`packages/core-personal/companionRuntime.ts`, `apps/server/src/api/personal/companion.ts`):
   log từng nhà cung cấp lỗi (`console.warn`), cả ba lỗi thì `console.error`; câu trả lời mẫu nay
   gắn cờ `isFallback` + ghi chú cho người dùng "AI tạm gián đoạn, lượt này không bị tính", và
   handler **hoàn lượt** (cả luồng thường lẫn stream; stream có chốt `refundOnce` để không hoàn hai
   lần). Lỗi stream không còn gửi `err.message` cho client. Hàm mô tả lỗi provider dùng chung
   tách sang `packages/core-ai/providerFailure.ts`.
2. **Pool Postgres** (`packages/core-db/pgPool.ts#poolTimeoutsFromEnv`): `connectionTimeoutMillis`
   10s, `statement_timeout` 60s, `idle_in_transaction_session_timeout` 60s; chỉnh qua
   `PG_CONNECT_TIMEOUT_MS` / `PG_STATEMENT_TIMEOUT_MS` / `PG_IDLE_IN_TRANSACTION_TIMEOUT_MS`
   (0 = tắt; giá trị hỏng → mặc định, không tắt nhầm). Migration dùng `Client` riêng nên không
   chịu ngưỡng.
3. **`chatFallback.ts`**: log từng nhánh Anthropic/Groq/Gemini lỗi hoặc trả rỗng.
4. **Tám handler** (`scenario-holodeck`, `socratic-diagnostics`, `workplace-insights`,
   `neuro-affective`, `subconscious`, `a2a`, `neural-curriculum`, `cefr-assessment`): thêm
   `logInternalError` (hàm mới ở `packages/core-http/http.ts`, `internalErrorResponse` dùng lại nó).
   Giữ nguyên mã trạng thái và câu báo tiếng Việt cho client.
5. **`validateAuth`** (`packages/core-auth/security.ts`): CSDL lỗi → log + ném
   `ServiceUnavailableError` (503, `service_unavailable`, lớp mới ở `core-errors`) thay vì trả
   `null` (401). Adapter `wrapEdge` (`apps/server/src/routes.ts`) nay trả đúng mã của mọi `AppError`
   lọt ra khỏi handler (body `{error, code}` như nhánh 403 sẵn có); AppError 4xx không đẩy Sentry.
6. **Cầu dao AI** (`admin-system-control.ts`): kiểm `rowCount === 1` (không có hàng → 500, không
   báo "đã kích hoạt") rồi `invalidateSettingsCache()`.
7. **Cấu hình admin** (`admin-settings.ts`): đọc với `requireAvailable: true` (CSDL lỗi → 500, không
   trả bản mặc định); giữ nguyên cầu dao/bảng xếp hạng khi client không gửi bằng `coalesce` NGAY
   TRONG SQL thay vì đọc cache 30s rồi ghi lại; kiểm `rowCount`.
8. **Push**: `sendReminders` trả thêm `failed`, log mã HTTP lỗi (không log endpoint); `chatPush`
   log tương tự. **STT / chấm phát âm / phát âm**: thông điệp provider chỉ ghi ở server, client
   nhận câu chung (`pronounce-assess` vẫn giữ `fallback: true`).

## Quyết định

- **Ngưỡng timeout chọn RỘNG** (request web thật < 1s) để không cắt nhầm job dọn dữ liệu hằng ngày
  (`sync_receipts`, sổ chống lạm dụng, vị trí "Đi chung"). Đã kiểm: migration dùng `Client` riêng;
  `seed:all` dùng chung pool nên ghi chú cách tắt (`PG_STATEMENT_TIMEOUT_MS=0`) trong `.env.example`.
- **Bẫy PgBouncer (kế hoạch GĐ2):** `pg` gửi `statement_timeout` trong gói khởi tạo kết nối, PgBouncer
  mặc định từ chối tham số lạ ⇒ app không kết nối được. Đã thêm `ignore_startup_parameters` + hướng
  dẫn `ALTER ROLE … SET statement_timeout` vào `postgres/pgbouncer.ini.example`.
- **Giới hạn đã biết:** `invalidateSettingsCache()` chỉ xoá cache của tiến trình nhận request; các
  tiến trình PM2 khác vẫn có thể dùng giá trị cũ tối đa 30s (đã ghi chú trong code). Muốn tức thời
  phải phát tín hiệu qua Redis — chưa làm, không cần migration nhưng là thay đổi kiến trúc.
- `validateAuth` đổi hành vi có chủ đích (test cũ "DB lỗi → null" đã sửa, có chú thích). Mọi nơi gọi
  ngoài HTTP (WebSocket chat, vị trí, Gemini Live) đã có `.catch` → đóng socket / 503.
- Mục 9 (mức thấp) để đợt sau.

## Bằng chứng kiểm chứng

| Cổng                                   | Kết quả                                                             |
| -------------------------------------- | ------------------------------------------------------------------- |
| Typecheck (checkout sạch, đã xoá dist) | ✅                                                                  |
| Lint (0 cảnh báo) / Format             | ✅ / ✅                                                             |
| test:coverage                          | 890 file, 20504 test ✅ · 96,02/91,93/96,74/96,68 (sàn 94/90/94/94) |
| Build (app + server + hub)             | ✅                                                                  |
| size-limit                             | JS 134,39/160 kB · CSS 24,57/26 kB (không đổi)                      |
| Boot `node dist-server/server.js`      | `/api/health` 200                                                   |
| `check:specs`                          | ✅                                                                  |

Test mới/sửa: `companionRuntime.test.ts` (cả 3 provider lỗi → `isFallback` + log),
`companion.test.ts` (hoàn lượt đúng 1 lần ở cả hai luồng, stream không lộ lỗi), `pgPool.test.ts`
(9 ca), `admin-settings.test.ts` + `admin-system-control.test.ts` (coalesce, `requireAvailable`,
`rowCount`), `security.test.ts` (503), `routes.csrf.test.ts` (adapter trả đúng mã AppError), `push`
/ `chatPush` (đếm + log lỗi), `stt` / `pronounce-assess` / `pronunciation` / `cefr-assessment`
(không lộ thông điệp, có log). Câu `coalesce($4::boolean, …)` sẽ được job CI `sql-prepare`
`PREPARE` trên schema thật.
