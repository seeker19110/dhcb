// packages/core-personal/lifeSynthesisService.ts — "Tổng hợp 30 ngày" của Bạn Đồng Hành, dựng
// THUẦN từ bản ghi thật của hai trụ còn tồn tại: Học tập và Ghi chú.
//
// Đặc tả: docs/specs/2026-10-09-tong-hop-da-mien-du-lieu-that.md (changelog 0550).
//
// Bản cũ (gỡ ở changelog 0475) dựng báo cáo từ số hoạt động GÁN CỨNG, điểm 88/92/85 giống nhau cho
// mọi người, mục tiêu mẫu và câu nhận xét soạn sẵn, lại chấm cả 3 trụ đã xoá. Bản này:
//   - chỉ ĐẾM (số ngày có học, chuỗi ngày, số bài hoàn thành, số việc) — không có điểm tổng hợp;
//   - mọi câu chữ sinh TẤT ĐỊNH theo luật có tên (`ruleId`), không gọi AI;
//   - không có dữ liệu thì nói đúng là không có, không rơi về mẫu;
//   - lỗi CSDL ném ra để API trả 500 — bịa số còn tệ hơn không có báo cáo.
import type { Pool } from 'pg'
import {
  LIFE_SYNTHESIS_SCHEMA_VERSION,
  LIFE_SYNTHESIS_WINDOW_DAYS,
  LifeSynthesisReportSchema,
  MAX_RECOMMENDATIONS,
  SynthesisSubjectIdSchema,
  type LearningSummary,
  type LifeSynthesisReport,
  type NotesSummary,
  type SubjectActivity,
  type SynthesisObservation,
  type SynthesisRecommendation,
  type SynthesisSubjectId,
} from '@dhcb/core-contracts/lifeSynthesis'
import { getSubjectManifest } from '@dhcb/core-learner/subjectRegistry'
import { addDays, vnDateStr } from '@dhcb/core-db/date'

/** Môn vắng từ chừng này ngày trở lên (tính tới hôm nay) thì nhắc quay lại. */
export const LAPSE_DAYS = 7
/** Chuỗi ngày liên tiếp từ chừng này trở lên mới đáng nêu. */
export const MIN_STREAK_TO_MENTION = 2
/** Số việc chưa có hạn từ chừng này trở lên mới gợi ý đặt hạn. */
export const UNDATED_RECOMMEND_THRESHOLD = 3
/** "Sắp đến hạn" = trong chừng này ngày tới, tính cả hôm nay. */
export const DUE_SOON_DAYS = 7

/** Môn KHÔNG ghi "hoàn thành bài" ở server → `completions: null` thay vì 0. */
const SUBJECTS_WITHOUT_COMPLETIONS: ReadonlySet<SynthesisSubjectId> = new Set(['english'])

/** Một dòng gộp từ câu SQL hoạt động: một môn × một ngày (giờ VN). */
export interface ActivityDayRow {
  subjectId: SynthesisSubjectId
  /** `YYYY-MM-DD` giờ Việt Nam. */
  day: string
  /** Số bài hoàn thành lần đầu trong ngày đó. */
  completions: number
}

export interface LifeSynthesisSignals {
  activity: ActivityDayRow[]
  notes: NotesSummary
}

// ─── Đọc dữ liệu (I/O) ──────────────────────────────────────────────────────

/** Mốc 00:00 giờ VN của một ngày `YYYY-MM-DD`. */
function vnMidnight(day: string): Date {
  return new Date(`${day}T00:00:00+07:00`)
}

/** Biên cửa sổ: [windowStart 00:00, ngày mai 00:00) giờ VN. */
export function synthesisWindow(now: Date): {
  today: string
  windowStart: string
  startAt: Date
  endAt: Date
} {
  const today = vnDateStr(now)
  const windowStart = addDays(today, -(LIFE_SYNTHESIS_WINDOW_DAYS - 1))
  return {
    today,
    windowStart,
    startAt: vnMidnight(windowStart),
    endAt: vnMidnight(addDays(today, 1)),
  }
}

// Một câu cho mọi nguồn hoạt động học. Mỗi nhánh `union all` là MỘT bảng thật, lọc theo
// `user_id = $1` (id từ token) và theo cửa sổ thời gian; Postgres gộp theo môn × ngày giờ VN.
//   - Tiếng Anh: ngày có học từ (`daily_usage.learn_count > 0`, cột `day` đã là ngày giờ VN) và
//     phiên trò chuyện/luyện nói/bài viết (`created_at`/`submitted_at` là mili-giây epoch).
//     KHÔNG dùng các cột đếm lượt AI của `daily_usage` — chúng gắn cứng môn 'english' cho mọi
//     tính năng nên không nói được người dùng học môn gì.
//   - Lập trình: lần ghi tiến độ bài gần nhất (`updated_at`) + mốc hoàn thành lần đầu
//     (`completed_at`, không bao giờ dời — xem progress.ts).
//   - Bốn môn STEM: nhật ký chỉ-thêm `completion_evidence` + mốc hoàn thành lần đầu
//     `completion_state.completed_at` (cũng không dời — evidence.ts).
// Mốc epoch do client khai được kẹp trong cửa sổ, nên mốc "tương lai" không lọt vào.
export const ACTIVITY_SQL = `with ev(subject_id, vn_day, completions) as (
  select 'english'::text, day, 0
    from public.daily_usage
   where user_id = $1 and subject = 'english' and learn_count > 0 and day >= $4 and day <= $5
  union all
  select 'english', to_char(to_timestamp(created_at / 1000.0) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'), 0
    from english.chat_sessions
   where user_id = $1 and created_at >= $6 and created_at < $7
  union all
  select 'english', to_char(to_timestamp(created_at / 1000.0) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'), 0
    from english.speaking_sessions
   where user_id = $1 and created_at >= $6 and created_at < $7
  union all
  select 'english', to_char(to_timestamp(submitted_at / 1000.0) at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'), 0
    from english.writing_submissions
   where user_id = $1 and submitted_at >= $6 and submitted_at < $7
  union all
  select 'programming', to_char(updated_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'), 0
    from programming.lesson_progress
   where user_id = $1 and updated_at >= $2 and updated_at < $3
  union all
  select 'programming', to_char(completed_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'), 1
    from programming.lesson_progress
   where user_id = $1 and completed_at >= $2 and completed_at < $3
  union all
  select subject_id, to_char(server_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'), 0
    from platform.completion_evidence
   where user_id = $1 and server_at >= $2 and server_at < $3
  union all
  select subject_id, to_char(completed_at at time zone 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD'), 1
    from platform.completion_state
   where user_id = $1 and status = 'completed' and completed_at >= $2 and completed_at < $3
)
select subject_id, vn_day, sum(completions)::int as completions
  from ev
 group by subject_id, vn_day
 order by subject_id, vn_day`

// Việc & ghi chú của trụ "Ghi chú" (bảng `worklife.*`, khoá theo person). Nối qua
// `personal.persons.user_id = $1` để chỉ cần id từ token và KHÔNG tạo hồ sơ Person khi đọc.
// $2 = 00:00 hôm nay, $3 = 00:00 của ngày thứ DUE_SOON_DAYS kể từ hôm nay, $4 = đầu cửa sổ.
export const NOTES_SQL = `select
    (select count(*)::int from worklife.tasks t where t.person_id = p.id) as total_tasks,
    (select count(*)::int from worklife.tasks t
      where t.person_id = p.id and t.status <> 'done') as open_tasks,
    (select count(*)::int from worklife.tasks t
      where t.person_id = p.id and t.status <> 'done' and t.due_at < $2) as overdue_tasks,
    (select count(*)::int from worklife.tasks t
      where t.person_id = p.id and t.status <> 'done' and t.due_at >= $2 and t.due_at < $3)
      as due_soon_tasks,
    (select count(*)::int from worklife.tasks t
      where t.person_id = p.id and t.status <> 'done' and t.due_at is null) as undated_open_tasks,
    (select count(*)::int from worklife.tasks t
      where t.person_id = p.id and t.status = 'blocked') as blocked_tasks,
    (select count(*)::int from worklife.documents d where d.person_id = p.id) as total_notes,
    (select count(*)::int from worklife.documents d
      where d.person_id = p.id and d.created_at >= $4) as notes_created
  from personal.persons p
 where p.user_id = $1`

interface ActivityRowDb {
  subject_id: string
  vn_day: string
  completions: number
}

interface NotesRowDb {
  total_tasks: number
  open_tasks: number
  overdue_tasks: number
  due_soon_tasks: number
  undated_open_tasks: number
  blocked_tasks: number
  total_notes: number
  notes_created: number
}

const EMPTY_NOTES: NotesSummary = {
  totalTasks: 0,
  openTasks: 0,
  overdueTasks: 0,
  dueSoonTasks: 0,
  undatedOpenTasks: 0,
  blockedTasks: 0,
  totalNotes: 0,
  notesCreated: 0,
}

/**
 * Đọc số liệu thật. KHÔNG bắt lỗi: CSDL lỗi thì ném ra (API trả 500, giao diện hiện khối lỗi).
 * `userId` là id tài khoản lấy từ token — không bao giờ từ client.
 */
export async function readLifeSynthesisSignals(
  pool: Pool,
  userId: string,
  now: Date,
): Promise<LifeSynthesisSignals> {
  const w = synthesisWindow(now)
  const todayStart = vnMidnight(w.today)
  const dueSoonEnd = vnMidnight(addDays(w.today, DUE_SOON_DAYS))
  const [activity, notes] = await Promise.all([
    pool.query<ActivityRowDb>(ACTIVITY_SQL, [
      userId,
      w.startAt.toISOString(),
      w.endAt.toISOString(),
      w.windowStart,
      w.today,
      w.startAt.getTime(),
      w.endAt.getTime(),
    ]),
    pool.query<NotesRowDb>(NOTES_SQL, [
      userId,
      todayStart.toISOString(),
      dueSoonEnd.toISOString(),
      w.startAt.toISOString(),
    ]),
  ])

  const rows: ActivityDayRow[] = []
  for (const r of activity.rows) {
    // Môn lạ (bảng sau này nhận thêm môn) → bỏ qua thay vì làm hỏng cả báo cáo.
    const subject = SynthesisSubjectIdSchema.safeParse(r.subject_id)
    if (!subject.success) continue
    rows.push({ subjectId: subject.data, day: r.vn_day, completions: Number(r.completions) || 0 })
  }

  // Chưa có hồ sơ Person = chưa từng dùng Ghi chú → mọi số đếm là 0 thật.
  const n = notes.rows[0]
  const notesSummary: NotesSummary = n
    ? {
        totalTasks: n.total_tasks,
        openTasks: n.open_tasks,
        overdueTasks: n.overdue_tasks,
        dueSoonTasks: n.due_soon_tasks,
        undatedOpenTasks: n.undated_open_tasks,
        blockedTasks: n.blocked_tasks,
        totalNotes: n.total_notes,
        notesCreated: n.notes_created,
      }
    : EMPTY_NOTES

  return { activity: rows, notes: notesSummary }
}

// ─── Tính toán thuần (không I/O) ────────────────────────────────────────────

/** Số ngày giữa hai ngày `YYYY-MM-DD` (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000)
}

/**
 * Chuỗi ngày liên tiếp có hoạt động, kết thúc HÔM NAY — hoặc HÔM QUA nếu hôm nay chưa học (ngày
 * chưa hết thì chuỗi chưa đứt). Không có hoạt động hôm nay lẫn hôm qua → 0. Chỉ đếm trong cửa sổ,
 * nên trần là số ngày của cửa sổ.
 */
export function computeStreak(days: ReadonlySet<string>, today: string): number {
  let cursor = days.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (days.has(cursor) && streak < LIFE_SYNTHESIS_WINDOW_DAYS) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

function maxDay(days: Iterable<string>): string | null {
  let best: string | null = null
  for (const d of days) if (best === null || d > best) best = d
  return best
}

function subjectLabel(id: SynthesisSubjectId): string {
  return getSubjectManifest(id).label
}

/** Gộp các dòng môn × ngày thành tóm tắt Học tập. Dòng ngoài cửa sổ bị bỏ (phòng thủ). */
export function summarizeLearning(
  rows: readonly ActivityDayRow[],
  today: string,
  windowStart: string,
): LearningSummary {
  const bySubject = new Map<SynthesisSubjectId, { days: Set<string>; completions: number }>()
  const allDays = new Set<string>()
  for (const r of rows) {
    if (r.day < windowStart || r.day > today) continue
    const entry = bySubject.get(r.subjectId) ?? { days: new Set<string>(), completions: 0 }
    entry.days.add(r.day)
    entry.completions += Math.max(0, r.completions)
    bySubject.set(r.subjectId, entry)
    allDays.add(r.day)
  }

  const subjects: SubjectActivity[] = []
  for (const [subjectId, { days, completions }] of bySubject) {
    const lastActiveDate = maxDay(days)
    if (lastActiveDate === null) continue
    subjects.push({
      subjectId,
      label: subjectLabel(subjectId),
      activeDays: days.size,
      lastActiveDate,
      streakDays: computeStreak(days, today),
      completions: SUBJECTS_WITHOUT_COMPLETIONS.has(subjectId) ? null : completions,
    })
  }
  // Môn học gần đây nhất lên đầu; hoà thì môn nhiều ngày học hơn; hoà nữa thì theo mã (ổn định).
  subjects.sort(
    (a, b) =>
      b.lastActiveDate.localeCompare(a.lastActiveDate) ||
      b.activeDays - a.activeDays ||
      a.subjectId.localeCompare(b.subjectId),
  )

  return {
    activeDays: allDays.size,
    streakDays: computeStreak(allDays, today),
    lastActiveDate: maxDay(allDays),
    subjects,
  }
}

/** `YYYY-MM-DD` → `dd/mm` (cách viết ngày quen thuộc ở Việt Nam). */
export function formatVnDay(day: string): string {
  const [, m, d] = day.split('-')
  return `${d}/${m}`
}

/** Câu nói về chuỗi ngày — chạm trần cửa sổ thì nói "ít nhất", vì ngoài cửa sổ không đếm. */
function streakPhrase(n: number): string {
  return n >= LIFE_SYNTHESIS_WINDOW_DAYS ? `ít nhất ${n} ngày liên tiếp` : `${n} ngày liên tiếp`
}

function endingPhrase(lastActiveDate: string | null, today: string): string {
  return lastActiveDate === today ? 'tính tới hôm nay' : 'tính tới hôm qua'
}

/** Câu nhận xét — mỗi câu đúng một luật, chỉ chứa số đếm từ dữ liệu. */
export function composeObservations(
  learning: LearningSummary,
  notes: NotesSummary,
  today: string,
): SynthesisObservation[] {
  const out: SynthesisObservation[] = []
  const days = LIFE_SYNTHESIS_WINDOW_DAYS

  // ── Học tập ──
  if (learning.subjects.length === 0) {
    out.push({
      ruleId: 'learning.none',
      domain: 'learning',
      text: `Chưa có hoạt động học nào trong ${days} ngày qua.`,
    })
  } else {
    let maxSubjectStreak = 0
    for (const s of learning.subjects) {
      maxSubjectStreak = Math.max(maxSubjectStreak, s.streakDays)
      if (s.streakDays >= MIN_STREAK_TO_MENTION) {
        out.push({
          ruleId: 'learning.subject_streak',
          domain: 'learning',
          text: `Có học ${s.label} ${streakPhrase(s.streakDays)}, ${endingPhrase(s.lastActiveDate, today)}.`,
        })
      }
    }
    // Chuỗi chung chỉ đáng nêu khi dài hơn mọi chuỗi từng môn (tức là nhờ học xen nhiều môn) —
    // không thì nó lặp lại đúng câu của môn đó.
    if (learning.streakDays >= MIN_STREAK_TO_MENTION && learning.streakDays > maxSubjectStreak) {
      out.push({
        ruleId: 'learning.streak',
        domain: 'learning',
        text: `Có học ${streakPhrase(learning.streakDays)} (xen kẽ các môn), ${endingPhrase(learning.lastActiveDate, today)}.`,
      })
    }
    for (const s of learning.subjects) {
      if (s.completions !== null && s.completions > 0) {
        out.push({
          ruleId: 'learning.completions',
          domain: 'learning',
          text: `Hoàn thành ${s.completions} bài ${s.label} trong ${days} ngày qua.`,
        })
      }
    }
    for (const s of learning.subjects) {
      const gap = daysBetween(s.lastActiveDate, today)
      if (gap >= LAPSE_DAYS) {
        out.push({
          ruleId: 'learning.lapsed',
          domain: 'learning',
          text: `Đã ${gap} ngày chưa quay lại ${s.label} (lần gần nhất ${formatVnDay(s.lastActiveDate)}).`,
        })
      }
    }
  }

  // ── Ghi chú ──
  if (notes.totalTasks === 0 && notes.totalNotes === 0) {
    out.push({
      ruleId: 'notes.none',
      domain: 'notes',
      text: 'Chưa có việc hay ghi chú nào trong Ghi chú.',
    })
    return out
  }
  if (notes.overdueTasks > 0) {
    out.push({
      ruleId: 'notes.overdue',
      domain: 'notes',
      text: `${notes.overdueTasks} việc đã quá hạn.`,
    })
  }
  if (notes.dueSoonTasks > 0) {
    out.push({
      ruleId: 'notes.due_soon',
      domain: 'notes',
      text: `${notes.dueSoonTasks} việc đến hạn trong ${DUE_SOON_DAYS} ngày tới (tính cả hôm nay).`,
    })
  }
  if (notes.undatedOpenTasks > 0) {
    out.push({
      ruleId: 'notes.undated',
      domain: 'notes',
      text: `${notes.undatedOpenTasks} việc đang mở chưa có hạn.`,
    })
  }
  if (notes.blockedTasks > 0) {
    out.push({
      ruleId: 'notes.blocked',
      domain: 'notes',
      text: `${notes.blockedTasks} việc đang bị vướng.`,
    })
  }
  if (notes.totalTasks > 0 && notes.openTasks === 0) {
    out.push({
      ruleId: 'notes.all_closed',
      domain: 'notes',
      text: 'Không còn việc nào đang mở.',
    })
  }
  if (notes.notesCreated > 0) {
    out.push({
      ruleId: 'notes.created',
      domain: 'notes',
      text: `${notes.notesCreated} ghi chú mới trong ${days} ngày qua.`,
    })
  }
  return out
}

/**
 * Khuyến nghị — xét theo thứ tự ưu tiên cố định, tối đa `MAX_RECOMMENDATIONS`, mỗi ĐÍCH chỉ một
 * khuyến nghị (hai nút "Mở Ghi chú" cạnh nhau là thừa).
 */
export function composeRecommendations(
  learning: LearningSummary,
  notes: NotesSummary,
  today: string,
): SynthesisRecommendation[] {
  const candidates: SynthesisRecommendation[] = []

  if (notes.overdueTasks > 0) {
    candidates.push({
      ruleId: 'rec.notes_overdue',
      domain: 'notes',
      text: `Xem lại ${notes.overdueTasks} việc quá hạn: làm tiếp, dời hạn hoặc đánh dấu xong.`,
      actionLabel: 'Mở Ghi chú',
      target: { kind: 'notes' },
    })
  }

  if (learning.subjects.length === 0) {
    candidates.push({
      ruleId: 'rec.learning_start',
      domain: 'learning',
      text: 'Chọn một môn và học một bài ngắn để bắt đầu.',
      actionLabel: 'Mở Góc học tập',
      target: { kind: 'learning-hub' },
    })
  } else {
    // Môn vắng gần đây nhất (dễ quay lại nhất) — `subjects` đã xếp ngày gần nhất lên đầu.
    const lapsed = learning.subjects.find((s) => daysBetween(s.lastActiveDate, today) >= LAPSE_DAYS)
    // Chuỗi đang giữ tới hôm qua mà hôm nay chưa học → nhắc học tiếp đúng môn đó.
    const continuing = learning.subjects.find(
      (s) => s.streakDays >= MIN_STREAK_TO_MENTION && s.lastActiveDate !== today,
    )
    if (continuing) {
      candidates.push({
        ruleId: 'rec.learning_continue',
        domain: 'learning',
        text: `Học tiếp ${continuing.label} hôm nay để nối dài chuỗi ${continuing.streakDays} ngày.`,
        actionLabel: `Mở ${continuing.label}`,
        target: { kind: 'subject', subjectId: continuing.subjectId },
      })
    } else if (lapsed) {
      candidates.push({
        ruleId: 'rec.learning_resume',
        domain: 'learning',
        text: `Quay lại ${lapsed.label} với một bài ngắn.`,
        actionLabel: `Mở ${lapsed.label}`,
        target: { kind: 'subject', subjectId: lapsed.subjectId },
      })
    }
  }

  if (notes.undatedOpenTasks >= UNDATED_RECOMMEND_THRESHOLD) {
    candidates.push({
      ruleId: 'rec.notes_undated',
      domain: 'notes',
      text: `Đặt hạn cho ${notes.undatedOpenTasks} việc chưa có hạn để biết việc nào cần làm trước.`,
      actionLabel: 'Mở Ghi chú',
      target: { kind: 'notes' },
    })
  }

  const seen = new Set<string>()
  const out: SynthesisRecommendation[] = []
  for (const c of candidates) {
    const key = c.target.kind === 'subject' ? `subject:${c.target.subjectId}` : c.target.kind
    if (seen.has(key)) continue
    seen.add(key)
    out.push(c)
    if (out.length >= MAX_RECOMMENDATIONS) break
  }
  return out
}

/** Dựng báo cáo THUẦN từ số liệu — kiểm qua Zod trước khi trả, lệch hợp đồng là lỗi ngay. */
export function composeLifeSynthesisReport(
  signals: LifeSynthesisSignals,
  now: Date,
): LifeSynthesisReport {
  const w = synthesisWindow(now)
  const learning = summarizeLearning(signals.activity, w.today, w.windowStart)
  return LifeSynthesisReportSchema.parse({
    schemaVersion: LIFE_SYNTHESIS_SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    windowDays: LIFE_SYNTHESIS_WINDOW_DAYS,
    windowStart: w.windowStart,
    windowEnd: w.today,
    learning,
    notes: signals.notes,
    observations: composeObservations(learning, signals.notes, w.today),
    recommendations: composeRecommendations(learning, signals.notes, w.today),
  })
}

/** Đọc số liệu thật của người dùng rồi dựng báo cáo. Lỗi CSDL ném ra cho API xử lý. */
export async function generateLifeSynthesisReport(
  pool: Pool,
  userId: string,
  now: Date = new Date(),
): Promise<LifeSynthesisReport> {
  const signals = await readLifeSynthesisSignals(pool, userId, now)
  return composeLifeSynthesisReport(signals, now)
}
