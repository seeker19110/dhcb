// Test TÍCH HỢP trên Postgres THẬT cho xoá tài khoản + xuất dữ liệu (changelog 0533).
//
// VÌ SAO PHẢI LÀ DB THẬT: mock `pg` trả gì cũng được — không bắt được cột sai tên, thứ tự xoá
// vướng khoá ngoại, ràng buộc CHECK khi ẩn danh hoá, hay "bảng mới có cột người dùng mà chưa khai
// báo". Đúng loại lỗi đã làm export/erase cũ luôn 500 (changelog 0527).
//
// Job `unit` của CI KHÔNG có Postgres ⇒ tự BỎ QUA khi thiếu `DATABASE_URL`. Chạy tay: tạo DB,
// `npm run migrate:pg`, rồi
// `DATABASE_URL=... npx vitest run packages/core-personal/accountErasureService.integration.test.ts`.

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { randomBytes, randomUUID } from 'node:crypto'
import { Pool, type PoolClient } from 'pg'
import { encryptUserField } from '@dhcb/core-config/userDataCrypto'
import {
  ACCOUNT_KEPT_COLUMNS,
  ACCOUNT_TABLES,
  PERSONAL_OS_DELEGATE,
  accountSubjectHash,
  deleteAccount,
  exportAccountData,
  hasLivePendingPayment,
} from './accountErasureService.js'
import { PendingPaymentError } from './accountErasureShared.js'

const DATABASE_URL = process.env.DATABASE_URL
// Khoá mã hoá giả cho test (trường tự do của personal.intake). Không đè khoá thật nếu đã có.
process.env.USER_DATA_MASTER_KEY ??= Buffer.alloc(32, 7).toString('base64')

/** Chuỗi bí mật có dấu hiệu nhận ra được — bản xuất TUYỆT ĐỐI không được chứa chúng. */
const SECRET_MARK = 'SECRET-0533'

const DECLARED = new Set<string>([
  ...ACCOUNT_TABLES.map((s) => `${s.table}.${s.userColumn}`),
  `${PERSONAL_OS_DELEGATE.table}.${PERSONAL_OS_DELEGATE.userColumn}`,
])

interface Seeded {
  userId: string
  email: string
  helperId: string
  personId: string
  paymentPendingId: string
  paymentPaidId: string
  messageId: string
}

function rand(): string {
  return randomBytes(6).toString('hex')
}

async function insertUser(pool: Pool, email: string): Promise<string> {
  const { rows } = await pool.query<{ id: string }>(
    `insert into public.users (email, password_hash) values ($1, $2) returning id`,
    [email, `${SECRET_MARK}-pwhash-${rand()}`],
  )
  const id = rows[0]?.id
  if (!id) throw new Error('không tạo được user')
  return id
}

/**
 * Tạo một người dùng có ≥ 1 dòng ở MỌI (bảng, cột) trong ACCOUNT_TABLES + Personal OS. Bảng hai
 * phía (bạn bè, giới thiệu, người thân theo dõi) dùng một người "helper" riêng của chính người
 * này, để dữ liệu của A và B không đan vào nhau ngoài phòng chat chung (kiểm riêng).
 */
async function seedUser(pool: Pool, tag: string): Promise<Seeded> {
  const email = `acct-0533-${tag}-${rand()}@example.test`
  const u = await insertUser(pool, email)
  const h = await insertUser(pool, `acct-0533-${tag}-helper-${rand()}@example.test`)
  const q = async (sql: string, params: unknown[]): Promise<string> => {
    const { rows } = await pool.query<{ id: string }>(sql, params)
    return String(rows[0]?.id ?? '')
  }

  await q(`insert into public.profiles (id, name) values ($1, $2) returning id`, [
    u,
    `Người ${tag}`,
  ])
  // location — chuyến do u tạo + u là thành viên.
  const s = await q(
    `insert into location.sessions (owner_id, name, invite_code, expires_at)
     values ($1, 'Đi chơi', $2, now() + interval '1 hour') returning id`,
    [u, `${SECRET_MARK}-inv-${rand()}`],
  )
  await q(
    `insert into location.session_members (session_id, user_id) values ($1, $2) returning session_id as id`,
    [s, u],
  )
  await q(
    `insert into location.positions (session_id, user_id, lat, lng) values ($1, $2, 21.0, 105.8) returning session_id as id`,
    [s, u],
  )
  await q(
    `insert into location.consent_log (session_id, user_id, action) values ($1, $2, 'join') returning id`,
    [s, u],
  )
  // chat — phòng riêng do u tạo.
  const room = await q(
    `insert into chat.rooms (is_group, created_by) values (false, $1) returning id`,
    [u],
  )
  await q(
    `insert into chat.room_members (room_id, user_id) values ($1, $2) returning room_id as id`,
    [room, u],
  )
  const messageId = await q(
    `insert into chat.messages (room_id, sender_id, content) values ($1, $2, $3) returning id`,
    [room, u, `tin riêng của ${tag}`],
  )
  await q(
    `insert into chat.moderation_events (user_id, message_id, severity, matched, action)
     values ($1, $2, 'low', '{x}', 'flag') returning id`,
    [u, messageId],
  )
  // english
  await q(
    `insert into english.challenge_entries (user_id, day, challenge_day, topic_day, transcript) values ($1, current_date, 1, 1, 'hello') returning id`,
    [u],
  )
  await q(
    `insert into english.chat_sessions (id, user_id, created_at) values (gen_random_uuid(), $1, 1) returning id`,
    [u],
  )
  await q(`insert into english.learning_progress (user_id) values ($1) returning user_id as id`, [
    u,
  ])
  await q(
    `insert into english.mistakes (id, user_id, dedupe_key, wrong, source, dir, created_at) values (gen_random_uuid(), $1, $2, 'i goes', 'chat', 'A', now()) returning id`,
    [u, `k-${tag}`],
  )
  await q(
    `insert into english.speaking_sessions (id, user_id, created_at) values (gen_random_uuid(), $1, 1) returning id`,
    [u],
  )
  await q(
    `insert into english.tutor_feedback (user_id, source, user_input, ai_feedback) values ($1, 'chat', 'in', 'out') returning id`,
    [u],
  )
  await q(`insert into english.user_profile (user_id) values ($1) returning user_id as id`, [u])
  await q(
    `insert into english.writing_submissions (id, user_id, submitted_at) values (gen_random_uuid(), $1, 1) returning id`,
    [u],
  )
  // personal (theo user_id) — hai câu tự do MÃ HOÁ như intakeService thật.
  await q(
    `insert into personal.intake (user_id, focus, extra_hour_enc, flow_activity_enc)
     values ($1, 'hoc_thi', $2, $3) returning user_id as id`,
    [u, await encryptUserField(u, `vẽ tranh ${tag}`), await encryptUserField(u, `đọc sách ${tag}`)],
  )
  await q(
    `insert into personal.learner_intent (user_id, subject_ids) values ($1, '{english}') returning user_id as id`,
    [u],
  )
  // platform
  await q(
    `insert into platform.completion_evidence (user_id, subject_id, content_id, activity_kind, attempt_id,
       correct, total, ratio, passed, answers, client_at)
     values ($1, 'biology', 'sinh10-c1-b1', 'stem_lesson_check', $2, 1, 1, 1, true, '[]', now()) returning id`,
    [u, `attempt-${rand()}-${rand()}`],
  )
  await q(
    `insert into platform.completion_state (user_id, subject_id, content_id, status, best_ratio, last_ratio) values ($1, 'biology', 'sinh10-c1-b1', 'completed', 1, 1) returning user_id as id`,
    [u],
  )
  await q(
    `insert into platform.feature_state (user_id, feature, state) values ($1, 'demo', '{}') returning user_id as id`,
    [u],
  )
  // programming
  await q(`insert into programming.learner_state (user_id) values ($1) returning user_id as id`, [
    u,
  ])
  await q(
    `insert into programming.lesson_progress (user_id, lesson_id) values ($1, 'p1-l1') returning user_id as id`,
    [u],
  )
  await q(
    `insert into programming.path_artifacts (user_id, path_id, phase_id, url) values ($1, 'ai-eng', 'ai-eng-p1', 'https://example.test') returning id`,
    [u],
  )
  await q(
    `insert into programming.path_progress (user_id, path_id, stage_id) values ($1, 'ai-eng', 'web-s1') returning user_id as id`,
    [u],
  )
  await q(
    `insert into programming.project_files (user_id, path) values ($1, 'main.ts') returning user_id as id`,
    [u],
  )
  await q(
    `insert into programming.project_snapshots (user_id, milestone, files) values ($1, 'm1', '{}') returning id`,
    [u],
  )
  await q(
    `insert into programming.spec_enrollment (user_id, spec_id, role) values ($1, 'web', 'primary') returning user_id as id`,
    [u],
  )
  await q(
    `insert into programming.spec_stage_progress (user_id, spec_id, stage_id) values ($1, 'web', 'web-s1') returning user_id as id`,
    [u],
  )
  // public
  await q(
    `insert into public.achievement_claims (user_id, achievement_id) values ($1, 'a1') returning user_id as id`,
    [u],
  )
  await q(
    `insert into public.analytics_events (event, user_id) values ('signup', $1) returning id`,
    [u],
  )
  await q(
    `insert into public.companion_invites (code, learner_id, expires_at) values ($1, $2, now() + interval '1 day') returning code as id`,
    [`${SECRET_MARK}-cinv-${rand()}`, u],
  )
  await q(
    `insert into public.companion_invites (code, learner_id, expires_at, used_by, used_at) values ($1, $2, now() + interval '1 day', $3, now()) returning code as id`,
    [`used-${rand()}`, h, u],
  )
  await q(
    `insert into public.companion_links (learner_id, watcher_id) values ($1, $2) returning id`,
    [u, h],
  )
  await q(
    `insert into public.companion_links (learner_id, watcher_id) values ($1, $2) returning id`,
    [h, u],
  )
  await q(
    `insert into public.daily_plan_completions (user_id, action_kind, planner_version, source, evidence) values ($1, 'srs_review', 'v1', 'progress_merge', '{"reviewedCardCount":1}') returning id`,
    [u],
  )
  await q(
    `insert into public.daily_usage (user_id, day) values ($1, '2026-10-08') returning user_id as id`,
    [u],
  )
  await q(`insert into public.email_reminders (user_id) values ($1) returning user_id as id`, [u])
  await q(
    `insert into public.email_verifications (user_id, code_hash, expires_at) values ($1, $2, now()) returning user_id as id`,
    [u, `${SECRET_MARK}-evh-${rand()}`],
  )
  await q(`insert into public.entitlements (user_id) values ($1) returning user_id as id`, [u])
  await q(
    `insert into public.exam_plans (user_id, exam_kind, exam_date) values ($1, 'ielts', current_date) returning id`,
    [u],
  )
  await q(
    `insert into public.free_daily_credit (user_id, day) values ($1, current_date) returning user_id as id`,
    [u],
  )
  await q(`insert into public.friendships (user_id_a, user_id_b) values ($1, $2) returning id`, [
    u,
    h,
  ])
  await q(`insert into public.friendships (user_id_a, user_id_b) values ($1, $2) returning id`, [
    h,
    u,
  ])
  await q(
    `insert into public.identities (provider, provider_user_id, user_id) values ('google', $1, $2) returning user_id as id`,
    [`sub-${rand()}`, u],
  )
  await q(
    `insert into public.password_resets (user_id, token_hash, expires_at) values ($1, $2, now()) returning id`,
    [u, `${SECRET_MARK}-prt-${rand()}`],
  )
  // Đơn 'pending' đã quá hạn + ân hạn 24h (webhook không còn tự cấp được) ⇒ KHÔNG chặn xoá, bị ẩn
  // danh thành 'expired'. Đơn còn trong ân hạn chặn xoá — ca riêng bên dưới (rà soát 0533).
  const paymentPendingId = await q(
    `insert into public.payments (user_id, plan, cycle, amount_vnd, payment_code, expires_at)
     values ($1, 'vip', 'month', 99000, $2, now() - interval '25 hours') returning id`,
    [u, `DHCB${rand()}`],
  )
  const paymentPaidId = await q(
    `insert into public.payments (user_id, plan, cycle, amount_vnd, payment_code, expires_at, status, paid_at, provider_txn_id)
     values ($1, 'vip', 'year', 990000, $2, now(), 'paid', now(), $3) returning id`,
    [u, `DHCB${rand()}`, `txn-${rand()}`],
  )
  await q(
    `insert into public.push_subscriptions (user_id, endpoint, p256dh, auth_key) values ($1, $2, $3, $4) returning id`,
    [
      u,
      `https://push.example.test/${SECRET_MARK}-${rand()}`,
      `${SECRET_MARK}-p256-${rand()}`,
      `${SECRET_MARK}-auth-${rand()}`,
    ],
  )
  await q(
    `insert into public.quest_claims (user_id, quest_key) values ($1, 'q1') returning user_id as id`,
    [u],
  )
  await q(
    `insert into public.referrals (referrer_id, referee_id, device_hash) values ($1, $2, $3) returning id`,
    [u, h, `${SECRET_MARK}-dev-${rand()}`],
  )
  await q(`insert into public.referrals (referrer_id, referee_id) values ($1, $2) returning id`, [
    h,
    u,
  ])
  await q(
    `insert into public.sessions (session_token, user_id, expires) values ($1, $2, now() + interval '1 day') returning user_id as id`,
    [`${SECRET_MARK}-sess-${rand()}`, u],
  )
  await q(
    `insert into public.stem_lesson_reviews (lesson_id, mon, loai, nguoi_duyet, user_id, phien_ban_tieu_chi, tieu_chi, bam_noi_dung)
     values ('sinh10-c1-b1', 'biology', 'nguoi-duyet', $1, $2, 'sinh-v1', '{}', $3) returning id`,
    [`Người duyệt ${tag} ${rand()}`, u, randomBytes(32).toString('hex')],
  )
  await q(
    `insert into public.sync_conflicts (user_id, doc_kind, doc_id, field, local_doc, remote_doc) values ($1, 'progress', 'd', 'f', '{}', '{}') returning id`,
    [u],
  )
  await q(
    `insert into public.sync_receipts (user_id, attempt_id, endpoint, response) values ($1, $2, 'progress', '{}') returning user_id as id`,
    [u, `attempt-${rand()}`],
  )
  await q(`insert into public.user_2fa (user_id, secret) values ($1, $2) returning user_id as id`, [
    u,
    `${SECRET_MARK}-totp-${rand()}`,
  ])
  await q(
    `insert into public.user_2fa_recovery_codes (user_id, code_hash) values ($1, $2) returning id`,
    [u, `${SECRET_MARK}-rch-${rand()}`],
  )
  await q(
    `insert into public.user_feedback (user_id, category, message, admin_notes) values ($1, 'bug', 'góp ý thật', $2) returning id`,
    [u, `${SECRET_MARK}-admin-${rand()}`],
  )
  await q(
    `insert into public.weekly_ai_credit (user_id, week_start) values ($1, current_date) returning user_id as id`,
    [u],
  )
  // Khớp theo EMAIL, khác hoa thường để kiểm `lower()`.
  await q(
    `insert into public.feature_status_checks (triggered_by, triggered_by_email, overall_status, results) values ('manual', $1, 'up', '{}') returning id`,
    [email.toUpperCase()],
  )
  // Personal OS (đủ 21 bảng đã có test riêng ở personErasureService.integration.test.ts).
  const personId = await q(
    `insert into personal.persons (user_id, display_name) values ($1, $2) returning id`,
    [u, `Người ${tag}`],
  )
  await q(
    `insert into personal.memory_records (person_id, namespace, content, provenance, sensitivity, status)
     values ($1, 'semantic', $2, 'user', 'personal', 'accepted') returning id`,
    [personId, `ký ức ${tag}`],
  )

  return { userId: u, email, helperId: h, personId, paymentPendingId, paymentPaidId, messageId }
}

/** Số dòng của người dùng ở MỌI (bảng, cột) khai báo — khoá `bảng.cột`. */
async function countByUser(
  pool: Pool,
  userId: string,
  email: string,
): Promise<Record<string, number>> {
  const out: Record<string, number> = {}
  for (const spec of ACCOUNT_TABLES) {
    const where =
      spec.match === 'email' ? `lower(${spec.userColumn}) = lower($1)` : `${spec.userColumn} = $1`
    const { rows } = await pool.query<{ n: string }>(
      `select count(*)::text as n from ${spec.table} where ${where}`,
      [spec.match === 'email' ? email : userId],
    )
    out[`${spec.table}.${spec.userColumn}`] = Number(rows[0]?.n ?? 0)
  }
  return out
}

describe.skipIf(!DATABASE_URL)('xoá tài khoản + xuất dữ liệu (Postgres thật)', () => {
  let pool: Pool
  const cleanupUsers: string[] = []

  beforeAll(() => {
    pool = new Pool({ connectionString: DATABASE_URL })
  })

  afterAll(async () => {
    if (cleanupUsers.length) {
      // Dọn dữ liệu test: đơn thanh toán phải ẩn danh trước (FK restrict — đúng bất biến đang test).
      await pool.query(
        `update public.payments set user_id = null, anonymized_at = now() where user_id = any($1::uuid[])`,
        [cleanupUsers],
      )
      await pool.query('delete from public.users where id = any($1::uuid[])', [cleanupUsers])
    }
    await pool.end()
  })

  // ── AC1: danh sách khai báo phủ ĐỦ schema ────────────────────────────────────

  it('mọi khoá ngoại trỏ public.users đều được khai báo (xoá/ẩn danh/uỷ Personal OS)', async () => {
    const { rows } = await pool.query<{ ref: string }>(
      `select n.nspname || '.' || c.relname || '.' || a.attname as ref
         from pg_constraint k
         join pg_class c on c.oid = k.conrelid
         join pg_namespace n on n.oid = c.relnamespace
         join pg_attribute a on a.attrelid = k.conrelid and a.attnum = any(k.conkey)
        where k.contype = 'f' and k.confrelid = 'public.users'::regclass`,
    )
    const missing = rows.map((r) => r.ref).filter((ref) => !DECLARED.has(ref))
    expect(missing, 'bảng mới trỏ public.users chưa khai báo trong ACCOUNT_TABLES').toEqual([])
  })

  it('mọi cột mang tên người dùng (kể cả không có khoá ngoại) đều được khai báo', async () => {
    const { rows } = await pool.query<{ ref: string }>(
      `select c.table_schema || '.' || c.table_name || '.' || c.column_name as ref
         from information_schema.columns c
         join information_schema.tables t
           on t.table_schema = c.table_schema and t.table_name = c.table_name
        where t.table_type = 'BASE TABLE'
          and c.table_schema not in ('pg_catalog', 'information_schema')
          and c.column_name ~ '^(user_id|user_id_[a-z]|[a-z_]+_user_id|owner_id|sender_id|receiver_id|recipient_id|inviter_id|invitee_id|referrer_id|referee_id|learner_id|watcher_id|author_id|actor_id|used_by|created_by)$'`,
    )
    // Trùng mẫu tên nhưng KHÔNG trỏ người dùng của mình — kèm lý do, không phải lối thoát chung.
    const NOT_A_USER_REFERENCE: Record<string, string> = {
      'public.identities.provider_user_id':
        'id tài khoản ở nhà cung cấp OAuth (Google `sub`…); cả dòng bị xoá theo identities.user_id',
    }
    const missing = rows
      .map((r) => r.ref)
      .filter((ref) => !DECLARED.has(ref) && !(ref in NOT_A_USER_REFERENCE))
    expect(missing).toEqual([])
  })

  it('mọi cột email đều được xử lý: khớp theo email, nằm trong bảng bị xoá dòng, hoặc giữ có lý do', async () => {
    const { rows } = await pool.query<{ tbl: string; col: string }>(
      `select c.table_schema || '.' || c.table_name as tbl, c.column_name as col
         from information_schema.columns c
         join information_schema.tables t
           on t.table_schema = c.table_schema and t.table_name = c.table_name
        where t.table_type = 'BASE TABLE' and c.column_name ~ 'email'
          and c.table_schema not in ('pg_catalog', 'information_schema')`,
    )
    const rowDeleted = new Set<string>(
      ACCOUNT_TABLES.filter((s) => s.erase.kind === 'delete').map((s) => s.table),
    )
    rowDeleted.add('public.users')
    const kept = new Set(ACCOUNT_KEPT_COLUMNS.map((k) => `${k.table}.${k.column}`))
    const handled = (tbl: string, col: string): boolean =>
      DECLARED.has(`${tbl}.${col}`) || rowDeleted.has(tbl) || kept.has(`${tbl}.${col}`)
    const unhandled = rows.filter((r) => !handled(r.tbl, r.col)).map((r) => `${r.tbl}.${r.col}`)
    expect(unhandled).toEqual([])
  })

  it('mọi (bảng, cột) khai báo tồn tại thật trong schema', async () => {
    for (const spec of ACCOUNT_TABLES) {
      const [schema, table] = spec.table.split('.')
      const { rows } = await pool.query<{ column_name: string }>(
        `select column_name from information_schema.columns where table_schema = $1 and table_name = $2`,
        [schema, table],
      )
      const cols = new Set(rows.map((r) => r.column_name))
      expect(cols.has(spec.userColumn), `${spec.table}.${spec.userColumn}`).toBe(true)
      for (const c of spec.columns) expect(cols.has(c), `${spec.table}.${c}`).toBe(true)
    }
  })

  // ── AC2/AC3/AC5: xuất + xoá trên dữ liệu thật ──────────────────────────────

  it('xuất A đủ mọi mục, không lẫn B, không lộ bí mật; xoá A sạch, thanh toán ẩn danh, B nguyên vẹn', async () => {
    const a = await seedUser(pool, 'a')
    const b = await seedUser(pool, 'b')
    cleanupUsers.push(a.userId, a.helperId, b.userId, b.helperId)

    // Phòng chat CHUNG do B tạo: A và B cùng nhắn.
    const { rows: roomRows } = await pool.query<{ id: string }>(
      `insert into chat.rooms (is_group, created_by) values (false, $1) returning id`,
      [b.userId],
    )
    const shared = roomRows[0]?.id ?? ''
    await pool.query(`insert into chat.room_members (room_id, user_id) values ($1, $2), ($1, $3)`, [
      shared,
      a.userId,
      b.userId,
    ])
    const { rows: msgRows } = await pool.query<{ id: string; sender_id: string }>(
      `insert into chat.messages (room_id, sender_id, content)
       values ($1, $2, 'A nói trong phòng chung'), ($1, $3, 'B trả lời') returning id, sender_id`,
      [shared, a.userId, b.userId],
    )
    const sharedMsgA = msgRows.find((m) => m.sender_id === a.userId)?.id ?? ''
    const sharedMsgB = msgRows.find((m) => m.sender_id === b.userId)?.id ?? ''

    // ── Xuất ──
    const exported = await exportAccountData(pool, a.userId)
    expect(exported.userId).toBe(a.userId)
    expect(exported.account).toMatchObject({ id: a.userId, email: a.email })
    expect(exported.account).not.toHaveProperty('password_hash')
    for (const spec of ACCOUNT_TABLES) {
      expect(exported.tables[spec.exportKey].length, spec.exportKey).toBeGreaterThanOrEqual(1)
    }
    expect(exported.personalOs?.personId).toBe(a.personId)
    expect(exported.personalOs?.memories.map((m) => m.content)).toEqual(['ký ức a'])
    // Hồ sơ ẩn: câu tự do đã GIẢI MÃ, không còn khoá `_enc`.
    expect(exported.tables.intake[0]).toMatchObject({
      focus: 'hoc_thi',
      extra_hour: 'vẽ tranh a',
      flow_activity: 'đọc sách a',
    })
    expect(exported.tables.intake[0]).not.toHaveProperty('extra_hour_enc')
    // Tin đã gửi: cả tin riêng lẫn tin trong phòng chung, KHÔNG có tin của B.
    expect(exported.tables.chatMessagesSent.map((m) => m.content).sort()).toEqual(
      ['A nói trong phòng chung', 'tin riêng của a'].sort(),
    )
    const json = JSON.stringify(exported)
    expect(json).not.toContain(SECRET_MARK)
    expect(json).not.toContain(b.userId)
    expect(json).not.toContain(a.helperId)

    // ── Xoá ──
    const beforeB = await countByUser(pool, b.userId, b.email)
    const result = await deleteAccount(pool, a.userId)

    // Mọi bảng khai báo: 0 dòng còn gắn A.
    const afterA = await countByUser(pool, a.userId, a.email)
    expect(Object.entries(afterA).filter(([, n]) => n !== 0)).toEqual([])
    const userA = await pool.query('select 1 from public.users where id = $1', [a.userId])
    expect(userA.rowCount).toBe(0)
    const personA = await pool.query('select 1 from personal.persons where id = $1', [a.personId])
    expect(personA.rowCount).toBe(0)

    // Chứng từ thanh toán: còn ĐỦ dòng, đã ẩn danh; đơn chưa trả thành `expired`.
    const pays = await pool.query<{
      id: string
      user_id: string | null
      anonymized_at: Date | null
      status: string
      amount_vnd: number
    }>(
      'select id, user_id, anonymized_at, status, amount_vnd from public.payments where id = any($1::uuid[]) order by amount_vnd',
      [[a.paymentPendingId, a.paymentPaidId]],
    )
    expect(pays.rows).toHaveLength(2)
    for (const p of pays.rows) {
      expect(p.user_id).toBeNull()
      expect(p.anonymized_at).not.toBeNull()
    }
    expect(pays.rows.map((p) => [p.amount_vnd, p.status])).toEqual([
      [99000, 'expired'],
      [990000, 'paid'],
    ])

    // Chat: tin A trong phòng chung bị thay nội dung + gỡ người gửi; tin B nguyên chữ.
    const msgs = await pool.query<{
      id: string
      content: string
      sender_id: string | null
      deleted_at: Date | null
    }>('select id, content, sender_id, deleted_at from chat.messages where id = any($1::uuid[])', [
      [sharedMsgA, sharedMsgB, a.messageId],
    ])
    const byId = new Map(msgs.rows.map((m) => [m.id, m]))
    expect(byId.get(sharedMsgA)).toMatchObject({ content: '[đã xoá]', sender_id: null })
    expect(byId.get(sharedMsgA)?.deleted_at).not.toBeNull()
    expect(byId.get(a.messageId)).toMatchObject({ content: '[đã xoá]', sender_id: null })
    expect(byId.get(sharedMsgB)).toMatchObject({ content: 'B trả lời', sender_id: b.userId })
    expect(byId.get(sharedMsgB)?.deleted_at).toBeNull()

    // B: số dòng mọi bảng y nguyên.
    expect(await countByUser(pool, b.userId, b.email)).toEqual(beforeB)
    const userB = await pool.query('select 1 from public.users where id = $1', [b.userId])
    expect(userB.rowCount).toBe(1)

    // Nhật ký: đúng một dòng, không chứa danh tính.
    expect(result.recordsAnonymized).toBeGreaterThanOrEqual(7)
    expect(result.tableCounts['public.payments.user_id']).toEqual({ action: 'anonymize', rows: 2 })
    expect(result.personErasureLogId).not.toBeNull()
    const log = await pool.query<Record<string, unknown>>(
      'select * from platform.account_erasure_log where subject_hash = $1',
      [accountSubjectHash(a.userId)],
    )
    expect(log.rowCount).toBe(1)
    const logJson = JSON.stringify(log.rows[0])
    expect(logJson).not.toContain(a.userId)
    expect(logJson.toLowerCase()).not.toContain(a.email.toLowerCase())
    expect(log.rows[0]).toMatchObject({
      initiated_by: 'self',
      records_deleted_count: result.recordsDeleted,
      records_anonymized_count: result.recordsAnonymized,
    })
  })

  it('nhật ký xoá là append-only: update/delete đều bị Postgres chặn', async () => {
    const { rows } = await pool.query<{ id: string }>(
      `insert into platform.account_erasure_log
         (subject_hash, initiated_by, table_counts, records_deleted_count, records_anonymized_count)
       values ($1, 'self', '{}', 0, 0) returning id`,
      [accountSubjectHash(randomUUID())],
    )
    const id = rows[0]?.id
    await expect(
      pool.query(
        'update platform.account_erasure_log set records_deleted_count = 1 where id = $1',
        [id],
      ),
    ).rejects.toThrow(/chỉ-thêm/)
    await expect(
      pool.query('delete from platform.account_erasure_log where id = $1', [id]),
    ).rejects.toThrow(/chỉ-thêm/)
  })

  it('xoá thẳng public.users khi còn đơn chưa ẩn danh ⇒ bị chặn (FK restrict), chứng từ không mất', async () => {
    const c = await seedUser(pool, 'c')
    cleanupUsers.push(c.userId, c.helperId)
    await expect(
      pool.query('delete from public.users where id = $1', [c.userId]),
    ).rejects.toMatchObject({
      code: '23503',
    })
    const pays = await pool.query('select 1 from public.payments where user_id = $1', [c.userId])
    expect(pays.rowCount).toBe(2)
  })

  // ── Rà soát 0533: còn đơn chờ trả ⇒ từ chối xoá ─────────────────────────────

  it.each([
    { label: 'chưa tới hạn (+30 phút)', offset: '30 minutes' },
    { label: 'quá hạn nhưng còn trong ân hạn (−23 giờ)', offset: '-23 hours' },
  ])(
    'còn đơn pending $label ⇒ PendingPaymentError, KHÔNG đổi dữ liệu nào, không nhật ký',
    async ({ offset }) => {
      const g = await seedUser(pool, 'g')
      cleanupUsers.push(g.userId, g.helperId)
      const liveId = await pool.query<{ id: string }>(
        `insert into public.payments (user_id, plan, cycle, amount_vnd, payment_code, expires_at)
         values ($1, 'vip', 'month', 99000, $2, now() + $3::interval)
         returning id`,
        [g.userId, `DHCB${rand()}`, offset],
      )
      const before = await countByUser(pool, g.userId, g.email)

      await expect(deleteAccount(pool, g.userId)).rejects.toBeInstanceOf(PendingPaymentError)

      expect(await countByUser(pool, g.userId, g.email)).toEqual(before)
      const pay = await pool.query<{ user_id: string | null; status: string }>(
        'select user_id, status from public.payments where id = $1',
        [liveId.rows[0]?.id],
      )
      expect(pay.rows[0]).toEqual({ user_id: g.userId, status: 'pending' })
      const log = await pool.query(
        'select 1 from platform.account_erasure_log where subject_hash = $1',
        [accountSubjectHash(g.userId)],
      )
      expect(log.rowCount).toBe(0)
      expect(await hasLivePendingPayment(pool, g.userId)).toBe(true)
    },
  )

  it('hasLivePendingPayment: đơn paid/expired hoặc pending quá ân hạn ⇒ false', async () => {
    const h = await seedUser(pool, 'h') // fixture: 1 paid + 1 pending quá hạn 25 giờ
    cleanupUsers.push(h.userId, h.helperId)
    expect(await hasLivePendingPayment(pool, h.userId)).toBe(false)
  })

  // ── AC4: lỗi giữa chừng ⇒ rollback toàn bộ ─────────────────────────────────

  it('một câu lỗi giữa chừng ⇒ rollback: dữ liệu còn nguyên, không có nhật ký', async () => {
    const d = await seedUser(pool, 'd')
    cleanupUsers.push(d.userId, d.helperId)
    const before = await countByUser(pool, d.userId, d.email)

    // Pool bọc: ném lỗi đúng ở câu xoá `public.sessions` (giữa danh sách, sau nhiều câu đã chạy).
    const failing = {
      connect: async (): Promise<PoolClient> => {
        const client = await pool.connect()
        const realQuery = client.query.bind(client) as (
          sql: string,
          params?: unknown[],
        ) => Promise<unknown>
        const patched = Object.create(client) as PoolClient
        Object.assign(patched, {
          query: (sql: string, params?: unknown[]) =>
            sql.startsWith('delete from public.sessions')
              ? Promise.reject(new Error('lỗi giả lập giữa chừng'))
              : realQuery(sql, params),
          release: () => client.release(),
        })
        return patched
      },
    } as unknown as Pool

    await expect(deleteAccount(failing, d.userId)).rejects.toThrow('lỗi giả lập giữa chừng')
    expect(await countByUser(pool, d.userId, d.email)).toEqual(before)
    const pays = await pool.query<{ user_id: string | null }>(
      'select user_id from public.payments where id = $1',
      [d.paymentPendingId],
    )
    expect(pays.rows[0]?.user_id).toBe(d.userId)
    const log = await pool.query(
      'select 1 from platform.account_erasure_log where subject_hash = $1',
      [accountSubjectHash(d.userId)],
    )
    expect(log.rowCount).toBe(0)
  })

  it('hai yêu cầu xoá song song: đúng một thành công, cái kia NotFound; không nhật ký đôi', async () => {
    const e = await seedUser(pool, 'e')
    cleanupUsers.push(e.helperId)
    const results = await Promise.allSettled([
      deleteAccount(pool, e.userId),
      deleteAccount(pool, e.userId),
    ])
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    const rejected = results.find((r) => r.status === 'rejected')
    expect(rejected?.status === 'rejected' ? String(rejected.reason) : '').toMatch(
      /Không tìm thấy tài khoản/,
    )
    const log = await pool.query(
      'select 1 from platform.account_erasure_log where subject_hash = $1',
      [accountSubjectHash(e.userId)],
    )
    expect(log.rowCount).toBe(1)
  })

  it('người dùng chưa có Person vẫn xoá được (Personal OS là tuỳ chọn)', async () => {
    const id = await insertUser(pool, `acct-0533-bare-${rand()}@example.test`)
    const res = await deleteAccount(pool, id)
    expect(res.personErasureLogId).toBeNull()
    expect(res.tableCounts['personal.persons.user_id']).toEqual({ action: 'delete', rows: 0 })
    expect(res.recordsDeleted).toBe(1)
  })
})
