// Kiểm chứng bằng PostgreSQL disposable: không chạm dữ liệu production, không gọi AI.
// Chạy: DHCB_DISPOSABLE_DB=1 DATABASE_URL=postgresql://...@127.0.0.1:5432/dhcb_delivery_20261006
//       npx tsx scripts/check-delivery-20261006.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { getPgPool } from '@dhcb/core-db/pgPool'
import { invalidateSettingsCache } from '@dhcb/core-db/settings'
import { checkAndConsumeUsage, refundUsage, AI_USAGE_COLUMNS } from '@dhcb/core-billing/usage'
import { hashPassword, verifyPassword } from '@dhcb/core-auth/authService'
import { changePassword } from '@dhcb/core-auth/changePassword'

const connection = new URL(process.env.DATABASE_URL ?? 'postgresql://invalid/invalid')
assert.equal(process.env.DHCB_DISPOSABLE_DB, '1', 'Cần xác nhận database kiểm thử dùng một lần')
assert.ok(['localhost', '127.0.0.1'].includes(connection.hostname), 'Chỉ kết nối loopback')
assert.equal(connection.pathname, '/dhcb_delivery_20261006', 'Sai tên database kiểm thử')
const pool = getPgPool()
try {
  const existing = await pool.query(
    "select table_name from information_schema.tables where table_schema='public'",
  )
  assert.equal(existing.rows.length, 0, 'Database phải rỗng; không xóa dữ liệu đã có')
  // Bảng tối thiểu theo schema.sql: day là TEXT. Hàm quota/refund dùng migration THẬT bên dưới.
  await pool.query(`
    create table public.users (id uuid primary key, email text unique not null, password_hash text);
    create table public.profiles (id uuid primary key references public.users(id), plan text not null, plan_expires_at timestamptz);
    create table public.sessions (session_token text primary key, user_id uuid not null references public.users(id), expires timestamptz not null);
    create table public.password_resets (token text primary key, user_id uuid not null references public.users(id));
    create table public.app_settings (id int primary key, pro_daily_limit int, vip_daily_limit int, promo_until timestamptz, ai_circuit_breaker bool, leaderboard_enabled bool, updated_at timestamptz);
    insert into public.app_settings values (1,3,0,null,false,false,now());
    create table public.subject_limits (subject text primary key, enforced bool not null);
    insert into public.subject_limits values ('english',true);
    create table public.daily_usage (
      user_id uuid not null references public.users(id), day text not null, subject text not null default 'english',
      chat_count int not null default 0, writing_count int not null default 0,
      speaking_count int not null default 0, stt_count int not null default 0,
      pronounce_count int not null default 0, learn_count int not null default 0,
      primary key(user_id,day,subject)
    );
  `)
  await pool.query(await readFile('postgres/migrations/0065_code_feedback_usage.sql', 'utf8'))
  const vipId = randomUUID(),
    freeId = randomUUID()
  const oldPassword = 'original test password 2026'
  const oldHash = await hashPassword(oldPassword)
  for (const [id, plan] of [
    [vipId, 'vip'],
    [freeId, 'free'],
  ]) {
    await pool.query('insert into public.users values ($1,$2,$3)', [
      id,
      `${id}@example.invalid`,
      oldHash,
    ])
    await pool.query('insert into public.profiles values ($1,$2,null)', [id, plan])
  }
  const results = await Promise.all(
    Array.from({ length: 50 }, () => checkAndConsumeUsage(vipId, 'chat')),
  )
  assert.equal(results.filter((r) => r.ok).length, 50, 'VIP phải vượt cap cũ = 0')
  const day = results[0]
  assert.ok(day?.ok)
  const usage = await pool.query<{ used: number }>(
    `select ${AI_USAGE_COLUMNS.join(' + ')} as used from public.daily_usage where user_id=$1 and day=$2 and subject=$3`,
    [vipId, day.day, 'english'],
  )
  assert.equal(usage.rows[0]?.used, 50, 'Không mất thống kê khi 50 yêu cầu đồng thời')
  await refundUsage(vipId, 'chat', day.day)
  assert.equal(
    (await pool.query('select chat_count from public.daily_usage where user_id=$1', [vipId]))
      .rows[0].chat_count,
    49,
  )
  const freeResults = await Promise.all(
    Array.from({ length: 20 }, () => checkAndConsumeUsage(freeId, 'writing')),
  )
  assert.equal(
    freeResults.filter((r) => r.ok).length,
    3,
    'Free không vượt quota với 20 yêu cầu đồng thời',
  )
  await pool.query(
    "update public.profiles set plan_expires_at=now()-interval '1 day' where id=$1",
    [vipId],
  )
  assert.equal((await checkAndConsumeUsage(vipId, 'chat')).ok, false, 'VIP hết hạn trở lại Free')
  await pool.query('update public.profiles set plan_expires_at=null where id=$1', [vipId])
  await pool.query('update public.app_settings set ai_circuit_breaker=true')
  invalidateSettingsCache()
  assert.equal((await checkAndConsumeUsage(vipId, 'chat')).ok, false, 'VIP không vượt cầu dao')

  await pool.query(
    "insert into public.sessions values ('session-a',$1,now()+interval '1 day'), ('session-b',$1,now()+interval '1 day')",
    [vipId],
  )
  await pool.query("insert into public.password_resets values ('reset-a',$1)", [vipId])
  const passwords = ['new password option one 2026', 'new password option two 2026']
  const changes = await Promise.all(
    passwords.map((next) => changePassword(vipId, oldPassword, next)),
  )
  assert.equal(changes.filter((r) => r.ok).length, 1, 'Chỉ một đổi mật khẩu cạnh tranh được commit')
  const winner = changes.findIndex((r) => r.ok)
  const hash = (await pool.query('select password_hash from public.users where id=$1', [vipId]))
    .rows[0].password_hash as string
  assert.ok(await verifyPassword(passwords[winner]!, hash))
  assert.equal(await verifyPassword(oldPassword, hash), false)
  assert.equal(
    (await pool.query('select * from public.sessions where user_id=$1', [vipId])).rowCount,
    0,
  )
  assert.equal(
    (await pool.query('select * from public.password_resets where user_id=$1', [vipId])).rowCount,
    0,
  )

  // Fault injection nội bộ DB dùng một lần: lỗi thu hồi phiên phải rollback cả hash/reset.
  await pool.query(
    "insert into public.sessions values ('rollback-session',$1,now()+interval '1 day')",
    [freeId],
  )
  await pool.query("insert into public.password_resets values ('rollback-reset',$1)", [freeId])
  await pool.query(`create function reject_session_delete() returns trigger language plpgsql as $$ begin raise exception 'test rollback'; end $$;
    create trigger reject_session_delete before delete on public.sessions for each row execute function reject_session_delete();`)
  await assert.rejects(changePassword(freeId, oldPassword, passwords[0]!))
  assert.equal(
    (await pool.query('select password_hash from public.users where id=$1', [freeId])).rows[0]
      .password_hash,
    oldHash,
  )
  assert.equal(
    (await pool.query('select * from public.password_resets where user_id=$1', [freeId])).rowCount,
    1,
  )
  assert.equal(
    (await pool.query('select * from public.sessions where user_id=$1', [freeId])).rowCount,
    1,
  )
  console.log(
    'PASS: PostgreSQL thật — VIP 50/50, Free 3/20, expiry, breaker, refund, password CAS và transaction rollback.',
  )
} finally {
  await pool.end()
}
