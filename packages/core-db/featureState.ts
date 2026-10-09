// featureState.ts — API đọc/ghi trạng thái tính năng theo user (bảng platform.feature_state).
//
// Thay cho các `Map` in-memory cấp module trong handler (vi phạm 12-factor stateless — mất
// khi restart, vỡ trong PM2 cluster). Mỗi (user, feature) một dòng JSONB.
// Migration: postgres/migrations/0058_platform_feature_state.sql.

import { getPgPool } from './pgPool.js'

// Đọc state của một tính năng cho user — null nếu chưa có (caller tự khởi tạo mặc định).
export async function getFeatureState<T>(userId: string, feature: string): Promise<T | null> {
  const pool = getPgPool()
  const { rows } = await pool.query<{ state: T }>(
    'select state from platform.feature_state where user_id = $1 and feature = $2',
    [userId, feature],
  )
  return rows[0]?.state ?? null
}

// Ghi (upsert) toàn bộ state của một tính năng cho user.
export async function setFeatureState<T>(userId: string, feature: string, state: T): Promise<void> {
  const pool = getPgPool()
  await pool.query(
    `insert into platform.feature_state (user_id, feature, state, updated_at)
     values ($1, $2, $3::jsonb, now())
     on conflict (user_id, feature) do update set state = excluded.state, updated_at = now()`,
    [userId, feature, JSON.stringify(state)],
  )
}

// ── Khoá "đang chạy" theo (user, tên khoá) — chống hai request ĐUA nhau làm cùng một việc tốn
// tiền (vd bấm "Tạo" hai lần → hai lời gọi AI, trừ hai lượt). Dùng lại bảng feature_state, KHÔNG
// thêm bảng: một dòng với `feature = <tên khoá>` là "đang giữ khoá". Upsert có điều kiện là
// NGUYÊN TỬ ở Postgres nên đúng cả khi chạy nhiều tiến trình PM2 (Map in-memory thì không).
// Khoá tự hết hạn sau `ttlSeconds` — tiến trình chết giữa chừng không khoá người dùng mãi mãi.
// Changelog 0549 (Action Canvas phân rã mục tiêu bằng AI).

// [Vòng sửa sau rà bảo mật 0549] Khoá có ĐỊNH DANH CHỦ: mỗi lần giữ sinh một token ngẫu nhiên
// lưu ở `state.t`, và chỉ người giữ đúng token mới nhả được. Không có token thì: request A chạy quá
// TTL → B giữ khoá → A xong, `finally` của A xoá khoá CỦA B → C lọt vào chạy song song với B.

/** Thử giữ khoá. Trả token chủ khoá; `null` = đang có request khác giữ (chưa hết hạn). */
export async function tryAcquireFeatureLock(
  userId: string,
  lockName: string,
  ttlSeconds: number,
): Promise<string | null> {
  const pool = getPgPool()
  const token = crypto.randomUUID()
  const { rows } = await pool.query<{ acquired: boolean }>(
    `insert into platform.feature_state (user_id, feature, state, updated_at)
     values ($1, $2, jsonb_build_object('t', $4::text), now())
     on conflict (user_id, feature) do update set state = excluded.state, updated_at = now()
       where platform.feature_state.updated_at < now() - make_interval(secs => $3::int)
     returning true as acquired`,
    [userId, lockName, ttlSeconds, token],
  )
  return rows[0]?.acquired === true ? token : null
}

/**
 * Nhả khoá — CHỈ khi khoá còn là của mình (đúng token). Khoá đã hết hạn và bị request khác giữ
 * thì không đụng tới. Gọi trong `finally`; lỗi nhả khoá để nơi gọi tự quyết (khoá vẫn tự hết hạn).
 */
export async function releaseFeatureLock(
  userId: string,
  lockName: string,
  token: string,
): Promise<void> {
  const pool = getPgPool()
  await pool.query(
    `delete from platform.feature_state
     where user_id = $1 and feature = $2 and state->>'t' = $3`,
    [userId, lockName, token],
  )
}
