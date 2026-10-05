# Kế hoạch giao việc: 20 khóa Kỹ thuật AI

> Trạng thái: Approved for implementation, chủ dự án DHCB xác nhận ngày 2026-10-05; còn chờ merge. Kế hoạch này đi cùng [spec chương trình](2026-10-05-ai-engineering-from-scratch-dhcb.md), [spec hoạt họa](2026-10-05-ai-engineering-lesson-animation.md) và [spec chấm bài cô lập](2026-10-05-programming-isolated-grading-dependency.md). Theo `AGENTS.md`, chỉ triển khai source khi spec liên quan đã được duyệt và merge.

## 1. Phạm vi và thứ tự

Nguồn cố định tại commit `f6dbae74ef622b78a76df704f86eafcde9f4ef3f`: 523 bài, 20 phase. Mọi bài nguồn có đúng một hàng trong [bản đồ](../research/2026-10-05-ai-engineering-source-map.csv). Không giao viết nội dung từ một hàng `UNREVIEWED`; người giao phải chốt outcome, chứng cứ và quyết định reuse/extend/new trước. Bài nguồn không tương đương một bài DHCB: nhóm các outcome gần nhau khi vẫn kiểm được riêng.

1. **M0 — nghiên cứu:** khóa snapshot, rà 523 outcome, kiểm body và bài Make DHCB, lập backlog `reuse/extend/new` và ứng viên hoạt họa. Audit còn thiếu bài được tách theo phase để dễ rà chéo. Đầu ra M0 là bản đồ không còn `UNREVIEWED` cùng biên bản review mẫu ở mỗi phase.
2. **M0G — mở đường chấm bài:** triển khai worker cô lập theo spec riêng; xác nhận Python/JS/TS/SQL chạy và ghi tiến độ thật qua server regrade, đồng thời các ca vượt quyền/time/memory/network bị chặn. Không đăng ký khóa coding mới khi dependency này chưa đạt.
3. **C1 — hợp đồng và thí điểm:** chốt ID khóa/lesson, registry/loader, khả năng gắn hoạt họa vào `ProgrammingLesson`, công cụ chụp, rồi thử bốn storyboard từ [phiếu thí điểm](../research/2026-10-05-ai-engineering-pilot-selection.md). Sửa hai lỗi nội dung cũ đã phát hiện trước khi reuse. C1 có một PR contract và các PR thí điểm riêng, mỗi PR nhỏ và kiểm được.
4. **B1–B5 — khóa học:** B1 Phase 00–04; B2 Phase 05–10; B3 Phase 11–14; B4 Phase 15–18; B5 Phase 19. Trong mỗi đợt, giao một unit/outcome cluster độc lập mỗi lần, nghiệm thu rồi mới gắn vào khóa công khai. Thứ tự trong đợt theo tiên quyết; có thể soạn song song các bài không phụ thuộc nhau sau khi contract đã ổn định.
5. **F — tích hợp:** 20 khóa và một lộ trình điều hướng có chương/bài thật, test E2E học–chấm–tiến độ, dự án tổng hợp có artifact/rubric, review chuyên môn, a11y và hiệu năng; final audit trên `main`.

## 2. Đơn vị giao việc cho subagent

Mỗi brief phải có: phase + source keys chính xác, outcome cần chứng minh, lesson ID/ID cũ được reuse, file được phép ghi **độc quyền**, contract đầu vào, rubric nội dung, test phải chạy, ảnh hoạt họa nếu có, bằng chứng bàn giao và rủi ro còn mở. Agent không tự thêm khóa vào registry hay sửa generated index. Mỗi agent báo file đổi, lệnh đã chạy, kết quả và giới hạn xác minh; agent chính đọc diff, ghép tích hợp và chạy full gate.

| Vai trò/lát cắt          | File ghi độc quyền dự kiến                                                                      | Bằng chứng hoàn tất                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Research theo phase      | Một `docs/research/*-map.md` riêng, hoặc các hàng phase được giao trong CSV dưới một chủ sở hữu | Đủ số source keys, body/Make evidence, quyết định và giới hạn kiểm chứng            |
| Worker cô lập            | Package worker và test riêng; server integration do một chủ sở hữu                              | Security tests, server regrade, E2E tiến độ, không có đường chạy code trên API host |
| Hợp đồng hoạt họa        | `lessonTypes.ts` và test schema, chỉ sau review contract                                        | Bài có/không có animation đều parse, ID/progress cũ ổn định                         |
| Trang bài và công cụ ảnh | UI page/test và `shots-lesson-animations.ts`, mỗi lát một chủ sở hữu                            | 5 mốc × 390/1440 × theme, keyboard, reduced motion, reviewer xem ảnh                |
| Soạn nội dung            | File bài mới của đúng unit; file bài cũ chỉ khi brief ghi rõ                                    | 8 bước, bài Make/ca sai/ca biên, SRS, code và test thật, nguồn/phiên bản            |
| Tích hợp catalog         | Chỉ agent chính sửa `courses/types.ts`, `courses/registry.ts`, lesson loader/index và lộ trình  | 0 ID gãy/trùng/mồ côi, khóa chỉ hiện khi đầy đủ, progress cũ không đổi              |
| Dự án Phase 19           | Contract/rubric và từng project độc lập sau khi spec project riêng được duyệt                   | Fixture offline, lệnh tái lập, output và rubric có thể chấm độc lập                 |

Không giao chồng file, schema, migration, lockfile hoặc generator. Với Phase 19, chốt contract dự án và cách lưu tiến độ bằng spec riêng trước khi code. Với các nội dung cần API/GPU, bài cơ chế offline là phần bắt buộc; lab thật là phần mở rộng có điều kiện và không gọi provider trong CI.

## 3. Rubric bắt buộc cho từng bài và hoạt họa

- **Đúng chuyên môn:** công thức/code/thuật ngữ khớp nhau; reviewer thử phản ví dụ và ca biên; bài không hứa khả năng mà code không có.
- **Dạy được:** một outcome đo được; người học dự đoán trước khi chạy; ví dụ làm rõ cơ chế; bài Make buộc áp dụng chứ không chép; phản hồi giải thích lỗi; 2–4 SRS không trùng câu hỏi.
- **Chạy được:** ví dụ và lời giải chạy trong môi trường công bố; test công khai và test ẩn phân biệt lời giải đúng, sai điển hình và hardcode; lab offline tái lập không cần secret.
- **Dễ dùng:** tiếng Việt rõ, thuật ngữ Anh được giải thích, tiên quyết đúng, mobile/keyboard/screen reader hoạt động, hiệu năng trong budget repo.
- **Hoạt họa có ích:** storyboard nêu câu hỏi học tập và ít nhất ba trạng thái có ý nghĩa; lời mô tả truyền đủ thông tin khi tắt chuyển động; 5 ảnh mốc được người soạn và reviewer xem, số/chiều/mask/luồng quyền chính xác. Không thêm chuyển động chỉ để trang trí.
- **Có chứng cứ:** link source commit, body/Make DHCB trước/sau, test và ảnh; trạng thái chỉ là `DONE` sau review và gate trên `main`.

## 4. Cổng tích hợp cho mỗi lát

Trước sửa hotspot: `npm run codemap -- impact <file>`. Trong PR: test đúng gói/loader/runner; `npm run audit:lessons -- --ci` hoặc lệnh audit tương ứng của repo; kiểm animation khi có. Cuối lát code: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`; thêm `npm run test:e2e` cho UI/luồng học/API. PR ghi scope, rủi ro, validation, rollback và phần chưa làm. Nếu một lỗi xác định sửa ba lần vẫn thất bại, ghi blocker; không hạ cổng hoặc tin output client thay server regrade.

## 5. Trạng thái thực tế và bước kế tiếp

Đã giao ba subagent làm các phase nghiên cứu và thiết kế hoạt họa; chưa giao sửa source vì spec được duyệt nhưng chưa merge. Spec worker bảo mật vẫn cần PoC và quyết định kiến trúc riêng. Bước có giá trị cao nhất sau khi chốt bản đồ M0 là duyệt các spec, sau đó thực hiện M0G và C1 trên các PR nhỏ. Không đánh dấu bất kỳ phase nào đã hoàn tất chỉ từ bản đồ hoặc đề cương.
