# 0480 — Chuyển skill đợt 4 (cuối): `autonomous-agent-orchestrator` · `gamification-viral-growth-architect` · `life-career-strategic-advisor` — đủ 11/11 (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** #1215 · **Loại:** `chore(skills)`.
- **Nối tiếp:** các đợt 0477 (#1212), 0478 (#1213), 0479. Đợt này hoàn tất đề xuất (1) của đợt 2
  tích hợp ECC: **11/11 skill** đã ở `.claude/skills/`, bản gương trùng từng byte ở `.agents/skills/`.

## Kết quả rà từng skill (đối chiếu mã 2026-10-02)

### `autonomous-agent-orchestrator`

| Bản cũ khẳng định                                               | Thực tế                                                                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Đồng thuận Delphi 4 chuyên gia `multiAgentConsensusService.ts`  | Không tồn tại                                                                                                                   |
| Tổng hợp công cụ động + sandbox AST `dynamicToolSynthesizer.ts` | Không tồn tại                                                                                                                   |
| "Hợp nhất trí nhớ REM" chạy đêm                                 | Không tồn tại                                                                                                                   |
| Vòng lặp 5 bước có kiểm chứng, trần $0,02/phiên                 | `agentOrchestratorService.ts` **dựng sẵn**: 5 bước luôn `completed`, token/chi phí gán cứng, kết quả soạn sẵn, **không gọi AI** |

Bản mới đặt **ProposedAction** (đề xuất → người dùng xác nhận → mới thực thi) làm nền, vì đây là cơ
chế tác tử chạy thật. Mục 4 ghi rào chắn bắt buộc cho mọi vòng lặp tự chạy khi làm thật: giới hạn
bước, đếm lượt fail-closed, người xác nhận, Zod, và trung thực trạng thái.

### `gamification-viral-growth-architect`

| Bản cũ khẳng định                                               | Thực tế                                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Ghép cặp người thật trước, đối thủ AI sau 2,5 s                 | **Chỉ có đối thủ AI** (danh sách nhân vật cố định, Elo ±35)                 |
| Referral `referralVipService.ts`, mốc 1/3/5/10 bạn + huy hiệu   | `apps/server/src/api/_lib/referral.ts`, 7 ngày cho cả hai; **không có** mốc |
| `dailyQuestsService.ts`: 3 nhiệm vụ ngày → rương → vé đóng băng | `quests.ts`: 4 nhiệm vụ, 2 nhiệm vụ thưởng 0 ngày; **không có** rương/vé    |
| `ViralShareCardGenerator.tsx` (Story Canvas 1080×1920, QR)      | Không tồn tại                                                               |
| Elo FIDE K = 32                                                 | Đúng (`kFactor = 32`)                                                       |

### `life-career-strategic-advisor`

Skill mô tả bộ máy cố vấn 5 miền (HAS/LSI/CRS, dự báo về đích), trong khi ba trụ Career · Startup ·
Life đã xoá (ADR-0010, migration 0085) và studio Tổng kết đã gỡ (0475). Bản mới **giữ tên** nhưng
đổi vai thành **rào chắn + phạm vi còn lại**:

- yêu cầu dựng lại tư vấn sự nghiệp/khởi nghiệp/đời sống là quyết định lớn, đảo ngược một ADR →
  dừng và hỏi;
- liệt kê các chỗ mã còn sót miền đã xoá;
- mô tả đúng Action Canvas (dựng từ mẫu, không phải AI phân tích), Decision Ledger (có API, chưa có
  giao diện), life-goals/life-graph (cố ý giữ).

### Cập nhật CLAUDE.md §2.1

Bản cũ ghi "skill ở `.agents/skills/`, Claude Code không nạp, đang rà". Bản mới ghi:

- 11 skill ở `.claude/skills/`, được tự nạp;
- khi lệch thì **mã thắng**;
- bản gương ở `.agents/skills/` + cổng `skills-mirror`;
- sửa skill thì sửa cả hai bản.

Độ dài CLAUDE.md: 31.882 ký tự, dưới trần 34.000.

## Phát hiện lỗi SẢN PHẨM khi rà (ghi nợ, chưa sửa trong PR này)

1. 🔴 **"Studio Điều Phối Agent Tự Trị" hiện kết quả dựng sẵn như agent đã chạy thật.** Bấm
   "Khởi chạy Agent" → 5 bước "completed", token và chi phí gán cứng, "Bảng đối soát 100% tiêu chí
   đạt chuẩn". Không có lệnh gọi AI nào.
   - Thẻ này vừa được dời sang studio "Kế hoạch" ở 0475 (PR #1210) — lúc đó chưa kiểm tính trung
     thực của nó, đây là thiếu sót.
2. 🔴 **Đấu trường PvP không cho biết đối thủ là AI.** Màn trận đấu chỉ hiện tên kiểu người thật
   ("Elena Oxford 🇬🇧", "Minh Cambridge") + avatar, trong khi **chỉ có** đối thủ AI.
3. 🟡 **Action Canvas** dựng nút gán vào miền `career`/`life` đã xoá.

## Bằng chứng

- `scripts/skills-mirror.test.ts`: **35/35** xanh — 11 skill × 3 ca + 2 ca chung. Tập skill ở
  `.claude/skills/` và `.agents/skills/` trùng nhau.
- Script nháp soát định danh: các mục bị báo chỉ là route/lệnh (`/api/proposed-actions`,
  `/action-canvas`…).
- `scripts/claude-md-split.test.ts` xanh (trỏ §X hợp lệ, dưới trần); `npm run check:docs` xanh.
- Đã đọc trực tiếp các file trước khi viết:
  - `agentOrchestratorService.ts`, `proposedActionService.ts`;
  - `pvpArenaService.ts`, `PvPBattlefieldModal.tsx`;
  - `referral.ts`, `quests.ts`;
  - `actionCanvasService.ts`, `decisionRecord.ts`.
    ADR-0010 và migration 0085 có tồn tại.
