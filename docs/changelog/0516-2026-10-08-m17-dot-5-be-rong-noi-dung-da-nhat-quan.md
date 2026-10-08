# 0516 — M17 đợt 5: bề rộng nội dung — đo lại, đã nhất quán, thêm cổng (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (điền khi tạo) · **Loại:** `test(e2e)` · **Nhánh:**
  `claude/peaceful-newton-czolhg` (dựng lại từ `main` sau khi #1266 merge).
- **Nguồn:** nợ "bề rộng nội dung" của `0515`, audit `docs/audit/2026-09-30-audit-ui-ux-chuan-2026.md`
  **M17** ("11 bề rộng nội dung khác nhau ở 1440px: 448 → 1152px; `PageShell` ở 49/95 file trang").
  Chủ dự án: "tiếp tục đợt bề rộng nội dung".

## Đính chính `0515`

`0515` ghi "`PageShell` ở 64/95 file trang, 31 trang còn tự đặt `max-w-*`". **Sai.** 95 là số file `.tsx`
trong `pages/` gồm cả thành phần con. Liệt kê 31 file "không dùng `PageShell`": 28 là mô phỏng, tab,
bài luyện, thanh công cụ bài hội thoại (nằm BÊN TRONG một trang đã có khung); còn `Onboarding` và
`GameChrome` là luồng toàn màn hình với `max-w-sm` có chủ đích. **Không có trang nào thiếu khung.**

## Đo thật (Blue sky, đăng nhập giả lập, 1440px, 40+ route; 1024px, 42 route)

Spec Playwright tạm (đã xoá) đọc `getBoundingClientRect()` của `<main id="noi-dung-chinh">` và các khối
con trực tiếp.

| Bề rộng `<main>` @1440 | Số route | Nguồn / lý do                                                                |
| ---------------------- | -------- | ---------------------------------------------------------------------------- |
| **1152**               | 30       | `PageShell width="standard"` — chuẩn, thẳng mép header                       |
| **1184**               | 9        | `width="fluid"` — co theo viewport trừ thanh bên 256px (Trang chủ, Tiến độ…) |
| **768**                | 3        | `width="reading"` — Cài đặt, Giới thiệu, Xếp lớp (chủ yếu chữ)               |
| 448 (khối con)         | 2        | biểu mẫu một cột `/bat-dau`, `/bat-dau/doi-song` — có chủ đích               |

Mọi khối con trực tiếp của `<main>` chiếm đủ bề rộng (`main − 32px` đệm); ở 1024px còn đúng ba giá
trị 768 / 952 / 1024 (rail thu gọn của M18). Tức "11 bề rộng" của audit đã được các đợt U1–U9 + 0500/0501
thu về bốn giá trị, mỗi giá trị một lý do. Không sửa mã giao diện ở đợt này.

## Đã làm

- `e2e/page-width.spec.ts` (file mới): 13 route đại diện ở 1440px khoá ĐÚNG bề rộng `<main>` + khối con
  đầu + không tràn ngang; 3 route ở 1024px khoá "cột chính ≥ 900px" (M18). Trang nào tự đặt `max-w-*`
  thay vì chọn loại nội dung của `PageShell` sẽ lệch số và đỏ. **Kiểm chứng cổng:** đổi tạm `EnglishSettings`
  `reading` → `standard` → ca `/cai-dat` đỏ (kỳ vọng 768, nhận 1152); đã khôi phục.
- Đính chính `0515` (xoá nhận định sai) + `PROGRESS.md`: bỏ mục "31/95 trang chưa dùng `PageShell`".

## Bằng chứng

`e2e/page-width.spec.ts`: 16/16 xanh trên dev server. Cổng local: typecheck (xoá `dist` trước) · lint ·
prettier. Không có thay đổi giao diện nên không có ảnh trước/sau (Tầng 8b không áp).

## Còn mở

- ~145 nút accent tự ghép (cùng màu với `primary`, khác cỡ/bo góc) — đợt riêng có ảnh từng trang, vì đổi
  `h-11` làm đổi chiều cao nút ở ~60 file.
