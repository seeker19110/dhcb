# 0596 — Toán THCS 6–9 trên thanh điều hướng và ở màn "Bắt đầu"

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `feat(stem)`
- **Đặc tả:** `docs/specs/2026-10-10-menu-lop-thcs-va-bat-dau-6-9.md` (Approved for implementation —
  chủ dự án chọn "Trỏ tới danh sách bài" + "Thêm 6–9 khi có Toán").
- **Nối tiếp:** changelog `0594` (đủ 4 lớp THCS).

## Vấn đề

Bài Toán lớp 6–9 đã có đủ, nhưng thanh điều hướng chỉ có "Lớp 10 / 11 / 12 / Đại học". Màn
`/bat-dau` cũng chỉ hỏi lớp 10–12, nên học sinh THCS bị xếp vào lớp 10. Ngoài ra trang danh sách bài
không đọc lớp từ URL, nên link sâu tới đúng lớp không có cách nào hoạt động.

## Đã làm

- **Thanh điều hướng (`navTree.ts`):** mục Toán có thêm Lớp 6–9, đứng trước Lớp 10. Bốn mục mới trỏ
  `/goc-hoc-tap/mathematics/bai-hoc?lop=<n>`.
  - `NavChild.query` mới: mục lớp chỉ sáng khi đúng tham số lớp trên URL. Trước đây đứng ở trang
    danh sách bài thì cả 4 mục lớp cùng mang `aria-current="page"`; ảnh "trước" ghi lại đúng điều
    này.
  - Đường dẫn dựng qua module nhẹ mới `stemLessonPaths.ts`, để thanh điều hướng không kéo chỉ mục
    bài vào gói khởi động.
- **Danh sách bài (`StemLessonList.tsx`):** lớp đang xem lấy từ `?lop=`. Lớp lạ thì dùng lớp mặc
  định. Bấm tab thì ghi lại URL bằng `replace`.
- **Trang bài (`StemLessonView.tsx`):** "Về danh sách" mở đúng tab lớp của bài đang học.
- **Hợp đồng (`learnerIntent.ts`):** `IntentGradeSchema` thêm '6'–'9' (chỉ bổ sung). Thêm
  `isGradeAllowedFor` dùng chung cho Zod và giao diện: lớp 6–9 chỉ đi cùng Toán.
- **`/bat-dau`:** chỉ hiện Lớp 6–9 khi có Toán. Lớp không còn hợp lệ, ví dụ khi bỏ Toán, bị lọc trước
  khi lưu.
- **Lớp chung → lớp từng môn (`lopChoMon`):** áp cho cây gợi ý (`buildIntentOutlines.ts`) và thẻ tiến
  độ (`subjectProgressBoard.ts`). Ví dụ "Toán + Vật lí, lớp 8" dựng Toán lớp 8, Vật lí lớp 10.
- **Migration `0092`:** nới CHECK `learner_intent_grade_check` thành '6'…'12'. Lũy đẳng thật.
- **Lỗi bắt được nhờ ảnh Tầng 8b:** nút Back trên header trang danh sách bài ghi "← Lớp 6".
  `breadcrumb.ts` dựng nút cho mọi mục con có đường dẫn khác cha, nên mục "Lớp 6" chiếm tên của trang
  `/bai-hoc`. Cách sửa: mục có `query` chỉ là một tab, không dựng nút breadcrumb. Có test chặn; đã
  kiểm test đỏ khi bỏ phần sửa.

## Quyết định

- Danh sách lớp THCS trên thanh điều hướng ghi cứng (`LOP_THCS_TOAN`). Có test đối chiếu với chỉ
  mục bài thật, để không bao giờ trỏ tới lớp chưa có bài.
- Luật "6–9 chỉ đi cùng Toán" đặt ở Zod, không ở DB.

## Bằng chứng

- **Migration:** chạy trên Postgres 16 sạch (95 migration).
  - Chạy lại `0092` thì OID ràng buộc giữ nguyên (18634).
  - `grade='9'` ghi được; `grade='5'` bị CHECK từ chối.
- **Test mới:**
  - Hợp đồng: 3 ca.
  - Server PUT: lớp 9 kèm Toán → 200; Vật lí + lớp 9 → 400; lớp '5' → 400.
  - `navTree`: thứ tự, link, đối chiếu chỉ mục, chỉ một mục sáng.
  - `StemLessonList`: `?lop=9`, lớp lạ, bấm tab ghi URL.
  - `StartByIntent`: 7 lớp khi có Toán, 3 lớp khi không có.
  - `buildIntentOutlines`: lớp theo từng môn.
  - `subjectProgressBoard`: href `?lop=8`.
  - `breadcrumb`: tên trang danh sách bài.
- **Tầng 8b (1440 + 390), trước → sau:**
  - Danh sách bài `?lop=9`: tab Lớp 10 → tab Lớp 9.
  - `aria-current`: Lớp 10/11/12/Đại học → chỉ Lớp 9.
  - `/bat-dau` (chọn Toán): 3 lớp → 7 lớp.
  - Không cuộn ngang, không lỗi console.
