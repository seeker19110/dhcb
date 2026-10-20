// packages/core-location/locationService.ts — Business logic "Đi chung" (chia sẻ vị trí).
//
// Luật bảo mật (CLAUDE.md mục 4.2 — không tin client):
//  - MỌI hàm đọc/ghi đều tự kiểm (sessionId, userId) có phải thành viên ĐANG ở trong chuyến,
//    chuyến chưa kết thúc và chưa hết hạn. Client gửi đúng sessionId KHÔNG đủ để có quyền.
//  - Vị trí của người đang TẮT chia sẻ không bao giờ rời khỏi DB (đã xoá khi tắt) — hàm đọc
//    vẫn lọc thêm một lớp nữa để phòng hờ.

import { randomInt } from 'node:crypto'
import { getPgPool } from '@dhcb/core-db/pgPool'
import type { MemberPosition, Position, SessionState } from '@dhcb/core-contracts/location'
import { coarsen } from './geo.js'

// Bộ ký tự mã mời: bỏ 0/O/1/I/L cho dễ đọc — giống friend_code (packages/core-chat/friends.ts).
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6
const MAX_CODE_ATTEMPTS = 8
const MAX_ACTIVE_SESSIONS_PER_USER = 5

// randomInt của node:crypto — ngẫu nhiên an toàn, KHÔNG dùng Math.random (audit 2026-10-20,
// F-001). Mã mời mở cửa vào chuyến chia sẻ VỊ TRÍ thật — dữ liệu nhạy cảm — nên không được để
// đoán ra từ trạng thái xorshift128+ của V8. Cùng quy ước với referral.ts, sepay.ts.
function randomCode(): string {
  let out = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  }
  return out
}

interface SessionRow {
  id: string
  owner_id: string
  name: string
  invite_code: string
  meet_lat: number | null
  meet_lng: number | null
  meet_label: string | null
  alert_radius_m: number
  expires_at: Date | string
  ended_at: Date | string | null
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

async function logConsent(
  sessionId: string,
  userId: string,
  action: 'join' | 'leave' | 'enable' | 'disable' | 'end',
): Promise<void> {
  await getPgPool().query(
    'insert into location.consent_log (session_id, user_id, action) values ($1, $2, $3)',
    [sessionId, userId, action],
  )
}

/** Thành viên đang hoạt động trong chuyến còn hiệu lực? Trả null nếu không có quyền. */
export async function getActiveMembership(
  sessionId: string,
  userId: string,
): Promise<{ sharingEnabled: boolean; precisionMode: 'exact' | 'approx' } | null> {
  const { rows } = await getPgPool().query<{
    sharing_enabled: boolean
    precision_mode: 'exact' | 'approx'
  }>(
    `select m.sharing_enabled, m.precision_mode
     from location.session_members m
     join location.sessions s on s.id = m.session_id
     where m.session_id = $1 and m.user_id = $2 and m.left_at is null
       and s.ended_at is null and s.expires_at > now()`,
    [sessionId, userId],
  )
  const row = rows[0]
  if (!row) return null
  return { sharingEnabled: row.sharing_enabled, precisionMode: row.precision_mode }
}

export async function createSession(
  ownerId: string,
  name: string,
  durationMinutes: number,
): Promise<{ ok: true; sessionId: string } | { ok: false; reason: 'too_many_sessions' }> {
  const pool = getPgPool()
  const { rows: counted } = await pool.query<{ count: string }>(
    `select count(*)::text as count from location.sessions
     where owner_id = $1 and ended_at is null and expires_at > now()`,
    [ownerId],
  )
  if (Number(counted[0]?.count ?? '0') >= MAX_ACTIVE_SESSIONS_PER_USER) {
    return { ok: false, reason: 'too_many_sessions' }
  }

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    try {
      const { rows } = await pool.query<{ id: string }>(
        `insert into location.sessions (owner_id, name, invite_code, expires_at)
         values ($1, $2, $3, now() + ($4 || ' minutes')::interval)
         returning id`,
        [ownerId, name, randomCode(), String(durationMinutes)],
      )
      const sessionId = rows[0]!.id
      await pool.query(
        `insert into location.session_members (session_id, user_id, sharing_enabled)
         values ($1, $2, false)`,
        [sessionId, ownerId],
      )
      await logConsent(sessionId, ownerId, 'join')
      return { ok: true, sessionId }
    } catch (err) {
      // 23505 = unique_violation: trùng invite_code → thử mã khác.
      if ((err as { code?: string }).code !== '23505') throw err
    }
  }
  throw new Error('Không sinh được mã mời duy nhất')
}

export type JoinResult =
  | { ok: true; sessionId: string; alreadyMember: boolean }
  | { ok: false; reason: 'not_found' | 'expired' }

export async function joinByInviteCode(userId: string, inviteCode: string): Promise<JoinResult> {
  const pool = getPgPool()
  const { rows } = await pool.query<SessionRow>(
    'select * from location.sessions where invite_code = $1',
    [inviteCode.trim().toUpperCase()],
  )
  const session = rows[0]
  if (!session) return { ok: false, reason: 'not_found' }
  if (session.ended_at || new Date(iso(session.expires_at)).getTime() <= Date.now()) {
    return { ok: false, reason: 'expired' }
  }

  const { rows: existing } = await pool.query<{ left_at: Date | null }>(
    'select left_at from location.session_members where session_id = $1 and user_id = $2',
    [session.id, userId],
  )
  const alreadyMember = !!existing[0] && existing[0].left_at === null
  // Vào lại sau khi rời: bật lại thành viên nhưng KHÔNG tự bật chia sẻ — người dùng phải tự bấm.
  await pool.query(
    `insert into location.session_members (session_id, user_id, sharing_enabled)
     values ($1, $2, false)
     on conflict (session_id, user_id)
       do update set left_at = null, joined_at = now()`,
    [session.id, userId],
  )
  if (!alreadyMember) await logConsent(session.id, userId, 'join')
  return { ok: true, sessionId: session.id, alreadyMember }
}

/** Rời chuyến — xoá luôn vị trí cuối cùng (không để lại dấu vết). */
export async function leaveSession(sessionId: string, userId: string): Promise<void> {
  const pool = getPgPool()
  await pool.query(
    `update location.session_members set left_at = now(), sharing_enabled = false
     where session_id = $1 and user_id = $2 and left_at is null`,
    [sessionId, userId],
  )
  await deletePosition(sessionId, userId)
  await logConsent(sessionId, userId, 'leave')
}

export async function deletePosition(sessionId: string, userId: string): Promise<void> {
  await getPgPool().query('delete from location.positions where session_id = $1 and user_id = $2', [
    sessionId,
    userId,
  ])
}

/**
 * Bật/tắt chia sẻ hoặc đổi độ chính xác. TẮT là XOÁ NGAY vị trí đang lưu — đây là điểm mấu chốt
 * của lời hứa riêng tư, đừng đổi thành "ẩn đi" trong tương lai.
 */
export async function updateSharing(
  sessionId: string,
  userId: string,
  changes: { sharingEnabled?: boolean; precisionMode?: 'exact' | 'approx' },
): Promise<boolean> {
  const membership = await getActiveMembership(sessionId, userId)
  if (!membership) return false

  const pool = getPgPool()
  const sharingEnabled = changes.sharingEnabled ?? membership.sharingEnabled
  const precisionMode = changes.precisionMode ?? membership.precisionMode
  await pool.query(
    `update location.session_members set sharing_enabled = $3, precision_mode = $4
     where session_id = $1 and user_id = $2`,
    [sessionId, userId, sharingEnabled, precisionMode],
  )
  if (!sharingEnabled) await deletePosition(sessionId, userId)
  if (
    changes.sharingEnabled !== undefined &&
    changes.sharingEnabled !== membership.sharingEnabled
  ) {
    await logConsent(sessionId, userId, sharingEnabled ? 'enable' : 'disable')
  }
  return true
}

/** Ghi vị trí mới nhất. Trả null khi không có quyền HOẶC đang tắt chia sẻ (bỏ qua im lặng). */
export async function recordPosition(
  sessionId: string,
  userId: string,
  position: Position,
): Promise<MemberPosition | null> {
  const membership = await getActiveMembership(sessionId, userId)
  if (!membership || !membership.sharingEnabled) return null

  const stored =
    membership.precisionMode === 'approx' ? { ...position, ...coarsen(position) } : position
  const pool = getPgPool()
  const { rows } = await pool.query<{ updated_at: Date | string }>(
    `insert into location.positions
       (session_id, user_id, lat, lng, accuracy_m, heading_deg, speed_mps, battery_pct, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, now())
     on conflict (session_id, user_id) do update set
       lat = excluded.lat, lng = excluded.lng, accuracy_m = excluded.accuracy_m,
       heading_deg = excluded.heading_deg, speed_mps = excluded.speed_mps,
       battery_pct = excluded.battery_pct, updated_at = now()
     returning updated_at`,
    [
      sessionId,
      userId,
      stored.lat,
      stored.lng,
      position.accuracyM ?? null,
      position.headingDeg ?? null,
      position.speedMps ?? null,
      position.batteryPct ?? null,
    ],
  )

  const { rows: named } = await pool.query<{ name: string | null; owner_id: string }>(
    `select p.name, s.owner_id
     from location.sessions s
     left join public.profiles p on p.id = $2
     where s.id = $1`,
    [sessionId, userId],
  )
  return {
    userId,
    name: named[0]?.name ?? 'Bạn',
    sharingEnabled: true,
    precisionMode: membership.precisionMode,
    isOwner: named[0]?.owner_id === userId,
    position: { ...position, lat: stored.lat, lng: stored.lng },
    updatedAt: iso(rows[0]!.updated_at),
  }
}

/** Toàn cảnh 1 chuyến — chỉ trả về cho thành viên đang hoạt động. */
export async function getSessionState(
  sessionId: string,
  userId: string,
): Promise<SessionState | null> {
  const membership = await getActiveMembership(sessionId, userId)
  if (!membership) return null

  const pool = getPgPool()
  const { rows } = await pool.query<SessionRow>('select * from location.sessions where id = $1', [
    sessionId,
  ])
  const session = rows[0]
  if (!session) return null

  const { rows: memberRows } = await pool.query<{
    user_id: string
    name: string | null
    sharing_enabled: boolean
    precision_mode: 'exact' | 'approx'
    lat: number | null
    lng: number | null
    accuracy_m: number | null
    heading_deg: number | null
    speed_mps: number | null
    battery_pct: number | null
    updated_at: Date | string | null
  }>(
    `select m.user_id, p.name, m.sharing_enabled, m.precision_mode,
            pos.lat, pos.lng, pos.accuracy_m, pos.heading_deg, pos.speed_mps, pos.battery_pct,
            pos.updated_at
     from location.session_members m
     left join public.profiles p on p.id = m.user_id
     left join location.positions pos
       on pos.session_id = m.session_id and pos.user_id = m.user_id
     where m.session_id = $1 and m.left_at is null
     order by m.joined_at asc`,
    [sessionId],
  )

  const members: MemberPosition[] = memberRows.map((r) => ({
    userId: r.user_id,
    name: r.name ?? 'Bạn',
    sharingEnabled: r.sharing_enabled,
    precisionMode: r.precision_mode,
    isOwner: r.user_id === session.owner_id,
    // Lớp lọc phòng hờ: tắt chia sẻ thì KHÔNG bao giờ trả toạ độ, dù DB còn sót dòng cũ.
    position:
      r.sharing_enabled && r.lat !== null && r.lng !== null
        ? {
            lat: r.lat,
            lng: r.lng,
            accuracyM: r.accuracy_m ?? undefined,
            headingDeg: r.heading_deg ?? undefined,
            speedMps: r.speed_mps ?? undefined,
            batteryPct: r.battery_pct ?? undefined,
          }
        : null,
    updatedAt: r.sharing_enabled && r.updated_at ? iso(r.updated_at) : null,
  }))

  return {
    sessionId: session.id,
    name: session.name,
    inviteCode: session.invite_code,
    ownerId: session.owner_id,
    expiresAt: iso(session.expires_at),
    endedAt: session.ended_at ? iso(session.ended_at) : null,
    alertRadiusM: session.alert_radius_m,
    meetPoint:
      session.meet_lat !== null && session.meet_lng !== null
        ? {
            lat: session.meet_lat,
            lng: session.meet_lng,
            label: session.meet_label ?? undefined,
          }
        : null,
    members,
  }
}

/** Danh sách chuyến còn hiệu lực của tôi (để chọn ở màn hình chính). */
export async function listMySessions(
  userId: string,
): Promise<
  { sessionId: string; name: string; inviteCode: string; expiresAt: string; memberCount: number }[]
> {
  const { rows } = await getPgPool().query<{
    id: string
    name: string
    invite_code: string
    expires_at: Date | string
    member_count: string
  }>(
    `select s.id, s.name, s.invite_code, s.expires_at,
            (select count(*)::text from location.session_members m2
             where m2.session_id = s.id and m2.left_at is null) as member_count
     from location.sessions s
     join location.session_members m on m.session_id = s.id and m.user_id = $1 and m.left_at is null
     where s.ended_at is null and s.expires_at > now()
     order by s.created_at desc`,
    [userId],
  )
  return rows.map((r) => ({
    sessionId: r.id,
    name: r.name,
    inviteCode: r.invite_code,
    expiresAt: iso(r.expires_at),
    memberCount: Number(r.member_count),
  }))
}

/** Sửa chuyến (điểm hẹn / bán kính cảnh báo / gia hạn / kết thúc) — CHỈ chủ chuyến. */
export async function updateSession(
  sessionId: string,
  userId: string,
  changes: {
    meetPoint?: { lat: number; lng: number; label?: string } | null
    alertRadiusM?: number
    extendMinutes?: number
    end?: true
  },
): Promise<boolean> {
  const pool = getPgPool()
  const { rows } = await pool.query<{ owner_id: string }>(
    'select owner_id from location.sessions where id = $1 and ended_at is null',
    [sessionId],
  )
  if (rows[0]?.owner_id !== userId) return false

  if (changes.end) {
    await pool.query('update location.sessions set ended_at = now() where id = $1', [sessionId])
    // Kết thúc chuyến = xoá sạch vị trí của mọi người ngay lập tức.
    await pool.query('delete from location.positions where session_id = $1', [sessionId])
    await logConsent(sessionId, userId, 'end')
    return true
  }
  if (changes.meetPoint !== undefined) {
    await pool.query(
      'update location.sessions set meet_lat = $2, meet_lng = $3, meet_label = $4 where id = $1',
      [
        sessionId,
        changes.meetPoint?.lat ?? null,
        changes.meetPoint?.lng ?? null,
        changes.meetPoint?.label ?? null,
      ],
    )
  }
  if (changes.alertRadiusM !== undefined) {
    await pool.query('update location.sessions set alert_radius_m = $2 where id = $1', [
      sessionId,
      changes.alertRadiusM,
    ])
  }
  if (changes.extendMinutes !== undefined) {
    await pool.query(
      `update location.sessions
       set expires_at = greatest(expires_at, now()) + ($2 || ' minutes')::interval
       where id = $1`,
      [sessionId, String(changes.extendMinutes)],
    )
  }
  return true
}

/** Id các thành viên đang hoạt động — dùng để fan-out qua Redis. */
export async function getActiveMemberIds(sessionId: string): Promise<string[]> {
  const { rows } = await getPgPool().query<{ user_id: string }>(
    'select user_id from location.session_members where session_id = $1 and left_at is null',
    [sessionId],
  )
  return rows.map((r) => r.user_id)
}

/**
 * Dọn rác định kỳ: xoá vị trí của các chuyến đã hết hạn/kết thúc. Không xoá bản ghi chuyến để
 * người dùng còn xem lại nhật ký đồng thuận — chỉ toạ độ mới là dữ liệu nhạy cảm.
 */
export async function purgeExpiredPositions(): Promise<number> {
  const { rowCount } = await getPgPool().query(
    `delete from location.positions pos
     using location.sessions s
     where pos.session_id = s.id and (s.ended_at is not null or s.expires_at <= now())`,
  )
  return rowCount ?? 0
}
