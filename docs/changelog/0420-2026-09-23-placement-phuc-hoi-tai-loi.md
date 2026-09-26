# 0420 — Khôi phục bài xếp lớp sau lỗi tải câu hỏi

- Ngày: 2026-09-23.
- Base: `1d9e247e`; PR [#1120](https://github.com/seeker19110/dhcb/pull/1120), hiện có base `main` sau khi PR tài liệu [#1119](https://github.com/seeker19110/dhcb/pull/1119) đã merge; source S01 chưa merge/deploy.
- Goal: [UI/UX và sư phạm](../goals/2026-09-23-uiux-su-pham.md), S01/F1.

## Thay đổi

Loader hội thoại kiểm HTTP và dữ liệu bằng Zod, hủy request sau 15 giây, giải phóng
cache promise bị reject để lần thử lại thực sự tải mới. Request đồng thời dùng chung cache.
Placement hiện lỗi song ngữ, có Thử lại/Thoát, giữ các vòng đã làm trong phiên và bỏ qua
response sau unmount/thoát. Không gán trình độ khi tập câu hỏi rỗng.

Không đổi contract trả về của loader, không migration hoặc AI provider mới. Các caller
khác vẫn nhận promise reject khi thất bại. Codemap ghi nhận 11 file chịu ảnh hưởng gián tiếp.

## Kiểm chứng

- Unit mới: 6/6 (cache dùng chung, network/HTTP/JSON/schema lỗi, timeout và retry).
- E2E mới: 1/1 (chặn tải lần đầu, thử lại thành công trong cùng phiên).
- Build và typecheck: đạt trên Node 24.19.0. Typecheck Node 22.23.2 đạt; build Node 22 thất bại với heap out of memory, chưa có CI.
- Đã xem ảnh lỗi ở 390/1440px. Quét 3 theme × 2 viewport: không có vi phạm ở
  khối lỗi mới; AAA toàn màn desktop theme sáng báo nhãn nút header cũ (nhóm AA).
  `meta-viewport` còn ngoại lệ cũ F3; color-contrast incomplete chưa được tính là pass.
- Full lint: không đạt, 80 lỗi đều ở checkout khác dưới `.claude/worktrees/goofy-galileo-4d22ef`.
  Không sửa checkout đó hoặc giảm rule; lint các file đổi đạt; lượt eslint toàn root với `--ignore-pattern .claude/worktrees/**` cũng đạt (không đổi cấu hình/rule).
- Full format:check: đạt. Unit loader 6/6 chạy lại trên Node 22.23.2 cũng đạt.
- E2E mới 1/1 cũng đạt trên Node 22.23.2.
- Full unit Node 24 bị ngắt khi chưa có tổng kết. Lượt Node 22 ghi nhận 2 lỗi trong
  `completionSandboxServer.test.ts` và 5 lỗi trong `scripts/report-status.test.ts`;
  bị ngắt khi bộ nội dung Python còn chạy, không có tổng số pass cuối cùng.
- Chạy riêng report-status Node 22: 4/5 lỗi; output vẫn đọc PROGRESS thật thay fixture,
  nghi ngờ ranh giới biến môi trường Windows/WSL. Thử chọn Git Bash thất bại khởi động
  process (3221226505), chưa kết luận nguyên nhân cuối cùng; không sửa/skip test.
- Full E2E dự kiến 878 ca: log trước ngắt có 347 dòng ok và 8 dòng x, không phải
  tổng kết hoàn chỉnh. Có banner quay lại không tìm thấy và browser target crashed.
- Dừng các tiến trình kiểm chứng do phiên này tạo sau lỗi tài nguyên; cần chạy lại
  tuần tự trong môi trường đủ bộ nhớ, shell/Python đúng runtime. Full gate KHÔNG ĐẠT.
- Log và ảnh local: `C:/Users/liend/.codex/uiux-implementation/`; không đưa artifact sinh tự động vào git.

## Rủi ro và rollback

Schema kiểm toàn bộ file hội thoại: dữ liệu không hợp lệ sẽ bị từ chối thay vì chảy vào
UI. Test retry cần giữ lại để tránh lỗi cache vĩnh viễn trở lại. Timeout 15 giây có thể
hiển thị lỗi trên kết nối rất chậm; người dùng có thể thử lại. Revert thay đổi không cần
migration, không sửa lịch sử học/mastery. Không coi S01 hoặc goal hoàn tất khi full gate chưa đạt.

## Gỡ blocker bằng subagent — lượt tiếp theo

Theo yêu cầu người dùng, ba subagent Astra mức low xử lý độc lập unit, E2E và lint.
Primary review diff và chịu trách nhiệm full gate tích hợp.

- `eslint.config.js` thêm ignore hẹp `.claude/worktrees/**`: checkout Git riêng tự lint
  ở root của nó. Không đổi rule; source app chính vẫn được lint.
- Không sửa unit/E2E để né lỗi. PATH Windows được chuẩn hóa dùng Node 22.23.2,
  Git Bash/coreutils và Python native; GNU timeout đứng trước Windows timeout.
- Unit targeted 42/42; E2E từng lỗi 15/15. Các agent không sửa source ngoài config lint.
- Full build, typecheck, lint, format đạt trên Node 22 trong lượt chạy tuần tự.
- Full unit: 721 file pass, 1 file skipped; 16.744 test pass, 2 skipped; exit 0,
  563,02 giây. Hai ca skip thuộc `progress.concurrency.test.ts` khi chưa cấu hình DB
  integration; không thêm skip, chưa coi đó là bằng chứng concurrency DB.
- Full E2E: 873 pass, 5 skipped, exit 0 trong 28,3 phút với một worker. Năm skip
  là tổ hợp trạng thái N/A đã có trong learning-ux-states (today/outline/lesson/progress
  không có feedback riêng, result không có empty); không thêm skip trong lượt sửa này.
- Size gate đạt: initial JS 151,47/160 kB; CSS 23,62/26 kB Brotli.
- Complete gate local Node 22 đã đạt với các skip nêu rõ trên. S01 chờ review/tích hợp;
  chưa có CI, push, PR, merge hoặc deploy. Không suy đạt AAA/sư phạm toàn sản phẩm từ gate cũ.
- Đặc tả S02–S12 đã có Draft, liên kết ở goal; chưa source/Approved/merge.

Log lượt mới: `C:/Users/liend/.codex/uiux-implementation/recovery-*.log`.
Kết quả này bổ sung lịch sử lỗi ở trên, không xóa hoặc biến lượt đã ngắt thành pass.

## PR và CI

Người dùng đã cho phép push/mở PR. Tài liệu ở #1119, source S01 ở #1120 (base #1119).
Full gate ở trên là kết quả local; CI remote đang chạy cho commit đã push. Metadata
thiếu hai heading được sửa ở mô tả PR, không hạ gate hoặc giả phê duyệt đặc tả.

## Reconcile main ngày 23/09

Tích hợp `main` tại `f07820aa`, giữ cập nhật Pyodide từ main và bằng chứng S01 mới hơn trong hai tài liệu bị add/add conflict. #1119 đã merge; #1120 có base main. CI đã đạt trên commit trước khi reconcile; commit giải quyết xung đột cần CI mới, không dùng kết quả local cũ để khẳng định lượt mới đạt.
