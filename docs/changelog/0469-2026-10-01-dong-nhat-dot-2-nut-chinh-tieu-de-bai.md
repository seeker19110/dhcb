# 0469 — Đồng nhất đợt 2: một màu nút chính cho mọi môn, tiêu đề bài Lập trình hiện trong nội dung, nhãn gói thật ở thanh bên, khổ đọc trang Lập trình (2026-10-01)

- **Ngày:** 2026-10-01 · **PR:** [#1202](https://github.com/seeker19110/dhcb/pull/1202) · **Loại:** `refactor(ui)`.
- **Nối tiếp:** audit đồng nhất bố cục [`docs/audit/2026-10-01-audit-dong-nhat-bo-cuc-trai-nghiem-hoc.md`](../audit/2026-10-01-audit-dong-nhat-bo-cuc-trai-nghiem-hoc.md)
  §4 (đợt 0467, PR #1200).
- **Quyết định sản phẩm:** chủ dự án giao "chọn theo đề xuất tốt nhất rồi tiếp tục" (2026-10-01).
  Ba quyết định đã chốt theo đề xuất trong báo cáo:
  1. **Nút chính mọi trang môn dùng màu thương hiệu (accent)** qua `buttonClass`. Xanh lá dành
     cho nghĩa "đúng" (CLAUDE.md §4.8), không làm màu riêng của một môn.
  2. **Nhãn gói ở chân thanh bên đọc gói thật của phiên**, không ghi cứng.
  3. **Viết hoa đầu câu cho 573 tiêu đề lý thuyết STEM làm trong dữ liệu nguồn, ở PR riêng**
     (diff nội dung tách khỏi diff giao diện để duyệt được).

## Việc đã làm

1. **Tiêu đề bài Lập trình hiện trong nội dung** (`ProgrammingLessonPage.tsx`).
   - `<h1>` cùng thang chữ bài STEM/hội thoại (`text-2xl sm:text-3xl font-extrabold`).
   - Header thôi nhắc lại tên bài: trước đây chỉ ghi ở đó, cỡ 15px, bị cắt ở 390/1024px. Lý do
     cũ để ẩn `<h1>` là "tránh lặp chữ với header"; nay header không còn tên bài nên không lặp.
2. **Một nút chính cho mọi môn.**
   - Hub Môn học: "Vào môn Tiếng Anh" trước đây xanh lá, các môn khác màu accent; nay cả hai
     cùng `buttonClass({ variant: 'primary', size: 'lg', fullWidth: true })`.
   - Hub Môn học: chip lọc đang chọn trước đây mỗi nhóm một màu (accent/xanh lá/xanh dương),
     nay chung một màu.
   - Trang Tiếng Anh: "Tiếp tục học ngay" trước đây xanh lá, nay là nút chính chuẩn.
   - Trang Lập trình: "Bắt đầu bài này"/"Học tiếp" trước đây là nút tự ghép lớp với `text-black`,
     nay là nút chính chuẩn.
   - Viết hoa đúng chuẩn tiếng Việt: "Gia Sư Tiếng Anh Song Ngữ" → "Gia sư tiếng Anh song ngữ".
3. **Nhãn gói ở chân thanh bên** (`DesktopSidebar.tsx`, audit 09-30 M8).
   - VIP: "Gói VIP" (thu gọn: "VIP").
   - Free: "Free · Nâng cấp" (thu gọn: "Nâng cấp").
   - Trước đây mọi người đều thấy "Free · Nâng cấp", kể cả người dùng VIP vĩnh viễn. Ở chế độ
     thu gọn thì ngược lại, mọi người đều thấy "VIP", kể cả người dùng Free.
4. **Khổ đọc 60ch (`read-measure`)** cho đoạn văn và danh sách văn xuôi ở 5 file: trang chủ
   Lập trình, trang hướng chuyên sâu, danh sách hướng, giới thiệu môn, `LevelMilestones`.
   Trước đây (đo ở 1440px) dòng dài 151–181 ký tự.

## Kiểm chứng

- **Đo lại độ dài dòng sau khi sửa** (Chromium, 1440px): 0 đoạn văn xuôi vượt 85 ký tự/dòng ở
  trang chủ Lập trình, hướng Web và danh sách hướng. Phần còn trong danh sách đo chỉ là thẻ bao
  (chứa tiêu đề và danh sách con), không phải dòng chữ.
- **Màu nút "Vào môn" đo trong trình duyệt:** Tiếng Anh và Vật lí cùng `rgb(14, 165, 233)`
  (accent của Blue sky). Trước đây Tiếng Anh là xanh lá.
- **Test mới:** `DesktopSidebar.test.tsx` thêm 2 ca nhãn gói (Free/VIP × mở rộng/thu gọn).
- **Hai test cũ được chỉnh, đều KHÔNG nới cổng:**
  - `UiNoise.design.test.ts`: allowlist "bóng phát sáng màu" **giảm** 3 chỗ — chip lọc ở
    `Subjects.tsx` không còn bóng màu nào (siết theo skill `ui-ux` §9.B.5). Cổng đòi khớp đúng
    số nên phải sửa allowlist khi gỡ.
  - `e2e/header-back-touch-target.spec.ts`: ý định "ở 320/390px người học vẫn thấy tên trang,
    nút Back 44px không đẩy mất nó" giữ nguyên. Với bài Lập trình, phép kiểm đổi từ "`header p`
    hiện" sang "`<h1>` tên bài hiện và nằm trong khung nhìn", vì tên bài đã chuyển xuống nội
    dung. Route CEFR vẫn kiểm header như cũ.
- **Ảnh trước/sau** (Tầng 8b, scratchpad phiên, không vào repo): bài Lập trình 390/1440, trang
  Tiếng Anh, hub Môn học, trang chủ Lập trình, hướng Web.
- **Cổng:** xem báo cáo xác thực trong mô tả PR.
