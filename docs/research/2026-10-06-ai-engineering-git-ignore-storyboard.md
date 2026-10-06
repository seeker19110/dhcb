# Storyboard nháp: Git ignore, workdir → staging → commit/HEAD

> Trạng thái: **DRAFT — chờ reviewer chuyên môn duyệt**, ngày 2026-10-06. Chưa có reviewer nào duyệt; tài liệu **không** ghi nhận bất kỳ kết quả review nào và **không** phải căn cứ để gắn `animation` vào bài. Bài đích: `p3-u11-l1`. Mọi điểm đánh dấu **CẦN CHUYÊN GIA CHỐT** (mục 8) phải có quyết định trước khi viết dữ liệu hoạt họa.

## 1. Bảng đối chiếu theo cổng ⑤.1 của đặc tả hoạt họa

| Ô                      | Nội dung                                                                                                                                                                                                                                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bài ID                 | `p3-u11-l1` (`packages/subject-programming/lessons/p3u11.ts`, language `git`).                                                                                                                                                                                                                                       |
| Mục tiêu               | Người học giải thích được: `.gitignore` làm file **chưa theo dõi** khớp mẫu không vào vùng chờ và không vào commit, nhưng file vẫn còn trong thư mục làm việc; ignore **không** tác động file đã theo dõi (đặc tả [gitignore-state-grading](../specs/2026-10-05-gitignore-state-grading.md), mục "Kết quả học tập"). |
| Câu hỏi kiểm tra       | (a) Sau `git add .` rồi `git commit`, `model.pt` nằm ở đâu? (b) Sau commit, `.env` còn trên máy không? (c) File đã commit từ trước, sửa rồi `git add`, có bị ignore chặn không? Đáp án ở mục 6.                                                                                                                      |
| Lý do cần chuyển động  | Cơ chế là **dòng chảy qua ba vùng theo thứ tự lệnh**: hình tĩnh không cho thấy thẻ nào đi qua, thẻ nào đứng lại ở lệnh nào. Ví dụ code chạy được chỉ in transcript, không cho thấy trạng thái từng vùng.                                                                                                             |
| Reviewer chuyên môn    | **Chưa chỉ định** — CẦN CHUYÊN GIA CHỐT (người xác nhận nội dung Git; không ghi tên khi chưa có).                                                                                                                                                                                                                    |
| Số trạng thái          | 5 mốc (M1–M5), trong khoảng 3–5 theo quy tắc chọn ①.                                                                                                                                                                                                                                                                 |
| Quy tắc chọn ① (1)–(5) | (1) có câu hỏi kiểm tra được; (2) 5 trạng thái khác nhau; (3) cảnh cuối giải thích đáp án; (4) mô tả chữ độc lập chuyển động (mục 5); (5) **chưa đạt** — chờ reviewer. Chưa đủ (5) thì không thêm `animation`.                                                                                                       |

Bằng chứng đã đọc: [đặc tả hoạt họa](../specs/2026-10-05-ai-engineering-lesson-animation.md), [đặc tả chấm trạng thái gitignore](../specs/2026-10-05-gitignore-state-grading.md) (mục "Nội dung/hoạt họa và bằng chứng", "Hợp đồng subset mô phỏng"), [phát lại hoạt họa](../specs/2026-10-05-lesson-animation-replay.md), schema [lessonAnimation.ts](../../packages/core-contracts/lessonAnimation.ts), mẫu [storyboard gradient](2026-10-05-ai-engineering-gradient-pilot-storyboard.md), và bài thật `p3-u11-l1`. Bài hiện chưa có `animation`; bài hiện chỉ dựng README + `.gitignore` (hai dòng `.env`, `__pycache__/`), chưa có fixture file model; fixture mới thuộc PR B của đặc tả chấm trạng thái.

## 2. Đối chiếu bằng Git thật (không dựa vào hình vẽ)

Chạy Git 2.43.0 trong thư mục tạm (ngoài repo): commit sẵn `app.py` và `old.pt`; tạo `README.md`, `.env`, `model.pt`, `model.pth`, `model.safetensors`; viết `.gitignore` gồm `.env`, `*.pt`, `*.pth`, `*.safetensors`, `__pycache__/`.

| Bước                                         | `git status --short` (nguyên văn)                                                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Sau `git add .`                              | `A  .gitignore` · `A  README.md`                                                                                                     |
| Sửa `app.py` và `old.pt` (cả hai đã tracked) | `A  .gitignore` · `A  README.md` · ` M app.py` · ` M old.pt`                                                                         |
| Sau `git add app.py`                         | `A  .gitignore` · `A  README.md` · `M  app.py` · ` M old.pt`                                                                         |
| Sau `git commit`                             | HEAD gồm `.gitignore`, `README.md`, `app.py`, `old.pt`; thư mục làm việc còn đủ `.env`, `model.pt`, `model.pth`, `model.safetensors` |

Hệ quả phải giữ trong hình: (1) bốn file khớp mẫu **không** xuất hiện trong status lẫn HEAD; (2) `app.py` **không khớp mẫu nào** nên việc nó vào vùng chờ **không** chứng minh được gì về ignore; (3) `old.pt` vừa tracked vừa khớp `*.pt` vẫn hiện ` M` — đây mới là bằng chứng "ignore không ảnh hưởng file đã theo dõi" (xem CẦN CHUYÊN GIA CHỐT #1). Bằng chứng này là Git thật; simulator `gitSim.ts` chưa cài logic ignore ở thời điểm viết, nên hình **chưa** có bản chạy mô phỏng đối chiếu.

## 3. Bố cục thẻ

**Mô hình đề xuất: thẻ "bản chụp" đi, file gốc đứng yên.** Thư mục làm việc luôn giữ đủ 7 thẻ file. Khi `add`/`commit`, một thẻ **bản chụp** cùng tên (gắn nhãn "bản chụp") đi từ thư mục làm việc sang vùng chờ rồi sang HEAD; thẻ gốc không biến mất. Lý do: nếu thẻ gốc "di chuyển", người học dễ hiểu `commit` lấy file khỏi máy, đúng điều cảnh M5 phải bác bỏ. Xem CẦN CHUYÊN GIA CHỐT #6.

### Một viewBox cho cả hai viewport

Schema chỉ có một cặp `viewBoxWidth/Height`, nên **một bố cục dọc** dùng cho cả 390 px và 1440 px (ở 1440 px renderer chỉ phóng theo khung chứa, không đổi bố cục). Đề xuất `480×660`, `loop=false`, `durationMs=10800`. Bố cục ngang ba cột chỉ khả thi ở 1440 px; vì renderer không có hai viewBox, ngang cho desktop và dọc cho mobile cần đổi hạ tầng và **ngoài phạm vi** bản nháp này. Ở 390 px, chữ cỡ 20 đơn vị hiển thị khoảng 13 px (pilot gradient đo 13,17 px); phải đo lại bằng ảnh thật và ngưỡng ≥12 px. Mọi chữ SVG cỡ ≥20 đơn vị.

| Vùng (dải)       | y (viewBox) | Tiêu đề nhãn chữ         | Ô thẻ                                                       |
| ---------------- | ----------- | ------------------------ | ----------------------------------------------------------- |
| Thư mục làm việc | 8–340       | `Thư mục làm việc`       | 2 cột (x=16 và x=248), thẻ 216×64, hàng y=52, 124, 196, 268 |
| Dải lệnh         | 348–388     | nhãn lệnh hiện từng bước | một dòng chữ lệnh, canh giữa                                |
| Vùng chờ         | 396–512     | `Vùng chờ`               | 3 ô thẻ 144×64 tại x=16, 168, 320; y=436                    |
| Commit HEAD      | 520–636     | `Commit HEAD`            | 3 ô thẻ 144×64 tại x=16, 168, 320; y=560                    |

Thẻ ghi tên file ở dòng 1 và **nhãn trạng thái chữ** ở dòng 2 (không dựa vào màu): `chưa theo dõi`, `đã theo dõi`, `bỏ qua`, `đã sửa`, `bản chụp`. Thẻ bị ignore thêm viền nét đứt (`dash`) làm tín hiệu thứ hai ngoài chữ. Nhãn đi cùng thẻ dùng chung keyframe `dx/dy` với thẻ. Chữ nhãn dùng role `neutral` (AAA); không dùng màu làm kênh duy nhất.

Ô thư mục làm việc (thiết kế tọa độ, kiểm lại bằng ảnh):

| Ô         | Thẻ gốc             | Nhãn đầu (M1)   |
| --------- | ------------------- | --------------- |
| (16, 52)  | `.env`              | `chưa theo dõi` |
| (248, 52) | `model.pt`          | `chưa theo dõi` |
| (16, 124) | `model.pth`         | `chưa theo dõi` |
| (248,124) | `model.safetensors` | `chưa theo dõi` |
| (16, 196) | `app.py`            | `đã theo dõi`   |
| (16, 268) | `README.md`         | `chưa theo dõi` |
| (248,268) | `.gitignore`        | `chưa theo dõi` |

Ở M1, HEAD đã có thẻ `app.py` tại ô H3 (320, 560), nhãn `commit cũ`. Ô (248, 196) bỏ trống. `model.safetensors` dài nhất (17 ký tự); phải kiểm không tràn thẻ 216 ở cỡ chữ thật.

## 4. Mốc thời gian, thứ tự di chuyển thẻ

`durationMs=10800` (≈10,8 s; bản nháp gốc ~10 s). Mỗi mốc giữ **1500 ms** (≥1,5 s). Các mốc quyết định trong chuyển tiếp cách nhau **≥600 ms**.

| Mốc | Giữ để đọc | Chuyển tiếp đi vào mốc | Chuyển động theo thứ tự (ms tuyệt đối)                                                                                                                                                                                                                                                                                                                          |
| --- | ---------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | 0–1500     | Không có               | Đứng yên: ba dải có nhãn chữ, 7 thẻ ở thư mục làm việc, `app.py` ở HEAD.                                                                                                                                                                                                                                                                                        |
| M2  | 2200–3700  | 1500–2200 (700)        | Nhãn `chưa theo dõi` của bốn thẻ khớp mẫu mờ đi và nhãn `bỏ qua` hiện lên, lần lượt `.env` (1500), `model.pt` (1600), `model.pth` (1700), `model.safetensors` (1800), mỗi nhãn đổi trong 400 ms. Viền nét đứt hiện cùng nhãn. Thẻ không di chuyển.                                                                                                              |
| M3  | 4400–5900  | 3700–4400 (700)        | Dải lệnh hiện `git add .`. Bản chụp `README.md` đi từ (16,268) xuống vùng chờ (16,436) trong 3700–4300; bản chụp `.gitignore` đi từ (248,268) tới (168,436) trong 3800–4400. Bốn thẻ bị bỏ qua và `app.py` đứng yên; nhãn gốc của hai file đổi thành `đã theo dõi` ở mốc M5, không phải ở đây.                                                                  |
| M4  | 7100–8600  | 5900–7100 (1200)       | Hai quyết định cách nhau 600 ms. **Sửa** (5900–6500): dải lệnh hiện `sửa app.py`; nhãn `đã sửa` hiện cạnh thẻ `app.py`. **Add** (6500–7100): dải lệnh hiện `git add app.py`; bản chụp `app.py` đi từ (16,196) tới vùng chờ (320,436), băng qua thẻ `README.md` gốc.                                                                                             |
| M5  | 9300–10800 | 8600–9300 (700)        | Dải lệnh hiện `git commit`. Ba bản chụp `README.md`, `.gitignore`, `app.py` cùng đi xuống HEAD (dy +124), lệch nhau 100 ms (8600, 8700, 8800), mỗi bản 600 ms. Bản chụp `app.py` đè lên thẻ `commit cũ` (nhãn `commit cũ` mờ đi). Vùng chờ trống. Hai nhãn gốc `README.md`/`.gitignore` đổi thành `đã theo dõi`. Bốn thẻ bị bỏ qua vẫn đứng ở thư mục làm việc. |

Ghi chú tính thời gian: chuyển tiếp M3→M4 dài 1200 ms vì chứa hai quyết định cách nhau 600 ms; tổng 5×1500 + 700 + 700 + 1200 + 700 = **10 800 ms**. Nếu reviewer muốn đúng 10 s thì phải bỏ cảnh "sửa" riêng (gộp vào M4 làm một quyết định), nhưng sẽ mất bước "sửa rồi mới add". Nhãn lệnh đổi nội dung theo bước nên dùng nhiều shape `label` (mỗi lệnh một nhãn, hiện/ẩn bằng opacity), không đổi text của một shape.

Giới hạn schema cần kiểm khi cài: tổng shape ≤60 (ước tính ≈50: 3 dải + 3 tiêu đề + 4 nhãn lệnh + 14 thẻ gốc/tên + ≈14 nhãn trạng thái + 9 bản chụp/tên/nhãn + 3 thẻ HEAD cũ — đếm lại khi cài), keyframe ≤20 mỗi shape, caption ≤12. **Không dùng opacity tĩnh cộng với keyframe opacity** (cảnh báo từ pilot gradient): hình hiện muộn khai opacity 0 ở mốc đầu và 1 ở mốc hiện.

Ảnh nghiệm thu 2/25/50/75/98% tương ứng 216 / 2700 / 5400 / 8100 / 10584 ms: nằm trong M1 hoặc đầu M1→M2, giữa M2, giữa M3→M4 (sau add `README`), M4 hoặc đầu M4→M5, và M5. Phải nhìn thấy khác nhau ít nhất 3 mốc (cổng ⑤.4).

## 5. Nguyên văn title, description, captions

**Title:** "Ignore: file bị bỏ qua ở lại thư mục làm việc, không vào commit".

**Description (đề xuất):**

> Ba vùng của Git: Thư mục làm việc, Vùng chờ, Commit HEAD. Thư mục làm việc có README.md, .gitignore, .env, model.pt, model.pth, model.safetensors và app.py; app.py đã nằm trong commit từ trước. .gitignore liệt kê .env, *.pt, *.pth, *.safetensors nên bốn file đó có nhãn bỏ qua. git add . chỉ đưa README.md và .gitignore sang Vùng chờ. app.py đã được theo dõi nên sau khi sửa, git add app.py vẫn đưa nó sang Vùng chờ. git commit đưa README.md, .gitignore và app.py vào HEAD; bốn file bị bỏ qua vẫn còn trong Thư mục làm việc.

**Captions (năm câu, mỗi câu đọc độc lập; ≤240 ký tự):**

1. `0 ms`: "Bước 1: ba vùng của Git. Thư mục làm việc có README.md, .gitignore, .env, model.pt, model.pth, model.safetensors và app.py; app.py đã nằm trong commit HEAD từ trước."
2. `2200 ms`: ".gitignore liệt kê .env, *.pt, *.pth, *.safetensors. Bốn file khớp được ghi nhãn 'bỏ qua'. Ignore chỉ áp cho file chưa được theo dõi."
3. `4400 ms`: "Bước 3: git add . chỉ đưa README.md và .gitignore sang Vùng chờ. Bốn file bị bỏ qua đứng yên ở Thư mục làm việc."
4. `7100 ms`: "Bước 4: app.py đã được theo dõi; sau khi sửa, git add app.py vẫn đưa nó sang Vùng chờ. Ignore không ảnh hưởng file đã theo dõi."
5. `9300 ms`: "Bước 5: git commit đưa README.md, .gitignore và app.py vào HEAD. Bốn file bị bỏ qua vẫn ở Thư mục làm việc: file vẫn còn trên máy, chỉ không vào lịch sử."

Caption 2 giữ nguyên câu của bản nháp gốc ở đầu; caption 4 chỉ đúng nếu thẻ "tracked cũ" khớp mẫu (xem #1): với `app.py` không khớp mẫu nào, chữ của hình **không được** ngụ ý `app.py` "thoát ignore". Không có caption nhắc `__pycache__/` (xem #3). Số caption 5 ≤ 12; không có số liệu thập phân nào cần làm tròn.

Renderer hiện liệt kê **toàn bộ** captions; vì vậy câu đọc được một mình và không phụ thuộc màu hay vị trí hình.

## 6. Đáp án kiểm độc lập

Đáp án dưới đây suy ra từ Git thật (mục 2) và từ hợp đồng subset của đặc tả, không từ vị trí vẽ. Các câu (a)–(c) nên dùng làm bộ ví dụ có đáp án cho reviewer, chưa phải câu thêm vào bài.

| Câu hỏi                                                                        | Đáp án                                                                                              |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| (a) Sau `git add .` rồi `git commit`, `model.pt` nằm ở đâu?                    | Chỉ ở Thư mục làm việc; không trong Vùng chờ, không trong HEAD, không trong bất kỳ commit nào.      |
| (b) Sau commit, `.env` còn trên máy không?                                     | Còn nguyên: ignore không xóa file.                                                                  |
| (c) File đã commit từ trước, sửa rồi `git add <tên>`, có bị ignore chặn không? | Không; ignore chỉ áp cho file chưa theo dõi. Git thật: tracked + khớp `*.pt` vẫn hiện ` M` (mục 2). |
| Trạng thái cuối                                                                | HEAD = {`README.md`, `.gitignore`, `app.py`}; Vùng chờ rỗng; Thư mục làm việc = đủ 7 file.          |

Đối chiếu trạng thái từng mốc (dùng cho test số/trạng thái khi cài; phải khớp `gitState` của simulator nếu simulator có logic ignore, đặc tả PR A):

| Mốc | Thư mục làm việc        | Vùng chờ                            | HEAD                                    |
| --- | ----------------------- | ----------------------------------- | --------------------------------------- |
| M1  | 7 file                  | rỗng                                | `app.py` (commit cũ)                    |
| M2  | 7 file                  | rỗng                                | `app.py`                                |
| M3  | 7 file                  | `README.md`, `.gitignore`           | `app.py`                                |
| M4  | 7 file, `app.py` đã sửa | `README.md`, `.gitignore`, `app.py` | `app.py` (bản cũ)                       |
| M5  | 7 file                  | rỗng                                | `README.md`, `.gitignore`, `app.py` mới |

Probe ignore (chấm semantic theo đặc tả): `.env`, `model.pt`, `model.pth`, `model.safetensors` = bỏ qua; `README.md`, `.gitignore`, `app.py` = không bỏ qua. Không dùng hình hay caption làm bằng chứng chấm bài; hoạt họa không ảnh hưởng chấm, tiến độ hoặc SRS.

## 7. Giảm chuyển động, phát lại hữu hạn, truy cập

- `loop=false`: dừng ở M5 (cảnh cuối đọc được kết luận). Theo hợp đồng [phát lại](../specs/2026-10-05-lesson-animation-replay.md) (PR #1238): hết lượt, nút thành "Chạy lại hoạt ảnh" và bắt đầu lượt mới từ M1; tạm dừng giữa lượt giữ vị trí. Không thêm điều khiển từng bước.
- `prefers-reduced-motion`: hình giữ cảnh đầu (M1); description + 5 captions phải đọc đủ chuỗi M1→M5. Vì M1 khác M2–M5 chỉ ở nhãn, **tắt chuyển động mà không có chữ thì mất toàn bộ thông tin** — bản chữ là điều kiện bắt buộc, kèm kiểm browser như pilot gradient.
- Nhãn đi theo thẻ; trạng thái không chỉ bằng màu (chữ nhãn + viền nét đứt); chữ SVG ≥20; nhãn màu role `neutral`; không dùng `correct`/`warn`/`danger` cho chữ.
- Mốc ảnh 390/1440 px × blue-sky/dark-blue: kiểm không đè nhãn, nhất là băng qua thẻ của bản chụp `app.py` (M4), `model.safetensors` không tràn, chữ ≥12 px ở 390 px, nút "Xem lớn" đọc đủ. Chưa chụp ảnh nào vì chưa có dữ liệu hoạt họa.

## 8. Điểm CẦN CHUYÊN GIA CHỐT

| #   | Vấn đề                                                                                                                                                                                  | Đề xuất và lý do                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Thẻ "tracked cũ" là file nào.** `app.py` không khớp mẫu nào, nên M4 không chứng minh "ignore không ảnh hưởng file đã theo dõi" (Git thật mục 2 cho thấy chỉ `old.pt` mới chứng minh). | **Đề xuất:** bản chính theo nháp gốc dùng `app.py` nhưng caption 4 chỉ nói "file đã theo dõi vẫn add được"; **hoặc** thêm thẻ thứ 8 `old.pt` (đã commit từ trước, khớp `*.pt`) làm thẻ tracked-cũ ở ô (248,196) và đưa `old.pt` vào cảnh M4. Ưu tiên phương án thêm `old.pt`: đúng đặc tả ("card tracked cũ đi qua dù ignore") và loại hiểu nhầm; đổi giá: thêm ≈6 shape và HEAD M1 có 2 thẻ.                          |
| 2   | **Cảnh `.env` đã commit trước khi ignore** (đặc tả, acceptance 3: `.env` tracked vẫn hiện sửa đổi và được add).                                                                         | **Đề xuất: không đưa vào hoạt họa này.** `.env` ở M1–M5 là file chưa theo dõi bị ignore; mâu thuẫn với một cảnh `.env` đã commit. Cảnh này cần một hoạt họa riêng hoặc dùng `old.pt` (#1) làm đại diện. Cảnh báo "ignore không gỡ file đã commit" vẫn có trong bài (văn bản). Lý do: một hoạt họa một cơ chế (đặc tả ①).                                                                                               |
| 3   | **`__pycache__/` và `models/x.pt`** (đặc tả có `__pycache__/`; fixture nested `models/checkpoint.pt`).                                                                                  | **Đề xuất: không vẽ thẻ cho cả hai.** Thêm vào bảng 7 thẻ + dải lệnh làm hình quá dày ở 390 px; hai cảnh ấy dạy mẫu thư mục và `*` không khớp slash — cơ chế khác. Caption chỉ liệt kê bốn mẫu như nháp; `.gitignore` thật của bài vẫn có `__pycache__/`, nên description nên thêm câu "bài còn mẫu `__pycache__/` không có thẻ trong hình". Reviewer xác nhận caption bốn mẫu không gây hiểu sai là danh sách đầy đủ. |
| 4   | **Hoạt họa dùng simulator hay Git thật làm chuẩn.** `gitSim.ts` chưa có logic ignore khi viết; `git status` mô phỏng có thể khác Git thật.                                              | **Đề xuất:** chuẩn nội dung = Git thật (mục 2) và hợp đồng subset (không `!`, `**`, `?`…); sau PR A, đối chiếu thêm `gitState`. Lỗi lệch giữa hình và simulator là lỗi nội dung.                                                                                                                                                                                                                                       |
| 5   | **Bố cục và độ dày**: dọc một viewBox cho cả 390/1440; chữ ~13 px ở 390; thẻ băng qua thẻ khác ở M4.                                                                                    | **Đề xuất:** bố cục dọc 480×660 ở mục 3. Nếu ảnh thật cho thấy băng qua thẻ gây hiểu nhầm, đổi vị trí ô (hạ `app.py` xuống hàng cuối) hoặc bỏ cảnh băng. Hai viewBox (ngang/dọc) cần đổi hạ tầng: đề xuất **không** làm ở lô này.                                                                                                                                                                                      |
| 6   | **Bản chụp đi, file gốc ở lại** vs "thẻ di chuyển" như nháp gốc.                                                                                                                        | **Đề xuất:** bản chụp đi. Nháp gốc nói "thẻ đi sang vùng chờ"; nếu giữ nguyên nghĩa đen, người học có thể hiểu file rời thư mục. Cần reviewer xác nhận cách diễn đạt "bản chụp" (khớp thuật ngữ đã dùng trong bài: "bản chụp"/snapshot) không gây rối ở người mới.                                                                                                                                                     |
| 7   | **Tên vùng**: nháp gốc dùng `Thư mục làm việc` / `Vùng chờ` / `Commit HEAD`; bài hiện dùng thuật ngữ "bản chụp".                                                                        | **Đề xuất:** giữ ba tên của nháp gốc; đối chiếu với thuật ngữ trong `theory` của `p3-u11-l1` và các bài Git lân cận để không có hai tên cho một vùng.                                                                                                                                                                                                                                                                  |
| 8   | **Lệnh "sửa app.py"**: simulator chỉ hiểu `echo … > / >>`, không có trình soạn thảo.                                                                                                    | **Đề xuất:** nhãn lệnh ghi `echo … >> app.py` (hoặc "sửa app.py" kèm chú thích) cho khớp thứ người học thực sự gõ; reviewer chọn câu chữ.                                                                                                                                                                                                                                                                              |
| 9   | **Thời lượng 10,8 s** so với nháp ~10 s.                                                                                                                                                | **Đề xuất:** giữ 10,8 s để giữ đủ hai quyết định cách nhau 600 ms ở M4; chấp nhận hoặc gộp M4 thành một quyết định.                                                                                                                                                                                                                                                                                                    |

## 9. Phạm vi, quyền sở hữu file và việc chưa làm

Tài liệu này chỉ là bản nháp storyboard: **chưa** có dữ liệu `animation`, chưa sửa `p3u11.ts`, chưa chụp ảnh, chưa chạy gate sản phẩm. Khi reviewer duyệt và các điểm mục 8 được chốt mới cài (PR B của đặc tả chấm trạng thái, sau PR A và nếu hợp đồng hoạt họa bài thường đã merge): một agent sở hữu nội dung + test của `p3u11.ts`; chỉ coordinator chạm `lessonTypes.ts`, `ProgrammingLessonPage.tsx`, công cụ ảnh, chỉ mục sinh tự động. Cần chạy `npm run gen:lesson-index` nếu đổi title bài.
