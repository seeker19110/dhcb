# Audit đồng nhất bố cục và trải nghiệm học — 2026-10-01

> Lượt rà **nối tiếp** audit UI/UX chuẩn 2026 hôm trước
> ([`2026-09-30-audit-ui-ux-chuan-2026.md`](2026-09-30-audit-ui-ux-chuan-2026.md), gọi tắt
> "audit 09-30"). Audit 09-30 đo rộng: 61 route, WCAG 2.2, EN 301 549. Lượt này đi **hẹp và sâu**
> vào một câu hỏi: _người học đi qua các môn có thấy cùng một khung học không, và khung đó có
> giúp học không?_ Phần trùng với audit 09-30 chỉ dẫn số hiệu (M15, M18…), không đo lại.
>
> Khác audit 09-30 ở chỗ: **đợt này sửa luôn** những lỗi không cần chủ dự án quyết, cùng một PR,
> có ảnh và phép đo trước/sau (Tầng 8b). Ảnh và script nằm ở scratchpad phiên, không vào repo
> (giữ kỷ luật 0 file PNG).

## 0. Tóm tắt

**Kết luận:** ba môn chính (Tiếng Anh, Lập trình, bốn môn STEM) đã dùng chung hạ tầng
(`PageShell`, `TwoPane`, `OutlinePane`, `OutlinePrevNext`), nhưng **khung bài học vẫn lệch nhau
ở những chỗ người học chạm vào nhiều nhất**: nút quay lại, tiêu đề bài, đường sang bài kế, chế độ
tập trung và bề rộng cột chữ ở laptop. Một lỗi mang tính hệ thống: **nút "← Quay lại" ở header
ghi tên trang cha nhưng bấm lại về Trang chủ** trên mọi trang không tự truyền đích.

Đếm: **0 critical · 6 major · 4 minor** (khuôn 4 ô của skill `ui-ux` §10.B).
**Đã sửa trong đợt: 5 major + 2 minor.** Còn lại có đề xuất ở mục 4.

## 1. Cách làm

- `npm run dev` + giả lập đăng nhập đúng khuôn `e2e/helpers/auth.ts` (không có backend thật).
- **19 route × 4 bề rộng** (390 · 1024 · 1280 · 1440), theme mặc định Blue sky, giảm chuyển động:
  trang chủ, hub Môn học, trang tổng quan 4 môn, danh sách bài, **trang bài của cả ba loại**
  (hội thoại tiếng Anh, bài Lập trình, bài Vật lí), Luyện tập, Ôn tập, Tiến độ.
- Mỗi tổ hợp đo trong trình duyệt: số `<main>`, vị trí/bề rộng `<main>`, chiều cao trang, tràn
  ngang, cỡ chữ `h1`, độ dài dòng đoạn văn (ký tự/dòng), màu nền các nút chính. Chụp 76 ảnh trước
  khi sửa, chụp lại sau khi sửa và **nhìn từng cặp**.
- Kiểm hành vi sau khi sửa bằng script Playwright riêng (bấm thật, đo thật): **24/24 phép kiểm đạt**
  (mục 3).

**Giới hạn:** dữ liệu giả lập là của người mới; trang tổng quan môn STEM (`/goc-hoc-tap/physics`)
rơi vào màn "Không tải được dữ liệu" vì mock không có API môn — không chấm được trang đó.

## 2. Phát hiện

### Major

1. **Nhãn nút Back và đích bấm lệch nhau (hệ thống).**
   - **Lỗi:** skill `ui-ux` §11.G (điều hướng giữ ngữ cảnh) · Nielsen "nhất quán & chuẩn mực".
   - **Ở đâu:** `apps/dhcb/src/components/Layout.tsx` — nhãn lấy từ `buildCrumbs` (đốt cha) nhưng
     đích mặc định là `'/'` cứng. Đếm bằng máy: **21/77** lời gọi `<Layout>` không truyền
     `onBack`/`backTo`. Trong đó lệch thật: bài STEM ("← Góc học tập" → về Trang chủ), danh sách
     bài STEM, Tiếng Anh home, Ôn tập hôm nay, Lịch sử học ("← Tiến độ"), Nhiệm vụ, Bạn bè và Tin
     nhắn ("← Hồ sơ"), Action Canvas ("← Bạn Đồng Hành").
   - **Mức:** major — người học bấm "← Bài học môn Vật lí" mà rơi về Trang chủ là mất chỗ đang học.
   - **Sửa:** ✅ đích mặc định = đúng đốt đang làm nhãn (`defaultBackDestination` ở
     `lib/breadcrumb.ts`); trang có cha là Trang chủ vẫn về `/` như cũ.

2. **Dải 1024–1279px ép cột bài còn 424px** (xác nhận M18 của audit 09-30 trên cả ba loại bài).
   - **Lỗi:** skill `ui-ux` §11.E "learning/reading: readability > decoration".
   - **Ở đâu:** `apps/dhcb/src/components/DesktopSidebar.tsx` — thanh bên mở rộng 256px + cột mục
     lục/bước 288px.
   - **Bằng chứng (đo):** cột bài ở 1024px = **424px** (Lập trình, Vật lí, hội thoại) — hẹp hơn
     máy tính bảng 768px; tiêu đề bài Lập trình bị cắt ở header.
   - **Mức:** major.
   - **Sửa:** ✅ dải 1024–1279px mặc định thu gọn về dạng biểu tượng (72px). Mở rộng ở dải này là
     **tạm**: không ghi `localStorage`, đổi trang là tự thu lại. Từ 1280px giữ nguyên hành vi cũ.
     Đo sau: cột bài **606–608px** (+43%).

3. **Chế độ tập trung không đồng nhất giữa các môn.**
   - **Lỗi:** quy ước "trang ngồi học lâu bật `focus`" (`Layout.tsx`, P0-4).
   - **Ở đâu:** `apps/dhcb/src/pages/subjects/english/Lessons.tsx` — khuôn mobile của bài hội thoại
     không bật `focus` (khuôn desktop thì có), trong khi bài STEM, bài Lập trình, truyện đều bật.
     Thêm nữa, khi thanh đáy ẩn thì `--bnav-h` vẫn giữ **~128px** (`index.css`), để lại dải trống
     cuối mọi trang tập trung.
   - **Mức:** major — bài hội thoại trên điện thoại mất ~128px cho thanh điều hướng + mũi tên nảy
     suốt buổi học.
   - **Sửa:** ✅ bật `focus` cho khuôn mobile; `html[data-focus='1']` đặt `--bnav-h`/`--bnav-only-h`
     về 0. Đo sau: vùng bài kéo sát đáy màn, khoảng hở 0px.

4. **Bài hội thoại không có "Bài trước / Bài sau".**
   - **Lỗi:** đồng nhất luồng học (bài STEM và bài Lập trình đều có `OutlinePrevNext`).
   - **Ở đâu:** `Lessons.tsx` / `lessons/LessonView.tsx`.
   - **Bằng chứng:** cuối bài 1 chỉ có mục "Kết quả"; muốn sang bài 2 phải cuộn lên (desktop) hoặc
     về danh sách rồi tìm lại (mobile).
   - **Mức:** major — đứt mạch học ở đúng lúc vừa học xong.
   - **Sửa:** ✅ dùng lại **đúng** `OutlinePrevNext` qua cây phẳng `cayBaiHoiThoai`
     (`lib/englishLessonAnchors.ts`). Liên kết kèm `#dau-bai` nên bài mới mở ở đầu bài, tiêu điểm
     ở tiêu đề. Có nhãn tiếng Anh cho chiều B.

5. **Lý thuyết STEM: tiêu đề mục là chữ viết hoa giữa đoạn** (xác nhận M15 của audit 09-30).
   - **Lỗi:** WCAG 1.3.1 · skill `ui-ux` §9.A.2 (nhịp tiêu đề).
   - **Ở đâu:** `apps/dhcb/src/pages/learning/StemLessonView.tsx` — `bai.theory` in bằng
     `whitespace-pre-line`.
   - **Bằng chứng (đếm lại 2026-10-01 trên dữ liệu thật):** **573** dòng tiêu đề mục (Lý 225 · Hoá
     136 · Sinh 212; Toán dùng khuôn khác); ~2.090 ký hiệu chỉ số dưới viết thô (`v_tb`, `W_đ`).
   - **Mức:** major.
   - **Sửa:** ✅ cấu trúc — dòng "TIÊU ĐỀ:" thành `<h3>` (khoảng trên lớn hơn khoảng dưới), đoạn
     tách theo dòng trống, `v_tb` → v<sub>tb</sub> (`lib/stemTheory.ts` + `components/StemTheory.tsx`).
     **Cố ý KHÔNG đổi chữ hoa → thường:** đổi tự động sẽ sai tên riêng (Newton, Le Chatelier),
     viết tắt (ADN, CAM, MRI) và từ "Y học" — đó là việc sửa nội dung, xem 4.3.

6. **Bài Lập trình không có tiêu đề bài trong nội dung.** _(chưa sửa)_
   - **Ở đâu:** `apps/dhcb/src/pages/subjects/programming/ProgrammingLessonPage.tsx` — tên bài chỉ
     nằm ở header (`title={lesson.title}`), cắt cụt ở 390/1024px ("Chương trình đầu tiên — …");
     nội dung mở đầu bằng "Khái niệm". Hai môn kia có `<h1>` tên bài trong nội dung.
   - **Mức:** major.
   - **Sửa (đề xuất):** `<h1>` tên bài đầu cột nội dung, cùng thang chữ; header thôi nhắc lại.

### Minor

7. **Ba môn ba cỡ tiêu đề bài:** hội thoại 18px · Lập trình (header) 15px · STEM 24/30px.
   ✅ Hội thoại nâng lên `text-2xl sm:text-3xl font-extrabold` như STEM (Lập trình: xem #6).
8. **Hai lối lùi trùng nhau ở bài STEM (desktop):** header "← Góc học tập" và trong nội dung
   "← Bài học môn Vật lí" cách nhau 40px, khác đích. ✅ Header nay ghi đúng "← Bài học môn Vật lí";
   bản trong nội dung chỉ còn ở mobile (nơi nhãn header bị ẩn dưới 640px).
9. **Nút chính của trang tổng quan môn khác màu:** Tiếng Anh "Tiếp tục học ngay" xanh lá
   (`emerald`), Lập trình "Bắt đầu bài này" xanh trời (accent); khối "Học tiếp" cũng khác bố cục
   (nút bên phải vs nút giãn hết dòng). _(chưa sửa — cần chủ dự án: xanh lá ở Tiếng Anh có chủ ý
   không? CLAUDE.md §4.8 dành xanh lá cho nghĩa "đúng")_
10. **Tên môn viết hai kiểu:** thanh bên/breadcrumb "Vật lý", trang môn "Vật lí" (SGK dùng "Vật
    lí"). _(chưa sửa — đổi nhãn điều hướng, nên gộp vào đợt câu chữ)_

**Đếm: 0 critical · 6 major · 4 minor — đã sửa 5 major + 2 minor.**

### Phát hiện phụ (ngoài phạm vi đợt này, ghi để không mất)

- **Trang sập cả trang khi `/api/app-settings` thiếu `promoUntil`:** `PromoEndingBanner` gọi
  `toISOString()` trên ngày không hợp lệ → `RangeError` → `ErrorBoundary` "Đã có lỗi xảy ra". Gặp
  khi chạy mock thiếu trường. Cùng gốc với M9 (client đọc app-settings không qua Zod) — sửa ở đợt U5.
- **Ở 1024px, thanh bên thu gọn hiện chữ "VIP"** (liên kết tới `/nang-cap`) — nhãn có sẵn của chế
  độ thu gọn, nay xuất hiện thường xuyên hơn vì dải này mặc định thu gọn. Cùng câu hỏi câu chữ với
  M8 ("Free · Nâng cấp" ghi cứng) — chờ chủ dự án ở đợt U5.
- **Thanh công cụ bài hội thoại trên mobile cao ~150px** (3 hàng) trước khi tới tên bài.

## 3. Bằng chứng sau khi sửa

| Phép đo                                                      | Trước                | Sau                              |
| ------------------------------------------------------------ | -------------------- | -------------------------------- |
| Bề rộng cột bài ở 1024px (Lập trình · Vật lí · hội thoại)    | 424 · 424 · 424 px   | 608 · 606 · 608 px               |
| Bề rộng cột bài ở 1280px                                     | 648 · 606 · 648 px   | không đổi                        |
| Thanh bên ở 1440px                                           | 256px                | 256px (không đổi)                |
| Bài hội thoại mobile: thanh đáy · `<main>` · hở đáy          | hiện · không có · —  | ẩn · có · 0px                    |
| Bài hội thoại: "Bài sau" → bài 2, tiêu đề trong khung, focus | không có nút         | đạt (top 160px, focus `h1`)      |
| Bài Vật lí: nhãn + đích nút Back                             | "Góc học tập" → `/`  | "Bài học môn Vật lí" → danh sách |
| Lịch sử học: nhãn + đích nút Back                            | "Tiến độ" → `/`      | "Tiến độ" → `/tien-do`           |
| Lý thuyết bài Sự rơi tự do                                   | 0 tiêu đề, `v_o` thô | 4 `<h3>`, 1 `<sub>`              |

Script kiểm hành vi: 24/24 PASS (bấm thật trong Chromium; danh sách phép kiểm ở changelog 0467).

## 4. Đề xuất đợt tiếp (theo thứ tự đáng làm)

1. **Tiêu đề bài Lập trình trong nội dung** (#6) — một file, không cần quyết định.
2. **Khối "Học tiếp" dùng chung cho mọi trang tổng quan môn** (#9) — sau khi chủ dự án chốt màu
   nút chính. Một component, ba trang dùng.
3. **Sửa chữ hoa trong dữ liệu lý thuyết STEM** (nối #5): đổi 573 tiêu đề sang viết hoa đầu câu
   **trong file nguồn** `packages/subject-{physics,chemistry,biology}/lessons/*.ts`, có danh sách
   tên riêng/viết tắt giữ nguyên, người duyệt đọc diff. Giao diện đã sẵn sàng hiển thị.
4. **Độ dài dòng ở trang Lập trình** (M22 audit 09-30): đo lại 2026-10-01 ở 1440px — Lập trình home
   160 ký tự/dòng, chi tiết hướng Web 160, danh sách bài Vật lí 137, Ôn tập 154. Áp `read-measure`.
5. **Thanh công cụ bài hội thoại mobile gọn một hàng** (phát hiện phụ).
