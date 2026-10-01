# 0467 — Audit đồng nhất bố cục + sửa khung bài học: nút Back đúng đích, thanh bên 1024px, Bài sau cho hội thoại, lý thuyết STEM có tiêu đề (2026-10-01)

- **Ngày:** 2026-10-01 · **PR:** [#1200](https://github.com/seeker19110/dhcb/pull/1200) · **Loại:** `refactor(ui)` — sửa bố cục/điều hướng
  theo audit trong phiên, không có đặc tả trước.
- **Báo cáo audit:** [`docs/audit/2026-10-01-audit-dong-nhat-bo-cuc-trai-nghiem-hoc.md`](../audit/2026-10-01-audit-dong-nhat-bo-cuc-trai-nghiem-hoc.md)
  — nối tiếp audit 09-30 (0466), đi sâu vào câu hỏi "các môn có cùng một khung học không".
- **Yêu cầu của người dùng:** "audit layout, uiux… mang đến tính đồng nhất và trải nghiệm học tập
  cao nhất".

## Việc đã làm

**Audit (đo + nhìn ảnh, Tầng 8b):** 19 route học × 4 bề rộng (390/1024/1280/1440), 76 ảnh trước +
ảnh sau, đo trong trình duyệt bề rộng `<main>`/cột bài, cỡ `h1`, độ dài dòng, nút chính. Kết quả:
0 critical · 6 major · 4 minor.

**Sửa (5 major + 2 minor, không cần quyết định sản phẩm):**

1. **Nút Back ở header: đích = đúng đốt đang làm nhãn.** `lib/breadcrumb.ts` thêm
   `defaultBackDestination`; `components/Layout.tsx` dùng nó khi trang không truyền
   `onBack`/`backTo`. Trước đây đích mặc định `'/'` cứng → 21/77 lời gọi `<Layout>` có nhãn "← Vật
   lý"/"← Tiến độ"/"← Hồ sơ" mà bấm về Trang chủ.
2. **Thanh bên thu gọn mặc định ở 1024–1279px** (`components/DesktopSidebar.tsx`). Mở rộng ở dải này
   là tạm (nhớ theo đường dẫn, không ghi `localStorage`, đổi trang tự thu lại). ≥1280px không đổi.
   Cột bài ở 1024px: 424 → 606–608px.
3. **Chế độ tập trung đồng nhất:** bài hội thoại mobile bật `focus` + có `<main id="noi-dung-chinh">`
   (`pages/subjects/english/Lessons.tsx`); `index.css` đặt `--bnav-h`/`--bnav-only-h` = 0 khi
   `html[data-focus='1']` (hết dải trống ~128px cuối trang tập trung).
4. **"Bài trước / Bài sau" cho bài hội thoại** — dùng lại `OutlinePrevNext` qua cây phẳng
   `cayBaiHoiThoai` (`lib/englishLessonAnchors.ts`); link kèm `#dau-bai`. `OutlinePrevNext` thêm prop
   `labels` (nhãn tiếng Anh cho chiều B). `LessonView` thêm khe `footer` nằm trong vùng cuộn.
5. **Lý thuyết STEM có cấu trúc:** `lib/stemTheory.ts` (hàm thuần) + `components/StemTheory.tsx` —
   dòng "TIÊU ĐỀ:" thành `<h3>`, tách đoạn, `v_tb` → v<sub>tb</sub>. Giữ nguyên chữ người soạn
   (không tự đổi hoa → thường; lý do ở báo cáo §2 #5).
6. **Tiêu đề bài hội thoại** cùng thang chữ bài STEM (`text-2xl sm:text-3xl font-extrabold`).
7. **Bài STEM + danh sách bài STEM** truyền `crumbs` cho header: Back ghi "← Bài học môn Vật lí" và
   về danh sách; danh sách ghi "← Vật lý" và về trang môn. Liên kết lùi trong nội dung bài chỉ còn ở
   mobile (desktop đã có ở header — hết hai lối lùi trùng).

## Quyết định

- **Không đổi chữ hoa trong lý thuyết STEM ở tầng giao diện.** Thử nghiệm quét 573 tiêu đề cho
  thấy đổi tự động sẽ sai Newton/Le Chatelier/ADN/CAM/"Y học". Việc đó thuộc dữ liệu nguồn, có
  người duyệt — đề xuất ở báo cáo §4.3.
- **Không đổi màu nút chính các trang môn** (Tiếng Anh xanh lá vs Lập trình xanh trời) — cần chủ dự
  án xác nhận xanh lá có chủ ý không (báo cáo #9).
- Dải hẹp chọn **1279px** (dưới mốc `xl` 1280 của Tailwind) để khớp đúng điểm gãy đo được ở audit
  09-30 (M18) và giữ nguyên trải nghiệm ở laptop 1280/1366/1440px.

## Kiểm chứng

- **Test mới:** `lib/stemTheory.test.ts` (10 ca, chạy trên **toàn bộ** bài Toán/Lý/Hoá/Sinh thật:
  không mất ký tự, sàn số tiêu đề mỗi môn, ghép chỉ số dưới đúng nguyên văn) ·
  `lib/breadcrumb.test.ts` (+4 ca nhãn = đích) · `lib/englishLessonAnchors.test.ts` (+4 ca cây
  phẳng) · `components/DesktopSidebar.test.tsx` (+3 ca dải hẹp; các ca cũ cố định bề rộng 1440px
  vì happy-dom mặc định rộng 1024px).
- **Kiểm hành vi bằng Chromium (script ngoài repo), 24/24 PASS:** bài hội thoại desktop có "Bài
  sau", bấm sang bài 2, tiêu đề trong khung nhìn (top 160px) và nhận focus, bài 2 có "Bài trước";
  mobile ẩn thanh đáy, có `<main>`, hở đáy 0px, "Bài sau" cuộn tới được; bài Vật lí Back ghi + về
  đúng danh sách, danh sách Back về trang môn, lý thuyết có `<h3>` và `<sub>`, desktop hết link lùi
  trùng; Lịch sử học Back về `/tien-do`; thanh bên 1024px mặc định 72px, mở được 256px, không ghi
  `localStorage`, chọn trang tự thu, cột nội dung 952px; 1440px vẫn 256px.
- Cổng trước commit: xem báo cáo xác thực trong mô tả PR.
