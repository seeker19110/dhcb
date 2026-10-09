---
name: life-career-strategic-advisor
description: 'Rào chắn & phạm vi còn lại của mảng "chiến lược cuộc sống/sự nghiệp" sau khi ba trụ Career · Startup · Life bị xoá: Action Canvas, sổ quyết định (Decision Ledger), mục tiêu/đồ thị cá nhân. Kích hoạt khi có yêu cầu về định hướng sự nghiệp, khởi nghiệp, đời sống, tổng hợp đa miền, hoặc khi đụng Action Canvas / Decision Ledger / life-goals.'
---

# LIFE & CAREER — PHẠM VI CÒN LẠI VÀ RÀO CHẮN

> **Đọc trước tiên.** Ba trụ **Career · Startup · Life đã XOÁ HẲN ngày 2026-09-20** theo quyết định
> chủ dự án (ADR-0010): giao diện, service, route API và bảng CSDL — migration
> `postgres/migrations/0085_drop_career_startup_life.sql`.
>
> Studio "Tổng kết" / Life Synthesis **đã gỡ** (changelog 0475) vì hiện điểm bịa cho mọi người dùng;
> từ changelog 0550 nó quay lại dưới dạng khối "30 ngày qua của bạn" trong studio "Kế hoạch", CHỈ
> đếm bản ghi thật của Học tập + Ghi chú (xem mục 1).
>
> Bản trước của skill này mô tả cả bộ máy cố vấn 5 miền như đang chạy. Khi skill và mã lệch nhau,
> **MÃ thắng**.

---

## 1. RÀO CHẮN — ĐỪNG DỰNG LẠI KHI CHƯA CÓ QUYẾT ĐỊNH MỚI

- Yêu cầu kiểu "thêm tư vấn sự nghiệp / chấm CV / lập kế hoạch khởi nghiệp / theo dõi đời sống" là
  **quyết định sản phẩm lớn**, đảo ngược một ADR → dừng và hỏi chủ dự án (CLAUDE.md mục 12). Không
  tự dựng lại dưới tên khác.
- Thấy mã còn sót **miền đã xoá** (`career`/`startup`/`life`) thì ghi nợ hoặc gỡ, không mở rộng
  thêm. `classifyIntentEdge` và mẫu nút Action Canvas đã gỡ ở changelog 0485;
  `lifeSynthesisService.ts` viết lại sạch ở changelog 0550.
- **Không hiển thị điểm tổng hợp "cuộc sống"** (HAS / LSI / CRS, xác suất về đích, %, x/100).
  `GET /api/life-synthesis` (`packages/core-personal/lifeSynthesisService.ts`, hợp đồng v2 strict
  `packages/core-contracts/lifeSynthesis.ts`) chỉ trả PHÉP ĐẾM trong 30 ngày (ngày có học, chuỗi
  ngày, bài hoàn thành lần đầu, số việc/ghi chú) + câu nhận xét/khuyến nghị sinh TẤT ĐỊNH theo luật
  có `ruleId`, không gọi AI; POST trả 405 (không nhận số client tự khai). Thêm luật câu chữ thì
  thêm ca biên hai phía + giữ phép quét `findForbiddenLanguage` trong
  `lifeSynthesisService.test.ts`. Đặc tả: `docs/specs/2026-10-09-tong-hop-da-mien-du-lieu-that.md`.
- Luật năng lực cá nhân vẫn áp dụng nếu có ngày quay lại mảng này:
  - giới tính KHÔNG là trục kỳ vọng năng lực;
  - kết quả chẩn đoán KHÔNG bao giờ là màn hình chính (CLAUDE.md mục 2, bộ tài liệu
    `docs/research/*-2026-08-23.md`).

---

## 2. ACTION CANVAS — ĐANG CÓ

`packages/core-personal/actionCanvasService.ts`, trang `/action-canvas`, component
`apps/dhcb/src/components/ActionCanvas/`. Lối vào duy nhất là banner cuối studio "Kế hoạch".

- Chưa lưu canvas nào → `GET /api/action-canvas` trả `createEmptyCanvas` (không thẻ); trang hiện
  màn hướng dẫn với hai lối "Tạo sơ đồ từ mục tiêu" / "Thêm thẻ" (changelog 0495, audit M11).
  **Đừng** quay lại tự dựng thẻ mẫu cho người chưa yêu cầu.
- "Tạo sơ đồ từ mục tiêu" là **AI ĐỀ XUẤT phân rã thật** (changelog 0549, đặc tả
  `docs/specs/2026-10-09-action-canvas-phan-ra-muc-tieu-ai.md`): server gọi AI có đếm lượt, kiểm
  đầu ra (DAG, trần bước/độ sâu/độ dài), trả đề xuất **chưa lưu**; người dùng bỏ/sửa bước rồi tự
  bấm Lưu. Thẻ AI: Bản nháp · người làm Bạn · tag `ai-de-xuat`; giao diện ghi rõ "đề xuất của AI".
  Hết lượt/không muốn dùng AI ⇒ tự bắt đầu với thẻ mục tiêu. Khung mẫu cố định
  `synthesizeCrossDomainGoalCanvas` (4 thẻ "Ví dụ") **đã gỡ** — đừng dựng lại, và đừng rơi về
  khuôn cố định khi AI lỗi (báo lỗi thật + hoàn lượt).
- Prompt (`packages/core-personal/actionCanvasPrompt.ts`) chỉ giới thiệu hai khu vực còn thật (Học
  tập, Ghi chú); mục tiêu về việc làm/kinh doanh/sức khoẻ vẫn chia bước với miền `general`, KHÔNG
  giới thiệu trụ đã xoá. Miền `career`/`startup`/`life` trong đầu ra AI bị TỪ CHỐI (khác với canvas
  cũ đã lưu — cái đó vẫn được đổi về `general` khi đọc).
- Nhãn hiển thị (miền/trạng thái/người làm) lấy từ `CANVAS_*_LABELS` trong hợp đồng — không in mã
  enum thô ra giao diện hay bản xuất Markdown.
- Miền của nút (`CanvasDomainSchema`): chỉ `learning` · `work` (Ghi chú) · `general`. Canvas lưu từ
  trước có `career`/`startup`/`life` được hợp đồng đổi về `general` khi đọc — **đừng** bỏ bước đổi
  này (lưu lại canvas cũ sẽ lỗi 400).
- `autoLayoutCanvasNodes` xếp bố cục cây chống chồng lấn.
- `exportCanvasToMarkdown` xuất Markdown.
- Sửa canvas thì giữ nhãn trung thực: thẻ AI là **đề xuất** người dùng đã duyệt, không phải
  kế hoạch AI "đã phân tích" hay "sẽ làm hộ".

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
