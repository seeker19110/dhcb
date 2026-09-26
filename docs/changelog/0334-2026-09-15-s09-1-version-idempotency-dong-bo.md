# 0334 — 2026-09-15 — S09-1: version đơn điệu + idempotency cho đồng bộ tiến độ (server)

- **PR:** [#940](https://github.com/seeker19110/dhcb/pull/940) (nhánh `claude/laughing-babbage-o25bls-s09-1`)
- **Đặc tả:** `docs/specs/2026-09-15-learning-ux-s09-dong-bo-version-retry-xung-dot.md` (S09-1, AC-1…AC-7) — Approved for implementation, §7 chốt theo cột "Đề xuất của AI".
- **Phạm vi:** **chỉ SERVER**, 0 thay đổi giao diện, tương thích client cũ 100%. Outbox/retry/hai tab ở client là S09-2; `ConflictRecord` + hộp thoại là S09-3.

## Việc đã làm

| Việc                                                                     | File                                                                                  |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Hợp đồng `SyncEnvelope` / `SyncResult` / `ConflictRecord`                | `packages/core-contracts/sync.ts` (+ test, 13 ca)                                     |
| Biên nhận idempotency dùng chung + job dọn 7 ngày                        | `apps/server/src/api/_lib/syncReceipt.ts` (+ test, 6 ca), `apps/server/src/server.ts` |
| Migration lũy đẳng: 2 cột × 2 bảng + `sync_receipts` + `sync_conflicts`  | `postgres/migrations/0083_sync_version_receipts.sql` + `schema.sql` + dòng README     |
| `/api/progress`: `sync` tuỳ chọn, version, conflict, replay, Retry-After | `apps/server/src/api/core/progress.ts` (+ test, 36 → 44 ca)                           |
| Test tích hợp hai request đồng thời trên Postgres THẬT                   | `apps/server/src/api/core/progress.concurrency.test.ts` (mới, 2 ca)                   |
| `/api/programming/progress`: batch ≤ 50 mục, version theo dòng, replay   | `apps/server/src/api/subjects/programming/progress.ts` (+ test, 8 → 14 ca)            |

## Quyết định khi thi hành

1. **Số migration `0083` được cấp theo thứ tự MERGE thật — đã đổi một lần giữa chừng.** Đặc tả
   đoán trước "S05 lấy 0081, S11 lấy 0082, S09 lấy 0083"; thực tế S11 lấy `0081`. Lúc mở PR,
   `main` mới có tới `0081` nên nhánh này lấy `0082`. Sau đó **PR #939 (S05-1) merge trước và
   chiếm `0082`** (`0082_personal_learner_intent.sql`), nên nhánh này đổi sang `0083` — đúng
   quyết định của chủ dự án 2026-09-15: **số cấp theo thứ tự MERGE thật, không đặt trước**, và
   cổng `scripts/migrations-readme-coverage.test.ts` cấm nhảy số. Cách làm khi bị chiếm:
   `git ls-tree origin/main postgres/migrations/` lấy số trống thật → `git mv` → sửa MỌI chỗ nhắc
   số cũ (SQL, `schema.sql`, README, changelog, `PROGRESS.md`, goal, mô tả PR) → **chạy lại
   `migrate:pg` ×2 trên DB sạch**, vì bằng chứng cũ in tên file cũ nên không còn khớp.
2. **Số changelog `0334` TRÙNG với đợt khác — cố ý, không phải nhầm.** `0334-2026-09-15-on-dinh-test-python3.md`
   (PR #937) và đợt của S05-1 cũng mang số này. `scripts/changelog.test.ts` có ca riêng khẳng định
   **số trùng là hợp lệ** (kèm quy tắc phá hoà: ngày mới hơn đứng trước, rồi tới tên file) — luật
   "tăng nghiêm ngặt" cũ từng làm PR #703 đỏ BỐN lượt CI vì đúng tình huống hai PR song song này.
   Tên file khác slug nên git không xung đột; **không đổi số**.
3. **Biên nhận ghi TRONG cùng transaction với upsert tiến độ** (Q2 của đặc tả). Có test canh thứ
   tự call: chỉ số của câu `insert into public.sync_receipts` phải nhỏ hơn chỉ số `commit`. Không
   có cửa sổ "đã merge nhưng chưa có biên nhận" — đúng chỗ phát hiện F2 đã khoanh.
4. **`version` tăng TRONG câu SQL** (`version = english.learning_progress.version + 1`), không
   tính ở tầng ứng dụng: hai tiến trình PM2 song song không bao giờ ghi trùng số.
5. **Biên nhận KHÔNG lưu `merged`** (để dòng receipt nhỏ). Lần gửi lại chỉ cần `version` +
   `cefrUnlocked`; bản gộp đầy đủ lấy bằng `pullProgress` như thường lệ.
6. **`attemptId` trùng nhưng khác `endpoint` → 409** (ca hiếm, chỉ do bug client) — đúng bảng ca
   lỗi §③.8.
7. **Dạng body cũ của `/api/programming/progress` vẫn hợp lệ** nhưng nay chạy trong
   `withTransaction` (trước là 2 `pool.query` rời). Đổi này khiến 2 test cũ phải cập nhật cách
   đếm call (bỏ qua `begin`/`commit`) — không đổi hành vi.
8. **Test AC-4 bỏ qua khi thiếu `DATABASE_URL`**: job `unit` của CI không có service Postgres
   (đọc `.github/workflows/ci.yml`, không có khối `services`). Bằng chứng chạy thật ở dưới.

## Bất biến KHÔNG bị phá (kiểm bằng lệnh)

- `git diff origin/main -- apps/server/src/api/_lib/progressMerge.ts` = **rỗng** — luật merge
  domain không đổi một dòng nào.
- Câu `case when programming.lesson_progress.status = 'completed' then 'completed' …` giữ nguyên
  (test canh chuỗi đó).
- `select … for update` vẫn còn trong `progress.ts` (test tích hợp AC-4 sẽ đỏ nếu ai bỏ đi).
- Hạn mức không đổi: 30/phút `/api/progress`, 60/phút programming. Replay VẪN bị đếm (đếm lượt
  chạy trước khi tra biên nhận — test canh `query` chưa hề được gọi khi 429).

## Bằng chứng kiểm chứng

Chạy lại TOÀN BỘ trên cây **đã gộp `main`** (merge có xung đột → bắt buộc theo CLAUDE.md mục 9):

```
npm ci              ✅ lockfile khớp sau khi gộp
rm -rf packages/*/dist dist dist-server && npm run typecheck   ✅ 0 lỗi
npm run lint        ✅ 0 cảnh báo
npm run format      ✅
npm run build       ✅ dist/assets/index-*.js 217,35 kB (gzip 66,45 kB)
npm run test:coverage ✅ 12 964 pass | 2 skip (639 file)
   Statements 94,31% · Branches 90,29% · Functions 94,7% · Lines 94,81%  (ngưỡng 93/89/93/93)
```

**Flaky đã biết:** lượt `test:coverage` ĐẦU sau khi gộp có 1 file đỏ; hai lượt chạy lại ngay sau
đó xanh sạch (638 file pass). Cùng họ với nợ đã ghi ở cuối `PROGRESS.md` (`lessonsPython.test.ts`
spawn `python3` quá timeout dưới tải, và perf test `cefrOutline` so mốc thời gian thực) — không
liên quan diff của PR này, vốn chỉ chạm server + migration.

Migration trên DB sạch (Postgres 16.13 local, `initdb` mới):

```
# lần 1
[migrate:pg] → 0082_personal_learner_intent.sql ... xong
[migrate:pg] → 0083_sync_version_receipts.sql ... xong
[migrate:pg] ✅ Hoàn tất — đã áp dụng 86 migration lẻ mới.
# lần 2 (lũy đẳng)
[migrate:pg] Áp postgres/schema.sql (idempotent) ...
[migrate:pg] ✅ schema.sql xong.
[migrate:pg] Đã áp dụng đủ 86 migration lẻ — không có gì mới.
EXIT=0
```

`\d` của 4 bảng (`sync_receipts`, `sync_conflicts`, `english.learning_progress`,
`programming.lesson_progress`) chụp trước và sau lần chạy thứ 2 → `diff` **rỗng**.

Đoạn ROLLBACK trong comment cuối file chạy tay được (`ON_ERROR_STOP=1`):
`DROP TABLE ×2 · ALTER TABLE ×2 · DROP VIEW · CREATE VIEW` → `ROLLBACK OK`; áp lại migration sau
đó cũng sạch.

AC-4 trên Postgres thật:

```
DATABASE_URL=postgres://…/dhcb_s09 npx vitest run apps/server/src/api/core/progress.concurrency.test.ts
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

(hai POST `Promise.all` cùng `baseVersion=1` → `learned` có CẢ `cat` lẫn `dog`, `version = 3`,
đúng một response `conflict: true`; gửi lại cùng `attemptId` → `replayed: true`, version không tăng.)

## Còn nợ / việc tiếp

- **S09-2** (client): `syncOutbox.ts`, `progressSync.ts`, `programmingProgress.ts`, indicator, xoá
  `offlineStore.ts`. Chừng nào S09-2 chưa lên, client vẫn KHÔNG gửi `sync` → cột `version` tăng
  nhưng chưa ai dùng, và ba lỗi mất dữ liệu F1/F4/F5 vẫn còn nguyên.
- **S09-3**: `sync_conflicts` đã có bảng nhưng chưa ai ghi (chờ S08 có endpoint nháp — Q5).
- **Nợ Q6** (không sửa trong S09): F6 `hard` ghi đè theo thứ tự đến · F7 `mergeSrsMap` hoà reps thì
  client thắng · F8 so chuỗi ISO do client sinh. Sau PR này DB đã có `client_updated_at` +
  `version` — đủ dữ liệu cho một slice riêng sửa theo mốc server-side.
