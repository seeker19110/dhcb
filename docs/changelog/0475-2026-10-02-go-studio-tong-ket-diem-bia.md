# 0475 — Gỡ studio "Tổng kết" của Bạn Đồng Hành: thôi hiện điểm "phân tích cuộc sống" bịa (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** (điền sau khi tạo) · **Loại:** `fix(companion)`.
- **Nối tiếp:** nợ 🔴 "studio Tổng hợp hiển thị điểm BỊA" ghi ở changelog `0469`. Chủ dự án chọn
  phương án **"Ẩn studio tới khi có dữ liệu thật"**: gỡ studio khỏi Companion, API trả lỗi rõ
  thay vì số bịa.

## Vì sao

Studio "Tổng kết" (badge "Tổng hợp") mở đầu bằng bảng "Tổng Hợp Đa Miền & Dự Báo Mục Tiêu". Bảng
này hiện **88 / 92 / 85** điểm "Đồng bộ toàn diện / Cộng hưởng đa miền / Bền bỉ nhận thức", giống
hệt nhau cho mọi người dùng. Nguồn của các con số:

- `GET /api/life-synthesis` không gửi dữ liệu nào, nên `generateLifeSynthesisReport` dùng số hoạt
  động **gán cứng** (`learning: 12, career: 6, work: 15, startup: 4, life: 8`).
- Điểm mặc định cũng gán cứng: nhận thức 82, năng lượng 78.
- Hai "mục tiêu" mẫu (C1, Tech Lead), ba khuyến nghị và câu nhận xét đều **soạn sẵn**.
- Vẫn chấm cả ba trụ Career/Startup/Life đã xoá ngày 2026-09-20.

Kết quả là trái "Luật số 1" của sản phẩm (kết quả chẩn đoán không phải bảng chấm điểm con người)
và trái tính trung thực. Ảnh chụp 1440px trước đợt này cho thấy rõ bảng điểm bịa.

## Việc đã làm

### A. Gỡ studio khỏi giao diện

- `studioTypes.ts`: bỏ `'synthesis'` khỏi kiểu `StudioTab` và khỏi `STUDIO_TABS_CONFIG`. Thanh tab
  còn 4 studio, ở 390px thành lưới 2×2 gọn.
- `Companion.tsx`: bỏ nạp lười và nhánh hiển thị `StudioSynthesis`. Xoá
  `StudioSynthesis.tsx`.
- **Hai thứ còn lại của studio dời sang "Kế hoạch"**, để không mất đường vào:
  - thẻ **Studio Điều Phối Agent** (`AgentOrchestratorCard`);
  - banner **Action Canvas**, tách thành `CompanionStudios/ActionCanvasBanner.tsx`. Đây là lối vào
    **duy nhất** của `/action-canvas` trên giao diện: `duongDanActionCanvas()` có khai báo nhưng
    không nơi nào gọi.
- `LifeSynthesisDashboard`, `LifeSynthesisDetailModal`, `lib/lifeSynthesisApi.ts` **giữ mã**
  (không gắn vào đâu) để bật lại sau. Có ghi chú ở đầu file.

### B. API thôi trả số bịa

`apps/server/src/api/personal/life-synthesis.ts`:

- `GET`/`POST` trả **501** với `error: 'LIFE_SYNTHESIS_UNAVAILABLE'` cùng lời giải thích "chưa có
  dữ liệu hoạt động thật để tổng hợp, nên không trả số liệu ước đoán".
- Vẫn kiểm đăng nhập trước (401), `OPTIONS` vẫn 204, phương thức khác vẫn 405.
- `packages/core-personal/lifeSynthesisService.ts` giữ nguyên logic, thêm cảnh báo ở đầu hàm:
  **không nối vào giao diện người dùng thật** khi chưa có dữ liệu thật và chưa viết lại câu chữ.

### C. Hai lỗi bố cục có sẵn, lộ ra khi dời sang "Kế hoạch"

Cổng e2e "header thẻ không bị ép hẹp ở 390 px" có quét "Kế hoạch" nhưng chưa từng quét "Tổng kết".
Dời sang nên lộ ra hai lỗi:

1. **Thẻ Agent:** tiêu đề bị ép thành **3 dòng** ở 390px, vì tiêu đề, huy hiệu và nút nằm chung một
   hàng. Cổng bắt được. Sửa theo khuôn S06d-b: header xếp dọc ở màn hẹp, hàng tiêu đề cho phép
   xuống dòng.
2. **Banner Action Canvas:** tiêu đề vỡ thành **5 dòng** ở 390px. Cổng không bắt được vì nó là
   `h4`, không phải `h3`; lỗi chỉ lộ khi xem ảnh chụp. Sửa cùng khuôn, nút rộng hết dòng ở màn
   hẹp và cao tối thiểu 44px (`tap-44-y`).

### D. Hai cổng a11y — bỏ studio đã gỡ khỏi danh sách quét

`e2e/a11y.spec.ts` và `e2e/a11y-aaa.spec.ts` bỏ `'Tổng kết'` khỏi `COMPANION_STUDIOS`, vì tab
không còn. **Đây không phải nới cổng:** không đổi ngưỡng, không thêm ngoại lệ. Hai thành phần còn
lại của studio đó nay nằm trong "Kế hoạch", vẫn được quét AA và AAA ở cả 3 theme.

Hook `config-protection` từ chối lần chạm đầu ở mỗi file đúng như thiết kế. Lý do sửa đã được nêu
cho chủ dự án trước khi thử lại.

## Test

- `life-synthesis.test.ts`: thay hai ca "trả báo cáo 200" bằng "GET/POST trả 501, không có
  `report`". Bỏ ca "body JSON lỗi vẫn trả 200": API không còn đọc body.
- `CompanionStudios.test.tsx`: thêm hai ca:
  - "không còn studio Tổng kết";
  - "StudioProactive giữ thẻ Agent và lối vào Action Canvas".

## Bằng chứng

- Cổng a11y AA + AAA + "header không ép hẹp" cho studio "Kế hoạch": 7/7 xanh, 3 theme. Trước khi
  sửa thẻ Agent: ca "header" đỏ với "tiêu đề Studio Điều Phối Agent Tự Trị 3 dòng".
- **Ảnh trước/sau (Tầng 8b)**, 1440px + 390px, Blue sky:
  - Trước: tab "Tổng kết" hiện bảng 88/92/85.
  - Sau: 4 tab; studio "Kế hoạch" có thẻ Agent và banner Action Canvas, cả hai gọn ở 390px.
- Cổng đầy đủ: xem mô tả PR.

## Còn mở

Nợ 🟡 trong PROGRESS: muốn bật lại "Tổng hợp đa miền" thì cần các bước sau, rồi mới gắn lại
`LifeSynthesisDashboard`:

1. nối nguồn hoạt động thật (Learning + Ghi chú);
2. bỏ ba miền đã xoá;
3. viết lại phần câu chữ soạn sẵn của service.
