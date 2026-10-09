# Đặc tả — Structured outputs (JSON Schema) cho các lượt chấm điểm

> Ngày: 2026-10-09 · Trạng thái: **Approved for implementation** (chủ dự án yêu cầu trong phiên
> 2026-10-09: "làm structured outputs cho chấm điểm luôn") · Changelog: `0569`. Nối tiếp đặc tả
> `docs/specs/2026-10-09-phan-chia-model-claude-theo-nhiem-vu.md` (mục "KHÔNG LÀM" của đặc tả đó
> để structured outputs sang đợt này).

## 0. Một câu

Lượt chấm điểm gửi TÊN một khuôn JSON; server tra JSON Schema tương ứng và bắt Claude giải mã có
ràng buộc (`output_config.format`). Nhờ vậy câu trả lời luôn là JSON hợp lệ, đủ khoá, đúng kiểu, và
học viên không còn mất lượt vì "AI trả về định dạng không đúng".

## ① Phạm vi

**LÀM:**

- `packages/core-ai/gradingSchemas.ts`: 5 schema, mỗi schema khớp đúng khuôn JSON mà prompt
  tương ứng mô tả:

  | Tên                  | Prompt                          | Màn hình                                    |
  | -------------------- | ------------------------------- | ------------------------------------------- |
  | `writing_eval`       | `writingSystemPrompt`           | Writing                                     |
  | `speaking_eval`      | `speakingFullEvaluationPrompt`  | Speaking, role-play bài học, CEFR role-play |
  | `chat_eval`          | `chatFullEvaluationPrompt`      | Chat (chấm cuối phiên)                      |
  | `challenge_feedback` | `challengeFeedbackSystemPrompt` | Challenge                                   |
  | `interview_feedback` | `interviewAnswerFeedbackPrompt` | Reverse Interview                           |

- `/api/agent` nhận trường tuỳ chọn `output_schema`. Đó là TÊN schema trong danh sách cho phép;
  server không bao giờ nhận schema thô từ client.
- `callAnthropicText`/`buildAnthropicRequest` gắn
  `output_config.format = { type: 'json_schema', schema }`, đồng thời giữ nguyên `effort`.
- Đủ 7 chỗ gọi `'grade'` ở frontend đều truyền tên schema.

**KHÔNG LÀM:**

- Không đổi prompt (golden snapshot giữ nguyên), không đổi model hay effort.
- Không ép schema cho Groq/Gemini dự phòng. Hai nhà cung cấp này vẫn chạy như cũ, và frontend
  vẫn tự kiểm JSON (`parseJson`/`hasNumberFields`).
- Không gỡ phần kiểm JSON ở frontend. Đó là lớp phòng thủ thứ hai, và là lớp duy nhất khi rơi
  xuống dự phòng.
- Chưa áp schema cho góp ý code, Action Canvas, tranh biện (đi qua `chatFallback.ts`). Các đường
  đó có trình kiểm riêng, để đợt sau nếu cần.

## ② Điểm chạm

| Việc | Đường dẫn file                                          | Ghi chú                               |
| ---- | ------------------------------------------------------- | ------------------------------------- |
| Thêm | `packages/core-ai/gradingSchemas.ts`                    | danh sách tên + 5 schema              |
| Sửa  | `packages/core-ai/anthropicClient.ts`                   | tham số `outputSchema`                |
| Sửa  | `packages/core-ai/ai.ts`                                | trường `output_schema` của body       |
| Sửa  | `apps/dhcb/src/lib/ai.ts`                               | `callClaude(..., task, outputSchema)` |
| Thêm | `apps/dhcb/src/prompts/gradingSchemas.contract.test.ts` | khoá prompt = khoá schema, chiều A/B  |

## ③ Hợp đồng dữ liệu

**Vào (`POST /api/agent`, thêm 1 trường tuỳ chọn):**

```ts
{ …; output_schema?: 'writing_eval' | 'speaking_eval' | 'chat_eval' | 'challenge_feedback' | 'interview_feedback' }
```

- Tên lạ, schema thô (object) hoặc thiếu trường: bỏ qua, không ép format.
- Có `output_schema` mà thiếu `task`: coi là `'grade'`.

**Ra:** không đổi, vẫn là `{ content: [{ type: 'text', text }] }`. Khi Claude trả lời, `text` là
JSON đúng schema.

**Giới hạn của API mà schema phải theo:**

- Mọi object phải có `additionalProperties: false` và mọi khoá đều nằm trong `required`.
- Không dùng được `minimum`/`maximum`/`minLength`/`maxLength`, nên thang điểm ghi ở `description`.

## ④ Tiêu chí chấp nhận

- [x] Tập khoá JSON của từng prompt (cả chiều A lẫn B) bằng tập khoá của schema. Kiểm bằng
      `npx vitest run apps/dhcb/src/prompts/gradingSchemas.contract.test.ts`.
- [x] Schema không chứa từ khoá API cấm; mọi object đều `additionalProperties:false` và đủ
      `required`. Cùng file test trên.
- [x] `output_schema` hợp lệ thì gửi đúng schema của server; tên lạ hoặc schema thô thì bị bỏ qua.
      Kiểm bằng `packages/core-ai/ai.test.ts`.
- [x] `output_config.format` đi tới tận body HTTP qua SDK thật, `effort` vẫn giữ. Kiểm bằng
      `packages/core-ai/anthropicClient.test.ts`.
- [ ] Trên VPS (có key thật), chấm thử 1 bài ở mỗi màn Writing, Speaking, Chat, Challenge, Reverse
      Interview: không lỗi 400, điểm hiện đúng. **Việc tay**, gộp với việc chạy `eval:tutor` ở
      `PROGRESS.md` mục A.

## ⑤ Bất biến không được phá

| Bất biến                                                     | Test nào canh nó                                        |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| Client không gửi được schema tuỳ ý                           | `packages/core-ai/ai.test.ts`                           |
| Thêm hay bớt khoá ở prompt chấm thì PHẢI sửa schema cùng lúc | `apps/dhcb/src/prompts/gradingSchemas.contract.test.ts` |
| Lượt trò chuyện (không có schema) không bị ép format         | `packages/core-ai/ai.test.ts`                           |

## ⑥ Rủi ro

- **Lượt đầu tiên của mỗi schema chậm hơn một chút:** API biên dịch schema rồi giữ trong cache
  24 giờ. Có 5 schema cố định nên chi phí này không đáng kể.
- **Server-side fallback của Sonnet:** request phải hợp lệ với mọi model dự phòng. Các model
  Claude hiện hành đều hỗ trợ structured outputs. Nếu Anthropic vẫn trả 400, lượt đó rơi xuống
  Groq/Gemini như mọi lỗi HTTP khác (có counter `ai_anthropic_status_400` để phát hiện).
- **Rollback:** frontend ngừng gửi `output_schema`, hoặc revert PR. Không có migration.
