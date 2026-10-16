# 0638 — Chuyển tiếp SSE tới client theo từng chunk

- **Ngày:** 2026-10-16 · **PR:** [#1403](https://github.com/seeker19110/dhcb/pull/1403) · **Loại:** `fix(http)`.
- **Goal/spec:** [stored S04a](../goals/2026-10-16-stored-upgrades.md),
  [S04 Approved](../specs/2026-10-16-stored-s04-injection-stream.md), đã merge #1399.

## Lỗi và thay đổi

Production `wrapEdge` và middleware dev gọi `.text()` trước khi gửi response, nên stream
Companion bị gom đến EOF. Test HTTP/barrier tái hiện client không nhận prefix trong khi
producer còn chờ; test hai cookie cũng đỏ vì `setHeader` lặp ghi đè cookie trước.

Helper Node dùng chung chuyển nguyên bytes SSE, flush headers/chunk và chờ drain khi
write trả false. Khi client đóng socket, helper dừng write nhưng đọc bỏ body còn lại
đến EOF/deadline hiện hữu, rồi nhả reader/listeners. Không dùng cancel reader: producer
Companion hiện hữu có thể coi enqueue sau cancel là lỗi rồi refund. Nhánh non-SSE vẫn
gửi như trước; nhiều Set-Cookie dùng array từ `getSetCookie()`, giữ Expires có dấu phẩy.
Lỗi sau headers đóng socket, không cố gửi JSON 500 vào SSE.

Middleware dev tách để test mà không loadEnv; giữ registry, kiểm path trong repo, loader
và request headers hiện hữu. Không đổi auth/cookie policy, handler/runtime/provider,
usage/refund, cấu hình compression, schema, dependency hoặc migration. Chưa triển khai
guard/corpus injection trong S04a; đó là slice kế tiếp của S04.

## Kiểm chứng

- Hai ca HTTP đỏ trước sửa, xanh sau sửa. Wrapper, CSRF/CSP, helper, dev và handler/API:
  nhóm đầu 7 file/55 test đạt; hai test dev resolve/body-error bổ sung cũng đạt.
- Route Companion đã đăng ký thật + runtime/SDK thật, fakes tại auth/DB/provider/usage:
  prefix tới trước provider EOF; normal/disconnect không tạo thêm consume/refund/history
  hoặc daily usage. Câu mẫu vẫn refund đúng một lần theo ngày consume, không provider call.
- Byte Unicode cắt giữa UTF-8, nhiều cookie, JSON/status/gzip/ETag, SSE gzip nhiều drain,
  backpressure, HEAD/204/304, close và lỗi trước/sau headers có kiểm thử. Negative control
  dùng `.text()` cũ không vượt được oracle prefix trước barrier.
- Review độc lập phát hiện oracle disconnect có thể mở provider barrier trước khi server
  nhận close (proof 3/3). Đã thêm latch close phía server và quan sát helper thật kết thúc
  trước assertion side effect; rerun 3/3 đạt, re-review không còn finding. Cleanup browser
  cũng đóng HTTP trước khi đợi reader. Proof gzip 2 MiB/32 drain và emitter zlib được tháo,
  disconnect 0 cancel và reader được nhả. Không DB/provider/mạng ngoài loopback.
- Full codemap local heap4096 đã đạt sau khi RAM khả dụng thay đổi; routes impact5.
- Browser transport 4/4 đạt. Playwright dùng tsconfig.e2e kế thừa source aliases để fixture
  nhập server thật trên checkout sạch, không cần dist từ build job khác; giữ strict/gates.
- Build, typecheck, lint và format toàn dự án đã đạt; replay 7/7 và check:specs 191 đạt.
  Coverage local còn chạy, đã báo một test cũ projectStepsT2 P4/s6 timeout 5.000ms.
  Lượt E2E toàn bộ local đã dừng exit130 khi máy dùng swap (61 ca đạt trước khi dừng),
  không coi suite này xanh. Giữ nguyên timeout/threshold; full gate và sáu shard E2E
  trên CI exact head phải đạt trước merge.

## Rollout và rollback

Không flag hoặc migration. Response bridge có ảnh hưởng mọi route, nên non-SSE, cookie,
CSRF/CSP và full E2E là cổng bắt buộc. Rollback bằng revert PR. Backpressure mới chỉ từ
Web body đến Node socket: producer trong `ReadableStream.start()` vẫn chủ động enqueue.
Drain sau disconnect không chứng minh provider đã hủy, refund mới, hoặc tài nguyên upstream
được dọn ngay. Chưa có phép đo qua Nginx/Cloudflare; không dùng test generator/mock HTTP
làm bằng chứng browser delivery hoặc độ vững của model.
