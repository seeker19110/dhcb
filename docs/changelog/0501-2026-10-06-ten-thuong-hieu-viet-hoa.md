# 0501 — Tên thương hiệu viết hoa từng chữ ở tiêu đề tab, hub và trang giới thiệu (2026-10-06)

- **Ngày:** 2026-10-06 · **PR:** #1249 · **Loại:** `fix(copy)`.
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

- Cổng trên cây cuối (sau `rm -rf packages/*/dist dist dist-server`): typecheck ✅ · lint 0 cảnh báo ✅
  · `prettier --check .` ✅ · `test:coverage` ✅ 801 file / 18637 test, coverage 95,10 / 90,98 / 95,69 /
  95,76 · build ✅ · size-limit JS 153,78/160 kB, CSS 24,1/26 kB.
- E2E: `landmark-title`, `hub-reflow`, `a11y-exam-plan`, `smoke`, `lang-of-parts` — 47/47 xanh.
- Tầng 8b, ảnh trước (c333356) / sau, 1440px + 390px, đã tự xem:
  - Hub 1440: logo "Đồng hành cùng bạn" → "Đồng Hành Cùng Bạn", rộng thêm ~6px, thanh nav không vỡ
    thêm (mục "Các trụ"/"Cách hoạt động" vốn đã 2 dòng từ trước). Hub 390: chỉ hiện biểu tượng — không đổi.
  - `/welcome` 1440 + 390: dòng "một môn của nền tảng Đồng Hành Cùng Bạn" xuống dòng như cũ, không
    tràn; tiêu đề tab đo bằng `document.title` đổi đúng sang viết hoa.
