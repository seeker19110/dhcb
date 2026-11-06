# 0699 — 2026-11-06 — Cổng a11y quét Ghi chú khi có dữ liệu; sửa 3 lỗi a11y thật (AUD-A11Y-001)

## Vấn đề

Audit delta 2026-11-06: `e2e/a11y.spec.ts` quét `/ghi-chu` và `/ghi-chu/kanban` nhưng không mock
`/api/work`, nên trang luôn RỖNG lúc quét — badge ưu tiên, dòng hạn, việc đã xong chưa từng được đo.
Chỉ `scripts/shots-real-data.ts` có dữ liệu, mà script đó chỉ chụp ảnh.

## Sửa

- `mockWorkData` + dữ liệu mẫu chuyển từ `scripts/shots-real-data.ts` sang
  `e2e/helpers/realDataMocks.ts` (dùng chung, không lặp); `REAL_DATA_CASES` thêm `/ghi-chu` và
  `/ghi-chu/kanban`, chờ dòng ngày hiện ra rồi mới quét (3 theme).
- Cổng mới bắt **3 lỗi thật** trên production, đã sửa:
  1. `/ghi-chu`: nút tích hoàn thành chỉ có biểu tượng, **không có tên** (axe `button-name`, critical,
     5 phần tử) → `aria-label` theo tên việc + `aria-pressed`.
  2. `/ghi-chu`: hàng việc đã xong `opacity-60` + tiêu đề `text-zinc-500` gạch ngang → thiếu tương
     phản (serious, 6 phần tử) → bỏ `opacity-60`, tiêu đề `text-zinc-300` (`--text-secondary`, AAA
     mọi theme). Vẫn phân biệt bằng gạch ngang + dấu tích.
  3. `/ghi-chu/kanban`: nút "Làm lại" 11px `text-zinc-500` trên thẻ `opacity-80` → thiếu tương phản
     ở theme sáng → `text-zinc-300`.
- Bài học: dải `zinc` là token ĐẢO theo theme (`--z-*`); `theme-light:text-zinc-800` ở theme sáng là
  màu NHẠT — lần sửa đầu dùng cách này và vẫn đỏ. Dùng thẳng `text-zinc-300`.

## Kiểm chứng

- Trước sửa: 5/6 ca mới đỏ (blue-sky/kid cả hai trang + dark-blue `/ghi-chu`). Sau sửa:
  `playwright a11y -g "ghi-chu"` 12/12 xanh (cả ca rỗng cũ); `e2e/v2-hubs.spec.ts` 4/4; vitest notes 2/2.
- Tầng 8b: chụp `kanban` + `ghi-chu` × blue-sky/dark-blue × 390/1440 trước/sau
  (`npm run shots:real-data`); bố cục không đổi, việc đã xong đọc được mà vẫn phân biệt rõ.
- `tsc -p tsconfig.e2e.json`, `tsc -p tsconfig.api.json`, eslint 3 file: đạt.
