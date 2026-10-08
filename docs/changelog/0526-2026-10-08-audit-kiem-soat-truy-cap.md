# 0526 — Audit kiểm soát truy cập toàn bộ route API: vá 4 lỗ hổng IDOR (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(security)`
- **Nguồn:** coordinator giao rà toàn bộ route/handler server về KIỂM SOÁT TRUY CẬP (CLAUDE.md mục
  4.2). Không làm lại phần đã vá ở `0464` (F01–F13) và `0465` (S1–S7: IP giả, rate limit, SSRF
  push, WebSocket Origin…). Song song có đợt khác sửa lỗi "im lặng" (catch rỗng, fail-open), nên
  đợt này KHÔNG đụng nhánh xử lý lỗi ngoài phạm vi kiểm quyền.

## Phạm vi đã rà

**113 route** gắn trong `apps/server/src/routes.ts` (112 `app.all` + `app.post` riêng cho
`/api/pronounce-assess`; `/api/stt`, `/api/vision-solve` nằm trong số đó) + `/api/health` ở
`server.ts`. Mỗi route: middleware auth → cách lọc chủ sở hữu → kết luận. Năm hạng mục:

| Hạng mục                                 | Cách rà                                                                                                                                                                                                                                                                                                              | Kết quả                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route cần đăng nhập thiếu `validateAuth` | Đối chiếu từng handler với `routes.ts` (script quét import → file → số lần gọi `validateAuth`/`resolveActor`/`isAdminUser`).                                                                                                                                                                                         | 0 lỗ. 7 route không đăng nhập đều có chủ ý (xem "Đã xét").                                                                                                                                                                                                                                                                            |
| IDOR (id lấy từ body/query/params)       | Liệt kê mọi `searchParams.get('…id…')` + id trong body; với mỗi id, đọc tới câu SQL / Map trong bộ nhớ xem có ràng buộc `user_id`/`person_id` không. Quét thêm mọi `where id = $n` thiếu `person_id`/`user_id` trong `packages/` + `apps/server/src` rồi đọc ngữ cảnh (khoá `for update` theo chủ trước khi update). | **4 lỗ** — 3 ở phiên lưu trong bộ nhớ (Map toàn cục), 1 tham chiếu chéo người dùng khi ghi (bảng dưới).                                                                                                                                                                                                                               |
| Route quản trị thiếu kiểm quyền admin    | 18 handler `admin-*` + `analytics-summary` + `health/deep` + `hub-stats`: kiểm `isAdminUser(auth.userId)` chạy TRƯỚC mọi nhánh method.                                                                                                                                                                               | 0 lỗ. `admin-feature-status` kiểm admin theo từng method (GET/POST) — mọi method khác trả 405.                                                                                                                                                                                                                                        |
| SQL ghép chuỗi                           | Script quét mọi template literal có từ khoá SQL + `${…}` (cả nhiều dòng) trong `apps/server/src` + `packages/`.                                                                                                                                                                                                      | 0 lỗ. Mọi `${…}` là hằng/whitelist nội bộ (`COLUMN[mode]`, `*_COLUMNS`, `$${params.length}`, tên bảng từ enum Zod).                                                                                                                                                                                                                   |
| Gọi AI không qua đếm lượt Free/VIP       | Tìm mọi module gọi nhà cung cấp AI (Groq/OpenAI/Anthropic/Gemini) rồi truy ngược handler dùng nó.                                                                                                                                                                                                                    | 0 lỗ. `/api/agent`, `/api/stt`, `/api/tts` (miss), `/api/pronounce-assess`, `/api/vision-solve`, `/api/ambient-vision`, `/api/companion`, `/api/programming/feedback`, `/api/debate-arena`, `/api/co-learning-audio` (gợi ý), `/api/gemini-live` đều qua `checkAndConsumeUsage`/`checkAndConsumeActorUsage`/`reserveGeminiLiveUsage`. |

## Lỗ hổng đã vá

| #   | File                                                                                                            | Đường tấn công                                                                                                                                                                                                                                                                                                                     | Mức                                                                                                                                                                                        | Cách sửa                                                                                                                                                                                                                      | Test (đỏ trước → xanh sau)                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `apps/server/src/api/platform/realtime-multimodal.ts`                                                           | (a) User B đăng nhập gửi `POST /api/realtime-multimodal` body `{"sessionId":"<id phiên của A>"}` → server dùng thẳng id client làm khoá Map → **ghi đè/chiếm phiên của A** (phiên cũ của A mồ côi, không đóng). (b) `GET`/`DELETE ?sessionId=<id của A>` không so chủ → B đọc `config` (gồm `personId` của A) và đóng phiên của A. | Trung bình                                                                                                                                                                                 | `sessionId` luôn do server sinh (bỏ giá trị client + ghi `logSecurityEvent`); `GET`/`DELETE` so `session.config.personId` với `auth.userId`, phiên của người khác trả CÙNG 404 như phiên không có (khuôn `/api/gemini-live`). | `realtime-multimodal.test.ts` — 3 ca "kiểm soát truy cập theo chủ phiên": 3 đỏ trên mã cũ → xanh.                                                                                                           |
| A2  | `apps/server/src/api/learning/scenario-holodeck.ts`                                                             | User B gửi `GET ?sessionId=<id của A>` → đọc toàn bộ hội thoại phỏng vấn/thuyết trình của A; `POST {action:"turn", sessionId}` → chèn lời vào phiên A; `POST {action:"finalize"}` → kết thúc phiên A.                                                                                                                              | Trung bình                                                                                                                                                                                 | Hàm `getOwnedSession(sessionId, person.id)` trong handler; GET/turn/finalize đều qua nó, không phải chủ → 404.                                                                                                                | `scenario-holodeck.test.ts` — 3 ca "user B không đọc/ghi/kết thúc…": 3 đỏ → xanh.                                                                                                                           |
| A3  | `apps/server/src/api/learning/socratic-diagnostics.ts` + `packages/core-personal/socraticDiagnosticsService.ts` | User B gửi `POST {action:"reflect", sessionId:<id của A>, answer}` → ghi câu trả lời vào phiên của A và nhận lại `updatedRecord` chứa **mọi câu trả lời trước đó của A**.                                                                                                                                                          | Trung bình                                                                                                                                                                                 | Thêm `getSocraticSession()` (chỉ đọc) vào service; handler so `personId` trước khi `submitSocraticReflection`, phiên không có/không phải chủ → 404.                                                                           | `socratic-diagnostics.test.ts` — ca "user B gửi reflect vào phiên của user A" + ca "sessionId không tồn tại → 404": đỏ → xanh.                                                                              |
| A4  | `packages/core-domains/workService.ts` (`/api/work`)                                                            | User B `POST /api/work {kind:"task"                                                                                                                                                                                                                                                                                                | "document", projectId:<UUID dự án của A>}` → task/tài liệu của B gắn vào dự án của A (khoá ngoại chỉ kiểm dự án TỒN TẠI, không kiểm CHỦ). Kèm oracle: 201 khi UUID có thật, 500 khi không. | Thấp                                                                                                                                                                                                                          | Câu insert thành `insert … select … where $3 is null or exists (select 1 from worklife.projects where id = $3 and person_id = $2)` — một câu, không race; không chèn được dòng nào → `NotFoundError` (404). | `workService.test.ts` — 2 ca "projectId phải thuộc chính người tạo": đỏ → xanh. Chạy thêm câu SQL thật trên PostgreSQL 16 (bảng tạm). |

Ghi chú mức độ: A1–A3 dùng id do server sinh bằng `randomUUID()` (không đoán được), nên khai thác
cần id bị lộ (log, ảnh chụp, chia sẻ link…). Vẫn vá vì đây đúng là thiếu kiểm chủ — vi phạm trực
tiếp CLAUDE.md mục 4.2, và nội dung phiên là dữ liệu cá nhân (câu trả lời phỏng vấn, suy nghĩ của
người học).

Không đổi schema/migration, không đổi hợp đồng API công khai (đường dẫn, method, dạng body thành
công giữ nguyên; chỉ thêm nhánh 404 cho truy cập không phải chủ). `/api/realtime-multimodal`,
`/api/scenario-holodeck`, `/api/socratic-diagnostics` hiện không có client nào trong `apps/dhcb`
gọi tới, nên không có luồng giao diện nào bị ảnh hưởng.

## Đã xét, an toàn

- **Route không đăng nhập có chủ ý (7):** `/api/app-settings`, `/api/plan-features`,
  `/api/plan-marketing`, `/api/plan-prices` (chỉ `GET`, dữ liệu bảng giá công khai);
  `/api/payment-webhook` (xác thực `Apikey` bằng `verifySepayApiKey` dùng `timingSafeEqual`);
  `/api/auth` (luồng đăng nhập); `/api/analytics` + `/api/hub-stats` (đăng nhập tuỳ chọn, số liệu
  thật chỉ trả khi `isAdminUser`). `/api/health/deep` chặn admin.
- **Dữ liệu cá nhân dạng bảng** (`persons`, `personal-facts`, `consents`, `personal-policies`,
  `life-graph`, `life-goals`, `memories`, `context-package`, `proposed-actions`, `decision-ledger`,
  `automation`, `work` đọc/sửa, `exam-plan`, `mistakes`, `history`, `progress`,
  `programming/*`, `learning/evidence`, `payment-status`, `payment-history`, `checkout`): mọi đọc
  lọc `user_id = auth.userId` hoặc `person_id = getOrCreatePerson(auth.userId).id`; mọi sửa/xoá
  khoá `select … where id = $1 and person_id = $2 for update` trước rồi mới `update … where id`.
  `life-graph` tạo cạnh kiểm cả hai node thuộc person. `history` upsert có `where user_id =
excluded.user_id` chống chiếm id của người khác.
- **Chat/bạn bè/vị trí/companion-link:** đọc tin cần là thành viên phòng; xoá tin `where id = $1
and sender_id = $2`; tạo phòng DM cần là bạn bè; vị trí: đọc/ghi qua `getActiveMembership`, sửa
  chuyến chỉ chủ chuyến; gỡ liên kết companion kiểm `learner_id`/`watcher_id`.
- **Trạng thái tính năng lưu theo user** (`pvp-arena`, `debate-arena`, `stem-scratchpad`,
  `memory-palace`, `metacognitive-reflection`, `mesh-telemetry`, `action-canvas`,
  `avatar-embodiment`, `neural-curriculum`): khoá theo `auth.userId` trong `platform.feature_state`,
  `personId` trong body bị ghi đè bằng id từ token → không có đường chạm dữ liệu người khác.
- **`gemini-live`:** đã so chủ phiên từ `0464` (F07).
- **`co-learning-audio`:** phòng học nhóm là sảnh công khai theo thiết kế (danh sách phòng + mã
  phòng trả cho mọi người dùng đã đăng nhập, ai cũng vào được); xin gợi ý AI yêu cầu là thành viên.
- **`workplace-insights`:** lỗi/thẻ lưu theo `person.id` trong Map, `convertMistakeToSrsCard` chỉ
  tìm trong danh sách của chính person.
- **`integrations`:** `syncToGoogleCalendar`/`exportToNotion` hiện là bản giả lập (không gọi API
  ngoài, không cầm token) — không có đường ghi vào tài khoản bên thứ ba của người khác.
- **`leaderboard`:** trả `userId` + biệt danh của người đã `league_opt_in` — có chủ ý.
- **`location` DELETE:** người không phải thành viên gọi được `broadcastToSession(member_left,
userId = chính họ)` tới một chuyến bất kỳ — không lộ/sửa dữ liệu ai (chỉ phát sự kiện mang id của
  chính người gọi), không tính là lỗ.
- **WebSocket** (`/ws/*`): đã rà ở `0465` (S6), không làm lại.

## Đề xuất cần chủ dự án quyết (KHÔNG sửa trong đợt này)

1. **`/api/realtime-multimodal` không có rate limit và không có trần số phiên.** Một tài khoản lặp
   `POST` tạo được vô hạn phiên trong Map bộ nhớ (mỗi phiên còn `session.start()`), tới lúc worker
   cạn RAM. Đề xuất: rate limit theo IP như các handler khác + trần N phiên/người (đóng phiên cũ
   khi tạo mới). Cùng khuôn với `scenario-holodeck`/`socratic-diagnostics` (Map không bao giờ dọn).
   Ba endpoint này không có client nào gọi — cân nhắc gỡ hẳn thay vì siết.
2. **`/api/pronunciation` (đường cache MISS gọi Google TTS) không trừ lượt Free/VIP**, chỉ rate
   limit 60 lần/phút/IP. Lời giải thích trong mã: audio tạo một lần rồi cache vĩnh viễn. Nhưng mỗi
   chuỗi ≤ 100 ký tự khác nhau là một lần trả tiền mới → một tài khoản Free có thể đốt ~86.000
   lượt TTS/ngày. Đề xuất: đếm lượt (hoặc trần theo user) cho riêng nhánh MISS, giống `/api/tts`.
3. **`/api/admin-feature-status` so `x-cron-key` bằng `===`** (không hằng thời gian). Đã có rate
   limit 20/phút/IP nên khó khai thác qua mạng; đề xuất dùng lại khuôn `cronSecretMatches()` của
   `push.ts` (SHA-256 + `timingSafeEqual`) cho đồng nhất. Không vá ở đây vì không có test đỏ được
   cho khác biệt thời gian.

## Bằng chứng

- Test đỏ trước khi vá (chạy `npx vitest run <file>` trên mã cũ):
  `realtime-multimodal.test.ts` 3 failed | 10 passed;
  `socratic-diagnostics.test.ts` + `scenario-holodeck.test.ts` 5 failed | 18 passed;
  `workService.test.ts` 2 failed | 21 passed. Sau vá: tất cả xanh.
- Câu SQL mới của A4 chạy thật trên PostgreSQL 16.15 (bảng tạm `pg_temp`, gọi đúng
  `createWorkTask`/`createWorkDocument`): A gắn dự án của mình → OK; không dự án → OK; B gắn dự
  án của A → `NotFoundError` (cả task lẫn tài liệu).
- Cổng: xem báo cáo cuối của đợt (typecheck sau khi xoá `dist`, lint, prettier, build,
  `test:coverage`).
