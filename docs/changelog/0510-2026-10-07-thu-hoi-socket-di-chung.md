# 0510 — Thu hồi socket "Đi chung" khi rời/kết thúc chuyến (2026-10-07)

- **Ngày:** 2026-10-07 · **PR:** chưa tạo (commit cục bộ) · **Loại:** `fix(location)`.
- **Nối tiếp:** changelog 0465, nợ bảo mật (1) "Kênh vị trí thu hồi chậm".

## Việc đã làm

`packages/core-location/wsLocation.ts`: khi kênh Redis của chuyến phát `member_left`, server gỡ
socket của đúng người vừa rời khỏi chuyến (qua `socketOwner`, WeakMap socket → userId) nên họ
không nhận vị trí kế tiếp; khi phát `session_ended`, gỡ mọi socket sau khi gửi thông báo và huỷ
đăng ký kênh. Chạy đúng với PM2 cluster vì xử lý ngay trong callback pub/sub của từng tiến trình.

## Bằng chứng

- `wsLocation.test.ts` thêm 2 ca (rời chuyến · kết thúc chuyến): `npx vitest run packages/core-location` → 67/67 xanh.
- `npm run typecheck` 0 lỗi; eslint `packages/core-location` 0 cảnh báo.

## Còn lại

Nợ (3) ghim `appleboy/ssh-action` theo SHA chưa làm (cần tra SHA của tag v1.2.5 ngoài phạm vi phiên);
nợ (2) và (4) cần chủ dự án.
