# Đặc tả — Claude là AI chính, phân chia model theo nhiệm vụ

> Ngày: 2026-10-09 · Trạng thái: **Approved for implementation** (chủ dự án chốt trong phiên
> 2026-10-09: "Anthropic chính" + "Haiku + Sonnet") · Changelog: `0568`.

## 0. Một câu

Dùng API Anthropic làm AI chính cho trò chuyện đồng hành và chấm bài: server chọn model Claude
theo NHIỆM VỤ (Haiku 5.5 cho việc nhanh, Sonnet 5.5 cho việc cần chính xác), Groq/Gemini chỉ
còn là dự phòng.

## ① Phạm vi

**LÀM:**

- Thứ tự provider ở mọi đường chat AI: **Anthropic → Groq → Gemini** (trước: Groq → Anthropic → Gemini).
- Bảng định tuyến `nhiệm vụ → model + effort + max_tokens + timeout` ở server, đổi model qua
  `ANTHROPIC_FAST_MODEL` / `ANTHROPIC_SMART_MODEL`.
- Gọi Anthropic qua SDK chính thức `@anthropic-ai/sdk`; đọc câu trả lời theo `type` (khối
  thinking đứng trước), coi `refusal`/`max_tokens`/rỗng là lỗi để chuyển dự phòng + hoàn lượt.
- Chuẩn hoá lịch sử hội thoại để không dính 400 của model mới (rỗng, tin đầu/cuối là của AI,
  tin rỗng).
- Frontend gửi `task: 'converse' | 'grade'`; 7 chỗ chấm điểm/nhận xét gửi `'grade'`.
- Bảng giá token cho model mới; đơn giá ước tính/lượt.

**KHÔNG LÀM:**

- Không đổi prompt (`apps/dhcb/src/prompts/*`) — golden snapshot giữ nguyên.
- Không thêm structured outputs (JSON schema) cho chấm điểm — đợt sau (cần schema riêng cho
  từng loại bài chấm).
- Không đổi đếm lượt/hạn mức Free–VIP: `task` chỉ chọn model, KHÔNG đổi cột đếm lượt (`mode`).
- Không đụng Gemini Live, Vision (giải đề qua ảnh), STT/TTS.

## ② Điểm chạm

| Việc | Đường dẫn file                               | Ghi chú                                 |
| ---- | -------------------------------------------- | --------------------------------------- |
| Sửa  | `packages/core-ai/aiConfig.ts`               | bảng định tuyến `getAnthropicRoute`     |
| Thêm | `packages/core-ai/anthropicClient.ts`        | lớp gọi Claude qua SDK                  |
| Sửa  | `packages/core-ai/ai.ts`                     | `/api/agent`: thứ tự provider + `task`  |
| Sửa  | `packages/core-ai/chatFallback.ts`           | góp ý code · Action Canvas · tranh biện |
| Sửa  | `packages/core-personal/companionRuntime.ts` | Companion "Bạn Đồng Hành"               |
| Sửa  | `packages/core-ai/chatProviders.ts`          | gỡ `callAnthropicChat` cũ               |
| Sửa  | `packages/core-ai/capabilityCostTracker.ts`  | giá token model mới                     |
| Sửa  | `packages/core-ai/aiCost.ts`                 | đơn giá ước tính/lượt                   |
| Sửa  | `apps/dhcb/src/lib/ai.ts`                    | `callClaude(..., task)`                 |
| Sửa  | `scripts/eval-tutor.ts`                      | đo đúng model production                |

**Ảnh hưởng lan ra:** `apps/server/src/api/subjects/programming/feedback.ts`,
`apps/server/src/api/platform/action-canvas.ts`, `packages/core-ai/debateArenaService.ts` (thêm
`task`); các màn Chat/Speaking/Writing/Challenge/CEFR/Role-play/Reverse Interview (gửi `'grade'`).

## ③ Hợp đồng dữ liệu

**Vào (`POST /api/agent`, thêm 1 trường tuỳ chọn):**

```ts
{ system: string; messages: unknown[]; max_tokens?: number; mode?: 'chat' | 'writing' | 'speaking'; task?: 'converse' | 'grade' }
```

`task` lạ/thiếu → suy ra: `mode === 'writing'` ⇒ `'grade'`, còn lại ⇒ `'converse'`. Nhiệm vụ chỉ
dành cho server (`companion`, `code_feedback`…) gửi từ client bị BỎ QUA.

**Ra:** không đổi — `{ content: [{ type: 'text', text }] }`.

**Ca lỗi (khi KHÔNG còn provider dự phòng):**

| Tình huống                         | Mã  | Hành vi                             |
| ---------------------------------- | --- | ----------------------------------- |
| Anthropic lỗi mạng / quá hạn       | 504 | hoàn lượt + thông điệp bận song ngữ |
| Anthropic HTTP lỗi / bị cắt / rỗng | 502 | hoàn lượt + thông điệp bận song ngữ |
| Anthropic từ chối (`refusal`)      | 422 | hoàn lượt + mời diễn đạt lại        |

Còn dự phòng ⇒ thử Groq rồi Gemini, không hoàn lượt nếu dự phòng trả lời được.

## ④ Tiêu chí chấp nhận

- [x] Chat thường → `claude-haiku-5-5`; chấm bài → `claude-sonnet-5-5` — `npx vitest run packages/core-ai/ai.test.ts`
- [x] Khối thinking đứng trước không làm hỏng câu trả lời — `npx vitest run packages/core-ai/anthropicClient.test.ts`
- [x] Lịch sử rỗng / bắt đầu hoặc kết thúc bằng lượt AI không gây 400 — cùng file test
- [x] Refusal/max_tokens/lỗi mạng → chuyển dự phòng, hoàn lượt đúng 1 lần khi hết dự phòng — `ai.test.ts`, `chatFallback.test.ts`
- [x] Client không leo thang model qua `task`/`model` — `ai.test.ts`
- [ ] `npm run eval:tutor` trên VPS (có key thật) không tụt recall/precision so với baseline — **việc tay**

## ⑤ Bất biến không được phá

| Bất biến                                                         | Test nào canh nó                        |
| ---------------------------------------------------------------- | --------------------------------------- |
| Mọi nhánh lỗi sau khi đã trừ lượt đều hoàn lượt đúng 1 lần       | `packages/core-ai/ai.test.ts`           |
| Model do server quyết, client không chọn được model đắt hơn      | `packages/core-ai/ai.test.ts`           |
| Guardrail server luôn đứng đầu system prompt                     | `packages/core-ai/ai.test.ts`           |
| Ghi chi phí cả khi response bị cắt/từ chối (token vẫn tính tiền) | `packages/core-ai/chatFallback.test.ts` |

## ⑥ Rủi ro

- Chi phí tăng từ ~0 (Groq miễn phí) lên trả phí thật — đặt `AI_DAILY_BUDGET_USD` để cảnh báo.
- Nginx cắt request sau 60 giây: Anthropic chấm bài tối đa 45 giây, sau đó Groq dự phòng thường
  vài giây; ca hiếm cả hai cùng chậm có thể chạm mốc 60 giây.
- Client có thể gửi `task: 'grade'` cho mọi lượt để dùng Sonnet — vẫn bị chặn bởi hạn mức lượt/ngày
  (Free 30 lượt), chi phí tối đa ~$0.03 × 30 = ~$1/người/ngày.
