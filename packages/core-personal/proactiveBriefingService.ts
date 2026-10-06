// packages/core-personal/proactiveBriefingService.ts — Bản tin chủ động (sáng/tối) của Bạn Đồng
// Hành ở Trang chủ.
//
// [2026-10-05, audit UI/UX mục M10, đợt U5 — docs/changelog/0495-*.md] Viết lại để CHỈ nói điều
// có thật. Bản cũ:
//   - luôn thêm 1 mục trụ `life` (route `/life`) + 1 mục trụ `career` (route `/career`) — cả hai
//     trụ đã xoá 2026-09-20 → "Hôm nay bạn có 2 mục tiêu trọng tâm" với mọi người;
//   - `streakDays = 3` gán cứng; `srsDueCount = 5` khi đọc DB lỗi (lỗi bị nuốt, số bị bịa);
//   - người mới 0 thẻ nhận "Tuyệt vời! Bạn đã hoàn thành toàn bộ thẻ ghi nhớ hôm nay";
//   - đọc học tập bằng `userId: personId` (id bảng personal.persons ≠ profiles.id) → luôn ra 0 thẻ;
//   - route `/on-tap` không tồn tại; buổi sáng/tối tính theo giờ MÁY CHỦ, không theo giờ Việt Nam.
// Nay: chỉ đếm việc THẬT của hai trụ còn lại — thẻ ôn đến hạn (Học tập) và việc trong Ghi chú —,
// lỗi đọc dữ liệu là LỖI (ném ra, API trả 500, giao diện hiện câu trung tính), và không khen khi
// người dùng chưa làm gì.
import { randomUUID } from 'node:crypto'
import type { Pool } from 'pg'
import type {
  ProactiveBriefing,
  ProactiveBriefingItem,
  ProactiveBriefingType,
} from '@dhcb/core-contracts/proactiveBriefing'
import { getLearningReadModel } from '@dhcb/core-learner/learningReadModelService'
import { addDays, vnDateStr } from '@dhcb/core-db/date'

export interface GenerateBriefingOptions {
  type?: ProactiveBriefingType
  now?: Date
}

/** Hai định danh KHÁC NHAU: `personId` = personal.persons.id, `userId` = profiles.id (token). */
export interface BriefingSubject {
  personId: string
  userId: string
}

/** Số liệu THẬT dựng bản tin — mọi con số hiển thị đều đến từ đây, không có giá trị mặc định. */
export interface BriefingSignals {
  /** Thẻ từ vựng SRS đã đến hạn ôn (english.learning_progress). */
  srsDueCount: number
  /** Việc trong Ghi chú chưa xong (status ≠ done). */
  openTaskCount: number
  /** Trong số việc chưa xong: đến hạn trước hết ngày hôm nay (giờ VN), kể cả đã quá hạn. */
  dueTaskCount: number
}

// Đúng các route đang có trong apps/dhcb/src/App.tsx.
const REVIEW_ROUTE = '/goc-hoc-tap/on-tap'
const NOTES_ROUTE = '/ghi-chu'
const URGENT_SRS_THRESHOLD = 10
const EVENING_START_HOUR_VN = 17
const VN_OFFSET_HOURS = 7

/** Giờ trong ngày theo giờ Việt Nam (UTC+7, không DST) — không phụ thuộc múi giờ máy chủ. */
function vnHour(now: Date): number {
  return (now.getUTCHours() + VN_OFFSET_HOURS) % 24
}

/**
 * Buổi sáng (trước 17:00 giờ VN) hay buổi tối. `explicitType` (từ query `?type=`) thắng.
 */
export function resolveBriefingType(
  explicitType?: ProactiveBriefingType,
  now: Date = new Date(),
): ProactiveBriefingType {
  if (explicitType) return explicitType
  return vnHour(now) < EVENING_START_HOUR_VN ? 'morning' : 'evening'
}

/** Mốc 00:00 giờ VN của NGÀY MAI — việc có `due_at` trước mốc này là "đến hạn hôm nay". */
export function startOfNextVnDay(now: Date): Date {
  return new Date(`${addDays(vnDateStr(now), 1)}T00:00:00+07:00`)
}

/**
 * Đọc số liệu thật. KHÔNG bắt lỗi: CSDL lỗi thì ném ra để API trả lỗi — bịa số còn tệ hơn
 * không có bản tin (giao diện đã có câu trung tính cho nhánh lỗi).
 */
export async function readBriefingSignals(
  pool: Pool,
  subject: BriefingSubject,
  now: Date,
): Promise<BriefingSignals> {
  const [learning, tasks] = await Promise.all([
    getLearningReadModel(pool, { personId: subject.personId, userId: subject.userId }),
    pool.query<{ open_count: number; due_count: number }>(
      `select count(*) filter (where status <> 'done')::int as open_count,
              count(*) filter (where status <> 'done' and due_at is not null and due_at < $2)::int
                as due_count
         from worklife.tasks
        where person_id = $1`,
      [subject.personId, startOfNextVnDay(now).toISOString()],
    ),
  ])
  const row = tasks.rows[0]
  return {
    srsDueCount: learning.srsDueCount,
    openTaskCount: row?.open_count ?? 0,
    dueTaskCount: row?.due_count ?? 0,
  }
}

function newItemId(): string {
  return `act-${randomUUID().slice(0, 8)}`
}

/** Dựng mục hành động + câu tóm tắt THUẦN từ số liệu (không I/O) — để test được mọi ca biên. */
export function composeBriefing(
  personId: string,
  signals: BriefingSignals,
  briefingType: ProactiveBriefingType,
  now: Date,
): ProactiveBriefing {
  const actionItems: ProactiveBriefingItem[] = []
  // Cụm chữ tóm tắt — mỗi cụm khớp đúng một mục hành động phía trên.
  const parts: string[] = []

  if (signals.srsDueCount > 0) {
    actionItems.push({
      id: newItemId(),
      domain: 'learning',
      title: 'Ôn thẻ từ vựng đến hạn',
      action: `${signals.srsDueCount} thẻ từ vựng đã đến hạn ôn hôm nay.`,
      route: REVIEW_ROUTE,
      priority: signals.srsDueCount > URGENT_SRS_THRESHOLD ? 'urgent' : 'high',
    })
    parts.push(`${signals.srsDueCount} thẻ từ vựng cần ôn`)
  }

  if (signals.dueTaskCount > 0) {
    actionItems.push({
      id: newItemId(),
      domain: 'work',
      title: 'Việc đến hạn trong Ghi chú',
      action: `${signals.dueTaskCount} việc đến hạn hôm nay hoặc đã quá hạn.`,
      route: NOTES_ROUTE,
      priority: 'high',
    })
    parts.push(`${signals.dueTaskCount} việc đến hạn trong Ghi chú`)
  } else if (signals.openTaskCount > 0) {
    actionItems.push({
      id: newItemId(),
      domain: 'work',
      title: 'Việc đang mở trong Ghi chú',
      action: `${signals.openTaskCount} việc chưa xong, chưa có việc nào đến hạn hôm nay.`,
      route: NOTES_ROUTE,
      priority: 'normal',
    })
    parts.push(`${signals.openTaskCount} việc đang mở trong Ghi chú`)
  }

  const isMorning = briefingType === 'morning'
  const greeting = isMorning
    ? '☀️ Chào buổi sáng! Bạn Đồng Hành đã sẵn sàng cùng bạn bắt đầu ngày mới.'
    : '🌙 Chào buổi tối! Bạn Đồng Hành gửi bạn bản tin cuối ngày.'

  // Không có việc nào đến hạn → nói đúng như vậy, KHÔNG khen ("Tuyệt vời!…") vì không có bằng
  // chứng người dùng đã làm gì (người mới 0 thẻ cũng rơi vào nhánh này).
  const list = parts.join(' và ')
  const summary =
    parts.length > 0
      ? isMorning
        ? `Hôm nay có ${list}.`
        : `Trước khi kết thúc ngày, còn ${list}.`
      : isMorning
        ? 'Hôm nay chưa có thẻ ôn hay việc nào đến hạn. Chọn một bài học để bắt đầu nhé.'
        : 'Không còn thẻ ôn hay việc nào đến hạn hôm nay. Hẹn bạn ngày mai.'

  return {
    id: `briefing-${randomUUID()}`,
    personId,
    type: briefingType,
    greeting,
    summary,
    actionItems,
    // Chưa có nguồn "nhận định" nào dựng từ dữ liệu thật — để rỗng thay vì câu chung chung.
    insights: [],
    generatedAt: now.toISOString(),
  }
}

/**
 * Đọc số liệu thật của người dùng rồi dựng bản tin. Lỗi CSDL ném ra cho API xử lý.
 */
export async function generateProactiveBriefing(
  pool: Pool,
  subject: BriefingSubject,
  options?: GenerateBriefingOptions,
): Promise<ProactiveBriefing> {
  const now = options?.now ?? new Date()
  const briefingType = resolveBriefingType(options?.type, now)
  const signals = await readBriefingSignals(pool, subject, now)
  return composeBriefing(subject.personId, signals, briefingType, now)
}
