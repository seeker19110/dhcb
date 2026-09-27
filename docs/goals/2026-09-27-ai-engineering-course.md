# Goal: Lộ trình Kỹ sư AI toàn diện trong DHCB

| Thuộc tính        | Giá trị                                                                                                                                        |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Goal ID           | GOAL-2026-009                                                                                                                                  |
| Owner             | Chủ dự án DHCB                                                                                                                                 |
| Trạng thái        | WAITING                                                                                                                                        |
| Bắt đầu           | 2026-09-27                                                                                                                                     |
| Target review     | Chưa ấn định                                                                                                                                   |
| Quyền được cấp    | Nghiên cứu, tạo nhánh và chuẩn bị spec; chưa có quyền merge hoặc phát hành                                                                     |
| Budget/guardrails | Một goal nhiều PR; không sao chép bài nguồn; không gọi dịch vụ AI trả phí; không đổi billing, quyền truy cập hay dữ liệu học tập có thẩm quyền |

## 1. Outcome và Definition of Goal Complete

- Outcome: có một lộ trình DHCB bằng tiếng Việt, đi từ nền tảng ML đến thiết kế hệ thống AI, tái sử dụng bài đã có và bổ sung nội dung còn thiếu.
- Người dùng: người học muốn trở thành AI Engineer, LLM Engineer, Agent Engineer hoặc AI Platform Engineer.
- Metric baseline → target: hiện có chuỗi 6 khóa AI riêng; chưa có lộ trình tổng hợp khớp 19 mô-đun tham chiếu → 19/19 mô-đun được ánh xạ vào chương và mọi lesson ID hợp lệ, đã qua cổng chất lượng nội dung. Tổng số bài được chốt theo outcome và map reuse, không mặc định phải bằng 146+ của nguồn.
- Cửa sổ đo: tại mỗi PR nội dung và lần phát hành cuối.
- Guardrails: nội dung tự biên soạn; bài code chạy trong sandbox hiện có; không gọi provider trả phí; không thay đổi đặc quyền, thanh toán, mastery hoặc API AI; accessibility theo quy định dự án.
- Completion approver: Chủ dự án DHCB.

## 2. Scope và non-goals

### In scope

- Một khóa tổng hợp mới, dự kiến ID `aieng`, gồm Module 0 và Modules 1–18 theo lộ trình tham chiếu.
- Tái sử dụng lesson ID của các khóa `pyai`, `mathai`, `ml`, `mlds`, `cv1`, `cv2`, `llmagent` và `airel` khi nội dung đã phù hợp.
- Viết bài mới cho khoảng trống như model types, fine-tuning/alignment, context engineering, agent frameworks, inference, observability, multimodal, system design và phỏng vấn.
- Dùng khuôn bài học hiện có; mỗi bài mới có hook, lý thuyết, ví dụ, câu hỏi kiểm tra và thẻ SRS theo hợp đồng dữ liệu của môn Lập trình.

### Không làm

- Không sao chép nguyên văn hoặc dịch lại 146+ bài của kho tham chiếu; chỉ dùng chủ đề và thứ tự làm căn cứ nghiên cứu.
- Không nhúng trùng nội dung đã có nếu có thể trỏ tới lesson ID hiện hữu.
- Không xây API, model, agent thực thi, thanh toán, phân tích dữ liệu học tập mới hoặc tích hợp provider.
- Không thay đổi luật khóa bài; từng bài tiếp tục theo quyền truy cập hiện hành.

## 3. Milestones và slices

| ID    | Outcome/AC                                                                               | Dependency               | Spec                                            | Issue | PR  | State   | Evidence                                             |
| ----- | ---------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------- | ----- | --- | ------- | ---------------------------------------------------- |
| M1/S1 | Nghiên cứu và chốt bản đồ nội dung 19 mô-đun                                             | Đồng bộ main             | [Spec aieng](../specs/2026-09-27-aieng-dhcb.md) |       |     | WAITING | README tham chiếu và chuỗi khóa hiện có đã đối chiếu |
| M2/S1 | Soạn nhóm mô-đun 0–6; chỉ thêm lesson data, chưa hiện khóa chưa hoàn chỉnh trong catalog | Spec được duyệt và merge | Spec aieng                                      |       |     | BACKLOG | Unit tests nội dung và lesson audit                  |
| M3/S1 | Soạn nhóm mô-đun 7–12                                                                    | M2                       | Spec aieng                                      |       |     | BACKLOG | Lesson IDs và cổng chất lượng                        |
| M4/S1 | Soạn nhóm mô-đun 13–18                                                                   | M3                       | Spec aieng                                      |       |     | BACKLOG | Lesson IDs, safety review, cổng chất lượng           |
| M5/S1 | Đăng ký khóa tổng hợp, mở đường dẫn và xác minh toàn luồng                               | M2–M4                    | Spec aieng                                      |       |     | BACKLOG | Build, test, E2E/a11y và lesson audit                |

## 4. Risk register

| Risk                                                | Trigger/guardrail                                                            | Mitigation/rollback                                                   | Owner          | State |
| --------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------- | ----- |
| Trùng lặp với chuỗi sáu khóa đang có                | Mỗi mô-đun phải có bản đồ reuse trước khi soạn                               | Dùng lesson ID hiện hữu; bỏ bài trùng khỏi khóa tổng hợp              | Chủ dự án DHCB | OPEN  |
| Nội dung tham chiếu thay đổi hoặc có quyền tác giả  | Chỉ lấy chủ đề/cấu trúc, ghi nguồn và ngày nghiên cứu                        | Tự viết ví dụ, giải thích và bài tập; không chép bài nguồn            | Chủ dự án DHCB | OPEN  |
| Khóa tổng hợp hiện không đầy đủ khi đang triển khai | Không đăng ký vào catalog đến khi mọi mô-đun có lesson hợp lệ                | Chỉ thêm data ẩn khỏi catalog, sau đó đăng ký trong lát tích hợp cuối | Kỹ thuật DHCB  | OPEN  |
| Bài AI nói quá khả năng hoặc hướng dẫn unsafe       | Các bài safety và alignment cần tiêu chí rõ, không để AI ghi trạng thái thật | Nội dung tĩnh được kiểm tra; không tạo thực thi AI hoặc quyền mới     | Kỹ thuật DHCB  | OPEN  |

## 5. Current truth

- Commit `main` đã reconcile: `89d6a6f29809df94cdc13a3c0a94fdb6938bc517`.
- Goal gap hiện tại: DHCB đã có sáu khóa AI riêng nhưng chưa có một mục lộ trình 19 mô-đun bao trùm các phần còn thiếu trong nguồn tham chiếu.
- Blocker/câu hỏi mở: spec đang ở trạng thái Draft/In review; AGENTS.md yêu cầu spec phải được nghiên cứu, duyệt và merge trước khi thay đổi source.
- Next best slice và lý do: chủ dự án xem xét/duyệt spec; đó là điều kiện mở khóa các lát nội dung.
- Quyền hoặc quyết định cần thêm: xác nhận spec đạt trạng thái **Approved for implementation** và được merge theo Git flow của dự án.

## 6. Iteration log

### Iteration 1 — 2026-09-27

- State: WAITING.
- Slice: đồng bộ `main`, audit nhanh cấu trúc khóa hiện có, nghiên cứu nguồn tham chiếu và tạo spec/goal docs.
- Goal gap trước/sau: phát hiện chuỗi sáu khóa đã có; xác định khoảng trống so với 19 mô-đun nguồn và chọn phương án khóa tổng hợp tái sử dụng lesson.
- Research/spec/issue/PR: [README kho AI Engineering Course](https://github.com/amitshekhariitbhu/ai-engineering-course); [spec aieng](../specs/2026-09-27-aieng-dhcb.md).
- Thay đổi: chỉ thêm hai tài liệu goal/spec trên nhánh `codex/ai-engineering-course`.
- Validation và test count: `npx prettier --check` hai tài liệu và `git diff --check` đều xanh; chưa chạy source test vì chưa có source thay đổi.
- Metric/guardrail: chưa có source thay đổi, provider cost bằng 0.
- Quyết định: chưa viết source trước khi spec được duyệt và merge.
- Blocker: chờ chủ dự án xem xét spec.
- Next best slice: phê duyệt spec hoặc nêu chỉnh sửa.
- Quyền cần thêm: duyệt spec; việc merge cần theo quy trình PR của dự án.

## 7. Final audit

- [ ] Mọi Goal AC có bằng chứng trên `main`.
- [ ] Metrics đạt, guardrails không suy giảm.
- [ ] Không còn milestone bắt buộc/blocker cao/migration dang dở.
- [ ] Regression/security/privacy/a11y/operational gates xanh.
- [ ] Production verification hoàn tất nếu thuộc scope.
- [ ] Docs/runbook/telemetry/rollback cập nhật.
- [ ] Residual risks và out-of-scope được ghi rõ.
- [ ] Owner xác nhận completion khi cần.

**Kết luận:** NOT COMPLETE
**Người xác nhận:**
**Ngày:**
