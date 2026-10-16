# 0637 — Trace các chặng và chi phí lượt Companion

- **Ngày:** 2026-10-16 · **PR:** chờ tạo · **Loại:** `feat(observability)`.
- **Goal/spec:** [stored S03](../goals/2026-10-16-stored-upgrades.md),
  [Approved for implementation](../specs/2026-10-16-stored-s03-turn-tracing.md), đã merge #1399.

## Thay đổi

Trace server mặc định tắt nối prepare/intent/context/safety/synthesis/model/tool/fallback/finalize.
DTO Zod v1 chỉ chứa ID server, nhãn allowlist, thời gian monotonic, trạng thái và số đo.
Không đưa prompt, hội thoại, ghi chú, key, ID người học, tool args/results hoặc exception vào log.
Không thêm API, migration, dependency, collector ngoài hoặc thẩm quyền ghi DB.

Mỗi logical SDK call có HTTP attempt riêng, gồm retry. Chỉ attempt sở hữu usage/cost;
counter stream cumulative ghi đè, không cộng lại ở final snapshot hay span cha. Tổng đầy đủ
giữ null khi usage/model/giá chưa biết, call còn mở hoặc span mất; observed cost là phần đã đo.
Giá vẫn dùng registry hiện hữu, chỉ ước tính vận hành, không dùng để thu tiền/cấp quyền.

ALS bind next/return/throw để hai stream xen kẽ không lẫn trace. Root đóng một lần; child
có thể đóng sau consumer return mà không sửa snapshot cũ. Giữ semantics hủy hiện hữu:
không tự abort provider, await producer hoặc refund. HTTP delivery/cancel thuộc slice khác.
Sink validate/defer/bounded, không await trên đường response; lỗi sink không tạo thêm
provider call/tool/history/usage. Logger đồng bộ vẫn có thể block event loop khi drain.

## Kiểm chứng

- 12 file/211 targeted test đạt; SDK/fetch thật ở trong chương trình với HTTP giả,
  không gọi mạng ngoài/provider trả phí. Strict API config cho 12 file thay đổi đạt.
- Runtime bật/tắt giữ toàn bộ response, pending proposal, history và daily usage. Canary
  không vào trace; usage missing/partial/zero, retry/cut/fallback/tool, cancel/late child,
  interleave, sink throw/reject/hang/queue overflow và clock lỗi có test.
- Negative control bỏ cô lập collector khiến đường giao response lỗi và bị oracle phát hiện.
- Review độc lập P2 text trắng bị logical success đã sửa; regression và re-review đạt.
- Microbenchmark 4.000 lượt/chế độ, 7 span/lượt: p50/p95 off 0,0051/0,0083 ms,
  on 0,0442/0,1478 ms; export đủ 28.700 gồm warmup. Không HTTP/DB/logger I/O;
  không suy ra latency dịch vụ hoặc ngưỡng production từ số đo này.
- Codemap impact heap1920 hết heap; AST xác minh đầy đủ import graph cũ tương đương
  base trước sửa. Dùng graph đầy đủ để review impact, giữ nguyên gate graph mới trên CI.
- Full local lint (0 cảnh báo), format:check và unit exit0: 956 file passed/5 skipped,
  21.536 test passed/35 skipped, 390,87 giây; giữ nguyên skip, không đo coverage cục bộ.
  Replay CLI7/7 và check:specs191 đạt. CI build/typecheck/coverage/E2E phải xanh trên
  chính head trước merge. VM giới hạn RAM như ghi trong goal, không hạ cổng.

## Vận hành và rollback

`COMPANION_TRACE_ENABLED` chỉ bật khi giá trị đúng `true`; mặc định không export. Trước
bật production, owner phải review payload thực tế, sampling/volume, nơi lưu/quyền đọc log,
retention/xóa log và ngưỡng overhead trên môi trường đích. Slice này chưa chọn chính sách
lưu log và chưa bật flag. Logger hiện hữu tạo dòng `[companion-trace#requestId]` chứa DTO;
dùng traceId/spanId/parentSpanId nối các chặng, không lấy tổng bằng cộng cost của mọi span.

Khi root `totalCostUsd: null`, dùng mẫu số unknown/open/dropped để giải thích phần chưa đo;
không thay null bằng 0. `consumer_cancelled` mô tả iterator, không xác nhận upstream/HTTP
đã dừng hay người học đã được hoàn lượt. Tắt flag hoặc revert PR để rollback; không backfill
usage, sửa billing hoặc đổi dữ liệu lịch sử.
