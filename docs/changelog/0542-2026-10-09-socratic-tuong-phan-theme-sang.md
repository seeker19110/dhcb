# 0542 — Thẻ Socratic: sửa tương phản theme sáng + nút "Đổi chủ đề" ở màn hẹp (2026-10-09)

- **Ngày:** 2026-10-09 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(a11y)`
- **Nguồn:** hai vấn đề cũ ghi ở mục rủi ro của changelog 0538 (ảnh Tầng 8b).
- **Dựng trên:** `origin/claude/gracious-maxwell-josnm0` (PR #1285 đang mở) để không xung đột.

## Nguyên nhân

`SocraticDiagnosticsCard` dùng nền `bg-violet-950/40`, `bg-red-950/30`, `bg-emerald-950/30`,
`bg-amber-950/30` — các lớp `-950` KHÔNG đổi theo theme. Ở theme nền sáng (Blue sky, Nhi đồng) nền
vẫn tối trong khi chữ đã chuyển sang `theme-light:text-violet-800/900` → chữ tím trên nền tím đậm.
Các thẻ khác của dự án đã dùng khuôn `bg-X-950/N theme-light:bg-X-100`; thẻ này bị sót.

## Đã làm (`apps/dhcb/src/components/CompanionVoice/SocraticDiagnosticsCard.tsx`)

- Thêm `theme-light:bg-*-100` cho: ô "Câu hỏi dẫn dắt" (violet), thẻ chủ đề đang chọn (violet), khung
  lỗi mẫu (red), khung phản hồi đúng/chưa đúng (emerald/amber), banner đột phá (gradient emerald→teal).
  Chữ theme sáng chỉnh lên `violet-950`/`violet-900`/`red-900` — toàn bằng token Tailwind có sẵn.
- Nhãn "Bạn:" ở theme tối: `emerald-400` → `emerald-300` (6,35 → 8,09:1).
- Placeholder ô nhập: `placeholder-slate-500` (màu cố định) → `placeholder:text-content-muted` (token).
- Header: bỏ `flex-col` ở màn hẹp — nút "Đổi chủ đề" nằm cùng hàng tiêu đề (trước đây đứng lẻ một hàng và
  bị kéo giãn 316×28 px); nay 44×44 px (`min-h-11 min-w-11`) + `aria-label="Đổi chủ đề"`.

## Số đo tương phản (tính từ màu render thật, đã trộn alpha lên nền cha; trước → sau)

| Phần tử                         | blue-sky     | dark-blue     | kid          |
| ------------------------------- | ------------ | ------------- | ------------ |
| Nhãn "Câu hỏi dẫn dắt:"         | 3,09 → 9,29  | 7,53 → 7,53   | 3,15 → 9,29  |
| Nội dung câu hỏi                | 3,09 → 12,83 | 11,77 → 11,77 | 3,15 → 12,83 |
| Huy hiệu "Q1"                   | 3,37 → 7,29  | 8,12 → 8,12   | 3,41 → 7,29  |
| Phản hồi "Chính xác…" (emerald) | 4,22 → 8,47  | 10,40 → 10,40 | 4,32 → 8,47  |
| Phản hồi "Chưa đúng…" (amber)   | 3,97 → 8,13  | 10,91 → 10,91 | 4,09 → 8,13  |
| Nhãn "Bạn:"                     | 7,81 → 7,81  | 6,35 → 8,09   | 8,04 → 8,04  |

Mọi chữ đọc trong thẻ sau sửa ≥ 7:1 ở cả 3 theme (nút "Gửi phản tư" khi tắt: 7,1–8,2).

## Cổng a11y có thấy thẻ này không?

Thẻ nằm ở studio "Ghi nhớ" của `/ban-dong-hanh` — `e2e/a11y-aaa.spec.ts` và `e2e/a11y.spec.ts` có quét
studio này ở 3 theme, nên **trạng thái chọn chủ đề được quét**. Nhưng ô "Câu hỏi dẫn dắt" chỉ hiện SAU khi
bấm "Bắt đầu đối thoại" (phiên đang chạy) → cổng không thấy, nên lỗi tồn tại lâu không bị bắt.
**Nợ còn lại (không làm trong đợt này):** thêm một ca e2e mở phiên (mock `/api/socratic-diagnostics`) rồi
quét AAA — nên đề xuất thành việc riêng.

## Tầng 8b

Ảnh 1440px + 390px, blue-sky / dark-blue / kid, trước/sau (Playwright, mock API bằng `page.route`) đã chụp
và xem; không đổi ở 1440px ngoài nút reset to hơn (44px) và màu theme sáng.

## Kiểm chứng

`rm -rf packages/*/dist && npm run typecheck`, `npm run lint`, `prettier --check`,
`vitest run apps/dhcb/src/components/CompanionVoice`, `scripts/changelog.test.ts`.
