# 0497 — Đợt U9a audit UI/UX: vùng chạm 44px trên mobile + giãn chữ WCAG 1.4.12 không cắt chữ (2026-10-05)

- **Ngày:** 2026-10-05 · **PR:** #1248 · **Loại:** `fix(a11y)`.
- **Phạm vi:** đợt U9a trong `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` — **M20** (vùng chạm
  < 44px trên mobile, luật dự án CLAUDE.md mục 4.7 / WCAG 2.5.5 AAA) và **M21** (giãn chữ WCAG
  1.4.12 làm cắt chữ). Chỉ lo KÍCH THƯỚC vùng chạm và CẮT CHỮ — không đổi biến thể nút hay bề rộng
  container (phần của đợt "Căn hàng, phân cấp thẻ").
- **Không sửa `PROGRESS.md`** (theo luật phiên điều phối 6 đợt song song) — trạng thái/nợ ghi ở
  cuối file này.

## Đo trước khi sửa (390×844, theme mặc định, mã `main` 0464dc7)

Công cụ đo mới `e2e/helpers/touchAndSpacing.ts` (chính là công cụ của cổng bên dưới), chạy trên
55 route (3 trang khách + 52 trang đăng nhập, gồm mọi route audit nêu):

| Chỉ số                                                                        | Trước              | Sau   |
| ----------------------------------------------------------------------------- | ------------------ | ----- |
| Đích chạm < 44px (390px)                                                      | **162** / 24 route | **0** |
| Phần tử MỚI bị cắt chữ khi giãn chữ 1.4.12 (390px)                            | **29** / 12 route  | **0** |
| Như trên ở 768px (sau lượt sửa đầu)                                           | 2 đích + 2 chữ     | **0** |
| Phần tử mới bị cắt chữ ở 1440px (sau lượt sửa đầu)                            | 1                  | **0** |
| 3 màn mở sau thao tác ở `lo-trinh/a1` (hội thoại, vòng từ vựng, bài ngữ pháp) | 33 đích            | **0** |

Khớp audit: `lo-trinh/a1` **69** đích nhỏ + 8 chữ bị cắt (audit: 69/116 và 10), truyện 23 (audit
23), Cài đặt 11, Bạn Đồng Hành 12 (audit 12), Hồ sơ 6 chữ bị cắt (audit 6), Tiếng Anh home 4
(audit 4). Cách đo theo đúng các ngoại lệ của WCAG 2.5.5: liên kết nằm giữa câu chữ không tính; ô
`radio`/`checkbox` có `<label>` bao quanh thì đo NHÃN (vùng chạm thật); bỏ phần tử vô hiệu / ẩn
khỏi trợ năng / `sr-only`. Giãn chữ: áp `line-height 1.5`, `letter-spacing 0.12em`,
`word-spacing 0.16em`, `p { margin-bottom: 2em }` rồi đếm phần tử có chữ trực tiếp, `overflow`
ẩn/cắt mà nội dung tràn — chỉ tính phần tử TRƯỚC KHI GIÃN chưa tràn (đúng thước đo "mới bị cắt"
của audit M21).

### Mục audit lệch mã hiện tại

- **Chẩn đoán lộ trình (radio 13×13px):** KHÔNG sửa — mỗi ô radio nằm trong một `<label>` đã có
  `tap-44` (cao 44px, rộng cả hàng), nên vùng chạm thật là 44px theo ngoại lệ "tương đương" của
  WCAG 2.5.5; audit đo ô `<input>` trần. Cổng mới vẫn canh route này (đo nhãn).

## Đã làm

### Tiện ích dùng chung (`apps/dhcb/src/index.css`)

- **`.tap-44-touch-y` / `.tap-44-touch`** (mới): ép 44px ở khung nhìn < 1024px **hoặc** khi con
  trỏ chính là ngón tay. Dùng cho danh sách DÀY (40 chip vòng từ vựng ở trang cấp CEFR, chip lọc
  truyện/mẫu câu, thanh công cụ hội thoại): điện thoại đủ 44px, desktop dùng chuột giữ mật độ cũ
  (đã qua sàn 24px của 2.5.8, axe canh). Khác `tap-44-coarse-y` (giữ nguyên cho thanh bên desktop)
  ở chỗ áp cả khung hẹp.
- **Thanh trượt `<input type="range">`**: một luật chung `min-height: 44px` trên màn chạm/màn hẹp
  thay vì vá từng thanh ở các trình mô phỏng "Ứng dụng thực tế" + "Lộ trình ôn thi" (cao 16px).
- Còn lại dùng `tap-44` / `tap-44-y` sẵn có.

### Component dùng chung (sửa một chỗ, nhiều trang hưởng)

- `KaraokeText` (20 file dùng — `codemap impact`): nút đọc câu cao ≥ 44px trên màn chạm; nội dung
  (icon + chữ) gói trong một khối con căn giữa dọc, nên câu một dòng không bị dồn lên trên, câu
  nhiều dòng giữ nguyên.
- `Layout` (88 file dùng): tiêu đề/phụ đề header **xuống dòng** thay vì `truncate` — tiêu đề dài
  (vd "Challenge 1 phút mỗi ngày", "Luyện viết & chấm điểm") bị cắt "…" khi giãn chữ ở 390px.
- `VoicePicker`: hai công tắc 44×24 → nút trong suốt **44×44**, viên thuốc 44×24 vẽ bên trong (giữ
  nguyên hình dáng — lý do cũ không dùng `tap-44`); nút chọn giọng 34 → 44px.
- `RateToggle`: mỗi mức tốc độ 44×44 (trước cao 40px, mức "1×" rộng 28px).
- `CefrLessonViews`: thanh công cụ bài hội thoại (Quay lại · Phát/Dừng/Tiếp · nút dừng 24px ·
  tốc độ · EN / EN+VI / VI · Đóng vai · Cài đặt giọng) dùng `tap-44-touch*`; vạch ngăn giữa các
  cụm chỉ hiện từ 1024px (ở 390px thanh xuống 3 hàng, vạch đứng lẻ loi đầu hàng); lựa chọn trắc
  nghiệm bài ngữ pháp 38 → 44px; nút "Quay lại", "Tôi đã biết vòng này".
- `LessonView`: chế độ nghe EN / EN+VI / VI đổi `tap-44-coarse-y` → `tap-44-touch-y` (trước chỉ
  theo `pointer: coarse`, khung hẹp vẫn 20–24px).
- `OutlinePrevNext`, `StudioDialogue`, `AvatarEmbodimentSelector`, `EdgeAiIndicator`, `ChatList`,
  `RoadmapTab`, `UpgradeSection`, `CefrExam`, `SearchBar` (tìm bài học).

### Trang

- `CefrLevelPage` (`lo-trinh/a1`, nặng nhất): `<summary>` 20 → 44px, chip vòng từ vựng 30 → 44px
  trên mobile, hàng hội thoại 42 → 44px, nút "Học tiếp cấp …", "Xem lại"; mọi `truncate` (tên
  phần, tên bài, công thức ngữ pháp, bài tiếp) → xuống dòng.
- Truyện + Mẫu câu: chip lọc 30px → 44×44 trên mobile, nút "Xem thêm".
- `StoryReader`: mục lục đoạn bỏ `line-clamp-2` — câu đầu đoạn rút gọn NGAY TRONG CHUỖI (tối đa 80
  ký tự + "…") rồi xuống dòng tự nhiên, giãn chữ thế nào cũng không mất chữ.
- Cài đặt (Bật/Tắt âm thanh), Từ điển (tab, ô tìm), Luyện nghe (ô tìm), Góc học tập (ô tìm), Ghi
  chú + Kanban (ô tìm 20px, ô lọc), Lịch sử học, Bạn bè (36 → 44px), Tin nhắn (ô tìm, nút), Nâng
  cấp, Đăng nhập (VI/EN 24px, tab Đăng nhập/Đăng ký 36px, nút hiện mật khẩu 32 → 44px), Trang
  khách (link "Xem toàn bộ nền tảng"), Action Canvas (3 nút phóng to/thu nhỏ 26px), Luyện tập
  ("Xem tất cả môn" 17px).
- Bỏ `truncate`/`line-clamp` trên mô tả thẻ: Luyện tập (22 chỗ), Tiếng Anh home (14), Hồ sơ (13),
  Trang chủ (mô tả trụ Ghi chú ở mobile), Lập trình home + trang khoá/bậc/chặng ("Học bài: …").

### Cổng chặn tái phát

`e2e/u9-touch-target-text-spacing.spec.ts` — **55 ca**, tuyệt đối (0 đích nhỏ, 0 chữ mới bị cắt,
không baseline):

- 42 route × 390px: vùng chạm ≥ 44px + giãn chữ;
- 3 màn mở sau thao tác ở `lo-trinh/a1` (bài hội thoại — thanh "EN / EN+VI / VI", vòng từ vựng,
  bài ngữ pháp);
- 3 route × 768px (vẫn là giao diện mobile) + 7 route × 1440px (giãn chữ).

Mỗi ca chờ `<main>` hiện ra rồi mới đo (mọi route có `<main>` sau U1), và mock đủ API riêng của
trang theo `realDataMocks` (U3) để không đo trúng màn lỗi.

## Bằng chứng

- **Đối chứng âm** (đặt lại `apps/` về `main`, giữ test mới): **39/55 đỏ**; 16 ca còn xanh là
  route vốn đã đạt (vd `/tien-do`, `/nhiem-vu`, 1440px `/goc-hoc-tap/english/lo-trinh/a1`).
  Trên mã đợt này: **55/55 xanh** (1,2 phút, 2 worker).
- Typecheck ✅ · Lint 0 cảnh báo ✅ · Prettier ✅ · `vitest related` 31 file / 249 test ✅ · 3 test
  thiết kế (`FontSizeRem`, `UiNoise`, `Home.design`) ✅ — số cuối của `test:coverage`, build và
  E2E liên quan ghi ở mục "Cổng cuối" dưới đây.
- **Tầng 8b** (ảnh 390×844 toàn trang + 1440×900, trước/sau, Blue sky — tự xem):
  - `lo-trinh/a1` 390: chip vòng từ vựng cao 44px, xuống hàng như cũ; tên bài ngữ pháp "Động từ
    "to be" (am / is / are)" và công thức "S + am / is / are + (tính từ • danh từ • nơi chốn)" nay
    hiện ĐỦ (trước cắt "…"); thẻ "Mục lục 13 phần" cao hơn (summary 44px). Trang dài thêm
    6.185 → 7.287px (+18%) — giá phải trả của chip 44px; M22 (trang dài) là đợt khác.
  - Bài hội thoại 390: thanh công cụ 3 hàng, mọi nút ≥ 44px, không còn vạch ngăn lẻ đầu hàng;
    bong bóng thoại cao hơn ~20px mỗi câu (dòng dịch là một nút đọc riêng, nay 44px).
  - Cài đặt 390: công tắc giữ đúng hình viên thuốc; mức "1×" thành vòng tròn 44px; nút giọng cao
    hơn, chữ "Giọng nữ 2" không đổi cách xuống dòng.
  - Tiếng Anh home 390: "Chữ sáng theo giọng đọc", "Kế hoạch tới ngày thi", "Chiều học · tốc độ
    · giọng" hiện đủ (trước cắt "…").
  - Bạn Đồng Hành 390: nút hình đại diện, tab văn bản/giọng nói, chip lĩnh vực, gợi ý, ô nhắn tin
    đều 44px; bố cục giữ nguyên.
  - 1440px (cấp A1, bài hội thoại, Cài đặt, Tiếng Anh…): giữ mật độ desktop như trước — chip vẫn
    30px, thanh công cụ hội thoại gọn một hàng.

## Cổng cuối

- `test:coverage`: 792 file / 18.481 test ✅ (1 file, 2 test bỏ qua sẵn có), độ phủ 95,08 /
  90,96 / 95,63 / 95,73 (stmts/branches/funcs/lines) — trên sàn 93/89/93/93.
- Build ✅ · `size` ✅ (JS đầu 152,54/160 kB, CSS 23,94/26 kB brotli) · typecheck sau khi xoá
  `packages/*/dist dist dist-server` ✅ · lint 0 cảnh báo ✅ · Prettier ✅.
- E2E (2 worker, 20,8 phút): **578/578** ✅ — `a11y.spec.ts` + `a11y-aaa.spec.ts` (A/AA + AAA, 3
  theme) + `u9-touch-target-text-spacing` + 19 file chạm cùng component (`mobile-layout-guards`,
  `u6-user-preferences`, `lang-of-parts`, `landmark-title`, `header-back-touch-target`,
  `cefr-tab-touch-target`, `bottomnav`, `english-subject-home`, `outline-english`,
  `outline-programming`, `programming-home`, `companion-history`, `guest-home`, `listening`,
  `listening-phrases`, `practice-direction`, `smoke`, `authenticated`, `a11y-modals`).
- `codemap impact`: `Layout.tsx` 88 file, `KaraokeText.tsx` 20 file, `VoicePicker.tsx` 3 file —
  phần hiển thị của các trang đó nằm trong danh sách đo của cổng mới hoặc của E2E trên.

## Còn tồn / đề xuất (chờ chủ dự án xác nhận)

- **Đề xuất:** `tap-44-touch*` là tiện ích mới — nếu đợt "Căn hàng, phân cấp thẻ" chuẩn hoá biến
  thể nút thì nên gộp kích thước vùng chạm vào chính component nút chuẩn (thay vì class rải).
- Cổng đo 42 route ở trạng thái mở đầu + 3 màn thao tác. Màn có dữ liệu dày (Kanban đầy thẻ, sổ
  lỗi nhiều mục, modal) và các route ngoài danh sách (vd `/admin-s`, `/avatar-demo`) chưa đo.
- `truncate` còn ở nơi khác của app (thanh bên desktop, thẻ trên các trang không nằm trong danh
  sách) — chưa đo ra lỗi nên không đụng; cổng mới sẽ báo khi trang đó được đưa vào danh sách.
- Minor 14 (ô chat mobile "(Enter để gửi)" bị cắt placeholder) thuộc đợt khác, không làm ở đây.
