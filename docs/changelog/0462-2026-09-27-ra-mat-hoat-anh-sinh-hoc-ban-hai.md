# Rà mắt 64 hoạt ảnh Sinh học: sửa 47 bài (khoảng 20 sai kiến thức), một bài gắn nhầm hoạt ảnh

- **Ngày:** 2026-09-27 · **PR:** PR của nhánh `seeker/exciting-noether-v5pg1j` (sau #1186)
- **Gộp với #1187 (cùng rà 64 hoạt ảnh Sinh, changelog 0461, merge trước):** 193 chỗ xung đột trong 9 file bài học — giữ NGUYÊN FILE của nhánh này (sửa 47 bài + bài gắn nhầm), không ghép lai từng toạ độ. Phần script/tài liệu khác của #1187 (vd `shots:lesson-anim` chạy trên Windows) giữ nguyên.
- **Loại:** `fix(biology)`. Đợt cuối của chuỗi rà mắt hoạt ảnh STEM: Toán (`0408`), Lí (`0457`),
  Hoá (`0459`), nay Sinh. Người dùng giao "hoàn thiện tiếp cho xong".

## Cách rà

Như hai đợt trước: `npm run shots:lesson-anim -- --subject biology` chụp mỗi hoạt ảnh ở 5 mốc
(2/25/50/75/98%), máy kiểm hình học in dòng ⚠, rồi đọc từng dải ảnh và đối chiếu mô tả, lời dẫn,
lí thuyết của bài. Sau khi sửa, chụp lại đủ 64 bài và xem lại từng bài đã sửa.

Kết quả: 47/64 bài phải sửa (42 vẽ lại hoặc sửa hình, 5 chỉ sửa chữ). Máy kiểm hình học: từ 31/64
bài có dòng ⚠ xuống 4/64; 4 bài còn lại đều là chữ cố ý nằm trong hình tròn (nguyên tử O, H, nhân
tế bào, hệ tuần hoàn, chu trình Calvin).

21/64 hoạt ảnh Sinh là dạng "chuỗi ô chữ" (các ô hiện lần lượt, chấm chạy qua). Nhóm này đã soát
nội dung chữ; bố cục khuôn không lỗi. Chúng đúng nhưng nghèo hình, xem mục "Còn lại".

## Hoạt ảnh gắn nhầm bài

`sinh10-c8-b26` (Thực hành: điều tra bệnh do virus và nhân giống cây bằng nuôi cấy mô) mang
hoạt ảnh "dòng năng lượng qua cơ thể sống", không dính gì tới bài. Đã thay bằng hoạt ảnh mới đúng
lí thuyết của bài: tỉ lệ cytokinin/auxin quyết định mô sẹo ra chồi hay ra rễ. Không cổng nào bắt
được lỗi này: Zod, test và máy kiểm hình học chỉ nhìn dữ liệu, không biết hoạt ảnh thuộc bài nào.

## Lỗi kiến thức đã sửa

Di truyền phân tử:

- `sinh12-c1-b1` (chạc chữ Y): mũi tên "hướng chạc" chỉ vào vùng ĐÃ mở, trong khi chạc tiến về phía
  ADN chưa tháo xoắn. Với nhãn 3′/5′ đang vẽ thì mạch trên phải là mạch GIÁN ĐOẠN, hình lại vẽ nó
  liên tục. Mạch liên tục mọc ra hai phía từ giữa. Đoạn Okazaki xuất hiện sai thứ tự (đoạn gần
  chạc trước). Nay: nhãn 3′/5′ ở đúng hai đầu, mạch liên tục mọc về phía chạc, đoạn Okazaki mới
  nhất nằm sát chạc, ligase nối ở cuối.
- `sinh12-c1-b2` (phiên mã, dịch mã): mARN phóng to từ giữa rồi trôi lệch, ribosome không nằm trên
  mARN, không có tARN, chuỗi amino acid không gắn với ribosome. Vẽ lại: ARN polymerase đi trên mạch
  gốc, mARN dài dần theo nó; ở tế bào chất ribosome dịch từng codon, tARN mang amino acid tới đúng
  vị trí, chuỗi polypeptide dài thêm từng mắt.
- `sinh12-c1-b3` (operon Lac): ARN polymerase nằm dưới ADN, không ở P; gene R không tạo ra protein
  ức chế; không có mARN. Nay protein ức chế đi từ R tới bám O, lactose gắn vào làm nó rời O, ARN
  polymerase trượt qua Z, Y, A và mARN dài dần phía sau.

Phân bào và di truyền:

- `sinh10-c6-b16` (nguyên phân, 2n = 4): bốn nhiễm sắc thể vẽ bốn cỡ khác nhau, tức không có cặp
  tương đồng nào. Hai chromatid chị em rời nhau, không có tâm động. Tế bào con không được vẽ,
  chromatid đi ra ngoài tế bào mẹ. Nay: một cặp dài, một cặp ngắn (mỗi cặp một chiếc từ bố, một
  chiếc từ mẹ), tâm động tách ở kì sau, hai tế bào con 2n = 4.
- `sinh10-c6-b17` (giảm phân): nhiễm sắc thể vẽ như ĐƠN, giảm phân II không được vẽ (bốn chấm tròn
  trống). Vẽ lại đủ: kì giữa I xếp hai hàng, kì sau I nhiễm sắc thể KÉP về hai cực (tâm động chưa
  tách), giảm phân II tách chromatid, bốn tế bào n = 2. Cặp dài và cặp ngắn chia về hai cực theo
  hai kiểu khác nhau, thấy được phân li độc lập.
- `sinh12-c2-b9` (tương tác bổ sung 9 : 7): 9 ô A−B− vẽ thành một khối 3 × 3 liền, không phải bảng
  Punnett thật. Nay bảng 4 × 4 ghi đủ 16 kiểu gene, 9 ô có cả A lẫn B được tô tại đúng chỗ của chúng.
- `sinh12-c2-b10` (hoán vị gene): chromatid là thanh trơn, không có gene, trao đổi chéo không đổi
  gì. Nay mỗi chromatid có hai đoạn mang A/a và B/b; khi bắt chéo, hai đoạn dưới của hai chromatid
  không chị em đổi chỗ, ra đúng bốn giao tử AB, ab, Ab, aB.
- `sinh12-c5-b19` (phả hệ): tiêu đề "Phả hệ ba thế hệ" nhưng chỉ vẽ hai. Kết luận "bệnh gặp ở cả nam
  lẫn nữ" trong khi chỉ có một con trai bệnh. Thêm thế hệ III: con gái của người chị bình thường
  mắc bệnh.
- `sinh12-c3-b15` (Hardy–Weinberg): mô tả nói "sau ĐÚNG MỘT thế hệ" mới đạt cân bằng, nhưng ba đường
  nằm ngang từ thế hệ 0. Nay thế hệ xuất phát là 0,5 AA : 0,2 Aa : 0,3 aa (vẫn p = 0,6), sang thế hệ
  1 thì thành 0,36 : 0,48 : 0,16 và phẳng từ đó.

Sinh lí và sinh thái:

- `sinh11-c2-b13` (hướng sáng): cả thân xoay quanh TÂM nên gốc bị nhấc khỏi đất; chấm auxin tụt lại
  ngoài thân khi thân cong. Nay gốc đứng yên, phần ngọn cong quanh vùng sinh trưởng, auxin phía sáng
  mờ đi và phía khuất sáng dày lên, cùng cong theo thân.
- `sinh11-c1-b9` (hô hấp): cơ hoành chỉ tịnh tiến xuống chứ không dẹt ra, hai lá phổi phồng lên chồng
  vào nhau, không có phế quản. Nay cơ hoành dẹt khi co (co giãn theo chiều dọc quanh chân vòm), lồng
  ngực nở, phổi không chạm nhau.
- `sinh11-c1-b10` (hai vòng tuần hoàn): màu ngược quy ước sách giáo khoa (máu nghèo O₂ tô đỏ), chấm
  máu đi đường thẳng xuyên qua tim thay vì theo mạch. Nay đỏ là máu giàu O₂, xanh là nghèo O₂, chấm
  đổi màu ở phổi và ở các cơ quan, đi đúng từng đoạn mạch.
- `sinh11-c1-b4` (quang hợp): thiếu chiều ADP, NADP⁺ quay về thylakoid; không có mũi tên ra glucose.
  Thêm cả hai, và cuối vòng tắt sáng thì chu trình Calvin dừng theo (đúng câu "pha tối phụ thuộc
  pha sáng" của bài).
- `sinh12-c8-b25` (giới hạn sinh thái cá rô phi): vạch "20 °C" đặt ở khoảng 15 °C, đường cong chưa
  về 0 ở 42 °C, đỉnh lệch về 25 °C. Dựng lại đường theo đúng thang nhiệt độ: về 0 đúng ở 5,6 và
  42 °C, đỉnh gần 30 °C.
- `sinh12-c8-b26` (chữ J, chữ S): đường S nằm TRÊN đường J ở đoạn đầu, và đường J nằm ngang ở đỉnh
  như thể chững lại. Dựng lại cả hai bằng cùng tốc độ sinh sản: S luôn dưới J, đoạn đầu gần trùng,
  J vượt khỏi đồ thị.
- `sinh12-c6-b22` (chọn lọc và phiêu bạt): mô tả nói "có thể mất hẳn allele" nhưng đường quần thể
  nhỏ dừng ở khoảng 0,05. Nay đường về đúng 0.
- `sinh12-c6-b20` (cơ quan tương đồng): co giãn đều nên ngón dơi phình to chồng lên nhau, còn chi cá
  voi lại mảnh đi (mô tả nói "dày lên"), các xương rời nhau. Nay mỗi xương co giãn quanh đầu gần và
  nối tiếp xương trước; ngón dơi dài và xoè ra, chi cá voi ngắn và dày.
- `sinh12-c10-b28` (tháp năng lượng): mô tả nói bậc trên hẹp "theo đúng tỉ lệ năng lượng", nhưng
  10 000 : 10 thì không vẽ đúng tỉ lệ được. Sửa mô tả.
- `sinh12-c10-b29` (chu trình carbon): thiếu hô hấp của thực vật, thiếu xác thực vật tới vi sinh vật,
  thiếu đường vùi thành than đá, dầu mỏ. Thêm đủ, chấm đi đúng theo mũi tên.
- `sinh10-c5-b13` (ATP): mô tả ghi "Nửa trên là ĐỒNG HOÁ và các phản ứng giải phóng năng lượng của dị
  hoá", lẫn lộn hai khái niệm. Sửa mô tả; bỏ vòng tròn nét đứt cắt qua chữ, chấm chạy đúng trên hai
  mũi tên.
- Chữ: `sinh10-c8-b24` tiêu đề "chu trình sinh tan" đổi thành "năm giai đoạn nhân lên của virus"
  (bài nói chung về virus, có cả nảy chồi). `sinh11-c1-b12` tái hấp thu "ở ống lượn gần" thành
  "chủ yếu ống lượn gần" (quai Henle, ống lượn xa, ống góp cũng tái hấp thu). `sinh11-c4-b23` thụ tinh "ở 1/3 đầu ống dẫn" thành "1/3 ngoài".
  `sinh12-c4-b18` "cắt bằng cùng một enzyme" thành "cùng enzyme giới hạn". `sinh10-c6-b19` mô sẹo
  "auxin cao" thành "auxin ≈ cytokinin" cho khớp lí thuyết bài thực hành.

## Lỗi hình và bố cục đã sửa

- Vẽ lại hẳn: `sinh10-c4-b10` (thêm hạt chất tan để thấy chênh lệch nồng độ, nhãn không bị cắt),
  `sinh10-c5-b14`, `sinh11-c1-b2` (cột nước trong mạch gỗ chạy như băng chuyền, ba lực hiện theo lời
  dẫn), `sinh11-c5-b25`, `sinh12-c7-b24` (nhãn nhiều tầng có vạch dẫn), `sinh12-c9-b27` (rừng có
  đủ tầng, đồ thị đa dạng mọc theo từng giai đoạn), `sinh12-c11-b31`, `sinh12-c11-b32` (thêm cột sản
  lượng hai kịch bản).
- Nhãn đè hình, đường gạch qua chữ, chữ tràn khung, chấm chạy xuyên chữ: `sinh10-c2-b4`,
  `sinh10-c3-b8` (thêm ribosome cho lưới nội chất HẠT), `sinh10-c7-b20`, `sinh10-c7-b22`,
  `sinh10-c8-b25`, `sinh11-c1-b1` (chữ 8–9 đơn vị lên ≥ 10), `sinh11-c2-b15`, `sinh11-c3-b20`
  (chấm chạy đúng trên đường tròn), `sinh12-c1-b5` (chữ trắng trên nền nhạt), `sinh12-c2-b8`
  (kiểu gene và tỉ lệ hiện trước khi tới lượt), `sinh12-c2-b12`, `sinh12-c3-b14`, `sinh12-c6-b21`.

## Bằng chứng

- Chụp lại đủ 64 hoạt ảnh sau khi sửa (không bài nào đứng yên). Đã xem bằng mắt ảnh của cả 42 bài
  sửa hình: dải 5 mốc với bài vẽ lại, mốc cuối với bài chỉ dời nhãn. 5 bài chỉ sửa chữ không chụp lại
  để xem riêng.
- Mọi hoạt ảnh sửa đều qua `LessonAnimationSchema` trước khi ghi (mô tả ≤ 800 ký tự, id không trùng,
  mốc không vượt `durationMs`).
- `npm run typecheck` ✅ · `eslint packages/subject-biology --max-warnings 0` ✅ ·
  `vitest run packages/subject-biology packages/core-ui packages/core-contracts apps/dhcb/src/pages/learning`
  110 file, 839 test ✅ · `npm run audit:prose -- --ci` 0 lỗi ✅.
- Bẫy mới ghi ở `TRAPS.md` mục 10.

## Còn lại

- 21 hoạt ảnh "chuỗi ô chữ" của Sinh đúng nội dung nhưng ít giá trị hình ảnh (chỉ là danh sách hiện
  lần lượt). Nên vẽ lại thành hình thật như đã làm với `sinh10-c8-b26`. Ứng viên đáng làm trước:
  `sinh10-c2-b5` (trùng ngưng), `sinh10-c8-b24` (virus nhân lên), `sinh11-c1-b12` (nephron),
  `sinh12-c1-b4` (ba kết cục của đột biến điểm), `sinh12-c4-b18` (ADN tái tổ hợp).
