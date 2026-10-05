# Goal: Bộ khóa Kỹ thuật AI từ nền tảng tới sản phẩm

| Thuộc tính        | Giá trị                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Goal ID           | GOAL-2026-010                                                                                                                                                                         |
| Owner             | Chủ dự án DHCB                                                                                                                                                                        |
| Trạng thái        | FRAMING                                                                                                                                                                               |
| Bắt đầu           | 2026-10-05                                                                                                                                                                            |
| Target review     | Sau mỗi lát nội dung và trước khi mở catalog                                                                                                                                          |
| Quyền được cấp    | Nghiên cứu, lập kế hoạch, viết đặc tả và giao các phần nghiên cứu độc lập; thay đổi source sau khi đặc tả được duyệt và merge theo quy trình repo                                     |
| Budget/guardrails | Không gọi provider trả phí trong bài/test; không đổi billing, entitlement hoặc tiến độ có thẩm quyền; không chép nội dung nguồn; giữ ID bài đã phát hành; không nới bảo mật chấm code |

## 1. Outcome và Definition of Goal Complete

- Outcome: DHCB có bộ khóa lập trình tiếng Việt bao phủ **20 phase** của `rohitg00/ai-engineering-from-scratch`, đi từ công cụ, toán và ML tới LLM, agent, production, an toàn và dự án tổng hợp. Bài học có mã chạy được, bài tự làm và hoạt họa khi chuyển động giúp hiểu cơ chế.
- Người dùng: người mới biết lập trình, kỹ sư phần mềm chuyển sang AI, và người đã biết ML muốn học LLM/agent theo nhánh ngắn.
- Baseline: DHCB có P1–P6, khóa AI ngắn và hướng AI S1–S4; chưa có bản đồ từng bài của nguồn 20 phase; bài lập trình trong `ProgrammingLesson` chưa có trường hoạt họa dù chặng chuyên sâu đã có hoạt họa. Python/JS/TS/SQL hiện bị tạm dừng chấm hoàn thành ở server (`isolated_worker_required`).
- Target: 20/20 phase có khóa/chặng học điều hướng được; **mọi bài tham chiếu trong snapshot nguồn** có một outcome DHCB được ghi trong bản đồ đối chiếu, gồm `reuse`, `extend` hoặc `new`; tất cả `new/extend` có bài thật, ví dụ chạy được và bằng chứng nghiệm thu. Bài trùng vẫn có một nguồn nội dung duy nhất.
- Hoạt họa: mọi khái niệm được chọn qua tiêu chí sư phạm trong đặc tả hoạt họa đều có storyboard, bản mô tả tương đương và kiểm tra ở nhiều mốc thời gian; không đặt mục tiêu phủ 100% bài bằng chuyển động trang trí.
- Cửa sổ đo: từng PR nội dung, từng khóa được mở, và final audit sau toàn bộ 20 phase.
- Guardrails: 0 ID mồ côi/trùng; 0 bài công bố mà code mẫu không chạy; 0 bài AI cần secret thật để đạt; không làm chậm tải trang/bundle vượt cổng repo; a11y theo AAA cho chữ và AA cho điều khiển.
- Completion approver: Chủ dự án DHCB.

## 2. Scope và non-goals

### In scope

- Bản kiểm kê snapshot nguồn và bản đối chiếu bài DHCB theo từng outcome.
- Hai mươi khóa/chặng có thứ tự học và tiên quyết rõ, với lối vào ngắn cho người đã có nền.
- Nội dung mới theo khuôn `ProgrammingLesson` hoặc hợp đồng dự án phù hợp; lab mô phỏng offline trước, lab trên repo thật khi phù hợp.
- Hoạt họa có ý nghĩa cho các cơ chế động: tối ưu, attention, truy hồi, vòng agent, huấn luyện, hàng đợi, phục vụ suy luận và phối hợp nhiều agent.
- Bộ dự án tổng hợp có tiêu chí nghiệm thu, artifact và cách tự kiểm bằng mã.

### Không làm

- Không sao chép/dịch nguyên văn 523 bài, mã mẫu, hình, sơ đồ hoặc câu hỏi của nguồn. Số bài DHCB được quyết định bằng outcome, không ép khớp 523.
- Không gộp hoặc đổi phạm vi của goal/spec `aieng` ngày 2026-09-27 (nguồn `amitshekhariitbhu/ai-engineering-course`). Có thể dùng lại bài học, nhưng mỗi goal giữ một bản đồ nguồn riêng.
- Không tự tạo model production, tiêu tiền GPU/API, dùng dữ liệu người học thật, hay cho AI tự ghi mastery/billing.
- Không phát hành khóa/chương rỗng hoặc đếm đề cương là bài học đã hoàn thành.

## 3. Milestones và slices

| ID  | Outcome/AC                                                               | Dependency                             | Spec                                                                                                                                                  | State    | Evidence cần có                                                   |
| --- | ------------------------------------------------------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| M0  | Snapshot nguồn, audit DHCB, bản đồ từng bài và chuẩn chất lượng/hoạt họa | `main` hiện hành                       | [Spec chương trình](../specs/2026-10-05-ai-engineering-from-scratch-dhcb.md), [Spec hoạt họa](../specs/2026-10-05-ai-engineering-lesson-animation.md) | RESEARCH | Inventory, gap audit, quyết định reuse/new                        |
| M0G | Khôi phục chấm hoàn thành an toàn qua worker cô lập                      | Spec bảo mật riêng được duyệt và merge | [Spec phụ thuộc chấm bài](../specs/2026-10-05-programming-isolated-grading-dependency.md)                                                             | RESEARCH | Test cô lập/timeout/tài nguyên, API không tin client, E2E tiến độ |
| M1  | Phase 00–04: công cụ, toán, ML, DL, thị giác                             | M0, M0G và spec được duyệt/merge       | Spec chương trình                                                                                                                                     | BACKLOG  | Bài chạy được, bài chấm, review nội dung                          |
| M2  | Phase 05–10: NLP, âm thanh, Transformer, GenAI, RL, LLM từ đầu           | M1 hoặc tiên quyết tương đương         | Spec chương trình                                                                                                                                     | BACKLOG  | Lab từ gốc, eval, hoạt họa được kiểm                              |
| M3  | Phase 11–14: ứng dụng LLM, đa phương thức, tool/MCP, agent               | M2 hoặc kiểm tra đầu vào               | Spec chương trình                                                                                                                                     | BACKLOG  | RAG/agent/MCP lab offline và repo thật                            |
| M4  | Phase 15–18: tự chủ, nhiều agent, production, safety                     | M3                                     | Spec chương trình                                                                                                                                     | BACKLOG  | Fault tests, ngân sách, an toàn, a11y                             |
| M5  | Phase 19: các sản phẩm tổng hợp, tích hợp catalog/lộ trình               | M1–M4                                  | Spec chương trình                                                                                                                                     | BACKLOG  | Project rubric, E2E, final audit                                  |

Mỗi slice sau M0 là một nhóm outcome nhỏ đủ kiểm chứng trong một PR, không phải một phase lớn trong một PR. Chỉ mở khóa trong catalog khi chương có bài thật và cổng chất lượng xanh. Bản đồ M0 quyết định số slice và thứ tự chính xác.

## 4. Risk register

| Risk                                            | Trigger/guardrail                                         | Mitigation/rollback                                                             | Owner      | State |
| ----------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------- | ----- |
| Viết lại nội dung đã có                         | Bản đồ từng bài thiếu `reuse`                             | Một ID bài là nguồn sự thật; audit body và lab trước khi thêm bài               | Nội dung   | OPEN  |
| Nội dung tự động nghe đúng nhưng sai kỹ thuật   | Không có reviewer chuyên môn hoặc test phản ví dụ         | Mỗi bài có ví dụ chạy được, ca sai, review độc lập và chứng cứ                  | Nội dung   | OPEN  |
| Hoạt họa đẹp nhưng sai cơ chế                   | Chỉ kiểm schema/ảnh mốc đầu                               | Storyboard và ảnh 5 mốc; reviewer đọc ảnh và đối chiếu công thức/log            | UI/QA      | OPEN  |
| Bài cũ dạy sai thuật ngữ hoặc quá lời so với mã | Body không khớp tên bài/mục tiêu                          | Sửa bài gốc trước khi reuse/gắn hoạt họa và kiểm tiến độ cũ                     | Nội dung   | OPEN  |
| 20 khóa làm catalog khó dùng                    | Khóa nhiều, người học không thấy đường vào                | Thiết kế nhóm/lộ trình và kiểm thử người mới trước khi mở rộng UI               | Sản phẩm   | OPEN  |
| Bài lab cần GPU/API/secret                      | Không chạy được trong môi trường học hoặc CI              | Nhánh mô phỏng chuẩn thư viện và lab ngoài tùy chọn, có dự toán                 | Kỹ thuật   | OPEN  |
| Bài Python/JS/TS/SQL không ghi hoàn thành       | `isolated_worker_required` ở `completionSandboxServer.ts` | Xây worker cô lập theo spec bảo mật riêng; không mở fallback chạy trên API host | Kỹ thuật   | OPEN  |
| Nguồn thay đổi theo thời gian                   | README hoặc bài nguồn đổi sau snapshot                    | Ghim commit nguồn; thay đổi về sau qua bản diff riêng                           | Nghiên cứu | OPEN  |

## 5. Current truth

- Commit `main` đã reconcile: `c7eca92` (2026-10-05).
- Goal gap: [inventory nguồn](../research/2026-10-05-ai-engineering-source-inventory.md) xác nhận 523 bài/20 phase tại commit `f6dbae74ef622b78a76df704f86eafcde9f4ef3f`. [Bản đồ CSV](../research/2026-10-05-ai-engineering-source-map.csv) hiện có 168/523 bài được quyết định ở Phase 00, 01, 02, 07, 08, 13 và 14. Các [phiếu Phase 03–04](../research/2026-10-05-ai-engineering-phase03-04-map.md), [05](../research/2026-10-05-ai-engineering-phase05-map.md), [09–10](../research/2026-10-05-ai-engineering-phase09-10-map.md), [11–12](../research/2026-10-05-ai-engineering-phase11-12-map.md), [15–16](../research/2026-10-05-ai-engineering-phase15-16-map.md) đã nghiên cứu ở mức K1 nhưng chưa hợp nhất vào CSV. Những phase khác còn `UNREVIEWED` cho tới khi hoàn tất phiếu body/Make; cần rà chéo cả phiếu K1 trước khi soạn. Hoạt họa đã có trong chặng chuyên sâu nhưng chưa có hợp đồng/render ở bài `ProgrammingLesson`. Chấm hoàn thành Python/JS/TS/SQL đang dừng chờ worker cô lập.
- Blocker: repo yêu cầu đặc tả được duyệt và merge trước thay đổi source. Đặc tả mới hiện đang soạn; goal cũ `GOAL-2026-009` khác nguồn và vẫn WAITING.
- Next best slice: hoàn thành M0, rà chéo nghiên cứu của subagent, viết spec có thể nghiệm thu và trình chủ dự án duyệt. [Thí điểm hoạt họa](../research/2026-10-05-ai-engineering-pilot-selection.md) đã phát hiện hai lỗi nội dung cần sửa trước khi phát hành: convolution dùng thuật ngữ “bất biến tịnh tiến” và bài gọi “BPE mini” nhưng mã chưa thực hiện vòng gộp BPE.
- Quyền hoặc quyết định cần thêm: duyệt bản đồ triển khai và cách nhóm 20 phase vào catalog trước khi thêm source; merge/đưa lên production theo Git flow riêng.

## 6. Iteration log

### Iteration 1 — 2026-10-05

- State: FRAMING.
- Slice: kiểm kê nguồn/DHCB song song, đặc tả chương trình và hoạt họa.
- Goal gap trước/sau: chờ hoàn tất bản đồ từng bài để đo.
- Research/spec/issue/PR: xem mục M0; chưa có issue/PR.
- Thay đổi: tài liệu goal, spec và nghiên cứu, không thay đổi source sản phẩm.
- Validation và test count: ghi sau khi chạy.
- Metric/guardrail: chưa phát hành nội dung, chi phí provider bằng 0.
- Quyết định: giữ riêng goal `aieng` cũ; tái dùng nội dung hiện hữu bằng ID.
- Blocker: đặc tả chương trình và hoạt họa đã được chủ dự án duyệt ngày 2026-10-05 nhưng chưa merge; worker bảo mật chờ PoC và quyết định kiến trúc.
- Next best slice: kiểm kê và phê duyệt M0.
- Quyền cần thêm: đã được cấp quyền đưa đặc tả lên PR và merge khi kiểm tra đạt; quyết định kiến trúc worker vẫn cần PoC riêng.

## 7. Final audit

- [ ] Mọi outcome trong snapshot nguồn có ánh xạ và bằng chứng bài DHCB trên `main`.
- [ ] 20/20 phase có khóa/chặng hoàn chỉnh, ID và tiên quyết hợp lệ.
- [ ] Mọi bài mới/được mở rộng qua code checks, test chấm và rà sư phạm.
- [ ] Mọi hoạt họa đã chọn qua schema, a11y, reduced motion và ảnh nhiều mốc.
- [ ] Regression, security/privacy, accessibility, performance và vận hành đạt cổng repo.
- [ ] Các dự án tổng hợp có artifact và rubric nghiệm thu chạy lại được.
- [ ] Residual risks và nội dung ngoài scope được ghi rõ; chủ dự án xác nhận completion.

**Kết luận:** NOT COMPLETE

**Người xác nhận:**

**Ngày:**
