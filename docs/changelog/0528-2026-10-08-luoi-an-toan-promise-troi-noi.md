# 0528 — Lưới an toàn cuối cho promise trôi nổi và lỗi không bắt được ở server (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(server)`
- **Nguồn:** chủ dự án duyệt 2026-10-08. Bối cảnh: `0523` vừa sửa các `void promise()` thiếu
  `.catch` ở WebSocket; repo chưa có handler cấp tiến trình nên Node mặc định sập worker khi còn
  một promise trôi nổi sót lại.

## Đã làm

- **Module mới** `apps/server/src/processSafetyNet.ts` — `installProcessSafetyNet({ logger,
captureException, flush, exit })`, nhận phụ thuộc qua tham số để test được; idempotent (gọi
  lần hai trả lại đúng hàm gỡ cũ, không đăng ký thêm listener).
- **`apps/server/src/server.ts`** gọi nó MỘT lần ngay sau `initSentryServer()`
  (`logger` = `console.error` → log PM2, `captureException` = `captureServerException`,
  `exit` = `process.exit`).
- **`apps/server/src/api/_lib/sentry.ts`** — thêm `flushServerSentry(timeoutMs)` (true ngay khi
  chưa bật Sentry) và lọc hai integration mặc định `OnUncaughtException`/`OnUnhandledRejection`
  của SDK khỏi `Sentry.init` (xem quyết định 3).
- **Test** `apps/server/src/processSafetyNet.test.ts` (7 ca, dọn listener sau mỗi ca).

## Quyết định thiết kế và lý do

1. **`unhandledRejection`: log (kèm stack) + Sentry, KHÔNG thoát.** Chủ ý: một promise lỗi chỉ
   hỏng đúng việc nó làm; giết tiến trình sẽ cắt mọi WebSocket đang mở trên worker đó (chat,
   Gemini Live, vị trí). Đổi lại, lỗi vẫn hiện ở log + Sentry để được sửa tận gốc.
2. **`uncaughtException`: log + capture + flush Sentry (tối đa 2 giây) rồi `exit(1)`.** Trạng
   thái tiến trình có thể đã hỏng, nên để PM2 (cluster, `instances: 'max'`) khởi động lại sạch;
   các instance còn lại vẫn phục vụ. Lỗi thứ hai trong lúc đang flush thì thoát ngay, không chờ;
   flush/log/capture hỏng cũng không chặn `exit(1)`.
3. **Không đăng ký trùng với Sentry SDK.** Đọc mã `@sentry/node` 11.4.0 (lock): khi có DSN, SDK
   tự đăng ký cả hai handler qua default integrations — `OnUnhandledRejection` (mode `warn`:
   capture + in cảnh báo, không thoát) và `OnUncaughtException` (chỉ `logAndExitProcess` khi
   KHÔNG có listener nào khác). Nếu để nguyên thì (a) sự kiện bị gửi hai lần, (b) listener của ta
   khiến SDK không còn tự thoát, và (c) khi KHÔNG có DSN thì chẳng có handler nào. Vì vậy
   `initSentryServer` lọc hai integration đó đi và `processSafetyNet` là chủ duy nhất — hành vi
   như nhau có/không DSN, `captureServerException` tự no-op khi Sentry tắt.
4. **Log chỉ ghi lỗi** (message + stack qua `console.error`), không ghi `process.env`, token hay
   body request.

## Bằng chứng

- `npx vitest run apps/server/src/processSafetyNet.test.ts` — 7/7 xanh (unhandledRejection không
  exit; uncaughtException flush rồi exit(1); flush lỗi vẫn exit; lỗi thứ hai thoát ngay;
  idempotent; gỡ listener).
- `rm -rf packages/*/dist dist dist-server && npm run typecheck` exit 0; `npm run lint` exit 0
  (0 cảnh báo); `prettier --check` file đã đổi sạch; `npm run build` exit 0.
- Boot check `node dist-server/server.js` (PORT riêng): `/api/health` trả `{"status":"ok",...}` cả
  khi không có `SENTRY_DSN` lẫn khi có DSN giả.
- `npm run test:coverage`: 810 file xanh, 18878 test xanh; 1 test đỏ do timeout 5 giây ở
  `packages/subject-programming/tsPrelude.test.ts` (máy tải ~14, nhiều agent chạy song song) —
  file không đụng tới; chạy lại riêng 4/4 xanh.
