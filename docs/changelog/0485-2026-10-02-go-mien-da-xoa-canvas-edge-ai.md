# 0485 — Gỡ miền đã xoá khỏi Action Canvas và Edge AI, sửa câu "AI phân rã" (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** (điền khi tạo) · **Loại:** `fix(canvas)`.
- **Phạm vi:** trả hai nợ 🟡 ghi ở 0478 (Edge AI) và 0480 (Action Canvas). Chủ dự án giao "làm tất
  cả" (2026-10-02).

## Vấn đề

- Ba trụ Career · Startup · Life đã gỡ ngày 2026-09-20 (migration `0085`), nhưng hai chỗ vẫn dùng
  miền của chúng:
  - **Action Canvas:** mẫu sơ đồ gán nút vào `career`/`life`; nhãn nút hiện chữ "CAREER", "LIFE".
    Nút `life` còn ghi "Giấc ngủ 7.5h", "Focus Score đạt 85+", là những con số không đo từ đâu.
  - **Edge AI:** `classifyIntentEdge` vẫn trả `career`/`startup`/`life`.
- Rà thêm: nút "AI Phân Rã Mục Tiêu" và modal hứa "AI tự động phân rã mục tiêu thành đồ thị 5 miền".
  Thực tế `synthesize` trả **khung mẫu cố định**, không gọi AI.

## Đã làm

- **Hợp đồng** `packages/core-contracts/actionCanvas.ts`
  - `CanvasDomainSchema` chỉ còn `learning` · `work` (Ghi chú) · `general`.
  - Giá trị cũ `career`/`startup`/`life` được **đổi về `general` khi đọc** (`z.preprocess`). Canvas
    người dùng lưu từ trước vẫn hợp lệ, nên lưu lại không bị lỗi 400. Giá trị lạ khác vẫn bị từ chối.
- **Server** `action-canvas.ts`: thêm hàm `readCanvas` chuẩn hoá canvas đã lưu qua hợp đồng trước
  khi GET, auto_layout hay export. Bản lưu không khớp hợp đồng vì lý do khác thì trả nguyên văn như
  trước, không làm mất dữ liệu.
- **Mẫu** `actionCanvasService.ts`: bỏ nút `life` và cạnh của nó (còn 4 nút, 4 cạnh). Nút gốc và nút
  quyết định chuyển sang `general`. Bỏ câu "kết nối 5 miền".
- **Giao diện:**
  - `InteractiveCanvasViewport.tsx`: nhãn miền tiếng Việt (Học tập / Ghi chú / Chung). Bảng màu bỏ ba
    miền cũ, thêm `general`.
  - Câu chữ nói đúng việc thật:
    - nút "Tạo sơ đồ từ mục tiêu";
    - modal "Tạo bản nháp sơ đồ từ khung mẫu…";
    - toast "Đã tạo bản nháp sơ đồ — sửa các nút cho khớp mục tiêu của bạn";
    - banner studio Kế hoạch bỏ "5 miền".
- **Edge AI** `edgeAiService.ts`: bỏ ba nhánh regex, kiểu `domain` chỉ còn
  `learning | work | general`. Không giao diện nào gọi `classifyIntent`; `useEdgeAi` chỉ dùng
  `checkGrammar` (trang Viết) và `capability`.
- **Đi kèm:**
  - 2 skill (cả `.claude/` và `.agents/`): `life-career-strategic-advisor`,
    `principal-engineer-architect`;
  - hai nợ dời sang `docs/legacy/no-ky-thuat-da-dong.md`.

## Nợ mới ghi

🟡 "Tạo sơ đồ từ mục tiêu" vẫn là khung mẫu cố định: nội dung 4 nút như nhau với mọi mục tiêu. Câu
chữ đã trung thực. Muốn phân rã thật thì cần đặc tả (gọi AI có đếm lượt), hoặc đổi thành canvas
trống. Đã ghi ở `PROGRESS.md`.

## Bằng chứng

- Test mới:
  - hợp đồng: giữ `learning`/`work`/`general`, đổi ba miền cũ về `general`, từ chối `finance`;
  - service: mẫu chỉ dùng ba miền, không còn "Focus Score"/"5 miền", mọi cạnh trỏ tới nút có thật;
  - handler: GET một canvas cũ có nút `career`/`life` trả về `general`;
  - Edge AI: câu về CV, startup, thói quen giờ rơi về `general`.
- Tầng 8b: chụp `/action-canvas` ở 1440px và 390px, trước và sau, kèm modal.
  - Trước: nhãn CAREER/LIFE, nút "Giấc ngủ 7.5h · Focus Score 85+", nút "AI Phân Rã Mục Tiêu".
  - Sau: nhãn CHUNG/HỌC TẬP/GHI CHÚ, 4 nút, câu chữ mới; modal vừa khung 390px.
