# 0536 — Cổng `sql-prepare`: kiểm cả câu SQL "động" (21 → 0 câu bỏ qua) (2026-10-08)

- **Ngày:** 2026-10-08 · **PR:** _(chưa tạo — commit trên nhánh worktree, coordinator mở PR)_ ·
  **Loại:** `ci(sql)`.
- **Nguồn:** chủ dự án duyệt "chất lượng cao nhất" 2026-10-08 — nối tiếp `0529` (cổng
  `npm run check:sql`): giảm số câu "bỏ qua (động)" về mức tối thiểu kiểm TRUNG THỰC được.

## Vì sao

Sau `0529`, cổng PREPARE 485 câu nhưng **bỏ qua 21 câu** dựng động — đúng loại câu dễ sai nhất
(bộ lọc admin, danh sách có `$n` sinh theo bộ lọc, xuất/xoá dữ liệu cá nhân theo bảng). Câu bị bỏ
qua là câu KHÔNG được kiểm: sai cột ở đó vẫn lọt ra production y như trước khi có cổng.

## Đã làm

Không sửa mã server nào — mọi câu đều kiểm được bằng cách cho bộ trích hiểu đúng ngữ nghĩa, không
cần viết lại câu cho "tĩnh". Bộ trích tách làm 4 file (file cũ sẽ lên ~1.600 dòng):

- **`scripts/lib/sqlExtract.ts`** — API công khai (`extractSqlFromSource(file, text, { loadModule })`),
  từ khoá, `normalizeSql`.
- **`scripts/lib/sqlAnalyzer.ts`** (mới) — tính giá trị + **mô phỏng đường chạy**:
  - Đi từ đầu thân hàm chứa lời gọi `.query(` tới đúng lời gọi, giữ giá trị biến cục bộ theo từng
    đường: khai báo, `x = …`, `x += …`, `arr.push(…)`, `i++` (kể cả `$${i++}` trong template, áp
    tuần tự trái→phải), `if` (điều kiện tính được → đúng một nhánh; không tính được mà nhánh GHI
    biến đang theo dõi → tách CẢ HAI đường; nhánh không ghi gì → không nhân đôi), `return`/`throw`
    cắt đường, đi xuyên `try`/`switch`/vòng lặp chứa lời gọi.
  - `for (const spec of BANG_HANG)` chứa lời gọi → biến lặp lấy lần lượt từng phần tử.
  - Tham số hàm `function f` KHÔNG export mà mọi lần nhắc tới `f` trong file đều là lời gọi trực
    tiếp → tham số = hợp đối số ở mọi nơi gọi (mỗi nơi gọi một nhánh, nên các tham số đi cùng
    nhau; lần ngược tối đa 4 tầng, chặn đệ quy).
  - Hàm cùng file chỉ "trả lại đối số" (câu cuối là `return <tham số>`, mọi `return` cùng tham số,
    tham số không bị gán, không async/generator) — vd `assertIdent(v, re)` chỉ ném lỗi hoặc trả `v`.
  - Hằng IMPORT từ file khác (`export const`, `export { a as b }`, re-export), `Object.values(OBJ)`
    (khoá không dạng số — thứ tự JS khác thứ tự khai báo), `ARR.map(x => …)`, `.length`, so sánh
    `> < === …`, `&&`/`||`/`!` trong điều kiện.
- **`scripts/lib/sqlAst.ts`** (mới) — gom khai báo cấp file, tìm chỗ GHI biến (gán, destructuring
  `[a] = …`, `for (x of …)` vào biến có sẵn, `++`, `delete`, phương thức sửa tại chỗ, mảng/object
  bị truyền/gán đi nơi khác, ghi trong closure).
- **`scripts/lib/sqlValues.ts`** (mới) — miền giá trị (giá trị khả dĩ + lựa chọn từng điểm rẽ).
- **`scripts/check-sql-prepare.ts`**: thêm bộ nạp module cho hằng import (`./x.js` → `x.ts`,
  `@dhcb/<gói>/<file>` → `packages/<gói>/<file>.ts` khớp `paths` tsconfig; chỉ đọc file trong
  repo); sàn `MIN_EXPECTED_QUERIES` **300 → 550** (đo được 591; riêng phần mô phỏng đóng góp ~100
  câu — nó gãy là sàn cũ không thấy).

### Nguyên tắc an toàn (thà bỏ qua còn hơn suy sai — giữ đúng tinh thần 0529)

- Biến bị ghi ở chỗ KHÔNG mô phỏng (thân vòng lặp, `switch`, `try`, truyền mảng sang hàm khác,
  gán thuộc tính, bí danh `const b = a`) → KHÔNG BIẾT; ghi trong closure → KHÔNG BIẾT suốt lần mô
  phỏng (closure có thể chạy bất cứ lúc nào).
- Hằng `const` cấp file chỉ dùng khi tên KHÔNG trùng bất kỳ binding nào khác trong file (const ở
  scope khác, `let`/`var`, tham số, import, hàm) — chặt hơn 0529 (0529 chỉ xét trùng `const`).
  Biến cục bộ của chính hàm đang mô phỏng luôn thắng (đúng scope).
- Mỗi `if` một khoá riêng (vị trí) → có thể sinh tổ hợp mà runtime không bao giờ chạy: đây là
  phía an toàn (thừa biến thể có thể báo đỏ oan, KHÔNG bao giờ im lặng bỏ sót).
- Một đường chạy nào đó không suy ra được SQL → bỏ CẢ lời gọi (không kiểm một phần rồi báo xanh).
- **Trần biến thể 16 → 64** (`MAX_VARIANTS`): liệt kê tuyến tính có thật cần tới — `PERSON_TABLES`
  có 21 bảng (+1 bảng gốc). Mỗi biến thể chỉ là một PREPARE (~1 ms); 7 ternary độc lập (128 tổ
  hợp) vẫn bị coi là động.

## Từng câu động trước đây (mã `main` @ `cfe50b6`)

| File:dòng                                               | Khuôn                                                                       | Xử lý                                  | Biến thể |
| ------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------- | -------: |
| `apps/server/src/api/admin/admin-feedback.ts:74`        | `let sql` + `if (…) sql += …` (bộ lọc `source`)                             | mô phỏng đường chạy                    |        2 |
| `apps/server/src/api/admin/admin-feedback.ts:115`       | `let sql` + 2 bộ lọc, `$${paramIdx++}`                                      | mô phỏng + `i++` tuần tự               |        4 |
| `apps/server/src/api/admin/admin-payments.ts:96`        | `let sql` + 2 bộ lọc, `$${params.length}`                                   | mô phỏng + `push`/`.length`            |        4 |
| `apps/server/src/api/admin/admin-stem-review.ts:139`    | mảng `dieuKien` + `join` + ternary `dieuKien.length > 0 ? … : ''`           | mô phỏng + so sánh trong điều kiện     |        4 |
| `apps/server/src/api/core/usage-summary.ts:53`          | `AI_USAGE_COLUMNS` import từ `core-billing/usage` = `Object.values(COLUMN)` | hằng import + `Object.values`          |        1 |
| `packages/core-ai/ttsCacheAudit.ts:73`                  | tham số `sql` của hàm nội bộ `auditOne`                                     | tham số suy từ 2 nơi gọi               |        2 |
| `packages/core-domains/workService.ts:214`              | `let query` + 1 bộ lọc                                                      | mô phỏng                               |        2 |
| `packages/core-domains/workService.ts:303`              | `let query` + 2 bộ lọc, `$${params.length}`                                 | mô phỏng                               |        4 |
| `packages/core-domains/workService.ts:433`              | `let query` + 1 bộ lọc                                                      | mô phỏng                               |        2 |
| `packages/core-personal/automationService.ts:346`       | mảng `clauses` + `limit $${params.length}`                                  | mô phỏng                               |        2 |
| `packages/core-personal/automationService.ts:593`       | như trên                                                                    | mô phỏng                               |        2 |
| `packages/core-personal/companionMessageService.ts:119` | `conditions` 2 bộ lọc (mảng `levels` khai trong nhánh)                      | mô phỏng (khối lồng có phạm vi)        |        4 |
| `packages/core-personal/consentService.ts:140`          | `conditions` (1 hằng + 1 tham số)                                           | mô phỏng                               |        4 |
| `packages/core-personal/decisionLedgerService.ts:431`   | `clauses` 2 bộ lọc + `limit`                                                | mô phỏng                               |        4 |
| `packages/core-personal/lifeGraphService.ts:178`        | `clauses` (1 hằng + 1 tham số)                                              | mô phỏng                               |        4 |
| `packages/core-personal/memoryService.ts:279`           | `conditions` + `limit`                                                      | mô phỏng                               |        4 |
| `packages/core-personal/personErasureService.ts:431`    | xuất: `for (spec of PERSON_TABLES)` + `columns.map(assertIdent).join`       | for-of + hàm trả lại đối số + `.map`   |       21 |
| `packages/core-personal/personErasureService.ts:484`    | xoá: `deleteFrom(table, column)` gọi trong for-of + bảng gốc                | tham số suy từ nơi gọi (+ for-of ở đó) |       22 |
| `packages/core-personal/personService.ts:251`           | `conditions` (1 hằng + 1 tham số)                                           | mô phỏng                               |        4 |
| `packages/core-personal/policyService.ts:146`           | như trên                                                                    | mô phỏng                               |        4 |
| `packages/core-personal/proposedActionService.ts:351`   | `clauses` + `limit`                                                         | mô phỏng                               |        2 |

Không còn câu nào phải giữ "bỏ qua". Đã đọc tay mọi biến thể sinh ra (vd `admin-payments`:
`p.status = $1 and (… like $2 or … like $2)` khi có cả hai bộ lọc, `like $1` khi chỉ có `q`) —
số `$n` khớp đúng thứ tự `params` ở runtime.

## Số đo trước → sau (cùng mã `main` @ `cfe50b6`, Postgres 16, 90 migration)

| Chỉ số                          | Trước (0529) | Sau (0536) |
| ------------------------------- | -----------: | ---------: |
| Câu SQL trích được              |          489 |    **591** |
| PREPARE                         |          485 |    **587** |
| Điều khiển transaction (bỏ qua) |            3 |          3 |
| **Bỏ qua (động)**               |       **21** |      **0** |
| Lỗi ngoài allowlist             |            0 |          0 |
| Allowlist                       |            1 |          1 |

Không mất câu nào: so khớp (file, dòng, SQL) của bộ trích cũ với bộ mới trên toàn bộ 966 file —
0 câu cũ biến mất, 0 lời gọi cũ đổi số biến thể.

## Bug thật

**Không có.** Cả 102 câu mới được kiểm đều PREPARE hợp lệ trên schema hiện tại. (Riêng
`personErasureService` vừa được sửa và có integration test trên DB thật ở 0527; nay cổng CI kiểm
lại cả 43 câu đó mỗi PR — một migration đổi tên cột về sau sẽ đỏ ngay.)

## Thử âm

Sửa tạm `packages/core-domains/workService.ts` `and project_id = $2` → `project_idx` (một nhánh
`if` mà bộ trích cũ bỏ qua): `npm run check:sql` → **exit 1**,
`::error file=packages/core-domains/workService.ts,line=433::column "project_idx" does not exist`
kèm đúng biến thể `… where person_id = $1 and project_idx = $2 …`. Trả lại nguyên văn
(`git checkout`, `git status` sạch phần `packages/`). Lưu ý: dòng báo là dòng lời gọi
`.query(query, …)`, không phải dòng `+=` chứa đoạn sai — SQL rút gọn in kèm đủ để tìm.

## Bằng chứng

- Postgres 16 cục bộ (cụm tạm `pg_createcluster 16 sqldyn536 -p 5536`, `pg_dropcluster --stop`
  sau khi xong): CSDL rỗng → `npm run migrate:pg` exit 0 (90 migration) → `npm run check:sql`
  **exit 0** ("Trích 591 câu SQL tĩnh · PREPARE 587 · … · bỏ qua (động) 0").
- `npx vitest run scripts/lib/sqlExtract.test.ts` → 30/30 (12 ca mới: hằng import + re-export +
  `Object.values`; import bị sửa/kiểu/không nạp được → động; `let sql +=` 4 tổ hợp; `$${i++}`;
  mảng điều kiện + ternary `.length`; 10 `if` không ghi biến không nhân đôi + `return` sớm; for-of
  - hàm trả lại đối số + `.map`; tham số suy từ nơi gọi; hàm export / truyền như giá trị → không
    suy; vòng lặp/closure/truyền mảng/destructuring/`for (x of …)` → động; hàm "trả lại đối số"
    async/rơi ra cuối → không nhận; hằng trùng tên tham số → mơ hồ; trần 64).
- Cổng ở máy: `rm -rf packages/*/dist dist dist-server && npm run typecheck` → 0;
  `npm run lint` → 0; `npx prettier --check` các file đổi → 0; `npx vitest run scripts/` → 0
  (46 file, 487 test). `test:coverage` đủ bộ để CI chạy (không đụng mã nguồn app/server).

## Góp ý tiếp

- Cân nhắc thêm TRẦN số câu "bỏ qua (động)" (vd ≤ 2) để câu SQL dựng động MỚI không lọt cổng im
  lặng — là thay đổi chính sách, chờ chủ dự án quyết.
