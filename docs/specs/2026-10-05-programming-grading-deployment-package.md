# Gói triển khai chấm bài cô lập — đặc tả/ADR Proposed

| Mục            | Nội dung                                                                                                                                                                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trạng thái     | **Proposed / Draft — cần review kiến trúc và merge đặc tả trước mã bảo mật**                                                                                                                                                                                                    |
| Phạm vi        | Worker Python đầu tiên, supervisor tách API trên host grader riêng, container rootless ngắn hạn                                                                                                                                                                                 |
| Ngày           | 2026-10-05                                                                                                                                                                                                                                                                      |
| Cổng phát hành | **Đóng**: chưa có staging, chưa có PoC thực nghiệm, không bật lane hoặc chấm code người học                                                                                                                                                                                     |
| Nguồn          | [Dependency](2026-10-05-programming-isolated-grading-dependency.md), [kế hoạch PoC](../research/2026-10-05-programming-grading-poc-plan.md), [review policy](../research/2026-10-05-programming-completion-policy-review.md), [ADR-0014](../adr/0014-worker-cham-bai-co-lap.md) |

## 1. Quyết định ADR đề xuất và giới hạn

Đề xuất host grader **riêng** với API, không chứa database, secret sản phẩm, dữ liệu người học lịch sử hoặc kết nối quản trị production. Trên host này, Docker Engine rootless chạy dưới tài khoản dịch vụ riêng; supervisor tin cậy nhận job qua kết nối nội bộ có xác thực, tạo **một container mới cho mỗi test case**, thu kết quả, xóa toàn bộ container/scratch rồi tạo envelope. Container chứa mã học viên không nhận Docker socket, token transport, expected output, quyền kết nối mạng hay mount host. API vẫn là nơi xác thực người học, lấy test từ registry server, tính pass/fail, ghi receipt và tiến độ trong transaction.

Đây là phương án được chọn **để chuẩn bị gói**, chưa khẳng định ranh giới đủ an toàn trên hạ tầng thật. PoC P00–P15 và review bảo mật độc lập quyết định chấp nhận container; nếu CPU cgroup, user namespace, seccomp, mạng none, cleanup hoặc isolation không kiểm chứng được thì giữ lane đóng và chuyển ADR sang microVM/host grader khác. ADR này dự kiến thay thế **phần chọn subprocess làm ranh giới** của ADR-0007, giữ nguyên nguyên tắc server phải chấm lại; rà lại ADR-0008 vì mức tin cậy cũ không còn áp dụng.

Container rootless vẫn dùng chung kernel với host. API tin supervisor đã thực thi đúng; nếu host grader bị chiếm thì chứng chỉ supervisor/envelope có thể bị giả. mTLS và digest chỉ xác thực kênh/binding, không chứng minh execution đúng trước một supervisor bị compromise. Reviewer/owner phải chấp nhận residual trust risk hoặc chọn microVM trước activation; probe hữu hạn không chứng minh mọi kiểu escape đều bị chặn.

Không dùng `node:vm`, subprocess Python trên API host, WASM trong API, Docker daemon TCP công khai, Docker-in-Docker privileged hoặc chạy probe mã không tin cậy trên máy phát triển hiện tại. Mọi image và cấu hình bên dưới là **đề xuất**, không là chứng nhận production.

## 2. Ranh giới và sơ đồ luồng

```text
Browser -> API progress (auth, ID/policy, rate/batch/receipt)
                -> adapter worker (default disabled, mTLS)
                   -> supervisor trên host grader (quota/queue, Docker socket rootless)
                      -> container một ca, network=none, không secret/socket
                   <- envelope bị giới hạn kích thước, có định danh/digest
                <- API so expected server-only, allTestsPassed
             -> DB transaction + receipt chỉ khi cả batch hợp lệ và đạt
```

Supervisor là bề mặt tin cậy có quyền điều khiển Docker rootless; chạy dưới tài khoản chuyên dụng trên host chỉ làm grader. Chỉ supervisor được đọc Unix socket rootless, socket không mount vào container, không export qua TCP. API không được truy cập Docker. Firewall của host chỉ cho địa chỉ API/proxy định danh tới cổng supervisor; không publish cổng grader ra Internet. Container mã học viên không có ingress/outbound; Docker `network none` cần được xác minh thêm bằng probe P06, không suy rằng ứng dụng tự chặn socket là đủ.

## 3. Contract phiên bản 1

### 3.1 Request API → supervisor

Payload được Zod/JSON Schema strict, giới hạn tổng byte **trước parse**, version hóa và canonicalize để băm SHA-256. Mỗi request có `protocolVersion`, `jobId` ngẫu nhiên do API tạo, `attemptId` (hoặc request ID server cấp cho đường đơn), `batchId`, `lessonId`, `lessonRevision`, `lane='python'`, `runtimeImageDigest`, `fixtureDigest`, `codeDigest`, `code`, `caseId`, `caseInputDigest`, `stdinLines` và `deadlineAt`. `dataset/fixture` chỉ cho phép artifact có digest pin trong supervisor; không nhận đường dẫn host, lệnh shell tùy ý hoặc image name do client chọn. Một job = một case; số case và thứ tự batch được API lấy từ registry, không lấy từ body client. Không gửi `expected`, bộ đáp án bí mật hoặc DB credential.

`lessonRevision` là ID phiên bản nội dung được API chốt tại lúc chấm; `caseInputDigest` băm input đã canonicalize; `codeDigest` băm code nhận được. Nếu assessment revision có expected output không công khai, định danh phiên bản phải là giá trị opaque/không cho phép suy ngược từ digest expected ngắn. API lưu bảng job đang chờ để đối chiếu tất cả trường hồi đáp; echo một digest không tự chứng minh output đúng. Không log payload code/stdin. Raw code tồn tại tối thiểu trong RAM/kênh TLS/container scratch rồi xóa; chính sách giữ dữ liệu outbox cần review riêng.

Mỗi job có `jobId` duy nhất, `batchId`, `caseId` duy nhất trong batch, `attemptId` gắn user đã xác thực ở API. Nếu cần retry job sau lỗi transport, supervisor chỉ trả lại một kết quả đã lưu cho **cùng request digest** trong TTL ngắn, hoặc trả `unknown outcome` để API báo 503 và chấm lại an toàn; tuyệt đối không ghép kết quả attempt khác. Receipt DB hiện tại chỉ xác nhận batch đã hoàn tất, không coi timeout là pass. `attemptId` lặp với body khác phải trả conflict sau khi kiểm digest; kiểm hiện trạng receipt trước khi sửa.

### 3.2 Result supervisor → API

Envelope strict gồm `protocolVersion`, `jobId`, `attemptId`, `batchId`, `lessonId`, `lessonRevision`, `caseId`, `caseInputDigest`, `codeDigest`, `runtimeImageDigest`, `fixtureDigest`, `executionStatus` thuộc `completed | code_error | timed_out | resource_exhausted | cancelled | infrastructure_error`, `exitCode/signal`, `stdout`, `stderr`, `stdoutTruncated`, `stderrTruncated`, `durationMs`, `resourceReadings` có nguồn và `supervisorInstanceId`. Supervisor tự tạo envelope **ngoài container**; stdout của học viên luôn là bytes dữ liệu, dù trông như JSON `passed:true` hoặc giả ID. Mọi field định danh phải khớp pending request, không thừa/thiếu/lặp case, đúng version, đúng số byte và trước deadline. Sai envelope = lỗi hạ tầng, không ghi `completed`.

`stdoutTruncated=true`, output vượt quota, status khác completed, exit khác 0, phản hồi đến muộn hoặc kết quả không đủ case đều **không thể đạt** dù phần prefix của stdout khớp expected. API tự gọi `gradeTestCase`/`allTestsPassed` từ assessment registry server. Worker không gửi `passed`, điểm, quyền hoặc lệnh ghi DB. Khi một batch có lỗi hạ tầng, API không ghi dòng progress/receipt thành công nào; phân biệt 400 bài sai với 503 lỗi hạ tầng và 429 quá tải, có `Retry-After` ổn định. Trong request 5 bài/25 ca, tiền kiểm toàn bộ policy, code, case count, lesson revisions, admission và queue reservation trước dispatch case đầu; giải phóng reservation khi kết thúc/hủy. Nếu không thể reserve toàn batch, từ chối trước chạy.

### 3.3 Transport, identity và lỗi

Kết nối API↔supervisor dùng mTLS trên mạng riêng hoặc VPN được phê duyệt, xác minh chain, hostname/service identity hai phía và rotation chứng chỉ; application allowlist chỉ nhận một principal API được cấu hình, lane/image/fixture allowlist; firewall deny mặc định. Không dùng bearer token trong URL/log. Mọi request có `Content-Type`, schema version, kích thước tối đa, deadline và correlation ID. Từ chối replay ngoài TTL, cert hết hạn, unknown principal, unknown lane, image/tag không pin digest, fixture không pin, invalid JSON và duplicate `jobId` khác digest. Token/cert chỉ nằm ở API/supervisor, không ở container. Không gửi Docker socket qua SSH/TCP để API trực tiếp tạo container.

Health/readiness tách nhau: `liveness` chỉ nói supervisor còn sống; `readiness` yêu cầu policy bundle đã ký/pin, image digest có sẵn, rootless context đúng, cgroup/seccomp/network checks đạt, queue có chỗ và **staging evidence + activation flag hợp lệ**. Trước khi có evidence/flag, trả unavailable ngay cả khi fake tests xanh. Adapter API mặc định `disabled`; không có fallback sang engine cũ. Kill switch theo lane tắt ngay, không xóa progress cũ; rollback version supervisor/image nhưng giữ lane đóng cho tới revalidate digest.

### 3.4 Encoding, giới hạn và invariant

Hai phía dùng encoding `canonical-json-v1`: UTF-8 hợp lệ, khóa object được xếp theo thứ tự từ điển, không whitespace ngoài chuỗi, giá trị serialize theo JSON, không key trùng. Decoder dùng UTF-8 fatal, parse có trần độ sâu 8, validate strict rồi serialize lại; bytes phải đúng canonical bytes ban đầu. Cách so bytes bác duplicate key/biểu diễn số không canonical; không chỉ gọi `JSON.parse` rồi Zod. Chuỗi có surrogate đơn lẻ, unknown field, số không hữu hạn hoặc ngoài trần bị từ chối trước digest/dispatch. Payload browser không dùng hợp đồng transport này; API tạo envelope sau khi đã nhận/kiểm request hiện hành.

Serializer dùng chung trong package contract: mọi key là ASCII schema-defined; sort tăng dần bằng so sánh code unit (`a < b`), serialize string bằng `JSON.stringify` của Node 22 sau kiểm Unicode scalar, serialize số bằng `JSON.stringify` sau kiểm integer an toàn không âm (trừ exit/signal theo schema), giữ thứ tự array, nối object/array bằng dấu `,`/`:` không khoảng trắng. Không gọi `localeCompare`, không normalize Unicode/code/newline. Metric dùng integer theo đơn vị cố định như microsecond/byte, không float. Test vector tối thiểu: object đảo thứ tự key ra cùng bytes, array đảo thứ tự ra khác bytes, chuỗi xuống dòng/quote/Unicode ra bytes đã chốt, `-0`/duplicate key/surrogate/UTF-8 hỏng bị từ chối, hai phía tính cùng SHA-256 trên cùng vector.

`codeDigest = SHA256(UTF8(code nguyên bản))`; `caseInputDigest = SHA256(canonical-json-v1(stdinLines))`; `fixtureDigest = SHA256(canonical-json-v1(manifest fixture đã pin gồm version và danh sách artifact path/digest có thứ tự xác định))`. Transport request digest băm toàn envelope canonical (có job/deadline); semantic retry digest băm endpoint/schema/user binding và **các field body client đã validate, giữ thứ tự items**, loại server-generated job/deadline/timestamp/metrics. Semantic digest không tự thay vì assessment revision mới: attempt pin assessment/runtime/fixture revision riêng khi admission đầu; retry body giống dùng binding đã pin. Không dùng transport digest làm receipt body digest. Các thuật toán/cấu trúc này phải có test vector cố định và negative controls trước tích hợp.

| Nhóm field                                           | Kiểu và trần v1                                                                                                                                                        |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `protocolVersion`                                    | Literal `1`; không tự downgrade hoặc đoán version                                                                                                                      |
| `jobId`, `batchId`, `caseId`, `supervisorInstanceId` | ASCII `[A-Za-z0-9_-]`, 1–64 ký tự; job do API tạo, case từ registry                                                                                                    |
| `attemptId` transport                                | Opaque ID server cấp, 1–64 ASCII như trên; API map với user/endpoint/receipt ID/request digest. Không đổi format `attemptId` của endpoint client trong lát contract    |
| `lessonId`                                           | 1–120 ASCII, phải resolve trong registry/policy; `lessonRevision` 1–64 ASCII opaque, không tiết lộ expected output                                                     |
| `codeDigest`, `fixtureDigest`, `caseInputDigest`     | 64 hex thường SHA-256; digest tính trên canonical input tại API và đối chiếu ở supervisor                                                                              |
| `runtimeImageDigest`                                 | Format `sha256:` + 64 hex thường, thuộc allowlist cục bộ đã pin                                                                                                        |
| `lane`, `executionStatus`                            | Enum hữu hạn đã khai ở §3.1/3.2; unknown bị từ chối                                                                                                                    |
| `code`, `stdinLines`                                 | Code tối đa 4.000 UTF-16 units và 16 KiB UTF-8; stdin tối đa 20 dòng, mỗi dòng 200 UTF-16 units/800 byte UTF-8, tổng 16 KiB; giữ nguyên input, không trim để đổi nghĩa |
| `deadlineAt`                                         | UTC ISO-8601 canonical có milliseconds, thời gian hợp lệ; deadline con ≤ deadline batch, trong trần cấu hình và TTL clock-skew đã review                               |
| `stdout`, `stderr`                                   | Mỗi luồng tối đa 16 KiB UTF-8; decoder incremental fatal; quota byte áp trước decode/JSON, không lấy phần prefix làm đạt                                               |
| `exitCode`, `signal`                                 | Exit integer 0–255 hoặc null; signal null hoặc enum signal runtime cho phép, không string tùy ý                                                                        |
| `stdoutTruncated`, `stderrTruncated`                 | Boolean bắt buộc, không default false khi thiếu                                                                                                                        |
| `durationMs`, metric                                 | Integer hữu hạn không âm ≤ deadline/config; metric optional có tên/đơn vị/nguồn allowlist, không dùng giá trị missing làm 0                                            |
| Envelope                                             | Request tối đa 64 KiB, response tối đa 256 KiB kể cả JSON escaping/metadata; chặn trong stream trước parse. TLS handshake/header/body đều có timeout hữu hạn           |

`completed` chỉ hợp lệ khi `exitCode=0`, `signal=null`, hai cờ truncated đều false và mọi binding khớp; đây mới là execution sạch, API vẫn phải so ca server để quyết định đạt. `code_error` phải có exit khác 0 hoặc signal đã cho phép; timeout/resource/cancel/infrastructure không được nhận như completed. Job bị kill có thể chưa có exit cuối nên dùng null đúng trạng thái; thiếu field bắt buộc không được chuẩn hóa thành thành công. Response stream vượt trần, UTF-8 hỏng, ID/digest/revision lệch hoặc status mâu thuẫn đều là lỗi hạ tầng và không ghi tiến độ.

### 3.5 Deadline, cleanup và evidence

Deadline batch bắt đầu ở admission và bao phủ queue, cold start, execution, cleanup và transaction; mỗi case có deadline con không vượt deadline batch. Hết deadline hoặc API/client disconnect thì hủy các case còn lại, ngừng dispatch, yêu cầu cleanup và trả trạng thái chưa xác nhận. Retry cùng attempt phải dùng một reservation/job binding hiện hành hoặc kết quả đã xác nhận đúng digest, không nhân batch song song ngoài quota. Hồ sơ 25 ca × 10 giây/concurrency 1 chưa được xác nhận phù hợp HTTP/outbox; B25 phải đo và so timeout proxy/API/client trước rollout, không giả định đồng bộ đã dùng được.

Chỉ bắt đầu transaction khi toàn bộ kết quả/binding/cleanup đã hợp lệ và còn ngân sách commit đã cấu hình. Cancellation trước gửi COMMIT làm rollback; sau khi COMMIT đã gửi mà kết nối/deadline mất, trạng thái có thể **chưa biết**, không được khẳng định DB chưa ghi hoặc chấm lại vô điều kiện. API reconcile receipt theo cùng attempt/digest trên kết nối mới; receipt/progress ghi cùng transaction. Commit đã thành công nhưng mất response thì retry trả receipt thành công; không xóa tiến độ đã xác nhận. Test bắt buộc mô phỏng cancellation trước COMMIT và mất response sau COMMIT.

Chỉ giải phóng execution capacity sau khi xác nhận container/descendants/scratch/cgroup thuộc job đã hết. Cleanup quá hạn hoặc trạng thái không xác định làm host **quarantine/unavailable**, dừng nhận job, giữ capacity reservation và alert cho người vận hành; không chỉ báo lỗi rồi tiếp tục. Supervisor khởi động lại phải reconcile theo job labels/manifest, dọn hoặc quarantine orphan trước readiness. Runbook phải có đường can thiệp khi không thể dọn; không dùng kết quả của host chưa reconcile để ghi completed.

Evidence/approval không phải boolean người chạy tự điền. Staging probe cần approval được xác thực từ trust root của chủ hạ tầng, ràng host fingerprint/budget/expiry và danh tính reviewer. Activation cần approval khác, ràng host, image/policy/seccomp/kernel/protocol/fixture digests và run evidence đã review; hết hạn hoặc bất kỳ binding thay đổi thì lane đóng. CLI probe có quyền kiểm staging không được tự tạo approval activation. Package fake/dry-run không phát hành evidence thật.

### 3.6 Ca server và receipt

Ca đánh giá server/expected phải tách khỏi import graph browser trước activation. Không trả raw stdin/stdout/stderr của ca server về client, kể cả ca lỗi: mã học viên có thể in input ca ẩn. Client chỉ nhận pass/fail và lỗi đã lọc theo taxonomy; output raw chỉ tồn tại nội bộ theo chính sách dữ liệu, không log/code trace công khai. Ca practice công khai vẫn có phản hồi đủ để học.

Receipt hiện chỉ ràng user + attemptId + endpoint, chưa ràng body digest. Lát sửa receipt cần spec/migration cộng dồn riêng: request cùng identity nhưng digest khác trả conflict, concurrent retries cùng digest chỉ một execution/transaction, retry cùng digest dùng assessment revision đã pin cho attempt. Receipt lịch sử thiếu digest tiếp tục chỉ được đọc theo đường legacy đã định, không mặc định coi là receipt có binding mới hoặc tái chạy âm thầm; chính sách chuyển tiếp phải được owner duyệt trước source. Không tuyên bố binding này đã có trong API hiện hành.

## 4. Image, engine và cấu hình ranh giới

Lát đầu chỉ Python. Dockerfile đa tầng tạo image tối thiểu, version Python cố định, dependency lock + SBOM, build reproducible ở mức khả thi, scan CVE/license và pin `sha256:` digest trong manifest đã review. Không chấp nhận `latest`, build runtime từ input học viên hoặc tự động pull image chưa duyệt. Prelude `pytest`/`httpsim`/`apisim` nếu mở sau phải là artifact version riêng và qua parity. JS/TS/DOM/fetch/SQL, Kotlin/Swift/bash giữ đóng cho tới spec/lane và image riêng. SQL không có DB sản phẩm; DOM/fetch chỉ dùng fixture giả, không có mạng thật.

Supervisor khởi tạo container với user không đặc quyền, root filesystem read-only, không capabilities, `no-new-privileges`, seccomp hiệu lực, `network none`, cgroup CPU/memory/PID, tmpfs scratch giới hạn, mount chỉ image runtime read-only và scratch của job, không host path, không Docker socket, không env của API. `--privileged`, `--network host`, `--pid host`, `--ipc host`, device passthrough và seccomp unconfined bị schema/policy từ chối. Docker daemon rootless dưới `systemd --user`; service systemd của supervisor chạy cùng host dưới identity được review, access socket chỉ qua filesystem ACL tối thiểu. Có thể đóng gói supervisor qua Compose **trên host grader** nếu không phải mount socket vào container không tin cậy; phương án ưu tiên là user systemd unit trực tiếp cho supervisor để tách rõ quyền Docker socket. Tất cả unit/Compose là template cần điền theo host, không chạy ở máy này.

**Hồ sơ ngân sách khởi đầu để thử trên staging, không là ngưỡng production:** 1 vCPU/case, 512 MiB RAM/case, swap bằng 0 nếu host hỗ trợ đúng, 32 PID/case, tmpfs 16 MiB/case, stdout và stderr mỗi luồng 16 KiB, wall 10 giây/case, cleanup deadline 5 giây, queue 2 batch, đồng thời 1 container. Đây là trần bảo thủ để quan sát, có thể khiến batch 25 ca quá chậm; không bật product với các số này. Manifest cho phép chủ hạ tầng chọn giá trị sau khi đo corpus hợp lệ, trong giới hạn host tổng thể và review thay đổi cấu hình. Bắt buộc đo CPU controller được delegate (rootless mặc định có thể chỉ có memory/pids), memory/swap và PID enforcement; nếu cờ Docker bị bỏ qua, readiness phải fail. Bounded HTTP request/deadline, queue và retry phải khớp ngân sách; nếu 25 ca cần xử lý bất đồng bộ, thay đổi API/UX bằng spec riêng thay vì tăng timeout vô hạn.

## 5. Gói có thể chuẩn bị khi chưa có staging

| Thành phần                            | Có thể tạo/review ngay                                                                                                                                                                                                            | Không được tuyên bố từ máy hiện tại                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Contract shared strict và API adapter | Schema, canonical digest, pending-job binding, error taxonomy, fake transport, fail-closed tests; adapter disabled mặc định                                                                                                       | Khả năng cô lập code người học                                |
| Supervisor package                    | State machine, quota/queue, envelope tạo ngoài runtime, Docker command policy builder **không thực thi** trong CI, systemd/Compose template, SBOM/image build recipe                                                              | Docker rootless/cgroup/seccomp/network hoạt động trên staging |
| Fake runtime/harness                  | Stub deterministic chỉ trả fixture output hữu hạn; fault injection timeout, duplicate, truncated, crash, delayed result, mixed IDs; tài nguyên/process không bị thử thật                                                          | P05–P12 là bằng chứng sandbox; fake chỉ kiểm logic            |
| CLI evidence                          | `preflight --manifest` đọc thông số và capability; `probe --case Pxx` chạy **chỉ khi** manifest chứa staging host fingerprint/approval, target disposable, budget và explicit safety gate; `report` kết xuất JSON/Markdown đã lọc | P00–P15 đạt, parity và latency batch                          |
| Runbook                               | Provisioning, certificate rotation, image promotion, emergency lane off, cleanup, evidence/rollback                                                                                                                               | Đã sẵn sàng phát hành                                         |

Packaging local/CI chỉ kiểm TypeScript/schema/logic bằng fake runtime và có trần thời gian/đầu ra. Không thực thi learner code, không tạo container thật, không cài Docker, không probe network/process/memory trên máy hiện tại. Chặn `probe` nếu thiếu chứng nhận staging; không có cờ `--force` bỏ qua safety gate. Kịch bản fake phải có negative control (`stdout` giả envelope pass + exit lỗi vẫn fail) để chứng minh harness không tin stdout.

## 6. Manifest/CLI thực nghiệm staging

Run manifest bất biến ghi: run ID/time, host fingerprint đã khử thông tin nhạy cảm, xác nhận disposable/tách production, người phê duyệt, repo commit, protocol/fixture/test corpus digest, image digest, Docker/rootless version+context, kernel/cgroup v2 và delegated controllers, seccomp profile digest, network policy, tất cả quota/timeout/queue/concurrency, credential identity (chỉ ID, không secret), cấu hình metric, chi phí/giới hạn run, deadline cleanup và evidence URI. `preflight` chỉ kiểm khả năng/cấu hình, không chạy code. `probe` yêu cầu P00 pass và từng case có budget riêng, dùng sentinel/canary giả do nhóm sở hữu, không chạm production; `report` đánh dấu `chưa chạy / đạt / không đạt / không kiểm được`, lưu cả kết quả âm.

| Nhóm    | Ca bắt buộc và bằng chứng                                                                                                                                                                                                                                 |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P00     | Rootless daemon/context thực tế, user namespace, cgroup v2 + CPU/memory/PID delegated, seccomp, network none, mount/ACL; thiếu gì dừng execution.                                                                                                         |
| P01–P02 | Ba lời giải mẫu `p1-u4-l1`, `mathai-u3-l3`, `llmagent-u2-l2` và lời giải sai/ca biên; mỗi case container mới; so client/worker ở commit pin.                                                                                                              |
| P03–P04 | Stdout giả JSON/ID/`passed`, exit lỗi; envelope thiếu/lặp/trộn case ID hoặc digest, timeout đến muộn; API/harness từ chối.                                                                                                                                |
| P05–P07 | Sentinel env/file/socket, mạng tới canary giả, scratch/mount giữa attempts; ghi match/no-match chứ không in sentinel.                                                                                                                                     |
| P08–P11 | CPU/wall, RAM/swap, PID/descendants, scratch/disk/output quotas với probe hữu hạn dưới host budget; đo enforcement và cleanup.                                                                                                                            |
| P12–P15 | Cancel/crash, admission/backpressure, log/ACL, phục hồi corpus sau lỗi; không orphan/container/scratch/cgroup tồn.                                                                                                                                        |
| B25     | 1×1, 1×10, 5 bài/tổng 25 ca; pass, ca 25 sai, timeout/crash ca 25, queue đầy, receipt replay và batch đồng thời trong host budget. Đo validation, queue, cold start, execution, cleanup, DB/receipt, end-to-end, CPU/RAM/PID/scratch, 429/503 và chi phí. |

Giá trị p50/p95/p99 chỉ công bố khi số mẫu và phương pháp đủ; không lấy ba bài mẫu làm SLO. Owner/product phải duyệt mục tiêu latency/cost trước khi gọi B25 đạt. Mỗi lần đổi image/profile/kernel/fixture/policy quan trọng tạo run mới; không tái sử dụng kết quả cũ. Không chạy payload thoát sandbox thực tế hoặc DoS không giới hạn; probe hữu hạn đủ quan sát giới hạn. PoC đạt không chứng minh không thể thoát sandbox, nên phải có review bảo mật độc lập.

## 7. Runbook và rollback

1. **Provision riêng:** chủ hạ tầng cấp host staging trống, không secret/DB, firewall mặc định deny, tài khoản rootless, UID mapping, cgroup delegation, audit/log; ghi fingerprint. Không dùng máy hiện tại hoặc production làm staging.
2. **Cài template:** cài image theo digest đã scan, daemon `systemd --user`, supervisor service; chứng minh Docker socket chỉ supervisor đọc, container không có socket/mount/env, kênh mTLS hai chiều và cert rotation. Không bật API adapter.
3. **PoC có giới hạn:** chạy `preflight`, P00–P15, B25 và parity đầy đủ; thu evidence đã lọc. Reviewer độc lập ký kết luận; nếu bất kỳ case không đạt/không kiểm được hoặc chi phí/latency không được chấp nhận, lane tiếp tục đóng.
4. **Rollout theo lane:** sau ADR/spec Approved, CI đầy đủ, kiểm bundle ca ẩn, E2E UI/outbox và kiểm tải đạt, bật canary Python nhỏ với kill switch và alert backlog/503/timeout. Mọi thay đổi quyền ghi `completed` đi qua server result. JS/TS/SQL là lượt sau.
5. **Sự cố:** tắt lane tại API trước, ngừng nhận job, hủy/cleanup job đang chạy, không fallback chấm cũ; 503 có retry để outbox giữ lượt; điều tra log không code/PII. Nếu host compromise, thu hồi cert, cô lập host và kiểm phạm vi dữ liệu, không tự chuyển sang host API.
6. **Rollback:** giữ adapter disabled hoặc tắt lane, quay về image/supervisor digest đã xác minh nếu cần nhưng vẫn đóng lane cho tới kiểm lại; không xóa progress/receipt đã xác nhận, không tự hạ completed cũ. Khôi phục GET/`in_progress` và mô phỏng hiện có; version schema có tương thích đọc hoặc rollback ứng dụng được test.

## 8. Kế hoạch PR nhỏ và cổng chặn

1. **PR tài liệu**: ADR Proposed này, bổ sung dependency spec về fail-closed/ca ẩn, threat model, B25 và danh sách quyết định owner. Review/merge trước mã nguồn theo `AGENTS.md`; trạng thái Proposed không tự mở quyền triển khai. Có thể xin phê duyệt kiến trúc cho package **disabled** trước staging, nhưng activation vẫn chặn.
2. **PR contract/policy**: schema worker + lesson completion policy fail-closed, route tests ID tiền tố mới và mixed batch; không worker thật, không bật lane. Đây là lát an toàn độc lập.
3. **PR fake adapter/supervisor core**: transport fake, pending-job binding, state machine/admission, envelope, fault tests, CLI dry-run/preflight, service/image template không chạy; config default disabled. Một PR nếu vẫn đủ nhỏ, tách contract và core nếu diff quá rộng.
4. **PR packaging Python image**: Dockerfile/lock/SBOM/digest promotion và supervisor Docker adapter với policy builder; chỉ build/scan, không nhận request người học. Cần ADR/spec triển khai Approved trước security code.
5. **PR evidence staging** sau khi có host: manifest + P00–P15/B25/parity, kết luận review, chốt budgets/SLO và ADR Accepted hoặc đổi phương án. Không giả kết quả khi chưa có staging.
6. **PR nối API/canary Python**: chỉ khi gate AC-1…8 của dependency spec, bảo mật, CI quality/E2E và owner activation quyết định đều đạt. Mở các lane khác từng PR riêng.

Các PR 2–4 có thể chuẩn bị **chỉ sau khi** đặc tả triển khai tương ứng Approved và merge; vẫn giữ `disabled` cho tới PR 6. Không thêm ID khóa AI mới vào catalog trước policy fail-closed. Không ghép nội dung 20 khóa, worker và activation vào cùng PR.

## 9. Quyết định thực sự còn cần owner

- Chọn/cấp **host staging riêng**, người vận hành và ngân sách hữu hạn; xác nhận không có secret, data hoặc kết nối production.
- Chấp thuận threat model/kiến trúc rootless container trên host riêng làm ứng viên PoC, người review bảo mật độc lập và mức rủi ro còn lại sau PoC; hoặc yêu cầu microVM ngay.
- Chốt SLO/UX cho batch 25 ca, chi phí tối đa, thời hạn lưu code/trace/manifest và quy tắc dữ liệu ngoài host API.
- Sau evidence, quyết định có cho canary/activation hay giữ lane đóng; quyền triển khai package disabled **không đồng nghĩa** quyền kích hoạt production.

Không cần hỏi lại quyền lập PR/merge tài liệu hay mã đã được owner cho phép theo điều kiện gate hiện hành. Các mục trên là quyết định kiến trúc/hạ tầng chưa có dữ liệu để suy đoán.

## 10. Nguồn kỹ thuật đã kiểm lại

- [Docker rootless mode](https://docs.docker.com/engine/security/rootless/): daemon và container chạy không quyền root; kiểm context/`docker info` để xác nhận thực tế.
- [Docker Engine security](https://docs.docker.com/engine/security/): kernel và daemon là các bề mặt phải review; rootless không tạo kernel riêng.
- [Docker rootless tips: limiting resources](https://docs.docker.com/engine/security/rootless/tips/#limiting-resources): cgroup flags cần cgroup v2 và systemd, CPU controller thường phải delegate riêng; `Cgroup Driver: none` khiến giới hạn bị bỏ qua.
- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints/): container mặc định không có giới hạn tài nguyên.
- [Docker seccomp profiles](https://docs.docker.com/engine/security/seccomp/) và [network none](https://docs.docker.com/engine/network/drivers/none/): cần kiểm profile và network policy hiệu lực.
- [Docker rootless tips: daemon](https://docs.docker.com/engine/security/rootless/tips/#daemon): service rootless dùng `systemd --user`; không dùng system-wide service với `User=` như thay thế tương đương.

**Bằng chứng hiện tại:** đối chiếu source, ADR/spec hiện hữu và tài liệu Docker chính thống; chưa chạy lệnh Docker, probe hoặc benchmark, chưa xác định staging và chưa sửa mã/repo.
