# 0568 — Gỡ dòng quảng cáo Gemini Live khỏi thẻ gói VIP

- **Ngày:** 2026-10-09 · **PR:** (điền sau khi tạo) · **Loại:** `fix(billing)`
- **Nguồn:** chủ dự án quyết "gỡ dòng quảng cáo Gemini Live" (câu hỏi mở ở `PROGRESS.md`, mục
  Gemini Live, sau changelog `0563`).

## Vấn đề

Thẻ VIP ở `/nang-cap` và trang Hồ sơ (`apps/dhcb/src/components/UpgradeSection.tsx`) hứa "Nói
chuyện trực tiếp với gia sư bằng giọng, ngắt lời được như người thật (đang thử nghiệm)". Server có
`/api/gemini-live` + `/ws/gemini-live` nhưng KHÔNG có giao diện nào trong `apps/` dùng nó — người
mua VIP không có cách nào dùng tính năng được quảng cáo.

## Đã làm

- Bỏ dòng đó khỏi danh sách mặc định của gói VIP; thẻ VIP còn 3 dòng (300 lượt AI/ngày · Cung điện
  trí nhớ 3D · tự chọn thứ tự bài).
- Nội dung gói lưu ở CSDL (`plan_marketing_bullets`, sửa qua `/admin`) KHÔNG có dòng này (đã grep
  `postgres/migrations/` — seed `0025`/`0087` không nhắc Gemini Live), nên không cần migration.
  Nếu admin từng TỰ thêm dòng tương tự qua `/admin` thì phải xoá tay ở tab "Nội dung gói".
- `PROGRESS.md`: mục Gemini Live ghi quyết định; mã server Gemini Live giữ nguyên, việc xây client
  hay gỡ hẳn vẫn chưa quyết.

## Kiểm chứng

- `vitest` `apps/dhcb/src/pages/core` + `apps/dhcb/src/components`: 86 file / 1325 test xanh.
- **Tầng 8b:** chụp `/nang-cap` (người dùng Free, theme blue-sky) ở 1440px và 390px trước/sau
  bằng spec Playwright tạm (đã xoá, không commit). Trước: thẻ VIP 4 dòng, dòng Gemini Live xuống
  2 hàng ở 1440px. Sau: VIP 3 dòng, cân với thẻ Free, không vỡ bố cục ở 390px. (Khung "Không tải
  được giá" trong ảnh là do spec tạm không giả lập API giá — có ở cả trước lẫn sau.)
