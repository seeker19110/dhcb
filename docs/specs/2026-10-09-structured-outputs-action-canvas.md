# Đặc tả — Structured outputs (JSON Schema) cho Action Canvas phân rã mục tiêu

> Ngày: 2026-10-09 · Trạng thái: **Approved for implementation** (chủ dự án yêu cầu trong phiên
> 2026-10-09: "áp schema cho góp ý code và Action Canvas luôn") · Changelog: `0570`. Nối tiếp
> `docs/specs/2026-10-09-structured-outputs-cham-diem.md`.

## 0. Một câu

Lượt AI phân rã mục tiêu của Action Canvas gửi kèm JSON Schema của khuôn `{"steps":[…]}`, để
Claude luôn trả JSON đúng khuôn. Nhờ vậy hết các ca `not_json` và `schema` (thiếu khoá, miền lạ).
Hai ca này làm người dùng mất một lần bấm và thấy "AI trả sai định dạng".

## ① Phạm vi

**LÀM:**

- Tách kiểu và các hàm dựng JSON Schema ra `packages/core-ai/jsonSchema.ts`, dùng chung cho chấm
  điểm và Action Canvas. Thêm `strEnum` (chuỗi trong danh sách giá trị) và bộ kiểm
  `schemaViolations` cho test.
- `GOAL_DECOMPOSITION_JSON_SCHEMA` đặt ngay cạnh khuôn Zod trong
  `packages/core-personal/goalDecomposition.ts`. Miền dùng `enum` lấy từ chính `STEP_DOMAINS` mà
  Zod dùng.
- `generateChatText` nhận thêm tham số tuỳ chọn `outputSchema`, chỉ áp cho nhánh Anthropic.
- `/api/action-canvas?action=synthesize` và `scripts/eval-action-canvas.ts` truyền schema, nên
  eval đo đúng thứ production gửi đi.

**KHÔNG LÀM:**

- **Góp ý code (`/api/programming/feedback`) KHÔNG áp schema.** Đầu ra của nó là VĂN XUÔI có chủ
  đích (2–4 câu gợi ý Socratic, 3 phần giải thích lỗi, gạch đầu dòng góp ý), không phải JSON. Ép
  JSON nghĩa là phải đổi prompt, đổi giao diện hiển thị và chạy lại `eval:code-feedback`: đó là
  một đợt thiết kế lại, không phải áp schema. Đã báo lại chủ dự án để quyết.
- Không bỏ `parseGoalDecomposition`. API không hỗ trợ trần độ dài, số phần tử hay regex, nên Zod
  vẫn kiểm: số bước 2–8, độ dài nhãn, khuôn key `sN`, không vòng, độ sâu, không link. Groq/Gemini
  dự phòng cũng không bị ép schema, nên khi rơi xuống dự phòng thì Zod là lớp kiểm duy nhất.
- Không đổi prompt (`actionCanvasPrompt.ts`, snapshot giữ nguyên), không đổi model, không đổi
  đếm lượt.
- Tranh biện (`debate`) trả văn xuôi nên không áp schema.

## ② Điểm chạm

| Việc | Đường dẫn file                                  | Ghi chú                              |
| ---- | ----------------------------------------------- | ------------------------------------ |
| Thêm | `packages/core-ai/jsonSchema.ts`                | kiểu + hàm dựng + `schemaViolations` |
| Sửa  | `packages/core-ai/gradingSchemas.ts`            | dùng hàm dựng chung                  |
| Sửa  | `packages/core-ai/chatFallback.ts`              | tham số `outputSchema`               |
| Sửa  | `packages/core-personal/goalDecomposition.ts`   | `GOAL_DECOMPOSITION_JSON_SCHEMA`     |
| Sửa  | `apps/server/src/api/platform/action-canvas.ts` | truyền schema                        |
| Sửa  | `scripts/eval-action-canvas.ts`                 | eval dùng đúng schema production     |

## ③ Hợp đồng dữ liệu

- API `/api/action-canvas` không đổi gì với client.
- Schema gửi Claude:
  `{ steps: [{ key: string, title: string, detail: string, domain: 'learning'|'work'|'general', dependsOn: string[] }] }`.
- Mọi khoá đều bắt buộc và object đóng (`additionalProperties: false`). Với Zod, `detail` và
  `dependsOn` vẫn là tuỳ chọn, nên Groq/Gemini bỏ hai khoá này vẫn qua được như cũ.

## ④ Tiêu chí chấp nhận

- [x] Tập khoá schema bằng khoá Zod, bằng khoá trong khuôn JSON mẫu của prompt; `enum` miền
      trùng `STEP_DOMAINS`; schema không vi phạm luật API. Kiểm bằng
      `npx vitest run packages/core-personal/goalDecomposition.test.ts`.
- [x] Handler truyền đúng schema. Kiểm bằng
      `npx vitest run apps/server/src/api/platform/action-canvas.synthesize.test.ts`.
- [x] `generateChatText` chuyển schema cho Claude; không truyền thì không ép. Kiểm bằng
      `npx vitest run packages/core-ai/chatFallback.test.ts`.
- [x] `schemaViolations` bắt được schema sai (thiếu `additionalProperties`, `required` lệch, từ
      khoá cấm). Kiểm bằng `npx vitest run packages/core-ai/jsonSchema.test.ts`.
- [ ] Chạy `npm run eval:action-canvas` với key thật, không tụt so với lần đo trước. **Việc tay**
      (CLAUDE.md §8, vì đợt này sửa `goalDecomposition.ts`).

## ⑤ Bất biến không được phá

| Bất biến                                                     | Test nào canh nó                                                |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| Schema, Zod và prompt Action Canvas cùng một tập khoá        | `packages/core-personal/goalDecomposition.test.ts`              |
| Đầu ra AI vẫn qua `parseGoalDecomposition` (DAG, trần, link) | `apps/server/src/api/platform/action-canvas.synthesize.test.ts` |
| Schema chấm điểm vẫn hợp lệ sau khi đổi sang hàm dựng chung  | `apps/dhcb/src/prompts/gradingSchemas.contract.test.ts`         |

## ⑥ Rủi ro

- Lượt đầu của schema chậm hơn một chút (API biên dịch schema, sau đó cache 24 giờ).
- Anthropic từ chối schema bằng 400 thì lượt đó rơi xuống Groq/Gemini (Zod vẫn kiểm), có counter
  `ai_anthropic_status_400`.
- Rollback: bỏ tham số `outputSchema` ở handler, hoặc revert PR. Không có migration.
