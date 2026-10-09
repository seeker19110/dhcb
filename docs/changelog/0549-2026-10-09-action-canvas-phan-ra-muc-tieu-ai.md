# 0549 — Action Canvas: AI đề xuất phân rã mục tiêu thật, gỡ khung mẫu cố định (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `feat(action-canvas)`
- **Đặc tả:** `docs/specs/2026-10-09-action-canvas-phan-ra-muc-tieu-ai.md` (Approved for
  implementation — chủ dự án duyệt hướng "chất lượng cao nhất" 2026-10-09).
- **Nguồn:** nợ `PROGRESS.md` "Action Canvas 'tạo sơ đồ từ mục tiêu' chỉ là KHUNG MẪU cố định"
  (phát hiện ở `0485`).

## Vì sao

"Tạo sơ đồ từ mục tiêu" luôn dựng cùng 4 thẻ "Ví dụ" bất kể người dùng gõ gì. Nhãn đã trung thực
(`0485`, `0495`) nhưng tính năng không làm đúng việc tên nó hứa.

## Đã làm

**Server — `POST /api/action-canvas?action=synthesize`** (`apps/server/src/api/platform/action-canvas.ts`):

| Bước | Rào chắn                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------ |
| 1    | rate limit 10/phút/IP (`action-canvas-ai`) + 5/phút/user (`action-canvas-ai:user`, xem vòng sửa) |
| 2    | Zod body: mục tiêu làm sạch (bỏ ký tự điều khiển/đảo chiều, gộp khoảng trắng), 3–300 ký tự       |
| 3    | khoá theo user `action_canvas_ai_lock` (Postgres, hết hạn 120 giây) — đang giữ ⇒ 409             |
| 4    | `checkAndConsumeUsage(userId, 'chat')` — chung hạn mức AI/ngày (Free 30), trừ nguyên tử          |
| 5    | ĐÚNG 1 lời gọi `generateChatText`, `maxTokens` 1200, nhãn chi phí `action_canvas`, không thử lại |
| 6    | `parseGoalDecomposition`: Zod strict + DAG + độ sâu + link; hỏng ⇒ 502 + **hoàn lượt**           |
| 7    | dựng đề xuất (`buildProposalCanvas`) qua `ActionCanvasStateSchema`; trả về, **KHÔNG lưu**        |
| —    | provider không trả lời ⇒ 503 + hoàn; lỗi bất ngờ sau khi trừ ⇒ 500 + hoàn; khoá nhả ở `finally`  |

**Thiết kế đếm lượt (quyết định trong ranh giới đặc tả):**

- Đếm vào cột `chat` (như Companion, ambient-vision, vision-solve) — KHÔNG thêm cột
  `daily_usage.*_count` vì phải có migration + sửa hàm SQL `consume_usage_total` + `AI_USAGE_COLUMNS`;
  chi phí theo tính năng đã tách được qua nhãn token `action_canvas` (`recordAiTokenUsage`).
- Hoàn lượt theo đúng ngày đã trừ (`gate.day`) — khuôn chuẩn của `refundUsage`.
- Chống đua bằng khoá ở Postgres chứ không `Map` in-memory: PM2 nhiều tiến trình thì Map không
  thấy nhau. Dùng lại `platform.feature_state` (upsert có điều kiện `updated_at < now() - ttl`) —
  không bảng/cột/migration mới. Dòng khoá nằm chung bảng nên xoá tài khoản (`accountErasureService`)
  tự xoá theo.

**Prompt riêng** `packages/core-personal/actionCanvasPrompt.ts` (server dựng — cùng lý do với
`feedbackPrompt.ts` của môn Lập trình): mục tiêu bọc rào `<muc_tieu>`, ký tự `<`/`>` của người dùng
đổi thành `‹`/`›` (không thoát rào được); system nói rõ mục tiêu là DỮ LIỆU, AI chỉ đề xuất không
làm hộ, chỉ giới thiệu Học tập + Ghi chú, mục tiêu việc làm/kinh doanh/sức khoẻ gán `general`.

**Bộ kiểm** `packages/core-personal/goalDecomposition.ts`: 2–8 bước, key `s1…`, tiêu đề 2–80, chi tiết
≤ 280, miền CHỈ `learning`/`work`/`general` (miền đã xoá ⇒ từ chối, không đổi hộ như canvas cũ),
≤ 3 phụ thuộc/bước, phụ thuộc có thật/không tự trỏ, **không vòng (Kahn)**, sâu ≤ 4, không link/tên
miền, không trường lạ (vd `actions`), chuỗi thô ≤ 8000 ký tự, nhận đúng một khối rào ```json.

**Giao diện** (`CanvasAiOrchestratorModal.tsx`, `ActionCanvas.tsx`): form (bộ đếm 300 ký tự, 3 mục
tiêu mẫu chỉ thuộc học tập/ghi chú) → hai lối "Đề xuất bằng AI (1 lượt)" / "Tự bắt đầu, không dùng
AI" · đang tải (`role=status`, `aria-busy`, không đóng được — lượt đã trừ) · lỗi (`role=alert`, giữ
câu mục tiêu) · hết lượt (nói thật + "Tự bắt đầu với thẻ mục tiêu") · **xem lại đề xuất**: nhãn "đề
xuất của AI… Chưa có gì được lưu", checkbox giữ/bỏ từng bước, ô sửa tên, "Làm sau: …" → "Lưu vào sơ
đồ" (hỏi trước nếu thay sơ đồ đang có) → lưu qua nhánh lưu THƯỜNG. Bỏ một bước làm-trước thì bước
phụ thuộc được nối lại từ mục tiêu (`apps/dhcb/src/lib/actionCanvasProposal.ts`). Client validate
response bằng Zod và phân loại kết quả (`ok`/`quota`/`busy`/`invalid`/`error`).

**Gỡ khung mẫu** `synthesizeCrossDomainGoalCanvas` — KHÔNG giữ làm "mẫu ví dụ". Lý do: lối không
dùng AI đã có hai đường trung thực (thẻ mục tiêu tự dựng, "Thêm thẻ"); giữ 4 thẻ "Ví dụ" cố định
cạnh kết quả AI chỉ làm người dùng lẫn đâu là phân tích, đâu là khuôn — đúng lỗi của nợ gốc.

**Eval:**

- CI (miễn phí): golden snapshot prompt (`actionCanvasPrompt.test.ts` + `__snapshots__/`), test bộ
  kiểm (`goalDecomposition.test.ts`, 22 kiểu đầu ra hỏng), test bộ chấm
  (`scripts/lib/actionCanvasScoring.test.ts`), test fixture (`scripts/evalActionCanvasFixtures.test.ts`).
- Tốn phí, chạy TAY: `npm run eval:action-canvas` (`scripts/eval-action-canvas.ts`, 10 ca, 3 ca
  prompt injection có canary). Chấm bằng chính bộ kiểm production + tiếng Việt + không giới thiệu trụ
  đã xoá + không lộ canary + liên quan mục tiêu. **Chưa chạy lần nào** — không đọc `.env`, không gọi
  API thật trong đợt này.

**Tài liệu:** skill `autonomous-agent-orchestrator` (mục 3b mới) + `life-career-strategic-advisor`
(§2) — cả `.claude/skills` lẫn gương `.agents/skills`; `CLAUDE.md` §8 thêm một câu về
`eval:action-canvas`; `PROGRESS.md` sửa tại chỗ mục nợ thành ✅ + việc tay.

## Bằng chứng kiểm chứng

- `rm -rf packages/*/dist dist dist-server && npm run typecheck` → exit 0.
- `npm run lint` → exit 0 (0 cảnh báo).
- `npm run codemap -- cycles` → "Không có chu trình import."
- `npx prettier --check` trên mọi file đã sửa → sạch.
- `npm run check:sql` (Postgres 16 cụm tạm cổng 5514, `migrate:pg` 91 migration) → PREPARE 598 câu,
  0 lỗi ngoài allowlist; câu khoá mới nằm trong số đó. Chạy tay câu khoá trên CSDL thật: lần 1 giữ
  được · lần 2 khi còn hạn 0 dòng · khoá cũ 200 giây giữ lại được · nhả rồi giữ được. Cụm đã dọn.
- `npm run check:specs -- --ci` → OK 152 đặc tả; `npm run check:docs` → OK.
- Test mới/sửa (vitest): server synthesize 17 · handler cũ 11 · bộ kiểm + prompt + service +
  featureState 47 · client API/đề xuất/trang/hộp thoại 31 · bộ chấm + fixture 18 — xanh hết. Toàn bộ
  `npm run test:coverage`: xem mục dưới.
- **Tầng 8b** — ảnh 1440 + 390 × blue-sky + dark-blue, trước/sau, ở
  `scratchpad/shots-0549/` (mock API bằng `page.route`, Chromium `/opt/pw-browsers`): trước = màn rỗng ·
  hộp thoại cũ · 4 thẻ "Ví dụ"; sau = màn rỗng (chữ mới) · form · đang tải · xem lại · đã sửa · đã lưu ·
  lỗi · hết lượt · tự bắt đầu. Quét axe trong hộp thoại ở 5 trạng thái × 4 tổ hợp: AA 0 vi phạm, AAA
  `color-contrast-enhanced` 0 vi phạm. Đã tự xem ảnh: phát hiện thẻ mục tiêu "tự bắt đầu" đặt ở
  x=350 nằm ngoài khung nhìn 390px → dời về góc trên-trái (40, 40), chụp lại đã thấy.

## Vòng sửa sau rà bảo mật

Coordinator rà commit `2d967873`: không có mục Cao/Trung, có 2 mục Thấp — đã sửa cả hai.

1. **Khoá không có định danh chủ.** Request A chạy quá TTL 120 giây → B giữ khoá → A xong,
   `finally` của A xoá khoá CỦA B → C lọt vào chạy song song với B. Sửa:
   `tryAcquireFeatureLock` sinh token `crypto.randomUUID()` lưu vào `state` (`{"t": token}`),
   trả token hoặc `null`; `releaseFeatureLock(userId, lockName, token)` chỉ
   `delete … where user_id=$1 and feature=$2 and state->>'t' = $3`. Test mới: nhả bằng token
   cũ không xoá khoá mới, và C sau đó vẫn nhận 409 (`action-canvas.synthesize.test.ts`); đúng SQL
   - token khác nhau mỗi lần (`featureState.test.ts`). Chạy tay trên Postgres 16 thật: A giữ →
     B 0 dòng → A quá hạn, B giữ → A nhả bằng tok-A `DELETE 0`, khoá còn `{"t": "tok-B"}` → C
     0 dòng → B nhả `DELETE 1`. `check:sql` PREPARE cả hai câu mới.
2. **Rate limit chỉ theo IP.** Thêm bucket thứ hai theo người dùng ngay sau `validateAuth`:
   `checkRateLimit(personId, 5, 'action-canvas-ai:user')` (cùng khuôn với
   `cefr-assessment.ts`/`progress.ts`). Đổi IP (4G/VPN) không lách được; người chung IP không ăn
   hạn mức của nhau. Test mới: user vượt hạn mức trong khi IP còn → 429, không khoá, không trừ
   lượt, không gọi AI.

## Rủi ro / còn để ngỏ

- Chất lượng đầu ra trên model production CHƯA đo — chủ dự án chạy `npm run eval:action-canvas`
  với key. Nếu tỉ lệ đầu ra hỏng cao (vd Groq hay bọc văn xuôi quanh JSON), người dùng thấy lỗi
  "không hợp lệ" nhiều (lượt được hoàn nhưng trải nghiệm kém) → sửa prompt theo kết quả eval.
- Một lần đề xuất tốn tối đa ~1200 token đầu ra + ~700 token prompt; không có trần USD/phiên toàn
  hệ thống (skill orchestrator §4.2 — vẫn là nợ chung, không thuộc đợt này).
- Khoá TTL 120 giây giả định chuỗi provider (timeout 30 giây/provider, Groq có thể thử nhiều key) không chạy quá 2 phút; nếu vượt, request thứ hai có
  thể lọt (tối đa trừ 2 lượt, cả hai đều nhận kết quả hoặc được hoàn).
