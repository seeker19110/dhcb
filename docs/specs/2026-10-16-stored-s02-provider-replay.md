# S02 replay phản hồi provider cho Companion

| Thuộc tính   | Giá trị                                                      |
| ------------ | ------------------------------------------------------------ |
| Spec owner   | Chủ dự án DHCB / agent                                       |
| Trạng thái   | Approved for implementation; chờ merge trước source          |
| Goal         | [Nâng cấp từ stored](../goals/2026-10-16-stored-upgrades.md) |
| Lần cập nhật | 2026-10-16                                                   |

**Người duyệt:** chủ dự án, xác nhận trong chat ngày 2026-10-16; cho phép push/PR/merge/deploy khi CI xanh. Không bao gồm chi phí provider hoặc dữ liệu production.

## 1. Outcome và bằng chứng

Khi thay parser, cấu hình request hoặc vòng công cụ, CI cần chạy lại logic ứng dụng bằng
phản hồi provider đã kiểm duyệt. Replay phải báo lỗi khi thiếu bản ghi hoặc request hiện
tại không khớp fingerprint, giúp phát hiện chênh lệch mà không gọi mạng/provider trả phí.

Baseline: `eval:companion` dùng prompt/tool loop production nhưng gọi API có phí khi chạy
tay; test hiện hữu kiểm nhiều nhánh bằng mock. S01 sửa cổng ký ức trước khi thêm tập bằng
chứng mới. Nguồn: [nghiên cứu 16/10](../research/2026-10-16-stored-nang-cap-dhcb.md) và
`scripts/eval-companion.ts`, `packages/core-ai/anthropicClient.ts`, `anthropicToolLoop.ts`.

## 2. Phạm vi

- Một bộ cassette mẫu cho Anthropic ở Companion, tối thiểu bảy ca: text thành công,
  đọc qua công cụ, tạo đề xuất pending, stream thành công, JSON lỗi, timeout và stream
  đứt giữa chừng. Có đối chứng dương trước mỗi biến đổi âm liên quan.
- Tiêm fake ở `fetchImpl` hiện có, giữ parser, prompt builder và vòng công cụ production.
- Dữ liệu tổng hợp, kiểm duyệt và version hóa; không thu hội thoại người học production.
- Dùng Vitest và công cụ hiện hữu; chỉ cân nhắc adapter Promptfoo sau khi có runner đúng.
- Không đổi provider order, model, quota, billing, trạng thái người học, UI hoặc runtime
  transport. Không thêm dependency trong slice này nếu công cụ hiện hữu đáp ứng được.

## 3. Hợp đồng cassette đề xuất

Cassette là dữ liệu ngoài, parse bằng Zod trước replay:

- `schemaVersion`: phiên bản của hợp đồng; từ chối phiên bản không biết.
- `id`, `fixtureSetVersion`, `sourceCommit`: truy nguyên ca và mốc source.
- `provider`, `model`, `requestFingerprint`: fingerprint từ method/path và request body
  chuẩn hóa; không bao gồm key, cookie hoặc header định danh.
- Request đã khử dữ liệu nhạy cảm và cấu hình có ảnh hưởng hành vi được mô tả để reviewer
  kiểm parity; không dùng bản prompt chép đôi làm nguồn chạy.
- Response gồm HTTP status, header trong allowlist và body hoặc chuỗi sự kiện stream;
  lỗi mạng/timeout khai báo tường minh, không trộn với phản hồi model thành công.
- `origin`: phân biệt `synthetic` và phản hồi ghi từ provider được duyệt. Cassette tổng hợp
  không được trình bày là bằng chứng model đã tạo ra câu trả lời đó.
- Kỳ vọng chấm độc lập: outcome/nhánh lỗi, công cụ được phép, trạng thái đề xuất; không lấy
  chính metadata kỳ vọng làm kết quả đo.

## 4. Luồng replay và tiêu chí chấp nhận

1. Parse cassette, kiểm phiên bản/ID duy nhất và đủ nhóm bắt buộc.
2. Logic production dựng request; fake fetch kiểm method/path/fingerprint và thứ tự lời
   gọi trước khi cấp phản hồi đã lưu. Không khớp → lỗi ca, không fallback sang mạng.
3. Parser/tool loop production xử lý phản hồi. Executor giả chỉ trả dữ liệu tổng hợp và
   ghi nhận lời gọi; mọi đề xuất ghi vẫn phải pending.
4. Chấm kết quả quan sát được; xuất số chạy/đúng/sai/hỏng và mã thoát. Tập rỗng, thiếu ca,
   lỗi không dự kiến hoặc vi phạm hard gate đều làm cổng đỏ.
5. Negative control: phá fingerprint, bỏ một sự kiện stream, đổi tool name bị cấm và tạo
   kết quả tự nhận đã ghi. Mỗi biến đổi cần test chứng minh cổng tương ứng đỏ.

Một cassette phải được dùng qua đúng parser production để pass, không qua parser riêng
của harness. Chạy trong tiến trình không có key AI; test phải chứng minh không có lời gọi
mạng ngoài fake. Các độ trễ do fixture dựng chỉ đo hành vi timeout, không dùng làm p95
provider hoặc kết luận về trải nghiệm người học.

## 5. Điểm chạm và kiểm chứng

| Khu vực                                                       | Thao tác dự kiến                                                                        |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `scripts/lib/`                                                | Hợp đồng cassette, fake fetch fail-closed, scoring và test riêng                        |
| `scripts/`                                                    | Runner/test cassette cho Companion                                                      |
| `packages/core-ai/anthropicClient.ts`, `anthropicToolLoop.ts` | Ưu tiên chỉ import qua injection hiện hữu; thay source chỉ khi có thiếu sót được review |
| Tập fixture mới                                               | Payload tổng hợp, không credentials/PII, có provenance                                  |

Gate: targeted tests, negative control, build/typecheck/lint/format/test và coverage của
repo. Slice này không đổi UI, API public hoặc luồng người học nên không tự mở rộng E2E.
Nếu điểm chạm thực tế đổi các luồng đó, cập nhật đặc tả và chạy E2E tương ứng.

## 6. Rollout rollback và quyết định còn mở

- Chỉ thêm công cụ kiểm thử; rollback bằng revert slice, không migration.
- Không ảnh hưởng đường trả lời production khi replay hỏng.
- Record từ provider thật là công việc riêng cần người dùng cấp key và ngân sách; CI
  không được có record mode gọi mạng. Replay không chứng minh chất lượng model mới.
- Owner đã duyệt phạm vi; bộ ca tối thiểu theo mục 2. Chỉ tạo source S02 sau khi đặc tả
  được merge. Chưa chọn hoặc vận hành dịch vụ Promptfoo/Langfuse bên ngoài.
