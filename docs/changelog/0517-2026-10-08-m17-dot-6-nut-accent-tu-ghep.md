# 0517 — M17 đợt 6: nút accent đặc tự ghép class → `buttonClass` (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (điền khi tạo) · **Loại:** `style(ui)` · **Nhánh:**
  `claude/peaceful-newton-czolhg` (dựng lại từ `main` sau khi #1267 merge).
- **Nguồn:** nợ còn lại của `0515`/`0516` ("~145 nút accent tự ghép, cùng màu nhưng khác cỡ/bo góc"),
  audit `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md` **M17**. Chủ dự án: "tiếp tục đợt nút
  accent tự ghép".

## Phân loại 144 chỗ `bg-accent-500/600` đặc (grep trên `main` `d944079`)

| Loại                                                                             | Số  | Xử lý                |
| -------------------------------------------------------------------------------- | --- | -------------------- |
| Nút hành động tự ghép (`className="…bg-accent-500 … hover:bg-accent-400…"`)      | 76  | → `buttonClass`      |
| Hằng class nút dùng lại (`Onboarding.primaryClass`) + 2 nút class nhiều dòng     | 3   | → `buttonClass`      |
| Thanh tiến độ, cột biểu đồ, chấm lịch, vạch bước, công tắc bật/tắt, quầng nền mờ | ~40 | giữ — không phải nút |
| Ô/tab/chip ĐANG CHỌN (`isActive ? 'bg-accent-500…' : …`), huy hiệu, số thứ tự    | ~22 | giữ — trạng thái     |
| Nút gửi đổi màu theo ô nhập (`canSend ? 'bg-accent-500 hover…' : 'bg-zinc…'`) ×4 | 4   | giữ — trạng thái     |

Vì sao cùng màu mà vẫn đổi: 76 nút có **4 kiểu bo góc** (`lg`/`xl`/`2xl`/`full`), **6 mức đệm dọc**
(`py-1.5`…`py-4`), **3 mức mờ khi vô hiệu** (40/50/60), `active:scale-*`/`hover:scale-*` rải rác, và
**một lỗi tương phản thật**: `AddFriend.tsx` nút "Kết bạn" chữ `#fff` trên nền accent (~2,3:1, trượt AA
4,5:1) — nay chữ `#09090b` cố định của `primary`.

## Đã làm

- 56 file (app 54 + hub 2). Cỡ chọn theo đệm cũ để chiều cao gần như không đổi:
  `py-3`/`py-3.5`/`py-4` → `lg` (48px); `py-2`/`py-2.5` → `md` (44px); nút chữ nhỏ dày đặc
  (`text-xs`, `py-1.5`) → `sm` + `tap-44` (vẫn ≥ 44px vùng chạm). Giữ lớp bố cục (`w-full`→`fullWidth`,
  `flex-1`, `mt-*`, `shrink-0`, `sm:w-auto`).
- Hero tiếp thị (`Landing`/`LandingEn` CTA cuối, hub) giữ cỡ lớn ở màn rộng bằng biến thể đáp ứng
  (`lg:h-14 lg:px-14 lg:text-lg`, `sm:h-14 sm:px-8`) — biến thể `sm:`/`lg:` luôn sinh SAU lớp gốc nên
  thắng `h-12` mà không phụ thuộc thứ tự viết.
- Hub: nút "Nền tảng gồm những gì?" cạnh CTA hero `py-3.5` → `h-12` để hai nút cùng cao 48px. Hub
  KHÔNG có token ngữ nghĩa (`line-strong`, `content`) nên chỉ dùng được `primary` (thang `accent` có
  sẵn) — không dùng `outline`/`ghost` ở hub.
- Cổng `DesignSystem.design.test.ts`: "0 chuỗi `className="…"` tự ghép nền accent đặc kèm hover accent"
  trên app + hub + packages. Kiểm chứng: chạy test trên mã cũ → đỏ; mã mới → xanh.

## Bằng chứng

- **Tầng 8b** (Blue sky, 1440 + 390px, trước/sau, so điểm ảnh): Trang chủ, Bạn bè, Lập trình, Đăng nhập
  khách giống hệt từng điểm ảnh; Xếp lớp, Ôn tập: chỉ khác bo góc `2xl` → `xl`, cùng chiều cao; Onboarding
  khác ở hình minh hoạ đang chạy hiệu ứng (không phải nút); Bạn Đồng Hành khác ở avatar chớp mắt + đồng
  hồ; hub: nút hero 52 → 48px, nút đầu trang 32 → 36px, trang thấp đi 4px (1440) / 12px (390).
- Cổng local: typecheck (xoá `dist` trước) · lint · prettier · `test:coverage` — xem mục báo cáo PR.
- E2E: `a11y` + `a11y-aaa` (AA + AAA, 3 theme) · `hub-reflow` · `page-width` · `mobile-layout-guards` ·
  `a11y-intake` — xem mục báo cáo PR.

## Còn mở

- M17 coi như đóng phần nút: nút đặc accent tự ghép = 0, có cổng. Các nút `zinc`/viền trung tính tự
  ghép (Hủy, Quay lại…) chưa chuyển sang `outline`/`ghost` — không lệch màu thương hiệu, để khi chạm tới.
