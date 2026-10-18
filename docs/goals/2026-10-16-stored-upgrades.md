# Goal nâng cấp DHCB từ stored

| Thuộc tính        | Giá trị                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Goal ID           | GOAL-2026-10-16-STORED                                                                                                         |
| Owner             | Chủ dự án DHCB                                                                                                                 |
| Trạng thái        | ACTIVE — S06b đã merge/deploy; đang tích hợp baseline S05, S06 còn mở                                                          |
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

| ID   | Outcome/AC                                                                   | Dependency                            | Spec                                                                                             | Issue    | PR                                                     | State  | Evidence                                                                                    |
| ---- | ---------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------- |
| S01  | Runner ký ức từ chối ca sai, ca hỏng, fixture rỗng/thiếu nhóm; giữ 30 ca gốc | Không                                 | [V2-19 đã duyệt](../specs/2026-08-17-v2-19-platform-evaluation-hardening.md) và nghiên cứu 16/10 | Chưa tạo | [#1399](https://github.com/seeker19110/dhcb/pull/1399) | DONE   | Main 66db5e63; quality/e2e/metadata và deploy đạt                                           |
| S02  | Replay phản hồi provider qua logic production, offline và phát hiện mismatch | S01 đã tích hợp; spec được merge      | [S02 đã duyệt](../specs/2026-10-16-stored-s02-provider-replay.md)                                | Chưa tạo | [#1400](https://github.com/seeker19110/dhcb/pull/1400) | DONE   | Main 5e7bb30f; đủ 18 check và deploy đạt                                                    |
| S03a | Sửa phép tính cache write bị cộng trùng trước trace                          | S02 tích hợp                          | [Khảo sát S03](../specs/2026-10-16-stored-s03-turn-tracing.md)                                   | Chưa tạo | [#1401](https://github.com/seeker19110/dhcb/pull/1401) | DONE   | Main f29d8237; 19 check xanh, CI 21.491 test/coverage đạt                                   |
| S03  | Trace các chặng và chi phí từng lượt, dữ liệu tối thiểu                      | Spec telemetry được merge             | [S03 đã duyệt](../specs/2026-10-16-stored-s03-turn-tracing.md)                                   | Chưa tạo | [#1402](https://github.com/seeker19110/dhcb/pull/1402) | DONE   | Main46ff9437; S03b1406 bổ sung embedding, 19 check xanh                                     |
| S03b | Ghi attempt embedding, giữ tổng unknown khi chưa có usage                    | S05a đã tích hợp; S03 Approved        | [S03 đã duyệt](../specs/2026-10-16-stored-s03-turn-tracing.md)                                   | Chưa tạo | [#1406](https://github.com/seeker19110/dhcb/pull/1406) | DONE   | Main46ff9437; 19 check, 21.647 unit/1.440 E2E đạt                                           |
| S04a | Chuyển SSE qua HTTP production/dev, giữ side effects khi disconnect          | S03 đã tích hợp                       | [S04 đã duyệt](../specs/2026-10-16-stored-s04-injection-stream.md)                               | Chưa tạo | [#1403](https://github.com/seeker19110/dhcb/pull/1403) | DONE   | Main 84b16bec; 19 check, 21.558 unit và 1.436 E2E pass                                      |
| S04b | Lọc lời văn delta/final qua mọi chunk, giữ metadata đề xuất                  | S04a đã merge                         | [S04 đã duyệt](../specs/2026-10-16-stored-s04-injection-stream.md)                               | Chưa tạo | [#1404](https://github.com/seeker19110/dhcb/pull/1404) | DONE   | Main80328ab7; 19 check, 21.614 unit và 1.440 E2E pass                                       |
| S04c | Xóa thẻ dữ liệu tới ổn định, fail closed khi quá 32 lượt                     | S03b đã merge                         | [S04 đã duyệt](../specs/2026-10-16-stored-s04-injection-stream.md)                               | Chưa tạo | [#1407](https://github.com/seeker19110/dhcb/pull/1407) | DONE   | Maina47a5c14;19 check,21.676 unit/1.440 E2E và deploy đạt                                   |
| S04  | Injection qua ghi chú/ký ức/công cụ và kiểm cả delta stream                  | Spec và corpus được merge             | [S04 đã duyệt](../specs/2026-10-16-stored-s04-injection-stream.md)                               | Chưa tạo | [#1408](https://github.com/seeker19110/dhcb/pull/1408) | DONE   | Main bbeaded5; PR/main CI và deploy đạt; 1.874+8 runtime/cleanup0                           |
| S05a | Giữ eligibility khi hydrate và fallback khi embedding reject                 | Spec S05 đã merge                     | [S05 đã duyệt](../specs/2026-10-16-stored-s05-memory-retrieval-benchmark.md)                     | Chưa tạo | [#1405](https://github.com/seeker19110/dhcb/pull/1405) | DONE   | Main85f27d9a; 19 check, PG/21.630 unit/1.440 E2E đạt                                        |
| S05  | Benchmark chất lượng truy xuất Việt–Anh                                      | Corpus/nhãn/ngưỡng đã duyệt           | [S05 đã duyệt](../specs/2026-10-16-stored-s05-memory-retrieval-benchmark.md)                     | Chưa tạo | [#1413](https://github.com/seeker19110/dhcb/pull/1413) | VERIFY | Local22.350unit/80+8PG/4negative đạt; PR chờ exact-head CI/artifact; chưa floor/vector thật |
| S06a | Hủy TTS giữ đúng vé qua tải lỗi/callback Web Speech                          | S04 đã merge                          | [S06 đã duyệt](../specs/2026-10-16-stored-s06-voice-metrics.md)                                  | Chưa tạo | [#1410](https://github.com/seeker19110/dhcb/pull/1410) | DONE   | Main de4eba99; PR20check/22.000unit/1.450E2E, main CI/deploy/CodeQL/secret scan đạt         |
| S06b | Thu âm/confirm giữ đúng owner qua permission, route và phản hồi muộn         | S06a đã merge                         | [S06 đã duyệt](../specs/2026-10-16-stored-s06-voice-metrics.md)                                  | Chưa tạo | [#1412](https://github.com/seeker19110/dhcb/pull/1412) | DONE   | Mainba82335f;19context/22.152unit/1.460E2E, main CI/deploy/CodeQL/secret đạt                |
| S06  | Số đo voice, ngắt lời, reconnect và fallback                                 | Spec/cách đo trên thiết bị được duyệt | [S06 đã duyệt](../specs/2026-10-16-stored-s06-voice-metrics.md)                                  | Chưa tạo | Chưa tạo                                               | SPEC   | App STT→LLM→TTS; chưa đo acoustic                                                           |

## 4. Risk register

| Risk                                              | Trigger/guardrail          | Mitigation/rollback                                                                   | Owner           | State                |
| ------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------- | --------------- | -------------------- |
| Eval xanh giả                                     | Có ca sai nhưng exit 0     | Kiểm helper và CLI bằng negative control; giữ đầy đủ các nhóm ca                      | Agent           | Đã kiểm chứng cục bộ |
| Replay bị coi là chất lượng model mới             | Chỉ chạy fixture đã ghi    | Gắn loại bằng chứng, fingerprint request/config; live eval là việc riêng có ngân sách | Chủ dự án/agent | Mở                   |
| Trace làm lộ hội thoại hoặc tăng chi phí vận hành | Thêm payload/backend mới   | Chốt allowlist metadata, retention và tài nguyên trước triển khai                     | Chủ dự án       | Mở                   |
| Tự mở rộng sang nhiều slice chưa tích hợp         | S01 chưa được review/merge | Checkpoint một slice và chỉ chuẩn bị spec tiếp theo                                   | Agent           | Đang kiểm soát       |

Ghi nhận khảo sát cho S05 (chưa sửa trong S04b): SELECT rehydrate của
`memoryRetrieval.ts` chỉ kiểm person/id, nên có thể đọc lại record vừa expired/invalidated
sau lexical query. Probe source thật với SQL-aware interleaving cho thấy canary vào context;
sensitivity vẫn bị Context Engine chặn thêm. S05a cần lặp eligibility ở lần fetch cuối và
catch riêng lỗi embedding trước benchmark, giữ lỗi SQL được ném. Không hứa snapshot tuyến
tính sau thời điểm đọc cuối. Đây là bug hiện hữu, không phải thay thuật toán/threshold.

## 5. Current truth

- Commit main đã reconcile: `ba82335f825bee8e583fe351a57c52c82706ba77` (PR #1412), ngày 18/10.
  Main CI39088294166/deploy39088294176/CodeQL39088294171/secret scan39088294162 SUCCESS; đã đọc trạng thái mới ngày18/10.
- Worktree: `/home/liend/.codex/worktrees/stored-eval-gate/dhcb`; nhánh
  `codex/stored-memory-retrieval-benchmark`. Workspace gốc và file chưa track của người dùng giữ nguyên.
- Goal gap: S04 đã merge/deploy. S06a đã merge #1410 sau đủ20context đúngheadd7df2069;
  CI38992041149 đạt22.000unit/1.450E2E/5skip/0flaky và corpus1.874+8/cleanup0. Deploy
  38992765415, CodeQL38992765450, secret scan38992765470 trên main de4eba99 SUCCESS;
  main CI38992765453 SUCCESS. S06b đã merge/deploy #1412, đủ19context và bốn workflow main thành công. Baseline S05,
  instrumentation S06 và số đo vector/voice thật vẫn mở.
- Next best slice: baseline S05 với actual Postgres80observations/8contexts,4negative controls,
  full gate và exact-head CI; sau đó metrics S06. Không provider có phí/production data hoặc đổi
  transport/model/usage policy.
- CI S01: [run 38867265957](https://github.com/seeker19110/dhcb/actions/runs/38867265957),
  đủ quality/e2e/metadata. [Deploy 38868410893](https://github.com/seeker19110/dhcb/actions/runs/38868410893)
  thành công; chưa thực hiện live eval provider.
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
- S01 local commit `e0d0ca56`; [PR #1399](https://github.com/seeker19110/dhcb/pull/1399)
  đã mở, chờ quality/e2e/metadata. GitHub protection hiện không có required check trong
  `contexts`/`checks`; kiểm đủ ba check xanh thủ công trước merge, không tự đổi protection.

### Iteration 2 — 2026-10-16

- State: DONE; slice S02 trên nhánh `codex/stored-provider-replay`, PR #1400.
- Reload main 66db5e63; xác nhận spec S02–S06 Approved đã merge trong PR #1399 trước source.
- Thay đổi: cassette Zod v1 có nguồn synthetic/source commit/config, fingerprint request
  qua SDK thật, fake fetch từ chối mismatch và ledger bắt thiếu/thừa lời gọi kể cả khi SDK
  đổi lỗi thành network_error. Không có nhánh record hoặc fallback ra mạng.
- Bảy ca text/read tool/pending proposal/stream/JSON lỗi/timeout/stream đứt; prompt builder,
  SDK parser và vòng công cụ production. Executor giả không chứng minh authority DB hoặc
  chất lượng model thật; S04 giữ kiểm authority trên Postgres.
- Validation tập trung: CLI 7/7 exit 0; 3 file/47 test passed exit 0. Negative control cho
  fingerprint của ca chờ network_error, mất delta, tool cấm, committed và lời tự nhận đã lưu.
- Gate đầy đủ của chính lượt này trên Node22: build/typecheck/lint (0 cảnh báo)/format:check
  exit 0. `npm test -- --coverage --maxWorkers=2`: 952 file passed/5 skipped,
  21.482 test passed/35 skipped, exit 0 (380,34 giây). Coverage 96,15/92,03/96,88/96,85%,
  giữ sàn 94/90/94/94, không thêm skip. `check:specs -- --ci`: 191 spec, exit 0.
- Review độc lập kiểm lại ba lỗi candidate: header, false-save delta và parser lỗi trước
  transport cut đều đỏ đúng; baseline 7/7, số lời gọi mạng ngoài fake bằng 0.
- Không đổi runtime/UI/API/learner flow nên không chạy E2E cục bộ; CI E2E vẫn bắt buộc.
- PR #1400 đã mở READY. Protection vẫn rỗng required contexts/checks, nên giữ kiểm thủ công
  quality/e2e/metadata cùng mọi check trên đúng head trước squash merge, không bật auto-merge.
- Tài nguyên: dừng quét codemap gây swap thrashing; chưa sửa hotspot runtime trong S02.
  TSC toàn API ở heap 1536 MB hết heap; full typecheck/build ở 2304 MB đạt. Build đầu chưa
  xác nhận exit 0 dù log tới cuối; đã chạy lại đầy đủ và exit 0, không né cổng.
- DB disposable riêng đã chuẩn bị, 100 migration; baseline red-team 54/54 và permissions
  23/23 đạt trên Node22 không có key. Đã dừng container khi không dùng để nhường RAM cho gate.
- Khảo sát tiếp: calculator đang cộng cache write hai lần; sẽ sửa riêng S03a, không đổi giá,
  billing/quota hoặc backfill lịch sử. Wrapper HTTP production/dev đang gom body SSE;
  không được suy ra client delivery từ test trực tiếp generator. Cần tách rõ ở S04.
- Quyền: đã đủ trong phạm vi owner duyệt; không provider trả phí/dữ liệu production.

### Checkpoint tích hợp S02 — 2026-10-16

- CI [38874705601](https://github.com/seeker19110/dhcb/actions/runs/38874705601) và toàn bộ
  18 check trên head `f110a787` xanh; sáu mảnh E2E đạt, không review yêu cầu sửa.
- PR #1400 squash merge vào main `5e7bb30f` lúc 08:46:12 UTC. Deploy
  [38875905046](https://github.com/seeker19110/dhcb/actions/runs/38875905046) thành công.
- Reload/fetch main và xác nhận spec Approved đã merge trước source của các slice tiếp theo.

### Iteration 3 — 2026-10-16

- State: WAITING; slice S03a PR #1401 trên `codex/stored-cache-cost-fix`, base main `5e7bb30f`.
- Một outcome/PR: bỏ cache write khỏi phần prompt thường vì parser đã cộng ba nhóm rời nhau.
  Không đổi đơn giá, SQL, schema, quota/billing hoặc backfill. Rollback bằng revert; tối đa
  ba lần sửa cùng failure; provider cost 0, không production data/secrets.
- Write set: calculator và comment hợp đồng parser, hai test liên quan, goal/PROGRESS/changelog.
- Codemap đạt trước sửa: calculator impact 91, aiTokenUsage impact 87. Hai caller trực tiếp
  calculator là recorder token theo ngày và tracker; không đổi SDK hoặc loop.
- Test-first: 6 ca đỏ/24 xanh, exit 1 trước sửa; sau sửa 5 file/91 test xanh, exit 0.
  Oracle số học độc lập: theo registry hiện có, input thường 100 + đọc 200 + ghi 300 cho
  0,00099 USD thay vì 0,00159; không suy ra hóa đơn provider từ phép tính này.
- Postgres disposable xác minh tên DB local và scope UUID: 20 lời gọi thật đồng thời,
  một dòng daily, đúng tổng token và 0,0278 USD cho ca có thêm 40 output; cleanup còn 0 dòng.
  SQL upsert không đổi; không tuyên bố idempotency cho số lần gọi provider khác nhau.
- Typecheck strict tập trung giữ nguyên cấu hình API và bốn file thay đổi đạt, exit 0.
- Build cục bộ heap2304 và chẩn đoán API heap1792/semi4 phải dừng đúng compiler (exit143)
  do VM 3916 MB/swap1024 MB gần đầy, không có lỗi semantic đã được báo. Không chỉnh
  tsconfig/cổng/threshold, không xử lý tiến trình khác hoặc thay swap hệ thống.
  Lint/format/toàn bộ unit chạy cục bộ; build/typecheck toàn dự án và coverage xác minh
  trên CI đúng head trước merge. Lint (0 cảnh báo), format:check và `npm test -- --maxWorkers=2`
  cục bộ exit 0: 952 file passed/5 skipped, 21.491 test passed/35 skipped (391,93 giây).
  Lượt unit này không đo coverage; CI giữ nguyên coverage gate, không thêm skip.
- Registry vẫn là ước tính: tài liệu provider hiện dùng cache-read multiplier khác cho
  Sonnet/Opus 5.5; cập nhật giá là việc riêng, không trộn vào sửa phép tính cộng trùng.
- Khảo sát S05/S06: chưa có vector provider đã ghi; voice app hiện dùng STT→LLM→TTS,
  chưa có client Gemini Live/reconnect/VAD onset. Không được báo semantic quality hoặc
  acoustic p50/p95 từ vector/thời gian giả; giữ phần bằng chứng đó WAITING khi chưa đo.

### Checkpoint tích hợp S03a — 2026-10-16

- Head `b4d66287` đủ 19 check (gồm metadata cập nhật mô tả PR), không review yêu cầu sửa.
- CI [38879875738](https://github.com/seeker19110/dhcb/actions/runs/38879875738): build,
  typecheck/lint/format và sáu mảnh E2E đạt. Coverage unit 952 file/21.491 test passed,
  5 file/35 test skipped sẵn có, 430,18 giây; 96,15/92,03/96,88/96,85%, giữ nguyên sàn.
- PR #1401 squash merge main `f29d8237` lúc 09:35:26 UTC; deploy
  [38881500189](https://github.com/seeker19110/dhcb/actions/runs/38881500189) thành công.

### Iteration 4 — 2026-10-16

- State: WAITING (CI); slice S03 PR #1402 trên `codex/stored-turn-tracing`, main `f29d8237` đã reload.
- Spec S03 Approved đã merge ở #1399 trước source. Một outcome/PR: trace private các
  chặng/lần gọi của Companion, mặc định tắt, logger hiện hữu; không backend mới, không
  quota/billing/DB mutation hoặc provider trả phí. Tối đa ba lần sửa cùng failure.
- Contract trước code: Zod v1, ID do server tạo, allowlist chặng/trạng thái/model, thời
  gian monotonic, usage thiếu/partial/open không biến thành số 0 đã đo. Attempt sở hữu
  chi phí, span cha không cộng lại usage; tổng đầy đủ null nếu thiếu hoặc bị drop.
- Write set dự kiến: DTO/test `core-contracts/companionTrace`, ALS/sink/test `core-db/turnTrace`,
  observer/test `core-ai/modelTrace`, adapter Anthropic/tool-loop/Groq/Gemini, các chặng
  `companionRuntime` và test; PROGRESS/goal/changelog. Không đổi transport hoặc API công khai.
- Middleware SDK0.128.0 theo request quan sát mỗi HTTP retry mà không clone/đọc kép body;
  stream usage là counter tích lũy ghi đè. Closure giữ đúng call/attempt qua callback.
- ALS generator phải bind next/return/throw; consumer return hiện chưa hủy provider.
  Root terminal một lần, usage của call còn mở unknown; child có thể đóng muộn, không
  await producer/refund/ghi daily usage từ trace. Không tuyên bố client delivery/cancel.
- Sink bounded/deferred, không await; logger đồng bộ vẫn có thể block event loop, không
  tuyên bố cách ly cứng. Review payload/retention và overhead trước bật production.
- Validation dự kiến: fake clock/SDK/fetch/tool/sink, retry/fallback/stream-cut/cancel và
  interleave/canary; replay S02; typecheck strict tập trung/lint/format/unit cục bộ, full
  build/typecheck/coverage/E2E CI đúng head do giới hạn RAM đã ghi ở iteration 3.
- Codemap trước source: lệnh impact runtime ở heap1920 hết heap (134). Không giả freshness
  hoặc dựng graph thiếu; đối chiếu AST chứng minh toàn bộ import từ graph đầy đủ tại
  `f110a787` tới base `f29d8237` giữ nguyên (bốn TS chỉ đổi số học/test). Truy vấn impact
  từ graph đó: runtime16, Anthropic54, tool-loop26, Groq51, Gemini36, logger105. CI vẫn
  phải dựng lại graph mới và đạt cycles/architecture; không thay gate.
- Targeted 12 file/211 test đạt; strict theo tsconfig API cho 12 file source/test mới/sửa
  đạt exit0, heap1280. Oracle SDK 429→200 giữ nguyên hai fetch/body/header/result; stream
  counter cumulative và final snapshot chỉ tính một lần. Missing/partial/cache ngoài
  Anthropic/model chưa có giá giữ cost null; số 0 thật được giữ 0. Tool thực thi đúng một lần.
- Runtime bật/tắt giữ response/pending proposal/history/daily usage; canary không vào DTO.
  Consumer return sau delta đóng root unknown trước child muộn; không tuyên bố provider
  bị hủy. Collector throw/reject/hang, bounded queue và lỗi clock/ID không sửa outcome.
- Review độc lập tìm một P2: text trắng Groq/Gemini bị logical-call success dù runtime
  fallback. Đã sửa predicate quan sát, giữ nguyên return/HTTP usage; proof và regression
  test đều đạt, re-review không còn finding. Review không sửa file hoặc gọi provider thật.
- Overhead cục bộ Node22, 4.000 lượt mỗi chế độ, bảy span/lượt, không HTTP/DB/logger I/O:
  off p50/p95 0,0051/0,0083 ms; on 0,0442/0,1478 ms; export đủ 28.700/28.700 gồm warmup.
  Chỉ microbenchmark instrumentation trong VM, không phải latency dịch vụ/acoustic hoặc
  ngưỡng production đã duyệt. Mặc định tắt; payload/retention/ngưỡng còn cần review trước bật.

- Full local lint (0 cảnh báo), format:check và `npm test -- --maxWorkers=2` exit0:
  956 file passed/5 skipped, 21.536 test passed/35 skipped, 390,87 giây. Không thêm skip;
  lượt cục bộ không đo coverage. Replay CLI7/7 và check:specs191 đạt. Nhóm45 test trace
  lặp lại đạt sau sửa cleanup collector deferred; không lọc event để che lẫn trace.
  Build/typecheck toàn dự án, coverage và E2E giữ nguyên gate CI trên chính head trước merge.

- [PR #1402](https://github.com/seeker19110/dhcb/pull/1402) đã mở READY; chờ đầy đủ
  quality/e2e/metadata và mọi check của chính head. Không auto-merge vì protection không
  khai báo required contexts/checks. Chỉ squash merge theo exact head sau review gate.

### Checkpoint tích hợp S03 — 2026-10-16

- PR #1402 head `bde4511a` đủ 19 check sau cập nhật metadata; không review/comment yêu cầu sửa.
- CI [38885706695](https://github.com/seeker19110/dhcb/actions/runs/38885706695): full
  build/typecheck/lint/format, SQL/import/CodeQL và sáu shard E2E đạt. 956 file/21.536 test
  passed, 5 file/35 test skipped sẵn có, 417,03 giây. Coverage 96,12/92,02/96,89/96,83%,
  giữ sàn 94/90/94/94. Không provider trả phí hoặc production data.
- Squash merge main `9378c604` lúc 10:24:52 UTC. Deploy
  [38887070933](https://github.com/seeker19110/dhcb/actions/runs/38887070933) thành công.
- Đã fetch/reload main và xác nhận spec S04 Approved trong #1399 trước source S04a.

### Iteration 5 — 2026-10-16

- State: WAITING (CI/local coverage); S04a PR #1403 trên `codex/stored-sse-transport`, base main `9378c604`.
- Một outcome/PR: sửa Web Response → Node response đang gom cả SSE ở production/dev.
  S04 chưa DONE cho tới guard/corpus tiếp theo. Không đổi runtime/handler/provider,
  auth/cookie policy, cancel/refund/usage hoặc dữ liệu. Tối đa ba repair cùng failure.
- Contract: SSE chuyển nguyên bytes/flush, await drain khi connected; khi socket đóng thì
  dừng write và drain/discard tới EOF/deadline hiện hữu, không cancel Web reader làm
  producer enqueue lỗi rồi refund. Nhánh non-SSE giữ cách gửi cũ. Header bridge dùng
  getSetCookie()→array, giữ cookie có Expires dấu phẩy, không split hoặc đổi thuộc tính.
- Write set: helper Node response/test core-http; routes + test HTTP/handler; helper
  middleware dev/test scripts/lib và Vite config; E2E browser qua HTTP thật; docs.
  Không sửa source UI, schema, dependency, migration hoặc lockfile.
- Impact trước source: CLI full codemap đã hết heap như iteration4. Phân tích AST read-only
  theo cùng resolver, chứng minh baseline đủ 8.170/8.170 cạnh/file parity với full cache,
  rồi quét current 2.767 file/8.197 cạnh import, cycles0; không giả call graph/freshness
  hoặc ghi đè cache. routes impact3, Companion handler5. Vite config ngoài scan roots:
  rà import/caller bằng rg và module tests. Full codemap/architecture gate CI không đổi.
- Validation: HTTP loopback/barrier qua adapter thật, negative control .text() phải bị
  bắt; Unicode/cookies/security/status/JSON/compression/backpressure/error/close. Handler
  thật + fakes tại auth/DB/provider/quota để đối chiếu side effects, Vite parity và browser
  HTTP delivery. Không route.fulfill làm bằng chứng transport, không paid/live provider.
  Local targeted/lint/format/unit và E2E browser; full gate CI exact head. RAM hiện tại
  đã tăng khả dụng nên chạy lại codemap/build/typecheck toàn dự án cục bộ.
- Backpressure chỉ Web body→Node socket, chưa có propagation tới producer trong start().
  Chưa chứng minh Nginx/Cloudflare/client disconnect abort upstream. Rollback revert.

- Test-first hai ca HTTP đỏ trước source: prefix không tới trước barrier và cookie đầu
  bị overwrite. Sau sửa: wrapper/CSRF/CSP 11 test xanh; nhóm helper/dev/wrapper/handler
  hiện tại 7 file/55 test đạt, thêm hai test dev resolve/body-error cũng đạt. Chưa dùng
  các kết quả này thay full gate. SDK cache fake key của case trước đã được sửa ở fixture,
  giữ nguyên oracle trước EOF/số side effects; không sửa production để né test.
- HTTP route đăng ký thật + runtime/SDK thật với fakes auth/DB/provider/usage: connected
  và disconnect giữ một consume/token usage, hai history, không refund thêm; fallback
  không gọi provider và refund đúng một lần theo ngày consume. Không coi mock DB là
  bằng chứng authority; corpus/real PG ở slice S04 tiếp theo.
- Review độc lập helper: gzip thật 2 MiB/32 drain, đúng emitter zlib và cleanup;
  disconnect 0 cancel, nhả reader; lỗi dev sau headers đóng socket, không thêm JSON.
  File changed của reviewer: none. Regression gzip/close/error có test trong repo.
- Điều kiện máy đã đổi: `free` hiện báo RAM 9.946 MiB/swap4.096 MiB (agent không đổi cấu
  hình host). Full `npm run codemap -- impact apps/server/src/routes.ts` heap4096 đã đạt,
  impact5. Không còn phải dựa vào fallback import-only cho lần kiểm cuối này.
- E2E local: lệnh đầu sai quoting PATH có khoảng trắng; lệnh tiếp chưa chạy
  test do Chromium thiếu libnspr4/nss/asound. Đã tải ba gói Ubuntu vào thư mục test riêng,
  giải nén/LD_LIBRARY_PATH, không cài hệ thống hoặc đổi repo; browser transport 4/4 đạt.
- Mở rộng write set kiểm thử: Playwright config + tsconfig.e2e kế thừa alias source từ
  tsconfig.base. Fixture server thật nhập workspace từng module trước đây rơi vào exports
  dist chưa build; chỉ định một config source cho toàn bộ file nhập để CI E2E sạch không
  cần artifacts của build job khác. Không đổi strict/threshold/retry/skip hoặc UI flow;
  full E2E/quality vẫn bắt buộc. Lỗi này thuộc tầng cấu hình kiểm thử, không phải stream.
- Review integration phát hiện oracle disconnect mở provider barrier trước server close
  (proof 3/3). Đây là lỗi tầng cổng: đã đợi latch close phía server khi provider còn held,
  rồi đợi helper thật hoàn tất trước đối chiếu side effects. Rerun 3/3 đạt, re-review sạch;
  cleanup browser đóng HTTP trước đợi reader. Không đổi production để né failure.
- Build/typecheck/lint local toàn dự án đã đạt. Coverage và full browser suite đang chạy;
  kết quả cuối và CI exact head sẽ cập nhật trước merge.
- Format toàn dự án đạt. Full E2E local đã dừng bằng SIGINT/exit130 sau 61 ca đạt khi chạy cùng coverage
  làm máy bắt đầu dùng swap; không báo suite này xanh. Transport browser riêng vẫn 4/4.
  Full E2E sáu shard trên CI exact head là cổng bắt buộc trước merge.
- Coverage local báo test sẵn có `projectStepsT2` P4/s6 quá 5.000ms; chạy riêng khi coverage
  còn hoạt động cũng timeout (6.269ms). Chưa thay source/test/timeout hoặc suy thành lỗi
  transport; sẽ đối chiếu khi máy không còn heavy gate và CI trên đúng head.
- Replay provider 7/7 và check:specs 191 đạt trên diff này. Source/review đã hoàn tất;
  PR dùng CI exact head làm cổng tích hợp đầy đủ, không auto-merge khi gate còn pending.
- Checkpoint sau gián đoạn: local coverage đã dừng, chưa có tổng kết toàn bộ; không báo
  pass. Test P4/s6 chạy riêng lúc máy rảnh đạt, không thay timeout 5.000ms. CI
  [38902270938](https://github.com/seeker19110/dhcb/actions/runs/38902270938) head `1367c225`
  đạt 18 check, đủ sáu shard E2E; 960 file/21.557 test pass, 35 skip sẵn có,
  423,30s, coverage 96,13/92,02/96,89/96,84%, giữ sàn 94/90/94/94.
- Chưa merge vì CodeQL review chỉ ra `js/stack-trace-exposure` medium ở helper dev:
  lỗi loader có thể trả path/chi tiết nội bộ qua Error.message (hành vi cũ vừa tách file).
  Test HTTP canary tái hiện hai ca đỏ trước sửa; đổi lỗi dev trước headers thành 500
  chung, không log payload, sau headers vẫn destroy. Sau sửa 5/5 xanh, codemap impact1.
  Đây là sửa lỗi trong scope response bridge; cần full CI lại trên head mới.
- Bản sửa review qua 7 file/258 test liên quan và lint hai file; re-review không finding,
  không log/lưu payload lỗi. Đang push lại PR #1403 để full gate kiểm đúng head mới.

### Checkpoint tích hợp S04a — 2026-10-16

- PR #1403 squash merge lúc 14:48:32 UTC, main `84b16bec` sau kiểm thủ công đủ 19 check
  trên head `5e71aba4`; metadata mới sau cập nhật mô tả cũng xanh. Main trước merge vẫn
  `9378c604`, không bypass/auto-merge. CodeQL alert84 đã fixed, re-review sạch.
- CI [38917061097](https://github.com/seeker19110/dhcb/actions/runs/38917061097): 960 file,
  21.558 test pass/35 skip sẵn có, 423,64s; coverage 96,13/92,02/96,89/96,84%, giữ sàn.
  E2E sáu shard 1.436 pass/5 skip sẵn có, không flaky trong summary; browser transport4/4.
- Deploy [38918772196](https://github.com/seeker19110/dhcb/actions/runs/38918772196) và CI
  main38918772157 đều hoàn tất success trên `84b16bec`, đã đọc kết quả workflow.
- Đã fetch/reload main `84b16bec`, đọc AGENTS/PROJECT/PROGRESS/goal/spec hiện hành trước S04b.

### Iteration 6 — 2026-10-16

- State: CI; S04b PR #1404 trên `codex/stored-stream-surface-guard`, base main `84b16bec`.
- Spec S04 Approved đã merge #1399. Một outcome/PR: cùng policy loại markup/UUID cho
  delta và final visible text, giữ stream thật. Corpus/authority PG là S04c kế tiếp.
- Write set: helper surface/test mới core-personal; finalAnswerChecks/test;
  companionRuntime/test; interactiveQuestion contract/test; HTTP integration và browser
  transport test; goal/PROGRESS/changelog. Không dependency, migration hoặc lockfile.
- Contract: chỉ lọc lời văn, không quét DTO actions/questions/context. Giữ template markup
  và ASCII word-boundary UUID hiện hữu; xét lại composition sau xóa, không để nội dung
  vừa ghép lọt qua. Unresolved state tối đa256 ký tự/16 frame, không phải giới hạn chunk;
  overflow bỏ pending và phần còn lại của lượt, không flush raw. Tag đã nhận chắc thì
  discard attributes tới > mà không giữ cả tag. Finish EOF khác abort do lỗi/fallback.
- Fence dùng grammar chung với parser: đầu dòng, spaces/tabs, LF/CRLF, đúng tên. Inline,
  Extra/json/python giữ nguyên. Theo prompt khối ở cuối: visible text dừng tại header
  reserved đầu tiên tới EOF (khớp stream hiện hữu), kể cả nhiều block; metadata giữ bộ
  đầu nếu hợp lệ. Không lọc ID/cấu trúc trong bộ questions hoặc proposed actions.
- Partial chưa thành tên/UUID có thể literal ở EOF bình thường; abort bỏ pending. Primary
  thất bại thì không nối state dang dở vào fallback. False-save/language checks vẫn ở
  finalize. Prefix benign phải tới HTTP/browser trước provider EOF.
- Validation: test-first các proof composition, fence whitespace/Extra/inline/multiple;
  every cut point, char chunks, every prefix, EOF/error/fallback, literal benign VN/EN,
  code/math, negative controls, resource bound và idempotence/partition invariance.
  Giữ HTTP barrier, replay7, specs, full build/type/lint/format/unit coverage và E2E.
- Test provider=0 phí, không production. Max3 repair cùng failure, ghi tầng trước lần2.
  Rollback revert. Guard bounded không làm SDK/AsyncQueue/upstream thành O(1).
- Test-first đã tái hiện 8 lỗi/91 ca xanh trước source: composition markup/UUID, grammar
  fence inline/Extra/whitespace và JSON khối thứ hai. Sau wire shared guard: 5 file/143
  test xanh; thêm fixture EOF `<invoke`/`<parameter` để khóa delimiter hiện hữu.
- Review helper độc lập không finding: 25 ca/904 partition và 6.000 input tổ hợp,
  mọi accumulation đã emit, idempotence, EOF/abort và bound; không ghi file repo.
  Cổng trong repo có mọi cut point/char chunks, canary oracle độc lập và retained-state
  assertion, attrs1MiB/benign chunk lớn, nesting/frame/header overflow và abort/fallback.
- Chỉ lời văn delta/final đi qua guard. HTTP registered route/runtime/SDK kiểm structured
  question/option UUID và context personId vẫn giữ nguyên; một consume/token usage,
  hai history, không thêm refund. Provider/auth/DB ở boundary đều là fakes, không suy
  authority DB. False-save/language policy vẫn finalize; không claim lọc nội dung tự do.
- Review wiring tìm một P2 tầng oracle browser: checkpoint có thể tới trước EOF dù guard
  đệm hết lời văn. Đã assert visible prefix ngay tại checkpoint, thêm đối chứng cố tình
  đệm chữ tới end() đòi đúng lỗi prefix_missing trước release. Re-review đóng finding;
  browser 8/8 đạt (hai đối chứng đệm chữ bị oracle từ chối đúng). Không nới gate.
- Full local Node22 đã đạt: typecheck từ checkout sạch dist; build/lint (0 cảnh báo)/
  format:check exit0. `npm test -- --coverage --maxWorkers=2` exit0: 961 file,
  21.614 test pass/35 skip sẵn có, 477,90s; coverage96,13/92,04/96,91/96,84%,
  giữ sàn94/90/94/94. Guard46/46; replay7/7, check:specs191 đạt.
- Typecheck cuối sau sửa oracle E2E, từ checkout đã xóa dist, exit0. Source commit
  `ba6802ba`, PR [#1404](https://github.com/seeker19110/dhcb/pull/1404) READY; ghi đúng PR
  trong tài liệu rồi push head cuối. CI toàn bộ/sáu shard E2E vẫn bắt buộc trước merge,
  không auto-merge trên protection rỗng. Sau tích hợp ưu tiên S05a vá retrieval guard
  đã tái hiện, rồi trở lại corpus S04; không chờ benchmark để vá bug P1 hiện hữu.

### Checkpoint tích hợp S04b — 2026-10-16

- PR #1404 squash merge lúc15:37:43 UTC, main `80328ab7`. Exact head `c3f5fd1e`,
  đủ19 check sau metadata mới38925351809 (mô tả cập nhật15:36:42); base vẫn84b16bec,
  không auto-merge/bypass, không review yêu cầu sửa, CodeQL không alert mở.
- CI [38923571453](https://github.com/seeker19110/dhcb/actions/runs/38923571453):
  961 file/21.614 test pass, 5 file/35 test skip sẵn có,375,18s; coverage
  96,13/92,04/96,91/96,84%, giữ sàn. Sáu shard E2E mỗi shard240 pass, tổng1.440
  pass/5 skip sẵn có, không flaky trong summary. PG red-team54/54 và permissions23/23.
- Deploy [38925484811](https://github.com/seeker19110/dhcb/actions/runs/38925484811) đã success
  trên80328ab7; mainCI [38925484953](https://github.com/seeker19110/dhcb/actions/runs/38925484953) cũng success.
- Đã fetch/reload main, đọc AGENTS/CLAUDE/PROGRESS/goal/spec trước slice tiếp theo.

### Iteration 7 — 2026-10-16

- State: CI_WAIT; S05a trên `codex/stored-retrieval-guards`, base main80328ab7.
- Spec S05 Approved đã merge #1399. Ưu tiên bug P1 trước corpus/benchmark mới: lexical
  hoặc semantic query lấy ID live, record đổi trước base, missing fetch chỉ lọc person/id
  nên expired/invalidated lọt lại vào context. Sensitivity có filter sau ở Context Engine,
  nhưng search vẫn trả quá ngưỡng. Không hứa revoke tuyệt đối sau lần đọc đã hoàn tất.
- Một outcome: retrieval giữ eligibility/fallback contract hiện có. Write set:
  memoryRetrieval.ts/test và tài liệu goal/PROGRESS/TRAPS/changelog0640. Không đổi ranking,
  limit/budget/consent, provider, giá, migration, dependencies hoặc lockfile.
- Contract: missing SELECT phải kiểm cùng status/valid_to/sensitivity như các candidate
  SELECT. Provider reject coi như không có vector; catch chỉ await embedQuery, giữ lỗi
  SQL lexical/semantic/base/hydration được ném. Không thêm log raw/query/exception.
- Acceptance: test-first stale lexical/semantic ID với expired/invalidated/sensitive,
  positive missing live ngoài base vẫn tải được, không touch record bị loại;
  null/default/explicit provider reject giữ lexical/base; bốn lỗi DB không bị catch nhầm.
  Kiểm SQL/interleaving trên Postgres disposable khi có thể; cleanup own UUID, giữ baseline
  4 memory audit. Full gate/replay/specs/CI/E2E, rollback revert, tối đa3 repair cùng lỗi.
- Reviewer probe ngoài repo chỉ dùng source thật+fakes SQL-aware; chưa thay bằng chứng
  PG/MVCC. Parent sẽ chạy lại path thật của slice. Không provider có phí/production.
- Nhãn S05 draft26records/40queries (20vi/20en,33positive/7no_relevant) đã review trước
  ranking, hashb8cf4cfb…59dd68a, provenance agent_synthetic_review, không human golden.
  Corpus nhỏ nên chưa đặt floor, không tune sau xem baseline; timestamp fixture cần chốt
  trung thực qua service trước dùng. Chưa chạy benchmark/vector provider, semantic NOT_MEASURED.

- Test-first: 8 ca đỏ/19 ca xanh trước sửa, sau sửa và thêm foreign-ID controls 29/29 retrieval đạt; toàn bộ targeted
  memory/context/reflection/runtime 5 file/201 test đạt. Fake hydration chỉ diễn giải
  predicate SQL thật; positive live ngoài base và bốn lỗi SQL đều giữ contract.
- Postgres16 disposable `dhcb_stored_test`: service thật gieo 20 nền + target ngoài LIMIT,
  lexical lấy ID trước barrier; expire/invalidate/merge nâng sensitivity qua service trên
  kết nối khác trước base/hydration. Cả ba target bị loại; live control vẫn trả, không
  trả người khác. Kiểm version/status/valid_to/sensitivity/access_count thật. `touch:false`
  ở proof PG, test unit riêng kiểm không gọi touch khi target bị loại.
- Negative control dùng source main cũ, chỉ transpile ngoài repo: cùng PG oracle đỏ đúng
  vì expired được trả lại. Bản sửa exit0 bốn case, own-UUID cleanup0, giữ nguyên 4 audit
  baseline cả lượt âm/dương. Không gọi provider/production. Đây là fresh SELECT guard,
  không bảo đảm revoke sau snapshot đã đọc. Script/evidence ngoài repo trong
  `/home/liend/.codex/validation/stored-retrieval-guards/`; test hồi quy nằm trong repo.
- Rà soát S03 phát hiện P2: embedding HTTP chưa tạo trace attempt, nên tổng có thể known
  dù thiếu call. Probe actual context/retrieval/embedding+trace với fake fetch xác nhận;
  sửa ở slice riêng theo S03 Approved, giữ cost/token unknown, không sửa daily accounting
  hoặc giá. S03 coverage chưa được coi là hoàn tất trước sửa bổ sung này.

- Full local Node22: build/typecheck/lint0 cảnh báo/format:check exit0.
  `npm test -- --coverage --maxWorkers=2`: 961 file/21.630 test pass, 5 file/35 test skip
  sẵn có,373,43s; coverage96,13/92,05/96,91/96,84%, giữ sàn94/90/94/94.
  Replay7/7, check:specs191 đạt. Browser transport8/8 đạt, gồm hai buffering controls.
  Typecheck cuối sau xóa dist exit0 (69,01s); CI exact head vẫn bắt buộc trước merge.
- Chuẩn bị phần sau, chưa source/DB/ranking: corpus plan S04 có wrapper one-pass composition
  tái hiện bằng hàm thật; context là nonce-known robustness, không model compromise proof.
  Giữ matcher riêng context/tool và chốt bound/fail-closed trước source, không dùng visible
  UUID/fence guard cho dữ liệu input prompt. Đây là scope S04 sau S05a/S03b.
- Parent review chốt S05 timePolicy `service_clock_snapshot`: service timestamp thật,
  chụp một clock Postgres sau seed, giữ now/touch:false trên cùng read-only snapshot giữa
  các mode. Revision metadata trước ranking, không đổi nhãn/query/exclusions frozen;
  33 positive (17vi/16en),7 no_relevant riêng; missing/error/hard violation→INVALID/null.
  Context probes dùng cohort riêng vì mặc định touch, không để transaction read-only lỗi
  rồi coi context rỗng là chặn đúng. Chưa baseline/ranking hoặc floor/vector thật.

- Source commit `6fa0e9af`, [PR #1405](https://github.com/seeker19110/dhcb/pull/1405) READY.
  Tài liệu đã ghi đúng số PR; chờ quality/e2e/metadata và mọi check trên head cuối,
  kiểm lại base/review/CodeQL trước merge thủ công. Không auto-merge/bypass.

### Checkpoint tích hợp S05a — 2026-10-16

- PR #1405 squash merge16:15:57 UTC, main85f27d9a. Exact head96e7874d, đủ19 check
  sau metadata38930488453 (created16:15:21, body updated16:15:18); base80328ab7 giữ nguyên,
  không auto-merge/bypass, không CHANGES_REQUESTED, CodeQL open alerts0.
- CI38928589555 trên đúng head: 961 file/21.630 test pass, 5 file/35 test skip sẵn có,
  441,58s; coverage96,13/92,05/96,91/96,84%, giữ sàn. E2E1.440 pass/5 skip sẵn có,
  mỗi shard240 pass, không flaky trong summary; PG red-team54/54, permissions23/23.
- SQL job attempt1 bị ECR Data limit exceeded trước checkout. Rerun failed jobs cùng head
  attempt2 đã success, không đổi source/image/workflow/gate; các job thành công cùng commit
  được giữ. Ledger/log trong validation/stored-retrieval-guards; không coi là lỗi source.
- Deploy [38930579550](https://github.com/seeker19110/dhcb/actions/runs/38930579550) success
  trên85f27d9a; mainCI38930579373 cũng success trên85f27d9a. Đã fetch/reload main, đọc
  AGENTS/CLAUDE/PROGRESS/goal/spec trước chọn S03b.

### Iteration 8 — 2026-10-16

- State: VERIFY; S03b trên `codex/stored-embedding-trace`, base main85f27d9a.
- S03 Approved đã merge #1399, AC5 yêu cầu thiếu usage không thành 0 đã đo. Audit hẹp55
  source cho thấy chỉ query embedding thiếu attempt trong call graph Companion hiện tại;
  STT/TTS/Live/reflection/confirmation ngoài root này, không mở scope sang chúng.
- Outcome: đăng ký một logical call/một attempt cho mỗi batch HTTP embedding thực; empty
  batch/no-provider không có attempt giả. Giữ model unknown theo enum cũ, usage thiếu null,
  observed chat cost giữ nguyên, mixed total null. Không cộng token estimated daily thành
  measured usage hoặc thêm model/giá. Partial batch logical error nếu không every vector
  dùng được; HTTP200/JSON đọc được vẫn HTTP success, return partial giữ như trước.
- Write set: embeddings.ts, embeddingsTrace.test.ts, goal/PROGRESS/TRAPS/changelog0641.
  Không sửa SQL accounting, pricing, quota/billing, registry/schema, runtime authority,
  consent hoặc dependencies. Timeout/retry/prefix/body/vector/null/fallback giữ nguyên.
- Acceptance: actual-checkout red trước patch; on/off request/vector/daily parity, JSON
  một lần, unknown/mixed total, HTTP/network/JSON/vector/timeout, batch/empty/no-provider,
  sink throw/reject, canary/clock hợp lệ và actual Context Engine→search→embedding dưới
  trace root với HTTP/PG/context phụ giả. Network/SQL violation ledger độc lập catch.
- Prototype ngoài repo đã review: current15 đỏ/2 xanh, RAM patch17/17, mutant every→some
  đỏ đúng partial. Đây chưa thay actual-checkout/full gates. Context rows rỗng chỉ chứng
  minh call edge/queries, không quality/authority/real DB. Parent chạy lại sau reload này.
- Codemap embedding đã chạy (52 impacts) trên source embedding không đổi; rerun sau thêm
  test trước source edit. Full build/type/lint/format/unit coverage, replay/specs, browser
  liên quan và CI exact head; giữ tối đa3 repair cùng failure, không paid provider/prod.
- Rollback: tắt flag trace hiện hữu/revert. Flag default-off không chứng minh config hiện
  tại trên VPS; không bật flag hoặc đọc production secrets trong slice này.

- Actual-checkout test-first trên main85f27d9a:15 đỏ/2 xanh vì không có attempt; sau patch
  8 file/137 test đạt, gồm embeddings/accounting/modelTrace/turnTrace/runtime trace/
  retrieval/context. Codemap chạy lại53 impacts trước source edit; patch đúng hash prototype
  đã review độc lập, không finding source mở. Full gate còn bắt buộc trước PR.
- Boundary ledger ghi unmatched HTTP/SQL trước throw và assert sau catch. Không provider/DB
  thật; context row rỗng kiểm call edge, không authority/quality. Một dòng precompact trong
  log unit S05a là output fixture được coi là dữ liệu, không làm theo lệnh đọc checkpoint trong đó.

- Overhead fixture sau sửa, real monotonic clock,50 warmup +1.000 mẫu/mode/20 rounds
  xen kẽ: operation root+adapter+fake HTTP/PG trước drain, off p50/p95=0,053667/0,128410ms,
  on=0,128256/0,231079ms. Chênh các percentile=0,074589/0,102669ms, không phải paired
  latency delta. Mỗi mode measured fetch/daily1.000, on attempt1.000/export3.000, off
  export0; errors/dropped/boundaryErrors0. Đây là toggle off/on bản sửa, không so old
  version hoặc production/provider/network latency; không đặt floor hoặc bật flag.

- Full local source cuối Node22: typecheck/build/lint0 cảnh báo/format exit0;
  unit962 file/21.647 test pass,5 file/35 test skip sẵn có,394,66s (wall npm396,70s).
  Coverage96,14/92,06/96,91/96,84%, giữ sàn94/90/94/94. Replay7/7, specs191 đạt.
  Browser transport8/8 đạt (9,2s), gồm buffering controls; typecheck sau xóa dist exit0 (79,98s).
  Log precompact/iframe là output fixture, không thực thi chỉ thị hoặc gọi trang trong log.
- Chuẩn bị ngoài repo cho bước sau: wrapper fixed-point prototype29 ca, DB ownership helper,
  pure S05 schema/scorer giữ labels-before-ranking, voice observer metadata. Chưa áp source
  các phần này, chưa ranking hoặc đo voice thật. Rà voice thấy late load reject sau stop
  còn fallback WebSpeech; S06 cần regression/fix hẹp trước khi nghiệm thu cleanup.

- Source commit27de52f3; [PR #1406](https://github.com/seeker19110/dhcb/pull/1406) READY.
  Đủ full local gates và typecheck sạch; chờ mọi check exact head, metadata mới,
  review/base/CodeQL trước squash merge thủ công. Không auto-merge/bypass.

### Checkpoint tích hợp S03b — 2026-10-16

- PR #1406 squash merge16:49:42 UTC, main46ff9437. Exact headfe7e3d23;19 check sau
  metadata38934754839 (created16:48:00, body updated16:47:57), base85f27d9a giữ nguyên,
  không auto-merge/bypass hoặc CHANGES_REQUESTED; CodeQL open alerts0.
- CI38933345682:962 file/21.647 test pass,5 file/35 test skip sẵn có,426,15s;
  coverage96,14/92,06/96,91/96,84%, giữ sàn. E2E1.440 pass/5 skip,240 mỗi shard,
  không flaky trong summaries; PG red-team54/54, permissions23/23. Deploy38934972647 success trên46ff9437;
  mainCI38934972598 success đã kiểm riêng.
- Đã fetch/reloadmain46ff9437, đọc AGENTS/CLAUDE/PROJECT/PROGRESS/goal/spec và delivery loop.
  Không thay model, giá, daily accounting hoặc trace flag; corpus/benchmark/voice còn mở.

### Iteration 9 — 2026-10-16

- State: VERIFY; S04c trên codex/stored-data-wrapper, base main46ff9437.
- Scope một outcome: companionDataTags helper, companionPrompt/companionTools, public
  regression test, goal/PROGRESS/TRAPS/changelog0642. S04 Approved merge #1399 trước source.
- Contract: caller giữ matcher riêng context active nonce và tool DATA_TAG; replace tới
  fixed point, tối đa32 deletion passes + một stable check. Không ổn định→context content
  rỗng giữ wrapper; tool literalJSONnull. Không đổi UUID/fence/HTML policy, DB/authority,
  consent, usage/model/quota hoặc serialization/truncation behavior bình thường.
- Actual checkout test-first19 đỏ/10 xanh,29 ca đã chạy, đều AssertionError behavior;
  không missing module. Proto ngoài repo29 xanh và regex-cost probe không thay actual gates.
  Codemap trước production edit: prompt26 impacts/tools28; parent rà danh sách tới runtime/
  API/HTTP/CSRF/SSE. Sau patch targeted7 file/198 test đạt (9,81s),29 public-wrapper
  regressions xanh; source không đổi matcher/authority.
- Full local Node22: typecheck/build/lint0 cảnh báo/format exit0; unit963 file/21.676 pass,
  5 file/35 test skip sẵn có,362,49s (wall npm364,31s), coverage96,13/92,05/96,91/96,83%,
  giữ sàn94/90/94/94. Replay7/7 và specs191 đạt; browser transport8/8 (9,3s).
  Typecheck checkout sạch sau xóa generated dist exit0 (83,04s); CI exact head còn bắt buộc.
- Acceptance: composed open/close/mixedcase, nonce scope riêng, benign Unicode/code/math,
  no object mutation, idempotence, depths1/2/31/32, overflow33 failclosed, tool cap hiện hữu.
  Full gate/replay/specs/browser và CI exact head bắt buộc; tối đa3 repair cùng failure.
- Giới hạn: nonce-known robustness, không blind model-compromise proof. Cap32 chỉ bound số
  pass, không input length/CPU/memory O(1). Regex overlap tool hiện hữu giữ nguyên; probe
  8Khex/no-close~26–27ms là fixture đơn, không production DoS hoặc p95 claim.
- Rollback revert, không migration/dependency/provider có phí hoặc production data/secrets.

- Source commit812e5bac; [PR #1407](https://github.com/seeker19110/dhcb/pull/1407) READY.
  Đủ local gates/typecheck sạch; chờ mọi check exact head và metadata mới, review/base/CodeQL.
  Commit hook đầu lỗi do PATH chọn npm Windows; đã export Node22 cho toàn lệnh,
  hook eslint/format chạy lại đạt, không bypass. Không phải failure sản phẩm.

### Checkpoint tích hợp S04c — 2026-10-17 giờ Việt Nam

- PR #1407 squash merge23:11:01 UTC16/10 (06:11:01 ngày17/10), maina47a5c14.
  Exacthead5a3303e5;19 check sau metadata38979974551 (created23:10:25, bodyupdated23:10:22),
  base46ff9437 không đổi, không auto-merge/bypass/CHANGES_REQUESTED.
- CI38978835698:963 file/21.676 test pass,35 skip,324,92s; coverage96,14/92,06/96,91/96,84%.
  E2E1.440 pass/5 skip,240 mỗi6shard, không flaky trong summaries; PG54/54 +23/23.
  Deploy38980034013 success trêna47a5c14. MainCI38980034023 attempt2 success: attempt1
  ECR Data limit exceeded trước checkout/SQL; rerun failed giữ source/image/workflow/gates.
- Đính chính phạm vi CodeQL: các dòng “open alerts0” ở checkpoint trước là ref PR/merge,
  không toàn repo. PR1407 analyses1970910842/1970899132 trên mergecommitd33efdb7 có0results,
  error rỗng,103JS/23Actions rules. Main46ff9437 có82 cảnh báo nền tạo12/10; không vị trí
  nào ở3file source sửaS04c. Không dismiss/suppress hoặc tuyên bố đã sửa backlog đó.

### Iteration 10 — 2026-10-17

- State: WAITING CI; S04 corpus trên codex/stored-boundary-corpus, base maina47a5c14.
  Reload main/AGENTS/CLAUDE/PROGRESS/PROJECT/goal/spec/deliveryloop trước integration.
- Một outcome: runner eval offline với corpusversioned/schema/oracles, fixture ownership/
  durablejournal/cleanup, actualcontext/tools/confirm/cookieauthHTTP và runtimeconsent.
  CLI/npmscript/CIjobsql-prepare, unit/runbook/changelog0643; không source sản phẩm,
  migration/dependency/pricing/quota/permissions/model mới. ApprovedS04 merge #1399.
- Corpusfrozen agent_synthetic_review, SHA2edad10ecf150b2af5ba81924dcadb7dcf582b3b06df45d0a2560651d62430db:
  47CLIrecipes/1.874variants,6kind.1.692pure +182PG (context51/tool97/confirm17/HTTP15/note2).
  Mỗiattack trỏ positivecontrol; absence kiểm sourceID/type lẫn canary, không queryecho.
  S09/S10 external runtime/browser vẫn riêng, không cộng thành CLIpassed.
- Parser validate giữrawJSON ownkeys/cyclefail, không sanitize fixture trước executor.
  Positivecontext thiếuprimarycanary bịreject. Pendingproposal bind capability/payload/
  owner/action/domain/risk/version/status; allowedfacts/memory kiểm row/source/privacy/audit,
  clockactual không fake; denies so toàn bảngperson_id owncohorts. Không claim user_id/global
  tables đều bất biến từ personsnapshot; accounting global có snapshotriêng.
- Layerharness đã sửa có counterexample: F1sourceID mấtcanary, F2emptypositive,
  wrongpayload/privacy/offeredextra, nestedproto snapshot, cycleJSON; partial/scorercrash
  không thành pass. DBpreflight catalog _schema_migrations và sessions được kiểm thực,
  URLloopback/namefixed không tự chứng minh host đang nối đúng containerdisposable.
- Actual checkout target11file/310test pass sau Nodeenvironment đúng server; firstpass
  gặp happyDOM/HTTPmockdefault, đã ghi layer/trước lần2 sửa harness, không hạ assertions.
  Codemap packageJSON không hỗ trợ noncode; map gateadjacent permissions0importers, cùng
  rg rà package/workflow/quality needs trước edit. Full gates chưa chạy xong.
- ActualPG fullrun1:1.872/1.874,2crash rawstring/null vì express.json strict trả HTML400 trước
  handler; oracle cũ épJSONmọiresponse. Giữlabels400 +DBpending, adapter nay record riêng
  đúngprimitive+400+text/html; nonJSON200/nonprimitive/nonHTML vẫnfail.6unitcontrols +snapshot
  eligibility trước await; không đổi productAPI hoặc gọi đây là handler/authproof cho2ca.
- ActualPG fullrun2:1.874/1.874,0crash/notRun; runtimeconsent8/8 (active/none/wrongpurpose/
  revoked/expired/ephemeral/foreign/scope). Actualprepare→consentDB→toolsession, SDK classifier
  fakeexact protocol/calls1/terminal1/no usage, no synthesis. Realopaque cookieauthHTTP,
  owner/other/CSRF/status/version/atomicretry/confirmconcurrency/domain/audit kiểm SQL thật.
  380syntheticroots cleanup0, networkviolations0, platformdaily unchanged kể cả snapshot
  sau await cachedaccountingpool.end; nguồn hash pin và sourceUnchangedtrue, checkoutdirtytrue.
  Report e2f1b3e1 ngoài repo; đây không phải CI/exactcommit hoặc fullGoalpass.
- Source sản phẩm không đổi; no liveprovider/semanticrank/physicalvoice/production. Runtime
  fake HTTP/PG không chứng minh model robustness; TCP/fetch guard không là OS/UDPfirewall.
  Harddeadline12min signal→nonzero/residualunknown nếukill; recovery chỉ trustedlocaljournal,
  không nhận IDs từ corpus/model/HTTP, không globalcleanup/paymentdelete.
- Final localPG trên source hiện tại: report cfa2be2b sau floor,1.874/1.874 +runtime8/8 đạt,
  sourceUnchanged/accountingPoolClosed/dailyAfterAccountingPoolClosed true; cleanup/network0.
  Hash corpus giữ2edad10e…; githead a47a5c14/checkoutdirty, chưa thay exactheadCI.
- Ba deliberate RAM source mutants được parent review và chạy tuần tự trên actualPG,
  không sửa disk source/fixture/oracle: bỏ consent ContextEngine làm5target C03/C04 đỏ
  source_absent, C02 ownership còn xanh; bỏ offered gate làm T01/T02 đỏ outcome/proposal;
  bỏ owner predicate confirm làm3service+1cookieHTTP đỏ status/owner/domain/audit/version/
  execution. Mỗi lượt chạy đủ1.874, exit1, target không crash/cascadecontrol, controls xanh;
  verifier pin normalbaseline/source/corpus/RAM/report hashes, cleanup/network/globaldaily0.
  Các controls không chịu tác động đã pin đều xanh; không nói toàn40controls xanh: context
  mutant làm20ca đỏ gồm3historycontrols phát hiện thừa memory và9dependent cascade;
  tools2ca/confirm4ca đỏ. Tools mutant còn bị runtimeconsent bắt. Cả3không crash.
  Đây là NEGATIVE_CONTROL_RAM_SOURCE, không gọi worker diskhashtrue thành normalPASS.
- Parent phát hiện trước PR: --corpus riêng bỏ1benign variant còn1.873 nhưng đủ47recipe
  vẫn parse; regression actualschema1đỏ/14filter-skip. Đã thêm sàn1.874 cho v1, không đổi
  fixture/nhãn. Dừng fullunit lượt đầu bằng SIGTERM own processgroup để chốt source mới;
  lượt đó type/build/lint/format đạt nhưng unit NOT_COMPLETE, không dùng làm finalgate.
  Targeted sau floor11file/311đạt; CLI thật file1.873 exit2/trước tạo artifact.
  PG/3mutants source mới đều đã kiểm lại; full gates đang chạy lại trước mở PR.
  Cleanup-only resume journal đãclean trên PG thật exit0/CLEANUP_COMPLETE,0case; không
  coi recovery là fullPASS hoặc proof mất điện/crash-mid-insert.
- Full build/type/lint/format/coverage, replay/specs, localbrowser8/fullCI exacthead còn bắtbuộc;
  repairmax3 cùngfailure không weakenfloor.

- Full local sau floor: typecheck/build/lint0 cảnh báo/format exit0; 973 file/21.975
  unit test pass,5file/35test skip sẵn có,Vitest674,01s (npmwall676,62s). Coverage
  96,14/92,06/96,91/96,84%, giữ sàn94/90/94/94. Replay7/7, specs191, browser8/8
  (13,8s) đạt. Clean typecheck sau xóa generated dist đạt exit0 (123,98s). CI exacthead
  còn bắt buộc; không dùng initial interrupted run.
- Rà voice trước instrumentation phát hiện inherited TTS/WebSpeech ownership và
  permission/STT completion sau unmount. Actual public TTS tests + actual recorder/AST
  callbacks có counterexample; chưa mountedReact/browser proof. Ưu tiên S06a/lifecycle
  sau S04 trước baseline S05. S05 corpus/scorer/runner đã review trước ranking; thêm
  prototype8contextcohorts riêng, chưa actual PG/ranking. Không suy prototype thành DONE.

- Source commit4259e64d; [PR #1408](https://github.com/seeker19110/dhcb/pull/1408) READY,
  đã attach vào chat. Full local gates/clean typecheck/browser đạt; chờ mọi check exacthead
  cùng review/base/CodeQL và metadata mới sau body trước merge theo quyền owner đã cấp.

- CI head0f361be8/run38984959491 gặp ECR Data limit exceeded trước checkout SQL; các
  job khác vẫn chạy. CodeQL PR85 trỏ `.replace` tạo credential lỗi trong testfixture
  (js/incomplete-sanitization). Đổi đúng dòng đó sang replaceAll, fixture string giống
  hệt;51/51 targeted +lint/format đạt. Không sửa source sản phẩm, corpus hoặc oracle.
  Full local số ở trên là trước một dòng fixture; full CI head mới phải chạy đủ mọi
  gate, không tái dùng số CI cũ hoặc dismiss/suppress. Lịch rerun bootstrap head cũ đã
  dừng trước gửi request khi cần head mới; ECR hiện1lượt CI fail ở iteration này.

### Checkpoint tích hợp S04 — 2026-10-17

- PR #1408 đã merge `bbeaded56aca318fb584b11874d79ebe7cde4e34` lúc 00:31:03 UTC.
  Head cuối `7d28b397`, CI [38985722173](https://github.com/seeker19110/dhcb/actions/runs/38985722173)
  SUCCESS; trước merge đủ 19 context, metadata mới 38986638187 tạo sau body, base/head
  không đổi, không review yêu cầu sửa, không auto-merge/bypass.
- CI đúng head: 973 file/21.975 unit pass, 5 file/35 test skip, 378,22 giây; coverage
  96,13/92,05/96,91/96,83%. Browser 1.439 pass, 1 flaky, 5 skip: lịch 1440 px lần đầu
  23,99993896484375 < 24, retry cùng head đạt. Chạy lại local đúng test 3/3 không retry
  (11,9 giây); theo dõi [#1409](https://github.com/seeker19110/dhcb/issues/1409), giữ ngưỡng.
- Artifact `companion-boundary-38985722173-1`, ID 12082589120, digest
  `sha256:7cda9f7894958c8ab09fa44da29ffc8111316121ff7ddd97f555a3ee4340e989`:
  1.874/1.874 + runtime 8/8, 0 crash/notRun/network, cleanup residuals 0, accounting
  không đổi sau đóng pool. Report SHA `5a0ac578603b9026d9714ff7e60a81214816cee17ce22fe36619dbbfa1cd2b86`,
  25 source hashes khớp exact head; PG legacy 54/54 + 23/23 đạt.
- CodeQL PR merge 05f99520: analyses 1971156550/1971146124, JS 103/Actions 23 rule,
  error rỗng, results 0; PR-ref open 0. Fixture alert #85 fixed, không dismiss/suppress.
  Main vẫn có 82 cảnh báo nền từ 12/10, không phải toàn repo 0. ECR ở head cũ không
  cần rerun: lịch retry đã hủy trước gửi, head cuối SQL/CI đạt ngay attempt 1.
- Main CI 38986735433, deploy 38986735404, CodeQL 38986735379 và secret scan
  38986735389 đều SUCCESS trên merge bbeaded5, không retry. Evidence ngoài repo:
  validation/stored-boundary-corpus-implementation.

### Iteration 11 — 2026-10-17

- State: VERIFY sau repair ownership lần 2; S06a hủy TTS trên `codex/stored-tts-cancellation`, base main bbeaded5.
  Đã reload main/AGENTS/CLAUDE/PROGRESS/PROJECT/goal/spec và delivery loop. S06 Approved
  merge #1399; một outcome là quyền sở hữu lượt phát qua tải lỗi và Web Speech.
- Scope: `tts.ts`, ba file unit regression và browser fixture TTS thật; docs/goal/changelog
  0644/TRAPS. Public API, request/body/cache/inflight/retry/provider/usage/schema giữ nguyên.
  Codemap trước source: 102 file ảnh hưởng; full gate/browser CI vẫn bắt buộc.
- Actual checkout trước sửa: 13 unit đỏ/9 đối chứng đạt; browser 6 đỏ/2 đối chứng đạt
  trên cả en→vi và vi→en. Lỗi assertion là giọng/feedback hoặc karaoke sau hủy/đổi lượt,
  không dùng crash hay request provider thật làm bằng chứng.
- Fix hẹp: chỉ catch tải audio, stale trả vé cũ thay vì kích fallback. Lỗi active vẫn throw.
  Web Speech claim vé mới trước cancel, callback kết thúc trả vé riêng và boundary kiểm vé.
  Không guard public catch bằng vé trước tải vì HTMLAudio active tự tăng vé trước play.
- Sau sửa actual checkout: 4 file/99 unit đạt (2,78 giây), gồm 22 regression và 77 test
  TTS cũ; Chromium 8/8 không retry (7,5 giây). Bao gồm active fallback, thành công,
  delayed play reject sau stop/replacement, normal bilingual feedback/karaoke.
- Fixture browser nạp module TTS production qua Vite; HTTP 503/Web Speech được giả lập
  tại biên, không mount React/route lifecycle hoặc đo âm thanh vật lý. UI/STT ownership
  vẫn là slice sau, không suy 8 ca này thành nghiệm thu physical voice hoặc toàn S06.
- Full build/type/lint/format/coverage, clean typecheck, replay/specs và CI exact head
  còn bắt buộc trước PR/merge. Mỗi failure tối đa 3 repair, provider cost 0.

- Full local S06a: type 94,08 giây, build 147,13 giây, lint 0 cảnh báo 85,81 giây,
  format 94,68 giây, exit 0. Coverage: 976 file/21.997 unit pass, 5 file/35 test skip,
  Vitest 538,83 giây (npm wall 541,25 giây); 96,14/92,07/96,91/96,85%, sàn không đổi.
  Replay 7/7, specs 191 đạt. Thin strict riêng 3 regression file đạt.
- check:ui-ux 6 file/173 test đạt; smoke TTS + Practice direction 20/20 không retry
  (59,0 giây), clean typecheck sau chỉ xóa generated dist đạt (94,82 giây). Source/test
  5 file giữ nguyên SHA qua các lượt này. CI exact head/review/CodeQL/metadata còn bắt buộc.
- Read-only design lifecycle đã có B1 + matrix mounted React/browser A/B. Thêm proof
  actual startListening + exact toggleRecord: manual browser Stop làm mất confirm ở
  A/B (2 đỏ), natural-end/cleanup 4 đối chứng đạt, network 0. Chưa mounted React/browser
  proof cho lỗi đó. Slice sau giữ default cancel và thêm complete explicit, owner
  độc lập metadata, signal trước upload, usage của request đã gửi giữ đúng captured user.

- Source commit65cc3d75; [PR #1410](https://github.com/seeker19110/dhcb/pull/1410) READY, đã attach. Còn full CI exact head, review/base/CodeQL và metadata mới sau body trước merge; không auto-merge/bypass.

- Independent review tìm P2 ở source 683d99ce: A tải cũ pending, B mới cũng pending,
  A reject rồi fallback claim vé làm B bị bỏ. Gap còn có A tải thành công hoặc play-error
  trước khi B tải xong. Parent regression actual checkout: 3 unit đỏ/22 controls đạt,
  Chromium hai chiều 2 đỏ/8 controls đạt. Không merge source này.
- Trước lần sửa 2 của ownership: lỗi nằm ở tầng **thiết kế** vì claim vé lúc backend bắt
  đầu phát không bảo vệ intent đã bắt đầu tải. Hướng sửa: một claim ở public nonempty speak,
  backend giữ vé, guard public catch chỉ sau khi bỏ self-increment. Lượt full gate trước
  là lịch sử cho source cũ; archive initial-validations, phải chạy lại đầy đủ source mới.
- CI683d99ce/run38989883273 SQL job117269847752 bị ECR Data limit exceeded tại Initialize
  containers trước checkout; chưa chạy SQL/test. Không đổi image/gate, chưa gửi rerun vì
  P2 cần source mới. Không coi bootstrap failure là product failure hoặc dùng nó che P2.

- Repair source mới: public nonempty speak nhận ticket trước await; private Google/Web
  Speech không tự tăng; public catch kiểm ticket cho cả load/play lỗi, boundary trả/kiểm
  vé riêng. Active fallback và normal bilingual vẫn chạy, empty không claim. Source SHA
  93e2ad177d5de58ba60c9ba212b32f71e71c12ef37de50cc316a32006ebe52c3 giữ qua review.
  Actual targeted 4 file/102 đạt (2,90s), Chromium10/10 (9,8s), thin strict3file đạt.
  Independent29probe actual source đạt; negative double-claim bắt active playback-error.
  Full gate mới bắt buộc, không tái dùng full21997/smoke20 của source đầu.

- Full local source sửa sau review: type92,42/build147,04/lint0warning81,46/format99,18s,
  exit0. 976file/22.000unit pass,5file/35test skip sẵn có; Vitest555,05s/npmwall557,57s,
  coverage96,14/92,07/96,91/96,85%, sàn94/90/94/94 không đổi. Replay7/7/specs191 đạt.
  UI contract6file/173 đạt; TTS+Practice direction22/22 không retry57,4s. Clean typecheck
  sau chỉ xóa generated dist đạt95,61s. Năm source/test hashes giữ đúng snapshot sửa mới;
  docs cập nhật sau gate được Prettier/diff riêng, không tái dùng gate source đầu.
- Chuẩn bị slice sau ngoài repo: actual mounted Companion/Speaking A/B30ca có16 regression
  đỏ/14controls, gồm reauth/late STT/manual native Stop. Adapter candidate có36coregreen
  và một regression stop-throw bổ sung; chưa apply/mounted/browser/fullgate source adapter.
  S05 CLI prototype P1 native env đã sửa một predicate; parent6/6 native/tsx controls đạt,
  chưa actual PG/ranking/quality floor. Những prototype này không là acceptance trên main.

### Checkpoint tích hợp S06a — 2026-10-17

- [PR #1410](https://github.com/seeker19110/dhcb/pull/1410) đã merge de4eba99 lúc01:53:52UTC.
  Source/head cuối d7df2069,20context đềuSUCCESS, basebbeaded5 không đổi/review yêu cầu sửa0,
  match-head squash thủ công, khôngauto/bypass. FullCI38992041149 attempt1 đạt:
  976file/22.000unit,5file/35test skip,328,83s; coverage96,13/92,06/96,91/96,84%.
  Sáushard Chromium1.450pass/5skip/0flaky; PG54/54+23/23.
- ActualCIartifact12085980496/reportSHA78de151cdc7e93094585da373c102fc3cb20998b54e5a968c07f8170dd4cfefd:
  1.874/1.874 +runtime8/8,25sourcehashmatch, cleanup/network0/dailyunchanged saupoolend.
  CodeQLmerge6158b7b8 analyses1971389279/1971380721,103/23rules/results0/errorrỗng/PRopen0;
  main vẫn82alertnền từ12/10, khôngdismiss/suppress.
- Mô tả cuối cập nhật01:52:44UTC, metadata38992690741 tạo01:52:46 SUCCESS.
  Runmetadata38992041162 cũ bịconcurrencycancel sauedit; rerunđúnghead một lần attempt2
  SUCCESS rồi mớimerge, giữmọicontextxanh. Khôngđổi workflow/gate/source.
- Deploy38992765415/CodeQL38992765450/secretscan38992765470 mainSUCCESS; CI38992765453
  đều SUCCESS đúng de4eba99; đã kiểm lại bốn run trên main trước tiếp tục source S06b.

### Iteration 12 — 2026-10-17

- State: IMPLEMENT; S06b voice lifecycle trên codex/stored-voice-lifecycle, freshmain de4eba99.
  Đã reconcile source/tree, reload AGENTS/CLAUDE/PROGRESS/PROJECT/ApprovedS06/deliveryloop.
  Codemap bốn hotspots đã đạt trước edits (impact15/31/5/2); StudioDialogue impact6 cũng đạt
  trước mở rộng callback quick prompt. Source chỉ áp sau actual-checkout test-first.
- Một outcome: người học rời trang/đổi phòng/hủy/đổi scope thì capture và callback cũ
  không mở mic, gửi AI hoặc phát TTS mới; request đã gửi vẫn giữ receipt/usage của user cũ.
  B1: DHCB Companion/Learning, A/B,390px/1440px, touch/keyboard, permission/network chậm;
  ưu tiên quyền sở hữu tài nguyên, không đổi bố cục hoặc tạo UI kỹ thuật.
- Shared interface đã chốt: startRecording(lang,{signal?}?) và startListening với option
  signal, callable mode cancel|complete mặc địnhcancel. Chỉ Speaking manualStop dùngcomplete,
  giữref đến terminal. Cancel trướcfetch chặncontinuation; saufetch giữtimeout/receiptthật.
  Recorder.stop dùng chungpromise; không thêm provider/retry/refund/usage hoặc domain mutation.
- Write set: sttServer.ts/stt.ts, Companion.tsx/Speaking.tsx; unit adapter/mounted/scope/
  finalizer và browser fixtures; goal/PROGRESS/changelog/TRAPS. Public/serverDTO/schema/lock/
  CI/prompt/model/transport/billing policy giữ nguyên; rollback revert, khôngmigration.
  Mở rộng hẹp StudioDialogue callback quick prompt: candidate owner cũ tự abort request khi
  setSelectedDomain và handleSend cùng event; đã repro baseline2/2 đạt/candidate2/2 đỏ.
  Chuyển sang một intent nguyên tử, chỉ gửi sau target scope commit; không trì hoãn privacy cleanup.
- Parent đã review adaptersource +37test và independent44probe; đã đọc mounted30test/helper
  có16assertionđỏ/14controls. Prototype ngoài repo chưa làacceptance; actualcheckouttest-first,
  existingregressions/fullgate/clean typecheck/UIcontract/AA/AAA vàbrowserhai chiều còn bắtbuộc.
  Before/after screenshots390/1440, physicalaudio NOT_MEASURED. Max3repair/cùngfailure,
  ghi tầng lỗi trước lần2; providercost0/không productiondata. Ownerđãcấpquyềntíchhợp khiCIxanh.

### Test-first S06b tại checkout — 2026-10-17

- Source baseline de4eba99, chỉ thêm test trước source. Adapter37:32 đỏ/5 đối chứng đạt;
  mounted30:16 đỏ/14 đối chứng đạt. Vitest kết hợp server+mounted có4 unhandled rejections
  từ source cũ (onstop lặp đọc cùng Response/rec.stop throw), ghi log nguyên vẹn, không coi là
  assertion-only RED. Native riêng14:12 đỏ/2 đạt, không unhandled. Không provider/network ngoài fake.
- Browser full10 với helper portable trên actualcheckout đang chạy riêng, chưa sửa source.
  Final source phải đạt không unhandled; không dùng kết quả prototype làm nghiệm thu.

- Browser actualcheckout localhost5191:8 assertionđỏ/2đối chứng đạt,87,20s,retry0,
  ledger0/runnererror0,4sourcehash trước/sau baseline trùng; server đã dừng trước source edits.
- Đã áp adapters + Speaking; adapter mới37 +existing5 =42/42 đạt; mountedSpeaking A/B24/24
  đạt (6Companion chưa áp tạmkhôngchạy). Không unhandled ở các lượt green này.

- Independent review S06b phát hiện P2 follow-up thay capture nhưng UI recording/processing
  chưa reset. Root tái hiện actualcheckout2đỏ/1controlđạt trước sửa, giữ nguyên frozen30;
  sửa chuyển UI tại claim AI, không bỏ receipt STT muộn. Lint đầu báo immutable owner.phase;
  đã tách phaseRef giữ owner immutable, parent bắt/sửa extra property qua diff và appstrict đạt.

- Repair privacy guard lần2, tầng thiết kế, trước sửa: null marker là unknown không phải
  phiên hợp lệ; scheduler phải kiểm owner TRƯỚC clear global timer. Hai reviewer độc lập
  tái hiện stale schedule xóa lịch user mới (0POST thay1); actualcheckout đã có1RED riêng.
  Giữ options mặc định caller cũ; guarded-null/stale không gửi và không thay timer hợp lệ.
- Marker-only khi Auth refresh chưa commit: đã tái hiện SpeakingmanualStop/MAX60s giữmic
  (2RED/2controls) và Companionpermission/authawait/AIcallback (3RED/1control).
  Sửa client resource theo identity trước cleanup; kiểm marker trực tiếp và tại capture
  boundary, không dùng marker làm auth/server authority. Source trước sửa và test-first
  được pin; không suy fixtures thành cookie/DB/physicalaudio proof.

- Repair retirement lần2, tầng thiết kế: timer confirm còn bỏ callback mà chưa dọn state
  của chính owner stale. Rà toàn bộ guard còn lại; giữ predicate thuần ở boundary, retire
  chỉ dọn khi current ref còn đúng owner đó. Confirm + Companion activeStop actual2RED
  trước sửa, sau sửa cùngAPIlegacy/requestguard tổng48/48 đạt. Không nới oracle/thời gian.
- Internal API mở rộng callClaude options thứ7 và Companionstream options.isCurrent:
  kiểm trước/sau auth await trước fetch, predicatefalse/throw→AbortError. Test-first tại
  checkout6RED/2đối chứng, exact body/headers và post-fetch receipt/SSE terminal giữ đúng.
  Codemap ai impact66/CompanionAPI đạt trước sửa; không đổi DTO/server/provider/usage.
  Lần đặt test sai thư mục gây missingimport đã archive bootstrap, không tính làm RED.
- Source write set thêm storage.ts/mistakes.ts (codemap đạt), ai.ts/companionApi.ts cho
  privacy tại request/sync boundary, StudioDialogue callback; đây là sửa lifecycle cùng
  outcome, không tạo cơ chế auth/transport/domain authority mới.

- Final Comp+actualcompanionApi3ca:2RED/1sent-control tại checkout trước sửa.
  Voice hủy trước fetch nay phải qua cả send/voice owner; saufetch vẫn giữ reply/loading
  và khôngTTS. Reactkey user/marker remount CompanionSession xóa private history/consent/
  proposal UI đã render từ account trước; khôngđổiDOM hoặc backend authority.
  Đây là defect privacy có sẵn; sourcecũ giữ canary sauAuthuser2commit dùlượt mới hoạt động.

### Tiếp tục iteration 12 — 2026-10-18

- Owner yêu cầu tiếp đến khi hoàn thiện; quyền push/PR/merge/deploy khi CI xanh tiếp tục
  theo xác nhận đã lưu, không suy thêm quyền chi phí provider/production data.
- Fresh main54590ead thêm khung/hook X-Templates (#1411), không đổi production/config test
  hoặc25 file S06b. Đã đọc delta CLAUDE/xt.yaml, kiểm AGENTS/PROGRESS/PROJECT/spec/loop;
  cập nhật nhánh fast-forward, giữ nguyên byte29 file đang làm và snapshot hồi phục riêng.
  Main bốn workflow SUCCESS. Full gate trên de4eba99 là lịch sử, phải đo lại ở base mới.
- Full gate cũ đã đạt988file/22.146unit/35skip, coverage96,16/92,09/96,94/96,87%; browser47
  đạt. Rà ảnh phát hiện tên1440 nhưng config thực1280, đã sửa explicit1440×1000, mobile390×844.
  Không dùng ảnh kích thước sai làm acceptance. E2E viewport-only đã có47green/cleantype.
- Independent triage highlight4/4 (1440/390×normal/reduced motion): DOM/class/viewMode đúng;
  ảnh chụp ngay lúc CSS transition0/150ms làm màu tab cũ còn hiện. Baseline dùng reduced-motion,
  repo default không. Chụp với animations disabled để so trạng thái đã ổn định; không sửa
  sản phẩm/gate hay dùng ảnh làm oracle duy nhất. Final source mới phải qua full gate/browser.
- Bản metrics S06 tiếp tục chuẩn bị ngoài repo với scope riêng; chưa apply hoặc nghiệm thu.
  Benchmark S05 chỉ có inventory17 file chuẩn bị, actualPG/negative controls sau S06b merge.

### Validation local S06b trên fresh main — 2026-10-18

- 25 file source/test giữ nguyên hash xuyên 10 gate sau reconcile main 54590ead.
  Typecheck 94,52s; build 124,41s; lint không cảnh báo 70,24s; format 86,41s, đều exit 0.
  988 file/22.152 unit đạt, 5 file/35 test skip; npm wall 480,61s, Vitest 477,36s.
  Coverage 96,16/92,10/96,94/96,87%, không đổi sàn 94/90/94/94; replay 7/7, specs 191 đạt.
- UI contract 173/173; Chromium 47/47, không retry, 153,30s: 10 lifecycle, 10 TTS,
  12 Practice, AA/AAA hai trang trên ba theme và Speaking AI result. Clean typecheck
  sau chỉ xóa generated dist đạt 101,59s. Strict 14 test/helper với 744 source/declaration
  files đạt; page implementation facade, không thay whole-app gate.
- Root đã đối chiếu bốn ảnh actual baseline và final 1440×1000/390×844, không hồi quy bố cục.
  Independent transition 4/4, không P1/P2; snapshot tắt animation để so trạng thái ổn định.
  Không dùng 22.146 unit ở de4eba99 hoặc ảnh 1280 gắn nhãn 1440 làm bằng chứng bản cuối.
- Source cuối không unhandled; không provider có phí/production data. Kết quả mới là 22.152,
  khác base cũ sau main #1411; không sao chép số cũ. Đã primary review 9 source production,
  đối chiếu adapter/mounted/auth gap/session sync/QuickPrompt độc lập; metadata không authority.
- Chưa merge/deploy S06b; chờ quality/e2e/metadata và mọi context, CodeQL PR-analysis
  và actual CI corpus artifact. Main CodeQL đọc 18/10: 82 alerts cùng tạo 12/10,
  không dismiss/suppress. S05, metrics và số đo thiết bị vẫn mở; Goal NOT COMPLETE.

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

### Checkpoint tích hợp S06b — 2026-10-18

- PR [#1412](https://github.com/seeker19110/dhcb/pull/1412), head `c73138e3`, đủ19context gồm metadata mới sau mô tả cuối; không auto-merge hoặc bypass protection.
- CI [39087533594](https://github.com/seeker19110/dhcb/actions/runs/39087533594) đạt988file/22.152unit,5file/35test skip sẵn có; coverage96,15/92,08/96,94/96,86%. Sáu mảnh E2E:1.460 đạt/5skip/0flaky.
- Actual corpus artifact12120454488:1.874+8runtime đạt,25source hashes khớp, cleanup0/network0/daily unchanged sau pool đóng; CodeQL PR103/23rules results0/errors rỗng/PRalerts0. Main vẫn82alerts đã tạo12/10; không dismiss/suppress.
- Matched-head squash vào main `ba82335f825bee8e583fe351a57c52c82706ba77`, lúc01:56:44UTC. Deploy39088294176 và secret39088294162 SUCCESS. CI39088294166/CodeQL39088294171 tiếp tục được theo dõi; chưa ghi hai workflow đó thành công.

### Iteration 13 — 2026-10-18 — PLAN S05

- Một outcome/PR: baseline truy xuất ký ức Việt–Anh trên Postgres disposable, gọi đúng searchMemories/ContextEngine hiện hữu. Spec S05 Approved đã merge qua1399 trước source. Reload/reconcile mainba82335f; source tree byte-identical PR1412 đã qua19context. S06b deploy đã đạt; main checks còn chạy song song và phải đạt trước push tiếp theo.
- Write set:17source/test/corpus mới theo inventory frozen ngoài repo; thêm2steps S05 vào SQLjob CI và testcontract mới riêng, runbook, goal/PROGRESS/changelog. Không sửa thuật toán/ranking/provider, migration, package/lock, thresholds, hooks, permissions hoặc server learner state.
- Contract:40query (20Việt/20Anh),33positive/7no-relevant mỗi mode;80observations cùng read-only repeatable-read snapshot/now/limit10/touchfalse. Lexical có importance/recency/RRF hiện hữu; rejecting fake cho embedding-error fallback, không vector giả thành semantic quality.
- Oracle:full ranked parity/scorer re-score;26rank memories/29audits nguyên vẹn;8context cohorts riêng; scoped journal cleanup0; work pool đóng trước daily verification pool; source/HEAD/network/usage proofs. INVALID trả canonical metrics null và giữ mẫu số. BASELINE_VALID chỉ xác nhận phép đo, không quality floor; humanReview NOT_REVIEWED/vector NOT_MEASURED.
- Verification: targeted units rồi actual PG normal +4RAM negative controls (SQLerror positive+no-relevant, rank drift, consent bypass, wrong actor audit có cùng-worker observer); sau đó đủ build/typecheck/lint/format/coverage + exact-head full CI/E2E và artifact. Không UI/runtime learner change nên không chạy lại browser cục bộ riêng S05.
- Impact: npm codemap impact CI đã gọi trước edit nhưng dừng đúng own scanner exit143 vì RAM/swap đầy; không gọi đây là PASS. Đã đọc direct CI references/CLAUDE11.1/policy/security tests và independently review2steps. Bản đồ import bổ sung actual2.828source/8.429edges giữ nguồn, không thay full callgraph.
- Budget: một PR, tối đa3lần sửa cùng failure, ghi tầng nguyên nhân trước lần2; provider cost0, không production/secrets. Upload evidence nhỏ retention7 theo S04 để đọc baseline cả xanh/đỏ; Playwright upload giữ nguyên. Rollback bằng revert tooling, không migration.
- Trạng thái hiện tại: PLAN, chưa chạy actual PG hoặc toàn gate của source tích hợp. Root đã review toàn source/test prototype; kết quả mocks/negative verifier ngoài repo không thay bằng chứng database thật.

### Checkpoint tiếp tục iteration13 — 2026-10-18

- Fetch/reconcile lại main vẫnba82335f; cả CI39088294166/deploy39088294176/CodeQL39088294171/secret39088294162 SUCCESS. Không dùng trạng thái pending trước đó làm kết luận.
- Tích hợp17file frozen và2steps CI/newpolicy đúng bản review; chỉ hai test CLI bổ sung header @vitest-environment node để phù hợp runtime Node, không đổi assertions/product/frozen helper pins. Lượt tích hợp đầu ở default happy-dom:200assertions đạt/4launcher fail/1suite env bootstrap lỗi; không coi là behavioral RED hoặc bằng chứng PG.
- Chỉ thị worker ban đầu bị đặt cuối file; đã ghi lỗi tầngcổng/môi trường trước lần sửa2, chuyển về header. Lượt bị ngắt trước Vitest RUN không có kết quả được nhận. Sau sửa đúng môi trường:2file/15test đạt; đang chạy lại9file tập trung, chưa actual PG.

### Validation S05 đang chạy — 2026-10-18

- Targeted9file/210test đạt7,99giây, gồm launcher/env actualNode15cases; production frozen hashes không đổi.
- Actual PG normal run037cf78e-2cfd-4158-a673-e78a694b6ccf: BASELINE_VALID,80+8/26memory+29audit,
  parity MATCH, cleanup0/network0/daily unchanged sau pool đóng;4,08giây. Canonical lexical/fallback
  Recall5/10/MRR10=0,712121/0,878788/0,663504; nhãn tổng hợp chưa humanReview, không quality floor.
- Actual negative parity64e8cbb0/context7f5f335d/auditdd5526dd đã được verifier độc lập nhận,
  không suy detected từ exit1. SQL080c8d91 bị từ chối: injector text-only chọn V15 sensitive cùng
  textV16 personal, sinh6error thay4. Lỗi tầngthiếtkế injector identity phải gồmtext+maxSensitivity;
  sửa riêng external injector, giữ nguyên corpus, scorer và verifier oracle. Run bị từ chối giữ nguyên.
- Đang chạy full gate trên source tích hợp; chưa push/PR/merge S05, chưa nhận SQL negative là đạt.

### Chốt actual Postgres S05 — 2026-10-18

- Bản sao external injector chỉ đổi predicate SQL thêm cap personal; 29/30 file giữ nguyên,
  verifier/scorer/corpus/production không đổi. Cùng oracle7:3 RED/4controls →7PASS;51unit gốc đạt.
- Bốn actual controls mới được verifier nguyên byte nhận MUTANT_DETECTED_BY_PINNED_S05_ORACLES:
  SQL6e88a796, parityfec7af0c, consent43e19c71, audit05691b3a. SQL đúng V01/V16×2, giữ V15
  sensitive cùng text làm control. Canonical metrics không được phát hành từ các run INVALID.
- Verifier copy thiếu liên kết dependency zod nên bootstrap lượt đầu thất bại; giữ log, khôi phục
  external node_modules như harness gốc rồi xác minh lại cùng actual SQLrun, không sửa oracle/artifacts.
- Snapshot database sau normal+controls khớp trước: users/persons/sessions/memories0, bốn orphan audit
  cũ cùng fingerprint, daily0 cùng fingerprint; container của goal đã dừng sau proof, không truncate.
- Review độc lập actual80:1.649 Python assertions và15 probes trên bản sao artifact đạt; full ordered
  parity và rescoring khớp. Raw audit/context/daily không xuất trong artifact, chỉ có assertions của
  worker/source được pin; không gọi đây là phép đọc database độc lập của reviewer.
- Cổng format phát hiện một import type test cần gộp dòng/bỏ trailing comma. AST và emittedJS
  trước/sau byte-equivalent; runtime source44 giữ nguyên. Lưu đầy đủ gate đầu, chạy mới toàn bộ
  gate sau sửa định dạng. Chưa push/PR hoặc nhận toàn gate là đạt.

### Cổng local cuối S05 — 2026-10-18

- Source cuối sau sửa định dạng: build/typecheck/lint0warning/format:check/test:coverage/check:specs
  đều exit0;19 source/test/CI pins không đổi xuyên sáu gate. Typecheck chạy sau xóa dist và
  packages/*/dist, trước build mới; không lấy compile từ artifacts cũ.
- Vitest:996 file đạt/5 file skip;22.350 test đạt/35 skip theo cấu hình hiện hữu, không thêm skip.
  Coverage statements/branches/functions/lines=96,16/92,09/96,94/96,87%, giữ nguyên thresholds;
  test:coverage447,09giây. Approved specs191 đạt. Không có unhandled errors.
- Review final4 bổ sung121 assertions và10 strict schema/rescore/RAM-hash checks đều đạt;
  reviewer không phát hiện P1/P2. Phạm vi23 file, không migration/lock/provider/product source.
- Sẵn sàng commit/mở PR theo quyền đã cấp; exact-head CI, actual artifact/CodeQL và merge/deploy
  chưa nghiệm thu. Goal vẫn mở ở S06 và đo thật; không suy BASELINE_VALID thành QUALITY_PASS.

### PR S05 — 2026-10-18

- Đã mở PR1413 trên nhánh codex/stored-memory-retrieval-benchmark theo quyền owner đã cấp.
  Local gates và actual database campaign đã đạt; chờ đúng head CI, artifact S05/S04 và CodeQL
  trước matched-head squash merge. Không auto-merge khi protection thiếu required checks.
- Chỉ bổ sung số PR/trạng thái vào ba tài liệu sau source commit;19 source/test/CI và44 runtime
  pins giữ nguyên. Không thay source để lấy lại cổng xanh.
