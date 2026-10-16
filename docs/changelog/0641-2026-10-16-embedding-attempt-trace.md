# 0641 — Tính attempt embedding vào trace lượt Companion

- **Ngày:** 2026-10-16 · **PR:** [#1406](https://github.com/seeker19110/dhcb/pull/1406) · **Loại:** `fix(observability)`.
- **Goal/spec:** [stored S03b](../goals/2026-10-16-stored-upgrades.md),
  [S03 Approved](../specs/2026-10-16-stored-s03-turn-tracing.md), đã merge #1399.

## Lỗi và thay đổi

Context Engine gọi embedding qua HTTP nhưng adapter chưa tạo trace attempt. Vì thế một
lượt có thể báo callCount0/total0, hoặc tổng chat known dù còn call embedding chưa quan sát.
Adapter nay dùng ModelTrace hiện hữu: một logical call và một attempt mỗi batch HTTP thật.
Batch rỗng/no-provider không có call giả. Usage thiếu và model chưa có trong enum giữ
unknown/cost null; mixed trace giữ observed chat cost và total null.

JSON được đọc một lần cho observer và parser. HTTP200/JSON đọc được là HTTP success; batch
có vector null là logical error, vẫn trả mảng partial như trước. Request, prefix, timeout,
retry, vector parser và estimated daily accounting giữ nguyên. Không đưa estimate thành
usage đã đo, không thêm giá/model/schema hoặc đổi quota, billing, consent và authority.

## Kiểm chứng

- Actual checkout main85f27d9a: test-first15 đỏ/2 xanh; sau sửa targeted8 file/137 test đạt.
  HTTP/PG/context phụ giả; adapter/accounting/trace/Context Engine/search thật. Request,
  vector, daily SQL params và số lần đọc JSON so on/off; HTTP/network/JSON/vector/timeout,
  batch/partial/empty/no-provider, sink throw/reject, privacy và boundary ledger.
- Empty context rows chỉ kiểm call edge/queries, không retrieval quality/authority DB.
  Audit source hẹp không thấy provider edge khác thiếu trace trong root Companion hiện
  tại; STT/TTS/Live/reflection/confirmation thuộc luồng khác. Không suy tổng phiên voice.
- Review độc lập không finding; codemap53 impacts trước edit. Prototype RAM/mutant được
  ghi riêng, không thay actual-checkout hoặc full gate. CI exact head còn bắt buộc.

- Overhead fixture sau sửa, real monotonic clock,50 warmup +1.000 mẫu/mode/20 rounds
  xen kẽ: operation root+adapter+fake HTTP/PG trước drain, off p50/p95=0,053667/0,128410ms,
  on=0,128256/0,231079ms. Chênh các percentile=0,074589/0,102669ms, không phải paired
  latency delta. Mỗi mode measured fetch/daily1.000, on attempt1.000/export3.000, off
  export0; errors/dropped/boundaryErrors0. Đây là toggle off/on bản sửa, không so old
  version hoặc production/provider/network latency; không đặt floor hoặc bật flag.

- Full local Node22: typecheck/build/lint0 cảnh báo/format exit0. Unit962 file/21.647
  test pass,35 skip sẵn có,394,66s; coverage96,14/92,06/96,91/96,84%, giữ sàn.
  Replay7/7, specs191, browser transport8/8 (9,2s) đạt. Typecheck checkout sạch exit0 (79,98s);
  quality/e2e/metadata và mọi check exact head phải xanh trước merge.

## Rollout và rollback

Dùng flag COMPANION_TRACE_ENABLED hiện hữu, default-off. Chưa bật flag hoặc đọc config/
secrets production; cần review payload/retention/volume trước bật. Rollback bằng tắt flag
hoặc revert PR. Không migration, dependency hoặc provider trả phí mới.
