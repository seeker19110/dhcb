# Rà mắt 73 hoạt ảnh Vật lí: sửa 58 bài (khoảng 20 sai kiến thức) và 3 lỗi của bộ vẽ

- **Ngày:** 2026-09-26 · **PR:** PR của nhánh `seeker/zealous-allen-ygj0gw` (sau #1182)
- **Loại:** `fix(physics)`. Người dùng giao "tự quyết cho chất lượng cao". Đợt Toán (`0408`) đã
  rà mắt 34 hoạt ảnh Toán; ba môn Lí/Hoá/Sinh (193 hoạt ảnh) chưa ai soi theo thời gian. Đợt này
  làm Vật lí. Hoá và Sinh làm ở các PR kế tiếp.

## Cách rà

- `npm run shots:lesson-anim -- --subject physics`: chụp mỗi hoạt ảnh ở 5 mốc (2/25/50/75/98%) rồi
  đọc từng dải ảnh. Script nay nạp được cả Lí/Hoá/Sinh, trước đây chỉ Toán.
- Tiêu chí như đợt Toán: 🔴 sai kiến thức, chữ bị cắt, nhãn không đi theo vật · 🟡 chữ đè chữ,
  đường gạch qua chữ · 🟢 chữ thô (gạch dưới kiểu `W_t`).
- Thêm máy kiểm hình học ngay trong script (`kiemHinhHoc`). Ở mỗi mốc, máy in dòng ⚠ khi: chữ tràn
  khung, chữ đè chữ, đường hoặc mũi tên gạch qua chữ, chấm đè chữ, chấm hoặc mũi tên ra khỏi khung.
  Chỉ báo, không chặn. Máy không biết nhãn có đi theo vật không, cũng không biết chiều mũi tên có
  đúng vật lí không. Những lỗi đó chỉ mắt người thấy.
- Kết quả rà: 41/73 có lỗi 🔴, 17 chỉ có lỗi 🟡, 15 đạt.

## Ba lỗi của bộ vẽ (sửa một lần, có lợi cho cả 4 môn)

1. **`closed: true` thiếu cạnh khép.** `<polyline>` không bao giờ vẽ nét từ điểm cuối về điểm đầu.
   Có 19 hình ở cả 4 môn bị thiếu đúng một cạnh: vòng benzen và vòng glucose hở, mạch điện hở, đường
   chạy vòng sân thiếu cạnh trái, đáy hình chóp và mặt hình hộp thiếu cạnh. Nay `closed` vẽ bằng
   `<polygon>`. Đã chụp lại 5 hoạt ảnh Toán và 7 hoạt ảnh Hoá có hình khép để kiểm bằng mắt: hình
   nay khép đúng.
2. **Thêm `origin` cho `rotate`/`scale`.** Trước đây hình chỉ xoay hoặc co giãn quanh TÂM của nó,
   nên mũi tên lực "dài dần" bị tách khỏi điểm đặt, cột năng lượng bị nhấc khỏi mặt đất. Nay khai
   `origin` là được: mũi tên dài ra từ đuôi, cột mọc từ chân. Vật chuyển động tròn cũng quay quanh
   tâm quỹ đạo bằng một phép `rotate` chính xác, không phải xấp xỉ nhiều mốc `dx/dy`.
3. **Chữ màu `surface` bỏ viền halo.** Loại chữ này nằm TRÊN một hình tô màu (như "R = 6 Ω" trong
   điện trở). Viền cùng màu với chữ làm nét dính thành một khối.

## Lỗi kiến thức đã sửa (hoạt ảnh dạy sai hoặc tự mâu thuẫn)

- `ly12-c3-b14`: dòng điện đi ra khỏi trang (⊙) thì đường sức phải NGƯỢC chiều kim đồng hồ. Mô tả
  viết đúng, nhưng 4 mũi tên vẽ CÙNG chiều kim đồng hồ trên màn hình. Nguyên nhân: trục y của SVG
  hướng xuống. Kết quả là hoạt ảnh dạy sai quy tắc nắm tay phải.
- `ly12-c3-b12`: các đường sức nam châm thẳng CẮT nhau, vòng trong lại cao hơn vòng ngoài. Nay vẽ
  lại bằng tích phân trường của hai cực: các vòng lồng nhau, không cắt nhau, mũi tên đi từ N sang S.
- `ly12-c3-b17`: từ thông ở nhánh trên và nhánh dưới lõi máy biến áp vẽ CÙNG chiều. Từ thông chạy
  thành vòng kín, nên hai nhánh này phải ngược chiều nhau.
- `ly12-c3-b18`: trong loa, B vẽ song song với lực F, nhưng lực từ luôn vuông góc với B. Nay vẽ lại:
  B đi từ cực N xuống cực S, dòng trong dây ra/vào trang (⊙/⊗), F nằm ngang.
- `ly12-c93-b3`: dòng cảm ứng qua R vẽ đi LÊN, nên vòng dòng điện không khép kín. Đúng ra dòng đi
  lên trong thanh, sang trái trên ray trên, rồi đi XUỐNG qua R.
- `ly12-c4-b22`: phản ứng Rutherford ⁴He + ¹⁴N → ¹⁷O + ¹H là phản ứng THU năng lượng. Sản phẩm nặng
  hơn khoảng 0,0013 u, tức thu khoảng 1,19 MeV. Mô tả và câu cuối lại ghi "phần khối lượng hụt đi
  biến thành năng lượng".
- `ly12-c4-b24`: hạt U-235 đã phân hạch vẫn còn nằm cạnh hai mảnh của nó. Các hạt ở thế hệ 2 cũng
  không vỡ ra.
- `ly12-c1-b4`: nhãn ghi "sau 100 s: dầu 41 °C, nước 30 °C", nhưng vạch chia trên trục cho số khác
  (62 và 40 °C). Nay sửa số trên trục cho khớp.
- `ly12-c1-b7`: hai chấm chạy theo đường thẳng, lệch khỏi hai đường cong hàm mũ. `ly12-c1-b1`:
  phân tử khí bay ra khỏi bình.
- `ly11-c4-b22`: electron ở dây dưới chạy cùng chiều với I, tức đi VÀO cực âm. Nay electron trôi
  ngược chiều I trên CÙNG một đoạn dây với mũi tên I. Bỏ luôn chấm "hạt dương" hư cấu, vì trong kim
  loại không có hạt dương chạy.
- `ly11-c4-b23`: hoạt ảnh dùng BÓNG ĐÈN sáng dần để minh hoạ "R không đổi". Dây tóc nóng lên thì R
  tăng, chính lí thuyết của bài cũng nói vậy. Nay thay bằng điện trở và mũi tên dòng điện dài dần.
- `ly11-c4-b24`: hai chấm điện tích chạy ngang từ ngoài mạch xuyên qua nguồn. Nay cả bốn chấm chạy
  vòng theo mạch, lệch pha đều nhau.
- `ly11-c2-b11`: vectơ E và B chỉ lên đúng lúc sóng ở đáy, và không bao giờ đổi chiều. Nay đặt vectơ
  ở đỉnh sóng, cho đổi chiều đúng theo pha.
- `ly11-c2-b12`: thiếu nhánh cực đại k = −1. Các gợn tròn cách nhau không đều (40 rồi 80) và không
  khớp λ = 70 của hệ vân.
- `ly10-c2-b11`: cổng quang A đặt xa chỗ thả, nên bi qua A đã có vận tốc và công thức g = 2s/t²
  không đúng. Nay đặt A sát chỗ thả, như bố trí trong sách giáo khoa.
- `ly10-c3-b19`: lực cản lớn nhất vẫn nhỏ hơn P, nên câu "F cản = P" không bao giờ xảy ra. Nay dựng
  lại động học theo lực cản tỉ lệ bình phương vận tốc: tốc độ giới hạn thật, mũi tên cản mọc từ vật.
- `ly10-c3-b16`: hai lực đẩy vẫn hiện khi hai bạn đã rời tay trôi ra xa. Nay lực chỉ tồn tại lúc tay
  còn chạm nhau.
- `ly10-c5-b30`: sau va chạm mềm, hai xe bằng nhau đi với 1/3 vận tốc. Đúng phải là 1/2.
- `ly10-c3-b18`: khi thùng trượt nhanh dần, mũi tên lực lại đi thẳng đều nên tách khỏi thùng.
  `ly10-c4-b25`: cột năng lượng không khớp độ cao của vật. `ly10-c6-b32`: tốc độ quay tăng gấp đôi ở
  đoạn cuối, và hòn đá bay ra khỏi khung.

## Lỗi bố cục đã sửa (chữ cắt, đè, bị gạch, nhãn đứng yên khi vật chạy)

`ly10-c2-b7`, `b8` · `ly10-c3-b13`, `b15`, `b17`, `b21` · `ly10-c4-b23`, `b24` · `ly10-c6-b31` ·
`ly10-c7-b34` · `ly11-c1-b2`, `b3`, `b5`, `b6` · `ly11-c2-b9`, `b13`, `b15` · `ly11-c3-b16` →
`b20` · `ly11-c4-b25`, `b26` · `ly12-c1-b2`, `b3`, `b5`, `b6` · `ly12-c2-b8`, `b9`, `b10` ·
`ly12-c3-b13`, `b15`, `b16` · `ly12-c4-b20`, `b21`, `b23`.

Dấu × và ⊗ của từ trường nay vẽ bằng nét, nằm dưới cùng: không còn đè lên chữ và vật đang chạy.

## Bằng chứng

- Máy kiểm hình học, 73 hoạt ảnh × 5 mốc, chụp lại toàn bộ sau khi sửa. Dòng ⚠ còn lại đều là ca cố
  ý: chữ trắng nằm trong quả cầu (A, B, +q, ¹⁷₈O), chấm chạy sau thân điện trở, trục đi qua điện
  tích, cổng quang cắt qua xe. Trước khi sửa, 58 hoạt ảnh có dòng ⚠ hoặc lỗi thấy bằng mắt.
- Rà lại bằng mắt dải ảnh của từng hoạt ảnh đã sửa.
- `LessonAnimation.test.tsx` 19/19, thêm 3 ca mới: `origin`, `closed` → `<polygon>`, halo chữ
  `surface`. Test bài học Lí/Toán/Hoá cùng Zod: 554/554.
- `e2e/lesson-animation-zoom.spec.ts` (nút "Xem lớn" trên trang thật, 390/844/1440 px): 3/3.
- `typecheck`, `lint`, `prettier` xanh; `audit:prose --ci` 0 lỗi.
- Bẫy mới ghi ở `TRAPS.md` mục 10: `closed`, trục y SVG đảo chiều quay, ký hiệu nền vẽ bằng chữ, và
  bẫy trong chính công cụ đo (lấy nhầm thẻ `<style>` nên chỉ đo giây đầu).
