# S04 kiểm nội dung gián tiếp và đầu ra stream

**Trạng thái:** Draft — cần review và merge trước source.

**Goal:** [Nâng cấp từ stored](../goals/2026-10-16-stored-upgrades.md).

## Outcome và phạm vi

Kiểm độc lập dữ liệu đưa vào model, quyền thi hành công cụ và các delta tới client.
Red-team Postgres hiện hữu và `finalAnswerChecks` được giữ lại. `streamCompanionTurn`
phát delta trước finalize, nên kiểm câu cuối không thay được kiểm từng mẩu đã phát.
Không thêm công cụ có side effect, scanner mạng hoặc lời gọi model trong CI.

## Corpus và điểm chạm

Corpus version hóa, validate Zod, gồm ghi chú/ký ức/tool result có thẻ giả, Unicode,
nhiều lượt Việt–Anh và các ca benign hợp lệ. Mỗi ca có nguồn, canary, hành vi cấm và
provenance. Đi qua prompt builder/executor/parser production; replay từ S02 chỉ chứng
minh cách xử lý phản hồi đã ghi, không chứng minh độ vững của model mới.

Khảo sát `companionPrompt.ts`, `companionTools.ts`, `finalAnswerChecks.ts`,
`companionRuntime.ts` và `scripts/red-team/`. Chạy codemap, chỉ sửa điểm thực sự cần.

## Nghiệm thu

1. Khác người/thiếu consent không thấy canary trong context/tool result; đối chứng hợp
   lệ phải thấy canary, tránh phép đo mù.
2. Tool call tự xác nhận, chọn người khác hoặc tên ngoài danh sách phải bị từ chối;
   quan sát trạng thái/số dòng thật trên Postgres cục bộ. Chưa duyệt thì không commit.
3. Stream giữ chính sách loại markup/ID nội bộ hiện có ở câu cuối, kể cả mẫu bị cắt
   qua chunk. Thử mọi vị trí cắt, chunk nhỏ, kết thúc sớm, lỗi và fallback.
4. Giữ bộ lọc khối câu hỏi và stream thật; không đệm cả câu trả lời để tránh kiểm delta.
5. Ca benign có trích dẫn/từ khóa kỹ thuật không tự bị coi là tấn công theo nhãn.
   Phá từng ranh giới có chủ đích phải làm test tương ứng đỏ.

Full gate, red-team Postgres cục bộ và E2E Companion stream/fallback. Không dữ liệu/key
production. Rollback bằng revert, không migration. Muốn kết luận về model mới cần live
eval riêng được duyệt ngân sách; scanner nội dung không thay cơ chế cấp quyền.
