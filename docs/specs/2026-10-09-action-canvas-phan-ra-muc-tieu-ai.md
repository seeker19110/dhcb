# Đặc tả: Action Canvas — AI đề xuất phân rã mục tiêu (thay khung mẫu cố định)

**Trạng thái:** Approved for implementation — chủ dự án duyệt hướng "chất lượng cao nhất"
2026-10-09 trong phiên (giao qua coordinator, đợt `0549`).

**Nền:** nợ ở `PROGRESS.md` "Action Canvas 'tạo sơ đồ từ mục tiêu' chỉ là KHUNG MẪU cố định"
(phát hiện ở changelog `0485`): `synthesizeCrossDomainGoalCanvas` luôn trả cùng 4 thẻ "Ví dụ" bất
kể mục tiêu. Rào chắn phải theo: skill `autonomous-agent-orchestrator` (§1, §4) và
`life-career-strategic-advisor` (§1, §2).

---

## 0. Một câu

Người dùng đã đăng nhập nhập một mục tiêu, server gọi AI rẻ (có đếm lượt chung 30/ngày của Free)
để **đề xuất** 2–8 bước có phụ thuộc không vòng; người dùng xem, bỏ bớt, sửa tên rồi **tự bấm Lưu**
— hết lượt hoặc không muốn dùng AI thì tự bắt đầu với thẻ mục tiêu.

## ① Phạm vi

**LÀM:**

- `POST /api/action-canvas?action=synthesize` gọi AI THẬT qua `generateChatText` (Groq → Anthropic
  → Gemini, model rẻ ở `packages/core-ai/aiConfig.ts`), **đúng 1 lời gọi**/lần tạo, trần token đầu ra
  `GOAL_DECOMPOSITION_MAX_TOKENS = 1200`, không tự thử lại, không gọi công cụ.
- Đếm lượt: `checkAndConsumeUsage(userId, 'chat')` — chung hạn mức AI/ngày (Free 30, VIP không
  chặn nhưng vẫn ghi thống kê), trừ NGUYÊN TỬ bằng hàm SQL sẵn có. **Hoàn lượt**
  (`refundUsage(…, gate.day)`) khi: không provider nào trả lời · đầu ra hỏng · lỗi bất ngờ sau khi
  đã trừ. Chi phí token ghi nhãn riêng `action_canvas` trên dashboard admin.
- Chống đua: khoá theo user `action_canvas_ai_lock` trong `platform.feature_state` (upsert có điều
  kiện hết hạn 120 giây — nguyên tử ở Postgres, đúng cả khi chạy nhiều tiến trình PM2). Request thứ
  hai khi request đầu chưa xong ⇒ 409, KHÔNG gọi AI, KHÔNG trừ lượt.
- Prompt tách file `packages/core-personal/actionCanvasPrompt.ts` (server dựng, client không gửi
  được prompt); mục tiêu bọc rào `<muc_tieu>…</muc_tieu>`, ký tự `<`/`>` của người dùng bị đổi
  thành `‹`/`›` để không thoát rào; system prompt nói rõ mục tiêu là DỮ LIỆU, AI chỉ đề xuất, không
  làm hộ, chỉ giới thiệu hai khu vực còn thật (Học tập, Ghi chú).
- Bộ kiểm đầu ra `packages/core-personal/goalDecomposition.ts` (Zod `.strict()` + luật nghiệp vụ):
  2–8 bước · key `s1…s99` không trùng · tiêu đề 2–80 ký tự, chi tiết ≤ 280 · miền CHỈ
  `learning`/`work`/`general` (miền đã xoá ⇒ từ chối, không lặng lẽ đổi) · ≤ 3 phụ thuộc/bước ·
  phụ thuộc trỏ bước có thật, không tự trỏ · **DAG** (Kahn) · độ sâu ≤ 4 · không link/URL · không
  trường lạ (vd `actions`) · chuỗi thô ≤ 8000 ký tự · chấp nhận đúng một khối rào ```json.
- Đề xuất trả về **không lưu**: `{ success, source: 'ai', proposal: ActionCanvasState }`. Nút gốc
  là CHÍNH câu mục tiêu (AI không đổi được), mọi thẻ AI: `status: 'draft'`, `assignedTo: 'user'`,
  tag `ai-de-xuat`. Bố cục qua `autoLayoutCanvasNodes`; kiểm lần cuối bằng `ActionCanvasStateSchema`.
- Giao diện (`CanvasAiOrchestratorModal`): nhập mục tiêu (3–300 ký tự, bộ đếm) → "Đề xuất bằng AI
  (1 lượt)" hoặc "Tự bắt đầu, không dùng AI" · đang tải (`role=status`, `aria-busy`, không đóng được)
  · lỗi (`role=alert`, giữ câu mục tiêu) · hết lượt (nói thật + "Tự bắt đầu với thẻ mục tiêu") · xem
  lại đề xuất có nhãn "đề xuất của AI… Chưa có gì được lưu", checkbox giữ/bỏ từng bước + ô sửa tên
  → "Lưu vào sơ đồ" (hỏi trước nếu thay sơ đồ đang có) → lưu qua nhánh lưu THƯỜNG.
- **Gỡ khung mẫu** `synthesizeCrossDomainGoalCanvas` (không giữ làm "mẫu ví dụ"). Lý do: lối không
  dùng AI đã có hai đường trung thực (thẻ mục tiêu tự dựng, "Thêm thẻ"); giữ thêm 4 thẻ "Ví dụ" cố
  định cạnh kết quả AI chỉ làm người dùng lẫn đâu là phân tích, đâu là khuôn — đúng lỗi nợ gốc.
- Eval: golden snapshot prompt + test bộ kiểm + test bộ chấm chạy trong CI (miễn phí);
  `npm run eval:action-canvas` (`scripts/eval-action-canvas.ts`) tốn phí, chạy TAY, không vào CI.

**KHÔNG LÀM (quan trọng ngang mục trên):**

- Không thêm bảng/cột/migration (lưu đề xuất không cần; khoá dùng lại `platform.feature_state`).
- Không thêm cột đếm lượt riêng (`daily_usage.*_count`): cần migration + sửa `consume_usage_total`;
  tách chi phí đã có qua nhãn token `action_canvas`. Đếm vào cột `chat` như Companion/ambient/vision.
- Không tự thực thi bất kỳ bước nào (không tạo việc trong Ghi chú, không mở bài học, không gửi gì).
- Không vòng lặp nhiều bước / tự sửa đầu ra hỏng bằng lời gọi thứ hai (tốn gấp đôi).
- Không dựng lại tư vấn sự nghiệp/khởi nghiệp/đời sống (ADR-0010); mục tiêu kiểu đó vẫn chia bước
  bình thường với miền `general`, không giới thiệu khu vực app nào đã xoá.
- Không đụng `/api/agent`, `apps/dhcb/src/prompts/*`, `packages/core-ai/aiConfig.ts`.

## ② Điểm chạm

| Việc | Đường dẫn file                                                             | Ghi chú                                      |
| ---- | -------------------------------------------------------------------------- | -------------------------------------------- |
| Thêm | `packages/core-personal/goalDecomposition.ts`                              | Zod + DAG + dựng canvas đề xuất              |
| Thêm | `packages/core-personal/goalDecomposition.test.ts`                         | JSON hỏng/vòng/quá số nút/link/miền đã xoá   |
| Thêm | `packages/core-personal/actionCanvasPrompt.ts`                             | prompt riêng, trần token, rào dữ liệu        |
| Thêm | `packages/core-personal/actionCanvasPrompt.test.ts`                        | golden snapshot + bất biến rào chắn          |
| Sửa  | `packages/core-personal/actionCanvasService.ts`                            | gỡ `synthesizeCrossDomainGoalCanvas`         |
| Sửa  | `packages/core-personal/actionCanvasService.test.ts`                       | fixture tay thay khung mẫu                   |
| Sửa  | `packages/core-db/featureState.ts`                                         | `tryAcquireFeatureLock`/`releaseFeatureLock` |
| Sửa  | `packages/core-db/featureState.test.ts`                                    |                                              |
| Sửa  | `apps/server/src/api/platform/action-canvas.ts`                            | nhánh `synthesize` mới                       |
| Sửa  | `apps/server/src/api/platform/action-canvas.test.ts`                       |                                              |
| Thêm | `apps/server/src/api/platform/action-canvas.synthesize.test.ts`            | mock AI: hỏng/vòng/hết lượt/injection/đua    |
| Sửa  | `apps/dhcb/src/lib/actionCanvasApi.ts`                                     | union kết quả + Zod response                 |
| Sửa  | `apps/dhcb/src/lib/actionCanvasApi.test.ts`                                |                                              |
| Thêm | `apps/dhcb/src/lib/actionCanvasProposal.ts`                                | áp chỉnh sửa trước khi lưu                   |
| Thêm | `apps/dhcb/src/lib/actionCanvasProposal.test.ts`                           |                                              |
| Sửa  | `apps/dhcb/src/components/ActionCanvas/CanvasAiOrchestratorModal.tsx`      | 4 trạng thái + xem lại                       |
| Thêm | `apps/dhcb/src/components/ActionCanvas/CanvasAiOrchestratorModal.test.tsx` |                                              |
| Sửa  | `apps/dhcb/src/pages/companion/ActionCanvas.tsx`                           | lưu đề xuất / tự bắt đầu                     |
| Sửa  | `apps/dhcb/src/pages/companion/ActionCanvas.test.tsx`                      |                                              |
| Thêm | `scripts/eval-action-canvas.ts`                                            | eval tốn phí, chạy tay                       |
| Thêm | `scripts/eval-action-canvas-fixtures.json`                                 | 10 ca, 3 ca injection có canary              |
| Thêm | `scripts/lib/actionCanvasScoring.ts`                                       | bộ chấm dùng lại bộ kiểm production          |
| Thêm | `scripts/lib/actionCanvasScoring.test.ts`                                  |                                              |
| Thêm | `scripts/evalActionCanvasFixtures.test.ts`                                 | fixture hợp lệ (miễn phí)                    |
| Sửa  | `package.json`                                                             | `eval:action-canvas`                         |

**Ảnh hưởng lan ra (theo codemap):** `featureState.ts` — 20 file import (chỉ THÊM export, mock
cũ của các handler khác không đổi). `actionCanvasService.ts` — chỉ handler `action-canvas.ts` và
test. Trang `/action-canvas` nằm trong cổng `e2e/a11y.spec.ts` (trạng thái ban đầu không đổi cấu trúc).

## ③ Hợp đồng dữ liệu

**Vào:**

```ts
// POST /api/action-canvas?action=synthesize  (Bearer token)
{ goalPrompt: string /* làm sạch: bỏ ký tự điều khiển, gộp khoảng trắng; 3..300 ký tự */,
  canvasId?: string /* UUID, lạ ⇒ id mặc định */ }
// Model PHẢI trả (đã kiểm ở goalDecomposition.ts):
{ steps: Array<{ key: `s${n}`; title: string; detail?: string;
  domain: 'learning' | 'work' | 'general'; dependsOn?: string[] }> } // 2..8, DAG, sâu ≤ 4
```

**Ra:**

```ts
200 { success: true, source: 'ai', proposal: ActionCanvasState } // CHƯA lưu
```

**Ca lỗi (là một phần hợp đồng, không phải phụ lục):**

| Tình huống                                  | Mã lỗi                             | Hành vi mong đợi                                                 |
| ------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| Chưa đăng nhập                              | 401                                | không khoá, không trừ lượt                                       |
| Quá 10 lần/phút/IP                          | 429 `rate_limited`                 | không trừ lượt                                                   |
| Mục tiêu rỗng/ngắn/sai kiểu                 | 400 `invalid_goal`                 | không khoá, không trừ lượt                                       |
| Đang có request khác của cùng user          | 409 `synthesis_in_progress`        | không gọi AI, không trừ lượt                                     |
| Hết lượt / cầu dao AI / không xác minh lượt | 429 `usage_limit` (+ `message`)    | không gọi AI; giao diện mời tự bắt đầu                           |
| Không provider nào trả lời                  | 503 `ai_unavailable`               | HOÀN lượt (đúng ngày đã trừ)                                     |
| Đầu ra hỏng (JSON/khuôn/vòng/sâu/link…)     | 502 `ai_invalid_output` + `reason` | HOÀN lượt; không trả nguyên văn đầu ra; KHÔNG khung mẫu thay thế |
| Lỗi bất ngờ sau khi đã trừ                  | 500                                | HOÀN lượt, nhả khoá                                              |

## ④ Tiêu chí chấp nhận

- [x] Đầu ra hỏng (JSON hỏng, văn xuôi, vòng, quá số nút, link, trường lạ, miền đã xoá) ⇒ 502 +
      hoàn lượt đúng ngày, không lưu — `npx vitest run apps/server/src/api/platform/action-canvas.synthesize.test.ts`
- [x] Hết lượt ⇒ 429, không gọi AI, không hoàn — cùng file.
- [x] Hai request đua ⇒ 1 lời gọi AI, 1 lần trừ, request sau 409 — cùng file.
- [x] Injection trong mục tiêu: một cặp rào duy nhất, thẻ đóng giả bị vô hiệu; model "nghe lời" chèn
      link/hành động ⇒ bị từ chối — cùng file + `actionCanvasPrompt.test.ts`.
- [x] Đề xuất qua hợp đồng lưu; chỉnh sửa người dùng vẫn lưu được — `goalDecomposition.test.ts`,
      `actionCanvasProposal.test.ts`.
- [x] Giao diện 4 trạng thái + xác nhận trước khi lưu — `CanvasAiOrchestratorModal.test.tsx`,
      `ActionCanvas.test.tsx`; ảnh Tầng 8b 1440 + 390 × blue-sky + dark-blue, axe AA 0 vi phạm trong hộp thoại.
- [ ] Eval thật trên model production sạch bất biến — `npm run eval:action-canvas` (chủ dự án chạy
      tay với key; KHÔNG chạy trong CI).

**Lệnh chứng minh:**

```bash
rm -rf packages/*/dist dist dist-server && npm run typecheck && npm run lint && npm test
npm run check:sql && npm run check:specs
npm run eval:action-canvas   # tốn phí, cần key trong .env
```

## ⑤ Bất biến không được phá

| Bất biến                                                    | Test nào canh nó                                                |
| ----------------------------------------------------------- | --------------------------------------------------------------- |
| Không giao kết quả ⇒ không mất lượt                         | `apps/server/src/api/platform/action-canvas.synthesize.test.ts` |
| Đề xuất không tự lưu; chỉ lưu qua nhánh lưu thường          | `apps/server/src/api/platform/action-canvas.synthesize.test.ts` |
| Đầu ra AI là DAG trong trần, miền chỉ learning/work/general | `packages/core-personal/goalDecomposition.test.ts`              |
| Prompt không bị sửa không chủ đích; không nhắc trụ đã xoá   | `packages/core-personal/actionCanvasPrompt.test.ts`             |
| Không còn khung mẫu "Ví dụ" cố định                         | `packages/core-personal/actionCanvasService.test.ts`            |
| Canvas cũ có miền career/startup/life vẫn đọc/lưu được      | `apps/server/src/api/platform/action-canvas.test.ts`            |

## ⑥ Quy ước dự án liên quan

- Mọi lệnh gọi AI qua `checkAndConsumeUsage` (fail-closed) + hoàn bằng `refundUsage(…, gate.day)`.
- Prompt dựng ở server, tách file; sửa prompt ⇒ cập nhật snapshot có chủ đích + chạy eval tốn phí,
  dán kết quả vào PR (CLAUDE.md §8).
- Import xuyên gói `@dhcb/<gói>/<file>` không đuôi `.js`; nội bộ gói dùng đường tương đối có `.js`.
- Chữ nội dung AAA, điều khiển AA; màu qua token/`theme-light:`; vùng chạm ≥ 44px.

---

## Nghiệm thu (bên giao việc điền SAU khi nhận kết quả)

- Lệnh đã chạy + kết quả thật: xem `docs/changelog/0549-2026-10-09-action-canvas-phan-ra-muc-tieu-ai.md`.
- Tiêu chí ④ đạt hết chưa; cái nào chưa và vì sao: eval thật chờ chủ dự án chạy với key.
- Có phá bất biến ⑤ nào không:
- Có mở rộng ngoài phạm vi ① không:
- Còn để ngỏ:
