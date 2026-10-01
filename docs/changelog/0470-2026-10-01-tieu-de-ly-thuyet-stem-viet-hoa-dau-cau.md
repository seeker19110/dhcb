# 0470 — Tiêu đề lý thuyết STEM: 575 dòng VIẾT HOA → viết hoa đầu câu + dấu `## ` rõ ràng (2026-10-01)

- **Ngày:** 2026-10-01 · **PR:** [#1203](https://github.com/seeker19110/dhcb/pull/1203) · **Loại:** `refactor(content)`. Đây là đợt nội
  dung, tách khỏi đợt giao diện 0469 để diff nội dung đọc riêng được.
- **Nối tiếp:** audit đồng nhất bố cục 2026-10-01 §4.3 (đợt 0467) + audit 09-30 M15. Chủ dự án
  giao "chọn theo đề xuất tốt nhất" (2026-10-01).

## Vì sao

Đợt 0467 dựng tiêu đề mục `<h3>` bằng cách **đoán** "dòng toàn chữ HOA, kết thúc bằng hai chấm".
Cách đoán đó buộc dữ liệu phải viết HOA toàn bộ dòng, gây ba hệ quả:

- khó đọc;
- mất phân biệt hoa/thường: `t` (thời điểm) với `T` (chu kì); "Newton" với "newton";
- chưa đúng chuẩn chính tả tiếng Việt, vốn chỉ viết hoa chữ đầu câu và tên riêng.

Không thể để giao diện tự đổi hoa → thường vì máy sẽ sai tên riêng. Vì vậy sửa thẳng **dữ liệu
nguồn** và đổi sang **dấu tiêu đề rõ ràng** `## ` do người soạn đặt.

## Việc đã làm

1. **Dữ liệu (46 file, 238 bài, 575 dòng)** ở `packages/subject-{physics,chemistry,biology}/lessons/`.
   - Ví dụ: `'ĐỊNH NGHĨA SỰ RƠI TỰ DO:\n'` → `'## Định nghĩa sự rơi tự do\n'`.
   - Môn Toán không có tiêu đề kiểu này nên không đổi.
2. **Luật chuyển đổi** (script một lần, chạy ngoài repo; bảng đối chiếu cũ → mới đã được đọc
   hết cả 575 dòng):
   - Chữ thường cho mọi từ, rồi viết hoa chữ cái đầu dòng.
   - **Giữ nguyên tên riêng** (viết hoa chữ đầu): Newton, Coulomb, Ohm, Lorentz, Hooke,
     Archimedes, Boyle, Charles, Clapeyron, Mendeleev, Celsius, Kelvin, Joule, Lenz,
     Le Chatelier, Brønsted, Lowry, Faraday, Henderson, Hasselbalch, Mendel, Hardy, Weinberg,
     Darwin, Lac (operon Lac).
   - **Giữ nguyên viết tắt:** ADN, ARN, NST, IUPAC, EMF, MRI, IR, MS, OH, CAM, số La Mã II/III/IV.
   - **Giữ nguyên công thức và ký hiệu** (từ có chữ số, chỉ số, `°`, `⁺`/`⁻`): CO₂, C₆H₁₂O₆, E°, SN1.
   - **Chữ cái đơn A–Z giữ hoa** (biến số, số La Mã I): "điện trở R", "điện tích điểm Q",
     "giảm phân I", "ghép chữ T". Có ba ngoại lệ:
     - chữ sau dấu nháy (`Coulomb's`) thì viết thường;
     - "Y HỌC" → "y học";
     - "TẠI THỜI ĐIỂM T" → "tại thời điểm **t**". Thân bài viết "Thay thời điểm t vào phương
       trình"; tiêu đề viết hoa toàn dòng đã xoá mất thông tin này.
   - Chữ đơn **có dấu** là từ tiếng Việt nên viết thường ("Ở vi khuẩn" → "ở vi khuẩn").
   - Ngoặc đơn: phần toàn HOA đổi theo cùng luật ("(INERTIA)" → "(inertia)"); phần đã có chữ
     thường giữ nguyên như người soạn viết ("(Speciation)", "(delta E)").
3. **Bộ dựng lý thuyết** (`apps/dhcb/src/lib/stemTheory.ts`): tiêu đề mục = dòng mở đầu bằng
   `## `. Bỏ hẳn luật đoán theo chữ hoa.
4. **Cổng mới** (`stemTheory.test.ts`): dữ liệu thật **không được còn dòng tiêu đề viết HOA kiểu
   cũ**. Thêm mục mới thì viết `## Tiêu đề viết hoa đầu câu`.

## Kiểm chứng

- **So từng bài trước/sau** (nạp lại toàn bộ 318 bài từ mã nguồn):
  - 238 bài đổi lý thuyết, đúng bằng số dự kiến.
  - Lý thuyết mới của từng bài khớp **từng ký tự** với kết quả dự kiến.
  - **0 trường nào khác** (ví dụ mẫu, câu hỏi, thẻ ôn, hoạt ảnh…) bị đổi. **0 lỗi.**
- **Mã băm duyệt nội dung** (`lessonReviewHash`) đổi theo lý thuyết, nhưng không mất lượt duyệt
  nào: cả 318 bài đều đang là `draft`, chưa bài nào được chuyên gia duyệt.
- `audit:prose`: 0 lỗi; cảnh báo 1.183 → 1.182 (không thêm cảnh báo mới, không cảnh báo nào nhắc
  dòng `##`). `audit:lessons`: đạt.
- Test gói `subject-*` + `core-contracts`: 86 file, 580 test đạt. Test trang học + `stemTheory`:
  137 test đạt. Test máy chủ duyệt STEM (`admin-stem-review.test.ts`): 15 test đạt.
- **Ảnh Tầng 8b** (scratchpad, không vào repo): bài "Sự rơi tự do" và "Nhân đôi ADN" ở 1440px.
  Tiêu đề hiện "Định nghĩa sự rơi tự do", "Quá trình nhân đôi ADN (Tái bản)".
