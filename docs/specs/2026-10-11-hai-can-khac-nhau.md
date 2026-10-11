# Đặc tả — Bảng nháp STEM: bộ kiểm bước Toán đọc HAI căn khác nhau (vẫn chính xác)

- **Ngày:** 2026-10-11 · **Trạng thái:** Approved for implementation (chủ dự án chọn "Hai căn khác
  nhau" ngày 2026-10-11, sau khi gộp `0613`).
- **Nguồn việc:** nợ "Bảng nháp STEM" trong `PROGRESS.md`, mục (2); phần "KHÔNG LÀM" của
  `docs/specs/2026-10-11-can-bac-hai.md` (hai căn khác nhau trong một quan hệ).

## 0. Một câu

Phương trình/bất phương trình có HAI biểu thức dưới căn khác nhau (`√(x+5) + √x = 5`,
`2√x = √(x+12)`, `√x + 2 < √(x+5)`) và đáp số có hai căn (`x = √2 + √3`) được kiểm chính xác như
một căn — không làm tròn, ngoài phạm vi vẫn "?".

## ① Phạm vi

**LÀM:**

- Tổng quát hoá số học căn của `0613` thành **tháp căn**: tầng 0 là phân thức hữu tỉ; mỗi tầng
  thêm một căn `r = √g`, phần tử là `a + b·r` với a, b thuộc tầng dưới, nhân bằng `r² = g`. Hai căn
  khác nhau = hai tầng: `(A + B√f) + (C + D√f)·√g`.
- Dấu của `a + b·r` dùng ĐÚNG công thức của `0613` (P = a² − b²g; `=`, `>`, `≥`, đổi dấu cho `<`,
  `≤`), chỉ khác là dấu của a, b, P, a·b do tầng dưới tính — đệ quy tới phân thức. Một căn = một
  tầng nên kết quả của `0613` giữ nguyên; dạng riêng `√f rel √g` của `0613` thành ca thường.
- Chia cho phần tử không chứa căn của tầng trên cùng, hoặc cho phần tử thuần căn `d·√g`
  (`x/(d√g) = x√g/(d·g)`); điều kiện mẫu ≠ 0 đệ quy về đa thức (d ≠ 0, g ≠ 0).
- Gom căn theo GIÁ TRỊ biểu thức dưới căn (`√(x+1)` và `√(1+x)` là một căn).
- Trần `MAX_RADICANDS = 2` biểu thức dưới căn khác nhau trong một quan hệ; mỗi tầng làm bậc tăng
  gấp đôi, vượt trần bậc → `too_complex`.
- Câu phạm vi (`PHAM_VI_KIEM.math`): "tối đa hai biểu thức dưới căn khác nhau"; chưa đọc "ba căn
  khác nhau trở lên".

**KHÔNG LÀM (vẫn "?"):**

- Ba căn khác nhau trở lên trong một quan hệ (`√x + √(x+1) + √(x+2) = 3`).
- Mẫu dạng `c + d√g` (cả hai khác 0) — kể cả `1/(√(x+3) − √x)`; trục căn có thể đẻ thêm điểm loại
  trừ sai.
- Căn lồng căn, căn bậc ba; không đổi giao diện, API, CSDL; không thêm phụ thuộc.

## ② Điểm chạm

| Việc | Đường dẫn file                                | Ghi chú                                          |
| ---- | --------------------------------------------- | ------------------------------------------------ |
| Sửa  | `packages/core-grading/stepCheckMath.ts`      | `Ring<T>`, `adjoinRoot`, `toRadical` thay `Surd` |
| Sửa  | `packages/core-grading/stepCheckMath.test.ts` | ca hai căn; ca "?" đổi sang ba căn               |
| Sửa  | `packages/core-ai/stemScratchpadService.ts`   | câu phạm vi                                      |

## ③ Ca

| Đề                                       | Bước                                  | Kết quả                 |
| ---------------------------------------- | ------------------------------------- | ----------------------- |
| `\sqrt{x + 5} + \sqrt{x} = 5`            | `x = 4`                               | ✓ đáp số                |
| `\sqrt{x + 5} + \sqrt{x} = 5`            | `\sqrt{x + 5} = 5 - \sqrt{x}`         | ✓                       |
| `\sqrt{x + 5} + \sqrt{x} = 5`            | `x + 5 = 25 - 10\sqrt{x} + x`         | ✓                       |
| `\sqrt{x + 5} + \sqrt{x} = 5`            | `x + 5 = 25 + x`                      | ✗ mất nghiệm, cờ bỏ căn |
| `\sqrt{x} + 2 < \sqrt{x + 5}`            | `0 \le x < \frac{1}{16}`              | ✓                       |
| `\sqrt{x + 5} + \sqrt{x} \ge 5`          | `x > 4`                               | ✗ mất nghiệm (đầu mút)  |
| `x^4 - 10x^2 + 1 = 0`                    | `x = \pm\sqrt{2} \pm \sqrt{3}` (4 ca) | ✓                       |
| `x^4 - 10x^2 + 1 = 0`                    | `x = \sqrt{2} + \sqrt{3}`             | ✗ mất nghiệm            |
| `\sqrt{x} + \sqrt{x+1} + \sqrt{x+2} = 3` | bất kỳ                                | ? `too_complex`         |

## ④ Tiêu chí chấp nhận

- [ ] Các ca ở ③ có test; mọi test căn của `0613` vẫn xanh (một căn = một tầng).
- [ ] Hỏng có chủ đích ở công thức dấu tổng quát (bỏ `a·b ≤ 0`; bỏ `P < 0` ở nhánh `>`; căn tầng
      dưới nâng sai) → test hai căn đỏ.
- [ ] Cổng đầy đủ xanh: typecheck · lint · format · `test:coverage` · build · size.

## ⑤ Bất biến

| Bất biến                                          | Test canh                                     |
| ------------------------------------------------- | --------------------------------------------- |
| Chỉ ✓/✗ khi chứng minh được; ngoài phạm vi là "?" | `packages/core-grading/stepCheckMath.test.ts` |
| Gợi ý không lộ nghiệm                             | `packages/core-ai/stemMicroHint.test.ts`      |

## ⑥ Rủi ro và rollback

- **Rủi ro:** sai ở công thức tổng quát làm sai cả ca một căn — chặn bằng toàn bộ test căn của
  `0613` chạy lại trên mã mới + ba phép hỏng có chủ đích.
- **Hiệu năng:** hai tầng làm bậc ×4; ca phổ thông đo dưới 10 ms; vượt trần → "?".
- **Rollback:** revert PR; không đổi API, CSDL hay dữ liệu người dùng.
