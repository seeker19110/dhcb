# Kế hoạch PoC: ranh giới cô lập cho chấm bài Python

> Trạng thái: **Proposed**, ngày 2026-10-05. Đây là đề xuất để review, chưa phê duyệt kiến trúc hoặc triển khai. Chưa chọn host staging, chưa cài Docker, chạy probe hay sửa engine/API. Tài liệu không mở lại lane chấm bài đang tạm dừng.

## 1. Câu hỏi cần giải quyết

Một supervisor chạy ngoài môi trường mã học viên có thể thu output Python trong giới hạn tài nguyên, thu hồi toàn bộ execution sau lỗi, rồi chuyển bằng chứng có định danh cho bộ chấm tin cậy hay không?

PoC chỉ giải quyết câu hỏi này trên hạ tầng staging được chọn và ghi nhận cụ thể. Kết quả đạt là bằng chứng đầu vào cho ADR; chưa phải điều kiện đủ để khôi phục `completed` hoặc phát hành toàn bộ 20 khóa AI Engineering.

Tài liệu liên quan đã đọc:

- [Đặc tả phụ thuộc grader — Draft / In review](../specs/2026-10-05-programming-isolated-grading-dependency.md).
- [ADR-0007](../adr/0007-completion-evidence-sandbox-lap-trinh.md): giữ nguyên nguyên tắc server chấm lại; quyết định mức cách ly cũ cần được ADR mới xem xét thay thế.
- [Runbook bảo mật hiện tại](../security-rollout-2026-09-27.md): các engine thiếu cách ly vẫn đóng.
- [Engine server hiện hành](../../packages/subject-programming/completionSandboxServer.ts) và [grader thuần](../../packages/subject-programming/grading.ts).

Phạm vi nhỏ nhất gồm một runtime Python, một supervisor thử nghiệm, execution độc lập theo từng test case, dữ liệu giả và báo cáo bằng chứng. Chưa nối route tiến độ, PostgreSQL, outbox, provider AI, queue phân tán hoặc các lane ngôn ngữ khác. Không thay đổi receipt, quyền bậc, mastery hay tiến độ đã có.

## 2. Thông tin Docker đã kiểm từ nguồn chính thống

Đã mở các trang dưới đây ngày 2026-10-05. Chúng mô tả cơ chế; cấu hình staging thực tế vẫn phải đo riêng.

| Nguồn                                                                                                     | Điều có thể dùng trong quyết định PoC                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Docker rootless mode](https://docs.docker.com/engine/security/rootless/)                                 | Daemon và container chạy trong user namespace với user không phải root trên host. Rootless là một lớp giảm đặc quyền; cần kiểm daemon/context thực sự được dùng.                    |
| [Rootless: limiting resources](https://docs.docker.com/engine/security/rootless/tips/#limiting-resources) | Các cờ giới hạn cgroup của rootless cần cgroup v2 và systemd; nếu điều kiện không đạt, cờ có thể bị bỏ qua. Phải kiểm controller được delegate, đặc biệt CPU, cùng phép đo thực tế. |
| [Resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)                   | Container mặc định không có trần tài nguyên. Giới hạn memory, swap và CPU có ý nghĩa khác nhau; ghi rõ cấu hình và đo enforcement, không chỉ kiểm chuỗi tham số.                    |
| [Seccomp security profiles](https://docs.docker.com/engine/security/seccomp/)                             | Seccomp phụ thuộc hỗ trợ của kernel/runtime; profile mặc định là allowlist syscall. PoC phải ghi profile hiệu lực và không dùng `unconfined` để vượt lỗi tương thích.               |
| [None network driver](https://docs.docker.com/engine/network/drivers/none/)                               | Network `none` chỉ tạo loopback trong container. Kiểm thêm không dùng host network, không mount socket hay endpoint dịch vụ để tránh một đường liên lạc khác.                       |

Suy luận thiết kế của DHCB: chỉ chấp nhận cấu hình khi **cả** cấu hình khai báo, trạng thái hiệu lực và probe quan sát được cùng khớp. Một lệnh chạy thành công hoặc một lần code mẫu đạt không chứng minh đủ ranh giới.

## 3. Ranh giới tin cậy và trách nhiệm

Luồng PoC: **harness tin cậy → supervisor tin cậy → container Python không tin cậy → output bị giới hạn → supervisor tạo envelope → harness tự chấm**.

| Thành phần                   | Được biết/làm                                                                                                                                              | Không được giao                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Harness phía trusted service | Chọn lesson/test/version, giữ expected, tạo attempt/test identity, kiểm kết quả và gọi `gradeTestCase`/`allTestsPassed`                                    | Không ghi tiến độ thật trong PoC; không nhận lời khẳng định `passed` từ code học viên                                           |
| Supervisor ngoài container   | Chỉ nhận job đã validate; khởi tạo execution từ image/config cố định; thu stdout/stderr; quan sát exit/resource/deadline; kill/dọn execution; tạo envelope | Không eval code trong tiến trình supervisor; không cho job tự chọn image, mount, command thực thi host hoặc runtime flags       |
| Container/tiến trình Python  | Nhận đúng code và stdin của ca đang chạy; đọc runtime tối thiểu; ghi scratch riêng và stdout/stderr trong trần                                             | Không credential của supervisor/API, expected output, host filesystem, Docker socket, mạng dịch vụ, DB hay quyền ghi trạng thái |

**Stdout là dữ liệu học viên, không phải giao thức kết quả.** Mã học viên có thể in JSON giống hệt một kết quả thành công, ký tự điều khiển hoặc lượng dữ liệu lớn. Supervisor không parse stdout thành envelope và không tin `exitCode`, `timedOut`, attempt ID hay chữ `passed` do stdout tự khai. Kênh điều khiển và dữ liệu output phải được tách; envelope chỉ được tạo từ trạng thái execution do supervisor quan sát.

Envelope đề xuất cho review gồm: phiên bản giao thức, attempt ID, test-case ID, lesson/content digest, code digest, runtime image digest, trạng thái execution, exit status/signal khi có, stdout/stderr đã giới hạn, cờ truncated, duration và số đo tài nguyên có nguồn rõ. Trường do người gửi khai phải đối chiếu lại job đang chờ; thời gian/định danh dùng cho quyết định được supervisor giữ ngoài container. Không dùng số thứ tự mảng đơn thuần để ghép output với test khi kết quả về khác thứ tự.

Harness vẫn validate schema, số lượng/độ dài, đúng attempt/test/version và trạng thái terminal. Kết quả trùng, thừa, thiếu, về muộn hoặc sai phiên bản không tạo kết quả đạt. Timeout, resource limit, crash hoặc output bị cắt phải là execution không thành công dù phần stdout đã thu chứa đáp án đúng. Phân biệt lỗi code với lỗi hạ tầng; PoC ghi loại lỗi dự kiến, chưa đổi HTTP contract.

Credential xác thực supervisor với trusted service nằm ngoài container. PoC dùng dữ liệu/xác thực thử nghiệm riêng; không lấy khóa sản phẩm. Độ tin cậy của supervisor/runtime và residual risk khi dùng chung kernel phải được ADR đánh giá; schema hợp lệ không chứng minh supervisor đã an toàn nếu ranh giới host bị phá.

Mỗi test case dùng execution mới; không tái dùng container hay scratch trong PoC. Cách này giúp quan sát cô lập giữa các ca/lượt rõ ràng. Khả năng tái dùng để giảm độ trễ chỉ được xem xét sau với đặc tả reset và bằng chứng riêng.

## 4. Cấu hình staging còn phải chọn trước khi chạy

Chủ hạ tầng và reviewer bảo mật cần chốt bảng này trong bản đặc tả PoC được duyệt. Hiện tất cả mục hạ tầng đều **chưa xác minh**, không suy từ môi trường máy phát triển.

| Quyết định                     | Bằng chứng/câu trả lời cần có                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Host staging và quyền vận hành | Host nào là disposable, ai sở hữu, có tách khỏi production và không có secret/dữ liệu người học không; quyền cài/chạy/dọn PoC và ngân sách có được cấp không |
| Ranh giới host                 | Chạy grader trên host riêng hay cùng host staging giả lập; threat model và mức ảnh hưởng được chấp nhận khi kernel/runtime lỗi                               |
| OS/kernel/runtime              | Phiên bản, kiến trúc CPU, daemon/context, rootless UID mapping, cgroup v2, systemd và controllers được delegate; lịch cập nhật runtime/image                 |
| Policy execution               | User, capability set rỗng, no-new-privileges, seccomp profile, filesystem read-only, scratch có trần, mounts allowlist, env allowlist và network namespace   |
| Trần thử nghiệm                | CPU quota và tổng ngân sách CPU, wall deadline, RAM/swap, PID, scratch/disk, stdout/stderr, queue length, số execution đồng thời và deadline dọn dẹp         |
| Runtime Python                 | Phiên bản và image digest, thư viện cho phép, encoding/stdin/output, fixture runner và cách đối chiếu với Pyodide hiện hành                                  |
| Dữ liệu/quan sát               | Corpus giả, sentinel, endpoint canary do nhóm sở hữu, thư mục evidence, thời hạn lưu/xóa, metric/log không chứa code nhạy cảm                                |
| Review độc lập                 | Người kiểm ranh giới bảo mật, người kiểm parity nội dung, chủ hạ tầng ký xác nhận cấu hình thực tế                                                           |

Trần tài nguyên phải được đặt **trước** mỗi lượt chạy. Chọn mức khởi đầu bảo thủ trong ngân sách staging, đo corpus hợp lệ rồi điều chỉnh qua review; không để probe tiêu thụ không giới hạn để tìm điểm gãy. Ghi giá trị cụ thể trong run manifest và lý do chọn, không dùng các con số tùy ý ở tài liệu này như cấu hình production.

## 5. Ma trận kiểm chứng PoC

Mỗi hàng ghi `chưa chạy / đạt / không đạt / không kiểm được`, cấu hình, input fixture digest, kết quả mong đợi, kết quả thực và evidence URI. `Không kiểm được` không được tính là đạt. Probe chỉ là chương trình hữu hạn có giới hạn trong môi trường giả; không dùng khai thác thoát sandbox hoặc tác động production.

| ID  | Ca thử                                                    | Quan sát bắt buộc và điều kiện đạt                                                                                                                                                                                               |
| --- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P00 | Kiểm tra khả năng host trước execution                    | Manifest thể hiện rootless/context đúng, controller CPU/memory/PID được delegate, seccomp/network/mount policy hiệu lực. Thiếu ranh giới bắt buộc thì dừng PoC execution.                                                        |
| P01 | Lời giải mẫu `p1-u4-l1`, `mathai-u3-l3`, `llmagent-u2-l2` | Chạy mọi Make test case của ba bài ở commit đã pin; output và kết quả grader khớp reference. Ghi riêng thời gian cold start, execution và cleanup.                                                                               |
| P02 | Lời giải sai và ca biên của cùng corpus                   | Ví dụ sai dấu cập nhật gradient/nhánh biên phải rớt đúng ca; có negative control chắc chắn sai để phát hiện harness luôn báo đạt. Không chỉ chạy sampleSolution.                                                                 |
| P03 | In envelope giả rồi kết thúc lỗi                          | Stdout chứa JSON `passed`, attempt ID giả hoặc đáp án đúng rồi process exit lỗi. Supervisor vẫn trả envelope của job thật với exit lỗi; harness không báo đạt.                                                                   |
| P04 | Trộn/lặp/mất kết quả                                      | Fake supervisor boundary tạo response sai test ID, digest, số ca, duplicate, timeout rồi phản hồi muộn. Harness từ chối, không ghép sang attempt khác. Không cần API/DB thật.                                                    |
| P05 | Sentinel env/file/socket                                  | Sentinel giả chỉ nằm ở supervisor/host staging. Execution không đọc được sentinel hay socket quản trị; thư viện/runtime tối thiểu và env allowlist vẫn dùng được. Báo cáo chỉ ghi match/non-match, không ghi giá trị sentinel.   |
| P06 | Mạng và namespace                                         | Thử kết nối hữu hạn tới canary giả do nhóm sở hữu qua các đường đã liệt kê, kể cả địa chỉ literal và hostname; không kết nối được, phía canary không nhận traffic từ execution. Loopback của container không phải loopback host. |
| P07 | Scratch giữa hai attempt/test                             | Execution A ghi marker; execution B với identity khác không thấy marker; A không ghi được filesystem read-only hoặc scratch của B. Sau cleanup không còn mount/container/scratch/PID thuộc execution.                            |
| P08 | Wall timeout/CPU                                          | Probe tính toán bị dừng theo deadline và ngân sách đã chốt; quan sát toàn cgroup/process tree, không chỉ PID cha. Harness/supervisor còn phản hồi, execution kế tiếp vẫn chạy được.                                              |
| P09 | RAM/swap                                                  | Probe cấp phát có kiểm soát vượt mức execution trong host budget; giới hạn thật được áp, xác định loại kết thúc, không có OOM ngoài phạm vi execution, lần chạy sau phục hồi.                                                    |
| P10 | PID/child process                                         | Chương trình thử số tiến trình hữu hạn vượt quota một mức đã định; không vượt cgroup budget; kill/cancel thu hồi cả con/cháu. Không chạy fork bomb không giới hạn.                                                               |
| P11 | Scratch/disk và output quota                              | Ghi/in hữu hạn vượt quota; bị chặn/cắt ở lớp quy định. Collector không buffer vô hạn, log không phình, trạng thái truncated không được chấm đạt từ prefix output.                                                                |
| P12 | Cancel và crash                                           | Hủy job đang chạy, dừng supervisor hoặc runtime theo kịch bản có giám sát. Sau restart/reconcile không còn orphan; job không rõ kết quả được đánh dấu lỗi hạ tầng, không đoán thành công.                                        |
| P13 | Admission/backpressure                                    | Số job giả vượt concurrency/queue đã chốt bị từ chối hoặc chờ hữu hạn; không tạo thêm execution ngoài budget; code không đi vào đường fallback chạy trên supervisor.                                                             |
| P14 | Quan sát và quyền                                         | Log chỉ có correlation/digest/runtime/duration/loại lỗi; không có code, stdin nhạy cảm hoặc sentinel. Container không có credential của supervisor và không truy cập được control channel.                                       |
| P15 | Chạy lại sau chuỗi lỗi                                    | Lặp corpus P01 sau các ca thất bại trong cùng run; kết quả đúng và cleanup còn đạt. Bằng chứng chứng minh phục hồi, không chỉ trạng thái sạch ở lần đầu.                                                                         |

P01–P02 là mẫu để đánh giá khả thi. Chúng không thay parity toàn bộ Python/Pyodide trong đặc tả phát hành; một kết quả đúng trên CPython đơn lẻ chưa chứng minh lời giải hợp lệ của người học luôn được nhận. Danh sách lesson/test được resolve tại commit pin; nếu bài hay fixture thay đổi thì tạo run mới, không dùng lại báo cáo cũ.

## 6. Gói bằng chứng và điều kiện dừng

Mỗi run cần một manifest bất biến với timestamp, repo commit, harness/fixture revision, runtime image digest, profile digest, cấu hình host đã rút bỏ thông tin nhạy cảm và toàn bộ giới hạn đã áp. Báo cáo ghi từng ID P00–P15, nguồn metric, số lượt/corpus, thời gian và trạng thái cleanup. Đính kèm log đã lọc, kết quả đối chiếu output và bảng cold/warm latency/resource; không biến percentile của mẫu quá nhỏ thành cam kết hiệu năng.

Chứng cứ cleanup gồm kiểm container/mount/scratch/cgroup/process trước và sau, kể cả sau crash. Kiểm tra giới hạn phải ghi cả cấu hình lẫn quan sát enforcement. Mọi ngoại lệ đều có reviewer và kết luận; không đổi expected outcome để biến probe đỏ thành xanh.

Dừng execution và giữ lane sản phẩm đóng khi: capability bắt buộc thiếu; sentinel/traffic vượt ranh giới; ảnh hưởng ra ngoài host budget; orphan không thu hồi được; supervisor nhận stdout như giao thức; hoặc không tách được output sai với lỗi hạ tầng. Nếu có thất bại, lưu bằng chứng đã lọc và sửa thiết kế trước lần thử tiếp, theo giới hạn sửa cùng lỗi trong `AGENTS.md`.

PoC hữu hạn không chứng minh không thể thoát sandbox. ADR phải ghi residual risk, cơ chế cập nhật/báo sự cố và phạm vi bảo vệ đã kiểm thực tế. Không dùng kết quả probe nhỏ để bỏ review bảo mật độc lập.

## 7. Trình tự quyết định ADR và mở các lát triển khai

1. Review tài liệu này, chọn staging và chốt threat model/budget. Viết đặc tả PoC hẹp cùng ADR **Proposed** nêu các phương án container, microVM hoặc host grader tách biệt; chưa chọn mặc định bằng việc triển khai trước.
2. Sau khi đặc tả PoC được duyệt/merge và quyền staging được cấp, viết harness độc lập rồi chạy ma trận. Những bước này là công việc tương lai, chưa được thực hiện bởi tài liệu nghiên cứu.
3. Reviewer đọc bằng chứng và chọn: tiếp tục phương án; sửa/thử lại; hoặc chuyển phương án vì ranh giới/chi phí/khả năng vận hành không đạt. ADR mới chỉ thay thế phần quyết định cách ly của ADR-0007, bảo toàn nguyên tắc server chấm bằng chứng.
4. Khi ADR và spec triển khai được duyệt/merge, triển khai hợp đồng worker và policy fail-closed trước; sau đó nối Python lane trong lát riêng với admission/receipt/batch/error handling và parity toàn bộ Python.
5. Chỉ mở lane khi đầy đủ AC của đặc tả grader đạt, gồm UI/outbox, E2E, kiểm tải/abuse, review bảo mật và rollback. JS/TS/DOM/fetch/SQL là các lát riêng. Nội dung lab ngoài sandbox vẫn cần cơ chế nộp artifact/rubric được duyệt.

**Bằng chứng hiện tại:** đã đọc source/đặc tả, đối chiếu tài liệu Docker chính thống và viết kế hoạch. Chưa có run manifest, host staging đã xác nhận hoặc kết quả P00–P15. Trạng thái của toàn bộ ma trận là **chưa chạy**.
