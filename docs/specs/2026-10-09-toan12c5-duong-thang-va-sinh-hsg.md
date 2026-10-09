# Đặc tả — Toán 12 chương 5 (đường thẳng, góc trong không gian) + nhánh HSG môn Sinh

> Ngày: 2026-10-09 · Trạng thái: **Approved for implementation** (chủ dự án chọn phạm vi trong
> phiên 2026-10-09: "Toán 12 C5 + Sinh HSG", mục 1/4 của đợt soạn nốt bài học còn thiếu).
> Căn cứ: rà soát toàn bộ nội dung 2026-10-09. Kết quả: mọi bài **đã khai báo** trong mã đều có
> nội dung. Hai lỗ hổng chương trình thật còn lại là (1) Toán 12 C5 mới có 2 bài, thiếu phương
> trình đường thẳng và các công thức góc trong không gian; (2) Sinh là môn STEM duy nhất chưa có
> nhánh bồi dưỡng HSG. So sánh: Toán, Lí và Hoá đều đã có nhánh này
> (`toan{10,11,12}c20`, `lyhsg*`, `hoa-hsg-*`).

## 0. Một câu

Thêm 2 bài Toán 12 C5 và 9 bài chuyên đề HSG môn Sinh, mỗi lớp 3 bài, theo đúng khuôn bài STEM
đã có. Mục đích: lớp 12 có đủ chương hình học toạ độ không gian, và học sinh chọn nhánh "Chuyên
đề HSG" ở môn Sinh không còn gặp danh sách trống.

## ① Phạm vi

**LÀM:**

- `toan12c5.ts` thêm hai bài:
  - `toan12-c5-b3` "Phương trình đường thẳng trong không gian": tham số, chính tắc, vị trí tương
    đối của hai đường thẳng.
  - `toan12-c5-b4` "Công thức tính góc trong không gian": góc giữa hai đường thẳng, giữa đường
    thẳng và mặt phẳng, giữa hai mặt phẳng.
- Thêm ba file HSG Sinh. Mỗi file có ba bài đi từ dễ lên khó theo ba cấp thi: b1 `hsg-truong`,
  b2 `hsg-tinh`, b3 `hsg-quoc-gia`.
  - `sinhhsgtebao.ts`: lớp 10, chương 91 "Chuyên đề HSG: Sinh học tế bào".
  - `sinhhsgsinhli.ts`: lớp 11, chương 92 "Chuyên đề HSG: Sinh lí thực vật và động vật".
  - `sinhhsgditruyen.ts`: lớp 12, chương 93 "Chuyên đề HSG: Di truyền học".
  - Dùng số chương 91–93 để tách khỏi chương chuẩn, đúng tiền lệ `lyhsg*`.
- Đăng ký các file mới vào `lessons.ts`. Thêm `listBiologyAdvancedLessons` cho đồng dạng với Lí và
  Hoá. Sinh lại chỉ mục nạp lười bằng `npm run gen:stem-lesson-index`.
- Thêm cổng "mỗi cấp HSG đều có chuyên đề" cho Sinh, đúng tiền lệ Lí.

**KHÔNG LÀM:**

- Không đặt `reviewStatus: 'reviewed'`. Mọi bài mới đều là `draft`, chờ duyệt chuyên môn.
- Không sửa schema (`lessonTypes.ts`) hay giao diện. `StemLessonList` đã có sẵn tab "Chuyên đề
  HSG" đọc từ chỉ mục.
- Không chép đề hoặc ví dụ của SGK hay đề thi thật. Chỉ dùng kiến thức nền, còn ví dụ thì tự soạn.

## ② Điểm chạm

| Việc | Đường dẫn file                                        | Ghi chú                                   |
| ---- | ----------------------------------------------------- | ----------------------------------------- |
| Sửa  | `packages/subject-math/lessons/toan12c5.ts`           | Thêm b3, b4                               |
| Thêm | `packages/subject-biology/lessons/sinhhsgtebao.ts`    | Lớp 10, chương 91                         |
| Thêm | `packages/subject-biology/lessons/sinhhsgsinhli.ts`   | Lớp 11, chương 92                         |
| Thêm | `packages/subject-biology/lessons/sinhhsgditruyen.ts` | Lớp 12, chương 93                         |
| Sửa  | `packages/subject-biology/lessons.ts`                 | Import, thêm `listBiologyAdvancedLessons` |
| Sửa  | `packages/subject-biology/lessons.test.ts`            | Cổng đủ ba cấp HSG                        |
| Sinh | `packages/subject-biology/lessonsLazy.ts`             | `npm run gen:stem-lesson-index`           |
| Sinh | `packages/subject-math/lessonsLazy.ts`                | `npm run gen:stem-lesson-index`           |

## ③ Hợp đồng dữ liệu

- Toán: `MathLesson[]` phải khớp `MathLessonSchema`.
- Sinh: `BiologyLesson[]` phải khớp `BiologyLessonSchema`, với `track: 'advanced'` và có
  `advancedTier`.
- Đáp án dùng `numeric` hoặc `choice`, chấm tất định bằng `@dhcb/core-grading`.

| Tình huống              | Hành vi mong đợi                             |
| ----------------------- | -------------------------------------------- |
| Zod fail                | Không commit. Sửa nội dung, không nới schema |
| `timLoiTuCham` báo lỗi  | Đáp án khai sai: tính lại, không nới test    |
| `timLoiHoatAnh` báo lỗi | Sửa hoạt ảnh, không bỏ cổng                  |

## ④ Tiêu chí chấp nhận

- [ ] Toán 12 chương 5 có ít nhất 4 bài.
- [ ] Sinh có 9 bài `track: 'advanced'`, mỗi cấp đúng 3 bài.
- [ ] `lessons.test.ts` của Toán và Sinh đều xanh, và `lessonsLazy.test.ts` cũng xanh.
- [ ] `npx tsx scripts/audit-prose.ts --ci` thoát 0.
- [ ] `npm run typecheck && npm run lint && npm run test:coverage && npm run build` sạch.

## ⑤ Bất biến không được phá

| Bất biến                             | Test canh                           |
| ------------------------------------ | ----------------------------------- |
| Đáp án tự chấm đúng bằng engine thật | `lessons.test.ts` ca "tự chấm ĐÚNG" |
| Độ phủ hoạt ảnh core không tụt       | ratchet `TOI_THIEU_PHU_HOAT_ANH`    |
| Chỉ mục nạp lười khớp registry       | `lessonsLazy.test.ts`               |

## ⑥ Quy ước dự án liên quan

Khuôn bài STEM: `docs/specs/2026-09-13-hoan-thien-4-mon-stem.md`. Tiền lệ nhánh HSG:
`packages/subject-physics/lessons/lyhsgcohoc.ts`.
