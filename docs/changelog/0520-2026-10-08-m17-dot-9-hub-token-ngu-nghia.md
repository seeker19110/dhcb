# 0520 — M17 đợt 9: hub có token ngữ nghĩa, nút zinc của hub → `buttonClass`; nút biểu tượng admin 44px (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (điền khi tạo) · **Loại:** `style(ui)` · **Nhánh:**
  `claude/peaceful-newton-czolhg`.
- **Nguồn:** phần còn mở của `0518`/`0519` ("hub vẫn tự ghép nút zinc vì chưa có token ngữ nghĩa";
  "nút biểu tượng admin `p-1.5` dưới 44px"). Chủ dự án: "tiếp tục tất cả các đợt còn lại".

## Vì sao hub trước đây không dùng được `outline`/`ghost`

Hub nạp CHUNG `packages/core-ui/theme.css` nên các biến CSS `--border-strong`, `--text-primary`,
`--surface-raised` đã có sẵn. Thứ thiếu chỉ là ÁNH XẠ màu trong `apps/hub/tailwind.config.js`. Thiếu nó,
`border-line-strong` / `text-content` / `bg-surface-raised` là class Tailwind không tồn tại, nên
`buttonClass({ variant: 'outline' })` ở hub ra nút trong suốt, không viền mà không có lỗi build nào.

## Đã làm

- `apps/hub/tailwind.config.js`: thêm ba nhóm `surface` / `line` / `content`, chép đúng từ
  `apps/dhcb/tailwind.config.js`. Test mới trong `apps/hub/src/hubStyle.design.test.ts` so văn bản ba
  khối giữa hai cấu hình (không import được cấu hình app trong test vì nó dựng đường dẫn từ
  `import.meta.url`), nên hai bên lệch nhau là test đỏ.
- 6 nút zinc của hub → `buttonClass`:
  - Đầu trang: "Đăng nhập" → `ghost`, nút hồ sơ (khi đã đăng nhập) → `outline`. Cả hai cùng cỡ với nút
    "Bắt đầu" bên cạnh (`sm`, ở màn ≥ 640px là `sm:h-11 sm:px-4 sm:text-sm`). Lần chụp đầu, "Đăng
    nhập" bị nhỏ chữ (`text-xs` của `sm`) so với "Bắt đầu" nên đã chỉnh lại.
  - Nút hồ sơ trước có `hidden sm:inline-flex` → nay `max-sm:hidden`. `hidden` và `inline-flex` (của
    `buttonClass`) cùng thuộc tính `display`, cùng tầng, nên lớp nào thắng do thứ tự trong stylesheet
    quyết định. `max-sm:` là biến thể, luôn sinh sau, nên luôn thắng.
  - Hero "Nền tảng gồm những gì?" → `outline` `lg` (cùng 48px với CTA chính); lối "Bạn Đồng Hành"
    → `outline`; nút gói ở bảng giá → `outline` `fullWidth` (46 → 44px); `HubLogin` "Đăng xuất khỏi
    tài khoản này" → `outline` `sm` + `tap-44`.
- Cổng zinc của `0518` mở rộng sang `apps/hub/src` (trước chỉ app + packages).
- 5 nút biểu tượng "Tải lại" ở bảng quản trị (`p-1.5`/`p-2`, 28–32px) thêm `tap-44 inline-flex
items-center justify-center` → vùng chạm 44px, biểu tượng vẫn ở giữa.

## Bằng chứng

- Tầng 8b hub (`/`, `/login`; 1440 + 390px; `blue-sky` + `dark-blue`; dev server Vite riêng như
  `e2e/hub-reflow.spec.ts`, trước/sau):
  - Đầu trang: "Đăng nhập" cùng cỡ chữ với "Bắt đầu".
  - Hero: nút phụ từ nền xám đặc → khung viền, cùng 48px.
  - Bảng giá: nút viền, 46 → 44px.
  - Trang dài hơn/ngắn hơn 2–4px do hai nút `py-3` (46px) về 44px.
  - `/login`: giống hệt từng điểm ảnh (nút đổi chỉ hiện khi đã đăng nhập).

- Cổng local (nhánh dựng từ `main` `6f56dfb`): typecheck (xoá `dist` trước) · lint 0 cảnh báo · prettier ·
  build · `test:coverage` **18.858 test** xanh. E2E `hub-reflow` · `admin` · `a11y-admin-intake` · `a11y`
  (15 trang × 3 theme): **336/336 xanh**.
- Cổng zinc mở rộng sang hub: trên hub cũ khớp `HubLogin.tsx` (nút "Đăng xuất…"), nay xanh. Test token
  ngữ nghĩa hub/app: 3 khối trùng nhau.

## M17 sau đợt này

Phần nút + bề rộng của M17 đã xong: `0513`–`0520`, các PR #1264–#1271 và PR của đợt này. Các cổng
chặn tái phát: `transition-all`, CTA lệch accent, accent tự ghép, zinc tự ghép, chữ trắng trên accent,
gradient tự ghép, bề rộng theo `PageShell`. Còn lại của audit 2026-09-30 là quyết định thiết kế (rail
mục lục đứng trước `<h1>` ở 1440px) và việc tay mục A — không phải việc AI tự làm.
