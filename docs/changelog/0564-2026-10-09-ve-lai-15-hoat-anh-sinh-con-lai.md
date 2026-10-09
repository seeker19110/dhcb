# 0564 — Vẽ lại 15 hoạt ảnh Sinh "chuỗi ô chữ" còn lại thành hình thật (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (điền sau khi tạo) · **Loại:** `fix(biology)`
- **Nguồn:** nợ `PROGRESS.md` mục hoạt ảnh (2026-09-21 — PR #1099), phần "Còn thiếu: 21 hoạt ảnh
  Sinh dạng chuỗi ô chữ". Tiếp nối changelog 0561 (5 bài, nhánh **chưa merge** lúc viết). Đặc tả
  nền: `docs/specs/2026-09-21-hoat-anh-mo-phong-bai-hoc.md`,
  `docs/specs/2026-09-14-hoat-anh-minh-hoa-stem.md`. Khuôn chất lượng: 0561 và `sinh10-c8-b26`.

## Số bài thật: 20, không phải 21

Đếm lại trên `main` (bài có hình `o0…` và `con-chay`): **20** hoạt ảnh, không phải 21 như changelog
0462 ghi. Trừ 5 bài của 0561 (`sinh10-c2-b5`, `sinh10-c8-b24`, `sinh11-c1-b12`, `sinh12-c1-b4`,
`sinh12-c4-b18`, không đụng tới ở đợt này) còn **15** bài, không phải 16 như 0561 mục "Còn lại".
Sau đợt này không còn hoạt ảnh Sinh nào dạng chuỗi ô chữ (tính cả 0561).

## Vấn đề

Mười lăm hoạt ảnh dưới đây chỉ là 3–6 ô chữ hiện lần lượt và một chấm chạy qua. Chữ đúng nhưng
hình không cho thêm thông tin gì: không thấy ti thể nằm ở cấp nào, tín hiệu đi qua màng ra sao,
thức ăn nhỏ dần ở đâu, NST nào không phân li, hay allele lặn trên X biểu hiện ở ô nào.

## Đã làm

Chỉ thay khối `animation` của 15 bài; mọi trường khác giữ nguyên từng ký tự (script so bản cũ/mới
sau khi bỏ mọi khối `animation`: 7/7 file giống hệt; đúng 15 khối `animation` khác bản cũ, các hoạt
ảnh khác trong cùng file không đổi). Không sửa renderer, schema, hay nội dung bài.

| Bài                                              | Trước          | Sau                                                                                                                                                                                                      | Hình | Mốc | Dài    |
| ------------------------------------------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | --- | ------ |
| `sinh10-c1-b3` (Các cấp độ tổ chức)              | 6 ô chữ, 7,8 s | Sáu ô xếp chữ S: phân tử DNA → ti thể (bào quan) → tế bào có vòng khoanh ti thể → mô → cây có vòng khoanh lá → quần thể/quần xã/hệ sinh thái; dòng cuối là sinh quyển. Mỗi cấp chứa cấp trước            | 57   | 7   | 14,5 s |
| `sinh10-c3-b7` (Tế bào nhân sơ)                  | 5 ô chữ, 6,7 s | Vi khuẩn dựng từ ngoài vào: thành tế bào, màng, ribosome, DNA vòng (vùng nhân), plasmid, lông roi/lông nhung. Cuối: 3 mũi tên khuếch tán và ý tỉ lệ S/V lớn                                              | 40   | 6   | 13,5 s |
| `sinh10-c4-b12` (Truyền tin tế bào)              | 3 ô chữ, 4,5 s | Màng tế bào; tín hiệu ưa nước gắn thụ thể màng → chuỗi truyền tin khuếch đại 1 → 2 → 4 → nhân bật gene, mARN ra. Bên phải: hormone steroid xuyên màng, gắn thụ thể nội bào, phức hợp vào nhân            | 46   | 5   | 13,5 s |
| `sinh10-c6-b19` (Công nghệ tế bào)               | 6 ô chữ, 7,8 s | Cây mẹ → mẫu vào cốc khử trùng → bình nuôi cấy: mô sẹo, chồi, rễ; cột tỉ lệ auxin–cytokinin quyết định ra chồi hay rễ; cuối là chậu cây con giống hệt cây mẹ                                             | 40   | 7   | 15 s   |
| `sinh11-c1-b6` (Hô hấp ở thực vật)               | 4 ô chữ, 5,6 s | Ti thể có màng trong gấp nếp; glucose 6 chấm carbon tách thành 6 CO₂; vòng Krebs quay; electron đi qua 3 phức hệ tới O₂ → H₂O; bộ đếm ATP 2 → 4 → 30–32                                                  | 33   | 5   | 14 s   |
| `sinh11-c1-b8` (Tiêu hoá ở động vật)             | 6 ô chữ, 7,8 s | Ống tiêu hoá người; viên thức ăn đi qua từng chặng và nhỏ dần, nhãn hiện theo chặng; tuỵ đổ dịch vào ruột non; mũi tên hấp thụ ở ruột non; ruột già hút nước                                             | 27   | 6   | 13 s   |
| `sinh11-c3-b17` (Sinh trưởng ở thực vật)         | 4 ô chữ, 5,6 s | Cây cao lên ở ngọn, vị trí cành giữ nguyên độ cao (sinh trưởng sơ cấp). Lát cắt thân: tầng sinh mạch (nét đứt đỏ) to dần, để lại vòng năm phía trong, vỏ phía ngoài (sinh trưởng thứ cấp)                | 30   | 6   | 14 s   |
| `sinh11-c3-b19` (Sinh trưởng ở động vật)         | 4 ô chữ, 5,6 s | Vòng đời bướm: trứng → sâu → nhộng → bướm vỗ cánh, mũi tên quay về (biến thái hoàn toàn). Châu chấu lớn lên qua các lần lột xác, để lại xác nét đứt, chỉ con trưởng thành mới có cánh (không hoàn toàn)  | 54   | 7   | 15 s   |
| `sinh11-c4-b21` (Sinh sản ở thực vật)            | 5 ô chữ, 6,7 s | Nhuỵ cắt dọc, noãn có lỗ hướng lên. Hạt phấn nảy ống phấn, 2 giao tử đực: một + trứng → hợp tử 2n, một + nhân cực → nhân 3n → nội nhũ (thụ tinh kép). Bầu lớn thành quả, noãn thành hạt                  | 38   | 5   | 13,5 s |
| `sinh11-c4-b23` (Sinh sản ở động vật)            | 5 ô chữ, 6,7 s | Buồng trứng, loa vòi, ống dẫn trứng, tử cung có niêm mạc. Trứng rụng, tinh trùng đi lên, thụ tinh ở 1/3 ngoài ống dẫn trứng. Hợp tử phân cắt 2 → 4 tế bào → phôi dâu → phôi nang → làm tổ trong niêm mạc | 37   | 6   | 13,5 s |
| `sinh12-c1-b6` (Đột biến số lượng NST)           | 5 ô chữ, 6,7 s | Tế bào mẹ 2 cặp NST. Giảm phân I: cặp ngắn không phân li (vòng đỏ). Bốn giao tử n + 1 và n − 1. Thụ tinh với giao tử bình thường (n = 23): hợp tử 47 (thể ba, hội chứng Down) và 45 (thể một)            | 57   | 5   | 14 s   |
| `sinh12-c2-b11` (Di truyền liên kết giới tính)   | 5 ô chữ, 6,7 s | NST X có dải allele (xanh A, đỏ a), Y ngắn không có allele. Mẹ XᴬXᵃ × bố XᴬY → giao tử → khung 2 × 2 tự điền bằng trượt. Ô XᵃY viền đỏ: con trai chỉ có một X nên allele lặn biểu hiện                   | 53   | 5   | 13,5 s |
| `sinh12-c4-b16` (Chọn giống vật nuôi, cây trồng) | 5 ô chữ, 6,7 s | P bông to + lá đốm × bông nhỏ + lá sạch → F₂ bốn tổ hợp → khoanh chọn bông to + lá sạch, đánh giá qua vụ 1–3 → Fₙ dòng thuần. Cột 5 bước bên phải có chấm đánh dấu theo chặng                            | 59   | 6   | 14,5 s |
| `sinh12-c4-b17` (Công nghệ tế bào thực vật)      | 5 ô chữ, 6,7 s | Tế bào khoai tây và cà chua; cellulase phá thành → tế bào trần; xung điện/PEG → dung hợp thành tế bào lai, nhân chung bộ NST hai loài → mô sẹo → cây lai mang đặc điểm của cả hai                        | 40   | 5   | 13,5 s |
| `sinh12-c6-b23` (Hình thành loài)                | 5 ô chữ, 6,7 s | Bản đồ 12 cá thể giao phối tự do; sông chia đôi; mỗi bên đổi màu dần (đỏ/xanh), hai thanh vốn gene phân hoá. Sông mất, hai cá thể gặp lại nhưng có dấu X: cách li sinh sản mới là mốc thành loài         | 41   | 5   | 14 s   |

Mỗi bài viết lại `description` cho khớp hình mới (≤ 800 ký tự) và `captions` theo đúng từng mốc.
Mô tả chỉ nhắc màu cố định ở mọi theme (`correct`/`danger`); không ghi "chấm đen" hay "vạch xám"
vì `neutral`/`muted` đổi sáng tối theo theme.

**Kiến thức đối chiếu với lí thuyết của chính bài trong repo**, không thêm gì bài không nói:

- Cấp độ tổ chức "từ phân tử đến sinh quyển" theo lí thuyết `sinh10-c1-b3` (phân tử → bào quan → tế bào → mô
  → cơ quan/cơ thể → quần thể → quần xã → hệ sinh thái → sinh quyển).
- Hô hấp: đường phân ở tế bào chất, Krebs ở chất nền, chuỗi truyền electron ở màng trong; con số
  ATP 30–32 lấy theo lí thuyết bài.
- Thụ tinh kép: hợp tử 2n và nhân nội nhũ 3n, bầu → quả, noãn → hạt theo lí thuyết `sinh11-c4-b21`.
  Thụ tinh ở 1/3 ngoài ống dẫn trứng theo `sinh11-c4-b23`.
- Lệch bội: không phân li ở giảm phân I cho n + 1 và n − 1, thể ba 2n + 1 = 47 (Down), thể một
  2n − 1 = 45, theo lí thuyết `sinh12-c1-b6`.
- Mù màu: allele lặn trên X, Y không mang allele tương ứng; tỉ lệ con trai bị bệnh 1/2 trong phép lai
  XᴬXᵃ × XᴬY.
- Hình thành loài khác khu vực địa lí: cách li địa lí chỉ tạo điều kiện, cách li sinh sản mới là mốc
  thành loài (đúng câu chốt của lí thuyết `sinh12-c6-b23`).

**Cách dựng:** toạ độ và mốc tính bằng script tạm có hàm nội suy (vì `giaiMoc` GIỮ giá trị mốc
trước chứ không nội suy, xem TRAPS.md mục 10) và làm tròn `atMs` thành số nguyên. Mỗi bộ qua
`LessonAnimationSchema` và `timLoiHoatAnh` trước khi ghi, rồi Prettier. Script không commit.

## Tầng 8b — ảnh đã xem và sửa gì sau khi xem

Chụp bằng bản sao tạm của `npm run shots:lesson-anim` (để thêm mốc giữa), với
`CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` vì container thiếu
headless-shell 1243. Mỗi bài chụp 8 mốc (2/15/30/45/60/75/88/98 %) ở blue-sky/760 qua nhiều vòng,
xem bằng Read tool. Lỗi tìm thấy và đã sửa:

- **`sinh10-c1-b3`:** nếp màng trong của ti thể tràn ra ngoài elip (biên độ nếp nay theo bề cao
  elip). Ở mốc 2 % khung trống (ô 1 nay vẽ tĩnh). Tai thỏ lệch khỏi đầu.
- **`sinh10-c3-b7`:** nhãn "(chỉ ở một số vi khuẩn)" đặt lơ lửng, không rõ nói về gì → dời xuống
  góc dưới phải, ghi đủ "Lông roi, lông nhung: chỉ có ở một số vi khuẩn". DNA vòng gợn quá mạnh trông
  như ngôi sao → giảm biên độ.
- **`sinh10-c4-b12`:** nhãn "thụ thể nội bào" vẫn còn sau khi phức hợp đã vào nhân → mờ đi đúng lúc.
- **`sinh10-c6-b19`:** mô sẹo tô màu tối như vết bẩn → nền `surface`, viền `neutral`.
- **`sinh11-c1-b6`:** nếp màng trong quá nhọn; nhãn "NADH, FADH₂" và "O₂ + e⁻ → H₂O" bị nếp gấp
  gạch qua → nếp rộng hơn, dời nhãn và điểm cuối đường electron.
- **`sinh11-c1-b8`:** ruột già chồng lên ruột tịt, đoạn nối chéo → dời các hàng ruột, vẽ lại đoạn
  nối.
- **`sinh11-c3-b17`:** máy kiểm báo CHAM ở nhãn tầng sinh mạch (khi vòng to ra, hộp bao chạm nhãn)
  → nhãn và đường dẫn bám theo vòng, dời ra xa. Vòng tầng sinh mạch mảnh khó thấy → nét dày hơn.
- **`sinh11-c3-b19`:** châu chấu khó nhận ra → thêm chân sau, râu, cánh màu muted; thêm xác lột nét
  đứt. Nhãn "lột xác" bị chấm và râu đè (máy kiểm báo CHAM rồi GACH) → nâng nhãn, rút ngắn râu.
- **`sinh11-c4-b21`:** hạt phấn còn lơ lửng sau khi nhuỵ đã héo → mờ đi. Ở theme **kid**, ống phấn
  màu `warn` lẫn vào vòi nhuỵ (primary thành cam) → ống phấn dùng `muted`; xem lại kid/760: tách rõ.
- **`sinh11-c4-b23`:** nhãn "phôi nang" và "làm tổ" bị thành tử cung gạch qua → dời ra ngoài. Loa
  vòi trông như đầu mũi tên → vẽ thành tua toả.
- **`sinh12-c1-b6`:** **lỗi lớn:** khi nhiễm sắc tử trượt sang chặng sau, ô tế bào trước trống
  trơn, sơ đồ không đọc được theo hàng → mỗi chặng là một bản sao trượt ra, ô cũ giữ hình; bỏ 6 mũi
  tên thừa. Nhãn "giảm phân I" đè ô tế bào → dời.
- **`sinh12-c2-b11`:** chữ "Y không có allele" tràn khỏi khung ở mốc 760 → dời cả cụm bố sang trái.
- **`sinh12-c4-b17`:** nhãn "tế bào khoai tây" đè nhãn "tế bào trần" (máy kiểm báo DE) → chỉnh lúc
  hiện/ẩn. Mô sẹo trông như ngôi sao → giảm gợn.
- **`sinh12-c6-b23`:** sông tràn quá mép vùng đất; dấu X đè lên chấm cá thể → tách hai cá thể xa
  hơn.
- **Mô tả:** sửa "chấm xanh" thành "chấm đỏ" ở `sinh11-c3-b17` (lệch với hình); bỏ "chấm đen" ở
  `sinh12-c6-b23` và "(vạch xám)" vì màu đó đảo ở theme tối.
- **Ma trận theme cuối:** 15 bài × {blue-sky, dark-blue, kid} × {390, 760} = 90 lượt, 5 mốc chuẩn.
  Đã xem montage dark-blue/760 và kid/760 của các bài, ảnh lẻ kid/760 (`sinh11-c3-b19` 98 %,
  `sinh11-c4-b21` 25 %) và ảnh 390. Máy kiểm hình học: **0/90 lượt có dòng ⚠**.

Ảnh lưu ngoài repo (scratchpad của phiên), không commit ảnh nào.

## Bằng chứng cổng

- `npm run typecheck`: exit 0.
- `npx eslint packages/subject-biology --max-warnings 0`: exit 0.
- `npx prettier --check` 7 file bài học + `PROGRESS.md` + changelog này: "All matched files use
  Prettier code style!".
- `npx vitest run packages/subject-biology packages/core-contracts scripts/changelog.test.ts`:
  77 file, 527 test, tất cả đạt (gồm Zod `BiologyLessonSchema` và `timLoiHoatAnh` của mọi bài Sinh).
- `npm run audit:prose -- --ci`: 0 lỗi, 1183 cảnh báo. Không cảnh báo nào nằm trong chữ của 15
  khối mới (đã đối chiếu số dòng; các cảnh báo gần đó ở `sinh12c1.ts` là tỉ lệ kiểu "3 : 1" có sẵn
  ở bài khác, không đổi ký tự nào).

## Còn lại

- 0561 (5 bài) chưa merge lúc viết; hai đợt sửa khác bài nhau nhưng cùng chạm `sinh10c1.ts`,
  `sinh11c1.ts`, `sinh12c1.ts` và `PROGRESS.md` (cùng dòng nợ) — merge sau sẽ cần gộp tay dòng đó.
- Ở khổ 390px, chữ cỡ 10–11 trong viewBox 600 chỉ còn khoảng 7px. Cùng mức các hoạt ảnh Sinh khác,
  người học bấm "Xem lớn" để đọc.
