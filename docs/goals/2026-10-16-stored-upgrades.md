# Goal nâng cấp DHCB từ stored

| Thuộc tính        | Giá trị                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Goal ID           | GOAL-2026-10-16-STORED                                                                                                         |
| Owner             | Chủ dự án DHCB                                                                                                                 |
| Trạng thái        | ACTIVE — S01 qua cổng cục bộ, đang tích hợp; S02–S06 đã được owner duyệt                                                       |
| Bắt đầu           | 2026-10-16                                                                                                                     |
| Target review     | Sau từng slice đã kiểm chứng                                                                                                   |
| Quyền được cấp    | Owner duyệt S02–S06 và push/PR/merge/deploy khi CI xanh trong chat 16/10; không chi tiền provider hoặc dùng dữ liệu production |
| Budget/guardrails | Một outcome mỗi vòng; tối đa ba lần sửa cùng lỗi; test không gọi provider trả phí; giữ nguyên dữ liệu/quyền/billing production |

## 1. Outcome và Definition of Goal Complete

- Outcome: kiểm chứng được chất lượng AI, truy nguyên chi phí theo lượt và an toàn ngữ cảnh
  trên các luồng đang có của DHCB.
- Người dùng: người học Việt ⇄ Anh và người vận hành hệ thống.
- Baseline: nghiên cứu [stored](../research/2026-10-16-stored-nang-cap-dhcb.md); runner ký ức
  có thể báo 29/30 nhưng thoát 0; telemetry token đang cộng theo ngày/provider/model/mode.
- Target: mọi vi phạm hard gate đều bị chặn; trace giải thích được các chặng/lời gọi của
  một lượt; truy xuất và voice có corpus, mẫu số, baseline và tiêu chí đã chốt.
- Cửa sổ đo: S01 đo bằng fixture tất định trong mỗi lượt kiểm thử; những slice sau phải chốt
  corpus/thiết bị/cửa sổ đo trong đặc tả trước khi bắt đầu source.
- Guardrails: không thêm provider, kho dữ liệu hoặc backend quan sát bên ngoài khi chưa có
  nhu cầu và quyền tương ứng; không suy diễn chất lượng model từ fixture giả.
- Completion approver: chủ dự án; chỉ hoàn tất khi các AC đã có bằng chứng trên main.

## 2. Scope và non-goals

### In scope

- Cổng eval, replay ở biên provider, telemetry theo lượt, kiểm thử injection, benchmark truy
  xuất và số đo hội thoại giọng nói như nghiên cứu đã đề xuất.
- Chia thành các slice độc lập, giữ modular monolith và các cơ chế bảo mật hiện hữu.

### Không làm

- Thay model, giá gói, hạn mức, thẩm quyền, giao diện hoặc chính sách người học trong S01.
- Tự triển khai Langfuse, framework agent hoặc GPU; tự chọn trần chi tiêu hay gửi dữ liệu
  người học sang dịch vụ khác.

## 3. Milestones và slices

| ID  | Outcome/AC                                                                   | Dependency                            | Spec                                                                                             | Issue    | PR       | State   | Evidence                                                        |
| --- | ---------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- | -------- | ------- | --------------------------------------------------------------- |
| S01 | Runner ký ức từ chối ca sai, ca hỏng, fixture rỗng/thiếu nhóm; giữ 30 ca gốc | Không                                 | [V2-19 đã duyệt](../specs/2026-08-17-v2-19-platform-evaluation-hardening.md) và nghiên cứu 16/10 | Chưa tạo | Chưa tạo | WAITING | Đủ năm cổng cục bộ; helper/CLI negative control đạt; chưa merge |
| S02 | Replay phản hồi provider qua logic production, offline và phát hiện mismatch | S01 đã tích hợp; spec được merge      | [S02 đã duyệt](../specs/2026-10-16-stored-s02-provider-replay.md)                                | Chưa tạo | Chưa tạo | SPEC    | Chưa triển khai source                                          |
| S03 | Trace các chặng và chi phí từng lượt, dữ liệu tối thiểu                      | Spec telemetry được merge             | [S03 đã duyệt](../specs/2026-10-16-stored-s03-turn-tracing.md)                                   | Chưa tạo | Chưa tạo | SPEC    | Chưa chọn backend hoặc chính sách lưu                           |
| S04 | Injection qua ghi chú/ký ức/công cụ và kiểm cả delta stream                  | Spec và corpus được merge             | [S04 đã duyệt](../specs/2026-10-16-stored-s04-injection-stream.md)                               | Chưa tạo | Chưa tạo | SPEC    | Giữ red-team Postgres hiện hữu                                  |
| S05 | Benchmark chất lượng truy xuất Việt–Anh                                      | Corpus/nhãn/ngưỡng đã duyệt           | [S05 đã duyệt](../specs/2026-10-16-stored-s05-memory-retrieval-benchmark.md)                     | Chưa tạo | Chưa tạo | SPEC    | Giữ FTS + cosine + RRF hiện hữu                                 |
| S06 | Số đo voice, ngắt lời, reconnect và fallback                                 | Spec/cách đo trên thiết bị được duyệt | [S06 đã duyệt](../specs/2026-10-16-stored-s06-voice-metrics.md)                                  | Chưa tạo | Chưa tạo | SPEC    | Chưa thử provider có phí                                        |

## 4. Risk register

| Risk                                              | Trigger/guardrail          | Mitigation/rollback                                                                   | Owner           | State                |
| ------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------- | --------------- | -------------------- |
| Eval xanh giả                                     | Có ca sai nhưng exit 0     | Kiểm helper và CLI bằng negative control; giữ đầy đủ các nhóm ca                      | Agent           | Đã kiểm chứng cục bộ |
| Replay bị coi là chất lượng model mới             | Chỉ chạy fixture đã ghi    | Gắn loại bằng chứng, fingerprint request/config; live eval là việc riêng có ngân sách | Chủ dự án/agent | Mở                   |
| Trace làm lộ hội thoại hoặc tăng chi phí vận hành | Thêm payload/backend mới   | Chốt allowlist metadata, retention và tài nguyên trước triển khai                     | Chủ dự án       | Mở                   |
| Tự mở rộng sang nhiều slice chưa tích hợp         | S01 chưa được review/merge | Checkpoint một slice và chỉ chuẩn bị spec tiếp theo                                   | Agent           | Đang kiểm soát       |

## 5. Current truth

- Commit main đã reconcile: `3bdf9617ac1764f2307e9f31fc1265c6b8943f09` ngày 13/10.
- Worktree: `/home/liend/.codex/worktrees/stored-eval-gate/dhcb`; nhánh
  `codex/stored-eval-gate`. Workspace gốc và các file chưa track của người dùng giữ nguyên.
- Goal gap: S01 đã qua cổng cục bộ, chưa tích hợp; S02–S06 đã được owner duyệt, chờ merge spec trước source. Chưa có bằng chứng trên main cho
  các slice của goal này.
- Next best slice: S02 sau khi S01 được tích hợp và đặc tả replay đã review/merge.
- Quyền tích hợp đã được cấp trong chat 16/10: push/mở PR/merge/deploy sau khi
  `quality`, `e2e`, `metadata` xanh. Owner đã biết merge main tự kích hoạt deploy VPS.
  Chưa có quyền gọi provider có phí hay dùng dữ liệu production.

## 6. Iteration log

### Iteration 1 — 2026-10-16

- State: WAITING.
- Slice: S01, sửa lỗi cổng eval hiện có theo đặc tả V2-19 đã merge.
- Gap trước: một ca sai vẫn có thể thoát 0, JSON đọc bằng ép kiểu, mẫu số rỗng có mặc định
  thành công; test cũ chỉ kiểm ba nhánh của service.
- Thay đổi: helper dùng Zod, giữ sàn 30 ca/sáu nhóm, từ chối ID trùng; mọi ca sai/hỏng làm
  cổng đỏ; CLI dùng mã thoát của helper và báo riêng ca hỏng.
- Quyết định: không sửa memory service, fixture gốc hay ngưỡng an toàn; chuẩn bị Draft S02–S06
  trong lúc xác minh S01, chưa xây source của tính năng mới.
- Validation trên Node 22.23.2, dependency từ `npm ci`:
  - `npm run build`, `npm run typecheck`, `npm run lint` (0 cảnh báo),
    `npm run format:check`: exit 0.
  - `npm test -- --coverage --maxWorkers=1`: exit 0; 949 file passed, 5 skipped;
    21.435 test passed, 35 skipped theo cấu hình sẵn có, không thêm skip.
  - Coverage statements 96,15%, branches 92,01%, functions 96,88%, lines 96,85%; vượt
    sàn hiện hành 94/90/94/94, không sửa cấu hình hay ngưỡng.
  - Targeted helper/CLI/service: 3 file, 38 test passed. CLI golden set 30/30 → exit 0;
    negative control 29/30, false-memory 4,76%, correction 100% → exit 1.
  - `npm run check:specs -- --ci`: 191 spec, exit 0; staged secrets/conflict/diff checks đạt.
  - Build cần `NODE_OPTIONS=--max-old-space-size=2304` trong VM RAM hạn chế; lượt 1536 MB
    hết heap, lượt 2304 MB đạt. Các cổng nặng chạy tuần tự; không đổi source để né cổng.
  - Chưa chạy E2E cục bộ: chỉ đổi công cụ eval/tài liệu, không đổi UI/routing/auth/API
    hoặc luồng người học. Vẫn cần check E2E bắt buộc của PR trước merge.
- Quyền cần thêm: theo mục 5, sau khi hoàn tất kiểm chứng cục bộ.

### Checkpoint duyệt tích hợp — 2026-10-16

- Owner chọn “Duyệt đặc tả và cho phép push/PR/merge/deploy khi CI xanh”.
- S02–S06 được đánh dấu Approved for implementation theo quyết định này; chỉ viết source
  sau khi PR chứa spec được merge. Không mở rộng sang provider có phí/dữ liệu production.
- S01 local commit `e0d0ca56`; bước tiếp theo push nhánh, tạo PR và theo dõi CI.

## 7. Final audit

- [ ] Mọi Goal AC có bằng chứng trên main.
- [ ] Metrics đạt, guardrails không suy giảm.
- [ ] Không còn milestone bắt buộc/blocker cao/migration dang dở.
- [ ] Regression/security/privacy/a11y/operational gates liên quan xanh.
- [ ] Production verification hoàn tất nếu thuộc scope được cấp sau này.
- [ ] Docs/runbook/telemetry/rollback cập nhật.
- [ ] Residual risks và out-of-scope được ghi rõ.
- [ ] Owner xác nhận completion khi cần.

**Kết luận:** NOT COMPLETE.
