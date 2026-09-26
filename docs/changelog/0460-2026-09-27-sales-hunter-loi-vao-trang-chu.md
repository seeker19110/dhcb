# Lối vào Sales-Hunter ở trang chủ (ứng dụng riêng, mặc định chưa mở truy cập)

- **Ngày:** 2026-09-27 · **PR:** [#1183](https://github.com/seeker19110/dhcb/pull/1183)
- **Loại:** `feat(platform)`. Đặc tả: `docs/research/sales-hunter-platform-integration-2026-09-26.md`
  (chủ dự án duyệt 2026-09-27). Runtime Sales nằm ở repo riêng (Sales-Hunter PR #46).

## Đã làm

- Khối "Sales-Hunter · Ứng dụng riêng của Đồng Hành" ở trang chủ (desktop: rail phụ bên phải;
  mobile: cuối luồng chính), dạng `<details>` mở bằng bàn phím. Mặc định ghi "Chưa mở truy cập", KHÔNG có link.
- Chỉ đúng cờ build `VITE_SALES_HUNTER_PILOT_ENABLED=true` mới hiện link cố định
  `https://sales.donghanhcungban.org` (tab mới, `noopener noreferrer`, `referrerPolicy=no-referrer`,
  không truyền token/danh tính). Cờ chỉ quyết định có hiện lối vào hay không, KHÔNG phải phân quyền.
- Không chung phiên, dữ liệu, gói thanh toán với Learning; không khôi phục trụ nào đã gỡ.

## Sửa khi tích hợp (bản đầu đỏ E2E 4/6 mảnh)

Bản đầu gắn khối vào `main.tsx` nên nó hiện ở cuối MỌI trang: rớt AAA ở `/goc-hoc-tap/physics/on-tap`,
rớt ma trận S07 (reflow/44px ở 768px), vỡ bố cục English 320/390px. Đã sửa:

- Dời khối vào `Home.tsx`, chỉ ở trang chủ, chỉ với giao diện tiếng Việt (chưa có bản chiều B).
  Desktop đặt ở rail phụ (sticky, tự cuộn): đặt cuối cột chính làm trang cao 1539px, vượt ngân
  sách 1459px của cổng UX-R2 (`home-clarity-evidence.spec.ts`, CI đỏ mảnh 4/6) — không nới ngân sách.
- Đổi sang kiểu thẻ của trang chủ; chữ nội dung `text-zinc-200` đạt AAA ở 3 theme.
- Bỏ `lazy()` + `Suspense` riêng: nó làm test `Home.test.tsx` đỏ ngẫu nhiên (2/13 ca, đo 3 lượt)
  do render lệch nhịp. Giữ error boundary. Chạy lại 5 lượt: 43/43 xanh cả 5.
- Dòng "Chưa mở truy cập" thiếu `read-measure` nên dài 100 ký tự/dòng ở 768px, vượt trần 3 đoạn
  của cổng `learning-ux-layout.spec.ts` (CI đỏ lần hai). Đã thêm; cổng xanh.
- Đánh lại số changelog `0457` → `0460` (trùng số với đợt hoạt ảnh Vật lí).

## Bằng chứng

- `e2e/sales-hunter-entry.spec.ts` 4/4 xanh. **Đối chứng âm:** hạ chữ về `text-zinc-500` thì
  `color-contrast-enhanced` đỏ đúng 3/3 theme.
- `a11y.spec.ts` + `a11y-aaa.spec.ts` cho `/` (13 ca) xanh; `home-clarity-evidence.spec.ts` 7/7 xanh.
- Ảnh Tầng 8b 1440px (dark-blue, rail phụ) + 390px (blue-sky, cuối luồng chính), khối đang mở:
  không tràn ngang, không lặp nội dung.

## Còn mở (không thuộc PR này)

Staging/HTTPS/Access/backup-restore phía Sales chưa làm. Chỉ bật cờ sau khi Sales nghiệm thu.
