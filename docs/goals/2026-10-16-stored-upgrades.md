# Goal nâng cấp DHCB từ stored

| Thuộc tính        | Giá trị                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Goal ID           | GOAL-2026-10-16-STORED                                                                                                         |
| Owner             | Chủ dự án DHCB                                                                                                                 |
| Trạng thái        | ACTIVE — S01–S03a đã merge; S03 trace đang triển khai; S04–S06 đã được owner duyệt                                             |
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

| ID   | Outcome/AC                                                                   | Dependency                            | Spec                                                                                             | Issue    | PR                                                     | State    | Evidence                                                  |
| ---- | ---------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------ | -------- | --------------------------------------------------------- |
| S01  | Runner ký ức từ chối ca sai, ca hỏng, fixture rỗng/thiếu nhóm; giữ 30 ca gốc | Không                                 | [V2-19 đã duyệt](../specs/2026-08-17-v2-19-platform-evaluation-hardening.md) và nghiên cứu 16/10 | Chưa tạo | [#1399](https://github.com/seeker19110/dhcb/pull/1399) | DONE     | Main 66db5e63; quality/e2e/metadata và deploy đạt         |
| S02  | Replay phản hồi provider qua logic production, offline và phát hiện mismatch | S01 đã tích hợp; spec được merge      | [S02 đã duyệt](../specs/2026-10-16-stored-s02-provider-replay.md)                                | Chưa tạo | [#1400](https://github.com/seeker19110/dhcb/pull/1400) | DONE     | Main 5e7bb30f; đủ 18 check và deploy đạt                  |
| S03a | Sửa phép tính cache write bị cộng trùng trước trace                          | S02 tích hợp                          | [Khảo sát S03](../specs/2026-10-16-stored-s03-turn-tracing.md)                                   | Chưa tạo | [#1401](https://github.com/seeker19110/dhcb/pull/1401) | DONE     | Main f29d8237; 19 check xanh, CI 21.491 test/coverage đạt |
| S03  | Trace các chặng và chi phí từng lượt, dữ liệu tối thiểu                      | Spec telemetry được merge             | [S03 đã duyệt](../specs/2026-10-16-stored-s03-turn-tracing.md)                                   | Chưa tạo | Chưa tạo                                               | BUILDING | Mặc định tắt; contract/observer nội bộ theo spec đã merge |
| S04  | Injection qua ghi chú/ký ức/công cụ và kiểm cả delta stream                  | Spec và corpus được merge             | [S04 đã duyệt](../specs/2026-10-16-stored-s04-injection-stream.md)                               | Chưa tạo | Chưa tạo                                               | SPEC     | Giữ red-team Postgres hiện hữu                            |
| S05  | Benchmark chất lượng truy xuất Việt–Anh                                      | Corpus/nhãn/ngưỡng đã duyệt           | [S05 đã duyệt](../specs/2026-10-16-stored-s05-memory-retrieval-benchmark.md)                     | Chưa tạo | Chưa tạo                                               | SPEC     | Chưa có vector thật; chưa đo ranking                      |
| S06  | Số đo voice, ngắt lời, reconnect và fallback                                 | Spec/cách đo trên thiết bị được duyệt | [S06 đã duyệt](../specs/2026-10-16-stored-s06-voice-metrics.md)                                  | Chưa tạo | Chưa tạo                                               | SPEC     | App STT→LLM→TTS; chưa đo acoustic                         |

## 4. Risk register

| Risk                                              | Trigger/guardrail          | Mitigation/rollback                                                                   | Owner           | State                |
| ------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------- | --------------- | -------------------- |
| Eval xanh giả                                     | Có ca sai nhưng exit 0     | Kiểm helper và CLI bằng negative control; giữ đầy đủ các nhóm ca                      | Agent           | Đã kiểm chứng cục bộ |
| Replay bị coi là chất lượng model mới             | Chỉ chạy fixture đã ghi    | Gắn loại bằng chứng, fingerprint request/config; live eval là việc riêng có ngân sách | Chủ dự án/agent | Mở                   |
| Trace làm lộ hội thoại hoặc tăng chi phí vận hành | Thêm payload/backend mới   | Chốt allowlist metadata, retention và tài nguyên trước triển khai                     | Chủ dự án       | Mở                   |
| Tự mở rộng sang nhiều slice chưa tích hợp         | S01 chưa được review/merge | Checkpoint một slice và chỉ chuẩn bị spec tiếp theo                                   | Agent           | Đang kiểm soát       |

## 5. Current truth

- Commit main đã reconcile: `f29d823785f0e099fd9528582a39a59f219f09c5` (PR #1401), ngày 16/10.
- Worktree: `/home/liend/.codex/worktrees/stored-eval-gate/dhcb`; nhánh
  `codex/stored-turn-tracing`. Workspace gốc và các file chưa track của người dùng giữ nguyên.
- Goal gap: S01–S03a đã merge; S03a deploy thành công. S03 bắt đầu triển khai trace
  mặc định tắt; kiểm thử runtime bật/tắt và targeted strict đã đạt, đang chạy full gate. S04–S06 chưa triển khai.
- Next best slice: trace S03 theo spec đã duyệt; sau đó kiểm injection/stream S04.
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

- State: BUILDING; slice S03 trên `codex/stored-turn-tracing`, main `f29d8237` đã reload.
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
