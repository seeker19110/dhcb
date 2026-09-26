# Quy trình phát triển từ ý tưởng đến sản phẩm

Đây là nguồn sự thật cho cách đưa một thay đổi của **dhcb** từ ý tưởng đến production.
Mục tiêu là thay đổi nhỏ, truy vết được, có bằng chứng kiểm thử và rollback được.

> **Cổng bắt buộc cho tính năng:** nghiên cứu và viết đặc tả chi tiết trước khi code. Không tạo
> nhánh implementation, không sửa source và không mở PR code `feat` khi spec chưa được review,
> chốt quyết định còn mở và đánh dấu **Approved for implementation**.

## 1. Luồng chuẩn

| Cổng     | Đầu vào            | Việc bắt buộc                                                                                    | Đầu ra                    |
| -------- | ------------------ | ------------------------------------------------------------------------------------------------ | ------------------------- |
| Idea     | Vấn đề hoặc cơ hội | Nêu người dùng, pain point, kết quả mong muốn và cách đo                                         | Feature issue             |
| Research | Feature issue      | Đọc code/luồng hiện tại, dữ liệu người dùng, giải pháp tương tự, constraint, rủi ro và phương án | Bằng chứng + lựa chọn     |
| Spec     | Nghiên cứu đủ      | Viết spec theo `docs/specs/TEMPLATE.md`; review product/UX/architecture/security                 | Spec được duyệt           |
| Plan     | Spec được duyệt    | Tách lát dọc nhỏ, dependency, test, migration, rollout/rollback                                  | Checklist thực thi        |
| Build    | Issue đạt DoR      | Nhánh riêng, commit nhỏ, test cùng code, cập nhật tài liệu                                       | Draft PR                  |
| Verify   | Draft PR           | CI, self-review, security/privacy, a11y, impact map, manual smoke                                | PR đạt DoD                |
| Release  | PR được duyệt      | Squash merge, theo dõi deploy; tag phiên bản khi cần release mốc                                 | Bản phát hành             |
| Observe  | Đã release         | Kiểm health/error/cost/critical flow; rollback nếu vượt ngưỡng                                   | Issue đóng hoặc follow-up |

Bug nhỏ có thể bắt đầu từ bước tái hiện/root cause; nhưng nếu bản sửa đổi hành vi sản phẩm hoặc
thêm capability mới thì vẫn phải đi qua Research + Spec.

## 2. Cổng Research

Nghiên cứu phải để lại bằng chứng trong issue hoặc spec, không chỉ là kết luận:

- đọc `PROJECT.md`, `PROGRESS.md`, `AGENTS.md`, code và test của luồng hiện tại;
- chạy `npm run codemap -- impact <file>` cho các điểm dự kiến thay đổi;
- mô tả người dùng/job-to-be-done và baseline hiện tại bằng dữ liệu hoặc quan sát có nguồn;
- đối chiếu ít nhất các phương án khả thi, gồm “không làm”, trade-off và lý do chọn;
- inventory contract API/data, dependency, privacy/security, accessibility, latency và AI cost;
- ghi giả định, điều chưa biết, cách xác minh và quyết định cần product owner chốt;
- với thông tin bên ngoài có thể thay đổi, ghi nguồn và ngày truy cập.

Không dùng “AI đề xuất” như bằng chứng. Claim quan trọng phải truy được về code, test, dữ liệu hoặc
nguồn chính thống.

## 3. Cổng Spec và Definition of Ready

Mỗi tính năng có một file `docs/specs/<yyyy-mm-dd>-<slug>.md` tạo từ template. Spec phải gồm:
problem/outcome, research, current state, user journeys/states, scope/non-goals, requirements,
acceptance criteria, UX/accessibility, API/data/contracts, security/privacy, telemetry, test plan,
rollout/migration/rollback, rủi ro, alternatives và câu hỏi mở.

Chỉ đánh dấu **Approved for implementation** khi:

- outcome và acceptance criteria đo/kiểm thử được;
- research có bằng chứng, nguồn và phương án so sánh;
- scope, non-goals, dependency và owner rõ ràng;
- UX states, API/data contract và failure modes đủ để implement không phải tự đoán;
- security/privacy/a11y/performance/cost đã được đánh giá;
- test, telemetry, rollout, migration và rollback cụ thể;
- mọi quyết định sản phẩm/kiến trúc quan trọng đã chốt;
- product owner ghi người duyệt và ngày duyệt trong spec.

Spec thay đổi trong khi code phải được cập nhật và review lại trước khi tiếp tục phần bị ảnh hưởng.

## 4. Thiết kế và chia nhỏ

Ưu tiên lát dọc hoàn chỉnh có giá trị cho người dùng. Mỗi PR nên review được trong một lần và
không trộn refactor không liên quan. Issue cha giữ outcome; issue con có link về spec và lần lượt
đi qua contract/migration, backend, frontend, telemetry và rollout.

## 5. Ma trận kiểm thử theo rủi ro

| Thay đổi                  | Bằng chứng tối thiểu                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------ |
| Docs/config               | Prettier file đổi, `git diff --check`                                                |
| Logic thuần               | Typecheck, lint, unit test nhắm mục tiêu và full unit gate                           |
| UI/routing/a11y           | Các gate trên + Playwright + axe + kiểm mobile/theme liên quan                       |
| API/auth/data             | Các gate trên + integration test PostgreSQL disposable, negative/authorization cases |
| Payment/entitlement/usage | Concurrent/retry/idempotency tests, failure recovery và reconciliation               |
| Prompt/model AI           | Eval tutor so với baseline, token/cost/latency và fallback                           |
| Migration                 | Chạy mới + chạy lặp, verify query, rollout tương thích ngược và recovery procedure   |

Không dùng secret, dữ liệu thật hoặc provider trả phí trong CI.

## 6. Nhánh, commit và PR

- Spec/research: `docs/spec-<issue>-<slug>`; merge spec trước implementation.
- Implementation: `feat/<issue>-<slug>`, `fix/<issue>-<slug>`, `refactor/<issue>-<slug>`.
- Commit theo Conventional Commits, một thay đổi logic mỗi commit.
- PR `feat` phải có link tới file spec đã duyệt; PR policy tự động chặn nếu thiếu.
- Mở draft PR sớm và dùng `Closes #123` để liên kết issue.
- Không tự merge khi có review chưa giải quyết hoặc required check chưa xanh.

## 7. Definition of Done (DoD)

- implementation khớp spec đã duyệt; mọi deviation được ghi và review;
- acceptance criteria hoàn tất và có bằng chứng;
- test mới chứng minh hành vi; tất cả gate liên quan xanh;
- đã self-review diff và kiểm impact map;
- input/error/authorization/privacy được xử lý;
- không có secret, debug log, generated output hoặc file ngoài phạm vi;
- contract, migration, observability và tài liệu được cập nhật;
- rollout/rollback rõ ràng; breaking change được gọi tên;
- không còn câu hỏi hoặc blocker chưa giải quyết.

## 8. Merge, release và quan sát

Mặc định squash merge sau khi required checks xanh. Deploy production vẫn do `deploy.yml`
thực hiện khi merge vào `main`. Tag `vX.Y.Z` tạo GitHub Release với generated notes nhưng không
thay thế approval deploy.

Sau deploy, kiểm critical flow, Sentry/error rate, latency và chi phí provider. Nếu health check
hoặc critical flow thất bại, ưu tiên rollback/revert rồi điều tra trong issue mới.

## 9. Trách nhiệm

| Vai trò       | Trách nhiệm                                                 |
| ------------- | ----------------------------------------------------------- |
| Product owner | Outcome, ưu tiên, duyệt research/spec và quyết định scope   |
| Spec owner    | Thu thập bằng chứng, viết spec, giải quyết câu hỏi mở       |
| Implementer   | Code theo spec, test, migration, self-review, bằng chứng    |
| Reviewer      | Correctness, security/privacy, operability, maintainability |
| Release owner | Go/no-go, theo dõi deploy, xác minh production và rollback  |

Một người có thể giữ nhiều vai trò, nhưng phải đi qua đầy đủ các cổng và ghi người/ngày phê duyệt.
