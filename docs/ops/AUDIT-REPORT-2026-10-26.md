# AUDIT-REPORT — DHCB · 2026-10-26

> Commit được rà: `c561b67b72a697f41035f489bb7bf5967e5c6b40` · Nhánh ban đầu: `work` · Múi giờ báo cáo: Asia/Ho_Chi_Minh.
> Phạm vi: audit sâu bốn luồng rủi ro và kiểm bổ trợ 13 nhóm ở mức ghi rõ dưới đây.
> Không sửa application source, test, manifest hoặc lockfile; chỉ thêm báo cáo. Không deploy/merge/rotate secret, gọi provider trả phí hoặc truy cập production.

## 1. Kết quả chính

| Mức      |  Mở | Đã sửa | Chấp nhận | Bác bỏ |
| -------- | --: | -----: | --------: | -----: |
| 🔴 Cao   |   4 |      0 |         0 |      0 |
| 🟠 Trung |  12 |      0 |         0 |      0 |

Bốn lỗi Cao đã được tái hiện và xác minh độc lập: mất tiến độ lần sync đầu, bypass chính sách context qua tool AI, bypass cầu dao AI của khách, restore báo thành công sau lỗi. Chưa đủ điều kiện kết luận sẵn sàng phát hành. Audit phát hiện và báo cáo đã hoàn tất theo phạm vi; phần khắc phục/hội tụ còn mở, `audit check --strict` dự kiến đỏ vì các finding này.

Bốn phát hiện mức Cao có [bộ bằng chứng có phiên bản và hướng dẫn chạy trong checkout khác](audit-evidence/2026-10-26/README.md). Nguồn tái hiện lưu dưới dạng `.txt`, chỉ được chuẩn bị/chạy chủ động trên dữ liệu thử; không sửa mã ứng dụng và không chạy tự động trong suite CI. Các đường dẫn `/workspace/.dhcb-cloud/audit/` còn lại là vị trí script/log của lần audit ban đầu, chỉ có trong instance này; dùng bộ portable để tái hiện bốn mục Cao. Bằng chứng bổ trợ và ảnh của các mục khác chưa được đóng gói. Không chạy regression trên DB thật của người dùng.

## 2. Phạm vi và ma trận luồng

`xt.py audit plan --json`: 5.067 file, 3.011 JS/TS, 487 UI, 102 SQL/schema/migration, 1.125 file test theo bộ dò, 6 workflow; 13 nhóm áp dụng. Bộ dò file test khác pattern Vitest, vì vậy không dùng1.125 làm số test đã chạy. Repository không có `BLUEPRINT.md`; không tạo/tick yêu cầu giả.

| Luồng             | A: biến thể đầu vào                                             | B: biến đổi chính                                                       | C: ngưỡng/biên                                             | D: đường phải tương đương                            |
| ----------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| Tiến độ/SRS       | hàng rỗng/có sẵn, local/cloud, retry, 2 thiết bị, reps/due lệch | localStorage → outbox → merge → transaction/upsert → pull               | version0/1, reps bằng/lớn hơn, ngày VN/UTC, CEFR authority | client/server merge; tuần tự/đồng thời               |
| AI/quyền riêng tư | user/guest, policy allow/DENY, JSON đúng/sai, tool đọc/đề xuất  | parse → auth → quota/policy → context/tool → model/result               | breaker bật/tắt, stress override/toggle, malformed body    | context trực tiếp/tool_result; chat/STT/TTS          |
| Thanh toán/quyền  | pending/paid/cancelled, txn trùng/mới, legacyPro/VIP            | webhook auth → lookup → payment update → grant transaction → read plan  | giá, expiry/grace24h, concurrent retry, daily usage        | webhook/manual match; enforce/display                |
| Backup/khởi chạy  | SQL hợp lệ/lỗi, gzip đầy đủ/bị cắt, CI/dev env, cookie đúng/giả | archive → shell pipeline → psql → exit/log; HTTP adapter → auth/handler | ON_ERROR_STOP/pipefail, file 0600/0644, Origin5173/5179    | Vite/Express; dump/restore; frozen dependency/deploy |

Nhóm đã rà đầy đủ theo công cụ: HAR doctor/validate/canary. Các nhóm ARCH/SEC/CODE/TEST/PERF/A11Y/DEP/CI/DOC/DATA/CFG/XFEAT được rà rút gọn theo luồng và công cụ bên dưới; không có tuyên bố đọc thủ công mọi file. Không đo CWV/p95/load production, không DAST/SSRF vào dịch vụ thật, không kiểm live branch protection, không full 1.400+ E2E, không human/acoustic/provider eval hay khôi phục backup production. Các giới hạn này không phải kết quả đạt.

## 3. Kiểm chứng và cổng

Các run hợp lệ dùng Node 22.23.4/npm 10.9.9. Full unit/coverage bỏ DATABASE_URL, MIGRATE_DATABASE_URL và ALLOWED_ORIGINS như job unit CI; test PostgreSQL chạy riêng trên DB disposable. Coverage report ở `/workspace/.dhcb-cloud/audit/coverage-ci/`.

| Kiểm tra                                                                                                                                                                      |        Exit | Kết quả thực tế                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------: | --------------------------------------------------------------------------------------------------- |
| `NODE_ENV=production npm run build`                                                                                                                                           |           0 | Web chính, packages, Express và Hub build được                                                      |
| `npm run typecheck`, `npm run lint`, `npm run format:check`                                                                                                                   |  0 mỗi lệnh | Không lỗi/warning theo gate                                                                         |
| `npm run size`                                                                                                                                                                |           0 | JS 136,87/160 kB (85,54%, dư 23,13); CSS 23,76/26 kB (91,38%, dư 2,24); startup coverage 9/9 file   |
| `npm run size:chunks`                                                                                                                                                         |           0 | 111 chunk chương, tổng 822,9 kB brotli, không chunk vượt ngân sách                                  |
| `env -u DATABASE_URL -u MIGRATE_DATABASE_URL -u ALLOWED_ORIGINS npm run test:coverage -- --maxWorkers=4 --coverage.reportsDirectory=/workspace/.dhcb-cloud/audit/coverage-ci` |           0 | 1.009 file đạt, 5 file skip; 22.537 test đạt, 35 skip                                               |
| Coverage statements / branches / functions / lines                                                                                                                            |           0 | 96,08 / 92,05 / 96,97 / 96,78%; sàn 94 / 90 / 94 / 94; dư 2,08 / 2,05 / 2,97 / 2,78 điểm            |
| Full unit với allowlist dev cũ chỉ cổng 5179                                                                                                                                  |           1 | 22.528 đạt, 9 fail, 35 skip; chẩn đoán Origin fixture 5173 bị từ chối, không quy thành lỗi sản phẩm |
| File `auth.changePassword.test.ts` sau sửa môi trường                                                                                                                         |           0 | 20/20 đạt; helper local đã cho cả 5173 và 5179                                                      |
| Suites mục tiêu hiện có của billing / learning / context-tools                                                                                                                | 0 mỗi suite | 270 / 136 / 79 test đạt; có phần chồng full suite, không cộng làm test mới                          |
| `npm run check:sql`                                                                                                                                                           |           0 | 686 câu PREPARE thật; 1 miễn theo allowlist; 3 câu động chưa kiểm                                   |
| `npm run codemap -- cycles`                                                                                                                                                   |           0 | Không có chu trình import                                                                           |
| `npm run check:specs`, `check:protocol`, `check:docs`                                                                                                                         |  0 mỗi lệnh | 191 spec không có path thiếu; protocol/docs consistency đạt                                         |
| `npm audit --omit=dev --json`                                                                                                                                                 |           0 | 0 vulnerability theo registry cho dependency production                                             |
| Gitleaks v8.24.3 `git --all --redact=100`                                                                                                                                     |           1 | 1.622 commit, 22 finding đã triage; không đồng nghĩa 22 secret thật đang hoạt động                  |
| Chromium/axe capture                                                                                                                                                          |           0 | 12 tổ hợp thật + 4 ảnh fixture catalog; 0 A/AA violation ở mẫu, contrast còn incomplete             |
| `xt.py doctor --json`, `xt.py validate`                                                                                                                                       |  1 mỗi lệnh | Guard/template lỗi như finding; warning còn ghi riêng                                               |
| `xt.py audit check docs/ops/AUDIT-STATUS.md`                                                                                                                                  |           0 | Sổ đúng schema: 4 Cao, 12 Trung mở                                                                  |

Log đầy đủ: `/workspace/.dhcb-cloud/audit/gates/`. Regression mới cố ý đỏ nằm trong `verify/`, `verify-ops/`, `learning/`, `billing/`, `ai-privacy/`; không trộn số của chúng vào pass count full suite. Bốn finding Cao đều có đối chứng và một reviewer khác tái hiện. Không có claim 3 run sạch liên tiếp hay full E2E.

## 4. Phát hiện chi tiết

### AUD-DATA-001 🔴 — Hai lần đồng bộ đầu tiên có thể ghi đè tiến độ của nhau

- **Vị trí:** `apps/server/src/api/core/progress.ts:310; apps/server/src/api/core/progress.ts:385`.
- **Bằng chứng:** đo được: PostgreSQL thật: khi chưa có learning_progress, hai SELECT FOR UPDATE cùng trả rỗng. Hai request gửi cat và dog đều HTTP 200/conflict:false; upsert cuối chỉ giữ một từ. Đối chứng tuần tự và đồng thời trên dòng đã tồn tại giữ được cả hai. Version vẫn tăng nên không báo mất dữ liệu.
- **Gate/tái hiện:** [README bộ bằng chứng portable](audit-evidence/2026-10-26/README.md), gate `AUD-DATA-001` — progress: hiện exit 1 với 1 regression đỏ và 2 đối chứng đạt. Output gốc được ghi trong báo cáo quan sát đi kèm bộ bằng chứng.
- **Xác minh:** audit_learning → audit_verify; primary đã đối chiếu SELECT và upsert.
- **Đề xuất:** Tạo/khóa một hàng ổn định trước khi đọc state, hoặc khóa theo user xuyên tiến trình; sau đó merge trong cùng transaction. Bổ sung regression hai request đầu tiên trên DB rỗng.
- **Giới hạn:** Dữ liệu thử và DB disposable; chưa đo tần suất xảy ra trên production.

### AUD-SEC-001 🔴 — Tool AI đưa lại ghi chú đã bị cấm inject_context

- **Vị trí:** `packages/core-personal/companionTools.ts:304; packages/core-personal/contextEngine.ts:326; packages/core-ai/anthropicToolLoop.ts:292`.
- **Bằng chứng:** đo được: Cùng một ghi chú giả: trước DENY, context và search_notes đều đọc được. Sau DENY(authoritative_domain_state,inject_context,work), ContextEngine loại ghi chú nhưng search_notes vẫn được offer và trả nội dung đó. Tool loop thêm kết quả vào tool_result cho model. Đối chứng user khác không đọc được ghi chú.
- **Gate/tái hiện:** [README bộ bằng chứng portable](audit-evidence/2026-10-26/README.md), gate `AUD-SEC-001` — policy: hiện exit 1 vì ghi chú bị DENY vẫn xuất hiện trong tool result; có đối chứng quyền sở hữu. Output gốc được ghi trong báo cáo quan sát đi kèm bộ bằng chứng.
- **Xác minh:** audit_ai_privacy → audit_verify; primary rà đường searchNotes và tool_result.
- **Đề xuất:** Áp cùng kiểm tra policy/sensitivity tại tool boundary trước khi trả dữ liệu cho model; DENY phải giữ hiệu lực qua đường context và tool. Kiểm cả offer lẫn execute, không chỉ ẩn tool.
- **Giới hạn:** Chứng minh bypass cấm inject_context của chính chủ, không phải IDOR. Chưa gọi provider hay chứng minh dữ liệu thật đã rời production; tác động khi đường tool/model này được dùng.

### AUD-CFG-001 🔴 — Khách vẫn gọi chat/STT khi cầu dao AI đã bật

- **Vị trí:** `packages/core-auth/actorUsage.ts:37; packages/core-ai/ai.ts:271; packages/core-ai/stt.ts:112`.
- **Bằng chứng:** đo được: Settings giả aiCircuitBreaker=true: STT tài khoản trả 429 và không gọi provider; STT và chat của khách trả 200, mỗi đường gọi provider giả. Khi breaker tắt, khách hoạt động đúng. TTS cache-miss có kiểm breaker riêng, nên các đường gọi không đồng nhất.
- **Gate/tái hiện:** [README bộ bằng chứng portable](audit-evidence/2026-10-26/README.md), gate `AUD-CFG-001` — breaker: hiện exit 1 vì provider giả vẫn được gọi khi breaker bật; đối chứng không gọi provider thật. Output gốc được ghi trong báo cáo quan sát đi kèm bộ bằng chứng.
- **Xác minh:** audit_billing → audit_verify_ops; primary đối chiếu actorUsage.
- **Đề xuất:** Kiểm global breaker trước mọi nhánh user/guest và trước gọi provider; thêm regression xuyên chat/STT/TTS.
- **Giới hạn:** Quota khách vẫn hiệu lực. Không gọi là sử dụng vô hạn; không phát sinh chi phí provider trong audit.

### AUD-DATA-002 🔴 — Restore có thể báo thành công sau dump lỗi hoặc gzip hỏng

- **Vị trí:** `scripts/restore-pg-from-r2.ts:205; scripts/restore-pg-from-r2.ts:215; scripts/restore-pg-from-r2.ts:220`.
- **Bằng chứng:** đo được: Sau DROP/CREATE, script chạy gunzip | psql không pipefail/ON_ERROR_STOP. Chỉ dùng SELECT trên DB disposable đã tái hiện: SQL lỗi rồi SELECT hợp lệ → pipeline0; gzip thiếu footer → pipeline0. Controls ON_ERROR_STOP trả3, pipefail trả1. Script sau đó xóa file tải về và in thành công.
- **Gate/tái hiện:** [README bộ bằng chứng portable](audit-evidence/2026-10-26/README.md), gate `AUD-DATA-002` — restore: hiện exit 1 với SQL/gzip lỗi bị báo thành công; chỉ trích bước nạp an toàn và không chạy DROP/CREATE. Output gốc được ghi trong báo cáo quan sát đi kèm bộ bằng chứng.
- **Xác minh:** runtime_workflow → audit_verify và audit_verify_ops; primary rà source.
- **Đề xuất:** Kiểm archive trước bước phá hủy; bật pipefail và psql -v ON_ERROR_STOP=1; giữ backup khi lỗi và kiểm invariant dữ liệu trước báo thành công.
- **Giới hạn:** Không chạy script restore thật, DROP/CREATE hay backup production. Đây là kiểm semantics an toàn, không phải chứng nhận khôi phục toàn bộ backup.

### AUD-CODE-001 🟠 — Ba API đọc sai hợp đồng readJsonBody

- **Vị trí:** `apps/server/src/api/personal/ambient-vision.ts:52; apps/server/src/api/personal/neuro-affective.ts:47; apps/server/src/api/platform/a2a.ts:54`.
- **Bằng chứng:** đo được: readJsonBody trả {ok,raw}; caller dùng wrapper như payload. Ambient POST hợp lệ → 500 trước provider; neuro stressOverride80/toggle bị bỏ qua dù200 và JSON hỏng cũng 200; A2A message đạt schema vẫn 400 báo thiếu message. Routes được đăng ký, UI gọi Ambient/Neuro. Không có feature gate loại bỏ các đường lỗi.
- **Gate/tái hiện:** tay: chạy verify/vitest.config.mjs để xem 7 kiểm tra xác nhận (exit0); regression yêu cầu payload hợp lệ gọi đúng service, Ambient2xx, neuro giữ override/toggle, A2A không báo thiếu message. Log verify/handlers.log.
- **Xác minh:** audit_ai_privacy → audit_verify, 7 checks; primary rà validation.ts và A2A.
- **Đề xuất:** Kiểm parsed.ok, dùng parsed.raw rồi validateBody; trả400 cho JSON/payload sai. Viết contract tests dùng parser thật thay vì mock wrapper lệch hợp đồng.
- **Giới hạn:** Các provider và boundary auth/DB được fake ở kiểm handler; không kết luận lỗi provider thật.

### AUD-XFEAT-001 🟠 — SRS client và server không hội tụ khi reps bằng nhau

- **Vị trí:** `apps/dhcb/src/lib/progressSync.ts:513; apps/server/src/api/_lib/progressMerge.ts:50`.
- **Bằng chứng:** đo được: Local reps3/due100 và cloud reps3/due200: server chọn due200, client luôn giữ due100. Sau hai lần pull local vẫn cũ và enqueue thêm sync. Hai đối chứng reps cloud/local cao hơn hoạt động đúng.
- **Gate/tái hiện:** `./node_modules/.bin/vitest run --config /workspace/.dhcb-cloud/audit/verify/srs.config.ts --maxWorkers=1` → exit1: 1 regression đỏ, 2 đối chứng đạt; verify/srs.log.
- **Xác minh:** audit_learning → audit_verify.
- **Đề xuất:** Dùng cùng luật tie-break khi merge SRS ở client/server; thêm invariant pull lặp lại phải hội tụ và không phát sinh outbox thừa.
- **Giới hạn:** Server vẫn giữ lịch mới; tác động đã đo là local ôn sớm/lịch cũ và sync thừa, không phải mất lịch mới ở DB.

### AUD-XFEAT-002 🟠 — Vite làm mất cookie nên không duy trì đăng nhập thật

- **Vị trí:** `scripts/lib/apiEdgeDevMiddleware.ts:48; packages/core-auth/security.ts:665`.
- **Bằng chứng:** đo được: Cùng session thật của user giả: Express trả 200 đúng user, Vite trả401. Adapter chỉ chuyển content-type/authorization trong khi auth chỉ chấp nhận cookie. Thiếu cookie/cookie giả/chỉ Bearer đều 401 ở cả hai. Đã dùng Vite riêng tránh rate bucket chung; 8 trường hợp có kiểm soát.
- **Gate/tái hiện:** tay: tạo user/session disposable và gửi cùng Cookie GET /api/auth?action=me tới Vite/Express; kỳ vọng đều 200. Repro verify/dev-auth-isolated.mts và .log xác nhận chênh lệch hiện tại, không log token.
- **Xác minh:** primary phát hiện source → audit_verify kiểm 8 HTTP cases độc lập.
- **Đề xuất:** Giữ đầy đủ header cần thiết và parity CSRF/Origin với Express; thêm smoke cookie thật, không chỉ mock page.route.
- **Giới hạn:** Lỗi workflow npm run dev; không khẳng định production Express mất đăng nhập. Vite riêng5184 đã dừng và fixture đã dọn.

### AUD-XFEAT-003 🟠 — Góc học tập dev nhận HTML thay danh mục JSON

- **Vị trí:** `apps/dhcb/vite.config.ts:377; apps/server/src/routes.ts:352; apps/dhcb/src/lib/subjectApi.ts:80`.
- **Bằng chứng:** đo được: GET dev /api/subjects →200 text/html/doctype SPA vì thiếu trong API_ROUTES; /mon-hoc → /goc-hoc-tap hiện Không tải được dữ liệu ở cả hai theme/kích thước. Express có đăng ký endpoint. Primary đã mở ảnh lỗi và ảnh ready có fixture riêng.
- **Gate/tái hiện:** tay: GET dev /api/subjects phải có JSON đúng contract và mở /goc-hoc-tap thấy6 môn; ui/catalog-http.log hiện ghi HTML. Ảnh ui/subjects-blue-sky-390.png.
- **Xác minh:** audit_learning(UI) → primary rà route table, HTTP log và ảnh.
- **Đề xuất:** Bổ sung route/proxy dev và kiểm contract endpoint thật; mở rộng parity check route table để tránh bỏ sót các API mới.
- **Giới hạn:** Không dùng ảnh catalog fixture để tuyên bố endpoint đã chạy. Chưa kết luận production catalog lỗi.

### AUD-CI-001 🟠 — Deploy tự chuyển từ npm ci sang npm install khi lỗi

- **Vị trí:** `scripts/deploy.sh:70`.
- **Bằng chứng:** đo được: Fake npm an toàn: ci exit17 → install exit0 → toàn biểu thức exit0. Nhánh fallback có thể resolve/mutate dependency khác lockfile đã qua CI thay vì dừng deploy.
- **Gate/tái hiện:** tay: chạy verify-ops/deploy-fallback.py; đối chứng frozen-only giữ exit17. Sau sửa, lỗi npm ci phải dừng deploy, không gọi install. Evidence verify-ops/deploy-independent.json.
- **Xác minh:** runtime_workflow → audit_verify_ops.
- **Đề xuất:** Bỏ fallback npm install; fail-closed và chẩn đoán nguyên nhân ci lỗi trước deploy.
- **Giới hạn:** Không chạy deploy, git reset hay package manager trên production; witness chỉ là hàm npm giả.

### AUD-SEC-002 🟠 — SSH deploy không xác minh fingerprint VPS

- **Vị trí:** `.github/workflows/deploy.yml:37`.
- **Bằng chứng:** đo được: Workflow không truyền fingerprint. Đã đọc source đúng action SHA và dependency: easyssh dùng ssh.InsecureIgnoreHostKey khi fingerprint trống. GITHUB_TOKEN được forward qua SSH; giả mạo host trên đường mạng/DNS có thể nhận token/lệnh deploy.
- **Gate/tái hiện:** tay: cấu hình fingerprint được lấy từ kênh tin cậy; thử với host key không khớp phải từ chối trước gửi env/lệnh. Chưa thực hiện MITM. Upstream evidence audit/harness/easyssh.go và ssh-action.yml.
- **Xác minh:** runtime_workflow → primary xác nhận cấu hình trống và upstream insecure default.
- **Đề xuất:** Pin SSH host fingerprint, lấy/xác minh qua kênh độc lập và quản lý thay đổi host key; giữ pin SHA action hiện có.
- **Giới hạn:** Không nói private SSH key bị gửi đi. Chưa đo live deployment/network attack.

### AUD-SEC-003 🟠 — Restore in nguyên URL database có thể chứa mật khẩu

- **Vị trí:** `scripts/restore-pg-from-r2.ts:212; scripts/restore-pg-from-r2.ts:221`.
- **Bằng chứng:** đo được: targetUrl chỉ thay tên database, giữ user/password từ RESTORE_PSQL_URL; console.log in nguyên URL. Script yêu cầu URL quyền cao cho restore, nên log thành công có thể chứa credential superuser. Primary tái hiện phép thay URL bằng giá trị tổng hợp, không đọc secret thật.
- **Gate/tái hiện:** tay: chạy phần dựng/log hướng dẫn với URL synthetic và assert không có password trong output; root-review/checks.json xác nhận hiện còn giữ password.
- **Xác minh:** runtime_workflow → primary.
- **Đề xuất:** Không log connection string; chỉ in host/database đã lọc hoặc hướng dẫn dùng biến môi trường, bảo vệ cả error log của subprocess.
- **Giới hạn:** Không chứng minh credential thật hiện có trong log production; xác nhận code path có thể làm lộ.

### AUD-SEC-004 🟠 — File giải mã backup không ép quyền riêng tư

- **Vị trí:** `scripts/restore-env-from-r2.ts:93; scripts/restore-system-from-r2.ts:86`.
- **Bằng chứng:** đo được: writeFileSync không mode; với umask 022 file mới là 0644. Đã đo bằng nội dung giả. system-restored.tar.gz không được Git ignore; file có thể chứa environment/crontab. Người dùng khác đọc được nếu thư mục cha cho phép traversal.
- **Gate/tái hiện:** tay: tạo output bằng dữ liệu giả dưới umask 022 và kiểm stat; kỳ vọng0600. root-review/checks.json và harness/restore-artifact-ignore.json.
- **Xác minh:** runtime_workflow → primary tái hiện mode và rà hai writeFileSync.
- **Đề xuất:** Ghi file mới với mode 0600 và bảo vệ file đã tồn tại, ưu tiên thư mục riêng; thêm ignore cho output nhạy cảm và hướng dẫn dọn sau restore.
- **Giới hạn:** Khả năng truy cập còn phụ thuộc quyền thư mục/host; không tuyên bố đã lộ nội dung thật trong workspace này.

### AUD-HAR-001 🟠 — Guard cài đặt thiếu hai chốt mà doctor yêu cầu

- **Vị trí:** `.claude/hooks/guard.py:1476; .xtemplates/scripts/xt.py:4395`.
- **Bằng chứng:** đo được: Canary truyền chuỗi JSON vào guard, không thực thi lệnh: git config core.hooksPath /dev/null và codex exec --yolo x không có quyết định chặn. Đối chứng force push/curl-pipe-sh bị deny; claude --bare hỏi. doctor báo error tương ứng.
- **Gate/tái hiện:** `python3 .xtemplates/scripts/xt.py doctor --json` hiện exit1; kiểm thêm harness/guard-canaries.json. Không chạy các lệnh nguy hiểm mẫu để kiểm.
- **Xác minh:** runtime_workflow → primary chạy doctor độc lập và đối chiếu canary/source.
- **Đề xuất:** Cập nhật harness bằng installer chính chủ sau khi review tương thích và giữ hook riêng; thêm canary regression. Không coi guard là sandbox.
- **Giới hạn:** Sandbox bên ngoài vẫn là lớp bảo vệ; finding về guard/harness, không phải bằng chứng vượt sandbox hiện tại.

### AUD-HAR-002 🟠 — Framework vendored thiếu template PLAN được bốn link tham chiếu

- **Vị trí:** `.xtemplates/framework/templates/PLAN.md (thiếu); .xtemplates/framework/11-autonomous-loop/README.md:57`.
- **Bằng chứng:** đo được: xt.py validate exit1: bốn liên kết cùng trỏ template PLAN.md không tồn tại. doctor vì vậy báo framework error; đây là một lỗi đóng gói/đường dẫn, không phải bốn lỗ hổng bảo mật.
- **Gate/tái hiện:** `python3 .xtemplates/scripts/xt.py validate` phải exit0; root-review/framework-validate.log hiện exit1.
- **Xác minh:** runtime_workflow → primary chạy validate độc lập.
- **Đề xuất:** Sửa ở nguồn framework/installer chính chủ rồi cài lại; không vá tay thư mục vendored trong đợt audit.
- **Giới hạn:** Chưa kiểm bản upstream mới đã sửa hay chưa.

### AUD-DOC-001 🟠 — Tài liệu cloud gọi setup/maintenance script không tồn tại

- **Vị trí:** `AGENTS.md:11; docs/CODEX_CLOUD_SETUP.md:25; scripts/archive/codex-cloud-setup.sh:7`.
- **Bằng chứng:** đo được: scripts/codex-cloud-setup.sh và maintenance không tồn tại; chỉ có bản archive. Bản archive tính PROJECT_DIR từ dirname/.. nên trỏ scripts thay vì root sau khi chuyển. Làm đúng hướng dẫn repo không bootstrap được checkout mới.
- **Gate/tái hiện:** tay: làm theo quickstart cloud từ checkout sạch bằng script tồn tại, đúng root và không sửa source/lockfile. root-review/checks.json xác nhận path thiếu.
- **Xác minh:** primary trong onboarding → runtime_workflow rà lại độc lập.
- **Đề xuất:** Khôi phục entrypoint được hỗ trợ hoặc cập nhật tài liệu tới quy trình mới đã kiểm chứng; không chạy archive nguyên trạng.
- **Giới hạn:** Instance hiện tại đã có installer ngoài checkout; finding về khả năng tái lập từ hướng dẫn repository.

### AUD-SEC-005 🟠 — Lịch sử có credential cũ, chưa có bằng chứng thu hồi

- **Vị trí:** `scripts/deploy.sh:59–60 tại f6e0caa7e6a5; PRONUNCIATION_CACHE_SETUP.md:68 tại 0a110bbdbcc1; PROGRESS.md:623`.
- **Bằng chứng:** đo được: Gitleaks --all --redact=100 quét 1.622 commit thấy 22 finding: 19 fixture/giá trị không bí mật, 2 dòng VAPID lịch sử và 1 JWT gán SUPABASE_SERVICE_ROLE_KEY lịch sử. Public VAPID không phải secret; private half là phơi lộ đã được PROGRESS ghi cần xoay. File JWT đã xóa; chưa biết token thật/còn hiệu lực hay đã thu hồi.
- **Gate/tái hiện:** tay: chủ dự án đối soát rotation/revocation qua giao diện quản trị phù hợp, không gửi secret trong chat. harness/gitleaks-triage.json lưu metadata đã che; việc xóa file không đóng gate thu hồi.
- **Xác minh:** runtime_workflow triage → primary đọc metadata đã che và mục việc tay PROGRESS.
- **Đề xuất:** Xác nhận/ghi bằng chứng đã thu hồi; nếu còn hiệu lực thì xoay/thu hồi ở provider và cập nhật cấu hình an toàn. Không thử credential cũ với API trong audit.
- **Giới hạn:** Phơi lộ lịch sử được xác nhận; tình trạng credential hiện tại là chưa biết. Không gọi đây là secret thật đang dùng ở HEAD.

## 5. Kiểm tra âm tính, ứng viên không nâng mức và vấn đề môi trường

- Ở các API Personal đã rà, user/person scoping chặn đọc chéo; đối chứng privacy tool của user khác không đọc marker. Proposal/capability có ownership và transaction checks. Đây là kết quả trên phạm vi đã thử, không chứng minh mọi API an toàn.
- Progress existing-row concurrency, replay tuần tự, CEFR exam/unlock giả mạo và ngày VN/UTC đạt các kiểm tra hiện có. Test concurrency trước đây seed sẵn hàng nên không chạm race hàng chưa tồn tại.
- Billing retry cùng txn hoạt động đúng. Candidate chuyển khoản thứ hai cùng invoice có txn mới: đã đo không thêm receipt, nhưng yêu cầu cấp quyền/refund cho ca này chưa rõ; cần chốt reconciliation policy, không gọi đây là lỗi cấp VIP vô hạn hoặc khẳng định phải grant hai lần. Candidate legacy `payments.plan=pro` thành paid nhưng helper giữ Free có repro, song checkout mới chỉ tạoVIP và đơn cũ thường hết grace; chưa nâng thành rủi ro hiện tại chung. Chi tiết `billing/report.md`.
- CI action ngoài đã pin SHA; token CI mặc định read-only; không thấy `pull_request_target` chạy PR với production secrets trong workflow đã rà. Các ngoại lệ CodeQL/secret-scan advisory và npm audit endpoint fail-open đã được ghi chủ đích; không trình bày như bypass vô tình.
- Doctor còn warn thiếu TaskCompleted/SubagentStop và PROGRESS158.622byte; thiếu timeout ở metadata/release là nợ vận hành. Không gộp bốn link cùng template thiếu thành bốn lỗ hổng.
- Build đầu tiên dùng NODE_ENV=test nên JS 185,63 kB/160; build production đúng cho 136,87 kB/160. Đây là sai môi trường đo, đã bác bỏ finding vượt budget. Hướng dẫn môi trường do phiên setup trước lưu thiếu override production; đã sửa `start_skill`, không tăng ngưỡng hay sửa source. Helper cũng đã sửa allowlist local cho cả cổng 5173 và 5179, kiểm riêng 20 test auth đạt; installer sửa cấu hình được chạy lại trước kết thúc.
- Lần coverage đầu bị sandbox chặn socket/subprocess, đã hủy và không tính làm run hoàn tất. Một lần đo khác còn khóa PID zombie; lần cuối dùng report directory riêng. Unit/coverage với ALLOWED_ORIGINS=localhost:5179 làm9 test change-password dùng Origin5173 nhận 403; bỏ override và chạy riêng 20/20 đạt. Đây là môi trường/fixture mismatch, không kết luận9 lỗi sản phẩm; kết quả full runner cuối ghi riêng ở mục3.
- Không khẳng định đã đạt tiêu chí 3 lượt suite sạch liên tiếp hay hoàn thành mọi ô trên dữ liệu production. Các repro chủ động đỏ là bằng chứng bug mới, tách khỏi suite hiện có và coverage gate.

## 6. Kế hoạch sửa đề xuất cho tác vụ tiếp theo

| Đợt | Finding                                | Thay đổi nhỏ nhất                                    | Gate cần giữ                                                          |
| --- | -------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | AUD-CFG-001                            | Cầu dao chung user/guest trước provider              | chat/STT/TTS bật/tắt, quota và hoàn lượt                              |
| 2   | AUD-SEC-001                            | Policy/sensitivity ở tool boundary                   | DENY không vào context/tool_result; owner/cross-user controls         |
| 3   | AUD-DATA-001                           | Khóa được state ngay lần sync đầu                    | PG mới/có sẵn, 2 request, retry/version/CEFR                          |
| 4   | AUD-DATA-002, AUD-SEC-003, AUD-SEC-004 | Restore fail-closed, kiểm archive, bảo vệ log/output | dump lỗi/hỏng, exit status, mode 0600; restore thử trên DB disposable |
| 5   | AUD-CODE-001, AUD-XFEAT-001            | Parser contract và merge tie-break                   | handler payload thật, malformed JSON, SRS convergence                 |
| 6   | AUD-XFEAT-002, AUD-XFEAT-003           | Dev HTTP/header/route parity                         | cookie thật và catalog JSON, E2E không che bằng mock                  |
| 7   | AUD-CI-001, AUD-SEC-002                | Frozen install và pin SSH host                       | ci lỗi phải dừng; host key sai phải từ chối                           |
| 8   | AUD-HAR-001/002, AUD-DOC-001           | Cập nhật harness/docs từ nguồn hỗ trợ                | doctor/validate0, bootstrap checkout sạch                             |

Đây là kế hoạch review được, chưa triển khai sửa ứng dụng trong yêu cầu audit. Thu hồi credential lịch sử (`AUD-SEC-005`) cần chủ dự án đối soát ở provider; không yêu cầu gửi giá trị trong chat. Không tự chấp nhận nợ thay chủ dự án và không tự merge/deploy.

## 7. Giao diện và bằng chứng an toàn

Chromium/axe trên 3 trang × 2 viewport 1440/390 × 2 theme blue-sky/dark-blue:12 trạng thái thật. Đã chụp và primary mở xem toàn bộ 16 PNG, gồm 4 ảnh catalog ready dùng fixture registry 6 môn để tách layout khỏi endpoint lỗi. Không overflow toàn trang, mỗi trang 1 h1, không duplicate headings/pageerror ở mẫu; axe A/AA 0 violation. `color-contrast` còn incomplete (gradient/trang trí), chưa chứng minh WCAG AAA, chưa rà theme kid hay mọi route.

Ảnh/metrics: `ui/results.json`, `ui/results-ready.json`, `ui/FINDINGS.md`, `ui/*.png`. UI ready fixture không được tính là API catalog dev đã hoạt động.

Gitleaks được tải từ release chính chủ v8.24.3 và kiểm checksum trước chạy; report luôn redact 100%. Không có dump env/process credential, token cookie hoặc giá trị secret trong báo cáo. Fixture DB tự dọn theo ID tạo bởi audit; không dùng DROP/CREATE cho chứng minh restore. Các server riêng để kiểm chứng đã dừng; không dừng dịch vụ của người dùng.
