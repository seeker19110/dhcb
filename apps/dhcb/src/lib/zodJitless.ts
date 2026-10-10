// zodJitless — Tắt chế độ JIT của zod TRƯỚC mọi lượt kiểm dữ liệu.
//
// zod v4 thử `new Function('')` (trong try/catch) để biết có được biên dịch bộ kiểm nhanh hay
// không. CSP chặt của app (không 'unsafe-eval' — đặc tả
// docs/specs/2026-10-10-tach-runtime-chay-code-ten-mien-con.md) chặn phép thử đó: zod vẫn chạy
// đúng nhờ catch, nhưng trình duyệt gửi một báo cáo vi phạm GIẢ về Sentry ở mỗi lần tải trang.
// `jitless` bỏ hẳn phép thử. Phải import ĐẦU TIÊN trong main.tsx: module nào kiểm dữ liệu ngay
// lúc nạp mà chạy trước dòng này thì phép thử đã xảy ra.
import { config } from 'zod/mini'

config({ jitless: true })
