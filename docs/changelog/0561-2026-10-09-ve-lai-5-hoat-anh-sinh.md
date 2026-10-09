# 0561 — Vẽ lại 5 hoạt ảnh Sinh từ "chuỗi ô chữ" thành hình thật (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** #1306 · **Loại:** `fix(biology)`
- **Nguồn:** nợ `PROGRESS.md` mục hoạt ảnh (2026-09-21 — PR #1099), phần "Còn thiếu: 21 hoạt ảnh
  Sinh dạng chuỗi ô chữ". Làm đúng 5 bài ưu tiên mà `docs/changelog/0462-*.md` mục "Còn lại" đã
  nêu. Đặc tả nền: `docs/specs/2026-09-21-hoat-anh-mo-phong-bai-hoc.md`,
  `docs/specs/2026-09-14-hoat-anh-minh-hoa-stem.md`. Khuôn chất lượng: `sinh10-c8-b26`.

## Vấn đề

Năm hoạt ảnh dưới đây chỉ là 4–6 ô chữ hiện lần lượt và một chấm chạy qua. Chữ đúng nhưng hình
không cho thêm thông tin gì: không thấy phân tử nước tách ra, virus bám vào đâu, dịch lọc đi qua
những đoạn nào của nephron, codon nào đổi, hay đầu dính khớp nhau ra sao.

## Đã làm

Chỉ thay khối `animation` của 5 bài; mọi trường khác giữ nguyên từng ký tự (đã kiểm bằng script so
sánh bản cũ/mới sau khi bỏ 5 khối này). Không sửa renderer, schema, hay nội dung bài.

| Bài                                              | Trước          | Sau                                                                                                                                                                                                                                                                                                                                                                                  | Mốc                                          |
| ------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| `sinh10-c2-b5` (Các phân tử sinh học)            | 4 ô chữ, 5,6 s | Ba đơn phân có nhóm H−/−OH. Đơn phân 2 rồi 3 trượt tới, −OH và H tách ra thành phân tử nước (O đỏ + 2 H) bay về góc "nước bị loại ra", chỗ nối hiện vạch liên kết. Khung gom "3 đơn phân, 2 liên kết, mất 2 H₂O". Cuối cùng một phân tử nước đi vào liên kết thứ hai, liên kết đứt: **thuỷ phân là phản ứng ngược**. 34 hình, 12 s                                                   | 5 (300 · 1500 · 4000 · 6800 · 8400 ms)       |
| `sinh10-c8-b24` (Khái quát về virus)             | 5 ô chữ, 6,7 s | Phage (đầu lục giác chứa acid nucleic, đuôi, 2 sợi chân) rơi xuống bám 2 thụ thể trên màng vi khuẩn. Acid nucleic đi vào trong, vỏ capsid rỗng ở ngoài mờ đi. Trong tế bào hiện thêm bản sao acid nucleic, đầu capsid và đuôi rời. Acid nucleic trượt vào đầu, đuôi gắn vào, thành 3 virion. Màng vỡ thành mảnh, 3 virus thoát ra (sinh tan). 37 hình, 14 s                          | 5 (0 · 2600 · 4800 · 7400 · 10000 ms)        |
| `sinh11-c1-b12` (Bài tiết, cân bằng nội môi)     | 4 ô chữ, 5,6 s | Sơ đồ nephron: cầu thận trong nang Bowman, ống lượn gần, quai Henle chữ U, ống lượn xa, ống góp, mao mạch chạy dọc phía trên. Một giọt dịch đi suốt đường ống và **nhỏ dần**. Mũi tên hiện theo chặng: lọc ra nang, tái hấp thu lên mao mạch, nước ra ở nhánh xuống và muối ra ở nhánh lên quai Henle, tiết H⁺/K⁺/thuốc xuống ống lượn xa, ống góp hút lại nước (ADH). 49 hình, 15 s | 5 (0 · 2600 · 5400 · 8000 · 10600 ms)        |
| `sinh12-c1-b4` (Đột biến gene)                   | 5 ô chữ, 6,7 s | Bốn hàng codon/amino acid. Một ribosome (khung nét đứt) đọc từng codon, mỗi lần đọc xong hiện thêm một hạt amino acid. Trình tự thật là codon 5–8 của gene β-globin, CCU GAG GAG AAG (Pro Glu Glu Lys). Đồng nghĩa: GAG → GAA, vẫn Glu. Nhầm nghĩa: GAG → GUG, Glu → Val, đúng đột biến gây hồng cầu hình liềm. Vô nghĩa: GAG → UAG, ribosome dừng sau Pro. 59 hình, 12 s            | 5 (300 · 3000 · 5600 · 8200 · 10400 ms)      |
| `sinh12-c4-b18` (Chọn giống bằng công nghệ gene) | 6 ô chữ, 7,8 s | ADN tế bào cho hai mạch, đoạn gene giữa. Plasmid vòng mang gene đánh dấu. Cùng enzyme cắt giới hạn cắt hai nơi: gene nhấc ra với **hai mạch so le (đầu dính)**, plasmid hở. Gene lấp chỗ hở, 2 chấm ligase nối thành ADN tái tổ hợp. Vòng thu nhỏ đi vào E. coli. Trên môi trường có kháng sinh, tế bào nhận plasmid sống, tế bào không nhận mờ đi. 46 hình, 16 s                    | 6 (0 · 2400 · 5000 · 7600 · 9800 · 12600 ms) |

Mỗi bài viết lại `description` cho khớp hình mới (≤ 800 ký tự, đủ để người dùng trình đọc màn hình
hình dung được) và `captions` theo đúng từng mốc. Tiêu đề hoạt ảnh của 4 bài cũng đổi theo.

**Kiến thức đối chiếu với chính bài trong repo**, không thêm gì bài không nói:

- Năm giai đoạn và chữ "giải phóng/phóng thích" lấy theo lí thuyết `sinh10-c8-b24`. Mô tả và lời
  dẫn ghi rõ hình vẽ phage và kết thúc sinh tan; virus động vật vào cả hạt và có thể ra bằng nảy
  chồi.
- Phần đột biến: mã di truyền chuẩn (GAA/GAG = Glu, GUG = Val, UAG = kết thúc). Tên "nhầm nghĩa
  (sai nghĩa)" theo lí thuyết bài. Mỗi mARN đột biến chỉ khác bản gốc ĐÚNG MỘT nucleotide.
- ADN tái tổ hợp: 3 bước của lí thuyết bài (tạo ADN tái tổ hợp → đưa vào tế bào nhận bằng CaCl₂ hoặc
  xung điện → chọn dòng nhờ gene đánh dấu kháng kháng sinh).
- Nephron: các con số (≈ 180 lít dịch lọc, ≈ 1,5 lít nước tiểu, tái hấp thu "chủ yếu" ở ống lượn gần)
  giữ như bản cũ đã rà ở 0462. ADH tăng tái hấp thu nước khớp lí thuyết bài.

**Cách dựng:** toạ độ và mốc tính bằng một script tạm (nội suy đúng giá trị ở mỗi mốc, vì
`giaiMoc` GIỮ giá trị mốc trước chứ không nội suy, xem TRAPS.md mục 10). Mỗi bộ qua
`LessonAnimationSchema` và `timLoiHoatAnh` trước khi ghi, rồi Prettier. Script không commit.

## Tầng 8b — ảnh đã xem và sửa gì sau khi xem

Chụp bằng `npm run shots:lesson-anim -- --subject biology --only <5 id>`. Ở container này Playwright
thiếu bản headless-shell 1243 nên chạy với `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
Ngoài 5 mốc chuẩn (2/25/50/75/98 %), mỗi bài còn chụp thêm 3–4 mốc giữa các chặng (bản sao tạm của
script với danh sách mốc khác, không commit). Đã xem bằng Read tool:

- **`sinh10-c2-b5`:** dải 5 mốc chuẩn, 5 mốc 55–90 % và ảnh 760px ở mốc 80/98 %.
  - Ở 55 %, phân tử nước thứ hai bay đè lên phân tử thứ nhất ở góc "nước bị loại ra" (máy kiểm
    cũng báo DE/CHAM). Sửa: nước 1 về ô phải, nước 2 về ô trái, hai đường bay không cắt nhau.
  - Sau thuỷ phân, đơn phân 3 chỉ dời 36 đơn vị nên "−OH H−" dính sát nhau. Sửa: dời 70.
  - Dòng ví dụ dùng "·" đọc nhầm thành "tinh bột · amino acid". Đổi sang dấu chấm phẩy.
  - Bỏ dòng chữ thừa ở đáy (viewBox 260 → 236).
- **`sinh10-c8-b24`:** lưới 8 mốc (2–98 %).
  - Mảnh màng vỡ dưới cùng trôi xuống gạch qua nhãn "tế bào chủ bị phá vỡ" (máy kiểm báo GACH ở
    82/98 %). Sửa: mảnh chỉ dời 3 đơn vị theo trục dọc.
- **`sinh11-c1-b12`:** lưới 8 mốc, sau đó ảnh 760px ở 12 % và 98 %.
  - Mũi tên lọc dài 12–15 đơn vị, bằng đúng đầu mũi tên, nên trông như tam giác rời. Sửa: thu
    búi mao mạch nhỏ lại, mũi tên dài 15, nét 1,5.
  - Giọt dịch xuất phát giữa búi mao mạch, tức trong máu chứ không phải dịch lọc. Sửa: giọt hiện ở
    cửa nang khi các mũi tên lọc đã hiện.
  - Giọt biến mất ở 98 %. Sửa: giọt giữ tới cuối vòng.
- **`sinh12-c1-b4`:** lưới 8 mốc và ảnh 760px dark-blue ở 98 %. Không thấy đè/cắt. Ribosome đi
  đúng hàng, dừng ở UAG.
- **`sinh12-c4-b18`:** lưới 8 mốc, rồi 4 mốc 68–98 %.
  - **Lỗi lớn:** ở chặng 5–6 plasmid biến mất. Tế bào E. coli tô nền đục vẽ SAU plasmid nên che mất
    plasmid khi nó đã vào trong. Sửa: hình nền (tế bào, nhiễm sắc thể) đứng trước plasmid trong mảng
    `shapes`.
  - Nhiễm sắc thể vi khuẩn trông như ngôi sao. Giảm biên độ gợn sóng.
- **Ma trận theme** (sau các sửa trên): 5 bài × {blue-sky, dark-blue, kid} × {390, 760}, 30 lượt.
  Đã xem dải 5 mốc của cả 5 bài ở dark-blue/760 và kid/760, cùng ảnh lẻ (kid/760 nephron 75 %, ADN
  98 %, đột biến 98 %; dark-blue/760 nephron 75 %, ADN 50 %; blue-sky/390 virus 50 %).
  - **Theme kid** đổi `primary` sang cam, trùng với `warn`. Giọt dịch cam chìm vào ống thận cam,
    gene đánh dấu cam lẫn vào vòng plasmid cam, hạt Val viền cam khó tách khỏi hạt thường. Sửa:
    giọt dịch và gene đánh dấu dùng `neutral`, hạt Val (nhầm nghĩa) dùng `danger`. Xem lại ở kid và
    dark-blue: cả ba đều tách màu rõ.
- Máy kiểm hình học của script: **0/30 lượt có dòng ⚠** ở lần chụp cuối.

Ảnh lưu ngoài repo (scratchpad của phiên), không commit ảnh nào.

## Bằng chứng cổng

- `npm run typecheck`: exit 0.
- `npx eslint packages/subject-biology --max-warnings 0`: exit 0.
- `npx prettier --check` 4 file bài học + `PROGRESS.md` + changelog này: "All matched files use
  Prettier code style!".
- `npx vitest run packages/subject-biology packages/core-contracts scripts/changelog.test.ts`:
  77 file, 527 test, tất cả đạt (gồm Zod `BiologyLessonSchema` và `timLoiHoatAnh` của mọi bài Sinh).
- `npm run audit:prose -- --ci`: 0 lỗi, 1185 cảnh báo. Chỉ 2 cảnh báo rơi vào 5 khối mới, cả hai
  là chữ cố ý: `TU_LAP "GAG GAG"` (trình tự thật CCU GAG GAG AAG) và `TU_LAP "kháng kháng"` ("gene
  kháng kháng sinh", đúng chữ lí thuyết của bài).

## Còn lại

- 16 hoạt ảnh Sinh dạng chuỗi ô chữ chưa vẽ lại. Danh sách lấy bằng cách tìm bài có các hình `o0…`
  và `con-chay`.
- Ở khổ 390px, chữ cỡ 10–11 trong viewBox 560–600 chỉ còn khoảng 7px. Cùng mức với các hoạt ảnh Sinh
  đã có, người học bấm "Xem lớn" để đọc. Bỏ thêm chữ khỏi hình thì mất nhãn tên bộ phận, nên chưa
  làm.
