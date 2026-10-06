# 0501 — Tên thương hiệu viết hoa từng chữ ở tiêu đề tab, hub và trang giới thiệu (2026-10-06)

- **Ngày:** 2026-10-06 · **PR:** (điền sau khi tạo) · **Loại:** `fix(copy)`.
- **Nguồn:** đề xuất 3 của changelog `0499` (PR #1246). Chủ dự án chốt cả 3 đề xuất ngày
  2026-10-06; với đề xuất 3 chọn **đổi sang viết hoa** "Đồng Hành Cùng Bạn" cho thống nhất với
  header, trang đăng nhập, hub và PWA. Đề xuất 1 (PWA `short_name` "Đồng Hành") và 2 (trang giới
  thiệu ẩn thanh điều hướng với mọi người) đã có hiệu lực từ #1246, không đổi gì thêm.

## Đã làm

- **Tiêu đề tab:** `BRAND_TITLE` (`apps/dhcb/src/lib/usePageTitle.ts`) và ~50 lời gọi `usePageTitle`
  đổi "Đồng hành cùng bạn" → **"Đồng Hành Cùng Bạn"**. Regex hậu tố vốn không phân biệt hoa thường
  nên tiêu đề cũ truyền vào vẫn được chuẩn hoá về đúng một hậu tố viết hoa.
- **Gỡ ngoại lệ "Your Companion"** trong `formatPageTitle`: nó chỉ phục vụ tiêu đề tab tiếng Anh
  của trang Luyện tập — nay trang đó cũng mang thương hiệu chung ("Practice | Đồng Hành Cùng Bạn").
  Các chỗ "Your Companion" còn lại là tên tiếng Anh của tính năng Bạn Đồng Hành, không phải tên
  thương hiệu, nên giữ.
- **Sửa lỗi ca biên có sẵn:** `formatPageTitle('Đồng Hành Cùng Bạn')` từng trả về
  "Đồng Hành Cùng Bạn | Đồng Hành Cùng Bạn" (regex hậu tố cần dấu `|`/`·` đứng trước). Chưa trang
  nào gọi đúng ca này; test mới bắt được nên sửa luôn.
- **Chữ hiển thị:** logo chữ + nhãn liên kết ở hub (`App.tsx`, `HubLogin.tsx`), câu hỏi FAQ của hub,
  dòng "một môn của nền tảng …" ở `/welcome` và `/learn-vietnamese` cùng tiêu đề/mô tả đặt bằng JS
  của hai trang đó.
- **Không đổi:** `apps/hub/index.html` (siêu dữ liệu thuộc đợt U7, chưa merge — U7 nên dùng tên
  viết hoa khi sửa mô tả), câu tiêu đề hub "… đồng hành cùng bạn trên cả chặng đường" (cụm từ
  thường, không phải tên), chuỗi mẫu trong `userDataCrypto.test.ts` (chỉ là dữ liệu thử mã hoá).

## Test

- Mới: `apps/dhcb/src/lib/usePageTitle.test.ts` — 6 ca (thương hiệu, tiêu đề trần, tiêu đề có phần,
  chuẩn hoá hậu tố cũ viết thường, tiêu đề tiếng Anh, chỉ thương hiệu/rỗng).
- Cập nhật theo chuỗi mới: `e2e/landmark-title.spec.ts` (`BRAND` — test này canh mọi tiêu đề tab
  kết thúc đúng bằng thương hiệu, nên nay canh luôn chữ hoa), `e2e/hub-reflow.spec.ts`,
  `e2e/a11y-exam-plan.spec.ts` (bỏ tên thương hiệu trước khi dò dấu tiếng Việt — thêm cờ `i`).

## Bằng chứng

(điền sau khi chạy cổng)
