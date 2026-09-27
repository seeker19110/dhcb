# Rà mắt 64 hoạt ảnh Sinh học: sửa 44 bài (khoảng 15 sai kiến thức hoặc lập luận)

- **Ngày:** 2026-09-27 · **PR:** PR của nhánh `fix/biology-animation-review`
- **Loại:** `fix(biology)`. Đợt cuối của chuỗi rà mắt hoạt ảnh STEM, sau Toán (`0408`), Vật lí
  (`0457`) và Hoá (`0459`). Người dùng chọn "trả nợ kỹ thuật mở" sau khi tích hợp PR #1183.

## Cách rà

Như các đợt trước: `npm run shots:lesson-anim -- --subject biology` chụp mỗi hoạt ảnh ở 5 mốc, máy
kiểm hình học in dòng ⚠. Sau đó đọc từng ảnh ở độ phân giải đủ, đối chiếu với mô tả, lời dẫn và lí
thuyết của bài. Sau khi sửa, chụp lại đủ 64 bài và xem lại.

Kết quả: 20 bài đạt nguyên trạng, 28 bài lỗi 🔴 (sai kiến thức hoặc chữ bị cắt), 15 bài lỗi 🟡
(chữ đè hình), 1 bài 🟢 (thiếu dấu ⁻ ở "e⁻"). Cảnh báo máy giảm từ **31/64 xuống 6/64**. Sáu cảnh báo còn lại đều là chữ cố ý
nằm trong hình: chữ O/H trong nguyên tử, "Nhân" trong nhân, "Calvin" trong vòng Calvin, nhãn trên
lưới Punnett.

## Lỗi kiến thức và lập luận đã sửa

- `sinh12-c1-b1` chạc sao chép: ADN mẹ ở bên trái nhưng mũi tên chiều chạc chỉ sang phải. Mạch
  trên ghi 3′ sát chạc, nên đọc khuôn 3′→5′ là đi xa chạc, tức là mạch gián đoạn, mà lại vẽ thành
  "liên tục". Đoạn Okazaki mới lại xuất hiện xa chạc dần. Đã sửa cả ba cho nhất quán.
- `sinh12-c5-b19` phả hệ: chỉ có một con trai bệnh thì chưa loại được gene lặn trên X. Câu "gặp ở
  cả nam và nữ" không có trên hình, tiêu đề lại ghi "ba thế hệ" dù hình chỉ có hai. Nay người bệnh
  là con gái có bố bình thường, nên gene không thể nằm trên X.
- `sinh12-c8-b26` đường J và S: đường S nằm trên đường J ở đoạn đầu, còn J bẹt ngang ở đỉnh. Dựng
  lại đúng công thức cùng N₀ và r: J = N₀·eʳᵗ, S là đường logistic tiệm cận K.
- `sinh12-c3-b15` Hardy–Weinberg: mô tả nói cấu trúc "nhảy" tới cân bằng sau một thế hệ, nhưng
  hình chỉ có ba đường phẳng. Đã thêm thế hệ xuất phát (0,6 AA + 0,4 aa).
- `sinh11-c1-b10` tuần hoàn: màu bị đảo, máu nghèo O₂ vẽ đỏ. Giọt máu nhảy chéo từ cơ quan về tim.
  Nay giàu O₂ màu đỏ, nghèo O₂ màu xanh, giọt đi khép kín theo mạch và đổi màu ở phổi và ở cơ quan.
- `sinh10-c6-b19` nuôi cấy mô: tự mâu thuẫn "auxin cao → mô sẹo" rồi "tăng auxin → ra rễ". Nay
  mô sẹo hình thành khi hai hormone cân bằng, khớp lí thuyết bài 26.
- `sinh10-c5-b13` ATP: mô tả ghi "nửa trên là ĐỒNG HOÁ", trong khi nạp ATP dùng năng lượng của
  dị hoá.
- `sinh10-c6-b16` nguyên phân: nhiễm sắc thể bay ra ngoài tế bào. Nay có hai tế bào con, và vạch
  tâm động biến mất ở kì sau.
- `sinh10-c6-b17` giảm phân: vẽ lại ba tầng. Kì giữa I xếp hai hàng, sinh 2 tế bào n kép rồi 4 tế
  bào n đơn, và có phân li độc lập.
- `sinh12-c1-b2` phiên mã–dịch mã: ribosome từng trượt rời khỏi mARN. Nay mARN mọc theo ARN
  polymerase, và chuỗi polypeptide dài dần sau ribosome.
- `sinh12-c1-b3` operon Lac: protein ức chế nay bám hẳn vào O, ARN polymerase đậu sát P, và lactose
  gắn vào protein ức chế trước khi nó rời đi.
- `sinh12-c1-b4` đột biến: ba kết cục trước nối mũi tên nối tiếp. Nay ba mũi tên toả từ cùng một
  đột biến, vì đây là ba khả năng thay thế nhau.
- `sinh11-c2-b13` hướng sáng: thân cây xoay quanh tâm nên chân nhấc khỏi đất. Nay xoay quanh gốc;
  chấm auxin tính theo phép xoay nên luôn nằm trong thân, phía khuất sáng.
- `sinh11-c1-b9` hô hấp: cơ hoành chỉ tịnh tiến. Nay vòm dẹt xuống khi co, hai đầu bám sườn đứng yên.
- `sinh12-c8-b25` giới hạn sinh thái: điểm gây chết đánh dấu ở chỗ đường cong chạm trục, không còn
  nằm sát nét đứt của khoảng thuận lợi.
- `sinh12-c10-b29` chu trình carbon: hai nhãn bị gắn nhầm mũi tên.
- `sinh10-c8-b26` bài thực hành điều tra bệnh do virus từng dùng hoạt ảnh "dòng năng lượng" không
  liên quan. Nay là năm bước điều tra dịch tễ, đúng lí thuyết của bài.
- `sinh12-c2-b9`: hoa đỏ nay tô màu đỏ (trước tô xanh).

## Bố cục (chữ bị cắt hoặc đè hình)

Chữ bị cắt ở mép khung: b15 điện thế hoạt động, b10 tuần hoàn, b10 hoán vị, b31, b32, b14 hô hấp tế
bào. Chữ đè hình hoặc bị đường gạch qua: b2 vận chuyển nước (nới khung 480), b4 quang hợp, b20 vòng
đời ếch, b22 lên men, b25 vaccine, b20 E. coli, b24 trục thời gian, b28 tháp năng lượng, b21, b22,
b14, b4 nước, b8, b10. Tiêu đề chạm nhãn trục tung ở mọi đồ thị dùng khuôn chung: đã hạ nhãn trục
xuống y = 38.

## Công cụ

- `scripts/shots-lesson-animations.ts` chạy được trên Windows: dùng `os.tmpdir()` và
  `pathToFileURL`. Trước đây script viết cứng `/tmp` và ghép chuỗi `file://`, nên gãy ngay hoạt ảnh
  đầu tiên (`ERR_FILE_NOT_FOUND`).
- Sửa bằng công cụ tạm ngoài repo: nạp hoạt ảnh bằng tsx, áp hàm sửa, ghi đè đúng khối
  `animation: {…}`. Đã kiểm ghi đè không đổi gì thì file giữ nguyên từng byte. Prettier gộp một số
  object ngắn về một dòng nên diff dài hơn thay đổi thật; đã đối chiếu tập `id` shape trước/sau,
  mọi `id` bị bỏ đều có chủ đích (vẽ lại giảm phân, thay giọt máu).

## Bằng chứng

- `packages/subject-biology` + `core-contracts` + `LessonAnimation` + `animationKeyframes`: 80 file,
  511 ca xanh. Cổng Zod đã bắt thật hai lỗi khi làm, cả hai đã sửa: nhãn dùng màu đồ hoạ `danger`,
  và mô tả dài quá 800 ký tự.
- `npm run typecheck` 0 lỗi, `eslint` 0 cảnh báo.
- Chụp lại đủ 64 bài: cảnh báo máy 6/64. Đã xem lại bằng mắt từng bài vừa sửa.
- CI lần đầu đỏ ở `a11y AAA: khối duyệt trong bài học (admin)` (trang `sinh12-c1-b1`): hai dòng
  nhãn "chạc chữ Y" cách nhau 14 đơn vị nên khung bao giao nhau, cổng không đo được tương phản qua
  halo. Tái hiện ở máy (3/3 theme đỏ), tách thành ba dòng cách nhau 18 đơn vị, đo halo ở 390px và
  1440px đều đạt ≥ 7,7:1, ca AAA và a11y của bài xanh. Ghi thành bẫy số 15 ở `TRAPS.md`.

## Chưa làm

Chưa có người có chuyên môn Sinh học đọc lại. Bảy bài kiến thức ở trên nên được ưu tiên duyệt.
Nội dung môn vẫn ở trạng thái `reviewStatus: 'draft'`.
