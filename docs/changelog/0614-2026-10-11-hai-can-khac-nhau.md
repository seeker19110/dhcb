# 0614 — Bảng nháp STEM: bộ kiểm bước Toán đọc hai căn khác nhau (vẫn chính xác)

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `feat(stem)`
- **Đặc tả:** `docs/specs/2026-10-11-hai-can-khac-nhau.md` (Approved for implementation — chủ dự
  án chọn "Hai căn khác nhau").
- **Nguồn việc:** nợ "Bảng nháp STEM" trong `PROGRESS.md`, mục (2).

## Vấn đề

Sau `0613`, dạng lớp 10 hay gặp `√(x+5) + √x = 5`, `2√x = √(x+12)` và đáp số `x = √2 + √3` vẫn ra
"? Chưa tự kiểm được" vì mỗi quan hệ chỉ được một biểu thức dưới căn.

## Đã làm

- `stepCheckMath.ts`:
  - thay số học một căn `Surd` bằng **tháp căn** `Ring<T>`: tầng 0 = phân thức, `adjoinRoot` thêm
    một căn `a + b·√g`;
  - dấu ở mỗi tầng dùng đúng công thức của `0613`, dấu của các hệ số do tầng dưới tính (đệ quy);
  - `toRadical` đổi cây biểu thức sang phần tử của tháp;
  - tối đa 2 biểu thức dưới căn khác nhau mỗi quan hệ (`MAX_RADICANDS`);
  - dạng riêng `√f rel √g` của `0613` nay là ca thường, bỏ nhánh riêng.
- Câu phạm vi: "tối đa hai biểu thức dưới căn khác nhau"; chưa đọc "ba căn khác nhau trở lên".

## Bằng chứng

- `stepCheckMath.test.ts`: khối "hai căn khác nhau" — 15 ca bảng + 5 test riêng:
  - chuyển vế, bình phương đúng/sai;
  - bất phương trình, hai điều kiện rời nhau;
  - bốn nghiệm `±√2 ± √3`, chia cho `√2·√3`;
  - gom `√(x+1)` với `√(1+x)`, mẫu có căn ở tầng trên.
    Ca "?" cũ `√(x+5) + √x = 5` và `2√x = √(x+3)` thay bằng ba căn khác nhau.
- Toàn bộ test căn của `0613` vẫn xanh trên mã mới (một căn = một tầng).
- Hỏng có chủ đích:
  - bỏ `a·b ≤ 0` ở `= 0` → 1 test đỏ;
  - nâng căn tầng dưới sai → 15 test đỏ;
  - bỏ `P < 0` ở nhánh `>` → ban đầu KHÔNG test hai căn nào đỏ. Đã thêm ca `√x + 2 < √(x+5)` ⇔
    `0 ≤ x < 1/16` nhắm đúng nhánh đó, sau đó 1 test đỏ.
  - trả lại → xanh.
- Đo: mỗi ca phổ thông dưới 10 ms.
- Không đổi giao diện (không cần ảnh Tầng 8b), không đổi API/CSDL.
