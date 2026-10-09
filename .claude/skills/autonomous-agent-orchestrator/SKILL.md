---
name: autonomous-agent-orchestrator
description: 'Kỹ năng Nghiệp vụ Tác tử AI trong sản phẩm: đề xuất hành động có xác nhận (ProposedAction), điều phối agent nhiều bước, phân rã mục tiêu (Goal AutoPilot), giới hạn ngân sách/bước và người-xác-nhận. Kích hoạt khi xây hoặc sửa luồng Companion đề xuất/thực thi hành động, studio Điều phối Agent, hoặc bất kỳ vòng lặp AI tự chạy nhiều bước nào.'
---

# AUTONOMOUS AGENT ORCHESTRATION & RELIABILITY

Quy chuẩn cho các tác tử AI **trong sản phẩm** Đồng Hành. Skill này không nói về các subagent của
Claude Code — những cái đó ở `.claude/agents/`.

> **Đối chiếu mã ngày 2026-10-02.** Bản trước của skill này mô tả như ĐÃ CÓ:
>
> - giao thức đồng thuận Delphi 4 chuyên gia (`multiAgentConsensusService.ts`);
> - bộ tổng hợp công cụ động có sandbox AST (`dynamicToolSynthesizer.ts`);
> - "hợp nhất trí nhớ REM" (`remConsolidationService.ts`);
> - trần $0,02/phiên tự hạ model.
>
> **Không cái nào tồn tại.** Khi skill và mã lệch nhau, **MÃ thắng**.

---

## 1. ĐỀ XUẤT HÀNH ĐỘNG CÓ XÁC NHẬN — CÁI ĐANG CHẠY THẬT

`packages/core-personal/proposedActionService.ts` (API `/api/proposed-actions`, hợp đồng
`packages/core-contracts/proposedAction.ts`). Companion **đề xuất**, người dùng **xác nhận/từ
chối** trên giao diện (`handleConfirmAction`/`handleRejectAction` ở trang Bạn Đồng Hành), rồi mới
thực thi.

Nguyên tắc nền: **Lập kế hoạch ≠ Thực thi ≠ Đổi trạng thái**. Đây là ranh giới an toàn chính của
mọi tác tử trong sản phẩm — giữ nguyên khi mở rộng.

---

## 2. STUDIO ĐIỀU PHỐI AGENT — ĐÃ GỠ (changelog 0481)

Bản trước là thẻ cuối studio "Kế hoạch": bấm "Khởi chạy Agent" thì nhận về 5 bước Plan → Execute →
Verify → Reflect → Handoff **dựng sẵn** — mọi bước `completed`, token/chi phí gán cứng, kết quả soạn
sẵn ("100% tiêu chí đạt chuẩn"), **không có lệnh gọi AI nào**. Chủ dự án chọn gỡ (2026-10-02):

- thẻ, hộp thoại, client API, service và hợp đồng đã xoá;
- `apps/server/src/api/platform/agent-orchestrator.ts` giữ route nhưng GET/POST trả **501
  `AGENT_ORCHESTRATOR_UNAVAILABLE`**;
- phiên cũ trong `platform.feature_state` (feature `agent_orchestrator`) chưa xoá.

**Luật:** đừng dựng lại giao diện "agent đã chạy/đã kiểm" nào khi chưa có thực thi thật. Làm thật thì
cần đặc tả mới (`/contract` + `/consult`), và mỗi bước phải:

- gọi AI qua đếm lượt (`checkAndConsumeUsage`);
- parse kết quả bằng Zod;
- ghi trạng thái **đúng như đã xảy ra**, kể cả thất bại;
- có giới hạn token/chi phí/thời gian **được thi hành thật**, không chỉ khai báo trong hợp đồng.

---

## 3. GOAL AUTOPILOT & NUDGE

`apps/dhcb/src/components/ProactiveAgent/GoalAutoPilotCard.tsx` và `ProactiveNudgeBanner` hiển
thị kế hoạch và gợi ý từ trạng thái proactive của Companion (studio "Kế hoạch").

Mọi hành động 1-chạm dẫn tới trang/tính năng có thật — không mở luồng thực thi ngầm.

---

## 3b. ACTION CANVAS — AI ĐỀ XUẤT PHÂN RÃ MỤC TIÊU (ĐANG CHẠY THẬT, changelog 0549)

Mẫu tham chiếu khi làm một tính năng "AI đề xuất, người xác nhận" (đặc tả
`docs/specs/2026-10-09-action-canvas-phan-ra-muc-tieu-ai.md`):

- `POST /api/action-canvas?action=synthesize` — **1 lời gọi** `generateChatText`/lần, trần token
  `GOAL_DECOMPOSITION_MAX_TOKENS`, không tự thử lại; prompt tách file
  `packages/core-personal/actionCanvasPrompt.ts` (mục tiêu bọc rào `<muc_tieu>`, là DỮ LIỆU).
- Lượt: `checkAndConsumeUsage(userId, 'chat')`; **hoàn** khi provider không trả lời, đầu ra hỏng
  hoặc lỗi sau khi trừ. Chống đua: `tryAcquireFeatureLock` (`packages/core-db/featureState.ts`,
  khoá có hạn ở `platform.feature_state`) — request thứ hai 409, không trừ lượt.
- Đầu ra qua `parseGoalDecomposition` (`packages/core-personal/goalDecomposition.ts`): Zod strict,
  2–8 bước, DAG, sâu ≤ 4, không link, miền chỉ `learning`/`work`/`general`. Hỏng ⇒ 502 + hoàn
  lượt, **không** rơi về khung mẫu.
- Đề xuất **không lưu** ở server; người dùng bỏ/sửa bước trong hộp thoại rồi tự bấm Lưu (nhánh lưu
  thường). Không bước nào được thực thi.
- Eval: CI chạy snapshot + test bộ kiểm/bộ chấm (miễn phí); `npm run eval:action-canvas` tốn phí,
  chạy tay khi sửa prompt/bộ kiểm.

---

## 4. RÀO CHẮN BẮT BUỘC CHO BẤT KỲ VÒNG LẶP TỰ CHẠY NÀO (KHI LÀM THẬT)

1. **Giới hạn bước cứng** (vd tối đa 5–10 bước/phiên); cấm đệ quy vô hạn.
2. **Đếm lượt + ngân sách:**
   - mọi lệnh gọi AI qua `checkAndConsumeUsage` (fail-closed);
   - tôn trọng cầu dao `aiCircuitBreaker`;
   - chưa có trần USD/phiên toàn hệ thống — muốn có thì làm thật, đừng chỉ khai báo.
3. **Người xác nhận (human-in-the-loop):** mọi hành động đổi vĩnh viễn dữ liệu người dùng, gửi
   email thật hoặc phát sinh giao dịch **bắt buộc** qua xác nhận trực tiếp (khuôn ProposedAction ở
   mục 1).
4. **Kiểm chứng tất định:** đầu ra AI là dữ liệu thô chưa tin cậy — Zod + luật nghiệp vụ trước khi
   ghi (skill `principal-engineer-architect` mục 5).
5. **Trung thực trạng thái:** bước chưa chạy hoặc chạy hỏng phải hiện đúng như thế. Không bao giờ
   hiện `completed` cho thứ chưa xảy ra.

**CHƯA CÓ — cần đặc tả + `/consult` trước khi làm:**

- đồng thuận nhiều tác tử;
- tổng hợp công cụ động (sinh và chạy mã do AI viết là rủi ro bảo mật cao, cần sandbox thật);
- tác vụ chạy đêm gom ký ức.
