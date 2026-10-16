# S03 truy nguyên chi phí và các chặng một lượt Companion

**Trạng thái:** Approved for implementation — chờ merge trước source.

**Goal:** [Nâng cấp từ stored](../goals/2026-10-16-stored-upgrades.md).

**Người duyệt:** chủ dự án, xác nhận trong chat ngày 2026-10-16; cho phép push/PR/merge/deploy khi CI xanh. Không bao gồm chi phí provider hoặc dữ liệu production.

## Outcome và phạm vi

Nối safety, intent, context, model/tool, fallback và finalize vào một trace để giải thích
thời gian và chi phí của lượt. Dùng lại request ID và logger hiện hữu, giữ bảng tổng hợp
token theo ngày. Không đổi giá, quota, thẩm quyền hoặc chính sách dừng chi tiêu.

## Hợp đồng đề xuất

- DTO version 1 qua Zod: trace/span/parent ID do server tạo, loại chặng từ allowlist,
  attempt, trạng thái, duration ms hữu hạn không âm; provider/model từ cấu hình server.
- Token/chi phí gắn với từng lần gọi đã xảy ra, kể cả lỗi hoặc fallback. Usage thiếu là
  unknown. Chi phí quan sát dùng lại bộ tính giá, không dùng để thu tiền/cấp quyền.
- Không mang nội dung hội thoại, prompt, ghi chú, audio, tool arguments/results, header,
  user/person ID hoặc exception thô vào trace. Không nhận nhãn tùy ý từ model/client.
- Duration dùng cùng đồng hồ đơn điệu. Sink chỉ nhận DTO đã validate; sink lỗi/chậm không
  làm lỗi lượt học. Bản đầu dùng logger tại server khi bật, không collector bên ngoài.
- Trước khi bật production phải review payload và thời hạn lưu log; không migration.

## Điểm chạm và nghiệm thu

Khảo sát `companionRuntime.ts`, `anthropicToolLoop.ts`, `aiTokenUsage.ts` và dùng lại
`packages/core-db/requestId.ts`/`logger.ts`. Chạy codemap trước sửa hotspot.

1. Lượt tổng hợp nhiều bước/công cụ/fallback có cùng trace, đúng cha/con và attempt.
2. Fake clock kiểm đơn vị/duration; kiểm đầy đủ thành công, hủy, lỗi giữa stream.
3. Canary trong các nguồn nhạy cảm không tới sink; DTO lạ/sai kiểu bị từ chối.
4. Sink hỏng không đổi response, usage hoặc trạng thái đề xuất; negative control cố ý
   bỏ cô lập sink phải bị test phát hiện.
5. Usage thiếu không được tổng hợp thành số 0 đã đo. Đối chiếu token/chi phí với các lời
   gọi của chính lượt mẫu. Đo overhead cục bộ trước/sau và review ngưỡng trước khi bật.

Full gate và kiểm thử contract/negative control; E2E nếu điểm chạm làm đổi API integration
hoặc luồng người học. Không provider có phí. Rollback bằng tắt instrumentation/revert.
Langfuse/collector và trần USD cứng là phạm vi riêng cần duyệt tài nguyên/chính sách.
