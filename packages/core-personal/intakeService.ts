// packages/core-personal/intakeService.ts — Lớp HỒ SƠ ẨN của luồng người mới.
//
// Tên file nói đúng vai: đây là chỗ câu trả lời được CẤT, không phải chỗ chúng được đem ra khoe.
// Đặc tả (mục 2): lớp này KHÔNG có đường ra trực tiếp lên giao diện — mọi thứ hiện cho người dùng
// phải đi qua `intakeSuggestion.ts` và bộ lọc ngôn ngữ ở đó.

import type { Pool } from 'pg'
import { encryptUserField, decryptUserField } from '@dhcb/core-config/userDataCrypto'
import {
  IntakeAnswersSchema,
  type IntakeAnswers,
  type Focus,
  type LearningMomentum,
} from '@dhcb/core-contracts/intake'

interface IntakeRow {
  focus: string | null
  last_learned: string | null
  extra_hour_enc: string | null
  flow_activity_enc: string | null
  chosen_task_id: string | null
  suggested_task_id: string | null
  task_done_at: Date | null
  completed_at: Date | null
}

export interface IntakeState {
  /** Đã trả lời xong 5 câu chưa (dù bỏ qua hết vẫn tính là xong). */
  done: boolean
  answers: IntakeAnswers
  chosenTaskId: string | null
  /** Việc người dùng đã tự đánh dấu là làm xong. */
  taskDone: boolean
}

/**
 * Mã hoá một câu trả lời tự do.
 *
 * Chuỗi rỗng/không có ⇒ lưu `null` chứ không mã hoá chuỗi rỗng: ở đây "bỏ qua câu này" là thông
 * tin bình thường, không phải bí mật cần giấu, và `null` giúp phân biệt rõ với "đã trả lời".
 */
async function encOptional(userId: string, value: string | undefined): Promise<string | null> {
  const trimmed = value?.trim()
  return trimmed ? encryptUserField(userId, trimmed) : null
}

async function decOptional(userId: string, stored: string | null): Promise<string | undefined> {
  return stored ? await decryptUserField(userId, stored) : undefined
}

/** Đọc trạng thái luồng người mới. Chưa từng trả lời ⇒ `done: false`, câu trả lời rỗng. */
export async function getIntakeState(pool: Pool, userId: string): Promise<IntakeState> {
  const { rows } = await pool.query<IntakeRow>(
    `select focus, last_learned, extra_hour_enc, flow_activity_enc,
            chosen_task_id, suggested_task_id, task_done_at, completed_at
       from personal.intake where user_id = $1`,
    [userId],
  )
  const row = rows[0]
  if (!row) return { done: false, answers: {}, chosenTaskId: null, taskDone: false }

  return {
    done: row.completed_at != null,
    answers: {
      focus: (row.focus as Focus | null) ?? undefined,
      lastLearned: (row.last_learned as LearningMomentum | null) ?? undefined,
      extraHour: await decOptional(userId, row.extra_hour_enc),
      flowActivity: await decOptional(userId, row.flow_activity_enc),
    },
    chosenTaskId: row.chosen_task_id,
    taskDone: row.task_done_at != null,
  }
}

/**
 * Lưu câu trả lời và đánh dấu đã xong.
 *
 * `ageGroup` KHÔNG lưu ở bảng này — nó đi thẳng vào `public.profiles.age_group` (nguồn sự thật duy
 * nhất của dữ liệu nền tảng, xem migration 0059). Trả về câu trả lời đã chuẩn hoá để nơi gọi sinh
 * gợi ý từ đúng thứ vừa lưu.
 */
export async function saveIntake(
  pool: Pool,
  userId: string,
  raw: unknown,
  suggestedTaskId: string,
): Promise<IntakeAnswers> {
  const answers = IntakeAnswersSchema.parse(raw)
  await pool.query(
    `insert into personal.intake
       (user_id, focus, last_learned, extra_hour_enc, flow_activity_enc,
        suggested_task_id, completed_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, now(), now())
     on conflict (user_id) do update
       set focus = excluded.focus,
           last_learned = excluded.last_learned,
           extra_hour_enc = excluded.extra_hour_enc,
           flow_activity_enc = excluded.flow_activity_enc,
           suggested_task_id = excluded.suggested_task_id,
           completed_at = now(),
           updated_at = now()`,
    [
      userId,
      answers.focus ?? null,
      answers.lastLearned ?? null,
      await encOptional(userId, answers.extraHour),
      await encOptional(userId, answers.flowActivity),
      suggestedTaskId,
    ],
  )
  return answers
}

/**
 * Ghi lại việc người dùng CHỌN. So với `suggested_task_id` sẽ ra độ chính xác của suy luận.
 * Trả `false` khi CHƯA có hàng intake (chưa trả lời 5 câu) — trước đây API vẫn báo thành công và
 * số đo lệch âm thầm (audit 2026-10-10, E1.9).
 */
export async function saveChosenTask(pool: Pool, userId: string, taskId: string): Promise<boolean> {
  const res = await pool.query(
    `update personal.intake
        set chosen_task_id = $2, task_chosen_at = now(), updated_at = now()
      where user_id = $1`,
    [userId, taskId],
  )
  return (res.rowCount ?? 0) > 0
}

/**
 * Người dùng tự đánh dấu đã làm xong việc đầu tiên.
 *
 * Đây là TỰ KHAI, không phải đo được khách quan — và phải nói thẳng như vậy ở nơi hiển thị số
 * liệu. Nhưng nó vẫn là tín hiệu tốt nhất có được: cái ta cần biết là "việc này có xảy ra trong
 * đời thật không", mà đời thật thì app không nhìn thấy.
 *
 * `coalesce(task_done_at, now())` để lần đánh dấu ĐẦU TIÊN là mốc được giữ — bấm lại không dời
 * mốc, nếu không thì mọi phép đo "trong 7 ngày" đều sai. Không lọc `task_done_at is null` ở `where`
 * nữa để `rowCount` phân biệt được "đã đánh dấu từ trước" (1) với "chưa có hàng intake" (0 → trả
 * `false`).
 */
export async function markTaskDone(pool: Pool, userId: string): Promise<boolean> {
  const res = await pool.query(
    `update personal.intake
        set task_done_at = coalesce(task_done_at, now()), updated_at = now()
      where user_id = $1`,
    [userId],
  )
  return (res.rowCount ?? 0) > 0
}

// ── Đo: gợi ý có TRÚNG không ────────────────────────────────────────────────

export interface IntakeStats {
  /** Số người đã trả lời xong 5 câu trong khoảng thời gian xét. */
  answered: number
  /** Nhận đúng việc được gợi ý — tín hiệu suy luận ĐÚNG. */
  tookSuggested: number
  /** Đổi sang một trong hai lựa chọn khác — tín hiệu suy luận LỆCH nhưng vẫn còn dùng được. */
  switched: number
  /** Không chọn việc nào ("Để sau cũng được") — tín hiệu suy luận TRƯỢT hẳn. */
  skipped: number
  /** Đã tự đánh dấu làm xong việc đầu tiên. */
  done: number
  /** Làm xong TRONG 7 NGÀY kể từ lúc chọn — chỉ số quan trọng nhất của cả luồng. */
  doneWithin7Days: number
  /** Việc nào hay được chọn nhất — để biết kho việc đang lệch về đâu. */
  topTasks: { taskId: string; chosen: number; done: number }[]
}

/**
 * Tổng hợp kết quả luồng người mới trong `days` ngày gần nhất.
 *
 * Chỉ đếm, KHÔNG đọc nội dung câu trả lời của ai — hai cột tự do vốn đã mã hoá và không có việc
 * gì phải giải mã ở đây. Thống kê không phải cái cớ để mở hồ sơ cá nhân.
 */
export async function getIntakeStats(pool: Pool, days: number): Promise<IntakeStats> {
  const { rows } = await pool.query<{
    answered: string
    took_suggested: string
    switched: string
    skipped: string
    done: string
    done_within_7d: string
  }>(
    `select
       count(*)::text as answered,
       count(*) filter (where chosen_task_id is not null
                          and chosen_task_id = suggested_task_id)::text as took_suggested,
       count(*) filter (where chosen_task_id is not null
                          and chosen_task_id <> suggested_task_id)::text as switched,
       count(*) filter (where chosen_task_id is null)::text as skipped,
       count(*) filter (where task_done_at is not null)::text as done,
       count(*) filter (where task_done_at is not null
                          and task_chosen_at is not null
                          and task_done_at <= task_chosen_at + interval '7 days')::text
         as done_within_7d
     from personal.intake
     where completed_at is not null
       and completed_at >= now() - ($1 || ' days')::interval`,
    [String(days)],
  )
  const r = rows[0]

  const { rows: taskRows } = await pool.query<{ task_id: string; chosen: string; done: string }>(
    `select chosen_task_id as task_id,
            count(*)::text as chosen,
            count(*) filter (where task_done_at is not null)::text as done
       from personal.intake
      where chosen_task_id is not null
        and chosen_task_id <> ''
        and completed_at >= now() - ($1 || ' days')::interval
      group by chosen_task_id
      order by count(*) desc
      limit 10`,
    [String(days)],
  )

  return {
    answered: Number(r?.answered ?? '0'),
    tookSuggested: Number(r?.took_suggested ?? '0'),
    switched: Number(r?.switched ?? '0'),
    skipped: Number(r?.skipped ?? '0'),
    done: Number(r?.done ?? '0'),
    doneWithin7Days: Number(r?.done_within_7d ?? '0'),
    topTasks: taskRows.map((t) => ({
      taskId: t.task_id,
      chosen: Number(t.chosen),
      done: Number(t.done),
    })),
  }
}
