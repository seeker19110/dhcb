# ADR-0014: Chuẩn bị worker chấm bài trên host riêng

- **Trạng thái:** Đề xuất — chờ duyệt kiến trúc cho gói chưa kích hoạt
- **Ngày:** 2026-10-05

## Bối cảnh

DHCB đang đóng chấm hoàn thành cho Python/JS/TS/SQL vì subprocess, `node:vm` và WASM chạy trong API không tạo ranh giới đủ mạnh cho mã không tin cậy. Lộ trình 20 khóa Kỹ thuật AI cần chấm server thật. Chủ dự án chưa có staging và đã yêu cầu chuẩn bị gói triển khai trước.

[Đặc tả gói](../specs/2026-10-05-programming-grading-deployment-package.md) chốt contract, cấu hình, kế hoạch kiểm và vận hành; [review policy](../research/2026-10-05-programming-completion-policy-review.md) ghi rủi ro khi thêm tiền tố bài mới, giới hạn ca ẩn trên client và tải batch 25 ca.

## Quyết định đề xuất

Chuẩn bị gói Python đầu tiên với supervisor trên **host grader riêng**, Docker rootless dưới tài khoản chuyên dụng và một container mới cho mỗi ca. API dùng mTLS tới supervisor, tự kiểm identity/digest/status/output và tự quyết định pass/fail theo ca server. API không truy cập Docker socket. Container không nhận secret, expected output, host mount hoặc mạng.

Gói gồm completion policy từ lesson đã resolve, contract strict, adapter mặc định disabled, supervisor/fake runtime, template image/systemd, CLI manifest và runbook. Logic được kiểm bằng fake runtime hữu hạn trước khi có staging. Không tạo container hoặc chạy mã học viên trên máy hiện tại trong bước chuẩn bị.

Chấp thuận chuẩn bị gói không xác nhận container an toàn và không cho phép kích hoạt lane. Kích hoạt cần host riêng được cấp, P00–P15/B25/parity đạt, review bảo mật độc lập, budgets/SLO được duyệt và quyết định rollout riêng. Nếu ranh giới bắt buộc không đo được thì lane giữ đóng và ADR phải được cập nhật sang microVM hoặc grader khác.

## Lý do

Host riêng giảm phạm vi ảnh hưởng tới API/database khi grader có sự cố. Rootless container cho phép chuẩn bị một gói tự vận hành, có trần tài nguyên và cấu hình đọc được; các khả năng CPU/memory/PID/seccomp/network phải được kiểm trên host thật. Tách contract, kết quả và quyền ghi tiến độ ngăn mã học viên tự khai `passed` hoặc kết quả client mở khóa.

## Các phương án đã cân nhắc

- Subprocess hoặc VM/WASM trong API: loại vì dùng chung host/quyền/tài nguyên mà không đủ boundary cho mã không tin cậy.
- Rootless container trên host riêng: ứng viên cho gói và PoC, dùng chung kernel nên còn rủi ro escape/kernel/daemon; PoC không chứng minh hết mọi dạng escape.
- MicroVM trên host riêng: ranh giới kernel mạnh hơn, tăng yêu cầu hạ tầng và vận hành; cần chọn nếu threat model hoặc kết quả review không chấp nhận container.
- Dịch vụ grader ngoài: cần quyết định privacy, phí và hợp đồng dữ liệu; chưa có lựa chọn được chủ dự án duyệt.

## Hệ quả

Gói chưa kích hoạt có thể được kiểm/review trước staging sau khi ADR và spec triển khai được duyệt/merge. Test fake chỉ chứng minh contract và logic, không chứng minh enforcement OS. Bộ ca server phải được tách khỏi bundle trước rollout; tốc độ batch 25 ca còn cần đo để quyết định đồng bộ hay hàng đợi bất đồng bộ.

API tin supervisor thực thi đúng. Host grader bị chiếm có thể làm lộ chứng chỉ và giả envelope hợp lệ; mTLS/digest không là execution attestation. Rủi ro kernel chung và độ tin cậy supervisor cần được chủ dự án/reviewer chấp nhận hoặc đổi sang microVM trước activation.

ADR này chỉ dự kiến thay thế phần dùng subprocess làm ranh giới của ADR-0007 sau khi được chấp nhận; giữ nguyên yêu cầu server chấm lại và transaction/idempotency. ADR-0007/0008 chưa bị đánh dấu thay thế khi tài liệu còn Đề xuất. Các khóa và lane mới vẫn chịu cổng phát hành trong spec chương trình.

Quyết định còn cần chủ dự án: kiến trúc ứng viên cho gói; người review bảo mật và threat model; host/ngân sách/SLO/retention trước PoC; activation sau bằng chứng. Quyền PR/merge đã cấp tiếp tục theo điều kiện quality/e2e hiện hành.
