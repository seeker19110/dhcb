# 0527 — Sửa xuất/xoá dữ liệu cá nhân `/api/persons?action=export|full_erase` (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** (chưa tạo — commit trên nhánh worktree) · **Loại:** `fix(privacy)`
- **Nguồn:** chủ dự án duyệt 2026-10-08. Nợ 🔴 đầu tiên trong `PROGRESS.md` mục "Nợ kỹ thuật
  còn mở", phát hiện ở đợt `0523` (đề xuất 1, cuối file `0523-2026-10-08-san-loi-im-lang-server.md`).

## Vì sao

`packages/core-personal/personErasureService.ts` đọc 5 cột không tồn tại trong schema thật, nên
**export luôn 500** và **full_erase luôn rollback rồi 500**: người dùng không xuất cũng không xoá
được dữ liệu của mình. Kèm hai lỗi "im lặng": `.catch(() => ({ rows: [] }))` ở export (bản xuất
có thể thiếu quyết định / dự án mà vẫn trả 200) và `.catch(() => 0)` ở erase (vô tác dụng, vì sau
một câu lỗi Postgres đã huỷ cả transaction). Unit test giả lập `pg` nên không bao giờ bắt được.
Danh sách bảng còn **sót 11 bảng** chứa `person_id` (bảng dưới).

## Đã làm

1. **Một nguồn sự thật `PERSON_TABLES`** (`personErasureService.ts`): mỗi phần tử là
   `{ exportKey, table, columns, orderBy }`. Export và erase cùng duyệt mảng này, nên không thể
   "xuất có mà xoá sót" hay ngược lại. Thứ tự mảng = thứ tự xoá (bảng con trước bảng cha).
2. **Cột đúng theo schema thật** (bảng dưới). Cột xuất liệt kê tường minh (không `select *`) để một
   cột mới sau này (vd cột mã hoá) không tự lọt ra bản xuất.
3. **Bỏ mọi `.catch` nuốt lỗi.** Một bảng lỗi ⇒ export ném lỗi (500 qua `routes.ts`, có log +
   Sentry), không trả bản xuất thiếu. Erase lỗi ⇒ rollback toàn bộ + ném lỗi.
4. **Export chạy trong MỘT transaction `repeatable read, read only`** — ảnh chụp nhất quán, không
   lẫn trạng thái trước/sau một lần ghi xen giữa (trước đây 11 câu `Promise.all` trên 11 kết nối).
5. **Erase:** kiểm Person tồn tại chuyển VÀO transaction và khoá `select … for update` — mọi
   insert vào bảng con phải lấy khoá `key share` trên dòng Person để kiểm khoá ngoại nên bị chặn
   tới khi xoá xong; không có bản ghi mới lọt vào giữa chừng rồi sống sót (đã đo, xem "Bằng chứng").
   Không ghi được nhật ký xoá ⇒ ném lỗi + rollback (không báo "đã xoá" khi thiếu vết kiểm toán).
6. **Handler** `apps/server/src/api/personal/persons.ts`: erase lỗi ⇒ ghi
   `PERSON_FULL_ERASE_FAILED` rồi ném tiếp (trước chỉ có INITIATED, không có dấu vết thất bại).
7. **Test:** viết lại `personErasureService.test.ts` (14 ca: transaction, thứ tự xoá, không nuốt
   lỗi, đếm, nhật ký, `rowCount = null`); thêm `personErasureService.integration.test.ts` chạy
   trên Postgres THẬT (tự bỏ qua khi thiếu `DATABASE_URL` — khuôn
   `progress.concurrency.test.ts`), gồm một ca canh **mọi bảng có cột `person_id` trong schema
   phải nằm trong `PERSON_TABLES`** (thêm bảng mới mà quên ⇒ đỏ); `persons.test.ts` +4 ca (bỏ
   qua `personId`/`userId` client gửi, lỗi service ⇒ ném lên). Cập nhật hai script
   `scripts/eval-v2-privacy.ts` (drill 3 trước ĐÒI hành vi nuốt lỗi — đổi thành "phải ném lỗi") và
   `scripts/eval-v2-final-audit.ts` (mock thêm `connect`/`for update`).

## Cột sai → cột đúng

| Bảng                        | Cột cũ (không tồn tại)                          | Cột thật                                     |
| --------------------------- | ----------------------------------------------- | -------------------------------------------- |
| `personal.life_graph_nodes` | `node_type`, `status`                           | `type`; không có `status` (có `archived_at`) |
| `personal.life_graph_edges` | `source_node_id`, `target_node_id`, `edge_type` | `from_node_id`, `to_node_id`, `relation`     |
| `personal.action_receipts`  | `executed_at`                                   | `created_at`                                 |
| `personal.decision_records` | `title`, `decided_at`                           | `problem`; không có `decided_at`             |

Câu xoá cạnh đồ thị cũ (`USING life_graph_nodes … e.source_node_id = n.id`) thay bằng
`where person_id = $1` — `life_graph_edges` có cột `person_id` riêng (khoá ngoại kép
`(from_node_id, person_id)`), nên không cần join.

## Danh sách bảng xuất/xoá (21 bảng + `personal.persons`)

Thứ tự = thứ tự xoá. ✚ = bảng TRƯỚC ĐÂY BỊ SÓT (không xuất, không xoá tường minh).

| #   | Bảng                                    | Khoá xuất (JSON)          | Ghi chú                                         |
| --- | --------------------------------------- | ------------------------- | ----------------------------------------------- |
| 1   | `personal.action_receipts`              | `actionReceipts`          |                                                 |
| 2   | `personal.automation_grants`            | `automationGrants`        |                                                 |
| 3   | `personal.tool_execution_audit_log` ✚   | `toolExecutionAuditLog`   | trước `proposed_actions` (FK set null)          |
| 4   | `personal.proposed_actions`             | `proposedActions`         | trước chỉ xoá, không xuất                       |
| 5   | `personal.life_goal_sources` ✚          | `lifeGoalSources`         |                                                 |
| 6   | `personal.life_goals` ✚                 | `lifeGoals`               | FK kép tới nodes KHÔNG cascade ⇒ phải xoá trước |
| 7   | `personal.life_graph_edges`             | `lifeGraphEdges`          | FK kép tới nodes KHÔNG cascade                  |
| 8   | `personal.life_graph_audit_log` ✚       | `lifeGraphAuditLog`       |                                                 |
| 9   | `personal.life_graph_nodes`             | `lifeGraphNodes`          |                                                 |
| 10  | `personal.memory_records_audit_log` ✚   | `memoryAuditLog`          | KHÔNG có khoá ngoại nào ⇒ cascade không tới     |
| 11  | `personal.memory_records`               | `memories`                |                                                 |
| 12  | `personal.personal_facts`               | `personalFacts`           |                                                 |
| 13  | `personal.decision_reviews_audit_log` ✚ | `decisionReviewsAuditLog` |                                                 |
| 14  | `personal.decision_records`             | `decisionRecords`         |                                                 |
| 15  | `personal.companion_messages` ✚         | `companionMessages`       | transcript Companion                            |
| 16  | `personal.personal_policies`            | `personalPolicies`        |                                                 |
| 17  | `personal.consent_grants`               | `consentGrants`           |                                                 |
| 18  | `worklife.tasks` ✚                      | `workTasks`               |                                                 |
| 19  | `worklife.documents` ✚                  | `workDocuments`           |                                                 |
| 20  | `worklife.meetings` ✚                   | `workMeetings`            |                                                 |
| 21  | `worklife.projects`                     | `workProjects`            |                                                 |
| —   | `personal.persons`                      | `person`                  | xoá cuối cùng                                   |

Giữ lại có chủ đích: `platform.person_erasure_log` (vết kiểm toán của chính thao tác xoá,
append-only). Bảng của ba trụ career/startup/life đã xoá ở migration `0085` — không còn gì để
xuất/xoá. (Nhiều bảng trên có `on delete cascade` từ `persons` nên thực tế cũ có thể đã được dọn
khi xoá dòng Person — nhưng câu xoá cạnh đồ thị lỗi trước đó nên KHÔNG bao giờ tới bước ấy.)

### Ngoài phạm vi — cần chủ dự án quyết

Thao tác này xoá **dữ liệu Personal OS gắn với `personal.persons.id`**. Dữ liệu gắn thẳng với
`user_id` KHÔNG bị xoá/xuất ở đây: `personal.intake` (hồ sơ năng lực ẩn, cột mã hoá),
`personal.learner_intent`, `platform.completion_state` / `completion_evidence` / `feature_state`
và 33 bảng/khung nhìn `public.*` có cột `user_id` (tiến độ học, thanh toán, phiên đăng nhập…) cùng các schema
`english`/`programming`/`chat`/`location`. Đó là bài toán **xoá tài khoản** (đụng thanh toán — có
thể phải lưu chứng từ theo luật; đụng hồ sơ ẩn — xuất ra phải giải mã và theo Luật số 1), chưa có
endpoint, cần đặc tả riêng.

## Đổi hợp đồng (JSON `GET /api/persons?action=export`)

Giao diện hiện **không** gọi endpoint này (grep `apps/dhcb/src` ở `0523`), và trước đợt này nó
luôn 500 — nên không có client nào phụ thuộc hình dạng cũ.

- **Bỏ** `workRecords` (chỉ có `{id, record_type:'project', created_at}`) ⇒ thay bằng
  `workProjects`, `workTasks`, `workMeetings`, `workDocuments` (đủ cột).
- **Thêm** `toolExecutionAuditLog`, `proposedActions`, `lifeGoalSources`, `lifeGoals`,
  `lifeGraphAuditLog`, `memoryAuditLog`, `decisionReviewsAuditLog`, `companionMessages`.
- **Đổi tên trường** trong mục: `lifeGraphNodes[].node_type → type` (bỏ `status`, thêm
  `version`, `updated_at`, `archived_at`); `lifeGraphEdges[].source_node_id/target_node_id/edge_type
→ from_node_id/to_node_id/relation`; `actionReceipts[].executed_at → created_at`;
  `decisionRecords[].title → problem` (bỏ `decided_at`).
- Mọi mục nay xuất **đủ cột** của bảng (trước chỉ một phần, vd `personalFacts` thiếu `source`).
- Thời gian trả **ISO 8601** (`2026-10-08T14:00:00.000Z`) thay cho dạng `::text` của Postgres
  (`2026-10-08 14:00:00+00`); `personal_facts.confidence` (numeric) là chuỗi như mặc định của `pg`.
- `DELETE …?action=full_erase`: hình dạng giữ nguyên; `schemasCleared` nay luôn liệt kê ĐỦ 22
  bảng đã dọn (trước không nhất quán: có bảng chỉ ghi khi xoá được > 0 dòng).

## Kiểm quyền (đã xác nhận lại)

`persons.ts`: `validateAuth(req)` ⇒ 401 nếu không có; `personId` luôn từ
`getOrCreatePerson(pool, auth.userId)` — không đọc tham số nào từ client. Test mới gửi kèm
`?personId=<người khác>&userId=user-2` ⇒ service vẫn được gọi với Person của chính chủ. Export
còn đòi 2FA + step-up (giữ nguyên). DELETE đi qua `isTrustedMutation` (chặn Origin lạ) ở
`routes.ts`. **Rủi ro còn mở để chủ dự án cân nhắc:** `full_erase` KHÔNG đòi step-up 2FA dù là
thao tác không hoàn tác — chủ ý cũ ("xoá dữ liệu thường vẫn mở"), đợt này không đổi.

## Bằng chứng

Postgres 16 tạm (`pg_createcluster 16 erase527 -p 5457`), áp `npm run migrate:pg`
(`scripts/run-pg-migrations.ts`): `schema.sql` + 90 migration lẻ tới `0087` — "✅ Hoàn tất".

- **PREPARE từng câu service phát ra** (pool giả chuyển mỗi câu thành `PREPARE … AS <sql>` trên
  DB thật): bản cũ `TOTAL=25 BAD=5` — `column "node_type" does not exist`,
  `column e.source_node_id does not exist` (×2: select + delete), `column "executed_at" does not
exist`, `column "title" does not exist`. Bản mới `TOTAL=46 BAD=0` (lệnh `set transaction` không
  PREPARE được — chạy thật trong test tích hợp).
- **Bản cũ chạy trên dữ liệu thật:** `exportPersonData` ⇒ `column "node_type" does not exist`;
  `erasePersonData` ⇒ `column e.source_node_id does not exist`, sau đó Person + ký ức **vẫn còn
  nguyên** (`{ persons: '1', memories: '1' }`).
- **Test tích hợp bản mới** (`DATABASE_URL=… npx vitest run
packages/core-personal/personErasureService.integration.test.ts`): 2/2 xanh — tạo 2 người A, B
  mỗi người ≥ 1 dòng ở cả 21 bảng; export A có đủ 21 mục không rỗng, chỉ dữ liệu của A; erase A
  ⇒ cả 21 bảng + `persons` sạch dữ liệu A, số dòng từng bảng của B **y nguyên**, có dòng
  `person_erasure_log` khớp `erased_by='self'` và tổng số bản ghi; danh sách `PERSON_TABLES` khớp
  đúng tập bảng có `person_id` trong `information_schema` (trừ nhật ký xoá).
- **Khoá `for update`:** phiên 1 giữ khoá dòng Person, phiên 2 insert `companion_messages` cho
  người đó ⇒ bị chặn tới `statement_timeout` (`canceling statement due to statement timeout`).
- Test liên quan: `npx vitest run packages/core-personal/ apps/server/src/api/personal/` (có
  `DATABASE_URL`) ⇒ 50 file / 701 test xanh. `npx tsx scripts/eval-v2-privacy.ts` ⇒ 7/7 drill;
  `scripts/eval-v2-final-audit.ts` tiêu chí 4 ✓.
- Cổng cuối: xem mô tả commit / báo cáo đợt việc.
