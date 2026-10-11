# Đặc tả — Bảng nháp STEM: kiểm bước giải BẤT PHƯƠNG TRÌNH một ẩn (chính xác)

- **Ngày:** 2026-10-11 · **Trạng thái:** Draft — chờ chủ dự án duyệt
- **Nguồn việc:** nợ "Bảng nháp STEM" trong `PROGRESS.md`, mục còn lại (2) "Toán ngoài phạm vi: căn,
  lượng giác, log, π, bất phương trình, nhiều ẩn". Chủ dự án chọn "mở rộng kiểm bước Toán" ngày
  2026-10-11.
- **Nối tiếp:** `docs/specs/2026-10-09-kiem-buoc-giai-stem.md` (bộ kiểm phương trình một ẩn, đã chạy).

## 0. Một câu

Bảng nháp tự **chứng minh** được một bước giải bất phương trình một ẩn (đa thức/phân thức hữu tỉ)
có giữ nguyên tập nghiệm hay không. Lỗi kinh điển "nhân/chia cho số âm mà quên đổi chiều" trở
thành `✗ Đổi tập nghiệm` thay vì "? Chưa tự kiểm được".

## Vì sao chọn bất phương trình trước (đo 2026-10-11)

Đếm sơ bộ bằng regex trên đề của ngân hàng đề bảng nháp (168 câu Toán lớp 10–12) và trên mọi câu
tự kiểm môn Toán (694 câu):

| Dạng             | Ngân hàng | Mọi câu tự kiểm | Kiểm CHÍNH XÁC được?                                           |
| ---------------- | --------- | --------------- | -------------------------------------------------------------- |
| Bất phương trình | **11**    | 28              | Có — cùng nền đa thức hữu tỉ + Sturm đang dùng                 |
| Lượng giác       | 9         | 14              | Không — tập nghiệm vô hạn tuần hoàn, cần CAS siêu việt         |
| Log / mũ         | 3         | 5               | Không trong phạm vi hợp lý                                     |
| Trị tuyệt đối    | 2         | 7               | Có (chia trường hợp) — làm ở đợt sau nếu cần                   |
| Căn              | 1         | 15              | Chỉ một phần (nghiệm hữu tỉ); gần như không có trong ngân hàng |

Luật của bộ kiểm hiện có: **không đoán**. Ca nào không chứng minh được thì trả "?". Vì vậy lượng
giác/log KHÔNG làm bằng lấy mẫu số. Lấy mẫu số chỉ cho kết quả "gần như chắc", trái với cam kết
"chứng minh tuyệt đối" của đặc tả 2026-10-09 §5.

## ① Phạm vi

**LÀM:**

- **Đọc bất phương trình.** Nhận `<`, `>`, `≤`, `≥`, `\le`, `\ge`, `\leq`, `\geq`, `\lt`, `\gt`.
  - Nhận chuỗi kép `a < x \le b` (hiểu là `a < x` VÀ `x \le b`).
  - Nhận nhiều mệnh đề nối "hoặc" như phương trình hiện nay.
  - Hai vế là phân thức hữu tỉ của MỘT ẩn, cùng bộ đọc `expression.ts` + `toRatFn` đang có.
- **Biểu diễn tập nghiệm.** Thêm kiểu `IntervalSet`: một đa thức tới hạn không lặp `C` (tích các
  nhân tử của tử, mẫu và điều kiện xác định), kèm cờ "thuộc tập" cho TỪNG ô:
  - từng khoảng mở giữa hai nghiệm thực liền kề của `C`;
  - từng nghiệm thực của `C`.
  - Tập nghiệm của phương trình (`finite`/`cofinite` hiện có) chuyển được sang kiểu này, nên có
    thể so một bước phương trình với một bước bất phương trình (vd `x² − 4 = 0` → không cùng tập
    với `x² < 4`).
- **So hai tập CHÍNH XÁC**, không làm tròn:
  - Gộp hai đa thức tới hạn thành `C₁·C₂` (khử lặp) rồi xét cùng một phân hoạch.
  - Ô khoảng: lấy một điểm hữu tỉ bên trong rồi tính dấu bằng BigInt.
  - Ô nghiệm (số đại số, có thể vô tỉ): cách ly nghiệm bằng Sturm; tính dấu của đa thức kia tại
    nghiệm bằng ƯCLN (bằng 0 khi có nhân tử chung). Không có nhân tử chung thì thu hẹp khoảng cách
    ly tới khi đa thức kia không còn nghiệm trong khoảng, rồi lấy dấu tại một điểm hữu tỉ.
- **Kết luận dùng lại hợp đồng hiện có:**
  - `equivalent`;
  - `changed` với `lost` / `extra` / `sameAsPrevious`;
  - `division_by_zero`;
  - `unsupported`.
- **Câu chữ của `changed` cho bất phương trình:**
  - nói "mất một phần tập nghiệm" / "thêm khoảng không phải nghiệm";
  - gợi ý Socratic KHÔNG lộ đáp án, vd "Khi nhân hay chia hai vế cho một số âm, chiều của bất
    đẳng thức thay đổi thế nào?";
  - chỉ gợi đúng câu này khi bước vừa rồi có chiều ngược với bước trước VÀ tập mới là phần bù
    (trong miền xác định) của tập đúng.
- **`isFinalAnswer` cho bất phương trình:** bước đã chứng minh tương đương VÀ ở dạng
  `x <op> c`, `a <op> x <op> b`, hoặc các dạng đó nối "hoặc", với `a`, `b`, `c` là hằng số.
- **Trần an toàn giữ như phương trình:** bậc ≤ 24, hệ số ≤ 2048 bit, và thêm trần số ô ≤ 200.
  Vượt trần → `unsupported · too_complex`.

**KHÔNG LÀM:**

- **Lượng giác, log/mũ, π:** vẫn `unsupported · non_polynomial`. Không lấy mẫu số, vì trái luật
  "không đoán".
- **Căn và trị tuyệt đối:** để đợt sau. Trị tuyệt đối làm được chính xác bằng chia trường hợp, nhưng
  chỉ có 2 câu trong ngân hàng. Căn chỉ có 1 câu trong ngân hàng.
- **Ký hiệu khoảng/tập** (`S = (2; +∞)`, `x ∈ [1; 3)`, `\cup`): KHÔNG đọc ở đợt này. Dấu `;` đang là
  một cách viết "hoặc" (`OR` trong `stepCheckMath.ts`), nên đọc ký hiệu khoảng kiểu Việt Nam
  `(a; b)` sẽ đụng luật đó → trả "?" và nói rõ.
- **Hệ bất phương trình nhiều ẩn**, hay bất phương trình chứa tham số `m`: vẫn `multi_variable`.
- Không đổi Hoá, Vật lí, `gradeAnswer`/`index.ts` của engine chấm, ngân hàng đề, giao diện ngoài
  nhãn chữ.
- Không thêm phụ thuộc npm. Lý do giữ nguyên như đặc tả 2026-10-09 §5.

## ② Điểm chạm

| Việc | Đường dẫn file                                   | Ghi chú                                                       |
| ---- | ------------------------------------------------ | ------------------------------------------------------------- |
| Sửa  | `packages/core-grading/stepCheckMath.ts`         | đọc dấu bất đẳng thức, `IntervalSet`, so tập, `isFinalAnswer` |
| Sửa  | `packages/core-grading/stepCheckMath.test.ts`    | ca mới (mục ④)                                                |
| Sửa  | `packages/core-ai/stemScratchpadService.ts`      | câu chữ `changed` cho bất phương trình, gợi ý "đổi chiều"     |
| Sửa  | `packages/core-ai/stemScratchpadService.test.ts` | gợi ý không lộ đáp án (mở rộng test bất biến 0551)            |

Nếu `stepCheckMath.ts` vượt ~900 dòng thì tách phần tập nghiệm sang
`packages/core-grading/mathSolutionSet.ts`. Đây là file mới, chỉ `stepCheckMath.ts` import.

**Ảnh hưởng lan ra:** chạy `npm run codemap -- impact packages/core-grading/stepCheckMath.ts` trước
khi làm và ghi vào changelog. Bộ kiểm bước KHÔNG xuất qua `core-grading/index.ts`, nên không vào
bundle client.

## ③ Hợp đồng dữ liệu

**Vào/ra API:** không đổi (`POST /api/stem-scratchpad?action=validate_step`).

**`MathStepCheck`:** không thêm biến thể. `not_equation` nay chỉ còn nghĩa "không có `=`, không có
dấu bất đẳng thức" (biểu thức trơn). Cập nhật chú thích kiểu cho đúng nghĩa mới.

**Ca lỗi:**

| Tình huống                                                     | Kết luận                                              |
| -------------------------------------------------------------- | ----------------------------------------------------- |
| `-2x < 6` → `x < -3` (quên đổi chiều)                          | `changed` · lost + extra                              |
| `x² < 4` → `x < 2` (bỏ nửa dưới)                               | `changed` · extra (thêm `x ≤ −2`)                     |
| `\frac{1}{x} > 1` → `1 > x` (nhân với `x` chưa biết dấu)       | `changed` · extra (thêm `x ≤ 0`)                      |
| `\frac{x-1}{x-1} \ge 0` → `1 \ge 0` (rút gọn mất điều kiện)    | `changed` · extra (thêm `x = 1`, ngoài miền xác định) |
| `x² + 1 < 0` → vô nghiệm                                       | `equivalent` (cả hai tập rỗng)                        |
| `S = (2; +∞)`                                                  | `unsupported · unknown_notation` + câu nói rõ         |
| `\sin x > 0`                                                   | `unsupported · non_polynomial`                        |
| Bước là phương trình, mốc là bất phương trình (hoặc ngược lại) | so như hai tập bình thường                            |

## ④ Tiêu chí chấp nhận

- [ ] Mọi ca trong bảng ③ có test và cho đúng kết luận —
      `npx vitest run packages/core-grading/stepCheckMath.test.ts`.
- [ ] Ca nghiệm VÔ TỈ: `x² < 2` → `-\sqrt{2} < x < \sqrt{2}` là "?" (căn chưa đọc), nhưng
      `x² < 2` → `x² - 2 < 0` là `equivalent`; `x² < 2` → `x² < 3` là `changed` · extra. Đây là
      các ca chứng minh rằng việc so ô tại nghiệm đại số là chính xác.
- [ ] Ca biên đầu mút: `x \le 2` so với `x < 2` → `changed` · lost (chỉ khác đúng điểm 2).
- [ ] Mọi ca PHƯƠNG TRÌNH hiện có vẫn cho kết quả y hệt (không hồi quy) — cùng file test.
- [ ] Gợi ý Socratic cho bất phương trình không chứa nghiệm/khoảng đáp án —
      `npx vitest run packages/core-ai/stemScratchpadService.test.ts`.
- [ ] Trần: bất phương trình bậc 25 → `too_complex`, không treo (test có `timeout` 2 s).

**Lệnh chứng minh:**

```bash
npm run typecheck && npm run lint && npm run test:coverage && npm run build
npx vitest run packages/core-grading packages/core-ai/stemScratchpadService.test.ts
```

## ⑤ Bất biến không được phá

| Bất biến                                             | Test nào canh nó                                          |
| ---------------------------------------------------- | --------------------------------------------------------- |
| Không đoán: chỉ ✓/✗ khi CHỨNG MINH được, còn lại "?" | `packages/core-grading/stepCheckMath.test.ts`             |
| Gợi ý không lộ nghiệm/bước đúng                      | `packages/core-ai/stemScratchpadService.test.ts`          |
| Kết luận phương trình hiện có không đổi              | `packages/core-grading/stepCheckMath.test.ts`             |
| Bộ kiểm bước không vào bundle client                 | `npm run size` + không export qua `core-grading/index.ts` |

## ⑥ Câu hỏi cho chủ dự án trước khi duyệt

1. **Ký hiệu khoảng kiểu Việt Nam** (`S = (2; +∞)`) — học sinh hay viết đáp số bất phương trình theo
   lối này. Đợt này đề xuất trả "?" cho dạng đó (vì `;` đang nghĩa "hoặc"). Có cần làm ngay trong
   đợt này không, hay để đợt sau?
2. **Trị tuyệt đối** — làm luôn trong đợt này (thêm ~1 ngày, 2 câu ngân hàng + 7 câu tự kiểm) hay
   để sau?

## ⑦ Rủi ro và rollback

- **Rủi ro:** bộ kiểm báo ✗ oan cho một bước đúng thì người học mất niềm tin. Giảm rủi ro bằng cách:
  so ô chính xác (không làm tròn), và test đối chiếu từng ca với tập nghiệm tính tay. Ca nào còn
  nghi ngờ thì trả "?".
- **Rollback:** revert PR. Không đổi API, schema hay dữ liệu.
