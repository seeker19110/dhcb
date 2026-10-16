# 0634 — Cổng eval ký ức chặn ca sai và bộ fixture hỏng

- **Ngày:** 2026-10-16 · **PR:** chưa tạo · **Loại:** `fix(eval)`
- **Nguồn việc:** nghiên cứu `stored` ngày 16/10, chủ dự án giao “triển khai đi”.
- **Đặc tả hiện hữu:** `docs/specs/2026-08-17-v2-19-platform-evaluation-hardening.md`.

## Vấn đề

`eval:v2:memory` báo accuracy nhưng chỉ dùng false-memory/correction rate để quyết mã
thoát. Một ca sai ngoài hai tập con vẫn cho 29/30 và exit 0; tập rỗng cũng có thể đạt do
giá trị mặc định của mẫu số. JSON được ép kiểu và test cũ chưa chạy cổng của CLI.

## Thay đổi

- Tách `scripts/lib/memoryEval.ts`: validate Zod, giữ tối thiểu 30 ca/sáu nhóm, ID duy nhất
  và các trường trong hợp đồng; giữ nguyên khoảng trắng nội dung fixture để service chấm.
- Chạy evaluator thật tại biên dữ liệu giả hiện hữu; mọi sai lệch, lỗi evaluator hoặc
  kết quả sai schema làm mã thoát 1; giữ ngưỡng false-memory <5% và correction 100%.
- CLI in riêng số ca hỏng và dùng mã thoát từ helper. Lỗi đọc/parse fixture tiếp tục thoát 1.
- Test helper có negative control cho sáu nhóm; test tiến trình con chạy chính source CLI
  với dữ liệu tạm, không sửa golden set và không truyền secret vào tiến trình con.
- Ghi khuôn lỗi ở `TRAPS.md` mục 24; tạo goal và Draft S02–S06. Các tính năng mới còn lại
  chưa triển khai.

## Kiểm chứng

Trên Node 22.23.2, dependency từ `npm ci`:

- `npm run build`, `npm run typecheck`, `npm run lint` (0 cảnh báo),
  `npm run format:check`: exit 0.
- `npm test -- --coverage --maxWorkers=1`: exit 0; 949 file passed/5 skipped;
  **21.435 test passed/35 skipped** theo cấu hình có sẵn, không thêm skip.
- Coverage statements/branches/functions/lines: **96,15/92,01/96,88/96,85%**,
  vượt sàn 94/90/94/94 hiện hữu.
- Targeted helper/CLI/service: 3 file, 38 test passed; golden 30/30 → exit 0;
  negative control 29/30, false-memory 4,76%, correction 100% → exit 1.
- `npm run check:specs -- --ci`: 191 spec, exit 0; staged secret/conflict/diff checks đạt.
- Codemap: không có file import CLI. Không cần E2E cục bộ vì không thay runtime/UI/API;
  check E2E bắt buộc của PR vẫn phải xanh trước merge.

Các cổng nặng chạy tuần tự với heap 2304 MB trong VM RAM hạn chế; lượt build 1536 MB
hết heap rồi chạy lại thành công, không thay ngưỡng hay source để né kiểm chứng.

## Rủi ro và rollback

Chỉ thay công cụ eval và tài liệu; không sửa memory service, fixture gốc, dữ liệu người học,
quyền, billing hoặc provider. Tập fixture tương lai phải giữ đủ nhóm và tối thiểu 30 ca.
Rollback bằng revert đợt sửa; không migration. Chưa push, merge hoặc deploy.
