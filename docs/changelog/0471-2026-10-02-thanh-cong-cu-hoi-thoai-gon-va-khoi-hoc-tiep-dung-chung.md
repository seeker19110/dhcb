# 0471 — Đồng nhất đợt 3: thanh công cụ bài hội thoại mobile gọn một hàng + khối "Học tiếp" dùng chung (2026-10-02)

- **Ngày:** 2026-10-02 · **PR:** [#1205](https://github.com/seeker19110/dhcb/pull/1205) · **Loại:** `refactor(ui)`.
- **Nối tiếp:** audit đồng nhất bố cục 2026-10-01 (`docs/audit/2026-10-01-audit-dong-nhat-bo-cuc-trai-nghiem-hoc.md`)
  §4 mục 2 (khối "Học tiếp", vấn đề #9) và mục 5 (thanh công cụ mobile). Chủ dự án giao
  "chọn theo đề xuất tốt nhất rồi tiếp tục".

## Vì sao

1. **Thanh công cụ bài hội thoại ở điện thoại cao 167px**, tức khoảng 20% màn 844px, và đứng yên
   suốt buổi học. Nó có 7 cụm điều khiển tràn ra 3 hàng, nằm trong một khung kính lồng trong
   thanh. Trong đó có nút "← Danh sách", trùng việc với nút Back của header (hai nút quay lại,
   hai đích khác nhau).
2. **Khối "Học tiếp" mỗi trang một kiểu.**
   - Trang môn Tiếng Anh: tên bài màu xanh lá, cắt cụt một dòng, nút nằm bên phải.
   - Trang môn Lập trình: nút giãn hết dòng ở mọi bề rộng, dài 1.100px trên màn 1440px.
   - Dòng gợi ý "Tiếp tục" ở đầu danh sách (Hội thoại · Câu thông dụng · Luyện nghe) là **ba bản
     chép tay giống hệt nhau**. Cả ba còn lồng `<div>`/`<p>` trong `<button>`, sai HTML.

## Việc đã làm

### A. Thanh công cụ bài hội thoại (mobile)

- Hàng chính chỉ còn **việc học chính**: Trong bài · Phát tất cả · Đóng vai · nút **Tuỳ chọn
  nghe** (biểu tượng thanh trượt).
- Tốc độ, chế độ nghe EN/EN+VI/VI và Cài đặt giọng gom vào bảng "Tuỳ chọn nghe", chỉ mở khi cần.
  Nút mở bảng có `aria-expanded`; `aria-controls` chỉ gắn khi bảng đang hiện.
- Bỏ khung kính lồng trong thanh (luật "không lồng thẻ trong thẻ", skill ui-ux §9.A.4) và bỏ vạch
  ngăn ở mobile.
- **Nút "← Danh sách" bỏ khỏi thanh.** Nút Back của header nay lùi đúng một bước về danh sách bài
  (`Layout onBack`). Nhãn của nút là "Danh sách bài hội thoại", truyền qua `crumbs` để nút nói
  đúng nơi nó đưa về. Trước đây nút này đưa thẳng về trang môn.
- Màn hẹp hơn 390px: nút "Trong bài" chỉ còn biểu tượng. Chữ vẫn là tên nút cho trình đọc màn
  hình (`sr-only`), vùng chạm vẫn đủ 44px.
- Số lượt "3/12" chỉ hiện ở mobile khi đóng vai. Lúc nghe, bong bóng đang phát đã sáng lên rồi.
- **Desktop giữ nguyên:** mọi điều khiển vẫn hiện thẳng trên thanh.
- Sửa kèm ba lỗi chạm/tên nút có sẵn:
  - nút "Đóng vai" / "Dừng đóng vai" cao 24px → `tap-44-y` (44px);
  - nút dừng hẳn (chỉ có biểu tượng ■) **không có tên** → `aria-label` "Dừng hẳn" / "Stop";
  - các nút chế độ nghe và Cài đặt giọng cao 44px trên màn cảm ứng (`tap-44-coarse-y`), với chuột
    giữ cỡ gọn như cũ.

### B. Khối "Học tiếp" dùng chung

`apps/dhcb/src/components/learning/ContinueCard.tsx` xuất hai component:

- **`ContinueCard`** — khối chính của trang môn: nhãn nhỏ → tên bài là tiêu đề → MỘT nút chính
  chuẩn (`buttonClass primary lg`).
  - Điện thoại: nút giãn hết dòng. Từ 640px: nút nằm bên phải tên bài.
  - Kiểu `card` dùng cho trang Lập trình (thẻ đứng riêng).
  - Kiểu `inset` dùng cho trang Tiếng Anh: nằm trong thẻ đầu trang, chỉ có vạch ngăn, không lồng
    thêm thẻ.
- **`ContinueRow`** — dòng gợi ý "Tiếp tục" ở đầu danh sách. Thay ba bản chép tay. Bên trong nút
  chỉ còn phần tử dạng dòng nên HTML hợp lệ.

Đổi chữ/màu theo khuôn chung:

- Trang Tiếng Anh: nút "Tiếp tục học ngay" → "**Học tiếp**", giống trang Lập trình.
- Nhãn nhỏ: "Bài học tiếp theo theo lộ trình:" → "Bài tiếp theo theo lộ trình".
- Tên bài: xanh lá → chữ nội dung thường, vì CLAUDE.md §4.8 dành xanh lá cho nghĩa "đúng".

## Không làm (để đợt sau)

- **Khối "Học tiếp" cho bốn môn STEM.** Trang môn STEM chỉ có lối "Vào học {môn}", chưa có khái
  niệm "bài kế tiếp". Muốn có cần thêm hai thứ:
  - một hàm thuần "lá kế tiếp chưa xong" trên cây mục lục (`outlineNav`);
  - một quyết định nên lấy lớp nào làm mặc định, vì trang môn dùng `grade_10` còn kho bài dùng `10`.

  Phần này là logic mới, không phải gom mã, nên tách riêng.

- **Tên mục điều hướng "Bài học hôm nay"** đang trỏ tới danh sách "Các bài hội thoại mẫu thông
  dụng". Hai tên cho cùng một trang. Việc này thuộc đợt câu chữ (cùng nhóm "Vật lý"/"Vật lí").

## Kiểm chứng

- **Đo thanh công cụ** bằng Chromium, bài 1, theme Blue sky:

  | Bề rộng | Trạng thái    | Trước                      | Sau                               |
  | ------- | ------------- | -------------------------- | --------------------------------- |
  | 390px   | chờ           | 167px (3 hàng), h1 ở 240px | **57px (1 hàng)**, h1 ở **130px** |
  | 375px   | chờ           | —                          | 57px (1 hàng)                     |
  | 360px   | chờ           | —                          | 57px (1 hàng)                     |
  | 320px   | chờ           | —                          | 57px (1 hàng)                     |
  | 390px   | đang phát     | —                          | 57px (1 hàng)                     |
  | 360px   | đang phát     | —                          | 57px (1 hàng)                     |
  | 1440px  | chờ (desktop) | 1 hàng                     | 1 hàng, không đổi bố cục          |

- **Ảnh Tầng 8b** (scratchpad, không vào repo), 390px + 1440px, trước và sau:
  - bài hội thoại: thanh đóng, bảng mở, bảng mở có giả lập cảm ứng, đang phát, desktop;
  - trang môn Tiếng Anh, trang môn Lập trình;
  - danh sách Hội thoại · Câu thông dụng · Luyện nghe. Ảnh trước/sau của danh sách **giống hệt
    từng byte**: gom về `ContinueRow` không đổi một điểm ảnh nào.
- Test mới:
  - `ContinueCard.test.tsx` (5 test): cấu trúc, nút chuẩn, `inset` không dựng thẻ, trạng thái
    đang tải, HTML hợp lệ của `ContinueRow`.
  - `Lessons.s09c.test.tsx` thêm ca thanh công cụ mobile/desktop. Layout giả nay dựng nút Back từ
    `onBack` + `crumbs`, nên ca "Danh sách" cũ chạy qua đúng nút header.
- **Cổng ở máy:**
  - `npm run typecheck` (chạy lại sau khi xoá `dist`), `npm run lint` (0 cảnh báo), Prettier, `check:ui-ux`, `check:docs`: đều xanh.
  - `npm run test:coverage`: 780 file, 18.318 test. Coverage 95,06 / 90,93 / 95,61 / 95,69, trên sàn 93/89/93/93.
  - `npm run build`: xanh. `npm run size`: JS 152,71/160 kB, CSS 23,77/26 kB.
- **E2E:**
  - `english-lesson-deep-link` 25/25. Ca a11y AA 390px × 3 theme nay quét cả bảng "Tuỳ chọn nghe". Ca "đích không bị thanh che" đo cả thanh qua `data-testid="thanh-dieu-khien-bai"`, thay cho khung `div.glass` mà mobile đã bỏ.
  - Quét `a11y` (AA) + `a11y-aaa` cho các trang bị đổi, × 3 theme: 33/33. Gồm: trang môn Tiếng Anh, trang môn Lập trình, bài hội thoại, Câu thông dụng, Luyện nghe, banner quay lại / gợi ý luyện nói ở trang môn Tiếng Anh.
  - `s07-matrix` + `outline-english` + `today-plan`: 90/90.
  - `programming-home`, `english-subject-home`, `comeback`, `continue-viewing`, `header-back-touch-target`, `lesson-list-visibility`, `mobile-layout-guards`: xanh.
