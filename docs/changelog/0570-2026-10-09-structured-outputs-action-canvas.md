# 0570 — Structured outputs (JSON Schema) cho Action Canvas phân rã mục tiêu

- **Ngày:** 2026-10-09 · **PR:** #1318 · **Loại:** `feat(ai)`
- **Nguồn:** yêu cầu chủ dự án: "áp schema cho góp ý code và Action Canvas luôn". Nối tiếp
  changelog `0569` (structured outputs cho chấm điểm, PR #1316).
- **Đặc tả:** `docs/specs/2026-10-09-structured-outputs-action-canvas.md`.

## Vấn đề

AI phân rã mục tiêu của Action Canvas phải trả JSON `{"steps":[…]}`. Khi model thêm chữ ngoài
JSON, thiếu khoá hoặc trả miền lạ, `parseGoalDecomposition` từ chối (`not_json`/`schema`). Người
dùng được hoàn lượt nhưng phải bấm lại và thấy "AI trả sai định dạng".

## Đã làm

- `packages/core-ai/jsonSchema.ts` (mới): kiểu `JsonSchema`, các hàm dựng `str`/`strEnum`/`num`/
  `arr`/`obj` và hai bộ kiểm cho test (`schemaKeys`, `schemaViolations`).
  `gradingSchemas.ts` chuyển sang dùng các hàm này; test hợp đồng chấm điểm bỏ phần code trùng.
- `GOAL_DECOMPOSITION_JSON_SCHEMA` nằm cạnh khuôn Zod trong `goalDecomposition.ts`. Miền dùng
  `enum` lấy từ chính `STEP_DOMAINS` của Zod, nên không lệch được.
- `generateChatText(..., outputSchema)`: chỉ ép nhánh Anthropic. Handler
  `/api/action-canvas?action=synthesize` và `scripts/eval-action-canvas.ts` truyền schema.
- `parseGoalDecomposition` giữ nguyên. API không có trần độ dài, số phần tử hay regex, và
  Groq/Gemini không bị ép, nên Zod + kiểm DAG vẫn là lớp quyết định.

## Quyết định

- **Góp ý code KHÔNG áp schema:** đầu ra là văn xuôi có chủ đích (gợi ý Socratic, giải thích lỗi
  3 phần, góp ý gạch đầu dòng). Ép JSON là thiết kế lại cả prompt, giao diện và
  `eval:code-feedback`, nên đã báo lại chủ dự án để quyết.
- **Schema đặt cạnh Zod, không đặt ở `core-ai`:** người sửa khuôn Zod thấy schema ngay bên dưới.
  Test so ba nguồn (Zod, schema, prompt) cùng một tập khoá.
- **Mọi khoá bắt buộc trong schema** dù Zod cho `detail`/`dependsOn` tuỳ chọn: Claude luôn điền đủ;
  Groq/Gemini bỏ hai khoá này vẫn qua được Zod như cũ.

## Kiểm chứng

- Cổng chạy trên cây sạch (đã xoá `packages/*/dist dist dist-server`):
  - `npm run typecheck` ✅ · `npm run lint` ✅ (0 cảnh báo)
  - `npm run test:coverage` ✅: 879 file / 20098 test, coverage 95.93 / 91.88 / 96.63 / 96.59
  - `npm run build` ✅, boot `node dist-server/server.js` rồi gọi `/api/health` ✅ ·
    `npm run check:specs` ✅
- Test mới:
  - `jsonSchema.test.ts`: các hàm dựng; `schemaViolations` bắt đúng object thiếu
    `additionalProperties`, `required` lệch, từ khoá cấm.
  - `goalDecomposition.test.ts` +4 ca: khoá schema bằng khoá Zod, bằng khoá trong prompt; `enum`
    miền; schema hợp lệ với API.
  - `chatFallback.test.ts` +1 ca (schema chuyển cho Claude, không truyền thì không ép);
    `action-canvas.synthesize.test.ts` kiểm handler truyền đúng schema.
- Smoke qua HTTP thật (server Anthropic giả, `ANTHROPIC_BASE_URL`), đi đường production
  `generateChatText` → `parseGoalDecomposition`:
  - Body gửi `claude-sonnet-5-5`, `effort: medium`, `format.type: json_schema`, miền
    `{"enum":["learning","work","general"]}`.
  - Khối thinking bị lọc; kết quả qua Zod + DAG (`ok: true`).

## Không làm / còn nợ

- **Chưa chạy `npm run eval:action-canvas` với key thật** (CLAUDE.md §8 bắt buộc khi sửa
  `goalDecomposition.ts`). Việc tay ở `PROGRESS.md` mục A.
- Góp ý code: chờ chủ dự án quyết có thiết kế lại sang JSON hay không.
