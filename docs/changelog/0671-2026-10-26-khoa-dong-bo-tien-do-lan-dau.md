# 0671 — 2026-10-26 — Khoá theo người dùng cho mọi lần ghi tiến độ học (kể cả lần đồng bộ đầu)

PR #1450. Đợt sửa audit thứ tư: đóng `AUD-DATA-001` (🔴) — mục Cao cuối cùng.

## Vấn đề

`/api/progress` tuần tự hoá hai thiết bị bằng `select … for update` trên `english.learning_progress`.
Khi người dùng CHƯA có dòng (lần đồng bộ đầu tiên), `for update` không có gì để khoá: hai request song
song cùng đọc "rỗng", cùng gộp với trạng thái rỗng, upsert sau đè dữ liệu của upsert trước (cả hai trả
200, `conflict: false`). Cùng kẽ hở ở `_lib/cefrDialogueCheck.ts` (cũng chèn dòng tiến độ): upsert của
progress có thể đè mất hội thoại vừa ghi.

## Đã làm

- `apps/server/src/api/_lib/learningProgressLock.ts` (mới): `lockLearningProgress(client, userId)` =
  `pg_advisory_xact_lock(hashtextextended('learning_progress:<userId>', 0))` — khoá theo user trong
  transaction, tự nhả khi commit/rollback, hiệu lực xuyên tiến trình PM2 (cùng khuôn với `referral.ts`,
  `chatService.ts`).
- `apps/server/src/api/core/progress.ts` và `_lib/cefrDialogueCheck.ts` gọi khoá TRƯỚC khi đọc state.
  Logic gộp, version, ngữ nghĩa "chưa có dòng" giữ nguyên (không chèn dòng giữ chỗ).

## Kiểm chứng

- Đỏ-trước: ca mới ở `apps/server/src/api/core/progress.concurrency.test.ts` (Postgres thật, rào chắn tất
  định như bộ tái hiện audit) ĐỎ với mã cũ (`['cat']` thay vì `['cat','dog']`), XANH sau sửa; 2 ca cũ
  (AC-4, replay) vẫn xanh.
- Bộ tái hiện audit `progress.test.ts.txt` trên Postgres 16 thật (DB tạm, đủ migration, xoá sau khi chạy):
  `main` exit 1 → bản sửa exit 0; 2 đối chứng đạt.
- `vitest apps/server/src` với `DATABASE_URL` thật: 2.138 đạt, 0 bỏ qua. `check:sql`: PREPARE 687 câu đạt.

## Rủi ro và đường lùi

Hai lần ghi tiến độ của CÙNG một người giờ luôn tuần tự (vốn đã vậy khi có dòng) — thêm một câu khoá rẻ
mỗi request. Không đổi schema. Đường lùi: revert PR.
