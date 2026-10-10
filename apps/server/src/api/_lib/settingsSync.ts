// settingsSync.ts — Xoá cache cấu hình admin (`app_settings` + `subject_limits`) ở MỌI tiến trình.
//
// Vì sao cần (audit 2026-10-10, giới hạn đã biết ở changelog 0581): production chạy PM2 cluster
// (`instances: 'max'`), mỗi tiến trình có cache 30s riêng (`packages/core-db/settings.ts`). Admin
// bật CẦU DAO KHẨN CẤP chỉ xoá được cache của tiến trình nhận request — các tiến trình khác vẫn
// cho gọi AI thêm tới 30 giây, đúng lúc đang cần dập chi phí.
//
// Cách làm: tiến trình nhận request xoá cache của mình NGAY (không phụ thuộc Redis), rồi phát
// một tin trên kênh pub/sub; mọi tiến trình (kể cả nó) nghe kênh và xoá cache. Dùng lại
// `redisChat` — có REDIS_URL thì fan-out qua Redis, không có thì EventEmitter trong tiến trình.
// Redis lỗi thì các tiến trình khác quay về TTL 30s như trước (không tệ hơn), có log để biết.
import { publish, subscribeChannel } from '@dhcb/core-chat/redisChat'
import { invalidateSettingsCache } from '@dhcb/core-db/settings'

export const SETTINGS_INVALIDATE_CHANNEL = 'app-settings:invalidate'

/** Gọi sau khi ghi `app_settings` thành công. Không chặn response chờ Redis. */
export function invalidateSettingsEverywhere(): void {
  invalidateSettingsCache()
  // Không await: ioredis giữ lệnh trong hàng đợi khi đang mất kết nối — request admin không được
  // treo theo. Thất bại thì chỉ mất phần "tức thời" ở tiến trình khác, TTL 30s vẫn còn.
  publish(SETTINGS_INVALIDATE_CHANNEL, { at: Date.now() }).catch((err: unknown) => {
    console.error('[settings-sync] Không phát được tin xoá cache tới tiến trình khác:', err)
  })
}

/** Gọi MỘT lần lúc khởi động ở MỌI tiến trình (không chỉ instance 0). Trả hàm huỷ (cho test). */
export function startSettingsSyncListener(): () => void {
  return subscribeChannel(SETTINGS_INVALIDATE_CHANNEL, () => invalidateSettingsCache())
}
