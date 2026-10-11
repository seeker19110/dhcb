# 0609 — Dự án Lập trình, làn `apisim`: bộ chấm tự gọi API (chống in sẵn đáp án)

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `feat(programming)`
- **Đặc tả:** `docs/specs/2026-10-11-apisim-ca-an-chong-go-cung.md` — Approved for implementation
  (chủ dự án duyệt 2026-10-11).
- **Nguồn việc:** nợ "Dự án trục T2/T3" trong `PROGRESS.md`: bước apisim không có input nên ca ẩn
  không chặn được lời giải gõ cứng (giới hạn chung với T1).

## Vấn đề

Đề bắt học viên dán một khối kiểm thử cố định (gọi `TestClient`, in `DS: 200 4`…) vào cuối
`api.py`. Mọi ca chấm đều là "stdout chứa dòng X", nên một file chỉ gồm các lệnh `print("DS: 200 4")`
… đạt HẾT ca, kể cả ca ẩn.

## Đã làm

- **`projectStepTypes.ts`:**
  - `refine` cho phép `probeCode` ở bước `apisim`; bước `pytest` vẫn bị từ chối.
  - Trần `checks` nâng 8 → 12. Bổ sung khi thi hành: 6/9 bước đã đủ 8 ca nên không thêm được ca
    nào. Đặc tả đã ghi lại điểm này. Không mã nào khác dựa vào con số 8.
- **9 bước** `p4-s5`, `p4-s6`, `p5-s5`, `t2-p4-s5`, `t2-p4-s6`, `t2-p5-s5`, `t3-p4-s5`,
  `t3-p4-s6`, `t3-p5-s5`, mỗi bước có một `probeCode` (613–957 ký tự):
  - `runpy.run_path("api.py", run_name="__main__")` chạy NGUYÊN file học viên. Khối kiểm thử của
    họ, kể cả khi bọc trong `if __name__ == "__main__":`, vẫn in như cũ, nên ca cũ không đổi.
  - Tạo `TestClient` mới rồi gọi API bằng dữ liệu riêng, in các dòng `KT …`.
  - Mọi phép so đều TƯƠNG ĐỐI với trạng thái khối kiểm thử để lại: hiệu số trước/sau, đọc lại
    đúng id vừa tạo, id rất lớn.
- **2–3 ca ẩn `KT` mỗi bước:**
  - Mỗi ca có chú thích trích đúng câu của đề mà nó dựa vào (đặc tả ⑥: chỉ kiểm hành vi đề đã ghi).
  - Toàn bộ ca cũ giữ nguyên nhãn và chuỗi mong đợi. Diff của 6 file bước không có dòng nào bị xoá.
- **Test:**
  - `lessonsPython.test.ts` (python3 thật):
    - code tham chiếu đạt mọi ca qua probe;
    - **lời giải gõ cứng phải TRƯỢT ở cả 9 bước**;
    - khối kiểm thử bọc `if __name__ == "__main__":` vẫn đạt hết (p4-s5, t2-p4-s5, t3-p4-s5);
    - đủ 9 bước apisim, mỗi bước có probe và ≥ 2 ca `KT` ẩn.
  - `projectSteps.test.ts`: apisim + probe hợp lệ; pytest + probe bị từ chối; 12 ca nhận, 13 ca từ
    chối. Hai khẳng định cũ "bước P4 không có probe" ở đây và ở `projectStepsT3.test.ts` sửa
    thành "chỉ bước apisim có".
  - **E2E** `e2e/programming-project.spec.ts`: chấm `t2-p4-s5` bằng code mẫu trên **Pyodide
    THẬT** → hiện "Ca ẩn 11" và "Đạt hết test của bước 5".

## Giới hạn (giữ nguyên, ghi rõ)

- Vẫn chỉ chấm ở trình duyệt. Server không chấm lại bước dự án, và đặc tả không đổi điều đó. Ca
  ẩn là công cụ sư phạm, không phải hàng rào an ninh.
- **Phát hiện kèm, có từ trước:** `requirement` của `p5-s5` dài hơn trần `.max(2000)` của
  `ProjectStepSchema`. Lỗi chỉ ở mức kiểu: schema không parse bước nào lúc chạy, và T1 chưa có
  test parse như T2. Đợt này không sửa, đã ghi vào `PROGRESS.md`.

## Ảnh hưởng (`npm run codemap -- impact packages/subject-programming/projectStepTypes.ts`)

Kết quả ghi ở mô tả PR. Đã chạy lại toàn bộ `packages/subject-programming`.

## Bằng chứng

- `npx vitest run packages/subject-programming`: 99 file / 7798 test xanh, 0 skip.
  - Python 3.13 có sẵn trong máy, nên test python chạy thật: riêng `lessonsPython.test.ts` có
    1511 test.
- E2E mới: 1/1 xanh ở máy (10,5 s, Pyodide thật).
- Cổng đầy đủ: xem mô tả PR.
