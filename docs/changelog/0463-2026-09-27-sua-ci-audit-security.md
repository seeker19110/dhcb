# Sửa CI cho đợt audit security — PR #1189

## Lỗi và cách sửa

- Unit test phát hiện thiếu migration `0086_companion_message_sensitivity.sql` trong
  `postgres/migrations/README.md`. Bổ sung mô tả cột, giá trị mặc định, thứ tự rollout và
  liên kết truy vấn xác minh/khôi phục; không đổi SQL migration.
- E2E màn kết quả thi CEFR ở 1440 px và 390 px phát hiện dòng “Điểm cao nhất đã lưu”
  chỉ đạt tương phản 5,61:1 trong theme Blue sky, dưới ngưỡng AAA 7:1. Đổi từ
  `text-zinc-500` sang `text-zinc-300`, token chữ phụ đã có của dự án.
- Mở rộng ca CEFR nộp lỗi rồi thử lại sang cả ba theme Dark blue, Blue sky và Kid ở
  hai kích thước. Giữ kiểm tra đáp án/lượt nộp và toàn bộ luật axe; log lỗi nay kèm
  phần tử và tỷ lệ tương phản, ảnh kết quả được chụp trước assertion để còn bằng chứng
  khi kiểm tra thất bại.

## Bằng chứng kiểm chứng

- Tái hiện trước sửa: unit migration thiếu dòng mô tả; cả hai ca CEFR báo
  `color-contrast-enhanced` trên đúng dòng điểm đã lưu.
- Sau sửa: 8/8 unit test liên quan đạt; 6/6 ca CEFR gồm nộp lại và axe AA/AAA đạt.
  Đã đối chiếu ảnh trước/sau ở 1440 px và 390 px.
- Build, typecheck, lint, format toàn dự án đạt; cổng `check:ui-ux` đạt 151/151 test.
- Lượt unit đầy đủ: 17.353 test đạt, 2 test bỏ qua sẵn có; một suite không nạp được
  vì bản sao kiểm thử thiếu chỉ mục Git. Bổ sung chỉ mục rồi chạy lại riêng
  `scripts/no-control-chars.test.ts`: 2/2 test đạt, không đổi test hay mã ứng dụng.
- E2E toàn bộ cục bộ dừng chủ động sau 78 ca đạt để dành bộ nhớ cho unit test;
  không coi đây là kết quả toàn suite. CI trên commit cuối là bằng chứng cho
  coverage và toàn bộ E2E, được ghi trong PR #1189.

## Rủi ro và khôi phục

Thay đổi ứng dụng chỉ là màu chữ. Không đổi chấm thi, cấp thưởng, quyền truy cập,
ngưỡng test hay workflow CI. Có thể hoàn tác riêng màu chữ và phần mở rộng E2E,
nhưng sẽ tái hiện lỗi tương phản; giữ dòng danh mục migration.
