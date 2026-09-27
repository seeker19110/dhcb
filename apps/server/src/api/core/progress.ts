// api/progress.ts — Đọc/ghi tiến độ học (Giai đoạn C, thay client gọi thẳng Supabase
// `learning_progress`). Trước đây src/lib/progressSync.ts gọi Supabase client dựa vào RLS
// `auth.uid()` — không còn hoạt động sau khi cutover khỏi Supabase Auth (Giai đoạn B).
//
// GET  /api/progress                         (cần đăng nhập — cookie)
// POST /api/progress  body { learned, hard, srs, cefrGrammar, cefrDialogues,
//                             cefrExams, placement, weeklyGoal, achievements }
//
// GĐ2a (2026-09-12, đặc tả docs/specs/2026-09-12-gd2-vip-hoc-tu-do-mon-anh.md):
// `cefrUnlocked` là trường CHỈ ĐỌC — server tự tính từ gói (VIP → mở cả 6 cấp) + `cefr_exams` +
// tập grandfather, KHÔNG nhận giá trị client gửi lên nữa. Sửa localStorage hay POST thẳng mảng
// `cefrUnlocked` giả không vượt được cửa này.

import { z } from 'zod'
import type { Pool } from 'pg'
import { getPgPool } from '@dhcb/core-db/pgPool'
import {
  getCorsHeaders,
  SECURITY_HEADERS,
  checkRateLimit,
  validateAuth,
  logSecurityEvent,
} from '@dhcb/core-auth/security'
import { validateBody, readJsonBody } from '@dhcb/core-http/validation'
import { jsonResponse, getClientIp } from '@dhcb/core-http/http'
import { vnDateStr } from '@dhcb/core-db/date'
import { FREE_WEEKLY_BONUS_PER_DAY } from '@dhcb/core-billing/usage'
import { withTransaction } from '@dhcb/core-db/transaction'
import { resolvePlan } from '@dhcb/core-billing/plan'
import { computeUnlockedLevels } from '@dhcb/core-learner/cefrUnlock'
import { SyncEnvelopeSchema } from '@dhcb/core-contracts/sync'
import {
  mergeSrsMap,
  mergeByTimestamp,
  mergeArrayUnion,
  resolveHard,
} from '../_lib/progressMerge.js'
import { readVerifiedCefrExams } from '../_lib/cefrAssessment.js'
import { findReceipt, saveReceipt } from '../_lib/syncReceipt.js'

// Giới hạn kích thước hợp lý — chặn payload bất thường (DoS/lỗi client) mà vẫn đủ rộng
// cho người học nhiều năm (từ điển app hiện ~12.000 từ).
const MAX_ARR = 20_000
const ProgressSchema = z.object({
  learned: z.array(z.string()).max(MAX_ARR).default([]),
  hard: z.array(z.string()).max(MAX_ARR).default([]),
  srs: z.record(z.string(), z.unknown()).default({}),
  cefrGrammar: z.array(z.string()).max(MAX_ARR).default([]),
  cefrDialogues: z.array(z.string()).max(MAX_ARR).default([]),
  // CỐ Ý KHÔNG có `cefrUnlocked`: Zod object mặc định LOẠI BỎ khoá lạ, nên client cũ (hoặc kẻ
  // giả mạo) vẫn gửi trường này thì nó bị vứt im lặng — server tính lại từ plan + cefr_exams.
  cefrExams: z.record(z.string(), z.unknown()).default({}),
  placement: z.record(z.string(), z.unknown()).default({}),
  weeklyGoal: z.record(z.string(), z.unknown()).default({}),
  achievements: z.array(z.string()).max(MAX_ARR).default([]),
  settings: z.record(z.string(), z.unknown()).default({}),
  streakFreezeDates: z.array(z.string()).max(MAX_ARR).default([]),
  // S09-1: phong bì đồng bộ TUỲ CHỌN — client cũ không gửi thì đi đúng đường cũ, chỉ mất
  // idempotency/phát hiện xung đột chứ không đổi hành vi merge.
  sync: SyncEnvelopeSchema.optional(),
})

interface ProgressRow {
  learned: string[]
  hard: string[]
  srs: Record<string, unknown>
  cefr_grammar: string[]
  cefr_dialogues: string[]
  cefr_unlocked: string[]
  /** Quyền mở cấp ĐÃ CẤP trước GĐ2a (migration 0077) — chỉ đọc, không handler nào ghi. */
  cefr_unlocked_grandfathered: string[]
  cefr_exams: Record<string, unknown>
  placement: Record<string, unknown>
  weekly_goal: Record<string, unknown>
  achievements: string[]
  settings: Record<string, unknown>
  streak_freeze_dates: string[]
  /** S09-1: version đơn điệu do server tăng mỗi lần ghi (migration 0083, mặc định 1). */
  version: number
  /**
   * F6/F8 (2026-09-19): mốc đồng hồ CLIENT lúc gửi lần ghi TRƯỚC (migration 0083, NULL nếu dòng
   * cũ/chưa từng gửi `sync`) — dùng làm trục so sánh nhất quán cho `hard` (F6) và
   * `placement`/`weeklyGoal` (F8), xem `_lib/progressMerge.ts`. Cột Postgres là `timestamptz` —
   * driver `pg` trả về `Date`, không phải chuỗi (xem `core-db/settings.ts` làm y hệt).
   */
  client_updated_at: Date | null
}

/** Chuẩn hoá `client_updated_at` (Date từ driver `pg`, hoặc null) về ISO string để so sánh. */
function clientUpdatedAtIso(value: Date | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null
}

/** Tài liệu tiến độ camelCase — đúng hình dạng GET trả về, dùng lại cho `merged` khi xung đột. */
interface ProgressDoc {
  learned: string[]
  hard: string[]
  srs: Record<string, unknown>
  cefrGrammar: string[]
  cefrDialogues: string[]
  cefrUnlocked: string[]
  cefrExams: Record<string, unknown>
  placement: Record<string, unknown>
  weeklyGoal: Record<string, unknown>
  achievements: string[]
  settings: Record<string, unknown>
  streakFreezeDates: string[]
}

const DAILY_PLAN_VERSION = 'p1.1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Chỉ server suy ra receipt từ transition SRS trước/sau; client không truyền action/evidence. */
function countCompletedDueVocabularyCards(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  nowMs: number,
): number {
  let count = 0
  for (const [cardId, beforeValue] of Object.entries(before)) {
    if (cardId.startsWith('grammar:') || !isRecord(beforeValue)) continue
    const beforeDue = beforeValue.due
    const beforeReps = beforeValue.reps
    if (
      typeof beforeDue !== 'number' ||
      !Number.isFinite(beforeDue) ||
      beforeDue > nowMs ||
      typeof beforeReps !== 'number' ||
      !Number.isFinite(beforeReps)
    )
      continue

    const afterValue = after[cardId]
    if (!isRecord(afterValue)) continue
    const afterDue = afterValue.due
    const afterReps = afterValue.reps
    if (
      typeof afterDue === 'number' &&
      Number.isFinite(afterDue) &&
      afterDue > nowMs &&
      typeof afterReps === 'number' &&
      Number.isFinite(afterReps) &&
      afterReps > beforeReps
    )
      count += 1
  }
  return count
}

/**
 * Gói ĐANG có hiệu lực của người dùng, dùng cho luật mở cấp CEFR.
 *
 * FAIL-SAFE ĐÚNG CHIỀU (bất biến §⑤ của đặc tả): đọc lỗi → coi như `free` (KHOÁ CHẶT). Khác
 * `checkAndConsumeUsage` vốn fail-open: ở đây fail-open nghĩa là phát không gói VIP cho mọi người
 * mỗi lần CSDL trục trặc.
 */
async function readEffectivePlan(pool: Pool, userId: string): Promise<'free' | 'vip'> {
  try {
    const { rows } = await pool.query<{ plan: string | null; plan_expires_at: Date | null }>(
      'select plan, plan_expires_at from public.profiles where id = $1',
      [userId],
    )
    return resolvePlan(rows[0]?.plan, rows[0]?.plan_expires_at)
  } catch (err) {
    console.warn('[progress] đọc plan lỗi → coi như Free (khoá chặt):', err)
    return 'free'
  }
}

export default async function handler(req: Request): Promise<Response> {
  const allHeaders = { ...getCorsHeaders(req), ...SECURITY_HEADERS }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: allHeaders })

  const clientIp = getClientIp(req)
  if (!(await checkRateLimit(clientIp, 30, 'progress'))) {
    logSecurityEvent('RATE_LIMIT_EXCEEDED', clientIp, { path: '/api/progress' })
    // S09-1: nói rõ phải chờ bao lâu để hàng đợi client lùi ĐÚNG số giây thay vì đoán.
    // Lưu ý: đếm lượt chạy TRƯỚC khi tra biên nhận — không ai dùng replay để dò receipt miễn phí.
    return jsonResponse({ error: 'Quá nhiều yêu cầu — thử lại sau 1 phút' }, 429, {
      ...allHeaders,
      'Retry-After': '60',
    })
  }

  const auth = await validateAuth(req)
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401, allHeaders)

  const pool = getPgPool()

  if (req.method === 'GET') {
    const { rows } = await pool.query<ProgressRow>(
      `select learned, hard, srs, cefr_grammar, cefr_dialogues, cefr_unlocked,
              cefr_unlocked_grandfathered, cefr_exams,
              placement, weekly_goal, achievements, settings, streak_freeze_dates, version
         from english.learning_progress where user_id = $1`,
      [auth.userId],
    )
    const verifiedExams = await readVerifiedCefrExams(pool, auth.userId)
    const row: Partial<ProgressRow> = rows[0] ?? {}
    if (!rows[0] && Object.keys(verifiedExams).length === 0)
      return jsonResponse(null, 200, allHeaders)
    // TÍNH LẠI mỗi lần đọc, không trả thẳng cột đã lưu: có vậy VIP hết hạn mới bị khoá lại đúng
    // lúc (tiêu chí 6) mà không cần job dọn dữ liệu chạy trước.
    const plan = await readEffectivePlan(pool, auth.userId)
    return jsonResponse(
      {
        learned: row.learned ?? [],
        hard: row.hard ?? [],
        srs: row.srs ?? {},
        cefrGrammar: row.cefr_grammar ?? [],
        cefrDialogues: row.cefr_dialogues ?? [],
        cefrUnlocked: computeUnlockedLevels({
          plan,
          exams: verifiedExams,
          grandfathered: row.cefr_unlocked_grandfathered ?? [],
        }),
        cefrExams: verifiedExams,
        placement: row.placement ?? {},
        weeklyGoal: row.weekly_goal ?? {},
        achievements: row.achievements ?? [],
        settings: row.settings ?? {},
        streakFreezeDates: row.streak_freeze_dates ?? [],
        // Dòng có từ trước migration 0083 vẫn là 1 nhờ `default 1`; `?? 1` chỉ phòng driver/mock.
        version: row.version ?? 1,
      },
      200,
      allHeaders,
    )
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, allHeaders)
  }

  const parsedBody = await readJsonBody(req)
  if (!parsedBody.ok)
    return jsonResponse({ error: parsedBody.error.message }, parsedBody.error.status, allHeaders)
  const result = validateBody(ProgressSchema, parsedBody.raw)
  if (!result.ok)
    return jsonResponse({ error: result.error.message }, result.error.status, allHeaders)

  const d = result.data
  const sync = d.sync

  // S09-1 bước 2 — TRA BIÊN NHẬN TRƯỚC TRANSACTION. Có biên nhận nghĩa là request này đã được
  // xử lý trọn vẹn ở lần gửi trước (server commit rồi mới rớt mạng): trả lại ĐÚNG response cũ,
  // KHÔNG merge lại, KHÔNG cộng thưởng lại, KHÔNG ghi `daily_plan_completions` lại.
  if (sync) {
    const receipt = await findReceipt(pool, auth.userId, sync.attemptId)
    if (receipt) {
      if (receipt.endpoint !== 'progress') {
        // Ca hiếm, chỉ do bug client: cùng attemptId dùng cho hai endpoint khác nhau.
        return jsonResponse({ error: 'attemptId đã dùng cho endpoint khác' }, 409, allHeaders)
      }
      return jsonResponse({ ...receipt.response, replayed: true }, 200, allHeaders)
    }
  }

  // Quyết định 2026-07-26 (đổi cơ chế trượt 2026-07-27): gói Free tích lượt AI — +5 lượt
  // mỗi ngày người dùng THỰC SỰ học (không bắt buộc dùng lượt AI), tính theo cửa sổ TRƯỢT
  // 7 ngày liền kề (xem api/_lib/usage.ts, postgres/migrations/0017_free_rolling_credit.sql).
  // Ta không có sự kiện "học 1 từ" riêng, nhưng pushProgress() (src/lib/progressSync.ts)
  // được gọi ĐÚNG lúc học từ mới/ôn từ/hoàn thành hội thoại/ngữ pháp — nên phát hiện qua so
  // sánh độ dài mảng TRƯỚC/SAU: nếu bất kỳ mảng nào dài ra so với bản đang lưu → có hoạt
  // động học thật trong request này, cộng thưởng (idempotent theo ngày, xem
  // grant_daily_bonus_rolling). Không cộng khi chỉ đồng bộ lại dữ liệu cũ (pullProgress →
  // pushProgress merge) mà không có gì mới.
  // Hợp nhất với dữ liệu đang có trên server — CHẶN TUYỆT ĐỐI kịch bản mất tiến độ khi dùng
  // nhiều thiết bị/tab (một thiết bị gửi lên dữ liệu CŨ/thiếu trước khi kịp kéo dữ liệu thật
  // về, do mất mạng, 2 tab cùng mở, hoặc 2 thiết bị học song song rồi đồng bộ gần như đồng
  // thời). Quyết định 2026-08-13: TOÀN BỘ các trường "tiến độ học" giờ chỉ TĂNG, không bao giờ
  // giảm — kể cả learned/cefrGrammar/cefrDialogues/achievements (trước đây ghi đè
  // theo client). Đánh đổi đã xác nhận với người dùng: "bỏ đánh dấu" (unmarkLearned — không có
  // nút UI nào gọi, chỉ còn trong test; unmarkGrammarDone — CÓ dùng ở CefrLessonViews.tsx) sẽ
  // không còn tác dụng lâu dài, vì máy khác đồng bộ lại sẽ tự thêm lại mục vừa bỏ (xem
  // _lib/progressMerge.ts). Riêng `hard` (nhãn từ khó, chỉ là lọc hiển thị — không phải tiến
  // độ) VẪN ghi đè theo client như cũ.
  // Đọc gói TRƯỚC transaction: nó nằm ở bảng khác (public.profiles), không cần nằm trong phạm vi
  // row lock của learning_progress và giữ vùng khoá gọn nhất có thể.
  const plan = await readEffectivePlan(pool, auth.userId)

  const {
    didGrowLearning: grewLearning,
    cefrUnlocked,
    version: newVersion,
    conflict,
    merged: mergedDoc,
  } = await withTransaction(pool, async (client) => {
    // Khoá state hiện tại để hai thiết bị không cùng suy completion từ một bản trước merge.
    const { rows: existingRows } = await client.query<ProgressRow>(
      `select learned, hard, srs, cefr_grammar, cefr_dialogues, cefr_unlocked,
              cefr_unlocked_grandfathered, cefr_exams,
              placement, weekly_goal, achievements, settings, streak_freeze_dates, version,
              client_updated_at
         from english.learning_progress where user_id = $1 for update`,
      [auth.userId],
    )
    const existing = existingRows[0]
    // S09-1: `for update` ở trên là thứ giữ hai request cùng user TUẦN TỰ — đừng bỏ dòng đó,
    // nếu không hai bên cùng đọc version n rồi cùng ghi n+1 (mất dữ liệu, version trùng).
    const existingVersion = existing?.version ?? 0
    // Xung đột = có thiết bị khác ghi chen vào giữa lúc client đọc và lúc gửi. KHÔNG đổi luật
    // merge: vẫn gộp bằng đúng 4 hàm domain, chỉ báo cho client biết bản cục bộ đã cũ.
    const conflict = sync ? sync.baseVersion !== existingVersion : false
    // Điểm tự khai (kể cả marker giả) không cấp quyền. Chỉ đọc sổ bài thi do server chấm.
    const mergedExams = await readVerifiedCefrExams(client, auth.userId)
    // F6/F8: một trục đồng hồ CLIENT duy nhất cho cả request — bản đã lưu (existing, cột DB) so
    // với request hiện tại (sync?.clientUpdatedAt). Xem `_lib/progressMerge.ts`.
    const existingClientUpdatedAt = clientUpdatedAtIso(existing?.client_updated_at)
    const incomingClientUpdatedAt = sync?.clientUpdatedAt ?? null
    const merged = {
      learned: mergeArrayUnion(existing?.learned ?? [], d.learned),
      hard: resolveHard(
        existing?.hard ?? [],
        d.hard,
        existingClientUpdatedAt,
        incomingClientUpdatedAt,
      ),
      srs: mergeSrsMap(existing?.srs ?? {}, d.srs),
      cefrGrammar: mergeArrayUnion(existing?.cefr_grammar ?? [], d.cefrGrammar),
      cefrDialogues: mergeArrayUnion(existing?.cefr_dialogues ?? [], d.cefrDialogues),
      // KHÔNG merge từ client nữa (GĐ2a): server TÍNH LẠI từ gói + kết quả thi + grandfather.
      // Cột `cefr_unlocked` từ đây chỉ là bản chụp kết quả tính, không phải lời khai của client.
      cefrUnlocked: computeUnlockedLevels({
        plan,
        exams: mergedExams,
        grandfathered: existing?.cefr_unlocked_grandfathered ?? [],
      }),
      cefrExams: mergedExams,
      placement: mergeByTimestamp(existing?.placement ?? {}, d.placement, 'lastAt', {
        existing: existingClientUpdatedAt,
        incoming: incomingClientUpdatedAt,
      }),
      weeklyGoal: mergeByTimestamp(existing?.weekly_goal ?? {}, d.weeklyGoal, 'updatedAt', {
        existing: existingClientUpdatedAt,
        incoming: incomingClientUpdatedAt,
      }),
      achievements: mergeArrayUnion(existing?.achievements ?? [], d.achievements),
      // settings: "lựa chọn hiện tại" (ngôn ngữ giao diện, chiều học, âm thanh, giọng đọc) —
      // không phải tiến độ "chỉ tăng", nên hợp nhất theo mốc updatedAt MỚI HƠN thắng, giống
      // placement/weeklyGoal.
      settings: mergeByTimestamp(existing?.settings ?? {}, d.settings, 'updatedAt'),
      // streakFreezeDates: vé nghỉ streak ĐÃ DÙNG là sự kiện đã xảy ra — chỉ tăng, union như
      // learned/achievements (không bao giờ mất vé đã ghi nhận ở máy khác).
      streakFreezeDates: mergeArrayUnion(existing?.streak_freeze_dates ?? [], d.streakFreezeDates),
    }

    // KHÔNG tính `hard`: đây chỉ là nhãn lọc. Ba tín hiệu sau là hoạt động học thật.
    const didGrowLearning =
      !existing ||
      d.learned.length > (existing.learned ?? []).length ||
      d.cefrGrammar.length > (existing.cefr_grammar ?? []).length ||
      d.cefrDialogues.length > (existing.cefr_dialogues ?? []).length
    const nowMs = Date.now()
    const reviewedCardCount = existing
      ? countCompletedDueVocabularyCards(existing.srs ?? {}, merged.srs, nowMs)
      : 0

    const { rows: upsertRows } = await client.query<{ version: number }>(
      `insert into english.learning_progress
       (user_id, learned, hard, srs, cefr_grammar, cefr_dialogues, cefr_unlocked,
        cefr_exams, placement, weekly_goal, achievements, settings, streak_freeze_dates,
        updated_at, version, client_updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, now(), 1, $14)
     on conflict (user_id) do update set
       learned = excluded.learned,
       hard = excluded.hard,
       srs = excluded.srs,
       cefr_grammar = excluded.cefr_grammar,
       cefr_dialogues = excluded.cefr_dialogues,
       cefr_unlocked = excluded.cefr_unlocked,
       cefr_exams = excluded.cefr_exams,
       placement = excluded.placement,
       weekly_goal = excluded.weekly_goal,
       achievements = excluded.achievements,
       settings = excluded.settings,
       streak_freeze_dates = excluded.streak_freeze_dates,
       updated_at = now(),
       -- version ĐƠN ĐIỆU: tăng đúng 1 mỗi lần ghi, kể cả khi payload không đổi gì (server
       -- vẫn ghi updated_at). Tính trong CÂU LỆNH chứ không ở tầng ứng dụng để hai tiến trình
       -- PM2 không bao giờ ghi trùng số.
       version = english.learning_progress.version + 1,
       client_updated_at = excluded.client_updated_at
     returning version`,
      [
        auth.userId,
        JSON.stringify(merged.learned),
        JSON.stringify(merged.hard),
        JSON.stringify(merged.srs),
        JSON.stringify(merged.cefrGrammar),
        JSON.stringify(merged.cefrDialogues),
        JSON.stringify(merged.cefrUnlocked),
        JSON.stringify(merged.cefrExams),
        JSON.stringify(merged.placement),
        JSON.stringify(merged.weeklyGoal),
        JSON.stringify(merged.achievements),
        JSON.stringify(merged.settings),
        JSON.stringify(merged.streakFreezeDates),
        sync?.clientUpdatedAt ?? null,
      ],
    )
    // Dòng mới thì `version` là 1; dòng cũ thì là existingVersion + 1. `?? existingVersion + 1`
    // chỉ để chịu được mock test không trả `returning`.
    const newVersion = upsertRows[0]?.version ?? existingVersion + 1

    if (reviewedCardCount > 0) {
      await client.query(
        `insert into public.daily_plan_completions
           (user_id, action_kind, planner_version, source, evidence)
         values ($1, 'srs_review', $2, 'progress_merge', $3::jsonb)
         on conflict do nothing`,
        [auth.userId, DAILY_PLAN_VERSION, JSON.stringify({ reviewedCardCount })],
      )
    }
    // Biên nhận ghi TRONG CÙNG transaction: hoặc cả tiến độ lẫn biên nhận cùng vào, hoặc
    // không cái nào — không có cửa sổ "đã merge nhưng chưa có biên nhận" (F2 của đặc tả).
    // Cố ý KHÔNG lưu `merged` vào biên nhận để dòng receipt nhỏ; lần gửi lại chỉ cần biết
    // version/cefrUnlocked, còn bản gộp đầy đủ lấy bằng `pullProgress` như thường lệ.
    if (sync) {
      await saveReceipt(client, auth.userId, sync.attemptId, 'progress', {
        ok: true,
        cefrUnlocked: merged.cefrUnlocked,
        version: newVersion,
        conflict,
      })
    }
    // Trả kèm danh sách cấp server VỪA tính để client cập nhật ngay (vừa thi đạt là mở cấp sau,
    // không phải chờ lượt pullProgress kế tiếp).
    return {
      didGrowLearning,
      cefrUnlocked: merged.cefrUnlocked,
      version: newVersion,
      conflict,
      // Chỉ dựng `merged` khi thật sự xung đột — client cần thay bản cục bộ đã cũ bằng bản gộp.
      merged: conflict
        ? ({
            learned: merged.learned,
            hard: merged.hard,
            srs: merged.srs,
            cefrGrammar: merged.cefrGrammar,
            cefrDialogues: merged.cefrDialogues,
            cefrUnlocked: merged.cefrUnlocked,
            cefrExams: merged.cefrExams,
            placement: merged.placement,
            weeklyGoal: merged.weeklyGoal,
            achievements: merged.achievements,
            settings: merged.settings,
            streakFreezeDates: merged.streakFreezeDates,
          } satisfies ProgressDoc)
        : undefined,
    }
  })

  if (grewLearning) {
    try {
      await pool.query('select public.grant_daily_bonus_rolling($1, $2, $3, $4)', [
        auth.userId,
        vnDateStr(),
        FREE_WEEKLY_BONUS_PER_DAY,
        'english',
      ])
    } catch (err) {
      // FAIL-OPEN: receipt/progress đã commit; lỗi cộng thưởng không làm vỡ luồng học.
      console.warn('[progress] cộng thưởng lượt lỗi → bỏ qua:', err)
    }
  }
  return jsonResponse(
    {
      ok: true,
      cefrUnlocked,
      version: newVersion,
      conflict,
      replayed: false,
      ...(mergedDoc ? { merged: mergedDoc } : {}),
    },
    200,
    allHeaders,
  )
}
