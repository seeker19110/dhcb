# 0696 — 2026-11-06 — SRS hoà hoàn toàn giữ bản đang lưu, hết đồng bộ thừa (AUD-XFEAT-004)

## Vấn đề

Audit delta 2026-11-06 (`docs/ops/AUDIT-REPORT-2026-11-06-delta.md`): bản sửa AUD-XFEAT-001
(`0673`) cho client và server dùng chung `mergeSrsMap`, nhưng khi hoà hoàn toàn (cùng `reps`, cùng
`due`) bản ở máy (`b`) vẫn thắng. Thẻ ở máy giữ thứ tự khoá của `toStored` (`due, stability,
difficulty…`), còn Postgres jsonb trả khoá theo độ dài (`due, reps, state…`). Vì vậy
`JSON.stringify(merged) !== JSON.stringify(cloud.srs)` luôn đúng → mỗi lần kéo tiến độ về lại đẩy
lên một lượt và tăng `version`. Không mất dữ liệu; tốn ghi DB và mạng.

## Sửa

- `packages/core-learner/srsMerge.ts`: hoà hoàn toàn → giữ `a` (bản đang lưu: cloud ở client,
  dòng DB ở server). Hai bản cùng `reps` + `due` là cùng một lần ôn nên không mất tiến độ; `due`
  của `b` xa hơn thì `b` vẫn thắng như trước.

## Kiểm chứng

- Đỏ trước: test mới `progressSync.test.ts` "SRS giống hệt nhưng cloud trả thứ tự khoá kiểu
  jsonb" → 1 lượt POST thừa (`expected length 0 but got 1`). Sau sửa: xanh.
- `progressMerge.test.ts`: thêm ca hoà hoàn toàn giữ đúng object `a`; tách ca "b mới hơn".
- `vitest` progressSync + progressMerge + core-learner: 17 file / 230 test xanh.
- Nơi gọi: `apps/server/src/api/_lib/progressMerge.ts` (server), `apps/dhcb/src/lib/progressSync.ts`
  (client) — grep, `codemap` hết bộ nhớ trong container.
