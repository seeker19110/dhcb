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

## 2. STUDIO ĐIỀU PHỐI AGENT — HIỆN LÀ DỰNG SẴN

`packages/core-personal/agentOrchestratorService.ts` (API
`apps/server/src/api/platform/agent-orchestrator.ts`), giao diện `AgentOrchestratorCard` +
`AgentOrchestratorModal` (cuối studio "Kế hoạch").

- **Thực tế:** 5 bước Plan → Execute → Verify → Reflect → Handoff được **dựng sẵn**:
  - mọi bước `completed`;
  - số token và chi phí gán cứng;
  - kết quả soạn sẵn (vd "Bảng đối soát 100% tiêu chí đạt chuẩn");
  - **không có lệnh gọi AI nào**.

  Nợ 🔴 trong `PROGRESS.md`.

- **Luật:** không thêm hiển thị "agent đã chạy/đã kiểm" nào nữa khi chưa có thực thi thật. Làm thật
  thì mỗi bước phải:
  - gọi AI qua đếm lượt (`checkAndConsumeUsage`);
  - parse kết quả bằng Zod;
  - ghi trạng thái **đúng như đã xảy ra**, kể cả thất bại.
- Cấu hình giới hạn đã có trong hợp đồng (`budgetGuardrail`: `maxTokens`, `maxCostUsd`,
  `maxExecutionSeconds`, `allowExternalTools`, `requireHumanApprovalAboveRisk`) — dùng lại khi
  làm thật.

---

## 3. GOAL AUTOPILOT & NUDGE

`apps/dhcb/src/components/ProactiveAgent/GoalAutoPilotCard.tsx` và `ProactiveNudgeBanner` hiển
thị kế hoạch và gợi ý từ trạng thái proactive của Companion (studio "Kế hoạch").

Mọi hành động 1-chạm dẫn tới trang/tính năng có thật — không mở luồng thực thi ngầm.

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
