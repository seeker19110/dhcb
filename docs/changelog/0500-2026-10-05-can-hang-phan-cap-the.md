# 0500 — Căn hàng, phân cấp thẻ: nút chuẩn, viền lấy nét tức thì, gọn trang dài Lập trình (2026-10-05)

- **Ngày:** 2026-10-05 · **PR:** #1247 · **Loại:** `fix(ui)` · **Nhánh:**
  `claude/can-hang-phan-cap-the`.
- **Nguồn:** audit `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` mục 5 **M17** + **M22**, mục 7
  (nhận xét bố cục từ ảnh). Một trong 6 đợt chạy song song sau U1–U4, U6, U8.
- **Không chạm:** kích thước vùng chạm, cắt chữ/giãn chữ (thuộc U9a). Nút mới dùng cỡ `md` = 44px
  hoặc `sm` + `tap-44` đúng bằng vùng chạm cũ.

## Vấn đề

1. **Nút chính khác màu theo trang** (M17): Luyện tập có hai CTA đỏ + cam cạnh nhau; Ghi chú dùng
   `blue-500/600` lệch accent cho nút, tab và ô nhập.
2. **`Button`/`buttonClass` của `packages/core-ui` tự TẮT viền lấy nét chung**
   (`focus-visible:outline-none` + `ring-accent-400`) — đúng loại vòng accent mà audit C1 đo chỉ
   ~2,6:1 ở Blue sky. Chuyển nút sang hệ thiết kế là làm TỤT tương phản viền lấy nét.
3. **`transition-all` làm viền lấy nét hiện dần** (~200ms, skill ui-ux mục 10.A.1/A.4). Còn trên
   mọi trang qua `BottomNav` (10 chỗ) + nút Đồng Hành AI ở header. Lưu ý: `transition-colors`
   của Tailwind 4 CŨNG liệt kê `outline-color` (đo bằng `getComputedStyle`).
4. **Phân cấp chữ ngược** (mục 7): ở Luyện tập tiêu đề MỤC (`h2`, 12px, ba màu) nhỏ hơn tiêu đề
   THẺ bên trong (14px); hai thẻ nổi bật đứng liền nhau tiêu đề 16px vs 18px. Tiếng Anh home: hai
   mục ngang cấp một mục 12px xám, một mục 14px trắng.
5. **Không căn hàng**: Trang chủ (lưới môn, 1440px) nút "Thử 5 phút" lệch dọc giữa thẻ có dòng lối
   tắt (Tiếng Anh) và thẻ không có (Toán học).
6. **M22 trang dài/lặp**: chi tiết hướng Web 12.074px ở 390px; lộ trình `principal-ai` 11.551px với
   hộp "Bài kiểm sau chặng — Mở bài kiểm" lặp 32 lần; dòng > 80 ký tự ở Lập trình home (mô tả khoá
   chạy hết bề ngang nút), Giới thiệu, lộ trình.

## Đã làm

**Hệ thiết kế (`packages/core-ui`)**

- `buttonStyles.ts`: thêm biến thể **`outline`** (viền `line-strong`, nền trong suốt, chữ
  `content`). Bộ chuẩn theo audit = `primary` (chính, accent) · `secondary` (phụ) · `outline`
  (viền) · `danger` (nguy hiểm); `ghost` giữ cho nút dạng chữ (7 chỗ đang dùng, có gạch chân).
  **Bỏ** `focus-visible:outline-none` + `ring-accent-400` → nút dùng viền chung `--focus-ring`
  (≥ 3:1 ở cả 3 theme). `Button.test.tsx` đổi theo: canh KHÔNG còn `outline-none`/`ring`, có
  `transition-colors`, không `transition-all`.
- `cardStyles.ts` (mới): ba hằng thang chữ `SECTION_TITLE_CLASS` (tiêu đề mục, 16px semibold
  `text-content`) · `FEATURE_TITLE_CLASS` · `FEATURE_DESC_CLASS` (mô tả thẻ nổi bật, `max-w-xl`).
- **Bề rộng container:** đo lại ở 1440px — mọi trang ưu tiên đã dùng `PageShell` và rơi đúng 3 bề
  rộng: `reading` 768px (Giới thiệu) · `standard` 1152px · `fluid` (Trang chủ, tự co theo cột).
  `wide` (1280px) chỉ còn một chỗ dùng có điều kiện (bài học Lập trình có hai rail) nên GIỮ. Không
  đổi `PageShell`. 11 bề rộng mà audit đếm nằm ở các trang NGOÀI phạm vi đợt này (xem nợ).

**Viền lấy nét tức thì (`apps/dhcb/src/index.css`)**

- Luật `:focus-visible { transition-property: … }` đặt NGOÀI `@layer` (thắng utility): khi phần tử
  vừa nhận tiêu điểm, danh sách thuộc tính chuyển động bỏ `outline-*` và `box-shadow` (vòng
  `ring-*`), giữ màu/nền/viền/độ mờ/transform. Trình duyệt lấy `transition-property` của style
  SAU khi đổi trạng thái, nên viền hiện đủ dày, đủ màu ngay khung hình đầu — áp cho cả ~150 chỗ
  `transition-all` chưa gỡ. Thời lượng vẫn lấy từ class của phần tử.
- `summary:focus-visible` vào luật viền chung (khối gập mới bên dưới).

**Gỡ `transition-all`** ở `Layout.tsx` (1), `BottomNav.tsx` (10), `Practice.tsx` (7),
`EnglishHome.tsx` (4), `PvPArenaCard.tsx` (1), thanh tiến độ `ProgrammingHome.tsx` (→
`transition-[width]`): có `scale`/`translate` → `transition`, chỉ đổi màu → `transition-colors`.
Toàn kho (không tính file test): 172 → **151**.

**Trang ưu tiên**

- **Luyện tập:** "Mở sổ lỗi & ôn tập" → `primary` (accent); "Vào đấu trường" (`PvPArenaCard`, dùng
  chung với studio Thử thách) → `secondary`. Hai thẻ nổi bật cùng thang tiêu đề/mô tả, cùng đệm
  `p-4 sm:p-5`, bỏ `mb-6` thừa (thẻ cha đã có `space-y`). Ba tiêu đề mục cùng
  `SECTION_TITLE_CLASS` (bỏ chấm xanh và hai màu accent/blue).
- **Ghi chú:** "Thêm …" (4) + nút lưu trong 4 modal → `primary`; "Bảng Kanban", "Làm mới", "Huỷ"
  (4) → `outline`; tab đang chọn, biểu tượng tải, chấm/đường dẫn → accent; 17 ô nhập
  `focus:border-blue-500 focus:outline-none` → `focus:border-accent-500` (trả lại viền lấy nét
  chung cho ô nhập). Hàng công cụ `flex-wrap` (xem bằng chứng: bắt được tràn 29px ở 390px).
- **Trang chủ:** `SubjectSpaceList` — thẻ desktop là cột flex, hàng hành động `mt-auto`.
- **Tiếng Anh home:** hai tiêu đề mục cùng thang; hai nút "quay lại sau khi bỏ bẵng" →
  `outline` + `secondary` (bản cũ thiếu `theme-light:text-accent-800`).
- **Lập trình home:** mô tả khoá ngắn + lộ trình mục tiêu `read-measure`.
- **Giới thiệu môn Lập trình:** `<dd>` nội dung khoá `read-measure` (95 → ≤ 71 ký tự/dòng).
- **Chi tiết hướng (M22):** khối gập mới `components/Disclosure.tsx` (`<details>` gốc). Danh sách
  module của mỗi chặng và năm khối kiến trúc GẬP sẵn (đoạn giới thiệu vẫn hiện; chi tiết đầy đủ
  còn ở trang chặng). Nút: "Chọn hướng này" `primary`/"Bỏ theo" `outline`; "Vào học chặng này"
  `primary`; "Mở chặng …" `secondary`; từ `sm` các nút theo bề ngang nội dung, hai nút cuối chặng
  chung một hàng (hết mẫu nút kéo dài 1.100px ở desktop).
- **Lộ trình mục tiêu (M22):** `PathStageQuiz` có prop `inline` — MỘT nút viền "Mở bài kiểm" nằm
  cùng hàng "Vào học chặng này"; khung câu hỏi mở ra chiếm một dòng riêng. Tên đọc kèm tên chặng
  ("Mở bài kiểm sau chặng <tên>") — trước đây 32 nút cùng một tên (WCAG 2.4.6); chữ hiển thị nằm
  trọn trong tên đọc (2.5.3), nên bộ chờ `/Mở bài kiểm/` của `e2e/a11y.spec.ts` vẫn khớp. Bỏ dòng
  "Chặng này chưa có bài kiểm." ở trang lộ trình (vẫn giữ ở trang chặng). Các đoạn mô tả
  `read-measure`. Trang chặng riêng giữ dạng khối cũ.

**Cổng chặn tái phát** — `apps/dhcb/src/pages/core/DesignSystem.design.test.ts` (mới): số
`transition-all` toàn kho chỉ được giảm (mốc 151); 12 file ưu tiên không còn `transition-all`
trong class; luật `:focus-visible` ngoài `@layer` tồn tại và không chứa `outline`/`box-shadow`/`all`;
`summary` có viền token; Luyện tập/Đấu trường dùng `buttonClass`, Ghi chú không còn
`bg-blue-500/600`; lộ trình dùng `PathStageQuiz inline`, chi tiết hướng có ≥ 2 khối gập. Thêm
`Disclosure.test.tsx`, ca `inline` trong `PathStageQuiz.test.tsx`; sửa
`ProgrammingPathPage.test.tsx` (đếm đúng 1 nút/chặng). Skill ui-ux (+ gương `.agents/`) thêm mục
"Nút & thẻ".

## Số đo trước/sau (Blue sky, đăng nhập giả lập, script Playwright ngoài repo)

| Trang                                       | Cao 390px trước → sau | Cao 1440px trước → sau | `transition-all` trên trang | Dòng dài nhất 1440px |
| ------------------------------------------- | --------------------- | ---------------------- | --------------------------- | -------------------- |
| Chi tiết hướng Web                          | 12.074 → **6.687**    | 8.988 → **4.865**      | 11 → 0                      | 72                   |
| Lộ trình `principal-ai`                     | 11.551 → **9.183**    | 8.883 → **7.259**      | 11 → 0                      | 100 → **77**         |
| Giới thiệu môn Lập trình                    | 3.835 → 3.835         | 2.766 → 2.812          | 11 → 0                      | 95 → **71**          |
| Lập trình home                              | 4.232 → 4.232         | 2.925 → 3.140 (*)      | 12 → 0                      | ≤ 73                 |
| Trang chủ · Luyện tập · Ghi chú · Tiếng Anh | ±50px                 | ±50px                  | 10–19 → 0                   | ≤ 72                 |

(*) Lập trình home cao thêm 215px ở 1440px vì mô tả khoá nay xuống dòng ở ~60 ký tự thay vì chạy
140+ ký tự — đánh đổi có chủ ý của `read-measure`.

Viền lấy nét đo trực tiếp trên một nút VẪN khai `transition-all` (Góc học tập): một khung hình sau
`focus()` bằng bàn phím → `outline-width: 2px`, màu `rgb(3,105,161)` (= token `--focus-ring`),
`transition-property` còn `color, background-color, border-color, …` (không `outline`).

## Bằng chứng kiểm chứng

- `npm run lint` (0 cảnh báo) ✅ · `npm run typecheck` ✅ · Prettier ✅ · `npm run build` ✅ ·
  `npm run test:coverage` **794 file / 18507 test** ✅ (đạt ngưỡng; lần đầu đỏ 2 test: regex
  không chịu xuống dòng sau Prettier, và test lộ trình bám chữ "Bài kiểm sau chặng" cũ — đã sửa).
- E2E `a11y.spec.ts` + `a11y-aaa.spec.ts` + `programming-path.spec.ts`: **388/388** ✅ (3 theme).
- E2E chạm vùng liên quan (`landmark-title`, `route-alias`, `practice-fillblank`,
  `home-clarity-evidence`, `bottomnav`, `mobile-layout-guards`, `modal-sticky-header`,
  `practice-direction`, `v2-hubs`, `u6-user-preferences`): lượt đầu **102/104** — 2 đỏ THẬT ở
  `mobile-layout-guards`: `/ghi-chu` tràn ngang 29px ở 390 và 320 (nút chuẩn `whitespace-nowrap`
  rộng hơn bản tự ghép). Sửa bằng `flex-wrap` hàng công cụ → **8/8** ✅.
- Tự đo tràn ngang 320 + 390px trên 10 route đã chạm (gồm `huong/architecture`, `/ban-dong-hanh`
  vì `PvPArenaCard`): 0px tràn trang; không nút nào bị cắt chữ.
- **Tầng 8b** (1440 + 390px, trước/sau, tự xem ảnh):
  - Luyện tập: còn MỘT nút đặc màu accent ("Mở sổ lỗi & ôn tập"); "Vào đấu trường" nền accent
    nhạt; hai thẻ nổi bật cùng cỡ tiêu đề; ba tiêu đề mục 16px đậm, lớn hơn tiêu đề thẻ.
  - Trang chủ 1440: "Thử 5 phút" của Tiếng Anh và Toán học cùng một đường ngang (y≈1028).
  - Ghi chú (giả lập 1 việc, 1 dự án): "Thêm công việc" accent; "Bảng Kanban"/"Làm mới" nút viền;
    tab "Công việc" nền accent nhạt thay xanh dương đậm.
  - Chi tiết hướng Web 390: mỗi chặng còn tiêu đề → "Xem 5 module của chặng" (gập) → khối bài học
    → dự án → hai nút; khối kiến trúc còn đoạn giới thiệu + "Xem kiến trúc chi tiết (19 mục)".
  - Lộ trình 1440: mỗi chặng một hàng "▶ Vào học chặng này" + "Mở bài kiểm", hết hộp viền lặp.
  - 390px Luyện tập/Tiếng Anh/Trang chủ: không tràn, nút giãn đủ bề ngang thẻ như cũ.

## Đề xuất — chờ chủ dự án xác nhận

1. **Gập sẵn** danh sách module chặng + khối kiến trúc ở trang chi tiết hướng (nội dung vẫn trong
   DOM, Ctrl+F tự mở). Nếu muốn mở sẵn chặng đầu: một prop `defaultOpen`.
2. Bộ nút chuẩn là 4 biến thể audit + `ghost` dạng chữ (không gộp `ghost` vào `outline` vì 7 chỗ
   đang dùng `ghost` có gạch chân như liên kết).
3. Bỏ dòng "Chặng này chưa có bài kiểm." ở trang LỘ TRÌNH (thiếu nút là đủ nghĩa).

## Nợ còn lại (phiên điều phối đồng bộ vào `PROGRESS.md`)

- **M17 chưa trọn:** ~840 `<button>` tự ghép class ngoài 7 trang ưu tiên; 151 `transition-all`
  (cổng chỉ cho giảm); 11 bề rộng nội dung ở các trang chưa chuyển (Hồ sơ, Cài đặt, bài học,
  Truyện…). Gợi ý đợt sau: Cài đặt, Hồ sơ, Ôn tập, Góc học tập.
- Lộ trình mục tiêu: nút "Học bậc này" ở khối nền tảng và trang chặng lộ trình còn class tự ghép
  (màu đã là accent, chỉ chưa qua `buttonClass`).
- Thẻ môn ở Luyện tập giữ viền màu riêng từng môn (blue/cyan/amber/emerald/purple/teal) — là màu
  nhận diện môn, cần quyết định thiết kế riêng nếu muốn thống nhất.
- Nhịp khoảng cách dọc Trang chủ (12 → ~70 → ~45px, audit mục 7) và M18 (dải 1024–1279) chưa làm.
- Khối gập làm nội dung bên trong ra khỏi lượt quét axe khi đóng (axe chỉ quét phần đang hiện);
  class chữ bên trong giữ nguyên như trước nên tương phản không đổi.
