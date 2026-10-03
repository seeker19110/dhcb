---
name: life-career-strategic-advisor
description: 'Rào chắn & phạm vi còn lại của mảng "chiến lược cuộc sống/sự nghiệp" sau khi ba trụ Career · Startup · Life bị xoá: Action Canvas, sổ quyết định (Decision Ledger), mục tiêu/đồ thị cá nhân. Kích hoạt khi có yêu cầu về định hướng sự nghiệp, khởi nghiệp, đời sống, tổng hợp đa miền, hoặc khi đụng Action Canvas / Decision Ledger / life-goals.'
---

# LIFE & CAREER — PHẠM VI CÒN LẠI VÀ RÀO CHẮN

> **Đọc trước tiên.** Ba trụ **Career · Startup · Life đã XOÁ HẲN ngày 2026-09-20** theo quyết định
> chủ dự án (ADR-0010): giao diện, service, route API và bảng CSDL — migration
> `postgres/migrations/0085_drop_career_startup_life.sql`.
>
> Studio "Tổng kết" / Life Synthesis cũng **đã gỡ** (changelog 0475), vì nó hiện điểm bịa cho mọi
> người dùng.
>
> Bản trước của skill này mô tả cả bộ máy cố vấn 5 miền như đang chạy. Khi skill và mã lệch nhau,
> **MÃ thắng**.

---

## 1. RÀO CHẮN — ĐỪNG DỰNG LẠI KHI CHƯA CÓ QUYẾT ĐỊNH MỚI

- Yêu cầu kiểu "thêm tư vấn sự nghiệp / chấm CV / lập kế hoạch khởi nghiệp / theo dõi đời sống" là
  **quyết định sản phẩm lớn**, đảo ngược một ADR → dừng và hỏi chủ dự án (CLAUDE.md mục 12). Không
  tự dựng lại dưới tên khác.
- Thấy mã còn sót **miền đã xoá** (`career`/`startup`/`life`) thì ghi nợ hoặc gỡ, không mở rộng
  thêm. `classifyIntentEdge` và mẫu nút Action Canvas đã gỡ ở changelog 0485. Chỗ sót còn biết:
  `packages/core-personal/lifeSynthesisService.ts` (không còn được gọi, giữ có cảnh báo).
- **Không hiển thị điểm tổng hợp "cuộc sống"** (HAS / LSI / CRS, xác suất về đích) khi chưa có nguồn
  dữ liệu hoạt động thật. `/api/life-synthesis` hiện trả 501 có chủ đích.
- Luật năng lực cá nhân vẫn áp dụng nếu có ngày quay lại mảng này:
  - giới tính KHÔNG là trục kỳ vọng năng lực;
  - kết quả chẩn đoán KHÔNG bao giờ là màn hình chính (CLAUDE.md mục 2, bộ tài liệu
    `docs/research/*-2026-08-23.md`).

---

## 2. ACTION CANVAS — ĐANG CÓ

`packages/core-personal/actionCanvasService.ts`, trang `/action-canvas`, component
`apps/dhcb/src/components/ActionCanvas/`. Lối vào duy nhất là banner cuối studio "Kế hoạch".

- `synthesizeCrossDomainGoalCanvas` dựng đồ thị nút **từ mẫu** theo câu mục tiêu:
  `goal` → `task` → `decision_bridge`. Đây không phải phân tích AI — giao diện gọi là "bản nháp sơ
  đồ từ khung mẫu" (changelog 0485).
- Miền của nút (`CanvasDomainSchema`): chỉ `learning` · `work` (Ghi chú) · `general`. Canvas lưu từ
  trước có `career`/`startup`/`life` được hợp đồng đổi về `general` khi đọc — **đừng** bỏ bước đổi
  này (lưu lại canvas cũ sẽ lỗi 400).
- `autoLayoutCanvasNodes` xếp bố cục cây chống chồng lấn.
- `exportCanvasToMarkdown` xuất Markdown.
- Sửa canvas thì giữ nhãn trung thực: đồ thị là **khung gợi ý**, không phải kế hoạch được AI
  "phân tích".

---

## 3. SỔ QUYẾT ĐỊNH (DECISION LEDGER) — CÓ API, CHƯA CÓ GIAO DIỆN

- Hợp đồng `packages/core-contracts/decisionRecord.ts`, API
  `apps/server/src/api/personal/decision-ledger.ts`.
- Trạng thái quyết định: `open` → `decided` → `review_due` → `reviewed` (hoặc `superseded`).
- Sổ lưu **artifact quyết định có nguồn gốc**, không lưu toàn bộ chat. `assumptions`/`evidence`
  trỏ tới nguồn qua `EvidenceRef`, không chép nội dung thô.
- Khung ghi một quyết định tốt:
  - bối cảnh & giả định;
  - ít nhất 2 phương án;
  - đánh đổi chấp nhận;
  - mốc xem lại (30/90/180 ngày).
- Xoá dữ liệu cá nhân phải đi qua `packages/core-personal/personErasureService.ts` (đã gồm sổ quyết
  định).

---

## 4. MỤC TIÊU & ĐỒ THỊ CÁ NHÂN

`/api/life-goals`, `/api/life-graph` (`apps/server/src/api/personal/`) và bảng
`personal.life_graph_*` được **cố ý giữ lại**.

Lý do: đây là đồ thị cá nhân/học tập, không phải trụ "Đời sống". Learning goal chiếu vào đó, và
`contextEngine` đọc theo consent `life_graph`.

Xoá phần này sẽ gãy luồng Learning + Companion — đang chờ quyết định riêng (ghi trong
`PROGRESS.md`).
