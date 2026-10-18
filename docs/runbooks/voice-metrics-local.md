# Đo hội thoại giọng nói cục bộ

Instrumentation S06 mặc định tắt. Nó chỉ quan sát hai luồng Bạn Đồng Hành và Luyện nói,
không thay provider, transport, hạn mức, usage, quyền, câu trả lời hoặc cách hủy hiện hữu.
Chưa có bằng chứng nghiệm thu hiệu năng thiết bị/mạng.

## Bật và đọc cửa sổ trong tab

Trong DevTools của chính tab cần quan sát:

```js
sessionStorage.setItem('dhcb.voiceMetrics.v1', 'on')
location.reload()
```

Sau khi tải lại và tương tác bình thường, đọc:

```js
const snapshot = window.__DHCB_VOICE_METRICS_V1__.read()
```

Chỉ giá trị chính xác `on` bật thu thập. Module đọc cờ một lần sau reload. Cờ thiếu, sai
hoặc trình duyệt chặn storage đều tắt. Khi tắt không tạo clock, correlation ID, ring hoặc
reader. Đổi route không tạo cửa sổ mới; reload tạo session/clock ngẫu nhiên mới.

Reader chỉ có `read()`, không có reset, config, start, sink hoặc quyền đổi evidence.
Đối tượng reader bất biến; mỗi lần đọc trả một bản sao strict DTO. Có thể sửa bản sao
mà không sửa cửa sổ thật. Nó không tự upload, console log, ghi event vào storage, đọc
query string, sao chép clipboard hoặc gắn nhãn phiên thiết bị.

Để tắt và bỏ cửa sổ trong tab:

```js
sessionStorage.removeItem('dhcb.voiceMetrics.v1')
location.reload()
```

## Dữ liệu và giới hạn

DTO version1 chỉ chứa correlation UUID ngẫu nhiên của phiên/clock/turn/request/playback,
sequence, elapsedMs trên đồng hồ client đơn điệu và các enum hữu hạn. Không transcript,
nội dung AI, âm thanh, URL, cache hash, user/person/device ID, token hoặc lỗi thô.
`evidence` của readback luôn là `local_observation_only`.

Một cửa sổ giữ tối đa64 turns,256 requests,128 playback attempts,2048 events; hàng đợi
sink tối đa64 cùng1 phần tử đang giao. Đồng hồ tối đa24 giờ. Ring giữ prefix đến trần,
không ghi đè hay tự reset để che mất mẫu. Drop, overflow, metadata/clock sai, lỗi sink
hoặc phần tử còn chờ đều khiến báo cáo `INVALID`. Đây là trần dữ liệu giữ lại, không
phải cam kết CPU của mọi caller hoặc hàm sink tùy ý.

Đợi luồng kết thúc rồi đọc lại nếu `queued`/`activeSink` còn hoạt động. Request hoặc
playback chưa có terminal vẫn là incomplete/unknown, không tính bằng0 hoặc tự xóa khỏi
mẫu số. Root hủy chỉ đóng tương tác: request đã gửi vẫn được ghi headers và kết quả
thật muộn trên ID cũ; không suy root hủy thành HTTP hủy, hoàn lượt hoặc không phát sinh
chi phí. Request mới sau root đóng không tạo event/ID và tăng drop: cửa sổ đó `INVALID`.
Ví dụ retry429 có thể vẫn xảy ra theo chính sách TTS hiện hữu, dù interaction đã hủy;
cửa sổ thiếu attempt sau hủy không được coi là ledger đầy đủ.

`request_started`, các stage và retry429 đếm HTTP phía client tới API hoặc audio download.
Chúng không chứng minh request đã gửi tới provider, đã trừ usage hoặc có chi phí. Server
cache, quota, provider attempts và usage vẫn unknown từ client; bằng chứng và authority
nằm ở trace/accounting server hiện hữu. Không suy charge/refund từ root cancel, retry
hoặc HTTP success.

## Diễn giải đúng mốc đo

- `capture_stopped` là callback kết thúc capture thực; không phải lúc người dùng ngừng nói.
- `response_headers` là fetch nhận Response; không phải byte đầu, âm đầu hoặc nghe được.
- `first_body_chunk` là chunk body khác rỗng đọc từ SSE; không phải âm thanh.
- `html_audio_playing` và `web_speech_onstart` là proxy phát; chưa chứng minh âm thanh tới tai.
- `playback_ended` đóng observation của attempt theo completion/cancel/error hiện hữu;
  không chứng minh mọi backend vật lý đã im tiếng. Chính sách khác backend giữ nguyên.
- Cache phân biệt local hit/miss/shared in-flight. Không suy server cache hit từ local miss,
  không gán HTTP của lượt prefetch/owner khác cho turn đang tham gia chung request.

Observer không làm authority cho UI/request/usage: các owner/scope/session marker,
AbortController và ticket TTS hiện hữu vẫn quyết định hành vi. Sink ném/lỗi Promise bị
cô lập; không retry sink hay tạo unhandled rejection. Sink production chỉ ghi ring bộ nhớ.

## Báo cáo và campaign sau này

Pure aggregator `aggregateVoiceWindow` dùng nearest-rank p50/p95 chỉ cho cặp mốc hợp lệ
trên cùng clock/window. Không trừ timestamp client/server, không trung bình percentile,
không đổi mốc thiếu thành0. Phiên lỗi/hủy/incomplete vẫn có counts; `INVALID` trả
`observedTurns:null`, không giả0 phiên hay xuất canonical quantile.

Báo cáo có nhãn máy đọc được
`aggregationScope: mode_direction_mixed_input_cache_proxy_diagnostic`. Các cohort
mode×direction hiện có thể trộn microphone/typed/replay/system và cache, dù đã có counts
input riêng. Quantile này phục vụ chẩn đoán, chưa là nghiệm thu hiệu năng hay so sánh
ngân sách. Cần chốt manifest, cách stratify input/cache/thiết bị/mạng, số mẫu, lỗi/fallback
và ngân sách trước campaign. Readback không tự chạy aggregator hoặc tự gắn `device_run`.

Fake clock/audio/HTTP trong unit chỉ chứng minh cơ chế và có nhãn `SYNTHETIC_ONLY`.
`audibleFirstSound`, `speechOnsetToPlaybackStop` và `clientReconnect` vẫn `NOT_MEASURED`;
`deviceNetworkPerformance` là `WAITING`. Luồng hiện tại không dùng client Live WS/VAD nên
không bịa sự kiện reconnect/barge-in. Chưa đổi transport hoặc mua/gọi provider để đo.

Rollback: tắt cờ và reload; nếu cần bỏ mã thì revert slice instrumentation.

## Reason chỉ phản ánh điều biết chắc

Cleanup chung khi scope/render đổi, kể cả unmount, không tự chứng minh người dùng đã
rời URL: reason là `unknown`. Replay đang chờ mà đổi direction/account trong cùng URL
cũng là `unknown`. Capture catch chung có thể là lỗi constructor/start sau khi quyền
micro đã cấp, nên không gắn `permission` khi chưa phân loại được lỗi quyền thật.

Thao tác hủy/mute/phòng mới rõ ràng giữ `user`. Owner hoặc playback bị một intent mới
thay thế giữ `superseded`. Release playback mặc định `unknown`; caller truyền reason
đúng với sự kiện đã quan sát. Reason chỉ ghi metadata, không quyết định request, ticket,
abort, TTS fallback/await, UI hoặc usage. Không đoán loại lỗi để làm báo cáo đẹp hơn.

AbortSignal đã abort chỉ xác nhận tín hiệu hủy, không tự chứng minh thao tác của người dùng.
Companion API ghi request reason `unknown` trong trường hợp này; root có thao tác hủy rõ
ràng vẫn giữ `user`, không thay signal/transport/callback hoặc usage.

## Môi trường kiểm thử hiện có

Agent tự chọn Chromium/Linux trên localhost, viewport1440×1000 và mobile mô phỏng390×844.
HTTP/thiết bị giả chỉ kiểm cơ chế, ownership, privacy và bố cục; viewport mobile không là
điện thoại thật, localhost không là Wi-Fi/4G/5G. Không công bố p50/p95 physical từ các lượt này.
Chưa có campaign micro/loa/mạng thật hoặc quyền dùng provider có phí/production data.

Marker phiên đổi trước React commit, stale callback và guard trước request không tự chứng minh
user đã bấm hủy hoặc có intent thay thế. Các nhánh này dùng unknown. Busy/quota/throttle là
chặn bởi chính sách, cũng không gắn user; explicit Phòng mới/hủy/mute vẫn user, follow-up thay
lượt giữ superseded. Classification không làm authority cho các guard hoặc hạch toán.

## Bằng chứng triển khai

Source instrumentation có142targeted tests và mounted84ca ở mỗi off/on/throw/reject trên mã cuối;
11localgates đạt,22.465unit và55browser/173UIcontracts, AA/AAA hai trang ba theme. Đây là kiểm cơ
chế và compatibility qua boundary fakes, không phải chất lượng model/provider hoặc acoustic latency.
Bằng chứng CI/merge/deploy và phần cần đo thật theo [goal](../goals/2026-10-16-stored-upgrades.md).
