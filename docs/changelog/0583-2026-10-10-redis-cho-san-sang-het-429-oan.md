# 0583 — Redis: chờ sẵn sàng thay vì từ chối ngay, hết 429 oan ở request đầu mỗi instance

- **Ngày:** 2026-10-10 · **PR:** (xem mô tả PR, PR riêng sau PR #1332 của `0582`) · **Loại:** `fix(server)`
- **Nguồn:** phát hiện lúc kiểm `/api/tts` (changelog `0582`, PR #1332); người dùng chốt "sửa luôn lỗi redis 429".

## Vấn đề

Kiểm production: `/api/tts` và `/api/pronunciation` mỗi endpoint trả **429 "Quá nhiều yêu cầu"** đúng
một lần ở request đầu, dù chưa hề gần hạn mức 60/phút, rồi trở lại bình thường.

Nguyên nhân (đọc mã):

1. `getRedis()` (`packages/core-auth/security.ts`) tạo client Redis **lười**, ở lần gọi đầu.
2. Lúc khởi động, chỉ **instance 0** chạm tới Redis (`reportRedisStatusAtStartup`,
   `apps/server/src/server.ts`). Instance 1, 2 tạo client ở request có rate limit ĐẦU TIÊN.
3. Client vừa tạo có `status = 'connecting'`. `checkRateLimit` (và các bộ đếm ngày/cửa sổ) thấy
   chưa `ready` thì production **fail-closed** → trả 429 cho request đó. Hai lần 429 quan sát được
   khớp với đúng hai instance 1, 2.
4. Cùng cơ chế: mỗi lần Redis rớt dưới 1 giây (nợ trong `PROGRESS.md`, ~7 lần/ngày), mọi request
   có rate limit trong cửa sổ `reconnecting` đều bị 429.
5. Phụ: `reportRedisStatusAtStartup` ping ngay lúc client còn `connecting` → ping ném "Stream isn't
   writeable" (`enableOfflineQueue: false`) → log khởi động có thể báo ❌ giả.

## Đã làm

- `security.ts`:
  - `waitForRedisReady()` + `getReadyRedis()`: ở trạng thái chuyển tiếp (`connecting`, `connect`,
    `reconnecting`, `close`) chờ sự kiện `ready` tối đa **1000 ms**; quá hạn thì fail-closed như cũ.
    Trạng thái `end`/`wait` (không tự kết nối lại) không chờ. Mọi request đang chờ dùng CHUNG một
    lời chờ (một listener `ready`), gỡ listener khi xong hoặc hết hạn; timer `unref()`.
  - 5 điểm dùng Redis (`checkRateLimit`, `consumeWindowCounterCount`, `peekWindowCounter`,
    `resetCounterChecked`, `releaseDailyCounter`) chuyển sang `getReadyRedis()`.
  - `pingRedis()` chờ sẵn sàng trước khi ping (hết ❌ giả lúc khởi động).
  - `warmUpRedis()` mới: mở kết nối ngay.
- `server.ts`: gọi `warmUpRedis()` ở MỌI instance, ngay sau `dotenv.config()` và
  `warnIfClusterWithoutRedis()` (phải sau dotenv, vì `getRedis()` ghi nhớ `null` nếu chưa có
  `REDIS_URL`).

## Quyết định

- **Không** đổi `enableOfflineQueue: false` (đúng khuyến cáo trong `PROGRESS.md`): hàng đợi offline
  có thể treo request vô thời hạn khi Redis chết; chờ có trần 1 s thì không.
- Trần 1 s: kết nối Redis cục bộ mất vài ms, lần kết nối lại đầu của ioredis sau ~50 ms, nên 1 s dư
  cho cả hai trường hợp. Khi Redis chết hẳn, request có rate limit chậm thêm tối đa 1 s rồi vẫn bị
  từ chối như trước. Đánh đổi này chấp nhận được, vì lúc đó dịch vụ vốn đã suy giảm.
- Gốc rễ việc Redis rớt ~7 lần/ngày KHÔNG nằm trong đợt này (vẫn là nợ mở).

## Bằng chứng kiểm chứng

- `packages/core-auth/security.redis.test.ts`: 8 ca mới. Client vừa tạo `connecting` → chờ `ready`
  → đếm bằng Redis (production không 429); `reconnecting` → chờ rồi đếm; 20 request chờ chung 1
  listener và gỡ sạch; `end` → từ chối ngay; quá hạn → gỡ listener, lần sau chờ lại;
  `warmUpRedis` có/không `REDIS_URL`; `pingRedis` chờ trước khi ping. Fake client hỗ trợ
  `once`/`off`/nhiều listener; các ca "connecting mãi" cũ dùng đồng hồ giả tua qua 1 s.
- Chạy test mới trên `security.ts` CŨ → 7 ca đỏ; với bản sửa → xanh (451/451 trong `core-auth`).
- Cổng ở máy: xem báo cáo xác thực trong mô tả PR.
