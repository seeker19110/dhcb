# Rà mắt 56 hoạt ảnh Hoá học: sửa 54 bài (khoảng 25 sai kiến thức) và luật đọc mốc thời gian của bộ vẽ

- **Ngày:** 2026-09-26 · **PR:** PR của nhánh `seeker/zealous-allen-ygj0gw` (sau #1185)
- **Loại:** `fix(chemistry)`. Tiếp đợt Vật lí (`0457`). Người dùng giao "tự quyết cho chất lượng
  cao". Sinh học (64 hoạt ảnh) làm ở PR kế tiếp.

## Cách rà

Như đợt Vật lí: `npm run shots:lesson-anim -- --subject chemistry` chụp mỗi hoạt ảnh ở 5 mốc
(2/25/50/75/98%), máy kiểm hình học in dòng ⚠, rồi đọc từng dải ảnh và đối chiếu mô tả, lời dẫn,
lí thuyết của bài. Sau khi sửa, chụp lại đủ 56 bài và xem lại từng dải.

Kết quả: 54/56 bài phải sửa. Hai bài đạt nguyên trạng: `hoa10-c1-b3` (đồng vị chlorine),
`hoa10-c2-b7` (oxide chu kì 3).

## Bộ vẽ: luật đọc mốc thời gian (có lợi cho cả 5 môn)

Trước đây bộ vẽ đổi thẳng từng mốc sang `@keyframes` CSS, nên CSS tự lo phần người soạn không khai.
CSS làm sai ở ba chỗ:

1. **Mốc thiếu `dx`/`dy` bị điền `translate(0, 0)`.** Mốc `{ atMs: 2400, opacity: 0 }` sau mốc
   `{ atMs: 2000, dx: 96 }` có nghĩa "đứng ở đó rồi mờ đi", nhưng hình lại trượt về chỗ cũ.
2. **CSS bỏ qua mốc thiếu `opacity` khi nội suy.** Hình được soạn là "tới nơi rồi mới mờ" lại mờ
   dần suốt quãng đường.
3. **Thiếu mốc 0% hoặc 100% thì CSS lấy trạng thái nền.** Hình được soạn "ẩn tới giây thứ 3" lại
   hiện ngay từ đầu. Chấm chạy trên đồ thị trượt thẳng về điểm đầu ở cuối vòng.

Nay hàm thuần `giaiMoc` (`packages/core-ui/animationKeyframes.ts`) giải mốc đúng như người soạn
nghĩ trước khi sinh CSS. Thuộc tính không khai thì giữ giá trị mốc trước. Trước mốc đầu, hình giữ
trạng thái mốc đầu; sau mốc cuối, giữ trạng thái mốc cuối. Opacity ban đầu là opacity tĩnh của
hình. Mọi mốc in đủ `translate` + `rotate` + `scale` để trình duyệt nội suy từng con số, không phải
nội suy qua ma trận. Luật này ghi thẳng trong hợp đồng `AnimationKeyframeSchema`.

Máy so cách hiểu cũ và mới trên mọi hoạt ảnh. Có 40 hoạt ảnh chạy khác đi: 4 bài Lí, 6 bài Hoá,
26 bài Sinh, 4 module Lập trình. Đã đọc từng chỗ khác: tất cả đều là lỗi của cách hiểu cũ. Ví dụ:
khung so sánh của `algo-s1-m1` mờ dần suốt 7 giây, chấm chạy của nhiều bài Sinh trượt về đầu ở
cuối vòng. 4 bài Lí đã chụp lại và xem. Khi xem, lộ thêm hai lỗi có sẵn từ trước, đã sửa luôn:

- `ly10-c5-b29` (va chạm mềm): khối 4 kg sau va chạm phải đi 1 m/s, tức ¼ tốc độ đầu, như mô tả
  viết. Hình lại cho nó đi ½. Mũi tên động lượng "sau" cũng hiện mờ dần từ đầu, như thể B đứng yên
  mà có động lượng.
- `ly12-c4-b23` (chu kì bán rã): hạt tắt SAU mốc T, 2T, 3T 100 ms. Nay tắt trước mốc, nên đúng lúc
  chấm tới T thì còn đúng N₀/2.

**Thêm `scaleX`/`scaleY`** (co giãn một trục, quanh `origin`) cho thứ chỉ lớn theo một chiều: cột
thuỷ ngân dâng, chất lỏng đầy dần, thanh số liệu mọc lên. Trước đây phải dùng `scale` đều nên cột
thuỷ ngân phình ngang ra khỏi ống (`hoa11-c5-b20`).

## Lỗi kiến thức đã sửa

Điện hoá và pin:

- `hoa12-c5-b16` (điện phân CuSO₄, điện cực trơ): mô tả và lí thuyết của bài ghi "ion âm bị oxi hoá
  ở anode". SO₄²⁻ KHÔNG bị oxi hoá; nước bị oxi hoá thay (2H₂O → O₂ + 4H⁺ + 4e). Đã sửa cả phần lí
  thuyết của bài, không chỉ hoạt ảnh. Thêm bọt O₂ ở anode, lớp Cu bám mặt cathode quay vào dung
  dịch.
- `hoa10-c4-b13` (Zn + CuSO₄): electron bay xuyên dung dịch tới một ion Cu²⁺ ở xa, và Cu²⁺ không
  thành Cu. Nay Cu²⁺ tới sát bề mặt lá Zn, nhận 2e tại đó, Cu bám lên lá, Zn²⁺ tan ra.
- `hoa12-c5-b15` (pin Daniell): cầu muối vẽ xuyên qua thành cốc; nay cắm từ miệng cốc xuống. Thêm
  ion chạy trong cầu muối: anion về cốc kẽm, cation về cốc đồng. `hoa12-c90-b1` cũng thêm ion chạy
  như vậy, thay cho dòng chữ dài đè lên thành cốc và chân cầu muối.
- `hoa12-c6-b22` (ăn mòn điện hoá): mô tả gọi cách bảo vệ vỏ tàu bằng kẽm là "đảo lại nguyên lí".
  Thật ra đó là CÙNG nguyên lí: kim loại hoạt động mạnh hơn làm anode và bị ăn mòn thay. Ion Fe²⁺
  từng rơi vào dòng chữ.

Cấu tạo và liên kết:

- `hoa10-c3-b12`: liên kết hydrogen vẽ H···H, tức H của phân tử này nối với H của phân tử kia.
  Đúng phải là O–H···O.
- `hoa11-c2-b5`: H⁺ dừng bên cạnh cặp electron, không có liên kết mới, NH₄⁺ chỉ là chữ. Nay H⁺ tới
  trên N và cặp electron thành liên kết cho–nhận N–H.
- `hoa12-c6-b19`: mô tả giải thích bằng "liên kết có định hướng hay không", nhưng liên kết ion cũng
  KHÔNG định hướng. Sửa lời giải thích.
- `hoa12-c2-b4` (glucose): dạng vòng ghi "HO" ở C5, trong khi C5 mang CH₂OH. Vòng thiếu OH ở C1 và
  C3, và O không nằm ở một đỉnh của vòng. Nay vẽ lại: mạch hở đánh số C1–C6, mũi tên cong cho thấy O
  của nhóm OH ở C5 cộng vào C của nhóm CHO. Vòng 6 cạnh có O ở một đỉnh, nhóm OH mới ở C1 tô cùng
  màu với nhóm CHO cũ. Mũi tên cân bằng nằm giữa hai dạng.
- `hoa12-c8-b28`: cạnh bát diện và tứ diện chưa vẽ, tứ diện sai hình (hai đỉnh cùng phía trên).
  `hoa12-c8-b29`: [Cu(H₂O)₆]²⁺ mà chỉ vẽ 4 phân tử nước.
- `hoa12-c3-b10`: tiêu đề "Bốn bậc" nhưng chỉ vẽ 3 bậc.

Tính chất và thí nghiệm:

- `hoa10-c7-b16`: đường 25 °C vẽ ở mức −57 °C, nên Cl₂ (sôi −34 °C) nằm TRÊN đường, trái với "Cl₂ là
  khí". Nay vẽ khoảng thể lỏng của từng halogen (từ nhiệt độ nóng chảy tới nhiệt độ sôi) và đặt
  đường 25 °C đúng chỗ, nên thấy ngay F₂, Cl₂ khí, Br₂ lỏng, I₂ rắn.
- `hoa10-c6-b15`: hàng "đi chậm, năng lượng nhỏ" lại chạy NHANH hơn hàng "va chạm hiệu quả".
- `hoa11-c2-b4`, `hoa11-c2-b6`: ghi "tia sét ~3000 °C". Tia sét nóng tới hàng chục nghìn độ; 3000 °C
  là ngưỡng để N₂ + O₂ phản ứng. Cột năng lượng O=O cũng không đúng tỉ lệ với N≡N.
- `hoa11-c3-b11` (chưng cất): chất lỏng lòi ra ngoài bình cầu, hơi đi xuyên thành bình. Nay vẽ lại
  đủ bộ: bầu nhiệt kế ngang nhánh ra, nước lạnh chạy ngược chiều hơi, bình hứng "phần cất giàu
  ethanol".
- `hoa11-c3-b13`: dimethyl ether "rất ít tan". Thực tế nó tan khoảng 71 g/L, nên sửa thành "tan hạn
  chế".
- `hoa11-c4-b15` (thế gốc tự do): vòng lặp đưa Cl• về sai bước.
- `hoa11-c5-b21`: benzene phản ứng với Br₂ KHAN có bột Fe, không phải nước bromine.
- `hoa11-c5-b20`, `hoa11-c6-b24`: thang nhiệt độ và cột nhiệt độ sôi không tỉ lệ.
- `hoa12-c1-b2` (xà phòng): phân tử xà phòng không có đuôi, micelle không bị nước cuốn đi. Vẽ lại
  bằng phân tử có đầu và đuôi zigzag.
- `hoa12-c2-b5` (thuỷ phân saccharose): thêm cảnh OH và H của nước gắn vào hai đầu vừa cắt. Gương
  bạc nay bám thành ống, không tô kín cả ống.
- `hoa12-c4-b12`: sau trùng hợp mà chữ vẫn ghi "CH₂=CH₂".
- `hoa12-c7-b24`: thêm mẩu kim loại, giọt Na chạy trên mặt nước, lửa K màu tím nhạt.
- `hoa12-c8-b27`: màu "hồng nhạt" và "tím" đều tô bằng màu xanh.
- `hoa10-c2-b5`: lưới bảng tuần hoàn thiếu hai cột VIIA và VIIIA, ô cuối rộng gấp rưỡi. Nay đủ tám
  nhóm A, chu kì 1 chỉ có hai ô H và He. Khoảng trống giữa IIA và IIIA có chú thích "chỗ các nhóm
  B, chỉ có từ chu kì 4". Hàng 3 và cột VIA sáng lên đúng lúc đọc ra chu kì và nhóm.

## Bình chứa hở miệng bị vẽ có nắp

Ống nghiệm, cốc và bình hứng được vẽ bằng `rect` (hoặc đường khép kín có cả cạnh miệng), nên luôn
có cạnh trên: trông như bình có nắp.
Đã đổi sang đường hở miệng: ống nghiệm đáy tròn hoặc đáy bo, cốc đáy phẳng. Các bài:
`hoa11-c1-b2` (bình tam giác), `hoa11-c2-b8`, `hoa11-c3-b11`, `hoa11-c4-b17`, `hoa11-c5-b21`,
`hoa12-c2-b5`, `hoa12-c5-b15`, `hoa12-c5-b16`, `hoa12-c8-b27`, `hoa12-c90-b1`. Ấm đun ở
`hoa12-c7-b25` giữ nắp vì ấm có nắp thật.

## Lỗi bố cục đã sửa

Chữ tràn khung, chữ đè chữ, đường gạch qua chữ, và chấm chạy lệch khỏi đường nó phải đi theo:
`hoa10-c1-b2`, `b4` · `hoa10-c2-b6`, `b8` · `hoa10-c3-b9`, `b10` · `hoa10-c5-b14` ·
`hoa10-c7-b17` · `hoa11-c1-b1`, `b2` · `hoa11-c2-b7`, `b8` · `hoa11-c4-b16` · `hoa11-c5-b19` ·
`hoa11-c6-b23` · `hoa12-c1-b1` · `hoa12-c2-b6` · `hoa12-c3-b8`, `b9` · `hoa12-c4-b13` ·
`hoa12-c6-b18`, `b20`, `b21`. Màu quy ước dùng thống nhất: electron màu xanh lá (`correct`), Cu màu
cam (`warn`), dung dịch CuSO₄ màu xanh (`accent`), đường 25 °C và thứ nguy hiểm màu đỏ (`danger`).

## Bằng chứng

- Chụp lại đủ 56 hoạt ảnh sau khi sửa. Dòng ⚠ còn lại đều là ca cố ý: chữ nằm trong vòng tròn
  nguyên tử hoặc ion (Na, Cl, H₂O, Fe³⁺…), ion chạy trong cầu muối, electron chạy qua vôn kế. Đã xem
  lại bằng mắt dải ảnh của cả 56 bài.
- Máy so hoạt ảnh trước/sau (bản HEAD với bản sửa): 54/56 bài Hoá có thay đổi.
- `animationKeyframes.test.ts`: 7 ca mới cho `giaiMoc`. `LessonAnimation.test.tsx` thêm 2 ca: CSS in
  đủ mọi thuộc tính ở mọi mốc (kể cả 0% và 100%), và `scaleX`/`scaleY` quanh `origin`. Đã tự kiểm
  không xanh giả: bỏ phần "giữ giá trị mốc trước" trong `giaiMoc` thì 3 ca đỏ.
- Test bài học Hoá cùng Zod: 45/45.
- Bẫy mới ghi ở `TRAPS.md` mục 10: luật đọc mốc của CSS, và bình hở miệng bị vẽ có nắp.
