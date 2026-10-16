# S06 đo trải nghiệm hội thoại giọng nói

**Trạng thái:** Draft — cần review và merge trước source.

**Goal:** [Nâng cấp từ stored](../goals/2026-10-16-stored-upgrades.md).

## Outcome và phạm vi

Đo âm thanh nghe được đầu tiên, ngắt lời, reconnect và fallback trên pipeline hiện hữu,
cả hai chiều Việt ⇄ Anh. Không đổi transport/model/provider, không cài Pipecat/LiveKit
và không thay giới hạn phiên hoặc usage.

## Hợp đồng đề xuất

- DTO Zod version 1: session/turn correlation ID ngẫu nhiên, nhãn sự kiện từ allowlist,
  mode, elapsed ms hữu hạn không âm và loại lỗi hữu hạn. Thiếu dữ liệu là unknown.
- Không PCM, transcript, nội dung AI, dấu vân tay thiết bị, user/person ID hoặc token.
  Số đo không dùng để chấm năng lực hay suy ra tình trạng người học.
- Phân biệt gửi request, nhận byte/audio đầu và phát audio nghe được. Duration phải có
  hai đầu đo trên cùng đồng hồ đơn điệu, không trừ timestamp client với server.
- Ngắt lời đo từ bắt đầu nói đến khi phần phát AI dừng; reconnect/fallback có attempt và
  lý do. Phiên lỗi giữ trong mẫu số. Sink metadata lỗi không gây mất tiếng/kẹt phiên.

## Điểm chạm và nghiệm thu

Khảo sát `geminiLiveService.ts`, contract voice và hook phát/thu audio; chạy codemap rồi
chọn đúng điểm đo thật. Không coi packet tới server là âm thanh người học đã nghe.

1. Fake clock/audio/WebSocket kiểm điểm bắt đầu/kết thúc, đơn vị ms, ngắt lời, hủy,
   timeout phiên, reconnect và fallback; collector lỗi không đổi phiên/usage.
2. Canary không có trong payload/exception được xuất; negative control nhầm đơn vị hoặc
   đồng hồ phải đỏ. Không biến giá trị không đo được thành 0.
3. E2E hai chiều và cleanup khi điều hướng/mất kết nối; giữ AA/AAA nếu có điểm chạm UI.
4. p50/p95 chỉ từ phiên thật trên ma trận thiết bị/mạng có số phiên, lỗi và fallback.
   Thời gian giả chỉ xác nhận cơ chế đo. Chốt số mẫu/ma trận/ngân sách live trước đo thật.

Full gate và E2E voice; CI không provider có phí, không migration. Rollback bằng tắt
instrumentation/revert. Bằng chứng hiệu năng là WAITING khi chưa đo trên thiết bị; chỉ mở
POC transport mới khi số đo chỉ ra nút thắt và đã duyệt đặc tả/tài nguyên tương ứng.
