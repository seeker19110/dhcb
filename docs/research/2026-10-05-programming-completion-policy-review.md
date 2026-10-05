# Bản nháp bổ sung đặc tả/ADR: quyền chấm bài khi mở 20 khóa Lập trình

| Thuộc tính | Giá trị                                                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Trạng thái | **Draft — chưa phê duyệt triển khai**                                                                                          |
| Ngày       | 2026-10-05                                                                                                                     |
| Liên quan  | `docs/specs/2026-10-05-programming-isolated-grading-dependency.md`, `docs/research/2026-10-05-programming-grading-poc-plan.md` |
| Mục đích   | Chặn đường ghi `completed` không có bằng chứng chấm, định nghĩa ca ẩn thật và kiểm ngân sách batch trước khi mở khóa AI mới    |

## 1. Bằng chứng và phạm vi của rủi ro

`apps/server/src/api/subjects/programming/progress.ts` nhận `completed`, kiểm lesson tồn tại rồi chỉ đưa các mục mà `isServerRegradableLesson(id) === true` vào `regradeItems`. Chỉ `regradeItems` phải có code, chịu giới hạn 5 bài/25 ca, kiểm lane và chạy chấm trước transaction. Các mục còn lại có thể ghi `completed` không kèm code. Đây là hành vi có chủ đích cho `projectStep`/`specProgressKey`, nhưng không được áp dụng cho bài `ProgrammingLesson` có bước Make.

`packages/subject-programming/completionSandboxServer.ts` hiện xác định phạm vi bằng **tiền tố ID + ngôn ngữ**. Bài xương sống `p1…p6` và 11 tiền tố khóa ngắn hiện có được nhận; bài thuộc tiền tố mới bị trả `false` dù có trong registry. `LessonSchema.id` và `UpdateSchema.lessonId` hiện cũng chỉ nhận các tiền tố cũ. Test `completionSandboxServer.test.ts` duyệt mọi bài trong `PROGRAMMING_LESSONS` và đòi `isServerRegradableLesson === true`. Vì vậy **không có bằng chứng đường vòng khai thác được với một ID khóa mới trên mã hiện tại**: phải đồng thời mở ID trong schema, thêm bài có thật vào registry và bỏ sót policy; kiểm thử hiện có sẽ đỏ nếu được chạy. Rủi ro cần xử lý là lỗi mở rộng tương lai và độ an toàn của chính API khi kiểm thử bị bỏ qua hoặc thay đổi.

Điều kiện tái hiện về mặt thiết kế: (1) thêm khóa mới `aix-u1-l1` vào `LessonSchema`/`unitId`, `UpdateSchema`, registry/loader; (2) quên cập nhật selector tiền tố trong `completionSandboxServer.ts` hoặc thêm ngôn ngữ mà selector trả `false`; (3) gửi POST hợp lệ `{lessonId:'aix-u1-l1',status:'completed'}` sau xác thực, quyền và rate limit. Route nhìn thấy bài thật nhưng `regradeItems=[]`; nếu không có gate khác, transaction ghi `completed`. Cùng vấn đề xảy ra trong batch chứa bài mới. Đó là giả thuyết hồi quy cần test âm, **không phải xác nhận lỗi đang chạy production**.

`packages/subject-programming/lessonTypes.ts` đặt `hidden: true` cho test case, nhưng unit được `lessonsLoader.ts` tải đủ nội dung vào trình duyệt. `ProgrammingLessonPage.tsx` tự lặp toàn bộ `lesson.make.testCases` và gọi `gradeTestCase()` trên client. Vì vậy `hidden` hiện chỉ giấu stdin/expected trên **giao diện**; không bảo mật chúng khỏi người dùng có thể xem bundle/runtime. `sampleSolution` cũng nằm trong lesson tải xuống. Không mô tả các ca này là bí mật hoặc dùng chúng làm bằng chứng chống hardcode.

## 2. Quyết định ADR đề xuất, cần review

**Quy tắc quyền ghi:** mọi `ProgrammingLesson` có bước Make phải có bằng chứng chấm server trước khi ghi `completed`, độc lập với tiền tố ID. Quyết định chọn lane dựa trên lesson đã resolve từ registry và loại hoạt động đã khai rõ, không dựa trên quy ước tên. Bài đọc thuần, `projectStep`, `specProgressKey` hoặc artifact ngoài sandbox phải có **loại hoàn thành và bằng chứng riêng được khai báo tường minh**, không mặc nhiên lọt qua nhánh không chấm.

Hợp đồng đề xuất: `resolveCompletionPolicy(id)` trả một trong `server_simulator`, `isolated_worker_required`, `external_artifact_review`, `non_code_rule`, `unknown`. `unknown` và cấu hình mâu thuẫn phải từ chối `completed` trước DB/receipt (`503 PROGRAMMING_GRADING_UNAVAILABLE` nếu lane dự kiến có nhưng tạm dừng; `409`/mã cấu hình riêng nếu registry thiếu policy). `in_progress` và GET vẫn dùng được. Một bài trong registry không được mặc định thành `non_code_rule` chỉ vì selector không nhận ID. Không biến `unknown` thành thành công trong client, outbox hoặc worker crash. Giữ nguyên bốn mô phỏng `git`/`hermes`/`vibe`/`openclaw` nếu policy và test hiện hành xác nhận; các lane code khác tiếp tục đóng cho tới gate worker.

Chọn một nguồn khai báo policy có type/schema chặt và một cổng kiểm coverage khi build: mọi lesson/course mới phải map đủ ID, loại hoàn thành, lane, engine và phiên bản bộ ca. Dữ liệu catalog, server route và CI đọc cùng nguồn hoặc kiểm đối chiếu tự động. Không cần đổi khóa tiến độ đã ghi trong DB để sửa fail-closed; nếu schema dữ liệu thay đổi, phải có migration cộng dồn và kế hoạch rollback riêng.

**Ranh giới ca ẩn:** tách `publicPracticeCases` được gửi tới browser khỏi `serverAssessmentCases` lưu ở server. Dùng ca công khai cho phản hồi tức thì, bao gồm fixture cần để học. Các ca đánh giá server và expected output không vào import graph của `apps/dhcb`, chunk lazy, source map công khai, response API, thông điệp lỗi hoặc log. Có thể giữ tên `hidden` để diễn đạt mức hiện UI trong quá trình chuyển đổi, nhưng phải đổi mô tả vì cờ này hiện không bảo mật. Nếu cần client tự chạy toàn bộ bài khi offline, định nghĩa rõ kết quả đó là **luyện tập tạm thời**; `completed` chỉ được xác nhận sau chấm server. Cả khóa cũ và mới cần kiểm độ công bằng của ca ẩn và runtime parity; việc lấy mẫu ngẫu nhiên/phiên bản ca phải có digest và không được hồi quy retry/idempotency.

## 3. Acceptance criteria cho lát fail-closed đầu tiên

| ID   | Điều kiện đạt                                                                                                                                                                                                                                        |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FC-1 | Với bất kỳ bài `ProgrammingLesson` mới trong registry, `completed` thiếu code hoặc lane chưa sẵn sàng bị từ chối trước transaction; không phụ thuộc ID/prefix.                                                                                       |
| FC-2 | Một batch chứa ít nhất một bài `unknown`, thiếu code, lane đóng, worker lỗi hoặc kết quả không đạt không ghi **bất kỳ** dòng tiến độ mới/receipt thành công nào; các bài đầu batch không được chấm trước khi xong tiền kiểm admission.               |
| FC-3 | Bài `projectStep`/`specProgressKey` vẫn đi theo policy riêng được khai tường minh, không bị giả thành Make; ID không tồn tại vẫn 400. Bốn mô phỏng còn cho hoàn thành qua chấm server hiện có.                                                       |
| FC-4 | CI kiểm mọi lesson đã đăng ký có policy hợp lệ; fixture thêm tiền tố/ngôn ngữ mới nhưng không khai policy phải làm test đỏ. Test API dùng registry thật hoặc fixture mới thực sự đi qua route, không chỉ mock `isServerRegradableLesson` thành true. |
| FC-5 | `serverAssessmentCases` và expected output không xuất hiện trong manifest/chunk/source map/response browser. Ca luyện tập công khai vẫn chạy, hiển thị nhãn và giải thích rằng thành công cục bộ chưa xác nhận tiến độ.                              |
| FC-6 | `regradeSubmission`/worker dispatcher tự kiểm policy và lesson/version, không chỉ dựa route; caller khác không thể gửi ID lạ để bỏ qua chấm. Lỗi worker/sai envelope/timeout không bao giờ tạo `completed`.                                          |
| FC-7 | Receipt replay đúng attempt đã chấm, không nhận body khác cùng `attemptId` như thành công nếu hợp đồng idempotency chưa bảo vệ; thêm kiểm digest request nếu hiện chưa có. Không ghi code/ca ẩn vào log.                                             |

### Test âm bắt buộc

1. Dùng lesson fixture `aix-u1-l1` có Make thật, ID hợp lệ tại API nhưng policy thiếu: POST đơn và batch `completed` không code/giả code đều thất bại, `withTransaction` không được gọi. Test này cố ý mô phỏng lỗi thêm khóa trong tương lai; không đưa fixture vào catalog production.
2. Cùng fixture có policy Python nhưng worker chưa mở: trả 503 mã tạm dừng; không tự khai `completed` hoặc hạ thành `in_progress` âm thầm. GET và `in_progress` vẫn hoạt động.
3. Bài khóa cũ với `language` mới/không được hỗ trợ: fail-closed; unit test phủ mọi lesson registry chứ không chỉ danh sách mẫu.
4. Batch 5 bài/25 ca: ca thứ 25 lỗi hoặc worker response thiếu/lặp/trộn test ID, sai content digest, sai attempt ID, output bị cắt, exit lỗi, quá hạn, duplicate/late response; không ghi batch và không cache kết quả lỗi. 6 bài hoặc 26 ca bị chặn **trước** dispatch.
5. Test client build đọc artifact xây dựng thật, quét một sentinel chỉ đặt trong `serverAssessmentCases`; không thấy ở bundle/source map/route public. Quét source code không đủ vì bundler có thể kéo import gián tiếp.
6. Test tiến độ: pass client nhưng server 503/sai ca ẩn thì UI/outbox không báo hoàn thành xác nhận; retry cùng attempt không nhân đôi chấm/ghi; nếu đổi digest ca/lesson phải đánh giá lại theo policy version.

## 4. PoC tải và độ trễ batch 25 ca

PoC P01–P15 hiện đo ba bài mẫu để chứng minh ranh giới, **chưa đủ** chứng minh route batch lớn dùng được. Trên staging tương đương production nhưng không chứa secret/dữ liệu thật, benchmark tối thiểu các hình dạng: 1 bài × 1 ca, 1 × 10 (trần schema bài), 5 bài tổng 25 ca; tất cả đúng, một ca sai ở cuối, timeout cuối, worker crash cuối, queue đầy, replay receipt, 2 và N batch đồng thời trong ngân sách host. Mỗi ca tạo execution riêng như kế hoạch PoC hiện tại; nếu muốn tái dùng container, cần đặc tả reset/bằng chứng cô lập riêng trước khi so hiệu năng.

Ghi riêng thời gian validation/admission, chờ queue, cold start, chạy từng ca, cleanup, transaction và toàn request; peak RAM/CPU/PID/scratch, số execution còn sót, 429/503, deadline/timeout. Đo warm/cold, ít nhất một chuỗi đủ dài để percentile có ý nghĩa; công bố số mẫu, phân bố và confidence thay vì gán p95 cho ba lượt. Chốt ngân sách UX (p50/p95/p99 và hạn chờ tối đa), số đồng thời/queue và giá thành **trước khi** gọi PoC đạt. Ngân sách phải phù hợp timeout HTTP, outbox retry và tài nguyên staging đã cấp; nếu 25 ca vượt ngân sách, phải đổi hợp đồng nộp/queue có spec và UX được duyệt, không âm thầm tăng timeout hoặc bỏ ca ẩn.

Không dùng benchmark máy phát triển làm bằng chứng phát hành. `429`/`503 Retry-After`, hủy job, kill cả process tree và cleanup phải được đo khi batch sau fail; không có progress/receipt thành công ở mọi đường lỗi. Cấu hình trần thực tế và run manifest được review cùng kết quả, không đặt con số giả làm mặc định production trong bản nháp này.

## 5. Quyết định staging/ADR cần người sở hữu chốt trước khi triển khai worker

1. Host staging nào là disposable, ai cấp quyền và ngân sách, và ai xác nhận nó tách khỏi production/secret/DB thật? Chưa có thông tin đã xác nhận trong repo; không tự tạo hay chạy PoC trên host production.
2. Ranh giới được chấp nhận: container rootless trên host riêng với cgroup v2/user namespace/seccomp/network deny đã **đo**, microVM, hay dịch vụ grader tách host? Ai review rủi ro kernel chung, cập nhật image/runtime và kế hoạch sự cố?
3. Chốt manifest các trần CPU, wall, RAM/swap, PID, scratch, stdout/stderr, queue/concurrency, deadline dọn dẹp và SLO latency/cost; chứng minh enforcement trên staging. Nếu thiếu controller/boundary, giữ lane `isolated_worker_required`.
4. Chốt chính sách dữ liệu: code/đầu vào học viên đi đâu, lưu bao lâu, log/trace có gì, image/fixture có digest nào, ai được xem bằng chứng. Nếu dùng dịch vụ ngoài, quyết định privacy riêng.
5. ADR mới phải supersede phần ranh giới subprocess của ADR-0007, kiểm lại ADR-0008, định nghĩa fail-closed policy và tách ca luyện tập/ca server. Chỉ sau review bảo mật độc lập, spec **Approved for implementation** đã merge, PoC đạt, parity từng lane và full quality/E2E gate mới mở completion cho 20 khóa.

## 6. Thứ tự lát PR được đề xuất

1. PR đặc tả/ADR được review và merge; khóa quyết định staging còn thiếu trong mục 5 trước PoC.
2. PR policy fail-closed theo lesson kind và test âm ID mới; không mở engine. Đây là chốt an toàn cần có **trước** PR thêm ID khóa mới.
3. PR tách ca public/server, kiểm bundle và UX tiến độ chờ xác nhận; bảo toàn practice offline.
4. PoC hạ tầng, contract worker, parity Python và benchmark batch 25; mỗi lát có bằng chứng độc lập. Sau đó JS/TS/DOM/fetch, SQL theo gate riêng; Kotlin/Swift/bash tiếp tục tạm dừng nếu chưa có spec.
5. Mỗi khóa AI mới chỉ gắn bài code vào catalog khi policy/engine tương ứng đạt; lab GPU/provider/dataset ngoài grader dùng rubric/artifact được duyệt, không ghi `completed` chỉ từ client.

**Hiện trạng bằng chứng:** đây là phân tích source và bản nháp quyết định. Chưa chạy PoC staging, chưa đo latency batch, chưa kiểm bundle artifact mới, chưa có ADR được duyệt hoặc worker. Không dùng tài liệu này để bật chấm bài.
