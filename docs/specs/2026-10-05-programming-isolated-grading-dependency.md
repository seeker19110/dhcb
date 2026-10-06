# Đặc tả phụ thuộc: khôi phục chấm bài Lập trình trong worker cô lập

| Thuộc tính                   | Giá trị                                                         |
| ---------------------------- | --------------------------------------------------------------- |
| Trạng thái                   | **Draft / In review**                                           |
| Ngày                         | 2026-10-05                                                      |
| Phụ thuộc của                | Lộ trình AI Engineering có bài nộp code Python/JS/TS/SQL        |
| Quyết định kiến trúc/bảo mật | Chờ review và phê duyệt riêng; tài liệu này không mở lại engine |

## 1. Vấn đề và bằng chứng hiện tại

`packages/subject-programming/completionSandboxServer.ts` cố ý ngừng chấm lại Python, JS/TS/DOM/fetch, SQL, Kotlin/Swift/bash tại API sau audit 2026-09-27: `node:vm`, Python subprocess trên cùng host và SQLite WASM trong tiến trình API không là ranh giới cách ly mã không tin cậy. `getServerRegradeAvailability()` trả `isolated_worker_required`; các export cũ cho Python/web/SQL đều ném `GradingUnavailableError`. Bốn mô phỏng thuần `git`, `hermes`, `vibe`, `openclaw` còn chấm được. `completionSandboxServer.test.ts` hiện kiểm fail-closed và cấm đường engine cũ, nhưng chưa có test worker vì worker chưa tồn tại.

`apps/server/src/api/subjects/programming/progress.ts` xác thực người dùng, lesson ID/quyền bậc, receipt idempotency, tối đa 5 bài và 25 test case/request, 4.000 ký tự code, rate limit 30 lượt/người/phút và 5 lượt/bài/phút, sau đó chấm toàn batch **trước transaction ghi tiến độ**. Engine tạm dừng trả HTTP 503 mã `PROGRAMMING_GRADING_UNAVAILABLE`; không ghi completed. GET và `in_progress` vẫn hoạt động (`progress.test.ts`). `apps/dhcb/src/lib/syncOutboxSender.ts` giữ lượt đồng bộ khi gặp 503 này để thử lại. Client `ProgrammingLessonPage.tsx` vẫn chạy thử và chấm hiển thị trong trình duyệt; kết quả client không là bằng chứng hoàn thành server.

`docs/security-rollout-2026-09-27.md` xác nhận chưa có sandbox mã riêng với trần CPU/RAM/network/process. ADR-0007 từng chấp nhận sandbox subprocess ở mức tiến trình; chính sách code hiện hành đã **siết hơn** sau audit. Khi phê duyệt thiết kế mới phải ghi ADR cập nhật/supersede phần chọn mức cách ly của ADR-0007 và rà các phần ADR-0008 còn đúng. Không phục hồi lối cũ chỉ bằng cờ môi trường hoặc allowlist import Python.

## 2. Outcome và phạm vi

Outcome: người học có thể nộp bài Python trước, rồi JS/TS và SQL, nhận kết quả do server kiểm bằng test case từ lesson registry; một bài đạt mới được ghi `completed`. Cùng cơ chế áp dụng cho các bài AI mới sau khi đã nghiệm thu parity. Khôi phục an toàn **không** đồng nghĩa bắt mọi lab GPU/provider/dataset lớn chạy trong grader. Những lab đó cần artifact ngoài sandbox và rubric riêng.

Phạm vi gồm worker thực thi code không tin cậy, giao thức API↔worker, giới hạn tài nguyên, quản trị hàng đợi, test an toàn/chức năng, rollout và quan sát. Không đổi điểm/tiến độ đã ghi; không mở mạng, secret, database, provider API, filesystem host hoặc quyền hệ thống cho code học viên. Không xử lý thanh toán/mastery/entitlement. Mô phỏng Git/Hermes/Vibe/OpenClaw giữ hành vi hiện tại.

## 3. Phương án kiến trúc đề xuất để review

| Phương án                                                             | Đánh giá                                                                                                                                                                        |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Subprocess, `node:vm`, WASM/worker thread trong tiến trình API        | Loại cho mã không tin cậy: cùng ranh giới host/process; timeout JS không chặn mọi cấp phát/I/O.                                                                                 |
| Container cô lập, ngắn hạn, không quyền, một lượt chấm một môi trường | **Đề xuất** nếu host hỗ trợ đầy đủ user namespace/cgroups/seccomp/mạng tách biệt; cần PoC chứng minh trên hạ tầng staging trước khi duyệt triển khai.                           |
| MicroVM hoặc dịch vụ grader tách host                                 | Phương án khi container không đạt ranh giới hoặc tải/đe dọa cao; tăng chi phí, vận hành. Phải bảo đảm dữ liệu/code không gửi nhà cung cấp ngoài khi chưa có quyết định privacy. |

Worker chạy ngoài tiến trình API, dưới identity riêng không quyền. API chỉ gửi `{attemptId, lessonId, language, code, testCase inputs}` qua kênh nội bộ có xác thực hai phía; **expected outputs và ca ẩn được lấy ở server**, worker có thể nhận test inputs nhưng không nhận credential sản phẩm hoặc quyền ghi tiến độ. Kết quả worker là dữ liệu chưa tin cậy: API kiểm schema, kích thước, đúng số ca, đúng lesson/attempt; `gradeTestCase`/`allTestsPassed` và quyền ghi `completed` nằm trong trusted service. Worker không được quyết định entitlement, mastery hoặc tự cập nhật PostgreSQL. Tránh cho worker thấy expected outputs nếu không cần; không ghi code/PII vào log thông thường.

Tài liệu chính thống để kiểm khi làm PoC: [Docker rootless mode](https://docs.docker.com/engine/security/rootless/), [Docker Engine security](https://docs.docker.com/engine/security/) và [resource constraints](https://docs.docker.com/engine/containers/resource_constraints). Tài liệu Docker nêu container mặc định **không có trần CPU/RAM**; vì vậy phải đặt và đo giới hạn thật trên staging, không suy rằng chỉ chạy container là đã cô lập đủ.

Mỗi execution tạo môi trường mới hoặc chứng minh reset hoàn toàn giữa lượt; filesystem read-only tối thiểu, scratch riêng bị hủy sau lượt, không mount socket Docker/host/secrets, không kế thừa biến môi trường của API; rootless/non-root, capability rỗng, no-new-privileges, syscall filter, process count, CPU time, wall timeout, memory, file/output quota, disk quota và mức đồng thời toàn hệ. Mạng outbound/inbound của mã học viên **deny mặc định ở lớp OS/network namespace**; không dựa vào chặn `import socket` hoặc monkeypatch runtime. Dispatcher chỉ nhận ngôn ngữ/engine allowlist, version image pin digest và được cập nhật có kiểm soát. Nếu thiếu một ranh giới, worker không sẵn sàng và API tiếp tục 503.

**Runtime parity:** Python trên client là Pyodide, JS/TS dùng worker/iframe, SQL dùng SQLite WASM; worker server có thể khác runtime. Trước khi mở lane, test toàn bộ lời giải mẫu hiện có và các ca âm trong _cả_ client và worker, liệt kê khác biệt thư viện/cú pháp/stdin/DOM/fetch/SQLite/timeout. Nếu khác biệt ảnh hưởng đáp án hợp lệ, sửa parity theo spec riêng hoặc giữ lane tạm dừng. DOM/fetch mock fixture phải có phiên bản và không mở network thật. SQL không được truy cập DB sản phẩm.

## 4. Luồng nộp, lỗi và trạng thái

1. Route hiện tại xác thực, validate body/ID/quyền bậc, receipt, giới hạn batch và rate limit **trước** khi nhận job; chưa ghi DB.
2. Worker pool admission có quota riêng theo user/global và bounded queue. Quá tải trả 429/503 có `Retry-After`; không gọi engine trong API. Mỗi job có deadline; timeout/hết tài nguyên/cancel phải kill toàn nhóm process và dọn scratch.
3. Runner trả output giới hạn kích thước, stderr đã cắt, exit status và dấu timeout; API tự chấm từng test case từ lesson registry. Code đúng tất cả ca mới được ghi. Job lỗi hạ tầng trả 503, code sai trả lỗi bài chưa đạt; hai trường hợp đều không ghi completed.
4. Batch vẫn all-or-nothing về tiến độ. Worker job có thể chạy lại sau 503; `attemptId`/receipt hiện tại chống ghi lặp. Không cache kết quả chấm chỉ theo code nếu test/version thay đổi. Trường hợp client retry phải có giới hạn và hiển thị rõ chờ chấm, tránh tuyên bố “đã hoàn thành” ngay sau pass trong trình duyệt.
5. Cầu dao theo lane có thể tắt độc lập tức thời; khi tắt giữ 503 và không fallback sang chấm client/subprocess cũ. Không xóa receipt/progress đã có. Rollback image/worker không làm mất bài hoặc tiến độ đã xác nhận.

## 5. Test và tiêu chí chấp nhận

| ID   | Tiêu chí có thể kiểm chứng                                                                                                                                                                                                                                                                                |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | Python, JS/TS/DOM/fetch và SQL chỉ chuyển `available` theo từng lane sau khi worker đó đạt gate; các lane khác tiếp tục `isolated_worker_required`. Engine cũ luôn đóng.                                                                                                                                  |
| AC-2 | Một submission hợp lệ chạy lời giải mẫu đạt và lời giải sai/thiếu ca biên rớt trên server; toàn bộ lesson cũ trong lane được chạy content parity, gồm hidden test, stdin, dataset SQL, HTML/DOM/fetch fixture.                                                                                            |
| AC-3 | Probe vô hại trong staging chứng minh code học viên không đọc được env/secret, file host, socket nội bộ, mạng ngoài, database, filesystem của lượt khác; không nâng quyền hoặc tạo process vượt quota. Không chạy payload thoát sandbox trên host production/CI dùng secret.                              |
| AC-4 | Vòng lặp vô hạn, fork/process storm, cấp phát RAM, ghi disk, output rất lớn, regex tốn CPU, job bị cancel/worker crash đều kết thúc theo trần; tài nguyên được thu hồi, API còn phục vụ bình thường và không ghi `completed`. Trần cụ thể được chọn từ benchmark staging và ghi trong cấu hình có review. |
| AC-5 | Batch có mục cuối bị từ chối/worker lỗi không chạy vượt admission budget và không ghi mục đầu; receipt replay không chấm lại; nộp đồng thời/retry không tạo progress sai.                                                                                                                                 |
| AC-6 | 503/429 có mã và retry semantics ổn định; outbox không làm mất lượt nộp, UI không báo hoàn thành khi chỉ pass ở client. Bài mô phỏng hiện có và GET/`in_progress` không hồi quy.                                                                                                                          |
| AC-7 | Log/trace ghi attempt correlation, lane/version, duration, tài nguyên, loại lỗi, không ghi code/đầu vào nhạy cảm/secret; alert trên lỗi sandbox, timeout, backlog và 503 bất thường.                                                                                                                      |
| AC-8 | Rà bảo mật độc lập và ADR phê duyệt ranh giới cô lập; kiểm trên hạ tầng staging tương đương production; full build/typecheck/lint/format/test, E2E luồng học, a11y liên quan và kiểm thử tải/abuse đều đạt.                                                                                               |

## 6. Thứ tự triển khai và cổng mở khóa AI

1. **PoC hạ tầng cô lập** trên staging: xác minh khả năng rootless/user namespace/cgroups/seccomp/network deny, giới hạn thực tế, chi phí/độ trễ và recovery. Chốt ADR; nếu không đạt, chọn microVM/dịch vụ tách host hoặc giữ trạng thái tạm dừng. Đây là quyết định hạ tầng/security, không giao song song với nội dung bài.
2. **Hợp đồng worker và policy fail-closed**: schema request/result, ID/version, admission, timeout/quota, lifecycle, trace, error taxonomy. Test contract/fault trước khi nối route.
3. **Python lane**: một nhóm bài P1/`pyai`/`mathai`/`ml`/`mlds`/`cv1`/`cv2`/`llmagent` đại diện, sau đó parity toàn bộ Python; rollout giới hạn, theo dõi và mở rộng. Không mở khóa bài AI mới cần `completed` cho tới AC-1…8 của Python.
4. **JS/TS/DOM/fetch**, rồi **SQL**: mỗi lane có image/fixture/test riêng. Kotlin/Swift/bash giữ tạm dừng và cần spec riêng nếu muốn mở. Không gộp nhiều lane vào một lần release khó rollback.
5. **Tích hợp khóa AI mới**: thêm ID/regex/registry khi đã có bài; xác nhận mỗi bài nộp code thuộc lane sẵn sàng. Lab ngoài sandbox ghi rõ cách nộp artifact và bằng chứng, không gán `completed` giả từ client.

## 7. Rủi ro và câu hỏi cần chốt khi review

- Hạ tầng hiện tại có cho phép ranh giới container cần thiết hay cần dịch vụ grader tách host? Cần PoC, không suy từ Docker trên máy phát triển.
- Khác biệt Pyodide/CPython, browser JS/Node, SQLite WASM/native có thể khóa oan người học; parity gate là điều kiện release.
- Worker chạy mã người dùng là bề mặt tấn công cao. Review image, dependency/supply chain, giới hạn concurrent/tài nguyên và sự cố host là bắt buộc. Không dùng test đơn vị thay cho xác minh OS isolation.
- Giữ request code trong outbox phục vụ retry cần rà thời hạn lưu, quyền đọc và xóa; tránh đưa code/PII vào log/telemetry.
- API hiện giữ `completed` cũ không bị hạ cấp. Không sửa lịch sử âm thầm; nếu cần revalidate progress cũ, đặc tả migration và thông báo riêng.

**Cổng phê duyệt:** tài liệu ở trạng thái Draft / In review. Trước khi sửa security-sensitive code, cần quyết định kiến trúc cách ly bằng ADR được phê duyệt và spec triển khai được duyệt theo `AGENTS.md`/`docs/AI_DELIVERY_LOOP.md`.
