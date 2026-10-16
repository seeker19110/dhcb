# 0635 — Replay provider offline qua SDK và vòng công cụ production

- **Ngày:** 2026-10-16 · **PR:** [#1400](https://github.com/seeker19110/dhcb/pull/1400) · **Loại:** `feat(eval)`.
- **Spec:** [S02](../specs/2026-10-16-stored-s02-provider-replay.md), owner duyệt trong chat,
  merge trước source ở PR #1399, main `66db5e6316ecba917a553e567ff78c6a28281fc8`.
- **Goal:** [nâng cấp từ stored](../goals/2026-10-16-stored-upgrades.md).

## Thay đổi

- `npm run eval:companion:replay`: chạy bảy ca tổng hợp gồm text, đọc công cụ, đề xuất
  pending, stream thành công, JSON hỏng, timeout và stream đứt; không `.env`, key thật
  hoặc record mode. Cassette v1 có source commit, cấu hình route và origin synthetic.
- Giữ SDK Anthropic, prompt builder và tool loop production; fake ở fetch/executor.
  Expected outcome được tác giả đặt trước, không sao chép kết quả chạy thành nhãn đạt.
- Fingerprint kiểm method/path/JSON chuẩn hóa và allowlist header hành vi beta/version;
  bỏ auth/key và header định danh. Cấu hình route ngoài body cũng được đối chiếu.
- Ledger kiểm cả request và việc body/terminal effect thật sự được consumer đọc/kích hoạt.
  SDK biến mismatch thành network_error hoặc parser lỗi trước transport cut vẫn phải đỏ.
- Hard gate kiểm tên công cụ, trạng thái đề xuất và lời tự nhận đã lưu trên cả final text
  lẫn delta đã phát trước lỗi; có positive/negative control và kiểm mã thoát CLI con.

## Kiểm chứng

Node 22.23.2: strict typecheck tập trung đạt; 3 file/47 test tập trung passed, exit 0;
CLI mặc định 7/7, exit 0. Build, typecheck toàn dự án, lint (0 cảnh báo), format:check
đều exit 0. `npm test -- --coverage --maxWorkers=2`: 952 file passed/5 skipped;
21.482 test passed/35 skipped, exit 0, 380,34 giây. Coverage statements 96,15%,
branches 92,03%, functions 96,88%, lines 96,85%; giữ sàn 94/90/94/94 và skip sẵn có.
`check:specs -- --ci`: 191 spec đạt; diff check đạt. Không đổi runtime nên không chạy
E2E cục bộ; vẫn cần CI E2E cùng quality/metadata xanh trước merge.

Gate nặng chạy tuần tự với heap 2304 MB do VM ít RAM. Lượt TSC 1536 MB hết heap;
build đầu không xác nhận được exit 0 dù log tới cuối, nên đã chạy lại đủ build và đạt.
Không sửa source/cấu hình cổng để né các vấn đề tài nguyên này.

Review độc lập phát hiện ba thiếu sót của bản candidate (header hành vi, lời đã phát trước
lỗi, terminal stream chưa được kích hoạt); đã thêm đối chứng tương ứng trước full gate.
Review lại xác nhận cả ba bị bắt, baseline 7/7 và không có lời gọi mạng ngoài fake.

## Phạm vi bằng chứng và rollback

Replay này kiểm logic xử lý phản hồi tổng hợp, không đo chất lượng model/provider thật.
Executor giả chỉ kiểm phản hồi pending, chưa chứng minh quyền ghi trên Postgres. Bộ
red-team/permissions trên Postgres được giữ cho S04; test generator không chứng minh SSE
đã tới client qua HTTP wrapper. Không thay runtime người học, billing, quota, model hoặc
provider order. Không migration; rollback bằng revert slice.
