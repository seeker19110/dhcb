# 0491 — Đợt U6 audit UI/UX: tuỳ chọn người dùng — khung nhìn thấp, gỡ Reachability, giảm chuyển động, màu cưỡng bức, rem, lịch 24px (2026-10-05)

- **Ngày:** 2026-10-05 · **PR:** (điền khi tạo) · **Loại:** `fix(a11y)`.
- **Phạm vi:** đợt U6 trong `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` mục 12 (M1–M6 ở
  mục 5 "Khả năng tiếp cận và tuỳ chọn người dùng") cộng cổng (f) ở mục 11 (test cấm cỡ chữ px).
- **Quyết định M2: chủ dự án chọn GỠ HẲN tính năng "Reachability", 2026-10-05** (audit để ngỏ
  "tắt mặc định hay gỡ"). Không giữ cài đặt bật/tắt, không giữ code chết.

## Đã làm

### M1 — Khung nhìn thấp: thanh cố định không ăn mất nội dung (WCAG 1.4.10, 1.4.4)

- `apps/dhcb/src/index.css`, `@media (max-height: 500px)` (phóng to 200–400%, điện thoại ngang):
  - header của `Layout` (thêm class móc `app-header`) **thôi dính**, cuộn đi cùng trang;
    `scroll-padding-top` khi đi bằng bàn phím hạ về 8px cho khớp;
  - dưới 1024px: thanh đáy gọn còn 3.5rem (56px) + safe-area thật, Orb không nhô lên và nhỏ lại
    (2.25rem). Nhãn tab giữ nguyên, mỗi tab vẫn ≥ 44px; `--bnav-only-h`/`--bnav-h` theo đó giảm
    nên đệm đáy của mọi trang tự khớp.
- Màn dọc (390×844) và desktop không đổi.

Đo bằng chính hàm của `e2e/u6-user-preferences.spec.ts` (mọi thanh `fixed`/`sticky` rộng ≥ nửa
màn, kể cả vùng chứa toast 8px; bỏ dải "đang đồng bộ" tạm thời):

| Khung nhìn (sau khi cuộn)   | Trước                    | Sau   |
| --------------------------- | ------------------------ | ----- |
| 800×400 (Trang chủ)         | 40,5%                    | 16,3% |
| 844×390 (Trang chủ)         | 41,5%                    | 16,7% |
| 844×390 `lo-trinh/a1`       | 41,5%                    | 16,7% |
| 390×844 (dọc, không đổi cỡ) | 18,2% + dải mũi tên 32px | 18,2% |

### M2 — Gỡ hẳn "Reachability"

- Xoá `apps/dhcb/src/lib/useOneHandedDrag.ts` (không có test, không có khoá lưu trữ hay cài đặt
  nào — không cần migrate).
- `App.tsx`: bỏ hook, bỏ `style` dịch chuyển nội dung, bỏ hai prop truyền cho `BottomNav`.
- `BottomNav.tsx`: bỏ dải 2rem `touch-action: none` (chặn cả cử chỉ cuộn bắt đầu từ đó) và mũi
  tên `animate-bounce` lặp vô hạn (WCAG 2.2.2); bỏ import `ChevronDown/ChevronUp`.
- `Layout.tsx`: bỏ tấm nền đặc 100dvh phía trên header, vốn chỉ để che khoảng trống khi kéo nội
  dung xuống.
- `index.css`: `--bnav-h` không còn cộng 2.75rem cho dải đó (= `--bnav-only-h`). Sửa chú thích
  cũ ở `Dictionary.tsx`. Chú thích lịch sử ở `english/Lessons.tsx` (nói về "trước đây") giữ nguyên.

### M3 — Avatar Bạn Đồng Hành tôn trọng "giảm chuyển động" (WCAG 2.3.3)

- Hàm mới `apps/dhcb/src/lib/motionAwareLoop.ts` (`startMotionAwareLoop`) gom ba điều kiện dừng
  vòng `requestAnimationFrame`: `prefers-reduced-motion: reduce` → vẽ **một khung tĩnh**; tab ẩn →
  huỷ khung đang hẹn; ra khỏi khung nhìn (IntersectionObserver) → tạm dừng. Đổi tuỳ chọn khi trang
  đang mở thì vòng lặp tự theo.
- `CyberTutorAvatar3D.tsx` dùng hàm này thay cho vòng RAF vô hạn; khung tĩnh lấy ở giây thứ 1 của
  chu kỳ chớp mắt (đang mở mắt).

### M4 — Chế độ màu cưỡng bức (Windows tương phản cao)

- `index.css`, `@media (forced-colors: active)`, ngoài `@layer`:
  - `svg.lucide { color: inherit }` — Chromium mặc định `preserve-parent-color` cho `<svg>`, nên
    icon tự khai `text-*` giữ màu tác giả (tối/nhạt) trên nền `Canvas` và gần như biến mất. Nay
    icon mang màu hệ thống của phần tử chứa nó;
  - viền mảnh `outline: 1px solid ButtonText` cho `button`, `[role=button|tab|switch]`,
    `summary`, link có nền (`a` có class `bg-*`) và Orb thanh đáy — dùng `outline` để không đổi
    kích thước hộp;
  - `:focus-visible` viền 3px `Highlight` thay cho `ring` (box-shadow bị bỏ ở chế độ này).
- Ô heatmap lịch hoạt động và chú thích đậm/nhạt khai `forced-color-adjust-none` tại chỗ: nền bị
  ép về `Canvas` thì heatmap mất sạch nghĩa.

### M5 — Cỡ chữ theo tuỳ chọn người dùng (EN 301 549 §9.7)

- `.read-body` 15px → `0.9375rem` (chính cỡ chữ nội dung đọc — audit đo 87% nút chữ trang đọc
  truyện giữ nguyên cỡ khi đổi cỡ chữ trình duyệt 16→24px).
- Ô nhập trên màn cảm ứng (apps/dhcb và apps/hub) `16px` → `max(1rem, 16px)`: không dưới 16px
  (iOS tự zoom) mà vẫn lớn theo người dùng. `CodeEditor` `16px` → `1rem`.
- `text-[11px]` ở `ActivityCalendarCard.tsx` (3) và `CyberTutorAvatar3D.tsx` (1) → `0.6875rem`.
- **Cổng (f):** `apps/dhcb/src/pages/core/FontSizeRem.design.test.ts` —
  - CSS (apps/dhcb, apps/hub, packages): **0** `font-size: <số>px`, tuyệt đối;
  - TS/TSX: `text-[Npx]` / `fontSize` px là nợ cũ (**501 chỗ / 127 file**), chốt một chiều theo
    từng file: chỉ giữ hoặc giảm, file mới phải 0.
- **Chưa làm (cố ý):** chuyển hàng loạt 501 chỗ còn lại (465 là `text-[11px]`) sang rem. Đó là
  việc cơ học nhưng chạm 127 file, đúng những dòng `className` mà U3 (màu) và U8 (câu chữ) đang sửa
  song song → xung đột chắc chắn. Đề xuất một PR cơ học riêng sau khi U3/U4/U8 vào `main`; khi đó
  hạ số trong danh sách nợ của test về 0.

### M6 — Lịch hoạt động ở Tiến độ: vùng chạm ≥ 24px (WCAG 2.5.8)

- Ô desktop 16×16px → nút **24×24px**, ô màu nhìn thấy là `<span>` 18px bên trong, các ô sát nhau
  (gap 0) nên bước lưới chỉ tăng 20→24px — vẫn đọc như lưới chấm. Mobile giữ 44px.
- Lưới nửa năm vốn đã tràn ngang cột phải (26 tuần × 20px > ~300px, ô hôm nay bị khuất ở mép phải).
  Ô to hơn thì tràn nhiều hơn, nên: mở thẻ là **cuộn sẵn về mép phải** (tuần gần nhất, có hôm nay,
  luôn hiện); cột nhãn T2…CN **dính mép trái** (`sticky left-0`, nền đặc) nên không trôi mất.
- `ActivityCalendarCard.test.tsx`: ca cũ "giữ heatmap desktop 16px" ghim đúng cỡ sai → đổi thành
  ca canh 24px + ô màu bên trong.

### Mục audit lệch mã hiện tại

- Không có: cả sáu mục mô tả đúng mã trên `main` (f7d0c23) — đo lại trước khi sửa (bảng M1 cột
  "Trước", và đối chứng âm dưới đây).

## Bằng chứng

- Typecheck (đã xoá `packages/*/dist dist dist-server`) ✅ · Lint 0 cảnh báo ✅ · Prettier ✅
- `test:coverage`: 788 file / 18459 test ✅, độ phủ 95,09 / 90,98 / 95,62 / 95,74 (stmts/branches/funcs/lines). Hai lần chạy đầu đỏ 1 ca KHÔNG liên quan (`packages/subject-programming/tsPrelude.test.ts` quá 5 giây vì máy tải 16 trên 4 lõi); chạy riêng xanh 4/4, chạy lại toàn bộ với `--testTimeout=30000` xanh hết. · Build ✅
- Test mới: `motionAwareLoop.test.ts` 7 ca · `CyberTutorAvatar3D.test.tsx` 2 ca ·
  `FontSizeRem.design.test.ts` 4 ca (gồm ca giả regex) · `ActivityCalendarCard.test.tsx` sửa 1 ca.
- E2E mới `e2e/u6-user-preferences.spec.ts` 15 ca: M1 (6 khung × route + 1 ca dọc không đổi), M2,
  M3 (đối chứng dương: mặc định canvas có đổi; reduce: canvas đứng yên), M4 (2 trang), M5, M6
  (1024 + 1440).
- **Đối chứng âm** (đặt lại mã nguồn của `main`, giữ test mới): E2E **14/15 đỏ** (ca còn xanh là
  đối chứng dương M3 "mặc định có chuyển động" — đúng mong đợi); vitest 5 ca đỏ (CSS px, nợ TS
  vượt chốt, 2 ca avatar, ca 24px). Số đo trên mã cũ: tỉ lệ thanh cố định 0,405–0,415; mảng
  `{bounce: 1, touchNone: 1, aboveNav: 4}`; 14–15 icon lucide giữ màu tác giả ở chế độ cưỡng bức;
  `.read-body` 15px khi gốc 24px; ô lịch 16px.
- E2E `a11y.spec.ts` + `a11y-aaa.spec.ts` + `u6-user-preferences.spec.ts` + `bottomnav` + `calendar-keyboard` + `mobile-layout-guards` + `reduced-motion` + `companion-history` + `skip-link` (cổng riêng 5184): **413/414** ✅; ca còn lại (`a11y-aaa` `/bai-hoc` theme kid) quá 30 giây vì máy tải, chạy riêng xanh (28,9 giây).
- Tầng 8b (Blue sky), tự xem ảnh:
  - 844×390 và 800×400 Trang chủ: trước header 57px + thanh đáy 97px + dải mũi tên; sau header
    cuộn đi, thanh đáy gọn 57px, nhãn tab đọc rõ, Orb không nhô;
  - 390×844: dải mũi tên nảy phía trên thanh đáy không còn, còn lại giống hệt;
  - 1440×900 Trang chủ: giống hệt trước;
  - Tiến độ 1024 và 1440: ô to hơn, cột T2…CN đứng yên ở trái, ô hôm nay (viền chọn) hiện ở mép
    phải; trước đó ô hôm nay khuất ngoài khung cuộn;
  - Tiếng Anh 390 ở màu cưỡng bức: icon thẻ "Luyện Nghe/Nói/Viết/Chat" đổi từ màu tác giả sang
    màu chữ hệ thống, nút "Học tiếp", nút đóng mẹo và Orb "Đồng Hành" có viền. Ở 1440px các nút
    mở rộng mục thanh bên (chevron) có viền hơi chồng nhau — chỉ ở chế độ cưỡng bức, chấp nhận.
