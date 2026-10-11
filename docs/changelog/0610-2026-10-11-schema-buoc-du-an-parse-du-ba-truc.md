# 0610 — Schema bước dự án: nới trần `requirement`, parse mọi bước của cả ba dự án trục

- **Ngày:** 2026-10-11 · **PR:** (xem mô tả PR) · **Loại:** `fix(programming)`
- **Nguồn việc:** nợ nhỏ phát hiện ở đợt `0609`, ghi trong `PROGRESS.md` mục "Dự án trục T2/T3".

## Vấn đề

`requirement` của bước `p5-s5` (T1) dài 2265 ký tự, vượt trần `.max(2000)` của
`ProjectStepSchema`. Không test nào đỏ: T2 có test parse từng bước qua schema, còn T1 và T3 thì
không. App không parse bước lúc chạy (schema chỉ để khai kiểu), nên người học không bị ảnh hưởng,
nhưng dữ liệu đã lệch khỏi hợp đồng của chính nó.

## Đã làm

- `projectStepTypes.ts`: trần `requirement` 2000 → 3000. Đề bước chốt chặng làn apisim phải kèm
  nguyên khối kiểm thử học viên cần dán, nên dài hơn các bước khác. Không rút ngắn đề, vì đổi câu
  chữ của đề là việc nội dung, không phải việc sửa lỗi.
- `projectSteps.test.ts`: test mới parse MỌI bước của T1, T2, T3 qua `ProjectStepSchema`, báo
  đúng mã bước và đường dẫn trường sai.

## Bằng chứng

- Đã đo cả ba dự án: chỉ `p5-s5` trượt schema, và trượt đúng ở trường `requirement`.
- Chạy test mới với schema CŨ: đỏ đúng một ca, `dự án T1 — p5-s5: requirement`. Với schema mới:
  `npx vitest run packages/subject-programming/projectSteps` → 151/151 xanh.
