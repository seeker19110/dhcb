# S06 — Metadata giọng nói trong bộ nhớ tab

Spec [S06](../specs/2026-10-16-stored-s06-voice-metrics.md) Approved for implementation đã merge
qua PR1399. Tiếp sau S05 PR1413; không đổi model/provider/transport, server, usage hay billing.

Bộ đo mặc định tắt, bật exact local flag sau reload. Hai trang Speaking và Companion tạo
UUID tương quan cho capture/request/playback cùng clock client; sự kiện strict Zod chỉ có
enum và số hữu hạn. Không transcript/nội dung/audio/URL/user/person/device/token/rawerror,
không upload/log/persist events. Reader chỉ đọc bản sao mới; caps bounded và drop/clock/sink
lỗi khiến báo cáo INVALID/null. Observer không authority cho UI, request hoặc hạch toán.

Request/playback child đã tồn tại có thể nhận terminal muộn, nhưng root đã đóng chặn child
mới; retry thực thiếu observation làm cửa sổ INVALID. Client HTTP không chứng minh provider
admission/chi phí. Reason không đoán user/navigation/permission từ AbortSignal hoặc catch/
cleanup chung. Tham số API additive giữ caller cũ; TTS ticket/ownership/fallback không đổi.

HTMLAudio playing/WebSpeech onstart chỉ là proxy. Audible sound, barge-in và reconnect vẫn
NOT_MEASURED; performance thiết bị/mạng WAITING. Local quantile chỉ diagnostic trên cặp mốc
hợp lệ và giữ counts lỗi/hủy/incomplete; fake clock không là bằng chứng hiệu năng thật.

## Kiểm chứng

Source cuối đã primary/peer review và sửa reason sai khi marker đổi trước render, busy/quota
chặn gửi và generic abort. Actual shipping oracle trước sửa5RED/17PASS/0skip; sau sửa142targeted
đạt. Explicit Phòng mới=user và follow-up=superseded giữ nguyên; classification không authority.

Đủ11localgates trên26source pins không đổi: typecheck sạch, build, budget, lint0warning, format,
coverage, replay7/7,191Approved specs, UI173/173, Chromium55/55(retry0), clean typecheck sau xóa
artifacts. Vitest1.006file/22.465tests đạt,5file/35test skip hiện hữu; coverage statements/branches/
functions/lines96,01/91,89/96,92/96,73%, giữ thresholds94/90/94/94. Unit gate411,50s; browser190,60s.

Mounted84/84 ở từng off/on/throw/reject trên source cuối. Off0event/clock/ID; bật732events,
collector throw/reject vẫn giữ product controls. Hai trang thực/core/libs với faithful boundaries
và DI activation shim, không phải bằng chứng micro/mạng/provider thật. Reader activation thật được
kiểm riêng và browser8ca mới nằm trong55. Không thêm skip hoặc unhandled errors.

Root xem4ảnh sau1440×1000/390×844 so baseline: không hồi quy bố cục,3ảnh byte-identical;
Companion desktop khác bytes nhưng không khẳng định pixel-equivalence. AA/AAA hai trang×3theme
và Speaking AI results đạt. Fresh budget sau unit dùng đúng coverage mới; initialJS136,66/160kB,
CSS23,74/26kB. Không dùng summary coverage cũ làm kết quả source mới.

Driver dài kết thúc143 ở clean typecheck cuối, chưa có diagnostics;10gate đạt giữ nguyên.
Lưu forensic và xác nhận26source hashes; chạy lại riêng pending clean typecheck70,06s đạt,
không thay code/tests/cổng. Exact-head CI/artifacts/CodeQL và merge/deploy vẫn phải đạt trước phát hành.

## Vận hành

Đường bật/đọc/tắt, giới hạn dữ liệu và cách diễn giải trong [runbook](../runbooks/voice-metrics-local.md).
Rollback tắt cờ/reload hoặc revert slice; không migration, dependency hoặc lockfile mới.
S05 CI39131943237 đủ19context/22.350unit/1.460E2E và actual artifacts đã xác minh; main08f9508e
đủ CI/deploy/CodeQL/secret SUCCESS. Goal còn evidence cần đo thật.
