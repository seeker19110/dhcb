# Đặc tả triển khai: Bộ khóa Kỹ thuật AI từ nền tảng tới sản phẩm

| Thuộc tính   | Giá trị                                                     |
| ------------ | ----------------------------------------------------------- |
| Issue        | Chưa có                                                     |
| Spec owner   | Chủ dự án DHCB                                              |
| Trạng thái   | Approved for implementation                                 |
| Người duyệt  | Chủ dự án DHCB qua xác nhận trong phiên làm việc 2026-10-05 |
| Ngày duyệt   | 2026-10-05                                                  |
| Lần cập nhật | 2026-10-05                                                  |

> Đây là đặc tả cho [GOAL-2026-010](../goals/2026-10-05-ai-engineering-from-scratch.md) dựa trên `rohitg00/ai-engineering-from-scratch`. Đặc tả `aieng` ngày 2026-09-27 dựa trên **repo khác**, có 19 mô-đun và goal riêng. Không dùng trạng thái duyệt của đặc tả đó cho công việc này. Theo `AGENTS.md` và khuôn spec DHCB, không sửa source sản phẩm trước khi spec này được duyệt và merge.

## 1. Tóm tắt quyết định

Xây bộ khóa lập trình AI tiếng Việt bám **20 phase và các mục tiêu học tập** của repo tham chiếu, sử dụng bài DHCB đã có khi body và lab thực sự đạt outcome, viết bài gốc cho khoảng trống. Người học được bắt đầu từ nền hoặc vào nhánh LLM/agent sau bài chẩn đoán. Bài mới dùng khuôn học tập DHCB và hoạt họa có mô tả tương đương ở các cơ chế cần quan sát sự thay đổi theo thời gian. Mỗi phase chỉ hiện là hoàn chỉnh khi mọi outcome đã đối chiếu có bằng chứng.

## 2. Vấn đề, người dùng và bằng chứng

- Persona: người mới lập trình, kỹ sư chuyển hướng AI, kỹ sư ML muốn học LLM/agent/MCP/production.
- Pain point: các khóa AI hiện có rải ở `courses/`, `specializations/ai.ts` và `learningPaths/principal-ai.ts`. Có nhiều bài thật nhưng chưa có bản đồ 20 phase của nguồn; vài chủ đề lớn mới chỉ xuất hiện trong một bài giới thiệu.
- Baseline: `courses/{pyai,mathai,ml,mlds,cv1,cv2,llmagent,airel}.ts`; `ai-s1..s4`; `principal-ai`. `PROGRESS.md` ghi 509 bài môn Lập trình, **không** có nghĩa 509 bài AI hay 509 bài tương đương nguồn.
- Nguồn: [rohitg00/ai-engineering-from-scratch](https://github.com/rohitg00/ai-engineering-from-scratch), commit `f6dbae74ef622b78a76df704f86eafcde9f4ef3f` kiểm ngày 2026-10-05. [Inventory](../research/2026-10-05-ai-engineering-source-inventory.md) đếm 523 tệp bài trong 20 phase, khớp README; khoảng 342 giờ là tuyên bố của README, chưa xác minh độc lập. Nguồn còn có 12 learning paths, 48 project manifests và 67 bài chứng chỉ ngoài 523 bài lõi; phạm vi goal này là 20 phase lõi.
- Bằng chứng DHCB chi tiết: [gap audit](../research/2026-10-05-ai-engineering-dhcb-gap-audit.md). Chưa kết luận `đủ` dựa riêng trên tên khóa/bài.
- Đối chiếu ở cấp bài đang lưu trong [bản đồ 523 hàng](../research/2026-10-05-ai-engineering-source-map.csv); [Phase 01](../research/2026-10-05-ai-engineering-phase01-map.md) đã có phiếu phân tích riêng, và [Phase 06](../research/2026-10-05-ai-engineering-speech-course-blueprint.md) có bản thiết kế khóa âm thanh. Hàng `UNREVIEWED` chỉ chứng minh đã kiểm kê, chưa chứng minh có nội dung tương đương.
- Vì sao cần làm: người dùng yêu cầu đủ toàn bộ nội dung thành các khóa lập trình chất lượng cao và hoạt họa mô tả; thiếu bản đồ outcome sẽ gây trùng bài và báo sai tiến độ.

## 3. Nghiên cứu hiện trạng

### Luồng dữ liệu và mã

- `ShortCourse` ở `packages/subject-programming/courses/types.ts`: khóa trỏ `lessonIds`, không nhúng bài; `registry.ts` quyết định khóa hiện trong catalog. Khóa `airel` tái sử dụng nhiều bài cũ.
- `ProgrammingLesson` ở `lessonTypes.ts`: 8 bước hook, theory, worked example, predict, Parsons, Make, homework, SRS. `LessonSchema` và test canh hình dạng/ca chấm. Bài Python, JS, SQL và bộ mô phỏng dùng runner khác nhau. Nội dung nặng/GPU/API không thể giả định chạy trong sandbox hiện có.
- **Phụ thuộc phát hành nghiêm trọng:** `completionSandboxServer.ts` hiện trả `isolated_worker_required` cho Python/JS/TS/SQL; server không ghi hoàn thành những bài này khi thiếu worker cô lập. Mô tả 509 bài chấm lại trong `PROGRESS.md` là trạng thái lịch sử trước bản vá audit 2026-09-27; mã hiện hành là nguồn sự thật. [Spec khôi phục chấm an toàn](2026-10-05-programming-isolated-grading-dependency.md) là dependency của việc mở khóa coding AI, không thay bằng tin kết quả client.
- `ProgrammingCoursePage.tsx` dựng danh sách chương và tiến độ từ các ID bài. `ProgrammingLessonPage.tsx` và các thành phần bài cần rà trước khi thêm hoạt họa vào bài riêng; hoạt họa hiện chỉ gắn được vào `SpecStageDetail` và render ở `ProgrammingSpecStagePage.tsx`.
- `LessonAnimationSchema` và `LessonAnimation` là contract/renderer dùng lại được. `scripts/shots-lesson-animations.ts` chụp mốc thời gian; [spec hoạt họa](2026-10-05-ai-engineering-lesson-animation.md) quyết định cách mở rộng an toàn.
- `scripts/audit-lessons.ts --ci` phát hiện bài mồ côi, ID tham chiếu gãy, câu hỏi trùng, bài soạn dở, thiếu SRS và ca kiểm. Không thay cổng này bằng số lượng file.
- `npm run codemap -- impact <file>` phải chạy trước mỗi lát source. Lần đọc đặc tả này chưa chạy được vì checkout chưa cài `tsx`; không suy đoán impact khi chưa có output.

### Nghiên cứu sư phạm và khả năng tiếp cận

- Điểm vào phải nêu được kiến thức cần có, có chẩn đoán để người đã biết Python/ML bỏ qua đúng phần, nhưng không tự sửa mastery.
- Mỗi bài dạy **một outcome** rõ: giải thích cơ chế, tự cài phần lõi, dùng thư viện thực tế khi phù hợp, giải thích lỗi thường gặp và tạo artifact kiểm được. Không đặt bài `Make` chỉ chép ví dụ.
- Bài về nội dung thay đổi nhanh (MCP, SDK, model serving, luật/chuẩn) ghi nguồn chính thống, phiên bản và ngày kiểm. Trước từng batch phải xác minh lại bằng tài liệu gốc.
- Giọng văn tiếng Việt rõ với thuật ngữ Anh giải thích lần đầu. Công thức hiển thị theo khả năng thật của app; không giả định bài lập trình đã render LaTeX.

### Sở hữu nội dung

- Repo nguồn cho phép nghiên cứu cấu trúc/chủ đề; DHCB tự viết lời giải thích, mã mẫu, câu hỏi, hình và lab. Trường đối chiếu lưu URL/commit nguồn để truy vết, không chứa đoạn sao chép.
- Nếu dùng trực tiếp mã/tài nguyên nguồn ở bất kỳ lát nào, phải kiểm giấy phép của **tài nguyên cụ thể** và ghi attribution phù hợp. Kế hoạch mặc định là nội dung gốc.

## 4. Phương án và quyết định

| Phương án                                 | Lợi ích                                                   | Chi phí/rủi ro                                                       | Kết luận     |
| ----------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- | ------------ |
| Chép/dịch toàn bộ 523 bài                 | Nhanh có nhiều trang                                      | Trùng DHCB, khó bảo trì, chất lượng và quyền tác giả không kiểm soát | Bỏ           |
| Một khóa khổng lồ 523 mục                 | Một URL                                                   | Mục lục quá dài, khó chọn điểm vào và phát hành từng phần            | Bỏ           |
| 20 khóa theo phase, nối bằng một lộ trình | Phát hành/kiểm từng phase, tiên quyết rõ, tái sử dụng bài | Cần nhóm catalog và kiểm soát ID/tiến độ                             | Chọn đề xuất |

Mỗi phase có một khóa DHCB; số bài DHCB không cần bằng số bài nguồn vì bài trùng được tái sử dụng và outcome có thể gom khi vẫn đo được. Phương án 20 khóa đã được chủ dự án duyệt; ID công khai và nhóm catalog cụ thể phải được chốt trong lát contract trước khi phát hành vì ảnh hưởng URL lâu dài.

## 5. Outcome và guardrails

- Metric chính: số **outcome nguồn đã map và nghiệm thu** / tổng outcome trong snapshot nguồn; target 100%. Báo thêm `reuse/extend/new` theo phase, không tính tên đề cương là nội dung đã hoàn thành.
- Phase hoàn chỉnh: 100% outcome thuộc phase có bài/chương DHCB thật, `getLesson()` resolve, ví dụ và test qua, nội dung được review, tiên quyết hợp lệ, hoạt họa đã chọn qua kiểm, và bài code trong phase có đường chấm hoàn thành an toàn hoạt động.
- Guardrail: 0 duplicate ID/slug; 0 bài mồ côi hoặc chương rỗng; 0 thay đổi billing/entitlement/mastery từ nội dung; 0 lời gọi provider thật trong CI; 0 hoạt họa sai nội dung/a11y; tải trang và chunk trong budget repo.
- Cửa sổ đo: mỗi batch, trước mở mỗi khóa, final audit.
- Dừng/rollback: nếu contract/progress/permission bị ảnh hưởng ngoài scope thì dừng và viết spec riêng; khóa có vấn đề được gỡ khỏi registry/nhóm catalog mà không xóa bài/tiến độ.

## 6. Scope và non-goals

### In scope

- Snapshot và ma trận từng bài nguồn → outcome DHCB → lesson ID hoặc kế hoạch bài mới → chứng cứ.
- Nội dung 20 phase, gồm dự án tổng hợp Phase 19, với lab nhỏ chạy offline và bài làm trên repo riêng khi cần môi trường lớn.
- Đường học bắt đầu từ nền và đường vào ngắn cho người đã biết Python/ML.
- Hoạt họa giải thích cơ chế động và bản văn bản tương đương, theo [spec hoạt họa](2026-10-05-ai-engineering-lesson-animation.md).
- Review chuyên môn, hiệu năng, a11y, kiểm nguồn cập nhật và rubric dự án.

### Không làm

- Không xây model, service AI hoặc quyền thao tác mới trong ứng dụng DHCB chỉ để minh họa một bài.
- Không dùng dữ liệu riêng/production, credential của DHCB hay tài khoản provider trong bài học và CI.
- Không đổi bài hiện có bằng cách thay ID hoặc làm sai tiến độ đã lưu.
- Không ép mọi bài có animation; hình tĩnh/bảng/code trace được dùng khi truyền đạt tốt hơn.
- Không tự tuyên bố một lab mô phỏng là kết quả production hay một khóa hoàn chỉnh khi chỉ có outline.

## 7. Bản đồ khóa và hành trình người học

| Đợt | Phase/khóa                                                                          | Outcome chính                                                                   | Reuse sơ bộ; gap cần xác nhận qua audit                               |
| --- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | 00 Công cụ, 01 Toán, 02 ML, 03 Học sâu, 04 Thị giác                                 | Cài/chạy, hiểu dữ liệu và gradient, train/đánh giá mô hình nhỏ                  | `pyai`, `mathai`, `ml`, `mlds`, `cv1`, `cv2`, `ai-s2/s3`; rà body/lab |
| 2   | 05 NLP, 06 Tiếng nói/âm thanh, 07 Transformer, 08 AI tạo sinh, 09 RL, 10 LLM từ đầu | Xử lý chuỗi/âm thanh, attention, diffusion, policy, tokenizer→GPT→training loop | `llmagent`, `cv2`, bài Q-learning; thêm chuỗi chuyên sâu              |
| 3   | 11 LLM engineering, 12 Đa phương thức, 13 Công cụ/giao thức, 14 Agent               | RAG/eval, ghép ảnh-văn bản, MCP client/server, agent có giới hạn                | `ai-s1`, `llmagent`, `airel`; thêm lab giao thức và đa phương thức    |
| 4   | 15 Hệ tự chủ, 16 Nhiều agent, 17 Production, 18 Safety/alignment                    | Workflow bền, phối hợp, phục vụ và đo AI, threat model/an toàn                  | `ai-s4`, `airel`, security/devops; thêm thử lỗi, safety eval          |
| 5   | 19 Dự án tổng hợp                                                                   | Sản phẩm chạy được với repo, test, báo cáo số đo và giới hạn                    | Dự án hiện có làm nền; cần rubric/project track đủ độ sâu             |

Hành trình: chọn mục tiêu → xem tiên quyết và bài chẩn đoán → học bài/coding lab → làm artifact và nhận phản hồi dựa trên test → hoàn thành project phase → chuyển phase. Khi offline/runner lỗi, lưu nháp và chỉ báo chưa chấm; không tự đánh dấu hoàn thành.

## 8. Yêu cầu chức năng

- **FR-1 Bản đồ nguồn:** mỗi bài nguồn trong snapshot có mã phase/lesson, tiêu đề, URL/commit, outcome, trạng thái `reuse/extend/new`, lesson ID DHCB dự kiến và bằng chứng. Mọi hàng `reuse` phải được đọc **body và Make**, không chỉ title.
- **FR-2 Nội dung:** mỗi outcome có ít nhất một hoạt động học/chứng cứ. Bài mới có đủ 8 bước, 2–4 SRS, ít nhất một ca biên/sai và bài Make phân biệt được lời giải cứng.
- **FR-3 Tái sử dụng:** khóa chỉ trỏ ID; một bài có một nguồn dữ liệu. Nếu mở rộng bài đã phát hành, kiểm tương thích tiến độ và hành vi chấm cũ.
- **FR-3a Rà lỗi nội dung cũ:** trước `reuse`, đối chiếu tên bài, theory, code và đáp án; lỗi thuật ngữ hoặc lời hứa quá khả năng code phải sửa hoặc chuyển thành `extend/new`. [Phiếu thí điểm](../research/2026-10-05-ai-engineering-pilot-selection.md) đã phát hiện hai ca cần xử lý ở convolution và BPE.
- **FR-4 Khóa/lộ trình:** ID ổn định, thứ tự và tiên quyết không vòng lặp, catalog chỉ hiển thị khóa đã đạt cổng. Phase sau có đường vào cho người đã có nền nhưng không cấp quyền trái luật hiện hành.
- **FR-5 Lab:** bản offline không cần secret/GPU/Internet để học phần cơ chế; lab thực tế ghi thiết bị, phiên bản, chi phí ước tính và đường tự kiểm. Kết quả mô phỏng được gắn nhãn mô phỏng. Bài coding không hiện là có thể hoàn thành cho đến khi worker server chấm được an toàn và ghi tiến độ thật.
- **FR-6 Hoạt họa:** chọn theo [spec hoạt họa](2026-10-05-ai-engineering-lesson-animation.md), gắn tại ngữ cảnh bài học hoặc module, có mô tả văn bản và nút điều khiển hiện có; không chạy vô hạn gây nhiễu.
- **FR-7 Dự án:** mỗi project có input/output, tiêu chí hoàn thành, test/eval tái lập, báo cáo giới hạn và rubric review. Những dự án cần provider có fixture offline.
- **FR-8 Tính thời điểm:** lesson về API/chuẩn/framework có `checkedAt`, link tài liệu chính thống trong tài liệu soạn bài hoặc manifest; batch phát hành kiểm lại.

## 9. Yêu cầu phi chức năng

- **NFR-1 Bảo mật/quyền riêng tư:** giữ sandbox và server regrade hiện có; mã học viên không được thêm đường mạng hoặc quyền hệ thống. Không đưa secret thật vào bài.
- **NFR-2 Accessibility:** chữ AAA, điều khiển AA, 44×44 px trên mobile; hoạt họa có mô tả đầy đủ và tôn trọng `prefers-reduced-motion`. Không truyền đạt ý chỉ bằng màu/chuyển động.
- **NFR-3 Hiệu năng:** lazy load theo bài/phase, đo chunk sau build, không thêm thư viện hoạt họa nặng khi renderer hiện tại đủ. Mục lục 20 khóa không tải body hàng trăm bài.
- **NFR-4 Chất lượng AI:** lab eval dùng golden set, negative control và so baseline; không tuyên bố mô hình “đúng” bằng một demo duy nhất.
- **NFR-5 Vận hành:** tên khóa, lesson IDs, thứ tự và map version được kiểm tự động; lỗi phân giải bài làm CI đỏ trước phát hành.

## 10. Acceptance criteria

- **AC-1:** Given snapshot nguồn đã ghim, when chạy audit map, then 100% bài nguồn có outcome/map, không có mã nguồn trùng hoặc hàng chưa quyết định.
- **AC-1a:** Mỗi quyết định `reuse`/`extend` phải nêu bằng chứng đọc body và bài Make DHCB; `new` phải nêu outcome chưa đạt. Người duyệt có thể lấy mẫu mỗi phase để kiểm lại quyết định mà không dựa vào tiêu đề.
- **AC-2:** Given mỗi phase đã công bố, when mở catalog/chương/bài, then tất cả ID resolve và bài được học/chấm bằng luồng hiện có.
- **AC-3:** Given bài mới, when chạy test nội dung, then schema, ví dụ, lời giải, ca ẩn/ca biên, SRS và audit đều đạt; ít nhất một lời giải sai điển hình bị bác.
- **AC-4:** Given bài nguồn đã được map `reuse`, when reviewer so outcome/lab, then bài DHCB chứng minh được outcome hoặc map đổi thành `extend/new`.
- **AC-5:** Given môi trường không mạng/không API key, when chạy core labs và test, then không gọi provider/Internet và kết quả tái lập.
- **AC-6:** Given hoạt họa được chọn, when kiểm 5 mốc ở desktop/mobile và reduced motion, then chuyển động đúng cơ chế, không cắt/đè nhãn, mô tả văn bản truyền đạt cùng thông tin.
- **AC-7:** Given người học không có quyền hoặc runner lỗi, when vào bài/nộp, then quyền hiện hành được giữ và không ghi `completed` khi chưa chấm đạt; khi worker chưa khả dụng, UI nêu rõ tạm dừng ghi hoàn thành, không báo đạt giả.
- **AC-8:** Given một project Phase 19, when reviewer chạy fixture và áp rubric, then có thể xác định đạt/chưa đạt từ artifact và số đo, không dựa vào lời tự khai.
- **AC-9:** Given toàn bộ 20 phase, when final audit, then mọi outcome có bằng chứng trên `main`, full gate và E2E/a11y xanh, goal đạt DoD.

## 11. UX, nội dung và hoạt họa

- Mỗi khóa: “Bạn sẽ làm được gì”, cần biết trước, thời lượng có cơ sở, chương, bài, project, lối vào sau bài chẩn đoán. Khóa chưa hoàn chỉnh không hiện như đã phát hành.
- Bài học: câu hỏi dự đoán trước khi chạy code; giải thích lỗi qua phản ví dụ; gợi ý bậc thang; thẻ nhớ ngắn không chép lại câu hỏi.
- Hoạt họa kèm lời mô tả diễn biến và trạng thái cuối. Storyboard phải trả lời “người học hiểu gì nhờ chuyển động mà hình tĩnh/code trace chưa đủ?”. Nút tạm dừng/phát lại, focus/keyboard và reduced motion theo renderer chung.
- Rà màn hình 390px và 1440px, tất cả theme đang hỗ trợ, ảnh đầu/giữa/cuối cùng mốc 2/25/50/75/98% cho từng hoạt họa.

## 12. Kiến trúc, contract và dữ liệu

- `ShortCourse`/registry vẫn là lớp catalog; một khóa phase trỏ tới `lessonIds` hiện có hoặc mới. Dùng prefix lesson **chung cho bộ mới** để giảm thay đổi regex nhưng ID khóa phase riêng ổn định; ID/prefix cụ thể được chốt trong lát contract đầu tiên.
- Bản đồ nguồn là artifact nghiên cứu, không nạp nguyên 523 hàng vào bundle người học. Một manifest gọn chỉ chứa course/chapter/lesson IDs thật.
- Phase 19 và các lab dài cần một hợp đồng dự án tách khỏi giới hạn `theory`/`workedExample` 4.000 ký tự của `ProgrammingLesson`. Đề xuất `ProjectTrack` gồm ID ổn định, phase/tiên quyết, các bước nhỏ, repo/fixture khởi đầu, lệnh tái lập, artifact phải nộp, rubric và bằng chứng kiểm. Bước đọc/viết code ngắn vẫn dùng bài `ProgrammingLesson`; project không tự ghi `completed` từ một link hoặc lời khai. Contract chi tiết và cơ chế lưu tiến độ dự án là một spec riêng trước khi code Phase 19.
- Mở rộng `ProgrammingLesson` bằng trường `animation?: LessonAnimation` chỉ sau khi spec hoạt họa được duyệt; mở renderer ở trang bài bằng component chung, không nhúng SVG/HTML tùy ý trong dữ liệu bài.
- API progress/feedback cần kiểm allowlist ID mới và server regrade. Server grading hiện tạm dừng ở các ngôn ngữ coding chính; [spec worker cô lập](2026-10-05-programming-isolated-grading-dependency.md) phải triển khai và nghiệm thu trước khi mở khóa AI cho người học. Nếu ID mới đòi thay đổi DB/schema/quyền, tách spec và migration trước implementation; mặc định không migration nội dung.
- ID đã phát hành không đổi. Trước khi gỡ một khóa khỏi catalog, không xóa lesson progress.

## 13. Security, privacy và abuse cases

- Bài agent/MCP có ví dụ tool allowlist, schema validation, giới hạn bước/chi phí và khả năng dừng; không hướng dẫn cấp quyền rộng hay dùng secret của DHCB.
- Bài RAG/prompt injection phân biệt dữ liệu với chỉ thị; fixture chứa nội dung độc hại là chuỗi thử nghiệm offline, không gọi hệ thật.
- Lab nào chạy code mẫu cần giới hạn kích thước input, thời gian, CPU/bộ nhớ theo sandbox hiện hành. Không nhận output LLM làm đáp án chấm có thẩm quyền.
- Không hiển thị/ghi PII trong trace/eval. Corpus bài mẫu có nguồn rõ hoặc tự tạo.

## 14. Test plan

| Lớp                  | Trường hợp                                                  | Bằng chứng                                                   |
| -------------------- | ----------------------------------------------------------- | ------------------------------------------------------------ |
| Inventory/map        | Mỗi lesson nguồn có đúng một hàng và quyết định map         | Script/kiểm thủ công có số đếm, review ngẫu nhiên từng phase |
| Unit content         | Schema, ví dụ, Make, phản ví dụ, SRS, ID/slug               | `courses.test.ts`, `lessons*.test.ts`, `audit:lessons --ci`  |
| Contract/integration | Registry, lesson loader, progress allowlist, server regrade | Test gói, API test, backward compatibility                   |
| Hoạt họa             | Zod, quality, geometry, 5 mốc, reduced motion               | `shots:lesson-anim`, montage và review ảnh                   |
| E2E/a11y             | Catalog → khóa → bài → nộp → tiến độ, bàn phím/mobile/theme | Playwright, a11y AA/AAA, ảnh 390/1440                        |
| Performance          | Chunk/page budget và tải danh mục 20 khóa                   | build, `npm run budget`, chunk report                        |
| Review chuyên môn    | Mỗi outcome và project rubric                               | Phiếu review có nguồn, kết quả chạy, phản ví dụ              |

## 15. Kế hoạch triển khai và giao subagent

1. **M0 research/spec (đang thực hiện):** ba subagent có quyền ghi độc lập đúng một file: inventory nguồn, audit DHCB, spec hoạt họa. Agent chính viết goal/spec, rà chéo kết quả và kiểm tài liệu. Chưa thay đổi source.
2. **Dependency grading:** đặc tả, duyệt và triển khai worker cô lập cho chấm Python/JS/TS/SQL; kiểm đường API và tiến độ thật trước khi hứa khóa AI coding hoàn thành được. Không mở lại engine chạy trên API host hoặc tin `completed` client.
3. **Contract slice:** sau khi spec được duyệt/merge, chốt ID course/lesson, map machine-readable, đường hiển thị hoạt họa bài học và cổng kiểm. Một agent giữ file contract/registry chung; không cho nhiều agent sửa đồng thời.
4. **Content slices:** chia theo phase và unit độc lập, giao mỗi agent một tập file bài học riêng. Mỗi brief ghi outcome IDs, input/output, file write set độc quyền, test bắt buộc và câu hỏi review. Không cho hai agent cùng sửa `registry.ts`, `lessons.ts`, generated index, lockfile hoặc migration.
5. **Integration:** agent chính ghép ID vào registry/index sau mỗi batch, chạy generator đúng một lần, review từng diff và chạy targeted gate rồi full gate. Chỉ đánh dấu `DONE` khi có bằng chứng trên `main`.
6. **Release:** khóa/chặng chỉ hiện khi đầy đủ bài và kiểm. Dự án tổng hợp và E2E cuối theo M5. Merge/deploy là bước riêng theo Git flow, không tự suy ra từ việc bài đã viết.

## 16. Rollout và rollback

- Mỗi PR là một lát nhỏ: một nhóm outcome có bài/test/animation kèm chứng cứ. Không đưa khóa rỗng vào catalog.
- Go/no-go: AC tương ứng đạt, audit không lỗi, test/budget/a11y cần thiết xanh và reviewer chuyên môn xác nhận nội dung.
- Rollback: gỡ đăng ký khóa/chương hoặc revert PR; giữ nguyên ID và dữ liệu tiến độ của bài từng công bố. Nếu lỗi thuộc contract, ưu tiên tắt hiển thị nội dung mới và sửa thuận thay vì xóa tiến độ.

## 17. Rủi ro, giả định và câu hỏi cần duyệt

| Mục                        | Chủ sở hữu           | Quyết định đề xuất                                                              |
| -------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| Cách nhóm catalog          | Chủ dự án DHCB       | 20 khóa theo phase dưới một bộ/lộ trình, thay vì một khóa 523 mục               |
| ID công khai               | Kỹ thuật + chủ dự án | Chốt ở contract slice trước khi phát hành, không tái dùng `aieng` của goal khác |
| Mức độ tương đương 523 bài | Nội dung             | 100% outcome được map; không ép số bài DHCB bằng 523                            |
| Lab GPU/provider           | Nội dung + kỹ thuật  | Core offline không secret; lab thực tế là tùy chọn có thông báo yêu cầu/chi phí |
| Hoạt họa bài học           | UI + kỹ thuật        | Mở optional field, tái dùng renderer chung; cần spec hoạt họa được duyệt        |

## 18. Trạng thái nghiệm thu

- Đặc tả đã được chủ dự án **Approved for implementation** ngày 2026-10-05; còn chờ merge theo `AGENTS.md`. Chưa có source change hay bằng chứng final gate.
- Sau khi ba nghiên cứu độc lập hoàn tất, cập nhật con số snapshot/gap cụ thể và chỉ đóng M0 khi các hàng còn nghi vấn đã được giải quyết.
