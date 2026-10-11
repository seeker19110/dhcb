# Đặc tả — Bảng nháp STEM: mốc phương trình cho câu Toán của ngân hàng đề

- **Ngày:** 2026-10-11 · **Trạng thái:** Approved for implementation (chủ dự án chọn "Làm bản nhỏ +
  đóng nợ" ngày 2026-10-11, sau khi xem số đo ở mục "Vì sao nhỏ").
- **Nguồn việc:** nợ "Bảng nháp STEM" trong `PROGRESS.md`, mục (3): "đề ngân hàng là lời văn nên
  bước Toán chỉ so được với bước 1 của người học (chưa có phương trình đề để làm mốc)".
- **Nối tiếp:** `docs/specs/2026-10-09-bang-bien-vat-li-ngan-hang-de.md` (cùng khuôn: trường tuỳ
  chọn trên câu "Tự kiểm tra", server gắn vào phiên khi mở đề bằng `questionId`).

## 0. Một câu

Câu Toán của ngân hàng có phương trình/bất phương trình một ẩn nằm NGUYÊN VĂN trong đề thì mang
sẵn phương trình đó làm mốc (`problemLatex` của phiên), để ngay bước 1 của người học đã được so với
đề thay vì tự làm mốc.

## Vì sao nhỏ (đo 2026-10-11 trên `main` `904635dc`)

Ngân hàng có 168 câu Toán lớp 10–12. Đọc từng câu:

- phần lớn là thống kê, xác suất, hình học, toạ độ, lượng giác, mũ/log — không có phương trình một
  ẩn hoặc bộ kiểm chưa đọc được (lượng giác, mũ, log);
- nhiều câu phải TỰ LẬP phương trình (tham số `m`, đỉnh parabol, `f″(x) = 0`…). Khai sẵn phương
  trình đó là làm hộ bước 1, tức lộ cách giải — KHÔNG làm;
- chỉ **1 câu** có đúng một bất phương trình một ẩn nguyên văn mà bộ kiểm đọc được và việc giải nó
  chính là đề bài: `toan10-c6-b2-q3` "Bất phương trình x² + 1 < 0 có bao nhiêu nghiệm thực?".

Câu "Giải phương trình …" thật nằm ở lớp 8–9 (~10 câu), nhưng ngân hàng cố ý chỉ nhận lớp 10–12
(`LOP_NGAN_HANG` trong `stemQuestionBank.ts`). Mở lớp 8–9 cần bộ lọc lớp ở màn chọn đề — việc khác,
có giao diện, không thuộc đợt này.

Vì vậy đợt này dựng **đường ống + luật canh** (để câu mới soạn sau tự hưởng), khai cho đúng câu
đủ điều kiện, rồi đóng mục nợ (3) kèm số đo.

## ① Phạm vi

**LÀM:**

- Trường tuỳ chọn `equation` (chuỗi, 1–200 ký tự) cho câu "Tự kiểm tra" Toán
  (`MathCheckQuestionSchema`). Câu trắc nghiệm không được có `equation`.
- **Luật soạn** (ghi ở chú thích schema):
  - phương trình phải NGUYÊN VĂN trong đề, chỉ đổi cách viết (`²` → `^2`, `−` → `-`), không được
    là phương trình tự lập;
  - việc giải phương trình đó phải chính là yêu cầu của đề;
  - bộ kiểm phải đọc được.
- Khai `equation: 'x^2 + 1 < 0'` cho `toan10-c6-b2-q3`.
- Ngân hàng mang trường sang `StemQuestion.problemLatex` (chỉ ở server; bản công khai danh sách đề
  không đổi). `create_problem { questionId }` gắn `problemLatex` vào phiên — client không gửi.
- Test canh luật cho MỌI câu có `equation`: bộ kiểm đọc được (`readsAsMathStatement`), và phương
  trình có mặt nguyên văn trong đề sau khi chuẩn hoá cách viết.

**KHÔNG LÀM:**

- Không khai phương trình tự lập (tham số, đạo hàm, đỉnh…) — lộ cách giải.
- Không mở lớp 6–9 vào ngân hàng, không đổi giao diện, không đổi đề/đáp án/lời giải.
- Không đổi bộ kiểm bước, không thêm phụ thuộc.

## ② Điểm chạm

| Việc | Đường dẫn file                                           | Ghi chú                                         |
| ---- | -------------------------------------------------------- | ----------------------------------------------- |
| Sửa  | `packages/subject-math/lessonTypes.ts`                   | `equation` tuỳ chọn + refine "không cho choice" |
| Sửa  | `packages/subject-math/lessons/toan10c6.ts`              | khai `equation` cho câu `x² + 1 < 0`            |
| Sửa  | `packages/core-ai/stemQuestionBank.ts`                   | `StemLessonSource`/`StemQuestion` mang trường   |
| Thêm | `packages/core-ai/stemQuestionBank.mathEquation.test.ts` | luật canh: đọc được + nguyên văn trong đề       |
| Sửa  | `apps/server/src/api/learning/stem-scratchpad.ts`        | `create_problem { questionId }` gắn mốc         |
| Sửa  | `apps/server/src/api/learning/stem-scratchpad.test.ts`   | phiên có mốc; bước 1 sai được so với đề         |

## ③ Hợp đồng dữ liệu

- **Bài học:** `MathCheckQuestion.equation?: string` (1–200).
- **Server:** `StemQuestion.problemLatex?: string`. `StemProblemState.problemLatex` của phiên mở
  bằng `questionId` = `equation` của câu; câu không khai thì như cũ (bước 1 làm mốc).
- `StemBankQuestionPublic` và chữ ký endpoint KHÔNG đổi. `problemLatex` của phiên đã có trong hợp
  đồng từ trước (≤ 1000 ký tự) và là chữ của chính đề, nên không lộ đáp án.

**Ca:**

| Tình huống                                                     | Kết quả                               |
| -------------------------------------------------------------- | ------------------------------------- |
| Mở `toan10-c6-b2-q3`, bước 1 `x^2 < -1`                        | `valid` (so với đề, không phải "MỐC") |
| Mở `toan10-c6-b2-q3`, bước 1 `x^2 > -1`                        | `invalid` · đổi tập nghiệm            |
| Mở câu không khai `equation`                                   | như cũ: bước 1 là mốc                 |
| Khai `equation` cho câu `choice`                               | schema bài học từ chối                |
| Khai `equation` không có trong đề, hoặc bộ kiểm không đọc được | test luật canh đỏ                     |

## ④ Tiêu chí chấp nhận

- [ ] Các ca ở ③ có test — chạy ba nhóm test: `packages/core-ai/stemQuestionBank*`,
      `apps/server/src/api/learning/stem-scratchpad.test.ts`, `packages/subject-math`.
- [ ] Test luật canh đỏ khi gỡ một ký tự của `equation` khỏi đề (chứng minh luật có tác dụng).
- [ ] Cổng đầy đủ xanh: typecheck · lint · format · `test:coverage` · build · size.

## ⑤ Bất biến

| Bất biến                                       | Test canh                                                   |
| ---------------------------------------------- | ----------------------------------------------------------- |
| Đáp án/lời giải không ra client trước khi giải | `packages/core-ai/stemQuestionBank.test.ts` (bản công khai) |
| Mốc chỉ là chữ của đề, không phải bước giải    | `packages/core-ai/stemQuestionBank.mathEquation.test.ts`    |

## ⑥ Rủi ro và rollback

- **Rủi ro:** khai sai mốc thì bước 1 đúng bị ✗ oan. Đã chặn bằng luật "nguyên văn + đọc được".
- **Rollback:** revert PR; không đổi API, schema CSDL hay dữ liệu người dùng.
