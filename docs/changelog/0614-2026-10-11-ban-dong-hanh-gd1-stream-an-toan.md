# 0614 — Bạn Đồng Hành GĐ1: stream thật · nhớ đúng lượt mới · prompt mới · lớp an toàn

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `feat(companion)`
- **Đặc tả:** `docs/specs/2026-10-11-ban-dong-hanh-gd1-stream-an-toan.md` (Approved for
  implementation). **Nghiên cứu:** `docs/research/nang-cap-ban-dong-hanh-2026-10-11.md`.
- **Nguồn việc:** yêu cầu chủ dự án "nghiên cứu các repo GitHub và AI agent nổi tiếng, nâng cấp
  Bạn Đồng Hành toàn diện" → chốt kế hoạch 4 giai đoạn, đây là GĐ1 (không đổi CSDL).

## Vấn đề (đo trong mã trước đợt này)

1. "Stream" giả: server chờ AI viết xong cả câu rồi mới cắt từng từ phát đi.
2. Hết ngân sách ngữ cảnh (2000 token) là mất chính **lượt vừa nói** (lịch sử gói cũ → mới, dừng ở
   mục đầu không vừa) — Companion "quên" câu người dùng vừa hỏi.
3. Prompt kể 5 lĩnh vực gồm 3 trụ đã xoá 2026-09-20; không có ngày giờ; không theo nhóm tuổi; dữ
   liệu người dùng (ghi chú, ký ức) đưa vào prompt dạng chữ trần (chèn lệnh được).
4. Không có lớp an toàn: người dùng nhỏ tuổi nói về tự hại / bị bạo hành → AI trả lời như lượt
   thường, còn có thể đề xuất "lưu ký ức" chính câu đó.

## Đã làm

- **Stream thật** — `callAnthropicText({ onTextDelta })` đi `beta.messages.stream`, phát từng
  `text_delta`, kết quả cuối từ `finalMessage()` (usage/stop_reason) nên nhánh đọc kết quả dùng
  chung với đường không stream. `streamCompanionTurn` tách ba chặng (`prepareCompanionTurn` →
  `synthesizePreparedReply` → `finalizeCompanionTurn`), chữ đi qua hàng đợi `AsyncQueue` và
  `QuestionFenceGuard` (giữ khối ` ```dhcb-questions ` khỏi stream, kể cả khi tên khối tới
  theo mẩu "``" + "`dh" + "cb-questions"). Dự phòng Groq/Gemini, câu cố định, hoặc Claude rớt giữa
chừng → `streamed: false`→ phát theo từng từ từ bản đầy đủ (hành vi cũ). SSE thêm`X-Accel-Buffering: no` (Nginx không gom đệm).
- **Lịch sử giữ lượt mới nhất** — `contextEngine` gói lịch sử theo thứ tự mới → cũ, trả cho LLM
  cũ → mới (`restoreHistoryOrder`). Ngân sách mặc định Companion 2000 → 4000
  (`COMPANION_DEFAULT_TOKEN_BUDGET`; ≈ 0,8¢ token vào/lượt ở Sonnet khi không trúng cache).
- **Prompt mới** `packages/core-personal/companionPrompt.ts` (golden snapshot): 2 trụ Học tập ·
  Ghi chú; "BÂY GIỜ LÀ: Chủ Nhật, 11/10/2026, 14:05 (giờ Việt Nam)"; khối theo nhóm tuổi
  (`profiles.age_group` join từ `personal.persons`, một câu SQL thay câu `select user_id` cũ);
  Socratic; chống xu nịnh (mục tiêu phi thực tế nói thẳng); không nhận có cảm xúc, nói rõ là AI;
  kinh tế ngôn từ, không emoji ở chủ đề nghiêm trọng; không nói "đã lưu" khi không có tác vụ; dữ
  liệu người dùng bọc `<du_lieu_<nonce> nguon="…">` + tuyên bố là DỮ LIỆU, thẻ đóng giả bị tước
  (spotlighting, Microsoft 2024).
- **Lớp an toàn** `packages/core-personal/safetyGuard.ts` + hợp đồng
  `packages/core-contracts/companionSafety.ts`: tầng từ khoá (có dấu; không dấu chỉ cụm không nhập
  nhằng — "tu tu" có thể là "từ từ"; tiếng Anh; "bị đánh giá" không phải bị đánh) + tầng Haiku
  (route mới `safety`: fast, effort low, 1024 token, 8 s; JSON Schema chặt; nhận ≤ 3 lượt người
  dùng gần đây đã qua consent). Mức cao hơn thắng; Haiku hỏng → về từ khoá (fail-safe).
  - `concern`: không lập kế hoạch tác vụ (không "ghi nhớ"/"cập nhật hồ sơ"), prompt có lời dặn an
    toàn theo loại, bỏ câu hỏi tick, transcript ≥ `sensitive`, trả thẻ 111/115/Ngày Mai.
  - `imminent`: câu cố định `IMMINENT_SAFETY_REPLY` do người viết (không gọi LLM), KHÔNG lưu
    transcript, handler HOÀN lượt, sự kiện SSE `safety` đi trước chữ.
  - Client: `CrisisSupportCard` (3 số `tel:`, `min-h-11`, nói rõ "là AI và không thể gọi thay
    bạn"), nối qua `companionApi.onSafety` và `done.safety`.
- Số điện thoại đã kiểm nguồn 2026-10-11: 111 (tongdai111.vn, 24/7, miễn phí), 115, Ngày Mai
  096 306 1414 (giờ giới hạn ~13:00–20:30 Thứ Tư–CN theo befrienders.org — ghi chú nói rõ).

## Quyết định

- Classifier chạy MỖI lượt (chủ dự án chọn), tuần tự sau khi dựng ngữ cảnh để thấy lượt gần đây;
  ~+0,5–1 s/lượt, chi phí Haiku không đáng kể. Từ khoá bắt mà Haiku nói `none` vẫn giữ `concern`
  (hỏi "suicide nghĩa là gì" sẽ thấy thẻ một lần — chấp nhận, an toàn hơn bỏ sót).
- `imminent` không lưu transcript: lời tâm sự lúc nguy cấp không nằm lại trong CSDL.
- `aiConfig.ts` chỉ THÊM route `safety`; không đổi model/effort route nào đang có → không chạy
  `eval:tutor` (prompt môn Anh không đổi).

## Bằng chứng

- `npx vitest run packages/core-ai/anthropicClient.test.ts` → 26 passed (4 ca stream mới).
- `npx vitest run packages/core-personal/companionRuntime.test.ts packages/core-personal/companionStream.test.ts` → 68 passed.
- `npx vitest run packages/core-personal/safetyGuard.test.ts` → 29 passed;
  `companionPrompt.test.ts` → 11 passed (2 snapshot); `contextEngine.test.ts` → 26 passed.
- `apps/server/src/api/personal/companion.test.ts` → 24 passed; client
  (`CompanionStudios`, `pages/companion`, `companionApi.test.ts`) → xanh.
- Cổng đầy đủ: xem mô tả PR (typecheck · lint 0 cảnh báo · format · test:coverage · build ·
  check:specs).
- Hỏng có chủ đích: bỏ `[...history].reverse()` ở contextEngine → 1 test đỏ ("giữ hai lượt MỚI
  nhất"); bỏ nhánh `safety.level === 'none' ? generatePlan : []` → test "concern: KHÔNG lập kế
  hoạch" đỏ; trả lại → xanh.

## Chưa làm / tiếp theo

- GĐ2 (trí nhớ thông minh, có migration), GĐ3 (tác tử dùng công cụ thật), GĐ4 (bản tin chủ động) —
  kế hoạch ở mục 3 của tài liệu nghiên cứu; mỗi GĐ một đặc tả + PR, chờ chủ dự án duyệt.
- Việc tay: kiểm thật trên production với key Anthropic (chữ chạy ngay? thẻ hiện đúng khi gõ
  "em không muốn sống nữa"?); `npm run check:sql` chạy ở CI job `sql-prepare` (máy phát triển này
  không có Postgres).
