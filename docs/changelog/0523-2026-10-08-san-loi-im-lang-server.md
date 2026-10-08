# 0523 — Săn lỗi im lặng phía server: câu SQL sai cột bị catch nuốt, promise WebSocket trôi nổi, lỗi CSDL bị gắn nhãn 400 (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** _(chưa tạo — commit trên nhánh worktree, coordinator mở PR)_ ·
  **Loại:** `fix(server)`.
- **Nguồn:** việc giao từ coordinator: săn và sửa lỗi im lặng (silent failure) ở
  `apps/server/src/api/`, `apps/server/src/*.ts`, `packages/core-*` — catch rỗng, giá trị mặc định
  che lỗi thật, promise không await, `fetch` không kiểm `res.ok`, `safeParse` bỏ `.success`, rào an
  ninh/thanh toán fail-open.

## Cách rà

1. Grep mọi `catch` / `.catch(() => …)` / `safeParse` / `fetch(` trong phạm vi (bỏ test và dữ liệu
   nội dung), đọc từng chỗ theo đường đi thật từ request.
2. Chạy tạm luật `@typescript-eslint/no-floating-promises` + `no-misused-promises` (cấu hình tạm,
   KHÔNG commit) trên `tsconfig.api.json`: 0 promise trôi nổi không đánh dấu — nên rà tiếp các chỗ
   `void promise` đánh dấu tay.
3. **Đo câu SQL trên CSDL thật:** dựng Postgres 16 cục bộ, chạy `scripts/run-pg-migrations.ts`
   (schema + 90 migration), rồi `PREPARE` **387** câu SQL tĩnh trích từ mọi lời gọi `.query(` trong
   phạm vi. Mock `pg` trong unit test không bao giờ bắt được loại lỗi này. Kết quả trước khi sửa:
   **9 câu lỗi** — 4 câu trong phạm vi sửa (bảng dưới), 5 câu ở `personErasureService.ts` (đề xuất,
   không sửa — xem cuối file).

## Đã làm

| #   | File                                                                                                                                                                                                   | Đường đi gây hại (đã truy thật)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Cách sửa                                                                                                                                                                                                                                                        | Test (đỏ trước → xanh sau)                                                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `packages/core-chat/chatService.ts` (`getRoomMemberIds`)                                                                                                                                               | `user_id <> coalesce($2, '')`: Postgres suy `$2` là `text` → `operator does not exist: uuid <> text` ở **mọi** lần gọi (đo bằng PREPARE và bằng `pg` thật với cả `$2 = null` lẫn uuid). Hàm chỉ được WebSocket chat gọi (gửi tin / typing / đã đọc), nên tin nhắn ĐÃ LƯU nhưng không bao giờ phát real-time cho người nhận, không đẩy thông báo; lỗi bị nuốt ở #3.                                                                                                                                                                                                            | `($2::uuid is null or user_id <> $2::uuid)` — ép kiểu tường minh, giữ ngữ nghĩa "loại trừ người gửi nếu có".                                                                                                                                                    | `chatService.test.ts` canh hình dạng câu lệnh (mock pg không tái hiện được lỗi kiểu); bằng chứng CSDL thật ở mục "Bằng chứng".  |
| 2   | `packages/core-chat/chatPush.ts` (`notifyOfflinePeers`)                                                                                                                                                | Đọc `public.profiles.display_name` — cột **không tồn tại** → lỗi ở mọi lần gọi, `catch {}` rỗng nuốt → mọi thông báo đẩy tin nhắn ghi "Tin nhắn mới từ Bạn học", không một dòng log.                                                                                                                                                                                                                                                                                                                                                                                          | Đọc `profiles.name` (đúng nguồn màn chat đang dùng, `chatService.ts`), giữ fallback nhưng `console.warn` khi lỗi.                                                                                                                                               | `chatPush.test.ts`: mock giống Postgres thật (từ chối `display_name`) → tiêu đề phải mang tên thật; nhánh lỗi phải ghi log.     |
| 3   | `packages/core-chat/wsHandler.ts`                                                                                                                                                                      | `void handleClientMessage()` / `void handleConnection()` / `void handleDisconnect()` / `void notifyOfflinePeers()` không `.catch`. Repo **không có** handler `unhandledRejection` (grep cả `apps/server` lẫn `packages`), Sentry chỉ bật khi có `SENTRY_DSN` → một lần CSDL/Redis chập chờn (hoặc lỗi #1, xảy ra MỖI tin nhắn) là promise bị từ chối không ai bắt: Node mặc định **sập worker PM2** (mất mọi request đang chạy trên worker đó); người gửi không nhận phản hồi. Lỗi Redis lúc kết nối còn để socket mở mà chưa gắn listener `message` — socket "chết" im lặng. | Mỗi lời gọi nền có `.catch` → `console.error` có ngữ cảnh; lỗi xử lý sự kiện gửi `{type:'error', code:'SERVER_ERROR'}` cho người gửi; lỗi lúc kết nối → `ws.close(1011)` để client tự nối lại + dọn socket khỏi `localSockets` (listener `close` chưa kịp gắn). | `wsHandler.test.ts` 4 ca (gửi tin, kết nối, ngắt kết nối, thông báo đẩy). Bản cũ: 4 ca đỏ + Vitest báo "Unhandled Rejection".   |
| 4   | `packages/core-location/wsLocation.ts`                                                                                                                                                                 | Cùng khuôn #3: `void handleClientEvent()` gọi `getActiveMembership`/`recordPosition` (CSDL) → rejection trôi nổi, người dùng không biết vị trí chưa được ghi.                                                                                                                                                                                                                                                                                                                                                                                                                 | `.catch` → log + `{type:'error'}` cho client.                                                                                                                                                                                                                   | `wsLocation.test.ts`: CSDL lỗi → client nhận lỗi, có log, không rejection trôi nổi.                                             |
| 5   | `apps/server/src/api/platform/pvp-arena.ts`                                                                                                                                                            | `displayName()` join `profiles.user_id` và đọc `users.name` — **cả hai cột không tồn tại** (bảng `users` chỉ có `id, email, password_hash, email_verified, created_at`); `catch {}` nuốt → ai cũng là "Học viên". Cùng gốc: `realLeaderboard()` join `p.user_id` **không có catch** → `GET /api/pvp-arena` (mặc định) và `?action=leaderboard` luôn 500.                                                                                                                                                                                                                      | `select coalesce(p.nickname, p.name) from public.profiles p where p.id = $1`; leaderboard join `p.id = fs.user_id`. Giữ fallback "Học viên" nhưng ghi `console.warn`. Không đổi chính sách tên trên bảng xếp hạng (vẫn CHỈ biệt danh — quyết định 2026-10-02).  | `pvp-arena.test.ts`: mock pg từ chối `p.user_id`/`u.name` như Postgres thật; tên hồ sơ phải là tên thật; GET/leaderboard 200.   |
| 6   | `packages/core-http/http.ts` (mới `badJsonOrInternalError`) + `pvp-arena.ts`, `learning/debate-arena.ts`, `learning/stem-scratchpad.ts`, `platform/mesh-telemetry.ts`, `platform/avatar-embodiment.ts` | Khối `try` bọc CẢ `await req.json()` LẪN mọi thao tác CSDL; `catch` trả MỌI lỗi thành `400 "Invalid JSON payload"` kèm `details: String(err)`. CSDL rớt → client nhận "lỗi của bạn" kèm thông điệp nội bộ của `pg` (host/cổng DB…), server **không ghi log**, lỗi không tới `routes.ts`/Sentry. Debate-arena còn đi qua đếm lượt AI trong cùng khối.                                                                                                                                                                                                                          | Helper dùng chung: chỉ `SyntaxError` (đúng thứ `req.json()` ném) → 400 giữ nguyên hình dạng phản hồi cũ; lỗi khác → `internalErrorResponse` (500, log, không lộ chi tiết).                                                                                      | `http.test.ts` (SyntaxError thật từ `Request.json()` → 400; lỗi pg → 500 không lộ IP) + 1 ca 500 ở mỗi handler trong 5 handler. |

Không đổi API contract (hình dạng 400 cũ giữ nguyên; nhánh lỗi hạ tầng đổi từ 400 sai sang 500
đúng), không đổi schema, không migration.

## Đã xét, không sửa (kèm lý do)

- **Fail-open/fail-closed CÓ CHỦ Ý, có comment — giữ:** `core-billing/usage.ts` (đếm lượt AI
  fail-closed; `bumpUsageStat`/`refundUsage` fail-open có log); `core-auth/security.ts` (rate limit
  production từ chối khi Redis hỏng); `core-db/settings.ts` (`requireAvailable` ném lỗi cho đường đếm
  lượt, subject_limits mặc định ENFORCE); `core-http/mailQuota.ts` (DB lỗi → coi như chưa gửi thư —
  ghi nhận: đây là fail-open có chủ đích, chỉ ảnh hưởng hạn mức gửi mail); `core-billing/planFeatures.ts`
  (ma trận tính năng chỉ để hiển thị bảng giá, không gác quyền ở server); `prices.ts`,
  `pricePromo.ts`, `planMarketing.ts`, `founder.ts` (giá mặc định/không giảm giá, có log);
  `hub-stats.ts` (DB lỗi → coi như KHÔNG phải admin — fail-closed); `core/usage-summary.ts` (trả
  `null`, không bịa số); `progress.ts` (đọc gói lỗi → coi như Free, khoá chặt).
- **`billing/payment-webhook.ts`:** đã đúng — transaction gộp đánh dấu `paid` + cấp gói, chốt chống
  trùng `status='pending'`, `23505` → idempotent; mọi nhánh trả `success:true` theo đặc tả SePay.
- **`_lib/referral.ts` `rewardReferralIfEligible`:** nuốt lỗi nhưng có `console.error`, chạy trong
  transaction (không cấp nửa vời), và tự thử lại ở lần có bằng chứng học kế tiếp — chấp nhận được.
- **`fetch` ra ngoài:** mọi lời gọi AI/TTS/STT/Gemini đều kiểm `res.ok` hoặc qua `chatProviders`
  phân loại lỗi. `verifyFacebookAccessToken` không kiểm `res.ok` nhưng thất bại theo hướng ĐÓNG (trả
  `null` = từ chối đăng nhập) — không có hại.
- **`safeParse`:** mọi chỗ đã rà đều đọc `.success` hoặc `.data ?? mặc định` có chủ đích
  (`companionMessageService` mặc định `'sensitive'` = an toàn).
- **`learning/co-learning-audio.ts`, `personal/proactive-agent.ts`, `platform/realtime-multimodal.ts`:**
  cùng khuôn catch-all → 400 như #6, nhưng khối `try` chỉ chạm state trong bộ nhớ (không CSDL) và
  `requestAiSocraticHint` tự bắt lỗi + hoàn lượt; `realtime-multimodal` dùng `.parse` của Zod nên 400 là
  đúng. Không có đường lỗi hạ tầng bị gắn nhãn sai → không sửa.
- **`server.ts` các bộ hẹn giờ `void job().then().catch()`:** đều có `.catch` + Sentry — đúng.
- **`core-personal/automationService.ts:489`** (nuốt lỗi không phải `ValidationError` khi tra tool
  manifest): capability chưa đăng ký được kiểm regex ở bước tạo grant; executor mặc định là no-op —
  không có hại thực tế.
- **`programmingReadModelService`, `companionRuntime`, `contextEngine`** trả rỗng
  khi lỗi: ngữ cảnh Companion là tiện ích, comment ghi rõ chủ ý. Ghi nhận: không log — có thể bổ sung
  sau, không gây hại dữ liệu.
- **`chatPush.ts` vòng gửi (`catch { skipped++ }`)** và **`platform/gemini-live.ts` catch khởi động
  phiên** không log lỗi gốc: chỉ mất khả năng chẩn đoán, không sai dữ liệu — để đợt sau nếu cần.

## Đề xuất cần chủ dự án quyết (KHÔNG sửa trong đợt này)

1. **Xuất/xoá dữ liệu cá nhân (`/api/persons?action=export|full_erase`) hỏng hoàn toàn** —
   `packages/core-personal/personErasureService.ts` tham chiếu cột không tồn tại (đo bằng PREPARE):
   `life_graph_nodes.node_type` (thật là `type`), `life_graph_edges.source_node_id/target_node_id/edge_type`
   (thật là `from_node_id/to_node_id/relation`), `action_receipts.executed_at` (thật là `created_at`),
   `decision_records.title/decided_at` (thật là `problem`, không có `decided_at`). Hệ quả: `export`
   luôn 500; `full_erase` luôn rollback và 500 (câu xoá cạnh đồ thị lỗi) — người dùng **không xoá được
   dữ liệu**. Thêm một lỗi im lặng thật: truy vấn `decision_records` bọc `.catch(() => ({ rows: [] }))`,
   nên nếu các câu khác được sửa mà câu này chưa, bản xuất sẽ IM LẶNG báo "không có quyết định nào";
   `.catch(() => 0)` trong `erasePersonData` cũng vô tác dụng vì Postgres đã huỷ transaction. Giao
   diện hiện **không** gọi endpoint này (grep `apps/dhcb/src`). Không tự sửa vì: đụng XOÁ dữ liệu người
   dùng không hoàn tác được (CLAUDE.md §12) và phải đổi tên trường trong JSON xuất (hợp đồng API). Đề
   xuất: một đợt riêng, sửa cột + bỏ các `.catch` nuốt lỗi + test tích hợp trên Postgres thật.
2. **Cài `process.on('unhandledRejection')` ở `apps/server/src/server.ts`** (log + Sentry, không thoát
   tiến trình) làm lưới an toàn cuối: hiện một promise trôi nổi bất kỳ là sập worker khi chưa đặt
   `SENTRY_DSN`. Đổi hành vi toàn tiến trình nên cần chủ dự án chốt.
3. **Cổng SQL-trên-CSDL-thật trong CI:** công cụ PREPARE dùng ở đợt này (trích câu SQL tĩnh từ
   `.query(` rồi PREPARE trên Postgres đã migrate) bắt được 9 câu sai cột mà toàn bộ unit test (mock
   `pg`) không thấy. Đề xuất thêm job CI có dịch vụ Postgres chạy công cụ này — là thay đổi cổng CI
   (`.github/`), ngoài phạm vi đợt này.

## Bằng chứng

- **Đỏ trước khi sửa:** chạy test mới trên mã nguồn `HEAD` (đổi tạm 9 file nguồn về bản `HEAD`, giữ test
  mới): `Test Files 9 failed | 5 passed (14)`, `Tests 19 failed | 208 passed (227)`, `Errors 5 errors`
  (5 "Unhandled Rejection" từ đường WebSocket), `vitest-exit=1`. Sau khi khôi phục bản sửa: xanh.
- **CSDL thật (Postgres 16, schema + 90 migration):** PREPARE 387 câu SQL tĩnh — trước sửa `bad=9`,
  sau sửa `bad=5` (5 câu còn lại đều ở `personErasureService.ts`, đề xuất 1). Chạy câu cũ của
  `getRoomMemberIds` bằng `pg` thật: `operator does not exist: uuid <> text` với cả `$2 = null` lẫn uuid.
- Cổng ở máy: `rm -rf packages/*/dist dist dist-server && npm run typecheck` → 0; `npm run lint`
  → 0; `npx prettier --check` (21 file đổi) → 0; `npm run build` → 0. `npm run test:coverage` → 1
  ở cả hai lần chạy, CHỈ vì timeout (khuôn `TRAPS.md` §7) ở các file KHÔNG đụng tới, mỗi lần một
  tập khác nhau (lần 2: 5/18878 test ở `scanGraph`, `no-control-chars`, `seed-all`, `tsPrelude`,
  `StemLessonRetry`, `StemLessonTrongBai`) trong khi máy chạy song song vitest của các worktree
  khác (load average ~19). Chạy lại riêng 6 file đó: 54/54 xanh; 19 file test chạm đợt này:
  262/262 xanh, không "Unhandled Rejection". Không có ngưỡng coverage nào báo hụt. CI là nơi chốt.
