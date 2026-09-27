# Đặc tả: Lộ trình Kỹ sư AI toàn diện (`aieng`)

| Thuộc tính   | Giá trị           |
| ------------ | ----------------- |
| Issue        | Chưa có           |
| Spec owner   | Chủ dự án DHCB    |
| Trạng thái   | Draft / In review |
| Người duyệt  | Chưa có           |
| Ngày duyệt   | Chưa có           |
| Lần cập nhật | 2026-09-27        |

> Không bắt đầu code khi trạng thái chưa là **Approved for implementation** và spec chưa được merge.

## 1. Tóm tắt quyết định

Tạo một lộ trình tổng hợp bằng tiếng Việt trong môn Lập trình, dự kiến có ID `aieng`, theo trình tự chủ đề của kho [AI Engineering Course](https://github.com/amitshekhariitbhu/ai-engineering-course). Lộ trình gom bài sẵn có của DHCB và bổ sung bài nguyên bản cho các chủ đề còn thiếu. Đây là một lộ trình DHCB theo hợp đồng `ShortCourse`, không phải bản dịch hoặc bản sao của khóa nguồn.

## 2. Vấn đề, người dùng và bằng chứng

- Persona/job-to-be-done: người học cần một đường đi có thứ tự từ ML căn bản đến triển khai và thiết kế hệ thống AI, không phải tự ghép nhiều khóa riêng.
- Hiện trạng và pain point: DHCB đã có chuỗi sáu khóa `pyai` → `mathai` → `mlds` → `cv1` → `cv2` → `llmagent`, cùng nội dung `airel`; các chủ đề đang nằm ở các mục catalog riêng.
- Baseline định lượng/định tính: chưa có một khóa tổng hợp theo bản đồ 19 mô-đun của nguồn; đã có các bài có thể dùng lại về Python, toán, ML, DL/CV, Transformer, RAG, agents, an toàn và triển khai.
- Nguồn bằng chứng, link và ngày truy cập: GitHub README nguồn, truy cập 2026-09-27. README mô tả 18 mô-đun chính (Module 1–18), thêm Module 0 “Must Know”, và 146+ bài; bảng mục lục nguồn gồm cả inference, evaluation, safety, multimodal, system design, frontier và interview.
- Nghiên cứu repo: `packages/subject-programming/courses/{pyai,mathai,mlds,cv1,cv2,llmagent,airel}.ts`; `packages/subject-programming/courses/registry.ts`; `packages/subject-programming/lessons.ts`; `packages/subject-programming/lessonTypes.ts`; trang hiện hành `apps/dhcb/src/pages/subjects/programming/ProgrammingCoursePage.tsx`.
- Vì sao cần làm bây giờ: người dùng gửi tham chiếu cụ thể và yêu cầu tạo khóa; trước khi soạn nội dung cần phân biệt phần đã có với phần mới để tránh trùng lặp.

## 3. Nghiên cứu hiện trạng

### Code và luồng hiện tại

- `ShortCourse` lưu metadata và chương; chương trỏ tới lesson ID hiện có, không nhúng nội dung. `courses.test.ts` kiểm tra mọi lesson ID đã đăng ký tồn tại.
- Khóa mới cần đăng ký tại `courses/registry.ts`, mở rộng `ShortCourseId`, đăng ký lesson data qua `lessons.ts`, và cập nhật allowlist tiền tố lesson tại `lessonTypes.ts`, API tiến độ và feedback nếu dùng ID mới.
- Trang catalog/chi tiết hiện dùng `ProgrammingCoursePage.tsx`. Không cần thêm UI nếu cấu trúc này hiển thị đủ 19 chương; mọi thay đổi giao diện phải tuân theo skill `ui-ux`.
- Bài lập trình tuân theo `ProgrammingLesson` và sandbox hiện có. Không thêm thư viện hoặc dịch vụ ngoài vào chấm code.
- Chuỗi 6 khóa và bài chi tiết đã có spec trong `docs/specs/2026-09-01-cum-6-khoa-ai-engineer.md`; khóa `airel` có thể cung cấp một phần reliability/safety. Lát implement phải kiểm tra lại đúng lesson IDs trên `main` trước khi reuse.

### Nghiên cứu người dùng/sản phẩm

- Người mới cần đường vào dễ hiểu, nhắc kiến thức tiên quyết và không bị buộc đọc hết các bài nền nếu đã biết.
- Người học đã biết ML cần có thể vào nhóm LLM/agents mà không phải học lại Python; điều kiện tiên quyết ở mức gợi ý, còn quyền truy cập bài tuân theo luật hiện hành.
- Nội dung tiếng Việt; thuật ngữ tiếng Anh quan trọng được giữ kèm giải thích.
- Bài phải thể hiện hook, theory, worked example, check questions và SRS Cards theo hướng dẫn sư phạm DHCB; dùng đầy đủ cấu trúc `ProgrammingLesson` đang được nền tảng hỗ trợ.

### Nghiên cứu kỹ thuật/nguồn ngoài

- Kho tham chiếu: [amitshekhariitbhu/ai-engineering-course](https://github.com/amitshekhariitbhu/ai-engineering-course), README truy cập 2026-09-27. Nguồn tổ chức lộ trình từ ML/DL, Transformer/LLM, fine-tuning/alignment, prompt/context, RAG, agents, inference, evaluation, safety, multimodal, system design đến phỏng vấn.
- Chỉ dùng tên/chủ đề cấp cao và thứ tự làm đầu vào. Không chép hoặc dịch nội dung bài, ví dụ, sơ đồ, bài tập hay cách diễn đạt của nguồn.
- Không thêm API/provider; không phát sinh chi phí AI trong nội dung hoặc test.

## 4. Phương án và quyết định

| Phương án                                                                | Lợi ích                                                        | Chi phí/rủi ro                                            | Kết luận     |
| ------------------------------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------------- | ------------ |
| Không làm                                                                | Không tạo thêm nội dung trùng                                  | Người học phải tự nối các khóa riêng; các gap chưa có bài | Không chọn   |
| Tạo khóa mới và viết lại toàn bộ từ đầu                                  | Mạch thống nhất                                                | Nhân đôi nhiều nội dung đã có; tăng chi phí bảo trì       | Không chọn   |
| Tạo khóa tổng hợp `aieng`, tham chiếu bài hiện có và chỉ viết phần thiếu | Một lộ trình rõ ràng, giữ một nguồn nội dung cho mỗi khái niệm | Cần kiểm toán map nội dung và thêm allowlist lesson IDs   | Chọn đề xuất |

Tiêu chí quyết định: tận dụng `ShortCourse` hiện có; tránh bài trùng; cover đủ 19 mô-đun; không thay đổi quyền, API hay dữ liệu có thẩm quyền.

## 5. Outcome và guardrails

- Metric chính + baseline + target: baseline là 0 khóa tổng hợp với 19 mô-đun; target là 1 khóa `aieng`, 19/19 chương có lesson hợp lệ, mọi lesson mới qua cổng nội dung hiện hành.
- Guardrail: 0 lesson ID trỏ tới nội dung thiếu; 0 câu hỏi SRS trùng theo cổng môn học; 0 lời gọi provider trả phí; 0 thay đổi quyền/thu phí/mastery; không đưa output AI thành sự thật có thẩm quyền.
- Thời gian đo: trong mỗi lát PR và khi đăng ký khóa cuối.
- Điều kiện dừng/rollback: dừng nếu map đòi thay đổi kiến trúc hoặc luật product; có thể gỡ mục `aieng` khỏi registry để ẩn khóa mà không xóa lesson progress hay đổi ID đã phát hành.

## 6. Scope và non-goals

### In scope

- Một khóa catalog `aieng` với 19 chương theo danh sách ở mục 7.
- Map mỗi chương tới lesson ID sẵn có hoặc lesson mới; reuse `pyai`, `mathai`, `ml`, `mlds`, `cv1`, `cv2`, `llmagent`, `airel` khi đúng nội dung.
- Nội dung mới tập trung vào gaps: phân loại mô hình ngôn ngữ, fine-tuning/alignment, context engineering, framework/agentic engineering, inference serving, evaluation/observability, an toàn AI toàn hệ thống, multimodal, system design, frontier và phỏng vấn.
- Chia nội dung thành nhiều PR; chỉ đăng ký khóa vào catalog khi toàn bộ 19 chương đã có lesson hợp lệ.

### Không làm

- Không sao chép 146+ bài nguồn hoặc tuyên bố đây là khóa do tác giả nguồn đồng phát hành.
- Không xây thêm sandbox, API, model, RAG/agent chạy provider thật, tài khoản, trả phí, telemetry mới hoặc migration database.
- Không thay đổi giao diện nếu trang khóa hiện tại đáp ứng; nếu cần thì mở rộng đúng phạm vi và chạy E2E/a11y.
- Không đổi nội dung hoặc quyền của bài đang phát hành khi chỉ cần tham chiếu bài đó.

## 7. User journeys và trạng thái

1. Người học mở môn Lập trình và chọn “Kỹ sư AI toàn diện”.
2. Họ thấy mục tiêu học tập, yêu cầu đầu vào, thời lượng ước tính và 19 chương từ “Must Know” tới “Phỏng vấn Kỹ sư AI”.
3. Họ mở một chương, chọn bài; trang bài và lưu tiến độ dùng luồng hiện tại. Khóa học không tự hoàn tất bài, không thay mastery và không cấp entitlement.
4. Bài khóa theo đúng quyền truy cập đã tồn tại. Lesson thiếu hoặc không có quyền xử lý theo trạng thái hiện có của trang bài.

### Bản đồ chương đề xuất

| Chương | Mô-đun tham chiếu                                | Nội dung DHCB sẵn có         | Khoảng trống dự kiến                               |
| ------ | ------------------------------------------------ | ---------------------------- | -------------------------------------------------- |
| 0      | Must Know                                        | `pyai`, bài nền liên quan    | Chẩn đoán và chỉ dẫn nhánh học                     |
| 1      | Machine Learning Foundations                     | `mathai`, `ml`, `mlds`       | Hợp nhất thuật ngữ và pipeline                     |
| 2      | Deep Learning and Neural Networks                | `cv1`                        | Map lại bài NN/CNN thành lộ trình                  |
| 3      | Generative AI and Transformer Architecture       | `cv2`, `llmagent`            | Nối chuyển tiếp sang LLM                           |
| 4      | How LLMs Generate Text                           | `llmagent`                   | Token-by-token, decoding có kiểm chứng             |
| 5      | Modern LLM Architecture                          | `llmagent`, `cv2`            | Thành phần kiến trúc hiện đại còn thiếu            |
| 6      | Types of Language Models                         | Một phần `ml`, `llmagent`    | Encoder-only, encoder-decoder, decoder-only        |
| 7      | Training, Fine-Tuning, and Alignment             | Một phần `llmagent`          | Fine-tuning và alignment có bài riêng              |
| 8      | Prompt and Context Engineering                   | Một phần `llmagent`          | Context construction và chiến lược quản lý         |
| 9      | Vector Search and RAG                            | `llmagent`                   | Map nội dung retrieval và đánh giá                 |
| 10     | AI Agents and Agentic Systems                    | `llmagent`                   | Map khái niệm và luồng hiện có                     |
| 11     | Agentic Engineering and Frameworks               | Một phần `llmagent`, `airel` | Framework patterns và kiểm soát hành động          |
| 12     | LLM Inference Engineering                        | Một phần `llmagent`, `airel` | Serving, batching, quantization, latency/cost      |
| 13     | Evaluation and Observability                     | `llmagent`, `airel`          | Golden set, tracing và vận hành                    |
| 14     | AI Safety and Security                           | `llmagent`, `airel`          | Threat model rộng hơn prompt injection             |
| 15     | Multimodal AI and Generative Models              | `cv2`                        | Kết nối ảnh/âm thanh/văn bản đa phương thức        |
| 16     | AI Infrastructure, Deployment, and System Design | `cv1`, `llmagent`, `airel`   | Thiết kế end-to-end và trade-off hệ thống          |
| 17     | Frontier Ideas in AI                             | Một phần `cv2`, `llmagent`   | Nội dung có ngày kiểm tra vì thay đổi nhanh        |
| 18     | Prepare for AI Engineering Interviews            | Chưa có map xác nhận         | Bài luyện thiết kế, debug và giải thích quyết định |

Đây là bản đồ sơ bộ từ tên/summary hiện tại; trước mỗi lát code phải đối chiếu body và outcome thực của từng lesson, không chỉ dựa vào tên file.

## 8. Yêu cầu

### Functional requirements

- FR-1: `aieng` chỉ xuất hiện trong catalog khi mọi lesson ID ở cả 19 chương resolve thành lesson thật.
- FR-2: một lesson ID chỉ có một nguồn nội dung; khóa tổng hợp chỉ tham chiếu lesson hiện hữu hoặc thêm lesson mới.
- FR-3: giữ URL/ID lesson ổn định sau khi phát hành; không di chuyển bài bằng cách đổi ID.
- FR-4: chương và lesson đi theo đúng thứ tự học đã duyệt.

### Non-functional requirements

- NFR-1: bảo mật/quyền riêng tư không thêm route hoặc dữ liệu cá nhân.
- NFR-2: accessibility dùng UI hiện tại; mọi UI thay đổi phải qua quy chuẩn AA/AAA của repo và kiểm E2E a11y.
- NFR-3: không làm chậm đáng kể trang khóa khi hiển thị 19 chương.
- NFR-4: không có provider AI trả phí; bài AI tập trung vào giải thích và mô phỏng thuần.

## 9. Acceptance criteria

- AC-1 — Given khóa đã đăng ký, When catalog tải, Then `aieng` có đúng 19 chương theo Module 0–18.
- AC-2 — Given mỗi chương, When `courses.test.ts` kiểm tra, Then tất cả lesson IDs tồn tại, không có ID lặp và thứ tự lesson có chủ đích.
- AC-3 — Given mỗi bài mới, When lesson audit/test chạy, Then nội dung theo schema, câu hỏi và code mẫu hợp lệ; bài code chạy trong sandbox hiện hành.
- AC-4 — Given bài đã có cùng mục tiêu học, When map được khóa, Then khóa tổng hợp trỏ tới bài hiện có thay vì sao chép.
- AC-5 — Given repo không có API key/provider, When chạy test, Then khóa và các bài không gọi mạng/provider.
- AC-6 — Given người học chưa có quyền với một lesson cụ thể, When mở lesson, Then khóa không cấp quyền mới và luồng quyền hiện tại quyết định kết quả.
- AC-7 — Given khóa được hiển thị trên web, When E2E/a11y chạy, Then luồng chọn khóa/chương/bài dùng được bàn phím và đạt cổng hiện có.

## 10. UX, nội dung và accessibility

- Tận dụng `ProgrammingCoursePage`; chưa đề xuất giao diện riêng.
- Tiêu đề/copy tiếng Việt rõ ràng, thuật ngữ tiếng Anh kèm giải nghĩa lần đầu.
- Nội dung bài đi theo khuôn sư phạm hiện có: Hook, Theory (Markdown/LaTeX), Worked Example, Check Questions và SRS Cards; giữ đầy đủ các trường bắt buộc của `ProgrammingLesson`.
- Chữ đạt AAA theo chuẩn dự án; điều khiển tương tác đạt AA. Nếu nghiên cứu yêu cầu thay đổi trang/điều hướng, kích hoạt skill `ui-ux` trước khi triển khai.

## 11. Kiến trúc, API và data contract

- Component/service boundaries: `courses/aieng.ts` + đăng ký khóa; nhóm lesson data theo unit; không thêm server service mới.
- API request/response/error/idempotency: không đổi API ngoài cập nhật allowlist lesson ID nếu cần. Endpoint tiến độ tiếp tục validate auth và tồn tại lesson.
- Schema/index/ownership/retention: không migration; lesson progress tiếp tục gắn với `user_id` hiện tại.
- Backward compatibility: khóa mới chỉ cộng thêm; lesson IDs không đổi sau phát hành; khóa cũ không đổi.
- Provider/fallback/timeouts/retries: không gọi provider.

## 12. Security, privacy và abuse cases

- Không có xử lý auth, PII, billing, entitlement, usage ledger hoặc dữ liệu cá nhân mới.
- Bài AI/an toàn là nội dung tĩnh; không để mô hình tự ghi mastery, quyền, tiến độ hoặc sự thật của hệ thống.
- Test chỉ dùng fixture cục bộ; không gọi API ngoài.
- Kiểm tra code mẫu không chứa secret thật và không yêu cầu cấu hình credential.

## 13. Telemetry và vận hành

- Không thêm telemetry.
- Xác minh trong build catalog rằng mọi tham chiếu có lesson; khi phát hành dùng kiểm tra route hiện tại và lesson progress hiện tại.
- Chủ sở hữu vận hành: đội DHCB.

## 14. Test plan

| Lớp                        | Trường hợp                                                   | Bằng chứng                                          |
| -------------------------- | ------------------------------------------------------------ | --------------------------------------------------- |
| Unit                       | ID/metadata/19 chương và map lesson                          | `courses.test.ts`, test mới nếu cần                 |
| Integration                | Lesson schemas, progress/feedback allowlist                  | Tests của `subject-programming` và API bị ảnh hưởng |
| E2E/a11y                   | Catalog → khóa → chương → bài; bàn phím và accessibility     | `npm run test:e2e` và a11y specs nếu UI/route đổi   |
| Manual/eval                | Đánh giá tính đúng, thứ tự, trình độ và không trùng nội dung | Rà soát nội dung từng lát                           |
| Concurrent/retry/migration | Không có migration hoặc giao dịch nghiệp vụ mới              | Không áp dụng; xác nhận diff không đổi các lớp này  |

## 15. Kế hoạch triển khai

1. Chốt spec, map lesson IDs cụ thể và tiêu chí duyệt nội dung.
2. Soạn/kiểm chứng Module 0–6 trong một hay nhiều lát nhỏ, không đăng ký khóa chưa hoàn chỉnh.
3. Soạn Module 7–12.
4. Soạn Module 13–18; rà soát an toàn và tính thời điểm của Module 17.
5. Tích hợp registry/allowlist, mở khóa trong catalog và chạy full gate.

Mỗi lát code có `npm run codemap -- impact <file>`, kiểm tra mục tiêu, rồi full gate theo AGENTS.md. Cổng đầy đủ: build, typecheck, lint, format, test; E2E nếu UI/route/learner flow đổi.

## 16. Rollout và rollback

- Rollout: chỉ đưa một mục khóa hoàn chỉnh vào catalog sau khi đủ 19 chương; không migration/feature flag.
- Go/no-go: toàn bộ AC đạt, không còn lesson ID mồ côi hoặc audit lỗi.
- Rollback: gỡ `aieng` khỏi registry/route alias nếu có. Không xóa bài đã phát hành, dữ liệu tiến độ hoặc đổi ID.
- Giới hạn mất dữ liệu: không có schema/data migration.

## 17. Rủi ro và giả định

| Rủi ro/giả định                                                           | Xác suất   | Ảnh hưởng  | Giảm thiểu/xác minh                                  | Owner          |
| ------------------------------------------------------------------------- | ---------- | ---------- | ---------------------------------------------------- | -------------- |
| `airel` hoặc các bài sẵn có chỉ tương tự tên chứ chưa đạt mục tiêu mô-đun | Trung bình | Trung bình | Đọc nội dung/AC từng bài trước khi quyết định reuse  | Chủ dự án DHCB |
| 19 mô-đun tạo khóa dài, khó theo dõi                                      | Trung bình | Trung bình | Nêu thời lượng, mục tiêu, điểm vào và nhóm chương rõ | Chủ dự án DHCB |
| Nội dung frontier nhanh lỗi thời                                          | Cao        | Trung bình | Gắn ngày rà soát và giới hạn vào khái niệm bền vững  | Chủ dự án DHCB |
| Mã bài mới chưa được allowlist ở mọi ranh giới                            | Trung bình | Cao        | Liệt kê đầy đủ schema/API và có kiểm tra integration | Kỹ thuật DHCB  |

## 18. Câu hỏi mở và quyết định

| Mục                                                                                            | Owner          | Hạn                 | Quyết định  |
| ---------------------------------------------------------------------------------------------- | -------------- | ------------------- | ----------- |
| Duyệt cách làm một khóa tổng hợp `aieng` tái sử dụng 6 khóa hiện hữu thay vì tạo bản sao riêng | Chủ dự án DHCB | Trước source change | Chờ xem xét |
| Duyệt bản đồ 19 chương và quy tắc chỉ đăng ký khóa khi hoàn chỉnh                              | Chủ dự án DHCB | Trước source change | Chờ xem xét |

## 19. Phê duyệt

- [ ] Product outcome và scope
- [ ] UX/accessibility
- [ ] Architecture/API/data
- [ ] Security/privacy/cost
- [ ] Test/telemetry/rollout/rollback
- [ ] Mọi câu hỏi blocking đã đóng

**Kết luận:** Draft / In review

**Người duyệt:**
**Ngày:**
**Ghi chú:**
