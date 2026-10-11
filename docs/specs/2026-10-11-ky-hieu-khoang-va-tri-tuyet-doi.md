# Đặc tả — Bảng nháp STEM: đọc KÝ HIỆU KHOẢNG/TẬP và TRỊ TUYỆT ĐỐI (vẫn chính xác)

- **Ngày:** 2026-10-11 · **Trạng thái:** Approved for implementation. Chủ dự án chọn đúng phạm vi
  này ngày 2026-10-11 (lựa chọn "Ký hiệu khoảng + |x|", mô tả: "đọc được đáp số dạng S = (2; +∞),
  x ∈ [1; 3), \cup và bất phương trình có trị tuyệt đối (chia trường hợp, vẫn chính xác) … cần sửa
  luật `;` = "hoặc" để không đụng nhau"). Các chi tiết thiết kế bên dưới do AI đề xuất, ghi rõ ở ⑥
  để chủ dự án soát lại trên PR.
- **Nguồn việc:** hai mục "để đợt sau" ở ⑥ của `docs/specs/2026-10-11-kiem-buoc-bat-phuong-trinh.md`
  (changelog 0608).
- **Nối tiếp:** `docs/specs/2026-10-09-kiem-buoc-giai-stem.md` (phương trình) và
  `docs/specs/2026-10-11-kiem-buoc-bat-phuong-trinh.md` (bất phương trình, `mathSolutionSet.ts`).

## 0. Một câu

Học sinh viết đáp số bất phương trình theo lối SGK — `S = (2; +∞)`, `x ∈ [1; 3)`,
`S = (-∞; 1) ∪ (3; +∞)` — và giải bài có trị tuyệt đối `|2x - 1| < 5`; bảng nháp vẫn **chứng minh**
được bước đó giữ hay đổi tập nghiệm, thay vì trả "? Chưa tự kiểm được".

## ① Phạm vi

**LÀM — ký hiệu khoảng/tập:**

- **Chỉ nhận khi có tiền tố rõ ràng** (để `;` = "hoặc" không đụng): cả đoạn (giữa hai dấu ⇒) bắt
  đầu bằng `S =` hoặc `<ẩn> \in` / `<ẩn> ∈`. Đoạn không có tiền tố đi đúng đường cũ, luật `;` =
  "hoặc" giữ nguyên.
- **Biểu thức tập** sau tiền tố: các hạng nối bằng `\cup`, `∪` hoặc chữ `U` đứng riêng. Mỗi hạng là:
  - **khoảng** `(a; b)`, `[a; b]`, `[a; b)`, `(a; b]`; ngăn cách bằng `;`, hoặc `,` khi không có
    `;` và có đúng một dấu phẩy. `\left(`/`\right]` nhận như ngoặc thường;
  - đầu mút là hằng số hữu tỉ (số, phân số `\frac{}{}`, biểu thức hằng) hoặc vô cực: `\infty`,
    `∞`, `inf`, có thể kèm `+`/`-`;
  - **tập hữu hạn** `\{a; b\}` hoặc `{a; b}`; **tập rỗng** `\emptyset`, `\varnothing`, `∅`, `Ø`,
    `\{\}`; **ℝ**: `\mathbb{R}`, `\mathbb R`, `ℝ`, `R`;
  - **ℝ bỏ đi tập hữu hạn**: `ℝ \setminus \{a; b\}` (cả `\backslash` và `\` đứng riêng).
- **Ký hiệu sai thì không đoán:** đầu mút trái ≥ đầu mút phải, ngoặc vuông ở vô cực (`[2; +∞]`),
  `-∞` ở bên phải… → không đọc như tập, rơi về đường cũ và ra `unsupported · unknown_notation`.
- **Cách cài:** đổi tập về các mệnh đề sẵn có (một khoảng = chuỗi kép `a < x ≤ b`, hợp = "hoặc"),
  nên không thêm kiểu tập mới. Với `S =` (không nêu tên ẩn) thì dùng ẩn của đề.
- **`isFinalAnswer`:** đoạn cuối viết bằng ký hiệu tập luôn là dạng đáp số.

**LÀM — trị tuyệt đối:**

- **Đọc** `|f|` (gõ thường), `\left| f \right|`, `\lvert f \rvert`, `\vert f \vert`, `abs(f)`. Phân
  biệt `|` mở/đóng bằng ngữ cảnh: chưa có `|` nào đang mở, hoặc ngay trước là toán tử/dấu quan
  hệ/ngoặc mở/`|` mở → mở; còn lại → đóng. Lệch số `|` → `unknown_notation`.
- **Chia trường hợp CHÍNH XÁC**, ở mức công thức dấu (`SetFormula`): mỗi `|g|` (chọn từ trong ra
  ngoài, `g` không còn trị tuyệt đối) tách thành hai nhánh `g ≥ 0 VÀ (…g…)` hoặc `g < 0 VÀ (…−g…)`.
  Các `|g|` giống hệt nhau được tách cùng lúc. Tối đa 4 trị tuyệt đối khác nhau mỗi mệnh đề
  (16 nhánh); vượt → `unsupported · too_complex`.
- **Phương trình có trị tuyệt đối** (`|x - 1| = 3`) đi nhánh công thức dấu, nhưng câu phản hồi vẫn
  là câu của PHƯƠNG TRÌNH ("mất nghiệm"/"nghiệm lạ"). Câu của bất phương trình chỉ dùng khi thật sự
  có dấu bất đẳng thức.
- **Gợi ý Socratic riêng** khi mốc có trị tuyệt đối mà bước đã bỏ nó (đang chia trường hợp):
  - mất nghiệm → hỏi đã xét đủ hai trường hợp (biểu thức bên trong không âm / âm) chưa;
  - thêm nghiệm → hỏi đã đối chiếu nghiệm của từng trường hợp với điều kiện của trường hợp đó chưa.
  - Không chứa số, nghiệm hay khoảng.
- **Câu "phạm vi"** (`PHAM_VI_KIEM.math`) và câu "chưa đọc được" cập nhật: bỏ "trị tuyệt đối" và
  "ký hiệu khoảng" khỏi danh sách chưa đọc.

**KHÔNG LÀM:**

- **Dấu `≠`** (`x \neq 2`) — vẫn `unknown_notation`. Lý do: dòng điều kiện "ĐK: x ≠ 1" mà đọc được
  thì bị so với tập nghiệm và bị ✗ oan.
- **Tiền tố khác `S`** (`D = ℝ \setminus \{1\}` là TẬP XÁC ĐỊNH, không phải tập nghiệm) và khoảng
  đứng trơn không tiền tố (`(1; 2)` có thể là toạ độ) — đi đường cũ, ra "?" như hiện nay.
- **Ngoặc kiểu Pháp** `]a; b[`, hiệu hai khoảng, giao `\cap`. (Số thập phân dấu phẩy `(2,5; 3)` đọc
  được vì đã ngăn bằng `;`; `(2,5)` không có `;` thì là khoảng từ 2 đến 5.)
- Căn, lượng giác, log, π, nhiều ẩn — giữ nguyên `unsupported`.
- Không đổi API, schema, Hoá, Vật lí, `core-grading/index.ts`, giao diện ngoài câu chữ. Không thêm
  phụ thuộc npm.

## ② Điểm chạm

| Việc | Đường dẫn file                                   | Ghi chú                                                       |
| ---- | ------------------------------------------------ | ------------------------------------------------------------- |
| Sửa  | `packages/core-grading/stepCheckMath.ts`         | đọc ký hiệu tập + `\|`, tách trường hợp, cờ trị tuyệt đối     |
| Sửa  | `packages/core-grading/stepCheckMath.test.ts`    | ca ở ③ + ca hồi quy                                           |
| Sửa  | `packages/core-ai/stemMicroHint.ts`              | câu hỏi "hai trường hợp" khi bỏ trị tuyệt đối                 |
| Sửa  | `packages/core-ai/stemMicroHint.test.ts`         | đề trị tuyệt đối vào test bất biến "không lộ nghiệm"          |
| Sửa  | `packages/core-ai/stemScratchpadService.ts`      | câu phạm vi + chọn câu phương trình/bất phương trình đúng chỗ |
| Sửa  | `packages/core-ai/stemScratchpadService.test.ts` | câu phạm vi mới, gợi ý trị tuyệt đối                          |

`mathSolutionSet.ts` không đổi (tách trường hợp ra `and`/`or` của `SetFormula` sẵn có).

## ③ Hợp đồng dữ liệu

**API:** không đổi. **`MathStepCheck`:** biến thể `changed` thêm một trường tuỳ chọn
`absoluteValue?: { casesSplit: true }` — có khi mốc chứa trị tuyệt đối còn bước thì không. Trường
`inequality` nay chỉ có khi đề hoặc bước có dấu bất đẳng thức (trước đây: mọi lần đi nhánh công
thức dấu — cùng tập ca với hiện tại vì trước đây nhánh đó chỉ có bất phương trình).

**Ca lỗi:**

| Mốc → bước                                                 | Kết luận                                             |
| ---------------------------------------------------------- | ---------------------------------------------------- |
| `2x - 4 > 0` → `S = (2; +\infty)`                          | `equivalent` · isFinalAnswer                         |
| `2x - 4 > 0` → `S = [2; +\infty)`                          | `changed` · extra (thêm điểm 2)                      |
| `x^2 - 4x + 3 > 0` → `S = (-∞; 1) ∪ (3; +∞)`               | `equivalent` · isFinalAnswer                         |
| `x^2 - 4x + 3 \ge 0` → `x \in (-\infty; 1) U [3; +\infty)` | `changed` · lost (mất điểm 1)                        |
| `x^2 = 4` → `S = \{2; -2\}`                                | `equivalent` · isFinalAnswer                         |
| `x^2 + 1 < 0` → `S = \emptyset`                            | `equivalent`                                         |
| `(x-2)^2 > 0` → `S = \mathbb{R} \setminus \{2\}`           | `equivalent`                                         |
| `2x - 4 > 0` → `S = [2; +\infty]`                          | `unsupported · unknown_notation`                     |
| `2x - 4 > 0` → `S = (5; 2)`                                | `unsupported · unknown_notation`                     |
| `\|2x - 1\| < 5` → `-5 < 2x - 1 < 5`                       | `equivalent`                                         |
| `\|2x - 1\| < 5` → `2x - 1 < 5`                            | `changed` · extra · absoluteValue                    |
| `\|x - 1\| = 3` → `x - 1 = 3`                              | `changed` · lost · absoluteValue, không `inequality` |
| `\|x - 1\| = 3` → `x = 4 hoặc x = -2`                      | `equivalent` · isFinalAnswer                         |
| `\|x\| = -1` → `S = \emptyset`                             | `equivalent`                                         |
| `\|x - 1\| \ge x` (nhiều `                                 | `, có ẩn ngoài)                                      | so đúng bằng chia trường hợp |
| 5 trị tuyệt đối khác nhau trong một mệnh đề                | `unsupported · too_complex`                          |
| `\|x - 1 = 3` (lệch `\|`)                                  | `unsupported · unknown_notation`                     |
| `x - 1 = 3; x = 4` (không tiền tố)                         | như cũ: `;` là "hoặc"                                |

## ④ Tiêu chí chấp nhận

- [ ] Mọi ca ở bảng ③ có test và cho đúng kết luận —
      `npx vitest run packages/core-grading/stepCheckMath.test.ts`.
- [ ] Mọi ca phương trình và bất phương trình hiện có vẫn cho kết quả y hệt (cùng file test).
- [ ] Gợi ý trị tuyệt đối không chứa chữ số/nghiệm/khoảng —
      `npx vitest run packages/core-ai/stemMicroHint.test.ts packages/core-ai/stemScratchpadService.test.ts`.
- [ ] Trần: 5 trị tuyệt đối → `too_complex`, không treo (test có `timeout` 2 s).

**Lệnh chứng minh:**

```bash
npm run typecheck && npm run lint && npm run test:coverage && npm run build
npx vitest run packages/core-grading packages/core-ai
```

## ⑤ Bất biến không được phá

| Bất biến                                             | Test nào canh nó                                          |
| ---------------------------------------------------- | --------------------------------------------------------- |
| Không đoán: chỉ ✓/✗ khi CHỨNG MINH được, còn lại "?" | `packages/core-grading/stepCheckMath.test.ts`             |
| Gợi ý không lộ nghiệm/bước đúng                      | `packages/core-ai/stemMicroHint.test.ts`                  |
| Kết luận phương trình/bất phương trình cũ không đổi  | `packages/core-grading/stepCheckMath.test.ts`             |
| Bộ kiểm bước không vào bundle client                 | `npm run size` + không export qua `core-grading/index.ts` |

## ⑥ Quyết định AI đã chọn thay (soát lại trên PR)

1. Ký hiệu tập chỉ đọc khi có tiền tố `S =` hoặc `x ∈` — tránh đọc nhầm toạ độ `(1; 2)` hay tập xác
   định `D = …`, và giữ nguyên `;` = "hoặc" ở mọi chỗ khác.
2. Không đọc `≠` — tránh ✗ oan cho dòng điều kiện xác định.
3. Ký hiệu khoảng sai (đầu mút ngược, ngoặc vuông ở vô cực) trả "?" chứ không ✗: đó là lỗi viết ký
   hiệu, không phải lỗi biến đổi.
4. Trần 4 trị tuyệt đối mỗi mệnh đề — bài phổ thông hiếm khi quá 2.

## ⑦ Rủi ro và rollback

- **Rủi ro:** ✗ oan cho bước đúng. Giảm bằng: so ô chính xác như 0608, chỉ đọc ký hiệu tập khi có
  tiền tố, test đối chiếu tập nghiệm tính tay cho từng ca.
- **Rollback:** revert PR. Không đổi API, schema hay dữ liệu.
