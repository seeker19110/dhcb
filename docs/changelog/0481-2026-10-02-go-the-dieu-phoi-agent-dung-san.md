# 0481 — Gỡ thẻ "Studio Điều Phối Agent Tự Trị": thôi hiện phiên agent DỰNG SẴN như đã chạy thật (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** (điền sau khi tạo) · **Loại:** `fix(companion)`.
- **Quyết định:** chủ dự án chọn "Ẩn thẻ" (2026-10-02), xử lý nợ 🔴 phát hiện ở changelog 0480.

## Vấn đề

Ở studio "Kế hoạch" của Bạn Đồng Hành, bấm "Khởi chạy Agent" thì
`packages/core-personal/agentOrchestratorService.ts` trả về một phiên **dựng sẵn**:

- 5 bước Plan → Execute → Verify → Reflect → Handoff luôn ở trạng thái `completed`;
- số token và chi phí USD gán cứng theo vai;
- kết quả soạn sẵn, ví dụ "Bảng đối soát 100% tiêu chí đạt chuẩn".

Không có lệnh gọi AI nào, nhưng giao diện trình bày như agent đã chạy thật. Cùng họ lỗi với bảng
nháp STEM (0473) và studio Tổng kết (0475). Thẻ này còn vừa được dời sang "Kế hoạch" ở 0475
(PR #1210) mà lúc đó chưa kiểm tính trung thực.

## Đã làm

- **Giao diện:** gỡ thẻ khỏi `StudioProactive.tsx`; xoá `AgentOrchestratorCard.tsx`,
  `AgentOrchestratorModal.tsx` và client `apps/dhcb/src/lib/agentOrchestratorApi.ts` (+ test).
- **Server:** `/api/agent-orchestrator` GET/POST nay trả **501 `AGENT_ORCHESTRATOR_UNAVAILABLE`**
  kèm lời giải thích, theo đúng khuôn `/api/life-synthesis` ở 0475. Giữ route để client cũ nhận
  lỗi rõ thay vì 404.
- **Xoá service dựng sẵn và hợp đồng của nó:** `agentOrchestratorService.ts` (+ test),
  `packages/core-contracts/agentOrchestrator.ts` (+ test).
  - Không phần nào giữ lại được: toàn bộ kết quả là soạn sẵn.
  - Enum vai của hợp đồng còn chứa `career_strategist` / `venture_validator` / `life_concierge`
    của ba trụ đã xoá.
  - Làm thật về sau thì viết đặc tả mới; rào chắn bắt buộc đã ghi ở skill
    `autonomous-agent-orchestrator` mục 4.
- **Dữ liệu cũ:** các phiên dựng sẵn đã lưu ở `platform.feature_state` (feature
  `agent_orchestrator`) **không xoá** trong PR này — không còn ai đọc, và xoá dữ liệu người dùng là
  thao tác không hoàn tác.
- **Skill:** `ui-ux` (hai bản gương) bỏ thẻ khỏi mô tả studio "Kế hoạch", thêm vào mục "Đã GỠ".

## Phát hiện thêm khi chụp ảnh Tầng 8b (ghi nợ, chưa sửa)

🔴 **Thẻ "Wearables & Circadian Bio-Adaptive MCP" cũng hiện số liệu bịa.**

- `WearablesSyncCard.tsx` gửi lên server HRV, nhịp tim nghỉ, điểm giấc ngủ, phút ngủ sâu đều sinh
  bằng `Math.random()`.
- Thẻ hiện huy hiệu "BIO-SYNC ACTIVE" cùng các nút Apple HealthKit / Oura / Garmin.
- Không có tích hợp thiết bị nào.

Chờ chủ dự án chọn hướng.

## Bằng chứng

- Test:
  - `CompanionStudios.test.tsx`: ca mới "StudioProactive không còn thẻ Agent, vẫn giữ lối vào
    Action Canvas" render thẻ thật (đã bỏ mock), nên test sẽ đỏ nếu thẻ quay lại.
  - `agent-orchestrator.test.ts`: GET/POST trả 501, không có `session`/`sessions`; 401 khi chưa
    đăng nhập; 204 cho OPTIONS; 405 cho phương thức khác.
- Cổng: `typecheck` sạch (đã xoá `packages/*/dist`, `dist`, `dist-server` trước), `lint` 0 cảnh
  báo, `test:coverage` xanh.
- Tầng 8b — ảnh studio "Kế hoạch" trước/sau ở 1440px và 390px:
  - thẻ Agent biến mất;
  - banner Action Canvas vẫn là thẻ cuối;
  - không có khoảng trống hay lệch bố cục.
