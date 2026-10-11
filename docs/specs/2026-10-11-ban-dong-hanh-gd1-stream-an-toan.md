# Đặc tả — Bạn Đồng Hành GĐ1: stream thật · nhớ đúng lượt mới · prompt mới · lớp an toàn

- **Ngày:** 2026-10-11 · **Trạng thái:** Approved for implementation (chủ dự án chốt "làm lần lượt
  cả 4 GĐ" và "thêm bộ phân loại Haiku" ngày 2026-10-11).
- **Nghiên cứu nền:** `docs/research/nang-cap-ban-dong-hanh-2026-10-11.md` (mục 1 hiện trạng đo
  trong mã, mục 2 bài học từ Letta/mem0/Zep/Generative Agents/Khanmigo/Pi/Anthropic, mục 3 kế hoạch
  4 giai đoạn).

## 0. Một câu

Người dùng thấy chữ của Bạn Đồng Hành chạy ngay khi Claude sinh ra, AI nhớ đúng lượt vừa nói, prompt
không hứa trụ đã xoá và nói đúng giọng theo nhóm tuổi, và khi ai đó nói về tự hại / bị bạo hành thì
hệ thống dừng bài học, đưa số 111/115 thật và không "lưu ký ức" lời tâm sự đó.

## ① Phạm vi

**LÀM:**

- `callAnthropicText({ onTextDelta })`: đi đường `beta.messages.stream`, phát từng `text_delta`,
  kết quả cuối vẫn là một `AnthropicTextResult` (usage/stop_reason từ `finalMessage()`); không
  stream khi có `outputSchema`.
- `streamCompanionTurn`: chuẩn bị lượt → `meta` → (`safety`) → chunk THẬT từ Claude qua hàng đợi →
  `actions` → (`questions`) → `done`. Khối ` ```dhcb-questions ` bị giữ lại khỏi stream
  (`QuestionFenceGuard`). Dự phòng Groq/Gemini, câu cố định, hoặc Claude rớt giữa chừng → phát
  theo từng từ từ bản đầy đủ (`CompanionReplyResult.streamed`).
- `contextEngine`: lịch sử gói theo thứ tự mới → cũ (giữ lượt mới nhất khi hết ngân sách), trả
  cho LLM cũ → mới. Ngân sách mặc định Companion `COMPANION_DEFAULT_TOKEN_BUDGET = 4000`.
- Prompt mới `companionPrompt.ts`: nhân cách 2 trụ (Học tập · Ghi chú), "BÂY GIỜ LÀ" giờ Việt Nam,
  khối theo nhóm tuổi (`profiles.age_group` qua join từ `personal.persons`), luật chống xu nịnh,
  không nhận cảm xúc, kinh tế ngôn từ, không emoji ở chủ đề nghiêm trọng, không nói "đã lưu" khi
  không có tác vụ; dữ liệu người dùng bọc thẻ `<du_lieu_<nonce>>` (spotlighting). Golden snapshot.
- Lớp an toàn `safetyGuard.ts` (route AI mới `safety` = Haiku, effort low, 1024 token, 8 s): tầng
  từ khoá (có dấu / không dấu không nhập nhằng / tiếng Anh) + tầng Haiku (JSON Schema chặt, nhận
  ≤ 3 lượt người dùng gần đây đã qua cổng consent); mức cao hơn thắng; Haiku hỏng → về từ khoá.
  `concern` → không lập kế hoạch tác vụ, prompt có lời dặn an toàn, bỏ câu hỏi tick, transcript ≥
  `sensitive`, trả `safety` (thẻ 111/115/Ngày Mai). `imminent` → câu cố định
  `IMMINENT_SAFETY_REPLY` (không gọi LLM), không lưu transcript, handler HOÀN lượt.
- Client: sự kiện SSE `safety` → `CrisisSupportCard` dưới tin nhắn (số bấm gọi `tel:`, nói rõ là
  AI); `X-Accel-Buffering: no` trên response SSE.

**KHÔNG LÀM (tách GĐ2–4, cần đặc tả riêng):**

- Không đổi CSDL (không migration). Không đụng `memory_records`, cách xếp hạng ký ức, trích ký ức
  tự động, tóm tắt cuộn — GĐ2.
- Không đổi bảng từ khoá ý định, không thêm capability/công cụ — GĐ3.
- Không đụng `proactiveAgentService` — GĐ4.
- Không gọi bộ phân loại Haiku ở `/api/agent` (gia sư tiếng Anh) — chỉ Companion.
- Không chạm `apps/dhcb/src/prompts/*` (eval:tutor không liên quan); `aiConfig.ts` chỉ THÊM
  route `safety`, không đổi route/model nào đang có.

## ② Điểm chạm

| Việc | Đường dẫn file                                                         | Ghi chú                                                     |
| ---- | ---------------------------------------------------------------------- | ----------------------------------------------------------- |
| Sửa  | `packages/core-ai/anthropicClient.ts`                                  | `onTextDelta` → `beta.messages.stream`                      |
| Sửa  | `packages/core-ai/anthropicClient.test.ts`                             | 4 ca SSE giả (thinking trước, max_tokens, 400, schema)      |
| Sửa  | `packages/core-ai/aiConfig.ts`                                         | thêm `AiTask` `safety`                                      |
| Sửa  | `packages/core-personal/contextEngine.ts`                              | lịch sử mới → cũ khi gói, `restoreHistoryOrder`             |
| Sửa  | `packages/core-personal/contextEngine.test.ts`                         | 2 ca giữ lượt mới nhất                                      |
| Thêm | `packages/core-personal/companionPrompt.ts`                            | prompt mới + `wrapContextBlocks`                            |
| Thêm | `packages/core-personal/companionPrompt.test.ts`                       | golden snapshot + luật                                      |
| Thêm | `packages/core-contracts/companionSafety.ts`                           | hợp đồng thẻ + `VIETNAM_SAFETY_RESOURCES`                   |
| Thêm | `packages/core-personal/safetyGuard.ts`                                | 2 tầng, fail-safe                                           |
| Thêm | `packages/core-personal/safetyGuard.test.ts`                           | 29 ca                                                       |
| Sửa  | `packages/core-personal/companionRuntime.ts`                           | prepare/synthesize/finalize, `QuestionFenceGuard`, hàng đợi |
| Sửa  | `packages/core-personal/companionRuntime.test.ts`                      | stream thật, an toàn, nhóm tuổi                             |
| Sửa  | `packages/core-personal/companionStream.test.ts`                       | mock lớp an toàn                                            |
| Sửa  | `apps/server/src/api/personal/companion.ts`                            | hoàn lượt `imminent`, `X-Accel-Buffering`                   |
| Sửa  | `apps/server/src/api/personal/companion.test.ts`                       | 2 ca                                                        |
| Sửa  | `apps/dhcb/src/lib/companionApi.ts`                                    | `onSafety`, `safety`                                        |
| Sửa  | `apps/dhcb/src/lib/companionApi.test.ts`                               |                                                             |
| Thêm | `apps/dhcb/src/components/CompanionStudios/CrisisSupportCard.tsx`      | thẻ hỗ trợ                                                  |
| Thêm | `apps/dhcb/src/components/CompanionStudios/CrisisSupportCard.test.tsx` |                                                             |
| Thêm | `apps/dhcb/src/components/CompanionStudios/formatPhone.ts`             |                                                             |
| Sửa  | `apps/dhcb/src/components/CompanionStudios/StudioDialogue.tsx`         | render thẻ                                                  |
| Sửa  | `apps/dhcb/src/components/CompanionStudios/studioTypes.ts`             | `ChatMessage.safety`                                        |
| Sửa  | `apps/dhcb/src/pages/companion/Companion.tsx`                          | nối `onSafety`/`done.safety`                                |

**Ảnh hưởng lan ra (theo codemap):** `companionRuntime.ts` chỉ được `companion.ts` (handler) và
`scripts/eval-v2-routing.ts` (`resolveIntentAndDomain`, không đổi) import. `anthropicClient.ts`
có 6 nơi gọi — tham số mới tuỳ chọn, hành vi không stream giữ nguyên (26 test cũ xanh).
`contextEngine.ts` chỉ runtime gọi.

## ③ Hợp đồng dữ liệu

**Vào** (không đổi): `POST /api/companion { message, intent?, domain?, tokenBudget?, stream? }`.

**Ra:**

```ts
// CompanionResponse (JSON và sự kiện SSE `done`)
{ reply, intent, targetDomain, contextPackage, proposedActions, executionSummary,
  interactiveQuestions, isFallback,
  safety?: { level: 'concern' | 'imminent', category: 'self_harm' | 'abuse' | 'other' | 'none',
             resources: { phone, name, note }[] } }
// SSE: meta → safety? → chunk* → actions → questions? → done | error
```

| Tình huống             | Mã          | Hành vi mong đợi                                                          |
| ---------------------- | ----------- | ------------------------------------------------------------------------- |
| Claude rớt giữa stream | 200         | chuỗi dở đã phát, dự phòng trả bản đầy đủ phát từng từ, `done.reply` đúng |
| Mọi provider hỏng      | 200         | câu mẫu + `isFallback` → hoàn lượt (không đổi)                            |
| `imminent`             | 200         | `IMMINENT_SAFETY_REPLY` + `safety`, hoàn lượt, không lưu transcript       |
| Lỗi ném trong stream   | SSE `error` | thông điệp chung, hoàn lượt một lần (không đổi)                           |

## ④ Tiêu chí chấp nhận

- [x] Stream: chunk tới theo đúng mẩu Claude phát, khối câu hỏi không lọt, thứ tự sự kiện
      `meta, chunk…, actions, questions, done` — `npx vitest run packages/core-personal/companionRuntime.test.ts`
- [x] SDK: text delta đúng thứ tự, bỏ thinking, usage gộp, `max_tokens` → unusable, 400 → api_error —
      `npx vitest run packages/core-ai/anthropicClient.test.ts`
- [x] Lịch sử: ngân sách đủ 2 lượt → giữ 2 lượt MỚI nhất, trả cũ → mới — `contextEngine.test.ts`
- [x] Prompt: không nhắc trụ đã gỡ; có giờ VN; mỗi nhóm tuổi một khối; khủng hoảng → bỏ tick
      chọn; thẻ đóng giả bị tước — `companionPrompt.test.ts` (snapshot)
- [x] An toàn: 8 câu nói thẳng (dấu/không dấu/Anh) bắt được; 5 câu thường không bắt nhầm; Haiku
      hỏng → giữ kết luận từ khoá; Haiku nâng `imminent` — `safetyGuard.test.ts`
- [x] Lượt `concern`: 0 proposeAction, transcript `sensitive`, `safety` có 111; lượt `imminent`:
      không gọi AI, không insert transcript, sự kiện `safety` trước chữ — `companionRuntime.test.ts`
- [x] Handler: `imminent` hoàn lượt đúng một lần (stream + JSON), header `X-Accel-Buffering: no` —
      `apps/server/src/api/personal/companion.test.ts`
- [x] Thẻ: 3 số `tel:`, câu "là AI và không thể gọi thay bạn" — `CrisisSupportCard.test.tsx`

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint && npm run test:coverage && npm run build
npm run check:specs
```

## ⑤ Bất biến không được phá

| Bất biến                                                    | Test nào canh nó                                        |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| Không giao câu trả lời AI ⇒ không mất lượt                  | `apps/server/src/api/personal/companion.test.ts`        |
| JSON khối câu hỏi không bao giờ hiện ra chữ thô             | `packages/core-personal/companionRuntime.test.ts`       |
| Lịch sử chỉ qua Context Engine (consent/policy/sensitivity) | `packages/core-personal/contextEngine.test.ts`          |
| Lớp an toàn không "mở" khi AI hỏng                          | `packages/core-personal/safetyGuard.test.ts`            |
| Lượt khủng hoảng không đề xuất tác vụ ghi dữ liệu           | `packages/core-personal/companionRuntime.test.ts`       |
| Prompt không bị sửa không chủ đích                          | `packages/core-personal/companionPrompt.test.ts`        |
| Route AI đang có (converse/grade/…) không đổi model/effort  | `packages/core-ai/anthropicClient.test.ts` (FAST/SMART) |

## ⑥ Quy ước dự án liên quan

- Mọi lệnh gọi AI qua `checkAndConsumeUsage` + `refundUsage(…, gate.day)`; bộ phân loại `safety`
  ghi chi phí mode `safety` qua `recordAiTokenUsage`.
- Import xuyên gói `@dhcb/<gói>/<file>`; nội bộ gói đường tương đối `.js`.
- Chữ nội dung AAA, điều khiển AA; vùng chạm ≥ 44 px (`min-h-11` trên link gọi).
- Đổi prompt Companion ⇒ cập nhật snapshot có chủ đích; `eval:tutor` KHÔNG liên quan (prompt môn
  Anh không đổi).

---

## Nghiệm thu

- Lệnh đã chạy + kết quả thật: xem `docs/changelog/0614-2026-10-11-ban-dong-hanh-gd1-stream-an-toan.md`.
- Còn để ngỏ: `npm run check:sql` cần Postgres (CI job `sql-prepare` chạy); kiểm thật với key
  Anthropic trên production (stream + bộ phân loại) — việc tay của chủ dự án.
