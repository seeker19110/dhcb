# Đặc tả — Làm dày 7 chương Toán chỉ có 1 bài

> Ngày: 2026-10-09 · **Trạng thái:** Approved for implementation (chủ dự án chọn "Làm dày chương
> mỏng" trong phiên 2026-10-09, đợt 2/4 của lượt soạn nốt bài học)

## 0. Một câu

Thêm 13 bài để 7 chương Toán đang chỉ có 1 bài phủ đủ các bài còn thiếu so với SGK Kết nối tri
thức.

## ① Phạm vi

**LÀM:**

| Chương | Bài thêm                                                                                                  |
| ------ | --------------------------------------------------------------------------------------------------------- |
| 10 C2  | b2 Hệ bất phương trình bậc nhất hai ẩn và bài toán tối ưu                                                 |
| 10 C3  | b2 Giá trị lượng giác của góc từ 0° đến 180° · b3 Diện tích tam giác và giải tam giác trong thực tế       |
| 10 C9  | b2 Biến cố đối và sơ đồ cây trong tính xác suất                                                           |
| 11 C2  | b2 Dãy số: cách cho dãy, tính tăng giảm và bị chặn · b3 Cấp số nhân trong bài toán lãi kép và tăng trưởng |
| 11 C7  | b2 góc đường–mặt · b3 góc nhị diện · b4 khoảng cách · b5 thể tích                                         |
| 11 C9  | b2 Các quy tắc tính đạo hàm · b3 Đạo hàm cấp hai và gia tốc tức thời                                      |
| 12 C6  | b2 Công thức xác suất toàn phần và bài toán xét nghiệm                                                    |

**KHÔNG LÀM:**

- Hoá 10 C4–C6 và Sinh 12 C5/C7/C9 không thêm bài. Hai môn này đánh số bài theo đúng số bài SGK
  (`hoa10-c4-b13`, `c5-b14`, `c6-b15`…), và mỗi chương trong SGK cũng chỉ có 1 bài. Như vậy
  chương không thiếu so với SGK; chen bài mới vào sẽ phá dãy số.
- Không đặt `reviewStatus: 'reviewed'`.
- Không sửa schema.

## ② Điểm chạm

| Việc | Đường dẫn file                              | Ghi chú                         |
| ---- | ------------------------------------------- | ------------------------------- |
| Sửa  | `packages/subject-math/lessons/toan10c2.ts` | +1 bài                          |
| Sửa  | `packages/subject-math/lessons/toan10c3.ts` | +2 bài                          |
| Sửa  | `packages/subject-math/lessons/toan10c9.ts` | +1 bài                          |
| Sửa  | `packages/subject-math/lessons/toan11c2.ts` | +2 bài                          |
| Sửa  | `packages/subject-math/lessons/toan11c7.ts` | +4 bài                          |
| Sửa  | `packages/subject-math/lessons/toan11c9.ts` | +2 bài                          |
| Sửa  | `packages/subject-math/lessons/toan12c6.ts` | +1 bài                          |
| Sinh | `packages/subject-math/lessonsLazy.ts`      | `npm run gen:stem-lesson-index` |

## ③ Hợp đồng dữ liệu

Mỗi bài là một `MathLesson` khớp `MathLessonSchema`, với `track: 'core'` và `reviewStatus:
'draft'`.

| Tình huống              | Hành vi mong đợi                |
| ----------------------- | ------------------------------- |
| Zod fail                | Sửa nội dung, không nới schema  |
| `timLoiTuCham` báo lỗi  | Tính lại đáp án, không nới test |
| `timLoiHoatAnh` báo lỗi | Sửa hoạt ảnh                    |

## ④ Tiêu chí chấp nhận

- [ ] Không còn chương Toán chuẩn nào chỉ có 1 bài. Toán có 68 bài.
- [ ] `packages/subject-math` test xanh, gồm `lessons.test.ts` và `lessonsLazy.test.ts`.
- [ ] `npx tsx scripts/audit-prose.ts --ci` thoát 0.
- [ ] `npm run typecheck && npm run lint && npm run test:coverage && npm run build` sạch.

## ⑤ Bất biến không được phá

| Bất biến                             | Test canh                           |
| ------------------------------------ | ----------------------------------- |
| Đáp án tự chấm đúng bằng engine thật | `lessons.test.ts` ca "tự chấm ĐÚNG" |
| Không trùng tiêu đề                  | `lessons.test.ts`                   |
| Chỉ mục khớp registry                | `lessonsLazy.test.ts`               |

## ⑥ Quy ước dự án liên quan

Khuôn bài STEM: `docs/specs/2026-09-13-hoan-thien-4-mon-stem.md`.
