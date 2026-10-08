# 0529 — Cổng CI `sql-prepare`: PREPARE mọi câu SQL tĩnh của server trên Postgres thật (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** _(chưa tạo — commit trên nhánh worktree, coordinator mở PR)_ ·
  **Loại:** `ci(sql)`.
- **Nguồn:** chủ dự án duyệt 2026-10-08 — đề xuất 3 của `docs/changelog/0523-*.md` (công cụ
  PREPARE làm tay ở đợt đó bắt 9 câu SQL sai cột mà toàn bộ unit test giả lập `pg` không thấy).

## Vì sao

Unit test giả lập `pg`, nên câu SQL sai tên cột/bảng hoặc lệch kiểu (`uuid <> text`) vẫn xanh —
lỗi chỉ lộ ra ở production, và thường còn bị một `catch` nuốt im lặng. `PREPARE` trên CSDL thật
phân tích + lập kế hoạch câu lệnh (bắt sai cột/bảng/kiểu/toán tử) mà KHÔNG chạy nó.

## Đã làm

- **`scripts/lib/sqlExtract.ts`** (mới, thuần): duyệt AST bằng TypeScript compiler API, lấy đối số
  đầu của mọi lời gọi `<x>.query(` / `.query<T>(` / `?.query(`. Tính hằng được: literal, template
  mà mọi `${}` suy ra được, `+`, hằng `const` cùng file, `[...].join(sep)`. Một biểu thức nhiều
  giá trị khả dĩ (`cond ? 'a' : 'b'`, `BANG[khoaRuntime]` với `BANG` là object hằng) → trích MỌI
  biến thể (trần 16); mỗi "điểm rẽ" có khoá nên `${table}` dùng hai lần trong một câu luôn cùng
  giá trị (không sinh tổ hợp chéo vô nghĩa). An toàn trước khi suy: `const` khai báo ở nhiều scope
  hoặc bị sửa tại chỗ (`push`, gán thuộc tính, `delete`) → KHÔNG coi là hằng. Không suy được →
  "bỏ qua (động)" kèm lý do, có đếm.
- **`scripts/lib/sqlAllowlist.ts`** + **`scripts/sql-prepare-allowlist.json`**: ngoại lệ tường
  minh, validate bằng Zod (`reason` bắt buộc ≥ 10 ký tự, `sqlIncludes` ≥ 8 ký tự để không khớp
  bừa). So khớp theo (file, đoạn SQL đã gộp khoảng trắng) — KHÔNG theo số dòng vì số dòng xê dịch.
  Mục không còn khớp câu lỗi nào → in `::warning::` nhắc gỡ (không làm đỏ, để PR sửa câu SQL ở
  nhánh khác merge trước/sau đều không vỡ CI của nhau).
- **`scripts/check-sql-prepare.ts`** (mới) — `npm run check:sql`: quét `apps/server/src` +
  `packages` (bỏ `*.test.ts(x)`, `*.spec.ts`, `.d.ts`, `dist`, `node_modules`, `__tests__`,
  `__mocks__`), kiểm CSDL đã áp ĐỦ migration (đếm `_schema_migrations` = số file trong
  `postgres/migrations/`), rồi mỗi câu: `BEGIN; PREPARE dhcb_chk_N AS …; DEALLOCATE; ROLLBACK`.
  Câu điều khiển transaction (`begin`/`commit`/`rollback`…) bỏ qua có đếm; lệnh không PREPARE
  được (DDL, `SET`…) phải nằm trong allowlist. Lỗi ngoài allowlist → in `file:dòng` (dòng của
  CHÍNH chuỗi SQL) + thông điệp Postgres + annotation `::error file=…,line=…::` cho GitHub, thoát
  mã 1. Tự bảo vệ khỏi xanh rỗng: trích < 300 câu → đỏ (bộ trích hỏng).
- **Quyết định đo thật, khác công cụ tạm ở 0523:** công cụ cũ bỏ qua lỗi
  `could not determine data type of parameter $N`. Đo trên Postgres 16: `select $1 is null` lỗi
  y hệt ở cả `PREPARE` lẫn đường `pg` thật (`client.query(sql, [null])`) — nên đây là lỗi runtime
  thật, cổng KHÔNG bỏ qua. (Hiện 0 câu dính lỗi này.) Công cụ cũ cũng bỏ `core-ui` và mọi
  `subject-*`; bản này quét cả `packages/` — `subject-programming` có 3 service dùng `pg` thật.
- **`.github/workflows/ci.yml`**: job con mới `sql-prepare` (service container `postgres:16`,
  health-check `pg_isready`, Node 22 + cache npm, `npm ci`, `timeout-minutes: 15`) → áp schema +
  migration bằng **`npm run migrate:pg`** — đúng lệnh `scripts/deploy.sh` dùng, không viết cách
  áp thứ hai — rồi `npm run check:sql`. Nối vào `needs` của job tổng hợp `quality` (CLAUDE.md
  §11.1 luật 2); `quality` gom thêm kết quả `sql-prepare`. Không đổi tên `quality`/`e2e`, không
  upload artifact. `scripts/ci-workflow-policy.test.ts` KHÔNG phải sửa (9/9 xanh với job mới).
- **`package.json`**: thêm `"check:sql"`. Lệnh mới này CHƯA ghi vào `CLAUDE.md` — để phiên chính
  quyết định (`npm run check:docs` không đối chiếu script npm, vẫn xanh).
- **`scripts/lib/sqlExtract.test.ts`** (mới, không cần DB): 18 ca — literal/template/`.query<T>`/
  `?.query`, bỏ `querySelector`/hàm `query` trần, dòng đúng của chuỗi SQL, tính hằng, hằng import
  → động, mảng `push`/object gán thuộc tính → động, tên trùng scope → động, ternary hai biến thể,
  cùng điểm rẽ không tổ hợp chéo, tra bảng khoá runtime/hằng, vượt trần → động, `leadingKeyword`,
  `normalizeSql`, allowlist khớp/không khớp/từ chối mục thiếu lý do.

## Thống kê trích SQL (mã `main` @ `a9d6421`)

- Quét **965** file nguồn. Trích **500** câu SQL tĩnh từ **490** lời gọi (6 lời gọi sinh 16 biến
  thể: `core/history.ts`, `core-ai/ttsStats.ts`, `core-billing/usage.ts` ×6, `core-http/mailQuota.ts`,
  `core-personal/lifeGraphService.ts` ×2).
- **PREPARE 497** · điều khiển transaction (bỏ qua) **3** · **bỏ qua (động) 20** (biến `sql`/`query`
  dựng theo bộ lọc ở `admin-feedback`, `admin-payments`, `ttsCacheAudit`, `workService`; template nội
  suy hằng import/biến runtime ở `admin-stem-review`, `usage-summary`, 10 file `core-personal`).
- **Lỗi: 10 câu — cả 10 nằm trong allowlist**, 0 câu lỗi ngoài allowlist → xanh.

## Allowlist (10 mục) + lý do

| File                                             | Lỗi Postgres                                                                  | Lý do miễn                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/core-personal/personErasureService.ts` | 5 câu: `node_type`, `source_node_id` ×2, `executed_at`, `title` không tồn tại | Đang sửa ở changelog **0527** — gỡ khỏi allowlist khi PR đó merge.                                                                                                                                                                                                                                                                                           |
| `packages/core-chat/chatService.ts`              | `operator does not exist: uuid <> text`                                       | Đã sửa ở changelog **0523** nhưng PR đó **chưa merge** vào `main` (`main` vẫn là câu cũ) — gỡ khi merge.                                                                                                                                                                                                                                                     |
| `packages/core-chat/chatPush.ts`                 | `column "display_name" does not exist`                                        | Như trên (0523).                                                                                                                                                                                                                                                                                                                                             |
| `apps/server/src/api/platform/pvp-arena.ts`      | 2 câu: `column p.user_id does not exist`                                      | Như trên (0523).                                                                                                                                                                                                                                                                                                                                             |
| `apps/server/src/api/admin/admin-usage-stats.ts` | `operator does not exist: text >= date`                                       | **Lỗi THẬT MỚI do chính cổng này phát hiện** (công cụ tạm ở 0523 không thấy vì câu dựng bằng template nội suy hằng): `daily_usage.day` là `text`, câu ⑩ so với `$1::date`; câu nằm trong `Promise.all` không `catch` nên cả endpoint thống kê admin trả 500 (đưa vào từ PR #1220). Chưa sửa vì ngoài phạm vi đợt thêm cổng — đã báo coordinator; gỡ khi sửa. |

## Thử âm

- Sửa tạm `packages/core-billing/usage.ts:83` `plan_expires_at` → `plan_expires_atx`:
  `npm run check:sql` → **exit 1**, in `::error file=packages/core-billing/usage.ts,line=83::column "plan_expires_atx" does not exist`
  kèm SQL rút gọn. Trả lại nguyên văn (`git status` sạch phần `packages/`).
- `DATABASE_URL` rỗng → exit 1 kèm hướng dẫn; trỏ vào CSDL chưa migrate → exit 1 "CSDL chưa áp
  migration nào — chạy `npm run migrate:pg`…".

## Bằng chứng

- Postgres 16 cục bộ (cụm tạm `pg_createcluster 16 sqlchk529 -p 5491`, đã `pg_dropcluster --stop`
  sau khi xong): CSDL rỗng → `npm run migrate:pg` exit 0 (schema + 90 migration) →
  `npm run check:sql` **exit 0** (“Không có câu SQL lỗi ngoài allowlist (PREPARE 497 câu, 10 câu lỗi
  được miễn)”).
- `npx vitest run scripts/lib/sqlExtract.test.ts scripts/ci-workflow-policy.test.ts` → 27/27 xanh.
- `ci.yml` parse bằng thư viện `yaml`: `quality.needs = [static, unit, build, audit, sql-prepare]`.
- Cổng đủ ở máy: `rm -rf packages/*/dist dist dist-server && npm run typecheck` → 0;
  `npm run lint` → 0; `npx prettier --check` các file đổi → 0; `npm run build` → 0;
  `npm run test:coverage` → 1, CHỈ vì 1 test timeout 5000 ms ở file KHÔNG đụng tới
  (`packages/subject-programming/tsPrelude.test.ts`, khuôn `TRAPS.md` §7, máy 4 CPU chạy song song
  agent khác) — 18889/18890 test khác xanh, không ngưỡng coverage nào báo hụt; chạy lại riêng file
  đó: 4/4 xanh.
