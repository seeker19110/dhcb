# 0618 — Bạn Đồng Hành GĐ3: tác tử dùng công cụ thật · định tuyến Haiku · kiểm câu trả lời cuối

- **Ngày:** 2026-10-12 · **PR:** #1378 · **Loại:** `feat(companion)`
- **Đặc tả:** `docs/specs/2026-10-12-ban-dong-hanh-gd3-tac-tu-cong-cu.md` (Approved for
  implementation). **Nghiên cứu:** `docs/research/nang-cap-ban-dong-hanh-2026-10-11.md` (kế hoạch
  dòng 3). Nối tiếp GĐ2b (changelog `0617`, PR #1377).
- **Nguồn việc:** chủ dự án nói "viết đặc tả GĐ3 Companion rồi làm".

## Vấn đề (đo trong mã trước đợt này)

1. "Tuần này mình học tới đâu?" — Companion chỉ thấy khối tóm tắt nạp sẵn theo miền đoán bằng từ
   khoá; đoán sai miền là không có số liệu, model đành nói chung chung hoặc bịa.
2. "Từ X nghĩa là gì?" — planner chỉ tạo một ProposedAction `dictionary.lookup` không làm gì; nghĩa
   từ là nghĩa model nhớ, không phải từ điển ~7.400 từ của app (có IPA, cấp CEFR).
3. "Ghi nhớ…"/"đặt mục tiêu…" — planner lưu NGUYÊN câu người dùng; đề xuất trùng tạo nhiều lần.
4. Không có gì chặn câu "mình đã lưu rồi nhé" khi thực tế chưa lưu gì (persona cấm nhưng prompt
   không chặn được 100%).

## Đã làm

- **Vòng công cụ viết tay** `packages/core-ai/anthropicToolLoop.ts`: SDK chính thức, công cụ
  `strict: true`, trần 4 bước có gọi công cụ (bước sau ép `tool_choice: none`), trần 6 lần thi hành,
  hạn chót tổng 45 giây (dưới mốc 60 giây của Nginx), trả nguyên `response.content` (giữ khối
  thinking), mọi `tool_result` của một bước trong MỘT tin; stream chữ thật, `tool_use` không bao giờ
  tới client; không bao giờ ném — lỗi trả về dạng kết quả để rơi xuống Groq/Gemini.
- **Định tuyến ý định bằng Haiku** `packages/core-personal/intentRouter.ts`: nhiệm vụ AI mới
  `intent_route` (`aiConfig.ts`), structured output schema chặt, chạy SONG SONG với đọc hồ sơ, chỉ
  khi client không chỉ định miền/ý định; lỗi gì cũng về bảng từ khoá cũ.
- **7 công cụ** `packages/core-personal/companionTools.ts` — 4 chỉ-đọc (`get_learning_progress`,
  `get_review_queue`, `search_notes` khớp không dấu, `lookup_dictionary`) và 3 tạo đề xuất
  (`propose_memory` chỉ khi đã bật "Nhớ về tôi", `propose_learning_goal`, `propose_profile_fact`).
  Id người dùng lấy từ lượt, model không truyền id; Zod kiểm lại sau `strict`; kết quả gỡ thẻ bọc,
  cắt 4.000 ký tự, không uuid; đề xuất qua `isUnsafeMemoryContent`, trần 3/lượt, trùng `pending`
  cùng payload (so jsonb, `findPendingDuplicate`) ⇒ trả bản cũ. Phiên tạm: không công cụ đề xuất.
  Lượt khủng hoảng: KHÔNG công cụ nào.
- **Kiểm câu trả lời cuối** `packages/core-personal/finalAnswerChecks.ts` (tất định, 0 lời gọi AI):
  gỡ thẻ `<du_lieu_…>`/thẻ dạng gọi công cụ, gỡ uuid, câu "đã lưu" khi không có gì `committed` ⇒ nối
  câu đính chính (chờ duyệt / chưa lưu gì), ghi nhận lệch ngôn ngữ. Bản đã kiểm là bản được lưu và
  bản giao diện giữ (sự kiện `done`).
- **Runtime** `companionRuntime.ts`: tham số tuỳ chọn `agent` — có ⇒ router + vòng công cụ, KHÔNG
  chạy planner từ khoá; không có (hoặc thiếu key Anthropic) ⇒ y như GĐ2b. Đề xuất do công cụ tạo vẫn
  trả về khi Claude hỏng giữa vòng và Groq trả lời. Prompt thêm `COMPANION_TOOLS_GUIDANCE` chỉ khi có
  công cụ (golden snapshot môn Anh không đổi). Sự kiện SSE mới `tool` mang nhãn tiếng Việt.
- **Server**: `apps/server/src/api/_lib/companionToolkit.ts` tiêm tra từ điển (gói `core-personal`
  không import gói môn học); công tắc lùi `COMPANION_TOOLS=off`. Tách `searchDictionaryEntries`
  trong `packages/subject-english/dictionaryData.ts` để `/api/dictionary` và công cụ dùng chung một
  logic tìm (hành vi `/api/dictionary` không đổi — test cũ xanh).
- **Giao diện**: dòng chờ của khung trò chuyện hiện nhãn công cụ đang chạy ("Đang xem tiến độ học…",
  "Đang tra từ điển…"), `role="status"` + `aria-live="polite"`; nhãn mất khi chữ bắt đầu về hoặc lượt
  xong (`Companion.tsx`, `StudioDialogue.tsx`, `companionApi.ts#onTool`).
- **Eval** `npm run eval:companion` (`scripts/eval-companion.ts` + fixture): 5 ca xu nịnh (giám khảo
  Haiku), 4 ca khủng hoảng đa lượt (câu cuối KHÔNG lọt bộ lọc từ khoá — test canh), 7 ca dùng công cụ
  (vòng thật + bộ thi hành giả, có ca "không được gọi công cụ"). `npm run eval:v2:routing -- --haiku`
  đo bộ định tuyến Haiku (bỏ qua ca thuộc ba trụ đã gỡ).

## Quyết định

- Viết vòng tay thay Tool Runner (beta): cần trần bước cứng + hạn chót tổng + kết quả "không ném"
  để chuyển nhà cung cấp dự phòng. KHÔNG bật `eager_input_streaming` — bật thì API thôi kiểm schema,
  mất bảo đảm của `strict`; tham số công cụ ở đây tí hon nên không mất gì.
- Không cho AI sửa khối ghi nhớ cố định, không công cụ đọc ký ức (đã có trong ngữ cảnh qua cổng
  consent GĐ2a). Không kiểm "lộ lời giải" bằng mã — không có phép kiểm tất định đáng tin.
- Không migration: chống trùng bằng so `payload` jsonb; `confirmAction` vốn đã lũy đẳng (khoá dòng +
  `version`, lần hai 409).

## Bằng chứng kiểm chứng

- Unit mới/sửa: `anthropicToolLoop` 11 · `intentRouter` 11 · `companionTools` 22 ·
  `finalAnswerChecks` 9 · `companionAgent` 9 · `proposedActionService` 29 · `companionPrompt` 12 ·
  `companionToolkit` 4 · `companion` (API) +2 · `companionApi` +1 · `Companion.tool` 1 ·
  `evalCompanionFixtures` 6 · `dictionary` (API, không đổi hành vi) — xanh.
- Cổng: `rm -rf packages/*/dist dist dist-server` rồi typecheck · lint (0 cảnh báo) · test:coverage ·
  build · `check:specs` · `check:sql` (Postgres 16 đã áp đủ migration, 672 câu PREPARE, không lỗi
  ngoài allowlist).
- Tầng 8b: xem mục ảnh chụp trong mô tả PR.
- **CHƯA chạy** (phiên không có key AI): `npm run eval:companion`, `npm run eval:v2:routing --
--haiku` — việc tay của chủ dự án, ghi ở `PROGRESS.md`.
