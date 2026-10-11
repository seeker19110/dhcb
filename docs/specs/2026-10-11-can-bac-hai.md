# Đặc tả — Bảng nháp STEM: bộ kiểm bước Toán đọc căn bậc hai (vẫn chính xác)

- **Ngày:** 2026-10-11 · **Trạng thái:** Approved for implementation (chủ dự án chọn "Căn bậc hai
  √" ngày 2026-10-11).
- **Nguồn việc:** nợ "Bảng nháp STEM" trong `PROGRESS.md`, mục (2) "Toán ngoài phạm vi: căn…".
- **Nối tiếp:** `docs/specs/2026-10-11-kiem-buoc-bat-phuong-trinh.md` (công thức dấu + phân hoạch
  trục số) và `docs/specs/2026-10-11-ky-hieu-khoang-va-tri-tuyet-doi.md` (chia trường hợp).

## 0. Một câu

Bộ kiểm bước Toán đọc được căn bậc hai — phương trình/bất phương trình chứa căn (`√(x+3) = x − 3`,
`√x < 2`) và đáp số có căn (`x = ±√2`, `x = (1 ± √5)/2`) — mà vẫn giữ luật "chỉ ✓/✗ khi chứng minh
được", không làm tròn số vô tỉ.

## ① Phạm vi

**LÀM:**

- Đọc `\sqrt{…}` (lồng ngoặc được) và `√` gõ tay (`√x`, `√2`, `√(x + 1)`); `sqrt(…)` gõ thường.
- Trong MỖI quan hệ `a rel b` (một cặp vế liền nhau), đọc được hai dạng:
  - **một biểu thức dưới căn** `f` (có thể lặp lại: `√x + 2√x`, `x√x`): đưa `a − b` về
    `A + B·√f` với A, B, f là phân thức hữu tỉ của ẩn, tính bằng luật `(√f)² = f` — CHÍNH XÁC;
  - **`√f rel √g`** (mỗi vế đúng một căn): căn đồng biến trên [0; +∞) nên ⇔ f ≥ 0, g ≥ 0, f rel g.
- Điều kiện dưới căn `f ≥ 0` LUÔN được giữ, kể cả khi căn triệt tiêu (`√x − √x = 0` ⇔ x ≥ 0).
- Dấu của `A + B√f` (đặt P = A² − B²f):
  - `= 0` ⇔ P = 0 và A·B ≤ 0;
  - `> 0` ⇔ (A > 0, B ≥ 0) hoặc (A > 0, P > 0) hoặc (A ≤ 0, B > 0, P < 0);
  - `≥ 0` ⇔ (A ≥ 0, B ≥ 0) hoặc (A ≥ 0, P ≥ 0) hoặc (A ≤ 0, B ≥ 0, P ≤ 0);
  - `<`, `≤`: đổi dấu A, B rồi dùng `>`, `≥`.
    Các mệnh đề này đưa vào công thức dấu sẵn có (`mathSolutionSet.ts`), so bằng phân hoạch trục số.
- Chia cho biểu thức không căn, hoặc cho `D·√f` thuần căn (`x/(D√f) = x√f/(D·f)`, điều kiện
  D ≠ 0, f ≠ 0 — đúng bằng điều kiện mẫu ≠ 0).
- Trị tuyệt đối dưới căn hoặc ngoài căn: chia trường hợp trước (như `0611`), rồi mới xử lý căn.
- Cờ mới `squareRoot: { removed: true }` khi mốc có căn còn bước thì không (người học vừa bình
  phương). Gợi ý riêng (`cauHoiCanThuc`, không chứa số): chỉ THÊM nghiệm → hỏi điều kiện đã giữ
  (biểu thức dưới căn không âm, vế còn lại có cần không âm); MẤT nghiệm → hỏi phép bình phương (bình
  phương CẢ vế, khai triển `(a + b)²`). Thứ tự ưu tiên: trị tuyệt đối → căn → bất phương trình.
- Sửa nhỏ đi kèm: `2x|x|` và `2x√x` không còn dính thành tên biến `xabs`/`xsqrt`.
- Câu phạm vi (`PHAM_VI_KIEM.math`, `CHUA_DOC_DUOC.math`) nói thêm căn bậc hai.

**KHÔNG LÀM (vẫn "?" — không đoán):**

- Căn bậc ba trở lên (`\sqrt[3]{…}`), căn lồng căn.
- Hai căn KHÁC NHAU trong một quan hệ ở dạng khác `√f rel √g` (`√(x+5) + √x = 5`,
  `2√x = √(x+3)`). Cần số học hai căn — đợt khác nếu có nhu cầu.
- Mẫu dạng `C + D√f` (cả hai khác 0): trục căn có thể đẻ thêm điểm loại trừ sai.
- `\sqrt x` không ngoặc nhọn (`\sqrt 23` LaTeX đọc là √2·3, dễ nhầm), `√x²`/`√2^3` (căn của bình
  phương hay bình phương của căn?).
- Đầu mút có căn trong ký hiệu tập (`S = (−√2; √2)`); viết dạng `−√2 < x < √2` thì đọc được.
- Chuỗi "điều kiện ⇒ phương trình" (`x ≥ 3 ⇒ x² − 7x + 6 = 0`) — mỗi đoạn ⇒ vẫn phải tương đương đề.
- Không đổi giao diện, API, CSDL; không thêm phụ thuộc.

## ② Điểm chạm

| Việc | Đường dẫn file                                   | Ghi chú                                        |
| ---- | ------------------------------------------------ | ---------------------------------------------- |
| Sửa  | `packages/core-grading/stepCheckMath.ts`         | đọc `\sqrt`/`√`, số học `A + B√f`, cờ bỏ căn   |
| Sửa  | `packages/core-grading/stepCheckMath.test.ts`    | ca ③; test cũ "căn → ?" đổi sang căn bậc ba    |
| Sửa  | `packages/core-ai/stemMicroHint.ts`              | `cauHoiCanThuc`, câu "chưa đọc được"           |
| Sửa  | `packages/core-ai/stemMicroHint.test.ts`         | gợi ý bỏ căn; đề căn trong bảng bất biến lộ số |
| Sửa  | `packages/core-ai/stemScratchpadService.ts`      | dùng `cauHoiCanThuc`, câu phạm vi              |
| Sửa  | `packages/core-ai/stemScratchpadService.test.ts` | phản hồi bước bỏ căn                           |

## ③ Ca

| Đề                          | Bước                           | Kết quả                               |
| --------------------------- | ------------------------------ | ------------------------------------- |
| `\sqrt{x + 3} = x - 3`      | `x = 6`                        | ✓ đáp số                              |
| `\sqrt{x + 3} = x - 3`      | `x + 3 = (x - 3)^2`            | ✗ thêm nghiệm lạ, cờ bỏ căn           |
| `\sqrt{x + 3} = x - 3`      | `x + 3 = x^2 - 9`              | ✗ mất nghiệm, cờ bỏ căn               |
| `x^2 = 2`                   | `x = \pm\sqrt{2}`              | ✓ đáp số                              |
| `x^2 = 2`                   | `x = \sqrt{2}`                 | ✗ mất nghiệm                          |
| `x^2 - x - 1 = 0`           | `x = \frac{1 \pm \sqrt{5}}{2}` | ✓                                     |
| `\sqrt{x} < 2`              | `x < 4`                        | ✗ thêm khoảng (quên x ≥ 0), cờ bỏ căn |
| `\sqrt{x} - \sqrt{x} = 0`   | `S = \mathbb{R}`               | ✗ thêm (điều kiện dưới căn vẫn giữ)   |
| `\sqrt{x+5} + \sqrt{x} = 5` | bất kỳ                         | ? `too_complex`                       |
| `\sqrt[3]{x} = 2`           | bất kỳ                         | ? `unknown_notation`                  |

## ④ Tiêu chí chấp nhận

- [ ] Các ca ở ③ có test; test hỏng có chủ đích (bỏ `A·B ≤ 0` ở `= 0`, hoặc bỏ `f ≥ 0`) làm test đỏ.
- [ ] Gợi ý bỏ căn không chứa chữ số (bảng bất biến lộ số của `stemMicroHint.test.ts` có đề căn).
- [ ] Cổng đầy đủ xanh: typecheck · lint · format · `test:coverage` · build · size.

## ⑤ Bất biến

| Bất biến                                          | Test canh                                     |
| ------------------------------------------------- | --------------------------------------------- |
| Chỉ ✓/✗ khi chứng minh được; ngoài phạm vi là "?" | `packages/core-grading/stepCheckMath.test.ts` |
| Gợi ý không lộ nghiệm                             | `packages/core-ai/stemMicroHint.test.ts`      |

## ⑥ Rủi ro và rollback

- **Rủi ro:** công thức dấu sai thì ✓/✗ oan. Chặn bằng các ca có hệ số âm trước căn (`x − √x ≤ 0`,
  `x − 2 > √x`, `√x ≥ x − 2`), ca nghiệm vô tỉ (`±√2`, `(1 ± √5)/2`) và ca điều kiện dưới căn.
- **Hiệu năng:** P = A² − B²f làm bậc tăng gấp đôi; vẫn dưới trần bậc của `polynomial.ts`, vượt trần
  → `too_complex` ("?").
- **Rollback:** revert PR; không đổi API, CSDL hay dữ liệu người dùng.
