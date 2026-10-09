# 0544 — Cổng a11y cho trạng thái SAU TƯƠNG TÁC của thẻ Companion + header "Nhận thức ngầm" ở 390px (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `test(a11y)` + `fix(a11y)`
- **Dựng trên:** `origin/claude/gracious-maxwell-josnm0` (PR #1288, changelog 0543).
- **Nguồn:** nợ ghi ở mục "Cổng a11y có thấy thẻ này không?" của 0542 và "Tầng 8b" của 0543.

## Vì sao cần lớp bảo vệ thứ hai

`e2e/a11y.spec.ts` (A/AA) và `e2e/a11y-aaa.spec.ts` (AAA nội dung) quét trạng thái BAN ĐẦU của
15 trang × 3 theme. Chữ của các thẻ Bạn Đồng Hành phần lớn chỉ hiện sau khi bấm (phiên đang chạy,
bảng tổng kết, kết quả phát âm, khối mở rộng) hoặc khi API trả dữ liệu — ở E2E không có backend nên
nhiều thẻ ẩn hẳn. Vì vậy lỗi tương phản 0542/0543 sống lâu mà không cổng nào thấy. Cổng tĩnh
`light-theme-tint-guard` (0543) chỉ đòi "có bản theme sáng", không đo tương phản; spec mới bổ sung
phần ĐO trên trang thật.

## Đã làm

**Spec mới `e2e/a11y-interactive-states.spec.ts`** (KHÔNG sửa hai cổng a11y cũ). Mock API bằng
`page.route`, bấm tới từng trạng thái, rồi quét GIỚI HẠN trong khung thẻ: AA 0 vi phạm (cùng bộ tag
với `a11y.spec.ts`) + AAA cho chữ đọc (cùng `AAA_RULE_IDS` + `collectAaaFindings` với
`a11y-aaa.spec.ts`), ở `dark-blue`, `blue-sky`, `kid`. Một test = một thẻ × một theme; các trạng
thái của thẻ quét nối tiếp trên một lần tải trang.

| Thẻ (studio)                   | Trạng thái được quét                                                         |
| ------------------------------ | ---------------------------------------------------------------------------- |
| Scenario Holodeck (Thử thách)  | chọn kịch bản (thẻ đang chọn) · phiên đang chạy · bảng điểm tổng kết         |
| Phát âm 3D (Thử thách)         | kết quả đường cong F0 (kèm sơ đồ khẩu hình)                                  |
| Socratic (Ghi nhớ)             | chọn chủ đề · phiên đang chạy (phản hồi chưa đúng) · đột phá (đúng + banner) |
| Nhận thức ngầm (Ghi nhớ)       | có dữ liệu (thu gọn) · mở chi tiết                                           |
| Workplace Harvester (Kế hoạch) | lỗi đã thu hoạch · thẻ SRS                                                   |
| A2A Mesh (Kế hoạch)            | mở rộng                                                                      |
| Thấu cảm sinh học (Kế hoạch)   | mở rộng, bật lá chắn                                                         |

13 trạng thái × 3 theme = 39 lần quét AA + 39 lần quét AAA, trong 21 test + 3 test đối chứng.

**Helper mới (`e2e/helpers/`):**

- `companionInteractiveMocks.ts` — dữ liệu giả cho 7 thẻ, MỌI bản ghi parse qua hợp đồng Zod thật ở
  `packages/core-contracts` (khuôn `MOCK_APP_SETTINGS`): hợp đồng đổi mà mock không theo thì lỗi lúc
  nạp test, không quét một giao diện production không bao giờ vẽ.
- `scopedA11yScan.ts` — `scanScopedAa` / `scanScopedAaa` giới hạn trong `[data-a11y-scan-root]`, snapshot
  phải ổn định (DOM đổi trong lúc quét ⇒ "unresolved", fail-closed như `scanAaa`).
- `gradientContrast.ts` — **bổ sung duy nhất so với luật của `a11y-aaa.spec.ts`**: chữ trên nền
  gradient (axe bỏ ngỏ `bgGradient`, 93 nút ở lần chạy đầu) được đo bằng điểm dừng TỆ NHẤT: trộn alpha
  từ gốc tài liệu xuống phần tử, mỗi điểm dừng + điểm giữa hai điểm dừng là một nền ứng viên, làm tròn
  XUỐNG. Đạt ngưỡng (chữ đọc 7:1, điều khiển 4,5:1) mới gỡ; rớt thì thành vi phạm có số đo; không chắc
  (tổ tiên `opacity` < 1, `filter`, ảnh `url()`, phần tử khác đè lên chữ…) thì giữ nguyên "incomplete" =
  vẫn đỏ. Ba test đối chứng chứng minh bộ đo không xanh giả.

**Lỗi THẬT spec bắt được và đã sửa** (không thêm ngoại lệ axe, không nới ngưỡng, không hard-code màu):

- `scrollable-region-focusable` (AA, serious) — khung diễn biến hội thoại `max-h-72 overflow-y-auto`
  của **Holodeck** và **Socratic** không nhận focus bàn phím ⇒ không cuộn được bằng phím (WCAG 2.1.1).
  Thêm `role="region"` + `aria-label` + `tabIndex={0}` (kèm `eslint-disable-next-line
jsx-a11y/no-noninteractive-tabindex` có lý do — rule chặn mọi `tabIndex` trên phần tử không tương
  tác, kể cả vùng cuộn; cùng cách xử lý với `CodeSurface`).
- **Phát âm 3D:** nhãn "Vô thanh (không rung)" là `<text fill="#94a3b8">` cỡ ~7px trong SVG — màu cứng,
  ở theme sáng ≈ 2,6:1, axe không đo được. Nay là chữ HTML `text-content-secondary` dưới sơ đồ
  ("Dây thanh: vô thanh (không rung)"). Chú giải "--- Bản xứ | ― Của bạn" từng nằm ĐÈ lên đường cong
  F0 (nền không xác định) — dời xuống dưới biểu đồ.

**VIỆC 2 — header "Nhận thức ngầm" ở 390px** (`SubconsciousInsightsCard.tsx`): khối chữ
`min-w-0 flex-1`, tiêu đề `text-balance`, chip "V3 Autonomous" `whitespace-nowrap` xuống hàng dưới tiêu
đề khi chật; nút "Hợp nhất lại" dưới `sm` chỉ còn biểu tượng 44×44 với `aria-label` (trùng nhãn chữ hiện
lại từ `sm` ⇒ không lệch tên/nhãn, WCAG 2.5.3). Đo ở 390px: trước — tiêu đề 2 dòng + chip bẻ 2 dòng +
nút 77×62 chữ 3 dòng; sau — tiêu đề 2 dòng cân, chip 1 dòng, nút 44×44. Ở 1440px không đổi (nút
115×44, tiêu đề 1 dòng).

## Bằng chứng spec ĐỎ khi đưa lỗi vào

1. Gỡ `theme-light:bg-indigo-50` khỏi thẻ kịch bản đang chọn của Holodeck (biến thể sửa ở 0543) →
   `2 failed | 1 passed` (blue-sky, kid đỏ; dark-blue xanh đúng kỳ vọng):
   `[AA] … color-contrast (serious, 3 phần tử)` + 3 vi phạm `[AAA] … color-contrast`. Trả lại → xanh.
2. Gỡ `theme-light:from-indigo-50 theme-light:to-purple-50` khỏi bảng điểm tổng kết (nền gradient) →
   `2 failed | 1 passed`: `violation: gradient-worst-stop … ratio=1.86 < 7` (blue-sky) / `1.74` (kid) —
   khớp đúng số đo tay của 0543 (1,86 / 1,74). Trả lại → xanh (đã `cmp` file trùng bản trước khi thử).

## Thời gian chạy (để biết có làm chậm shard CI không)

`playwright.config.ts` có `testDir: './e2e'`, CI chạy `npm run test:e2e -- --shard=N/6` ⇒ spec tự vào
shard, không sửa `ci.yml`. Đo máy dev (2 worker): 21 test tổng thời lượng 145,9 s (4,8–10,4 s/test, chậm
nhất là Holodeck 3 trạng thái), wall 1,3 phút; chia 6 mảnh × 2 worker ≈ +12 s mỗi mảnh. `--repeat-each=2`:
48/48 xanh (không chập chờn).

## Tầng 8b

Ảnh 1440px + 390px, blue-sky + dark-blue, trước/sau: thẻ Nhận thức ngầm (thu gọn + mở chi tiết) và thẻ
Phát âm 3D ở trạng thái kết quả — đã tự xem. Holodeck/Socratic chỉ thêm thuộc tính focus cho vùng cuộn,
không đổi hình khi không focus.

## Kiểm chứng

`rm -rf packages/*/dist dist dist-server && npm run typecheck`, `npm run lint`, `prettier --check` file đổi,
`vitest run scripts/light-theme-tint-guard.test.ts scripts/fixed-color-contrast-audit.test.ts
apps/dhcb/src/components/CompanionVoice scripts/changelog.test.ts`, `playwright test
e2e/a11y-interactive-states.spec.ts` + các ca "Bạn Đồng Hành"/Holodeck của `a11y.spec.ts`,
`a11y-aaa.spec.ts`, `companion-catalog-states.spec.ts` — kết quả ghi trong mô tả commit.

## Nợ / rủi ro còn lại

- `scopedA11yScan.ts` lặp lại phần lõi `scanAaa` (watcher + `collectAaaFindings`) vì hàm kia nằm TRONG
  `e2e/a11y-aaa.spec.ts` (cổng được bảo vệ, không import được từ file spec). Khi được phép chạm cổng, nên
  chuyển `scanAaa` sang helper dùng chung. Bản scoped chưa có bước đo lại khi cuộn (`remeasureContrast`):
  chữ bị khung cuộn che sẽ ra "incomplete" = đỏ (an toàn, không xanh giả).
- Bộ đo gradient lấy nền theo chuỗi TỔ TIÊN; phần tử trang trí `pointer-events: none` nằm dưới chữ thì
  `elementsFromPoint` không thấy. Chưa có trường hợp như vậy trong 7 thẻ.
