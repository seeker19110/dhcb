# feat(programming): nội dung học THẬT cho chặng S1 hướng Web (2026-08-27)

**PR:** [#716](https://github.com/seeker19110/dhcb/pull/716) · **Nhánh:** `claude/thuc-thi-chang-s1-dkp8vw`

## Bối cảnh

PR #712 mở bản đồ 13 hướng chuyên sâu (52 chặng, 211 module) nhưng **chưa chặng nào có bài học
thật** — mục "Việc để ngỏ (cố ý)" của PR đó ghi rõ "chưa soạn bài 8 bước cho hướng nào (nên bắt
đầu từ `web`)". Đợt này thi hành đúng việc được khuyến nghị làm trước: **chặng `web-s1`**.

## Đã làm

- **7 bài học 8 bước mới** trong 3 unit của bậc P6, phủ đủ 5 module của `web-s1`:
  - `p6-u16` — _trình duyệt làm gì & bố cục hiện đại_ (`web-s1-m1`, `web-s1-m2`):
    l1 **event loop / long task** (`javascript`), l2 **Grid vs Flex · mobile-first · design
    token** (`html`).
  - `p6-u17` — _UI là hàm của state, TypeScript cho giao diện_ (`web-s1-m3`, `web-s1-m4`):
    l1 **UI = f(state), không lưu giá trị dẫn xuất**, l2 **union phân biệt cho 4 trạng thái
    màn hình + vét cạn bằng `never`**, l3 **không tin `as`, validate dữ liệu API lúc chạy**
    (cả ba `typescript`).
  - `p6-u18` — _accessibility nhập môn_ (`web-s1-m5`): l1 **bàn phím & focus**, l2 **bốn trạng
    thái màn hình + `role="status"`/`aria-live`** (cả hai `dom`).
- **Cầu nối chặng ↔ bài học**: `packages/subject-programming/specializations/stageUnits.ts`
  (`SPEC_STAGE_UNITS`, `unitsOfStage`, `specHasLessons`) + cổng `stageUnits.test.ts` kiểm chéo
  mã chặng có thật trong bản đồ hướng, unit có thật trong `curriculum.ts` **và** unit đó đã có
  bài trong `lessons.ts`. Khai sai là CI đỏ, không phải trang trắng.
- **Trang `/lap-trinh/huong/:specId`**: chặng nào đã có bài thì hiện khối "Vào học chặng này"
  (liệt kê các unit); chặng chưa soạn **không hiện nút nào** — hứa một nút dẫn tới trang rỗng
  còn tệ hơn chưa có nút.
- Sửa số đếm còn sót lại từ PR #712: "12 hướng" → **13 hướng** ở `curriculum.ts` (canDo của P6 +
  comment), `specializations/types.ts`, `e2e/a11y-aaa.spec.ts` và nút ở màn "Không có hướng này".

## Quyết định kèm theo

- **Nội dung hướng chuyên sâu bắt đầu từ `p6-u16`.** Dải `p6-u5…p6-u15` đã được CHƯƠNG TRÌNH M
  (Kotlin · Swift · paradigm) giữ chỗ trong `PROGRESS.md`; bắt đầu từ u16 để hai dòng việc chạy
  song song mà không tranh mã unit — mã unit là **khoá tiến độ Postgres**, đổi về sau rất đắt.
- **Không dạy cú pháp React trong chặng S1.** Bộ chạy bài học của môn không có React, và thứ
  khiến người ta viết React sai là ba thói quen tư duy (sửa màn hình bằng tay · cờ boolean rời
  rạc · tin `as`) — cả ba dạy được bằng TypeScript thuần và **chấm được bằng test-case**. Dạy
  bằng thứ chấm được, thay vì bằng thứ chỉ đọc cho biết.
- Bài event loop mô phỏng hàng đợi bằng code **đồng bộ** thay vì `setTimeout` thật: bộ chạy thu
  output ngay sau khi code chạy xong nên callback hẹn giờ không kịp chạy, và mô phỏng buộc học
  viên nói ra LUẬT xếp hàng thay vì đoán kết quả.

## Bằng chứng kiểm chứng

- **Bài học được bắt bởi một luật không ai trong đợt này nhớ tới:** cổng `lessons*.test.ts` yêu
  cầu **đáp án đúng của bước ④ Predict phải xuất hiện nguyên văn trong output/cây DOM THẬT**, và
  lựa chọn sai thì không được khớp. Cả 7 bài soạn lần đầu đều viết Predict dạng "chọn câu giải
  thích đúng" nên đỏ 7/7. Đã viết lại toàn bộ theo đúng khuôn "đoán chương trình in ra gì",
  phần lý giải chuyển vào `explain`. Đây đúng loại lỗi mà cổng nội dung sinh ra để bắt.
