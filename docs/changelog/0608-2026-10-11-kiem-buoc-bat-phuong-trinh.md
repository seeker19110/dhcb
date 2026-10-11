# 0608 — Bảng nháp STEM: kiểm CHÍNH XÁC bước giải bất phương trình một ẩn

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `feat(stem)`
- **Đặc tả:** `docs/specs/2026-10-11-kiem-buoc-bat-phuong-trinh.md` — Approved for implementation
  (chủ dự án duyệt 2026-10-11, phạm vi lõi). Hai câu hỏi ở mục ⑥ (ký hiệu khoảng `S = (2; +∞)`, trị
  tuyệt đối) chủ dự án chọn "để đợt sau".
- **Nguồn việc:** nợ "Bảng nháp STEM" trong `PROGRESS.md`, mục còn lại (2): bất phương trình là
  dạng ngoài phạm vi có nhiều câu nhất trong ngân hàng đề (11/168 câu Toán).

## Đã làm

- **`packages/core-grading/mathSolutionSet.ts` (mới):**
  - Một tập nghiệm được biểu diễn bằng **công thức dấu**: "(N/D) quan hệ 0", "mẫu ≠ 0", nối bằng
    "và"/"hoặc".
  - Khi so hai tập, mọi đa thức của cả hai được gộp thành **một đa thức tới hạn C** (bội chung,
    không lặp). Nghiệm thực của C chia trục số thành các ô; trên mỗi ô, dấu của mọi đa thức đã gộp
    không đổi.
  - **Ô khoảng:** tính dấu tại một điểm hữu tỉ bên trong.
  - **Ô nghiệm** (có thể vô tỉ, vd √2, ∛2): nghiệm được cách ly bằng dãy Sturm trong một khoảng
    `(lo, hi)` chứa đúng một nghiệm của C. Đa thức p bằng 0 tại nghiệm đó ⇔ ƯCLN(p, C) đổi dấu
    trên `(lo, hi)`. Nếu không, p không có nghiệm nào trong khoảng, nên dấu tại nghiệm = dấu tại
    `lo`.
  - Toàn bộ là số hữu tỉ BigInt, không làm tròn. Đây là cách làm khác với đặc tả ① một chút: đặc
    tả mô tả "thu hẹp khoảng cách ly tới khi đa thức kia hết nghiệm", nhưng vì C là bội chung của
    mọi đa thức nên điều đó luôn đúng ngay từ đầu, không cần thu hẹp thêm.
- **`stepCheckMath.ts`:**
  - Bộ đọc nhận `<`, `>`, `≤`, `≥`, `\le`, `\leq`, `\leqslant`, `\ge`…, `\lt`, `\gt`, `<=`, `>=`,
    `⩽`, `⩾`, cùng chuỗi kép `a < x \le b`. `\left` không bị đọc nhầm thành `\le`.
  - **Mọi đoạn đều là phương trình → đi đúng nhánh cũ** (finite/cofinite). Kết luận phương trình
    không đổi; mọi test phương trình cũ vẫn xanh.
  - Có bất phương trình ở bất kỳ đâu → so bằng phân hoạch. Phương trình so với bất phương trình
    được so như hai tập bình thường.
  - `changed` có thêm trường TUỲ CHỌN `inequality: { complementOnIntervals }`, chỉ có khi dính bất
    phương trình. Không thêm biến thể `MathStepCheck` (đúng ③).
  - `isFinalAnswer` nhận các dạng `x op c`, `a op x op b` (hai dấu cùng chiều) và các dạng đó nối
    "hoặc".
  - `readsAsMathStatement` (mới): bước 1 của đề lời văn là bất phương trình vẫn được nhận làm MỐC.
    Trước đây bước này rơi vào câu "chưa đọc được", sai sự thật.
- **`polynomial.ts`:** xuất `polyEval`, `sturmChain`, `signChanges`; `countRealRoots` dùng lại,
  không chép logic.
- **Câu chữ** (`stemScratchpadService.ts` + `stemMicroHint.ts`, dùng chung `cauHoiBatPhuongTrinh`):
  - Phản hồi nói "mất một phần tập nghiệm" / "thêm giá trị không phải nghiệm".
  - Câu Socratic "chia cho số âm thì chiều thay đổi thế nào?" **CHỈ** hiện khi bộ kiểm chứng minh
    tập mới là phần bù của tập đúng trên mọi khoảng.
    - Đặc tả viết "bước có chiều ngược với bước trước". Đã đổi thành điều kiện trên, vì lỗi quên
      đổi chiều GIỮ NGUYÊN ký hiệu (`-2x < 6` → `x < -3`), nên so ký hiệu sẽ bỏ sót đúng lỗi cần bắt.
    - `x² < 4` → `x < 2` KHÔNG nhận câu này.
  - Câu phạm vi nay ghi rõ "ký hiệu khoảng như S = (2; +∞) — đáp số hãy viết dạng x > 2".
  - Bổ sung ngoài đặc tả: nút "Gợi ý" ở bước bất phương trình HỢP LỆ trước đây bảo "viết lại để bộ
    kiểm đọc được", dù bộ kiểm đã đọc được. Nay nó hỏi về cấu trúc bước, ở bậc 2.

## Ảnh hưởng (`npm run codemap -- impact`)

- `stepCheckMath.ts` ảnh hưởng 12 file, gồm `stemMicroHint.ts`, `stemScratchpadService.ts`,
  `apps/server/src/api/learning/stem-scratchpad.ts` và chuỗi route.
- `polynomial.ts` ảnh hưởng 15 file, thêm `mathSolutionSet.ts`.
- Đã chạy test của mọi file trong hai danh sách: xanh.
- Bộ kiểm không xuất qua `core-grading/index.ts`, nên không vào bundle client.

## Bằng chứng

- `npx vitest run packages/core-grading packages/core-ai/stem` → **448/448 xanh**. Ca mới phủ:
  - **Bảng ③:** quên đổi chiều → `lost + extra` và `complementOnIntervals`; `x² < 4` → `x < 2`
    thêm nửa dưới; `1/x > 1` → `1 > x` thêm `x ≤ 0`; `(x−1)/(x−1) ≥ 0` → `1 ≥ 0` thêm `x = 1`;
    `x² + 1 < 0` ⇔ vô nghiệm.
  - **"?" (không đoán):** `S = (2; +∞)` → `unknown_notation`; `\sin x > 0` → "?".
  - **Phương trình ↔ bất phương trình:** `2 ≤ x ≤ 2` ⇔ `x = 2`.
  - **Nghiệm vô tỉ (④):** `x² < 2` → `x² − 2 < 0` tương đương; → `x² < 3` thêm; `≤` so với `<`
    khác đúng ở ±√2; `(x³−2)(x−1) ≤ 0` (nghiệm ∛2).
  - **Đầu mút:** `x ≤ 2` → `x < 2` mất đúng điểm 2.
  - **Hai nghiệm sát nhau:** 1 và 1,0001.
  - **Trần:** bậc 25 → `too_complex` trong < 2 s; bậc 24 vẫn kiểm.
  - **Đáp số + bước trước:** dạng đáp số, `sameAsPrevious`.
  - **Bất biến "gợi ý không lộ nghiệm":** test 0551 nay chạy cả đề bất phương trình. Gợi ý không
    chứa số nguyên nào thuộc tập nghiệm. Ca `x² − 4 < 0` đã bắt được chữ "0" trong "(mẫu khác 0)",
    nên câu đó được đổi thành "khác không".
- **Một ca cũ đổi CÓ CHỦ ĐÍCH:** `x < 5` so với đề `2x + 5 = 15` trước đây ra `not_equation`, nay
  là `changed` (lost + extra), đúng dòng cuối bảng ③.
