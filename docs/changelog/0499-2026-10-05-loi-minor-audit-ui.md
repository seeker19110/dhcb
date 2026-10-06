# 0499 — Đợt lỗi minor của audit UI/UX 2026-09-30 (mục 6: minor 1–11, 13, 14) (2026-10-05)

- **Ngày:** 2026-10-05 · **PR:** #1246 · **Loại:** `fix(ui)`.
- **Nguồn:** `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` mục 6. Minor 12 (môn Toán/Lý/Hoá mở
  tab Bài học trước) thuộc đợt U9b, không làm ở đây.
- **Không sửa `PROGRESS.md`** (theo luật đợt song song — phiên điều phối đồng bộ sau). Trạng thái và
  nợ còn lại ghi ở cuối file này.

## Đã làm, từng mục

| Minor | Vấn đề                                                             | Đã sửa                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | h1 → h3/h4 nhảy cấp                                                | Đo lại cả 41 route bằng Playwright (h1–h6 theo thứ tự DOM). 0493 đã đóng Góc học tập + trang môn STEM; còn **5 trang** nhảy cấp: Kanban ghi chú (h3→h2), Luyện tập (thẻ "Sổ tay sửa lỗi" h3→h2), Ứng dụng thực tế/Mô phỏng (10 mô phỏng + 3 tab: h3→h2, h4→h2/h3), Lộ trình CEFR (`RoadmapTab` h3→h2), trang cấp CEFR (tên phần h4→h2). Sau sửa: **0 trang nhảy cấp**. Chỉ đổi thẻ, giữ class nên giao diện không đổi.                                                                                                                                                                                                                                                                         |
| 2     | Từ điển mở tab thẻ ghi nhớ                                         | Mở mặc định tab **Tra từ**. Thẻ ghi nhớ vẫn ở tab "Hôm nay", cách một chạm. Cổng AAA quét tab mới này lần đầu và bắt được nhãn "💡 Mẹo:" chỉ 6,77:1 ở theme Nhi đồng: theme này đặt `--a-800` = `--a-700`. Sửa **token** `--a-800` (kid) thành 142 48 17 = 7,53:1, đậm hơn a-700 đúng thứ tự thang; viền focus (a-700) giữ nguyên.                                                                                                                                                                                                                                                                                                                                                             |
| 3     | Hai nút quay lại cùng đích ở trang cấp CEFR                        | Bỏ nút "‹ Lộ trình A1 → C2" trong trang; giữ nút "← Lộ trình CEFR" ở header (cùng đích `duongDanLoTrinh()`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 4     | Trùng tên "Câu thông dụng"; header "Nghe" ≠ thanh bên "Luyện nghe" | Header trang Luyện nghe = **"Luyện nghe"** (khớp thanh bên). Tab đầu đổi **"Mẫu câu"** (EN "Sentence patterns") để không trùng tên trang riêng "Câu thông dụng".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 5     | `/avatar-demo` mở cho mọi người; "bàn đang hoàn thiện"             | Route bọc `RequireAccount` + `RequireAdmin` — người thường gõ URL bị đưa về `/`. Lỗi chính tả "bàn": **không tái hiện** — mã chỉ có "Sắp ra mắt — bản đang hoàn thiện" (đúng chính tả), `git log -S"bàn đang hoàn thiện"` không ra commit nào; audit đọc nhầm.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 6     | Cờ quốc gia làm biểu tượng ngôn ngữ ở Cài đặt                      | Bỏ 🇻🇳/🇺🇸 (và 🌍 ở nhãn chiều học). Tên ngôn ngữ viết bằng chính ngôn ngữ đó, có `lang`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 7     | Trang khách sinh 2 lỗi 401 trong console                           | (a) `fetchOnboarding` không gọi `/api/profile` khi chưa có cờ phiên. (b) `POST /api/auth {action:'session-from-cookie'}` **không có cookie** nay trả `200 {authenticated:false}` thay vì 401 — khách là trạng thái bình thường, không phải lỗi. Cookie có nhưng sai/hết hạn vẫn 401. `?action=me` vốn đã chỉ gọi khi có cờ phiên (audit gọi chung là "action=me").                                                                                                                                                                                                                                                                                                                             |
| 8     | Tên sản phẩm lệch                                                  | Header (`T.appName`) "Gia sư AI"/"AI Tutor" → **"Đồng Hành Cùng Bạn"** (có `lang="vi"` khi giao diện tiếng Anh). PWA `short_name` "Đồng Hành AI" → **"Đồng Hành"** (xem "Đề xuất chờ xác nhận"). `name` của manifest vốn đã đúng. Không đụng `index.html`/mô tả/màu (thuộc U7).                                                                                                                                                                                                                                                                                                                                                                                                                |
| 9     | Mobile có 2 lối vào Bạn Đồng Hành                                  | Dưới 1024px nút "Đồng Hành AI" ở header bị gỡ ở MỌI trang (trước chỉ ở Trang chủ); Orb ở thanh đáy là lối vào duy nhất. Nút header chỉ còn khi thanh đáy không hiện: desktop và chế độ tập trung (bài Lập trình) — E2E kiểm bất biến "đúng một lối vào".                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 10    | Hub dùng font hệ thống; cuộn mượt không có nhánh giảm chuyển động  | Hub nạp `@fontsource-variable/inter` như app, `font-family` bắt đầu bằng `'Inter Variable'`. `scroll-behavior: smooth` chỉ trong `@media (prefers-reduced-motion: no-preference)`. Test mới `apps/hub/src/hubStyle.design.test.ts` (có đối chứng âm: đỏ trên mã cũ).                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 11    | `/welcome` hiện thanh bên app cho khách                            | Hàm dùng chung `isNavHidden()`/`isNavHiddenPath()` (`lib/studios.ts`) cho cả `DesktopSidebar` lẫn `BottomNav`: `/welcome` và `/learn-vietnamese` không có thanh điều hướng. Quyết theo **đường dẫn**, không theo "là khách" — `user` chỉ biết sau một vòng mạng, quyết theo nó thì trang nhảy bố cục. Ảnh 1440px lộ thêm lỗi gốc: **không có luật CSS** cho trạng thái thanh bên ẩn, nên `/welcome`, `/login`, `/onboarding` đều chừa dải trống 256px (thẻ đăng nhập lệch phải 128px). Thêm `data-sidebar="none"` → `--sidebar-w: 0px` (đặt bằng `useLayoutEffect`, trước khi vẽ); lúc đang tải phiên (`off`) vẫn giữ lề để trang thường không nhảy. Không đụng nhãn gói trong thanh bên (U5). |
| 13    | Cài đặt gộp ngôn ngữ giao diện + chiều học                         | Hai điều khiển riêng: **"Ngôn ngữ giao diện"** (Tiếng Việt / English — `setLang`) và **"Chiều học"** (Người Việt học tiếng Anh / Người nước ngoài học tiếng Việt — `setDirection`). Đổi một bên không đổi bên kia (goal 2026-09-23 S04). Chữ trên trang Cài đặt theo ngôn ngữ giao diện, không theo chiều học. Nút dùng `aria-pressed` trong `role="group"`.                                                                                                                                                                                                                                                                                                                                   |
| 14    | Ô chat mobile "(Enter để gửi)" bị cắt                              | Bỏ gợi ý khỏi placeholder (Bạn Đồng Hành + Tin nhắn); thêm `enterKeyHint="send"` để phím Enter của bàn phím điện thoại hiện "Gửi"; ô Bạn Đồng Hành có `aria-label`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Cổng / test

- Cập nhật theo hành vi mới: `e2e/landmark-title.spec.ts` (`/avatar-demo` kiểm bằng phiên admin + ca
  người thường bị chuyển về `/`), `e2e/skip-link.spec.ts` (chờ nút "Lộ trình CEFR"),
  `e2e/header-back-touch-target.spec.ts` (đúng một lối vào Bạn Đồng Hành: header có nút khi và chỉ
  khi thanh đáy ẩn),
  `e2e/a11y-aaa.spec.ts` (thẻ từ: bấm tab "Hôm nay" trước), `e2e/listening-phrases.spec.ts` (tên tab).
- **Thêm** (không nới): `e2e/a11y.spec.ts` quét AA tab "Hôm nay" của Từ điển × 3 theme — vì `/tu-dien`
  mặc định nay quét tab Tra từ, thiếu ca này thì cổng mất phủ phần thẻ ghi nhớ.
- Test đơn vị mới/sửa: `studios.test.ts` (`isNavHidden`/`isNavHiddenPath`), `onboarding.test.tsx` (khách không gọi
  `/api/profile`), `auth.test.ts` (không cookie → 200), `clientAuth.test.ts` (client xử lý
  `{authenticated:false}`), `Layout.test.tsx` (nút header theo bề rộng), `hubStyle.design.test.ts`.

## Đề xuất chờ chủ dự án xác nhận

1. **PWA `short_name` = "Đồng Hành"** (không phải nguyên "Đồng Hành Cùng Bạn"): Chrome khuyên
   `short_name` ≤ 12 ký tự, dài hơn thì nhãn biểu tượng trên màn hình chính Android bị cắt
   ("Đồng Hành C…"). "Đồng Hành" là dạng rút gọn của chính tên đó và khớp `apple-mobile-web-app-title`
   có sẵn. Muốn nguyên tên thì đổi một dòng trong `manifest.webmanifest`.
2. **Trang giới thiệu ẩn thanh điều hướng với MỌI người**, không chỉ khách, và cả
   `/learn-vietnamese` (bản tiếng Anh của `/welcome`). Lý do: quyết theo "là khách" phải chờ phiên
   tải xong → nhảy bố cục ở trang bán hàng. Người đã đăng nhập hiếm khi mở trang này, và nút CTA
   của trang vẫn đưa họ vào app.
3. **`/login` và `/onboarding` nay căn giữa thật** (hết dải trống 256px) — hệ quả của luật CSS
   `data-sidebar="none"` ở mục 11; ý định "không chừa lề" đã ghi trong comment `DesktopSidebar` từ
   trước nhưng chưa từng có CSS thi hành.
4. **Hậu tố tiêu đề tab** vẫn là "Đồng hành cùng bạn" (viết thường, đợt U1 chốt và có test
   `landmark-title` canh). Chưa đổi sang "Đồng Hành Cùng Bạn" vì chạm ~30 file và cổng của U1 —
   nếu muốn thống nhất cả chữ hoa ở tiêu đề tab, làm một đợt cơ học riêng.

## Không làm / để lại

- Minor 12 → đợt U9b.
- Hai điểm đo được ngoài phạm vi "nhảy cấp": `/goc-hoc-tap/english/bai-hoc` không có `h1` nào (chỉ
  `h2`), `/lap-trinh/p1` có `h2` đứng trước `h1`. Ghi lại để đợt sau xử lý.
- Thanh điều hướng đáy (mobile) của khách ở các trang thường vẫn có Orb "Đồng Hành" trỏ tới trang
  cần tài khoản — hành vi cũ, không đổi ở đợt này.

## Bằng chứng

- **Cổng commit trên cây cuối** (sau `rm -rf packages/*/dist dist dist-server`): typecheck ✅ ·
  lint 0 cảnh báo ✅ · `prettier --check .` ✅ · `test:coverage` ✅ 793 file / 18489 test, coverage
  95,09 / 90,97 / 95,63 / 95,73 (sàn 93/89/93/93) · build ✅ · size-limit JS 152,58/160 kB, CSS
  23,95/26 kB.
- **E2E liên quan:** `skip-link`, `landmark-title`, `header-back-touch-target`, `listening-phrases`,
  `bottomnav`, `mobile-layout-guards`, `v2-hubs`, `learning-session-resume`,
  `english-subject-home`, `companion-history` — 77/77 xanh (lần đầu 6 ca đỏ ở
  `header-back-touch-target` route Lập trình: bài Lập trình bật chế độ tập trung nên header ĐÚNG là
  phải giữ nút; sửa test thành bất biến "đúng một lối vào").
- **a11y AA + AAA** (`a11y.spec.ts` + `a11y-aaa.spec.ts`, lọc theo các trang đã chạm: Từ điển, Cài
  đặt, lộ trình/cấp CEFR, Luyện nghe, Bạn Đồng Hành, welcome/learn-vietnamese, đăng nhập, tin nhắn,
  Ghi chú, Luyện tập, Ứng dụng thực tế, Trang chủ × 3 theme): 111/112 ở lượt cuối. Ca AAA
  `/tu-dien` theme Nhi đồng là lỗi thật → đã sửa token (xem mục 2). Một ca AAA
  `/ban-dong-hanh` dark-blue đỏ MỘT lần khi máy chạy song song nặng; chạy lại riêng 3/3 rồi
  `--repeat-each=4` cho cả AA lẫn AAA × 3 theme của trang đó: **24/24 xanh** — ghi lại, để CI xác nhận.
- **Đo thứ bậc tiêu đề** (script Playwright tạm, 41 route, 1440px): trước 5 trang (6 route) nhảy cấp
  (`/ghi-chu/kanban`, `/luyen-tap`, `/ung-dung-thuc-te`, `/mo-phong`, `/goc-hoc-tap/english/lo-trinh`,
  `/lo-trinh-hoc/a1`) → sau 0.
- **Tầng 8b — ảnh trước/sau, theme Blue sky, 1440px + 390px, đã tự xem:**
  - `/welcome` (khách): trước có thanh bên "Góc học tập · Ôn tập · … · Free · Nâng cấp" (1440) và
    thanh đáy 5 mục (390); sau không còn, nội dung căn giữa đúng, hết dải trống 256px.
  - `/login` 1440: trước thẻ đăng nhập lệch phải 128px, nền gradient dừng ở 256px; sau căn giữa.
  - Bạn Đồng Hành 390: trước header có nút bot + Orb thanh đáy, placeholder "Nhắn tin cho Bạn Đồng
    Hành AI... (Enter để gửi)" xuống dòng và bị cắt; sau chỉ còn Orb, placeholder vừa một dòng.
  - Cài đặt 390: hai khối "Ngôn ngữ giao diện" (Tiếng Việt | English) và "Chiều học" (hai lựa
    chọn), không cờ; chữ không tràn.
  - Cấp CEFR A1 1440: chỉ còn "← Lộ trình CEFR" ở header, thanh tab lên sát đầu nội dung; desktop
    vẫn có nút "Đồng Hành AI".
  - Từ điển 390: mở ô tra từ + "Chủ đề phổ biến", ô tìm cố định trên thanh đáy.
  - Luyện nghe 390: header "Luyện nghe", tab "Mẫu câu | Hội thoại".
  - Hub 1440 + 390: font tính toán `"Inter Variable", system-ui…` (trước `system-ui…`); giả lập
    `prefers-reduced-motion: reduce` → `scroll-behavior: auto`; 390px không tràn ngang.
- Golden snapshot prompt / `eval:tutor`: không chạy — đợt này không đụng `src/prompts/*` hay
  `aiConfig.ts`.
- Gộp `main`: không cần — `main` mới (#1236–#1243) không chạm file nào của đợt này, `merge-tree`
  không xung đột.
