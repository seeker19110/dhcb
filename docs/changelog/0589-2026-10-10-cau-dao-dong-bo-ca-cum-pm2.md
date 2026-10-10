# 0589 — Cầu dao khẩn cấp có hiệu lực ở cả cụm PM2 ngay (gỡ giới hạn đã biết của `0581`)

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR) · **Loại:** `fix(server)`
- **Nguồn:** người dùng yêu cầu "làm tiếp tất cả các đợt còn lại". Cả 5 đợt audit E1–E5 đã merge;
  phần duy nhất còn treo là **giới hạn đã biết** ghi ở `0581`: `invalidateSettingsCache()` chỉ xoá
  cache của tiến trình nhận request.

## Vấn đề

Production chạy PM2 **cluster** (`ecosystem.config.cjs`: `instances: 'max'`). Mỗi tiến trình giữ
cache cấu hình admin 30 giây (`packages/core-db/settings.ts`). Admin bật **cầu dao khẩn cấp** →
chỉ tiến trình nhận request thấy ngay; các tiến trình còn lại vẫn cho gọi AI thêm tới 30 giây —
đúng lúc đang cần dập chi phí bất thường. Đổi hạn mức/khuyến mãi cũng trễ như vậy.

## Đã làm

- `apps/server/src/api/_lib/settingsSync.ts` (mới):
  - `invalidateSettingsEverywhere()` — xoá cache tiến trình này NGAY (không phụ thuộc Redis), rồi
    phát tin trên kênh `app-settings:invalidate`. Không `await` (ioredis giữ lệnh trong hàng đợi khi
    mất kết nối — request admin không được treo theo); lỗi thì log, các tiến trình khác quay về TTL
    30s như trước (không tệ hơn).
  - `startSettingsSyncListener()` — nghe kênh, xoá cache khi có tin.
  - Dùng lại `@dhcb/core-chat/redisChat` (pub/sub đang chạy cho chat/vị trí): có `REDIS_URL` thì
    fan-out qua Redis, không có thì EventEmitter trong tiến trình.
- `admin-system-control.ts` (cầu dao) + `admin-settings.ts` (hạn mức/khuyến mãi/bảng xếp hạng) gọi
  `invalidateSettingsEverywhere()` thay cho `invalidateSettingsCache()`.
- `server.ts`: MỌI instance gọi `startSettingsSyncListener()` lúc khởi động (không chỉ instance 0
  như scheduler).

## Đã kiểm — KHÔNG cần làm

- Gợi ý E4.1 "không nạp trước trang khi `navigator.connection.saveData` bật": **đã có sẵn** —
  `usePrefetchPages` (`apps/dhcb/src/App.tsx`) đã `if (isSaveDataOn()) return`.

## Bằng chứng kiểm chứng

- `settingsSync.test.ts` 3 ca: không ai nghe vẫn xoá cache tiến trình gọi; có người nghe thì nhận
  tin và xoá; huỷ đăng ký thì thôi. 20 file test admin + `_lib` liên quan: 265/265 pass.
- **Hai tiến trình thật qua Redis thật** (`redis-server` cổng 6390 ở máy): tiến trình A gọi
  `invalidateSettingsEverywhere()`, tiến trình B (đã `startSettingsSyncListener()`) in
  `NHAN TIN {"at":…}` và thoát 0.
- Cổng (typecheck sạch, lint, format, test:coverage, build): xem mô tả PR.
