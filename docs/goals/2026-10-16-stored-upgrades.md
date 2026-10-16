# Goal nâng cấp DHCB từ stored

| Thuộc tính        | Giá trị                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Goal ID           | GOAL-2026-10-16-STORED                                                                                                         |
| Owner             | Chủ dự án DHCB                                                                                                                 |
| Trạng thái        | ACTIVE — S01–S04a đã merge; S04b guard đang triển khai; S04–S06 đã được owner duyệt                                            |
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

| ID   | Outcome/AC                                                                   | Dependency                            | Spec                                                                                             | Issue    | PR                                                     | State     | Evidence                                                  |
| ---- | ---------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------ | --------- | --------------------------------------------------------- |
| S01  | Runner ký ức từ chối ca sai, ca hỏng, fixture rỗng/thiếu nhóm; giữ 30 ca gốc | Không                                 | [V2-19 đã duyệt](../specs/2026-08-17-v2-19-platform-evaluation-hardening.md) và nghiên cứu 16/10 | Chưa tạo | [#1399](https://github.com/seeker19110/dhcb/pull/1399) | DONE      | Main 66db5e63; quality/e2e/metadata và deploy đạt         |
| S02  | Replay phản hồi provider qua logic production, offline và phát hiện mismatch | S01 đã tích hợp; spec được merge      | [S02 đã duyệt](../specs/2026-10-16-stored-s02-provider-replay.md)                                | Chưa tạo | [#1400](https://github.com/seeker19110/dhcb/pull/1400) | DONE      | Main 5e7bb30f; đủ 18 check và deploy đạt                  |
| S03a | Sửa phép tính cache write bị cộng trùng trước trace                          | S02 tích hợp                          | [Khảo sát S03](../specs/2026-10-16-stored-s03-turn-tracing.md)                                   | Chưa tạo | [#1401](https://github.com/seeker19110/dhcb/pull/1401) | DONE      | Main f29d8237; 19 check xanh, CI 21.491 test/coverage đạt |
| S03  | Trace các chặng và chi phí từng lượt, dữ liệu tối thiểu                      | Spec telemetry được merge             | [S03 đã duyệt](../specs/2026-10-16-stored-s03-turn-tracing.md)                                   | Chưa tạo | [#1402](https://github.com/seeker19110/dhcb/pull/1402) | DONE      | Main 9378c604; 19 check, 21.536 test và 6 E2E đạt         |
| S04a | Chuyển SSE qua HTTP production/dev, giữ side effects khi disconnect          | S03 đã tích hợp                       | [S04 đã duyệt](../specs/2026-10-16-stored-s04-injection-stream.md)                               | Chưa tạo | [#1403](https://github.com/seeker19110/dhcb/pull/1403) | DONE      | Main 84b16bec; 19 check, 21.558 unit và 1.436 E2E pass    |
| S04b | Lọc lời văn delta/final qua mọi chunk, giữ metadata đề xuất                  | S04a đã merge                         | [S04 đã duyệt](../specs/2026-10-16-stored-s04-injection-stream.md)                               | Chưa tạo | Chưa tạo                                               | VERIFYING | Local full gate đạt; chờ PR/CI exact head                 |
| S04  | Injection qua ghi chú/ký ức/công cụ và kiểm cả delta stream                  | Spec và corpus được merge             | [S04 đã duyệt](../specs/2026-10-16-stored-s04-injection-stream.md)                               | Chưa tạo | Chưa tạo                                               | BUILDING  | Transport DONE; guard/corpus còn mở                       |
| S05  | Benchmark chất lượng truy xuất Việt–Anh                                      | Corpus/nhãn/ngưỡng đã duyệt           | [S05 đã duyệt](../specs/2026-10-16-stored-s05-memory-retrieval-benchmark.md)                     | Chưa tạo | Chưa tạo                                               | SPEC      | Chưa có vector thật; chưa đo ranking                      |
| S06  | Số đo voice, ngắt lời, reconnect và fallback                                 | Spec/cách đo trên thiết bị được duyệt | [S06 đã duyệt](../specs/2026-10-16-stored-s06-voice-metrics.md)                                  | Chưa tạo | Chưa tạo                                               | SPEC      | App STT→LLM→TTS; chưa đo acoustic                         |

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

- Commit main đã reconcile: `84b16bec917384a1ff01ae1ea7d57a57cd29156b` (PR #1403), ngày 16/10.
- Worktree: `/home/liend/.codex/worktrees/stored-eval-gate/dhcb`; nhánh
  `codex/stored-stream-surface-guard`. Workspace gốc và các file chưa track của người dùng giữ nguyên.
- Goal gap: S01–S04a đã merge; S04a deploy thành công. Trace mặc định tắt, chưa review
  điều kiện bật production. S04b sửa guard delta/final trước corpus S04; S05–S06 chưa triển khai.
- Next best slice: S04b guard delta/final, sau đó corpus/authority Postgres S04 theo spec đã duyệt.
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

- State: VERIFYING; S04b trên `codex/stored-stream-surface-guard`, base main `84b16bec`.
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
- Kiểm typing cuối sau sửa oracle E2E và cập nhật PR trên head thực; CI toàn bộ và
  sáu shard E2E vẫn bắt buộc trước merge. Không auto-merge trên protection rỗng.

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
