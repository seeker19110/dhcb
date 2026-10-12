# AI Development Protocol — quy trình "kín" 5 vai cho DHCB

> Thêm 2026-09-19. Biến sơ đồ ý tưởng "5 AI: Product/UX → Design → Engineering → QA/DevOps →
> Documentation" thành **quy trình mà coding agent thi hành được trực tiếp trong repo này**:
> tên file artifact, schema hợp đồng, state machine có điều kiện chuyển đo được, luật khoá file
> và chạy song song, điều kiện sinh subagent, cổng QA, retry/escalation, quyền sửa file, và
> điều kiện tự commit/PR/merge.
>
> **Luật nền: protocol này KHÔNG tạo cơ chế mới khi repo đã có cơ chế tương đương.** Mọi "vai",
> "artifact", "cổng" dưới đây đều ánh xạ vào thứ đang chạy: `.claude/agents/*.md`,
> `docs/templates/dac-ta-tinh-nang.md`, `docs/specs/`, `docs/adr/`, `docs/changelog/`,
> `PROGRESS.md`, hook `.claude/hooks/*`, CI `quality` · `e2e` · `metadata`. Vai là **mũ đội**, không
> phải tiến trình chạy riêng — một phiên có thể đội lần lượt nhiều mũ, miễn là artifact của mỗi
> mũ được sinh ra đúng schema và không mũ nào tự chấm mũ trước nó (xem §4 luật độc lập).

## 0. Vị trí trong hệ tài liệu

Thứ tự ưu tiên khi mâu thuẫn (cao → thấp):

```text
Luật nền tảng / an toàn của hệ thống
  ↓
CLAUDE.md · AGENTS.md            (luật làm việc của repo — không tài liệu nào dưới đây được vượt)
  ↓
docs/specs/*.md đã "Approved"    (hợp đồng của đợt việc cụ thể)
  ↓
AI_DEVELOPMENT_PROTOCOL.md       (file này — QUY TRÌNH: vai, trạng thái, hợp đồng, cổng)
  ↓
AI_DEVELOPMENT_PIPELINES.md      (CHỌN MODEL/effort cho từng bước theo rủi ro — Astra/Sol/Terra/Luna)
  ↓
docs/framework/KIEN-TRUC-DIEU-PHOI-3-TANG.md   (cơ chế dispatch subagent — cách Engineering "chạy")
  ↓
Prompt của việc đang làm
```

Hai tài liệu AI_* bổ sung nhau, không thay nhau: **PROTOCOL nói "ai làm gì, khi nào được sang
bước sau"**; **PIPELINES nói "bước đó dùng model nào, effort bao nhiêu"**.

## 1. Bốn nguyên tắc làm quy trình "kín"

1. **Truyền artifact có cấu trúc, không truyền lời kể.** Vai sau chỉ đọc artifact của vai trước
   (đường dẫn file cụ thể, schema cụ thể — §3). "Agent trước bảo làm thế này" không phải đầu vào.
2. **Mỗi trạng thái có điều kiện chuyển ĐO ĐƯỢC** (§2). Không có "chắc là xong": chuyển trạng thái
   = có artifact + lệnh chứng minh trả về đúng kết quả, ngay lúc đó.
3. **Vai sau có quyền REJECT vai trước** bằng artifact `REJECT` (§3.6) có `owner` — reject không
   có owner là không hợp lệ. Lỗi không bao giờ "rơi vào khoảng trống giữa hai vai".
4. **Điều phối là luật, không phải LLM.** Ai chạy tiếp, task nào bị khoá, task nào chạy song song,
   đã đủ điều kiện merge chưa — trả lời bằng bảng luật §5 và bằng máy (CI, hook), không bằng
   suy luận của mô hình. LLM chỉ dùng cho việc cần reasoning (đặc tả, thiết kế, code, review).

## 2. State machine của một feature

Trạng thái ghi ở **dòng `Trạng thái:` trong header của file spec** (`docs/specs/<ngày>-<slug>.md`)
— đây là nguồn sự thật duy nhất về trạng thái, không ghi ở chỗ khác. Chữ trạng thái dùng đúng
mã tiếng Anh dưới đây để grep được (`rg "^> .*Trạng thái: \*\*[A-Z_]+\*\*" docs/specs`).

```text
NEW ─► SPECIFYING ─► SPEC_READY ─► DESIGNING ─► DESIGN_READY ─► IMPLEMENTING ─► IMPLEMENTED
                                                                                    │
                                                                                    ▼
                                                                                VERIFYING
                                                                              ┌─────┴─────┐
                                                                            FAIL         PASS
                                                                              │            │
                                                                              ▼            ▼
                                                                           FIXING ─►  DEPLOYING ─► DEPLOYED ─► DOCUMENTING ─► DONE
                                                                              │
                                                                              └──► VERIFYING (lặp; mỗi vòng ghi vào §Nghiệm thu của spec)
```

Không có mũi tên tắt. Riêng feature **không có giao diện** (script, API nội bộ, migration, tài
liệu) được đi `SPEC_READY → IMPLEMENTING` với điều kiện spec ghi rõ dòng
`DESIGN_SPEC: không áp dụng — lý do: ...` (Product ghi, không phải Engineering tự quyết).

### 2.1 Bảng điều kiện chuyển (cổng) — mỗi dòng phải kiểm được bằng máy hoặc bằng artifact

| Sang trạng thái | Vai chịu trách nhiệm | Artifact bắt buộc                                                                    | Cách kiểm (không đạt = chưa chuyển)                                                                                                                                                                                                                                                 |
| --------------- | -------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SPECIFYING`    | Product & UX         | file `docs/specs/<ngày>-<slug>.md` tạo từ `docs/templates/dac-ta-tinh-nang.md`       | file tồn tại, header có `Trạng thái: **SPECIFYING**`                                                                                                                                                                                                                                |
| `SPEC_READY`    | Product & UX         | FEATURE_SPEC đủ 6 ô + khối `feature:` (§3.1)                                         | 0 ô trống; ô ④ ≥ 3 tiêu chí, **mỗi tiêu chí có lệnh chứng minh**; ô ① có "KHÔNG LÀM"; `states` liệt kê đủ `loading/empty/error` (nếu có UI); người dùng xác nhận (CLAUDE.md mục 3 "cổng giữa các giai đoạn") → ghi `Approved for implementation` + ngày                             |
| `DESIGNING`     | Design               | mục `## ⑦ DESIGN_SPEC` thêm vào cùng file spec, theo `docs/templates/design-spec.md` | mục tồn tại                                                                                                                                                                                                                                                                         |
| `DESIGN_READY`  | Design               | DESIGN_SPEC đủ schema §3.2                                                           | có layout desktop **và** mobile (390px) · mỗi `state` của FEATURE_SPEC có component tương ứng · mọi component ghi `reuse`/`compose`/`new` kèm đường dẫn; `new` phải có dòng "vì sao không reuse" · không hard-code màu (token `--a-*`) · Product xác nhận flow không bị đổi         |
| `IMPLEMENTING`  | Engineering          | `IMPLEMENTATION_PLAN` = `PLAN.md` theo schema §3.3, mỗi task đúng schema §3.4        | mọi task có `files`, `route`, `ac_refs` trỏ về AC của spec · không hai task song song cùng `files` (§5.2) · `codemap -- impact` đã chạy cho mọi file `modify` và dán kết quả vào ô ② của spec                                                                                       |
| `IMPLEMENTED`   | Engineering          | diff trên nhánh + ghi vào PLAN.md `status: implemented` cho từng task                | `npm run typecheck && npm run lint && npm run build && npm test` trả 0 **ngay trên nhánh đó** (hook `pre-commit-gate.sh` đã chặn commit khi type/lint/test đỏ; build phải chạy tay) · reviewer (`.claude/agents/reviewer.md`) kết luận **Đạt**                                      |
| `VERIFYING`     | QA & DevOps          | PR đã tạo (READY, không nháp), auto-merge squash đã gọi (CLAUDE.md mục 11)           | PR tồn tại, tiêu đề khớp regex `pr-policy.yml`, mô tả đủ 6 tiêu đề                                                                                                                                                                                                                  |
| `PASS`          | QA & DevOps          | `QA_REPORT` (§3.5) ghi vào mục "Nghiệm thu" của spec                                 | 3 required check `quality` · `e2e` · `metadata` xanh trên head hiện tại · **từng AC** của ô ④ có dòng "đạt + bằng chứng" (output thật, không phải "ok") · đợt có UI: ảnh chụp 1440px + 390px trước/sau đã nhìn (QUY-TRINH-AUDIT Tầng 8b) · rủi ro §7.2 đã chạy đủ cổng theo ma trận |
| `FAIL`          | QA & DevOps          | `REJECT` (§3.6) có `owner`                                                           | REJECT không có `owner` hoặc không có `expected/actual` → REJECT vô hiệu, QA phải viết lại                                                                                                                                                                                          |
| `FIXING`        | vai được `owner` chỉ | commit sửa + cập nhật PLAN.md                                                        | như `IMPLEMENTED`; sau đó QUAY LẠI `VERIFYING`, không được tự PASS                                                                                                                                                                                                                  |
| `DEPLOYING`     | QA & DevOps          | PR merged vào `main`                                                                 | `merged_at` có giá trị; deploy tự chạy qua `.github/workflows/deploy.yml` → `scripts/deploy.sh`                                                                                                                                                                                     |
| `DEPLOYED`      | QA & DevOps          | health check                                                                         | `GET https://en-vi.donghanhcungban.org/api/health` trả 200 sau deploy · có migration thì `npm run migrate:pg` trong `deploy.sh` đã chạy 0 · lỗi → rollback theo `docs/rollback-runbook.md`, trạng thái về `FIXING` với `owner: engineering`                                         |
| `DOCUMENTING`   | Documentation        | `DOC_DELTA` (§3.7)                                                                   | bảng quyết định §8 đã điền cho đủ 8 loại tài liệu                                                                                                                                                                                                                                   |
| `DONE`          | Documentation        | changelog + PROGRESS.md + docs đã đồng bộ, spec ghi `Trạng thái: **DONE**` + số PR   | file `docs/changelog/NNNN-<ngày>-<slug>.md` tồn tại và có số PR · `scripts/check-progress-freshness.sh` không cảnh báo · `npm run check:specs` xanh · mọi đường dẫn DOC_DELTA đánh `✓` đã thật sự có diff                                                                           |

**Luật chống tự tuyên bố:** `DONE` chỉ do vai Documentation ghi, sau khi `DEPLOYED`. Engineering
kết thúc ở `IMPLEMENTED`. "Code xong" ≠ "feature xong".

## 3. Hợp đồng giữa các vai (schema artifact)

Tất cả nằm trong **một file spec** (trừ PLAN.md và changelog) để hai PR song song không xung đột
file dùng chung (bài học TRAPS.md mục 1). Khối YAML đặt trong fence ```yaml để máy tách được.

### 3.1 CONTRACT 1 — `FEATURE_SPEC` (Product & UX → Design)

= file `docs/specs/<ngày>-<slug>.md` theo khuôn 6 ô hiện có, **cộng** khối máy đọc ngay dưới
header:

```yaml
feature:
  id: STUDY_PLAN_001 # CHỮ_HOA_SNAKE + số; là khoá tra cứu trong PLAN.md, changelog, PR
  name: AI Study Planner
  pillar: learning # learning | work | platform  (career · startup · life đã gỡ 2026-09-20)
  subject: english # chỉ khi pillar=learning; english | programming | math | ...
goal:
  user: student # persona; KHÔNG dùng giới tính làm trục (luật CLAUDE.md mục 2)
  objective: create_personalized_study_plan
scope:
  include: [create_plan, edit_plan, regenerate_plan]
  exclude: [teacher_management] # phải khớp ô ① "KHÔNG LÀM"
user_flow: [dashboard, create_plan, input_goal, generate, preview, confirm]
states: [loading, success, empty, error, offline] # đủ 3 mục loading/empty/error nếu có UI
ai_calls: # BẮT BUỘC có mục này — cây quyết định §6.3
  needed: true
  cached: true
  daily_limit_counted: true # mọi lệnh gọi AI phải đếm lượt Free/VIP
acceptance_criteria: # id trùng với checkbox ở ô ④
  - id: AC01
    text: Nhấn "Tạo lại" giữ nguyên các task đã hoàn thành
    proof: npm test -- studyPlan.regenerate
  - id: AC02
    text: ...
    proof: ...
risk: normal # normal | high — high khi chạm auth/thanh toán/lượt AI/migration/dữ liệu người dùng (§7.2)
design_spec: required # required | n/a — n/a phải kèm lý do ở dòng dưới
```

**Definition of Done của vai Product** (không được chuyển việc nếu còn): yêu cầu mơ hồ · thiếu AC
có lệnh chứng minh · thiếu user_flow · thiếu error state · thiếu ca biên quan trọng (rỗng, offline,
hết lượt AI, không đăng nhập, chiều B nếu là môn Anh).

### 3.2 CONTRACT 2 — `DESIGN_SPEC` (Design → Engineering)

= mục `## ⑦ DESIGN_SPEC` trong cùng file spec, khuôn đầy đủ ở `docs/templates/design-spec.md`.
Khối máy đọc:

```yaml
screen: study-plan
route: /hoc-tap/ke-hoach/:planId # theo quy ước URL mang tiêu đề (CLAUDE.md mục 7) nếu có id
layout:
  desktop: { columns: 2, regions: [PageHeader, Sidebar, Calendar, TaskList] }
  mobile: { columns: 1, regions: [PageHeader, Calendar, TaskList, BottomNav] }
components:
  - { name: PageHeader, source: reuse, path: apps/dhcb/src/components/PageHeader.tsx }
  - { name: Calendar, source: reuse, path: apps/dhcb/src/components/Calendar.tsx }
  - { name: StudyPlanForm, source: compose, from: [FormField, PrimaryButton] }
  - { name: AIButton, source: new, why_not_reuse: 'chưa có nút có trạng thái đếm lượt AI' }
tokens: { spacing: standard, typography: standard, color: --a-* only }
states:
  loading: StudyPlanSkeleton
  empty: EmptyStudyPlan
  error: StudyPlanError
  offline: OfflineBanner
a11y: { content: AAA, controls: AA, touch_min: 44px }
themes_checked: [blue-sky, dark-blue, kid]
```

Luật reuse-trước-create-sau (cây quyết định trong sơ đồ gốc) thi hành bằng cột `source`: agent
Design **phải chạy** `rg "export (default )?function <Tên>" apps/dhcb/src/components packages/core-ui`
trước khi ghi `new`, và dán kết quả (rỗng) vào ô "vì sao không reuse". Design **không được đổi**
`scope`/`user_flow`/`acceptance_criteria` — muốn đổi thì REJECT về `owner: product` (§3.6).

### 3.3 CONTRACT 3a — `IMPLEMENTATION_PLAN` (Engineering, đầu vào của coordinator)

= `PLAN.md` ở gốc worktree của đợt việc (**không bao giờ** commit vào repo — đã thêm vào
`.gitignore` cùng đợt này). Cấu trúc đúng như
`KIEN-TRUC-DIEU-PHOI-3-TANG.md` yêu cầu, cộng khối máy đọc:

```yaml
plan:
  feature: STUDY_PLAN_001
  spec: docs/specs/2026-09-19-study-plan.md
  branch: claude/<slug>
  contracts_first: # hợp đồng dùng chung PHẢI chốt trước khi tách song song
    - packages/core-contracts/studyPlan.ts
  migration: false # true → task riêng, route:spec, chạy TRƯỚC mọi task khác
  ai: { model_via: packages/core-ai/aiConfig.ts, cache: true, counted: true }
  tests_required: [unit, integration] # + e2e/a11y khi có UI (tự động qua CI)
tasks: [...] # mỗi phần tử theo §3.4
```

### 3.4 Schema TASK (đơn vị dispatch cho worker)

```yaml
- id: T1
  title: API POST /study-plans
  route: standard # complex | spec | standard | mechanical — bảng 3 tầng
  owner_role: backend # frontend | backend | db | docs
  files:
    modify: [apps/server/src/routes.ts]
    create: [apps/server/src/api/learning/studyPlans.ts]
    forbidden: [packages/core-billing/**] # vùng cấm đụng của task này
  depends_on: [T0] # T0 = contracts_first
  ac_refs: [AC01, AC02] # phải trỏ về AC thật của spec
  invariants: # từ ô ⑤ của spec — test canh
    - { text: 'user_id khớp token', test: apps/server/src/api/learning/studyPlans.test.ts }
  done_when: # lệnh + kết quả mong đợi, worker dán output thật
    - npx vitest run apps/server/src/api/learning/studyPlans.test.ts
  status: pending # pending | running | implemented | blocked
  blocked_reason: null
```

Worker **không thấy** spec/PLAN/hội thoại — coordinator phải chép đủ brief từ task vào prompt
(đường dẫn, quy ước ở ô ⑥, AC, bất biến). Thiếu brief là lỗi của Engineering, không phải worker.

### 3.5 CONTRACT 4 — `QA_REPORT` (QA & DevOps → Release)

Ghi vào mục "Nghiệm thu" của spec (khuôn đã có ở cuối `dac-ta-tinh-nang.md`), khối máy đọc:

```yaml
qa:
  feature: STUDY_PLAN_001
  pr: 1041
  head: 3f2a9c1
  checks: { quality: pass, e2e: pass, metadata: pass } # đọc từ GitHub, không từ trí nhớ
  gates_run: [static, unit, integration, e2e, a11y, visual, security] # theo ma trận §7.2
  acceptance:
    - { id: AC01, result: pass, evidence: 'vitest 3/3 passed — studyPlan.regenerate' }
    - { id: AC02, result: fail, evidence: '...' }
  visual: { before: shots/..., after: shots/..., viewed_by: qa } # bắt buộc nếu có UI
  verdict: PASS # PASS | FAIL
```

QA đọc **spec gốc** (AC, states, scope) chứ không chỉ đọc code. Mỗi AC = một dòng bằng chứng.

### 3.6 `REJECT` (bất kỳ vai nào → vai trước)

```yaml
reject:
  from: qa # product | design | engineering | qa | docs
  owner: backend # product | design | frontend | backend | db | docs — BẮT BUỘC
  type: acceptance_criteria # acceptance_criteria | design_deviation | spec_ambiguity | architecture | security | a11y | perf
  ref: AC01
  expected: completed_tasks_preserved
  actual: regeneration_deletes_completed_tasks
  evidence: 'npx vitest run ... → 1 failed: ...'
  proposed_fix: optional
```

Bộ định tuyến REJECT (deterministic, không cần LLM):

| `type`                              | `owner` mặc định                 | Trạng thái quay về |
| ----------------------------------- | -------------------------------- | ------------------ |
| `spec_ambiguity`                    | product                          | `SPECIFYING`       |
| `design_deviation`, `a11y` (layout) | design                           | `DESIGNING`        |
| còn lại                             | engineering (FE/BE/DB theo file) | `FIXING`           |

Một REJECT về `product` khi đang `IMPLEMENTING` trở đi = **đổi đặc tả giữa chừng** → phải ghi
quyết định vào spec (mục "Quyết định giữa chừng") và người dùng xác nhận lại AC đã đổi.

### 3.7 CONTRACT 5 — `DOC_DELTA` (Documentation → hệ thống)

Ghi trong file changelog của đợt (`docs/changelog/NNNN-...md`), mục "Tài liệu đã đồng bộ":

```yaml
doc_delta:
  feature: STUDY_PLAN_001
  pr: 1041
  changelog: docs/changelog/0380-2026-09-19-study-plan.md # ✓ luôn
  progress_md: ✓ | ✗ # ✓ chỉ khi "Tiếp theo"/nợ/việc tay thật sự đổi (CLAUDE.md mục 3)
  claude_md: ✗ # ✓ chỉ khi đổi luật/lệnh/cấu trúc mà mọi phiên phải biết
  project_md: ✗
  adr: ✗ | docs/adr/0008-....md # ✓ khi có quyết định kiến trúc khó đảo
  specs: ✓ # spec của đợt ghi DONE + số PR
  ops_docs: ✗ # deploy/env/rollback nếu đổi biến môi trường, dịch vụ, cron
  traps_md: ✗ # ✓ khi đợt này mắc một bẫy THẬT mới
```

## 4. Năm vai — ánh xạ vào cơ chế sẵn có

| Vai (mũ)        | Đầu vào                                                       | Đầu ra                           | Thi hành bằng (đã có)                                                                                            | Model gợi ý (PIPELINES)                |
| --------------- | ------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| 1 Product & UX  | yêu cầu người dùng · PROGRESS.md · specs cũ · docs/research   | FEATURE_SPEC                     | phiên chính (Tầng 1) + `AskUserQuestion` khi mơ hồ; khuôn `dac-ta-tinh-nang.md`                                  | Sol (Astra khi risk: high)             |
| 2 Design        | FEATURE_SPEC · design tokens `index.css` · components hiện có | DESIGN_SPEC                      | phiên chính hoặc subagent `standard-worker` với brief = FEATURE_SPEC; skill `ui-ux`                              | Sol                                    |
| 3 Engineering   | FEATURE_SPEC + DESIGN_SPEC + codemap                          | PLAN.md · diff · PR              | phiên chính viết PLAN.md → `coordinator` dispatch `route:` → workers → `reviewer`                                | theo bảng route (Opus/Sonnet/Haiku)    |
| 4 QA & DevOps   | spec (AC) · PR · CI · ảnh chụp                                | QA_REPORT / REJECT               | CI `quality`·`e2e`·`metadata` + `/gate merge` + `npm run test:coverage` + `shots:*` + `deploy.yml` + `/incident` | Sol (độc lập với phiên đã code — §4.1) |
| 5 Documentation | diff + 4 artifact trên                                        | DOC_DELTA · changelog · PROGRESS | `mechanical-worker`/`standard-worker` với bảng §8; `npm run changelog`; `check-progress-freshness.sh`            | Luna/Terra                             |

### 4.1 Luật độc lập của QA

QA **không được là cùng một ngữ cảnh** đã viết code của task đó khi có thể: gọi subagent QA mới
(brief = spec + số PR + head SHA, **không** kèm diff giải thích của Engineering) hoặc `reviewer`.
Khi phiên chính bắt buộc phải tự đội mũ QA (phiên đơn), phải: (a) đọc lại AC từ file spec, không
từ trí nhớ; (b) chạy lại từng lệnh `proof`, dán output; (c) nhìn ảnh chụp thật. Tự chấm bằng trí
nhớ là vi phạm CLAUDE.md mục 5.

## 5. Workflow controller — luật deterministic (không dùng LLM)

Controller hiện tại = **các file trạng thái + hook + CI**; chưa có script riêng (xem §10 việc kế
tiếp). Luật dưới đây là thứ script đó sẽ mã hoá, và là thứ mọi phiên phải tuân ngay từ bây giờ.

### 5.1 Ai chạy tiếp

Đọc `Trạng thái:` của spec → vai chịu trách nhiệm theo bảng §2.1. Trạng thái không có trong bảng
= lỗi, dừng.

### 5.2 Khoá file & chạy song song

- Tập file của task = `files.modify ∪ files.create`. Hai task được chạy song song **khi và chỉ khi**
  giao của hai tập rỗng **và** không task nào `depends_on` task kia.
- Kiểm bằng lệnh, không bằng mắt: với mỗi cặp task, so sánh danh sách; và trước dispatch chạy
  `npm run codemap -- impact <file>` cho mọi file `modify` — file là **hotspot** (`codemap -- hotspots`)
  thì task đó chạy **tuần tự**, không song song với bất kỳ task nào.
- Các file luôn coi là **khoá toàn cục** (chỉ một task được đụng trong một đợt, và task đó chạy
  cuối): `apps/server/src/routes.ts`, `apps/dhcb/src/index.css`, `tailwind.config.js`,
  `package.json`/`package-lock.json`, `postgres/migrations/*` (số migration cấp tuần tự bởi
  coordinator), `PROGRESS.md`, `CLAUDE.md`.
- Mỗi task song song chạy trong **worktree riêng** (`isolation: worktree`) — bài học TRAPS.md mục 5
  (nhiều tác nhân ghi song song trên một cây → nội dung nhân đôi/mất).

### 5.3 Thứ tự bắt buộc trong một đợt

```text
contracts_first (kiểu dùng chung, Zod schema)  →  migration (nếu có)  →  [BE ∥ FE]  →  integration  →  reviewer
```

### 5.4 Điều kiện merge (máy kiểm — không phiên nào được "quyết" thay)

`quality` ✅ ∧ `e2e` ✅ ∧ `metadata` ✅ ∧ `mergeable_state ≠ dirty` ∧ QA_REPORT `verdict: PASS`
∧ (risk: high → người dùng đã xác nhận ở `SPEC_READY`). Đủ → auto-merge đã bật tự làm; auto-merge
không bật được → tự merge squash ngay (CLAUDE.md mục 11). Thiếu bất kỳ vế nào → **cấm merge tay**.

## 6. Engineering — điều kiện sinh subagent & luật kiến trúc

### 6.1 Khi nào tự làm, khi nào spawn (bổ sung cho CLAUDE.md mục 3 "phân việc theo độ phức tạp")

| Tình huống                                                                    | Quyết định                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------ |
| PLAN.md có ≥ 2 task không giao file và tổng > ~150 dòng thay đổi              | spawn qua `coordinator`, chạy song song                |
| 1 task, đặc tả kín, ≤ 3 file                                                  | `standard-worker` hoặc tự làm                          |
| Task chạm hotspot / auth / billing / migration                                | **tự làm** (phiên chính), `route: spec` nếu đặc tả kín |
| Đổi tên hàng loạt, format, sinh index (`gen:lesson-index`, `gen:feature-map`) | `mechanical-worker`                                    |
| Không viết được brief đủ 4 mục (file · quy ước · AC · bất biến)               | **chưa được spawn** — quay về viết PLAN.md cho đủ      |

### 6.2 Architecture Guardian — checklist Engineering tự chặn trước khi báo `IMPLEMENTED`

```text
❌ logic trùng          → rg tên hàm/ý định trong packages/ trước khi viết mới
❌ component trùng      → DESIGN_SPEC cột source phải là reuse/compose trừ khi có "why_not_reuse"
❌ secret trong code    → rg -n "sk-|AKIA|BEGIN PRIVATE" (+ secret-scan.yml ở CI)
❌ vòng phụ thuộc       → npm run codemap -- cycles (không tăng so với main)
❌ vượt ranh giới gói   → ESLint chặn packages/ import apps/ hoặc api/
❌ API thừa             → mỗi endpoint mới phải có AC trỏ tới; không có → bỏ
❌ gọi AI thừa          → §6.3
❌ dependency thừa      → thêm gói npm = ADR nhỏ trong PR + npm ci trả 0 + commit lockfile
```

### 6.3 Cây quyết định gọi AI (bắt buộc trong FEATURE_SPEC `ai_calls` và trong code)

```text
Có cần AI không? ── không ──► logic cục bộ (packages/*), 0 chi phí
        │ có
        ▼
Cache có kết quả? (tts_cache / pronunciations / cache theo hash prompt) ── có ──► trả cache
        │ không
        ▼
Đếm lượt trước (Free 30/ngày tổng, VIP) ── hết ──► trạng thái "hết lượt" trên UI, KHÔNG gọi
        │ còn
        ▼
Model routing qua packages/core-ai/aiConfig.ts (rẻ trước; đổi model/prompt = chạy eval:tutor / eval:code-feedback + dán bảng vào PR)
```

## 7. QA & DevOps — cổng theo rủi ro

### 7.1 Đường ống kiểm chứng (ánh xạ vào lệnh thật)

| Bước             | Lệnh / nơi chạy                                                                    | Bắt buộc khi                 |
| ---------------- | ---------------------------------------------------------------------------------- | ---------------------------- |
| Static           | `npm run typecheck` · `npm run lint` · `npm run format:check`                      | luôn (CI `static`)           |
| Unit/Integration | `npm run test:coverage` (cổng thật của CI, không phải `npm test`)                  | luôn (CI `unit`)             |
| Build + boot     | `npm run build` · `node dist-server/server.js` + `/api/health`                     | luôn (CI `build`)            |
| Contract         | test Zod schema ở boundary + golden snapshot prompt                                | đổi API/prompt               |
| E2E              | `npm run test:e2e` (shard trên CI)                                                 | có UI/luồng                  |
| Visual           | `npm run shots:*` → nhìn ảnh 1440px + 390px trước/sau                              | có UI (Tầng 8b)              |
| A11y             | `e2e/a11y.spec.ts` + `e2e/a11y-aaa.spec.ts` (15 trang × 3 theme)                   | có UI                        |
| Security         | `secret-scan.yml` · rà `validateAuth()` trên handler mới · skill `security-review` | risk: high                   |
| Performance      | `npm run budget` (size-limit + coverage còn lại) · Lighthouse khi đổi trang chính  | đổi bundle/trang chính       |
| AI evaluation    | `npm run eval:tutor` / `npm run eval:code-feedback`                                | đổi prompt/model             |
| Audit toàn diện  | `docs/framework/QUY-TRINH-AUDIT.md`                                                | milestone / khi được yêu cầu |

### 7.2 Ma trận chọn cổng theo rủi ro (QA chọn, ghi vào `gates_run`)

| Feature chạm…                                                               | Cổng tối thiểu ngoài static/unit/build                                                                           |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Chỉ tài liệu/script                                                         | `check:specs`, `changelog.test`, `check-progress-freshness`                                                      |
| UI                                                                          | e2e + a11y + visual (2 breakpoint × 3 theme)                                                                     |
| API mới / đổi hợp đồng                                                      | contract + integration + rà `validateAuth()`                                                                     |
| Prompt / model                                                              | golden snapshot + eval + bảng so baseline trong PR                                                               |
| Auth · thanh toán · lượt AI · dữ liệu người dùng · migration (`risk: high`) | tất cả + security + test idempotency/concurrency (AGENTS.md) + người dùng xác nhận; migration phải rollback được |

### 7.3 DevOps sau PASS

```text
merge (squash) → deploy.yml → scripts/deploy.sh (npm ci, build, migrate:pg, pm2 reload) → /api/health
       └── health FAIL → docs/rollback-runbook.md → trạng thái FIXING, owner: engineering → /incident nếu ảnh hưởng người dùng thật
```

## 8. Documentation — bảng quyết định "sửa tài liệu nào"

Không cập nhật máy móc tất cả. Với mỗi loại, trả lời có/không **kèm lý do một dòng**:

| Tài liệu              | Sửa khi                                                                    | Không sửa khi                          |
| --------------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| `docs/changelog/NNNN` | **luôn** — một file mới, số từ `npm run changelog`                         | —                                      |
| `PROGRESS.md`         | "Tiếp theo" đổi · nợ mở/đóng · việc tay mới · quyết định mới               | chỉ là chi tiết đợt việc (→ changelog) |
| `CLAUDE.md`           | đổi lệnh/luật/cấu trúc mọi phiên cần biết                                  | chi tiết tính năng                     |
| `PROJECT.md`          | đổi MVP/schema/DoD                                                         | —                                      |
| `docs/adr/`           | quyết định kiến trúc khó đảo (mức cách ly, mô hình gói, ranh giới domain…) | lựa chọn cục bộ dễ đổi                 |
| `docs/specs/<đợt>`    | luôn: `Trạng thái`, mục Nghiệm thu, số PR                                  | —                                      |
| Tài liệu vận hành     | thêm/đổi biến `.env`, dịch vụ ngoài, cron, quy trình deploy/rollback       | không đổi hạ tầng                      |
| `TRAPS.md`            | mắc bẫy THẬT mới (có ngày/PR, khuôn lỗi, cách rà, cổng chặn)               | lỗi thường, đã có cổng bắt             |
| `docs/README.md`      | thêm/thay tài liệu có hiệu lực                                             | —                                      |

Cấu trúc thư mục `docs/product|ux|design|architecture|decisions|operations|testing` trong sơ đồ
gốc **không áp dụng**: repo đã có `docs/README.md` làm bản đồ và tách theo `specs/ research/ adr/
changelog/ framework/` + tài liệu vận hành ở gốc `docs/`. Tái cấu trúc thư mục tài liệu là việc
riêng, cần ADR, không gộp vào protocol này.

## 9. Retry, fallback, escalation

| Sự kiện                                         | Xử lý                                                                                                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Worker báo `blocked` vì đặc tả thiếu/mâu thuẫn  | coordinator dừng task, KHÔNG vá, KHÔNG route lại; Engineering viết REJECT `spec_ambiguity` → product                                                                        |
| Worker trả diff không đạt `done_when`           | tối đa **2** lần dispatch lại cùng route với REJECT kèm evidence; lần 3 nâng route (`standard`→`complex`) hoặc tự làm                                                       |
| Reviewer "Cần xử lý"                            | sửa → reviewer lại; không giới hạn vòng, nhưng cùng một phát hiện lặp 2 lần = sửa gốc rễ, không vá                                                                          |
| CI đỏ trên PR mình tạo                          | đọc log, tái hiện ở máy, sửa, push tới xanh (CLAUDE.md mục 11). Nghi flake: chỉ chạy lại **một** lần và chỉ khi `main` cũng đỏ cùng check hoặc job chết trước khi test chạy |
| Cổng máy xanh nhưng CI đỏ (hoặc ngược lại)      | `npm ci` rồi chạy lại; `rm -rf packages/*/dist dist dist-server` rồi `typecheck` (TRAPS.md mục 3)                                                                           |
| Health check fail sau deploy                    | rollback trước, tìm nguyên nhân sau (`/incident`)                                                                                                                           |
| REJECT về product ở trạng thái ≥ `IMPLEMENTING` | đổi đặc tả giữa chừng → ghi vào spec + người dùng xác nhận; task ảnh hưởng về `pending`                                                                                     |
| Model/effort không đủ (blocker kiến trúc)       | escalation theo `AI_DEVELOPMENT_PIPELINES.md` §10                                                                                                                           |
| Usage ≥ 70%                                     | hoàn tất đợt, tạo PR, DỪNG (hook `usage-guard.sh`)                                                                                                                          |

## 10. Quyền sửa file theo vai

| Vai           | Được sửa                                                                                   | Cấm                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Product & UX  | `docs/specs/<đợt>.md` (ô 0–⑥, khối `feature:`), `docs/research/*` mới                      | mã nguồn, DESIGN_SPEC, PLAN.md                                                            |
| Design        | mục ⑦ DESIGN_SPEC của spec, `docs/templates/design-spec.md`                                | khối `feature:`/AC, mã nguồn (kể cả `index.css`)                                          |
| Engineering   | mã nguồn, test, migration, PLAN.md (không commit), ô ② "ảnh hưởng lan ra"                  | AC/scope của spec, `PROGRESS.md`/changelog (là việc của vai 5), bỏ qua test               |
| QA & DevOps   | mục Nghiệm thu của spec, test bổ sung để chứng minh REJECT, tài liệu vận hành khi rollback | mã sản phẩm (sửa là việc của owner trong REJECT); **không bao giờ** skip/xoá test để xanh |
| Documentation | changelog, `PROGRESS.md`, `CLAUDE.md`/`PROJECT.md`/`docs/*`, `Trạng thái` của spec, ADR    | mã nguồn, test                                                                            |

Mọi vai: không `reset --hard`/`push --force`/`branch -D` (hook `block-dangerous-git.sh` chặn),
không push thẳng `main`, không commit `.env`/PLAN.md.

## 11. Điều kiện tự commit / tạo PR / merge (không hỏi giữa chừng)

| Hành động | Được tự làm khi                                                                                                                                                                                      | Phải hỏi người dùng khi                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Commit    | hook `pre-commit-gate.sh` xanh · diff đúng task · message conventional commits · không secret/`console.log`                                                                                          | diff chạm file ngoài `files` của task (phạm vi phình)                                               |
| Tạo PR    | trạng thái `IMPLEMENTED` · tiêu đề khớp regex · mô tả đủ 6 tiêu đề · `feat(` có link spec + "Approved for implementation" · changelog + PROGRESS đã gộp vào cùng PR · **READY**, gọi auto-merge ngay | risk: high mà `SPEC_READY` chưa được xác nhận                                                       |
| Merge     | §5.4 đủ mọi vế                                                                                                                                                                                       | bất kỳ vế nào thiếu (và cấm merge tay để đi tắt) · breaking change · đổi schema không rollback được |
| Deploy    | tự động sau merge (`deploy.yml`)                                                                                                                                                                     | cần chạy tay trên VPS (ghi vào PROGRESS "Cần làm tay")                                              |

## 12. Việc kế tiếp để controller thành máy

1. **XONG (đợt này):** `scripts/protocol-check.ts` (+ `scripts/protocol-check.test.ts`) — đọc
   header spec → `Trạng thái:`; với mọi trạng thái ≥ `SPEC_READY` kiểm khối `feature:` đủ trường
   - mỗi AC có `proof` (schema §3.1 qua Zod); ≥ `DESIGN_READY` + `design_spec: required` kiểm có
     mục `## ⑦ DESIGN_SPEC`; ≥ `PASS` kiểm khối `qa:`; `DONE` kiểm khối `doc_delta:` (đường dẫn
     changelog phải tồn tại thật); mọi khối `reject:` bất kỳ đâu phải có `owner`; PLAN.md cục bộ
     (không commit) kiểm hai task không `depends_on` nhau mà đụng cùng `files` (§5.2). Chạy trong
     CI job `audit` qua `npm run check:protocol -- --ci`, ngay sau `check:specs`. Spec cũ không có
     dòng `Trạng thái:` được bỏ qua (di sản, không phải lỗi) — bảng §2.1 cột "Cách kiểm" nay trỏ
     về lệnh này cho các dòng có artifact dạng YAML.
2. **XONG (đợt này):** Slash-command `.claude/commands/protocol.md` (`/protocol <feature-id>`) —
   in trạng thái hiện tại + vai chịu trách nhiệm (§4) + artifact còn thiếu, dựa trên
   `protocol-check.ts` chạy thật (không suy đoán). Chỉ đọc/báo cáo, không tự đổi trạng thái.
3. **XONG (đợt này):** Agent `.claude/agents/qa-verifier.md` (Sonnet) — đội mũ QA độc lập theo
   §4.1, brief chỉ gồm spec + PR + head SHA (không nhận diễn giải của Engineering), chạy đủ
   lệnh §7.1 theo ma trận rủi ro §7.2, ghi `QA_REPORT` hoặc `REJECT` có `owner`.
4. **XONG (đợt này):** gộp phần "prompt contracts" của `AI_DEVELOPMENT_PIPELINES.md` §18 vào brief
   chuẩn của từng vai để hai tài liệu không lệch dần. `PIPELINES.md` §18 trước đây giữ 5 prompt
   đầy đủ (Planner/Astra architecture/Implementation/Sol verification/Astra audit) lặp lại nội
   dung các file vai thật — hai bản mô tả cùng một prompt chắc chắn lệch dần theo thời gian.
   Đã chuyển: (a) hợp đồng ĐẦU RA chuẩn (file đã sửa/thêm · lệnh kiểm chứng + kết quả thật · sai
   khác so với brief · rủi ro còn lại) vào mục "Đầu ra" của `spec-executor.md`/`standard-worker.md`/
   `complex-implementer.md`/`mechanical-worker.md`; (b) khuôn Blocker report của PIPELINES §10 vào
   mục "Ranh giới" của 4 file trên + `coordinator.md` (khi relay báo cáo lên phiên chính, giữ
   nguyên bằng chứng gốc, không tóm tắt lại). `PIPELINES.md` §18 nay chỉ còn khuôn chung
   (ROLE/INPUT/OBJECTIVE/RULES/VERIFY/IF BLOCKED/OUTPUT) + bảng ánh xạ "vai chung → file brief
   thật trong repo" — sửa nội dung một vai thì sửa ở file agent đó, không sửa ở PIPELINES.md.
