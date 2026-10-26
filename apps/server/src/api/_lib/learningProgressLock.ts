// learningProgressLock.ts — khoá tuần tự MỌI lần ghi `english.learning_progress` của một người dùng.
//
// Vì sao không đủ với `select … for update`: khi người dùng CHƯA có dòng tiến độ (lần đồng bộ đầu
// tiên), `for update` không có gì để khoá — hai request song song cùng thấy "rỗng", cùng gộp với
// trạng thái rỗng, upsert sau đè mất dữ liệu của upsert trước (audit 2026-10-26, AUD-DATA-001).
// Khoá tư vấn theo user giữ trong transaction (tự nhả khi commit/rollback) và có hiệu lực xuyên
// mọi tiến trình PM2 vì nằm ở Postgres. Mọi nơi ghi bảng này PHẢI gọi hàm này TRƯỚC khi đọc state.
import type { PoolClient } from 'pg'

export async function lockLearningProgress(client: PoolClient, userId: string): Promise<void> {
  await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [
    `learning_progress:${userId}`,
  ])
}
