# 0569 — Structured outputs (JSON Schema) cho các lượt chấm điểm

- **Ngày:** 2026-10-09 · **PR:** (điền khi tạo) · **Loại:** `feat(ai)`
- **Nguồn:** yêu cầu chủ dự án: "làm structured outputs cho chấm điểm luôn". Đây là phần
  changelog `0568` để lại cho đợt sau.
- **Đặc tả:** `docs/specs/2026-10-09-structured-outputs-cham-diem.md`.

## Vấn đề

Prompt chấm bài dặn "chỉ trả JSON", nhưng model vẫn có thể thêm chữ ngoài JSON, thiếu khoá hoặc
trả điểm dạng chuỗi. Khi đó frontend báo "AI trả về định dạng không đúng" và học viên phải chấm lại.

## Đã làm

- `packages/core-ai/gradingSchemas.ts` (mới): 5 schema chấm điểm (`writing_eval`, `speaking_eval`,
  `chat_eval`, `challenge_feedback`, `interview_feedback`). Mỗi schema dựng đúng theo khuôn JSON
  trong prompt và kiểu dữ liệu giao diện đang đọc. Mọi object đều `additionalProperties: false` và
  bắt buộc mọi khoá. Thang điểm ghi ở `description`, vì API không hỗ trợ `minimum`/`maximum`.
- `/api/agent` nhận `output_schema`: chỉ là TÊN trong danh sách cho phép, schema thô do server giữ.
  Có schema mà thiếu `task` thì coi là chấm bài (Sonnet).
- `anthropicClient.ts`: gắn `output_config.format: { type: 'json_schema', schema }`, giữ nguyên
  `effort`.
- Frontend: `callClaude(..., task, outputSchema)`. Cả 7 chỗ chấm đều truyền tên schema: Writing,
  Speaking, Chat, CEFR role-play, role-play bài học, Challenge, Reverse Interview.
- Groq/Gemini dự phòng không bị ép schema. Frontend vẫn tự kiểm JSON như cũ.

## Quyết định

- **Client gửi TÊN, không gửi schema:** schema lạ có thể gây 400 hoặc tốn công biên dịch ở mọi
  lượt. Danh sách tên cố định thì không lạm dụng được.
- **Test hợp đồng đặt ở `apps/`:** gói không được import prompt của app. Test so tập khoá JSON của
  prompt (chiều A và B) với tập khoá của schema, nên sửa prompt mà quên sửa schema là CI đỏ.
- **Giữ lớp kiểm JSON ở frontend:** đó là lớp duy nhất khi rơi xuống Groq/Gemini.

## Kiểm chứng

- Cổng chạy trên cây sạch (đã xoá `packages/*/dist dist dist-server` trước khi chạy):
  - `npm run typecheck` ✅
  - `npm run lint` ✅ (0 cảnh báo)
  - `npm run test:coverage` ✅: 878 file / 20080 test, coverage 95.92 / 91.88 / 96.62 / 96.59
  - `npm run build` ✅, boot `node dist-server/server.js` rồi gọi `/api/health` ✅
  - `npm run check:specs` ✅ · `npm run check:docs` ✅
- Test mới:
  - `apps/dhcb/src/prompts/gradingSchemas.contract.test.ts`: 18 ca. Tập khoá prompt bằng tập
    khoá schema ở 5 loại × 2 chiều; schema không dùng từ khoá cấm; danh sách tên cho phép;
    `getGradingSchema` trả bản sao.
  - `ai.test.ts` +6 ca: schema hợp lệ thì gửi đúng; tên lạ hoặc schema thô thì bỏ qua; lượt trò
    chuyện không bị ép format.
  - `anthropicClient.test.ts` +2 ca: `format` đi tới body HTTP qua SDK thật, `effort` vẫn giữ.
  - `lib/ai.test.ts` +1 ca.
- Smoke qua HTTP thật, dựng server Anthropic giả ở localhost (`ANTHROPIC_BASE_URL`):
  - Body gửi đi có `output_config: {"effort":"medium","format":{"type":"json_schema",…}}` và
    `fallbacks: default`.
  - Header `anthropic-beta: server-side-fallback-2026-07-01`.
  - Khối thinking đứng trước bị lọc, JSON trả về parse đúng.

## Không làm / còn nợ

- Chưa thử với key thật: việc tay trên VPS, gộp với `eval:tutor` ở `PROGRESS.md` mục A (chấm thử
  mỗi màn 1 bài, xem có 400 hay không).
- Góp ý code, Action Canvas và tranh biện chưa dùng schema; các đường này có trình kiểm riêng.
