# 0568 — Claude là AI chính, phân chia model theo nhiệm vụ

- **Ngày:** 2026-10-09 · **PR:** (điền sau khi tạo) · **Loại:** `feat(ai)`
- **Nguồn:** yêu cầu chủ dự án: "đã có API Anthropic — thiết lập làm AI trò chuyện đồng hành, chấm
  bài; phân chia các model theo nhiệm vụ; đảm bảo ít sai sót". Hai quyết định chốt trong phiên:
  **Anthropic chính** (Anthropic → Groq → Gemini) và **Haiku 5.5 + Sonnet 5.5**.
- **Đặc tả:** `docs/specs/2026-10-09-phan-chia-model-claude-theo-nhiem-vu.md`.

## Vấn đề

- Mọi chỗ gọi Anthropic dùng chung MỘT model cũ (`claude-haiku-4-5-20251001`), và Anthropic chỉ
  là dự phòng thứ 2 — có key cũng gần như không chạy vì Groq đứng trước.
- Server không phân biệt lượt "trò chuyện" và lượt "chấm điểm": `mode` chỉ để đếm lượt, nên chấm
  cuối phiên (`Chat.tsx`, `Speaking.tsx`) đi chung đường với một câu chat.
- **Bẫy nếu chỉ đổi tên model:** Claude đời mới luôn tự suy nghĩ, `content[0]` là khối `thinking`
  chứ không phải câu trả lời. Frontend đọc `content[0].text` nên sẽ báo "lỗi định dạng" ở mọi lượt.
  Thêm ba ca 400 với model mới: lịch sử rỗng (`Chat.tsx` mở phiên), tin đầu là của AI
  (`PathStageQuiz.tsx`), tin cuối là của AI (chấm cuối phiên, model mới coi là "prefill").

## Đã làm

- `packages/core-ai/aiConfig.ts`: bảng định tuyến `getAnthropicRoute(task)` — 6 nhiệm vụ, 2 bậc:

  | Nhiệm vụ        | Model             | effort | max_tokens | timeout |
  | --------------- | ----------------- | ------ | ---------- | ------- |
  | `converse`      | claude-haiku-5-5  | low    | 4096       | 25s     |
  | `grade`         | claude-sonnet-5-5 | medium | 12000      | 45s     |
  | `companion`     | claude-sonnet-5-5 | low    | 6144       | 30s     |
  | `code_feedback` | claude-sonnet-5-5 | medium | 8192       | 40s     |
  | `action_canvas` | claude-sonnet-5-5 | medium | 8192       | 40s     |
  | `debate`        | claude-haiku-5-5  | low    | 3072       | 25s     |

  `max_tokens` rộng vì phần suy nghĩ cũng tính vào trần (cắt cụt = JSON chấm điểm hỏng); timeout
  dưới mốc 60s của Nginx (`nginx/en-vi.conf`) để kịp rơi sang dự phòng. Đổi model qua
  `ANTHROPIC_FAST_MODEL` / `ANTHROPIC_SMART_MODEL`, đọc lúc gọi.

- `packages/core-ai/anthropicClient.ts` (mới): gọi qua SDK chính thức `@anthropic-ai/sdk@^0.128.0`.
  Lọc khối `text` theo `type`; `refusal`/`max_tokens`/vượt ngữ cảnh/rỗng → `unusable` (không coi là
  thành công, vẫn ghi chi phí vì đã tốn token); chuẩn hoá lịch sử (gỡ 4 bẫy 400); thử lại 1 lần
  khi 429/529/5xx với HẠN CHÓT TỔNG bằng `AbortSignal` (thử lại không kéo quá timeout); prompt
  caching tự động; Sonnet bật server-side fallback `fallbacks: 'default'` (bộ lọc an toàn từ chối
  nhầm thì Anthropic tự chạy lại bằng model khác trong cùng lượt). Không gửi
  temperature/top_p (model mới từ chối).
- `packages/core-ai/ai.ts` (`/api/agent`): Anthropic → Groq → Gemini; nhận `task` trong danh sách
  cho phép (`converse`/`grade`), thiếu thì suy ra từ `mode`; nhiệm vụ chỉ-server hay `model` gửi từ
  client bị bỏ qua. Hết dự phòng → hoàn lượt + thông điệp song ngữ (504 mạng, 502 lỗi/cắt, 422 từ
  chối) — không lộ lỗi kỹ thuật như trước (trước forward nguyên body lỗi Anthropic).
- Vá kèm (cùng schema): Zod 4 coi `z.unknown().transform()` là BẮT BUỘC → body thiếu `mode` bị 400
  oan. Thêm `.optional()` cho `mode` và `task`, có test.
- `chatFallback.ts` (góp ý code, Action Canvas, tranh biện) và `companionRuntime.ts` (Bạn Đồng
  Hành): Anthropic trước, theo nhiệm vụ. Gỡ `callAnthropicChat` + `parseAnthropicUsageFromText`
  (không còn ai dùng).
- Frontend `apps/dhcb/src/lib/ai.ts`: `callClaude(..., task)`, đọc khối text theo `type` (lớp phòng
  thủ thứ hai), thôi gửi tên model. 7 chỗ chấm/nhận xét gửi `'grade'`: Chat (chấm cuối phiên),
  Speaking (chấm cuối phiên), Writing, CEFR role-play, Role-play bài học, Challenge, Reverse Interview.
- Giá: `capabilityCostTracker.ts` thêm Haiku 5.5 ($0.10/$0.50), Sonnet 5.5 ($2/$10), Opus 5.5
  ($4/$20 — đích fallback); sửa giá Haiku 4.5 ghi nhầm $0.8/$4 → $1/$5. `aiCost.ts` đơn giá ước
  tính/lượt theo model mới (chat $0.002 · writing $0.03 · code_feedback $0.02).
- `scripts/eval-tutor.ts` đi đúng lớp gọi production (Anthropic trước, route `converse`);
  `eval-code-feedback`/`eval-action-canvas` truyền đúng `task`. `.env.example` ghi hai biến model.

## Quyết định

- **Haiku cho hội thoại, Sonnet cho chấm:** hội thoại giọng nói chờ từng giây và chiếm đa số lượt;
  chấm điểm ít lượt nhưng sai là mất lòng tin. Opus 5.5 (~2× giá Sonnet) không dùng — chủ dự án chọn.
- **`task` tách khỏi `mode`:** `mode` giữ nguyên nghĩa "cột đếm lượt"; đổi nghĩa nó sẽ đụng hạn mức
  Free/VIP.
- **Thinking để adaptive, chỉnh bằng effort:** Sonnet 5.5 không cho tắt hẳn thinking (400); Haiku
  cho nhưng hướng dẫn chính thức khuyên dùng effort thấp thay vì tắt.

## Kiểm chứng

- `npm run typecheck` ✅ · `npm run lint` ✅ (0 cảnh báo) · `npm run test:coverage` ✅ 877 file /
  20053 test, coverage 95.92/91.87/96.62/96.59 · `npm run build` ✅ (sau khi xoá `dist` cũ) · boot
  `node dist-server/server.js` + `/api/health` ✅ · `npm run check:specs` ✅.
- Test mới/viết lại: `anthropicClient.test.ts` 20 ca (fetch giả đi qua SDK thật: thinking đứng
  trước, refusal, max_tokens, rỗng, 400 không thử lại, 529 thử lại 1 lần, rớt mạng, hạn chót tổng);
  `ai.test.ts` 35 → 53 ca; `chatFallback.test.ts`, `companionRuntime.test.ts`, `lib/ai.test.ts`.
- Smoke qua HTTP thật (server Anthropic giả ở localhost, `ANTHROPIC_BASE_URL`): lượt 1 trả 529 →
  SDK thử lại → lượt 2 thành công; header `anthropic-beta: server-side-fallback-2026-07-01`; body có
  `model: claude-sonnet-5-5`, `effort: medium`, lượt user cuối được chèn, khối thinking bị lọc.

## Không làm / còn nợ

- **Chưa chạy `npm run eval:tutor` với model mới** — container không có key AI thật. Việc tay ở
  `PROGRESS.md` mục A (CLAUDE.md §8 bắt buộc khi đổi model).
- Structured outputs (JSON schema) cho chấm điểm — giảm tiếp lỗi định dạng; cần schema riêng mỗi
  loại bài chấm, để đợt sau.
- `scripts/tag-cefr-levels.ts` (script gắn nhãn CEFR chạy tay) còn mặc định Haiku 4.5 qua
  `ANTHROPIC_MODEL` — model đó vẫn được phục vụ, không ảnh hưởng người dùng.
