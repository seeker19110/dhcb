# Đặc tả: Toán THCS 6–9 trên thanh điều hướng và ở màn "Bắt đầu"

> Ngày: 2026-10-10 · **Trạng thái:** Approved for implementation (chủ dự án chốt trong phiên
> 2026-10-10, trả lời bốn câu hỏi: "Trỏ tới danh sách bài" + "Thêm 6–9 khi có Toán")

**Nền:** `docs/specs/2026-10-10-toan-thcs-6-9.md` đã soạn đủ bài Toán lớp 6–9 (changelog
0590–0594), nhưng cố ý để lại hai việc: menu "theo lớp" ở thanh điều hướng và câu "Bạn đang học
lớp mấy?" ở `/bat-dau` vẫn chỉ có lớp 10–12. Người học THCS vì thế phải tự tìm tab lớp trong trang
danh sách bài, và màn "Bắt đầu" xếp họ vào lớp 10.

## 0. Một câu

Cho học sinh THCS tới thẳng bài Toán lớp mình từ thanh điều hướng, và khai được lớp 6–9 ở màn
"Bắt đầu" khi chọn Toán.

## ① Phạm vi

**LÀM:**

- Thanh điều hướng, mục "Toán học": thêm "Lớp 6" … "Lớp 9" ĐỨNG TRƯỚC "Lớp 10". Bốn mục mới trỏ
  tới DANH SÁCH BÀI (`/goc-hoc-tap/mathematics/bai-hoc?lop=<n>`), không trỏ trang tổng quan.
- Trang danh sách bài đọc lớp từ `?lop=`. Lớp lạ hoặc lớp môn không có bài thì dùng lớp mặc định
  của môn. Bấm tab lớp thì ghi lại `?lop=` bằng `replace`, để tải lại trang vẫn giữ đúng tab.
- Mục lớp ở thanh điều hướng chỉ "sáng" khi khớp đúng tham số lớp trên URL (`?lop=` / `?grade=`).
  Cách cũ để mọi mục lớp cùng sáng và cùng mang `aria-current="page"`.
- `IntentGradeSchema` thêm `'6'…'9'`, chỉ BỔ SUNG nên dữ liệu cũ vẫn hợp lệ. Lớp 6–9 chỉ đi cùng môn
  Toán.
- `/bat-dau`: câu hỏi lớp hiện Lớp 6–9 chỉ khi đã chọn Toán.
- Lớp khai ở "Bắt đầu" là lớp CHUNG cho mọi môn STEM đã chọn. Môn không có bài ở lớp đó (Lí, Hoá,
  Sinh với lớp 6–9) dùng lớp mặc định của môn. Luật này áp cả cho cây gợi ý lẫn thẻ tiến độ.
- Migration `0092` nới ràng buộc CHECK `learner_intent_grade_check` để nhận `'6'…'12'`.

**KHÔNG LÀM:**

- Không viết phần tổng quan chương trình cho lớp 6–9: `apps/dhcb/src/data/stemCurriculum.ts` vẫn
  chỉ có lớp 10–12 và Đại học.
- Không thêm lớp 6–9 cho Lí, Hoá, Sinh, vì các môn này chưa có bài THCS.
- Không đổi `LEARNER_INTENT_SCHEMA_VERSION`, vì đây là thay đổi chỉ thêm giá trị enum.
- Không đặt luật "lớp 6–9 chỉ đi cùng Toán" ở tầng DB. Luật này cần đọc mảng `subject_ids`, dễ lệch
  khi thêm môn THCS sau này, nên để ở hợp đồng Zod và server kiểm trước khi ghi.

## ② Điểm chạm

| Việc | Đường dẫn file                                           | Ghi chú                                                     |
| ---- | -------------------------------------------------------- | ----------------------------------------------------------- |
| Thêm | `apps/dhcb/src/lib/stemLessonPaths.ts`                   | `duongDanDanhSachBai(mon, lop?)` nhẹ, không kéo chỉ mục bài |
| Sửa  | `apps/dhcb/src/lib/stemLessonRoutes.ts`                  | Re-export đường dẫn, thêm `lopChoMon`                       |
| Sửa  | `apps/dhcb/src/lib/navTree.ts`                           | `mathThcsGradeChildren`, `NavChild.query`, `childIsActive`  |
| Sửa  | `apps/dhcb/src/lib/breadcrumb.ts`                        | Mục có `query` (tab) không dựng nút breadcrumb riêng        |
| Sửa  | `apps/dhcb/src/components/DesktopSidebar.tsx`            | Truyền `location.search` vào `childIsActive`                |
| Sửa  | `apps/dhcb/src/pages/learning/StemLessonList.tsx`        | Lớp đang xem lấy từ `?lop=`                                 |
| Sửa  | `apps/dhcb/src/pages/learning/StemLessonView.tsx`        | "Về danh sách" mở đúng tab lớp của bài                      |
| Sửa  | `packages/core-contracts/learnerIntent.ts`               | Enum 6–12, `isGradeAllowedFor`                              |
| Sửa  | `apps/dhcb/src/pages/core/StartByIntent.tsx`             | Lớp 6–9 chỉ khi có Toán, lọc lớp không hợp lệ trước khi lưu |
| Sửa  | `apps/dhcb/src/lib/intent/buildIntentOutlines.ts`        | `lopChoMon` cho từng môn                                    |
| Sửa  | `apps/dhcb/src/lib/subjectProgressBoard.ts`              | `lopChoMon`, href `?lop=` khi khác lớp mặc định             |
| Thêm | `postgres/migrations/0092_learner_intent_grade_thcs.sql` | Nới CHECK, lũy đẳng thật                                    |

## ③ Hợp đồng dữ liệu

```ts
IntentGradeSchema = z.enum(['6', '7', '8', '9', '10', '11', '12'])
isGradeAllowedFor(subjectIds, grade) // có môn STEM; lớp 6–9 còn cần 'mathematics'
lopChoMon(subject, lop?) // lop nếu subject.grades có lop, ngược lại subject.defaultGrade
duongDanDanhSachBai('mathematics', '9') // '/goc-hoc-tap/mathematics/bai-hoc?lop=9'
```

| Tình huống                                      | Hành vi mong đợi                                     |
| ----------------------------------------------- | ---------------------------------------------------- |
| Chọn Toán + Vật lí, lớp 8                       | Toán dựng cây lớp 8, Vật lí dựng cây lớp 10          |
| Chỉ chọn Vật lí                                 | Câu hỏi lớp chỉ có Lớp 10, 11, 12                    |
| Đã khai "Toán, lớp 8" rồi đổi ý, bỏ Toán        | Lớp cũ bị bỏ, coi như chưa khai (không lỗi hợp đồng) |
| `/goc-hoc-tap/physics/bai-hoc?lop=8`            | Tab Lớp 10 (Vật lí không có lớp 8)                   |
| PUT `/api/learner-intent` với `physics` + `'9'` | 400                                                  |

## ④ Tiêu chí chấp nhận

- [ ] Thanh điều hướng mục Toán: Lớp 6, 7, 8, 9, 10, 11, 12, Đại học, đúng thứ tự đó. Mỗi mục 6–9
      có `to` là `?lop=` và lớp đó có bài thật (test đối chiếu chỉ mục).
- [ ] Đứng ở `/goc-hoc-tap/mathematics/bai-hoc?lop=9` thì chỉ mục "Lớp 9" sáng.
- [ ] `?lop=9` mở sẵn tab Lớp 9. Bấm tab Lớp 7 thì URL thành `?lop=7`.
- [ ] `/bat-dau`: có Toán thì hiện 7 lớp, không có Toán thì hiện 3 lớp. Lưu được `grade: '8'`.
- [ ] Hợp đồng nhận 6–9 kèm Toán, từ chối 6–9 không kèm Toán, từ chối '5', '13', '06'.
- [ ] Migration chạy trên Postgres 16 sạch. Chạy lại thì OID ràng buộc không đổi.
- [ ] Ảnh tầng 8b (1440 + 390): thanh điều hướng mở mục Toán, danh sách bài `?lop=9`, bước lớp ở
      `/bat-dau`.

## ⑤ Bất biến không được phá

- Ý định cũ (`'10'…'12'`) vẫn đọc và ghi được như trước.
- Người chưa khai lớp vẫn vào lớp mặc định (10) ở mọi môn.
- Thanh điều hướng không nạp chỉ mục bài vào gói khởi động. `navTree.ts` chỉ import
  `stemLessonPaths.ts`.

## ⑥ Rủi ro và rollback

- Thứ tự deploy: chạy migration TRƯỚC mã mới. `scripts/deploy.sh` đã tự chạy `migrate:pg` trước
  khi khởi động lại. Nếu mã mới chạy trước migration thì ghi lớp 6–9 sẽ lỗi 500 cho tới khi
  migration chạy.
- Rollback: revert PR rồi chạy khối rollback ở đầu file `0092`. Khối này đưa lớp 6–9 về `null` rồi
  đặt lại CHECK cũ.
