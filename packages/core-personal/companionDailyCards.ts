// packages/core-personal/companionDailyCards.ts — "Thẻ hôm nay" của Bạn Đồng Hành (GĐ4a).
//
// Đặc tả: docs/specs/2026-10-12-ban-dong-hanh-gd4a-the-hom-nay.md. Thay "tác tử chủ động" giả lập
// cũ (`proactiveAgentService`: năng lượng 85% gán cứng cho mọi người, lộ trình 4 bước gõ sẵn, state
// trong `Map` bộ nhớ) — đã gỡ ở changelog 0629.
//
// Ba tầng, tách để test được hết:
//   1. ĐỌC số liệu thật (`readDailyCardSignals`) — lỗi CSDL NÉM RA, không có số mặc định.
//   2. THUẦN: chọn loại thẻ của ngày (`selectCardKinds`) và dựng chữ từ số SỐNG (`renderCard`).
//   3. LƯU: bộ thẻ một ngày cố định (`getTodayCards`), phản hồi 👍/👎 (`recordCardFeedback`).
// KHÔNG gọi AI, không trừ lượt — câu mẫu điền số thật.
import type { Pool, PoolClient } from 'pg'
import {
  DAILY_CARD_KINDS,
  MAX_DAILY_CARDS,
  DailyCardKindSchema,
  DailyCardFeedbackSchema,
  type CompanionDailyCard,
  type CompanionDailyCardsResponse,
  type DailyCardFeedback,
  type DailyCardKind,
  type DailyCardStatus,
} from '@dhcb/core-contracts/companionDailyCards'
import { getLearningReadModel } from '@dhcb/core-learner/learningReadModelService'
import { addDays, vnDateStr } from '@dhcb/core-db/date'
import { withTransaction } from '@dhcb/core-db/transaction'
import { NotFoundError } from '@dhcb/core-errors/appError'
import { readTaskCounts, type BriefingSubject } from './proactiveBriefingService.js'

// ─── Hằng số ──────────────────────────────────────────────────────────────────

// Đúng các route đang có trong apps/dhcb/src/App.tsx (+ `?studio=` đọc ở trang Bạn Đồng Hành).
const REVIEW_ROUTE = '/goc-hoc-tap/on-tap'
const NOTES_ROUTE = '/ghi-chu'
const LEARNING_ROUTE = '/goc-hoc-tap'
const REFLECTION_ROUTE = '/ban-dong-hanh?studio=cognitive'

/** 👎 tắt loại thẻ đó trong bấy nhiêu ngày. */
export const MUTE_DAYS = 7
/** Cửa sổ "gần đây" cho thẻ phản tỉnh: số ngày học tối thiểu + số ngày chưa viết nhật ký. */
const REFLECTION_WINDOW_DAYS = 7
const REFLECTION_MIN_ACTIVE_DAYS = 2
/** Thẻ cũ hơn bấy nhiêu ngày được job bảo trì dọn. */
export const DAILY_CARD_RETENTION_DAYS = 90
const GOAL_TEXT_MAX = 80
const MS_DAY = 24 * 60 * 60 * 1000

/** Nhãn mục tiêu lúc onboarding (`profiles.goal`) — khớp `apps/dhcb/src/pages/core/Onboarding.tsx`
 *  (gói không import được app). Mã lạ ⇒ coi như chưa có mục tiêu, KHÔNG in mã thô ra thẻ. */
const ONBOARDING_GOAL_LABELS: Readonly<Record<string, string>> = {
  daily: 'Giao tiếp hàng ngày',
  travel: 'Du lịch',
  work: 'Công việc',
  ielts: 'Luyện IELTS',
}

const REFLECTION_FEATURE = 'metacognitive_reflection'

// ─── 1. Số liệu thật ──────────────────────────────────────────────────────────

export interface DailyCardSignals {
  /** Thẻ ôn đến hạn (mọi môn, `english.learning_progress.srs`). */
  srsDueCount: number
  /** Việc chưa xong có hạn trước hết hôm nay (giờ VN), kể cả quá hạn. */
  dueTaskCount: number
  /** Mục tiêu học đã rút gọn để hiển thị, `null` khi chưa có. */
  goalText: string | null
  /** Số phút/ngày người dùng tự đặt lúc onboarding. */
  dailyMinutes: number
  /** Hôm nay (giờ VN) đã có hoạt động học/luyện nào chưa (`public.daily_usage`). */
  studiedToday: boolean
  /** Số ngày có hoạt động trong 7 ngày gần nhất, tính cả hôm nay. */
  activeDays7: number
  /** Ngày (giờ VN) của bài nhật ký phản tỉnh gần nhất, `null` khi chưa có. */
  lastReflectionDay: string | null
}

function truncate(text: string, max: number): string {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  return trimmed.length > max ? `${trimmed.slice(0, max - 1).trimEnd()}…` : trimmed
}

/** Mục tiêu do người dùng duyệt qua Companion (fact `learning.goal`) thắng mục tiêu onboarding. */
export function resolveGoalText(coachGoal: unknown, onboardingGoal: string | null): string | null {
  if (typeof coachGoal === 'string' && coachGoal.trim().length > 0) {
    return truncate(coachGoal, GOAL_TEXT_MAX)
  }
  if (onboardingGoal && Object.hasOwn(ONBOARDING_GOAL_LABELS, onboardingGoal)) {
    return ONBOARDING_GOAL_LABELS[onboardingGoal] ?? null
  }
  return null
}

/** Ngày giờ VN mới nhất trong danh sách nhật ký phản tỉnh lưu ở `platform.feature_state`. */
export function latestReflectionDay(state: unknown): string | null {
  if (!Array.isArray(state)) return null
  let latestMs: number | null = null
  for (const entry of state) {
    const createdAt = (entry as { createdAt?: unknown } | null)?.createdAt
    if (typeof createdAt !== 'string') continue
    const ms = Date.parse(createdAt)
    if (Number.isNaN(ms)) continue
    if (latestMs === null || ms > latestMs) latestMs = ms
  }
  return latestMs === null ? null : vnDateStr(new Date(latestMs))
}

/**
 * Đọc mọi số liệu dựng thẻ. KHÔNG bắt lỗi: CSDL lỗi thì ném ra để API trả lỗi — bịa số còn tệ
 * hơn không có thẻ (giao diện có trạng thái lỗi + Thử lại).
 */
export async function readDailyCardSignals(
  pool: Pool,
  subject: BriefingSubject,
  now: Date,
): Promise<DailyCardSignals> {
  const today = vnDateStr(now)
  const windowStart = addDays(today, -(REFLECTION_WINDOW_DAYS - 1))
  const [learning, tasks, coachGoal, usage, reflections] = await Promise.all([
    getLearningReadModel(pool, { personId: subject.personId, userId: subject.userId }),
    readTaskCounts(pool, subject.personId, now),
    pool.query<{ value: unknown }>(
      `select value from personal.personal_facts
        where person_id = $1 and namespace = 'learning' and key = 'goal' and is_current
        order by created_at desc
        limit 1`,
      [subject.personId],
    ),
    pool.query<{ day: string }>(
      `select day
         from public.daily_usage
        where user_id = $1 and day >= $2 and day <= $3
        group by day
       having sum(coalesce(chat_count, 0) + coalesce(writing_count, 0) + coalesce(speaking_count, 0)
                + coalesce(stt_count, 0) + coalesce(learn_count, 0)) > 0`,
      [subject.userId, windowStart, today],
    ),
    pool.query<{ state: unknown }>(
      `select state from platform.feature_state where user_id = $1 and feature = $2`,
      [subject.userId, REFLECTION_FEATURE],
    ),
  ])
  const activeDays = new Set(usage.rows.map((r) => r.day))
  return {
    srsDueCount: learning.srsDueCount,
    dueTaskCount: tasks.dueTaskCount,
    goalText: resolveGoalText(coachGoal.rows[0]?.value, learning.activeGoal),
    dailyMinutes: learning.dailyMinutes,
    studiedToday: activeDays.has(today),
    activeDays7: activeDays.size,
    lastReflectionDay: latestReflectionDay(reflections.rows[0]?.state),
  }
}

// ─── 2. Thuần: chọn thẻ + dựng chữ ────────────────────────────────────────────

export interface CardPreference {
  upCount: number
  downCount: number
  mutedUntil: Date | null
}

function isEligible(kind: DailyCardKind, s: DailyCardSignals, today: string): boolean {
  switch (kind) {
    case 'review_due':
      return s.srsDueCount > 0
    case 'due_tasks':
      return s.dueTaskCount > 0
    case 'learning_goal':
      return s.goalText !== null && !s.studiedToday
    case 'reflection': {
      const reflectedRecently =
        s.lastReflectionDay !== null &&
        s.lastReflectionDay >= addDays(today, -(REFLECTION_WINDOW_DAYS - 1))
      return s.activeDays7 >= REFLECTION_MIN_ACTIVE_DAYS && !reflectedRecently
    }
  }
}

/**
 * Chọn tối đa 3 loại thẻ cho ngày: đủ điều kiện, không bị 👎 tắt, xếp theo điểm ròng (👍 − 👎)
 * giảm dần rồi thứ tự gốc của `DAILY_CARD_KINDS`.
 */
export function selectCardKinds(
  signals: DailyCardSignals,
  preferences: ReadonlyMap<DailyCardKind, CardPreference>,
  now: Date,
): DailyCardKind[] {
  const today = vnDateStr(now)
  const net = (kind: DailyCardKind): number => {
    const p = preferences.get(kind)
    return p ? p.upCount - p.downCount : 0
  }
  return DAILY_CARD_KINDS.filter((kind) => {
    const mutedUntil = preferences.get(kind)?.mutedUntil
    return isEligible(kind, signals, today) && !(mutedUntil && mutedUntil > now)
  })
    .map((kind, baseOrder) => ({ kind, baseOrder, score: net(kind) }))
    .sort((a, b) => b.score - a.score || a.baseOrder - b.baseOrder)
    .slice(0, MAX_DAILY_CARDS)
    .map((c) => c.kind)
}

/** Số liệu lúc dựng thẻ — lưu ở `snapshot` để đo "thẻ được làm xong", và để thẻ mục tiêu vẫn có
 *  chữ khi mục tiêu bị xoá giữa ngày. */
export interface DailyCardSnapshot {
  srsDueCount: number
  dueTaskCount: number
  goalText: string | null
  activeDays7: number
}

export function snapshotOf(s: DailyCardSignals): DailyCardSnapshot {
  return {
    srsDueCount: s.srsDueCount,
    dueTaskCount: s.dueTaskCount,
    goalText: s.goalText,
    activeDays7: s.activeDays7,
  }
}

export type RenderedCard = Omit<CompanionDailyCard, 'id' | 'kind' | 'feedback'>

/** Dựng chữ thẻ từ số liệu SỐNG (lần mở hiện tại); `snapshot` chỉ dự phòng cho mục tiêu. */
export function renderCard(
  kind: DailyCardKind,
  live: DailyCardSignals,
  snapshot: Partial<DailyCardSnapshot>,
  now: Date,
): RenderedCard {
  const today = vnDateStr(now)
  const card = (
    status: DailyCardStatus,
    title: string,
    body: string,
    route: string,
    actionLabel: string,
  ): RenderedCard => ({ status, title, body, route, actionLabel })

  switch (kind) {
    case 'review_due':
      return live.srsDueCount > 0
        ? card(
            'open',
            'Ôn thẻ đến hạn',
            `Có ${live.srsDueCount} thẻ đã đến hạn ôn hôm nay.`,
            REVIEW_ROUTE,
            'Ôn ngay',
          )
        : card(
            'done',
            'Ôn thẻ đến hạn',
            'Đã ôn hết thẻ đến hạn hôm nay.',
            REVIEW_ROUTE,
            'Xem thẻ ôn',
          )
    case 'due_tasks':
      return live.dueTaskCount > 0
        ? card(
            'open',
            'Việc đến hạn trong Ghi chú',
            `${live.dueTaskCount} việc đến hạn hôm nay hoặc đã quá hạn.`,
            NOTES_ROUTE,
            'Mở Ghi chú',
          )
        : card(
            'done',
            'Việc đến hạn trong Ghi chú',
            'Không còn việc nào đến hạn hôm nay.',
            NOTES_ROUTE,
            'Mở Ghi chú',
          )
    case 'learning_goal': {
      const goal = live.goalText ?? snapshot.goalText ?? 'Học đều mỗi ngày'
      return live.studiedToday
        ? card(
            'done',
            'Mục tiêu học của bạn',
            `«${goal}» — hôm nay bạn đã học rồi.`,
            LEARNING_ROUTE,
            'Học thêm',
          )
        : card(
            'open',
            'Mục tiêu học của bạn',
            `«${goal}» — hôm nay dành khoảng ${live.dailyMinutes} phút nhé.`,
            LEARNING_ROUTE,
            'Chọn bài học',
          )
    }
    case 'reflection':
      return live.lastReflectionDay === today
        ? card(
            'done',
            'Nhìn lại tuần học',
            'Bạn đã viết nhật ký phản tỉnh hôm nay.',
            REFLECTION_ROUTE,
            'Xem nhật ký',
          )
        : card(
            'open',
            'Nhìn lại tuần học',
            `7 ngày qua bạn học ${live.activeDays7} ngày. Viết vài dòng: cách học nào hiệu quả, chỗ nào còn vướng?`,
            REFLECTION_ROUTE,
            'Viết nhật ký',
          )
  }
}

// ─── 3. Lưu: bộ thẻ của ngày + phản hồi ──────────────────────────────────────

interface CardRow {
  id: string
  kind: string
  snapshot: unknown
  feedback: string | null
}

async function listDayRows(pool: Pool, personId: string, day: string): Promise<CardRow[]> {
  const res = await pool.query<CardRow>(
    `select id, kind, snapshot, feedback
       from personal.companion_daily_cards
      where person_id = $1 and vn_day = $2::date
      order by position`,
    [personId, day],
  )
  return res.rows
}

export async function readCardPreferences(
  pool: Pick<Pool, 'query'>,
  personId: string,
): Promise<Map<DailyCardKind, CardPreference>> {
  const res = await pool.query<{
    kind: string
    up_count: number
    down_count: number
    muted_until: Date | null
  }>(
    `select kind, up_count, down_count, muted_until
       from personal.companion_card_preferences
      where person_id = $1`,
    [personId],
  )
  const map = new Map<DailyCardKind, CardPreference>()
  for (const row of res.rows) {
    const kind = DailyCardKindSchema.safeParse(row.kind)
    if (!kind.success) continue
    map.set(kind.data, {
      upCount: row.up_count,
      downCount: row.down_count,
      mutedUntil: row.muted_until,
    })
  }
  return map
}

function toCard(row: CardRow, live: DailyCardSignals, now: Date): CompanionDailyCard | null {
  const kind = DailyCardKindSchema.safeParse(row.kind)
  if (!kind.success) return null
  const feedback = DailyCardFeedbackSchema.safeParse(row.feedback)
  const snapshot =
    row.snapshot && typeof row.snapshot === 'object'
      ? (row.snapshot as Partial<DailyCardSnapshot>)
      : {}
  return {
    id: row.id,
    kind: kind.data,
    feedback: feedback.success ? feedback.data : null,
    ...renderCard(kind.data, live, snapshot, now),
  }
}

/**
 * Thẻ hôm nay của một người. Lần mở đầu tiên trong ngày (giờ VN) chọn và ghi bộ thẻ; các lần sau
 * chỉ đọc lại bộ đó và dựng chữ từ số liệu mới nhất. Ngày chưa có thẻ nào thì lần sau thử lại.
 *
 * Hai request đầu ngày đua nhau: câu INSERT `on conflict do nothing` trên hai ràng buộc duy nhất
 * (theo `kind`, theo `position` 1..3) ⇒ tối đa 3 thẻ, không trùng loại (migration 0097).
 */
export async function getTodayCards(
  pool: Pool,
  subject: BriefingSubject,
  now: Date = new Date(),
): Promise<CompanionDailyCardsResponse> {
  const day = vnDateStr(now)
  const signals = await readDailyCardSignals(pool, subject, now)
  let rows = await listDayRows(pool, subject.personId, day)

  if (rows.length === 0) {
    const kinds = selectCardKinds(signals, await readCardPreferences(pool, subject.personId), now)
    if (kinds.length > 0) {
      await pool.query(
        `insert into personal.companion_daily_cards (person_id, vn_day, kind, position, snapshot)
         select $1, $2::date, t.kind, t.position::smallint, $5::jsonb
           from unnest($3::text[], $4::int[]) as t(kind, position)
         on conflict do nothing`,
        [
          subject.personId,
          day,
          kinds,
          kinds.map((_, i) => i + 1),
          JSON.stringify(snapshotOf(signals)),
        ],
      )
      rows = await listDayRows(pool, subject.personId, day)
    }
  }

  const cards = rows
    .map((row) => toCard(row, signals, now))
    .filter((c): c is CompanionDailyCard => c !== null)
  return { day, cards }
}

/**
 * Ghi 👍/👎 cho một thẻ CỦA CHÍNH người này (thẻ người khác ⇒ 404, không lộ là có tồn tại). Đổi ý
 * được; bấm lại cùng nút là lũy đẳng. Sở thích gộp theo loại thẻ: 👎 tắt loại đó `MUTE_DAYS` ngày,
 * 👍 bỏ tắt. Cùng một transaction, khoá dòng thẻ để hai lần bấm đua không đếm sai.
 */
export async function recordCardFeedback(
  pool: Pool,
  personId: string,
  cardId: string,
  feedback: DailyCardFeedback,
  now: Date = new Date(),
): Promise<{ cardId: string; feedback: DailyCardFeedback }> {
  return withTransaction(pool, async (client: PoolClient) => {
    const current = await client.query<{ kind: string; feedback: string | null }>(
      `select kind, feedback from personal.companion_daily_cards
        where id = $1 and person_id = $2
        for update`,
      [cardId, personId],
    )
    const row = current.rows[0]
    if (!row) throw new NotFoundError('Không tìm thấy thẻ')
    if (row.feedback === feedback) return { cardId, feedback }

    const upDelta = (feedback === 'up' ? 1 : 0) - (row.feedback === 'up' ? 1 : 0)
    const downDelta = (feedback === 'down' ? 1 : 0) - (row.feedback === 'down' ? 1 : 0)
    const mutedUntil =
      feedback === 'down' ? new Date(now.getTime() + MUTE_DAYS * MS_DAY).toISOString() : null

    await client.query(
      `insert into personal.companion_card_preferences
              (person_id, kind, up_count, down_count, muted_until, updated_at)
       values ($1, $2, greatest($3::int, 0), greatest($4::int, 0), $5::timestamptz, now())
       on conflict (person_id, kind) do update
          set up_count = greatest(companion_card_preferences.up_count + $3::int, 0),
              down_count = greatest(companion_card_preferences.down_count + $4::int, 0),
              muted_until = excluded.muted_until,
              updated_at = now()`,
      [personId, row.kind, upDelta, downDelta, mutedUntil],
    )
    await client.query(
      `update personal.companion_daily_cards
          set feedback = $1, feedback_at = $2::timestamptz
        where id = $3`,
      [feedback, now.toISOString(), cardId],
    )
    return { cardId, feedback }
  })
}

/** Dọn thẻ cũ hơn `retentionDays` ngày (job bảo trì Companion hằng ngày). Trả số dòng đã xoá. */
export async function purgeOldDailyCards(
  pool: Pick<Pool, 'query'>,
  now: Date = new Date(),
  retentionDays: number = DAILY_CARD_RETENTION_DAYS,
): Promise<number> {
  const cutoff = addDays(vnDateStr(now), -retentionDays)
  const res = await pool.query(
    'delete from personal.companion_daily_cards where vn_day < $1::date',
    [cutoff],
  )
  return res.rowCount ?? 0
}
