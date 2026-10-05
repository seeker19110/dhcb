# Goal: Bộ khóa Kỹ thuật AI từ nền tảng tới sản phẩm

| Thuộc tính        | Giá trị                                                                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Goal ID           | GOAL-2026-010                                                                                                                                                                         |
| Owner             | Chủ dự án DHCB                                                                                                                                                                        |
| Trạng thái        | VERIFYING                                                                                                                                                                             |
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

| Slice                                                                     | State    | Bằng chứng                                    |
| ------------------------------------------------------------------------- | -------- | --------------------------------------------- |
| C1 — hợp đồng hoạt họa, trang bài, công cụ ảnh, fallback giảm chuyển động | DONE     | PR #1237, merge `07911b4`, quality/e2e đạt    |
| C1-G — pilot gradient và phát lại lượt hữu hạn                            | PLANNING | Storyboard đã review; chưa có pilot trên main |

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

- Commit `main` đã reconcile: `07911b4d3a7d949dfae27b1855436cf180b98851` (2026-10-05, merge PR #1237).
- Goal gap: inventory và CSV đã khớp **523/523 source keys**, gồm **349 NEW, 174 EXTEND, 0 REUSE**. Đây là map K1 về mục tiêu/theory/Make, chưa phải 523 bài đã triển khai hoặc lab đã chạy. Mọi EXTEND có ID hiện hữu chính; mọi hàng có mức kiểm chứng. 345 ứng viên hoạt họa, 93 mục không ưu tiên hoạt họa, 85 mục Phase 19 chờ chọn cảnh khi có thiết kế project chi tiết.
- Review: [phiếu quality review](../research/2026-10-05-ai-engineering-map-quality-review.md) đã xử lý năm ID thiếu và mô tả Build It quá rộng. [Bản đồ capstone](../research/2026-10-05-ai-engineering-phase19-map.md) có đủ 85 source keys và rubric từng nhóm. Chưa chạy lab nguồn; review sâu thuộc từng lát nội dung.
- PR tài liệu: [#1236](https://github.com/seeker19110/dhcb/pull/1236). Chủ dự án đã duyệt phương án, cho phép PR/merge tài liệu khi kiểm tra đạt ngày 2026-10-05.
- Cổng đặc tả: PR #1236 đã merge. C1 contract/UI/tooling/fallback giảm chuyển động đã merge qua [PR #1237](https://github.com/seeker19110/dhcb/pull/1237) sau khi metadata, security, quality và e2e đều đạt, gồm sáu shard E2E. [CI](https://github.com/seeker19110/dhcb/actions/runs/37317306434) kiểm head `c352d0199c6df9cb62d28e9e2c25cf9e837da1be`; các lượt E2E local chưa xanh vẫn được giữ trong log lịch sử, không dùng thay bằng chứng CI.
- Blocker phát hành khóa: worker bảo mật còn Draft, cần PoC/ADR riêng để mở lại chấm code. Rà sâu bổ sung yêu cầu policy ghi hoàn thành không phụ thuộc tiền tố ID, tách ca đánh giá server khỏi bundle và đo batch 25 ca; chưa có bằng chứng worker chạy trên staging.
- Next best slice: pilot `mathai-u3-l3`: sửa khái quát toán/ML sai, thêm hoạt họa theo storyboard, kiểm số học và ảnh thật. [Hợp đồng phát lại](../specs/2026-10-05-lesson-animation-replay.md) chuẩn bị sửa nút chạy sau lượt hữu hạn trước phát hành pilot. Phần content tiếp tục review theo từng nhóm outcome, không dùng map K1 thay nghiệm thu bài.
- Quyền: được triển khai source theo yêu cầu của chủ dự án sau cổng spec; chủ dự án đã cấp quyền PR/merge các lát mã theo đặc tả được duyệt, bắt đầu C1, với điều kiện required quality/e2e đạt trước merge. Quyền deploy production chưa được cấp.

## 6. Iteration log

### Iteration 1 — 2026-10-05

- State: WAITING.
- Slice: kiểm kê nguồn/DHCB song song, đặc tả chương trình và hoạt họa.
- Goal gap trước/sau: từ inventory chưa map tới 523/523 quyết định K1; chưa có bài sản phẩm mới.
- Research/spec/issue/PR: xem mục M0 và PR #1236.
- Thay đổi: tài liệu goal, spec và nghiên cứu, không thay đổi source sản phẩm.
- Validation: Prettier và whitespace đạt; audit 523 source keys, 174 EXTEND có ID hợp lệ, 85 capstone keys đạt. Kiểm mã sản phẩm chưa áp dụng vì diff chỉ có tài liệu.
- Metric/guardrail: chưa phát hành nội dung, chi phí provider bằng 0.
- Quyết định: giữ riêng goal `aieng` cũ; tái dùng nội dung hiện hữu bằng ID.
- Blocker: đặc tả chương trình và hoạt họa đã được chủ dự án duyệt ngày 2026-10-05 nhưng chưa merge; worker bảo mật chờ PoC và quyết định kiến trúc.
- Next best slice: merge đặc tả sau required checks, triển khai C1 hoạt họa bài học.
- Quyền cần thêm: đã được cấp quyền đưa đặc tả lên PR và merge khi kiểm tra đạt; quyết định kiến trúc worker vẫn cần PoC riêng.

### Iteration 2 — 2026-10-05

- State: VERIFYING; quyền PR/merge mã có điều kiện đã được cấp.
- Slice: C1 hợp đồng hoạt họa Lập trình, trang Khái niệm, công cụ chụp ma trận và lỗi fallback giảm chuyển động của renderer chung.
- Base: `93904be`; nhánh `codex/programming-lesson-animation`.
- Goal gap: chưa thêm khóa/bài sản phẩm; đang mở năng lực hiển thị và kiểm hoạt họa. Bốn storyboard thí điểm và nội dung từng outcome vẫn cần triển khai/nghiệm thu riêng.
- Subagent: hợp đồng/trang bài, tooling ảnh, storyboard/fallback; reviewer chéo độc lập rà tooling và số liệu gradient.
- Bằng chứng tạm: 4 suites / 73 tests trang/schema/loader/renderer cũ đạt; 15 tests parser đạt; ESLint các file hợp đồng/tooling và Prettier riêng đạt. Các con số này không thay full gate trên trạng thái tích hợp cuối.
- Browser smoke tooling: 20 ảnh + 4 montage ở 390/1440 × blue-sky/dark-blue, 5 CSS animations/lượt, 4 ảnh khác nhau mỗi tổ hợp, SVG rộng 358/720px, không cảnh báo hình học. Legacy 760px giữ 5 ảnh và đường dẫn cũ. Reviewer đã xem bốn montage; đây là bài STEM mẫu, chưa nghiệm thu bài Lập trình hay a11y nội dung.
- Môi trường: Chromium thiếu bốn thư viện hệ thống; tải/extract thư viện vào `work/browser-libs` để kiểm cục bộ, không đổi dependency sản phẩm.
- Phát hiện: reduced motion làm các lớp opacity/trạng thái transform mất cảnh đầu; C1 bổ sung hồi quy. Storyboard gradient phân biệt dao động lr=1 và hội tụ lr=0,1; lỗi nội dung cũ được ghi để sửa khi triển khai pilot.
- PoC grader: [kế hoạch kiểm chứng](../research/2026-10-05-programming-grading-poc-plan.md) ở trạng thái Proposed, có 16 ca kiểm và ranh giới supervisor/container; chưa chọn staging, chạy probe hay phê duyệt kiến trúc.
- Gate tĩnh: `npm run build`, `npm run typecheck`, `npm run lint`, `npm run format:check` đều exit 0 trên bản tích hợp. Sau sửa harness E2E, typecheck E2E + ESLint/Prettier riêng file tiếp tục đạt.
- Unit toàn kho: **793 files đạt, 1 file skip; 18.508 tests đạt, 2 skip / 18.510**; exit 0, 311,86 giây trên bản sao kiểm chứng Linux. Lượt đầu trên ổ Windows gặp timeout 5 giây ở phép quét tệp `UiNoise.design.test.ts`; đã dừng lượt đó, không tăng timeout. Đối chiếu 4.269 tệp nguồn trước lượt native: không sai khác; cài cùng lockfile.
- E2E hoạt họa: **5/5 đạt**, gồm 2 ca giảm chuyển động thật và 3 ca zoom/rotation/Esc/focus. Harness SSR phải chạy Node/tsx riêng với tsconfig.base, vì Playwright biến đổi JSX theo dạng component-test; lỗi harness được sửa, assertions giữ nguyên.
- E2E toàn kho: lượt đầu gặp cold-load timeout ở 2FA; chẩn đoán và chạy lại 12/12 ca 2FA đạt. Lượt rộng tiếp theo dừng theo `--max-failures=3`: 53 passed, 3 failed, 1 interrupted, 1.195 chưa chạy / 1.252. Hai lỗi là DOM đổi trong lúc quét AAA (`p1-u4-l1`, `/goc-hoc-tap/english`, dark-blue); một timeout ở `/bai-hoc`, blue-sky. Không khẳng định đây chỉ là lỗi môi trường hoặc cổng E2E đã xanh; ba ca lỗi đều đã chạy lại đạt với một worker, không đổi timeout/assertions. Lượt chẩn đoán dùng `--last-failed` còn chọn cả ca chưa chạy; đã dừng sau khi xác nhận ba ca lỗi để tránh lặp quét ngoài mục tiêu chẩn đoán. Cần full CI trước merge; không coi các lượt rời rạc là một lượt E2E toàn kho xanh.
- Root review: đã đọc toàn bộ diff; reviewer chéo không thấy lỗi mới trong contract/tooling/fallback. Không hạ tiêu chuẩn a11y, sửa allowlist hoặc thêm skip để vượt cổng.
- Quyền: tài liệu được PR/merge; source được triển khai/kiểm/commit tại máy. C1 đã có diff và bằng chứng để review; chủ dự án đã cho phép push/mở PR mã và merge có điều kiện sau khi required quality/e2e đều đạt. Chưa được triển khai production.
- Next: PR C1 và full CI; sau merge reconcile main, triển khai pilot gradient từ storyboard. Worker vẫn cần quyết định staging/ADR theo kế hoạch PoC Proposed.

### Iteration 3 — 2026-10-05

- State: PLANNING.
- Slice hoàn tất: C1 contract/UI/tooling/fallback giảm chuyển động, PR #1237, merge `07911b4` lúc 20:39 giờ Việt Nam.
- Bằng chứng: required `quality` và `e2e` đạt; sáu shard E2E, build/budget/boot, type/lint/format, unit/coverage, audit/import-cycle và secret scan đều đạt trên head PR. Goal chưa có khóa/bài AI mới hoặc pilot hoạt họa trên main.
- Goal gap trước/sau: bài Lập trình đã có khả năng gắn hoạt họa và công cụ kiểm ảnh; 20 khóa vẫn chưa nghiệm thu, worker vẫn chưa mở. Không đánh dấu một phase DONE.
- Review vòng sau: bộ mô phỏng Git chưa thực thi `.gitignore` dù bài `p3-u11-l1` hướng dẫn dùng; cần lát sửa mô phỏng và rubric kiểm trạng thái thật trước reuse. ID bài mới hiện còn bị schema chặn; test registry hiện đòi mọi lesson phải chấm lại. Rủi ro bỏ sót policy chỉ phát sinh khi mở ID/language mới và phải được chặn tại API, không chỉ dựa test.
- Next: merge hợp đồng replay, triển khai pilot gradient với một subagent sở hữu lesson/test và coordinator sở hữu renderer/browser/integration. Không đổi ID/Make/grading trong pilot.
- Quyền: tiếp tục PR/merge tài liệu và source theo đặc tả được duyệt khi required checks đạt; chưa cấp deploy production. Quyết định staging/kiến trúc worker còn mở.

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
